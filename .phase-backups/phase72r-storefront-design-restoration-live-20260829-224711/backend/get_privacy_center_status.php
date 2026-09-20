<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

try {
    $pdo = getDatabaseConnection();
    $required = ['privacy_retention_policies','privacy_retention_versions','privacy_consent_events','privacy_requests','privacy_events'];
    $missing = [];
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    foreach ($required as $table) {
        $query->execute([':table'=>$table]);
        if ((int)$query->fetchColumn() === 0) $missing[] = $table;
    }
    echo json_encode([
        'success'=>true, 'service'=>'privacy-center', 'mode'=>'human_controlled',
        'database_connected'=>true, 'schema_installed'=>$missing === [],
        'missing_tables'=>$missing, 'automatic_erasure'=>false,
        'retention_cron_configured'=>false, 'checked_at'=>date(DATE_ATOM),
    ],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('get_privacy_center_status.php: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success'=>false,'service'=>'privacy-center','message'=>'Privacy Center database health check failed.'],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
}
