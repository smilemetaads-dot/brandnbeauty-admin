<?php

declare(strict_types=1);

require_once __DIR__ . '/collection_schema.php';
require_once __DIR__ . '/product_catalog_schema.php';

function storefrontPublicText(mixed $value): string
{
    return trim(is_scalar($value) ? (string) $value : '');
}

function storefrontPublicProductPayload(array $row): array
{
    $id = max(0, (int) ($row['id'] ?? 0));
    $name = storefrontPublicText($row['name'] ?? $row['product_name'] ?? '');
    $slug = strtolower(storefrontPublicText($row['slug'] ?? ''));
    if ($slug === '' && $id > 0) $slug = 'product-' . $id;

    $stock = max(0, (int) ($row['stock'] ?? $row['stock_quantity'] ?? 0));
    $rawStatus = strtolower(storefrontPublicText($row['status'] ?? 'active'));
    $privateStatuses = ['inactive', 'disabled', 'draft', 'archived', 'deleted'];
    $public = !in_array($rawStatus, $privateStatuses, true);
    $status = $stock > 0 ? 'active' : 'out_of_stock';

    $price = max(0, (float) ($row['price'] ?? 0));
    $compareRaw = $row['compare_price'] ?? null;
    $comparePrice = $compareRaw === null || $compareRaw === '' ? null : max(0, (float) $compareRaw);

    return [
        'id' => $id,
        'product_name' => $name !== '' ? $name : 'Untitled product',
        'slug' => $slug,
        'sku' => storefrontPublicText($row['sku'] ?? ''),
        'brand_name' => storefrontPublicText($row['brand'] ?? $row['brand_name'] ?? ''),
        'category_name' => storefrontPublicText($row['category'] ?? $row['category_name'] ?? ''),
        'price' => $price,
        'compare_price' => $comparePrice,
        'image_url' => storefrontPublicText($row['image'] ?? $row['image_url'] ?? ''),
        'stock_quantity' => $stock,
        'available' => $stock > 0,
        'status' => $status,
        'short_description' => storefrontPublicText($row['short_description'] ?? ''),
        'description' => storefrontPublicText($row['description'] ?? ''),
        'featured' => (bool) ($row['featured'] ?? false),
        'meta_title' => storefrontPublicText($row['meta_title'] ?? ''),
        'meta_description' => storefrontPublicText($row['meta_description'] ?? ''),
        'updated_at' => $row['updated_at'] ?? null,
        '_public' => $public && $id > 0 && $name !== '' && $slug !== '',
    ];
}

function storefrontPublicProductRows(PDO $pdo): array
{
    if (!collectionTableExists($pdo, 'products')) return [];

    $rows = [];
    if (
        catalogTableExists($pdo, 'product_catalog_meta') &&
        catalogTableExists($pdo, 'product_catalog_drafts')
    ) {
        try {
            $rows = catalogProductRows($pdo);
        } catch (Throwable $error) {
            error_log('storefront_product_public catalog adapter: ' . $error->getMessage());
        }
    }

    if ($rows === []) {
        $projection = collectionProductProjection($pdo);
        if ($projection['id'] === null) return [];
        $statement = $pdo->query(
            'SELECT ' . $projection['select'] . ' FROM products p ORDER BY product_name ASC, id ASC LIMIT 2500'
        );
        $rows = $statement->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    $products = array_map('storefrontPublicProductPayload', $rows);
    return array_values(array_map(static function (array $product): array {
        unset($product['_public']);
        return $product;
    }, array_filter($products, static fn (array $product): bool => $product['_public'] === true)));
}

function storefrontPublicLower(string $value): string
{
    return function_exists('mb_strtolower') ? mb_strtolower($value, 'UTF-8') : strtolower($value);
}

