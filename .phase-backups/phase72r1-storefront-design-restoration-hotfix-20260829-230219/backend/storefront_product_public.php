<?php

declare(strict_types=1);

require_once __DIR__ . '/collection_schema.php';
require_once __DIR__ . '/product_catalog_schema.php';

function storefrontPublicText(mixed $value): string
{
    return trim(is_scalar($value) ? (string) $value : '');
}

function storefrontPublicSlug(string $name, int $id, bool $hasDuplicateName): string
{
    $slug = strtolower(trim($name));
    $slug = preg_replace('/[^a-z0-9-]+/', '-', $slug) ?? '';
    $slug = preg_replace('/-+/', '-', $slug) ?? '';
    $slug = trim($slug, '-');
    if ($slug === '') $slug = 'product';
    return $hasDuplicateName ? $slug . '-' . $id : $slug;
}

function storefrontPublicProductPayload(array $row, bool $hasDuplicateName = false): array
{
    $id = max(0, (int) ($row['id'] ?? 0));
    $name = storefrontPublicText($row['name'] ?? $row['product_name'] ?? '');
    $slug = strtolower(storefrontPublicText($row['slug'] ?? ''));
    if ($slug === '' && $id > 0) $slug = storefrontPublicSlug($name, $id, $hasDuplicateName);

    $stock = max(0, (int) ($row['stock'] ?? $row['stock_quantity'] ?? 0));
    $inventoryMode = strtolower(storefrontPublicText($row['inventory_mode'] ?? 'stocked')) === 'on_demand'
        ? 'on_demand'
        : 'stocked';
    $rawAvailability = strtolower(storefrontPublicText($row['availability_status'] ?? ''));
    $availabilityStatus = in_array($rawAvailability, ['available', 'unavailable'], true)
        ? $rawAvailability
        : (($inventoryMode === 'on_demand' || $stock > 0) ? 'available' : 'unavailable');
    $minimumOrderQuantity = max(1, (int) ($row['minimum_order_quantity'] ?? 1));
    $isOrderable = $availabilityStatus === 'available' && ($inventoryMode === 'on_demand' || $stock > 0);
    $availabilityLabel = storefrontPublicText($row['availability_label'] ?? '');
    if ($availabilityLabel === '') {
        $availabilityLabel = $isOrderable
            ? ($inventoryMode === 'on_demand' ? 'Available on Order' : 'In Stock')
            : 'Currently Unavailable';
    }
    $rawStatus = strtolower(storefrontPublicText($row['status'] ?? 'active'));
    $privateStatuses = ['inactive', 'disabled', 'draft', 'archived', 'deleted'];
    $public = !in_array($rawStatus, $privateStatuses, true);
    $status = $isOrderable ? 'active' : 'out_of_stock';

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
        'old_price' => $comparePrice,
        'image_url' => storefrontPublicText($row['image'] ?? $row['image_url'] ?? ''),
        'stock_quantity' => $stock,
        'inventory_mode' => $inventoryMode,
        'availability_status' => $availabilityStatus,
        'minimum_order_quantity' => $minimumOrderQuantity,
        'availability_label' => $availabilityLabel,
        'is_orderable' => $isOrderable,
        'available' => $isOrderable,
        'status' => $status,
        'concern_name' => storefrontPublicText($row['concern'] ?? $row['concern_name'] ?? ''),
        'short_description' => storefrontPublicText($row['short_description'] ?? ''),
        'description' => storefrontPublicText($row['description'] ?? ''),
        'featured' => (bool) ($row['featured'] ?? false),
        'meta_title' => storefrontPublicText($row['meta_title'] ?? ''),
        'meta_description' => storefrontPublicText($row['meta_description'] ?? ''),
        'created_at' => $row['created_at'] ?? null,
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

    $nameCounts = [];
    foreach ($rows as $row) {
        $rowStatus = strtolower(storefrontPublicText($row['status'] ?? 'active'));
        if (in_array($rowStatus, ['inactive', 'disabled', 'draft', 'archived', 'deleted'], true)) continue;
        $normalizedName = storefrontPublicLower(storefrontPublicText($row['name'] ?? $row['product_name'] ?? ''));
        if ($normalizedName !== '') $nameCounts[$normalizedName] = ($nameCounts[$normalizedName] ?? 0) + 1;
    }
    $products = array_map(
        static function (array $row) use ($nameCounts): array {
            $normalizedName = storefrontPublicLower(storefrontPublicText($row['name'] ?? $row['product_name'] ?? ''));
            return storefrontPublicProductPayload($row, ($nameCounts[$normalizedName] ?? 0) > 1);
        },
        $rows
    );
    return array_values(array_map(static function (array $product): array {
        unset($product['_public']);
        return $product;
    }, array_filter($products, static fn (array $product): bool => $product['_public'] === true)));
}

function storefrontPublicLower(string $value): string
{
    return function_exists('mb_strtolower') ? mb_strtolower($value, 'UTF-8') : strtolower($value);
}
