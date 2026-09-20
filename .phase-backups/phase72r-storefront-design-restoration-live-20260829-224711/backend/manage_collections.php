<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/collection_schema.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$localOrigin = preg_match('/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/', $origin) === 1;
if ($localOrigin) {
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

function collectionsJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function collectionsPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function collectionsText(mixed $value, int $limit = 2048): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function collectionsId(mixed $value): int
{
    $id = filter_var($value, FILTER_VALIDATE_INT);
    return $id === false || $id < 1 ? 0 : (int) $id;
}

function collectionsStatus(mixed $value, bool $allowDeleted = false): string
{
    $status = strtolower(collectionsText($value, 20));
    $allowed = $allowDeleted ? ['active', 'inactive', 'draft', 'deleted'] : ['active', 'inactive', 'draft'];
    if (!in_array($status, $allowed, true)) throw new InvalidArgumentException('Choose a valid collection status.');
    return $status;
}

function collectionSummaryRows(PDO $pdo, bool $includeDeleted): array
{
    $where = $includeDeleted ? '1=1' : "c.status <> 'deleted'";
    $statement = $pdo->query(
        "SELECT c.id,c.title,c.slug,c.eyebrow_label,c.status,c.sort_order,c.desktop_image_url,c.mobile_image_url,c.updated_at,
                COUNT(cp.id) AS product_count
         FROM collections c LEFT JOIN collection_products cp ON cp.collection_id=c.id
         WHERE {$where}
         GROUP BY c.id,c.title,c.slug,c.eyebrow_label,c.status,c.sort_order,c.desktop_image_url,c.mobile_image_url,c.updated_at
         ORDER BY c.sort_order ASC,c.id ASC"
    );
    return $statement->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

function collectionDetail(PDO $pdo, int $id): ?array
{
    $statement = $pdo->prepare('SELECT * FROM collections WHERE id=:id LIMIT 1');
    $statement->execute([':id' => $id]);
    $collection = $statement->fetch(PDO::FETCH_ASSOC);
    if (!$collection) return null;
    $products = $pdo->prepare('SELECT product_id,sort_order FROM collection_products WHERE collection_id=:id ORDER BY sort_order,id');
    $products->execute([':id' => $id]);
    $rows = $products->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $collection['product_ids'] = array_map(static fn (array $row): string => (string) $row['product_id'], $rows);
    $collection['products'] = $rows;
    return $collection;
}

function validateCollectionInput(array $payload): array
{
    $title = collectionsText($payload['title'] ?? '', 191);
    $slug = strtolower(collectionsText($payload['slug'] ?? '', 191));
    if ($title === '') throw new InvalidArgumentException('Collection title is required.');
    if ($slug === '' || preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug) !== 1) {
        throw new InvalidArgumentException('Use a lowercase collection slug with letters, numbers and hyphens only.');
    }
    $productIds = [];
    foreach (is_array($payload['product_ids'] ?? null) ? $payload['product_ids'] : [] as $value) {
        $id = collectionsId($value);
        if ($id > 0 && !in_array($id, $productIds, true)) $productIds[] = $id;
    }
    return [
        'id' => collectionsId($payload['id'] ?? 0),
        'title' => $title,
        'slug' => $slug,
        'eyebrow_label' => collectionsText($payload['eyebrow_label'] ?? '', 120),
        'description' => collectionsText($payload['description'] ?? '', 5000),
        'desktop_image_url' => collectionsText($payload['desktop_image_url'] ?? '', 2048),
        'mobile_image_url' => collectionsText($payload['mobile_image_url'] ?? '', 2048),
        'status' => collectionsStatus($payload['status'] ?? 'draft'),
        'sort_order' => max(0, min(100000, (int) ($payload['sort_order'] ?? 0))),
        'seo_title' => collectionsText($payload['seo_title'] ?? '', 191),
        'seo_description' => collectionsText($payload['seo_description'] ?? '', 255),
        'product_ids' => array_slice($productIds, 0, 200),
    ];
}

try {
    $pdo = getDatabaseConnection();
    ensureCollectionSchema($pdo);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $action = collectionsText($_GET['action'] ?? 'list', 40);
        if ($action === 'get') {
            $detail = collectionDetail($pdo, collectionsId($_GET['id'] ?? 0));
            if ($detail === null) collectionsJson(404, ['success' => false, 'message' => 'Collection was not found.']);
            collectionsJson(200, ['success' => true, 'collection' => $detail]);
        }
        $includeDeleted = (string) ($_GET['include_deleted'] ?? '') === '1';
        collectionsJson(200, ['success' => true, 'collections' => collectionSummaryRows($pdo, $includeDeleted)]);
    }

    if ($method !== 'POST') collectionsJson(405, ['success' => false, 'message' => 'Only GET and POST requests are allowed.']);
    $payload = collectionsPayload();
    $action = collectionsText($payload['action'] ?? 'save', 40);

    if ($action === 'status') {
        $id = collectionsId($payload['id'] ?? 0);
        $status = collectionsStatus($payload['status'] ?? 'draft');
        $statement = $pdo->prepare("UPDATE collections SET status=:status WHERE id=:id AND status<>'deleted'");
        $statement->execute([':status' => $status, ':id' => $id]);
        if ($statement->rowCount() === 0) collectionsJson(404, ['success' => false, 'message' => 'Collection was not found or is deleted.']);
        collectionsJson(200, ['success' => true, 'message' => 'Collection status updated.', 'collections' => collectionSummaryRows($pdo, true)]);
    }

    if ($action === 'delete' || $action === 'restore') {
        $id = collectionsId($payload['id'] ?? 0);
        if ($action === 'delete' && collectionsText($payload['confirm'] ?? '', 20) !== 'delete') {
            throw new InvalidArgumentException('Deletion confirmation is required.');
        }
        $status = $action === 'delete' ? 'deleted' : 'draft';
        $statement = $pdo->prepare('UPDATE collections SET status=:status WHERE id=:id');
        $statement->execute([':status' => $status, ':id' => $id]);
        if ($statement->rowCount() === 0) collectionsJson(404, ['success' => false, 'message' => 'Collection was not found.']);
        collectionsJson(200, ['success' => true, 'message' => $action === 'delete' ? 'Collection deleted safely. Products were not changed.' : 'Collection restored as draft.']);
    }

    if ($action === 'reorder') {
        $order = is_array($payload['order'] ?? null) ? $payload['order'] : [];
        $pdo->beginTransaction();
        $statement = $pdo->prepare("UPDATE collections SET sort_order=:sort_order WHERE id=:id AND status<>'deleted'");
        foreach (array_values($order) as $index => $value) {
            $id = collectionsId($value);
            if ($id > 0) $statement->execute([':sort_order' => $index + 1, ':id' => $id]);
        }
        $pdo->commit();
        collectionsJson(200, ['success' => true, 'message' => 'Collection order saved. Homepage Editor’s Picks follows this active order.']);
    }

    if ($action !== 'save') throw new InvalidArgumentException('Unknown collection action.');
    $input = validateCollectionInput($payload);
    if (!collectionTableExists($pdo, 'products')) throw new RuntimeException('Products table is unavailable.');
    if ($input['product_ids']) {
        $projection = collectionProductProjection($pdo);
        if ($projection['id'] === null) throw new RuntimeException('Product identifiers are unavailable.');
        $placeholders = implode(',', array_fill(0, count($input['product_ids']), '?'));
        $statement = $pdo->prepare('SELECT COUNT(*) FROM products WHERE `' . str_replace('`', '``', $projection['id']) . '` IN (' . $placeholders . ')');
        $statement->execute($input['product_ids']);
        if ((int) $statement->fetchColumn() !== count($input['product_ids'])) throw new InvalidArgumentException('One or more selected products no longer exist.');
    }

    $pdo->beginTransaction();
    if ($input['id'] > 0) {
        $statement = $pdo->prepare(
            'UPDATE collections SET title=:title,slug=:slug,eyebrow_label=:eyebrow,description=:description,
             desktop_image_url=:desktop,mobile_image_url=:mobile,status=:status,sort_order=:sort_order,
             seo_title=:seo_title,seo_description=:seo_description WHERE id=:id'
        );
        $statement->execute([
            ':title'=>$input['title'], ':slug'=>$input['slug'], ':eyebrow'=>$input['eyebrow_label'], ':description'=>$input['description'],
            ':desktop'=>$input['desktop_image_url'], ':mobile'=>$input['mobile_image_url'], ':status'=>$input['status'], ':sort_order'=>$input['sort_order'],
            ':seo_title'=>$input['seo_title'], ':seo_description'=>$input['seo_description'], ':id'=>$input['id'],
        ]);
        $collectionId = $input['id'];
        $exists = $pdo->prepare('SELECT COUNT(*) FROM collections WHERE id=:id');
        $exists->execute([':id'=>$collectionId]);
        if ((int)$exists->fetchColumn()===0) throw new InvalidArgumentException('Collection was not found.');
    } else {
        $statement = $pdo->prepare(
            'INSERT INTO collections (title,slug,eyebrow_label,description,desktop_image_url,mobile_image_url,status,sort_order,seo_title,seo_description)
             VALUES (:title,:slug,:eyebrow,:description,:desktop,:mobile,:status,:sort_order,:seo_title,:seo_description)'
        );
        $statement->execute([
            ':title'=>$input['title'], ':slug'=>$input['slug'], ':eyebrow'=>$input['eyebrow_label'], ':description'=>$input['description'],
            ':desktop'=>$input['desktop_image_url'], ':mobile'=>$input['mobile_image_url'], ':status'=>$input['status'], ':sort_order'=>$input['sort_order'],
            ':seo_title'=>$input['seo_title'], ':seo_description'=>$input['seo_description'],
        ]);
        $collectionId = (int) $pdo->lastInsertId();
    }
    $delete = $pdo->prepare('DELETE FROM collection_products WHERE collection_id=:id');
    $delete->execute([':id'=>$collectionId]);
    $insert = $pdo->prepare('INSERT INTO collection_products (collection_id,product_id,sort_order) VALUES (:collection_id,:product_id,:sort_order)');
    foreach ($input['product_ids'] as $index => $productId) {
        $insert->execute([':collection_id'=>$collectionId, ':product_id'=>$productId, ':sort_order'=>$index+1]);
    }
    $pdo->commit();
    collectionsJson(200, ['success'=>true, 'message'=>'Collection saved in MySQL.', 'collection'=>collectionDetail($pdo, $collectionId)]);
} catch (InvalidArgumentException $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    collectionsJson(422, ['success'=>false, 'message'=>$error->getMessage()]);
} catch (PDOException $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('manage_collections.php: ' . $error->getMessage());
    $duplicate = (string)$error->getCode() === '23000';
    collectionsJson($duplicate ? 409 : 500, ['success'=>false, 'message'=>$duplicate ? 'That collection slug is already in use.' : 'Collections could not be updated right now.']);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('manage_collections.php: ' . $error->getMessage());
    collectionsJson(500, ['success'=>false, 'message'=>'Collections could not be updated right now.']);
}
