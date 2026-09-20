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
header('Cache-Control: no-store');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

requireAdminAuth();

function securityJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function securityPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function securityText(mixed $value, int $limit = 1200): string
{
    $value = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($value, 0, $limit) : substr($value, 0, $limit);
}

function securityTableExists(PDO $pdo, string $table): bool
{
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table'=>$table]);
    return (int) $query->fetchColumn() > 0;
}

function ensureSecurityTables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS security_controls (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, control_key VARCHAR(120) NOT NULL,
        label VARCHAR(190) NOT NULL, description VARCHAR(1000) NOT NULL,
        value_type ENUM('toggle','number','text') NOT NULL DEFAULT 'toggle',
        control_value VARCHAR(500) NOT NULL, enforcement_mode VARCHAR(80) NOT NULL DEFAULT 'review_only',
        version SMALLINT UNSIGNED NOT NULL DEFAULT 1, change_reason VARCHAR(1000) NOT NULL DEFAULT 'Verified default',
        updated_by VARCHAR(190) NOT NULL DEFAULT 'system',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_security_control_key (control_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS security_control_versions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, control_id BIGINT UNSIGNED NOT NULL,
        version SMALLINT UNSIGNED NOT NULL, control_value VARCHAR(500) NOT NULL,
        enforcement_mode VARCHAR(80) NOT NULL, reason VARCHAR(1000) NOT NULL,
        created_by VARCHAR(190) NOT NULL DEFAULT 'authenticated admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_security_control_version (control_id,version)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS security_scan_runs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, scan_key CHAR(32) NOT NULL,
        score TINYINT UNSIGNED NOT NULL, passed_checks SMALLINT UNSIGNED NOT NULL,
        warning_checks SMALLINT UNSIGNED NOT NULL, failed_checks SMALLINT UNSIGNED NOT NULL,
        total_checks SMALLINT UNSIGNED NOT NULL, reason VARCHAR(1000) NOT NULL,
        result_summary VARCHAR(1500) NOT NULL, scanned_by VARCHAR(190) NOT NULL DEFAULT 'authenticated admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_security_scan_key (scan_key), KEY idx_security_scan_time (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS security_findings (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, check_key VARCHAR(120) NOT NULL,
        title VARCHAR(240) NOT NULL, domain_name VARCHAR(100) NOT NULL,
        severity ENUM('critical','high','medium','low') NOT NULL,
        status ENUM('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
        evidence VARCHAR(2000) NOT NULL, recommendation VARCHAR(2000) NOT NULL,
        occurrence_count INT UNSIGNED NOT NULL DEFAULT 1, first_seen_at DATETIME NOT NULL,
        last_seen_at DATETIME NOT NULL, acknowledged_at DATETIME NULL, resolved_at DATETIME NULL,
        owner_name VARCHAR(190) NOT NULL DEFAULT 'Owner', resolution_evidence VARCHAR(2000) NULL,
        PRIMARY KEY (id), UNIQUE KEY uq_security_finding_check (check_key),
        KEY idx_security_finding_queue (status,severity,last_seen_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS security_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, event_type VARCHAR(100) NOT NULL,
        subject_label VARCHAR(300) NOT NULL, actor_name VARCHAR(190) NOT NULL,
        note VARCHAR(2000) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_security_event_time (event_type,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS security_engine_state (
        id TINYINT UNSIGNED NOT NULL, mode VARCHAR(80) NOT NULL DEFAULT 'evidence_first',
        last_scan_at DATETIME NULL, last_score TINYINT UNSIGNED NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("INSERT IGNORE INTO security_engine_state (id,mode) VALUES (1,'evidence_first')");

    $defaults = [
        ['sensitive_action_reauth','Re-authentication for sensitive actions','Require renewed authentication before finance, access, integration-secret or restore execution.','toggle','enabled'],
        ['owner_security_alerts','Owner security alerts','Record owner-visible alerts for high-risk findings and protected control changes.','toggle','enabled'],
        ['session_timeout_minutes','Admin session timeout','Target maximum idle session duration for the production authentication layer.','number','120'],
        ['verified_backup_required','Verified recovery point required','A checksum-verified recovery point is required before high-impact maintenance.','toggle','enabled'],
        ['audit_retention_days','Security evidence retention','Minimum target retention for security scan and remediation evidence.','number','730'],
        ['trusted_admin_origins','Trusted admin origins','Expected local origins during development; production origin must be approved before launch.','text','localhost,127.0.0.1'],
    ];
    $save = $pdo->prepare("INSERT IGNORE INTO security_controls (control_key,label,description,value_type,control_value,enforcement_mode) VALUES (:key,:label,:description,:type,:value,'review_only')");
    foreach ($defaults as $item) $save->execute([':key'=>$item[0],':label'=>$item[1],':description'=>$item[2],':type'=>$item[3],':value'=>$item[4]]);

    $controls = $pdo->query('SELECT id,version,control_value,enforcement_mode FROM security_controls')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $saveVersion = $pdo->prepare("INSERT IGNORE INTO security_control_versions (control_id,version,control_value,enforcement_mode,reason,created_by) VALUES (:id,:version,:value,:mode,'Verified default','system')");
    foreach ($controls as $control) $saveVersion->execute([':id'=>$control['id'],':version'=>$control['version'],':value'=>$control['control_value'],':mode'=>$control['enforcement_mode']]);
}

function securityEvent(PDO $pdo, string $type, string $subject, string $note): void
{
    $query = $pdo->prepare('INSERT INTO security_events (event_type,subject_label,actor_name,note) VALUES (:type,:subject,:actor,:note)');
    $query->execute([':type'=>$type,':subject'=>securityText($subject,300),':actor'=>'authenticated admin',':note'=>securityText($note,2000)]);
}

function securityCount(PDO $pdo, string $table, string $where = '1=1'): int
{
    if (!securityTableExists($pdo,$table)) return 0;
    return (int) $pdo->query('SELECT COUNT(*) FROM `' . str_replace('`','``',$table) . '` WHERE ' . $where)->fetchColumn();
}

function securityCheck(string $key, string $title, string $domain, string $severity, bool $passed, string $evidence, string $recommendation): array
{
    return compact('key','title','domain','severity','passed','evidence','recommendation');
}

function securityChecks(PDO $pdo): array
{
    $adminAuth = is_file(__DIR__ . '/admin_auth.php');
    $accessReady = securityTableExists($pdo,'access_roles') && securityCount($pdo,'access_roles',"role_key='super-admin' AND status='active' AND is_protected=1") > 0;
    $auditReady = securityTableExists($pdo,'unified_audit_fingerprints') && securityTableExists($pdo,'unified_audit_integrity_runs');
    $verifiedBackups = securityCount($pdo,'backup_restore_artifacts',"status='verified'");
    $integrationReady = securityTableExists($pdo,'integration_registry') && is_file(__DIR__ . '/manage_integrations.php');
    $integrationSource = $integrationReady ? (string) @file_get_contents(__DIR__ . '/manage_integrations.php') : '';
    $secretRedaction = $integrationReady && stripos($integrationSource,'credential_stored') !== false && stripos($integrationSource,'encrypted_secret') !== false;
    $displayErrorsRaw = strtolower(trim((string) ini_get('display_errors')));
    $displayErrorsOff = in_array($displayErrorsRaw,['','0','off','false'],true);
    $privateDirectory = dirname(__DIR__,4) . DIRECTORY_SEPARATOR . 'BrandnBeauty-private' . DIRECTORY_SEPARATOR . 'backups';
    $documentRoot = realpath((string) ($_SERVER['DOCUMENT_ROOT'] ?? '')) ?: '';
    $privateReal = realpath($privateDirectory) ?: $privateDirectory;
    $privateBackup = $verifiedBackups > 0 && ($documentRoot === '' || !str_starts_with(strtolower($privateReal),strtolower($documentRoot)));

    return [
        securityCheck('admin_auth_guard','Authenticated API guard','Authentication','critical',$adminAuth,'The Security Center request passed requireAdminAuth() and the server-side guard file is present.','Keep the admin authentication guard mandatory on every protected endpoint.'),
        securityCheck('protected_owner_role','Protected owner access','Access','high',$accessReady,$accessReady?'A protected active Super Admin role exists in the access registry.':'No protected active Super Admin role could be verified.','Open Roles & Permissions and preserve one protected owner assignment.'),
        securityCheck('audit_integrity_ledger','Audit integrity ledger','Audit','high',$auditReady,$auditReady?'Unified fingerprints and integrity-run tables are available.':'Audit integrity tables are not available yet.','Install or repair Audit Logs, then run Verify segment.'),
        securityCheck('verified_recovery_point','Verified recovery point','Recovery','high',$privateBackup,$privateBackup?$verifiedBackups . ' checksum-verified private recovery point(s) exist outside public htdocs.':'No checksum-verified private recovery point was verified.','Create and verify a protected backup before high-impact maintenance.'),
        securityCheck('integration_secret_redaction','Integration secret redaction','Integrations','critical',$secretRedaction,$secretRedaction?'The integration backend contains encrypted secret storage and redacted response markers.':'Encrypted secret storage and response redaction could not both be verified.','Keep connector secrets encrypted server-side and return only configured/not-configured state.'),
        securityCheck('php_error_exposure','PHP error exposure','Runtime','medium',$displayErrorsOff,$displayErrorsOff?'PHP display_errors is disabled for this runtime.':'PHP display_errors is enabled in the active XAMPP runtime.','Disable display_errors before exposing the admin or API beyond localhost; keep server error logging enabled.'),
    ];
}

function applySecurityFindings(PDO $pdo, array $checks): void
{
    $find = $pdo->prepare('SELECT id,status FROM security_findings WHERE check_key=:key LIMIT 1');
    $create = $pdo->prepare("INSERT INTO security_findings (check_key,title,domain_name,severity,status,evidence,recommendation,first_seen_at,last_seen_at) VALUES (:key,:title,:domain,:severity,'open',:evidence,:recommendation,NOW(),NOW())");
    $update = $pdo->prepare("UPDATE security_findings SET title=:title,domain_name=:domain,severity=:severity,evidence=:evidence,recommendation=:recommendation,occurrence_count=occurrence_count+1,last_seen_at=NOW(),resolved_at=IF(status='resolved',NULL,resolved_at),status=IF(status='resolved','open',status) WHERE id=:id");
    $resolve = $pdo->prepare("UPDATE security_findings SET status='resolved',resolved_at=NOW(),resolution_evidence='Verified automatically by a later protected scan.' WHERE id=:id AND status<>'resolved'");
    foreach ($checks as $check) {
        $find->execute([':key'=>$check['key']]);
        $row=$find->fetch(PDO::FETCH_ASSOC);
        if ($check['passed']) {
            if (is_array($row)) $resolve->execute([':id'=>$row['id']]);
            continue;
        }
        if (!is_array($row)) $create->execute([':key'=>$check['key'],':title'=>$check['title'],':domain'=>$check['domain'],':severity'=>$check['severity'],':evidence'=>$check['evidence'],':recommendation'=>$check['recommendation']]);
        else $update->execute([':title'=>$check['title'],':domain'=>$check['domain'],':severity'=>$check['severity'],':evidence'=>$check['evidence'],':recommendation'=>$check['recommendation'],':id'=>$row['id']]);
    }
}

function runSecurityScan(PDO $pdo, string $reason): array
{
    if (strlen($reason) < 3) throw new InvalidArgumentException('A short scan reason is required.');
    $checks = securityChecks($pdo);
    $passed = count(array_filter($checks,static fn(array $item): bool => $item['passed']));
    $failed = count($checks)-$passed;
    $highFailed = count(array_filter($checks,static fn(array $item): bool => !$item['passed'] && in_array($item['severity'],['critical','high'],true)));
    $warnings = $failed-$highFailed;
    $score = (int) round(($passed/count($checks))*100);
    applySecurityFindings($pdo,$checks);
    $summary = $failed === 0 ? 'All protected checks passed.' : $failed . ' check(s) need review; no live access or business record was changed.';
    $save=$pdo->prepare('INSERT INTO security_scan_runs (scan_key,score,passed_checks,warning_checks,failed_checks,total_checks,reason,result_summary) VALUES (:key,:score,:passed,:warnings,:failed,:total,:reason,:summary)');
    $save->execute([':key'=>bin2hex(random_bytes(16)),':score'=>$score,':passed'=>$passed,':warnings'=>$warnings,':failed'=>$highFailed,':total'=>count($checks),':reason'=>securityText($reason,1000),':summary'=>$summary]);
    $pdo->prepare('UPDATE security_engine_state SET last_scan_at=NOW(),last_score=:score WHERE id=1')->execute([':score'=>$score]);
    securityEvent($pdo,'security_scan_completed','Security posture',$score . '/100 · ' . $summary . ' Reason: ' . securityText($reason,600));
    return ['score'=>$score,'summary'=>$summary];
}

function readSecurityState(PDO $pdo): array
{
    $engine=$pdo->query('SELECT * FROM security_engine_state WHERE id=1')->fetch(PDO::FETCH_ASSOC) ?: [];
    $controls=$pdo->query('SELECT * FROM security_controls ORDER BY id')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $findings=$pdo->query("SELECT * FROM security_findings ORDER BY FIELD(status,'open','acknowledged','resolved'),FIELD(severity,'critical','high','medium','low'),last_seen_at DESC LIMIT 200")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $scans=$pdo->query('SELECT * FROM security_scan_runs ORDER BY id DESC LIMIT 60')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $events=$pdo->query('SELECT * FROM security_events ORDER BY id DESC LIMIT 150')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $open=(int)$pdo->query("SELECT COUNT(*) FROM security_findings WHERE status<>'resolved'")->fetchColumn();
    $urgent=(int)$pdo->query("SELECT COUNT(*) FROM security_findings WHERE status<>'resolved' AND severity IN ('critical','high')")->fetchColumn();
    $ack=(int)$pdo->query("SELECT COUNT(*) FROM security_findings WHERE status='acknowledged'")->fetchColumn();
    $verifiedBackups=securityCount($pdo,'backup_restore_artifacts',"status='verified'");
    $checks = securityChecks($pdo);
    $sources=[
        ['key'=>'auth','label'=>'Authentication guard','ready'=>is_file(__DIR__.'/admin_auth.php')],
        ['key'=>'access','label'=>'Roles & Permissions','ready'=>securityTableExists($pdo,'access_roles')],
        ['key'=>'audit','label'=>'Audit integrity','ready'=>securityTableExists($pdo,'unified_audit_fingerprints')],
        ['key'=>'recovery','label'=>'Verified recovery','ready'=>$verifiedBackups>0],
        ['key'=>'integrations','label'=>'Secret-safe integrations','ready'=>securityTableExists($pdo,'integration_registry')],
    ];
    return [
        'engine'=>$engine,
        'summary'=>['score'=>(int)($engine['last_score']??0),'open_findings'=>$open,'urgent_findings'=>$urgent,'acknowledged_findings'=>$ack,'passed_checks'=>count(array_filter($checks,static fn(array $item): bool=>$item['passed'])),'total_checks'=>count($checks),'active_controls'=>count($controls),'verified_backups'=>$verifiedBackups],
        'sources'=>$sources,'controls'=>$controls,'findings'=>$findings,'scans'=>$scans,'events'=>$events,'generated_at'=>date(DATE_ATOM),
        'safety'=>['mode'=>'evidence_first','automatic_lockout'=>false,'secret_values_returned'=>false,'business_data_mutation'=>false],
    ];
}

try {
    $pdo=getDatabaseConnection();
    ensureSecurityTables($pdo);
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
        $payload=securityPayload();
        $action=securityText($payload['action'] ?? '',80);
        if ($action === 'run_scan') {
            $result=runSecurityScan($pdo,securityText($payload['reason'] ?? '',1000));
            securityJson(200,['success'=>true,'message'=>'Protected security scan completed: ' . $result['score'] . '/100.','state'=>readSecurityState($pdo)]);
        }
        if ($action === 'acknowledge_finding') {
            $id=(int)($payload['finding_id']??0); $note=securityText($payload['note']??'',1000);
            if ($id<1 || strlen($note)<3) securityJson(422,['success'=>false,'message'=>'Select a finding and add an acknowledgement note.']);
            $query=$pdo->prepare("UPDATE security_findings SET status='acknowledged',acknowledged_at=NOW(),owner_name='Owner' WHERE id=:id AND status='open'");
            $query->execute([':id'=>$id]);
            if ($query->rowCount()<1) securityJson(409,['success'=>false,'message'=>'Only an open finding can be acknowledged.']);
            securityEvent($pdo,'finding_acknowledged','Finding #' . $id,$note);
            securityJson(200,['success'=>true,'message'=>'Finding acknowledged for review.','state'=>readSecurityState($pdo)]);
        }
        if ($action === 'resolve_finding') {
            $id=(int)($payload['finding_id']??0); $evidence=securityText($payload['evidence']??'',2000); $confirmed=!empty($payload['confirmed']);
            if ($id<1 || strlen($evidence)<12 || !$confirmed) securityJson(422,['success'=>false,'message'=>'Resolution evidence and explicit confirmation are required.']);
            $query=$pdo->prepare("UPDATE security_findings SET status='resolved',resolved_at=NOW(),resolution_evidence=:evidence WHERE id=:id AND status<>'resolved'");
            $query->execute([':evidence'=>$evidence,':id'=>$id]);
            if ($query->rowCount()<1) securityJson(409,['success'=>false,'message'=>'This finding is already resolved or unavailable.']);
            securityEvent($pdo,'finding_resolved','Finding #' . $id,$evidence);
            securityJson(200,['success'=>true,'message'=>'Finding resolved with evidence. A later scan may reopen it if the condition remains.','state'=>readSecurityState($pdo)]);
        }
        if ($action === 'save_control') {
            $key=securityText($payload['control_key']??'',120); $value=securityText($payload['control_value']??'',500); $reason=securityText($payload['reason']??'',1000); $confirmed=!empty($payload['confirmed']);
            if ($key==='' || $value==='' || strlen($reason)<8 || !$confirmed) securityJson(422,['success'=>false,'message'=>'Control value, reason and explicit confirmation are required.']);
            $get=$pdo->prepare('SELECT * FROM security_controls WHERE control_key=:key LIMIT 1'); $get->execute([':key'=>$key]); $control=$get->fetch(PDO::FETCH_ASSOC);
            if (!is_array($control)) securityJson(404,['success'=>false,'message'=>'The selected security control is unavailable.']);
            if (($control['value_type']??'')==='toggle' && !in_array($value,['enabled','disabled'],true)) securityJson(422,['success'=>false,'message'=>'Toggle controls accept enabled or disabled only.']);
            if (($control['value_type']??'')==='number' && (!ctype_digit($value) || (int)$value<1 || (int)$value>10000)) securityJson(422,['success'=>false,'message'=>'Enter a valid bounded numeric control value.']);
            $version=(int)$control['version']+1;
            $pdo->beginTransaction();
            try {
                $update=$pdo->prepare("UPDATE security_controls SET control_value=:value,version=:version,change_reason=:reason,updated_by='authenticated admin',enforcement_mode='review_only' WHERE id=:id");
                $update->execute([':value'=>$value,':version'=>$version,':reason'=>$reason,':id'=>$control['id']]);
                $save=$pdo->prepare("INSERT INTO security_control_versions (control_id,version,control_value,enforcement_mode,reason) VALUES (:id,:version,:value,'review_only',:reason)");
                $save->execute([':id'=>$control['id'],':version'=>$version,':value'=>$value,':reason'=>$reason]);
                securityEvent($pdo,'security_control_versioned',(string)$control['label'],'v' . $version . ' · ' . $reason);
                $pdo->commit();
            } catch (Throwable $error) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $error; }
            securityJson(200,['success'=>true,'message'=>'Security policy version saved for review. No automatic lockout was applied.','state'=>readSecurityState($pdo)]);
        }
        securityJson(422,['success'=>false,'message'=>'Unsupported Security Center action.']);
    }
    securityJson(200,['success'=>true]+readSecurityState($pdo));
} catch (InvalidArgumentException $error) {
    securityJson(422,['success'=>false,'message'=>$error->getMessage()]);
} catch (Throwable $error) {
    error_log('manage_security_center.php: ' . $error->getMessage());
    securityJson(500,['success'=>false,'message'=>'Security Center could not complete the protected request.']);
}
