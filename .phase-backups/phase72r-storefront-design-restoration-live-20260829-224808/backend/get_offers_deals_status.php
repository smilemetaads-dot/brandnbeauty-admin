<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/offers_deals_common.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

try {
    $pdo = getDatabaseConnection();
    $state = offersDealsState($pdo);
    $public = offersDealsPublicState($pdo);
    echo json_encode([
        'success' => true,
        'module' => 'offers-deals',
        'database_connected' => true,
        'total_offers' => (int) ($state['summary']['total'] ?? 0),
        'active_now' => (int) ($state['summary']['active_now'] ?? 0),
        'public_feed_count' => (int) ($public['count'] ?? 0),
        'checkout_application' => 'not_automatic',
        'checked_at' => date(DATE_ATOM),
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('get_offers_deals_status.php: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'module' => 'offers-deals', 'message' => 'Offers & Deals readiness could not be verified.']);
}
