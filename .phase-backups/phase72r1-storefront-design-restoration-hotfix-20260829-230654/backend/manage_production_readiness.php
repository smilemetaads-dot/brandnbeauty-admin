<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/production_readiness_common.php';

$origin=$_SERVER['HTTP_ORIGIN']??'';
if(preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/',$origin)===1){header('Access-Control-Allow-Origin: '.$origin);header('Vary: Origin');}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token');
header('X-Content-Type-Options: nosniff');header('Cache-Control: no-store');
if(($_SERVER['REQUEST_METHOD']??'GET')==='OPTIONS'){http_response_code(204);exit;}

requireAdminAuth();

try{
    $pdo=getDatabaseConnection();readinessEnsureTables($pdo);
    if(($_SERVER['REQUEST_METHOD']??'GET')==='GET')readinessJson(200,array_merge(['success'=>true],readinessReadState($pdo)));
    if(($_SERVER['REQUEST_METHOD']??'GET')!=='POST')readinessJson(405,['success'=>false,'message'=>'Method not allowed.']);
    $payload=readinessPayload();$action=readinessText($payload['action']??'',80);
    if($action!=='run_scan')throw new InvalidArgumentException('Unknown production readiness action.');
    readinessRunScan($pdo,readinessText($payload['reason']??'',1200));
    readinessJson(200,['success'=>true,'message'=>'Protected readiness scan recorded. No deployment, DNS or business record was changed.','state'=>readinessReadState($pdo)]);
}catch(InvalidArgumentException $error){readinessJson(422,['success'=>false,'message'=>$error->getMessage()]);}
catch(Throwable $error){error_log('manage_production_readiness.php: '.$error->getMessage());readinessJson(500,['success'=>false,'message'=>'Production readiness evidence is unavailable right now. No deployment or business record was changed.']);}
