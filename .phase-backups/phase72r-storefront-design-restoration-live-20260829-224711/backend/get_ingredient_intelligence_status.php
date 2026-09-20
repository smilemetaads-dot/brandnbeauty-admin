<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/ingredient_intelligence_common.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

try {
    $pdo = getDatabaseConnection();
    ensureIngredientIntelligenceSchema($pdo);
    $state = ingredientIntelligenceState($pdo);
    echo json_encode([
        'success' => true,
        'module' => 'ingredient-intelligence',
        'database' => 'connected',
        'total_profiles' => (int) ($state['summary']['total'] ?? 0),
        'active_profiles' => (int) ($state['summary']['active'] ?? 0),
        'rules' => (int) ($state['summary']['rules'] ?? 0),
        'automatic_medical_action' => 'disabled',
        'seeded_profiles' => 0,
        'generated_at' => date(DATE_ATOM),
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('get_ingredient_intelligence_status.php: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'module' => 'ingredient-intelligence', 'database' => 'unavailable', 'message' => 'Ingredient Intelligence status is temporarily unavailable.']);
}
