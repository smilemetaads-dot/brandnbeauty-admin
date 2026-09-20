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

function publicReviewsResultsJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function emptyPublicReviewsConfig(): array
{
    return [
        'heading' => '', 'supporting_line' => '', 'visible' => false, 'display_limit' => 6,
        'minimum_rating' => 1, 'show_ratings' => true, 'show_verified_badge' => true, 'show_media' => true,
    ];
}

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') publicReviewsResultsJson(405, ['success' => false, 'message' => 'Only GET requests are allowed.']);

    $pdo = getDatabaseConnection();
    $tableCheck = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table_name'
    );
    $tableCheck->execute([':table_name' => 'reviews_cms_state']);
    if ((int) $tableCheck->fetchColumn() === 0) {
        publicReviewsResultsJson(200, ['success' => true, 'config' => emptyPublicReviewsConfig(), 'entries' => [], 'version' => 0, 'published_at' => null]);
    }

    $row = $pdo->query('SELECT live_json, version_no, published_at FROM reviews_cms_state WHERE id = 1 LIMIT 1')->fetch() ?: [];
    $config = json_decode((string) ($row['live_json'] ?? ''), true);
    if (!is_array($config)) $config = emptyPublicReviewsConfig();
    $minimumRating = max(1, min(5, (int) ($config['minimum_rating'] ?? 1)));
    $displayLimit = max(1, min(24, (int) ($config['display_limit'] ?? 6)));
    $entries = [];
    $entryTableCheck = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table_name'
    );
    $entryTableCheck->execute([':table_name' => 'reviews_cms_entries']);
    if ((int) $entryTableCheck->fetchColumn() > 0) {
        $entriesStatement = $pdo->prepare(
            'SELECT id, entry_type, customer_display_name, product_name, rating, review_text, duration,
                    media_url, source, verified_purchase, featured, created_at
             FROM reviews_cms_entries
             WHERE status = :status AND consent_obtained = 1 AND rating >= :minimum_rating
             ORDER BY featured DESC, moderated_at DESC, id DESC LIMIT :display_limit'
        );
        $entriesStatement->bindValue(':status', 'approved', PDO::PARAM_STR);
        $entriesStatement->bindValue(':minimum_rating', $minimumRating, PDO::PARAM_INT);
        $entriesStatement->bindValue(':display_limit', $displayLimit, PDO::PARAM_INT);
        $entriesStatement->execute();
        $entries = array_map(static fn (array $entry): array => [
            ...$entry,
            'id' => (int) $entry['id'],
            'rating' => (int) $entry['rating'],
            'verified_purchase' => (bool) $entry['verified_purchase'],
            'featured' => (bool) $entry['featured'],
        ], $entriesStatement->fetchAll() ?: []);
    }

    publicReviewsResultsJson(200, [
        'success' => true,
        'config' => $config,
        'entries' => $entries,
        'version' => (int) ($row['version_no'] ?? 0),
        'published_at' => $row['published_at'] ?? null,
    ]);
} catch (Throwable $exception) {
    error_log('Public Reviews and Real Results request failed: ' . $exception->getMessage());
    publicReviewsResultsJson(500, ['success' => false, 'message' => 'Customer reviews are temporarily unavailable.']);
}
