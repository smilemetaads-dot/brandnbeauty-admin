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

function alertJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function alertText(mixed $value, int $limit = 1000): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function alertPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function alertTableExists(PDO $pdo, string $table): bool
{
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table' => $table]);
    return (int) $query->fetchColumn() > 0;
}

function alertColumns(PDO $pdo, string $table): array
{
    if (!alertTableExists($pdo, $table)) return [];
    $query = $pdo->prepare('SELECT LOWER(column_name) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table' => $table]);
    return $query->fetchAll(PDO::FETCH_COLUMN) ?: [];
}

function alertColumn(array $columns, array $candidates): ?string
{
    foreach ($candidates as $candidate) if (in_array($candidate, $columns, true)) return $candidate;
    return null;
}

function ensureAlertTables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS automation_alert_policies (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, policy_key VARCHAR(140) NOT NULL,
        name VARCHAR(240) NOT NULL, source_type VARCHAR(80) NOT NULL,
        condition_text VARCHAR(1000) NOT NULL,
        severity ENUM('critical','high','medium','low') NOT NULL DEFAULT 'medium',
        owner_name VARCHAR(190) NOT NULL DEFAULT 'Operations',
        sla_minutes INT UNSIGNED NOT NULL DEFAULT 60,
        dedup_minutes INT UNSIGNED NOT NULL DEFAULT 30,
        escalation_minutes INT UNSIGNED NOT NULL DEFAULT 120,
        status ENUM('active','draft','paused') NOT NULL DEFAULT 'draft',
        is_builtin TINYINT(1) NOT NULL DEFAULT 0,
        version SMALLINT UNSIGNED NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_automation_alert_policy_key (policy_key),
        KEY idx_automation_alert_policy_state (status,source_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS automation_alerts (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, alert_key CHAR(64) NOT NULL,
        policy_id BIGINT UNSIGNED NOT NULL, source_type VARCHAR(80) NOT NULL,
        source_ref_hash CHAR(64) NOT NULL, entity_ref VARCHAR(240) NOT NULL,
        title VARCHAR(300) NOT NULL,
        severity ENUM('critical','high','medium','low') NOT NULL,
        owner_name VARCHAR(190) NOT NULL,
        status ENUM('open','acknowledged','snoozed','resolved') NOT NULL DEFAULT 'open',
        occurrence_count INT UNSIGNED NOT NULL DEFAULT 1,
        business_impact VARCHAR(1000) NOT NULL,
        evidence_json LONGTEXT NOT NULL,
        first_seen_at DATETIME NOT NULL, last_seen_at DATETIME NOT NULL,
        acknowledged_at DATETIME NULL, snoozed_until DATETIME NULL,
        sla_due_at DATETIME NOT NULL, resolved_at DATETIME NULL,
        resolution_cause VARCHAR(240) NULL,
        resolution_summary VARCHAR(2000) NULL,
        resolution_evidence VARCHAR(1000) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_automation_alert_key (alert_key),
        KEY idx_automation_alert_queue (status,severity,sla_due_at),
        KEY idx_automation_alert_policy (policy_id,last_seen_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS automation_alert_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, alert_id BIGINT UNSIGNED NOT NULL,
        event_type VARCHAR(80) NOT NULL, actor_name VARCHAR(190) NOT NULL DEFAULT 'system',
        note VARCHAR(2000) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_automation_alert_event (alert_id,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS automation_alert_policy_versions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, policy_id BIGINT UNSIGNED NOT NULL,
        version SMALLINT UNSIGNED NOT NULL, snapshot_json LONGTEXT NOT NULL,
        reason VARCHAR(1000) NOT NULL, created_by VARCHAR(190) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_automation_alert_policy_version (policy_id,version)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS automation_alert_engine_state (
        id TINYINT UNSIGNED NOT NULL, last_scan_at DATETIME NULL,
        execution_mode VARCHAR(40) NOT NULL DEFAULT 'internal_records_only',
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec('INSERT IGNORE INTO automation_alert_engine_state (id) VALUES (1)');

    $seeds = [
        ['workflow-approval-waiting','Workflow approval waiting','workflow_approval_waiting','A protected Workflow Automation approval is still pending.','high','Operations',60,30,120],
        ['workflow-failed-run','Workflow run failed','workflow_failed_run','A production workflow run ended in a failed state.','critical','Engineering',15,10,30],
        ['workflow-internal-alert','Workflow internal alert','internal_alert_open','Workflow Automation created an unresolved internal alert.','medium','Engineering',120,30,240],
        ['inventory-low-stock','Low-stock inventory watch','low_stock_snapshot','One or more products are at or below the recorded reorder threshold.','medium','Inventory',240,60,480],
        ['tracking-data-exception','Tracking data exception','tracking_exception','An event ledger group contains invalid or duplicate events.','high','Growth',60,30,120],
    ];
    $seed = $pdo->prepare("INSERT IGNORE INTO automation_alert_policies (policy_key,name,source_type,condition_text,severity,owner_name,sla_minutes,dedup_minutes,escalation_minutes,status,is_builtin) VALUES (:policy_key,:name,:source_type,:condition_text,:severity,:owner_name,:sla_minutes,:dedup_minutes,:escalation_minutes,'active',1)");
    foreach ($seeds as $item) $seed->execute([':policy_key' => $item[0], ':name' => $item[1], ':source_type' => $item[2], ':condition_text' => $item[3], ':severity' => $item[4], ':owner_name' => $item[5], ':sla_minutes' => $item[6], ':dedup_minutes' => $item[7], ':escalation_minutes' => $item[8]]);
}

function alertCapabilities(PDO $pdo): array
{
    return [
        'workflow_source' => alertTableExists($pdo, 'automation_runs') && alertTableExists($pdo, 'automation_approvals'),
        'inventory_source' => alertTableExists($pdo, 'products'),
        'tracking_source' => alertTableExists($pdo, 'tracking_event_ledger'),
        'order_source' => alertTableExists($pdo, 'orders'),
    ];
}

function alertWorkflowApprovalEvents(PDO $pdo): array
{
    if (!alertTableExists($pdo, 'automation_approvals') || !alertTableExists($pdo, 'automation_workflows')) return [];
    $query = $pdo->query("SELECT a.id source_id,a.entity_ref,a.action_summary,a.risk_reason,a.created_at,w.name workflow_name FROM automation_approvals a JOIN automation_workflows w ON w.id=a.workflow_id WHERE a.status='pending' ORDER BY a.id DESC LIMIT 250");
    $events = [];
    foreach (($query->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) $events[] = ['source_id' => 'approval|' . $row['source_id'], 'entity_ref' => alertText($row['entity_ref'] ?? '', 240), 'title' => 'Approval waiting · ' . alertText($row['workflow_name'] ?? '', 220), 'impact' => alertText($row['action_summary'] ?? '', 1000), 'evidence' => ['approval_id' => (int) $row['source_id'], 'risk_reason' => alertText($row['risk_reason'] ?? '', 1000), 'created_at' => alertText($row['created_at'] ?? '', 40)]];
    return $events;
}

function alertWorkflowFailureEvents(PDO $pdo): array
{
    if (!alertTableExists($pdo, 'automation_runs') || !alertTableExists($pdo, 'automation_workflows')) return [];
    $query = $pdo->query("SELECT r.id source_id,r.entity_ref,r.step,r.created_at,w.name workflow_name FROM automation_runs r JOIN automation_workflows w ON w.id=r.workflow_id WHERE r.status='failed' AND r.is_simulation=0 ORDER BY r.id DESC LIMIT 250");
    $events = [];
    foreach (($query->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) $events[] = ['source_id' => 'run|' . $row['source_id'], 'entity_ref' => alertText($row['entity_ref'] ?? '', 240), 'title' => 'Workflow failed · ' . alertText($row['workflow_name'] ?? '', 220), 'impact' => 'The internal workflow run failed. No downstream action is assumed to have completed.', 'evidence' => ['run_id' => (int) $row['source_id'], 'step' => alertText($row['step'] ?? '', 300), 'created_at' => alertText($row['created_at'] ?? '', 40)]];
    return $events;
}

function alertInternalEvents(PDO $pdo): array
{
    if (!alertTableExists($pdo, 'automation_internal_tasks') || !alertTableExists($pdo, 'automation_workflows')) return [];
    $query = $pdo->query("SELECT t.id source_id,t.entity_ref,t.title,t.created_at,w.name workflow_name FROM automation_internal_tasks t JOIN automation_workflows w ON w.id=t.workflow_id WHERE t.task_type='internal_alert' AND t.status='open' ORDER BY t.id DESC LIMIT 250");
    $events = [];
    foreach (($query->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) $events[] = ['source_id' => 'internal-alert|' . $row['source_id'], 'entity_ref' => alertText($row['entity_ref'] ?? '', 240), 'title' => alertText($row['title'] ?? '', 300), 'impact' => 'Workflow Automation recorded an internal exception that still needs review.', 'evidence' => ['task_id' => (int) $row['source_id'], 'workflow' => alertText($row['workflow_name'] ?? '', 240), 'created_at' => alertText($row['created_at'] ?? '', 40)]];
    return $events;
}

function alertInventoryEvents(PDO $pdo): array
{
    if (!alertTableExists($pdo, 'products')) return [];
    $columns = alertColumns($pdo, 'products');
    $stock = alertColumn($columns, ['stock_quantity','stock','inventory_count','quantity']);
    $threshold = alertColumn($columns, ['low_stock_threshold','reorder_level','minimum_stock']);
    if ($stock === null) return [];
    $where = $threshold ? "COALESCE(`{$stock}`,0)<=COALESCE(`{$threshold}`,5)" : "COALESCE(`{$stock}`,0)<=5";
    $row = $pdo->query("SELECT COUNT(*) low_count,MIN(COALESCE(`{$stock}`,0)) minimum_stock FROM products WHERE {$where}")->fetch(PDO::FETCH_ASSOC) ?: [];
    $count = (int) ($row['low_count'] ?? 0); if ($count < 1) return [];
    $minimum = (float) ($row['minimum_stock'] ?? 0);
    return [['source_id' => 'low-stock|' . $count . '|' . $minimum, 'entity_ref' => $count . ' low-stock products', 'title' => 'Inventory requires low-stock review', 'impact' => $count . ' product records are at or below their configured threshold. No purchase order was created.', 'evidence' => ['product_count' => $count, 'minimum_stock' => $minimum, 'aggregate_only' => true]]];
}

function alertTrackingEvents(PDO $pdo): array
{
    if (!alertTableExists($pdo, 'tracking_event_ledger')) return [];
    $columns = alertColumns($pdo, 'tracking_event_ledger');
    if (!in_array('event_name', $columns, true) || !in_array('received_at', $columns, true)) return [];
    $invalid = in_array('schema_valid', $columns, true) ? 'schema_valid=0' : '0=1';
    $duplicate = in_array('duplicate_count', $columns, true) ? 'duplicate_count>0' : '0=1';
    $invalidSum = in_array('schema_valid', $columns, true) ? 'schema_valid=0' : '0';
    $duplicateSum = in_array('duplicate_count', $columns, true) ? 'duplicate_count' : '0';
    $query = $pdo->query("SELECT event_name,DATE(received_at) event_date,SUM({$invalidSum}) invalid_count,SUM({$duplicateSum}) duplicate_count FROM tracking_event_ledger WHERE ({$invalid}) OR ({$duplicate}) GROUP BY event_name,DATE(received_at) ORDER BY event_date DESC LIMIT 100");
    $events = [];
    foreach (($query->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) {
        $name = alertText($row['event_name'] ?? '', 80); $date = alertText($row['event_date'] ?? '', 10); if ($name === '' || $date === '') continue;
        $invalidCount = (int) ($row['invalid_count'] ?? 0); $duplicateCount = (int) ($row['duplicate_count'] ?? 0);
        $events[] = ['source_id' => $name . '|' . $date, 'entity_ref' => $name . ' @ ' . $date, 'title' => 'Tracking integrity exception · ' . $name, 'impact' => $invalidCount . ' invalid and ' . $duplicateCount . ' duplicate event attempt(s) require diagnostic review.', 'evidence' => ['event_name' => $name, 'event_date' => $date, 'invalid' => $invalidCount, 'duplicates' => $duplicateCount]];
    }
    return $events;
}

function alertSourceEvents(PDO $pdo, string $sourceType): array
{
    if ($sourceType === 'workflow_approval_waiting') return alertWorkflowApprovalEvents($pdo);
    if ($sourceType === 'workflow_failed_run') return alertWorkflowFailureEvents($pdo);
    if ($sourceType === 'internal_alert_open') return alertInternalEvents($pdo);
    if ($sourceType === 'low_stock_snapshot') return alertInventoryEvents($pdo);
    if ($sourceType === 'tracking_exception') return alertTrackingEvents($pdo);
    return [];
}

function alertEvent(PDO $pdo, int $alertId, string $type, string $actor, string $note): void
{
    $save = $pdo->prepare('INSERT INTO automation_alert_events (alert_id,event_type,actor_name,note) VALUES (:alert_id,:event_type,:actor_name,:note)');
    $save->execute([':alert_id' => $alertId, ':event_type' => $type, ':actor_name' => $actor, ':note' => $note]);
}

function upsertAlert(PDO $pdo, array $policy, array $event): string
{
    $sourceId = alertText($event['source_id'] ?? '', 500); if ($sourceId === '') return 'deduplicated';
    $sourceHash = hash('sha256', (string) $policy['source_type'] . '|' . $sourceId);
    $alertKey = hash('sha256', (string) $policy['id'] . '|' . $sourceHash);
    $check = $pdo->prepare('SELECT * FROM automation_alerts WHERE alert_key=:alert_key FOR UPDATE');
    $check->execute([':alert_key' => $alertKey]); $existing = $check->fetch(PDO::FETCH_ASSOC);
    $evidence = json_encode($event['evidence'] ?? [], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '{}';
    $sla = max(1, min(10080, (int) $policy['sla_minutes']));
    $dedup = max(1, min(10080, (int) $policy['dedup_minutes']));
    if (!$existing) {
        $save = $pdo->prepare("INSERT INTO automation_alerts (alert_key,policy_id,source_type,source_ref_hash,entity_ref,title,severity,owner_name,business_impact,evidence_json,first_seen_at,last_seen_at,sla_due_at) VALUES (:alert_key,:policy_id,:source_type,:source_ref_hash,:entity_ref,:title,:severity,:owner_name,:business_impact,:evidence_json,NOW(),NOW(),DATE_ADD(NOW(),INTERVAL {$sla} MINUTE))");
        $save->execute([':alert_key' => $alertKey, ':policy_id' => $policy['id'], ':source_type' => $policy['source_type'], ':source_ref_hash' => $sourceHash, ':entity_ref' => alertText($event['entity_ref'] ?? '', 240), ':title' => alertText($event['title'] ?? $policy['name'], 300), ':severity' => $policy['severity'], ':owner_name' => $policy['owner_name'], ':business_impact' => alertText($event['impact'] ?? '', 1000), ':evidence_json' => $evidence]);
        $id = (int) $pdo->lastInsertId(); alertEvent($pdo, $id, 'created', 'system', 'Live source scan created this internal alert record.');
        return 'created';
    }
    $lastSeen = strtotime((string) ($existing['last_seen_at'] ?? '')) ?: 0;
    $repeat = $lastSeen <= time() - ($dedup * 60);
    $reopen = $existing['status'] === 'resolved' && $repeat;
    if ($reopen) {
        $save = $pdo->prepare("UPDATE automation_alerts SET status='open',occurrence_count=occurrence_count+1,severity=:severity,owner_name=:owner_name,business_impact=:business_impact,evidence_json=:evidence_json,last_seen_at=NOW(),acknowledged_at=NULL,snoozed_until=NULL,resolved_at=NULL,resolution_cause=NULL,resolution_summary=NULL,resolution_evidence=NULL,sla_due_at=DATE_ADD(NOW(),INTERVAL {$sla} MINUTE) WHERE id=:id");
        $save->execute([':severity' => $policy['severity'], ':owner_name' => $policy['owner_name'], ':business_impact' => alertText($event['impact'] ?? '', 1000), ':evidence_json' => $evidence, ':id' => $existing['id']]);
        alertEvent($pdo, (int) $existing['id'], 'reopened', 'system', 'The live source condition appeared again after resolution.');
        return 'reopened';
    }
    $increment = $repeat ? 1 : 0;
    $save = $pdo->prepare("UPDATE automation_alerts SET occurrence_count=occurrence_count+{$increment},severity=:severity,owner_name=:owner_name,business_impact=:business_impact,evidence_json=:evidence_json,last_seen_at=NOW() WHERE id=:id");
    $save->execute([':severity' => $policy['severity'], ':owner_name' => $policy['owner_name'], ':business_impact' => alertText($event['impact'] ?? '', 1000), ':evidence_json' => $evidence, ':id' => $existing['id']]);
    if ($repeat) alertEvent($pdo, (int) $existing['id'], 'repeated', 'system', 'The same source condition repeated outside its deduplication window.');
    return $repeat ? 'repeated' : 'deduplicated';
}

function runAlertScan(PDO $pdo): array
{
    $policies = $pdo->query("SELECT * FROM automation_alert_policies WHERE status='active' ORDER BY id")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $result = ['created' => 0, 'reopened' => 0, 'repeated' => 0, 'deduplicated' => 0, 'sources' => []];
    $processed = 0; $pdo->beginTransaction();
    foreach ($policies as $policy) {
        $events = alertSourceEvents($pdo, (string) $policy['source_type']);
        $result['sources'][$policy['source_type']] = count($events);
        foreach ($events as $event) {
            if ($processed >= 500) break 2;
            $outcome = upsertAlert($pdo, $policy, $event); $result[$outcome]++; $processed++;
        }
    }
    $pdo->exec('UPDATE automation_alert_engine_state SET last_scan_at=NOW() WHERE id=1');
    $pdo->commit(); return $result;
}

function readAlertState(PDO $pdo): array
{
    $pdo->exec("UPDATE automation_alerts SET status='acknowledged',snoozed_until=NULL WHERE status='snoozed' AND snoozed_until<=NOW()");
    $engine = $pdo->query('SELECT last_scan_at,execution_mode FROM automation_alert_engine_state WHERE id=1')->fetch(PDO::FETCH_ASSOC) ?: [];
    $policies = $pdo->query("SELECT p.*,COUNT(a.id) alert_count,SUM(a.status<>'resolved') open_count,MAX(a.last_seen_at) last_seen_at FROM automation_alert_policies p LEFT JOIN automation_alerts a ON a.policy_id=p.id GROUP BY p.id ORDER BY FIELD(p.status,'active','paused','draft'),p.id")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $alerts = $pdo->query("SELECT a.*,p.name policy_name,p.condition_text,p.dedup_minutes,p.escalation_minutes FROM automation_alerts a JOIN automation_alert_policies p ON p.id=a.policy_id ORDER BY FIELD(a.status,'open','acknowledged','snoozed','resolved'),FIELD(a.severity,'critical','high','medium','low'),a.last_seen_at DESC LIMIT 300")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $activity = $pdo->query("SELECT e.*,a.title,a.entity_ref FROM automation_alert_events e JOIN automation_alerts a ON a.id=e.alert_id ORDER BY e.id DESC LIMIT 300")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $dailyRows = $pdo->query("SELECT event_date,SUM(created_count) created,SUM(resolved_count) resolved,SUM(critical_count) critical FROM (SELECT DATE(first_seen_at) event_date,COUNT(*) created_count,0 resolved_count,SUM(severity='critical') critical_count FROM automation_alerts WHERE first_seen_at>=DATE_SUB(CURDATE(),INTERVAL 13 DAY) GROUP BY DATE(first_seen_at) UNION ALL SELECT DATE(resolved_at) event_date,0 created_count,COUNT(*) resolved_count,0 critical_count FROM automation_alerts WHERE resolved_at IS NOT NULL AND resolved_at>=DATE_SUB(CURDATE(),INTERVAL 13 DAY) GROUP BY DATE(resolved_at)) d GROUP BY event_date ORDER BY event_date")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $dailyMap = []; foreach ($dailyRows as $row) $dailyMap[(string) $row['event_date']] = $row;
    $daily = []; $today = new DateTimeImmutable('today', new DateTimeZone('Asia/Dhaka'));
    for ($offset = 13; $offset >= 0; $offset--) {
        $day = $today->modify('-' . $offset . ' days')->format('Y-m-d'); $row = $dailyMap[$day] ?? [];
        $daily[] = ['event_date' => $day, 'created' => (int) ($row['created'] ?? 0), 'resolved' => (int) ($row['resolved'] ?? 0), 'critical' => (int) ($row['critical'] ?? 0)];
    }
    $summary = $pdo->query("SELECT SUM(status<>'resolved') open_alerts,SUM(status<>'resolved' AND severity IN ('critical','high')) urgent_alerts,SUM(status='open') unacknowledged,SUM(status='snoozed') snoozed,SUM(status<>'resolved' AND sla_due_at<NOW()) sla_breached,SUM(status='resolved' AND resolved_at>=DATE_SUB(NOW(),INTERVAL 30 DAY)) resolved_30d FROM automation_alerts")->fetch(PDO::FETCH_ASSOC) ?: [];
    $summary['active_policies'] = (int) $pdo->query("SELECT COUNT(*) FROM automation_alert_policies WHERE status='active'")->fetchColumn();
    return ['engine' => ['last_scan_at' => $engine['last_scan_at'] ?? null, 'execution_mode' => $engine['execution_mode'] ?? 'internal_records_only', 'timezone' => 'Asia/Dhaka'], 'capabilities' => alertCapabilities($pdo), 'summary' => $summary, 'policies' => $policies, 'alerts' => $alerts, 'activity' => $activity, 'daily' => $daily, 'generated_at' => date(DATE_ATOM)];
}

try {
    $pdo = getDatabaseConnection(); ensureAlertTables($pdo);
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') alertJson(200, array_merge(['success' => true], readAlertState($pdo)));
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') alertJson(405, ['success' => false, 'message' => 'Method not allowed.']);
    $payload = alertPayload(); $action = strtolower(alertText($payload['action'] ?? '', 60));

    if ($action === 'run_scan') {
        $result = runAlertScan($pdo); $changed = $result['created'] + $result['reopened'] + $result['repeated'];
        $message = $changed > 0 ? $changed . ' live alert record(s) created or updated. No underlying business action was executed.' : 'Live alert scan complete. Existing signals were safely deduplicated.';
        alertJson(200, array_merge(['success' => true, 'message' => $message, 'scan_result' => $result], readAlertState($pdo)));
    }
    if ($action === 'acknowledge') {
        $id = (int) ($payload['id'] ?? 0); $owner = alertText($payload['owner_name'] ?? '', 190); $note = alertText($payload['note'] ?? '', 2000);
        if ($id < 1 || $owner === '' || $note === '') alertJson(422, ['success' => false, 'message' => 'Choose an owner and add an acknowledgement note.']);
        $pdo->beginTransaction(); $query = $pdo->prepare('SELECT status FROM automation_alerts WHERE id=:id FOR UPDATE'); $query->execute([':id' => $id]); $status = $query->fetchColumn();
        if ($status === false) { $pdo->rollBack(); alertJson(404, ['success' => false, 'message' => 'Alert was not found.']); }
        if ($status === 'resolved') { $pdo->rollBack(); alertJson(409, ['success' => false, 'message' => 'Resolved alerts cannot be acknowledged again.']); }
        $save = $pdo->prepare("UPDATE automation_alerts SET status='acknowledged',owner_name=:owner_name,acknowledged_at=NOW(),snoozed_until=NULL WHERE id=:id"); $save->execute([':owner_name' => $owner, ':id' => $id]);
        alertEvent($pdo, $id, 'acknowledged', $owner, $note); $pdo->commit();
        alertJson(200, array_merge(['success' => true, 'message' => 'Alert ownership recorded. The source condition was not changed.'], readAlertState($pdo)));
    }
    if ($action === 'snooze') {
        $id = (int) ($payload['id'] ?? 0); $minutes = (int) ($payload['minutes'] ?? 0); $reason = alertText($payload['reason'] ?? '', 2000);
        if ($id < 1 || !in_array($minutes, [30,120,480,1440], true) || $reason === '') alertJson(422, ['success' => false, 'message' => 'Choose a supported snooze time and provide a reason.']);
        $pdo->beginTransaction(); $query = $pdo->prepare('SELECT status FROM automation_alerts WHERE id=:id FOR UPDATE'); $query->execute([':id' => $id]); $status = $query->fetchColumn();
        if ($status === false || $status === 'resolved') { $pdo->rollBack(); alertJson(409, ['success' => false, 'message' => 'Only an open alert can be snoozed.']); }
        $save = $pdo->prepare("UPDATE automation_alerts SET status='snoozed',snoozed_until=DATE_ADD(NOW(),INTERVAL {$minutes} MINUTE) WHERE id=:id"); $save->execute([':id' => $id]);
        alertEvent($pdo, $id, 'snoozed', 'admin', $reason); $pdo->commit();
        alertJson(200, array_merge(['success' => true, 'message' => 'Alert snoozed with an audit reason. Its SLA and source evidence remain visible.'], readAlertState($pdo)));
    }
    if ($action === 'resolve') {
        $id = (int) ($payload['id'] ?? 0); $cause = alertText($payload['cause'] ?? '', 240); $summary = alertText($payload['summary'] ?? '', 2000); $evidence = alertText($payload['evidence'] ?? '', 1000);
        if ($id < 1 || $cause === '' || $summary === '' || $evidence === '') alertJson(422, ['success' => false, 'message' => 'Root cause, resolution summary and evidence are required.']);
        $pdo->beginTransaction(); $query = $pdo->prepare('SELECT status FROM automation_alerts WHERE id=:id FOR UPDATE'); $query->execute([':id' => $id]); $status = $query->fetchColumn();
        if ($status === false || $status === 'resolved') { $pdo->rollBack(); alertJson(409, ['success' => false, 'message' => 'This alert is missing or already resolved.']); }
        $save = $pdo->prepare("UPDATE automation_alerts SET status='resolved',resolved_at=NOW(),snoozed_until=NULL,resolution_cause=:cause,resolution_summary=:summary,resolution_evidence=:evidence WHERE id=:id"); $save->execute([':cause' => $cause, ':summary' => $summary, ':evidence' => $evidence, ':id' => $id]);
        alertEvent($pdo, $id, 'resolved', 'admin', $cause . ' · ' . $summary . ' · Evidence: ' . $evidence); $pdo->commit();
        alertJson(200, array_merge(['success' => true, 'message' => 'Alert resolved with evidence. No underlying order, stock, courier or finance record was changed.'], readAlertState($pdo)));
    }
    if ($action === 'create_policy') {
        $sources = ['workflow_approval_waiting','workflow_failed_run','internal_alert_open','low_stock_snapshot','tracking_exception']; $severities = ['critical','high','medium','low'];
        $name = alertText($payload['name'] ?? '', 240); $source = strtolower(alertText($payload['source_type'] ?? '', 80)); $condition = alertText($payload['condition_text'] ?? '', 1000); $severity = strtolower(alertText($payload['severity'] ?? '', 20)); $owner = alertText($payload['owner_name'] ?? '', 190);
        $sla = max(5, min(10080, (int) ($payload['sla_minutes'] ?? 60))); $dedup = max(5, min(10080, (int) ($payload['dedup_minutes'] ?? 30))); $escalation = max(5, min(10080, (int) ($payload['escalation_minutes'] ?? 120)));
        if ($name === '' || !in_array($source, $sources, true) || $condition === '' || !in_array($severity, $severities, true) || $owner === '') alertJson(422, ['success' => false, 'message' => 'Complete the policy name, live source, condition, severity and owner.']);
        $key = 'custom-' . bin2hex(random_bytes(8)); $save = $pdo->prepare("INSERT INTO automation_alert_policies (policy_key,name,source_type,condition_text,severity,owner_name,sla_minutes,dedup_minutes,escalation_minutes,status) VALUES (:policy_key,:name,:source_type,:condition_text,:severity,:owner_name,:sla_minutes,:dedup_minutes,:escalation_minutes,'draft')");
        $save->execute([':policy_key' => $key, ':name' => $name, ':source_type' => $source, ':condition_text' => $condition, ':severity' => $severity, ':owner_name' => $owner, ':sla_minutes' => $sla, ':dedup_minutes' => $dedup, ':escalation_minutes' => $escalation]);
        $id = (int) $pdo->lastInsertId(); $snapshot = json_encode(['name' => $name, 'source_type' => $source, 'condition_text' => $condition, 'severity' => $severity, 'owner_name' => $owner, 'sla_minutes' => $sla, 'dedup_minutes' => $dedup, 'escalation_minutes' => $escalation, 'status' => 'draft'], JSON_UNESCAPED_SLASHES);
        $version = $pdo->prepare("INSERT INTO automation_alert_policy_versions (policy_id,version,snapshot_json,reason) VALUES (:policy_id,1,:snapshot_json,'Initial disabled draft')"); $version->execute([':policy_id' => $id, ':snapshot_json' => $snapshot]);
        alertJson(200, array_merge(['success' => true, 'message' => 'Alert policy saved as a disabled draft. It has not evaluated or notified anything.'], readAlertState($pdo)));
    }
    if ($action === 'change_policy_status') {
        $id = (int) ($payload['id'] ?? 0); $status = strtolower(alertText($payload['status'] ?? '', 20)); $reason = alertText($payload['reason'] ?? '', 1000);
        if ($id < 1 || !in_array($status, ['active','paused','draft'], true) || $reason === '') alertJson(422, ['success' => false, 'message' => 'Choose a valid policy state and provide an audit reason.']);
        $pdo->beginTransaction(); $query = $pdo->prepare('SELECT * FROM automation_alert_policies WHERE id=:id FOR UPDATE'); $query->execute([':id' => $id]); $policy = $query->fetch(PDO::FETCH_ASSOC);
        if (!$policy) { $pdo->rollBack(); alertJson(404, ['success' => false, 'message' => 'Alert policy was not found.']); }
        $nextVersion = (int) $policy['version'] + 1; $save = $pdo->prepare('UPDATE automation_alert_policies SET status=:status,version=:version WHERE id=:id'); $save->execute([':status' => $status, ':version' => $nextVersion, ':id' => $id]);
        $snapshot = json_encode(array_merge($policy, ['status' => $status, 'version' => $nextVersion]), JSON_UNESCAPED_SLASHES); $version = $pdo->prepare('INSERT INTO automation_alert_policy_versions (policy_id,version,snapshot_json,reason) VALUES (:policy_id,:version,:snapshot_json,:reason)'); $version->execute([':policy_id' => $id, ':version' => $nextVersion, ':snapshot_json' => $snapshot, ':reason' => $reason]); $pdo->commit();
        alertJson(200, array_merge(['success' => true, 'message' => 'Policy state saved with a version and audit reason. No scan ran automatically.'], readAlertState($pdo)));
    }
    alertJson(422, ['success' => false, 'message' => 'Unsupported automation alerts action.']);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('Automation alerts API error: ' . $error->getMessage());
    alertJson(500, ['success' => false, 'message' => 'Automation alerts could not be processed safely.']);
}
