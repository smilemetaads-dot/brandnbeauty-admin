<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/product_recommendations_common.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

try {
    $pdo = getDatabaseConnection();
    $state = productRecommendationsState($pdo);
    $public = productRecommendationsPublicState($pdo);
    echo json_encode([
        'success' => true,
        'module' => 'product-recommendations',
        'database_connected' => true,
        'total_recommendations' => (int) ($state['summary']['total'] ?? 0),
        'active_now' => (int) ($state['summary']['active_now'] ?? 0),
        'public_feed_count' => (int) ($public['count'] ?? 0),
        'cart_application' => 'not_automatic',
        'customer_profiling' => 'not_recorded',
        'checked_at' => date(DATE_ATOM),
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('get_product_recommendations_status.php: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'module' => 'product-recommendations', 'message' => 'Product Recommendations readiness could not be verified.']);
}
