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

function marketingJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function marketingText(mixed $value, int $limit = 191): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function marketingTableExists(PDO $pdo, string $table): bool
{
    $statement = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = :table');
    $statement->execute([':table' => $table]);
    return (int) $statement->fetchColumn() > 0;
}

function ensureMarketingPerformanceTables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS marketing_spend (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        spend_date DATE NOT NULL, platform VARCHAR(50) NOT NULL,
        campaign_id VARCHAR(191) NOT NULL DEFAULT '', campaign_name VARCHAR(191) NOT NULL,
        adset_id VARCHAR(191) NULL, ad_id VARCHAR(191) NULL,
        spend_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        currency CHAR(3) NOT NULL DEFAULT 'BDT', source ENUM('manual','csv','meta') NOT NULL DEFAULT 'manual',
        note TEXT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_marketing_spend_day_campaign (spend_date, platform, campaign_name, campaign_id),
        KEY idx_marketing_spend_campaign (campaign_name, spend_date), KEY idx_marketing_spend_platform_date (platform, spend_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS marketing_spend_audit (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, spend_id BIGINT UNSIGNED NULL,
        action VARCHAR(40) NOT NULL, before_json LONGTEXT NULL, after_json LONGTEXT NULL,
        reason VARCHAR(500) NULL, actor VARCHAR(190) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_marketing_spend_audit_spend (spend_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function marketingDate(mixed $value, string $fallback): string
{
    $date = marketingText($value, 10);
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
    return $parsed && $parsed->format('Y-m-d') === $date ? $date : $fallback;
}

function marketingNumber(mixed $value): float
{
    return round(max(0, (float) $value), 2);
}

function normalizeMarketingKey(string $platform, string $campaign): string
{
    $normalizedPlatform = strtolower(trim($platform));
    if (in_array($normalizedPlatform, ['facebook', 'instagram', 'fb', 'meta ads'], true)) $normalizedPlatform = 'meta';
    if (in_array($normalizedPlatform, ['adwords', 'google ads'], true)) $normalizedPlatform = 'google';
    $value = $normalizedPlatform . '|' . strtolower(trim($campaign));
    return preg_replace('/\s+/', ' ', $value) ?: $value;
}

function marketingPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function readMarketingPerformance(PDO $pdo, string $from, string $to): array
{
    $hasAttribution = marketingTableExists($pdo, 'order_attribution');
    $hasCosts = marketingTableExists($pdo, 'order_financials');
    $hasCollections = marketingTableExists($pdo, 'cod_reconciliation');

    $attributionJoin = $hasAttribution ? 'LEFT JOIN order_attribution a ON a.order_id = o.id' : '';
    $attributionSelect = $hasAttribution
        ? "COALESCE(NULLIF(TRIM(a.utm_source), ''), 'Unattributed') AS platform, COALESCE(NULLIF(TRIM(a.utm_campaign), ''), 'Unattributed') AS campaign"
        : "'Unattributed' AS platform, 'Unattributed' AS campaign";
    $costJoin = $hasCosts ? 'LEFT JOIN order_financials f ON f.order_id = o.id' : '';
    $costSelect = $hasCosts
        ? 'SUM(CASE WHEN o.status = \'delivered\' THEN COALESCE(f.product_cost,0)+COALESCE(f.packaging_cost,0)+COALESCE(f.courier_cost,0)+COALESCE(f.payment_fee,0)+COALESCE(f.return_cost,0)+COALESCE(f.other_cost,0) ELSE 0 END) AS direct_cost'
        : 'NULL AS direct_cost';
    $collectionJoin = $hasCollections ? 'LEFT JOIN cod_reconciliation cr ON cr.order_id = o.id' : '';
    $collectionSelect = $hasCollections
        ? "SUM(CASE WHEN cr.status IN ('collected','settled') THEN CASE WHEN cr.settled_amount > 0 THEN cr.settled_amount ELSE cr.collected_amount END ELSE 0 END) AS collected_revenue"
        : 'NULL AS collected_revenue';

    $orderSql = "SELECT {$attributionSelect},
        COUNT(*) AS placed_orders,
        SUM(CASE WHEN o.status NOT IN ('cancelled','returned') THEN o.total_amount ELSE 0 END) AS ordered_revenue,
        SUM(CASE WHEN o.status IN ('confirmed','processing','packed','shipped','delivered') THEN o.total_amount ELSE 0 END) AS confirmed_revenue,
        SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) AS delivered_orders,
        SUM(CASE WHEN o.status = 'delivered' THEN o.total_amount ELSE 0 END) AS delivered_revenue,
        SUM(CASE WHEN o.status IN ('cancelled','returned') THEN 1 ELSE 0 END) AS return_cancel_orders,
        SUM(CASE WHEN o.status IN ('cancelled','returned') THEN o.total_amount ELSE 0 END) AS return_cancel_value,
        {$collectionSelect}, {$costSelect}
        FROM orders o {$attributionJoin} {$costJoin} {$collectionJoin}
        WHERE DATE(o.created_at) BETWEEN :date_from AND :date_to
        GROUP BY platform, campaign";
    $orderStatement = $pdo->prepare($orderSql);
    $orderStatement->execute([':date_from' => $from, ':date_to' => $to]);
    $orderRows = $orderStatement->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $spendStatement = $pdo->prepare("SELECT platform, campaign_name AS campaign, SUM(spend_amount) AS spend FROM marketing_spend WHERE spend_date BETWEEN :date_from AND :date_to GROUP BY platform, campaign_name");
    $spendStatement->execute([':date_from' => $from, ':date_to' => $to]);
    $spendRows = $spendStatement->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $campaigns = [];
    foreach ($orderRows as $row) {
        $key = normalizeMarketingKey((string) $row['platform'], (string) $row['campaign']);
        $campaigns[$key] = [
            'platform' => (string) $row['platform'], 'campaign' => (string) $row['campaign'], 'spend' => 0.0,
            'placed_orders' => (int) $row['placed_orders'], 'ordered_revenue' => (float) $row['ordered_revenue'],
            'confirmed_revenue' => (float) $row['confirmed_revenue'], 'delivered_orders' => (int) $row['delivered_orders'],
            'delivered_revenue' => (float) $row['delivered_revenue'], 'return_cancel_orders' => (int) $row['return_cancel_orders'],
            'return_cancel_value' => (float) $row['return_cancel_value'],
            'collected_revenue' => $row['collected_revenue'] === null ? null : (float) $row['collected_revenue'],
            'direct_cost' => $row['direct_cost'] === null ? null : (float) $row['direct_cost'],
        ];
    }
    foreach ($spendRows as $row) {
        $key = normalizeMarketingKey((string) $row['platform'], (string) $row['campaign']);
        if (!isset($campaigns[$key])) {
            $campaigns[$key] = ['platform' => (string) $row['platform'], 'campaign' => (string) $row['campaign'],
                'spend' => 0.0, 'placed_orders' => 0, 'ordered_revenue' => 0.0, 'confirmed_revenue' => 0.0,
                'delivered_orders' => 0, 'delivered_revenue' => 0.0, 'return_cancel_orders' => 0,
                'return_cancel_value' => 0.0, 'collected_revenue' => $hasCollections ? 0.0 : null,
                'direct_cost' => $hasCosts ? 0.0 : null];
        }
        $campaigns[$key]['spend'] += (float) $row['spend'];
    }

    $summary = ['spend' => 0.0, 'placed_orders' => 0, 'ordered_revenue' => 0.0, 'confirmed_revenue' => 0.0,
        'delivered_orders' => 0, 'delivered_revenue' => 0.0, 'return_cancel_orders' => 0,
        'return_cancel_value' => 0.0, 'collected_revenue' => $hasCollections ? 0.0 : null,
        'direct_cost' => $hasCosts ? 0.0 : null];
    $campaignOutput = [];
    foreach ($campaigns as $row) {
        foreach (['spend','placed_orders','ordered_revenue','confirmed_revenue','delivered_orders','delivered_revenue','return_cancel_orders','return_cancel_value'] as $field) $summary[$field] += $row[$field];
        if ($hasCollections) $summary['collected_revenue'] += $row['collected_revenue'] ?? 0;
        if ($hasCosts) $summary['direct_cost'] += $row['direct_cost'] ?? 0;
        $row['ordered_roas'] = $row['spend'] > 0 ? round($row['ordered_revenue'] / $row['spend'], 2) : null;
        $row['delivered_roas'] = $row['spend'] > 0 ? round($row['delivered_revenue'] / $row['spend'], 2) : null;
        $row['contribution_after_ads'] = $row['direct_cost'] === null ? null : round($row['delivered_revenue'] - $row['direct_cost'] - $row['spend'], 2);
        $campaignOutput[] = $row;
    }
    usort($campaignOutput, static fn (array $a, array $b): int => ($b['spend'] <=> $a['spend']) ?: ($b['delivered_revenue'] <=> $a['delivered_revenue']));
    $summary['ordered_roas'] = $summary['spend'] > 0 ? round($summary['ordered_revenue'] / $summary['spend'], 2) : null;
    $summary['delivered_roas'] = $summary['spend'] > 0 ? round($summary['delivered_revenue'] / $summary['spend'], 2) : null;
    $summary['contribution_after_ads'] = $summary['direct_cost'] === null ? null : round($summary['delivered_revenue'] - $summary['direct_cost'] - $summary['spend'], 2);

    $orderDailySql = "SELECT DATE(o.created_at) AS day,
        COUNT(*) AS placed_orders,
        SUM(CASE WHEN o.status NOT IN ('cancelled','returned') THEN o.total_amount ELSE 0 END) AS ordered_revenue,
        SUM(CASE WHEN o.status = 'delivered' THEN o.total_amount ELSE 0 END) AS delivered_revenue,
        SUM(CASE WHEN o.status IN ('cancelled','returned') THEN 1 ELSE 0 END) AS return_cancel_orders
        FROM orders o WHERE DATE(o.created_at) BETWEEN :date_from AND :date_to GROUP BY DATE(o.created_at)";
    $dailyStatement = $pdo->prepare($orderDailySql); $dailyStatement->execute([':date_from' => $from, ':date_to' => $to]);
    $daily = [];
    foreach (($dailyStatement->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) $daily[(string) $row['day']] = [
        'day' => (string) $row['day'], 'spend' => 0.0, 'placed_orders' => (int) $row['placed_orders'],
        'ordered_revenue' => (float) $row['ordered_revenue'], 'delivered_revenue' => (float) $row['delivered_revenue'],
        'return_cancel_orders' => (int) $row['return_cancel_orders']];
    $spendDaily = $pdo->prepare('SELECT spend_date AS day, SUM(spend_amount) AS spend FROM marketing_spend WHERE spend_date BETWEEN :date_from AND :date_to GROUP BY spend_date');
    $spendDaily->execute([':date_from' => $from, ':date_to' => $to]);
    foreach (($spendDaily->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) {
        $day = (string) $row['day'];
        if (!isset($daily[$day])) $daily[$day] = ['day' => $day, 'spend' => 0.0, 'placed_orders' => 0, 'ordered_revenue' => 0.0, 'delivered_revenue' => 0.0, 'return_cancel_orders' => 0];
        $daily[$day]['spend'] = (float) $row['spend'];
    }
    ksort($daily);

    $ledger = $pdo->prepare('SELECT id, spend_date, platform, campaign_id, campaign_name, spend_amount, currency, source, note, created_at, updated_at FROM marketing_spend WHERE spend_date BETWEEN :date_from AND :date_to ORDER BY spend_date DESC, id DESC LIMIT 250');
    $ledger->execute([':date_from' => $from, ':date_to' => $to]);

    $attributedOrders = 0;
    foreach ($orderRows as $row) if ($row['platform'] !== 'Unattributed' || $row['campaign'] !== 'Unattributed') $attributedOrders += (int) $row['placed_orders'];
    return [
        'range' => ['from' => $from, 'to' => $to], 'summary' => $summary, 'campaigns' => $campaignOutput,
        'daily' => array_values($daily), 'spend_entries' => $ledger->fetchAll(PDO::FETCH_ASSOC) ?: [],
        'quality' => [
            'has_attribution_table' => $hasAttribution, 'has_cost_table' => $hasCosts,
            'has_collection_table' => $hasCollections, 'attributed_orders' => $attributedOrders,
            'unattributed_orders' => max(0, (int) $summary['placed_orders'] - $attributedOrders),
            'collection_basis' => $hasCollections ? 'Settled or collected COD reconciliation records' : 'Unavailable until COD reconciliation is installed',
            'profit_basis' => $hasCosts ? 'Delivered order value minus recorded direct order costs and ad spend' : 'Unavailable until order financial costs are recorded',
            'order_date_basis' => 'Orders are grouped by order creation date; delivered value is cohort-based.',
        ],
        'generated_at' => date(DATE_ATOM),
    ];
}

try {
    $pdo = getDatabaseConnection();
    ensureMarketingPerformanceTables($pdo);
    $today = date('Y-m-d');
    $from = marketingDate($_GET['date_from'] ?? '', date('Y-m-d', strtotime('-29 days')));
    $to = marketingDate($_GET['date_to'] ?? '', $today);
    if ($from > $to) marketingJson(422, ['success' => false, 'message' => 'Start date cannot be after end date.']);
    if ((new DateTimeImmutable($from))->diff(new DateTimeImmutable($to))->days > 366) marketingJson(422, ['success' => false, 'message' => 'Choose a range of 366 days or fewer.']);

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'GET') marketingJson(200, array_merge(['success' => true], readMarketingPerformance($pdo, $from, $to)));
    if ($method !== 'POST') marketingJson(405, ['success' => false, 'message' => 'Method not allowed.']);

    $payload = marketingPayload();
    $action = strtolower(marketingText($payload['action'] ?? 'save_spend', 40));
    if ($action === 'save_spend') {
        $date = marketingDate($payload['spend_date'] ?? '', '');
        $platform = marketingText($payload['platform'] ?? '', 50);
        $campaign = marketingText($payload['campaign_name'] ?? '', 191);
        $campaignId = marketingText($payload['campaign_id'] ?? '', 191);
        $amount = marketingNumber($payload['spend_amount'] ?? 0);
        $note = marketingText($payload['note'] ?? '', 1000);
        if ($date === '' || $platform === '' || $campaign === '') marketingJson(422, ['success' => false, 'message' => 'Spend date, platform and campaign name are required.']);
        if ($amount > 100000000) marketingJson(422, ['success' => false, 'message' => 'Spend amount is outside the allowed range.']);
        $pdo->beginTransaction();
        $beforeQuery = $pdo->prepare('SELECT * FROM marketing_spend WHERE spend_date=:spend_date AND platform=:platform AND campaign_name=:campaign_name AND campaign_id=:campaign_id LIMIT 1 FOR UPDATE');
        $params = [':spend_date' => $date, ':platform' => $platform, ':campaign_name' => $campaign, ':campaign_id' => $campaignId];
        $beforeQuery->execute($params); $before = $beforeQuery->fetch(PDO::FETCH_ASSOC) ?: null;
        $save = $pdo->prepare("INSERT INTO marketing_spend (spend_date,platform,campaign_id,campaign_name,spend_amount,currency,source,note) VALUES (:spend_date,:platform,:campaign_id,:campaign_name,:spend_amount,'BDT','manual',:note) ON DUPLICATE KEY UPDATE spend_amount=VALUES(spend_amount), note=VALUES(note), source='manual'");
        $save->execute([...$params, ':spend_amount' => $amount, ':note' => $note]);
        $idQuery = $pdo->prepare('SELECT * FROM marketing_spend WHERE spend_date=:spend_date AND platform=:platform AND campaign_name=:campaign_name AND campaign_id=:campaign_id LIMIT 1');
        $idQuery->execute($params); $after = $idQuery->fetch(PDO::FETCH_ASSOC) ?: [];
        $audit = $pdo->prepare("INSERT INTO marketing_spend_audit (spend_id,action,before_json,after_json,reason,actor) VALUES (:id,:action,:before_json,:after_json,:reason,'admin')");
        $audit->execute([':id' => $after['id'] ?? null, ':action' => $before ? 'update' : 'create', ':before_json' => $before ? json_encode($before) : null, ':after_json' => json_encode($after), ':reason' => $note]);
        $pdo->commit();
        marketingJson(200, array_merge(['success' => true, 'message' => 'Marketing spend saved with an audit record.'], readMarketingPerformance($pdo, $from, $to)));
    }
    if ($action === 'void_spend') {
        $id = max(0, (int) ($payload['id'] ?? 0));
        $reason = marketingText($payload['reason'] ?? '', 500);
        if ($id === 0 || $reason === '') marketingJson(422, ['success' => false, 'message' => 'A spend record and correction reason are required.']);
        $pdo->beginTransaction();
        $find = $pdo->prepare('SELECT * FROM marketing_spend WHERE id=:id LIMIT 1 FOR UPDATE'); $find->execute([':id' => $id]); $before = $find->fetch(PDO::FETCH_ASSOC);
        if (!$before) { $pdo->rollBack(); marketingJson(404, ['success' => false, 'message' => 'Spend record not found.']); }
        $update = $pdo->prepare("UPDATE marketing_spend SET spend_amount=0, source='manual', note=:note WHERE id=:id"); $update->execute([':note' => 'VOID: ' . $reason, ':id' => $id]);
        $find->execute([':id' => $id]); $after = $find->fetch(PDO::FETCH_ASSOC) ?: [];
        $audit = $pdo->prepare("INSERT INTO marketing_spend_audit (spend_id,action,before_json,after_json,reason,actor) VALUES (:id,'void',:before_json,:after_json,:reason,'admin')");
        $audit->execute([':id' => $id, ':before_json' => json_encode($before), ':after_json' => json_encode($after), ':reason' => $reason]);
        $pdo->commit();
        marketingJson(200, array_merge(['success' => true, 'message' => 'Spend record corrected to zero; history was retained.'], readMarketingPerformance($pdo, $from, $to)));
    }
    marketingJson(400, ['success' => false, 'message' => 'Unknown action.']);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('Marketing performance API error: ' . $error->getMessage());
    marketingJson(500, ['success' => false, 'message' => 'Marketing performance data could not be loaded.']);
}
