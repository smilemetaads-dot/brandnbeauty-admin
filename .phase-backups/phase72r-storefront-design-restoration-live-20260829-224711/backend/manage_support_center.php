<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/support_center_common.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) === 1) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

requireAdminAuth();

try {
    $pdo = getDatabaseConnection();
    supportEnsureTables($pdo);

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
        supportJson(200,array_merge(['success'=>true],supportReadState($pdo)));
    }
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        supportJson(405,['success'=>false,'message'=>'Method not allowed.']);
    }

    $payload = supportPayload();
    $action = supportText($payload['action'] ?? '',80);
    $message = '';

    if ($action === 'create_ticket') {
        $mode = supportText($payload['mode'] ?? 'test',20);
        $kind = supportText($payload['subject_kind'] ?? '',40);
        $reference = supportNormalizeReference($kind,supportText($payload['subject_reference'] ?? '',320));
        $channel = supportText($payload['channel'] ?? 'admin',30);
        $category = supportText($payload['category'] ?? 'other',30);
        $priority = supportText($payload['priority'] ?? 'normal',30);
        $subject = supportText($payload['subject_line'] ?? '',300);
        $summary = supportText($payload['summary'] ?? '',3000);
        $confirmedLive = !empty($payload['confirmed_live']);
        if (!in_array($mode,['test','live'],true)) throw new InvalidArgumentException('Select test or live ticket mode.');
        if ($mode === 'live' && !$confirmedLive) throw new InvalidArgumentException('Confirm that this is a real support ticket before saving it.');
        supportValidateReference($kind,$reference);
        if (!in_array($channel,['admin','website','messenger','facebook','whatsapp','phone','email'],true)) throw new InvalidArgumentException('Select a valid support channel.');
        if (!in_array($category,['order','delivery','return','payment','product','risk','other'],true)) throw new InvalidArgumentException('Select a valid support category.');
        if (!in_array($priority,['urgent','high','normal','low'],true)) throw new InvalidArgumentException('Select a valid priority.');
        if (strlen($subject) < 4 || strlen($summary) < 8) throw new InvalidArgumentException('Add a clear subject and support summary.');

        $sla = $pdo->prepare("SELECT first_response_minutes,resolution_minutes FROM support_sla_policies WHERE priority=:priority AND status='active' LIMIT 1");
        $sla->execute([':priority'=>$priority]);
        $policy = $sla->fetch(PDO::FETCH_ASSOC);
        if (!is_array($policy)) throw new RuntimeException('The selected SLA policy is unavailable.');
        $firstDue = date('Y-m-d H:i:s',time()+((int)$policy['first_response_minutes']*60));
        $resolutionDue = date('Y-m-d H:i:s',time()+((int)$policy['resolution_minutes']*60));
        $mask = supportMaskReference($kind,$reference);
        $hash = hash('sha256','privacy-subject|' . $kind . '|' . $reference);

        $save = $pdo->prepare("INSERT INTO support_tickets (ticket_key,mode,subject_kind,subject_hash,subject_mask,channel,category,priority,status,subject_line,summary,first_response_due_at,resolution_due_at) VALUES (:key,:mode,:kind,:hash,:mask,:channel,:category,:priority,'open',:subject,:summary,:first_due,:resolution_due)");
        $save->execute([
            ':key'=>bin2hex(random_bytes(16)), ':mode'=>$mode, ':kind'=>$kind, ':hash'=>$hash, ':mask'=>$mask,
            ':channel'=>$channel, ':category'=>$category, ':priority'=>$priority, ':subject'=>$subject,
            ':summary'=>$summary, ':first_due'=>$firstDue, ':resolution_due'=>$resolutionDue,
        ]);
        $ticketId = (int)$pdo->lastInsertId();
        supportEvent($pdo,$ticketId,'ticket_created','Ticket #' . $ticketId,ucfirst($mode) . ' · ' . ucfirst($priority) . ' · ' . $mask . ' · ' . $summary);
        $message = $mode === 'test' ? 'Test-safe support ticket created. No customer outcome changed.' : 'Live support ticket recorded. No business action was executed.';
    } elseif ($action === 'assign_ticket') {
        $ticketId = (int)($payload['ticket_id'] ?? 0);
        $assignee = supportText($payload['assignee'] ?? '',190);
        if ($ticketId < 1 || strlen($assignee) < 2) throw new InvalidArgumentException('Select a ticket and enter a valid assignee.');
        $ticket = supportFindTicket($pdo,$ticketId);
        $update = $pdo->prepare("UPDATE support_tickets SET assigned_to=:assignee,status=IF(status='open','in_progress',status) WHERE id=:id");
        $update->execute([':assignee'=>$assignee,':id'=>$ticketId]);
        supportEvent($pdo,$ticketId,'ticket_assigned','Ticket #' . $ticketId,'Assigned to ' . $assignee . ' from ' . (($ticket['assigned_to'] ?? '') ?: 'unassigned') . '.');
        $message = 'Ticket assignment recorded.';
    } elseif ($action === 'add_message') {
        $ticketId = (int)($payload['ticket_id'] ?? 0);
        $visibility = supportText($payload['visibility'] ?? '',30);
        $body = supportText($payload['body'] ?? '',4000);
        if ($ticketId < 1 || !in_array($visibility,['customer','internal'],true) || strlen($body) < 3) throw new InvalidArgumentException('Select message visibility and add a clear note.');
        supportFindTicket($pdo,$ticketId);
        $pdo->beginTransaction();
        try {
            $save = $pdo->prepare("INSERT INTO support_messages (ticket_id,visibility,body,delivery_state) VALUES (:ticket_id,:visibility,:body,'recorded_only')");
            $save->execute([':ticket_id'=>$ticketId,':visibility'=>$visibility,':body'=>$body]);
            if ($visibility === 'customer') {
                $update = $pdo->prepare('UPDATE support_tickets SET first_responded_at=COALESCE(first_responded_at,NOW()),status=IF(status=\'open\',\'in_progress\',status) WHERE id=:id');
                $update->execute([':id'=>$ticketId]);
            }
            supportEvent($pdo,$ticketId,'message_recorded','Ticket #' . $ticketId,ucfirst($visibility) . ' visibility · recorded only, not automatically sent.');
            $pdo->commit();
        } catch (Throwable $error) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $error; }
        $message = ucfirst($visibility) . ' note recorded. No message was sent automatically.';
    } elseif ($action === 'update_status') {
        $ticketId = (int)($payload['ticket_id'] ?? 0);
        $next = supportText($payload['status'] ?? '',40);
        $note = supportText($payload['note'] ?? '',2000);
        if ($ticketId < 1 || strlen($note) < 6) throw new InvalidArgumentException('Select a ticket status and add a review note.');
        $ticket = supportFindTicket($pdo,$ticketId);
        $transitions = [
            'open'=>['in_progress','waiting_customer','resolved','closed'],
            'in_progress'=>['waiting_customer','resolved','closed'],
            'waiting_customer'=>['in_progress','resolved','closed'],
            'resolved'=>['closed','in_progress'],
            'closed'=>['in_progress'],
        ];
        $current = (string)$ticket['status'];
        if (!in_array($next,$transitions[$current] ?? [],true)) throw new InvalidArgumentException('That ticket status transition is not allowed.');
        $update = $pdo->prepare("UPDATE support_tickets SET status=:status_value,resolved_at=CASE WHEN :status_check IN ('resolved','closed') THEN NOW() ELSE NULL END WHERE id=:id");
        $update->execute([':status_value'=>$next,':status_check'=>$next,':id'=>$ticketId]);
        supportEvent($pdo,$ticketId,'status_changed','Ticket #' . $ticketId,ucfirst(str_replace('_',' ',$current)) . ' to ' . ucfirst(str_replace('_',' ',$next)) . ' · ' . $note);
        $message = 'Ticket status updated. No linked order, payment, stock or delivery record changed.';
    } elseif ($action === 'create_handoff') {
        $ticketId = (int)($payload['ticket_id'] ?? 0);
        $domain = supportText($payload['domain'] ?? '',30);
        $context = supportText($payload['context'] ?? '',3000);
        if ($ticketId < 1 || !in_array($domain,['Returns','Delivery','Finance','Risk'],true) || strlen($context) < 8) throw new InvalidArgumentException('Select a handoff team and add useful context.');
        supportFindTicket($pdo,$ticketId);
        $save = $pdo->prepare("INSERT INTO support_handoffs (ticket_id,domain_name,context_note,status) VALUES (:ticket_id,:domain,:context,'prepared')");
        $save->execute([':ticket_id'=>$ticketId,':domain'=>$domain,':context'=>$context]);
        supportEvent($pdo,$ticketId,'handoff_prepared','Ticket #' . $ticketId,$domain . ' context prepared · ' . $context . ' · No business mutation executed.');
        $message = $domain . ' handoff context prepared. It did not execute a refund, restock, block or delivery change.';
    } else {
        throw new InvalidArgumentException('Unknown Support Center action.');
    }

    supportJson(200,['success'=>true,'message'=>$message,'state'=>supportReadState($pdo)]);
} catch (InvalidArgumentException $error) {
    supportJson(422,['success'=>false,'message'=>$error->getMessage()]);
} catch (Throwable $error) {
    error_log('manage_support_center.php: ' . $error->getMessage());
    supportJson(500,['success'=>false,'message'=>'Support Center is unavailable right now. No customer or business record was changed.']);
}
