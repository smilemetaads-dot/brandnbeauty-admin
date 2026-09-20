<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';

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

function publicFooterCmsJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function emptyPublicFooterConfig(): array
{
    return [
        'brand' => ['description' => '', 'phone' => '', 'email' => '', 'address' => '', 'facebook' => '', 'instagram' => '', 'whatsapp' => '', 'youtube' => ''],
        'settings' => ['newsletter' => false, 'contact_block' => false, 'social_links' => false, 'trust_strip' => false, 'payment_badges' => false, 'copyright' => ''],
        'columns' => [],
        'trust_items' => [],
    ];
}

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') publicFooterCmsJson(405, ['success' => false, 'message' => 'Only GET requests are allowed.']);

    $pdo = getDatabaseConnection();
    $tableCheck = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table_name'
    );
    $tableCheck->execute([':table_name' => 'footer_cms_state']);
    if ((int) $tableCheck->fetchColumn() === 0) {
        publicFooterCmsJson(200, ['success' => true, 'footer' => emptyPublicFooterConfig(), 'version' => 0, 'published_at' => null]);
    }

    $row = $pdo->query('SELECT live_json, version_no, published_at FROM footer_cms_state WHERE id = 1 LIMIT 1')->fetch() ?: [];
    $config = json_decode((string) ($row['live_json'] ?? ''), true);
    publicFooterCmsJson(200, [
        'success' => true,
        'footer' => is_array($config) ? $config : emptyPublicFooterConfig(),
        'version' => (int) ($row['version_no'] ?? 0),
        'published_at' => $row['published_at'] ?? null,
    ]);
} catch (Throwable $exception) {
    error_log('Public footer layout request failed: ' . $exception->getMessage());
    publicFooterCmsJson(500, ['success' => false, 'message' => 'Footer layout is temporarily unavailable.']);
}
