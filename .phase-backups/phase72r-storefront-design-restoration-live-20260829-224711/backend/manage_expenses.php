<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/expense_management_common.php';

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

function expenseManagementJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = getDatabaseConnection();
    ensureExpenseManagementSchema($pdo);
    $period = $_GET['period'] ?? '30D';
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') expenseManagementJson(200, array_merge(['success' => true, 'module' => 'expenses-cost-management'], expenseManagementState($pdo, $period)));
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') expenseManagementJson(405, ['success' => false, 'message' => 'Method not allowed.']);
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($payload)) expenseManagementJson(422, ['success' => false, 'message' => 'A valid expense action is required.']);
    $action = strtolower(expenseManagementText($payload['action'] ?? '', 60));
    if (($payload['confirmed'] ?? false) !== true) expenseManagementJson(422, ['success' => false, 'message' => 'Human confirmation is required before an expense record changes.']);

    if ($action === 'create_draft') {
        $date = expenseManagementText($payload['expense_date'] ?? '', 10);
        $category = strtolower(expenseManagementText($payload['category'] ?? '', 80));
        $description = expenseManagementText($payload['description'] ?? '', 255);
        $amount = round(max(0, (float) ($payload['amount'] ?? 0)), 2);
        $vendor = expenseManagementText($payload['vendor'] ?? '', 191);
        $costCenter = expenseManagementText($payload['cost_center'] ?? '', 100);
        $paymentMethod = expenseManagementText($payload['payment_method'] ?? '', 50);
        $reference = expenseManagementText($payload['reference'] ?? '', 191);
        $note = expenseManagementText($payload['note'] ?? '', 1000);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || strtotime($date) === false) expenseManagementJson(422, ['success' => false, 'message' => 'Choose a valid expense date.']);
        if (!in_array($category, expenseManagementCategories(), true)) expenseManagementJson(422, ['success' => false, 'message' => 'Choose a supported expense category.']);
        if ($description === '' || $note === '' || $amount <= 0 || $amount > 1000000000) expenseManagementJson(422, ['success' => false, 'message' => 'Description, valid amount and business note are required.']);
        $pdo->beginTransaction();
        $insert = $pdo->prepare("INSERT INTO operating_expenses (expense_date,category,description,amount,payment_method,reference,note,vendor,cost_center,status,payment_status) VALUES (:expense_date,:category,:description,:amount,:payment_method,:reference,:note,:vendor,:cost_center,'draft','unpaid')");
        $insert->execute([':expense_date' => $date, ':category' => $category, ':description' => $description, ':amount' => $amount, ':payment_method' => $paymentMethod ?: null, ':reference' => $reference ?: null, ':note' => $note, ':vendor' => $vendor ?: null, ':cost_center' => $costCenter ?: null]);
        $expenseId = (int) $pdo->lastInsertId();
        $read = $pdo->prepare('SELECT * FROM operating_expenses WHERE id=:id LIMIT 1');
        $read->execute([':id' => $expenseId]);
        $after = $read->fetch(PDO::FETCH_ASSOC) ?: [];
        expenseManagementEvent($pdo, $expenseId, 'create_draft', null, $after, $note);
        $pdo->commit();
        expenseManagementJson(200, array_merge(['success' => true, 'module' => 'expenses-cost-management', 'message' => 'Expense draft saved. No payment or bank balance was changed.'], expenseManagementState($pdo, $payload['period'] ?? '30D')));
    }

    $allowedActions = ['submit_for_approval', 'approve_expense', 'record_paid_evidence', 'reject_expense'];
    if (!in_array($action, $allowedActions, true)) expenseManagementJson(422, ['success' => false, 'message' => 'The expense action is not supported.']);
    $expenseId = max(0, (int) ($payload['expense_id'] ?? 0));
    $reason = expenseManagementText($payload['reason'] ?? '', 1000);
    $paymentReference = expenseManagementText($payload['payment_reference'] ?? '', 191);
    if ($expenseId === 0 || $reason === '') expenseManagementJson(422, ['success' => false, 'message' => 'Select an expense and write a reason.']);
    if ($action === 'record_paid_evidence' && $paymentReference === '') expenseManagementJson(422, ['success' => false, 'message' => 'A real payment reference is required.']);
    $pdo->beginTransaction();
    $find = $pdo->prepare('SELECT * FROM operating_expenses WHERE id=:id LIMIT 1 FOR UPDATE');
    $find->execute([':id' => $expenseId]);
    $before = $find->fetch(PDO::FETCH_ASSOC) ?: null;
    if (!$before) throw new RuntimeException('The selected expense was not found.');
    $currentStatus = strtolower((string) ($before['status'] ?? 'draft'));
    if ($action === 'submit_for_approval' && $currentStatus !== 'draft') { $pdo->rollBack(); expenseManagementJson(409, ['success' => false, 'message' => 'Only a draft can be submitted for approval.']); }
    if ($action === 'approve_expense' && $currentStatus !== 'submitted') { $pdo->rollBack(); expenseManagementJson(409, ['success' => false, 'message' => 'Only a submitted expense can be approved.']); }
    if ($action === 'record_paid_evidence' && $currentStatus !== 'approved') { $pdo->rollBack(); expenseManagementJson(409, ['success' => false, 'message' => 'Only an approved expense can receive paid evidence.']); }
    if ($action === 'reject_expense' && !in_array($currentStatus, ['draft', 'submitted'], true)) { $pdo->rollBack(); expenseManagementJson(409, ['success' => false, 'message' => 'Only a draft or submitted expense can be rejected.']); }
    if ($action === 'submit_for_approval') $update = $pdo->prepare("UPDATE operating_expenses SET status='submitted',approval_note=:reason WHERE id=:id");
    elseif ($action === 'approve_expense') $update = $pdo->prepare("UPDATE operating_expenses SET status='approved',approval_note=:reason,approved_at=NOW() WHERE id=:id");
    elseif ($action === 'record_paid_evidence') $update = $pdo->prepare("UPDATE operating_expenses SET status='paid',payment_status='paid',payment_reference=:payment_reference,paid_at=NOW(),approval_note=:reason WHERE id=:id");
    else $update = $pdo->prepare("UPDATE operating_expenses SET status='rejected',approval_note=:reason WHERE id=:id");
    $parameters = [':reason' => $reason, ':id' => $expenseId];
    if ($action === 'record_paid_evidence') $parameters[':payment_reference'] = $paymentReference;
    $update->execute($parameters);
    $read = $pdo->prepare('SELECT * FROM operating_expenses WHERE id=:id LIMIT 1');
    $read->execute([':id' => $expenseId]);
    $after = $read->fetch(PDO::FETCH_ASSOC) ?: [];
    expenseManagementEvent($pdo, $expenseId, $action, $before, $after, $reason);
    $pdo->commit();
    $messages = ['submit_for_approval' => 'Expense submitted for human approval.', 'approve_expense' => 'Expense approved with audit evidence.', 'record_paid_evidence' => 'Paid evidence recorded. No bank balance was changed.', 'reject_expense' => 'Expense rejected with the original record preserved.'];
    expenseManagementJson(200, array_merge(['success' => true, 'module' => 'expenses-cost-management', 'message' => $messages[$action]], expenseManagementState($pdo, $payload['period'] ?? '30D')));
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('manage_expenses.php: ' . $error->getMessage());
    expenseManagementJson(500, ['success' => false, 'module' => 'expenses-cost-management', 'message' => 'Expenses and cost management is temporarily unavailable.']);
}
