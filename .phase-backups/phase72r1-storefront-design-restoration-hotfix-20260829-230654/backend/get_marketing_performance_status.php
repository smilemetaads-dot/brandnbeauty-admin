<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

try {
    $pdo = getDatabaseConnection();
    $required = ['orders', 'marketing_spend'];
    $ready = [];
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    foreach ($required as $table) { $query->execute([':table' => $table]); $ready[$table] = (int) $query->fetchColumn() > 0; }
    echo json_encode(['success' => true, 'module' => 'marketing-performance', 'database_connected' => true, 'tables' => $ready], JSON_UNESCAPED_SLASHES);
} catch (Throwable $error) {
    http_response_code(503);
    echo json_encode(['success' => false, 'module' => 'marketing-performance', 'database_connected' => false], JSON_UNESCAPED_SLASHES);
}
