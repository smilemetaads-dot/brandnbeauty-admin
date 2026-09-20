<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/profitability_common.php';

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

function profitabilityJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = getDatabaseConnection();
    ensureProfitabilitySchema($pdo);
    $period = $_GET['period'] ?? '30D';
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') profitabilityJson(200, array_merge(['success' => true, 'module' => 'profitability-control'], profitabilityState($pdo, $period)));
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') profitabilityJson(405, ['success' => false, 'message' => 'Method not allowed.']);

    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($payload) || strtolower(profitabilityText($payload['action'] ?? '', 50)) !== 'save_cost_evidence') profitabilityJson(422, ['success' => false, 'message' => 'A valid profitability action is required.']);
    if (($payload['confirmed'] ?? false) !== true) profitabilityJson(422, ['success' => false, 'message' => 'Human confirmation is required before cost evidence is saved.']);
    $orderId = max(0, (int) ($payload['order_id'] ?? 0));
    $reference = profitabilityText($payload['source_reference'] ?? '', 191);
    $reason = profitabilityText($payload['reason'] ?? '', 1000);
    if ($orderId === 0 || $reference === '' || $reason === '') profitabilityJson(422, ['success' => false, 'message' => 'Select an order and provide a source reference and confirmation reason.']);

    $costFields = ['product_cost', 'packaging_cost', 'courier_cost', 'payment_fee', 'return_cost', 'other_cost'];
    $values = [];
    foreach ($costFields as $field) {
        $value = round((float) ($payload[$field] ?? 0), 2);
        if ($value < 0 || $value > 1000000000) profitabilityJson(422, ['success' => false, 'message' => 'Every cost must be a valid non-negative amount.']);
        $values[$field] = $value;
    }
    $state = profitabilityState($pdo, $payload['period'] ?? '30D');
    $selected = null;
    foreach ($state['orders'] as $order) if ((int) $order['id'] === $orderId) { $selected = $order; break; }
    if ($selected === null) profitabilityJson(404, ['success' => false, 'message' => 'The selected delivered order is outside the current profitability period.']);

    $pdo->beginTransaction();
    $find = $pdo->prepare('SELECT * FROM order_financials WHERE order_id=:order_id LIMIT 1 FOR UPDATE');
    $find->execute([':order_id' => $orderId]);
    $before = $find->fetch(PDO::FETCH_ASSOC) ?: null;
    $parameters = [
        ':order_id' => $orderId,
        ':product_cost' => $values['product_cost'],
        ':packaging_cost' => $values['packaging_cost'],
        ':courier_cost' => $values['courier_cost'],
        ':payment_fee' => $values['payment_fee'],
        ':return_cost' => $values['return_cost'],
        ':other_cost' => $values['other_cost'],
        ':source_reference' => $reference,
        ':note' => $reason,
    ];
    if ($before) {
        $save = $pdo->prepare("UPDATE order_financials SET product_cost=:product_cost,packaging_cost=:packaging_cost,courier_cost=:courier_cost,payment_fee=:payment_fee,return_cost=:return_cost,other_cost=:other_cost,cost_source='manual',evidence_status='confirmed',source_reference=:source_reference,note=:note,confirmed_by='Admin',confirmed_at=NOW() WHERE order_id=:order_id");
    } else {
        $save = $pdo->prepare("INSERT INTO order_financials (order_id,product_cost,packaging_cost,courier_cost,payment_fee,return_cost,other_cost,cost_source,evidence_status,source_reference,note,confirmed_by,confirmed_at) VALUES (:order_id,:product_cost,:packaging_cost,:courier_cost,:payment_fee,:return_cost,:other_cost,'manual','confirmed',:source_reference,:note,'Admin',NOW())");
    }
    $save->execute($parameters);
    $read = $pdo->prepare('SELECT * FROM order_financials WHERE order_id=:order_id LIMIT 1');
    $read->execute([':order_id' => $orderId]);
    $after = $read->fetch(PDO::FETCH_ASSOC) ?: [];
    $event = $pdo->prepare("INSERT INTO order_financial_events (order_financial_id,order_id,action_name,before_payload,after_payload,reason,actor) VALUES (:financial_id,:order_id,:action_name,:before_payload,:after_payload,:reason,'Admin')");
    $event->execute([
        ':financial_id' => (int) ($after['id'] ?? 0),
        ':order_id' => $orderId,
        ':action_name' => $before ? 'update_cost_evidence' : 'record_cost_evidence',
        ':before_payload' => $before ? json_encode($before, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : null,
        ':after_payload' => json_encode($after, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        ':reason' => $reason,
    ]);
    $pdo->commit();
    profitabilityJson(200, array_merge(['success' => true, 'module' => 'profitability-control', 'message' => 'Cost evidence saved with an immutable audit event.'], profitabilityState($pdo, $payload['period'] ?? '30D')));
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('manage_profitability.php: ' . $error->getMessage());
    profitabilityJson(500, ['success' => false, 'module' => 'profitability-control', 'message' => 'Profitability Control is temporarily unavailable.']);
}

