<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/launch_verification_common.php';
header('Content-Type: application/json; charset=utf-8'); header('X-Content-Type-Options: nosniff'); header('Cache-Control: no-store');
try {
    $pdo = getDatabaseConnection(); ensureLaunchVerificationSchema($pdo);
    $required = ['launch_verification_runs', 'launch_verification_checks', 'launch_verification_events'];
    $missing = []; foreach ($required as $table) if (!launchTableExists($pdo, $table)) $missing[] = $table;
    echo json_encode(['success' => true, 'service' => 'launch-verification', 'database_connected' => true, 'schema_installed' => $missing === [], 'missing_tables' => $missing, 'automatic_deployment' => false, 'automatic_dns_change' => false, 'human_release_required' => true, 'checked_at' => date(DATE_ATOM)], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('get_launch_verification_status.php: ' . $error->getMessage()); http_response_code(500);
    echo json_encode(['success' => false, 'service' => 'launch-verification', 'message' => 'Launch verification database health check failed.'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}
