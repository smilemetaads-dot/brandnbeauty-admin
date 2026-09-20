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

function auditJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function auditPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function auditText(mixed $value, int $limit = 1000): string
{
    $value = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($value, 0, $limit) : substr($value, 0, $limit);
}

function auditTableExists(PDO $pdo, string $table): bool
{
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table' => $table]);
    return (int) $query->fetchColumn() > 0;
}

function ensureUnifiedAuditTables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS unified_audit_fingerprints (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, source_table VARCHAR(120) NOT NULL,
        source_id VARCHAR(191) NOT NULL, payload_hash CHAR(64) NOT NULL,
        first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_verified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_unified_audit_source (source_table,source_id),
        KEY idx_unified_audit_verified (last_verified_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS unified_audit_integrity_runs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, segment_name VARCHAR(120) NOT NULL,
        event_count INT UNSIGNED NOT NULL, new_count INT UNSIGNED NOT NULL DEFAULT 0,
        verified_count INT UNSIGNED NOT NULL DEFAULT 0, mismatch_count INT UNSIGNED NOT NULL DEFAULT 0,
        chain_head CHAR(64) NOT NULL, result ENUM('passed','failed','no_data') NOT NULL,
        checked_by VARCHAR(190) NOT NULL DEFAULT 'authenticated admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_unified_audit_integrity_time (created_at,result)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS unified_audit_investigations (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, event_ref VARCHAR(191) NOT NULL,
        source_table VARCHAR(120) NOT NULL, source_id VARCHAR(191) NOT NULL,
        title VARCHAR(300) NOT NULL, severity ENUM('critical','high','medium','low') NOT NULL,
        owner_name VARCHAR(190) NOT NULL, note VARCHAR(2000) NOT NULL,
        status ENUM('open','resolved') NOT NULL DEFAULT 'open', resolution_note VARCHAR(2000) NULL,
        created_by VARCHAR(190) NOT NULL DEFAULT 'authenticated admin', resolved_by VARCHAR(190) NULL,
        resolved_at DATETIME NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_unified_audit_investigation (status,severity,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS unified_audit_export_requests (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, range_name VARCHAR(80) NOT NULL,
        scope_name VARCHAR(120) NOT NULL, export_format VARCHAR(20) NOT NULL DEFAULT 'CSV',
        redacted TINYINT(1) NOT NULL DEFAULT 1, reason VARCHAR(1000) NOT NULL,
        status ENUM('requested','downloaded') NOT NULL DEFAULT 'requested',
        requested_by VARCHAR(190) NOT NULL DEFAULT 'authenticated admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_unified_audit_export_time (created_at,status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS unified_audit_control_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, event_type VARCHAR(80) NOT NULL,
        subject_label VARCHAR(300) NOT NULL, actor_name VARCHAR(190) NOT NULL,
        note VARCHAR(2000) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_unified_audit_control_time (event_type,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function auditSources(): array
{
    return [
        ['table'=>'access_audit_events','domain'=>'Access','label'=>'Roles & Permissions','time'=>'created_at','query'=>"SELECT id source_id,event_type action,actor_name actor,subject_label subject,note,created_at occurred_at,'' outcome_value,'' evidence FROM access_audit_events ORDER BY id DESC LIMIT 250"],
        ['table'=>'system_settings_audit_events','domain'=>'Settings','label'=>'System Settings','time'=>'created_at','query'=>"SELECT id source_id,event_type action,actor_name actor,setting_keys subject,note,created_at occurred_at,'' outcome_value,'' evidence FROM system_settings_audit_events ORDER BY id DESC LIMIT 250"],
        ['table'=>'integration_audit_events','domain'=>'Integrations','label'=>'Integrations','time'=>'created_at','query'=>"SELECT id source_id,event_type action,actor_name actor,integration_key subject,note,created_at occurred_at,'' outcome_value,'' evidence FROM integration_audit_events ORDER BY id DESC LIMIT 250"],
        ['table'=>'automation_alert_events','domain'=>'Alerts','label'=>'Automation Alerts','time'=>'created_at','query'=>"SELECT id source_id,event_type action,actor_name actor,CONCAT('Alert #',alert_id) subject,note,created_at occurred_at,'' outcome_value,'' evidence FROM automation_alert_events ORDER BY id DESC LIMIT 250"],
        ['table'=>'automation_rule_events','domain'=>'Rules','label'=>'Automation Rules','time'=>'created_at','query'=>"SELECT id source_id,event_type action,actor_name actor,CONCAT('Rule #',rule_id) subject,note,created_at occurred_at,'' outcome_value,'' evidence FROM automation_rule_events ORDER BY id DESC LIMIT 250"],
        ['table'=>'marketing_spend_audit','domain'=>'Marketing','label'=>'Marketing Performance','time'=>'created_at','query'=>"SELECT id source_id,action,actor,CONCAT('Spend #',IFNULL(CAST(spend_id AS CHAR),'registry')) subject,COALESCE(reason,'Recorded spend change') note,created_at occurred_at,'' outcome_value,CONCAT('before:',IF(before_json IS NULL,'none','recorded'),'; after:',IF(after_json IS NULL,'none','recorded')) evidence FROM marketing_spend_audit ORDER BY id DESC LIMIT 250"],
        ['table'=>'automation_runs','domain'=>'Workflow','label'=>'Workflow Automation','time'=>'created_at','query'=>"SELECT id source_id,CONCAT('workflow_',status) action,'automation engine' actor,entity_ref subject,step note,created_at occurred_at,status outcome_value,run_key evidence FROM automation_runs ORDER BY id DESC LIMIT 250"],
        ['table'=>'tracking_event_ledger','domain'=>'Tracking','label'=>'Tracking & Attribution','time'=>'received_at','query'=>"SELECT id source_id,event_name action,event_source actor,event_id subject,CONCAT(destination,' · ',environment,' · duplicate attempts ',duplicate_count) note,received_at occurred_at,CASE WHEN schema_valid=0 THEN 'failed' WHEN duplicate_count>0 THEN 'blocked' ELSE 'succeeded' END outcome_value,payload_hash evidence FROM tracking_event_ledger ORDER BY id DESC LIMIT 250"],
        ['table'=>'meta_ads_sync_runs','domain'=>'Meta Ads','label'=>'Meta Ads','time'=>'started_at','query'=>"SELECT id source_id,CONCAT('meta_sync_',status) action,'Meta sync engine' actor,CONCAT(date_start,' to ',date_stop) subject,CONCAT(entity_count,' entities · ',insight_count,' insights') note,started_at occurred_at,status outcome_value,'' evidence FROM meta_ads_sync_runs ORDER BY id DESC LIMIT 250"],
        ['table'=>'seo_health_audits','domain'=>'Storefront','label'=>'SEO & Storefront Health','time'=>'created_at','query'=>"SELECT id source_id,'seo_health_audit' action,COALESCE(run_by,'admin') actor,CONCAT('Score ',score) subject,CONCAT(critical_count,' critical · ',warning_count,' warning · ',passed_count,' passed') note,created_at occurred_at,CASE WHEN critical_count>0 THEN 'failed' ELSE 'succeeded' END outcome_value,'' evidence FROM seo_health_audits ORDER BY id DESC LIMIT 250"],
        ['table'=>'content_creative_decisions','domain'=>'Content','label'=>'Content & Creative','time'=>'created_at','query'=>"SELECT id source_id,decision action,created_by actor,CONCAT(creative_name,' · ',creative_ref) subject,note,created_at occurred_at,CASE WHEN decision LIKE '%block%' THEN 'blocked' ELSE 'succeeded' END outcome_value,'' evidence FROM content_creative_decisions ORDER BY id DESC LIMIT 250"],
        ['table'=>'unified_audit_control_events','domain'=>'Audit','label'=>'Audit Control','time'=>'created_at','query'=>"SELECT id source_id,event_type action,actor_name actor,subject_label subject,note,created_at occurred_at,'' outcome_value,'' evidence FROM unified_audit_control_events ORDER BY id DESC LIMIT 250"],
    ];
}

function auditOutcome(string $action, string $value, string $note): string
{
    $haystack = strtolower($action . ' ' . $value . ' ' . $note);
    if (str_contains($haystack,'fail') || str_contains($haystack,'error') || str_contains($haystack,'invalid')) return 'failed';
    if (str_contains($haystack,'block') || str_contains($haystack,'reject') || str_contains($haystack,'duplicate') || str_contains($haystack,'denied')) return 'blocked';
    if (str_contains($haystack,'pending') || str_contains($haystack,'waiting') || str_contains($haystack,'requested')) return 'pending';
    return 'success';
}

function auditRisk(string $domain, string $action, string $outcome): string
{
    $haystack = strtolower($domain . ' ' . $action);
    if ($domain === 'Access' && preg_match('/permission|role|assignment|policy/', $haystack) === 1) return 'critical';
    if (preg_match('/credential|publish|lifecycle|webhook|approval|resolve|delete|disconnect/', $haystack) === 1) return 'high';
    if (in_array($outcome,['failed','blocked'],true) || in_array($domain,['Access','Settings','Integrations','Finance'],true)) return 'high';
    if (in_array($domain,['Marketing','Workflow','Alerts','Rules','Content','Storefront'],true)) return 'medium';
    return 'low';
}

function auditCollect(PDO $pdo): array
{
    $events=[]; $sources=[]; $total=0; $last24=0;
    foreach (auditSources() as $source) {
        $available=auditTableExists($pdo,$source['table']); $count=0; $recent=0; $latest=null; $sourceError='';
        if ($available) {
            try {
                $count=(int)$pdo->query('SELECT COUNT(*) FROM ' . $source['table'])->fetchColumn();
                $recent=(int)$pdo->query('SELECT COUNT(*) FROM ' . $source['table'] . ' WHERE ' . $source['time'] . '>=DATE_SUB(NOW(),INTERVAL 24 HOUR)')->fetchColumn();
                $latest=$pdo->query('SELECT MAX(' . $source['time'] . ') FROM ' . $source['table'])->fetchColumn() ?: null;
                foreach (($pdo->query($source['query'])->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) {
                    $action=auditText($row['action']??'event',120); $actor=auditText($row['actor']??'system',190); $subject=auditText($row['subject']??'',300); $note=auditText($row['note']??'',2000); $outcome=auditOutcome($action,auditText($row['outcome_value']??'',80),$note); $risk=auditRisk($source['domain'],$action,$outcome); $sourceId=auditText($row['source_id']??'',191); $occurred=auditText($row['occurred_at']??'',40); $evidence=auditText($row['evidence']??'',300);
                    $stable=['source_table'=>$source['table'],'source_id'=>$sourceId,'domain'=>$source['domain'],'action'=>$action,'actor'=>$actor,'subject'=>$subject,'note'=>$note,'occurred_at'=>$occurred,'outcome'=>$outcome,'evidence'=>$evidence];
                    $fingerprint=hash('sha256',json_encode($stable,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE) ?: '');
                    $events[]=['event_ref'=>'AUD-'.strtoupper(substr(preg_replace('/[^A-Za-z]/','',$source['domain'])?:'LOG',0,3)).'-'.$sourceId,'source_table'=>$source['table'],'source_id'=>$sourceId,'source_label'=>$source['label'],'domain'=>$source['domain'],'action'=>$action,'actor'=>$actor,'subject'=>$subject,'note'=>$note,'occurred_at'=>$occurred,'outcome'=>$outcome,'risk'=>$risk,'evidence'=>$evidence,'fingerprint'=>$fingerprint];
                }
            } catch (Throwable $sourceFailure) {
                $available=false; $count=0; $recent=0; $latest=null; $sourceError='Source schema is not compatible with this verified reader.';
                error_log('Audit source ' . $source['table'] . ': ' . $sourceFailure->getMessage());
            }
        }
        $total+=$count; $last24+=$recent;
        $sources[]=['table'=>$source['table'],'label'=>$source['label'],'domain'=>$source['domain'],'available'=>$available,'event_count'=>$count,'last_24h'=>$recent,'latest_at'=>$latest,'source_error'=>$sourceError];
    }
    usort($events,fn(array $a,array $b)=>strcmp((string)$b['occurred_at'],(string)$a['occurred_at']));
    return ['events'=>array_slice($events,0,2000),'sources'=>$sources,'total'=>$total,'last24'=>$last24];
}

function auditControlEvent(PDO $pdo, string $type, string $subject, string $note): void
{
    $query=$pdo->prepare('INSERT INTO unified_audit_control_events (event_type,subject_label,actor_name,note) VALUES (:type,:subject,:actor,:note)');
    $query->execute([':type'=>$type,':subject'=>auditText($subject,300),':actor'=>'authenticated admin',':note'=>auditText($note,2000)]);
}

function readAuditState(PDO $pdo): array
{
    $collection=auditCollect($pdo); $events=$collection['events']; $sensitive=0; $failed=0; $daily=[];
    for ($i=13;$i>=0;$i--) { $date=date('Y-m-d',strtotime('-'.$i.' day')); $daily[$date]=['event_date'=>$date,'events'=>0,'sensitive'=>0]; }
    foreach ($events as $event) {
        if (in_array($event['risk'],['critical','high'],true)) $sensitive++;
        if (in_array($event['outcome'],['failed','blocked'],true)) $failed++;
        $date=substr((string)$event['occurred_at'],0,10); if (isset($daily[$date])) { $daily[$date]['events']++; if (in_array($event['risk'],['critical','high'],true)) $daily[$date]['sensitive']++; }
    }
    $integrity=$pdo->query('SELECT * FROM unified_audit_integrity_runs ORDER BY id DESC LIMIT 100')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $investigations=$pdo->query('SELECT * FROM unified_audit_investigations ORDER BY id DESC LIMIT 200')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $exports=$pdo->query('SELECT * FROM unified_audit_export_requests ORDER BY id DESC LIMIT 200')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $open=(int)$pdo->query("SELECT COUNT(*) FROM unified_audit_investigations WHERE status='open'")->fetchColumn(); $latest=$integrity[0]??null;
    return ['engine'=>['mode'=>'read_only_unified_evidence','integrity_scope'=>'latest_2000_across_verified_sources','timezone'=>'Asia/Dhaka'],'capabilities'=>['admin_auth'=>is_file(__DIR__.'/admin_auth.php'),'source_mutation'=>false,'raw_json_exposed'=>false,'redacted_export_only'=>true],'summary'=>['events_total'=>$collection['total'],'current_segment'=>count($events),'events_24h'=>$collection['last24'],'sensitive_segment'=>$sensitive,'failed_segment'=>$failed,'sources_available'=>count(array_filter($collection['sources'],fn(array $row)=>(bool)$row['available'])),'sources_total'=>count($collection['sources']),'open_investigations'=>$open,'integrity_status'=>$latest['result']??'not_checked'],'events'=>$events,'sources'=>$collection['sources'],'daily'=>array_values($daily),'integrity_runs'=>$integrity,'investigations'=>$investigations,'export_requests'=>$exports,'generated_at'=>date(DATE_ATOM)];
}

try {
    $pdo=getDatabaseConnection(); ensureUnifiedAuditTables($pdo);
    if (($_SERVER['REQUEST_METHOD']??'GET')==='GET') auditJson(200,array_merge(['success'=>true],readAuditState($pdo)));
    if (($_SERVER['REQUEST_METHOD']??'GET')!=='POST') auditJson(405,['success'=>false,'message'=>'Method not allowed.']);
    $payload=auditPayload(); $action=auditText($payload['action']??'',80); $message='Audit control updated.';

    if ($action==='verify_integrity') {
        $collection=auditCollect($pdo); $events=$collection['events']; $new=0; $verified=0; $mismatch=0; $chain=str_repeat('0',64);
        $lookup=$pdo->prepare('SELECT payload_hash FROM unified_audit_fingerprints WHERE source_table=:table AND source_id=:id');
        $insert=$pdo->prepare('INSERT INTO unified_audit_fingerprints (source_table,source_id,payload_hash) VALUES (:table,:id,:hash)');
        $touch=$pdo->prepare('UPDATE unified_audit_fingerprints SET last_verified_at=NOW() WHERE source_table=:table AND source_id=:id');
        $pdo->beginTransaction();
        try {
            foreach ($events as $event) {
                $lookup->execute([':table'=>$event['source_table'],':id'=>$event['source_id']]); $known=$lookup->fetchColumn();
                if ($known===false) { $insert->execute([':table'=>$event['source_table'],':id'=>$event['source_id'],':hash'=>$event['fingerprint']]); $new++; }
                elseif (hash_equals((string)$known,(string)$event['fingerprint'])) { $touch->execute([':table'=>$event['source_table'],':id'=>$event['source_id']]); $verified++; }
                else $mismatch++;
                $chain=hash('sha256',$chain.'|'.$event['source_table'].'|'.$event['source_id'].'|'.$event['fingerprint']);
            }
            $result=count($events)===0?'no_data':($mismatch===0?'passed':'failed');
            $save=$pdo->prepare('INSERT INTO unified_audit_integrity_runs (segment_name,event_count,new_count,verified_count,mismatch_count,chain_head,result) VALUES (:segment,:events,:new_count,:verified,:mismatch,:chain_head,:result)');
            $save->execute([':segment'=>'latest_2000_across_verified_sources',':events'=>count($events),':new_count'=>$new,':verified'=>$verified,':mismatch'=>$mismatch,':chain_head'=>$chain,':result'=>$result]);
            auditControlEvent($pdo,'integrity_verified','Current unified segment','Checked '.count($events).' source rows; '.$mismatch.' fingerprint mismatch(es). Source records were not changed.');
            $pdo->commit(); $message=$result==='passed'?'Current audit segment passed fingerprint verification.':($result==='no_data'?'No source events exist yet; no evidence was invented.':'Fingerprint mismatch detected. Open an investigation before relying on this segment.');
        } catch (Throwable $integrityError) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $integrityError; }
    } elseif ($action==='create_investigation') {
        $eventRef=auditText($payload['event_ref']??'',191); $title=auditText($payload['title']??'',300); $severity=auditText($payload['severity']??'',30); $owner=auditText($payload['owner_name']??'',190); $note=auditText($payload['note']??'',2000);
        if ($eventRef==='' || $title==='' || $owner==='' || $note==='' || !in_array($severity,['critical','high','medium','low'],true)) auditJson(422,['success'=>false,'message'=>'Event, title, severity, owner and investigation note are required.']);
        $event=null; foreach (auditCollect($pdo)['events'] as $candidate) if ($candidate['event_ref']===$eventRef) { $event=$candidate; break; }
        if (!is_array($event)) auditJson(404,['success'=>false,'message'=>'The selected event is outside the current verified segment. Refresh and try again.']);
        $save=$pdo->prepare('INSERT INTO unified_audit_investigations (event_ref,source_table,source_id,title,severity,owner_name,note) VALUES (:event_ref,:source_table,:source_id,:title,:severity,:owner,:note)');
        $save->execute([':event_ref'=>$eventRef,':source_table'=>$event['source_table'],':source_id'=>$event['source_id'],':title'=>$title,':severity'=>$severity,':owner'=>$owner,':note'=>$note]);
        auditControlEvent($pdo,'investigation_opened',$eventRef,$title.' · Owner: '.$owner.'. Source evidence was not changed.'); $message='Investigation opened without changing the source event.';
    } elseif ($action==='resolve_investigation') {
        $id=(int)($payload['investigation_id']??0); $note=auditText($payload['resolution_note']??'',2000);
        if ($id<1 || $note==='') auditJson(422,['success'=>false,'message'=>'Investigation and resolution evidence are required.']);
        $update=$pdo->prepare("UPDATE unified_audit_investigations SET status='resolved',resolution_note=:note,resolved_by='authenticated admin',resolved_at=NOW() WHERE id=:id AND status='open'"); $update->execute([':note'=>$note,':id'=>$id]);
        if ($update->rowCount()!==1) auditJson(409,['success'=>false,'message'=>'This investigation is already resolved or unavailable.']);
        auditControlEvent($pdo,'investigation_resolved','Investigation #'.$id,$note); $message='Investigation resolved with evidence. Source history remains unchanged.';
    } elseif ($action==='request_export') {
        $range=auditText($payload['range_name']??'Current segment',80); $scope=auditText($payload['scope_name']??'Visible events',120); $format=strtoupper(auditText($payload['export_format']??'CSV',20)); $redacted=(bool)($payload['redacted']??false); $reason=auditText($payload['reason']??'',1000);
        if (!$redacted || $format!=='CSV' || $reason==='') auditJson(422,['success'=>false,'message'=>'Only redacted CSV exports with a written purpose are allowed.']);
        $save=$pdo->prepare('INSERT INTO unified_audit_export_requests (range_name,scope_name,export_format,redacted,reason) VALUES (:range_name,:scope_name,:format,1,:reason)');
        $save->execute([':range_name'=>$range,':scope_name'=>$scope,':format'=>$format,':reason'=>$reason]);
        auditControlEvent($pdo,'redacted_export_requested',$scope,$reason.' Export contains normalized visible fields only.'); $message='Redacted CSV request recorded. The browser may now create the local file.';
    } else auditJson(422,['success'=>false,'message'=>'Unknown audit action.']);

    auditJson(200,array_merge(['success'=>true,'message'=>$message],readAuditState($pdo)));
} catch (Throwable $error) {
    error_log('manage_audit_logs.php: '.$error->getMessage());
    auditJson(500,['success'=>false,'message'=>'Unified audit evidence is unavailable right now. No source record was changed.']);
}
