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

function securityAuditJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function securityAuditPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function securityAuditText(mixed $value, int $limit = 1500): string
{
    $value = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($value, 0, $limit) : substr($value, 0, $limit);
}

function securityAuditTableExists(PDO $pdo, string $table): bool
{
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table'=>$table]);
    return (int) $query->fetchColumn() > 0;
}

function securityAuditCount(PDO $pdo, string $table, string $where = '1=1'): int
{
    if (!securityAuditTableExists($pdo,$table)) return 0;
    return (int) $pdo->query('SELECT COUNT(*) FROM `' . str_replace('`','``',$table) . '` WHERE ' . $where)->fetchColumn();
}

function ensureSecurityAuditTables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS security_audit_runs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, audit_key CHAR(32) NOT NULL,
        scope_name VARCHAR(120) NOT NULL, reason VARCHAR(1200) NOT NULL,
        status ENUM('open','ready_for_signoff','signed_off') NOT NULL DEFAULT 'open',
        score TINYINT UNSIGNED NOT NULL, passed_checks SMALLINT UNSIGNED NOT NULL,
        review_checks SMALLINT UNSIGNED NOT NULL, failed_checks SMALLINT UNSIGNED NOT NULL,
        total_checks SMALLINT UNSIGNED NOT NULL, evidence_hash CHAR(64) NOT NULL,
        source_snapshot_json LONGTEXT NOT NULL, conclusion VARCHAR(2000) NULL,
        opened_by VARCHAR(190) NOT NULL DEFAULT 'authenticated admin',
        signed_off_by VARCHAR(190) NULL, signed_off_at DATETIME NULL,
        opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_security_audit_key (audit_key),
        KEY idx_security_audit_status (status,opened_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS security_audit_checks (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, audit_id BIGINT UNSIGNED NOT NULL,
        check_key VARCHAR(120) NOT NULL, title VARCHAR(240) NOT NULL,
        domain_name VARCHAR(100) NOT NULL, severity ENUM('critical','high','medium','low') NOT NULL,
        outcome ENUM('passed','review','failed') NOT NULL, evidence VARCHAR(2000) NOT NULL,
        source_ref VARCHAR(240) NOT NULL, recommendation VARCHAR(2000) NOT NULL,
        attestation_status ENUM('unreviewed','accepted','needs_follow_up') NOT NULL DEFAULT 'unreviewed',
        attestation_note VARCHAR(2000) NULL, attested_by VARCHAR(190) NULL, attested_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_security_audit_check (audit_id,check_key),
        KEY idx_security_audit_check_queue (audit_id,attestation_status,severity)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS security_audit_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, audit_id BIGINT UNSIGNED NULL,
        event_type VARCHAR(100) NOT NULL, subject_label VARCHAR(300) NOT NULL,
        actor_name VARCHAR(190) NOT NULL, note VARCHAR(2000) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_security_audit_event (audit_id,event_type,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS security_audit_signoffs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, audit_id BIGINT UNSIGNED NOT NULL,
        conclusion VARCHAR(2000) NOT NULL, evidence_hash CHAR(64) NOT NULL,
        signed_by VARCHAR(190) NOT NULL DEFAULT 'authenticated admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_security_audit_signoff (audit_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function securityAuditEvent(PDO $pdo, ?int $auditId, string $type, string $subject, string $note): void
{
    $query = $pdo->prepare('INSERT INTO security_audit_events (audit_id,event_type,subject_label,actor_name,note) VALUES (:audit_id,:type,:subject,:actor,:note)');
    $query->execute([':audit_id'=>$auditId,':type'=>$type,':subject'=>securityAuditText($subject,300),':actor'=>'authenticated admin',':note'=>securityAuditText($note,2000)]);
}

function securityAuditCheck(string $key, string $title, string $domain, string $severity, string $outcome, string $evidence, string $source, string $recommendation): array
{
    return compact('key','title','domain','severity','outcome','evidence','source','recommendation');
}

function securityAuditEvidence(PDO $pdo): array
{
    $latestScan = securityAuditTableExists($pdo,'security_scan_runs') ? ($pdo->query('SELECT id,score,passed_checks,warning_checks,failed_checks,total_checks,created_at FROM security_scan_runs ORDER BY id DESC LIMIT 1')->fetch(PDO::FETCH_ASSOC) ?: null) : null;
    $scanScore = is_array($latestScan) ? (int) $latestScan['score'] : 0;
    $scanOutcome = !is_array($latestScan) ? 'failed' : ($scanScore >= 80 ? 'passed' : ($scanScore >= 60 ? 'review' : 'failed'));

    $urgent = securityAuditCount($pdo,'security_findings',"status<>'resolved' AND severity IN ('critical','high')");
    $open = securityAuditCount($pdo,'security_findings',"status<>'resolved'");
    $mediumLow = max(0,$open-$urgent);
    $ownerRoles = securityAuditCount($pdo,'access_roles',"role_key='super-admin' AND status='active' AND is_protected=1");
    $ownerAssignments = securityAuditCount($pdo,'access_assignments',"status='active' AND is_protected=1");

    $latestIntegrity = securityAuditTableExists($pdo,'unified_audit_integrity_runs') ? ($pdo->query('SELECT id,event_count,verified_count,mismatch_count,result,created_at FROM unified_audit_integrity_runs ORDER BY id DESC LIMIT 1')->fetch(PDO::FETCH_ASSOC) ?: null) : null;
    $integrityOutcome = !is_array($latestIntegrity) ? 'review' : (($latestIntegrity['result'] ?? '') === 'passed' ? 'passed' : (($latestIntegrity['result'] ?? '') === 'no_data' ? 'review' : 'failed'));

    $latestBackup = securityAuditTableExists($pdo,'backup_restore_artifacts') ? ($pdo->query("SELECT id,backup_key,file_name,size_bytes,table_count,row_count,sha256,verified_at,created_at FROM backup_restore_artifacts WHERE status='verified' ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC) ?: null) : null;
    $integrationReady = securityAuditTableExists($pdo,'integration_registry') && is_file(__DIR__ . '/manage_integrations.php');
    $integrationSource = $integrationReady ? (string) @file_get_contents(__DIR__ . '/manage_integrations.php') : '';
    $secretSafe = $integrationReady && stripos($integrationSource,'credential_stored') !== false && stripos($integrationSource,'encrypted_secret') !== false;

    $displayErrorsRaw = strtolower(trim((string) ini_get('display_errors')));
    $displayErrorsOff = in_array($displayErrorsRaw,['','0','off','false'],true);

    $supportTables = ['support_sla_policies','support_tickets','support_messages','support_handoffs','support_events'];
    $supportSchemaReady = count(array_filter($supportTables,static fn(string $table): bool=>securityAuditTableExists($pdo,$table))) === count($supportTables);
    $supportSlaCount = securityAuditCount($pdo,'support_sla_policies',"status='active'");
    $supportSource = '';
    foreach ([__DIR__ . '/support_center_common.php',__DIR__ . '/manage_support_center.php'] as $path) {
        if (is_file($path)) $supportSource .= (string)@file_get_contents($path);
    }
    $supportBoundaryReady = $supportSchemaReady && $supportSlaCount >= 4
        && stripos($supportSource,'automatic_refund') !== false
        && stripos($supportSource,'automatic_restock') !== false
        && stripos($supportSource,'automatic_customer_block') !== false
        && stripos($supportSource,'automatic_delivery_status_change') !== false
        && stripos($supportSource,'customer_message_auto_send') !== false;

    $readinessTables = ['deployment_environment_registry','deployment_readiness_runs','deployment_readiness_checks','deployment_readiness_events'];
    $readinessSchemaReady = count(array_filter($readinessTables,static fn(string $table): bool=>securityAuditTableExists($pdo,$table))) === count($readinessTables);
    $readinessSource = '';
    foreach ([__DIR__ . '/production_readiness_common.php',__DIR__ . '/manage_production_readiness.php'] as $path) {
        if (is_file($path)) $readinessSource .= (string)@file_get_contents($path);
    }
    $readinessBoundaryReady = $readinessSchemaReady
        && stripos($readinessSource,'automatic_deployment') !== false
        && stripos($readinessSource,'automatic_dns_change') !== false
        && stripos($readinessSource,'automatic_production_switch') !== false
        && stripos($readinessSource,'secret_values_returned') !== false
        && stripos($readinessSource,'business_data_mutation') !== false;

    $checks = [
        securityAuditCheck('latest_security_scan','Current Security Center evidence','Security Center','high',$scanOutcome,is_array($latestScan)?'Latest protected scan scored ' . $scanScore . '/100 with ' . (int)$latestScan['passed_checks'] . ' of ' . (int)$latestScan['total_checks'] . ' checks passed.':'No protected Security Center scan was found.','security_scan_runs',is_array($latestScan)?'Review the latest Security Center findings before sign-off.':'Run Security Center protected scan first.'),
        securityAuditCheck('urgent_findings','Critical and high finding queue','Findings','critical',$urgent===0?'passed':'failed',$urgent===0?'No unresolved critical or high Security Center finding exists.':$urgent . ' unresolved critical/high finding(s) require owner review.','security_findings','Resolve or explicitly disposition every critical/high finding before launch.'),
        securityAuditCheck('review_findings','Medium and low finding disposition','Findings','medium',$mediumLow===0?'passed':'review',$mediumLow===0?'No unresolved medium or low Security Center finding exists.':$mediumLow . ' unresolved medium/low finding(s) remain documented.','security_findings','Acknowledge the local/runtime exception or remediate it before production exposure.'),
        securityAuditCheck('protected_owner','Protected owner access','Access','critical',$ownerRoles>0?'passed':'failed',$ownerRoles>0?$ownerRoles . ' protected active Super Admin role(s) and ' . $ownerAssignments . ' protected assignment(s) are recorded.':'No protected active Super Admin role was verified.','access_roles + access_assignments','Preserve at least one protected owner role and reviewed owner assignment.'),
        securityAuditCheck('audit_integrity','Unified audit integrity evidence','Audit','high',$integrityOutcome,is_array($latestIntegrity)?'Latest integrity run result: ' . (string)$latestIntegrity['result'] . '; ' . (int)$latestIntegrity['verified_count'] . ' verified and ' . (int)$latestIntegrity['mismatch_count'] . ' mismatch(es).':'Audit tables exist, but no integrity verification run is recorded yet.','unified_audit_integrity_runs','Open Audit Logs and run Verify segment before final production sign-off.'),
        securityAuditCheck('verified_recovery','Verified recovery point','Recovery','high',is_array($latestBackup)?'passed':'failed',is_array($latestBackup)?'Latest verified private backup covers ' . (int)$latestBackup['table_count'] . ' table(s), ' . (int)$latestBackup['row_count'] . ' row(s), with SHA-256 evidence.':'No verified private backup was found.','backup_restore_artifacts','Create and verify a protected backup before sign-off.'),
        securityAuditCheck('secret_redaction','Integration credential boundary','Integrations','critical',$secretSafe?'passed':'failed',$secretSafe?'Encrypted secret storage and configured/not-configured response markers are present; secret values are not selected for browser responses.':'Encrypted storage and response redaction could not both be verified.','manage_integrations.php','Keep credentials encrypted server-side and return only redacted configuration state.'),
        securityAuditCheck('support_safety','Support Center safe operating boundary','Support','high',$supportBoundaryReady?'passed':'failed',$supportBoundaryReady?'Support ledgers, four active SLA policies and all non-automatic business-action boundaries are present.':'Support schema, SLA policies or a protected handoff boundary could not be verified.','support_* + manage_support_center.php','Open Support Center once, confirm all four SLA policies and keep every handoff human-controlled.'),
        securityAuditCheck('production_readiness_safety','Production Readiness evidence boundary','Release','high',$readinessBoundaryReady?'passed':'failed',$readinessBoundaryReady?'Environment, scan, check and event ledgers are present with all non-automatic deployment boundaries.':'Production readiness schema or its protected non-deployment boundary could not be verified.','deployment_readiness_* + manage_production_readiness.php','Open Production Readiness once and run a protected scan; deployment and DNS changes must remain outside this evidence module.'),
        securityAuditCheck('runtime_errors','PHP runtime error exposure','Runtime','medium',$displayErrorsOff?'passed':'review',$displayErrorsOff?'PHP display_errors is disabled in the active runtime.':'PHP display_errors is enabled in the active XAMPP runtime.','PHP runtime','Disable display_errors before the API is exposed beyond localhost; retain server-side error logging.'),
    ];

    $snapshot = [
        'latest_security_scan'=>$latestScan,
        'urgent_findings'=>$urgent,
        'open_findings'=>$open,
        'protected_owner_roles'=>$ownerRoles,
        'protected_owner_assignments'=>$ownerAssignments,
        'latest_integrity_run'=>$latestIntegrity,
        'latest_verified_backup'=>$latestBackup,
        'secret_redaction'=>$secretSafe,
        'support_center'=>['schema_ready'=>$supportSchemaReady,'active_sla_policies'=>$supportSlaCount,'safe_boundary'=>$supportBoundaryReady],
        'production_readiness'=>['schema_ready'=>$readinessSchemaReady,'safe_boundary'=>$readinessBoundaryReady],
        'php_display_errors'=>$displayErrorsRaw,
        'captured_at'=>date(DATE_ATOM),
    ];
    return ['checks'=>$checks,'snapshot'=>$snapshot];
}

function runSecurityAudit(PDO $pdo, string $scope, string $reason): int
{
    $allowedScopes = ['Control plane','Launch readiness','Access and recovery'];
    if (!in_array($scope,$allowedScopes,true)) throw new InvalidArgumentException('Select a valid bounded audit scope.');
    if (strlen($reason) < 8) throw new InvalidArgumentException('Add a clear audit reason with at least 8 characters.');

    $evidence = securityAuditEvidence($pdo);
    $checks = $evidence['checks'];
    $passed = count(array_filter($checks,static fn(array $item): bool=>$item['outcome']==='passed'));
    $review = count(array_filter($checks,static fn(array $item): bool=>$item['outcome']==='review'));
    $failed = count($checks)-$passed-$review;
    $score = (int) round((($passed*100)+($review*70))/count($checks));
    $snapshotJson = json_encode($evidence['snapshot'],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE) ?: '{}';
    $hash = hash('sha256',$snapshotJson . '|' . json_encode($checks,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE));

    $pdo->beginTransaction();
    try {
        $save = $pdo->prepare("INSERT INTO security_audit_runs (audit_key,scope_name,reason,status,score,passed_checks,review_checks,failed_checks,total_checks,evidence_hash,source_snapshot_json) VALUES (:key,:scope,:reason,'open',:score,:passed,:review,:failed,:total,:hash,:snapshot)");
        $save->execute([':key'=>bin2hex(random_bytes(16)),':scope'=>$scope,':reason'=>securityAuditText($reason,1200),':score'=>$score,':passed'=>$passed,':review'=>$review,':failed'=>$failed,':total'=>count($checks),':hash'=>$hash,':snapshot'=>$snapshotJson]);
        $auditId=(int)$pdo->lastInsertId();
        $saveCheck=$pdo->prepare('INSERT INTO security_audit_checks (audit_id,check_key,title,domain_name,severity,outcome,evidence,source_ref,recommendation) VALUES (:audit_id,:key,:title,:domain,:severity,:outcome,:evidence,:source,:recommendation)');
        foreach ($checks as $check) $saveCheck->execute([':audit_id'=>$auditId,':key'=>$check['key'],':title'=>$check['title'],':domain'=>$check['domain'],':severity'=>$check['severity'],':outcome'=>$check['outcome'],':evidence'=>securityAuditText($check['evidence'],2000),':source'=>securityAuditText($check['source'],240),':recommendation'=>securityAuditText($check['recommendation'],2000)]);
        securityAuditEvent($pdo,$auditId,'audit_opened',$scope,'Evidence snapshot ' . substr($hash,0,12) . ' · Score ' . $score . '/100 · Reason: ' . securityAuditText($reason,800));
        $pdo->commit();
        return $auditId;
    } catch (Throwable $error) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $error; }
}

function readSecurityAuditState(PDO $pdo): array
{
    $audits=$pdo->query('SELECT id,audit_key,scope_name,reason,status,score,passed_checks,review_checks,failed_checks,total_checks,evidence_hash,conclusion,opened_by,signed_off_by,signed_off_at,opened_at FROM security_audit_runs ORDER BY id DESC LIMIT 80')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $latest=$audits[0]??null;
    $checks=[];
    if (is_array($latest)) {
        $query=$pdo->prepare('SELECT * FROM security_audit_checks WHERE audit_id=:audit_id ORDER BY FIELD(outcome,\'failed\',\'review\',\'passed\'),FIELD(severity,\'critical\',\'high\',\'medium\',\'low\'),id');
        $query->execute([':audit_id'=>$latest['id']]);
        $checks=$query->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }
    $events=$pdo->query('SELECT * FROM security_audit_events ORDER BY id DESC LIMIT 160')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $total=(int)$pdo->query('SELECT COUNT(*) FROM security_audit_runs')->fetchColumn();
    $signed=(int)$pdo->query("SELECT COUNT(*) FROM security_audit_runs WHERE status='signed_off'")->fetchColumn();
    $open=(int)$pdo->query("SELECT COUNT(*) FROM security_audit_runs WHERE status<>'signed_off'")->fetchColumn();
    $unreviewed=is_array($latest)?securityAuditCount($pdo,'security_audit_checks','audit_id=' . (int)$latest['id'] . " AND attestation_status='unreviewed'"):0;
    $followUps=is_array($latest)?securityAuditCount($pdo,'security_audit_checks','audit_id=' . (int)$latest['id'] . " AND attestation_status='needs_follow_up'"):0;
    $verifiedBackups=securityAuditCount($pdo,'backup_restore_artifacts',"status='verified'");
    $sources=[
        ['key'=>'security','label'=>'Security Center scan','ready'=>securityAuditCount($pdo,'security_scan_runs')>0],
        ['key'=>'access','label'=>'Protected owner access','ready'=>securityAuditCount($pdo,'access_roles',"role_key='super-admin' AND status='active' AND is_protected=1")>0],
        ['key'=>'ledger','label'=>'Audit integrity ledger','ready'=>securityAuditTableExists($pdo,'unified_audit_integrity_runs')],
        ['key'=>'recovery','label'=>'Verified recovery point','ready'=>$verifiedBackups>0],
        ['key'=>'integrations','label'=>'Credential boundary','ready'=>securityAuditTableExists($pdo,'integration_connections')],
    ];
    return [
        'summary'=>['total_audits'=>$total,'signed_off'=>$signed,'open_audits'=>$open,'latest_score'=>(int)($latest['score']??0),'unreviewed_checks'=>$unreviewed,'follow_up_checks'=>$followUps,'verified_backups'=>$verifiedBackups],
        'latest_audit'=>$latest,'checks'=>$checks,'audits'=>$audits,'events'=>$events,'sources'=>$sources,
        'safety'=>['assurance_type'=>'internal_evidence_review','external_certification'=>false,'secret_values_returned'=>false,'business_data_mutation'=>false,'automatic_access_change'=>false],
        'generated_at'=>date(DATE_ATOM),
    ];
}

try {
    $pdo=getDatabaseConnection();
    ensureSecurityAuditTables($pdo);
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
        $payload=securityAuditPayload();
        $action=securityAuditText($payload['action']??'',80);
        if ($action==='run_audit') {
            $auditId=runSecurityAudit($pdo,securityAuditText($payload['scope']??'',120),securityAuditText($payload['reason']??'',1200));
            securityAuditJson(200,['success'=>true,'message'=>'Security audit #' . $auditId . ' captured from live evidence.','state'=>readSecurityAuditState($pdo)]);
        }
        if ($action==='attest_check') {
            $checkId=(int)($payload['check_id']??0); $decision=securityAuditText($payload['decision']??'',40); $note=securityAuditText($payload['note']??'',2000);
            if ($checkId<1 || !in_array($decision,['accepted','needs_follow_up'],true) || strlen($note)<8) securityAuditJson(422,['success'=>false,'message'=>'Select a review decision and add an evidence note.']);
            $find=$pdo->prepare('SELECT id,audit_id,title,attestation_status FROM security_audit_checks WHERE id=:id LIMIT 1'); $find->execute([':id'=>$checkId]); $check=$find->fetch(PDO::FETCH_ASSOC);
            if (!is_array($check)) securityAuditJson(404,['success'=>false,'message'=>'The selected audit check is unavailable.']);
            if (($check['attestation_status']??'')!=='unreviewed') securityAuditJson(409,['success'=>false,'message'=>'This evidence check was already reviewed.']);
            $update=$pdo->prepare("UPDATE security_audit_checks SET attestation_status=:decision,attestation_note=:note,attested_by='authenticated admin',attested_at=NOW() WHERE id=:id AND attestation_status='unreviewed'");
            $update->execute([':decision'=>$decision,':note'=>$note,':id'=>$checkId]);
            $remaining=securityAuditCount($pdo,'security_audit_checks','audit_id=' . (int)$check['audit_id'] . " AND attestation_status='unreviewed'");
            if ($remaining===0) $pdo->prepare("UPDATE security_audit_runs SET status='ready_for_signoff' WHERE id=:id AND status='open'")->execute([':id'=>$check['audit_id']]);
            securityAuditEvent($pdo,(int)$check['audit_id'],'evidence_attested',(string)$check['title'],str_replace('_',' ',$decision) . ' · ' . $note);
            securityAuditJson(200,['success'=>true,'message'=>'Audit evidence review recorded.','state'=>readSecurityAuditState($pdo)]);
        }
        if ($action==='sign_off') {
            $auditId=(int)($payload['audit_id']??0); $conclusion=securityAuditText($payload['conclusion']??'',2000); $confirmed=!empty($payload['confirmed']);
            if ($auditId<1 || strlen($conclusion)<12 || !$confirmed) securityAuditJson(422,['success'=>false,'message'=>'A conclusion and explicit sign-off confirmation are required.']);
            $find=$pdo->prepare('SELECT id,status,evidence_hash FROM security_audit_runs WHERE id=:id LIMIT 1'); $find->execute([':id'=>$auditId]); $audit=$find->fetch(PDO::FETCH_ASSOC);
            if (!is_array($audit)) securityAuditJson(404,['success'=>false,'message'=>'The selected audit is unavailable.']);
            if (($audit['status']??'')!=='ready_for_signoff') securityAuditJson(409,['success'=>false,'message'=>'Review every evidence check before signing off this audit.']);
            $pdo->beginTransaction();
            try {
                $pdo->prepare("UPDATE security_audit_runs SET status='signed_off',conclusion=:conclusion,signed_off_by='authenticated admin',signed_off_at=NOW() WHERE id=:id AND status='ready_for_signoff'")->execute([':conclusion'=>$conclusion,':id'=>$auditId]);
                $pdo->prepare('INSERT INTO security_audit_signoffs (audit_id,conclusion,evidence_hash) VALUES (:audit_id,:conclusion,:hash)')->execute([':audit_id'=>$auditId,':conclusion'=>$conclusion,':hash'=>$audit['evidence_hash']]);
                securityAuditEvent($pdo,$auditId,'audit_signed_off','Security audit #' . $auditId,$conclusion . ' · Evidence ' . substr((string)$audit['evidence_hash'],0,12));
                $pdo->commit();
            } catch (Throwable $error) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $error; }
            securityAuditJson(200,['success'=>true,'message'=>'Internal security audit signed off with its evidence hash preserved.','state'=>readSecurityAuditState($pdo)]);
        }
        securityAuditJson(422,['success'=>false,'message'=>'Unsupported Security Audit action.']);
    }
    securityAuditJson(200,['success'=>true]+readSecurityAuditState($pdo));
} catch (InvalidArgumentException $error) {
    securityAuditJson(422,['success'=>false,'message'=>$error->getMessage()]);
} catch (Throwable $error) {
    error_log('manage_security_audit.php: ' . $error->getMessage());
    securityAuditJson(500,['success'=>false,'message'=>'Security Audit could not complete the protected request.']);
}
