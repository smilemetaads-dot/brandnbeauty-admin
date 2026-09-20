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

function settingsJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function settingsPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function settingsText(mixed $value, int $limit = 1000): string
{
    $value = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($value, 0, $limit) : substr($value, 0, $limit);
}

function settingsTableExists(PDO $pdo, string $table): bool
{
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table' => $table]);
    return (int) $query->fetchColumn() > 0;
}

function settingsDefinitions(): array
{
    return [
        ['business_name','General','Business name','Used in verified business identity and admin context.','text',0,[],10,'BrandnBeauty'],
        ['support_email','General','Support email','Public support contact for approved customer communication.','email',0,[],20,'support@brandnbeauty.com'],
        ['business_phone','General','Business phone','Primary support and operational phone number.','text',0,[],30,'01757 154 597'],
        ['primary_warehouse','General','Primary warehouse','Default operational location for new internal plans.','text',0,[],40,'Dhaka, Bangladesh'],
        ['timezone','General','Timezone','Timezone used for new reports and recorded settings evidence.','select',0,['Asia/Dhaka'],50,'Asia/Dhaka'],
        ['currency','General','Currency','Display currency for new settings-aware screens.','select',0,['BDT'],60,'BDT'],
        ['order_prefix','General','Order prefix','Prefix reserved for newly generated order references.','text',0,[],70,'BNB'],
        ['admin_language','General','Admin language','Preferred language for future settings-aware admin content.','select',0,['English'],80,'English'],
        ['deduct_on_confirm','Operational defaults','Deduct stock on confirmation','Default policy for future inventory-aware order processing.','toggle',0,[],110,true],
        ['restore_on_cancel','Operational defaults','Restore stock on cancellation','Protected stock restoration guardrail.','toggle',1,[],120,true],
        ['prevent_oversell','Operational defaults','Prevent overselling','Protected inventory safety boundary.','toggle',1,[],130,true],
        ['manual_high_risk','Operational defaults','Manual high-risk review','Route high-risk orders to a human review step.','toggle',0,[],140,true],
        ['cod_approval','Operational defaults','COD reconciliation approval','Require protected approval before COD reconciliation.','toggle',1,[],150,true],
        ['negative_stock','Operational defaults','Allow negative stock','Protected setting must remain disabled.','toggle',1,[],160,false],
        ['auto_archive','Operational defaults','Auto-archive completed records','Optional future housekeeping preference.','toggle',0,[],170,false],
        ['notify_new_orders','Notifications','New order notifications','Create an internal notification for new orders.','toggle',0,[],210,true],
        ['notify_high_risk','Notifications','High-risk notifications','Create an internal alert for high-risk review.','toggle',0,[],220,true],
        ['notify_low_stock','Notifications','Low-stock notifications','Create an internal alert when verified stock is low.','toggle',0,[],230,true],
        ['notify_cod_mismatch','Notifications','COD mismatch notifications','Surface reconciliation mismatches for review.','toggle',0,[],240,true],
        ['notify_courier_exception','Notifications','Courier exception notifications','Surface failed or delayed courier operations.','toggle',0,[],250,true],
        ['notify_failed_integration','Notifications','Integration failure notifications','Surface verified integration failures.','toggle',0,[],260,true],
        ['notify_daily_summary','Notifications','Daily summary','Prepare an internal daily summary preference.','toggle',0,[],270,true],
        ['notify_marketing_digest','Notifications','Marketing digest','Optional marketing intelligence summary.','toggle',0,[],280,false],
        ['two_step_sensitive','Security & data','Two-step sensitive changes','Protected confirmation boundary for sensitive settings.','toggle',1,[],310,true],
        ['new_device_alert','Security & data','New device alert','Record an alert preference for new admin devices.','toggle',0,[],320,true],
        ['session_timeout','Security & data','Session timeout','Preferred maximum admin session window.','select',0,['2 hours','4 hours','8 hours','12 hours'],330,'8 hours'],
        ['export_approval','Security & data','Export approval','Protected approval requirement for sensitive exports.','toggle',1,[],340,true],
        ['ip_restriction','Security & data','IP restriction preference','Registry preference only; network enforcement is configured separately.','toggle',0,[],350,false],
        ['daily_backup','Security & data','Daily backup','Protected backup preference for future backup-aware operations.','toggle',1,[],360,true],
        ['retention_period','Security & data','Retention period','Preferred retention window for new settings-aware records.','select',0,['12 months','24 months','36 months'],370,'24 months'],
    ];
}

