<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/offers_deals_common.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['https://brandnbeauty.com', 'https://www.brandnbeauty.com', 'https://admin.brandnbeauty.com'];
$localOrigin = preg_match('/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/', $origin) === 1;
if ($localOrigin || in_array($origin, $allowedOrigins, true)) { header('Access-Control-Allow-Origin: ' . $origin); header('Vary: Origin'); }
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }
requireAdminAuth();

function offersDealsJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function offersDealsDateValue(mixed $value): ?string
{
    $text = offersDealsText($value, 40);
    if ($text === '') return null;
    $timestamp = strtotime($text);
    if ($timestamp === false) throw new InvalidArgumentException('Choose a valid offer schedule.');
    return date('Y-m-d H:i:s', $timestamp);
}

function offersDealsOptionalPositiveInt(mixed $value): ?int
{
    if ($value === null || $value === '') return null;
    $number = (int) $value;
    if ($number < 1 || $number > 1000000000) throw new InvalidArgumentException('Usage limits must be positive whole numbers.');
    return $number;
}

function offersDealsProductIds(PDO $pdo, mixed $value): array
{
    if (!is_array($value)) return [];
    $available = offersDealsProductMap($pdo);
    $ids = [];
    foreach ($value as $candidate) {
        $id = (string) max(0, (int) $candidate);
        if ($id === '0' || isset($ids[$id])) continue;
        if (!isset($available[$id])) throw new InvalidArgumentException('One linked product no longer exists in the live catalog.');
        $ids[$id] = true;
    }
    return array_keys($ids);
}

function offersDealsRawRecord(PDO $pdo, int $id, bool $lock = false): ?array
{
    $statement = $pdo->prepare('SELECT * FROM storefront_offers WHERE id=:id LIMIT 1' . ($lock ? ' FOR UPDATE' : ''));
    $statement->execute([':id' => $id]);
    $row = $statement->fetch(PDO::FETCH_ASSOC);
    if (!$row) return null;
    $products = $pdo->prepare('SELECT product_id FROM storefront_offer_products WHERE offer_id=:id ORDER BY product_id');
    $products->execute([':id' => $id]);
    $row['product_ids'] = array_map('strval', $products->fetchAll(PDO::FETCH_COLUMN) ?: []);
    return $row;
}

