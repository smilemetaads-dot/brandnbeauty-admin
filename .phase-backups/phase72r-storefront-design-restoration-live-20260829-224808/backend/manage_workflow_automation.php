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

function workflowJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function workflowText(mixed $value, int $limit = 1000): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function workflowPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function workflowTableExists(PDO $pdo, string $table): bool
{
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table' => $table]);
    return (int) $query->fetchColumn() > 0;
}

function workflowColumns(PDO $pdo, string $table): array
{
    if (!workflowTableExists($pdo, $table)) return [];
    $query = $pdo->prepare('SELECT LOWER(column_name) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table' => $table]);
    return $query->fetchAll(PDO::FETCH_COLUMN) ?: [];
}

function workflowColumn(array $columns, array $candidates): ?string
{
    foreach ($candidates as $candidate) if (in_array($candidate, $columns, true)) return $candidate;
    return null;
}

function ensureWorkflowTables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS automation_workflows (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, workflow_key VARCHAR(120) NOT NULL,
        name VARCHAR(240) NOT NULL, domain VARCHAR(80) NOT NULL,
        trigger_type VARCHAR(80) NOT NULL, condition_text VARCHAR(1000) NOT NULL,
        action_type ENUM('internal_task','internal_alert','approval_gate') NOT NULL,
        failure_policy VARCHAR(1000) NOT NULL,
        risk_level ENUM('safe_internal','approval_required') NOT NULL DEFAULT 'safe_internal',
        status ENUM('active','draft','paused') NOT NULL DEFAULT 'draft',
        owner_name VARCHAR(190) NOT NULL DEFAULT 'Operations', version SMALLINT UNSIGNED NOT NULL DEFAULT 1,
        is_builtin TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_automation_workflow_key (workflow_key),
        KEY idx_automation_workflow_state (status,trigger_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS automation_runs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, run_key CHAR(64) NOT NULL,
        workflow_id BIGINT UNSIGNED NOT NULL, source_type VARCHAR(80) NOT NULL,
        source_key_hash CHAR(64) NOT NULL, entity_ref VARCHAR(240) NOT NULL,
        status ENUM('succeeded','waiting_approval','failed','skipped') NOT NULL,
        step VARCHAR(300) NOT NULL, attempt SMALLINT UNSIGNED NOT NULL DEFAULT 1,
        is_simulation TINYINT(1) NOT NULL DEFAULT 0, evidence_json LONGTEXT NOT NULL,
        started_at DATETIME NOT NULL, finished_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_automation_run_key (run_key),
        KEY idx_automation_run_workflow (workflow_id,status,created_at),
        KEY idx_automation_run_date (created_at,status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS automation_internal_tasks (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, run_id BIGINT UNSIGNED NOT NULL,
        workflow_id BIGINT UNSIGNED NOT NULL, task_type ENUM('internal_task','internal_alert') NOT NULL,
        title VARCHAR(300) NOT NULL, entity_ref VARCHAR(240) NOT NULL,
        status ENUM('open','resolved','dismissed') NOT NULL DEFAULT 'open',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_automation_task_run (run_id),
        KEY idx_automation_task_status (status,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS automation_approvals (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, run_id BIGINT UNSIGNED NOT NULL,
        workflow_id BIGINT UNSIGNED NOT NULL, entity_ref VARCHAR(240) NOT NULL,
        action_summary VARCHAR(500) NOT NULL, risk_reason VARCHAR(1000) NOT NULL,
        status ENUM('pending','approved','rejected','expired') NOT NULL DEFAULT 'pending',
        decision_note TEXT NULL, reviewed_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_automation_approval_run (run_id),
        KEY idx_automation_approval_status (status,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS automation_workflow_versions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, workflow_id BIGINT UNSIGNED NOT NULL,
        version SMALLINT UNSIGNED NOT NULL, snapshot_json LONGTEXT NOT NULL,
        reason VARCHAR(1000) NOT NULL, created_by VARCHAR(190) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_automation_version_workflow (workflow_id,version)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS automation_engine_state (
        id TINYINT UNSIGNED NOT NULL, last_scan_at DATETIME NULL,
        execution_mode VARCHAR(40) NOT NULL DEFAULT 'guarded_manual',
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("INSERT IGNORE INTO automation_engine_state (id) VALUES (1)");

    $seeds = [
        ['order-created-review','New order internal review','Orders','order_created','A real order exists and this workflow version has not processed it.','internal_task','Create one internal exception record on failure; never alter the order.','safe_internal','Operations'],
        ['delivered-cod-review','Delivered order COD review','Finance','order_delivered','A real order status is delivered and the workflow version has not processed it.','approval_gate','Keep the finance action pending; never mark money reconciled.','approval_required','Finance'],
        ['low-stock-purchase-review','Low stock purchase review','Inventory','low_stock','Recorded stock is at or below its reorder threshold.','approval_gate','Create no purchase order; keep the recommendation pending.','approval_required','Purchasing'],
        ['tracking-integrity-alert','Tracking integrity exception','Tracking','tracking_exception','An internal event ledger row is invalid or recorded a duplicate attempt.','internal_alert','Record one internal alert; never publish or edit tracking.','safe_internal','Engineering'],
    ];
    $seed = $pdo->prepare("INSERT IGNORE INTO automation_workflows (workflow_key,name,domain,trigger_type,condition_text,action_type,failure_policy,risk_level,status,owner_name,is_builtin) VALUES (:workflow_key,:name,:domain,:trigger_type,:condition_text,:action_type,:failure_policy,:risk_level,'active',:owner_name,1)");
    foreach ($seeds as $item) $seed->execute([':workflow_key' => $item[0], ':name' => $item[1], ':domain' => $item[2], ':trigger_type' => $item[3], ':condition_text' => $item[4], ':action_type' => $item[5], ':failure_policy' => $item[6], ':risk_level' => $item[7], ':owner_name' => $item[8]]);
}

function workflowCapabilities(PDO $pdo): array
{
    return ['order_source' => workflowTableExists($pdo, 'orders'), 'inventory_source' => workflowTableExists($pdo, 'products'), 'tracking_source' => workflowTableExists($pdo, 'tracking_event_ledger')];
}

function workflowOrderEvents(PDO $pdo, string $trigger): array
{
    if (!workflowTableExists($pdo, 'orders')) return [];
    $columns = workflowColumns($pdo, 'orders');
    $id = workflowColumn($columns, ['id', 'order_id']); $status = workflowColumn($columns, ['status', 'order_status']); $created = workflowColumn($columns, ['created_at', 'order_date']); $number = workflowColumn($columns, ['order_number']);
    if ($id === null || $created === null || ($trigger === 'order_delivered' && $status === null)) return [];
    $select = ["`{$id}` source_id", "`{$created}` event_at"];
    $select[] = $status ? "`{$status}` order_status" : "'' order_status";
    $select[] = $number ? "`{$number}` order_number" : "'' order_number";
    $where = $trigger === 'order_delivered' ? "WHERE LOWER(`{$status}`)='delivered'" : '';
    $query = $pdo->query('SELECT ' . implode(',', $select) . " FROM orders {$where} ORDER BY `{$created}` DESC LIMIT 250");
    $events = [];
    foreach (($query->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) {
        $sourceId = workflowText($row['source_id'] ?? '', 190); if ($sourceId === '') continue;
        $orderNumber = workflowText($row['order_number'] ?? '', 190);
        $events[] = ['source_type' => 'orders', 'source_id' => $sourceId, 'entity_ref' => $orderNumber !== '' ? $orderNumber : 'Order #' . $sourceId, 'evidence' => ['trigger' => $trigger, 'order_status' => workflowText($row['order_status'] ?? '', 80), 'event_at' => workflowText($row['event_at'] ?? '', 40)]];
    }
    return $events;
}

function workflowInventoryEvents(PDO $pdo): array
{
    if (!workflowTableExists($pdo, 'products')) return [];
    $columns = workflowColumns($pdo, 'products');
    $stock = workflowColumn($columns, ['stock_quantity', 'stock', 'inventory_count', 'quantity']); $threshold = workflowColumn($columns, ['low_stock_threshold', 'reorder_level', 'minimum_stock']);
    if ($stock === null) return [];
    $where = $threshold ? "COALESCE(`{$stock}`,0)<=COALESCE(`{$threshold}`,5)" : "COALESCE(`{$stock}`,0)<=5";
    $row = $pdo->query("SELECT COUNT(*) low_count,MIN(COALESCE(`{$stock}`,0)) minimum_stock FROM products WHERE {$where}")->fetch(PDO::FETCH_ASSOC) ?: [];
    $count = (int) ($row['low_count'] ?? 0); if ($count < 1) return [];
    $minimum = (float) ($row['minimum_stock'] ?? 0);
    return [['source_type' => 'products', 'source_id' => 'low-stock-snapshot|' . $count . '|' . $minimum, 'entity_ref' => $count . ' low-stock products', 'evidence' => ['trigger' => 'low_stock', 'product_count' => $count, 'minimum_stock' => $minimum, 'aggregate_only' => true]]];
}

function workflowTrackingEvents(PDO $pdo): array
{
    if (!workflowTableExists($pdo, 'tracking_event_ledger')) return [];
    $columns = workflowColumns($pdo, 'tracking_event_ledger');
    if (!in_array('event_name', $columns, true) || !in_array('received_at', $columns, true)) return [];
    $invalid = in_array('schema_valid', $columns, true) ? 'schema_valid=0' : '0=1';
    $duplicate = in_array('duplicate_count', $columns, true) ? 'duplicate_count>0' : '0=1';
    $query = $pdo->query("SELECT event_name,DATE(received_at) event_date,SUM(" . (in_array('schema_valid', $columns, true) ? 'schema_valid=0' : '0') . ") invalid_count,SUM(" . (in_array('duplicate_count', $columns, true) ? 'duplicate_count' : '0') . ") duplicate_count FROM tracking_event_ledger WHERE ({$invalid}) OR ({$duplicate}) GROUP BY event_name,DATE(received_at) ORDER BY event_date DESC LIMIT 100");
    $events = [];
    foreach (($query->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) {
        $eventName = workflowText($row['event_name'] ?? '', 80); $date = workflowText($row['event_date'] ?? '', 10); if ($eventName === '' || $date === '') continue;
        $events[] = ['source_type' => 'tracking_event_ledger', 'source_id' => $eventName . '|' . $date, 'entity_ref' => $eventName . ' @ ' . $date, 'evidence' => ['trigger' => 'tracking_exception', 'invalid' => (int) ($row['invalid_count'] ?? 0), 'duplicates' => (int) ($row['duplicate_count'] ?? 0)]];
    }
    return $events;
}

function workflowEvents(PDO $pdo, string $trigger): array
{
    if ($trigger === 'order_created' || $trigger === 'order_delivered') return workflowOrderEvents($pdo, $trigger);
    if ($trigger === 'low_stock') return workflowInventoryEvents($pdo);
    if ($trigger === 'tracking_exception') return workflowTrackingEvents($pdo);
    return [];
}

function createWorkflowRun(PDO $pdo, array $workflow, array $event): bool
{
    $sourceHash = hash('sha256', (string) $event['source_type'] . '|' . (string) $event['source_id']);
    $runKey = hash('sha256', (string) $workflow['id'] . '|' . (string) $workflow['version'] . '|' . $sourceHash);
    $waiting = $workflow['action_type'] === 'approval_gate';
    $status = $waiting ? 'waiting_approval' : 'succeeded';
    $step = $waiting ? 'Approval request recorded; downstream action remains manual' : ($workflow['action_type'] === 'internal_alert' ? 'Internal alert recorded' : 'Internal task recorded');
    $evidence = json_encode($event['evidence'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $save = $pdo->prepare("INSERT IGNORE INTO automation_runs (run_key,workflow_id,source_type,source_key_hash,entity_ref,status,step,evidence_json,started_at,finished_at) VALUES (:run_key,:workflow_id,:source_type,:source_key_hash,:entity_ref,:status,:step,:evidence_json,NOW(),NOW())");
    $save->execute([':run_key' => $runKey, ':workflow_id' => $workflow['id'], ':source_type' => $event['source_type'], ':source_key_hash' => $sourceHash, ':entity_ref' => $event['entity_ref'], ':status' => $status, ':step' => $step, ':evidence_json' => $evidence ?: '{}']);
    if ($save->rowCount() !== 1) return false;
    $runId = (int) $pdo->lastInsertId();
    if ($waiting) {
        $approval = $pdo->prepare("INSERT INTO automation_approvals (run_id,workflow_id,entity_ref,action_summary,risk_reason) VALUES (:run_id,:workflow_id,:entity_ref,:action_summary,:risk_reason)");
        $approval->execute([':run_id' => $runId, ':workflow_id' => $workflow['id'], ':entity_ref' => $event['entity_ref'], ':action_summary' => 'Review the protected next step for ' . $workflow['name'] . '. Approval here does not execute it.', ':risk_reason' => $workflow['failure_policy']]);
    } else {
        $task = $pdo->prepare("INSERT INTO automation_internal_tasks (run_id,workflow_id,task_type,title,entity_ref) VALUES (:run_id,:workflow_id,:task_type,:title,:entity_ref)");
        $task->execute([':run_id' => $runId, ':workflow_id' => $workflow['id'], ':task_type' => $workflow['action_type'], ':title' => $workflow['name'], ':entity_ref' => $event['entity_ref']]);
    }
    return true;
}

function runSafeWorkflowScan(PDO $pdo): array
{
    $workflows = $pdo->query("SELECT * FROM automation_workflows WHERE status='active' ORDER BY id")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $created = 0; $duplicates = 0; $sourceCounts = [];
    $pdo->beginTransaction();
    foreach ($workflows as $workflow) {
        $events = workflowEvents($pdo, (string) $workflow['trigger_type']); $sourceCounts[$workflow['trigger_type']] = count($events);
        foreach ($events as $event) {
            if ($created >= 500) break 2;
            if (createWorkflowRun($pdo, $workflow, $event)) $created++; else $duplicates++;
        }
    }
    $pdo->exec('UPDATE automation_engine_state SET last_scan_at=NOW() WHERE id=1');
    $pdo->commit();
    return ['created' => $created, 'duplicates' => $duplicates, 'sources' => $sourceCounts];
}

function readWorkflowState(PDO $pdo): array
{
    $engine = $pdo->query('SELECT last_scan_at,execution_mode FROM automation_engine_state WHERE id=1')->fetch(PDO::FETCH_ASSOC) ?: [];
    $workflows = $pdo->query("SELECT w.*,COUNT(r.id) run_count,SUM(r.status='succeeded') success_count,SUM(r.status='waiting_approval') waiting_count,MAX(r.started_at) last_run_at FROM automation_workflows w LEFT JOIN automation_runs r ON r.workflow_id=w.id GROUP BY w.id ORDER BY FIELD(w.status,'active','paused','draft'),w.id")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $runs = $pdo->query("SELECT r.*,w.name workflow_name FROM automation_runs r JOIN automation_workflows w ON w.id=r.workflow_id ORDER BY r.id DESC LIMIT 300")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $approvals = $pdo->query("SELECT a.*,w.name workflow_name FROM automation_approvals a JOIN automation_workflows w ON w.id=a.workflow_id ORDER BY FIELD(a.status,'pending','approved','rejected','expired'),a.id DESC LIMIT 200")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $daily = $pdo->query("SELECT DATE(created_at) run_date,COUNT(*) runs,SUM(status='succeeded') succeeded,SUM(status IN ('failed','waiting_approval')) exceptions,SUM(is_simulation=1) simulations FROM automation_runs WHERE created_at>=DATE_SUB(CURDATE(),INTERVAL 13 DAY) GROUP BY DATE(created_at) ORDER BY run_date")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $totals = $pdo->query("SELECT COUNT(*) total_runs,SUM(status='succeeded' AND is_simulation=0) succeeded_runs,SUM(status='failed') failed_runs,SUM(is_simulation=1) simulations,SUM(is_simulation=0) production_runs FROM automation_runs")->fetch(PDO::FETCH_ASSOC) ?: [];
    $active = (int) $pdo->query("SELECT COUNT(*) FROM automation_workflows WHERE status='active'")->fetchColumn();
    $pending = (int) $pdo->query("SELECT COUNT(*) FROM automation_approvals WHERE status='pending'")->fetchColumn();
    $productionRuns = (int) ($totals['production_runs'] ?? 0); $success = (int) ($totals['succeeded_runs'] ?? 0);
    return ['engine' => ['last_scan_at' => $engine['last_scan_at'] ?? null, 'execution_mode' => $engine['execution_mode'] ?? 'guarded_manual', 'timezone' => 'Asia/Dhaka'], 'capabilities' => workflowCapabilities($pdo), 'summary' => ['active_workflows' => $active, 'total_runs' => (int) ($totals['total_runs'] ?? 0), 'success_rate' => $productionRuns > 0 ? round($success * 100 / $productionRuns, 2) : 0.0, 'pending_approvals' => $pending, 'failed_runs' => (int) ($totals['failed_runs'] ?? 0), 'simulations' => (int) ($totals['simulations'] ?? 0)], 'workflows' => $workflows, 'runs' => $runs, 'approvals' => $approvals, 'daily' => $daily, 'generated_at' => date(DATE_ATOM)];
}

try {
    $pdo = getDatabaseConnection(); ensureWorkflowTables($pdo);
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') workflowJson(200, array_merge(['success' => true], readWorkflowState($pdo)));
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') workflowJson(405, ['success' => false, 'message' => 'Method not allowed.']);
    $payload = workflowPayload(); $action = strtolower(workflowText($payload['action'] ?? '', 60));

    if ($action === 'run_scan') {
        $result = runSafeWorkflowScan($pdo);
        $message = $result['created'] > 0 ? $result['created'] . ' guarded run record(s) created. No protected downstream action was executed.' : 'Safe scan complete. No new source record required a workflow run.';
        workflowJson(200, array_merge(['success' => true, 'message' => $message, 'scan_result' => $result], readWorkflowState($pdo)));
    }
    if ($action === 'create_workflow') {
        $triggers = ['order_created','order_delivered','low_stock','tracking_exception','manual_only']; $actions = ['internal_task','internal_alert','approval_gate'];
        $name = workflowText($payload['name'] ?? '', 240); $domain = workflowText($payload['domain'] ?? '', 80); $trigger = strtolower(workflowText($payload['trigger_type'] ?? '', 80)); $condition = workflowText($payload['condition_text'] ?? '', 1000); $actionType = strtolower(workflowText($payload['action_type'] ?? '', 40)); $failure = workflowText($payload['failure_policy'] ?? '', 1000); $owner = workflowText($payload['owner_name'] ?? '', 190);
        if ($name === '' || $domain === '' || !in_array($trigger, $triggers, true) || !in_array($actionType, $actions, true) || $condition === '' || $failure === '' || $owner === '') workflowJson(422, ['success' => false, 'message' => 'Complete the workflow name, source, safe action, condition, owner and failure policy.']);
        $key = 'custom-' . bin2hex(random_bytes(8)); $risk = $actionType === 'approval_gate' ? 'approval_required' : 'safe_internal';
        $save = $pdo->prepare("INSERT INTO automation_workflows (workflow_key,name,domain,trigger_type,condition_text,action_type,failure_policy,risk_level,status,owner_name) VALUES (:workflow_key,:name,:domain,:trigger_type,:condition_text,:action_type,:failure_policy,:risk_level,'draft',:owner_name)");
        $save->execute([':workflow_key' => $key, ':name' => $name, ':domain' => $domain, ':trigger_type' => $trigger, ':condition_text' => $condition, ':action_type' => $actionType, ':failure_policy' => $failure, ':risk_level' => $risk, ':owner_name' => $owner]);
        $workflowId = (int) $pdo->lastInsertId(); $snapshot = json_encode(['name' => $name, 'domain' => $domain, 'trigger_type' => $trigger, 'condition_text' => $condition, 'action_type' => $actionType, 'failure_policy' => $failure, 'risk_level' => $risk, 'owner_name' => $owner], JSON_UNESCAPED_SLASHES);
        $version = $pdo->prepare("INSERT INTO automation_workflow_versions (workflow_id,version,snapshot_json,reason) VALUES (:workflow_id,1,:snapshot_json,'Initial disabled draft')"); $version->execute([':workflow_id' => $workflowId, ':snapshot_json' => $snapshot]);
        workflowJson(200, array_merge(['success' => true, 'message' => 'Workflow saved as a disabled draft. It has not scanned or changed any live record.'], readWorkflowState($pdo)));
    }
    if ($action === 'change_status') {
        $id = (int) ($payload['id'] ?? 0); $status = strtolower(workflowText($payload['status'] ?? '', 20)); $reason = workflowText($payload['reason'] ?? '', 1000);
        if ($id < 1 || !in_array($status, ['active','paused','draft'], true) || $reason === '') workflowJson(422, ['success' => false, 'message' => 'Choose a valid workflow state and provide a change reason.']);
        $current = $pdo->prepare('SELECT * FROM automation_workflows WHERE id=:id'); $current->execute([':id' => $id]); $workflow = $current->fetch(PDO::FETCH_ASSOC);
        if (!$workflow) workflowJson(404, ['success' => false, 'message' => 'Workflow was not found.']);
        $pdo->beginTransaction(); $save = $pdo->prepare('UPDATE automation_workflows SET status=:status WHERE id=:id'); $save->execute([':status' => $status, ':id' => $id]);
        $snapshot = json_encode(array_merge($workflow, ['status' => $status]), JSON_UNESCAPED_SLASHES); $version = $pdo->prepare('INSERT INTO automation_workflow_versions (workflow_id,version,snapshot_json,reason) VALUES (:workflow_id,:version,:snapshot_json,:reason)'); $version->execute([':workflow_id' => $id, ':version' => $workflow['version'], ':snapshot_json' => $snapshot, ':reason' => $reason]); $pdo->commit();
        workflowJson(200, array_merge(['success' => true, 'message' => 'Workflow state saved with an audit reason. No scan or downstream action ran automatically.'], readWorkflowState($pdo)));
    }
    if ($action === 'simulate_workflow') {
        $id = (int) ($payload['id'] ?? 0); $reference = workflowText($payload['reference'] ?? '', 120);
        if ($id < 1 || preg_match('/^[A-Za-z0-9_-]{4,120}$/', $reference) !== 1) workflowJson(422, ['success' => false, 'message' => 'Choose a workflow and a safe synthetic reference using letters, numbers, dash or underscore.']);
        $query = $pdo->prepare('SELECT * FROM automation_workflows WHERE id=:id'); $query->execute([':id' => $id]); $workflow = $query->fetch(PDO::FETCH_ASSOC); if (!$workflow) workflowJson(404, ['success' => false, 'message' => 'Workflow was not found.']);
        $runKey = hash('sha256', 'simulation|' . $id . '|' . $reference . '|' . microtime(true)); $sourceHash = hash('sha256', 'synthetic|' . $reference); $evidence = json_encode(['synthetic' => true, 'reference' => $reference, 'no_live_source' => true], JSON_UNESCAPED_SLASHES);
        $save = $pdo->prepare("INSERT INTO automation_runs (run_key,workflow_id,source_type,source_key_hash,entity_ref,status,step,is_simulation,evidence_json,started_at,finished_at) VALUES (:run_key,:workflow_id,'synthetic',:source_key_hash,:entity_ref,'succeeded','Simulation recorded; no task, approval or side effect created',1,:evidence_json,NOW(),NOW())");
        $save->execute([':run_key' => $runKey, ':workflow_id' => $id, ':source_key_hash' => $sourceHash, ':entity_ref' => $reference, ':evidence_json' => $evidence]);
        workflowJson(200, array_merge(['success' => true, 'message' => 'Synthetic simulation recorded. No live record or downstream action was touched.'], readWorkflowState($pdo)));
    }
    if ($action === 'review_approval') {
        $id = (int) ($payload['id'] ?? 0); $status = strtolower(workflowText($payload['status'] ?? '', 20)); $note = workflowText($payload['decision_note'] ?? '', 2000);
        if ($id < 1 || !in_array($status, ['approved','rejected'], true) || $note === '') workflowJson(422, ['success' => false, 'message' => 'Choose an approval decision and add a decision note.']);
        $pdo->beginTransaction(); $query = $pdo->prepare("SELECT run_id FROM automation_approvals WHERE id=:id AND status='pending' FOR UPDATE"); $query->execute([':id' => $id]); $runId = (int) ($query->fetchColumn() ?: 0);
        if ($runId < 1) { $pdo->rollBack(); workflowJson(409, ['success' => false, 'message' => 'This approval is no longer pending.']); }
        $save = $pdo->prepare('UPDATE automation_approvals SET status=:status,decision_note=:decision_note,reviewed_at=NOW() WHERE id=:id'); $save->execute([':status' => $status, ':decision_note' => $note, ':id' => $id]);
        $runStatus = $status === 'approved' ? 'succeeded' : 'skipped'; $step = $status === 'approved' ? 'Approval recorded; protected downstream action remains manual' : 'Approval rejected; no downstream action allowed';
        $run = $pdo->prepare('UPDATE automation_runs SET status=:status,step=:step,finished_at=NOW() WHERE id=:id'); $run->execute([':status' => $runStatus, ':step' => $step, ':id' => $runId]); $pdo->commit();
        workflowJson(200, array_merge(['success' => true, 'message' => 'Human decision recorded. No courier, stock, finance or customer action was executed.'], readWorkflowState($pdo)));
    }
    workflowJson(422, ['success' => false, 'message' => 'Unsupported workflow automation action.']);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('Workflow automation API error: ' . $error->getMessage());
    workflowJson(500, ['success' => false, 'message' => 'Workflow automation could not be processed safely.']);
}
