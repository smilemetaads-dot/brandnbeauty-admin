<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/supplier_analytics_common.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

try {
    $pdo = getDatabaseConnection();
    ensurePurchaseStockSchema($pdo);
    $required = ['suppliers', 'purchase_stock_orders', 'purchase_stock_lines', 'inventory_movements'];
    $missing = array_values(array_filter($required, static fn (string $table): bool => !catalogTableExists($pdo, $table)));
    $probe = $missing === [] ? supplierAnalyticsState($pdo, '90D') : ['suppliers' => [], 'trend' => []];
    echo json_encode(['success' => true, 'module' => 'supplier-analytics', 'database_connected' => true, 'schema_ready' => $missing === [], 'analytics_ready' => $missing === [], 'supplier_count' => count($probe['suppliers']), 'trend_points' => count($probe['trend']), 'missing_tables' => $missing, 'mode' => 'read_only_performance', 'checked_at' => date(DATE_ATOM)], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('get_supplier_analytics_status.php: ' . $error->getMessage());
    $errorText = strtolower($error->getMessage());
    $hint = str_contains($errorText, 'unknown column') ? 'schema_column_mismatch' :
        (str_contains($errorText, 'syntax') ? 'database_query_compatibility' :
        (str_contains($errorText, 'undefined function') ? 'php_runtime_compatibility' : 'analytics_runtime'));
    echo json_encode(['success' => false, 'module' => 'supplier-analytics', 'analytics_ready' => false, 'diagnostic_stage' => 'full_calculation_probe', 'diagnostic_hint' => $hint, 'message' => 'Supplier Analytics health check failed.']);
}
