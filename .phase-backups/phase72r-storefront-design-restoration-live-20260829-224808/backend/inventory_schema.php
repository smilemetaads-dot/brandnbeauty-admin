<?php

declare(strict_types=1);

require_once __DIR__ . '/product_catalog_schema.php';

function ensureInventorySchema(PDO $pdo): void
{
    ensureProductCatalogSchema($pdo);

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS inventory_adjustment_drafts (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            product_id BIGINT UNSIGNED NOT NULL,
            movement_type ENUM('increase','decrease','count') NOT NULL,
            quantity INT UNSIGNED NOT NULL,
            expected_before INT UNSIGNED NOT NULL,
            expected_after INT UNSIGNED NOT NULL,
            reason VARCHAR(191) NOT NULL,
            reference_code VARCHAR(191) NOT NULL,
            internal_note VARCHAR(1000) NULL,
            status ENUM('draft','posted','discarded') NOT NULL DEFAULT 'draft',
            actor VARCHAR(191) NOT NULL DEFAULT 'Admin',
            posted_movement_id BIGINT UNSIGNED NULL,
            posted_at TIMESTAMP NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_inventory_drafts_product (product_id, status, updated_at),
            KEY idx_inventory_drafts_status (status, updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS inventory_movements (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            product_id BIGINT UNSIGNED NOT NULL,
            movement_type VARCHAR(40) NOT NULL,
            quantity_delta INT NOT NULL,
            before_quantity INT UNSIGNED NOT NULL,
            after_quantity INT UNSIGNED NOT NULL,
            reason VARCHAR(191) NOT NULL,
            reference_code VARCHAR(191) NOT NULL,
            internal_note VARCHAR(1000) NULL,
            source_module VARCHAR(80) NOT NULL DEFAULT 'inventory-control',
            actor VARCHAR(191) NOT NULL DEFAULT 'Admin',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_inventory_movements_product (product_id, created_at),
            KEY idx_inventory_movements_reference (reference_code),
            KEY idx_inventory_movements_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function inventoryProductRows(PDO $pdo): array
{
    $products = catalogProductRows($pdo);
    $draftCounts = [];
    $statement = $pdo->query("SELECT product_id, COUNT(*) AS draft_count FROM inventory_adjustment_drafts WHERE status='draft' GROUP BY product_id");
    foreach ($statement->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
        $draftCounts[(string) $row['product_id']] = (int) $row['draft_count'];
    }

    return array_map(static function (array $product) use ($draftCounts): array {
        $stock = max(0, (int) ($product['stock'] ?? 0));
        $threshold = max(0, (int) ($product['low_stock_threshold'] ?? 10));
        $health = $stock <= 0 ? 'out' : ($stock <= $threshold ? 'low' : 'in_stock');
        return [
            'id' => (string) ($product['id'] ?? ''),
            'name' => (string) ($product['name'] ?? ''),
            'sku' => (string) ($product['sku'] ?? ''),
            'brand' => (string) ($product['brand'] ?? ''),
            'category' => (string) ($product['category'] ?? ''),
            'image' => (string) ($product['image'] ?? ''),
            'on_hand' => $stock,
            'available' => $stock,
            'reserved' => 0,
            'incoming' => 0,
            'low_stock_threshold' => $threshold,
            'health' => $health,
            'adjustment_drafts' => $draftCounts[(string) ($product['id'] ?? '')] ?? 0,
            'updated_at' => $product['updated_at'] ?? null,
        ];
    }, $products);
}

function inventorySummary(array $rows): array
{
    return [
        'total_skus' => count($rows),
        'on_hand_units' => array_sum(array_column($rows, 'on_hand')),
        'in_stock' => count(array_filter($rows, static fn (array $row): bool => $row['health'] === 'in_stock')),
        'low_stock' => count(array_filter($rows, static fn (array $row): bool => $row['health'] === 'low')),
        'out_of_stock' => count(array_filter($rows, static fn (array $row): bool => $row['health'] === 'out')),
        'draft_adjustments' => array_sum(array_column($rows, 'adjustment_drafts')),
    ];
}

function inventoryRecentMovements(PDO $pdo, int $limit = 25): array
{
    $limit = max(1, min(100, $limit));
    $rows = $pdo->query('SELECT * FROM inventory_movements ORDER BY created_at DESC, id DESC LIMIT ' . $limit)->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $products = [];
    foreach (catalogProductRows($pdo) as $product) $products[(string) $product['id']] = $product;

    return array_map(static function (array $row) use ($products): array {
        $product = $products[(string) $row['product_id']] ?? [];
        return [
            'id' => (string) $row['id'],
            'product_id' => (string) $row['product_id'],
            'product_name' => (string) ($product['name'] ?? ('Product #' . $row['product_id'])),
            'sku' => (string) ($product['sku'] ?? ''),
            'movement_type' => (string) $row['movement_type'],
            'quantity_delta' => (int) $row['quantity_delta'],
            'before_quantity' => (int) $row['before_quantity'],
            'after_quantity' => (int) $row['after_quantity'],
            'reason' => (string) $row['reason'],
            'reference_code' => (string) $row['reference_code'],
            'actor' => (string) $row['actor'],
            'created_at' => $row['created_at'],
        ];
    }, $rows);
}

function inventoryCurrentStock(PDO $pdo, int $productId, bool $forUpdate = false): int
{
    $map = catalogProductMap($pdo);
    if ($map['id'] === null || $map['stock'] === null) {
        throw new RuntimeException('The products table does not expose a compatible stock column.');
    }
    $sql = 'SELECT ' . catalogIdentifier($map['stock']) . ' FROM products WHERE ' . catalogIdentifier($map['id']) . '=:id LIMIT 1';
    if ($forUpdate) $sql .= ' FOR UPDATE';
    $statement = $pdo->prepare($sql);
    $statement->execute([':id' => $productId]);
    $value = $statement->fetchColumn();
    if ($value === false) throw new RuntimeException('The selected product no longer exists.');
    return max(0, (int) $value);
}

function inventorySetStock(PDO $pdo, int $productId, int $stock): void
{
    $map = catalogProductMap($pdo);
    if ($map['id'] === null || $map['stock'] === null) throw new RuntimeException('The products table stock adapter is unavailable.');
    $statement = $pdo->prepare(
        'UPDATE products SET ' . catalogIdentifier($map['stock']) . '=:stock WHERE ' . catalogIdentifier($map['id']) . '=:id'
    );
    $statement->execute([':stock' => max(0, $stock), ':id' => $productId]);
    if ($statement->rowCount() < 1 && inventoryCurrentStock($pdo, $productId) !== max(0, $stock)) {
        throw new RuntimeException('The stock balance could not be updated.');
    }
}
