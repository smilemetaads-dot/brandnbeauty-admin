<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedLocalOrigin = preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) === 1;

if ($allowedLocalOrigin) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

requireAdminAuth();

function sendSupplierJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function supplierTableExists(PDO $pdo, string $tableName): bool
{
    $statement = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table_name'
    );
    $statement->execute([':table_name' => $tableName]);

    return (int) $statement->fetchColumn() > 0;
}

function supplierTableColumns(PDO $pdo, string $tableName): array
{
    if (!supplierTableExists($pdo, $tableName)) {
        return [];
    }

    $statement = $pdo->prepare(
        'SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table_name'
    );
    $statement->execute([':table_name' => $tableName]);

    return array_fill_keys(array_map('strval', $statement->fetchAll(PDO::FETCH_COLUMN)), true);
}

function ensureSuppliersTable(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS suppliers (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(190) NOT NULL,
            contact_person VARCHAR(190) NULL,
            phone VARCHAR(50) NULL,
            email VARCHAR(190) NULL,
            address TEXT NULL,
            supplier_type VARCHAR(100) NULL,
            payment_terms VARCHAR(100) NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'active',
            notes TEXT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_suppliers_phone (phone),
            INDEX idx_suppliers_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function firstSupplierColumn(array $columns, array $candidates): ?string
{
    foreach ($candidates as $candidate) {
        if (isset($columns[$candidate])) {
            return $candidate;
        }
    }

    return null;
}

function supplierSelectExpression(array $columns, array $candidates, string $alias, string $fallback = 'NULL'): string
{
    $column = firstSupplierColumn($columns, $candidates);

    return ($column === null ? $fallback : '`' . $column . '`') . ' AS `' . $alias . '`';
}

function supplierNumber(mixed $value): float
{
    return is_numeric($value) ? (float) $value : 0.0;
}

function supplierBoolean(mixed $value): bool
{
    return in_array(strtolower(trim((string) $value)), ['1', 'true', 'yes', 'received'], true);
}

function loadSupplierPurchaseData(PDO $pdo): array
{
    $tableName = supplierTableExists($pdo, 'purchase_entries')
        ? 'purchase_entries'
        : (supplierTableExists($pdo, 'purchases') ? 'purchases' : null);

    if ($tableName === null) {
        return ['recent' => [], 'summary' => []];
    }

    $columns = supplierTableColumns($pdo, $tableName);
    $supplierIdColumn = firstSupplierColumn($columns, ['supplier_id']);

    if ($supplierIdColumn === null) {
        return ['recent' => [], 'summary' => []];
    }

    $fields = [
        supplierSelectExpression($columns, ['id'], 'purchase_id', '0'),
        supplierSelectExpression($columns, ['purchase_number', 'reference_number'], 'purchase_number', "'Recorded purchase'"),
        supplierSelectExpression($columns, ['supplier_id'], 'supplier_id', 'NULL'),
        supplierSelectExpression($columns, ['purchase_status', 'status'], 'purchase_status', "'recorded'"),
        supplierSelectExpression($columns, ['total_cost', 'total_amount', 'grand_total'], 'total_cost', '0'),
        supplierSelectExpression($columns, ['stock_received'], 'stock_received', '0'),
        supplierSelectExpression($columns, ['created_at', 'purchase_date'], 'purchase_created_at', 'NULL'),
    ];
    $createdAtColumn = firstSupplierColumn($columns, ['created_at', 'purchase_date']);
    $orderBy = $createdAtColumn === null ? '' : ' ORDER BY `' . $createdAtColumn . '` DESC';
    $rows = $pdo->query(
        'SELECT ' . implode(', ', $fields) . ' FROM `' . $tableName . '`' . $orderBy . ' LIMIT 2000'
    )->fetchAll();
    $recent = [];
    $summary = [];

    foreach ($rows as $row) {
        $supplierId = trim((string) ($row['supplier_id'] ?? ''));
        if ($supplierId === '') {
            continue;
        }

        $status = strtolower(trim((string) ($row['purchase_status'] ?? 'recorded')));
        $received = $status === 'received' || supplierBoolean($row['stock_received'] ?? false);
        $cancelled = $status === 'cancelled';
        $value = supplierNumber($row['total_cost'] ?? 0);
        $current = $summary[$supplierId] ?? [
            'cancelled_purchase_count' => 0,
            'pending_purchase_count' => 0,
            'pending_purchase_value' => 0.0,
            'purchase_count' => 0,
            'received_purchase_count' => 0,
            'received_purchase_value' => 0.0,
            'total_purchase_value' => 0.0,
        ];
        $current['purchase_count']++;
        $current['total_purchase_value'] += $value;
        $current['cancelled_purchase_count'] += $cancelled ? 1 : 0;
        $current['received_purchase_count'] += $received ? 1 : 0;
        $current['received_purchase_value'] += $received ? $value : 0;
        $pending = !$received && !$cancelled;
        $current['pending_purchase_count'] += $pending ? 1 : 0;
        $current['pending_purchase_value'] += $pending ? $value : 0;
        $summary[$supplierId] = $current;

        if (count($recent[$supplierId] ?? []) < 12) {
            $recent[$supplierId][] = [
                'id' => (string) ($row['purchase_id'] ?? ''),
                'purchase_number' => (string) ($row['purchase_number'] ?? 'Recorded purchase'),
                'purchase_status' => $status ?: 'recorded',
                'stock_received' => $received,
                'total_cost' => round($value, 2),
                'created_at' => $row['purchase_created_at'] ?? null,
            ];
        }
    }

    return ['recent' => $recent, 'summary' => $summary];
}

function loadSuppliers(PDO $pdo): array
{
    $columns = supplierTableColumns($pdo, 'suppliers');
    if (!isset($columns['id']) || firstSupplierColumn($columns, ['name', 'supplier_name']) === null) {
        return [];
    }

    $fields = [
        supplierSelectExpression($columns, ['id'], 'id'),
        supplierSelectExpression($columns, ['name', 'supplier_name'], 'name', "'Unnamed Supplier'"),
        supplierSelectExpression($columns, ['contact_person', 'contact_name'], 'contact_person'),
        supplierSelectExpression($columns, ['phone', 'mobile'], 'phone'),
        supplierSelectExpression($columns, ['email'], 'email'),
        supplierSelectExpression($columns, ['address'], 'address'),
        supplierSelectExpression($columns, ['supplier_type', 'type'], 'supplier_type'),
        supplierSelectExpression($columns, ['payment_terms'], 'payment_terms'),
        supplierSelectExpression($columns, ['status'], 'status', "'active'"),
        supplierSelectExpression($columns, ['notes', 'note'], 'notes'),
        supplierSelectExpression($columns, ['created_at'], 'created_at'),
        supplierSelectExpression($columns, ['updated_at'], 'updated_at'),
    ];
    $createdAtColumn = firstSupplierColumn($columns, ['created_at', 'updated_at']);
    $orderBy = $createdAtColumn === null ? ' ORDER BY `id` DESC' : ' ORDER BY `' . $createdAtColumn . '` DESC, `id` DESC';
    $rows = $pdo->query('SELECT ' . implode(', ', $fields) . ' FROM suppliers' . $orderBy)->fetchAll();
    $purchaseData = loadSupplierPurchaseData($pdo);

    return array_map(static function (array $row) use ($purchaseData): array {
        $id = (string) ($row['id'] ?? '');
        $summary = $purchaseData['summary'][$id] ?? [
            'cancelled_purchase_count' => 0,
            'pending_purchase_count' => 0,
            'pending_purchase_value' => 0,
            'purchase_count' => 0,
            'received_purchase_count' => 0,
            'received_purchase_value' => 0,
            'total_purchase_value' => 0,
        ];

        return array_merge([
            'id' => $id,
            'name' => trim((string) ($row['name'] ?? '')) ?: 'Unnamed Supplier',
            'contact_person' => $row['contact_person'] ?? null,
            'phone' => $row['phone'] ?? null,
            'email' => $row['email'] ?? null,
            'address' => $row['address'] ?? null,
            'supplier_type' => $row['supplier_type'] ?? null,
            'payment_terms' => $row['payment_terms'] ?? null,
            'status' => strtolower(trim((string) ($row['status'] ?? 'active'))) ?: 'active',
            'notes' => $row['notes'] ?? null,
            'created_at' => $row['created_at'] ?? null,
            'updated_at' => $row['updated_at'] ?? $row['created_at'] ?? null,
            'recent_purchases' => $purchaseData['recent'][$id] ?? [],
        ], array_map(static fn (mixed $value): int|float => is_float($value) ? round($value, 2) : $value, $summary));
    }, $rows);
}

function readSupplierPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);

    return is_array($payload) ? $payload : [];
}

