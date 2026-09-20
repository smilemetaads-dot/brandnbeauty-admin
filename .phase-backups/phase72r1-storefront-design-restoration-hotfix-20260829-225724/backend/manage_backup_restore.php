<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) === 1) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Expose-Headers: Content-Disposition, Content-Length');
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

requireAdminAuth();

function backupJson(int $status, array $payload): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function backupPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function backupText(mixed $value, int $limit = 1000): string
{
    $value = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($value, 0, $limit) : substr($value, 0, $limit);
}

function backupIdentifier(string $value): string
{
    return '`' . str_replace('`', '``', $value) . '`';
}

function backupPrivateDirectory(): string
{
    $xamppRoot = dirname(__DIR__, 4);
    $directory = $xamppRoot . DIRECTORY_SEPARATOR . 'BrandnBeauty-private' . DIRECTORY_SEPARATOR . 'backups';
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        throw new RuntimeException('Private backup storage could not be created.');
    }
    @chmod($directory, 0700);
    return $directory;
}

function ensureBackupRestoreTables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS backup_restore_artifacts (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, backup_key CHAR(32) NOT NULL,
        file_name VARCHAR(255) NOT NULL, storage_format ENUM('sql','sql_gzip') NOT NULL,
        size_bytes BIGINT UNSIGNED NOT NULL, table_count INT UNSIGNED NOT NULL,
        row_count BIGINT UNSIGNED NOT NULL, sha256 CHAR(64) NOT NULL,
        status ENUM('created','verified','failed') NOT NULL DEFAULT 'created',
        failure_note VARCHAR(500) NULL, created_by VARCHAR(190) NOT NULL DEFAULT 'authenticated admin',
        verified_by VARCHAR(190) NULL, verified_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_backup_restore_key (backup_key),
        KEY idx_backup_restore_artifact (status,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS backup_restore_drills (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, backup_id BIGINT UNSIGNED NOT NULL,
        drill_type ENUM('integrity','restore_readiness') NOT NULL,
        result ENUM('passed','failed') NOT NULL, checked_tables INT UNSIGNED NOT NULL DEFAULT 0,
        checked_size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0, result_summary VARCHAR(1000) NOT NULL,
        checks_json LONGTEXT NOT NULL, checked_by VARCHAR(190) NOT NULL DEFAULT 'authenticated admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_backup_restore_drill (backup_id,result,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS backup_restore_requests (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, backup_id BIGINT UNSIGNED NOT NULL,
        reason VARCHAR(1500) NOT NULL, maintenance_window VARCHAR(190) NOT NULL,
        requester VARCHAR(190) NOT NULL DEFAULT 'authenticated admin',
        status ENUM('pending','approved','cancelled','completed') NOT NULL DEFAULT 'pending',
        execution_mode VARCHAR(80) NOT NULL DEFAULT 'maintenance_only',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_backup_restore_request (status,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS backup_restore_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, event_type VARCHAR(80) NOT NULL,
        subject_label VARCHAR(300) NOT NULL, actor_name VARCHAR(190) NOT NULL,
        note VARCHAR(2000) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_backup_restore_event (event_type,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function backupEvent(PDO $pdo, string $type, string $subject, string $note): void
{
    $query = $pdo->prepare('INSERT INTO backup_restore_events (event_type,subject_label,actor_name,note) VALUES (:type,:subject,:actor,:note)');
    $query->execute([':type'=>$type,':subject'=>backupText($subject,300),':actor'=>'authenticated admin',':note'=>backupText($note,2000)]);
}

function backupWrite(mixed $handle, bool $gzip, string $content): void
{
    $result = $gzip ? gzwrite($handle, $content) : fwrite($handle, $content);
    if ($result === false) throw new RuntimeException('The private backup file could not be written.');
}

function backupArtifact(PDO $pdo, string $key): array
{
    $query = $pdo->prepare('SELECT * FROM backup_restore_artifacts WHERE backup_key=:backup_key LIMIT 1');
    $query->execute([':backup_key'=>$key]);
    $row = $query->fetch(PDO::FETCH_ASSOC);
    if (!is_array($row)) backupJson(404, ['success'=>false,'message'=>'The selected backup is unavailable.']);
    return $row;
}

function backupFilePath(array $artifact): string
{
    $fileName = basename((string) ($artifact['file_name'] ?? ''));
    if ($fileName === '' || $fileName !== (string) ($artifact['file_name'] ?? '')) throw new RuntimeException('The stored backup filename is invalid.');
    return backupPrivateDirectory() . DIRECTORY_SEPARATOR . $fileName;
}

function createDatabaseBackup(PDO $pdo, string $reason): array
{
    @set_time_limit(0);
    $database = (string) $pdo->query('SELECT DATABASE()')->fetchColumn();
    if ($database === '') throw new RuntimeException('No active BrandnBeauty database was detected.');
    $tablesQuery = $pdo->prepare("SELECT table_name FROM information_schema.tables WHERE table_schema=:database AND table_type='BASE TABLE' ORDER BY table_name");
    $tablesQuery->execute([':database'=>$database]);
    $tables = array_map(static fn(array $row): string => (string) $row['table_name'], $tablesQuery->fetchAll(PDO::FETCH_ASSOC) ?: []);
    if ($tables === []) throw new RuntimeException('The active database has no tables to back up.');

    $gzip = function_exists('gzopen') && function_exists('gzwrite');
    $key = bin2hex(random_bytes(16));
    $fileName = 'brandnbeauty-' . date('Ymd-His') . '-' . substr($key, 0, 8) . ($gzip ? '.sql.gz' : '.sql');
    $finalPath = backupPrivateDirectory() . DIRECTORY_SEPARATOR . $fileName;
    $temporaryPath = $finalPath . '.part';
    $handle = $gzip ? gzopen($temporaryPath, 'wb9') : fopen($temporaryPath, 'wb');
    if ($handle === false) throw new RuntimeException('The private backup file could not be opened.');

    $rowCount = 0;
    try {
        $pdo->exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        $pdo->exec('START TRANSACTION WITH CONSISTENT SNAPSHOT');
        backupWrite($handle, $gzip, "-- BrandnBeauty protected database backup\n-- Created: " . date(DATE_ATOM) . "\n-- Restore requires an approved maintenance window.\nSET FOREIGN_KEY_CHECKS=0;\nSET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';\n\n");
        foreach ($tables as $table) {
            $identifier = backupIdentifier($table);
            $schema = $pdo->query('SHOW CREATE TABLE ' . $identifier)->fetch(PDO::FETCH_NUM);
            if (!is_array($schema) || !isset($schema[1])) throw new RuntimeException('Schema could not be read for a database table.');
            backupWrite($handle, $gzip, "-- Table: " . $table . "\nDROP TABLE IF EXISTS " . $identifier . ";\n" . $schema[1] . ";\n");
            $rows = $pdo->query('SELECT * FROM ' . $identifier);
            while (($row = $rows->fetch(PDO::FETCH_ASSOC)) !== false) {
                $columns = array_map('backupIdentifier', array_keys($row));
                $values = [];
                foreach ($row as $value) {
                    if ($value === null) {
                        $values[] = 'NULL';
                        continue;
                    }
                    $quoted = $pdo->quote((string) $value);
                    if ($quoted === false) throw new RuntimeException('A database value could not be encoded safely.');
                    $values[] = $quoted;
                }
                backupWrite($handle, $gzip, 'INSERT INTO ' . $identifier . ' (' . implode(',', $columns) . ') VALUES (' . implode(',', $values) . ");\n");
                $rowCount++;
            }
            $rows->closeCursor();
            backupWrite($handle, $gzip, "\n");
        }
        backupWrite($handle, $gzip, "SET FOREIGN_KEY_CHECKS=1;\n-- Backup completed\n");
        $pdo->commit();
        $gzip ? gzclose($handle) : fclose($handle);
        $handle = null;
        if (!rename($temporaryPath, $finalPath)) throw new RuntimeException('The completed backup could not be published to private storage.');
        @chmod($finalPath, 0600);
        $size = filesize($finalPath);
        $hash = hash_file('sha256', $finalPath);
        if ($size === false || $hash === false) throw new RuntimeException('The completed backup could not be fingerprinted.');
        $save = $pdo->prepare('INSERT INTO backup_restore_artifacts (backup_key,file_name,storage_format,size_bytes,table_count,row_count,sha256) VALUES (:backup_key,:file_name,:storage_format,:size_bytes,:table_count,:row_count,:sha256)');
        $save->execute([':backup_key'=>$key,':file_name'=>$fileName,':storage_format'=>$gzip?'sql_gzip':'sql',':size_bytes'=>$size,':table_count'=>count($tables),':row_count'=>$rowCount,':sha256'=>$hash]);
        backupEvent($pdo, 'backup_created', 'Backup ' . substr($key, 0, 8), count($tables) . ' tables and ' . $rowCount . ' rows were copied to private storage. Reason: ' . backupText($reason, 1000));
        return ['backup_key'=>$key,'file_name'=>$fileName,'size_bytes'=>$size,'table_count'=>count($tables),'row_count'=>$rowCount,'sha256'=>$hash];
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        if (is_resource($handle)) $gzip ? gzclose($handle) : fclose($handle);
        if (is_file($temporaryPath)) @unlink($temporaryPath);
        if (is_file($finalPath)) @unlink($finalPath);
        throw $error;
    }
}

function verifyBackupArtifact(PDO $pdo, array $artifact, string $drillType): array
{
    @set_time_limit(0);
    $path = backupFilePath($artifact);
    $exists = is_file($path);
    $size = $exists ? filesize($path) : false;
    $hash = $exists ? hash_file('sha256', $path) : false;
    $header = false; $trailer = false; $foreignKeys = false; $tableMarkers = 0;
    if ($exists) {
        $gzip = ($artifact['storage_format'] ?? '') === 'sql_gzip';
        $handle = $gzip ? gzopen($path, 'rb') : fopen($path, 'rb');
        if ($handle !== false) {
            while (($line = $gzip ? gzgets($handle) : fgets($handle)) !== false) {
                if (str_contains($line, 'BrandnBeauty protected database backup')) $header = true;
                if (str_starts_with($line, '-- Table: ')) $tableMarkers++;
                if (str_contains($line, 'SET FOREIGN_KEY_CHECKS=0')) $foreignKeys = true;
                if (str_contains($line, '-- Backup completed')) $trailer = true;
            }
            $gzip ? gzclose($handle) : fclose($handle);
        }
    }
    $checksum = is_string($hash) && hash_equals((string) $artifact['sha256'], $hash);
    $sizeMatch = is_int($size) && $size === (int) $artifact['size_bytes'];
    $tablesMatch = $tableMarkers === (int) $artifact['table_count'];
    $passed = $exists && $checksum && $sizeMatch && $tablesMatch && $header && $foreignKeys && $trailer;
    $checks = ['file_exists'=>$exists,'checksum_match'=>$checksum,'size_match'=>$sizeMatch,'table_manifest_match'=>$tablesMatch,'protected_header'=>$header,'foreign_key_guard'=>$foreignKeys,'completion_marker'=>$trailer];
    $summary = $passed ? 'Checksum, file size, protected header, table manifest and completion marker passed.' : 'One or more integrity checks failed. This backup is blocked from download and restore requests.';
    $drill = $pdo->prepare('INSERT INTO backup_restore_drills (backup_id,drill_type,result,checked_tables,checked_size_bytes,result_summary,checks_json) VALUES (:backup_id,:drill_type,:result,:checked_tables,:checked_size_bytes,:summary,:checks)');
    $drill->execute([':backup_id'=>$artifact['id'],':drill_type'=>$drillType,':result'=>$passed?'passed':'failed',':checked_tables'=>$tableMarkers,':checked_size_bytes'=>is_int($size)?$size:0,':summary'=>$summary,':checks'=>json_encode($checks,JSON_UNESCAPED_SLASHES)]);
    $update = $pdo->prepare("UPDATE backup_restore_artifacts SET status=:status,failure_note=:failure_note,verified_by=:verified_by,verified_at=NOW() WHERE id=:id");
    $update->execute([':status'=>$passed?'verified':'failed',':failure_note'=>$passed?null:$summary,':verified_by'=>'authenticated admin',':id'=>$artifact['id']]);
    backupEvent($pdo, $drillType === 'restore_readiness' ? 'restore_drill_completed' : 'backup_verified', 'Backup ' . substr((string) $artifact['backup_key'], 0, 8), $summary);
    return ['passed'=>$passed,'checks'=>$checks,'summary'=>$summary];
}

function readBackupRestoreState(PDO $pdo): array
{
    $artifacts = $pdo->query("SELECT id,backup_key,file_name,storage_format,size_bytes,table_count,row_count,sha256,status,failure_note,created_by,verified_by,verified_at,created_at,(status='verified') download_ready FROM backup_restore_artifacts ORDER BY id DESC LIMIT 100")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $drills = $pdo->query('SELECT d.*,a.backup_key,a.file_name FROM backup_restore_drills d JOIN backup_restore_artifacts a ON a.id=d.backup_id ORDER BY d.id DESC LIMIT 100')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $requests = $pdo->query('SELECT r.*,a.backup_key,a.file_name FROM backup_restore_requests r JOIN backup_restore_artifacts a ON a.id=r.backup_id ORDER BY r.id DESC LIMIT 100')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $summary = $pdo->query("SELECT COUNT(*) total_backups,SUM(status='verified') verified_backups,SUM(status='failed') failed_backups,MAX(created_at) latest_backup_at,MAX(verified_at) latest_verified_at FROM backup_restore_artifacts")->fetch(PDO::FETCH_ASSOC) ?: [];
    $summary['restore_drills'] = (int) $pdo->query("SELECT COUNT(*) FROM backup_restore_drills WHERE drill_type='restore_readiness'")->fetchColumn();
    $summary['pending_restore_requests'] = (int) $pdo->query("SELECT COUNT(*) FROM backup_restore_requests WHERE status='pending'")->fetchColumn();
    $free = disk_free_space(backupPrivateDirectory());
    return ['engine'=>['mode'=>'private_logical_backup','storage'=>'outside_public_htdocs','restore_execution'=>'maintenance_only','download_policy'=>'verified_only'],'summary'=>$summary,'storage'=>['private'=>true,'public_web_access'=>false,'free_bytes'=>$free===false?0:$free],'artifacts'=>$artifacts,'drills'=>$drills,'restore_requests'=>$requests,'generated_at'=>date(DATE_ATOM)];
}

try {
    $pdo = getDatabaseConnection();
    ensureBackupRestoreTables($pdo);
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET' && isset($_GET['download'])) {
        $key = backupText($_GET['download'], 32);
        if (preg_match('/^[a-f0-9]{32}$/', $key) !== 1) backupJson(422, ['success'=>false,'message'=>'A valid backup reference is required.']);
        $artifact = backupArtifact($pdo, $key);
        if (($artifact['status'] ?? '') !== 'verified') backupJson(409, ['success'=>false,'message'=>'Only a verified backup can be downloaded.']);
        $path = backupFilePath($artifact);
        if (!is_file($path) || !hash_equals((string) $artifact['sha256'], (string) hash_file('sha256', $path))) backupJson(409, ['success'=>false,'message'=>'Backup integrity changed. Run verification again.']);
        header('Content-Type: ' . (($artifact['storage_format'] ?? '') === 'sql_gzip' ? 'application/gzip' : 'application/sql'));
        header('Content-Disposition: attachment; filename="' . basename((string) $artifact['file_name']) . '"');
        header('Content-Length: ' . (string) filesize($path));
        header('Cache-Control: private, no-store');
        readfile($path);
        exit;
    }
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') backupJson(200, array_merge(['success'=>true], readBackupRestoreState($pdo)));
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') backupJson(405, ['success'=>false,'message'=>'Method not allowed.']);

    $payload = backupPayload();
    $action = backupText($payload['action'] ?? '', 80);
    $message = 'Backup control updated.';
    if ($action === 'create_backup') {
        $reason = backupText($payload['reason'] ?? '', 1000);
        $confirmed = (bool) ($payload['confirmed'] ?? false);
        if (!$confirmed || strlen($reason) < 8) backupJson(422, ['success'=>false,'message'=>'Confirm the protected backup and provide a clear reason.']);
        createDatabaseBackup($pdo, $reason);
        $message = 'Protected database backup created. Run verification before download or restore planning.';
    } elseif ($action === 'verify_backup' || $action === 'run_restore_drill') {
        $key = backupText($payload['backup_key'] ?? '', 32);
        if (preg_match('/^[a-f0-9]{32}$/', $key) !== 1) backupJson(422, ['success'=>false,'message'=>'Select a valid backup.']);
        $artifact = backupArtifact($pdo, $key);
        $verification = verifyBackupArtifact($pdo, $artifact, $action === 'run_restore_drill' ? 'restore_readiness' : 'integrity');
        $message = $verification['summary'];
    } elseif ($action === 'request_restore') {
        $key = backupText($payload['backup_key'] ?? '', 32);
        $reason = backupText($payload['reason'] ?? '', 1500);
        $window = backupText($payload['maintenance_window'] ?? '', 190);
        $confirmed = (bool) ($payload['confirmed'] ?? false);
        if (!$confirmed || strlen($reason) < 8 || strlen($window) < 4) backupJson(422, ['success'=>false,'message'=>'Select a verified backup, maintenance window and clear restore reason.']);
        $artifact = backupArtifact($pdo, $key);
        if (($artifact['status'] ?? '') !== 'verified') backupJson(409, ['success'=>false,'message'=>'Run a passing integrity check before requesting restore.']);
        $save = $pdo->prepare('INSERT INTO backup_restore_requests (backup_id,reason,maintenance_window) VALUES (:backup_id,:reason,:maintenance_window)');
        $save->execute([':backup_id'=>$artifact['id'],':reason'=>$reason,':maintenance_window'=>$window]);
        backupEvent($pdo, 'restore_requested', 'Backup ' . substr($key, 0, 8), $reason . ' · Maintenance window: ' . $window . '. No database change was executed.');
        $message = 'Restore request recorded for maintenance review. The live database was not changed.';
    } else {
        backupJson(422, ['success'=>false,'message'=>'Unknown backup action.']);
    }
    backupJson(200, array_merge(['success'=>true,'message'=>$message], readBackupRestoreState($pdo)));
} catch (Throwable $error) {
    error_log('manage_backup_restore.php: ' . $error->getMessage());
    backupJson(500, ['success'=>false,'message'=>'Backup & Restore is unavailable right now. No restore was executed.']);
}
