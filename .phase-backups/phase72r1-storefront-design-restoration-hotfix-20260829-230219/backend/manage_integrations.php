<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) === 1) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

requireAdminAuth();

function integrationJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function integrationPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function integrationText(mixed $value, int $limit = 1000): string
{
    $value = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($value, 0, $limit) : substr($value, 0, $limit);
}

function integrationTableExists(PDO $pdo, string $table): bool
{
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table'=>$table]);
    return (int)$query->fetchColumn() > 0;
}

function integrationDefinitions(): array
{
    return [
        ['steadfast','Steadfast Courier','Courier','Courier booking, tracking and COD status handoff.',1,1,'https://portal.packzy.com/api/v1','Fulfilment',10],
        ['pathao','Pathao Courier','Courier','Merchant delivery, area lookup and delivery tracking.',1,1,'https://api-hermes.pathao.com','Fulfilment',20],
        ['meta_ads','Meta Ads','Growth','Read campaign delivery and prepare governed change requests.',1,1,'https://graph.facebook.com','Growth',30],
        ['meta_pixel','Meta Pixel','Growth','Browser commerce event destination and deduplication identity.',0,0,'https://www.facebook.com/tr','Growth',40],
        ['ga4','Google Analytics 4','Analytics','Commerce measurement and channel attribution destination.',0,0,'https://www.google-analytics.com','Growth',50],
        ['gtm','Google Tag Manager','Analytics','Storefront tag container reference and health visibility.',0,0,'https://www.googletagmanager.com','Growth',60],
        ['bkash','bKash Payment','Payments','Checkout payment, callback and reconciliation integration.',1,1,'https://tokenized.sandbox.bka.sh','Finance',70],
        ['smtp','Transactional Email','Messaging','Approved transactional templates and admin alert delivery.',1,1,'','Operations',80],
        ['messenger','Facebook Messenger','Messaging','Conversation identity, order-source and human follow-up linkage.',1,1,'https://graph.facebook.com','CRM',90],
    ];
}

function integrationKeyPath(): string
{
    $xamppRoot = dirname(__DIR__,4);
    $privateDirectory = $xamppRoot . DIRECTORY_SEPARATOR . 'BrandnBeauty-private';
    if (!is_dir($privateDirectory) && !mkdir($privateDirectory,0700,true) && !is_dir($privateDirectory)) throw new RuntimeException('The private credential directory could not be created.');
    return $privateDirectory . DIRECTORY_SEPARATOR . 'integrations-encryption.key';
}

function integrationEncryptionKey(): string
{
    if (!function_exists('openssl_encrypt') || !function_exists('openssl_decrypt')) throw new RuntimeException('PHP OpenSSL is required for encrypted integration credentials.');
    $path = integrationKeyPath();
    if (!is_file($path)) {
        if (file_put_contents($path,base64_encode(random_bytes(32)),LOCK_EX) === false) throw new RuntimeException('The integration encryption key could not be saved.');
        @chmod($path,0600);
    }
    $decoded = base64_decode(trim((string)file_get_contents($path)),true);
    if (!is_string($decoded) || strlen($decoded) !== 32) throw new RuntimeException('The integration encryption key is invalid.');
    return $decoded;
}

function integrationEncrypt(string $secret): string
{
    $iv=random_bytes(12); $tag='';
    $cipher=openssl_encrypt($secret,'aes-256-gcm',integrationEncryptionKey(),OPENSSL_RAW_DATA,$iv,$tag);
    if (!is_string($cipher)) throw new RuntimeException('The credential could not be encrypted.');
    return base64_encode(json_encode(['iv'=>base64_encode($iv),'tag'=>base64_encode($tag),'cipher'=>base64_encode($cipher)],JSON_UNESCAPED_SLASHES) ?: '');
}

function integrationSecretHint(string $secret): string
{
    $plain=preg_replace('/\s+/','',$secret) ?: '';
    $tail=substr($plain,-4);
    return $tail === '' ? 'stored' : '•••• '.$tail;
}

