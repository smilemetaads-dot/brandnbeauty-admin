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

function publicHeaderNavigationJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        publicHeaderNavigationJson(405, ['success' => false, 'message' => 'Only GET requests are allowed.']);
    }

    $pdo = getDatabaseConnection();
    $tableCheck = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table_name'
    );
    $tableCheck->execute([':table_name' => 'header_navigation_state']);
    if ((int) $tableCheck->fetchColumn() === 0) {
        publicHeaderNavigationJson(200, [
            'success' => true,
            'header_navigation' => ['announcement' => ['enabled' => false, 'text' => '', 'link' => '/'], 'settings' => [], 'mobile_shortcuts' => [], 'items' => []],
            'version' => 0,
            'published_at' => null,
        ]);
    }

    $row = $pdo->query(
        'SELECT live_json, version_no, published_at FROM header_navigation_state WHERE id = 1 LIMIT 1'
    )->fetch() ?: [];
    $config = json_decode((string) ($row['live_json'] ?? ''), true);
    publicHeaderNavigationJson(200, [
        'success' => true,
        'header_navigation' => is_array($config) ? $config : ['announcement' => ['enabled' => false, 'text' => '', 'link' => '/'], 'settings' => [], 'mobile_shortcuts' => [], 'items' => []],
        'version' => (int) ($row['version_no'] ?? 0),
        'published_at' => $row['published_at'] ?? null,
    ]);
} catch (Throwable $exception) {
    error_log('Public header navigation request failed: ' . $exception->getMessage());
    publicHeaderNavigationJson(500, ['success' => false, 'message' => 'Header navigation is temporarily unavailable.']);
}
