<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function accessStatusTable(PDO $pdo, string $table): bool
{
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table'=>$table]);
    return (int)$query->fetchColumn() > 0;
}

try {
    $pdo = getDatabaseConnection();
    $tables = ['access_roles','access_permissions','access_role_permissions','access_assignments','access_policy_versions','access_audit_events','access_engine_state'];
    $installed = true;
    foreach ($tables as $table) if (!accessStatusTable($pdo,$table)) { $installed=false; break; }
    echo json_encode(['success'=>true,'module'=>'roles-permissions','database_connected'=>true,'schema_installed'=>$installed],JSON_UNESCAPED_SLASHES);
} catch (Throwable $error) {
    error_log('Roles permissions status error: '.$error->getMessage());
    http_response_code(500);
    echo json_encode(['success'=>false,'module'=>'roles-permissions','database_connected'=>false,'schema_installed'=>false],JSON_UNESCAPED_SLASHES);
}
