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

function retentionJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function retentionText(mixed $value, int $limit = 1000): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function retentionPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function retentionTableExists(PDO $pdo, string $table): bool
{
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table' => $table]);
    return (int) $query->fetchColumn() > 0;
}

function retentionColumns(PDO $pdo, string $table): array
{
    if (!retentionTableExists($pdo, $table)) return [];
    $query = $pdo->prepare('SELECT LOWER(column_name) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table' => $table]);
    return $query->fetchAll(PDO::FETCH_COLUMN) ?: [];
}

function retentionColumn(array $columns, array $candidates): ?string
{
    foreach ($candidates as $candidate) if (in_array($candidate, $columns, true)) return $candidate;
    return null;
}

function retentionDate(mixed $value, string $fallback): string
{
    $date = retentionText($value, 10);
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
    return $parsed && $parsed->format('Y-m-d') === $date ? $date : $fallback;
}

function retentionNumber(mixed $value): float
{
    return is_numeric($value) ? max(0.0, (float) $value) : 0.0;
}

function retentionNormalizePhone(mixed $value): string
{
    $digits = preg_replace('/\D+/', '', retentionText($value, 80)) ?? '';
    if (preg_match('/^8801\d{9}$/', $digits) === 1) return '0' . substr($digits, 3);
    return $digits;
}

function retentionIdentity(array $row): array
{
    $customerId = retentionText($row['customer_id'] ?? '', 190);
    if ($customerId !== '' && $customerId !== '0') return ['key' => hash('sha256', 'customer:' . $customerId), 'basis' => 'customer_id'];
    $phone = retentionNormalizePhone($row['customer_phone'] ?? '');
    if (strlen($phone) >= 7) return ['key' => hash('sha256', 'phone:' . $phone), 'basis' => 'normalized_phone'];
    $email = strtolower(retentionText($row['customer_email'] ?? '', 320));
    if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) return ['key' => hash('sha256', 'email:' . $email), 'basis' => 'normalized_email'];
    return ['key' => '', 'basis' => 'unavailable'];
}

