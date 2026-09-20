<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/purchase_stock_schema.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['https://brandnbeauty.com', 'https://www.brandnbeauty.com', 'https://admin.brandnbeauty.com'];
$localOrigin = preg_match('/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/', $origin) === 1;
if ($localOrigin || in_array($origin, $allowedOrigins, true)) { header('Access-Control-Allow-Origin: ' . $origin); header('Vary: Origin'); }
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token, X-Admin-Actor');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }
requireAdminAuth();

function purchaseJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function purchasePayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function purchaseActor(): string
{
    return purchaseText($_SERVER['HTTP_X_ADMIN_ACTOR'] ?? 'Admin', 190) ?: 'Admin';
}

$pdo = null;
try {
    $pdo = getDatabaseConnection();
    ensurePurchaseStockSchema($pdo);
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') purchaseJson(200, array_merge(['success' => true, 'module' => 'purchase-stock-entry'], purchaseStockState($pdo)));
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') purchaseJson(405, ['success' => false, 'message' => 'Method not allowed.']);

    $payload = purchasePayload();
    $action = purchaseText($payload['action'] ?? '', 60);
    $actor = purchaseActor();
    $message = '';

    if ($action === 'create_draft') {
        $supplierId = (int) ($payload['supplier_id'] ?? 0);
        $expectedDate = purchaseText($payload['expected_date'] ?? '', 20);
        $paymentTerms = purchaseText($payload['payment_terms'] ?? '', 190);
        $note = purchaseText($payload['internal_note'] ?? '', 2000);
        $shipping = max(0, (float) ($payload['shipping_cost'] ?? 0));
        $other = max(0, (float) ($payload['other_cost'] ?? 0));
        $inputLines = is_array($payload['lines'] ?? null) ? array_slice($payload['lines'], 0, 50) : [];
        if ($supplierId < 1 || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $expectedDate) || strtotime($expectedDate) === false || strlen($paymentTerms) < 2 || strlen($note) < 6 || $inputLines === []) {
            throw new InvalidArgumentException('Select a supplier, expected date, payment terms, purchase line and clear internal note.');
        }
        $supplier = null;
        foreach (purchaseSuppliers($pdo) as $row) if ((int) $row['id'] === $supplierId && $row['status'] !== 'inactive') { $supplier = $row; break; }
        if ($supplier === null) throw new InvalidArgumentException('The selected active supplier was not found.');
        $productMap = [];
        foreach (purchaseProducts($pdo) as $row) $productMap[(string) $row['id']] = $row;
        $lines = [];
        $subtotal = 0.0;
        foreach ($inputLines as $input) {
            if (!is_array($input)) continue;
            $productId = (string) ((int) ($input['product_id'] ?? 0));
            $quantity = (int) ($input['quantity'] ?? 0);
            $unitCost = (float) ($input['unit_cost'] ?? 0);
            if (!isset($productMap[$productId]) || $quantity < 1 || $quantity > 100000 || $unitCost <= 0) throw new InvalidArgumentException('Every purchase line needs a real product, positive quantity and positive unit cost.');
            $lines[] = ['product' => $productMap[$productId], 'quantity' => $quantity, 'unit_cost' => $unitCost];
            $subtotal += $quantity * $unitCost;
        }
        if ($lines === []) throw new InvalidArgumentException('Add at least one valid purchase line.');
        $pdo->beginTransaction();
        $number = 'PO-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
        $insert = $pdo->prepare("INSERT INTO purchase_stock_orders (purchase_number,supplier_id,supplier_name_snapshot,status,expected_date,payment_terms,shipping_cost,other_cost,subtotal,total_cost,internal_note,created_by) VALUES (:number,:supplier_id,:supplier_name,'draft',:expected_date,:terms,:shipping,:other,:subtotal,:total,:note,:actor)");
        $insert->execute([':number' => $number, ':supplier_id' => $supplierId, ':supplier_name' => $supplier['name'], ':expected_date' => $expectedDate, ':terms' => $paymentTerms, ':shipping' => $shipping, ':other' => $other, ':subtotal' => $subtotal, ':total' => $subtotal + $shipping + $other, ':note' => $note, ':actor' => $actor]);
        $orderId = (int) $pdo->lastInsertId();
        $lineInsert = $pdo->prepare('INSERT INTO purchase_stock_lines (purchase_order_id,product_id,product_name_snapshot,sku_snapshot,ordered_quantity,unit_cost) VALUES (:order_id,:product_id,:name,:sku,:quantity,:unit_cost)');
        foreach ($lines as $line) $lineInsert->execute([':order_id' => $orderId, ':product_id' => $line['product']['id'], ':name' => $line['product']['name'], ':sku' => $line['product']['sku'], ':quantity' => $line['quantity'], ':unit_cost' => $line['unit_cost']]);
        purchaseEvent($pdo, $orderId, 'draft_created', $number . ' draft created', count($lines) . ' line(s) · no stock, supplier payment or Finance record changed.', $actor);
        $pdo->commit();
        $message = 'Purchase draft created. Live stock and Finance remain unchanged.';
    } elseif (in_array($action, ['submit_for_approval', 'approve_order', 'cancel_order'], true)) {
        $orderId = (int) ($payload['order_id'] ?? 0);
        $note = purchaseText($payload['note'] ?? '', 2000);
        if ($orderId < 1 || strlen($note) < 6) throw new InvalidArgumentException('Select a purchase record and add a clear decision note.');
        $order = purchaseOrder($pdo, $orderId);
        if ($action === 'submit_for_approval') {
            if ($order['status'] !== 'draft') throw new InvalidArgumentException('Only a draft can be submitted for approval.');
            $update = $pdo->prepare("UPDATE purchase_stock_orders SET status='awaiting_approval' WHERE id=:id AND status='draft'");
            $update->execute([':id' => $orderId]);
            purchaseEvent($pdo, $orderId, 'submitted', $order['purchase_number'] . ' submitted for approval', $note . ' · stock unchanged.', $actor);
            $message = 'Purchase submitted for human approval. Stock remains unchanged.';
        } elseif ($action === 'approve_order') {
            if (($payload['confirm'] ?? '') !== 'approve' || $order['status'] !== 'awaiting_approval') throw new InvalidArgumentException('Approval requires the awaiting-approval stage and explicit confirmation.');
            $update = $pdo->prepare("UPDATE purchase_stock_orders SET status='approved',approved_by=:actor,approved_at=NOW() WHERE id=:id AND status='awaiting_approval'");
            $update->execute([':actor' => $actor, ':id' => $orderId]);
            purchaseEvent($pdo, $orderId, 'approved', $order['purchase_number'] . ' approved', $note . ' · approval does not receive stock or record supplier payment.', $actor);
            $message = 'Purchase approved. Stock changes only after verified receiving.';
        } else {
            if (($payload['confirm'] ?? '') !== 'cancel' || !in_array($order['status'], ['draft', 'awaiting_approval'], true)) throw new InvalidArgumentException('Only an unapproved purchase can be cancelled with explicit confirmation.');
            $update = $pdo->prepare("UPDATE purchase_stock_orders SET status='cancelled',cancelled_at=NOW() WHERE id=:id AND status IN ('draft','awaiting_approval')");
            $update->execute([':id' => $orderId]);
            purchaseEvent($pdo, $orderId, 'cancelled', $order['purchase_number'] . ' cancelled', $note . ' · no stock or payment was changed.', $actor);
            $message = 'Purchase cancelled. No stock or payment was changed.';
        }
    } elseif ($action === 'receive_line') {
        $orderId = (int) ($payload['order_id'] ?? 0);
        $lineId = (int) ($payload['line_id'] ?? 0);
        $quantity = (int) ($payload['quantity'] ?? 0);
        $batch = purchaseText($payload['batch_code'] ?? '', 190);
        $expiry = purchaseText($payload['expiry_date'] ?? '', 20);
        $note = purchaseText($payload['note'] ?? '', 2000);
        if (($payload['confirm'] ?? '') !== 'receive' || $orderId < 1 || $lineId < 1 || $quantity < 1 || strlen($batch) < 2 || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $expiry) || strtotime($expiry) === false || strtotime($expiry) <= time() || strlen($note) < 6) {
            throw new InvalidArgumentException('Receiving requires confirmation, quantity, batch, future expiry date and a clear verification note.');
        }
        $pdo->beginTransaction();
        $order = purchaseOrder($pdo, $orderId, true);
        if (!in_array($order['status'], ['approved', 'partially_received'], true)) throw new InvalidArgumentException('Only an approved purchase can receive stock.');
        $line = purchaseLine($pdo, $lineId, true);
        if ((int) $line['purchase_order_id'] !== $orderId) throw new InvalidArgumentException('The selected line does not belong to this purchase.');
        $remaining = (int) $line['ordered_quantity'] - (int) $line['received_quantity'];
        if ($quantity > $remaining) throw new InvalidArgumentException('Received quantity cannot exceed the remaining approved quantity.');
        $before = inventoryCurrentStock($pdo, (int) $line['product_id'], true);
        $after = $before + $quantity;
        inventorySetStock($pdo, (int) $line['product_id'], $after);
        $movement = $pdo->prepare("INSERT INTO inventory_movements (product_id,movement_type,quantity_delta,before_quantity,after_quantity,reason,reference_code,internal_note,source_module,actor) VALUES (:product_id,'purchase_receipt',:delta,:before_quantity,:after_quantity,'Approved purchase receipt',:reference,:note,'purchase-stock-entry',:actor)");
        $movement->execute([':product_id' => $line['product_id'], ':delta' => $quantity, ':before_quantity' => $before, ':after_quantity' => $after, ':reference' => $order['purchase_number'] . ' · ' . $batch, ':note' => $note . ' · expiry ' . $expiry, ':actor' => $actor]);
        $lineUpdate = $pdo->prepare("UPDATE purchase_stock_lines SET received_quantity=received_quantity+:quantity,last_batch_code=:batch,last_expiry_date=:expiry,qc_status='passed' WHERE id=:id");
        $lineUpdate->execute([':quantity' => $quantity, ':batch' => $batch, ':expiry' => $expiry, ':id' => $lineId]);
        $totals = $pdo->prepare('SELECT SUM(ordered_quantity) ordered_total,SUM(received_quantity) received_total FROM purchase_stock_lines WHERE purchase_order_id=:order_id');
        $totals->execute([':order_id' => $orderId]);
        $sum = $totals->fetch(PDO::FETCH_ASSOC) ?: ['ordered_total' => 0, 'received_total' => 0];
        $complete = (int) $sum['received_total'] >= (int) $sum['ordered_total'];
        $orderUpdate = $pdo->prepare("UPDATE purchase_stock_orders SET status=:status,received_at=IF(:complete=1,NOW(),received_at) WHERE id=:id");
        $orderUpdate->execute([':status' => $complete ? 'received' : 'partially_received', ':complete' => $complete ? 1 : 0, ':id' => $orderId]);
        purchaseEvent($pdo, $orderId, 'stock_received', $quantity . ' units received for ' . $line['product_name_snapshot'], $batch . ' · expiry ' . $expiry . ' · stock ' . $before . ' to ' . $after . ' · ' . $note, $actor);
        $pdo->commit();
        $message = 'Verified receipt posted. Stock and immutable movement evidence were updated together.';
    } else {
        throw new InvalidArgumentException('Unknown Purchase Stock Entry action.');
    }

    purchaseJson(200, ['success' => true, 'message' => $message, 'state' => purchaseStockState($pdo)]);
} catch (InvalidArgumentException $error) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    purchaseJson(422, ['success' => false, 'message' => $error->getMessage()]);
} catch (Throwable $error) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('manage_purchase_stock.php: ' . $error->getMessage());
    purchaseJson(500, ['success' => false, 'message' => 'Purchase Stock Entry is temporarily unavailable. Incomplete changes were rolled back.']);
}
