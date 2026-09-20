<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/finance_reconciliation_common.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

try {
    $pdo = getDatabaseConnection();
    $state = financeReconciliationState($pdo, '30D');
    echo json_encode(['success' => true, 'module' => 'finance-reconciliation', 'schema_ready' => catalogTableExists($pdo, 'cod_reconciliation') && catalogTableExists($pdo, 'finance_reconciliation_events'), 'orders_connected' => catalogTableExists($pdo, 'orders'), 'record_count' => count($state['records']), 'mode' => 'human_confirmed_cod', 'page_load_mode' => 'read_only', 'checked_at' => date(DATE_ATOM)], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('get_finance_reconciliation_status.php: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'module' => 'finance-reconciliation', 'message' => 'Finance reconciliation readiness could not be verified.']);
}
