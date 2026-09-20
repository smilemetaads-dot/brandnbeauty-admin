<?php

declare(strict_types=1);

function ensureCollectionSchema(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS collections (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            title VARCHAR(191) NOT NULL,
            slug VARCHAR(191) NOT NULL,
            eyebrow_label VARCHAR(120) NULL,
            description TEXT NULL,
            desktop_image_url VARCHAR(2048) NULL,
            mobile_image_url VARCHAR(2048) NULL,
            status ENUM('active','inactive','draft','deleted') NOT NULL DEFAULT 'draft',
            sort_order INT NOT NULL DEFAULT 0,
            seo_title VARCHAR(191) NULL,
            seo_description VARCHAR(255) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_collections_slug (slug),
            KEY idx_collections_status_sort (status, sort_order),
            KEY idx_collections_updated_at (updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS collection_products (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            collection_id INT UNSIGNED NOT NULL,
            product_id BIGINT UNSIGNED NOT NULL,
            sort_order INT NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_collection_products_pair (collection_id, product_id),
            KEY idx_collection_products_collection_sort (collection_id, sort_order),
            KEY idx_collection_products_product (product_id),
            CONSTRAINT fk_collection_products_collection FOREIGN KEY (collection_id) REFERENCES collections(id)
                ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function collectionTableExists(PDO $pdo, string $table): bool
{
    $statement = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table_name'
    );
    $statement->execute([':table_name' => $table]);
    return (int) $statement->fetchColumn() > 0;
}

function collectionColumns(PDO $pdo, string $table): array
{
    if (!collectionTableExists($pdo, $table)) return [];
    $statement = $pdo->query('SHOW COLUMNS FROM `' . str_replace('`', '``', $table) . '`');
    return array_map(static fn (array $row): string => (string) $row['Field'], $statement->fetchAll(PDO::FETCH_ASSOC) ?: []);
}

function collectionProductProjection(PDO $pdo, string $alias = 'p'): array
{
    $columns = collectionColumns($pdo, 'products');
    $pick = static function (array $candidates) use ($columns): ?string {
        foreach ($candidates as $candidate) if (in_array($candidate, $columns, true)) return $candidate;
        return null;
    };
    $identifier = static fn (?string $column): string => $column === null ? '' : '`' . str_replace('`', '``', $column) . '`';
    $field = static function (?string $column, string $fallback, string $name) use ($alias, $identifier): string {
        return $column === null ? $fallback . ' AS `' . $name . '`' : $alias . '.' . $identifier($column) . ' AS `' . $name . '`';
    };

    return [
        'id' => $pick(['id', 'product_id']),
        'select' => implode(', ', [
            $field($pick(['id', 'product_id']), '0', 'id'),
            $field($pick(['product_name', 'name', 'title']), "''", 'product_name'),
            $field($pick(['slug']), "''", 'slug'),
            $field($pick(['sku']), "''", 'sku'),
            $field($pick(['brand_name', 'brand']), "''", 'brand_name'),
            $field($pick(['price', 'selling_price', 'sale_price', 'regular_price']), '0', 'price'),
            $field($pick(['image_url', 'main_image', 'image']), "''", 'image_url'),
            $field($pick(['stock_quantity', 'stock', 'quantity']), '0', 'stock_quantity'),
            $field($pick(['status']), "'active'", 'status'),
        ]),
    ];
}
