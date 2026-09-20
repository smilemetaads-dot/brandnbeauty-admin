<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

try {
    $pdo = getDatabaseConnection();
    $required = ['backup_restore_artifacts','backup_restore_drills','backup_restore_requests','backup_restore_events'];
    $missing = [];
    foreach ($required as $table) {
        $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
        $query->execute([':table'=>$table]);
        if ((int) $query->fetchColumn() === 0) $missing[] = $table;
    }
    echo json_encode(['success'=>true,'service'=>'backup-restore','mode'=>'private_logical_backup','database_connected'=>true,'schema_installed'=>$missing===[],'missing_tables'=>$missing,'checked_at'=>date(DATE_ATOM)], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('get_backup_restore_status.php: ' . $error->getMessage());
    http_response_code(503);
    echo json_encode(['success'=>false,'service'=>'backup-restore','message'=>'Backup & Restore database health check failed.'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}
