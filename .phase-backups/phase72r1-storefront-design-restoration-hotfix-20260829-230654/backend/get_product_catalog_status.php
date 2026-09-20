<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/product_catalog_schema.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['https://brandnbeauty.com', 'https://www.brandnbeauty.com', 'https://admin.brandnbeauty.com'];
$localOrigin = preg_match('/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/', $origin) === 1;
if ($localOrigin || in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

function productCatalogStatusJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        productCatalogStatusJson(405, ['success' => false, 'message' => 'Only GET requests are allowed.']);
    }
    $pdo = getDatabaseConnection();
    ensureProductCatalogSchema($pdo);
    $productsReady = catalogTableExists($pdo, 'products');
    $map = $productsReady ? catalogProductMap($pdo) : [];
    $total = $productsReady ? (int) $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn() : 0;
    $drafts = (int) $pdo->query("SELECT COUNT(*) FROM product_catalog_drafts WHERE status='draft'")->fetchColumn();
    $versions = (int) $pdo->query('SELECT COUNT(*) FROM product_catalog_versions')->fetchColumn();
    productCatalogStatusJson(200, [
        'success' => true,
        'module' => 'product-catalog',
        'products_table' => $productsReady,
        'product_count' => $total,
        'draft_count' => $drafts,
        'version_count' => $versions,
        'adapter' => $productsReady ? array_filter($map, static fn ($key): bool => $key !== '_columns', ARRAY_FILTER_USE_KEY) : [],
        'generated_at' => date(DATE_ATOM),
    ]);
} catch (Throwable $error) {
    error_log('get_product_catalog_status.php: ' . $error->getMessage());
    productCatalogStatusJson(500, ['success' => false, 'message' => 'Product catalog readiness could not be verified.']);
}
