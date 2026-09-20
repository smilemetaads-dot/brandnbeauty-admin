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

function metaJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function metaText(mixed $value, int $limit = 191): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function metaPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function metaTableExists(PDO $pdo, string $table): bool
{
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table' => $table]);
    return (int) $query->fetchColumn() > 0;
}

function metaDate(mixed $value, string $fallback): string
{
    $date = metaText($value, 10);
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
    return $parsed && $parsed->format('Y-m-d') === $date ? $date : $fallback;
}

function ensureMetaAdsTables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS meta_ads_connection (
        id TINYINT UNSIGNED NOT NULL, ad_account_id VARCHAR(80) NOT NULL DEFAULT '',
        account_name VARCHAR(191) NOT NULL DEFAULT '', currency CHAR(3) NOT NULL DEFAULT 'BDT',
        timezone_name VARCHAR(100) NOT NULL DEFAULT 'Asia/Dhaka', graph_version VARCHAR(20) NOT NULL DEFAULT 'v26.0',
        encrypted_token LONGTEXT NULL, token_hint VARCHAR(20) NOT NULL DEFAULT '', connection_status VARCHAR(30) NOT NULL DEFAULT 'not_connected',
        account_status VARCHAR(60) NULL, last_sync_at DATETIME NULL, last_error VARCHAR(1000) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("INSERT IGNORE INTO meta_ads_connection (id) VALUES (1)");

    $pdo->exec("CREATE TABLE IF NOT EXISTS meta_ads_entities (
        entity_id VARCHAR(80) NOT NULL, entity_level ENUM('campaign','adset','ad') NOT NULL,
        entity_name VARCHAR(500) NOT NULL, parent_id VARCHAR(80) NULL, parent_name VARCHAR(500) NULL,
        effective_status VARCHAR(60) NULL, configured_status VARCHAR(60) NULL, objective VARCHAR(100) NULL,
        daily_budget DECIMAL(14,2) NULL, lifetime_budget DECIMAL(14,2) NULL, optimization_goal VARCHAR(100) NULL,
        creative_id VARCHAR(80) NULL, creative_name VARCHAR(500) NULL, raw_json LONGTEXT NULL,
        last_synced_at DATETIME NOT NULL, PRIMARY KEY (entity_id), KEY idx_meta_entities_level_status (entity_level, effective_status),
        KEY idx_meta_entities_parent (parent_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS meta_ads_insights (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, entity_id VARCHAR(80) NOT NULL, entity_level ENUM('campaign','adset','ad') NOT NULL,
        date_start DATE NOT NULL, date_stop DATE NOT NULL, spend DECIMAL(14,2) NOT NULL DEFAULT 0,
        reach_value BIGINT UNSIGNED NOT NULL DEFAULT 0, impressions BIGINT UNSIGNED NOT NULL DEFAULT 0, clicks BIGINT UNSIGNED NOT NULL DEFAULT 0,
        ctr DECIMAL(10,4) NOT NULL DEFAULT 0, cpc DECIMAL(14,4) NOT NULL DEFAULT 0, cpm DECIMAL(14,4) NOT NULL DEFAULT 0,
        frequency_value DECIMAL(10,4) NOT NULL DEFAULT 0, results DECIMAL(14,2) NOT NULL DEFAULT 0, result_type VARCHAR(150) NULL,
        raw_json LONGTEXT NULL, synced_at DATETIME NOT NULL, PRIMARY KEY (id),
        UNIQUE KEY uq_meta_insight_entity_range (entity_id, date_start, date_stop), KEY idx_meta_insights_range (date_start, date_stop, entity_level)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS meta_ads_daily (
        insight_date DATE NOT NULL, spend DECIMAL(14,2) NOT NULL DEFAULT 0, reach_value BIGINT UNSIGNED NOT NULL DEFAULT 0,
        impressions BIGINT UNSIGNED NOT NULL DEFAULT 0, clicks BIGINT UNSIGNED NOT NULL DEFAULT 0,
        ctr DECIMAL(10,4) NOT NULL DEFAULT 0, cpc DECIMAL(14,4) NOT NULL DEFAULT 0,
        results DECIMAL(14,2) NOT NULL DEFAULT 0, result_type VARCHAR(150) NULL, synced_at DATETIME NOT NULL,
        PRIMARY KEY (insight_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS meta_campaign_drafts (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, draft_name VARCHAR(191) NOT NULL, objective VARCHAR(100) NOT NULL,
        destination VARCHAR(80) NOT NULL, daily_budget DECIMAL(14,2) NOT NULL DEFAULT 0, product_offer VARCHAR(500) NOT NULL,
        audience VARCHAR(1000) NOT NULL, placements VARCHAR(500) NOT NULL, optimization_event VARCHAR(100) NOT NULL,
        start_date DATE NOT NULL, end_date DATE NULL, strategy_note TEXT NULL, status VARCHAR(30) NOT NULL DEFAULT 'draft',
        created_by VARCHAR(190) NOT NULL DEFAULT 'admin', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS meta_ads_change_requests (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, entity_id VARCHAR(80) NOT NULL, entity_level VARCHAR(30) NOT NULL,
        entity_name VARCHAR(500) NOT NULL, requested_action VARCHAR(80) NOT NULL, before_json LONGTEXT NOT NULL,
        requested_json LONGTEXT NOT NULL, reason VARCHAR(1000) NOT NULL, status ENUM('pending','approved','rejected','applied','failed') NOT NULL DEFAULT 'pending',
        requested_by VARCHAR(190) NOT NULL DEFAULT 'admin', reviewed_by VARCHAR(190) NULL, review_note VARCHAR(1000) NULL,
        requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, reviewed_at DATETIME NULL, applied_at DATETIME NULL,
        PRIMARY KEY (id), KEY idx_meta_changes_status (status, requested_at), KEY idx_meta_changes_entity (entity_id, requested_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS meta_ads_sync_runs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, date_start DATE NOT NULL, date_stop DATE NOT NULL,
        status ENUM('running','succeeded','failed') NOT NULL DEFAULT 'running', entity_count INT UNSIGNED NOT NULL DEFAULT 0,
        insight_count INT UNSIGNED NOT NULL DEFAULT 0, error_message VARCHAR(1000) NULL,
        started_at DATETIME NOT NULL, finished_at DATETIME NULL, PRIMARY KEY (id), KEY idx_meta_sync_started (started_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function metaKeyPath(): string
{
    $xamppRoot = dirname(__DIR__, 4);
    $privateDirectory = $xamppRoot . DIRECTORY_SEPARATOR . 'BrandnBeauty-private';
    if (!is_dir($privateDirectory) && !mkdir($privateDirectory, 0700, true) && !is_dir($privateDirectory)) {
        throw new RuntimeException('The private credential directory could not be created.');
    }
    return $privateDirectory . DIRECTORY_SEPARATOR . 'meta-ads-encryption.key';
}

function metaEncryptionKey(): string
{
    if (!function_exists('openssl_encrypt') || !function_exists('openssl_decrypt')) throw new RuntimeException('PHP OpenSSL is required for encrypted Meta credentials.');
    $path = metaKeyPath();
    if (!is_file($path)) {
        $encoded = base64_encode(random_bytes(32));
        if (file_put_contents($path, $encoded, LOCK_EX) === false) throw new RuntimeException('The Meta credential key could not be saved.');
        @chmod($path, 0600);
    }
    $decoded = base64_decode(trim((string) file_get_contents($path)), true);
    if (!is_string($decoded) || strlen($decoded) !== 32) throw new RuntimeException('The Meta credential key is invalid.');
    return $decoded;
}

function metaEncrypt(string $token): string
{
    $iv = random_bytes(12); $tag = '';
    $cipher = openssl_encrypt($token, 'aes-256-gcm', metaEncryptionKey(), OPENSSL_RAW_DATA, $iv, $tag);
    if (!is_string($cipher)) throw new RuntimeException('The Meta token could not be encrypted.');
    return base64_encode(json_encode(['iv' => base64_encode($iv), 'tag' => base64_encode($tag), 'cipher' => base64_encode($cipher)], JSON_UNESCAPED_SLASHES));
}

function metaDecrypt(string $payload): string
{
    $decoded = json_decode((string) base64_decode($payload, true), true);
    if (!is_array($decoded)) throw new RuntimeException('The saved Meta credential is unreadable.');
    $iv = base64_decode((string) ($decoded['iv'] ?? ''), true); $tag = base64_decode((string) ($decoded['tag'] ?? ''), true); $cipher = base64_decode((string) ($decoded['cipher'] ?? ''), true);
    if (!is_string($iv) || !is_string($tag) || !is_string($cipher)) throw new RuntimeException('The saved Meta credential is invalid.');
    $token = openssl_decrypt($cipher, 'aes-256-gcm', metaEncryptionKey(), OPENSSL_RAW_DATA, $iv, $tag);
    if (!is_string($token) || $token === '') throw new RuntimeException('The saved Meta credential could not be decrypted.');
    return $token;
}

function metaGraph(string $version, string $path, array $query, string $token): array
{
    if (!function_exists('curl_init')) throw new RuntimeException('PHP cURL is required for Meta account sync.');
    if (preg_match('/^v\d+\.\d+$/', $version) !== 1) throw new RuntimeException('The configured Graph API version is invalid.');
    if (preg_match('/^[A-Za-z0-9_\-\/]+$/', $path) !== 1) throw new RuntimeException('The Meta API path is invalid.');
    $url = 'https://graph.facebook.com/' . $version . '/' . ltrim($path, '/') . '?' . http_build_query($query, '', '&', PHP_QUERY_RFC3986);
    $handle = curl_init($url);
    curl_setopt_array($handle, [CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 12, CURLOPT_TIMEOUT => 45,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $token, 'Accept: application/json'], CURLOPT_USERAGENT => 'BrandnBeauty-Admin/1.0']);
    $body = curl_exec($handle); $status = (int) curl_getinfo($handle, CURLINFO_HTTP_CODE); $curlError = curl_error($handle); curl_close($handle);
    if (!is_string($body)) throw new RuntimeException($curlError !== '' ? $curlError : 'Meta did not return a response.');
    $data = json_decode($body, true);
    if (!is_array($data)) throw new RuntimeException('Meta returned an unreadable response.');
    if ($status >= 400 || isset($data['error'])) {
        $message = metaText($data['error']['message'] ?? 'Meta rejected the request.', 700);
        throw new RuntimeException($message);
    }
    return $data;
}

function metaGraphList(string $version, string $path, array $query, string $token, int $pageLimit = 10): array
{
    $rows = []; $after = '';
    for ($page = 0; $page < $pageLimit; $page++) {
        $pageQuery = $query; if ($after !== '') $pageQuery['after'] = $after;
        $response = metaGraph($version, $path, $pageQuery, $token);
        foreach (($response['data'] ?? []) as $row) if (is_array($row)) $rows[] = $row;
        $next = (string) ($response['paging']['cursors']['after'] ?? '');
        if ($next === '' || empty($response['paging']['next'])) break;
        $after = $next;
    }
    return $rows;
}

function metaConnection(PDO $pdo): array
{
    return $pdo->query('SELECT * FROM meta_ads_connection WHERE id=1 LIMIT 1')->fetch(PDO::FETCH_ASSOC) ?: [];
}

function metaToken(PDO $pdo): string
{
    $connection = metaConnection($pdo);
    if (($connection['connection_status'] ?? '') !== 'connected' || empty($connection['encrypted_token'])) throw new RuntimeException('Connect a Meta ad account before syncing.');
    return metaDecrypt((string) $connection['encrypted_token']);
}

function metaActionResult(array $actions): array
{
    $indexed = [];
    foreach ($actions as $action) if (is_array($action)) $indexed[(string) ($action['action_type'] ?? '')] = (float) ($action['value'] ?? 0);
    $priority = ['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase', 'onsite_web_purchase', 'messaging_conversation_started_7d', 'onsite_conversion.messaging_conversation_started_7d'];
    foreach ($priority as $type) if (isset($indexed[$type])) return ['value' => $indexed[$type], 'type' => $type];
    return ['value' => 0.0, 'type' => null];
}

function metaBudget(mixed $value): ?float
{
    if ($value === null || $value === '') return null;
    return round(((float) $value) / 100, 2);
}

function syncMetaAds(PDO $pdo, string $from, string $to): array
{
    $connection = metaConnection($pdo); $token = metaToken($pdo);
    $version = (string) $connection['graph_version']; $account = 'act_' . (string) $connection['ad_account_id'];
    $run = $pdo->prepare("INSERT INTO meta_ads_sync_runs (date_start,date_stop,status,started_at) VALUES (:date_start,:date_stop,'running',NOW())");
    $run->execute([':date_start' => $from, ':date_stop' => $to]); $runId = (int) $pdo->lastInsertId();
    try {
        $campaigns = metaGraphList($version, $account . '/campaigns', ['fields' => 'id,name,status,effective_status,objective,daily_budget,lifetime_budget,updated_time', 'limit' => 100], $token);
        $adsets = metaGraphList($version, $account . '/adsets', ['fields' => 'id,name,status,effective_status,campaign{id,name},daily_budget,lifetime_budget,optimization_goal,billing_event,updated_time', 'limit' => 100], $token);
        $ads = metaGraphList($version, $account . '/ads', ['fields' => 'id,name,status,effective_status,campaign{id,name},adset{id,name},creative{id,name},updated_time', 'limit' => 100], $token);
        $entities = [];
        foreach ($campaigns as $row) $entities[] = ['level' => 'campaign', 'row' => $row, 'parent' => null];
        foreach ($adsets as $row) $entities[] = ['level' => 'adset', 'row' => $row, 'parent' => $row['campaign'] ?? null];
        foreach ($ads as $row) $entities[] = ['level' => 'ad', 'row' => $row, 'parent' => $row['adset'] ?? null];
        $upsert = $pdo->prepare("INSERT INTO meta_ads_entities (entity_id,entity_level,entity_name,parent_id,parent_name,effective_status,configured_status,objective,daily_budget,lifetime_budget,optimization_goal,creative_id,creative_name,raw_json,last_synced_at)
            VALUES (:entity_id,:entity_level,:entity_name,:parent_id,:parent_name,:effective_status,:configured_status,:objective,:daily_budget,:lifetime_budget,:optimization_goal,:creative_id,:creative_name,:raw_json,NOW())
            ON DUPLICATE KEY UPDATE entity_level=VALUES(entity_level),entity_name=VALUES(entity_name),parent_id=VALUES(parent_id),parent_name=VALUES(parent_name),effective_status=VALUES(effective_status),configured_status=VALUES(configured_status),objective=VALUES(objective),daily_budget=VALUES(daily_budget),lifetime_budget=VALUES(lifetime_budget),optimization_goal=VALUES(optimization_goal),creative_id=VALUES(creative_id),creative_name=VALUES(creative_name),raw_json=VALUES(raw_json),last_synced_at=NOW()");
        foreach ($entities as $entity) {
            $row = $entity['row']; $parent = is_array($entity['parent']) ? $entity['parent'] : [];
            $creative = is_array($row['creative'] ?? null) ? $row['creative'] : [];
            $upsert->execute([':entity_id' => (string) $row['id'], ':entity_level' => $entity['level'], ':entity_name' => metaText($row['name'] ?? '', 500),
                ':parent_id' => $parent['id'] ?? null, ':parent_name' => $parent['name'] ?? null, ':effective_status' => $row['effective_status'] ?? null,
                ':configured_status' => $row['status'] ?? null, ':objective' => $row['objective'] ?? null, ':daily_budget' => metaBudget($row['daily_budget'] ?? null),
                ':lifetime_budget' => metaBudget($row['lifetime_budget'] ?? null), ':optimization_goal' => $row['optimization_goal'] ?? null,
                ':creative_id' => $creative['id'] ?? null, ':creative_name' => $creative['name'] ?? null, ':raw_json' => json_encode($row, JSON_UNESCAPED_SLASHES)]);
        }

        $insightCount = 0; $timeRange = json_encode(['since' => $from, 'until' => $to], JSON_UNESCAPED_SLASHES);
        foreach (['campaign', 'adset', 'ad'] as $level) {
            $identityFields = $level === 'campaign' ? 'campaign_id,campaign_name' : ($level === 'adset' ? 'adset_id,adset_name' : 'ad_id,ad_name');
            $rows = metaGraphList($version, $account . '/insights', ['fields' => $identityFields . ',spend,reach,impressions,clicks,ctr,cpc,cpm,frequency,actions,date_start,date_stop', 'level' => $level, 'time_range' => $timeRange, 'limit' => 500], $token);
            $saveInsight = $pdo->prepare("INSERT INTO meta_ads_insights (entity_id,entity_level,date_start,date_stop,spend,reach_value,impressions,clicks,ctr,cpc,cpm,frequency_value,results,result_type,raw_json,synced_at)
                VALUES (:entity_id,:entity_level,:date_start,:date_stop,:spend,:reach_value,:impressions,:clicks,:ctr,:cpc,:cpm,:frequency_value,:results,:result_type,:raw_json,NOW())
                ON DUPLICATE KEY UPDATE spend=VALUES(spend),reach_value=VALUES(reach_value),impressions=VALUES(impressions),clicks=VALUES(clicks),ctr=VALUES(ctr),cpc=VALUES(cpc),cpm=VALUES(cpm),frequency_value=VALUES(frequency_value),results=VALUES(results),result_type=VALUES(result_type),raw_json=VALUES(raw_json),synced_at=NOW()");
            foreach ($rows as $row) {
                $result = metaActionResult(is_array($row['actions'] ?? null) ? $row['actions'] : []); $entityId = (string) ($row[$level . '_id'] ?? ''); if ($entityId === '') continue;
                $saveInsight->execute([':entity_id' => $entityId, ':entity_level' => $level, ':date_start' => $from, ':date_stop' => $to,
                    ':spend' => (float) ($row['spend'] ?? 0), ':reach_value' => (int) ($row['reach'] ?? 0), ':impressions' => (int) ($row['impressions'] ?? 0),
                    ':clicks' => (int) ($row['clicks'] ?? 0), ':ctr' => (float) ($row['ctr'] ?? 0), ':cpc' => (float) ($row['cpc'] ?? 0), ':cpm' => (float) ($row['cpm'] ?? 0),
                    ':frequency_value' => (float) ($row['frequency'] ?? 0), ':results' => $result['value'], ':result_type' => $result['type'], ':raw_json' => json_encode($row, JSON_UNESCAPED_SLASHES)]);
                $insightCount++;
            }
        }

        $dailyRows = metaGraphList($version, $account . '/insights', ['fields' => 'spend,reach,impressions,clicks,ctr,cpc,actions,date_start,date_stop', 'level' => 'account', 'time_range' => $timeRange, 'time_increment' => 1, 'limit' => 500], $token);
        $dailySave = $pdo->prepare("INSERT INTO meta_ads_daily (insight_date,spend,reach_value,impressions,clicks,ctr,cpc,results,result_type,synced_at)
            VALUES (:insight_date,:spend,:reach_value,:impressions,:clicks,:ctr,:cpc,:results,:result_type,NOW())
            ON DUPLICATE KEY UPDATE spend=VALUES(spend),reach_value=VALUES(reach_value),impressions=VALUES(impressions),clicks=VALUES(clicks),ctr=VALUES(ctr),cpc=VALUES(cpc),results=VALUES(results),result_type=VALUES(result_type),synced_at=NOW()");
        foreach ($dailyRows as $row) { $result = metaActionResult(is_array($row['actions'] ?? null) ? $row['actions'] : []); $dailySave->execute([':insight_date' => $row['date_start'], ':spend' => (float) ($row['spend'] ?? 0), ':reach_value' => (int) ($row['reach'] ?? 0), ':impressions' => (int) ($row['impressions'] ?? 0), ':clicks' => (int) ($row['clicks'] ?? 0), ':ctr' => (float) ($row['ctr'] ?? 0), ':cpc' => (float) ($row['cpc'] ?? 0), ':results' => $result['value'], ':result_type' => $result['type']]); }

        $pdo->prepare("UPDATE meta_ads_connection SET last_sync_at=NOW(),last_error=NULL,connection_status='connected' WHERE id=1")->execute();
        $pdo->prepare("UPDATE meta_ads_sync_runs SET status='succeeded',entity_count=:entity_count,insight_count=:insight_count,finished_at=NOW() WHERE id=:id")->execute([':entity_count' => count($entities), ':insight_count' => $insightCount, ':id' => $runId]);
        return ['entities' => count($entities), 'insights' => $insightCount, 'daily' => count($dailyRows)];
    } catch (Throwable $error) {
        $pdo->prepare("UPDATE meta_ads_connection SET last_error=:error WHERE id=1")->execute([':error' => metaText($error->getMessage(), 1000)]);
        $pdo->prepare("UPDATE meta_ads_sync_runs SET status='failed',error_message=:error,finished_at=NOW() WHERE id=:id")->execute([':error' => metaText($error->getMessage(), 1000), ':id' => $runId]);
        throw $error;
    }
}

function metaInternalCampaigns(PDO $pdo, string $from, string $to): array
{
    if (!metaTableExists($pdo, 'order_attribution')) return [];
    $statement = $pdo->prepare("SELECT COALESCE(NULLIF(TRIM(a.utm_campaign),''),'Unattributed') campaign,
        COUNT(*) placed_orders, SUM(CASE WHEN o.status NOT IN ('cancelled','returned') THEN o.total_amount ELSE 0 END) ordered_revenue,
        SUM(CASE WHEN o.status='delivered' THEN 1 ELSE 0 END) delivered_orders,
        SUM(CASE WHEN o.status='delivered' THEN o.total_amount ELSE 0 END) delivered_revenue,
        SUM(CASE WHEN o.status IN ('cancelled','returned') THEN 1 ELSE 0 END) return_cancel_orders
        FROM orders o LEFT JOIN order_attribution a ON a.order_id=o.id WHERE DATE(o.created_at) BETWEEN :date_from AND :date_to GROUP BY campaign");
    $statement->execute([':date_from' => $from, ':date_to' => $to]);
    $rows = [];
    foreach (($statement->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) $rows[strtolower(trim((string) $row['campaign']))] = $row;
    return $rows;
}

function readMetaAds(PDO $pdo, string $from, string $to): array
{
    $connection = metaConnection($pdo); $internal = metaInternalCampaigns($pdo, $from, $to);
    $statement = $pdo->prepare("SELECT e.*,i.spend,i.reach_value,i.impressions,i.clicks,i.ctr,i.cpc,i.cpm,i.frequency_value,i.results,i.result_type,i.synced_at insight_synced_at
        FROM meta_ads_entities e LEFT JOIN meta_ads_insights i ON i.entity_id=e.entity_id AND i.date_start=:date_start AND i.date_stop=:date_stop
        ORDER BY FIELD(e.entity_level,'campaign','adset','ad'),COALESCE(i.spend,0) DESC,e.entity_name");
    $statement->execute([':date_start' => $from, ':date_stop' => $to]);
    $entities = [];
    foreach (($statement->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) {
        $outcome = $row['entity_level'] === 'campaign' ? ($internal[strtolower(trim((string) $row['entity_name']))] ?? null) : null;
        $spend = (float) ($row['spend'] ?? 0); $ordered = (float) ($outcome['ordered_revenue'] ?? 0); $delivered = (float) ($outcome['delivered_revenue'] ?? 0);
        $entities[] = ['id' => (string) $row['entity_id'], 'level' => (string) $row['entity_level'], 'name' => (string) $row['entity_name'],
            'parent_id' => $row['parent_id'], 'parent_name' => $row['parent_name'], 'effective_status' => $row['effective_status'], 'configured_status' => $row['configured_status'],
            'objective' => $row['objective'], 'daily_budget' => $row['daily_budget'] === null ? null : (float) $row['daily_budget'],
            'lifetime_budget' => $row['lifetime_budget'] === null ? null : (float) $row['lifetime_budget'], 'optimization_goal' => $row['optimization_goal'],
            'creative_id' => $row['creative_id'], 'creative_name' => $row['creative_name'], 'spend' => $spend, 'reach' => (int) ($row['reach_value'] ?? 0),
            'impressions' => (int) ($row['impressions'] ?? 0), 'clicks' => (int) ($row['clicks'] ?? 0), 'ctr' => (float) ($row['ctr'] ?? 0),
            'cpc' => (float) ($row['cpc'] ?? 0), 'cpm' => (float) ($row['cpm'] ?? 0), 'frequency' => (float) ($row['frequency_value'] ?? 0),
            'results' => (float) ($row['results'] ?? 0), 'result_type' => $row['result_type'], 'placed_orders' => (int) ($outcome['placed_orders'] ?? 0),
            'ordered_revenue' => $ordered, 'delivered_orders' => (int) ($outcome['delivered_orders'] ?? 0), 'delivered_revenue' => $delivered,
            'return_cancel_orders' => (int) ($outcome['return_cancel_orders'] ?? 0), 'ordered_roas' => $spend > 0 ? round($ordered / $spend, 2) : null,
            'delivered_roas' => $spend > 0 ? round($delivered / $spend, 2) : null, 'last_synced_at' => $row['last_synced_at'], 'insight_synced_at' => $row['insight_synced_at']];
    }
    $daily = $pdo->prepare('SELECT insight_date,spend,reach_value,impressions,clicks,ctr,cpc,results,result_type,synced_at FROM meta_ads_daily WHERE insight_date BETWEEN :date_from AND :date_to ORDER BY insight_date');
    $daily->execute([':date_from' => $from, ':date_to' => $to]);
    $drafts = $pdo->query('SELECT * FROM meta_campaign_drafts ORDER BY id DESC LIMIT 100')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $changes = $pdo->query('SELECT id,entity_id,entity_level,entity_name,requested_action,requested_json,reason,status,requested_by,reviewed_by,review_note,requested_at,reviewed_at FROM meta_ads_change_requests ORDER BY id DESC LIMIT 100')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $runs = $pdo->query('SELECT * FROM meta_ads_sync_runs ORDER BY id DESC LIMIT 12')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    return ['range' => ['from' => $from, 'to' => $to], 'connection' => ['connected' => ($connection['connection_status'] ?? '') === 'connected' && !empty($connection['encrypted_token']),
        'ad_account_id' => $connection['ad_account_id'] ?? '', 'account_name' => $connection['account_name'] ?? '', 'currency' => $connection['currency'] ?? 'BDT',
        'timezone_name' => $connection['timezone_name'] ?? 'Asia/Dhaka', 'graph_version' => $connection['graph_version'] ?? 'v26.0', 'token_hint' => $connection['token_hint'] ?? '',
        'account_status' => $connection['account_status'] ?? null, 'last_sync_at' => $connection['last_sync_at'] ?? null, 'last_error' => $connection['last_error'] ?? null],
        'entities' => $entities, 'daily' => $daily->fetchAll(PDO::FETCH_ASSOC) ?: [], 'drafts' => $drafts, 'change_requests' => $changes, 'sync_runs' => $runs, 'generated_at' => date(DATE_ATOM)];
}

try {
    $pdo = getDatabaseConnection(); ensureMetaAdsTables($pdo);
    $from = metaDate($_GET['date_from'] ?? '', date('Y-m-d', strtotime('-29 days'))); $to = metaDate($_GET['date_to'] ?? '', date('Y-m-d'));
    if ($from > $to) metaJson(422, ['success' => false, 'message' => 'Start date cannot be after end date.']);
    if ((new DateTimeImmutable($from))->diff(new DateTimeImmutable($to))->days > 366) metaJson(422, ['success' => false, 'message' => 'Choose a range of 366 days or fewer.']);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'GET') metaJson(200, array_merge(['success' => true], readMetaAds($pdo, $from, $to)));
    if ($method !== 'POST') metaJson(405, ['success' => false, 'message' => 'Method not allowed.']);
    $payload = metaPayload(); $action = strtolower(metaText($payload['action'] ?? '', 60));

    if ($action === 'connect') {
        $token = metaText($payload['access_token'] ?? '', 4096); $accountId = preg_replace('/\D+/', '', metaText($payload['ad_account_id'] ?? '', 100));
        $version = metaText($payload['graph_version'] ?? 'v26.0', 20);
        if ($token === '' || $accountId === '' || preg_match('/^v\d+\.\d+$/', $version) !== 1) metaJson(422, ['success' => false, 'message' => 'A valid ad account ID, access token and Graph API version are required.']);
        $account = metaGraph($version, 'act_' . $accountId, ['fields' => 'id,name,currency,timezone_name,account_status'], $token);
        $save = $pdo->prepare("UPDATE meta_ads_connection SET ad_account_id=:account_id,account_name=:account_name,currency=:currency,timezone_name=:timezone_name,graph_version=:graph_version,encrypted_token=:encrypted_token,token_hint=:token_hint,connection_status='connected',account_status=:account_status,last_error=NULL WHERE id=1");
        $save->execute([':account_id' => $accountId, ':account_name' => metaText($account['name'] ?? 'Meta Ad Account', 191), ':currency' => metaText($account['currency'] ?? 'BDT', 3), ':timezone_name' => metaText($account['timezone_name'] ?? 'Asia/Dhaka', 100), ':graph_version' => $version, ':encrypted_token' => metaEncrypt($token), ':token_hint' => '••••' . substr($token, -4), ':account_status' => (string) ($account['account_status'] ?? 'unknown')]);
        $token = str_repeat('*', strlen($token));
        metaJson(200, array_merge(['success' => true, 'message' => 'Meta ad account connected. The token was encrypted outside the public web folder.'], readMetaAds($pdo, $from, $to)));
    }
    if ($action === 'disconnect') {
        $pdo->exec("UPDATE meta_ads_connection SET encrypted_token=NULL,token_hint='',connection_status='not_connected',last_error=NULL WHERE id=1");
        metaJson(200, array_merge(['success' => true, 'message' => 'Meta account credential disconnected. Saved snapshots and audit history were retained.'], readMetaAds($pdo, $from, $to)));
    }
    if ($action === 'sync') {
        $counts = syncMetaAds($pdo, $from, $to);
        metaJson(200, array_merge(['success' => true, 'message' => "Meta sync completed: {$counts['entities']} entities and {$counts['insights']} insight rows."], readMetaAds($pdo, $from, $to)));
    }
    if ($action === 'save_draft') {
        $name = metaText($payload['draft_name'] ?? '', 191); $product = metaText($payload['product_offer'] ?? '', 500); $budget = round(max(0, (float) ($payload['daily_budget'] ?? 0)), 2);
        $start = metaDate($payload['start_date'] ?? '', ''); $end = metaDate($payload['end_date'] ?? '', ''); if ($end === '') $end = null;
        if ($name === '' || $product === '' || $budget <= 0 || $budget > 20000 || $start === '') metaJson(422, ['success' => false, 'message' => 'Name, product, start date and a daily budget up to ৳20,000 are required.']);
        if ($end !== null && $end < $start) metaJson(422, ['success' => false, 'message' => 'End date cannot be before start date.']);
        $save = $pdo->prepare("INSERT INTO meta_campaign_drafts (draft_name,objective,destination,daily_budget,product_offer,audience,placements,optimization_event,start_date,end_date,strategy_note) VALUES (:draft_name,:objective,:destination,:daily_budget,:product_offer,:audience,:placements,:optimization_event,:start_date,:end_date,:strategy_note)");
        $save->execute([':draft_name' => $name, ':objective' => metaText($payload['objective'] ?? 'Sales', 100), ':destination' => metaText($payload['destination'] ?? 'Website', 80), ':daily_budget' => $budget, ':product_offer' => $product, ':audience' => metaText($payload['audience'] ?? '', 1000), ':placements' => metaText($payload['placements'] ?? '', 500), ':optimization_event' => metaText($payload['optimization_event'] ?? 'Purchase', 100), ':start_date' => $start, ':end_date' => $end, ':strategy_note' => metaText($payload['strategy_note'] ?? '', 4000)]);
        metaJson(200, array_merge(['success' => true, 'message' => 'Recoverable internal campaign draft saved. Nothing was published to Meta.'], readMetaAds($pdo, $from, $to)));
    }
    if ($action === 'request_change') {
        $entityId = metaText($payload['entity_id'] ?? '', 80); $requestAction = metaText($payload['requested_action'] ?? '', 80); $reason = metaText($payload['reason'] ?? '', 1000);
        $find = $pdo->prepare('SELECT * FROM meta_ads_entities WHERE entity_id=:id LIMIT 1'); $find->execute([':id' => $entityId]); $entity = $find->fetch(PDO::FETCH_ASSOC);
        if (!$entity || $requestAction === '' || $reason === '') metaJson(422, ['success' => false, 'message' => 'A synced Meta entity, requested action and reason are required.']);
        $requested = is_array($payload['requested'] ?? null) ? $payload['requested'] : [];
        if (($requestAction === 'change_budget') && ((float) ($requested['daily_budget'] ?? 0) <= 0 || (float) ($requested['daily_budget'] ?? 0) > 20000 || $entity['entity_level'] === 'ad')) metaJson(422, ['success' => false, 'message' => 'Budget must be ৳1–৳20,000 and Ads cannot own a budget.']);
        $save = $pdo->prepare("INSERT INTO meta_ads_change_requests (entity_id,entity_level,entity_name,requested_action,before_json,requested_json,reason) VALUES (:entity_id,:entity_level,:entity_name,:requested_action,:before_json,:requested_json,:reason)");
        $save->execute([':entity_id' => $entityId, ':entity_level' => $entity['entity_level'], ':entity_name' => $entity['entity_name'], ':requested_action' => $requestAction, ':before_json' => json_encode($entity, JSON_UNESCAPED_SLASHES), ':requested_json' => json_encode($requested, JSON_UNESCAPED_SLASHES), ':reason' => $reason]);
        metaJson(200, array_merge(['success' => true, 'message' => 'Change request saved for human approval. Meta was not modified.'], readMetaAds($pdo, $from, $to)));
    }
    if ($action === 'review_change') {
        $id = max(0, (int) ($payload['id'] ?? 0)); $decision = strtolower(metaText($payload['decision'] ?? '', 20)); $note = metaText($payload['review_note'] ?? '', 1000);
        if ($id === 0 || !in_array($decision, ['approved','rejected'], true) || $note === '') metaJson(422, ['success' => false, 'message' => 'Request, decision and review note are required.']);
        $review = $pdo->prepare("UPDATE meta_ads_change_requests SET status=:status,reviewed_by='admin',review_note=:review_note,reviewed_at=NOW() WHERE id=:id AND status='pending'");
        $review->execute([':status' => $decision, ':review_note' => $note, ':id' => $id]);
        if ($review->rowCount() === 0) metaJson(409, ['success' => false, 'message' => 'This request is no longer pending.']);
        metaJson(200, array_merge(['success' => true, 'message' => 'Review recorded. Approval is internal only; no Meta mutation was executed.'], readMetaAds($pdo, $from, $to)));
    }
    metaJson(400, ['success' => false, 'message' => 'Unknown action.']);
} catch (Throwable $error) {
    error_log('Meta Ads API error: ' . $error->getMessage());
    metaJson(500, ['success' => false, 'message' => metaText($error->getMessage(), 700)]);
}
