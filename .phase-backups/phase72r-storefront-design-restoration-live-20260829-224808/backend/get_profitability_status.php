<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/profitability_common.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

try {
    $pdo = getDatabaseConnection();
    $state = profitabilityState($pdo, '30D');
    echo json_encode([
        'success' => true,
        'module' => 'profitability-control',
        'schema_ready' => catalogTableExists($pdo, 'order_financials') && catalogTableExists($pdo, 'order_financial_events'),
        'orders_connected' => (bool) ($state['quality']['orders_connected'] ?? false),
        'delivered_orders' => (int) ($state['summary']['delivered_orders'] ?? 0),
        'cost_coverage_percent' => (float) ($state['summary']['cost_coverage_percent'] ?? 0),
        'mode' => 'delivered_revenue_confirmed_costs',
        'page_load_mode' => 'read_only',
        'checked_at' => date(DATE_ATOM),
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('get_profitability_status.php: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'module' => 'profitability-control', 'message' => 'Profitability readiness could not be verified.']);
}