function ensureRetentionTables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS retention_controls (
        id TINYINT UNSIGNED NOT NULL, vip_min_orders SMALLINT UNSIGNED NOT NULL DEFAULT 4,
        churn_days SMALLINT UNSIGNED NOT NULL DEFAULT 120,
        second_order_due_days SMALLINT UNSIGNED NOT NULL DEFAULT 45,
        updated_by VARCHAR(190) NOT NULL DEFAULT 'admin',
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec('INSERT IGNORE INTO retention_controls (id) VALUES (1)');

    $pdo->exec("CREATE TABLE IF NOT EXISTS retention_control_versions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, controls_json LONGTEXT NOT NULL,
        reason VARCHAR(1000) NOT NULL, created_by VARCHAR(190) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS retention_action_plans (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, segment_key VARCHAR(80) NOT NULL,
        objective VARCHAR(300) NOT NULL, channel VARCHAR(100) NOT NULL,
        margin_floor DECIMAL(6,2) NOT NULL DEFAULT 0, note TEXT NOT NULL,
        status ENUM('draft','approved','rejected','archived') NOT NULL DEFAULT 'draft',
        review_note TEXT NULL, created_by VARCHAR(190) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        reviewed_at DATETIME NULL, PRIMARY KEY (id),
        KEY idx_retention_plan_status (status,created_at),
        KEY idx_retention_plan_segment (segment_key,status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function retentionOrderRows(PDO $pdo, string $to): array
{
    if (!retentionTableExists($pdo, 'orders')) return ['rows' => [], 'mapping' => []];
    $columns = retentionColumns($pdo, 'orders');
    $status = retentionColumn($columns, ['status', 'order_status']);
    $amount = retentionColumn($columns, ['total_amount', 'total', 'grand_total', 'due_amount']);
    $created = retentionColumn($columns, ['created_at', 'order_date', 'created_on']);
    if ($status === null || $amount === null || $created === null) throw new RuntimeException('Orders table is missing status, amount or creation date required for retention analytics.');
    $deliveredAt = retentionColumn($columns, ['delivered_at']);
    $customerId = retentionColumn($columns, ['customer_id']);
    $phone = retentionColumn($columns, ['customer_phone', 'phone', 'billing_phone']);
    $email = retentionColumn($columns, ['customer_email', 'email', 'billing_email']);
    $select = ["`{$status}` AS order_status", "`{$amount}` AS order_amount", "`{$created}` AS order_created_at"];
    $select[] = $deliveredAt ? "`{$deliveredAt}` AS order_delivered_at" : 'NULL AS order_delivered_at';
    $select[] = $customerId ? "`{$customerId}` AS customer_id" : "'' AS customer_id";
    $select[] = $phone ? "`{$phone}` AS customer_phone" : "'' AS customer_phone";
    $select[] = $email ? "`{$email}` AS customer_email" : "'' AS customer_email";
    $query = $pdo->prepare('SELECT ' . implode(',', $select) . " FROM orders WHERE DATE(`{$created}`) <= :date_to ORDER BY `{$created}` ASC");
    $query->execute([':date_to' => $to]);
    $identityBasis = [];
    if ($customerId) $identityBasis[] = 'customer ID';
    if ($phone) $identityBasis[] = 'normalized phone';
    if ($email) $identityBasis[] = 'normalized email';
    return ['rows' => $query->fetchAll(PDO::FETCH_ASSOC) ?: [], 'mapping' => ['identity' => $identityBasis, 'status' => $status, 'amount' => $amount, 'created' => $created, 'delivered_at' => $deliveredAt]];
}

function retentionDayDiff(string $from, string $to): int
{
    try { return max(0, (int) (new DateTimeImmutable(substr($from, 0, 10)))->diff(new DateTimeImmutable(substr($to, 0, 10)))->format('%a')); }
    catch (Throwable) { return 0; }
}

function readRetentionAnalytics(PDO $pdo, string $from, string $to, array $controls): array
{
    $source = retentionOrderRows($pdo, $to);
    $customers = []; $basisCounts = []; $missingIdentity = 0;
    $periodOrders = 0; $periodRevenue = 0.0; $periodCustomerKeys = [];
    foreach ($source['rows'] as $row) {
        $status = strtolower(trim((string) ($row['order_status'] ?? '')));
        if ($status !== 'delivered') continue;
        $eventDate = retentionText($row['order_delivered_at'] ?? '', 30);
        if ($eventDate === '') $eventDate = retentionText($row['order_created_at'] ?? '', 30);
        if ($eventDate === '') continue;
        $date = substr($eventDate, 0, 10);
        if ($date > $to) continue;
        $amount = retentionNumber($row['order_amount'] ?? 0);
        $identity = retentionIdentity($row);
        if ($date >= $from && $date <= $to) { $periodOrders++; $periodRevenue += $amount; }
        if ($identity['key'] === '') { $missingIdentity++; continue; }
        $key = $identity['key']; $basisCounts[$identity['basis']] = ($basisCounts[$identity['basis']] ?? 0) + 1;
        if (!isset($customers[$key])) $customers[$key] = ['deliveries' => [], 'revenue' => 0.0, 'period_orders' => 0, 'period_revenue' => 0.0];
        $customers[$key]['deliveries'][] = ['date' => $date, 'amount' => $amount];
        $customers[$key]['revenue'] += $amount;
        if ($date >= $from && $date <= $to) { $customers[$key]['period_orders']++; $customers[$key]['period_revenue'] += $amount; $periodCustomerKeys[$key] = true; }
    }

    $segmentMeta = [
        'new_first_time' => ['name' => 'New first-time delivered', 'definition' => 'One delivered order and still inside the second-order due window.'],
        'second_order_due' => ['name' => 'Second order due', 'definition' => 'One delivered order and past the configured second-order due window.'],
        'repeat_growers' => ['name' => 'Repeat growers', 'definition' => 'Two or more delivered orders but below the VIP threshold.'],
        'vip' => ['name' => 'VIP delivered customers', 'definition' => 'At or above the configured delivered-order VIP threshold.'],
        'churn_risk' => ['name' => 'Repeat churn risk', 'definition' => 'Repeat customer inactive beyond the configured churn-risk window.'],
    ];
    $segments = [];
    foreach ($segmentMeta as $key => $meta) $segments[$key] = array_merge(['key' => $key, 'customers' => 0, 'orders' => 0, 'revenue' => 0.0, 'aov' => 0.0], $meta);
    $cohorts = []; $intervalBuckets = [
        '0_30' => ['key' => '0_30', 'label' => '0–30 days', 'interval_count' => 0, 'customers' => []],
        '31_60' => ['key' => '31_60', 'label' => '31–60 days', 'interval_count' => 0, 'customers' => []],
        '61_90' => ['key' => '61_90', 'label' => '61–90 days', 'interval_count' => 0, 'customers' => []],
        '91_plus' => ['key' => '91_plus', 'label' => '91+ days', 'interval_count' => 0, 'customers' => []],
    ];
    $deliveredOrders = 0; $deliveredRevenue = 0.0; $repeatCustomers = 0;
    foreach ($customers as $key => $customer) {
        usort($customer['deliveries'], fn(array $a, array $b): int => strcmp($a['date'], $b['date']));
        $count = count($customer['deliveries']); $revenue = (float) $customer['revenue'];
        $deliveredOrders += $count; $deliveredRevenue += $revenue; if ($count >= 2) $repeatCustomers++;
        $first = $customer['deliveries'][0]['date']; $last = $customer['deliveries'][$count - 1]['date']; $inactive = retentionDayDiff($last, $to);
        if ($count >= 2 && $inactive >= (int) $controls['churn_days']) $segmentKey = 'churn_risk';
        elseif ($count >= (int) $controls['vip_min_orders']) $segmentKey = 'vip';
        elseif ($count >= 2) $segmentKey = 'repeat_growers';
        elseif ($inactive >= (int) $controls['second_order_due_days']) $segmentKey = 'second_order_due';
        else $segmentKey = 'new_first_time';
        $segments[$segmentKey]['customers']++; $segments[$segmentKey]['orders'] += $count; $segments[$segmentKey]['revenue'] += $revenue;
        $cohortKey = substr($first, 0, 7);
        if (!isset($cohorts[$cohortKey])) $cohorts[$cohortKey] = ['cohort' => $cohortKey, 'customers' => 0, 'repeat_customers' => 0, 'orders' => 0, 'revenue' => 0.0, 'repeat_rate' => 0.0];
        $cohorts[$cohortKey]['customers']++; $cohorts[$cohortKey]['orders'] += $count; $cohorts[$cohortKey]['revenue'] += $revenue; if ($count >= 2) $cohorts[$cohortKey]['repeat_customers']++;
        for ($index = 1; $index < $count; $index++) {
            $days = retentionDayDiff($customer['deliveries'][$index - 1]['date'], $customer['deliveries'][$index]['date']);
            $bucket = $days <= 30 ? '0_30' : ($days <= 60 ? '31_60' : ($days <= 90 ? '61_90' : '91_plus'));
            $intervalBuckets[$bucket]['interval_count']++; $intervalBuckets[$bucket]['customers'][$key] = true;
        }
    }
    foreach ($segments as &$segment) $segment['aov'] = $segment['orders'] > 0 ? round($segment['revenue'] / $segment['orders'], 2) : 0.0;
    unset($segment);
    foreach ($cohorts as &$cohort) $cohort['repeat_rate'] = $cohort['customers'] > 0 ? round($cohort['repeat_customers'] * 100 / $cohort['customers'], 2) : 0.0;
    unset($cohort); krsort($cohorts);
    $intervalTotal = array_sum(array_column($intervalBuckets, 'interval_count')); $intervals = [];
    foreach ($intervalBuckets as $bucket) $intervals[] = ['key' => $bucket['key'], 'label' => $bucket['label'], 'interval_count' => $bucket['interval_count'], 'customer_count' => count($bucket['customers']), 'share' => $intervalTotal > 0 ? round($bucket['interval_count'] * 100 / $intervalTotal, 2) : 0.0];
    arsort($basisCounts); $basis = array_keys($basisCounts);
    $identifiedCustomers = count($customers);
    return [
        'summary' => ['period_orders' => $periodOrders, 'period_revenue' => round($periodRevenue, 2), 'period_aov' => $periodOrders > 0 ? round($periodRevenue / $periodOrders, 2) : 0.0, 'period_customers' => count($periodCustomerKeys), 'delivered_customers' => $identifiedCustomers, 'delivered_orders' => $deliveredOrders, 'delivered_revenue' => round($deliveredRevenue, 2), 'observed_clv' => $identifiedCustomers > 0 ? round($deliveredRevenue / $identifiedCustomers, 2) : 0.0, 'repeat_customers' => $repeatCustomers, 'repeat_rate' => $identifiedCustomers > 0 ? round($repeatCustomers * 100 / $identifiedCustomers, 2) : 0.0],
        'segments' => array_values($segments), 'cohorts' => array_slice(array_values($cohorts), 0, 24), 'reorder_intervals' => $intervals,
        'quality' => ['identity_basis' => $basis ? implode(' + ', array_map(fn(string $item): string => str_replace('_', ' ', $item), $basis)) : (($source['mapping']['identity'] ?? []) ? implode(' + ', $source['mapping']['identity']) : 'Not available'), 'orders_without_stable_identity' => $missingIdentity, 'delivered_status' => 'orders.status = delivered', 'revenue_basis' => 'Delivered order total from MySQL', 'privacy_boundary' => 'Customer IDs, phone numbers and emails are hashed server-side for grouping and never returned by this API.'],
    ];
}

function readRetentionState(PDO $pdo, string $from, string $to): array
{
    $controls = $pdo->query('SELECT * FROM retention_controls WHERE id=1')->fetch(PDO::FETCH_ASSOC) ?: ['vip_min_orders' => 4, 'churn_days' => 120, 'second_order_due_days' => 45];
    $analytics = readRetentionAnalytics($pdo, $from, $to, $controls);
    $plans = $pdo->query("SELECT id,segment_key,objective,channel,margin_floor,note,status,review_note,created_at,reviewed_at FROM retention_action_plans ORDER BY FIELD(status,'draft','approved','rejected','archived'),id DESC LIMIT 200")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    return array_merge(['range' => ['from' => $from, 'to' => $to], 'controls' => $controls, 'plans' => $plans, 'generated_at' => date(DATE_ATOM)], $analytics);
}

try {
    $pdo = getDatabaseConnection(); ensureRetentionTables($pdo);
    $from = retentionDate($_GET['date_from'] ?? '', date('Y-m-d', strtotime('-89 days')));
    $to = retentionDate($_GET['date_to'] ?? '', date('Y-m-d'));
    if ($from > $to) retentionJson(422, ['success' => false, 'message' => 'Start date cannot be after end date.']);
    if ((new DateTimeImmutable($from))->diff(new DateTimeImmutable($to))->days > 366) retentionJson(422, ['success' => false, 'message' => 'Choose a range of 366 days or fewer.']);
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') retentionJson(200, array_merge(['success' => true], readRetentionState($pdo, $from, $to)));
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') retentionJson(405, ['success' => false, 'message' => 'Method not allowed.']);
    $payload = retentionPayload(); $action = strtolower(retentionText($payload['action'] ?? '', 60));
    if ($action === 'save_controls') {
        $vip = (int) ($payload['vip_min_orders'] ?? 0); $churn = (int) ($payload['churn_days'] ?? 0); $due = (int) ($payload['second_order_due_days'] ?? 0); $reason = retentionText($payload['reason'] ?? '', 1000);
        if ($vip < 2 || $vip > 50 || $churn < 30 || $churn > 730 || $due < 7 || $due > 365 || $reason === '') retentionJson(422, ['success' => false, 'message' => 'Valid segmentation controls and a change reason are required.']);
        $values = ['vip_min_orders' => $vip, 'churn_days' => $churn, 'second_order_due_days' => $due];
        $pdo->beginTransaction();
        $save = $pdo->prepare('UPDATE retention_controls SET vip_min_orders=:vip_min_orders,churn_days=:churn_days,second_order_due_days=:second_order_due_days WHERE id=1'); $save->execute($values);
        $version = $pdo->prepare('INSERT INTO retention_control_versions (controls_json,reason) VALUES (:controls_json,:reason)'); $version->execute([':controls_json' => json_encode($values, JSON_UNESCAPED_SLASHES), ':reason' => $reason]); $pdo->commit();
        retentionJson(200, array_merge(['success' => true, 'message' => 'Retention controls saved with an audit reason. No customer was contacted.'], readRetentionState($pdo, $from, $to)));
    }
    if ($action === 'create_plan') {
        $segments = ['new_first_time','second_order_due','repeat_growers','vip','churn_risk'];
        $segment = strtolower(retentionText($payload['segment_key'] ?? '', 80)); $objective = retentionText($payload['objective'] ?? '', 300); $channel = retentionText($payload['channel'] ?? '', 100); $margin = (float) ($payload['margin_floor'] ?? -1); $note = retentionText($payload['note'] ?? '', 3000);
        if (!in_array($segment, $segments, true) || $objective === '' || $channel === '' || $note === '' || $margin < 0 || $margin > 100) retentionJson(422, ['success' => false, 'message' => 'A valid segment, objective, channel, margin floor and planning note are required.']);
        $save = $pdo->prepare('INSERT INTO retention_action_plans (segment_key,objective,channel,margin_floor,note) VALUES (:segment_key,:objective,:channel,:margin_floor,:note)');
        $save->execute([':segment_key' => $segment, ':objective' => $objective, ':channel' => $channel, ':margin_floor' => $margin, ':note' => $note]);
        retentionJson(200, array_merge(['success' => true, 'message' => 'Retention plan saved for human review. No audience, message or offer was activated.'], readRetentionState($pdo, $from, $to)));
    }
    if ($action === 'review_plan') {
        $id = (int) ($payload['id'] ?? 0); $status = strtolower(retentionText($payload['status'] ?? '', 20)); $note = retentionText($payload['review_note'] ?? '', 2000);
        if ($id < 1 || !in_array($status, ['approved','rejected'], true) || $note === '') retentionJson(422, ['success' => false, 'message' => 'A valid plan, decision and review note are required.']);
        $save = $pdo->prepare("UPDATE retention_action_plans SET status=:status,review_note=:review_note,reviewed_at=NOW() WHERE id=:id AND status='draft'"); $save->execute([':status' => $status, ':review_note' => $note, ':id' => $id]);
        if ($save->rowCount() !== 1) retentionJson(409, ['success' => false, 'message' => 'This plan is no longer awaiting review.']);
        retentionJson(200, array_merge(['success' => true, 'message' => 'Internal plan review saved. This decision did not contact customers or activate a campaign.'], readRetentionState($pdo, $from, $to)));
    }
    retentionJson(422, ['success' => false, 'message' => 'Unsupported retention action.']);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('Retention AOV CLV API error: ' . $error->getMessage());
    retentionJson(500, ['success' => false, 'message' => 'Retention data could not be processed safely.']);
}