function cleanSupplierValue(mixed $value, int $maxLength = 1000): ?string
{
    $cleaned = trim(is_scalar($value) ? (string) $value : '');
    if ($cleaned === '') {
        return null;
    }

    return function_exists('mb_substr')
        ? mb_substr($cleaned, 0, $maxLength)
        : substr($cleaned, 0, $maxLength);
}

function saveSupplier(PDO $pdo, array $payload, ?int $supplierId): array
{
    $columns = supplierTableColumns($pdo, 'suppliers');
    $name = cleanSupplierValue($payload['name'] ?? $payload['supplier_name'] ?? null, 190);

    if ($name === null) {
        sendSupplierJson(400, ['success' => false, 'message' => 'Supplier name is required.']);
    }

    $status = strtolower(cleanSupplierValue($payload['status'] ?? 'active', 30) ?? 'active');
    if (!in_array($status, ['active', 'inactive'], true)) {
        sendSupplierJson(400, ['success' => false, 'message' => 'Supplier status must be active or inactive.']);
    }

    $canonicalValues = [
        'name' => $name,
        'contact_person' => cleanSupplierValue($payload['contact_person'] ?? $payload['contact_name'] ?? null, 190),
        'phone' => cleanSupplierValue($payload['phone'] ?? $payload['mobile'] ?? null, 50),
        'email' => cleanSupplierValue($payload['email'] ?? null, 190),
        'address' => cleanSupplierValue($payload['address'] ?? null, 2000),
        'supplier_type' => cleanSupplierValue($payload['supplier_type'] ?? $payload['type'] ?? null, 100),
        'payment_terms' => cleanSupplierValue($payload['payment_terms'] ?? null, 100),
        'status' => $status,
        'notes' => cleanSupplierValue($payload['notes'] ?? $payload['note'] ?? null, 3000),
    ];
    $columnCandidates = [
        'name' => ['name', 'supplier_name'],
        'contact_person' => ['contact_person', 'contact_name'],
        'phone' => ['phone', 'mobile'],
        'email' => ['email'],
        'address' => ['address'],
        'supplier_type' => ['supplier_type', 'type'],
        'payment_terms' => ['payment_terms'],
        'status' => ['status'],
        'notes' => ['notes', 'note'],
    ];
    $values = [];
    foreach ($columnCandidates as $field => $candidates) {
        $column = firstSupplierColumn($columns, $candidates);
        if ($column !== null) {
            $values[$column] = $canonicalValues[$field];
        }
    }

    if (firstSupplierColumn($columns, ['name', 'supplier_name']) === null) {
        sendSupplierJson(500, ['success' => false, 'message' => 'The suppliers table has no compatible name column.']);
    }

    if ($supplierId === null) {
        $columnList = array_keys($values);
        $placeholders = array_map(static fn (string $column): string => ':' . $column, $columnList);
        $statement = $pdo->prepare(
            'INSERT INTO suppliers (`' . implode('`, `', $columnList) . '`) VALUES (' . implode(', ', $placeholders) . ')'
        );
        $parameters = [];
        foreach ($values as $column => $value) {
            $parameters[':' . $column] = $value;
        }
        $statement->execute($parameters);
        $supplierId = (int) $pdo->lastInsertId();
    } else {
        $assignments = array_map(static fn (string $column): string => '`' . $column . '` = :' . $column, array_keys($values));
        $statement = $pdo->prepare('UPDATE suppliers SET ' . implode(', ', $assignments) . ' WHERE id = :supplier_id');
        $parameters = [':supplier_id' => $supplierId];
        foreach ($values as $column => $value) {
            $parameters[':' . $column] = $value;
        }
        $statement->execute($parameters);

        if ($statement->rowCount() === 0) {
            $check = $pdo->prepare('SELECT COUNT(*) FROM suppliers WHERE id = :supplier_id');
            $check->execute([':supplier_id' => $supplierId]);
            if ((int) $check->fetchColumn() === 0) {
                sendSupplierJson(404, ['success' => false, 'message' => 'Supplier was not found.']);
            }
        }
    }

    foreach (loadSuppliers($pdo) as $supplier) {
        if ((int) $supplier['id'] === $supplierId) {
            return $supplier;
        }
    }

    sendSupplierJson(500, ['success' => false, 'message' => 'Supplier was saved but could not be reloaded.']);
}

