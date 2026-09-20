<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/product_catalog_schema.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['https://brandnbeauty.com', 'https://www.brandnbeauty.com', 'https://admin.brandnbeauty.com'];
$localOrigin = preg_match('/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/', $origin) === 1;
if ($localOrigin || in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

requireAdminAuth();

function productsJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function productsBody(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function productsText(mixed $value, int $limit = 5000): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function productsId(mixed $value): int
{
    $id = filter_var($value, FILTER_VALIDATE_INT);
    return $id === false || $id < 1 ? 0 : (int) $id;
}

function productsNumber(mixed $value, string $label, bool $nullable = false): ?float
{
    if ($nullable && ($value === null || trim((string) $value) === '')) return null;
    if (!is_numeric($value) || (float) $value < 0) throw new InvalidArgumentException($label . ' must be zero or more.');
    return round((float) $value, 2);
}

function productsStatus(mixed $value): string
{
    $status = strtolower(productsText($value, 30));
    if (!in_array($status, ['active', 'draft', 'inactive', 'archived', 'out_of_stock'], true)) {
        throw new InvalidArgumentException('Choose a valid product status.');
    }
    return $status;
}

function productsInput(array $payload): array
{
    $name = productsText($payload['name'] ?? '', 191);
    $slug = strtolower(productsText($payload['slug'] ?? '', 191));
    if ($name === '') throw new InvalidArgumentException('Product name is required.');
    if ($slug !== '' && preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug) !== 1) {
        throw new InvalidArgumentException('Use a lowercase product slug with letters, numbers and hyphens only.');
    }
    return [
        'id' => productsId($payload['id'] ?? 0),
        'draft_id' => productsId($payload['draft_id'] ?? 0),
        'name' => $name,
        'slug' => $slug,
        'sku' => productsText($payload['sku'] ?? '', 191),
        'brand' => productsText($payload['brand'] ?? '', 191),
        'category' => productsText($payload['category'] ?? '', 191),
        'price' => productsNumber($payload['price'] ?? null, 'Price'),
        'compare_price' => productsNumber($payload['compare_price'] ?? null, 'Compare price', true),
        'cost_price' => productsNumber($payload['cost_price'] ?? null, 'Cost price', true),
        'stock' => (int) productsNumber($payload['stock'] ?? null, 'Stock'),
        'low_stock_threshold' => (int) productsNumber($payload['low_stock_threshold'] ?? 10, 'Low-stock threshold'),
        'image' => productsText($payload['image'] ?? '', 2048),
        'short_description' => productsText($payload['short_description'] ?? '', 1000),
        'description' => productsText($payload['description'] ?? '', 30000),
        'status' => productsStatus($payload['status'] ?? 'draft'),
        'featured' => (bool) ($payload['featured'] ?? false),
        'meta_title' => productsText($payload['meta_title'] ?? '', 191),
        'meta_description' => productsText($payload['meta_description'] ?? '', 255),
    ];
}

function productsGetById(PDO $pdo, int $id): ?array
{
    if ($id < 1 || !catalogTableExists($pdo, 'products')) return null;
    $map = catalogProductMap($pdo);
    if ($map['id'] === null) return null;
    $statement = $pdo->prepare(
        'SELECT ' . catalogProductSelect($pdo) .
        ' FROM products p LEFT JOIN product_catalog_meta m ON m.product_id=p.' . catalogIdentifier($map['id']) .
        ' WHERE p.' . catalogIdentifier($map['id']) . '=:id LIMIT 1'
    );
    $statement->execute([':id' => $id]);
    $row = $statement->fetch(PDO::FETCH_ASSOC);
    return $row ? catalogProductPayload($row) : null;
}

function productsDraft(PDO $pdo, int $draftId): ?array
{
    if ($draftId < 1) return null;
    $statement = $pdo->prepare("SELECT * FROM product_catalog_drafts WHERE id=:id AND status='draft' LIMIT 1");
    $statement->execute([':id' => $draftId]);
    $row = $statement->fetch(PDO::FETCH_ASSOC);
    if (!$row) return null;
    $payload = json_decode((string) $row['draft_payload'], true);
    if (!is_array($payload)) return null;
    $payload['draft_id'] = (string) $row['id'];
    $payload['id'] = (string) ($row['product_id'] ?? ($payload['id'] ?? ''));
    return $payload;
}

function productsLatestDraft(PDO $pdo, int $productId): ?array
{
    if ($productId < 1) return null;
    $statement = $pdo->prepare("SELECT id FROM product_catalog_drafts WHERE product_id=:id AND status='draft' ORDER BY updated_at DESC,id DESC LIMIT 1");
    $statement->execute([':id' => $productId]);
    return productsDraft($pdo, (int) $statement->fetchColumn());
}

function productsStatusValue(array $map, string $requested): string
{
    $column = $map['status'];
    if ($column === null) return $requested;
    $type = '';
    foreach ($map['_columns'] as $row) if ((string) $row['Field'] === $column) $type = strtolower((string) $row['Type']);
    if (!str_starts_with($type, 'enum(') && !str_starts_with($type, 'set(')) return $requested;
    preg_match_all("/'([^']+)'/", $type, $matches);
    $allowed = $matches[1] ?? [];
    $candidates = match ($requested) {
        'active' => ['active', 'published', 'live', '1'],
        'inactive' => ['inactive', 'disabled', 'draft', '0'],
        'archived' => ['archived', 'deleted', 'inactive', 'draft', '0'],
        'out_of_stock' => ['out_of_stock', 'inactive', 'draft', '0'],
        default => ['draft', 'inactive', '0'],
    };
    foreach ($candidates as $candidate) if (in_array($candidate, $allowed, true)) return $candidate;
    return $allowed[0] ?? $requested;
}

function productsCanonicalValues(array $input, array $map): array
{
    $source = [
        'name' => $input['name'],
        'slug' => $input['slug'] ?: null,
        'sku' => $input['sku'] ?: null,
        'brand' => $input['brand'] ?: null,
        'category' => $input['category'] ?: null,
        'price' => $input['price'],
        'compare_price' => $input['compare_price'],
        'cost_price' => $input['cost_price'],
        'stock' => $input['stock'],
        'low_stock_threshold' => $input['low_stock_threshold'],
        'image' => $input['image'] ?: null,
        'short_description' => $input['short_description'] ?: null,
        'description' => $input['description'] ?: null,
        'status' => productsStatusValue($map, $input['status']),
        'featured' => $input['featured'] ? 1 : 0,
    ];
    $values = [];
    foreach ($source as $logical => $value) {
        $column = $map[$logical] ?? null;
        if ($column !== null) $values[$column] = $value;
    }
    return $values;
}

function productsApplyCanonical(PDO $pdo, array $input): int
{
    if (!catalogTableExists($pdo, 'products')) throw new RuntimeException('Products table is unavailable.');
    $map = catalogProductMap($pdo);
    if ($map['id'] === null || $map['name'] === null) throw new RuntimeException('Products table adapter is incomplete.');
    $values = productsCanonicalValues($input, $map);
    if ($input['id'] > 0) {
        $sets = [];
        $params = [':catalog_id' => $input['id']];
        foreach ($values as $column => $value) {
            $key = ':catalog_' . count($sets);
            $sets[] = catalogIdentifier($column) . '=' . $key;
            $params[$key] = $value;
        }
        if (!$sets) throw new RuntimeException('No compatible product columns were found.');
        $statement = $pdo->prepare('UPDATE products SET ' . implode(',', $sets) . ' WHERE ' . catalogIdentifier($map['id']) . '=:catalog_id');
        $statement->execute($params);
        $exists = $pdo->prepare('SELECT COUNT(*) FROM products WHERE ' . catalogIdentifier($map['id']) . '=:id');
        $exists->execute([':id' => $input['id']]);
        if ((int) $exists->fetchColumn() === 0) throw new InvalidArgumentException('Product was not found.');
        return $input['id'];
    }
    $columns = array_keys($values);
    $placeholders = [];
    $params = [];
    foreach ($columns as $index => $column) {
        $key = ':catalog_' . $index;
        $placeholders[] = $key;
        $params[$key] = $values[$column];
    }
    $statement = $pdo->prepare(
        'INSERT INTO products (' . implode(',', array_map('catalogIdentifier', $columns)) . ') VALUES (' . implode(',', $placeholders) . ')'
    );
    $statement->execute($params);
    $id = (int) $pdo->lastInsertId();
    if ($id < 1) throw new RuntimeException('The new product identifier was not returned.');
    return $id;
}

function productsUpsertMeta(PDO $pdo, int $productId, array $input): void
{
    $statement = $pdo->prepare(
        'INSERT INTO product_catalog_meta
         (product_id,slug,sku,brand_name,category_name,compare_price,cost_price,low_stock_threshold,image_url,short_description,description,featured,meta_title,meta_description,status_override)
         VALUES (:product_id,:slug,:sku,:brand,:category,:compare_price,:cost_price,:low_stock,:image,:short_description,:description,:featured,:meta_title,:meta_description,:status)
         ON DUPLICATE KEY UPDATE slug=VALUES(slug),sku=VALUES(sku),brand_name=VALUES(brand_name),category_name=VALUES(category_name),
         compare_price=VALUES(compare_price),cost_price=VALUES(cost_price),low_stock_threshold=VALUES(low_stock_threshold),image_url=VALUES(image_url),
         short_description=VALUES(short_description),description=VALUES(description),featured=VALUES(featured),meta_title=VALUES(meta_title),
         meta_description=VALUES(meta_description),status_override=VALUES(status_override)'
    );
    $statement->execute([
        ':product_id' => $productId,
        ':slug' => $input['slug'] ?: null,
        ':sku' => $input['sku'] ?: null,
        ':brand' => $input['brand'] ?: null,
        ':category' => $input['category'] ?: null,
        ':compare_price' => $input['compare_price'],
        ':cost_price' => $input['cost_price'],
        ':low_stock' => $input['low_stock_threshold'],
        ':image' => $input['image'] ?: null,
        ':short_description' => $input['short_description'] ?: null,
        ':description' => $input['description'] ?: null,
        ':featured' => $input['featured'] ? 1 : 0,
        ':meta_title' => $input['meta_title'] ?: null,
        ':meta_description' => $input['meta_description'] ?: null,
        ':status' => $input['status'],
    ]);
}

function productsVersion(PDO $pdo, int $productId, string $action, ?array $before, array $after, string $reason = ''): void
{
    $statement = $pdo->prepare(
        'INSERT INTO product_catalog_versions (product_id,action_name,before_payload,after_payload,actor,reason)
         VALUES (:product_id,:action,:before_payload,:after_payload,:actor,:reason)'
    );
    $statement->execute([
        ':product_id' => $productId,
        ':action' => $action,
        ':before_payload' => $before === null ? null : json_encode($before, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        ':after_payload' => json_encode($after, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        ':actor' => 'Admin',
        ':reason' => $reason ?: null,
    ]);
}

function productsSummary(PDO $pdo, array $products): array
{
    $drafts = (int) $pdo->query("SELECT COUNT(*) FROM product_catalog_drafts WHERE status='draft'")->fetchColumn();
    return [
        'total' => count($products),
        'active' => count(array_filter($products, static fn (array $item): bool => $item['status'] === 'active')),
        'drafts' => $drafts,
        'low_stock' => count(array_filter($products, static fn (array $item): bool => $item['stock'] > 0 && $item['stock'] <= $item['low_stock_threshold'])),
        'out_of_stock' => count(array_filter($products, static fn (array $item): bool => $item['stock'] <= 0)),
    ];
}

try {
    $pdo = getDatabaseConnection();
    ensureProductCatalogSchema($pdo);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $action = productsText($_GET['action'] ?? 'list', 30);
        if ($action === 'get') {
            $id = productsId($_GET['id'] ?? 0);
            $product = productsGetById($pdo, $id);
            if ($product === null) productsJson(404, ['success' => false, 'message' => 'Product was not found.']);
            productsJson(200, ['success' => true, 'product' => $product, 'draft' => productsLatestDraft($pdo, $id)]);
        }
        if ($action === 'draft') {
            $draft = productsDraft($pdo, productsId($_GET['draft_id'] ?? 0));
            if ($draft === null) productsJson(404, ['success' => false, 'message' => 'Product draft was not found.']);
            productsJson(200, ['success' => true, 'draft' => $draft]);
        }
        $products = catalogProductRows($pdo);
        productsJson(200, ['success' => true, 'products' => $products, 'summary' => productsSummary($pdo, $products), 'generated_at' => date(DATE_ATOM)]);
    }

    if ($method !== 'POST') productsJson(405, ['success' => false, 'message' => 'Only GET and POST requests are allowed.']);
    $payload = productsBody();
    $action = productsText($payload['action'] ?? 'save_draft', 30);

    if ($action === 'save_draft') {
        $input = productsInput($payload);
        if ($input['id'] > 0 && productsGetById($pdo, $input['id']) === null) throw new InvalidArgumentException('Product was not found.');
        $encoded = json_encode($input, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($input['draft_id'] > 0) {
            $statement = $pdo->prepare("UPDATE product_catalog_drafts SET product_id=:product_id,draft_payload=:payload WHERE id=:id AND status='draft'");
            $statement->execute([':product_id' => $input['id'] ?: null, ':payload' => $encoded, ':id' => $input['draft_id']]);
            if ($statement->rowCount() === 0 && productsDraft($pdo, $input['draft_id']) === null) throw new InvalidArgumentException('Product draft was not found.');
            $draftId = $input['draft_id'];
        } else {
            $statement = $pdo->prepare('INSERT INTO product_catalog_drafts (product_id,draft_payload) VALUES (:product_id,:payload)');
            $statement->execute([':product_id' => $input['id'] ?: null, ':payload' => $encoded]);
            $draftId = (int) $pdo->lastInsertId();
        }
        productsJson(200, ['success' => true, 'message' => 'Product draft saved in MySQL. Live catalog was not changed.', 'draft_id' => (string) $draftId, 'draft' => productsDraft($pdo, $draftId)]);
    }

    if ($action === 'discard_draft') {
        $draftId = productsId($payload['draft_id'] ?? 0);
        if (productsText($payload['confirm'] ?? '', 20) !== 'discard') throw new InvalidArgumentException('Draft discard confirmation is required.');
        $statement = $pdo->prepare("UPDATE product_catalog_drafts SET status='discarded' WHERE id=:id AND status='draft'");
        $statement->execute([':id' => $draftId]);
        if ($statement->rowCount() === 0) throw new InvalidArgumentException('Product draft was not found.');
        productsJson(200, ['success' => true, 'message' => 'Product draft discarded. Live product was not changed.']);
    }

    if ($action === 'archive') {
        if (productsText($payload['confirm'] ?? '', 20) !== 'archive') throw new InvalidArgumentException('Archive confirmation is required.');
        $reason = productsText($payload['reason'] ?? '', 500);
        if ($reason === '') throw new InvalidArgumentException('Add an archive reason.');
        $id = productsId($payload['id'] ?? 0);
        $before = productsGetById($pdo, $id);
        if ($before === null) throw new InvalidArgumentException('Product was not found.');
        $input = productsInput(array_merge($before, ['id' => $id, 'status' => 'archived']));
        $pdo->beginTransaction();
        productsApplyCanonical($pdo, $input);
        productsUpsertMeta($pdo, $id, $input);
        $after = productsGetById($pdo, $id) ?? array_merge($input, ['id' => (string) $id]);
        productsVersion($pdo, $id, 'archive', $before, $after, $reason);
        $pdo->commit();
        productsJson(200, ['success' => true, 'message' => 'Product archived safely. Orders and history were preserved.', 'product' => $after]);
    }

    if ($action !== 'publish') throw new InvalidArgumentException('Unknown product action.');
    if (productsText($payload['confirm'] ?? '', 20) !== 'publish') throw new InvalidArgumentException('Publication confirmation is required.');
    $draftId = productsId($payload['draft_id'] ?? 0);
    $draft = productsDraft($pdo, $draftId);
    if ($draft === null) throw new InvalidArgumentException('Product draft was not found.');
    $input = productsInput($draft);
    $before = $input['id'] > 0 ? productsGetById($pdo, $input['id']) : null;
    $reason = productsText($payload['reason'] ?? '', 500);
    $pdo->beginTransaction();
    $productId = productsApplyCanonical($pdo, $input);
    $input['id'] = $productId;
    productsUpsertMeta($pdo, $productId, $input);
    $after = productsGetById($pdo, $productId) ?? array_merge($input, ['id' => (string) $productId]);
    productsVersion($pdo, $productId, $before === null ? 'create' : 'publish', $before, $after, $reason);
    $statement = $pdo->prepare("UPDATE product_catalog_drafts SET status='published',published_product_id=:product_id,published_at=CURRENT_TIMESTAMP WHERE id=:id AND status='draft'");
    $statement->execute([':product_id' => $productId, ':id' => $draftId]);
    $pdo->commit();
    productsJson(200, ['success' => true, 'message' => $before === null ? 'Product created and published.' : 'Product changes published.', 'product' => $after]);
} catch (InvalidArgumentException $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    productsJson(422, ['success' => false, 'message' => $error->getMessage()]);
} catch (PDOException $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('manage_products.php: ' . $error->getMessage());
    $duplicate = (string) $error->getCode() === '23000';
    productsJson($duplicate ? 409 : 500, ['success' => false, 'message' => $duplicate ? 'That SKU or product slug is already in use.' : 'Product catalog could not be updated. Existing data was not removed.']);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('manage_products.php: ' . $error->getMessage());
    productsJson(500, ['success' => false, 'message' => 'Product catalog could not be updated. Existing data was not removed.']);
}
