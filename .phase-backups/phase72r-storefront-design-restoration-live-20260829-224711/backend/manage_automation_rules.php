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

function ruleJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function ruleText(mixed $value, int $limit = 1000): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function rulePayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function ruleTableExists(PDO $pdo, string $table): bool
{
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table' => $table]);
    return (int) $query->fetchColumn() > 0;
}

function ruleColumns(PDO $pdo, string $table): array
{
    if (!ruleTableExists($pdo, $table)) return [];
    $query = $pdo->prepare('SELECT LOWER(column_name) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table' => $table]);
    return $query->fetchAll(PDO::FETCH_COLUMN) ?: [];
}

function ruleColumn(array $columns, array $candidates): ?string
{
    foreach ($candidates as $candidate) if (in_array($candidate, $columns, true)) return $candidate;
    return null;
}

function ruleSnapshot(array $rule): string
{
    $keys = ['rule_key','name','domain_name','scope_name','source_type','condition_text','outcome_text','fallback_text','owner_name','priority','risk_level','approval_required','dependency_text','status','version'];
    $snapshot = [];
    foreach ($keys as $key) $snapshot[$key] = $rule[$key] ?? null;
    return json_encode($snapshot, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '{}';
}

function ensureRuleTables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS automation_rules (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        rule_key VARCHAR(140) NOT NULL, name VARCHAR(240) NOT NULL,
        domain_name VARCHAR(100) NOT NULL, scope_name VARCHAR(190) NOT NULL,
        source_type VARCHAR(80) NOT NULL, condition_text VARCHAR(1200) NOT NULL,
        outcome_text VARCHAR(1200) NOT NULL, fallback_text VARCHAR(1200) NOT NULL,
        owner_name VARCHAR(190) NOT NULL DEFAULT 'Operations',
        priority TINYINT UNSIGNED NOT NULL DEFAULT 50,
        risk_level ENUM('standard','elevated','protected') NOT NULL DEFAULT 'standard',
        approval_required TINYINT(1) NOT NULL DEFAULT 0,
        dependency_text VARCHAR(1000) NOT NULL DEFAULT '',
        status ENUM('active','draft','paused','archived') NOT NULL DEFAULT 'draft',
        is_builtin TINYINT(1) NOT NULL DEFAULT 0,
        version SMALLINT UNSIGNED NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_automation_rule_key (rule_key),
        KEY idx_automation_rule_state (status,domain_name,priority)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS automation_rule_versions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, rule_id BIGINT UNSIGNED NOT NULL,
        version SMALLINT UNSIGNED NOT NULL, snapshot_json LONGTEXT NOT NULL,
        reason VARCHAR(1000) NOT NULL, created_by VARCHAR(190) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_automation_rule_version (rule_id,version),
        KEY idx_automation_rule_version_time (rule_id,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS automation_rule_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, rule_id BIGINT UNSIGNED NOT NULL,
        event_type VARCHAR(80) NOT NULL, actor_name VARCHAR(190) NOT NULL DEFAULT 'system',
        note VARCHAR(2000) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_automation_rule_event (rule_id,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS automation_rule_simulations (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, rule_id BIGINT UNSIGNED NOT NULL,
        result ENUM('matched','clear','unavailable') NOT NULL,
        matched_records INT UNSIGNED NOT NULL DEFAULT 0,
        evidence_text VARCHAR(2000) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_automation_rule_simulation (rule_id,created_at),
        KEY idx_automation_rule_result (result,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS automation_rule_engine_state (
        id TINYINT UNSIGNED NOT NULL, last_simulation_at DATETIME NULL,
        execution_mode VARCHAR(50) NOT NULL DEFAULT 'simulation_only',
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec('INSERT IGNORE INTO automation_rule_engine_state (id) VALUES (1)');

    $seeds = [
        ['new-order-review','New order internal review','Orders','Order intake','orders_exist','At least one real order exists in the live order ledger.','Record an internal review recommendation.','Keep every order unchanged.','Operations',10,'standard',0,'Orders, Workflow Automation'],
        ['delivered-cod-review','Delivered order COD review','Finance','COD reconciliation','delivered_orders','A delivered order exists and may require COD reconciliation review.','Route evidence to the protected finance approval boundary.','Keep settlement unreconciled until Finance acts.','Finance',20,'protected',1,'Orders, Finance Reconciliation, Workflow Automation'],
        ['low-stock-review','Low stock purchase review','Inventory','Purchasing','low_stock','Recorded stock is at or below its configured reorder threshold.','Create an internal purchase review recommendation.','Do not create a purchase order or change stock.','Inventory',30,'protected',1,'Products, Inventory, Suppliers'],
        ['tracking-integrity-review','Tracking integrity exception','Tracking','Event quality','tracking_exception','A real tracking ledger group contains invalid or duplicate attempts.','Record an internal tracking remediation recommendation.','Do not publish, resend or alter an event.','Growth',40,'elevated',1,'Tracking & Attribution, Alerts'],
        ['workflow-failure-review','Workflow failure review','Automation','Workflow runs','workflow_failed','A non-simulation workflow run has failed.','Record an internal engineering review recommendation.','Assume no downstream action completed.','Engineering',15,'elevated',1,'Workflow Automation, Alerts'],
        ['workflow-approval-review','Workflow approval waiting','Automation','Approvals','workflow_approval_waiting','A protected workflow approval is still waiting.','Surface the waiting approval in simulation evidence.','Do not approve or reject it automatically.','Operations',25,'protected',1,'Workflow Automation'],
        ['alert-sla-review','Alert SLA breach review','Automation','Alert governance','alert_sla_breached','An unresolved alert has passed its recorded SLA due time.','Record escalation evidence for human review.','Do not resolve or suppress the alert.','Operations',12,'elevated',1,'Automation Alerts'],
        ['alert-ownership-review','Unacknowledged alert review','Automation','Alert ownership','alert_unacknowledged','An open alert has not yet been acknowledged by an owner.','Record ownership follow-up evidence.','Do not acknowledge it on behalf of a user.','Operations',35,'standard',0,'Automation Alerts'],
    ];
    $seed = $pdo->prepare("INSERT IGNORE INTO automation_rules (rule_key,name,domain_name,scope_name,source_type,condition_text,outcome_text,fallback_text,owner_name,priority,risk_level,approval_required,dependency_text,status,is_builtin) VALUES (:rule_key,:name,:domain_name,:scope_name,:source_type,:condition_text,:outcome_text,:fallback_text,:owner_name,:priority,:risk_level,:approval_required,:dependency_text,'active',1)");
    foreach ($seeds as $item) $seed->execute([':rule_key'=>$item[0],':name'=>$item[1],':domain_name'=>$item[2],':scope_name'=>$item[3],':source_type'=>$item[4],':condition_text'=>$item[5],':outcome_text'=>$item[6],':fallback_text'=>$item[7],':owner_name'=>$item[8],':priority'=>$item[9],':risk_level'=>$item[10],':approval_required'=>$item[11],':dependency_text'=>$item[12]]);

    $rules = $pdo->query('SELECT * FROM automation_rules WHERE is_builtin=1')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $version = $pdo->prepare("INSERT IGNORE INTO automation_rule_versions (rule_id,version,snapshot_json,reason,created_by) VALUES (:rule_id,1,:snapshot_json,'Verified built-in rule','system')");
    foreach ($rules as $rule) $version->execute([':rule_id'=>$rule['id'], ':snapshot_json'=>ruleSnapshot($rule)]);
}

function ruleCapabilities(PDO $pdo): array
{
    return [
        'workflows' => ruleTableExists($pdo, 'automation_workflows') && ruleTableExists($pdo, 'automation_runs'),
        'alerts' => ruleTableExists($pdo, 'automation_alert_policies') && ruleTableExists($pdo, 'automation_alerts'),
        'orders' => ruleTableExists($pdo, 'orders'),
        'inventory' => ruleTableExists($pdo, 'products'),
        'tracking' => ruleTableExists($pdo, 'tracking_event_ledger'),
    ];
}

function evaluateRule(PDO $pdo, string $sourceType): array
{
    if ($sourceType === 'orders_exist') {
        if (!ruleTableExists($pdo, 'orders')) return ['unavailable',0,'Orders table is not available.'];
        $count = (int) $pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn();
        return [$count > 0 ? 'matched' : 'clear',$count,$count . ' real order record(s) observed.'];
    }
    if ($sourceType === 'delivered_orders') {
        if (!ruleTableExists($pdo, 'orders')) return ['unavailable',0,'Orders table is not available.'];
        $columns = ruleColumns($pdo, 'orders'); $status = ruleColumn($columns, ['status','order_status']);
        if ($status === null) return ['unavailable',0,'No supported order status column is available.'];
        $count = (int) $pdo->query("SELECT COUNT(*) FROM orders WHERE LOWER(COALESCE(`{$status}`,'')) IN ('delivered','completed')")->fetchColumn();
        return [$count > 0 ? 'matched' : 'clear',$count,$count . ' delivered order record(s) observed.'];
    }
    if ($sourceType === 'low_stock') {
        if (!ruleTableExists($pdo, 'products')) return ['unavailable',0,'Products table is not available.'];
        $columns = ruleColumns($pdo, 'products'); $stock = ruleColumn($columns, ['stock_quantity','stock','inventory_count','quantity']); $threshold = ruleColumn($columns, ['low_stock_threshold','reorder_level','minimum_stock']);
        if ($stock === null) return ['unavailable',0,'No supported stock column is available.'];
        $where = $threshold ? "COALESCE(`{$stock}`,0)<=COALESCE(`{$threshold}`,5)" : "COALESCE(`{$stock}`,0)<=5";
        $count = (int) $pdo->query("SELECT COUNT(*) FROM products WHERE {$where}")->fetchColumn();
        return [$count > 0 ? 'matched' : 'clear',$count,$count . ' low-stock product record(s) observed; no purchase was created.'];
    }
    if ($sourceType === 'tracking_exception') {
        if (!ruleTableExists($pdo, 'tracking_event_ledger')) return ['unavailable',0,'Tracking ledger is not available.'];
        $columns = ruleColumns($pdo, 'tracking_event_ledger'); $tests = [];
        if (in_array('schema_valid',$columns,true)) $tests[] = 'schema_valid=0';
        if (in_array('duplicate_count',$columns,true)) $tests[] = 'duplicate_count>0';
        if (!$tests) return ['unavailable',0,'No supported tracking integrity columns are available.'];
        $count = (int) $pdo->query('SELECT COUNT(*) FROM tracking_event_ledger WHERE ' . implode(' OR ', $tests))->fetchColumn();
        return [$count > 0 ? 'matched' : 'clear',$count,$count . ' tracking exception record(s) observed.'];
    }
    if ($sourceType === 'workflow_failed') {
        if (!ruleTableExists($pdo, 'automation_runs')) return ['unavailable',0,'Workflow run ledger is not available.'];
        $columns = ruleColumns($pdo, 'automation_runs'); $where = "status='failed'";
        if (in_array('is_simulation',$columns,true)) $where .= ' AND is_simulation=0';
        $count = (int) $pdo->query('SELECT COUNT(*) FROM automation_runs WHERE ' . $where)->fetchColumn();
        return [$count > 0 ? 'matched' : 'clear',$count,$count . ' failed production workflow run(s) observed.'];
    }
    if ($sourceType === 'workflow_approval_waiting') {
        if (!ruleTableExists($pdo, 'automation_approvals')) return ['unavailable',0,'Workflow approval ledger is not available.'];
        $count = (int) $pdo->query("SELECT COUNT(*) FROM automation_approvals WHERE status='pending'")->fetchColumn();
        return [$count > 0 ? 'matched' : 'clear',$count,$count . ' pending workflow approval(s) observed.'];
    }
    if ($sourceType === 'alert_sla_breached') {
        if (!ruleTableExists($pdo, 'automation_alerts')) return ['unavailable',0,'Automation alert ledger is not available.'];
        $count = (int) $pdo->query("SELECT COUNT(*) FROM automation_alerts WHERE status<>'resolved' AND sla_due_at<NOW()")->fetchColumn();
        return [$count > 0 ? 'matched' : 'clear',$count,$count . ' unresolved alert SLA breach(es) observed.'];
    }
    if ($sourceType === 'alert_unacknowledged') {
        if (!ruleTableExists($pdo, 'automation_alerts')) return ['unavailable',0,'Automation alert ledger is not available.'];
        $count = (int) $pdo->query("SELECT COUNT(*) FROM automation_alerts WHERE status='open'")->fetchColumn();
        return [$count > 0 ? 'matched' : 'clear',$count,$count . ' unacknowledged open alert(s) observed.'];
    }
    return ['unavailable',0,'This rule source does not have a verified evaluator.'];
}

function ruleEvent(PDO $pdo, int $ruleId, string $type, string $actor, string $note): void
{
    $save = $pdo->prepare('INSERT INTO automation_rule_events (rule_id,event_type,actor_name,note) VALUES (:rule_id,:event_type,:actor_name,:note)');
    $save->execute([':rule_id'=>$ruleId,':event_type'=>$type,':actor_name'=>$actor,':note'=>$note]);
}

function runSafeRuleSimulation(PDO $pdo): array
{
    $rules = $pdo->query("SELECT * FROM automation_rules WHERE status='active' ORDER BY priority,id LIMIT 250")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $result = ['matched'=>0,'clear'=>0,'unavailable'=>0,'evaluated'=>0];
    $save = $pdo->prepare('INSERT INTO automation_rule_simulations (rule_id,result,matched_records,evidence_text) VALUES (:rule_id,:result,:matched_records,:evidence_text)');
    $pdo->beginTransaction();
    foreach ($rules as $rule) {
        [$outcome,$count,$evidence] = evaluateRule($pdo, (string) $rule['source_type']);
        $save->execute([':rule_id'=>$rule['id'],':result'=>$outcome,':matched_records'=>$count,':evidence_text'=>ruleText($evidence,2000)]);
        ruleEvent($pdo,(int)$rule['id'],'simulated','system',ucfirst($outcome) . ' · ' . $evidence . ' No business record was changed.');
        $result[$outcome]++; $result['evaluated']++;
    }
    $pdo->exec('UPDATE automation_rule_engine_state SET last_simulation_at=NOW() WHERE id=1');
    $pdo->commit();
    return $result;
}

function readRuleState(PDO $pdo): array
{
    $engine = $pdo->query('SELECT last_simulation_at,execution_mode FROM automation_rule_engine_state WHERE id=1')->fetch(PDO::FETCH_ASSOC) ?: [];
    $rules = $pdo->query("SELECT r.*,(SELECT COUNT(*) FROM automation_rule_simulations s WHERE s.rule_id=r.id) simulation_count,(SELECT COUNT(*) FROM automation_rule_simulations s WHERE s.rule_id=r.id AND s.result='matched') matched_count,(SELECT s.result FROM automation_rule_simulations s WHERE s.rule_id=r.id ORDER BY s.id DESC LIMIT 1) last_result,(SELECT s.created_at FROM automation_rule_simulations s WHERE s.rule_id=r.id ORDER BY s.id DESC LIMIT 1) last_simulated_at FROM automation_rules r ORDER BY FIELD(r.status,'active','paused','draft','archived'),r.priority,r.id")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $simulations = $pdo->query('SELECT s.*,r.name rule_name FROM automation_rule_simulations s JOIN automation_rules r ON r.id=s.rule_id ORDER BY s.id DESC LIMIT 400')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $versions = $pdo->query('SELECT v.id,v.rule_id,v.version,v.reason,v.created_by,v.created_at,r.name rule_name FROM automation_rule_versions v JOIN automation_rules r ON r.id=v.rule_id ORDER BY v.id DESC LIMIT 400')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $activity = $pdo->query('SELECT e.*,r.name rule_name FROM automation_rule_events e JOIN automation_rules r ON r.id=e.rule_id ORDER BY e.id DESC LIMIT 400')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $dailyRows = $pdo->query("SELECT DATE(created_at) evaluation_date,SUM(result='matched') matched_count,SUM(result='clear') clear_count,SUM(result='unavailable') unavailable_count FROM automation_rule_simulations WHERE created_at>=DATE_SUB(CURDATE(),INTERVAL 13 DAY) GROUP BY DATE(created_at) ORDER BY evaluation_date")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $dailyMap = []; foreach ($dailyRows as $row) $dailyMap[(string)$row['evaluation_date']] = $row;
    $daily = []; $today = new DateTimeImmutable('today',new DateTimeZone('Asia/Dhaka'));
    for ($offset=13;$offset>=0;$offset--) { $day=$today->modify('-'.$offset.' days')->format('Y-m-d'); $row=$dailyMap[$day]??[]; $daily[]=['evaluation_date'=>$day,'matched_count'=>(int)($row['matched_count']??0),'clear_count'=>(int)($row['clear_count']??0),'unavailable_count'=>(int)($row['unavailable_count']??0)]; }
    $summary = $pdo->query("SELECT COUNT(*) total_rules,SUM(status='active') active_rules,SUM(status='draft') draft_rules,SUM(risk_level='protected') protected_rules FROM automation_rules")->fetch(PDO::FETCH_ASSOC) ?: [];
    $summary['simulations_30d'] = (int)$pdo->query('SELECT COUNT(*) FROM automation_rule_simulations WHERE created_at>=DATE_SUB(NOW(),INTERVAL 30 DAY)')->fetchColumn();
    $summary['matched_latest'] = (int)$pdo->query("SELECT COUNT(*) FROM automation_rule_simulations s JOIN (SELECT rule_id,MAX(id) latest_id FROM automation_rule_simulations GROUP BY rule_id) latest ON latest.latest_id=s.id WHERE s.result='matched'")->fetchColumn();
    return ['engine'=>['last_simulation_at'=>$engine['last_simulation_at']??null,'execution_mode'=>$engine['execution_mode']??'simulation_only','timezone'=>'Asia/Dhaka'],'capabilities'=>ruleCapabilities($pdo),'summary'=>$summary,'rules'=>$rules,'simulations'=>$simulations,'versions'=>$versions,'activity'=>$activity,'daily'=>$daily,'generated_at'=>date(DATE_ATOM)];
}

try {
    $pdo = getDatabaseConnection(); ensureRuleTables($pdo);
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') ruleJson(200,array_merge(['success'=>true],readRuleState($pdo)));
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') ruleJson(405,['success'=>false,'message'=>'Method not allowed.']);
    $payload = rulePayload(); $action = strtolower(ruleText($payload['action'] ?? '',60));

    if ($action === 'run_safe_simulation') {
        $result = runSafeRuleSimulation($pdo);
        ruleJson(200,array_merge(['success'=>true,'message'=>$result['evaluated'].' active rule(s) evaluated safely. No order, stock, courier, payment, customer or ad record was changed.','simulation_result'=>$result],readRuleState($pdo)));
    }
    if ($action === 'create_rule') {
        $sources=['orders_exist','delivered_orders','low_stock','tracking_exception','workflow_failed','workflow_approval_waiting','alert_sla_breached','alert_unacknowledged']; $risks=['standard','elevated','protected'];
        $name=ruleText($payload['name']??'',240); $domain=ruleText($payload['domain_name']??'',100); $scope=ruleText($payload['scope_name']??'',190); $source=strtolower(ruleText($payload['source_type']??'',80)); $condition=ruleText($payload['condition_text']??'',1200); $outcome=ruleText($payload['outcome_text']??'',1200); $fallback=ruleText($payload['fallback_text']??'',1200); $owner=ruleText($payload['owner_name']??'',190); $priority=max(1,min(100,(int)($payload['priority']??50))); $risk=strtolower(ruleText($payload['risk_level']??'',20)); $dependencies=ruleText($payload['dependency_text']??'',1000);
        if ($name===''||$domain===''||$scope===''||!in_array($source,$sources,true)||$condition===''||$outcome===''||$fallback===''||$owner===''||!in_array($risk,$risks,true)) ruleJson(422,['success'=>false,'message'=>'Complete the rule name, domain, scope, live source, condition, outcome, fallback, owner and risk.']);
        $key='custom-'.bin2hex(random_bytes(8)); $approval=$risk==='standard'?0:1;
        $save=$pdo->prepare("INSERT INTO automation_rules (rule_key,name,domain_name,scope_name,source_type,condition_text,outcome_text,fallback_text,owner_name,priority,risk_level,approval_required,dependency_text,status) VALUES (:rule_key,:name,:domain_name,:scope_name,:source_type,:condition_text,:outcome_text,:fallback_text,:owner_name,:priority,:risk_level,:approval_required,:dependency_text,'draft')");
        $save->execute([':rule_key'=>$key,':name'=>$name,':domain_name'=>$domain,':scope_name'=>$scope,':source_type'=>$source,':condition_text'=>$condition,':outcome_text'=>$outcome,':fallback_text'=>$fallback,':owner_name'=>$owner,':priority'=>$priority,':risk_level'=>$risk,':approval_required'=>$approval,':dependency_text'=>$dependencies]);
        $id=(int)$pdo->lastInsertId(); $query=$pdo->prepare('SELECT * FROM automation_rules WHERE id=:id'); $query->execute([':id'=>$id]); $rule=$query->fetch(PDO::FETCH_ASSOC)?:[];
        $version=$pdo->prepare("INSERT INTO automation_rule_versions (rule_id,version,snapshot_json,reason) VALUES (:rule_id,1,:snapshot_json,'Initial disabled draft')"); $version->execute([':rule_id'=>$id,':snapshot_json'=>ruleSnapshot($rule)]); ruleEvent($pdo,$id,'created','admin','Rule saved as a disabled draft.');
        ruleJson(200,array_merge(['success'=>true,'message'=>'Rule saved as a disabled Draft. It has not evaluated or executed anything.'],readRuleState($pdo)));
    }
    if ($action === 'change_status') {
        $id=(int)($payload['id']??0); $status=strtolower(ruleText($payload['status']??'',20)); $reason=ruleText($payload['reason']??'',1000);
        if ($id<1||!in_array($status,['active','paused','draft','archived'],true)||$reason==='') ruleJson(422,['success'=>false,'message'=>'Choose a valid state and provide an audit reason.']);
        $pdo->beginTransaction(); $query=$pdo->prepare('SELECT * FROM automation_rules WHERE id=:id FOR UPDATE'); $query->execute([':id'=>$id]); $rule=$query->fetch(PDO::FETCH_ASSOC);
        if (!$rule) { $pdo->rollBack(); ruleJson(404,['success'=>false,'message'=>'Automation rule was not found.']); }
        if ((int)$rule['is_builtin']===1&&$status==='archived') { $pdo->rollBack(); ruleJson(409,['success'=>false,'message'=>'A verified built-in rule can be paused, but it cannot be archived.']); }
        $next=(int)$rule['version']+1; $save=$pdo->prepare('UPDATE automation_rules SET status=:status,version=:version WHERE id=:id'); $save->execute([':status'=>$status,':version'=>$next,':id'=>$id]); $rule['status']=$status; $rule['version']=$next;
        $version=$pdo->prepare('INSERT INTO automation_rule_versions (rule_id,version,snapshot_json,reason) VALUES (:rule_id,:version,:snapshot_json,:reason)'); $version->execute([':rule_id'=>$id,':version'=>$next,':snapshot_json'=>ruleSnapshot($rule),':reason'=>$reason]); ruleEvent($pdo,$id,'state_changed','admin','State changed to '.$status.' · '.$reason); $pdo->commit();
        ruleJson(200,array_merge(['success'=>true,'message'=>'Rule state saved as a new audited version. No simulation or business action ran automatically.'],readRuleState($pdo)));
    }
    ruleJson(422,['success'=>false,'message'=>'Unsupported automation rules action.']);
} catch (Throwable $error) {
    if (isset($pdo)&&$pdo instanceof PDO&&$pdo->inTransaction()) $pdo->rollBack();
    error_log('Automation rules API error: '.$error->getMessage());
    ruleJson(500,['success'=>false,'message'=>'Automation rules could not be processed safely.']);
}
