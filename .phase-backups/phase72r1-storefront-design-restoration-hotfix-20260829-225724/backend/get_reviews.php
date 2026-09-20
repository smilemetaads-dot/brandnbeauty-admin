<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';

bnbApplyCorsHeaders('GET, OPTIONS', 'Content-Type');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function sendReviewsJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function reviewsTableExists(PDO $pdo): bool
{
    $statement = $pdo->prepare(
        'SELECT COUNT(*)
         FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = :table_name'
    );
    $statement->execute([':table_name' => 'reviews']);

    return (int) $statement->fetchColumn() > 0;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendReviewsJson(405, [
        'success' => false,
        'message' => 'Only GET requests are allowed.',
    ]);
}

$productId = isset($_GET['product_id']) && preg_match('/^[1-9]\d*$/', (string) $_GET['product_id'])
    ? (int) $_GET['product_id']
    : null;
$featuredOnly = isset($_GET['featured']) && in_array(strtolower((string) $_GET['featured']), ['1', 'true', 'yes'], true);
$limit = isset($_GET['limit']) && preg_match('/^[1-9]\d*$/', (string) $_GET['limit'])
    ? min(24, (int) $_GET['limit'])
    : 12;

try {
    $pdo = getDatabaseConnection();

    if (!reviewsTableExists($pdo)) {
        sendReviewsJson(200, [
            'success' => true,
            'reviews' => [],
        ]);
    }

    $where = [
        "status IN ('active', 'approved')",
        "TRIM(COALESCE(customer_name, '')) <> ''",
        "TRIM(COALESCE(review_text, '')) <> ''",
    ];
    $params = [':limit' => $limit];

    if ($productId !== null) {
        $where[] = '(product_id = :product_id OR product_id IS NULL)';
        $params[':product_id'] = $productId;
    }

    if ($featuredOnly) {
        $where[] = 'featured = 1';
    }

    $statement = $pdo->prepare(
        'SELECT
            id,
            product_id,
            customer_name,
            rating,
            review_text,
            image_url,
            result_image_url,
            status,
            featured,
            sort_order,
            created_at
         FROM reviews
         WHERE ' . implode(' AND ', $where) . '
         ORDER BY featured DESC, sort_order ASC, id DESC
         LIMIT :limit'
    );

    foreach ($params as $key => $value) {
        $statement->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }
    $statement->execute();

    $reviews = array_map(
        static fn (array $row): array => [
            'id' => (string) ($row['id'] ?? ''),
            'product_id' => $row['product_id'] !== null ? (int) $row['product_id'] : null,
            'customer_name' => (string) ($row['customer_name'] ?? ''),
            'rating' => (int) ($row['rating'] ?? 5),
            'review_text' => (string) ($row['review_text'] ?? ''),
            'image_url' => $row['image_url'] ?: null,
            'result_image_url' => $row['result_image_url'] ?: null,
            'status' => (string) ($row['status'] ?? 'approved'),
            'featured' => (bool) ($row['featured'] ?? false),
            'sort_order' => (int) ($row['sort_order'] ?? 0),
            'created_at' => (string) ($row['created_at'] ?? ''),
        ],
        $statement->fetchAll()
    );

    sendReviewsJson(200, [
        'success' => true,
        'reviews' => $reviews,
    ]);
} catch (Throwable $exception) {
    error_log('Reviews fetch failed: ' . $exception->getMessage());
    sendReviewsJson(200, [
        'success' => true,
        'reviews' => [],
    ]);
}
