<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) === 1) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

requireAdminAuth();

function accessJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function accessText(mixed $value, int $limit = 1000): string
{
    $value = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($value, 0, $limit) : substr($value, 0, $limit);
}

function accessPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function accessTableExists(PDO $pdo, string $table): bool
{
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table' => $table]);
    return (int) $query->fetchColumn() > 0;
}

function accessSlug(string $value): string
{
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?: 'custom-role';
    return trim($value, '-');
}

function accessEvent(PDO $pdo, string $type, string $subject, string $note, string $actor = 'authenticated admin'): void
{
    $query = $pdo->prepare('INSERT INTO access_audit_events (event_type,subject_label,actor_name,note) VALUES (:event_type,:subject_label,:actor_name,:note)');
    $query->execute([':event_type'=>$type, ':subject_label'=>$subject, ':actor_name'=>$actor, ':note'=>accessText($note, 2000)]);
    $pdo->exec('UPDATE access_engine_state SET last_change_at=NOW() WHERE id=1');
}

function accessSnapshot(PDO $pdo, int $roleId): string
{
    $query = $pdo->prepare('SELECT id,role_key,name,description,status,is_builtin,is_protected,version FROM access_roles WHERE id=:id');
    $query->execute([':id'=>$roleId]);
    $role = $query->fetch(PDO::FETCH_ASSOC) ?: [];
    $permissions = $pdo->prepare('SELECT p.permission_key FROM access_role_permissions rp JOIN access_permissions p ON p.id=rp.permission_id WHERE rp.role_id=:id ORDER BY p.permission_key');
    $permissions->execute([':id'=>$roleId]);
    $role['permissions'] = $permissions->fetchAll(PDO::FETCH_COLUMN) ?: [];
    return json_encode($role, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '{}';
}

function accessSaveVersion(PDO $pdo, int $roleId, string $reason, string $actor = 'authenticated admin'): void
{
    $query = $pdo->prepare('SELECT version FROM access_roles WHERE id=:id');
    $query->execute([':id'=>$roleId]);
    $version = (int) $query->fetchColumn();
    $save = $pdo->prepare('INSERT INTO access_policy_versions (role_id,version,snapshot_json,reason,created_by) VALUES (:role_id,:version,:snapshot_json,:reason,:created_by)');
    $save->execute([':role_id'=>$roleId, ':version'=>$version, ':snapshot_json'=>accessSnapshot($pdo,$roleId), ':reason'=>accessText($reason,1000), ':created_by'=>$actor]);
}

function ensureAccessTables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS access_roles (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, role_key VARCHAR(140) NOT NULL,
        name VARCHAR(190) NOT NULL, description VARCHAR(1000) NOT NULL,
        status ENUM('active','draft','paused','archived') NOT NULL DEFAULT 'draft',
        is_builtin TINYINT(1) NOT NULL DEFAULT 0, is_protected TINYINT(1) NOT NULL DEFAULT 0,
        version SMALLINT UNSIGNED NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_access_role_key (role_key), KEY idx_access_role_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS access_permissions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, permission_key VARCHAR(160) NOT NULL,
        name VARCHAR(190) NOT NULL, domain_name VARCHAR(100) NOT NULL,
        description VARCHAR(1000) NOT NULL, is_sensitive TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_access_permission_key (permission_key), KEY idx_access_permission_domain (domain_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS access_role_permissions (
        role_id BIGINT UNSIGNED NOT NULL, permission_id BIGINT UNSIGNED NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (role_id,permission_id), KEY idx_access_role_permission_permission (permission_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS access_assignments (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, subject_type VARCHAR(60) NOT NULL DEFAULT 'staff',
        subject_ref VARCHAR(190) NOT NULL, subject_name VARCHAR(190) NOT NULL,
        role_id BIGINT UNSIGNED NOT NULL, status ENUM('active','paused','revoked') NOT NULL DEFAULT 'active',
        is_protected TINYINT(1) NOT NULL DEFAULT 0, reason VARCHAR(1000) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_access_assignment (subject_type,subject_ref,role_id),
        KEY idx_access_assignment_role (role_id,status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS access_policy_versions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, role_id BIGINT UNSIGNED NOT NULL,
        version SMALLINT UNSIGNED NOT NULL, snapshot_json LONGTEXT NOT NULL,
        reason VARCHAR(1000) NOT NULL, created_by VARCHAR(190) NOT NULL DEFAULT 'authenticated admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_access_policy_version (role_id,version), KEY idx_access_policy_time (role_id,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS access_audit_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, event_type VARCHAR(80) NOT NULL,
        subject_label VARCHAR(240) NOT NULL, actor_name VARCHAR(190) NOT NULL,
        note VARCHAR(2000) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_access_audit_time (event_type,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS access_engine_state (
        id TINYINT UNSIGNED NOT NULL, enforcement_mode VARCHAR(60) NOT NULL DEFAULT 'governance_registry',
        last_change_at DATETIME NULL, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("INSERT IGNORE INTO access_engine_state (id,enforcement_mode) VALUES (1,'governance_registry')");

    $permissions = [
        ['dashboard.view','View dashboard','Overview','View owner dashboard and live summaries',0],
        ['orders.view','View orders','Orders','View order records and operational status',0],
        ['orders.update_status','Update order status','Orders','Change verified order workflow status',1],
        ['orders.pack','Manage packing','Orders','Create packing evidence and handoff readiness',1],
        ['courier.view','View courier records','Courier','View courier booking and COD context',0],
        ['courier.create_booking','Create courier booking','Courier','Submit a courier booking after human review',1],
        ['customers.view','View customers','Customers','View privacy-safe customer operations',1],
        ['catalog.view','View catalog','Catalog','View products, categories and merchandising',0],
        ['catalog.edit','Edit catalog','Catalog','Edit product and merchandising records',1],
        ['inventory.view','View inventory','Inventory','View current stock and risk signals',0],
        ['inventory.adjust','Adjust inventory','Inventory','Create a stock adjustment with evidence',1],
        ['suppliers.view','View suppliers','Suppliers','View supplier and purchase context',0],
        ['finance.view','View finance','Finance','View reconciliation and profitability records',1],
        ['finance.reconcile','Reconcile finance','Finance','Record protected COD or expense reconciliation',1],
        ['storefront.view','View storefront CMS','Storefront','View content and publication history',0],
        ['storefront.publish','Publish storefront','Storefront','Publish an approved storefront version',1],
        ['growth.view','View growth','Growth','View marketing, attribution and retention intelligence',0],
        ['growth.manage_ads','Manage ad drafts','Growth','Prepare governed advertising drafts and sync requests',1],
        ['automation.view','View automation','Automation','View workflows, alerts and rules',0],
        ['automation.manage','Manage automation','Automation','Create or change governed internal automation definitions',1],
        ['control.view','View control plane','Control','View access, settings, integrations and audit evidence',1],
        ['control.manage_roles','Manage roles','Control','Create versioned roles, permissions and assignments',1],
        ['reports.view','View reports','Reports','View business reports and approved exports',0],
        ['settings.view','View settings','Control','View system settings without publishing changes',1],
    ];
    $savePermission = $pdo->prepare('INSERT IGNORE INTO access_permissions (permission_key,name,domain_name,description,is_sensitive) VALUES (:permission_key,:name,:domain_name,:description,:is_sensitive)');
    foreach ($permissions as $item) $savePermission->execute([':permission_key'=>$item[0],':name'=>$item[1],':domain_name'=>$item[2],':description'=>$item[3],':is_sensitive'=>$item[4]]);

    $roles = [
        ['super-admin','Super Admin','Protected owner access for the authenticated local administrator.',1,1],
        ['operations-manager','Operations Manager','Runs orders, fulfilment, customers and daily operational reviews.',1,0],
        ['order-operator','Order Operator','Views orders and manages verified order workflow updates.',1,0],
        ['finance-reviewer','Finance Reviewer','Reviews protected finance and COD reconciliation evidence.',1,0],
        ['catalog-manager','Catalog Manager','Maintains catalog, inventory context and approved storefront content.',1,0],
        ['growth-analyst','Growth Analyst','Views marketing, attribution, creative and retention intelligence.',1,0],
        ['support-agent','Support Agent','Views orders and customer service context without financial controls.',1,0],
    ];
    $saveRole = $pdo->prepare("INSERT IGNORE INTO access_roles (role_key,name,description,status,is_builtin,is_protected) VALUES (:role_key,:name,:description,'active',1,:is_protected)");
    foreach ($roles as $item) $saveRole->execute([':role_key'=>$item[0],':name'=>$item[1],':description'=>$item[2],':is_protected'=>$item[4]]);

    $grantMap = [
        'super-admin'=>['*'],
        'operations-manager'=>['dashboard.view','orders.view','orders.update_status','orders.pack','courier.view','courier.create_booking','customers.view','catalog.view','inventory.view','suppliers.view','automation.view','reports.view'],
        'order-operator'=>['dashboard.view','orders.view','orders.update_status','orders.pack','courier.view','customers.view'],
        'finance-reviewer'=>['dashboard.view','orders.view','courier.view','finance.view','finance.reconcile','reports.view'],
        'catalog-manager'=>['dashboard.view','catalog.view','catalog.edit','inventory.view','inventory.adjust','suppliers.view','storefront.view','storefront.publish','reports.view'],
        'growth-analyst'=>['dashboard.view','catalog.view','growth.view','automation.view','reports.view'],
        'support-agent'=>['dashboard.view','orders.view','customers.view','catalog.view'],
    ];
    $getRole = $pdo->prepare('SELECT id FROM access_roles WHERE role_key=:role_key');
    $getPermission = $pdo->prepare('SELECT id FROM access_permissions WHERE permission_key=:permission_key');
    $grant = $pdo->prepare('INSERT IGNORE INTO access_role_permissions (role_id,permission_id) VALUES (:role_id,:permission_id)');
    $hasVersion = $pdo->prepare('SELECT COUNT(*) FROM access_policy_versions WHERE role_id=:role_id');
    $allPermissionIds = $pdo->query('SELECT id FROM access_permissions')->fetchAll(PDO::FETCH_COLUMN) ?: [];
    foreach ($grantMap as $roleKey=>$permissionKeys) {
        $getRole->execute([':role_key'=>$roleKey]); $roleId=(int)$getRole->fetchColumn();
        $hasVersion->execute([':role_id'=>$roleId]);
        if ((int)$hasVersion->fetchColumn() > 0) continue;
        $ids=[];
        if ($permissionKeys === ['*']) $ids=$allPermissionIds;
        else foreach ($permissionKeys as $permissionKey) { $getPermission->execute([':permission_key'=>$permissionKey]); $ids[]=(int)$getPermission->fetchColumn(); }
        foreach ($ids as $permissionId) if ($permissionId > 0) $grant->execute([':role_id'=>$roleId,':permission_id'=>$permissionId]);
    }

    $super = (int) $pdo->query("SELECT id FROM access_roles WHERE role_key='super-admin'")->fetchColumn();
    if ($super > 0) {
        $assignment = $pdo->prepare("INSERT IGNORE INTO access_assignments (subject_type,subject_ref,subject_name,role_id,status,is_protected,reason) VALUES ('system','local-admin-auth','Authenticated Admin',:role_id,'active',1,'Protected local admin continuity')");
        $assignment->execute([':role_id'=>$super]);
    }
    $builtins = $pdo->query('SELECT id FROM access_roles WHERE is_builtin=1')->fetchAll(PDO::FETCH_COLUMN) ?: [];
    foreach ($builtins as $roleId) {
        $exists = $pdo->prepare('SELECT COUNT(*) FROM access_policy_versions WHERE role_id=:role_id AND version=1');
        $exists->execute([':role_id'=>$roleId]);
        if ((int)$exists->fetchColumn() === 0) accessSaveVersion($pdo,(int)$roleId,'Verified built-in role','system');
    }
}

function readAccessState(PDO $pdo): array
{
    $roleRows = $pdo->query("SELECT r.*,(SELECT COUNT(*) FROM access_assignments a WHERE a.role_id=r.id AND a.status='active') assignment_count,(SELECT GROUP_CONCAT(p.id ORDER BY p.id SEPARATOR ',') FROM access_role_permissions rp JOIN access_permissions p ON p.id=rp.permission_id WHERE rp.role_id=r.id) permission_ids_csv,(SELECT GROUP_CONCAT(p.permission_key ORDER BY p.permission_key SEPARATOR ',') FROM access_role_permissions rp JOIN access_permissions p ON p.id=rp.permission_id WHERE rp.role_id=r.id) permission_keys_csv FROM access_roles r ORDER BY r.is_protected DESC,FIELD(r.status,'active','draft','paused','archived'),r.name")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    foreach ($roleRows as &$role) {
        $role['permission_ids'] = $role['permission_ids_csv'] ? array_map('intval',explode(',',(string)$role['permission_ids_csv'])) : [];
        $role['permission_keys'] = $role['permission_keys_csv'] ? explode(',',(string)$role['permission_keys_csv']) : [];
        unset($role['permission_ids_csv'],$role['permission_keys_csv']);
    }
    unset($role);
    $permissions = $pdo->query('SELECT * FROM access_permissions ORDER BY domain_name,name')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $assignments = $pdo->query('SELECT a.*,r.name role_name FROM access_assignments a JOIN access_roles r ON r.id=a.role_id ORDER BY a.is_protected DESC,a.id DESC')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $versions = $pdo->query('SELECT v.id,v.role_id,v.version,v.reason,v.created_by,v.created_at,r.name role_name FROM access_policy_versions v JOIN access_roles r ON r.id=v.role_id ORDER BY v.id DESC LIMIT 400')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $activity = $pdo->query('SELECT * FROM access_audit_events ORDER BY id DESC LIMIT 400')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $summary = $pdo->query("SELECT COUNT(*) total_roles,SUM(status='active') active_roles,SUM(is_protected=1) protected_roles FROM access_roles")->fetch(PDO::FETCH_ASSOC) ?: [];
    $summary['permissions'] = (int)$pdo->query('SELECT COUNT(*) FROM access_permissions')->fetchColumn();
    $summary['assignments'] = (int)$pdo->query("SELECT COUNT(*) FROM access_assignments WHERE status='active'")->fetchColumn();
    $summary['changes_30d'] = (int)$pdo->query('SELECT COUNT(*) FROM access_audit_events WHERE created_at>=DATE_SUB(NOW(),INTERVAL 30 DAY)')->fetchColumn();
    $engine = $pdo->query('SELECT enforcement_mode,last_change_at FROM access_engine_state WHERE id=1')->fetch(PDO::FETCH_ASSOC) ?: [];
    $userDirectory = accessTableExists($pdo,'users') || accessTableExists($pdo,'admin_users') || accessTableExists($pdo,'staff_users');
    return [
        'engine'=>['enforcement_mode'=>$engine['enforcement_mode']??'governance_registry','last_change_at'=>$engine['last_change_at']??null,'timezone'=>'Asia/Dhaka'],
        'capabilities'=>['admin_auth'=>is_file(__DIR__.'/admin_auth.php'),'registry'=>true,'audit'=>true,'user_directory'=>$userDirectory],
        'summary'=>$summary,'roles'=>$roleRows,'permissions'=>$permissions,'assignments'=>$assignments,'versions'=>$versions,'activity'=>$activity,'generated_at'=>date(DATE_ATOM)
    ];
}

try {
    $pdo = getDatabaseConnection();
    ensureAccessTables($pdo);
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') accessJson(200,array_merge(['success'=>true],readAccessState($pdo)));
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') accessJson(405,['success'=>false,'message'=>'Method not allowed.']);
    $payload = accessPayload(); $action = accessText($payload['action'] ?? '',80); $message='Access registry updated.';

    if ($action === 'create_role') {
        $name=accessText($payload['name']??'',190); $description=accessText($payload['description']??'',1000); $reason=accessText($payload['reason']??'',1000);
        if ($name==='' || $description==='' || $reason==='') accessJson(422,['success'=>false,'message'=>'Role name, job purpose and audit reason are required.']);
        $key=accessSlug($name).'-'.date('YmdHis');
        $save=$pdo->prepare("INSERT INTO access_roles (role_key,name,description,status,is_builtin,is_protected) VALUES (:role_key,:name,:description,'draft',0,0)");
        $save->execute([':role_key'=>$key,':name'=>$name,':description'=>$description]); $roleId=(int)$pdo->lastInsertId();
        accessSaveVersion($pdo,$roleId,$reason); accessEvent($pdo,'role_created',$name,$reason.' Draft created with zero permissions.');
        $message='Role draft saved with zero permissions.';
    } elseif ($action === 'update_permissions') {
        $roleId=(int)($payload['role_id']??0); $reason=accessText($payload['reason']??'',1000); $ids=is_array($payload['permission_ids']??null)?array_values(array_unique(array_map('intval',$payload['permission_ids']))):[];
        $roleQuery=$pdo->prepare('SELECT * FROM access_roles WHERE id=:id'); $roleQuery->execute([':id'=>$roleId]); $role=$roleQuery->fetch(PDO::FETCH_ASSOC);
        if (!$role) accessJson(404,['success'=>false,'message'=>'Role not found.']);
        if ((int)$role['is_protected']===1) accessJson(409,['success'=>false,'message'=>'The protected Super Admin role cannot be edited here.']);
        if ($reason==='') accessJson(422,['success'=>false,'message'=>'An audit reason is required.']);
        if ($ids) { $placeholders=implode(',',array_fill(0,count($ids),'?')); $valid=$pdo->prepare("SELECT id FROM access_permissions WHERE id IN ($placeholders)"); $valid->execute($ids); $ids=array_map('intval',$valid->fetchAll(PDO::FETCH_COLUMN)?:[]); }
        $pdo->beginTransaction(); $delete=$pdo->prepare('DELETE FROM access_role_permissions WHERE role_id=:id'); $delete->execute([':id'=>$roleId]); $grant=$pdo->prepare('INSERT INTO access_role_permissions (role_id,permission_id) VALUES (:role_id,:permission_id)'); foreach($ids as $permissionId)$grant->execute([':role_id'=>$roleId,':permission_id'=>$permissionId]); $update=$pdo->prepare('UPDATE access_roles SET version=version+1 WHERE id=:id'); $update->execute([':id'=>$roleId]); accessSaveVersion($pdo,$roleId,$reason); accessEvent($pdo,'permissions_updated',(string)$role['name'],$reason.' '.count($ids).' permission(s) recorded.'); $pdo->commit();
        $message='Permission version saved. Current login enforcement was not changed.';
    } elseif ($action === 'change_role_status') {
        $roleId=(int)($payload['role_id']??0); $status=accessText($payload['status']??'',20); $reason=accessText($payload['reason']??'',1000);
        if (!in_array($status,['active','draft','paused','archived'],true) || $reason==='') accessJson(422,['success'=>false,'message'=>'A valid state and audit reason are required.']);
        $roleQuery=$pdo->prepare('SELECT * FROM access_roles WHERE id=:id'); $roleQuery->execute([':id'=>$roleId]); $role=$roleQuery->fetch(PDO::FETCH_ASSOC);
        if (!$role) accessJson(404,['success'=>false,'message'=>'Role not found.']);
        if ((int)$role['is_protected']===1) accessJson(409,['success'=>false,'message'=>'The protected Super Admin role cannot be disabled here.']);
        $pdo->beginTransaction(); $update=$pdo->prepare('UPDATE access_roles SET status=:status,version=version+1 WHERE id=:id'); $update->execute([':status'=>$status,':id'=>$roleId]); accessSaveVersion($pdo,$roleId,$reason); accessEvent($pdo,'role_status_changed',(string)$role['name'],$reason.' New registry state: '.$status.'.'); $pdo->commit();
        $message='Role state saved without terminating any login session.';
    } elseif ($action === 'create_assignment') {
        $roleId=(int)($payload['role_id']??0); $subjectName=accessText($payload['subject_name']??'',190); $subjectRef=accessText($payload['subject_ref']??'',190); $subjectType=accessText($payload['subject_type']??'staff',60); $reason=accessText($payload['reason']??'',1000);
        if ($subjectName==='' || $subjectRef==='' || $reason==='') accessJson(422,['success'=>false,'message'=>'Subject, reference and audit reason are required.']);
        if (!in_array($subjectType,['staff','service','system'],true)) accessJson(422,['success'=>false,'message'=>'Unsupported subject type.']);
        $roleQuery=$pdo->prepare("SELECT * FROM access_roles WHERE id=:id AND status='active'"); $roleQuery->execute([':id'=>$roleId]); $role=$roleQuery->fetch(PDO::FETCH_ASSOC);
        if (!$role) accessJson(404,['success'=>false,'message'=>'Select an active role.']);
        if ((int)$role['is_protected']===1) accessJson(409,['success'=>false,'message'=>'The protected Super Admin role cannot be assigned from this registry screen.']);
        $save=$pdo->prepare("INSERT INTO access_assignments (subject_type,subject_ref,subject_name,role_id,status,is_protected,reason) VALUES (:subject_type,:subject_ref,:subject_name,:role_id,'active',0,:reason)");
        try { $save->execute([':subject_type'=>$subjectType,':subject_ref'=>$subjectRef,':subject_name'=>$subjectName,':role_id'=>$roleId,':reason'=>$reason]); } catch (PDOException $error) { if ((string)$error->getCode()==='23000') accessJson(409,['success'=>false,'message'=>'That subject already has this role assignment.']); throw $error; }
        accessEvent($pdo,'assignment_created',$subjectName,$reason.' Role: '.$role['name'].'.'); $message='Assignment recorded in the governance registry.';
    } elseif ($action === 'change_assignment_status') {
        $assignmentId=(int)($payload['assignment_id']??0); $status=accessText($payload['status']??'',20); $reason=accessText($payload['reason']??'',1000);
        if (!in_array($status,['active','paused','revoked'],true) || $reason==='') accessJson(422,['success'=>false,'message'=>'A valid state and audit reason are required.']);
        $query=$pdo->prepare('SELECT a.*,r.name role_name FROM access_assignments a JOIN access_roles r ON r.id=a.role_id WHERE a.id=:id'); $query->execute([':id'=>$assignmentId]); $assignment=$query->fetch(PDO::FETCH_ASSOC);
        if (!$assignment) accessJson(404,['success'=>false,'message'=>'Assignment not found.']);
        if ((int)$assignment['is_protected']===1) accessJson(409,['success'=>false,'message'=>'The protected authenticated-admin assignment cannot be disabled here.']);
        $update=$pdo->prepare('UPDATE access_assignments SET status=:status,reason=:reason WHERE id=:id'); $update->execute([':status'=>$status,':reason'=>$reason,':id'=>$assignmentId]); accessEvent($pdo,'assignment_status_changed',(string)$assignment['subject_name'],$reason.' New registry state: '.$status.'.');
        $message='Assignment state saved without ending any active session.';
    } else accessJson(422,['success'=>false,'message'=>'Unsupported access-registry action.']);

    accessJson(200,array_merge(['success'=>true,'message'=>$message],readAccessState($pdo)));
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('Roles permissions error: '.$error->getMessage());
    accessJson(500,['success'=>false,'message'=>'Roles and permissions could not be processed safely.']);
}
