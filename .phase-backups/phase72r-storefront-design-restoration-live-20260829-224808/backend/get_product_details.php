<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/variant_schema.php';
require_once __DIR__ . '/inventory_schema.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedLocalOrigin = preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) === 1;

if ($allowedLocalOrigin) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function sendJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function tableExists(PDO $pdo, string $tableName): bool
{
    $statement = $pdo->prepare(
        'SELECT COUNT(*)
         FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = :table_name'
    );
    $statement->execute([':table_name' => $tableName]);

    return (int) $statement->fetchColumn() > 0;
}

function getTableColumns(PDO $pdo, string $tableName): array
{
    $statement = $pdo->query('SHOW COLUMNS FROM `' . $tableName . '`');
    $columns = [];

    foreach ($statement->fetchAll(PDO::FETCH_ASSOC) as $column) {
        if (isset($column['Field'])) {
            $columns[] = (string) $column['Field'];
        }
    }

    return $columns;
}

function firstColumn(array $columns, array $candidates): ?string
{
    foreach ($candidates as $candidate) {
        if (in_array($candidate, $columns, true)) {
            return $candidate;
        }
    }

    return null;
}

function getPositiveInt(mixed $value): ?int
{
    $value = is_scalar($value) ? trim((string) $value) : '';

    return preg_match('/^[1-9]\d*$/', $value) ? (int) $value : null;
}

function getCleanSlug(mixed $value): string
{
    $value = is_scalar($value) ? strtolower(trim((string) $value)) : '';
    $value = preg_replace('/[^a-z0-9-]+/', '-', $value) ?? '';
    $value = preg_replace('/-+/', '-', $value) ?? '';

    return trim($value, '-');
}

function productPublicSlug(string $name, int $id, bool $hasDuplicateName): string
{
    $baseSlug = getCleanSlug($name);
    if ($baseSlug === '') {
        $baseSlug = 'product';
    }

    return $hasDuplicateName ? "{$baseSlug}-{$id}" : $baseSlug;
}

function resolveProductByPublicSlug(PDO $pdo, array $columns, string $slug, bool $includeInactive): ?array
{
    $slug = getCleanSlug($slug);
    if ($slug === '' || !in_array('id', $columns, true)) {
        return null;
    }

    $statusFilter = !$includeInactive && in_array('status', $columns, true) ? " WHERE `status` IN ('published', 'active')" : '';

    if (in_array('slug', $columns, true)) {
        $where = $statusFilter === '' ? 'WHERE' : $statusFilter . ' AND';
        $statement = $pdo->prepare("SELECT * FROM products {$where} `slug` = :slug LIMIT 1");
        $statement->execute([':slug' => $slug]);
        $product = $statement->fetch(PDO::FETCH_ASSOC);
        if ($product) {
            return $product;
        }
    }

    $nameColumn = firstColumn($columns, ['product_name', 'name', 'title']);
    if ($nameColumn === null) {
        return null;
    }

    $statement = $pdo->query("SELECT id, `{$nameColumn}` AS product_name FROM products{$statusFilter}");
    $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
    $nameCounts = [];
    foreach ($rows as $row) {
        $normalizedName = strtolower(trim((string) ($row['product_name'] ?? '')));
        if ($normalizedName !== '') {
            $nameCounts[$normalizedName] = ($nameCounts[$normalizedName] ?? 0) + 1;
        }
    }

    foreach ($rows as $row) {
        $id = (int) ($row['id'] ?? 0);
        $name = (string) ($row['product_name'] ?? '');
        $normalizedName = strtolower(trim($name));
        if (productPublicSlug($name, $id, ($nameCounts[$normalizedName] ?? 0) > 1) === $slug) {
            $detail = $pdo->prepare('SELECT * FROM products WHERE id = :id LIMIT 1');
            $detail->execute([':id' => $id]);
            $product = $detail->fetch(PDO::FETCH_ASSOC);
            return $product ?: null;
        }
    }

    return null;
}

