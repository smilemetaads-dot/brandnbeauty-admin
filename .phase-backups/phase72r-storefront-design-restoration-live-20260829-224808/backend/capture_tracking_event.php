<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) === 1 || preg_match('/^https:\/\/(www\.)?brandnbeauty\.com$/', $origin) === 1) {
    header('Access-Control-Allow-Origin: ' . $origin); header('Vary: Origin');
}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

function captureJson(int $status, array $payload): never
{
    http_response_code($status); echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); exit;
}

function captureText(mixed $value, int $limit): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function containsForbiddenPii(array $value): bool
{
    $forbidden = ['email','phone','mobile','address','customer_name','first_name','last_name','full_name','password','access_token'];
    foreach ($value as $key => $item) {
        if (in_array(strtolower((string) $key), $forbidden, true)) return true;
        if (is_array($item) && containsForbiddenPii($item)) return true;
    }
    return false;
}

function ensureCaptureLedger(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS tracking_event_ledger (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, event_id VARCHAR(191) NOT NULL,
        event_name VARCHAR(80) NOT NULL, event_source ENUM('browser','server','test') NOT NULL,
        destination ENUM('internal','ga4','meta','both') NOT NULL DEFAULT 'internal',
        environment ENUM('production','staging') NOT NULL DEFAULT 'production',
        page_location VARCHAR(1000) NOT NULL DEFAULT '', session_key_hash CHAR(64) NULL,
        order_reference_hash CHAR(64) NULL, payload_json LONGTEXT NOT NULL,
        payload_hash CHAR(64) NOT NULL, schema_valid TINYINT(1) NOT NULL DEFAULT 1,
        validation_error VARCHAR(500) NULL, duplicate_count INT UNSIGNED NOT NULL DEFAULT 0,
        received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_tracking_delivery (event_id,event_name,event_source,destination,environment),
        KEY idx_tracking_event_date (event_name,received_at), KEY idx_tracking_environment_date (environment,received_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') captureJson(405, ['success' => false, 'message' => 'Method not allowed.']);
$raw = file_get_contents('php://input') ?: '';
if (strlen($raw) > 32768) captureJson(413, ['success' => false, 'message' => 'Event payload is too large.']);
$payload = json_decode($raw, true);
if (!is_array($payload)) captureJson(400, ['success' => false, 'message' => 'A valid JSON event is required.']);
if (containsForbiddenPii($payload)) captureJson(422, ['success' => false, 'message' => 'Raw customer identity is not accepted by this collector.']);

$allowed = ['page_view','view_item','add_to_cart','begin_checkout','purchase','order_delivered','qualified_message'];
$eventId = captureText($payload['event_id'] ?? '', 191); $eventName = strtolower(captureText($payload['event_name'] ?? '', 80));
$source = strtolower(captureText($payload['event_source'] ?? 'browser', 20)); $destination = strtolower(captureText($payload['destination'] ?? 'internal', 20)); $environment = strtolower(captureText($payload['environment'] ?? 'production', 20));
$data = is_array($payload['data'] ?? null) ? $payload['data'] : [];
if (preg_match('/^[A-Za-z0-9._:-]{8,191}$/', $eventId) !== 1 || !in_array($eventName, $allowed, true)) captureJson(422, ['success' => false, 'message' => 'A supported event_name and stable event_id are required.']);
if (!in_array($source, ['browser','server'], true) || !in_array($destination, ['internal','ga4','meta','both'], true) || !in_array($environment, ['production','staging'], true)) captureJson(422, ['success' => false, 'message' => 'Event source, destination or environment is invalid.']);
$required = ['page_view' => [], 'view_item' => ['items'], 'add_to_cart' => ['currency','value','items'], 'begin_checkout' => ['currency','value','items'], 'purchase' => ['currency','value','items'], 'order_delivered' => ['currency','value'], 'qualified_message' => ['channel']];
$missing = [];
foreach ($required[$eventName] as $key) if (!array_key_exists($key, $data)) $missing[] = $key;
$pageLocation = captureText($payload['page_location'] ?? '', 1000);
if ($eventName === 'page_view' && $pageLocation === '') $missing[] = 'page_location';
if (in_array('currency', $required[$eventName], true) && preg_match('/^[A-Z]{3}$/', strtoupper(captureText($data['currency'] ?? '', 3))) !== 1) $missing[] = 'valid currency';
if (in_array('value', $required[$eventName], true) && (!is_numeric($data['value'] ?? null) || (float) $data['value'] < 0)) $missing[] = 'valid value';
if (in_array('items', $required[$eventName], true)) {
    $items = is_array($data['items'] ?? null) ? $data['items'] : [];
    if ($items === []) $missing[] = 'items[].item_id';
    foreach ($items as $item) if (!is_array($item) || captureText($item['item_id'] ?? '', 191) === '') { $missing[] = 'items[].item_id'; break; }
}
if ($eventName === 'qualified_message' && captureText($data['channel'] ?? '', 80) === '') $missing[] = 'channel';
$missing = array_values(array_unique($missing));
$schemaValid = count($missing) === 0; $validationError = $schemaValid ? null : 'Missing: ' . implode(', ', $missing);
$dataJson = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '{}';

try {
    $pdo = getDatabaseConnection(); ensureCaptureLedger($pdo);
    $query = $pdo->prepare("INSERT INTO tracking_event_ledger (event_id,event_name,event_source,destination,environment,page_location,session_key_hash,order_reference_hash,payload_json,payload_hash,schema_valid,validation_error)
        VALUES (:event_id,:event_name,:event_source,:destination,:environment,:page_location,:session_key_hash,:order_reference_hash,:payload_json,:payload_hash,:schema_valid,:validation_error)
        ON DUPLICATE KEY UPDATE duplicate_count=duplicate_count+1,last_seen_at=CURRENT_TIMESTAMP");
    $query->execute([':event_id' => $eventId, ':event_name' => $eventName, ':event_source' => $source, ':destination' => $destination, ':environment' => $environment,
        ':page_location' => $pageLocation, ':session_key_hash' => ($session = captureText($payload['session_key'] ?? '', 191)) === '' ? null : hash('sha256', $session),
        ':order_reference_hash' => ($order = captureText($payload['order_reference'] ?? '', 191)) === '' ? null : hash('sha256', $order),
        ':payload_json' => $dataJson, ':payload_hash' => hash('sha256', $dataJson), ':schema_valid' => $schemaValid ? 1 : 0, ':validation_error' => $validationError]);
    captureJson($schemaValid ? 202 : 422, ['success' => $schemaValid, 'accepted' => true, 'duplicate' => $query->rowCount() === 2, 'schema_valid' => $schemaValid, 'missing' => $missing]);
} catch (Throwable $error) {
    error_log('Tracking capture error: ' . $error->getMessage());
    captureJson(503, ['success' => false, 'message' => 'The event ledger is temporarily unavailable.']);
}
