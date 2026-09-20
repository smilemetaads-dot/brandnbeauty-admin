<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/expense_management_common.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

try {
    $pdo = getDatabaseConnection();
    $state = expenseManagementState($pdo, '30D');
    echo json_encode(['success' => true, 'module' => 'expenses-cost-management', 'schema_ready' => catalogTableExists($pdo, 'operating_expenses') && catalogTableExists($pdo, 'finance_expense_events'), 'record_count' => count($state['records']), 'mode' => 'draft_approval_payment_evidence', 'page_load_mode' => 'read_only', 'checked_at' => date(DATE_ATOM)], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('get_expenses_status.php: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'module' => 'expenses-cost-management', 'message' => 'Expenses readiness could not be verified.']);
}