function getCatalogMeta(PDO $pdo, string $tableName, mixed $id): ?array
{
    $id = getPositiveInt($id);
    if ($id === null || !tableExists($pdo, $tableName)) {
        return null;
    }

    $columns = getTableColumns($pdo, $tableName);
    if (!in_array('id', $columns, true) || !in_array('name', $columns, true)) {
        return null;
    }

    $slugSelect = in_array('slug', $columns, true) ? 'slug' : 'NULL AS slug';
    $parentSelect = in_array('parent_id', $columns, true) ? 'parent_id' : 'NULL AS parent_id';
    $statement = $pdo->prepare(
        "SELECT id, name, {$slugSelect}, {$parentSelect}
         FROM `{$tableName}`
         WHERE id = :id
         LIMIT 1"
    );
    $statement->execute([':id' => $id]);
    $row = $statement->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        return null;
    }

    return [
        'id' => (int) $row['id'],
        'name' => (string) $row['name'],
        'slug' => $row['slug'] ?? null,
        'parent_id' => isset($row['parent_id']) ? (int) $row['parent_id'] : null,
    ];
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJson(405, [
        'success' => false,
        'message' => 'Only GET requests are allowed.',
    ]);
}

$productId = getPositiveInt($_GET['product_id'] ?? $_GET['id'] ?? null);
$productSlug = isset($_GET['slug']) && is_scalar($_GET['slug'])
    ? trim((string) $_GET['slug'])
    : '';
$includeInactive = isset($_GET['include_inactive']) && (string) $_GET['include_inactive'] === '1';

if ($includeInactive) {
    requireAdminAuth();
}

if ($productId === null && $productSlug === '') {
    sendJson(400, [
        'success' => false,
        'message' => 'A valid product_id, id, or slug parameter is required.',
    ]);
}

