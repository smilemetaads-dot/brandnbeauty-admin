<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/finance_reconciliation_common.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['https://brandnbeauty.com', 'https://www.brandnbeauty.com', 'https://admin.brandnbeauty.com'];
$localOrigin = preg_match('/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/', $origin) === 1;
if ($localOrigin || in_array($origin, $allowedOrigins, true)) { header('Access-Control-Allow-Origin: ' . $origin); header('Vary: Origin'); }
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }
requireAdminAuth();

function financeReconciliationJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = getDatabaseConnection();
    ensureFinanceReconciliationSchema($pdo);
    $period = $_GET['period'] ?? '30D';
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') financeReconciliationJson(200, array_merge(['success' => true, 'module' => 'finance-reconciliation'], financeReconciliationState($pdo, $period)));
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') financeReconciliationJson(405, ['success' => false, 'message' => 'Method not allowed.']);
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($payload) || strtolower(financeReconciliationText($payload['action'] ?? '', 50)) !== 'save_reconciliation') financeReconciliationJson(422, ['success' => false, 'message' => 'A valid reconciliation action is required.']);
    if (($payload['confirmed'] ?? false) !== true) financeReconciliationJson(422, ['success' => false, 'message' => 'Human confirmation is required before settlement evidence is saved.']);
    $orderId = max(0, (int) ($payload['order_id'] ?? 0));
    $collected = round(max(0, (float) ($payload['collected_amount'] ?? 0)), 2);
    $settled = round(max(0, (float) ($payload['settled_amount'] ?? 0)), 2);
    $reference = financeReconciliationText($payload['settlement_reference'] ?? '', 191);
    $note = financeReconciliationText($payload['note'] ?? '', 1000);
    if ($orderId === 0 || $note === '') financeReconciliationJson(422, ['success' => false, 'message' => 'Select an order and write a reconciliation note.']);
    if (($collected > 0 || $settled > 0) && $reference === '') financeReconciliationJson(422, ['success' => false, 'message' => 'A statement or transaction reference is required for received money.']);
    if ($collected > 1000000000 || $settled > 1000000000) financeReconciliationJson(422, ['success' => false, 'message' => 'The amount is outside the allowed range.']);
    $state = financeReconciliationState($pdo, $payload['period'] ?? '30D');
    $record = null;
    foreach ($state['records'] as $candidate) if ((int) $candidate['order_id'] === $orderId) { $record = $candidate; break; }
    if ($record === null) financeReconciliationJson(404, ['success' => false, 'message' => 'The selected order is outside the current reconciliation evidence.']);
    $expected = (float) $record['expected_amount'];
    $status = $record['status'] === 'returned' ? 'returned' : ($settled > 0 ? (abs($settled - $expected) <= 0.01 ? 'settled' : 'mismatch') : ($collected > 0 ? 'collected' : 'pending'));
    $pdo->beginTransaction();
    $find = $pdo->prepare('SELECT * FROM cod_reconciliation WHERE order_id=:order_id LIMIT 1 FOR UPDATE');
    $find->execute([':order_id' => $orderId]);
    $before = $find->fetch(PDO::FETCH_ASSOC) ?: null;
    if ($before) {
        $save = $pdo->prepare('UPDATE cod_reconciliation SET courier_shipment_id=:shipment_id,expected_amount=:expected,collected_amount=:collected,settled_amount=:settled,status=:status,settlement_reference=:reference,note=:note,settled_at=:settled_at WHERE order_id=:order_id');
    } else {
        $save = $pdo->prepare('INSERT INTO cod_reconciliation (order_id,courier_shipment_id,expected_amount,collected_amount,settled_amount,status,settlement_reference,note,settled_at) VALUES (:order_id,:shipment_id,:expected,:collected,:settled,:status,:reference,:note,:settled_at)');
    }
    $save->execute([':order_id' => $orderId, ':shipment_id' => $record['courier_shipment_id'] ?: null, ':expected' => $expected, ':collected' => $collected, ':settled' => $settled, ':status' => $status, ':reference' => $reference ?: null, ':note' => $note, ':settled_at' => $settled > 0 ? date('Y-m-d H:i:s') : null]);
    $read = $pdo->prepare('SELECT * FROM cod_reconciliation WHERE order_id=:order_id LIMIT 1');
    $read->execute([':order_id' => $orderId]);
    $after = $read->fetch(PDO::FETCH_ASSOC) ?: [];
    $event = $pdo->prepare("INSERT INTO finance_reconciliation_events (reconciliation_id,order_id,action_name,before_payload,after_payload,reason,actor) VALUES (:reconciliation_id,:order_id,:action_name,:before_payload,:after_payload,:reason,'Admin')");
    $event->execute([':reconciliation_id' => (int) ($after['id'] ?? 0), ':order_id' => $orderId, ':action_name' => $before ? 'update_evidence' : 'record_evidence', ':before_payload' => $before ? json_encode($before, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : null, ':after_payload' => json_encode($after, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), ':reason' => $note]);
    $pdo->commit();
    financeReconciliationJson(200, array_merge(['success' => true, 'module' => 'finance-reconciliation', 'message' => 'Reconciliation evidence saved with an immutable audit event.'], financeReconciliationState($pdo, $payload['period'] ?? '30D')));
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('manage_finance_reconciliation.php: ' . $error->getMessage());
    financeReconciliationJson(500, ['success' => false, 'module' => 'finance-reconciliation', 'message' => 'Finance reconciliation is temporarily unavailable.']);
}