try {
    $pdo = getDatabaseConnection();
    ensureOffersDealsSchema($pdo);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'GET') offersDealsJson(200, array_merge(['success' => true, 'module' => 'offers-deals'], offersDealsState($pdo)));
    if ($method !== 'POST') offersDealsJson(405, ['success' => false, 'message' => 'Method not allowed.']);
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($payload)) offersDealsJson(422, ['success' => false, 'message' => 'A valid offer action is required.']);
    if (($payload['confirmed'] ?? false) !== true) offersDealsJson(422, ['success' => false, 'message' => 'Human confirmation is required before an offer record changes.']);
    $action = strtolower(offersDealsText($payload['action'] ?? '', 60));

    if ($action === 'save_draft') {
        $id = max(0, (int) ($payload['id'] ?? 0));
        $name = offersDealsText($payload['name'] ?? '', 191);
        $code = strtoupper(offersDealsText($payload['code'] ?? '', 80));
        $code = preg_replace('/[^A-Z0-9_-]/', '', $code) ?: '';
        $type = strtolower(offersDealsText($payload['offer_type'] ?? 'percentage', 40));
        $value = round(max(0, (float) ($payload['discount_value'] ?? 0)), 2);
        $minimumOrder = round(max(0, (float) ($payload['minimum_order'] ?? 0)), 2);
        $maximumDiscount = ($payload['maximum_discount'] ?? null) === null || $payload['maximum_discount'] === '' ? null : round(max(0, (float) $payload['maximum_discount']), 2);
        $eligibility = offersDealsText($payload['eligibility_summary'] ?? '', 1000);
        $usageLimit = offersDealsOptionalPositiveInt($payload['usage_limit'] ?? null);
        $perCustomerLimit = offersDealsOptionalPositiveInt($payload['per_customer_limit'] ?? null);
        $stackable = (bool) ($payload['stackable'] ?? false);
        $startsAt = offersDealsDateValue($payload['starts_at'] ?? null);
        $endsAt = offersDealsDateValue($payload['ends_at'] ?? null);
        $channels = offersDealsStringList($payload['channels'] ?? [], ['website', 'admin', 'messenger', 'facebook']);
        $homepageEligible = (bool) ($payload['homepage_eligible'] ?? false);
        $notes = offersDealsText($payload['notes'] ?? '', 2000);
        $productIds = offersDealsProductIds($pdo, $payload['product_ids'] ?? []);
        if ($name === '' || $eligibility === '' || !$channels) offersDealsJson(422, ['success' => false, 'message' => 'Campaign name, eligibility and at least one channel are required.']);
        if (!in_array($type, ['percentage', 'fixed_amount', 'free_shipping'], true)) offersDealsJson(422, ['success' => false, 'message' => 'Choose a supported discount type.']);
        if ($type !== 'free_shipping' && ($value <= 0 || ($type === 'percentage' && $value > 100))) offersDealsJson(422, ['success' => false, 'message' => 'Choose a valid discount value.']);
        if ($startsAt !== null && $endsAt !== null && strtotime($endsAt) <= strtotime($startsAt)) offersDealsJson(422, ['success' => false, 'message' => 'End time must be later than start time.']);
        if ($code !== '') {
            $duplicate = $pdo->prepare('SELECT id FROM storefront_offers WHERE code=:code AND id<>:id LIMIT 1');
            $duplicate->execute([':code' => $code, ':id' => $id]);
            if ($duplicate->fetchColumn()) offersDealsJson(409, ['success' => false, 'message' => 'This offer code is already used by another campaign.']);
        }

        $pdo->beginTransaction();
        $before = $id > 0 ? offersDealsRawRecord($pdo, $id, true) : null;
        if ($id > 0 && !$before) { $pdo->rollBack(); offersDealsJson(404, ['success' => false, 'message' => 'The selected offer was not found.']); }
        if ($before && in_array(strtolower((string) ($before['status'] ?? 'draft')), ['active', 'ended', 'archived'], true)) { $pdo->rollBack(); offersDealsJson(409, ['success' => false, 'message' => 'Pause an active offer before editing. Ended or archived offers cannot be rewritten.']); }
        $parameters = [
            ':name' => $name, ':code' => $code === '' ? null : $code, ':offer_type' => $type, ':discount_value' => $type === 'free_shipping' ? 0 : $value,
            ':minimum_order' => $minimumOrder, ':maximum_discount' => $maximumDiscount, ':eligibility_summary' => $eligibility,
            ':usage_limit' => $usageLimit, ':per_customer_limit' => $perCustomerLimit, ':stackable' => $stackable ? 1 : 0,
            ':starts_at' => $startsAt, ':ends_at' => $endsAt, ':channels' => json_encode($channels, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            ':homepage_eligible' => $homepageEligible ? 1 : 0, ':notes' => $notes === '' ? null : $notes,
        ];
        if ($id === 0) {
            $insert = $pdo->prepare("INSERT INTO storefront_offers (name,code,offer_type,discount_value,minimum_order,maximum_discount,eligibility_summary,usage_limit,per_customer_limit,stackable,starts_at,ends_at,channels,homepage_eligible,status,notes) VALUES (:name,:code,:offer_type,:discount_value,:minimum_order,:maximum_discount,:eligibility_summary,:usage_limit,:per_customer_limit,:stackable,:starts_at,:ends_at,:channels,:homepage_eligible,'draft',:notes)");
            $insert->execute($parameters);
            $id = (int) $pdo->lastInsertId();
        } else {
            $parameters[':id'] = $id;
            $update = $pdo->prepare("UPDATE storefront_offers SET name=:name,code=:code,offer_type=:offer_type,discount_value=:discount_value,minimum_order=:minimum_order,maximum_discount=:maximum_discount,eligibility_summary=:eligibility_summary,usage_limit=:usage_limit,per_customer_limit=:per_customer_limit,stackable=:stackable,starts_at=:starts_at,ends_at=:ends_at,channels=:channels,homepage_eligible=:homepage_eligible,status='draft',notes=:notes WHERE id=:id");
            $update->execute($parameters);
        }
        $pdo->prepare('DELETE FROM storefront_offer_products WHERE offer_id=:id')->execute([':id' => $id]);
        if ($productIds) {
            $link = $pdo->prepare('INSERT INTO storefront_offer_products (offer_id,product_id) VALUES (:offer_id,:product_id)');
            foreach ($productIds as $productId) $link->execute([':offer_id' => $id, ':product_id' => (int) $productId]);
        }
        $after = offersDealsRawRecord($pdo, $id) ?? [];
        offersDealsEvent($pdo, $id, $before ? 'update_draft' : 'create_draft', $before, $after, $notes !== '' ? $notes : 'Offer draft saved by a human administrator.');
        $pdo->commit();
        offersDealsJson(200, array_merge(['success' => true, 'module' => 'offers-deals', 'message' => 'Offer draft saved. No checkout or customer record changed.'], offersDealsState($pdo)));
    }

    if (!in_array($action, ['publish', 'pause', 'end', 'archive'], true)) offersDealsJson(422, ['success' => false, 'message' => 'The offer action is not supported.']);
    $id = max(0, (int) ($payload['id'] ?? 0));
    $reason = offersDealsText($payload['reason'] ?? '', 1000);
    if ($id === 0 || $reason === '') offersDealsJson(422, ['success' => false, 'message' => 'Select an offer and write an audit reason.']);
    $pdo->beginTransaction();
    $before = offersDealsRawRecord($pdo, $id, true);
    if (!$before) { $pdo->rollBack(); offersDealsJson(404, ['success' => false, 'message' => 'The selected offer was not found.']); }
    $current = strtolower((string) ($before['status'] ?? 'draft'));
    if ($action === 'publish') {
        if (!in_array($current, ['draft', 'paused'], true)) { $pdo->rollBack(); offersDealsJson(409, ['success' => false, 'message' => 'Only a draft or paused offer can be published.']); }
        $readiness = offersDealsReadiness($before, $before['product_ids'] ?? []);
        if (!($readiness['ready'] ?? false)) { $pdo->rollBack(); offersDealsJson(422, ['success' => false, 'message' => 'Resolve publication blockers first.', 'blockers' => $readiness['blockers'] ?? []]); }
        $update = $pdo->prepare("UPDATE storefront_offers SET status='active',published_at=NOW() WHERE id=:id");
    } elseif ($action === 'pause') {
        if ($current !== 'active') { $pdo->rollBack(); offersDealsJson(409, ['success' => false, 'message' => 'Only an active offer can be paused.']); }
        $update = $pdo->prepare("UPDATE storefront_offers SET status='paused' WHERE id=:id");
    } elseif ($action === 'end') {
        if (!in_array($current, ['active', 'paused'], true)) { $pdo->rollBack(); offersDealsJson(409, ['success' => false, 'message' => 'Only an active or paused offer can be ended.']); }
        $update = $pdo->prepare("UPDATE storefront_offers SET status='ended',ends_at=COALESCE(ends_at,NOW()) WHERE id=:id");
    } else {
        if ($current === 'active') { $pdo->rollBack(); offersDealsJson(409, ['success' => false, 'message' => 'Pause or end an active offer before archiving.']); }
        $update = $pdo->prepare("UPDATE storefront_offers SET status='archived',homepage_eligible=0 WHERE id=:id");
    }
    $update->execute([':id' => $id]);
    $after = offersDealsRawRecord($pdo, $id) ?? [];
    offersDealsEvent($pdo, $id, $action, $before, $after, $reason);
    $pdo->commit();
    $messages = ['publish' => 'Offer published to the controlled storefront feed.', 'pause' => 'Offer paused and removed from the public feed.', 'end' => 'Offer ended with history preserved.', 'archive' => 'Offer archived with evidence preserved.'];
    offersDealsJson(200, array_merge(['success' => true, 'module' => 'offers-deals', 'message' => $messages[$action]], offersDealsState($pdo)));
} catch (InvalidArgumentException $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    offersDealsJson(422, ['success' => false, 'module' => 'offers-deals', 'message' => $error->getMessage()]);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('manage_offers_deals.php: ' . $error->getMessage());
    offersDealsJson(500, ['success' => false, 'module' => 'offers-deals', 'message' => 'Offers & Deals is temporarily unavailable.']);
}
