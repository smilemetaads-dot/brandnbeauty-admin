<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/variant_schema.php';
require_once __DIR__ . '/inventory_schema.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['https://brandnbeauty.com', 'https://www.brandnbeauty.com'];
$allowedLocalOrigin = preg_match('/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/', $origin) === 1;

if ($allowedLocalOrigin || in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: public, max-age=30, stale-while-revalidate=120');
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

    foreach ($statement->fetchAll() as $column) {
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

function resolveCatalogIdBySlug(PDO $pdo, string $tableName, string $slug): ?int
{
    if ($slug === '' || !tableExists($pdo, $tableName)) {
        return null;
    }

    $columns = getTableColumns($pdo, $tableName);
    if (!in_array('id', $columns, true)) {
        return null;
    }

    if (in_array('slug', $columns, true)) {
        $statement = $pdo->prepare("SELECT id FROM `{$tableName}` WHERE slug = :slug LIMIT 1");
        $statement->execute([':slug' => $slug]);
        $id = $statement->fetchColumn();
        if ($id !== false) {
            return (int) $id;
        }
    }

    if (in_array('name', $columns, true)) {
        $statement = $pdo->prepare("SELECT id FROM `{$tableName}` WHERE LOWER(REPLACE(name, ' ', '-')) = :slug LIMIT 1");
        $statement->execute([':slug' => $slug]);
        $id = $statement->fetchColumn();
        if ($id !== false) {
            return (int) $id;
        }
    }

    return null;
}

function getConcernsByProduct(PDO $pdo, array $productRows): array
{
    $concernsByProduct = [];
    $productIds = [];

    foreach ($productRows as $row) {
        $productId = (int) ($row['id'] ?? 0);
        if ($productId <= 0) {
            continue;
        }

        $productIds[] = $productId;
        $legacyConcernId = isset($row['concern_id']) ? (int) $row['concern_id'] : 0;
        if ($legacyConcernId > 0) {
            $concernsByProduct[$productId][$legacyConcernId] = [
                'id' => $legacyConcernId,
                'name' => $row['concern_name'] ?? null,
                'slug' => $row['concern_slug'] ?? null,
            ];
        }
    }

    if ($productIds === [] || !tableExists($pdo, 'product_concerns') || !tableExists($pdo, 'concerns')) {
        return $concernsByProduct;
    }

    $placeholders = implode(',', array_fill(0, count($productIds), '?'));
    $statement = $pdo->prepare(
        "SELECT pc.product_id, c.id, c.name, c.slug
         FROM product_concerns pc
         INNER JOIN concerns c ON c.id = pc.concern_id
         WHERE pc.product_id IN ({$placeholders})
         ORDER BY c.name ASC"
    );
    $statement->execute($productIds);

    foreach ($statement->fetchAll() as $row) {
        $productId = (int) $row['product_id'];
        $concernId = (int) $row['id'];
        $concernsByProduct[$productId][$concernId] = [
            'id' => $concernId,
            'name' => (string) $row['name'],
            'slug' => (string) $row['slug'],
        ];
    }

    return $concernsByProduct;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJson(405, [
        'success' => false,
        'message' => 'Only GET requests are allowed.',
    ]);
}

$categoryId = getPositiveInt($_GET['category_id'] ?? null);
$concernId = getPositiveInt($_GET['concern_id'] ?? null);
$brandId = getPositiveInt($_GET['brand_id'] ?? null);
$categorySlug = getCleanSlug($_GET['category_slug'] ?? $_GET['category'] ?? null);
$concernSlug = getCleanSlug($_GET['concern_slug'] ?? $_GET['concern'] ?? null);
$brandSlug = getCleanSlug($_GET['brand_slug'] ?? $_GET['brand'] ?? null);
$query = trim((string) ($_GET['q'] ?? ''));
if (strlen($query) > 120) {
    sendJson(422, ['success' => false, 'message' => 'Search is too long.']);
}
$availability = strtolower(trim((string) ($_GET['availability'] ?? 'all')));
if (!in_array($availability, ['all', 'in_stock', 'out_of_stock'], true)) {
    $availability = 'all';
}
$sort = strtolower(trim((string) ($_GET['sort'] ?? 'newest')));
if (!in_array($sort, ['name_asc', 'name_desc', 'price_asc', 'price_desc', 'newest'], true)) {
    $sort = 'newest';
}
$page = max(1, (int) ($_GET['page'] ?? 1));
$limit = max(1, min(1000, (int) ($_GET['limit'] ?? 96)));

try {
    $pdo = getDatabaseConnection();
    ensureVariantSchema($pdo);
    ensureInventorySchema($pdo);

    if (!tableExists($pdo, 'products')) {
        sendJson(500, [
            'success' => false,
            'message' => 'Products table is not initialized.',
        ]);
    }

    $columns = getTableColumns($pdo, 'products');
    $nameColumn = firstColumn($columns, ['product_name', 'name', 'title']);
    $stockColumn = firstColumn($columns, ['stock_quantity', 'stock', 'quantity']);
    $priceColumn = firstColumn($columns, ['price']);
    $oldPriceColumn = firstColumn($columns, ['old_price', 'sale_price', 'compare_at_price']);
    $imageColumn = firstColumn($columns, ['image_url', 'image', 'thumbnail']);
    $skuColumn = firstColumn($columns, ['sku']);
    $slugColumn = firstColumn($columns, ['slug']);
    $descriptionColumn = firstColumn($columns, ['description', 'short_description']);
    $categoryColumn = firstColumn($columns, ['category_id']);
    $concernColumn = firstColumn($columns, ['concern_id']);
    $brandColumn = firstColumn($columns, ['brand_id']);
    $createdColumn = firstColumn($columns, ['created_at', 'id']);

    if (
        $nameColumn === null ||
        $stockColumn === null ||
        $priceColumn === null ||
        !in_array('id', $columns, true) ||
        !in_array('status', $columns, true)
    ) {
        sendJson(500, [
            'success' => false,
            'message' => 'Products table is missing required storefront columns.',
        ]);
    }

    $where = [
        "p.`status` IN ('published', 'active')",
    ];
    $params = [];

    $categoryId = $categoryId ?? resolveCatalogIdBySlug($pdo, 'categories', $categorySlug);
    $concernId = $concernId ?? resolveCatalogIdBySlug($pdo, 'concerns', $concernSlug);
    $brandId = $brandId ?? resolveCatalogIdBySlug($pdo, 'brands', $brandSlug);

    if ($categoryId !== null) {
        if ($categoryColumn !== null) {
            $where[] = "p.`{$categoryColumn}` = :category_id";
        } elseif (tableExists($pdo, 'product_categories')) {
            $where[] = 'EXISTS (
                SELECT 1
                FROM product_categories pc
                WHERE pc.product_id = p.id
                  AND pc.category_id = :category_id
            )';
        } else {
            sendJson(400, [
                'success' => false,
                'message' => 'Category filtering is not available for this catalog schema.',
            ]);
        }

        $params[':category_id'] = $categoryId;
    }

    if ($concernId !== null) {
        $concernConditions = [];
        if ($concernColumn !== null) {
            $concernConditions[] = "p.`{$concernColumn}` = :legacy_concern_id";
            $params[':legacy_concern_id'] = $concernId;
        }
        if (tableExists($pdo, 'product_concerns')) {
            $concernConditions[] = 'EXISTS (
                SELECT 1
                FROM product_concerns pc
                WHERE pc.product_id = p.id
                  AND pc.concern_id = :mapped_concern_id
            )';
            $params[':mapped_concern_id'] = $concernId;
        }
        if ($concernConditions === []) {
            sendJson(400, [
                'success' => false,
                'message' => 'Concern filtering is not available for this catalog schema.',
            ]);
        }

        $where[] = '(' . implode(' OR ', $concernConditions) . ')';
    }

    if ($brandId !== null) {
        if ($brandColumn !== null) {
            $where[] = "p.`{$brandColumn}` = :brand_id";
        } elseif (tableExists($pdo, 'product_brands')) {
            $where[] = 'EXISTS (
                SELECT 1
                FROM product_brands pb
                WHERE pb.product_id = p.id
                  AND pb.brand_id = :brand_id
            )';
        } else {
            sendJson(400, [
                'success' => false,
                'message' => 'Brand filtering is not available for this catalog schema.',
            ]);
        }

        $params[':brand_id'] = $brandId;
    }

    $oldPriceSelect = $oldPriceColumn !== null
        ? "p.`{$oldPriceColumn}` AS old_price"
        : 'NULL AS old_price';
    $imageSelect = $imageColumn !== null
        ? "p.`{$imageColumn}` AS image_url"
        : 'NULL AS image_url';
    $skuSelect = $skuColumn !== null
        ? "p.`{$skuColumn}` AS sku"
        : 'NULL AS sku';
    $slugSelect = $slugColumn !== null
        ? "p.`{$slugColumn}` AS slug"
        : 'NULL AS slug';
    $descriptionSelect = $descriptionColumn !== null
        ? "p.`{$descriptionColumn}` AS description"
        : 'NULL AS description';
    $categoryIdSelect = $categoryColumn !== null ? "p.`{$categoryColumn}` AS category_id" : 'NULL AS category_id';
    $concernIdSelect = $concernColumn !== null ? "p.`{$concernColumn}` AS concern_id" : 'NULL AS concern_id';
    $brandIdSelect = $brandColumn !== null ? "p.`{$brandColumn}` AS brand_id" : 'NULL AS brand_id';
    $categoryNameSelect = $categoryColumn !== null && tableExists($pdo, 'categories')
        ? "(SELECT c.name FROM categories c WHERE c.id = p.`{$categoryColumn}` LIMIT 1) AS category_name"
        : 'NULL AS category_name';
    $categorySlugSelect = $categoryColumn !== null && tableExists($pdo, 'categories')
        ? "(SELECT c.slug FROM categories c WHERE c.id = p.`{$categoryColumn}` LIMIT 1) AS category_slug"
        : 'NULL AS category_slug';
    $concernNameSelect = $concernColumn !== null && tableExists($pdo, 'concerns')
        ? "(SELECT c.name FROM concerns c WHERE c.id = p.`{$concernColumn}` LIMIT 1) AS concern_name"
        : 'NULL AS concern_name';
    $concernSlugSelect = $concernColumn !== null && tableExists($pdo, 'concerns')
        ? "(SELECT c.slug FROM concerns c WHERE c.id = p.`{$concernColumn}` LIMIT 1) AS concern_slug"
        : 'NULL AS concern_slug';
    $brandNameSelect = $brandColumn !== null && tableExists($pdo, 'brands')
        ? "(SELECT b.name FROM brands b WHERE b.id = p.`{$brandColumn}` LIMIT 1) AS brand_name"
        : 'NULL AS brand_name';
    $brandSlugSelect = $brandColumn !== null && tableExists($pdo, 'brands')
        ? "(SELECT b.slug FROM brands b WHERE b.id = p.`{$brandColumn}` LIMIT 1) AS brand_slug"
        : 'NULL AS brand_slug';
    $orderColumn = $createdColumn ?? 'id';

    $statement = $pdo->prepare(
        "SELECT
            p.id,
            p.product_type,
            p.`{$nameColumn}` AS product_name,
            {$skuSelect},
            {$slugSelect},
            p.`{$priceColumn}` AS price,
            p.`{$stockColumn}` AS stock_quantity,
            {$oldPriceSelect},
            {$imageSelect},
            {$descriptionSelect},
            {$categoryIdSelect},
            {$categoryNameSelect},
            {$categorySlugSelect},
            {$concernIdSelect},
            {$concernNameSelect},
            {$concernSlugSelect},
            {$brandIdSelect},
            {$brandNameSelect},
            {$brandSlugSelect}
            ,p.inventory_mode
            ,p.availability_status
            ,p.minimum_order_quantity
            ,variant_meta.min_variant_price
            ,variant_meta.max_variant_price
            ,COALESCE(variant_meta.variant_stock, 0) AS variant_stock
            ,variant_meta.default_variant_id
            ,COALESCE(variant_meta.orderable_variant_count, 0) AS orderable_variant_count
            ,COALESCE(variant_meta.on_demand_variant_count, 0) AS on_demand_variant_count
         FROM products p
         LEFT JOIN (
            SELECT
                product_id,
                MIN(CASE WHEN status = 'active' THEN COALESCE(sale_price, regular_price) ELSE NULL END) AS min_variant_price,
                MAX(CASE WHEN status = 'active' THEN COALESCE(sale_price, regular_price) ELSE NULL END) AS max_variant_price,
                SUM(CASE WHEN status = 'active' THEN stock_quantity ELSE 0 END) AS variant_stock,
                MIN(CASE WHEN status = 'active' THEN id ELSE NULL END) AS default_variant_id,
                SUM(CASE WHEN status = 'active'
                          AND availability_status = 'available'
                          AND (inventory_mode = 'on_demand' OR stock_quantity > 0)
                         THEN 1 ELSE 0 END) AS orderable_variant_count,
                SUM(CASE WHEN status = 'active'
                          AND availability_status = 'available'
                          AND inventory_mode = 'on_demand'
                         THEN 1 ELSE 0 END) AS on_demand_variant_count
             FROM product_variants
             GROUP BY product_id
         ) variant_meta ON variant_meta.product_id = p.id
         WHERE " . implode(' AND ', $where) . "
         ORDER BY p.`{$orderColumn}` DESC"
    );
    $statement->execute($params);

    $productRows = $statement->fetchAll();
    $concernsByProduct = getConcernsByProduct($pdo, $productRows);
    $nameCounts = [];
    foreach ($productRows as $row) {
        $normalizedName = strtolower(trim((string) ($row['product_name'] ?? '')));
        if ($normalizedName !== '') {
            $nameCounts[$normalizedName] = ($nameCounts[$normalizedName] ?? 0) + 1;
        }
    }
    $products = array_map(
        static function (array $product) use ($concernsByProduct, $nameCounts): array {
            $productId = (int) ($product['id'] ?? 0);
            $productName = (string) ($product['product_name'] ?? '');
            $storedSlug = trim((string) ($product['slug'] ?? ''));
            $normalizedName = strtolower(trim($productName));
            $concerns = array_values($concernsByProduct[$productId] ?? []);

            $productType = ($product['product_type'] ?? 'single') === 'variant' ? 'variant' : 'single';
            $inventoryMode = normalizeInventoryMode($product['inventory_mode'] ?? 'stocked');
            $availabilityStatus = normalizeAvailabilityStatus($product['availability_status'] ?? 'available');
            $stockQuantity = $productType === 'variant' ? (int) ($product['variant_stock'] ?? 0) : (int) ($product['stock_quantity'] ?? 0);
            $isOrderable = $productType === 'variant'
                ? $availabilityStatus === 'available' && (int) ($product['orderable_variant_count'] ?? 0) > 0
                : $availabilityStatus === 'available' && ($inventoryMode === 'on_demand' || $stockQuantity > 0);
            $labelInventoryMode = $productType === 'variant' && (int) ($product['on_demand_variant_count'] ?? 0) > 0
                ? 'on_demand'
                : $inventoryMode;

            return [
            'id' => (int) ($product['id'] ?? 0),
            'product_name' => $productName,
            'sku' => $product['sku'] !== null ? (string) $product['sku'] : null,
            'slug' => $storedSlug !== '' ? $storedSlug : productPublicSlug($productName, $productId, ($nameCounts[$normalizedName] ?? 0) > 1),
            'product_type' => $productType,
            'price' => $productType === 'variant' ? (string) ($product['min_variant_price'] ?? '0.00') : (string) ($product['price'] ?? '0.00'),
            'min_variant_price' => $product['min_variant_price'] !== null ? (string) $product['min_variant_price'] : null,
            'max_variant_price' => $product['max_variant_price'] !== null ? (string) $product['max_variant_price'] : null,
            'default_variant_id' => $product['default_variant_id'] !== null ? (int) $product['default_variant_id'] : null,
            'old_price' => $product['old_price'] !== null
                ? (string) $product['old_price']
                : null,
            'image_url' => $product['image_url'] ?? null,
            'description' => $product['description'] ?? null,
            'stock_quantity' => $stockQuantity,
            'inventory_mode' => $inventoryMode,
            'availability_status' => $availabilityStatus,
            'minimum_order_quantity' => normalizeMinimumOrderQuantity($product['minimum_order_quantity'] ?? 1),
            'availability_label' => $isOrderable
                ? inventoryAvailabilityLabel($labelInventoryMode, $availabilityStatus, $stockQuantity)
                : 'Currently Unavailable',
            'is_orderable' => $isOrderable,
            'category_id' => $product['category_id'] !== null ? (int) $product['category_id'] : null,
            'category_name' => $product['category_name'] ?? null,
            'category_slug' => $product['category_slug'] ?? null,
            'concern_id' => $product['concern_id'] !== null ? (int) $product['concern_id'] : null,
            'concern_name' => $product['concern_name'] ?? null,
            'concern_slug' => $product['concern_slug'] ?? null,
            'concern_ids' => array_map(
                static fn (array $concern): int => (int) $concern['id'],
                $concerns
            ),
            'concerns' => $concerns,
            'brand_id' => $product['brand_id'] !== null ? (int) $product['brand_id'] : null,
            'brand_name' => $product['brand_name'] ?? null,
            'brand_slug' => $product['brand_slug'] ?? null,
            ];
        },
        $productRows
    );

    $allProducts = $products;
    $needle = function_exists('mb_strtolower') ? mb_strtolower($query, 'UTF-8') : strtolower($query);
    $products = array_values(array_filter(
        $products,
        static function (array $product) use ($needle, $availability): bool {
            $isOrderable = (bool) ($product['is_orderable'] ?? false);
            if ($availability === 'in_stock' && !$isOrderable) return false;
            if ($availability === 'out_of_stock' && $isOrderable) return false;
            if ($needle === '') return true;

            $haystack = implode(' ', [
                $product['product_name'] ?? '',
                $product['brand_name'] ?? '',
                $product['category_name'] ?? '',
                $product['sku'] ?? '',
                $product['description'] ?? '',
            ]);
            $haystack = function_exists('mb_strtolower') ? mb_strtolower($haystack, 'UTF-8') : strtolower($haystack);
            return str_contains($haystack, $needle);
        }
    ));

    usort($products, static function (array $left, array $right) use ($sort): int {
        if ($sort === 'price_asc') return [(float) $left['price'], (string) $left['product_name']] <=> [(float) $right['price'], (string) $right['product_name']];
        if ($sort === 'price_desc') return [(float) $right['price'], (string) $right['product_name']] <=> [(float) $left['price'], (string) $left['product_name']];
        if ($sort === 'name_asc') return strnatcasecmp((string) $left['product_name'], (string) $right['product_name']);
        if ($sort === 'name_desc') return strnatcasecmp((string) $right['product_name'], (string) $left['product_name']);
        return (int) $right['id'] <=> (int) $left['id'];
    });

    $facetValues = static function (array $rows, string $key): array {
        $values = [];
        foreach ($rows as $row) {
            $value = trim((string) ($row[$key] ?? ''));
            if ($value !== '') $values[strtolower($value)] = $value;
        }
        natcasesort($values);
        return array_values($values);
    };

    $total = count($products);
    $pages = max(1, (int) ceil($total / $limit));
    if ($page > $pages) $page = $pages;
    $products = array_slice($products, ($page - 1) * $limit, $limit);

    sendJson(200, [
        'success' => true,
        'products' => $products,
        'count' => count($products),
        'total' => $total,
        'page' => $page,
        'pages' => $pages,
        'facets' => [
            'brands' => $facetValues($allProducts, 'brand_name'),
            'categories' => $facetValues($allProducts, 'category_name'),
        ],
        'filters' => [
            'q' => $query,
            'availability' => $availability,
            'sort' => $sort,
        ],
        'generated_at' => date(DATE_ATOM),
    ]);
} catch (Throwable $exception) {
    error_log('Store products fetch failed: ' . $exception->getMessage());

    sendJson(500, [
        'success' => false,
        'message' => 'Store products could not be loaded right now.',
        'diagnostic_stage' => 'store_products_live_adapter',
    ]);
}
