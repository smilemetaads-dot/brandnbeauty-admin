<?php

declare(strict_types=1);

function privacyText(mixed $value, int $limit = 1500): string
{
    $value = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($value, 0, $limit) : substr($value, 0, $limit);
}

function privacyPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function privacyJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function privacyTableExists(PDO $pdo, string $table): bool
{
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table'=>$table]);
    return (int) $query->fetchColumn() > 0;
}

function privacyCount(PDO $pdo, string $table, string $where = '1=1'): int
{
    if (!privacyTableExists($pdo, $table)) return 0;
    return (int) $pdo->query('SELECT COUNT(*) FROM `' . str_replace('`', '``', $table) . '` WHERE ' . $where)->fetchColumn();
}

function privacyEnsureTables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS privacy_retention_policies (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, policy_key VARCHAR(120) NOT NULL,
        label VARCHAR(240) NOT NULL, scope_description VARCHAR(1200) NOT NULL,
        retention_days SMALLINT UNSIGNED NOT NULL, status ENUM('review_required','approved','paused') NOT NULL DEFAULT 'review_required',
        version INT UNSIGNED NOT NULL DEFAULT 1, change_reason VARCHAR(2000) NOT NULL,
        updated_by VARCHAR(190) NOT NULL DEFAULT 'authenticated admin', reviewed_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_privacy_retention_key (policy_key),
        KEY idx_privacy_retention_status (status,updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS privacy_retention_versions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, policy_id BIGINT UNSIGNED NOT NULL,
        version INT UNSIGNED NOT NULL, retention_days SMALLINT UNSIGNED NOT NULL,
        status ENUM('review_required','approved','paused') NOT NULL,
        change_reason VARCHAR(2000) NOT NULL, created_by VARCHAR(190) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_privacy_retention_version (policy_id,version),
        KEY idx_privacy_retention_version_time (policy_id,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS privacy_consent_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, consent_key CHAR(32) NOT NULL,
        anonymous_hash CHAR(64) NOT NULL, essential TINYINT(1) NOT NULL DEFAULT 1,
        analytics TINYINT(1) NOT NULL DEFAULT 0, marketing TINYINT(1) NOT NULL DEFAULT 0,
        source ENUM('storefront','admin_test','import') NOT NULL,
        policy_version INT UNSIGNED NOT NULL DEFAULT 1, ip_hash CHAR(64) NULL,
        user_agent_hash CHAR(64) NULL, occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_privacy_consent_key (consent_key),
        KEY idx_privacy_consent_source (source,occurred_at),
        KEY idx_privacy_consent_anonymous (anonymous_hash,occurred_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS privacy_requests (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, request_key CHAR(32) NOT NULL,
        request_type ENUM('export','erasure') NOT NULL,
        subject_kind ENUM('phone','email','order_reference') NOT NULL,
        subject_hash CHAR(64) NOT NULL, subject_mask VARCHAR(190) NOT NULL,
        channel ENUM('admin','storefront','support') NOT NULL DEFAULT 'admin',
        status ENUM('open','identity_verification','approved','completed','rejected','cancelled') NOT NULL DEFAULT 'open',
        match_count INT UNSIGNED NOT NULL DEFAULT 0, request_note VARCHAR(2000) NOT NULL,
        decision_note VARCHAR(2000) NULL, requested_by VARCHAR(190) NOT NULL DEFAULT 'authenticated admin',
        reviewed_by VARCHAR(190) NULL, reviewed_at DATETIME NULL, completed_at DATETIME NULL,
        requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_privacy_request_key (request_key),
        KEY idx_privacy_request_queue (status,request_type,requested_at),
        KEY idx_privacy_request_subject (subject_hash,requested_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS privacy_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, event_type VARCHAR(100) NOT NULL,
        subject_label VARCHAR(300) NOT NULL, actor_name VARCHAR(190) NOT NULL,
        note VARCHAR(2000) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_privacy_event_time (event_type,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $defaults = [
        ['orders_finance','Orders and finance evidence','Placed orders, invoices, delivery and settlement evidence.',2555],
        ['customer_profiles','Customer profiles','Customer identity, delivery preferences and service context.',1095],
        ['consent_ledger','Consent ledger','Essential, analytics and marketing consent evidence.',1825],
        ['support_context','Support context','Customer-service notes and resolution evidence.',730],
        ['tracking_events','Tracking events','Browser/server event ledger without raw customer identity.',395],
        ['security_recovery','Security and recovery evidence','Audit logs, security evidence and protected recovery records.',2555],
    ];
    $seed = $pdo->prepare("INSERT IGNORE INTO privacy_retention_policies (policy_key,label,scope_description,retention_days,status,version,change_reason) VALUES (:key,:label,:scope,:days,'review_required',1,'Operational starting point; requires qualified policy review before production use.')");
    $seedVersion = $pdo->prepare("INSERT IGNORE INTO privacy_retention_versions (policy_id,version,retention_days,status,change_reason,created_by) VALUES (:policy_id,1,:days,'review_required','Operational starting point; requires qualified policy review before production use.','system seed')");
    foreach ($defaults as [$key,$label,$scope,$days]) {
        $seed->execute([':key'=>$key,':label'=>$label,':scope'=>$scope,':days'=>$days]);
        $find = $pdo->prepare('SELECT id FROM privacy_retention_policies WHERE policy_key=:key LIMIT 1');
        $find->execute([':key'=>$key]);
        $policyId = (int) $find->fetchColumn();
        if ($policyId > 0) $seedVersion->execute([':policy_id'=>$policyId,':days'=>$days]);
    }
}

function privacyEvent(PDO $pdo, string $type, string $subject, string $actor, string $note): void
{
    $query = $pdo->prepare('INSERT INTO privacy_events (event_type,subject_label,actor_name,note) VALUES (:type,:subject,:actor,:note)');
    $query->execute([
        ':type'=>privacyText($type,100), ':subject'=>privacyText($subject,300),
        ':actor'=>privacyText($actor,190), ':note'=>privacyText($note,2000),
    ]);
}

function privacyNormalizeReference(string $kind, string $value): string
{
    $value = privacyText($value,320);
    if ($kind === 'phone') return preg_replace('/\D+/', '', $value) ?: '';
    if ($kind === 'email') return strtolower($value);
    return strtoupper(preg_replace('/\s+/', '', $value) ?: '');
}

function privacyMaskReference(string $kind, string $value): string
{
    if ($kind === 'email') {
        [$name,$domain] = array_pad(explode('@',$value,2),2,'');
        return ($name === '' ? '***' : substr($name,0,1) . '***') . ($domain === '' ? '' : '@' . $domain);
    }
    if ($kind === 'phone') return strlen($value) <= 4 ? '***' : str_repeat('*',max(3,strlen($value)-4)) . substr($value,-4);
    return strlen($value) <= 4 ? '***' : substr($value,0,2) . '***' . substr($value,-2);
}

function privacyOrdersColumns(PDO $pdo): array
{
    if (!privacyTableExists($pdo,'orders')) return [];
    $rows = $pdo->query('SHOW COLUMNS FROM orders')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    return array_values(array_filter(array_map(static fn(array $row): string=>(string)($row['Field']??''),$rows)));
}

function privacyFirstColumn(array $columns, array $candidates): ?string
{
    foreach ($candidates as $candidate) if (in_array($candidate,$columns,true)) return $candidate;
    return null;
}

function privacyOrderMatchCount(PDO $pdo, string $kind, string $reference): int
{
    $columns = privacyOrdersColumns($pdo);
    if ($columns === []) return 0;
    $column = $kind === 'phone'
        ? privacyFirstColumn($columns,['customer_phone','phone','billing_phone'])
        : ($kind === 'email'
            ? privacyFirstColumn($columns,['customer_email','email','billing_email'])
            : privacyFirstColumn($columns,['order_number','order_code','order_id','id']));
    if ($column === null) return 0;
    $quoted = '`' . str_replace('`','``',$column) . '`';
    if ($kind === 'phone') {
        $query = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE({$quoted},' ',''),'-',''),'+',''),'(',''),')','')=:reference");
    } elseif ($kind === 'email') {
        $query = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE LOWER(TRIM({$quoted}))=:reference");
    } else {
        $query = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE UPPER(REPLACE({$quoted},' ',''))=:reference");
    }
    $query->execute([':reference'=>$reference]);
    return (int) $query->fetchColumn();
}

function privacySupportMatchCount(PDO $pdo, string $kind, string $reference): int
{
    if (!privacyTableExists($pdo,'support_tickets')) return 0;
    $hash = hash('sha256','privacy-subject|' . $kind . '|' . $reference);
    $query = $pdo->prepare('SELECT COUNT(*) FROM support_tickets WHERE subject_hash=:subject_hash');
    $query->execute([':subject_hash'=>$hash]);
    return (int)$query->fetchColumn();
}

function privacySubjectMatchCount(PDO $pdo, string $kind, string $reference): int
{
    return privacyOrderMatchCount($pdo,$kind,$reference) + privacySupportMatchCount($pdo,$kind,$reference);
}

function privacyReadState(PDO $pdo): array
{
    privacyEnsureTables($pdo);
    $policies = $pdo->query('SELECT id,policy_key,label,scope_description,retention_days,status,version,change_reason,updated_by,reviewed_at,updated_at FROM privacy_retention_policies ORDER BY id')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $requests = $pdo->query("SELECT id,request_key,request_type,subject_kind,subject_mask,channel,status,match_count,request_note,decision_note,requested_by,reviewed_by,reviewed_at,completed_at,requested_at FROM privacy_requests ORDER BY FIELD(status,'open','identity_verification','approved','completed','rejected','cancelled'),id DESC LIMIT 200")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $events = $pdo->query('SELECT id,event_type,subject_label,actor_name,note,created_at FROM privacy_events ORDER BY id DESC LIMIT 200')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $consents = $pdo->query('SELECT id,essential,analytics,marketing,source,policy_version,occurred_at FROM privacy_consent_events ORDER BY id DESC LIMIT 200')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $storefrontConsents = privacyCount($pdo,'privacy_consent_events',"source='storefront'");
    $adminTests = privacyCount($pdo,'privacy_consent_events',"source='admin_test'");
    $openRequests = privacyCount($pdo,'privacy_requests',"status IN ('open','identity_verification','approved')");
    $summary = [
        'total_requests'=>privacyCount($pdo,'privacy_requests'),
        'open_requests'=>$openRequests,
        'export_requests'=>privacyCount($pdo,'privacy_requests',"request_type='export'"),
        'erasure_requests'=>privacyCount($pdo,'privacy_requests',"request_type='erasure'"),
        'storefront_consents'=>$storefrontConsents,
        'admin_tests'=>$adminTests,
        'policies_review_required'=>privacyCount($pdo,'privacy_retention_policies',"status='review_required'"),
    ];
    $consentBreakdown = [
        'essential_only'=>privacyCount($pdo,'privacy_consent_events',"source='storefront' AND analytics=0 AND marketing=0"),
        'analytics'=>privacyCount($pdo,'privacy_consent_events',"source='storefront' AND analytics=1"),
        'marketing'=>privacyCount($pdo,'privacy_consent_events',"source='storefront' AND marketing=1"),
        'all_optional'=>privacyCount($pdo,'privacy_consent_events',"source='storefront' AND analytics=1 AND marketing=1"),
    ];
    return [
        'summary'=>$summary, 'policies'=>$policies, 'requests'=>$requests,
        'consents'=>$consents, 'consent_breakdown'=>$consentBreakdown, 'events'=>$events,
        'cookie_config'=>[
            'policy_version'=>1,
            'categories'=>[
                ['key'=>'essential','label'=>'Essential','required'=>true,'default_enabled'=>true],
                ['key'=>'analytics','label'=>'Analytics','required'=>false,'default_enabled'=>false],
                ['key'=>'marketing','label'=>'Marketing','required'=>false,'default_enabled'=>false],
            ],
        ],
        'safety'=>[
            'legal_advice'=>false, 'automatic_erasure'=>false, 'automatic_retention_deletion'=>false,
            'raw_subject_reference_returned'=>false, 'essential_consent_can_be_disabled'=>false,
            'retention_cron_configured'=>false,
        ],
        'support_coverage'=>[
            'available'=>privacyTableExists($pdo,'support_tickets'),
            'subject_matching'=>'hashed_reference_only',
        ],
        'generated_at'=>date(DATE_ATOM),
    ];
}
