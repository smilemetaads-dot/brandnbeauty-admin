<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/routine_compatibility_common.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

try {
    $pdo = getDatabaseConnection();
    ensureRoutineCompatibilitySchema($pdo);
    $state = routineCompatibilityState($pdo);
    echo json_encode([
        'success' => true,
        'module' => 'routine-product-compatibility',
        'database' => 'connected',
        'total_checks' => (int) ($state['summary']['total'] ?? 0),
        'evaluation_mode' => 'deterministic_evidence_only',
        'automatic_routine_mutation' => 'disabled',
        'automatic_customer_contact' => 'disabled',
        'seeded_checks' => 0,
        'generated_at' => date(DATE_ATOM),
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('get_routine_compatibility_status.php: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'module' => 'routine-product-compatibility', 'database' => 'unavailable', 'message' => 'Routine compatibility status is temporarily unavailable.']);
}

