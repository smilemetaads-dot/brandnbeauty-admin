<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/storefront_product_public.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['https://brandnbeauty.com', 'https://www.brandnbeauty.com'];
$localOrigin = preg_match('/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/', $origin) === 1;
if ($localOrigin || in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: public, max-age=30, stale-while-revalidate=120');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

function storeProductJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        storeProductJson(405, ['success' => false, 'message' => 'Only GET requests are allowed.']);
    }

    $slug = strtolower(trim((string) ($_GET['slug'] ?? '')));
    if ($slug === '' || preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug) !== 1) {
        storeProductJson(422, ['success' => false, 'message' => 'A valid product slug is required.']);
    }

    $products = storefrontPublicProductRows(getDatabaseConnection());
    $product = null;
    foreach ($products as $candidate) {
        if ((string) $candidate['slug'] === $slug) {
            $product = $candidate;
            break;
        }
    }
    if ($product === null) {
        storeProductJson(404, ['success' => false, 'message' => 'This product is not available.']);
    }

    $related = array_values(array_filter($products, static function (array $candidate) use ($product): bool {
        if ($candidate['id'] === $product['id']) return false;
        $sameCategory = $product['category_name'] !== '' && storefrontPublicLower((string) $candidate['category_name']) === storefrontPublicLower((string) $product['category_name']);
        $sameBrand = $product['brand_name'] !== '' && storefrontPublicLower((string) $candidate['brand_name']) === storefrontPublicLower((string) $product['brand_name']);
        return $sameCategory || $sameBrand;
    }));
    usort($related, static fn (array $left, array $right): int => [$right['available'], $left['product_name']] <=> [$left['available'], $right['product_name']]);

    storeProductJson(200, [
        'success' => true,
        'product' => $product,
        'related_products' => array_slice($related, 0, 4),
        'stock_mutation' => 'disabled',
        'order_creation' => 'disabled_until_phase_73',
        'generated_at' => date(DATE_ATOM),
    ]);
} catch (Throwable $error) {
    error_log('get_store_product.php: ' . $error->getMessage());
    storeProductJson(500, ['success' => false, 'message' => 'This product is temporarily unavailable.']);
}