try {
    $pdo = getDatabaseConnection();
    ensureSuppliersTable($pdo);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        sendSupplierJson(200, ['success' => true, 'suppliers' => loadSuppliers($pdo)]);
    }

    if (!in_array($method, ['POST', 'PUT'], true)) {
        sendSupplierJson(405, ['success' => false, 'message' => 'Only GET, POST, and PUT requests are allowed.']);
    }

    $payload = readSupplierPayload();
    $supplierId = null;
    if ($method === 'PUT') {
        $rawId = trim((string) ($payload['id'] ?? $payload['supplier_id'] ?? ''));
        if (!preg_match('/^[1-9]\d*$/', $rawId)) {
            sendSupplierJson(400, ['success' => false, 'message' => 'A valid supplier id is required.']);
        }
        $supplierId = (int) $rawId;
    }

    $supplier = saveSupplier($pdo, $payload, $supplierId);
    sendSupplierJson($method === 'POST' ? 201 : 200, [
        'success' => true,
        'message' => $method === 'POST' ? 'Supplier created successfully.' : 'Supplier updated successfully.',
        'supplier' => $supplier,
    ]);
} catch (Throwable $exception) {
    error_log('Supplier request failed: ' . $exception->getMessage());
    sendSupplierJson(500, ['success' => false, 'message' => 'Supplier request could not be completed right now.']);
}
