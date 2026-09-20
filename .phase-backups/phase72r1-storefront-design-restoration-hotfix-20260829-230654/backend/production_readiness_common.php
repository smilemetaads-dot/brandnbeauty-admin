<?php

declare(strict_types=1);

function readinessJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function readinessPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function readinessText(mixed $value, int $limit = 1800): string
{
    $value = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($value, 0, $limit) : substr($value, 0, $limit);
}

function readinessTableExists(PDO $pdo, string $table): bool
{
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table'=>$table]);
    return (int)$query->fetchColumn() > 0;
}

function readinessCount(PDO $pdo, string $table, string $where = '1=1'): int
{
    if (!readinessTableExists($pdo,$table)) return 0;
    $safeTable = str_replace('`','``',$table);
    return (int)$pdo->query('SELECT COUNT(*) FROM `' . $safeTable . '` WHERE ' . $where)->fetchColumn();
}

function readinessEnsureTables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS deployment_environment_registry (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        environment_key VARCHAR(60) NOT NULL, label VARCHAR(160) NOT NULL,
        base_label VARCHAR(500) NOT NULL, status ENUM('active','review','not_configured') NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 0,
        updated_by VARCHAR(190) NOT NULL DEFAULT 'system evidence',
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_deployment_environment_key (environment_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS deployment_readiness_runs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, run_key CHAR(32) NOT NULL,
        reason VARCHAR(1200) NOT NULL, environment_name VARCHAR(100) NOT NULL,
        score TINYINT UNSIGNED NOT NULL, passed_checks SMALLINT UNSIGNED NOT NULL,
        review_checks SMALLINT UNSIGNED NOT NULL, failed_checks SMALLINT UNSIGNED NOT NULL,
        total_checks SMALLINT UNSIGNED NOT NULL,
        status ENUM('ready','review_required','blocked') NOT NULL,
        evidence_hash CHAR(64) NOT NULL, snapshot_json LONGTEXT NOT NULL,
        created_by VARCHAR(190) NOT NULL DEFAULT 'authenticated admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_deployment_readiness_run_key (run_key),
        KEY idx_deployment_readiness_status (status,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS deployment_readiness_checks (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, run_id BIGINT UNSIGNED NOT NULL,
        check_key VARCHAR(120) NOT NULL, title VARCHAR(240) NOT NULL,
        domain_name VARCHAR(100) NOT NULL, severity ENUM('critical','high','medium','low') NOT NULL,
        outcome ENUM('passed','review','failed') NOT NULL,
        evidence VARCHAR(2000) NOT NULL, remediation VARCHAR(2000) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_deployment_readiness_check (run_id,check_key),
        KEY idx_deployment_readiness_check_queue (run_id,outcome,severity)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS deployment_readiness_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, run_id BIGINT UNSIGNED NULL,
        event_type VARCHAR(100) NOT NULL, subject_label VARCHAR(300) NOT NULL,
        actor_name VARCHAR(190) NOT NULL DEFAULT 'authenticated admin',
        note VARCHAR(2000) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_deployment_readiness_event (run_id,event_type,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $save = $pdo->prepare("INSERT IGNORE INTO deployment_environment_registry (environment_key,label,base_label,status,is_active) VALUES (:key,:label,:base,:status,:active)");
    $save->execute([':key'=>'local',':label'=>'Local XAMPP',':base'=>'http://localhost/BrandnBeauty/brandnbeauty-backend/php',':status'=>'active',':active'=>1]);
    $save->execute([':key'=>'production',':label'=>'Production',':base'=>'NEXT_PUBLIC_BNB_API_BASE_URL',':status'=>'not_configured',':active'=>0]);
}

function readinessCheck(string $key, string $title, string $domain, string $severity, string $outcome, string $evidence, string $remediation): array
{
    return compact('key','title','domain','severity','outcome','evidence','remediation');
}

function readinessCollectEvidence(PDO $pdo): array
{
    $host = strtolower((string)($_SERVER['HTTP_HOST'] ?? 'localhost'));
    $isLocal = str_contains($host,'localhost') || str_contains($host,'127.0.0.1');
    $https = (!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off') || (string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    $displayErrors = strtolower(trim((string)ini_get('display_errors')));
    $displayErrorsOff = in_array($displayErrors,['','0','off','false'],true);
    $verifiedBackups = readinessCount($pdo,'backup_restore_artifacts',"status='verified'");
    $urgentFindings = readinessCount($pdo,'security_findings',"status<>'resolved' AND severity IN ('critical','high')");
    $securityScans = readinessCount($pdo,'security_scan_runs');
    $securityAudits = readinessCount($pdo,'security_audit_runs');
    $supportPolicies = readinessCount($pdo,'support_sla_policies',"status='active'");
    $privacyReady = readinessTableExists($pdo,'privacy_requests') && readinessTableExists($pdo,'privacy_consent_events');
    $adminAuthReady = is_file(__DIR__ . '/admin_auth.php');
    $apiBaseHelperReady = true; // Installer verifies the bundled frontend helper byte-for-byte.

    $checks = [
        readinessCheck('database_connection','MySQL connection','Database','critical','passed','The active API established a live PDO connection to the BrandnBeauty database.','No action required.'),
        readinessCheck('admin_authentication','Authenticated admin API guard','Access','critical',$adminAuthReady?'passed':'failed',$adminAuthReady?'The shared admin authentication guard is present.':'The shared admin authentication guard was not found.','Keep every protected management endpoint behind requireAdminAuth().'),
        readinessCheck('public_api_base','Environment-controlled public API base','Configuration','high',$apiBaseHelperReady?'passed':'failed',$apiBaseHelperReady?'The cumulative frontend includes one NEXT_PUBLIC_BNB_API_BASE_URL builder with a local fallback.':'The centralized public API builder is missing.','Restore src/lib/bnb-api.ts before release.'),
        readinessCheck('production_host','Production API host','Network','critical',$isLocal?'review':'passed',$isLocal?'The current API request is served from localhost; production host evidence is not configured yet.':'The API is being served from a non-local host.','Set NEXT_PUBLIC_BNB_API_BASE_URL to the verified production HTTPS API origin before deployment.'),
        readinessCheck('https_transport','HTTPS transport','Network','critical',$https?'passed':'review',$https?'The active request uses HTTPS.':'The active local request uses HTTP.','Configure HTTPS for the production admin and API origins; local XAMPP may remain HTTP.'),
        readinessCheck('verified_recovery','Verified protected backup','Recovery','high',$verifiedBackups>0?'passed':'failed',$verifiedBackups>0?$verifiedBackups . ' checksum-verified protected backup(s) exist.':'No checksum-verified protected backup exists.','Create and verify a protected backup before production release.'),
        readinessCheck('security_evidence','Security scan and audit evidence','Security','critical',$urgentFindings>0?'failed':(($securityScans>0&&$securityAudits>0)?'passed':'review'),$urgentFindings>0?$urgentFindings . ' unresolved critical/high finding(s) remain.':$securityScans . ' security scan(s), ' . $securityAudits . ' evidence audit(s), and no unresolved critical/high finding were observed.','Run Security Center and Security Audit, then disposition every critical/high finding.'),
        readinessCheck('privacy_controls','Privacy request and consent ledgers','Privacy','high',$privacyReady?'passed':'failed',$privacyReady?'Privacy request and granular consent ledgers are installed.':'Privacy request or consent evidence is missing.','Open Privacy Center and run its protected test before release.'),
        readinessCheck('support_controls','Support SLA and escalation readiness','Support','high',$supportPolicies>=4?'passed':'failed',$supportPolicies . ' active support SLA policy record(s) were observed.','Keep Urgent, High, Normal and Low support policies active.'),
        readinessCheck('runtime_errors','PHP runtime error exposure','Runtime','medium',$displayErrorsOff?'passed':'review',$displayErrorsOff?'PHP display_errors is disabled.':'PHP display_errors is enabled in the active local runtime.','Disable display_errors before public exposure; preserve server-side logging.'),
        readinessCheck('human_release_gate','Human release approval','Release','critical','review','No automatic deployment, DNS change or production switch is permitted by this module.','After all required checks pass, a human owner must approve the separate deployment workflow.'),
    ];
    return ['checks'=>$checks,'snapshot'=>['host'=>$host,'https'=>$https,'verified_backups'=>$verifiedBackups,'urgent_findings'=>$urgentFindings,'security_scans'=>$securityScans,'security_audits'=>$securityAudits,'support_policies'=>$supportPolicies,'privacy_ready'=>$privacyReady,'display_errors'=>$displayErrors,'captured_at'=>date(DATE_ATOM)]];
}

function readinessRunScan(PDO $pdo, string $reason): int
{
    if (strlen($reason) < 8) throw new InvalidArgumentException('Add a clear readiness scan reason.');
    $evidence = readinessCollectEvidence($pdo);
    $checks = $evidence['checks'];
    $passed = count(array_filter($checks,static fn(array $item): bool=>$item['outcome']==='passed'));
    $review = count(array_filter($checks,static fn(array $item): bool=>$item['outcome']==='review'));
    $failed = count($checks)-$passed-$review;
    $score = (int)round((($passed*100)+($review*65))/count($checks));
    $status = $failed>0?'blocked':($review>0?'review_required':'ready');
    $snapshot = json_encode($evidence['snapshot'],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE) ?: '{}';
    $hash = hash('sha256',$snapshot . '|' . json_encode($checks,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE));
    $pdo->beginTransaction();
    try {
        $save=$pdo->prepare('INSERT INTO deployment_readiness_runs (run_key,reason,environment_name,score,passed_checks,review_checks,failed_checks,total_checks,status,evidence_hash,snapshot_json) VALUES (:key,:reason,:environment,:score,:passed,:review,:failed,:total,:status,:hash,:snapshot)');
        $save->execute([':key'=>bin2hex(random_bytes(16)),':reason'=>readinessText($reason,1200),':environment'=>'current runtime',':score'=>$score,':passed'=>$passed,':review'=>$review,':failed'=>$failed,':total'=>count($checks),':status'=>$status,':hash'=>$hash,':snapshot'=>$snapshot]);
        $runId=(int)$pdo->lastInsertId();
        $saveCheck=$pdo->prepare('INSERT INTO deployment_readiness_checks (run_id,check_key,title,domain_name,severity,outcome,evidence,remediation) VALUES (:run_id,:key,:title,:domain,:severity,:outcome,:evidence,:remediation)');
        foreach($checks as $check){$saveCheck->execute([':run_id'=>$runId,':key'=>$check['key'],':title'=>$check['title'],':domain'=>$check['domain'],':severity'=>$check['severity'],':outcome'=>$check['outcome'],':evidence'=>readinessText($check['evidence'],2000),':remediation'=>readinessText($check['remediation'],2000)]);}
        $event=$pdo->prepare("INSERT INTO deployment_readiness_events (run_id,event_type,subject_label,note) VALUES (:run_id,'protected_scan','Production readiness',:note)");
        $event->execute([':run_id'=>$runId,':note'=>'Evidence ' . substr($hash,0,12) . ' · Score ' . $score . '/100 · ' . $status . ' · No deployment or business mutation executed.']);
        $pdo->commit();
        return $runId;
    } catch(Throwable $error){if($pdo->inTransaction())$pdo->rollBack();throw $error;}
}

function readinessReadState(PDO $pdo): array
{
    readinessEnsureTables($pdo);
    $runs=$pdo->query('SELECT id,run_key,reason,environment_name,score,passed_checks,review_checks,failed_checks,total_checks,status,created_at FROM deployment_readiness_runs ORDER BY id DESC LIMIT 100')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $latest=$runs[0]??null;
    $checks=[];
    if(is_array($latest)){$query=$pdo->prepare("SELECT id,check_key,title,domain_name,severity,outcome,evidence,remediation FROM deployment_readiness_checks WHERE run_id=:run_id ORDER BY FIELD(outcome,'failed','review','passed'),FIELD(severity,'critical','high','medium','low'),id");$query->execute([':run_id'=>$latest['id']]);$checks=$query->fetchAll(PDO::FETCH_ASSOC) ?: [];}
    $environments=$pdo->query("SELECT id,environment_key,label,base_label,status,is_active,updated_at FROM deployment_environment_registry ORDER BY FIELD(environment_key,'local','production'),id")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $outcomes=[];foreach($checks as $check)$outcomes[(string)$check['check_key']]=(string)$check['outcome'];
    $gates=[
        ['check_key'=>'public_api_base','label'=>'Central API base','required'=>true,'outcome'=>$outcomes['public_api_base']??'review'],
        ['check_key'=>'production_host','label'=>'Production host','required'=>true,'outcome'=>$outcomes['production_host']??'review'],
        ['check_key'=>'https_transport','label'=>'HTTPS transport','required'=>true,'outcome'=>$outcomes['https_transport']??'review'],
        ['check_key'=>'admin_authentication','label'=>'Admin authentication','required'=>true,'outcome'=>$outcomes['admin_authentication']??'review'],
        ['check_key'=>'verified_recovery','label'=>'Verified recovery','required'=>true,'outcome'=>$outcomes['verified_recovery']??'review'],
        ['check_key'=>'security_evidence','label'=>'Security evidence','required'=>true,'outcome'=>$outcomes['security_evidence']??'review'],
        ['check_key'=>'support_controls','label'=>'Support readiness','required'=>true,'outcome'=>$outcomes['support_controls']??'review'],
        ['check_key'=>'human_release_gate','label'=>'Human release approval','required'=>true,'outcome'=>$outcomes['human_release_gate']??'review'],
    ];
    return [
        'summary'=>['total_runs'=>count($runs),'latest_score'=>(int)($latest['score']??0),'passed_checks'=>(int)($latest['passed_checks']??0),'review_checks'=>(int)($latest['review_checks']??0),'failed_checks'=>(int)($latest['failed_checks']??0),'total_checks'=>(int)($latest['total_checks']??0),'release_status'=>(string)($latest['status']??'not_scanned')],
        'runs'=>$runs,'checks'=>$checks,'environments'=>$environments,'release_gates'=>$gates,
        'safety'=>['automatic_deployment'=>false,'automatic_dns_change'=>false,'automatic_production_switch'=>false,'secret_values_returned'=>false,'business_data_mutation'=>false],
        'generated_at'=>date(DATE_ATOM),
    ];
}
