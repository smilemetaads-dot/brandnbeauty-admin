<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/inventory_schema.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['https://brandnbeauty.com', 'https://www.brandnbeauty.com', 'https://admin.brandnbeauty.com'];
$localOrigin = preg_match('/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/', $origin) === 1;
if ($localOrigin || in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

requireAdminAuth();

function inventoryJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function inventoryBody(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function inventoryText(mixed $value, int $limit = 1000): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function inventoryId(mixed $value): int
{
    $id = filter_var($value, FILTER_VALIDATE_INT);
    return $id === false || $id < 1 ? 0 : (int) $id;
}

function inventoryActor(): string
{
    return inventoryText($_SERVER['HTTP_X_ADMIN_ACTOR'] ?? 'Admin', 191) ?: 'Admin';
}

$pdo = null;

try {
    $pdo = getDatabaseConnection();
    ensureInventorySchema($pdo);

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
        $products = inventoryProductRows($pdo);
        inventoryJson(200, [
            'success' => true,
            'module' => 'inventory-control',
            'source' => 'existing-products-table',
            'products' => $products,
            'summary' => inventorySummary($products),
            'movements' => inventoryRecentMovements($pdo),
            'reservation_source' => 'not-configured',
            'incoming_source' => 'not-configured',
        ]);
    }

    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') inventoryJson(405, ['success' => false, 'message' => 'Method not allowed.']);
    $body = inventoryBody();
    $action = inventoryText($body['action'] ?? '', 40);

    if ($action === 'create_draft') {
        $productId = inventoryId($body['product_id'] ?? 0);
        $movementType = inventoryText($body['movement_type'] ?? '', 20);
        $quantity = filter_var($body['quantity'] ?? null, FILTER_VALIDATE_INT);
        $reason = inventoryText($body['reason'] ?? '', 191);
        $reference = inventoryText($body['reference_code'] ?? '', 191);
        $note = inventoryText($body['internal_note'] ?? '', 1000);
        if ($productId < 1) throw new InvalidArgumentException('Choose a real product.');
        if (!in_array($movementType, ['increase', 'decrease', 'count'], true)) throw new InvalidArgumentException('Choose a valid movement type.');
        if ($quantity === false || $quantity < 0 || ($movementType !== 'count' && $quantity < 1)) throw new InvalidArgumentException('Enter a valid movement quantity.');
        if (strlen($reason) < 4) throw new InvalidArgumentException('A clear adjustment reason is required.');
        if (strlen($reference) < 3) throw new InvalidArgumentException('A supporting reference is required.');
        $before = inventoryCurrentStock($pdo, $productId);
        $after = $movementType === 'count' ? $quantity : ($movementType === 'increase' ? $before + $quantity : $before - $quantity);
        if ($after < 0) throw new InvalidArgumentException('The draft cannot create negative stock.');
        $statement = $pdo->prepare(
            "INSERT INTO inventory_adjustment_drafts
            (product_id,movement_type,quantity,expected_before,expected_after,reason,reference_code,internal_note,actor)
            VALUES (:product_id,:movement_type,:quantity,:expected_before,:expected_after,:reason,:reference_code,:internal_note,:actor)"
        );
        $statement->execute([
            ':product_id' => $productId, ':movement_type' => $movementType, ':quantity' => $quantity,
            ':expected_before' => $before, ':expected_after' => $after, ':reason' => $reason,
            ':reference_code' => $reference, ':internal_note' => $note ?: null, ':actor' => inventoryActor(),
        ]);
        inventoryJson(201, ['success' => true, 'message' => 'Adjustment draft saved. Live stock was not changed.', 'draft' => [
            'id' => (string) $pdo->lastInsertId(), 'product_id' => (string) $productId, 'movement_type' => $movementType,
            'quantity' => $quantity, 'expected_before' => $before, 'expected_after' => $after, 'status' => 'draft',
        ]]);
    }

    if ($action === 'post_draft') {
        $draftId = inventoryId($body['draft_id'] ?? 0);
        if ($draftId < 1 || ($body['confirm'] ?? '') !== 'post') throw new InvalidArgumentException('Human confirmation is required to post stock.');
        $pdo->beginTransaction();
        $statement = $pdo->prepare("SELECT * FROM inventory_adjustment_drafts WHERE id=:id AND status='draft' LIMIT 1 FOR UPDATE");
        $statement->execute([':id' => $draftId]);
        $draft = $statement->fetch(PDO::FETCH_ASSOC);
        if (!$draft) throw new RuntimeException('This adjustment draft is no longer available.');
        $before = inventoryCurrentStock($pdo, (int) $draft['product_id'], true);
        if ($before !== (int) $draft['expected_before']) throw new RuntimeException('Stock changed after this draft was created. Refresh and create a new adjustment draft.');
        $after = (int) $draft['expected_after'];
        inventorySetStock($pdo, (int) $draft['product_id'], $after);
        $movement = $pdo->prepare(
            "INSERT INTO inventory_movements
            (product_id,movement_type,quantity_delta,before_quantity,after_quantity,reason,reference_code,internal_note,actor)
            VALUES (:product_id,:movement_type,:quantity_delta,:before_quantity,:after_quantity,:reason,:reference_code,:internal_note,:actor)"
        );
        $movement->execute([
            ':product_id' => $draft['product_id'], ':movement_type' => $draft['movement_type'],
            ':quantity_delta' => $after - $before, ':before_quantity' => $before, ':after_quantity' => $after,
            ':reason' => $draft['reason'], ':reference_code' => $draft['reference_code'],
            ':internal_note' => $draft['internal_note'], ':actor' => inventoryActor(),
        ]);
        $movementId = (int) $pdo->lastInsertId();
        $update = $pdo->prepare("UPDATE inventory_adjustment_drafts SET status='posted',posted_movement_id=:movement_id,posted_at=NOW() WHERE id=:id");
        $update->execute([':movement_id' => $movementId, ':id' => $draftId]);
        $pdo->commit();
        inventoryJson(200, ['success' => true, 'message' => 'Stock movement posted with before/after evidence.', 'movement_id' => (string) $movementId]);
    }

    if ($action === 'discard_draft') {
        $draftId = inventoryId($body['draft_id'] ?? 0);
        if ($draftId < 1 || ($body['confirm'] ?? '') !== 'discard') throw new InvalidArgumentException('Discard confirmation is required.');
        $statement = $pdo->prepare("UPDATE inventory_adjustment_drafts SET status='discarded' WHERE id=:id AND status='draft'");
        $statement->execute([':id' => $draftId]);
        inventoryJson(200, ['success' => true, 'message' => 'Adjustment draft discarded. Live stock was not changed.']);
    }

    throw new InvalidArgumentException('Unknown inventory action.');
} catch (InvalidArgumentException $error) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    inventoryJson(422, ['success' => false, 'message' => $error->getMessage()]);
} catch (Throwable $error) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('Inventory control request failed: ' . $error->getMessage());
    inventoryJson(500, ['success' => false, 'message' => 'Inventory control could not complete the request safely.']);
}
