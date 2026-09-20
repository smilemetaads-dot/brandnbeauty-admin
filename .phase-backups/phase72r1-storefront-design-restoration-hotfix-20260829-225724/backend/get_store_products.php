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

function storeProductsJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        storeProductsJson(405, ['success' => false, 'message' => 'Only GET requests are allowed.']);
    }

    $query = trim((string) ($_GET['q'] ?? ''));
    if (strlen($query) > 120) storeProductsJson(422, ['success' => false, 'message' => 'Search is too long.']);

    $brand = trim((string) ($_GET['brand'] ?? ''));
    $category = trim((string) ($_GET['category'] ?? ''));
    $availability = strtolower(trim((string) ($_GET['availability'] ?? 'all')));
    if (!in_array($availability, ['all', 'in_stock', 'out_of_stock'], true)) $availability = 'all';

    $sort = strtolower(trim((string) ($_GET['sort'] ?? 'name_asc')));
    if (!in_array($sort, ['name_asc', 'name_desc', 'price_asc', 'price_desc', 'newest'], true)) $sort = 'name_asc';

    $page = max(1, (int) ($_GET['page'] ?? 1));
    $limit = max(1, min(1000, (int) ($_GET['limit'] ?? 96)));

    $products = storefrontPublicProductRows(getDatabaseConnection());
    $allProducts = $products;
    $needle = storefrontPublicLower($query);
    $brandNeedle = storefrontPublicLower($brand);
    $categoryNeedle = storefrontPublicLower($category);

    $products = array_values(array_filter($products, static function (array $product) use ($needle, $brandNeedle, $categoryNeedle, $availability): bool {
        if ($brandNeedle !== '' && storefrontPublicLower((string) $product['brand_name']) !== $brandNeedle) return false;
        if ($categoryNeedle !== '' && storefrontPublicLower((string) $product['category_name']) !== $categoryNeedle) return false;
        if ($availability === 'in_stock' && !$product['available']) return false;
        if ($availability === 'out_of_stock' && $product['available']) return false;
        if ($needle === '') return true;
        $haystack = storefrontPublicLower(implode(' ', [
            $product['product_name'], $product['brand_name'], $product['category_name'],
            $product['sku'], $product['short_description'],
        ]));
        return str_contains($haystack, $needle);
    }));

    usort($products, static function (array $left, array $right) use ($sort): int {
        if ($sort === 'price_asc') return [$left['price'], $left['product_name']] <=> [$right['price'], $right['product_name']];
        if ($sort === 'price_desc') return [$right['price'], $left['product_name']] <=> [$left['price'], $right['product_name']];
        if ($sort === 'name_desc') return strnatcasecmp((string) $right['product_name'], (string) $left['product_name']);
        if ($sort === 'newest') return strcmp((string) ($right['updated_at'] ?? ''), (string) ($left['updated_at'] ?? ''));
        return strnatcasecmp((string) $left['product_name'], (string) $right['product_name']);
    });

    $facetValues = static function (array $rows, string $key): array {
        $values = [];
        foreach ($rows as $row) {
            $value = trim((string) ($row[$key] ?? ''));
            if ($value !== '') $values[storefrontPublicLower($value)] = $value;
        }
        natcasesort($values);
        return array_values($values);
    };

    $total = count($products);
    $pages = max(1, (int) ceil($total / $limit));
    if ($page > $pages) $page = $pages;
    $products = array_slice($products, ($page - 1) * $limit, $limit);

    storeProductsJson(200, [
        'success' => true,
        'products' => $products,
        'count' => count($products),
        'total' => $total,
        'page' => $page,
        'pages' => $pages,
        'facets' => [
            'brands' => $facetValues($allProducts, 'brand_name'),
            'categories' => $facetValues($allProducts, 'category_name'),
        ],
        'filters' => [
            'q' => $query, 'brand' => $brand, 'category' => $category,
            'availability' => $availability, 'sort' => $sort,
        ],
        'generated_at' => date(DATE_ATOM),
    ]);
} catch (Throwable $error) {
    error_log('get_store_products.php: ' . $error->getMessage());
    storeProductsJson(500, ['success' => false, 'message' => 'Products are temporarily unavailable.']);
}

