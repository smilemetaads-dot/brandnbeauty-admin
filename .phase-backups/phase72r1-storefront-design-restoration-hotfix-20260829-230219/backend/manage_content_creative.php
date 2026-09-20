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

function contentJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function contentText(mixed $value, int $limit = 500): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function contentPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function contentTableExists(PDO $pdo, string $table): bool
{
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table' => $table]);
    return (int) $query->fetchColumn() > 0;
}

function contentColumns(PDO $pdo, string $table): array
{
    if (!contentTableExists($pdo, $table)) return [];
    $query = $pdo->prepare('SELECT column_name FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table' => $table]);
    return array_map('strtolower', $query->fetchAll(PDO::FETCH_COLUMN) ?: []);
}

function contentDate(mixed $value, string $fallback): string
{
    $date = contentText($value, 10);
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
    return $parsed && $parsed->format('Y-m-d') === $date ? $date : $fallback;
}

function contentIdentifier(string $identifier): string
{
    if (preg_match('/^[a-zA-Z0-9_]+$/', $identifier) !== 1) throw new RuntimeException('Unsafe database column name.');
    return '`' . $identifier . '`';
}

function ensureContentCreativeTables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS content_creative_controls (
        id TINYINT UNSIGNED NOT NULL, fatigue_threshold DECIMAL(6,2) NOT NULL DEFAULT 3.50,
        minimum_spend DECIMAL(14,2) NOT NULL DEFAULT 3000, minimum_results INT UNSIGNED NOT NULL DEFAULT 10,
        require_claim_review TINYINT(1) NOT NULL DEFAULT 1, require_rights_review TINYINT(1) NOT NULL DEFAULT 1,
        updated_by VARCHAR(190) NOT NULL DEFAULT 'admin', updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("INSERT IGNORE INTO content_creative_controls (id) VALUES (1)");

    $pdo->exec("CREATE TABLE IF NOT EXISTS content_creative_control_versions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, controls_json LONGTEXT NOT NULL, reason VARCHAR(1000) NOT NULL,
        created_by VARCHAR(190) NOT NULL DEFAULT 'admin', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS content_creative_briefs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, objective VARCHAR(120) NOT NULL, product_scope VARCHAR(500) NOT NULL,
        creative_format VARCHAR(100) NOT NULL, audience VARCHAR(500) NOT NULL, hook_message VARCHAR(1000) NOT NULL,
        proof_evidence TEXT NOT NULL, cta_label VARCHAR(120) NOT NULL, exclusions TEXT NOT NULL,
        rights_required TINYINT(1) NOT NULL DEFAULT 1, status ENUM('draft','approved','rejected','archived') NOT NULL DEFAULT 'draft',
        review_note VARCHAR(1000) NULL, created_by VARCHAR(190) NOT NULL DEFAULT 'admin', reviewed_by VARCHAR(190) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, reviewed_at DATETIME NULL, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_content_briefs_status (status, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS content_creative_reviews (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, creative_ref VARCHAR(120) NOT NULL, creative_name VARCHAR(500) NOT NULL,
        review_type ENUM('claim','brand','rights','combined') NOT NULL DEFAULT 'combined', decision ENUM('clear','check','blocked') NOT NULL,
        note VARCHAR(1000) NOT NULL, evidence_reference VARCHAR(1000) NULL, reviewed_by VARCHAR(190) NOT NULL DEFAULT 'admin',
        reviewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), KEY idx_content_reviews_ref (creative_ref, reviewed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS content_creative_decisions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, creative_ref VARCHAR(120) NOT NULL, creative_name VARCHAR(500) NOT NULL,
        decision VARCHAR(80) NOT NULL, owner_name VARCHAR(120) NOT NULL, note VARCHAR(1000) NOT NULL,
        created_by VARCHAR(190) NOT NULL DEFAULT 'admin', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_content_decisions_ref (creative_ref, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function productContentReadiness(PDO $pdo): array
{
    $columns = contentColumns($pdo, 'products');
    if (!$columns) return ['available' => false, 'total' => 0, 'with_image' => 0, 'with_description' => 0, 'gaps' => []];
    $id = in_array('id', $columns, true) ? 'id' : '';
    $name = in_array('product_name', $columns, true) ? 'product_name' : (in_array('name', $columns, true) ? 'name' : '');
    $image = in_array('image_url', $columns, true) ? 'image_url' : (in_array('image', $columns, true) ? 'image' : '');
    $description = in_array('description', $columns, true) ? 'description' : (in_array('short_description', $columns, true) ? 'short_description' : '');
    $status = in_array('status', $columns, true) ? 'status' : '';
    if ($id === '' || $name === '') return ['available' => false, 'total' => 0, 'with_image' => 0, 'with_description' => 0, 'gaps' => []];
    $total = (int) $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn();
    $withImage = $image !== '' ? (int) $pdo->query('SELECT COUNT(*) FROM products WHERE NULLIF(TRIM(' . contentIdentifier($image) . "),'') IS NOT NULL")->fetchColumn() : 0;
    $withDescription = $description !== '' ? (int) $pdo->query('SELECT COUNT(*) FROM products WHERE NULLIF(TRIM(' . contentIdentifier($description) . "),'') IS NOT NULL")->fetchColumn() : 0;
    $missing = [];
    if ($image !== '' || $description !== '') {
        $conditions = [];
        if ($image !== '') $conditions[] = 'NULLIF(TRIM(' . contentIdentifier($image) . "),'') IS NULL";
        if ($description !== '') $conditions[] = 'NULLIF(TRIM(' . contentIdentifier($description) . "),'') IS NULL";
        $select = contentIdentifier($id) . ' item_id,' . contentIdentifier($name) . ' item_name' . ($image !== '' ? ',' . contentIdentifier($image) . ' image_value' : ",'' image_value") . ($description !== '' ? ',' . contentIdentifier($description) . ' description_value' : ",'' description_value") . ($status !== '' ? ',' . contentIdentifier($status) . ' item_status' : ",'unknown' item_status");
        $rows = $pdo->query('SELECT ' . $select . ' FROM products WHERE ' . implode(' OR ', $conditions) . ' ORDER BY ' . contentIdentifier($id) . ' DESC LIMIT 50')->fetchAll(PDO::FETCH_ASSOC) ?: [];
        foreach ($rows as $row) $missing[] = ['id' => (string) $row['item_id'], 'name' => (string) $row['item_name'], 'status' => (string) $row['item_status'], 'missing_image' => trim((string) $row['image_value']) === '', 'missing_description' => trim((string) $row['description_value']) === ''];
    }
    return ['available' => true, 'total' => $total, 'with_image' => $withImage, 'with_description' => $withDescription, 'gaps' => $missing];
}

function contentSupportingHealth(PDO $pdo): array
{
    $homepageHeroes = 0;
    if (contentTableExists($pdo, 'homepage_cms_state')) {
        $raw = (string) ($pdo->query('SELECT live_json FROM homepage_cms_state WHERE id=1 LIMIT 1')->fetchColumn() ?: '');
        $config = json_decode($raw, true); $homepageHeroes = is_array($config['hero_banners'] ?? null) ? count($config['hero_banners']) : 0;
    }
    $reviews = ['total_media' => 0, 'consented_media' => 0, 'missing_consent' => 0];
    if (contentTableExists($pdo, 'reviews_cms_entries')) {
        $row = $pdo->query("SELECT COUNT(*) total_media,SUM(CASE WHEN consent_obtained=1 THEN 1 ELSE 0 END) consented_media,SUM(CASE WHEN consent_obtained=0 THEN 1 ELSE 0 END) missing_consent FROM reviews_cms_entries WHERE NULLIF(TRIM(media_url),'') IS NOT NULL")->fetch(PDO::FETCH_ASSOC) ?: [];
        $reviews = ['total_media' => (int) ($row['total_media'] ?? 0), 'consented_media' => (int) ($row['consented_media'] ?? 0), 'missing_consent' => (int) ($row['missing_consent'] ?? 0)];
    }
    $meta = ['connected' => false, 'ads' => 0, 'last_sync_at' => null];
    if (contentTableExists($pdo, 'meta_ads_connection')) {
        $connection = $pdo->query('SELECT connection_status,last_sync_at FROM meta_ads_connection WHERE id=1 LIMIT 1')->fetch(PDO::FETCH_ASSOC) ?: [];
        $meta['connected'] = ($connection['connection_status'] ?? '') === 'connected'; $meta['last_sync_at'] = $connection['last_sync_at'] ?? null;
    }
    if (contentTableExists($pdo, 'meta_ads_entities')) $meta['ads'] = (int) $pdo->query("SELECT COUNT(*) FROM meta_ads_entities WHERE entity_level='ad'")->fetchColumn();
    return ['homepage_hero_count' => $homepageHeroes, 'review_media' => $reviews, 'meta' => $meta];
}

function contentCreativeRows(PDO $pdo, string $from, string $to, array $controls): array
{
    if (!contentTableExists($pdo, 'meta_ads_entities') || !contentTableExists($pdo, 'meta_ads_insights')) return [];
    $reviews = [];
    foreach (($pdo->query('SELECT * FROM content_creative_reviews ORDER BY id DESC')->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) if (!isset($reviews[(string) $row['creative_ref']])) $reviews[(string) $row['creative_ref']] = $row;
    $decisions = [];
    foreach (($pdo->query('SELECT * FROM content_creative_decisions ORDER BY id DESC')->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) if (!isset($decisions[(string) $row['creative_ref']])) $decisions[(string) $row['creative_ref']] = $row;
    $query = $pdo->prepare("SELECT e.*,i.spend,i.reach_value,i.impressions,i.clicks,i.ctr,i.cpc,i.frequency_value,i.results,i.result_type,i.synced_at insight_synced_at
        FROM meta_ads_entities e LEFT JOIN meta_ads_insights i ON i.entity_id=e.entity_id AND i.date_start=:date_start AND i.date_stop=:date_stop
        WHERE e.entity_level='ad' ORDER BY COALESCE(i.spend,0) DESC,e.entity_name");
    $query->execute([':date_start' => $from, ':date_stop' => $to]);
    $rows = [];
    foreach (($query->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) {
        $raw = json_decode((string) ($row['raw_json'] ?? ''), true); if (!is_array($raw)) $raw = [];
        $id = (string) $row['entity_id']; $review = $reviews[$id] ?? null; $decision = $decisions[$id] ?? null;
        $frequency = (float) ($row['frequency_value'] ?? 0); $spend = (float) ($row['spend'] ?? 0); $results = (float) ($row['results'] ?? 0);
        $status = strtoupper((string) ($row['effective_status'] ?? $row['configured_status'] ?? 'UNKNOWN'));
        $health = 'No data';
        if (str_contains($status, 'DISAPPROVED')) $health = 'Review';
        elseif ($frequency >= (float) $controls['fatigue_threshold']) $health = 'Fatigued';
        elseif ($frequency >= (float) $controls['fatigue_threshold'] * 0.8) $health = 'Watch';
        elseif ($spend >= (float) $controls['minimum_spend'] && $results >= (float) $controls['minimum_results']) $health = 'Healthy';
        elseif ($spend > 0) $health = 'Learning';
        $rows[] = ['id' => $id, 'name' => (string) $row['entity_name'], 'creative_id' => (string) ($row['creative_id'] ?? ''), 'creative_name' => (string) ($row['creative_name'] ?? ''),
            'adset_name' => (string) ($raw['adset']['name'] ?? $row['parent_name'] ?? ''), 'campaign_name' => (string) ($raw['campaign']['name'] ?? ''), 'status' => $status,
            'health' => $health, 'spend' => $spend, 'reach' => (int) ($row['reach_value'] ?? 0), 'impressions' => (int) ($row['impressions'] ?? 0),
            'clicks' => (int) ($row['clicks'] ?? 0), 'ctr' => (float) ($row['ctr'] ?? 0), 'cpc' => (float) ($row['cpc'] ?? 0), 'frequency' => $frequency,
            'results' => $results, 'result_type' => (string) ($row['result_type'] ?? ''), 'last_synced_at' => $row['insight_synced_at'] ?? $row['last_synced_at'],
            'review' => $review ? ['decision' => (string) $review['decision'], 'type' => (string) $review['review_type'], 'note' => (string) $review['note'], 'evidence_reference' => (string) ($review['evidence_reference'] ?? ''), 'reviewed_at' => $review['reviewed_at']] : null,
            'latest_decision' => $decision ? ['decision' => (string) $decision['decision'], 'owner' => (string) $decision['owner_name'], 'note' => (string) $decision['note'], 'created_at' => $decision['created_at']] : null];
    }
    return $rows;
}

function readContentCreative(PDO $pdo, string $from, string $to): array
{
    $controls = $pdo->query('SELECT * FROM content_creative_controls WHERE id=1')->fetch(PDO::FETCH_ASSOC) ?: [];
    return ['range' => ['from' => $from, 'to' => $to], 'controls' => $controls, 'creatives' => contentCreativeRows($pdo, $from, $to, $controls),
        'product_readiness' => productContentReadiness($pdo), 'supporting_health' => contentSupportingHealth($pdo),
        'briefs' => $pdo->query('SELECT * FROM content_creative_briefs ORDER BY id DESC LIMIT 100')->fetchAll(PDO::FETCH_ASSOC) ?: [],
        'reviews' => $pdo->query('SELECT * FROM content_creative_reviews ORDER BY id DESC LIMIT 100')->fetchAll(PDO::FETCH_ASSOC) ?: [],
        'decisions' => $pdo->query('SELECT * FROM content_creative_decisions ORDER BY id DESC LIMIT 100')->fetchAll(PDO::FETCH_ASSOC) ?: [],
        'generated_at' => date(DATE_ATOM)];
}

try {
    $pdo = getDatabaseConnection(); ensureContentCreativeTables($pdo);
    $from = contentDate($_GET['date_from'] ?? '', date('Y-m-d', strtotime('-29 days'))); $to = contentDate($_GET['date_to'] ?? '', date('Y-m-d'));
    if ($from > $to) contentJson(422, ['success' => false, 'message' => 'Start date cannot be after end date.']);
    if ((new DateTimeImmutable($from))->diff(new DateTimeImmutable($to))->days > 366) contentJson(422, ['success' => false, 'message' => 'Choose a range of 366 days or fewer.']);
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') contentJson(200, array_merge(['success' => true], readContentCreative($pdo, $from, $to)));
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') contentJson(405, ['success' => false, 'message' => 'Method not allowed.']);
    $payload = contentPayload(); $action = strtolower(contentText($payload['action'] ?? '', 60));

    if ($action === 'save_controls') {
        $fatigue = round((float) ($payload['fatigue_threshold'] ?? 0), 2); $spend = round((float) ($payload['minimum_spend'] ?? 0), 2); $results = (int) ($payload['minimum_results'] ?? 0); $reason = contentText($payload['reason'] ?? '', 1000);
        if ($fatigue < 1 || $fatigue > 20 || $spend < 0 || $spend > 10000000 || $results < 1 || $results > 100000 || $reason === '') contentJson(422, ['success' => false, 'message' => 'Valid thresholds and a change reason are required.']);
        $values = ['fatigue_threshold' => $fatigue, 'minimum_spend' => $spend, 'minimum_results' => $results, 'require_claim_review' => !empty($payload['require_claim_review']) ? 1 : 0, 'require_rights_review' => !empty($payload['require_rights_review']) ? 1 : 0];
        $pdo->beginTransaction();
        $save = $pdo->prepare('UPDATE content_creative_controls SET fatigue_threshold=:fatigue_threshold,minimum_spend=:minimum_spend,minimum_results=:minimum_results,require_claim_review=:require_claim_review,require_rights_review=:require_rights_review,updated_by=\'admin\' WHERE id=1'); $save->execute($values);
        $version = $pdo->prepare('INSERT INTO content_creative_control_versions (controls_json,reason) VALUES (:controls_json,:reason)'); $version->execute([':controls_json' => json_encode($values, JSON_UNESCAPED_SLASHES), ':reason' => $reason]); $pdo->commit();
        contentJson(200, array_merge(['success' => true, 'message' => 'Creative diagnostic controls saved with audit reason.'], readContentCreative($pdo, $from, $to)));
    }
    if ($action === 'save_brief') {
        $product = contentText($payload['product_scope'] ?? '', 500); $hook = contentText($payload['hook_message'] ?? '', 1000); $proof = contentText($payload['proof_evidence'] ?? '', 5000); $exclusions = contentText($payload['exclusions'] ?? '', 5000);
        if ($product === '' || $hook === '' || $proof === '' || $exclusions === '') contentJson(422, ['success' => false, 'message' => 'Product, hook, evidence and exclusions are required.']);
        $save = $pdo->prepare('INSERT INTO content_creative_briefs (objective,product_scope,creative_format,audience,hook_message,proof_evidence,cta_label,exclusions,rights_required) VALUES (:objective,:product_scope,:creative_format,:audience,:hook_message,:proof_evidence,:cta_label,:exclusions,1)');
        $save->execute([':objective' => contentText($payload['objective'] ?? 'Delivered profit', 120), ':product_scope' => $product, ':creative_format' => contentText($payload['creative_format'] ?? 'Static 1:1', 100), ':audience' => contentText($payload['audience'] ?? '', 500), ':hook_message' => $hook, ':proof_evidence' => $proof, ':cta_label' => contentText($payload['cta_label'] ?? 'Learn more', 120), ':exclusions' => $exclusions]);
        contentJson(200, array_merge(['success' => true, 'message' => 'Controlled creative brief saved as an internal draft.'], readContentCreative($pdo, $from, $to)));
    }
    if ($action === 'save_review') {
        $ref = contentText($payload['creative_ref'] ?? '', 120); $name = contentText($payload['creative_name'] ?? '', 500); $type = strtolower(contentText($payload['review_type'] ?? 'combined', 20)); $decision = strtolower(contentText($payload['decision'] ?? '', 20)); $note = contentText($payload['note'] ?? '', 1000);
        if ($ref === '' || $name === '' || !in_array($type, ['claim','brand','rights','combined'], true) || !in_array($decision, ['clear','check','blocked'], true) || $note === '') contentJson(422, ['success' => false, 'message' => 'Creative, review type, decision and note are required.']);
        $save = $pdo->prepare('INSERT INTO content_creative_reviews (creative_ref,creative_name,review_type,decision,note,evidence_reference) VALUES (:creative_ref,:creative_name,:review_type,:decision,:note,:evidence_reference)');
        $save->execute([':creative_ref' => $ref, ':creative_name' => $name, ':review_type' => $type, ':decision' => $decision, ':note' => $note, ':evidence_reference' => contentText($payload['evidence_reference'] ?? '', 1000)]);
        contentJson(200, array_merge(['success' => true, 'message' => 'Claim, brand and rights review recorded.'], readContentCreative($pdo, $from, $to)));
    }
    if ($action === 'save_decision') {
        $ref = contentText($payload['creative_ref'] ?? '', 120); $name = contentText($payload['creative_name'] ?? '', 500); $decision = contentText($payload['decision'] ?? '', 80); $owner = contentText($payload['owner'] ?? '', 120); $note = contentText($payload['note'] ?? '', 1000);
        if ($ref === '' || $name === '' || $decision === '' || $owner === '' || $note === '') contentJson(422, ['success' => false, 'message' => 'Creative, decision, owner and note are required.']);
        $save = $pdo->prepare('INSERT INTO content_creative_decisions (creative_ref,creative_name,decision,owner_name,note) VALUES (:creative_ref,:creative_name,:decision,:owner_name,:note)'); $save->execute([':creative_ref' => $ref, ':creative_name' => $name, ':decision' => $decision, ':owner_name' => $owner, ':note' => $note]);
        contentJson(200, array_merge(['success' => true, 'message' => 'Human creative decision recorded. No ad or content was changed.'], readContentCreative($pdo, $from, $to)));
    }
    if ($action === 'review_brief') {
        $id = (int) ($payload['id'] ?? 0); $decision = strtolower(contentText($payload['decision'] ?? '', 20)); $note = contentText($payload['note'] ?? '', 1000);
        if ($id <= 0 || !in_array($decision, ['approved','rejected'], true) || $note === '') contentJson(422, ['success' => false, 'message' => 'Brief, decision and review note are required.']);
        $review = $pdo->prepare("UPDATE content_creative_briefs SET status=:status,review_note=:note,reviewed_by='admin',reviewed_at=NOW() WHERE id=:id AND status='draft'"); $review->execute([':status' => $decision, ':note' => $note, ':id' => $id]);
        if ($review->rowCount() === 0) contentJson(409, ['success' => false, 'message' => 'This brief is no longer awaiting review.']);
        contentJson(200, array_merge(['success' => true, 'message' => 'Brief review recorded. Nothing was published.'], readContentCreative($pdo, $from, $to)));
    }
    contentJson(400, ['success' => false, 'message' => 'Unknown action.']);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('Content Creative API error: ' . $error->getMessage());
    contentJson(500, ['success' => false, 'message' => contentText($error->getMessage(), 700)]);
}
