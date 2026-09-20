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

function trackingJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function trackingText(mixed $value, int $limit = 500): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function trackingPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function trackingTableExists(PDO $pdo, string $table): bool
{
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table' => $table]);
    return (int) $query->fetchColumn() > 0;
}

function trackingColumns(PDO $pdo, string $table): array
{
    if (!trackingTableExists($pdo, $table)) return [];
    $query = $pdo->prepare('SELECT column_name FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table' => $table]);
    return array_map('strtolower', $query->fetchAll(PDO::FETCH_COLUMN) ?: []);
}

function trackingDate(mixed $value, string $fallback): string
{
    $date = trackingText($value, 10);
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
    return $parsed && $parsed->format('Y-m-d') === $date ? $date : $fallback;
}

function ensureTrackingTables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS tracking_attribution_settings (
        id TINYINT UNSIGNED NOT NULL, gtm_container_id VARCHAR(40) NOT NULL DEFAULT '',
        ga4_measurement_id VARCHAR(40) NOT NULL DEFAULT '', meta_pixel_id VARCHAR(40) NOT NULL DEFAULT '',
        capi_enabled TINYINT(1) NOT NULL DEFAULT 0,
        attribution_model ENUM('last_non_direct','first_touch','last_touch') NOT NULL DEFAULT 'last_non_direct',
        dedup_window_hours SMALLINT UNSIGNED NOT NULL DEFAULT 72,
        retention_days SMALLINT UNSIGNED NOT NULL DEFAULT 90,
        updated_by VARCHAR(190) NOT NULL DEFAULT 'admin',
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec('INSERT IGNORE INTO tracking_attribution_settings (id) VALUES (1)');

    $pdo->exec("CREATE TABLE IF NOT EXISTS tracking_event_ledger (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, event_id VARCHAR(191) NOT NULL,
        event_name VARCHAR(80) NOT NULL, event_source ENUM('browser','server','test') NOT NULL,
        destination ENUM('internal','ga4','meta','both') NOT NULL DEFAULT 'internal',
        environment ENUM('production','staging') NOT NULL DEFAULT 'production',
        page_location VARCHAR(1000) NOT NULL DEFAULT '', session_key_hash CHAR(64) NULL,
        order_reference_hash CHAR(64) NULL, payload_json LONGTEXT NOT NULL,
        payload_hash CHAR(64) NOT NULL, schema_valid TINYINT(1) NOT NULL DEFAULT 1,
        validation_error VARCHAR(500) NULL, duplicate_count INT UNSIGNED NOT NULL DEFAULT 0,
        received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_tracking_delivery (event_id,event_name,event_source,destination,environment),
        KEY idx_tracking_event_date (event_name,received_at),
        KEY idx_tracking_environment_date (environment,received_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS tracking_remediation_tasks (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, event_name VARCHAR(80) NOT NULL,
        title VARCHAR(300) NOT NULL, owner_name VARCHAR(190) NOT NULL,
        severity ENUM('critical','high','medium','low') NOT NULL DEFAULT 'medium',
        due_date DATE NULL, evidence_note TEXT NOT NULL,
        status ENUM('open','resolved','dismissed') NOT NULL DEFAULT 'open',
        resolution_note TEXT NULL, created_by VARCHAR(190) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME NULL, PRIMARY KEY (id),
        KEY idx_tracking_tasks_status (status,severity,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS tracking_settings_versions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, settings_json LONGTEXT NOT NULL,
        reason VARCHAR(1000) NOT NULL, created_by VARCHAR(190) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS order_attribution (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, order_id BIGINT UNSIGNED NOT NULL,
        session_id VARCHAR(191) NULL, utm_source VARCHAR(191) NULL, utm_medium VARCHAR(191) NULL,
        utm_campaign VARCHAR(191) NULL, utm_content VARCHAR(191) NULL, utm_term VARCHAR(191) NULL,
        fbclid VARCHAR(500) NULL, gclid VARCHAR(500) NULL, landing_page VARCHAR(1000) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_order_attribution_order (order_id),
        KEY idx_order_attribution_source (utm_source,utm_campaign)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function trackingEventContracts(): array
{
    return [
        'page_view' => 'event_id, page_location',
        'view_item' => 'event_id, items[].item_id',
        'add_to_cart' => 'event_id, currency, value, items[].item_id',
        'begin_checkout' => 'event_id, currency, value, items[].item_id',
        'purchase' => 'event_id, currency, value, items[].item_id',
        'order_delivered' => 'event_id, currency, value',
        'qualified_message' => 'event_id, channel',
    ];
}

function readEventHealth(PDO $pdo, string $from, string $to, string $environment): array
{
    $query = $pdo->prepare("SELECT event_name,
        SUM(event_source='browser') browser_events,
        SUM(event_source='server') server_events,
        SUM(destination IN ('ga4','both')) ga4_events,
        SUM(destination IN ('meta','both')) meta_events,
        SUM(schema_valid=1) valid_events, SUM(schema_valid=0) invalid_events,
        SUM(duplicate_count) duplicates, MAX(last_seen_at) last_seen_at
        FROM tracking_event_ledger
        WHERE DATE(received_at) BETWEEN :date_from AND :date_to AND environment=:environment
        GROUP BY event_name");
    $query->execute([':date_from' => $from, ':date_to' => $to, ':environment' => $environment]);
    $indexed = [];
    foreach (($query->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) $indexed[(string) $row['event_name']] = $row;
    $output = [];
    foreach (trackingEventContracts() as $name => $contract) {
        $row = $indexed[$name] ?? [];
        $valid = (int) ($row['valid_events'] ?? 0); $invalid = (int) ($row['invalid_events'] ?? 0); $duplicates = (int) ($row['duplicates'] ?? 0);
        $observed = $valid + $invalid;
        $status = $observed === 0 ? 'No data' : (($invalid > 0 || $duplicates > 0) ? 'Warning' : 'Healthy');
        $output[] = ['name' => $name, 'contract' => $contract,
            'browser' => (int) ($row['browser_events'] ?? 0), 'server' => (int) ($row['server_events'] ?? 0),
            'ga4' => (int) ($row['ga4_events'] ?? 0), 'meta' => (int) ($row['meta_events'] ?? 0),
            'valid' => $valid, 'invalid' => $invalid, 'duplicates' => $duplicates,
            'last_seen_at' => $row['last_seen_at'] ?? null, 'status' => $status];
    }
    return $output;
}

function readDailyEvents(PDO $pdo, string $from, string $to, string $environment): array
{
    $query = $pdo->prepare("SELECT DATE(received_at) event_date,
        SUM(event_source='browser') browser_events, SUM(event_source='server') server_events,
        SUM(event_source='test') test_events, SUM(duplicate_count) duplicates
        FROM tracking_event_ledger WHERE DATE(received_at) BETWEEN :date_from AND :date_to
        AND environment=:environment GROUP BY DATE(received_at) ORDER BY event_date");
    $query->execute([':date_from' => $from, ':date_to' => $to, ':environment' => $environment]);
    return $query->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

function readAttribution(PDO $pdo, string $from, string $to): array
{
    if (!trackingTableExists($pdo, 'orders')) return ['available' => false, 'summary' => ['total_orders' => 0, 'attributed_orders' => 0, 'delivered_orders' => 0, 'attributed_delivered' => 0, 'delivered_revenue' => 0, 'attributed_delivered_revenue' => 0], 'sources' => []];
    $columns = trackingColumns($pdo, 'order_attribution');
    $hasSource = in_array('utm_source', $columns, true); $hasMedium = in_array('utm_medium', $columns, true); $hasCampaign = in_array('utm_campaign', $columns, true);
    $source = $hasSource ? "MAX(NULLIF(TRIM(utm_source),''))" : 'NULL';
    $medium = $hasMedium ? "MAX(NULLIF(TRIM(utm_medium),''))" : 'NULL';
    $campaign = $hasCampaign ? "MAX(NULLIF(TRIM(utm_campaign),''))" : 'NULL';
    $attribution = trackingTableExists($pdo, 'order_attribution') ? "LEFT JOIN (SELECT order_id,{$source} utm_source,{$medium} utm_medium,{$campaign} utm_campaign FROM order_attribution GROUP BY order_id) a ON a.order_id=o.id" : '';
    $sourceSelect = $attribution !== '' ? "COALESCE(a.utm_source,'Unattributed') source,COALESCE(a.utm_medium,'—') medium,COALESCE(a.utm_campaign,'—') campaign" : "'Unattributed' source,'—' medium,'—' campaign";
    $query = $pdo->prepare("SELECT {$sourceSelect},COUNT(*) orders,
        SUM(o.status='delivered') delivered,
        SUM(CASE WHEN o.status='delivered' THEN o.total_amount ELSE 0 END) delivered_revenue,
        SUM(o.status IN ('cancelled','returned')) return_cancel
        FROM orders o {$attribution} WHERE DATE(o.created_at) BETWEEN :date_from AND :date_to
        GROUP BY source,medium,campaign ORDER BY delivered_revenue DESC");
    $query->execute([':date_from' => $from, ':date_to' => $to]);
    $sources = $query->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $summary = ['total_orders' => 0, 'attributed_orders' => 0, 'delivered_orders' => 0, 'attributed_delivered' => 0, 'delivered_revenue' => 0.0, 'attributed_delivered_revenue' => 0.0];
    foreach ($sources as &$row) {
        $row['orders'] = (int) $row['orders']; $row['delivered'] = (int) $row['delivered']; $row['delivered_revenue'] = (float) $row['delivered_revenue']; $row['return_cancel'] = (int) $row['return_cancel'];
        $row['utm_complete'] = $row['source'] !== 'Unattributed' && $row['medium'] !== '—' && $row['campaign'] !== '—';
        $summary['total_orders'] += $row['orders']; $summary['delivered_orders'] += $row['delivered']; $summary['delivered_revenue'] += $row['delivered_revenue'];
        if ($row['source'] !== 'Unattributed') { $summary['attributed_orders'] += $row['orders']; $summary['attributed_delivered'] += $row['delivered']; $summary['attributed_delivered_revenue'] += $row['delivered_revenue']; }
    }
    unset($row);
    return ['available' => true, 'summary' => $summary, 'sources' => $sources];
}

function readTrackingState(PDO $pdo, string $from, string $to, string $environment): array
{
    $settings = $pdo->query('SELECT * FROM tracking_attribution_settings WHERE id=1')->fetch(PDO::FETCH_ASSOC) ?: [];
    $events = readEventHealth($pdo, $from, $to, $environment);
    $eventTotal = 0; $valid = 0; $duplicates = 0; $lastEvent = null;
    foreach ($events as $row) { $eventTotal += $row['valid'] + $row['invalid']; $valid += $row['valid']; $duplicates += $row['duplicates']; if ($row['last_seen_at'] !== null && ($lastEvent === null || $row['last_seen_at'] > $lastEvent)) $lastEvent = $row['last_seen_at']; }
    $attribution = readAttribution($pdo, $from, $to);
    $connectorCounts = ['ga4' => 0, 'meta' => 0];
    foreach ($events as $row) { $connectorCounts['ga4'] += $row['ga4']; $connectorCounts['meta'] += $row['meta']; }
    $connectors = [
        ['key' => 'gtm', 'name' => 'Google Tag Manager', 'configured' => trim((string) ($settings['gtm_container_id'] ?? '')) !== '', 'identifier' => (string) ($settings['gtm_container_id'] ?? ''), 'event_count' => 0, 'note' => 'Public container ID only; publishing remains outside this page.'],
        ['key' => 'ga4', 'name' => 'Google Analytics 4', 'configured' => trim((string) ($settings['ga4_measurement_id'] ?? '')) !== '', 'identifier' => (string) ($settings['ga4_measurement_id'] ?? ''), 'event_count' => $connectorCounts['ga4'], 'note' => 'Observed ledger deliveries marked for GA4.'],
        ['key' => 'pixel', 'name' => 'Meta Pixel', 'configured' => trim((string) ($settings['meta_pixel_id'] ?? '')) !== '', 'identifier' => (string) ($settings['meta_pixel_id'] ?? ''), 'event_count' => $connectorCounts['meta'], 'note' => 'Browser identity only; no access token is stored here.'],
        ['key' => 'capi', 'name' => 'Conversions API', 'configured' => (int) ($settings['capi_enabled'] ?? 0) === 1, 'identifier' => '', 'event_count' => array_sum(array_column($events, 'server')), 'note' => 'Readiness flag only; credentials remain in the protected backend.'],
    ];
    return ['range' => ['from' => $from, 'to' => $to], 'environment' => $environment, 'settings' => $settings,
        'connectors' => $connectors, 'event_health' => $events, 'daily' => readDailyEvents($pdo, $from, $to, $environment),
        'attribution' => $attribution, 'remediations' => $pdo->query('SELECT * FROM tracking_remediation_tasks ORDER BY FIELD(status,\'open\',\'resolved\',\'dismissed\'),FIELD(severity,\'critical\',\'high\',\'medium\',\'low\'),id DESC LIMIT 200')->fetchAll(PDO::FETCH_ASSOC) ?: [],
        'summary' => ['events' => $eventTotal, 'valid_events' => $valid, 'duplicates' => $duplicates, 'last_event_at' => $lastEvent],
        'collector_endpoint' => 'capture_tracking_event.php', 'generated_at' => date(DATE_ATOM)];
}

try {
    $pdo = getDatabaseConnection(); ensureTrackingTables($pdo);
    $from = trackingDate($_GET['date_from'] ?? '', date('Y-m-d', strtotime('-29 days')));
    $to = trackingDate($_GET['date_to'] ?? '', date('Y-m-d'));
    $environment = strtolower(trackingText($_GET['environment'] ?? 'production', 20));
    if (!in_array($environment, ['production','staging'], true)) $environment = 'production';
    if ($from > $to) trackingJson(422, ['success' => false, 'message' => 'Start date cannot be after end date.']);
    if ((new DateTimeImmutable($from))->diff(new DateTimeImmutable($to))->days > 366) trackingJson(422, ['success' => false, 'message' => 'Choose a range of 366 days or fewer.']);
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') trackingJson(200, array_merge(['success' => true], readTrackingState($pdo, $from, $to, $environment)));
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') trackingJson(405, ['success' => false, 'message' => 'Method not allowed.']);
    $payload = trackingPayload(); $action = strtolower(trackingText($payload['action'] ?? '', 60));

    if ($action === 'save_settings') {
        $gtm = strtoupper(trackingText($payload['gtm_container_id'] ?? '', 40)); $ga4 = strtoupper(trackingText($payload['ga4_measurement_id'] ?? '', 40)); $pixel = trackingText($payload['meta_pixel_id'] ?? '', 40);
        $model = strtolower(trackingText($payload['attribution_model'] ?? '', 30)); $dedup = (int) ($payload['dedup_window_hours'] ?? 72); $retention = (int) ($payload['retention_days'] ?? 90); $reason = trackingText($payload['reason'] ?? '', 1000);
        if ($gtm !== '' && preg_match('/^GTM-[A-Z0-9]+$/', $gtm) !== 1) trackingJson(422, ['success' => false, 'message' => 'Google Tag Manager ID must look like GTM-XXXXXXX.']);
        if ($ga4 !== '' && preg_match('/^G-[A-Z0-9]+$/', $ga4) !== 1) trackingJson(422, ['success' => false, 'message' => 'GA4 Measurement ID must look like G-XXXXXXXXXX.']);
        if ($pixel !== '' && preg_match('/^[0-9]{6,30}$/', $pixel) !== 1) trackingJson(422, ['success' => false, 'message' => 'Meta Pixel ID must contain digits only.']);
        if (!in_array($model, ['last_non_direct','first_touch','last_touch'], true) || $dedup < 1 || $dedup > 168 || $retention < 30 || $retention > 730 || $reason === '') trackingJson(422, ['success' => false, 'message' => 'Valid controls and a change reason are required.']);
        $values = ['gtm_container_id' => $gtm, 'ga4_measurement_id' => $ga4, 'meta_pixel_id' => $pixel, 'capi_enabled' => !empty($payload['capi_enabled']) ? 1 : 0, 'attribution_model' => $model, 'dedup_window_hours' => $dedup, 'retention_days' => $retention];
        $pdo->beginTransaction();
        $save = $pdo->prepare('UPDATE tracking_attribution_settings SET gtm_container_id=:gtm_container_id,ga4_measurement_id=:ga4_measurement_id,meta_pixel_id=:meta_pixel_id,capi_enabled=:capi_enabled,attribution_model=:attribution_model,dedup_window_hours=:dedup_window_hours,retention_days=:retention_days WHERE id=1'); $save->execute($values);
        $version = $pdo->prepare('INSERT INTO tracking_settings_versions (settings_json,reason) VALUES (:settings_json,:reason)'); $version->execute([':settings_json' => json_encode($values, JSON_UNESCAPED_SLASHES), ':reason' => $reason]); $pdo->commit();
        trackingJson(200, array_merge(['success' => true, 'message' => 'Tracking controls saved with an audit reason. No tag or connector was published.'], readTrackingState($pdo, $from, $to, $environment)));
    }
    if ($action === 'run_safe_test') {
        $eventName = strtolower(trackingText($payload['event_name'] ?? '', 80)); $reference = trackingText($payload['reference'] ?? '', 120);
        if (!array_key_exists($eventName, trackingEventContracts()) || preg_match('/^[A-Za-z0-9_-]{4,120}$/', $reference) !== 1) trackingJson(422, ['success' => false, 'message' => 'Choose a supported event and a safe synthetic reference.']);
        $eventId = 'test-' . strtolower($reference) . '-' . bin2hex(random_bytes(4));
        $data = ['synthetic' => true, 'reference' => $reference, 'currency' => 'BDT', 'value' => 0, 'items' => []]; $json = json_encode($data, JSON_UNESCAPED_SLASHES);
        $save = $pdo->prepare("INSERT INTO tracking_event_ledger (event_id,event_name,event_source,destination,environment,page_location,payload_json,payload_hash,schema_valid) VALUES (:event_id,:event_name,'test','internal','staging','diagnostic://admin',:payload_json,:payload_hash,1)");
        $save->execute([':event_id' => $eventId, ':event_name' => $eventName, ':payload_json' => $json, ':payload_hash' => hash('sha256', $json)]);
        trackingJson(200, array_merge(['success' => true, 'message' => 'Safe synthetic event recorded in staging only. Nothing was sent to GA4 or Meta.'], readTrackingState($pdo, $from, $to, $environment)));
    }
    if ($action === 'create_remediation') {
        $eventName = strtolower(trackingText($payload['event_name'] ?? '', 80)); $title = trackingText($payload['title'] ?? '', 300); $owner = trackingText($payload['owner'] ?? '', 190); $severity = strtolower(trackingText($payload['severity'] ?? 'medium', 20)); $note = trackingText($payload['evidence_note'] ?? '', 5000); $due = trackingDate($payload['due_date'] ?? '', '');
        if (!array_key_exists($eventName, trackingEventContracts()) || $title === '' || $owner === '' || $note === '' || !in_array($severity, ['critical','high','medium','low'], true)) trackingJson(422, ['success' => false, 'message' => 'Event, title, owner, severity and evidence are required.']);
        $save = $pdo->prepare('INSERT INTO tracking_remediation_tasks (event_name,title,owner_name,severity,due_date,evidence_note) VALUES (:event_name,:title,:owner_name,:severity,:due_date,:evidence_note)');
        $save->execute([':event_name' => $eventName, ':title' => $title, ':owner_name' => $owner, ':severity' => $severity, ':due_date' => $due === '' ? null : $due, ':evidence_note' => $note]);
        trackingJson(200, array_merge(['success' => true, 'message' => 'Tracking remediation task created. Production tracking was not changed.'], readTrackingState($pdo, $from, $to, $environment)));
    }
    if ($action === 'resolve_remediation') {
        $id = (int) ($payload['id'] ?? 0); $note = trackingText($payload['resolution_note'] ?? '', 5000);
        if ($id <= 0 || $note === '') trackingJson(422, ['success' => false, 'message' => 'Task and resolution evidence are required.']);
        $save = $pdo->prepare("UPDATE tracking_remediation_tasks SET status='resolved',resolution_note=:note,resolved_at=NOW() WHERE id=:id AND status='open'"); $save->execute([':note' => $note, ':id' => $id]);
        if ($save->rowCount() === 0) trackingJson(409, ['success' => false, 'message' => 'This task is no longer open.']);
        trackingJson(200, array_merge(['success' => true, 'message' => 'Remediation marked resolved with evidence.'], readTrackingState($pdo, $from, $to, $environment)));
    }
    trackingJson(400, ['success' => false, 'message' => 'Unknown action.']);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('Tracking Attribution API error: ' . $error->getMessage());
    trackingJson(500, ['success' => false, 'message' => 'Tracking and attribution data could not be processed.']);
}
