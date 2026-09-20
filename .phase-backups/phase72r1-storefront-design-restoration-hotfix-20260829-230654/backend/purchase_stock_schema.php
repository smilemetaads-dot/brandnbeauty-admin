<?php

declare(strict_types=1);

require_once __DIR__ . '/inventory_schema.php';

function purchaseText(mixed $value, int $limit = 1500): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function ensurePurchaseStockSchema(PDO $pdo): void
{
    ensureInventorySchema($pdo);
    $pdo->exec("CREATE TABLE IF NOT EXISTS suppliers (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(190) NOT NULL,
        contact_person VARCHAR(190) NULL,
        phone VARCHAR(50) NULL,
        email VARCHAR(190) NULL,
        address TEXT NULL,
        supplier_type VARCHAR(100) NULL,
        payment_terms VARCHAR(100) NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        notes TEXT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), INDEX idx_suppliers_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS purchase_stock_orders (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        purchase_number VARCHAR(80) NOT NULL,
        supplier_id BIGINT UNSIGNED NOT NULL,
        supplier_name_snapshot VARCHAR(190) NOT NULL,
        status ENUM('draft','awaiting_approval','approved','partially_received','received','cancelled') NOT NULL DEFAULT 'draft',
        expected_date DATE NOT NULL,
        payment_terms VARCHAR(190) NOT NULL,
        shipping_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
        other_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
        subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
        total_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
        paid_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
        internal_note VARCHAR(2000) NOT NULL,
        created_by VARCHAR(190) NOT NULL DEFAULT 'Admin',
        approved_by VARCHAR(190) NULL,
        approved_at TIMESTAMP NULL,
        received_at TIMESTAMP NULL,
        cancelled_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_purchase_stock_number (purchase_number),
        KEY idx_purchase_stock_supplier (supplier_id, status, updated_at),
        KEY idx_purchase_stock_status (status, expected_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS purchase_stock_lines (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        purchase_order_id BIGINT UNSIGNED NOT NULL,
        product_id BIGINT UNSIGNED NOT NULL,
        product_name_snapshot VARCHAR(300) NOT NULL,
        sku_snapshot VARCHAR(190) NULL,
        ordered_quantity INT UNSIGNED NOT NULL,
        received_quantity INT UNSIGNED NOT NULL DEFAULT 0,
        unit_cost DECIMAL(14,2) NOT NULL,
        last_batch_code VARCHAR(190) NULL,
        last_expiry_date DATE NULL,
        qc_status ENUM('pending','passed') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_purchase_stock_lines_order (purchase_order_id, id),
        KEY idx_purchase_stock_lines_product (product_id, purchase_order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS purchase_stock_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        purchase_order_id BIGINT UNSIGNED NOT NULL,
        event_type VARCHAR(80) NOT NULL,
        summary VARCHAR(500) NOT NULL,
        detail_text VARCHAR(3000) NOT NULL,
        actor VARCHAR(190) NOT NULL DEFAULT 'Admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_purchase_stock_events_order (purchase_order_id, created_at),
        KEY idx_purchase_stock_events_type (event_type, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function purchaseColumn(PDO $pdo, string $table, array $candidates): ?string
{
    $columns = array_map(static fn (array $row): string => (string) $row['Field'], catalogColumns($pdo, $table));
    foreach ($candidates as $candidate) if (in_array($candidate, $columns, true)) return $candidate;
    return null;
}

function purchaseSuppliers(PDO $pdo): array
{
    if (!catalogTableExists($pdo, 'suppliers')) return [];
    $id = purchaseColumn($pdo, 'suppliers', ['id', 'supplier_id']);
    $name = purchaseColumn($pdo, 'suppliers', ['name', 'supplier_name']);
    $terms = purchaseColumn($pdo, 'suppliers', ['payment_terms', 'terms']);
    $status = purchaseColumn($pdo, 'suppliers', ['status']);
    if ($id === null || $name === null) return [];
    $sql = 'SELECT ' . catalogIdentifier($id) . ' AS id,' . catalogIdentifier($name) . ' AS name,' .
        ($terms ? catalogIdentifier($terms) : "''") . ' AS payment_terms,' .
        ($status ? catalogIdentifier($status) : "'active'") . ' AS status FROM suppliers ORDER BY ' . catalogIdentifier($name) . ' ASC';
    return array_values(array_filter(array_map(static fn (array $row): array => [
        'id' => (string) $row['id'],
        'name' => purchaseText($row['name'] ?? '', 190),
        'payment_terms' => purchaseText($row['payment_terms'] ?? '', 190),
        'status' => strtolower(purchaseText($row['status'] ?? 'active', 30)) ?: 'active',
    ], $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC) ?: []), static fn (array $row): bool => $row['name'] !== ''));
}

function purchaseProducts(PDO $pdo): array
{
    return array_map(static fn (array $row): array => [
        'id' => (string) $row['id'], 'name' => (string) $row['name'], 'sku' => (string) $row['sku'],
        'brand' => (string) $row['brand'], 'image' => (string) $row['image'], 'on_hand' => (int) $row['on_hand'],
    ], inventoryProductRows($pdo));
}

function purchaseEvent(PDO $pdo, int $orderId, string $type, string $summary, string $detail, string $actor = 'Admin'): void
{
    $statement = $pdo->prepare('INSERT INTO purchase_stock_events (purchase_order_id,event_type,summary,detail_text,actor) VALUES (:order_id,:type,:summary,:detail,:actor)');
    $statement->execute([':order_id' => $orderId, ':type' => $type, ':summary' => purchaseText($summary, 500), ':detail' => purchaseText($detail, 3000), ':actor' => purchaseText($actor, 190) ?: 'Admin']);
}

function purchaseOrder(PDO $pdo, int $orderId, bool $forUpdate = false): array
{
    $statement = $pdo->prepare('SELECT * FROM purchase_stock_orders WHERE id=:id LIMIT 1' . ($forUpdate ? ' FOR UPDATE' : ''));
    $statement->execute([':id' => $orderId]);
    $order = $statement->fetch(PDO::FETCH_ASSOC);
    if (!is_array($order)) throw new InvalidArgumentException('The selected purchase record was not found.');
    return $order;
}

function purchaseLine(PDO $pdo, int $lineId, bool $forUpdate = false): array
{
    $statement = $pdo->prepare('SELECT * FROM purchase_stock_lines WHERE id=:id LIMIT 1' . ($forUpdate ? ' FOR UPDATE' : ''));
    $statement->execute([':id' => $lineId]);
    $line = $statement->fetch(PDO::FETCH_ASSOC);
    if (!is_array($line)) throw new InvalidArgumentException('The selected purchase line was not found.');
    return $line;
}

function purchaseOrders(PDO $pdo): array
{
    $orders = $pdo->query('SELECT * FROM purchase_stock_orders ORDER BY updated_at DESC,id DESC LIMIT 1000')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $lines = $pdo->query('SELECT * FROM purchase_stock_lines ORDER BY purchase_order_id DESC,id ASC')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $events = $pdo->query('SELECT * FROM purchase_stock_events ORDER BY created_at DESC,id DESC LIMIT 1000')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $linesByOrder = [];
    foreach ($lines as $line) {
        $linesByOrder[(string) $line['purchase_order_id']][] = [
            'id' => (string) $line['id'], 'product_id' => (string) $line['product_id'],
            'product_name' => (string) $line['product_name_snapshot'], 'sku' => (string) ($line['sku_snapshot'] ?? ''),
            'ordered_quantity' => (int) $line['ordered_quantity'], 'received_quantity' => (int) $line['received_quantity'],
            'unit_cost' => (float) $line['unit_cost'], 'batch_code' => (string) ($line['last_batch_code'] ?? ''),
            'expiry_date' => $line['last_expiry_date'], 'qc_status' => (string) $line['qc_status'],
        ];
    }
    $eventsByOrder = [];
    foreach ($events as $event) {
        if (count($eventsByOrder[(string) $event['purchase_order_id']] ?? []) >= 12) continue;
        $eventsByOrder[(string) $event['purchase_order_id']][] = [
            'id' => (string) $event['id'], 'event_type' => (string) $event['event_type'], 'summary' => (string) $event['summary'],
            'detail' => (string) $event['detail_text'], 'actor' => (string) $event['actor'], 'created_at' => $event['created_at'],
        ];
    }
    return array_map(static function (array $order) use ($linesByOrder, $eventsByOrder): array {
        $id = (string) $order['id'];
        return [
            'id' => $id, 'purchase_number' => (string) $order['purchase_number'], 'supplier_id' => (string) $order['supplier_id'],
            'supplier_name' => (string) $order['supplier_name_snapshot'], 'status' => (string) $order['status'],
            'expected_date' => $order['expected_date'], 'payment_terms' => (string) $order['payment_terms'],
            'shipping_cost' => (float) $order['shipping_cost'], 'other_cost' => (float) $order['other_cost'],
            'subtotal' => (float) $order['subtotal'], 'total_cost' => (float) $order['total_cost'],
            'paid_amount' => (float) $order['paid_amount'], 'internal_note' => (string) $order['internal_note'],
            'created_by' => (string) $order['created_by'], 'approved_by' => (string) ($order['approved_by'] ?? ''),
            'approved_at' => $order['approved_at'], 'received_at' => $order['received_at'],
            'created_at' => $order['created_at'], 'updated_at' => $order['updated_at'],
            'lines' => $linesByOrder[$id] ?? [], 'events' => $eventsByOrder[$id] ?? [],
        ];
    }, $orders);
}

function purchaseStockState(PDO $pdo): array
{
    ensurePurchaseStockSchema($pdo);
    $orders = purchaseOrders($pdo);
    $open = array_filter($orders, static fn (array $order): bool => !in_array($order['status'], ['received', 'cancelled'], true));
    $incoming = 0;
    foreach ($orders as $order) {
        if (!in_array($order['status'], ['approved', 'partially_received'], true)) continue;
        foreach ($order['lines'] as $line) $incoming += max(0, (int) $line['ordered_quantity'] - (int) $line['received_quantity']);
    }
    return [
        'summary' => [
            'total_orders' => count($orders), 'open_orders' => count($open),
            'open_purchase_value' => array_sum(array_column($open, 'total_cost')),
            'incoming_units' => $incoming,
            'awaiting_approval' => count(array_filter($orders, static fn (array $order): bool => $order['status'] === 'awaiting_approval')),
            'receiving' => count(array_filter($orders, static fn (array $order): bool => in_array($order['status'], ['approved', 'partially_received'], true))),
        ],
        'orders' => $orders, 'suppliers' => purchaseSuppliers($pdo), 'products' => purchaseProducts($pdo),
        'generated_at' => date(DATE_ATOM),
    ];
}
