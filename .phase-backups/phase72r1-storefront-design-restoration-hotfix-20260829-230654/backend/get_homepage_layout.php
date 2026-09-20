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
header('Cache-Control: no-cache, must-revalidate');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function publicHomepageJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        publicHomepageJson(405, ['success' => false, 'message' => 'Only GET requests are allowed.']);
    }

    $pdo = getDatabaseConnection();
    $tableCheck = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table_name'
    );
    $tableCheck->execute([':table_name' => 'homepage_cms_state']);
    if ((int) $tableCheck->fetchColumn() === 0) {
        publicHomepageJson(200, [
            'success' => true,
            'homepage' => ['page_title' => '', 'page_subtitle' => '', 'hero_banners' => [], 'sections' => []],
            'version' => 0,
            'published_at' => null,
        ]);
    }

    $statement = $pdo->query(
        'SELECT live_json, version_no, published_at FROM homepage_cms_state WHERE id = 1 LIMIT 1'
    );
    $row = $statement->fetch() ?: [];
    $homepage = json_decode((string) ($row['live_json'] ?? ''), true);
    $homepage = is_array($homepage) ? $homepage : ['page_title' => '', 'page_subtitle' => '', 'hero_banners' => [], 'sections' => []];
    $editorPicks = [];
    if (collectionTableExists($pdo, 'collections') && collectionTableExists($pdo, 'collection_products')) {
        $limit = 6;
        foreach (is_array($homepage['sections'] ?? null) ? $homepage['sections'] : [] as $section) {
            if (is_array($section) && (string)($section['id'] ?? '') === 'editor-picks') {
                $limit = max(1, min(24, (int)($section['display_limit'] ?? 6)));
                break;
            }
        }
        $collections = $pdo->prepare(
            "SELECT c.id,c.title,c.slug,c.eyebrow_label,c.description,c.desktop_image_url,c.mobile_image_url,
                    c.seo_title,c.seo_description,c.sort_order,COUNT(cp.id) product_count
             FROM collections c LEFT JOIN collection_products cp ON cp.collection_id=c.id
             WHERE c.status='active'
             GROUP BY c.id,c.title,c.slug,c.eyebrow_label,c.description,c.desktop_image_url,c.mobile_image_url,c.seo_title,c.seo_description,c.sort_order
             ORDER BY c.sort_order,c.id LIMIT :limit"
        );
        $collections->bindValue(':limit', $limit, PDO::PARAM_INT);
        $collections->execute();
        $editorPicks = $collections->fetchAll(PDO::FETCH_ASSOC) ?: [];
        foreach ($editorPicks as &$collection) $collection['href'] = '/collections/' . rawurlencode((string)$collection['slug']);
        unset($collection);
    }

    publicHomepageJson(200, [
        'success' => true,
        'homepage' => array_merge($homepage, ['editor_picks' => $editorPicks]),
        'version' => (int) ($row['version_no'] ?? 0),
        'published_at' => $row['published_at'] ?? null,
    ]);
} catch (Throwable $exception) {
    error_log('Public homepage layout request failed: ' . $exception->getMessage());
    publicHomepageJson(500, ['success' => false, 'message' => 'Homepage content is temporarily unavailable.']);
}
