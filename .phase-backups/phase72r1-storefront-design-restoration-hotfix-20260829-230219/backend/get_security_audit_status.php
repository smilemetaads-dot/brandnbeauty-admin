<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

try {
    $pdo=getDatabaseConnection();
    $required=['security_audit_runs','security_audit_checks','security_audit_events','security_audit_signoffs'];
    $missing=[];
    $query=$pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    foreach ($required as $table) { $query->execute([':table'=>$table]); if ((int)$query->fetchColumn()===0) $missing[]=$table; }
    echo json_encode(['success'=>true,'service'=>'security-audit','mode'=>'internal_evidence_review','database_connected'=>true,'schema_installed'=>$missing===[],'missing_tables'=>$missing,'checked_at'=>date(DATE_ATOM)],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('get_security_audit_status.php: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success'=>false,'service'=>'security-audit','message'=>'Security Audit database health check failed.'],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
}
