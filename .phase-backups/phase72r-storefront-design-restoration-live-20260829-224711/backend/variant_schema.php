<?php

declare(strict_types=1);

function ensureVariantSchema(PDO $pdo): void
{
    $columns = $pdo->query('SHOW COLUMNS FROM products')->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('product_type', $columns, true)) {
        $position = in_array('sku', $columns, true) ? ' AFTER sku' : '';
        $pdo->exec("ALTER TABLE products ADD COLUMN product_type ENUM('single','variant') NOT NULL DEFAULT 'single'{$position}");
    }

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS product_variants (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            product_id INT UNSIGNED NOT NULL,
            variant_name VARCHAR(150) NOT NULL,
            option_name VARCHAR(100) NOT NULL DEFAULT 'Option',
            option_value VARCHAR(150) NOT NULL,
            sku VARCHAR(100) NOT NULL,
            cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            regular_price DECIMAL(12,2) NOT NULL,
            sale_price DECIMAL(12,2) NULL,
            stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,
            low_stock_threshold INT UNSIGNED NOT NULL DEFAULT 0,
            image_url VARCHAR(2048) NULL,
            status ENUM('active','draft','inactive') NOT NULL DEFAULT 'draft',
            sort_order INT NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_product_variants_sku (sku),
            KEY idx_product_variants_product_status_sort (product_id, status, sort_order),
            CONSTRAINT fk_product_variants_product FOREIGN KEY (product_id) REFERENCES products(id)
                ON DELETE RESTRICT ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function ensureOrderVariantColumns(PDO $pdo): void
{
    $tableStatement = $pdo->prepare(
        'SELECT COUNT(*)
         FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = :table_name'
    );
    $tableStatement->execute([':table_name' => 'order_items']);
    if ((int) $tableStatement->fetchColumn() === 0) {
        return;
    }

    $columns = $pdo->query('SHOW COLUMNS FROM order_items')->fetchAll(PDO::FETCH_COLUMN);
    $definitions = [
        'variant_id' => 'INT UNSIGNED NULL AFTER product_id',
        'variant_name' => 'VARCHAR(150) NULL AFTER product_name',
        'variant_sku' => 'VARCHAR(100) NULL AFTER variant_name',
    ];
    foreach ($definitions as $column => $definition) {
        if (!in_array($column, $columns, true)) {
            $pdo->exec("ALTER TABLE order_items ADD COLUMN `{$column}` {$definition}");
        }
    }
}