function ensureIntegrationTables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS integration_registry (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, integration_key VARCHAR(80) NOT NULL,
        provider_name VARCHAR(190) NOT NULL, domain_name VARCHAR(100) NOT NULL,
        description VARCHAR(1000) NOT NULL, requires_secret TINYINT(1) NOT NULL DEFAULT 0,
        supports_webhook TINYINT(1) NOT NULL DEFAULT 0, default_endpoint VARCHAR(500) NOT NULL DEFAULT '',
        default_owner VARCHAR(190) NOT NULL DEFAULT 'Operations', sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_integration_registry_key (integration_key), KEY idx_integration_registry_domain (domain_name,sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS integration_connections (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, integration_key VARCHAR(80) NOT NULL,
        environment ENUM('production','sandbox','staging') NOT NULL DEFAULT 'sandbox',
        lifecycle ENUM('setup','draft','ready','active','paused','error') NOT NULL DEFAULT 'setup',
        owner_name VARCHAR(190) NOT NULL, public_reference VARCHAR(300) NOT NULL DEFAULT '',
        endpoint_url VARCHAR(500) NOT NULL DEFAULT '', encrypted_secret LONGTEXT NULL,
        secret_hint VARCHAR(30) NOT NULL DEFAULT '', version INT UNSIGNED NOT NULL DEFAULT 1,
        last_local_test_at DATETIME NULL, last_test_result ENUM('never','passed','failed') NOT NULL DEFAULT 'never',
        last_error VARCHAR(1000) NULL, activated_at DATETIME NULL, updated_by VARCHAR(190) NOT NULL DEFAULT 'authenticated admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_integration_connection_key (integration_key), KEY idx_integration_connection_lifecycle (lifecycle,updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS integration_test_runs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, integration_key VARCHAR(80) NOT NULL,
        test_type VARCHAR(60) NOT NULL DEFAULT 'local_readiness', result ENUM('passed','failed') NOT NULL,
        checks_json LONGTEXT NOT NULL, note VARCHAR(1000) NOT NULL,
        tested_by VARCHAR(190) NOT NULL DEFAULT 'authenticated admin', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_integration_test_key_time (integration_key,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS integration_webhook_routes (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, integration_key VARCHAR(80) NOT NULL,
        route_path VARCHAR(300) NOT NULL, signing_required TINYINT(1) NOT NULL DEFAULT 1,
        status ENUM('disabled','ready','active') NOT NULL DEFAULT 'disabled',
        last_event_at DATETIME NULL, version INT UNSIGNED NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_integration_webhook_key (integration_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS integration_audit_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, integration_key VARCHAR(80) NOT NULL,
        event_type VARCHAR(80) NOT NULL, actor_name VARCHAR(190) NOT NULL,
        note VARCHAR(2000) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_integration_audit_time (integration_key,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $registry=$pdo->prepare('INSERT INTO integration_registry (integration_key,provider_name,domain_name,description,requires_secret,supports_webhook,default_endpoint,default_owner,sort_order) VALUES (:integration_key,:provider_name,:domain_name,:description,:requires_secret,:supports_webhook,:default_endpoint,:default_owner,:sort_order) ON DUPLICATE KEY UPDATE provider_name=VALUES(provider_name),domain_name=VALUES(domain_name),description=VALUES(description),requires_secret=VALUES(requires_secret),supports_webhook=VALUES(supports_webhook),default_endpoint=VALUES(default_endpoint),default_owner=VALUES(default_owner),sort_order=VALUES(sort_order)');
    $connection=$pdo->prepare("INSERT IGNORE INTO integration_connections (integration_key,environment,lifecycle,owner_name,endpoint_url) VALUES (:integration_key,'sandbox','setup',:owner_name,:endpoint_url)");
    $webhook=$pdo->prepare("INSERT IGNORE INTO integration_webhook_routes (integration_key,route_path,signing_required,status) VALUES (:integration_key,:route_path,1,'disabled')");
    foreach (integrationDefinitions() as $definition) {
        $registry->execute([':integration_key'=>$definition[0],':provider_name'=>$definition[1],':domain_name'=>$definition[2],':description'=>$definition[3],':requires_secret'=>$definition[4],':supports_webhook'=>$definition[5],':default_endpoint'=>$definition[6],':default_owner'=>$definition[7],':sort_order'=>$definition[8]]);
        $connection->execute([':integration_key'=>$definition[0],':owner_name'=>$definition[7],':endpoint_url'=>$definition[6]]);
        if ($definition[5]) $webhook->execute([':integration_key'=>$definition[0],':route_path'=>'/webhooks/'.$definition[0]]);
    }
}

function integrationAudit(PDO $pdo, string $key, string $eventType, string $note): void
{
    $query=$pdo->prepare('INSERT INTO integration_audit_events (integration_key,event_type,actor_name,note) VALUES (:integration_key,:event_type,:actor_name,:note)');
    $query->execute([':integration_key'=>$key,':event_type'=>$eventType,':actor_name'=>'authenticated admin',':note'=>integrationText($note,2000)]);
}

function integrationDiscovery(PDO $pdo): array
{
    $found=[];
    if (integrationTableExists($pdo,'meta_ads_connection')) {
        $row=$pdo->query('SELECT ad_account_id,account_name,connection_status,last_sync_at,last_error,token_hint FROM meta_ads_connection WHERE id=1')->fetch(PDO::FETCH_ASSOC) ?: [];
        if (($row['connection_status']??'') === 'connected') $found['meta_ads']=['connected'=>true,'reference'=>$row['ad_account_id']??'','source'=>'Meta Ads module','last_seen_at'=>$row['last_sync_at']??null,'error'=>$row['last_error']??null,'credential_hint'=>$row['token_hint']??''];
    }
    if (integrationTableExists($pdo,'tracking_attribution_settings')) {
        $row=$pdo->query('SELECT gtm_container_id,ga4_measurement_id,meta_pixel_id,updated_at FROM tracking_attribution_settings WHERE id=1')->fetch(PDO::FETCH_ASSOC) ?: [];
        $map=['gtm'=>'gtm_container_id','ga4'=>'ga4_measurement_id','meta_pixel'=>'meta_pixel_id'];
        foreach ($map as $key=>$column) if (trim((string)($row[$column]??''))!=='') $found[$key]=['connected'=>true,'reference'=>$row[$column],'source'=>'Tracking & Attribution','last_seen_at'=>$row['updated_at']??null,'error'=>null,'credential_hint'=>''];
    }
    return $found;
}

function readIntegrationsState(PDO $pdo): array
{
    $discovery=integrationDiscovery($pdo);
    $rows=$pdo->query('SELECT r.*,c.environment,c.lifecycle,c.owner_name,c.public_reference,c.endpoint_url,c.secret_hint,c.version,c.last_local_test_at,c.last_test_result,c.last_error,c.activated_at,c.updated_at,(c.encrypted_secret IS NOT NULL AND c.encrypted_secret<>\'\') credential_stored,w.route_path,w.signing_required,w.status webhook_status,w.last_event_at FROM integration_registry r JOIN integration_connections c ON c.integration_key=r.integration_key LEFT JOIN integration_webhook_routes w ON w.integration_key=r.integration_key ORDER BY r.sort_order,r.id')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    foreach ($rows as &$row) {
        $key=(string)$row['integration_key']; $derived=$discovery[$key]??null;
        $row['discovered_connected']=$derived !== null;
        $row['discovery_source']=$derived['source']??'';
        $row['discovered_reference']=$derived['reference']??'';
        $row['discovered_last_seen_at']=$derived['last_seen_at']??null;
        $row['effective_status']=$derived !== null ? 'connected' : (string)$row['lifecycle'];
        if ($derived !== null && $row['public_reference']==='') $row['public_reference']=$derived['reference']??'';
        if ($derived !== null && $row['secret_hint']==='') $row['secret_hint']=$derived['credential_hint']??'';
        $row['credential_stored']=(bool)$row['credential_stored'];
    }
    unset($row);
    $tests=$pdo->query('SELECT t.id,t.integration_key,t.test_type,t.result,t.checks_json,t.note,t.tested_by,t.created_at,r.provider_name FROM integration_test_runs t JOIN integration_registry r ON r.integration_key=t.integration_key ORDER BY t.id DESC LIMIT 200')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    foreach ($tests as &$test) { $decoded=json_decode((string)$test['checks_json'],true); $test['checks']=is_array($decoded)?$decoded:[]; unset($test['checks_json']); }
    unset($test);
    $activity=$pdo->query('SELECT a.id,a.integration_key,a.event_type,a.actor_name,a.note,a.created_at,r.provider_name FROM integration_audit_events a JOIN integration_registry r ON r.integration_key=a.integration_key ORDER BY a.id DESC LIMIT 200')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $webhooks=$pdo->query('SELECT w.id,w.integration_key,w.route_path,w.signing_required,w.status,w.last_event_at,w.version,r.provider_name,r.domain_name FROM integration_webhook_routes w JOIN integration_registry r ON r.integration_key=w.integration_key ORDER BY r.sort_order')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $summary=['connections'=>count($rows),'connected'=>0,'active'=>0,'setup_required'=>0,'credentials'=>0,'tests_30d'=>(int)$pdo->query('SELECT COUNT(*) FROM integration_test_runs WHERE created_at>=DATE_SUB(NOW(),INTERVAL 30 DAY)')->fetchColumn(),'failed_tests_30d'=>(int)$pdo->query("SELECT COUNT(*) FROM integration_test_runs WHERE result='failed' AND created_at>=DATE_SUB(NOW(),INTERVAL 30 DAY)")->fetchColumn()];
    foreach ($rows as $row) { if ($row['effective_status']==='connected') $summary['connected']++; if (in_array($row['effective_status'],['connected','active'],true)) $summary['active']++; if (in_array($row['effective_status'],['setup','draft','error'],true)) $summary['setup_required']++; if ($row['credential_stored'] || $row['secret_hint']!=='') $summary['credentials']++; }
    return ['engine'=>['mode'=>'encrypted_registry','credential_storage'=>'xampp_private_directory','timezone'=>'Asia/Dhaka'],'capabilities'=>['admin_auth'=>is_file(__DIR__.'/admin_auth.php'),'encryption'=>function_exists('openssl_encrypt'),'discovery'=>true,'audit'=>true],'summary'=>$summary,'connections'=>$rows,'tests'=>$tests,'webhooks'=>$webhooks,'activity'=>$activity,'generated_at'=>date(DATE_ATOM)];
}

function integrationDefinition(PDO $pdo, string $key): array
{
    $query=$pdo->prepare('SELECT * FROM integration_registry WHERE integration_key=:key'); $query->execute([':key'=>$key]);
    $row=$query->fetch(PDO::FETCH_ASSOC);
    if (!is_array($row)) integrationJson(404,['success'=>false,'message'=>'Integration provider was not found.']);
    return $row;
}

function integrationConnection(PDO $pdo, string $key): array
{
    $query=$pdo->prepare('SELECT * FROM integration_connections WHERE integration_key=:key'); $query->execute([':key'=>$key]);
    return $query->fetch(PDO::FETCH_ASSOC) ?: [];
}

try {
    $pdo=getDatabaseConnection(); ensureIntegrationTables($pdo);
    if (($_SERVER['REQUEST_METHOD']??'GET')==='GET') integrationJson(200,array_merge(['success'=>true],readIntegrationsState($pdo)));
    if (($_SERVER['REQUEST_METHOD']??'GET')!=='POST') integrationJson(405,['success'=>false,'message'=>'Method not allowed.']);
    $payload=integrationPayload(); $action=integrationText($payload['action']??'',80); $key=integrationText($payload['integration_key']??'',80);
    $definition=integrationDefinition($pdo,$key); $connection=integrationConnection($pdo,$key); $message='Integration registry updated.';

    if ($action==='save_connection') {
        $environment=integrationText($payload['environment']??'sandbox',30); $owner=integrationText($payload['owner_name']??'',190); $reference=integrationText($payload['public_reference']??'',300); $endpoint=integrationText($payload['endpoint_url']??'',500); $secret=integrationText($payload['secret']??'',4000); $reason=integrationText($payload['reason']??'',1000);
        if (!in_array($environment,['production','sandbox','staging'],true)) integrationJson(422,['success'=>false,'message'=>'Choose a supported environment.']);
        if ($owner==='' || $reason==='') integrationJson(422,['success'=>false,'message'=>'Owner and audit reason are required.']);
        if ($endpoint!=='' && filter_var($endpoint,FILTER_VALIDATE_URL)===false) integrationJson(422,['success'=>false,'message'=>'Enter a valid provider endpoint URL.']);
        if ($endpoint!=='' && parse_url($endpoint,PHP_URL_SCHEME)!=='https') integrationJson(422,['success'=>false,'message'=>'Provider endpoints must use HTTPS.']);
        $encrypted=$connection['encrypted_secret']??null; $hint=$connection['secret_hint']??'';
        if ($secret!=='') { $encrypted=integrationEncrypt($secret); $hint=integrationSecretHint($secret); }
        $nextLifecycle=in_array($connection['lifecycle']??'setup',['active','paused'],true)?$connection['lifecycle']:'draft';
        $save=$pdo->prepare('UPDATE integration_connections SET environment=:environment,lifecycle=:lifecycle,owner_name=:owner_name,public_reference=:public_reference,endpoint_url=:endpoint_url,encrypted_secret=:encrypted_secret,secret_hint=:secret_hint,version=version+1,last_test_result=\'never\',last_error=NULL,updated_by=\'authenticated admin\' WHERE integration_key=:key');
        $save->execute([':environment'=>$environment,':lifecycle'=>$nextLifecycle,':owner_name'=>$owner,':public_reference'=>$reference,':endpoint_url'=>$endpoint,':encrypted_secret'=>$encrypted,':secret_hint'=>$hint,':key'=>$key]);
        integrationAudit($pdo,$key,'connection_saved',$reason.' Raw credential was not written to audit.');
        $message='Connection draft saved. Raw credentials remain encrypted and hidden.';
    } elseif ($action==='run_local_test') {
        $connection=integrationConnection($pdo,$key); $discovery=integrationDiscovery($pdo); $checks=[];
        $checks[]=['name'=>'Provider definition','passed'=>true,'detail'=>'Verified registry definition loaded.'];
        $endpoint=(string)($connection['endpoint_url']??''); $endpointPassed=$endpoint==='' || (filter_var($endpoint,FILTER_VALIDATE_URL)!==false && parse_url($endpoint,PHP_URL_SCHEME)==='https');
        $checks[]=['name'=>'HTTPS endpoint','passed'=>$endpointPassed,'detail'=>$endpoint===''?'No outbound endpoint required yet.':($endpointPassed?'HTTPS endpoint is valid.':'Endpoint must use a valid HTTPS URL.')];
        $referencePassed=trim((string)($connection['public_reference']??''))!=='' || isset($discovery[$key]);
        $checks[]=['name'=>'Public reference','passed'=>$referencePassed,'detail'=>$referencePassed?'Provider reference is available.':'Add an account, container, pixel or merchant reference.'];
        $secretPassed=(int)$definition['requires_secret']===0 || trim((string)($connection['encrypted_secret']??''))!=='' || isset($discovery[$key]);
        $checks[]=['name'=>'Protected credential','passed'=>$secretPassed,'detail'=>$secretPassed?'Required credential source is available.':'Add the provider secret before activation.'];
        $passed=true; foreach ($checks as $check) if (!$check['passed']) $passed=false;
        $note=$passed?'Local readiness test passed. No third-party mutation was executed.':'Local readiness test failed. Provider was not contacted.';
        $pdo->beginTransaction();
        try {
            $test=$pdo->prepare('INSERT INTO integration_test_runs (integration_key,test_type,result,checks_json,note) VALUES (:key,\'local_readiness\',:result,:checks,:note)');
            $test->execute([':key'=>$key,':result'=>$passed?'passed':'failed',':checks'=>json_encode($checks,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE),':note'=>$note]);
            $next=$passed?((in_array($connection['lifecycle']??'setup',['active','paused'],true))?$connection['lifecycle']:'ready'):'error';
            $update=$pdo->prepare('UPDATE integration_connections SET lifecycle=:lifecycle,last_local_test_at=NOW(),last_test_result=:result,last_error=:error WHERE integration_key=:key');
            $update->execute([':lifecycle'=>$next,':result'=>$passed?'passed':'failed',':error'=>$passed?null:'Local readiness requirements are incomplete.',':key'=>$key]);
            integrationAudit($pdo,$key,'local_test_run',$note); $pdo->commit();
        } catch (Throwable $testError) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $testError; }
        $message=$note;
    } elseif ($action==='change_lifecycle') {
        $lifecycle=integrationText($payload['lifecycle']??'',30); $reason=integrationText($payload['reason']??'',1000);
        if (!in_array($lifecycle,['active','paused'],true) || $reason==='') integrationJson(422,['success'=>false,'message'=>'Lifecycle and audit reason are required.']);
        $discovery=integrationDiscovery($pdo); if ($lifecycle==='active' && ($connection['last_test_result']??'never')!=='passed' && !isset($discovery[$key])) integrationJson(422,['success'=>false,'message'=>'Run and pass the safe local test before activation.']);
        $update=$pdo->prepare('UPDATE integration_connections SET lifecycle=:lifecycle,activated_at=IF(:lifecycle=\'active\',NOW(),activated_at),version=version+1,last_error=NULL WHERE integration_key=:key');
        $update->execute([':lifecycle'=>$lifecycle,':key'=>$key]); integrationAudit($pdo,$key,'lifecycle_changed',$reason.' New state: '.$lifecycle.'. No provider action was executed.');
        $message=$lifecycle==='active'?'Registry connection activated. No third-party action was executed.':'Registry connection paused. Saved credential remains encrypted.';
    } elseif ($action==='change_webhook') {
        if ((int)$definition['supports_webhook']!==1) integrationJson(422,['success'=>false,'message'=>'This provider does not use an inbound webhook in this registry.']);
        $status=integrationText($payload['status']??'',30); $reason=integrationText($payload['reason']??'',1000);
        if (!in_array($status,['disabled','ready'],true) || $reason==='') integrationJson(422,['success'=>false,'message'=>'Webhook state and audit reason are required.']);
        if ($status==='ready' && ($connection['last_test_result']??'never')!=='passed') integrationJson(422,['success'=>false,'message'=>'Pass the local readiness test before marking a webhook ready.']);
        $update=$pdo->prepare('UPDATE integration_webhook_routes SET status=:status,version=version+1 WHERE integration_key=:key'); $update->execute([':status'=>$status,':key'=>$key]);
        integrationAudit($pdo,$key,'webhook_state_changed',$reason.' New webhook state: '.$status.'. This did not expose a public route.');
        $message='Webhook registry state saved. No public endpoint was exposed automatically.';
    } else integrationJson(422,['success'=>false,'message'=>'Unknown integration action.']);

    integrationJson(200,array_merge(['success'=>true,'message'=>$message],readIntegrationsState($pdo)));
} catch (Throwable $error) {
    error_log('manage_integrations.php: '.$error->getMessage());
    integrationJson(500,['success'=>false,'message'=>'Integrations registry is unavailable right now. No provider action was executed.']);
}
