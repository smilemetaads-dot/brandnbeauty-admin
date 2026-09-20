<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/product_recommendations_common.php';

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

function productRecommendationsJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function productRecommendationsDateValue(mixed $value): ?string
{
    $text = productRecommendationsText($value, 40);
    if ($text === '') return null;
    $timestamp = strtotime($text);
    if ($timestamp === false) throw new InvalidArgumentException('Choose a valid recommendation schedule.');
    return date('Y-m-d H:i:s', $timestamp);
}

function productRecommendationsProductId(PDO $pdo, mixed $value, bool $required = false): ?string
{
    if ($value === null || $value === '') {
        if ($required) throw new InvalidArgumentException('Choose a real source product.');
        return null;
    }
    $id = (string) max(0, (int) $value);
    $available = productRecommendationsProductMap($pdo);
    if ($id === '0' || !isset($available[$id])) throw new InvalidArgumentException('A linked product no longer exists in the live catalog.');
    return $id;
}

function productRecommendationsTargetIds(PDO $pdo, mixed $value): array
{
    if (!is_array($value)) return [];
    $available = productRecommendationsProductMap($pdo);
    $ids = [];
    foreach ($value as $candidate) {
        $id = (string) max(0, (int) $candidate);
        if ($id === '0' || isset($ids[$id])) continue;
        if (!isset($available[$id])) throw new InvalidArgumentException('One recommended product no longer exists in the live catalog.');
        $ids[$id] = true;
    }
    return array_keys($ids);
}

function productRecommendationsRawRecord(PDO $pdo, int $id, bool $lock = false): ?array
{
    $statement = $pdo->prepare('SELECT * FROM storefront_recommendations WHERE id=:id LIMIT 1' . ($lock ? ' FOR UPDATE' : ''));
    $statement->execute([':id' => $id]);
    $row = $statement->fetch(PDO::FETCH_ASSOC);
    if (!$row) return null;
    $products = $pdo->prepare('SELECT product_id FROM storefront_recommendation_products WHERE recommendation_id=:id ORDER BY position_number,product_id');
    $products->execute([':id' => $id]);
    $row['target_product_ids'] = array_map('strval', $products->fetchAll(PDO::FETCH_COLUMN) ?: []);
    return $row;
}

function productRecommendationsReadinessForRaw(PDO $pdo, array $row): array
{
    $map = productRecommendationsProductMap($pdo);
    $sourceId = (string) ($row['source_product_id'] ?? '');
    $source = $sourceId !== '' && isset($map[$sourceId]) ? $map[$sourceId] : null;
    $targets = [];
    foreach (($row['target_product_ids'] ?? []) as $id) if (isset($map[(string) $id])) $targets[] = $map[(string) $id];
    return productRecommendationsReadiness($row, $targets, $source);
}

