<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/production_readiness_common.php';
header('Content-Type: application/json; charset=utf-8');header('X-Content-Type-Options: nosniff');header('Cache-Control: no-store');
try{
    $pdo=getDatabaseConnection();readinessEnsureTables($pdo);
    $required=['deployment_environment_registry','deployment_readiness_runs','deployment_readiness_checks','deployment_readiness_events'];
    $missing=[];foreach($required as $table){if(!readinessTableExists($pdo,$table))$missing[]=$table;}
    echo json_encode(['success'=>true,'service'=>'production-readiness','database_connected'=>true,'schema_installed'=>$missing===[],'missing_tables'=>$missing,'automatic_deployment'=>false,'automatic_dns_change'=>false,'automatic_production_switch'=>false,'checked_at'=>date(DATE_ATOM)],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
}catch(Throwable $error){error_log('get_production_readiness_status.php: '.$error->getMessage());http_response_code(500);echo json_encode(['success'=>false,'service'=>'production-readiness','message'=>'Production readiness database health check failed.'],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);}
