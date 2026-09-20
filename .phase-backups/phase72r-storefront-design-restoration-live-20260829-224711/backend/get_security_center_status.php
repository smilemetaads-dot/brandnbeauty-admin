<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

try {
    $pdo=getDatabaseConnection();
    $required=['security_controls','security_control_versions','security_scan_runs','security_findings','security_events','security_engine_state'];
    $missing=[];
    foreach ($required as $table) {
        $query=$pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
        $query->execute([':table'=>$table]);
        if ((int)$query->fetchColumn()===0) $missing[]=$table;
    }
    echo json_encode(['success'=>true,'service'=>'security-center','mode'=>'evidence_first','database_connected'=>true,'schema_installed'=>$missing===[],'missing_tables'=>$missing,'checked_at'=>date(DATE_ATOM)],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('get_security_center_status.php: ' . $error->getMessage());
    http_response_code(503);
    echo json_encode(['success'=>false,'service'=>'security-center','message'=>'Security Center database health check failed.'],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
}
