<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/collection_schema.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['https://brandnbeauty.com', 'https://www.brandnbeauty.com'];
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) === 1 || in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: public, max-age=60, stale-while-revalidate=300');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

function publicCollectionJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') publicCollectionJson(405, ['success'=>false,'message'=>'Only GET requests are allowed.']);
    $slug = strtolower(trim((string)($_GET['slug'] ?? '')));
    if ($slug === '' || preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug) !== 1) {
        publicCollectionJson(422, ['success'=>false,'message'=>'A valid collection slug is required.']);
    }
    $pdo = getDatabaseConnection();
    ensureCollectionSchema($pdo);
    $statement = $pdo->prepare(
        "SELECT id,title,slug,eyebrow_label,description,desktop_image_url,mobile_image_url,seo_title,seo_description,sort_order,updated_at
         FROM collections WHERE slug=:slug AND status='active' LIMIT 1"
    );
    $statement->execute([':slug'=>$slug]);
    $collection = $statement->fetch(PDO::FETCH_ASSOC);
    if (!$collection) publicCollectionJson(404, ['success'=>false,'message'=>'This collection is not available.']);

    $products = [];
    if (collectionTableExists($pdo, 'products')) {
        $projection = collectionProductProjection($pdo);
        if ($projection['id'] !== null) {
            $identifier = '`' . str_replace('`','``',(string)$projection['id']) . '`';
            $query = $pdo->prepare(
                'SELECT ' . $projection['select'] . ',cp.sort_order FROM collection_products cp
                 INNER JOIN products p ON p.' . $identifier . '=cp.product_id
                 WHERE cp.collection_id=:collection_id ORDER BY cp.sort_order,cp.id'
            );
            $query->execute([':collection_id'=>$collection['id']]);
            $products = $query->fetchAll(PDO::FETCH_ASSOC) ?: [];
            $products = array_values(array_filter($products, static function (array $product): bool {
                $status = strtolower(trim((string)($product['status'] ?? 'active')));
                return in_array($status, ['active', 'published', 'live', '1', 'out_of_stock', 'out-of-stock'], true);
            }));
        }
    }
    $collection['href'] = '/collections/' . rawurlencode((string)$collection['slug']);
    $collection['product_count'] = count($products);
    $collection['products'] = $products;
    publicCollectionJson(200, ['success'=>true,'collection'=>$collection,'generated_at'=>date(DATE_ATOM)]);
} catch (Throwable $error) {
    error_log('get_collection.php: ' . $error->getMessage());
    publicCollectionJson(500, ['success'=>false,'message'=>'This collection is temporarily unavailable.']);
}
