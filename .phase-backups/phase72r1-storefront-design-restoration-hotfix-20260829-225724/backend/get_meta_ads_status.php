<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

try {
    $pdo = getDatabaseConnection();
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table' => 'meta_ads_connection']);
    echo json_encode(['success' => true, 'module' => 'meta-ads', 'database_connected' => true, 'schema_installed' => (int) $query->fetchColumn() > 0], JSON_UNESCAPED_SLASHES);
} catch (Throwable $error) {
    http_response_code(503);
    echo json_encode(['success' => false, 'module' => 'meta-ads', 'database_connected' => false], JSON_UNESCAPED_SLASHES);
}
