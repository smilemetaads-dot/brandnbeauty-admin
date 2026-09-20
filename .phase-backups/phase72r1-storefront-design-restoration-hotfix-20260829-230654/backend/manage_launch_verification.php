<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/launch_verification_common.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) === 1) { header('Access-Control-Allow-Origin: ' . $origin); header('Vary: Origin'); }
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token');
header('X-Content-Type-Options: nosniff'); header('Cache-Control: no-store');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

function launchJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

requireAdminAuth();

try {
    $pdo = getDatabaseConnection(); ensureLaunchVerificationSchema($pdo);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'GET') launchJson(200, array_merge(['success' => true], readLaunchVerificationState($pdo)));
    if ($method !== 'POST') launchJson(405, ['success' => false, 'message' => 'Method not allowed.']);
    $input = json_decode(file_get_contents('php://input') ?: '', true); $input = is_array($input) ? $input : [];
    if (launchText($input['action'] ?? '', 80) !== 'run_verification') throw new InvalidArgumentException('Unknown launch verification action.');
    if (!($input['confirmed'] ?? false)) throw new InvalidArgumentException('Explicit human confirmation is required.');
    runLaunchVerification($pdo, launchText($input['reason'] ?? '', 1200));
    launchJson(200, ['success' => true, 'message' => 'Protected launch verification recorded. No deployment, DNS, tracking transmission or business record was changed.', 'state' => readLaunchVerificationState($pdo)]);
} catch (InvalidArgumentException $error) {
    launchJson(422, ['success' => false, 'message' => $error->getMessage()]);
} catch (Throwable $error) {
    error_log('manage_launch_verification.php: ' . $error->getMessage());
    launchJson(500, ['success' => false, 'message' => 'Launch verification evidence is unavailable right now. No launch action was performed.']);
}
