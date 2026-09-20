<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/ingredient_intelligence_common.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['https://brandnbeauty.com', 'https://www.brandnbeauty.com', 'https://admin.brandnbeauty.com'];
$localOrigin = preg_match('/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/', $origin) === 1;
if ($localOrigin || in_array($origin, $allowedOrigins, true)) { header('Access-Control-Allow-Origin: ' . $origin); header('Vary: Origin'); }
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: public, max-age=120');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') { http_response_code(405); echo json_encode(['success' => false, 'message' => 'Method not allowed.']); exit; }

try {
    $pdo = getDatabaseConnection();
    ensureIngredientIntelligenceSchema($pdo);
    echo json_encode(array_merge(['success' => true, 'module' => 'ingredient-intelligence-public'], ingredientIntelligencePublicState($pdo)), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('get_ingredient_intelligence.php: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'module' => 'ingredient-intelligence-public', 'message' => 'Public ingredient evidence is temporarily unavailable.']);
}
