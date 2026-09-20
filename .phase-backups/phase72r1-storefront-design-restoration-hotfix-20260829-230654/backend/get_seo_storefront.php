<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) === 1 || preg_match('/^https:\/\/(www\.)?brandnbeauty\.com$/', $origin) === 1)) {
    header('Access-Control-Allow-Origin: ' . $origin); header('Vary: Origin');
}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: public, max-age=60, stale-while-revalidate=300');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

function publicSeoJson(int $status, array $payload): never
{
    http_response_code($status); echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); exit;
}

function emptyPublicSeoConfig(): array
{
    return ['site_name' => 'BrandnBeauty', 'site_url' => 'https://brandnbeauty.com', 'default_title' => 'BrandnBeauty', 'default_description' => '', 'canonical_base' => 'https://brandnbeauty.com', 'default_og_image' => '', 'indexing_enabled' => false, 'follow_links' => true, 'sitemap_enabled' => false, 'templates' => []];
}

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') publicSeoJson(405, ['success' => false, 'message' => 'Only GET requests are allowed.']);
    $pdo = getDatabaseConnection();
    $tables = $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('seo_cms_state', 'seo_redirects')")->fetchColumn();
    if ((int) $tables < 2) publicSeoJson(200, ['success' => true, 'config' => emptyPublicSeoConfig(), 'redirects' => [], 'version' => 0, 'published_at' => null]);
    $row = $pdo->query('SELECT live_json, version_no, published_at FROM seo_cms_state WHERE id = 1 LIMIT 1')->fetch() ?: [];
    $config = json_decode((string) ($row['live_json'] ?? ''), true);
    if (!is_array($config)) $config = emptyPublicSeoConfig();
    $redirects = $pdo->query("SELECT from_path, to_path, redirect_type FROM seo_redirects WHERE status = 'active' ORDER BY id ASC LIMIT 1000")->fetchAll() ?: [];
    publicSeoJson(200, ['success' => true, 'config' => $config, 'redirects' => array_map(static fn (array $item): array => ['from_path' => $item['from_path'], 'to_path' => $item['to_path'], 'redirect_type' => (int) $item['redirect_type']], $redirects), 'version' => (int) ($row['version_no'] ?? 0), 'published_at' => $row['published_at'] ?? null]);
} catch (Throwable $exception) {
    error_log('Public SEO storefront request failed: ' . $exception->getMessage());
    publicSeoJson(500, ['success' => false, 'message' => 'SEO storefront configuration is temporarily unavailable.']);
}
