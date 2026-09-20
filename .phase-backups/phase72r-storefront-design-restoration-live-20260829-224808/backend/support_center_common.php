<?php

declare(strict_types=1);

function supportText(mixed $value, int $limit = 1500): string
{
    $value = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($value, 0, $limit) : substr($value, 0, $limit);
}

function supportPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

function supportJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function supportTableExists(PDO $pdo, string $table): bool
{
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table'=>$table]);
    return (int) $query->fetchColumn() > 0;
}

function supportCount(PDO $pdo, string $table, string $where = '1=1'): int
{
    if (!supportTableExists($pdo, $table)) return 0;
    return (int) $pdo->query('SELECT COUNT(*) FROM `' . str_replace('`', '``', $table) . '` WHERE ' . $where)->fetchColumn();
}

function supportEnsureTables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS support_sla_policies (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        priority ENUM('urgent','high','normal','low') NOT NULL,
        first_response_minutes SMALLINT UNSIGNED NOT NULL,
        resolution_minutes MEDIUMINT UNSIGNED NOT NULL,
        status ENUM('active','paused') NOT NULL DEFAULT 'active',
        version INT UNSIGNED NOT NULL DEFAULT 1,
        updated_by VARCHAR(190) NOT NULL DEFAULT 'system seed',
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_support_sla_priority (priority)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS support_tickets (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        ticket_key CHAR(32) NOT NULL,
        mode ENUM('test','live') NOT NULL DEFAULT 'test',
        subject_kind ENUM('phone','email','order_reference','internal_reference') NOT NULL,
        subject_hash CHAR(64) NOT NULL,
        subject_mask VARCHAR(190) NOT NULL,
        channel ENUM('admin','website','messenger','facebook','whatsapp','phone','email') NOT NULL DEFAULT 'admin',
        category ENUM('order','delivery','return','payment','product','risk','other') NOT NULL DEFAULT 'other',
        priority ENUM('urgent','high','normal','low') NOT NULL DEFAULT 'normal',
        status ENUM('open','in_progress','waiting_customer','resolved','closed') NOT NULL DEFAULT 'open',
        subject_line VARCHAR(300) NOT NULL,
        summary VARCHAR(3000) NOT NULL,
        assigned_to VARCHAR(190) NULL,
        created_by VARCHAR(190) NOT NULL DEFAULT 'authenticated admin',
        first_response_due_at DATETIME NOT NULL,
        resolution_due_at DATETIME NOT NULL,
        first_responded_at DATETIME NULL,
        resolved_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_support_ticket_key (ticket_key),
        KEY idx_support_ticket_queue (status,priority,resolution_due_at),
        KEY idx_support_ticket_subject (subject_hash,created_at),
        KEY idx_support_ticket_assignee (assigned_to,status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS support_messages (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        ticket_id BIGINT UNSIGNED NOT NULL,
        visibility ENUM('customer','internal') NOT NULL,
        author_name VARCHAR(190) NOT NULL DEFAULT 'authenticated admin',
        body VARCHAR(4000) NOT NULL,
        delivery_state ENUM('recorded_only','not_sent') NOT NULL DEFAULT 'recorded_only',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_support_message_ticket (ticket_id,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS support_handoffs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        ticket_id BIGINT UNSIGNED NOT NULL,
        domain_name ENUM('Returns','Delivery','Finance','Risk') NOT NULL,
        context_note VARCHAR(3000) NOT NULL,
        status ENUM('prepared','acknowledged','closed') NOT NULL DEFAULT 'prepared',
        created_by VARCHAR(190) NOT NULL DEFAULT 'authenticated admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_support_handoff_ticket (ticket_id,domain_name,status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS support_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        ticket_id BIGINT UNSIGNED NULL,
        event_type VARCHAR(100) NOT NULL,
        subject_label VARCHAR(300) NOT NULL,
        actor_name VARCHAR(190) NOT NULL,
        note VARCHAR(3000) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_support_event_ticket (ticket_id,event_type,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $seed = $pdo->prepare("INSERT IGNORE INTO support_sla_policies (priority,first_response_minutes,resolution_minutes,status) VALUES (:priority,:first_response,:resolution,'active')");
    foreach ([['urgent',15,120],['high',60,480],['normal',240,1440],['low',480,2880]] as [$priority,$firstResponse,$resolution]) {
        $seed->execute([':priority'=>$priority,':first_response'=>$firstResponse,':resolution'=>$resolution]);
    }
}

function supportEvent(PDO $pdo, ?int $ticketId, string $type, string $subject, string $note): void
{
    $query = $pdo->prepare('INSERT INTO support_events (ticket_id,event_type,subject_label,actor_name,note) VALUES (:ticket_id,:type,:subject,:actor,:note)');
    $query->execute([
        ':ticket_id'=>$ticketId,
        ':type'=>supportText($type,100),
        ':subject'=>supportText($subject,300),
        ':actor'=>'authenticated admin',
        ':note'=>supportText($note,3000),
    ]);
}

function supportNormalizeReference(string $kind, string $value): string
{
    $value = supportText($value,320);
    if ($kind === 'phone') return preg_replace('/\D+/', '', $value) ?: '';
    if ($kind === 'email') return strtolower($value);
    return strtoupper(preg_replace('/\s+/', '', $value) ?: '');
}

function supportMaskReference(string $kind, string $value): string
{
    if ($kind === 'email') {
        [$name,$domain] = array_pad(explode('@',$value,2),2,'');
        return ($name === '' ? '***' : substr($name,0,1) . '***') . ($domain === '' ? '' : '@' . $domain);
    }
    if ($kind === 'phone') return strlen($value) <= 4 ? '***' : str_repeat('*',max(3,strlen($value)-4)) . substr($value,-4);
    return strlen($value) <= 4 ? '***' : substr($value,0,2) . '***' . substr($value,-2);
}

function supportValidateReference(string $kind, string $reference): void
{
    if (!in_array($kind,['phone','email','order_reference','internal_reference'],true)) throw new InvalidArgumentException('Select a valid subject reference type.');
    if ($kind === 'phone' && strlen($reference) < 7) throw new InvalidArgumentException('Enter a valid customer phone reference.');
    if ($kind === 'email' && filter_var($reference,FILTER_VALIDATE_EMAIL) === false) throw new InvalidArgumentException('Enter a valid customer email reference.');
    if (in_array($kind,['order_reference','internal_reference'],true) && strlen($reference) < 3) throw new InvalidArgumentException('Enter a valid order or internal reference.');
}

function supportFindTicket(PDO $pdo, int $ticketId): array
{
    $query = $pdo->prepare('SELECT * FROM support_tickets WHERE id=:id LIMIT 1');
    $query->execute([':id'=>$ticketId]);
    $ticket = $query->fetch(PDO::FETCH_ASSOC);
    if (!is_array($ticket)) supportJson(404,['success'=>false,'message'=>'The selected support ticket is unavailable.']);
    return $ticket;
}

function supportReadState(PDO $pdo): array
{
    supportEnsureTables($pdo);
    $policies = $pdo->query("SELECT id,priority,first_response_minutes,resolution_minutes,status,version,updated_by,updated_at FROM support_sla_policies ORDER BY FIELD(priority,'urgent','high','normal','low')")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $tickets = $pdo->query("SELECT t.id,t.ticket_key,t.mode,t.subject_kind,t.subject_mask,t.channel,t.category,t.priority,t.status,t.subject_line,t.summary,t.assigned_to,t.created_by,t.first_response_due_at,t.resolution_due_at,t.first_responded_at,t.resolved_at,t.created_at,t.updated_at,
        CASE WHEN t.status NOT IN ('resolved','closed') AND t.resolution_due_at<NOW() THEN 1 ELSE 0 END sla_breached,
        CASE WHEN t.status IN ('resolved','closed') THEN 0 ELSE TIMESTAMPDIFF(MINUTE,NOW(),t.resolution_due_at) END minutes_remaining,
        (SELECT COUNT(*) FROM support_messages m WHERE m.ticket_id=t.id) message_count,
        (SELECT COUNT(*) FROM support_handoffs h WHERE h.ticket_id=t.id) handoff_count
        FROM support_tickets t
        ORDER BY (t.status IN ('resolved','closed')), (t.resolution_due_at<NOW()) DESC, FIELD(t.priority,'urgent','high','normal','low'), t.id DESC LIMIT 250")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $messages = $pdo->query('SELECT id,ticket_id,visibility,author_name,body,delivery_state,created_at FROM support_messages ORDER BY id DESC LIMIT 400')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $handoffs = $pdo->query('SELECT id,ticket_id,domain_name,context_note,status,created_by,created_at FROM support_handoffs ORDER BY id DESC LIMIT 250')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $events = $pdo->query('SELECT id,ticket_id,event_type,subject_label,actor_name,note,created_at FROM support_events ORDER BY id DESC LIMIT 250')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $breachWhere = "status NOT IN ('resolved','closed') AND resolution_due_at<NOW()";
    return [
        'summary'=>[
            'total_tickets'=>supportCount($pdo,'support_tickets'),
            'open_tickets'=>supportCount($pdo,'support_tickets',"status NOT IN ('resolved','closed')"),
            'urgent_tickets'=>supportCount($pdo,'support_tickets',"status NOT IN ('resolved','closed') AND priority='urgent'"),
            'breached_tickets'=>supportCount($pdo,'support_tickets',$breachWhere),
            'waiting_customer'=>supportCount($pdo,'support_tickets',"status='waiting_customer'"),
            'test_tickets'=>supportCount($pdo,'support_tickets',"mode='test'"),
            'live_tickets'=>supportCount($pdo,'support_tickets',"mode='live'"),
            'prepared_handoffs'=>supportCount($pdo,'support_handoffs',"status='prepared'"),
        ],
        'sla_policies'=>$policies,
        'tickets'=>$tickets,
        'messages'=>$messages,
        'handoffs'=>$handoffs,
        'events'=>$events,
        'coverage'=>[
            'privacy_export_support'=>true,
            'protected_backup_support'=>true,
            'ticket_subjects_masked'=>true,
            'customer_internal_visibility'=>true,
        ],
        'safety'=>[
            'automatic_refund'=>false,
            'automatic_restock'=>false,
            'automatic_customer_block'=>false,
            'automatic_delivery_status_change'=>false,
            'customer_message_auto_send'=>false,
            'test_changes_customer_outcome'=>false,
        ],
        'generated_at'=>date(DATE_ATOM),
    ];
}
