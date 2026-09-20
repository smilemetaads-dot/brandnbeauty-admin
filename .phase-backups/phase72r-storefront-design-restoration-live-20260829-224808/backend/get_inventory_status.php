<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/inventory_schema.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

try {
    $pdo = getDatabaseConnection();
    ensureInventorySchema($pdo);
    $products = inventoryProductRows($pdo);
    $map = catalogProductMap($pdo);
    echo json_encode([
        'success' => true,
        'module' => 'inventory-control',
        'source' => 'existing-products-table',
        'stock_adapter_ready' => $map['id'] !== null && $map['stock'] !== null,
        'summary' => inventorySummary($products),
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('Inventory status failed: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'module' => 'inventory-control', 'message' => 'Inventory status is temporarily unavailable.']);
}
