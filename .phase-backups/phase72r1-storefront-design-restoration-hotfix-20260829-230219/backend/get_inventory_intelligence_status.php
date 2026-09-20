<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/inventory_intelligence_common.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

try {
    $pdo = getDatabaseConnection();
    $state = inventoryIntelligenceState($pdo);
    echo json_encode([
        'success' => true,
        'module' => 'inventory-intelligence',
        'database_connected' => true,
        'stock_adapter_ready' => true,
        'demand_source_ready' => (bool) ($state['source']['ready'] ?? false),
        'total_skus' => (int) ($state['summary']['total_skus'] ?? 0),
        'mode' => 'read_only_evidence',
        'checked_at' => date(DATE_ATOM),
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('get_inventory_intelligence_status.php: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'module' => 'inventory-intelligence', 'message' => 'Inventory intelligence health check failed.']);
}