try {
    $pdo = getDatabaseConnection();
    ensureProductRecommendationsSchema($pdo);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'GET') productRecommendationsJson(200, array_merge(['success' => true, 'module' => 'product-recommendations'], productRecommendationsState($pdo)));
    if ($method !== 'POST') productRecommendationsJson(405, ['success' => false, 'message' => 'Method not allowed.']);
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($payload)) productRecommendationsJson(422, ['success' => false, 'message' => 'A valid recommendation action is required.']);
    if (($payload['confirmed'] ?? false) !== true) productRecommendationsJson(422, ['success' => false, 'message' => 'Human confirmation is required before a recommendation record changes.']);
    $action = strtolower(productRecommendationsText($payload['action'] ?? '', 60));

    if ($action === 'save_draft') {
        $id = max(0, (int) ($payload['id'] ?? 0));
        $name = productRecommendationsText($payload['name'] ?? '', 191);
        $strategy = strtolower(productRecommendationsText($payload['strategy'] ?? 'complete_routine', 60));
        $methodValue = strtolower(productRecommendationsText($payload['method'] ?? 'manual', 40));
        $methodValue = $methodValue === 'rule_assisted' ? 'rule_assisted' : 'manual';
        $sourceProductId = productRecommendationsProductId($pdo, $payload['source_product_id'] ?? null, false);
        $targetProductIds = productRecommendationsTargetIds($pdo, $payload['target_product_ids'] ?? []);
        $surfaces = productRecommendationsStringList($payload['surfaces'] ?? [], ['product_page', 'cart', 'homepage', 'search_no_result']);
        $fallbackMode = strtolower(productRecommendationsText($payload['fallback_mode'] ?? 'hide_block', 40)) === 'best_in_stock' ? 'best_in_stock' : 'hide_block';
        $priority = max(1, min(9999, (int) ($payload['priority'] ?? 100)));
        $startsAt = productRecommendationsDateValue($payload['starts_at'] ?? null);
        $endsAt = productRecommendationsDateValue($payload['ends_at'] ?? null);
        $notes = productRecommendationsText($payload['notes'] ?? '', 2000);
        if ($name === '' || !$targetProductIds || !$surfaces) productRecommendationsJson(422, ['success' => false, 'message' => 'Set name, recommended products and at least one surface are required.']);
        if (!in_array($strategy, ['complete_routine', 'frequently_bought_together', 'similar_alternative', 'upgrade', 'best_sellers', 'new_arrivals'], true)) productRecommendationsJson(422, ['success' => false, 'message' => 'Choose a supported recommendation strategy.']);
        if (productRecommendationsNeedsSource($strategy) && $sourceProductId === null) productRecommendationsJson(422, ['success' => false, 'message' => 'This strategy requires a real source product.']);
        if ($sourceProductId !== null && in_array($sourceProductId, $targetProductIds, true)) productRecommendationsJson(422, ['success' => false, 'message' => 'Source and target products cannot be the same.']);
        if ($startsAt !== null && $endsAt !== null && strtotime($endsAt) <= strtotime($startsAt)) productRecommendationsJson(422, ['success' => false, 'message' => 'End time must be later than start time.']);

        $pdo->beginTransaction();
        $before = $id > 0 ? productRecommendationsRawRecord($pdo, $id, true) : null;
        if ($id > 0 && !$before) { $pdo->rollBack(); productRecommendationsJson(404, ['success' => false, 'message' => 'The selected recommendation was not found.']); }
        if ($before && in_array(strtolower((string) ($before['status'] ?? 'draft')), ['active', 'archived'], true)) { $pdo->rollBack(); productRecommendationsJson(409, ['success' => false, 'message' => 'Pause an active set before editing. Archived recommendations cannot be rewritten.']); }
        $parameters = [
            ':name' => $name,
            ':strategy' => $strategy,
            ':method' => $methodValue,
            ':source_product_id' => $sourceProductId === null ? null : (int) $sourceProductId,
            ':surfaces' => json_encode($surfaces, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            ':fallback_mode' => $fallbackMode,
            ':priority' => $priority,
            ':starts_at' => $startsAt,
            ':ends_at' => $endsAt,
            ':notes' => $notes === '' ? null : $notes,
        ];
        if ($id === 0) {
            $insert = $pdo->prepare("INSERT INTO storefront_recommendations (name,strategy,method,source_product_id,surfaces,fallback_mode,priority,starts_at,ends_at,status,notes) VALUES (:name,:strategy,:method,:source_product_id,:surfaces,:fallback_mode,:priority,:starts_at,:ends_at,'draft',:notes)");
            $insert->execute($parameters);
            $id = (int) $pdo->lastInsertId();
        } else {
            $parameters[':id'] = $id;
            $update = $pdo->prepare("UPDATE storefront_recommendations SET name=:name,strategy=:strategy,method=:method,source_product_id=:source_product_id,surfaces=:surfaces,fallback_mode=:fallback_mode,priority=:priority,starts_at=:starts_at,ends_at=:ends_at,status='draft',notes=:notes WHERE id=:id");
            $update->execute($parameters);
        }
        $pdo->prepare('DELETE FROM storefront_recommendation_products WHERE recommendation_id=:id')->execute([':id' => $id]);
        $link = $pdo->prepare('INSERT INTO storefront_recommendation_products (recommendation_id,product_id,position_number) VALUES (:recommendation_id,:product_id,:position_number)');
        foreach ($targetProductIds as $index => $productId) $link->execute([':recommendation_id' => $id, ':product_id' => (int) $productId, ':position_number' => $index + 1]);
        $after = productRecommendationsRawRecord($pdo, $id) ?? [];
        productRecommendationsEvent($pdo, $id, $before ? 'update_draft' : 'create_draft', $before, $after, $notes !== '' ? $notes : 'Recommendation draft saved by a human administrator.');
        $pdo->commit();
        productRecommendationsJson(200, array_merge(['success' => true, 'module' => 'product-recommendations', 'message' => 'Recommendation draft saved. No product, cart, order or customer record changed.'], productRecommendationsState($pdo)));
    }

    if (!in_array($action, ['publish', 'pause', 'archive'], true)) productRecommendationsJson(422, ['success' => false, 'message' => 'The recommendation action is not supported.']);
    $id = max(0, (int) ($payload['id'] ?? 0));
    $reason = productRecommendationsText($payload['reason'] ?? '', 1000);
    if ($id === 0 || $reason === '') productRecommendationsJson(422, ['success' => false, 'message' => 'Select a recommendation and write an audit reason.']);
    $pdo->beginTransaction();
    $before = productRecommendationsRawRecord($pdo, $id, true);
    if (!$before) { $pdo->rollBack(); productRecommendationsJson(404, ['success' => false, 'message' => 'The selected recommendation was not found.']); }
    $current = strtolower((string) ($before['status'] ?? 'draft'));
    if ($action === 'publish') {
        if (!in_array($current, ['draft', 'paused'], true)) { $pdo->rollBack(); productRecommendationsJson(409, ['success' => false, 'message' => 'Only a draft or paused recommendation can be published.']); }
        $readiness = productRecommendationsReadinessForRaw($pdo, $before);
        if (!($readiness['ready'] ?? false)) { $pdo->rollBack(); productRecommendationsJson(422, ['success' => false, 'message' => 'Resolve publication blockers first.', 'blockers' => $readiness['blockers'] ?? []]); }
        $update = $pdo->prepare("UPDATE storefront_recommendations SET status='active',published_at=NOW() WHERE id=:id");
    } elseif ($action === 'pause') {
        if ($current !== 'active') { $pdo->rollBack(); productRecommendationsJson(409, ['success' => false, 'message' => 'Only an active recommendation can be paused.']); }
        $update = $pdo->prepare("UPDATE storefront_recommendations SET status='paused' WHERE id=:id");
    } else {
        if ($current === 'active') { $pdo->rollBack(); productRecommendationsJson(409, ['success' => false, 'message' => 'Pause an active recommendation before archiving.']); }
        if ($current === 'archived') { $pdo->rollBack(); productRecommendationsJson(409, ['success' => false, 'message' => 'This recommendation is already archived.']); }
        $update = $pdo->prepare("UPDATE storefront_recommendations SET status='archived' WHERE id=:id");
    }
    $update->execute([':id' => $id]);
    $after = productRecommendationsRawRecord($pdo, $id) ?? [];
    productRecommendationsEvent($pdo, $id, $action, $before, $after, $reason);
    $pdo->commit();
    $messages = ['publish' => 'Recommendation published to the controlled storefront feed.', 'pause' => 'Recommendation paused and removed from the public feed.', 'archive' => 'Recommendation archived with evidence preserved.'];
    productRecommendationsJson(200, array_merge(['success' => true, 'module' => 'product-recommendations', 'message' => $messages[$action]], productRecommendationsState($pdo)));
} catch (InvalidArgumentException $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    productRecommendationsJson(422, ['success' => false, 'module' => 'product-recommendations', 'message' => $error->getMessage()]);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('manage_product_recommendations.php: ' . $error->getMessage());
    productRecommendationsJson(500, ['success' => false, 'module' => 'product-recommendations', 'message' => 'Product Recommendations is temporarily unavailable.']);
}
