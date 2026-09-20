<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/purchase_stock_schema.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

try {
    $pdo = getDatabaseConnection();
    ensurePurchaseStockSchema($pdo);
    $required = ['purchase_stock_orders', 'purchase_stock_lines', 'purchase_stock_events', 'inventory_movements'];
    $missing = array_values(array_filter($required, static fn (string $table): bool => !catalogTableExists($pdo, $table)));
    echo json_encode(['success' => true, 'module' => 'purchase-stock-entry', 'database_connected' => true, 'schema_ready' => $missing === [], 'missing_tables' => $missing, 'mode' => 'draft_approval_verified_receipt', 'checked_at' => date(DATE_ATOM)], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('get_purchase_stock_status.php: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'module' => 'purchase-stock-entry', 'message' => 'Purchase Stock Entry health check failed.']);
}
