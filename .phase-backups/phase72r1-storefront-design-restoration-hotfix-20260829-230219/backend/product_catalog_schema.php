<?php

declare(strict_types=1);

function catalogTableExists(PDO $pdo, string $table): bool
{
    $statement = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table_name'
    );
    $statement->execute([':table_name' => $table]);
    return (int) $statement->fetchColumn() > 0;
}

function catalogColumns(PDO $pdo, string $table): array
{
    if (!catalogTableExists($pdo, $table)) return [];
    $statement = $pdo->query('SHOW COLUMNS FROM `' . str_replace('`', '``', $table) . '`');
    return $statement->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

function catalogIdentifier(string $name): string
{
    return '`' . str_replace('`', '``', $name) . '`';
}

function catalogProductMap(PDO $pdo): array
{
    $columnRows = catalogColumns($pdo, 'products');
    $columns = array_map(static fn (array $row): string => (string) $row['Field'], $columnRows);
    $pick = static function (array $candidates) use ($columns): ?string {
        foreach ($candidates as $candidate) if (in_array($candidate, $columns, true)) return $candidate;
        return null;
    };

    return [
        'id' => $pick(['id', 'product_id']),
        'name' => $pick(['product_name', 'name', 'title']),
        'slug' => $pick(['slug', 'product_slug']),
        'sku' => $pick(['sku', 'product_sku', 'code']),
        'brand' => $pick(['brand_name', 'brand']),
        'category' => $pick(['category_name', 'category']),
        'price' => $pick(['price', 'selling_price', 'sale_price', 'regular_price']),
        'compare_price' => $pick(['compare_at_price', 'old_price', 'compare_price', 'mrp']),
        'cost_price' => $pick(['cost_price', 'cost', 'purchase_price']),
        'stock' => $pick(['stock_quantity', 'stock', 'inventory_count', 'quantity']),
        'low_stock_threshold' => $pick(['low_stock_threshold', 'reorder_level', 'minimum_stock', 'min_stock']),
        'image' => $pick(['image_url', 'main_image', 'image']),
        'short_description' => $pick(['short_description', 'summary']),
        'description' => $pick(['description', 'details']),
        'status' => $pick(['status', 'product_status']),
        'featured' => $pick(['featured', 'is_featured']),
        'created_at' => $pick(['created_at', 'date_created']),
        'updated_at' => $pick(['updated_at', 'date_updated']),
        '_columns' => $columnRows,
    ];
}

function ensureProductCatalogSchema(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS product_catalog_meta (
            product_id BIGINT UNSIGNED NOT NULL,
            slug VARCHAR(191) NULL,
            sku VARCHAR(191) NULL,
            brand_name VARCHAR(191) NULL,
            category_name VARCHAR(191) NULL,
            compare_price DECIMAL(14,2) NULL,
            cost_price DECIMAL(14,2) NULL,
            low_stock_threshold INT UNSIGNED NULL,
            image_url VARCHAR(2048) NULL,
            short_description TEXT NULL,
            description LONGTEXT NULL,
            featured TINYINT(1) NOT NULL DEFAULT 0,
            meta_title VARCHAR(191) NULL,
            meta_description VARCHAR(255) NULL,
            status_override VARCHAR(40) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (product_id),
            UNIQUE KEY uq_product_catalog_meta_slug (slug),
            KEY idx_product_catalog_meta_sku (sku),
            KEY idx_product_catalog_meta_updated (updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS product_catalog_drafts (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            product_id BIGINT UNSIGNED NULL,
            draft_payload LONGTEXT NOT NULL,
            status ENUM('draft','published','discarded') NOT NULL DEFAULT 'draft',
            created_by VARCHAR(191) NOT NULL DEFAULT 'Admin',
            published_product_id BIGINT UNSIGNED NULL,
            published_at TIMESTAMP NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_product_catalog_drafts_product (product_id, status, updated_at),
            KEY idx_product_catalog_drafts_status (status, updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS product_catalog_versions (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            product_id BIGINT UNSIGNED NOT NULL,
            action_name VARCHAR(60) NOT NULL,
            before_payload LONGTEXT NULL,
            after_payload LONGTEXT NOT NULL,
            actor VARCHAR(191) NOT NULL DEFAULT 'Admin',
            reason VARCHAR(500) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_product_catalog_versions_product (product_id, created_at),
            KEY idx_product_catalog_versions_action (action_name, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function catalogFieldExpression(?string $column, string $fallback, string $alias): string
{
    return $column === null
        ? $fallback . ' AS ' . catalogIdentifier($alias)
        : 'p.' . catalogIdentifier($column) . ' AS ' . catalogIdentifier($alias);
}

function catalogProductSelect(PDO $pdo): string
{
    $map = catalogProductMap($pdo);
    if ($map['id'] === null || $map['name'] === null) {
        throw new RuntimeException('The products table needs an identifier and product name column.');
    }

    return implode(', ', [
        catalogFieldExpression($map['id'], '0', 'id'),
        catalogFieldExpression($map['name'], "''", 'live_name'),
        catalogFieldExpression($map['slug'], "''", 'live_slug'),
        catalogFieldExpression($map['sku'], "''", 'live_sku'),
        catalogFieldExpression($map['brand'], "''", 'live_brand'),
        catalogFieldExpression($map['category'], "''", 'live_category'),
        catalogFieldExpression($map['price'], '0', 'price'),
        catalogFieldExpression($map['compare_price'], 'NULL', 'live_compare_price'),
        catalogFieldExpression($map['cost_price'], 'NULL', 'live_cost_price'),
        catalogFieldExpression($map['stock'], '0', 'stock'),
        catalogFieldExpression($map['low_stock_threshold'], 'NULL', 'live_low_stock_threshold'),
        catalogFieldExpression($map['image'], "''", 'live_image'),
        catalogFieldExpression($map['short_description'], "''", 'live_short_description'),
        catalogFieldExpression($map['description'], "''", 'live_description'),
        catalogFieldExpression($map['status'], "''", 'live_status'),
        catalogFieldExpression($map['featured'], 'NULL', 'live_featured'),
        catalogFieldExpression($map['created_at'], 'NULL', 'created_at'),
        catalogFieldExpression($map['updated_at'], 'NULL', 'live_updated_at'),
        'm.slug AS meta_slug',
        'm.sku AS meta_sku',
        'm.brand_name AS meta_brand',
        'm.category_name AS meta_category',
        'm.compare_price AS meta_compare_price',
        'm.cost_price AS meta_cost_price',
        'm.low_stock_threshold AS meta_low_stock_threshold',
        'm.image_url AS meta_image',
        'm.short_description AS meta_short_description',
        'm.description AS meta_description_text',
        'm.featured AS meta_featured',
        'm.meta_title',
        'm.meta_description',
        'm.status_override',
        'COALESCE(m.updated_at, ' . ($map['updated_at'] ? 'p.' . catalogIdentifier($map['updated_at']) : 'NULL') . ') AS updated_at',
        "(SELECT d.id FROM product_catalog_drafts d WHERE d.product_id=p." . catalogIdentifier($map['id']) . " AND d.status='draft' ORDER BY d.updated_at DESC,d.id DESC LIMIT 1) AS draft_id",
    ]);
}

function catalogNormalizeStatus(mixed $value, int $stock): string
{
    $status = strtolower(trim(is_scalar($value) ? (string) $value : ''));
    if (in_array($status, ['active', 'published', 'live', '1'], true)) return 'active';
    if (in_array($status, ['inactive', 'disabled'], true)) return 'inactive';
    if (in_array($status, ['archived', 'deleted'], true)) return 'archived';
    if (in_array($status, ['out_of_stock', 'out-of-stock'], true) || $stock <= 0) return 'out_of_stock';
    return 'draft';
}

function catalogProductPayload(array $row): array
{
    $first = static function (array $keys, mixed $fallback = '') use ($row): mixed {
        foreach ($keys as $key) {
            if (array_key_exists($key, $row) && $row[$key] !== null && trim((string) $row[$key]) !== '') return $row[$key];
        }
        return $fallback;
    };
    $stock = max(0, (int) ($row['stock'] ?? 0));
    $status = catalogNormalizeStatus($first(['status_override', 'live_status'], 'draft'), $stock);
    return [
        'id' => (string) ($row['id'] ?? ''),
        'name' => trim((string) ($row['live_name'] ?? '')),
        'slug' => trim((string) $first(['live_slug', 'meta_slug'])),
        'sku' => trim((string) $first(['live_sku', 'meta_sku'])),
        'brand' => trim((string) $first(['live_brand', 'meta_brand'])),
        'category' => trim((string) $first(['live_category', 'meta_category'])),
        'price' => (float) ($row['price'] ?? 0),
        'compare_price' => $first(['live_compare_price', 'meta_compare_price'], null) === null ? null : (float) $first(['live_compare_price', 'meta_compare_price']),
        'cost_price' => $first(['live_cost_price', 'meta_cost_price'], null) === null ? null : (float) $first(['live_cost_price', 'meta_cost_price']),
        'stock' => $stock,
        'low_stock_threshold' => max(0, (int) $first(['live_low_stock_threshold', 'meta_low_stock_threshold'], 10)),
        'image' => trim((string) $first(['live_image', 'meta_image'])),
        'short_description' => trim((string) $first(['live_short_description', 'meta_short_description'])),
        'description' => trim((string) $first(['live_description', 'meta_description_text'])),
        'status' => $status,
        'featured' => (bool) (int) $first(['live_featured', 'meta_featured'], 0),
        'meta_title' => trim((string) ($row['meta_title'] ?? '')),
        'meta_description' => trim((string) ($row['meta_description'] ?? '')),
        'draft_id' => isset($row['draft_id']) ? (string) $row['draft_id'] : '',
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'] ?? null,
    ];
}

function catalogProductRows(PDO $pdo): array
{
    if (!catalogTableExists($pdo, 'products')) return [];
    $map = catalogProductMap($pdo);
    if ($map['id'] === null) return [];
    $order = $map['updated_at']
        ? 'p.' . catalogIdentifier($map['updated_at']) . ' DESC, p.' . catalogIdentifier($map['id']) . ' DESC'
        : 'p.' . catalogIdentifier($map['id']) . ' DESC';
    $statement = $pdo->query(
        'SELECT ' . catalogProductSelect($pdo) .
        ' FROM products p LEFT JOIN product_catalog_meta m ON m.product_id=p.' . catalogIdentifier($map['id']) .
        ' ORDER BY ' . $order . ' LIMIT 2500'
    );
    return array_map('catalogProductPayload', $statement->fetchAll(PDO::FETCH_ASSOC) ?: []);
}
