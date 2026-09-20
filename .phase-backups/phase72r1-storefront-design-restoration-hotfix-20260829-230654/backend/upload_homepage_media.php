<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_auth.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) === 1) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

requireAdminAuth();

function homepageMediaJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    homepageMediaJson(405, ['success' => false, 'message' => 'Only POST requests are allowed.']);
}

if (!isset($_FILES['image']) || !is_array($_FILES['image'])) {
    homepageMediaJson(400, ['success' => false, 'message' => 'Choose an image to upload.']);
}

$file = $_FILES['image'];
if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    homepageMediaJson(400, ['success' => false, 'message' => 'The image upload did not complete.']);
}

$size = (int) ($file['size'] ?? 0);
if ($size <= 0 || $size > 5 * 1024 * 1024) {
    homepageMediaJson(400, ['success' => false, 'message' => 'Image size must be 5 MB or smaller.']);
}

$temporaryPath = (string) ($file['tmp_name'] ?? '');
$imageInfo = @getimagesize($temporaryPath);
if ($imageInfo === false) {
    homepageMediaJson(400, ['success' => false, 'message' => 'The selected file is not a valid image.']);
}

$mime = (string) ($imageInfo['mime'] ?? '');
$extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
if (!isset($extensions[$mime])) {
    homepageMediaJson(400, ['success' => false, 'message' => 'Only JPG, PNG and WebP images are allowed.']);
}

$uploadDirectory = __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'homepage';
if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0755, true) && !is_dir($uploadDirectory)) {
    homepageMediaJson(500, ['success' => false, 'message' => 'Homepage media folder could not be created.']);
}

$filename = 'homepage-' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(6)) . '.' . $extensions[$mime];
$destination = $uploadDirectory . DIRECTORY_SEPARATOR . $filename;
if (!move_uploaded_file($temporaryPath, $destination)) {
    homepageMediaJson(500, ['success' => false, 'message' => 'Homepage image could not be saved.']);
}

$relativeUrl = '/BrandnBeauty/brandnbeauty-backend/php/uploads/homepage/' . $filename;
homepageMediaJson(201, [
    'success' => true,
    'message' => 'Homepage image uploaded successfully.',
    'url' => $relativeUrl,
    'width' => (int) ($imageInfo[0] ?? 0),
    'height' => (int) ($imageInfo[1] ?? 0),
]);
