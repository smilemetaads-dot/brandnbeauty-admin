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

function publicCollectionsJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') publicCollectionsJson(405, ['success'=>false,'message'=>'Only GET requests are allowed.']);
    $pdo = getDatabaseConnection();
    ensureCollectionSchema($pdo);
    $limit = max(1, min(48, (int)($_GET['limit'] ?? 24)));
    $statement = $pdo->prepare(
        "SELECT c.id,c.title,c.slug,c.eyebrow_label,c.description,c.desktop_image_url,c.mobile_image_url,
                c.seo_title,c.seo_description,c.sort_order,COUNT(cp.id) product_count
         FROM collections c LEFT JOIN collection_products cp ON cp.collection_id=c.id
         WHERE c.status='active'
         GROUP BY c.id,c.title,c.slug,c.eyebrow_label,c.description,c.desktop_image_url,c.mobile_image_url,c.seo_title,c.seo_description,c.sort_order
         ORDER BY c.sort_order,c.id LIMIT :limit"
    );
    $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
    $statement->execute();
    $collections = $statement->fetchAll(PDO::FETCH_ASSOC) ?: [];
    foreach ($collections as &$collection) $collection['href'] = '/collections/' . rawurlencode((string)$collection['slug']);
    unset($collection);
    publicCollectionsJson(200, ['success'=>true,'collections'=>$collections,'count'=>count($collections),'generated_at'=>date(DATE_ATOM)]);
} catch (Throwable $error) {
    error_log('get_collections.php: ' . $error->getMessage());
    publicCollectionsJson(500, ['success'=>false,'message'=>'Collections are temporarily unavailable.']);
}