function settingsBaseline(): array
{
    $values = [];
    foreach (settingsDefinitions() as $definition) $values[$definition[0]] = $definition[8];
    return $values;
}

function settingsEncode(array $value): string
{
    return json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '{}';
}

function settingsDecode(mixed $value): ?array
{
    if (!is_string($value) || trim($value) === '') return null;
    $decoded = json_decode($value, true);
    return is_array($decoded) ? $decoded : null;
}

function ensureSystemSettingsTables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS system_setting_definitions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, setting_key VARCHAR(140) NOT NULL,
        category_name VARCHAR(100) NOT NULL, label VARCHAR(190) NOT NULL,
        description VARCHAR(1000) NOT NULL, input_type VARCHAR(30) NOT NULL,
        is_protected TINYINT(1) NOT NULL DEFAULT 0, option_values_json LONGTEXT NOT NULL,
        sort_order INT NOT NULL DEFAULT 0, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_system_setting_key (setting_key), KEY idx_system_setting_category (category_name,sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS system_settings_state (
        id TINYINT UNSIGNED NOT NULL, active_values_json LONGTEXT NOT NULL,
        draft_values_json LONGTEXT NULL, active_version INT UNSIGNED NOT NULL DEFAULT 1,
        engine_mode VARCHAR(60) NOT NULL DEFAULT 'configuration_registry',
        last_validation_at DATETIME NULL, last_published_at DATETIME NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS system_settings_versions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, version INT UNSIGNED NOT NULL,
        snapshot_json LONGTEXT NOT NULL, reason VARCHAR(1000) NOT NULL,
        created_by VARCHAR(190) NOT NULL DEFAULT 'authenticated admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_system_settings_version (version), KEY idx_system_settings_version_time (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS system_settings_audit_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, event_type VARCHAR(80) NOT NULL,
        setting_keys VARCHAR(2000) NOT NULL DEFAULT '', actor_name VARCHAR(190) NOT NULL,
        note VARCHAR(2000) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_system_settings_audit_time (event_type,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $saveDefinition = $pdo->prepare('INSERT INTO system_setting_definitions (setting_key,category_name,label,description,input_type,is_protected,option_values_json,sort_order) VALUES (:setting_key,:category_name,:label,:description,:input_type,:is_protected,:options,:sort_order) ON DUPLICATE KEY UPDATE category_name=VALUES(category_name),label=VALUES(label),description=VALUES(description),input_type=VALUES(input_type),is_protected=VALUES(is_protected),option_values_json=VALUES(option_values_json),sort_order=VALUES(sort_order)');
    foreach (settingsDefinitions() as $definition) {
        $saveDefinition->execute([':setting_key'=>$definition[0],':category_name'=>$definition[1],':label'=>$definition[2],':description'=>$definition[3],':input_type'=>$definition[4],':is_protected'=>$definition[5],':options'=>settingsEncode($definition[6]),':sort_order'=>$definition[7]]);
    }

    $baseline = settingsEncode(settingsBaseline());
    $state = $pdo->prepare("INSERT IGNORE INTO system_settings_state (id,active_values_json,draft_values_json,active_version,engine_mode,last_validation_at,last_published_at) VALUES (1,:active_values,NULL,1,'configuration_registry',NOW(),NOW())");
    $state->execute([':active_values'=>$baseline]);
    $version = $pdo->prepare("INSERT IGNORE INTO system_settings_versions (version,snapshot_json,reason,created_by) VALUES (1,:snapshot,'Verified baseline settings','system')");
    $version->execute([':snapshot'=>$baseline]);
}

function settingsDefinitionsByKey(PDO $pdo): array
{
    $rows = $pdo->query('SELECT * FROM system_setting_definitions ORDER BY sort_order,id')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $byKey = [];
    foreach ($rows as $row) $byKey[(string)$row['setting_key']] = $row;
    return $byKey;
}

function settingsNormalizeValues(array $input, array $definitions): array
{
    $normalized = [];
    foreach ($definitions as $key => $definition) {
        $type = (string)$definition['input_type'];
        $value = $input[$key] ?? null;
        if ($type === 'toggle') {
            $normalized[$key] = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;
        } else {
            $normalized[$key] = settingsText($value, 300);
        }
    }
    return $normalized;
}

function settingsValidate(array $values, array $definitions): array
{
    $issues = [];
    if (($values['business_name'] ?? '') === '') $issues[] = 'Business name is required.';
    if (!filter_var($values['support_email'] ?? '', FILTER_VALIDATE_EMAIL)) $issues[] = 'A valid support email is required.';
    if (($values['timezone'] ?? '') !== 'Asia/Dhaka') $issues[] = 'Timezone must remain Asia/Dhaka in this local release.';
    if (($values['currency'] ?? '') !== 'BDT') $issues[] = 'Currency must remain BDT in this local release.';
    if (preg_match('/^[A-Z0-9]{2,10}$/', (string)($values['order_prefix'] ?? '')) !== 1) $issues[] = 'Order prefix must be 2–10 uppercase letters or numbers.';
    foreach ($definitions as $key => $definition) {
        $options = settingsDecode($definition['option_values_json'] ?? '') ?? [];
        if ($options !== [] && !in_array($values[$key] ?? null, $options, true)) $issues[] = (string)$definition['label'] . ' has an unsupported value.';
    }
    $protected = ['restore_on_cancel'=>true,'prevent_oversell'=>true,'cod_approval'=>true,'negative_stock'=>false,'two_step_sensitive'=>true,'export_approval'=>true,'daily_backup'=>true];
    foreach ($protected as $key => $safeValue) if (($values[$key] ?? null) !== $safeValue) $issues[] = (string)$definitions[$key]['label'] . ' is protected and cannot be changed here.';
    return array_values(array_unique($issues));
}

function settingsDirtyKeys(array $active, ?array $draft): array
{
    if ($draft === null) return [];
    $keys = [];
    foreach ($active as $key => $value) if (!array_key_exists($key,$draft) || $draft[$key] !== $value) $keys[] = $key;
    return $keys;
}

function settingsAudit(PDO $pdo, string $eventType, array $keys, string $note, string $actor = 'authenticated admin'): void
{
    $save = $pdo->prepare('INSERT INTO system_settings_audit_events (event_type,setting_keys,actor_name,note) VALUES (:event_type,:setting_keys,:actor_name,:note)');
    $save->execute([':event_type'=>$eventType,':setting_keys'=>implode(',',$keys),':actor_name'=>$actor,':note'=>settingsText($note,2000)]);
}

function readSystemSettingsState(PDO $pdo): array
{
    $state = $pdo->query('SELECT * FROM system_settings_state WHERE id=1')->fetch(PDO::FETCH_ASSOC) ?: [];
    $active = settingsDecode($state['active_values_json'] ?? '') ?? settingsBaseline();
    $draft = settingsDecode($state['draft_values_json'] ?? null);
    $definitions = $pdo->query('SELECT id,setting_key,category_name,label,description,input_type,is_protected,option_values_json,sort_order FROM system_setting_definitions ORDER BY sort_order,id')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    foreach ($definitions as &$definition) {
        $definition['options'] = settingsDecode($definition['option_values_json'] ?? '') ?? [];
        unset($definition['option_values_json']);
    }
    unset($definition);
    $versions = $pdo->query('SELECT id,version,reason,created_by,created_at FROM system_settings_versions ORDER BY version DESC LIMIT 100')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $activity = $pdo->query('SELECT id,event_type,setting_keys,actor_name,note,created_at FROM system_settings_audit_events ORDER BY id DESC LIMIT 200')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $summary = [
        'active_version'=>(int)($state['active_version'] ?? 1),
        'draft_changes'=>count(settingsDirtyKeys($active,$draft)),
        'protected_controls'=>(int)$pdo->query('SELECT COUNT(*) FROM system_setting_definitions WHERE is_protected=1')->fetchColumn(),
        'settings_count'=>(int)$pdo->query('SELECT COUNT(*) FROM system_setting_definitions')->fetchColumn(),
        'validations_30d'=>(int)$pdo->query("SELECT COUNT(*) FROM system_settings_audit_events WHERE event_type='validation_run' AND created_at>=DATE_SUB(NOW(),INTERVAL 30 DAY)")->fetchColumn(),
        'changes_30d'=>(int)$pdo->query("SELECT COUNT(*) FROM system_settings_audit_events WHERE event_type IN ('draft_saved','draft_discarded','settings_published') AND created_at>=DATE_SUB(NOW(),INTERVAL 30 DAY)")->fetchColumn(),
    ];
    $integrationReady = settingsTableExists($pdo,'integration_connections') || settingsTableExists($pdo,'integration_registry');
    return [
        'engine'=>['mode'=>$state['engine_mode'] ?? 'configuration_registry','timezone'=>'Asia/Dhaka','last_validation_at'=>$state['last_validation_at'] ?? null,'last_published_at'=>$state['last_published_at'] ?? null],
        'capabilities'=>['admin_auth'=>is_file(__DIR__.'/admin_auth.php'),'access_registry'=>settingsTableExists($pdo,'access_roles'),'audit'=>true,'integrations'=>$integrationReady],
        'summary'=>$summary,'definitions'=>$definitions,'active_settings'=>$active,'draft_settings'=>$draft,
        'dirty_keys'=>settingsDirtyKeys($active,$draft),'versions'=>$versions,'activity'=>$activity,
        'validation'=>['valid'=>true,'issues'=>[]],'generated_at'=>date(DATE_ATOM)
    ];
}

try {
    $pdo = getDatabaseConnection();
    ensureSystemSettingsTables($pdo);
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') settingsJson(200,array_merge(['success'=>true],readSystemSettingsState($pdo)));
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') settingsJson(405,['success'=>false,'message'=>'Method not allowed.']);
    $payload = settingsPayload();
    $action = settingsText($payload['action'] ?? '',80);
    $definitions = settingsDefinitionsByKey($pdo);
    $stateRow = $pdo->query('SELECT * FROM system_settings_state WHERE id=1')->fetch(PDO::FETCH_ASSOC) ?: [];
    $active = settingsDecode($stateRow['active_values_json'] ?? '') ?? settingsBaseline();
    $draft = settingsDecode($stateRow['draft_values_json'] ?? null);
    $message = 'Settings registry updated.';
    $validation = ['valid'=>true,'issues'=>[]];

    if ($action === 'save_draft') {
        $input = is_array($payload['values'] ?? null) ? $payload['values'] : [];
        $values = settingsNormalizeValues($input,$definitions);
        $issues = settingsValidate($values,$definitions);
        if ($issues !== []) settingsJson(422,['success'=>false,'message'=>$issues[0],'issues'=>$issues]);
        $dirty = settingsDirtyKeys($active,$values);
        if ($dirty === []) settingsJson(422,['success'=>false,'message'=>'No settings changes were detected.']);
        $save = $pdo->prepare('UPDATE system_settings_state SET draft_values_json=:draft WHERE id=1');
        $save->execute([':draft'=>settingsEncode($values)]);
        settingsAudit($pdo,'draft_saved',$dirty,'Settings draft saved. Active settings were not changed.');
        $message = 'Settings draft saved. Nothing live changed yet.';
    } elseif ($action === 'run_validation') {
        $input = is_array($payload['values'] ?? null) ? $payload['values'] : ($draft ?? $active);
        $values = settingsNormalizeValues($input,$definitions);
        $issues = settingsValidate($values,$definitions);
        $pdo->exec('UPDATE system_settings_state SET last_validation_at=NOW() WHERE id=1');
        settingsAudit($pdo,'validation_run',settingsDirtyKeys($active,$values),$issues === [] ? 'Safe validation passed.' : 'Safe validation found '.count($issues).' issue(s).');
        $validation = ['valid'=>$issues === [],'issues'=>$issues];
        $message = $issues === [] ? 'Safe validation passed.' : 'Validation found settings that need attention.';
    } elseif ($action === 'discard_draft') {
        if ($draft === null) settingsJson(422,['success'=>false,'message'=>'There is no saved draft to discard.']);
        $dirty = settingsDirtyKeys($active,$draft);
        $pdo->exec('UPDATE system_settings_state SET draft_values_json=NULL WHERE id=1');
        settingsAudit($pdo,'draft_discarded',$dirty,'Settings draft discarded. Active settings were not changed.');
        $message = 'Draft discarded. Active settings are unchanged.';
    } elseif ($action === 'publish_draft') {
        $reason = settingsText($payload['reason'] ?? '',1000);
        if ($reason === '') settingsJson(422,['success'=>false,'message'=>'An audit reason is required to publish settings.']);
        if ($draft === null) settingsJson(422,['success'=>false,'message'=>'Save a settings draft before publishing.']);
        $issues = settingsValidate($draft,$definitions);
        if ($issues !== []) settingsJson(422,['success'=>false,'message'=>$issues[0],'issues'=>$issues]);
        $dirty = settingsDirtyKeys($active,$draft);
        if ($dirty === []) settingsJson(422,['success'=>false,'message'=>'The saved draft has no changes to publish.']);
        $nextVersion = (int)($stateRow['active_version'] ?? 1) + 1;
        $pdo->beginTransaction();
        try {
            $saveVersion = $pdo->prepare('INSERT INTO system_settings_versions (version,snapshot_json,reason,created_by) VALUES (:version,:snapshot,:reason,:actor)');
            $saveVersion->execute([':version'=>$nextVersion,':snapshot'=>settingsEncode($draft),':reason'=>$reason,':actor'=>'authenticated admin']);
            $publish = $pdo->prepare('UPDATE system_settings_state SET active_values_json=:active,draft_values_json=NULL,active_version=:version,last_validation_at=NOW(),last_published_at=NOW() WHERE id=1');
            $publish->execute([':active'=>settingsEncode($draft),':version'=>$nextVersion]);
            settingsAudit($pdo,'settings_published',$dirty,$reason.' Registry version published; historical orders and records were not rewritten.');
            $pdo->commit();
        } catch (Throwable $transactionError) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $transactionError;
        }
        $message = 'Settings version published. Existing orders and records were not changed.';
    } else {
        settingsJson(422,['success'=>false,'message'=>'Unknown settings action.']);
    }

    $response = readSystemSettingsState($pdo);
    $response['validation'] = $validation;
    settingsJson(200,array_merge(['success'=>true,'message'=>$message],$response));
} catch (Throwable $error) {
    error_log('manage_system_settings.php: ' . $error->getMessage());
    settingsJson(500,['success'=>false,'message'=>'Settings registry is unavailable right now. No active setting was changed.']);
}