try {
    $pdo = getDatabaseConnection();
    ensureVariantSchema($pdo);
    ensureInventorySchema($pdo);

    if (!tableExists($pdo, 'products')) {
        sendJson(404, [
            'success' => false,
            'message' => 'Product catalog is not initialized.',
        ]);
    }

    $columns = getTableColumns($pdo, 'products');

    if (!in_array('id', $columns, true)) {
        sendJson(500, [
            'success' => false,
            'message' => 'Products table is missing required columns.',
        ]);
    }

    if ($productId !== null) {
        $where = ['`id` = :id'];
        $params = [':id' => $productId];

        if (!$includeInactive && in_array('status', $columns, true)) {
            $where[] = "`status` IN ('published', 'active')";
        }

        $statement = $pdo->prepare(
            'SELECT *
             FROM products
             WHERE ' . implode(' AND ', $where) . '
             LIMIT 1'
        );
        $statement->execute($params);
        $product = $statement->fetch(PDO::FETCH_ASSOC);
    } else {
        $product = resolveProductByPublicSlug($pdo, $columns, $productSlug, $includeInactive);
    }

    if (!$product) {
        sendJson(404, [
            'success' => false,
            'message' => 'Product not found.',
        ]);
    }

    $nameColumn = firstColumn($columns, ['product_name', 'name', 'title']);
    $stockColumn = firstColumn($columns, ['stock_quantity', 'stock', 'quantity']);
    $imageColumn = firstColumn($columns, ['image_url', 'image', 'thumbnail']);
    $oldPriceColumn = firstColumn($columns, ['old_price', 'sale_price', 'compare_at_price']);
    $categoryColumn = firstColumn($columns, ['category_id']);
    $concernColumn = firstColumn($columns, ['concern_id']);
    $brandColumn = firstColumn($columns, ['brand_id']);

    $product['product_name'] = (string) ($product[$nameColumn] ?? $product['product_name'] ?? '');
    $storedSlug = trim((string) ($product['slug'] ?? ''));
    $duplicateName = false;
    if ($storedSlug === '' && $nameColumn !== null && $product['product_name'] !== '') {
        $duplicateWhere = ["`{$nameColumn}` = :product_name"];
        if (!$includeInactive && in_array('status', $columns, true)) {
            $duplicateWhere[] = "`status` IN ('published', 'active')";
        }
        $duplicateStatement = $pdo->prepare('SELECT COUNT(*) FROM products WHERE ' . implode(' AND ', $duplicateWhere));
        $duplicateStatement->execute([':product_name' => $product['product_name']]);
        $duplicateName = (int) $duplicateStatement->fetchColumn() > 1;
    }
    $product['slug'] = $storedSlug !== '' ? $storedSlug : productPublicSlug($product['product_name'], (int) $product['id'], $duplicateName);
    $product['price'] = (string) ($product['price'] ?? '0.00');
    $product['old_price'] = $oldPriceColumn !== null && isset($product[$oldPriceColumn])
        ? (string) $product[$oldPriceColumn]
        : null;
    $product['description'] = (string) ($product['description'] ?? '');
    $product['image_url'] = $imageColumn !== null
        ? ($product[$imageColumn] ?? null)
        : ($product['image_url'] ?? null);
    $product['stock_quantity'] = $stockColumn !== null
        ? (int) ($product[$stockColumn] ?? 0)
        : 0;
    $product['product_type'] = ($product['product_type'] ?? 'single') === 'variant' ? 'variant' : 'single';
    $product['inventory_mode'] = normalizeInventoryMode($product['inventory_mode'] ?? 'stocked');
    $product['availability_status'] = normalizeAvailabilityStatus($product['availability_status'] ?? 'available');
    $product['minimum_order_quantity'] = normalizeMinimumOrderQuantity($product['minimum_order_quantity'] ?? 1);
    $variantSql = 'SELECT id, product_id, variant_name, option_name, option_value, sku,
                          cost_price, regular_price, sale_price, stock_quantity,
                          low_stock_threshold, inventory_mode, availability_status,
                          minimum_order_quantity, image_url, status, sort_order
                   FROM product_variants WHERE product_id = :product_id';
    if (!$includeInactive) $variantSql .= " AND status = 'active'";
    $variantSql .= ' ORDER BY sort_order ASC, id ASC';
    $variantStatement = $pdo->prepare($variantSql);
    $variantStatement->execute([':product_id' => (int) $product['id']]);
    $product['variants'] = array_map(
        static function (array $variant): array {
            $inventoryMode = normalizeInventoryMode($variant['inventory_mode'] ?? 'stocked');
            $availabilityStatus = normalizeAvailabilityStatus($variant['availability_status'] ?? 'available');
            $stockQuantity = (int) ($variant['stock_quantity'] ?? 0);
            $variant['inventory_mode'] = $inventoryMode;
            $variant['availability_status'] = $availabilityStatus;
            $variant['minimum_order_quantity'] = normalizeMinimumOrderQuantity($variant['minimum_order_quantity'] ?? 1);
            $variant['availability_label'] = inventoryAvailabilityLabel($inventoryMode, $availabilityStatus, $stockQuantity);
            $variant['is_orderable'] = $availabilityStatus === 'available' && ($inventoryMode === 'on_demand' || $stockQuantity > 0);

            return $variant;
        },
        $variantStatement->fetchAll(PDO::FETCH_ASSOC)
    );
    if ($product['product_type'] === 'variant') {
        $activeVariants = array_values(array_filter($product['variants'], static fn(array $variant): bool => $variant['status'] === 'active'));
        $prices = array_map(static fn(array $variant): float => (float) ($variant['sale_price'] ?: $variant['regular_price']), $activeVariants);
        $product['stock_quantity'] = array_sum(array_map(static fn(array $variant): int => (int) $variant['stock_quantity'], $activeVariants));
        $product['min_variant_price'] = $prices === [] ? null : min($prices);
        $product['max_variant_price'] = $prices === [] ? null : max($prices);
        $product['default_variant_id'] = count($activeVariants) === 1 ? (int) $activeVariants[0]['id'] : null;
        $product['is_orderable'] = $product['availability_status'] === 'available'
            && count(array_filter($activeVariants, static fn(array $variant): bool => (bool) ($variant['is_orderable'] ?? false))) > 0;
        $product['availability_label'] = $product['is_orderable']
            ? (count(array_filter($activeVariants, static fn(array $variant): bool => ($variant['inventory_mode'] ?? 'stocked') === 'on_demand' && (bool) ($variant['is_orderable'] ?? false))) > 0
                ? 'Available on Order'
                : 'In Stock')
            : 'Currently Unavailable';
    } else {
        $product['availability_label'] = inventoryAvailabilityLabel(
            $product['inventory_mode'],
            $product['availability_status'],
            (int) $product['stock_quantity']
        );
        $product['is_orderable'] = $product['availability_status'] === 'available'
            && ($product['inventory_mode'] === 'on_demand' || (int) $product['stock_quantity'] > 0);
    }

    $categoryMeta = getCatalogMeta($pdo, 'categories', $categoryColumn !== null ? ($product[$categoryColumn] ?? null) : null);
    $concernMeta = getCatalogMeta($pdo, 'concerns', $concernColumn !== null ? ($product[$concernColumn] ?? null) : null);
    $brandMeta = getCatalogMeta($pdo, 'brands', $brandColumn !== null ? ($product[$brandColumn] ?? null) : null);

    $product['category_id'] = $categoryMeta['id'] ?? ($categoryColumn !== null && $product[$categoryColumn] !== null ? (int) $product[$categoryColumn] : null);
    $product['category'] = $categoryMeta['name'] ?? null;
    $product['category_name'] = $categoryMeta['name'] ?? null;
    $product['category_slug'] = $categoryMeta['slug'] ?? null;
    $product['category_parent_id'] = $categoryMeta['parent_id'] ?? null;
    $product['concern_id'] = $concernMeta['id'] ?? ($concernColumn !== null && $product[$concernColumn] !== null ? (int) $product[$concernColumn] : null);
    $product['concern'] = $concernMeta['name'] ?? null;
    $product['concern_name'] = $concernMeta['name'] ?? null;
    $product['concern_slug'] = $concernMeta['slug'] ?? null;
    $concerns = [];
    if ($concernMeta !== null) {
        $concerns[(int) $concernMeta['id']] = $concernMeta;
    }
    if (tableExists($pdo, 'product_concerns') && tableExists($pdo, 'concerns')) {
        $concernStatement = $pdo->prepare(
            'SELECT c.id, c.name, c.slug
             FROM product_concerns pc
             INNER JOIN concerns c ON c.id = pc.concern_id
             WHERE pc.product_id = :product_id
             ORDER BY c.name ASC'
        );
        $concernStatement->execute([':product_id' => (int) $product['id']]);
        foreach ($concernStatement->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $concernId = (int) $row['id'];
            $concerns[$concernId] = [
                'id' => $concernId,
                'name' => (string) $row['name'],
                'slug' => (string) $row['slug'],
            ];
        }
    }
    $product['concerns'] = array_values($concerns);
    $product['concern_ids'] = array_map(
        static fn (array $concern): int => (int) $concern['id'],
        $product['concerns']
    );
    $product['brand_id'] = $brandMeta['id'] ?? ($brandColumn !== null && $product[$brandColumn] !== null ? (int) $product[$brandColumn] : null);
    $product['brand'] = $brandMeta['name'] ?? null;
    $product['brand_name'] = $brandMeta['name'] ?? null;
    $product['brand_slug'] = $brandMeta['slug'] ?? null;

    sendJson(200, [
        'success' => true,
        'product' => $product,
    ]);
} catch (Throwable $exception) {
    error_log('Product details fetch failed: ' . $exception->getMessage());

    sendJson(500, [
        'success' => false,
        'message' => 'Product details could not be loaded right now.',
    ]);
}
