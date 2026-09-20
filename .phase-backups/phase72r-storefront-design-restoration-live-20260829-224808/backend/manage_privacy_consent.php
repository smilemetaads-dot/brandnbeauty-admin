<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/privacy_common.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigin = $origin === '' || preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/',$origin) === 1 || preg_match('/^https:\/\/(www\.)?brandnbeauty\.com$/',$origin) === 1;
header('Content-Type: application/json; charset=utf-8');
if (!$allowedOrigin) privacyJson(403,['success'=>false,'message'=>'This consent origin is not allowed.']);
if ($origin !== '') { header('Access-Control-Allow-Origin: ' . $origin); header('Vary: Origin'); }
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

try {
    $pdo = getDatabaseConnection();
    foreach (['privacy_retention_policies','privacy_consent_events'] as $requiredTable) {
        if (!privacyTableExists($pdo,$requiredTable)) privacyJson(503,['success'=>false,'message'=>'Privacy Center must be initialized by an authenticated administrator first.']);
    }
    $config = [
        'policy_version'=>1,
        'categories'=>[
            ['key'=>'essential','label'=>'Essential','required'=>true,'default_enabled'=>true],
            ['key'=>'analytics','label'=>'Analytics','required'=>false,'default_enabled'=>false],
            ['key'=>'marketing','label'=>'Marketing','required'=>false,'default_enabled'=>false],
        ],
    ];
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') privacyJson(200,['success'=>true,'consent'=>$config]);

    $payload = privacyPayload();
    $anonymousId = privacyText($payload['anonymous_id'] ?? '',200);
    if (strlen($anonymousId) < 8) privacyJson(422,['success'=>false,'message'=>'A stable anonymous consent identifier is required.']);
    $analytics = !empty($payload['analytics']);
    $marketing = !empty($payload['marketing']);
    $ipHash = hash('sha256','privacy-ip|' . privacyText($_SERVER['REMOTE_ADDR'] ?? 'unknown',100));
    $recent = $pdo->prepare("SELECT COUNT(*) FROM privacy_consent_events WHERE ip_hash=:ip_hash AND source='storefront' AND occurred_at>=DATE_SUB(NOW(),INTERVAL 5 MINUTE)");
    $recent->execute([':ip_hash'=>$ipHash]);
    if ((int)$recent->fetchColumn() >= 20) privacyJson(429,['success'=>false,'message'=>'Too many consent updates were received. Please try again shortly.']);
    $save = $pdo->prepare("INSERT INTO privacy_consent_events (consent_key,anonymous_hash,essential,analytics,marketing,source,policy_version,ip_hash,user_agent_hash) VALUES (:key,:anonymous_hash,1,:analytics,:marketing,'storefront',1,:ip_hash,:agent_hash)");
    $save->execute([
        ':key'=>bin2hex(random_bytes(16)),
        ':anonymous_hash'=>hash('sha256','privacy-anonymous|' . $anonymousId),
        ':analytics'=>$analytics?1:0, ':marketing'=>$marketing?1:0,
        ':ip_hash'=>$ipHash,
        ':agent_hash'=>hash('sha256','privacy-agent|' . privacyText($_SERVER['HTTP_USER_AGENT'] ?? 'unknown',500)),
    ]);
    privacyJson(200,['success'=>true,'message'=>'Consent choices recorded.','consent'=>['essential'=>true,'analytics'=>$analytics,'marketing'=>$marketing,'policy_version'=>1]]);
} catch (Throwable $error) {
    error_log('manage_privacy_consent.php: ' . $error->getMessage());
    privacyJson(500,['success'=>false,'message'=>'The consent choice could not be recorded.']);
}
