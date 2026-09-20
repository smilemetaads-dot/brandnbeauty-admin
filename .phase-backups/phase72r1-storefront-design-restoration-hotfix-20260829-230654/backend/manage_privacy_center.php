<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/privacy_common.php';

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

function privacyValidateReference(string $kind, string $reference): void
{
    if (!in_array($kind,['phone','email','order_reference'],true)) throw new InvalidArgumentException('Select phone, email or order reference.');
    if ($kind === 'phone' && strlen($reference) < 7) throw new InvalidArgumentException('Enter a valid customer phone reference.');
    if ($kind === 'email' && filter_var($reference,FILTER_VALIDATE_EMAIL) === false) throw new InvalidArgumentException('Enter a valid customer email reference.');
    if ($kind === 'order_reference' && strlen($reference) < 3) throw new InvalidArgumentException('Enter a valid order reference.');
}

try {
    $pdo = getDatabaseConnection();
    privacyEnsureTables($pdo);

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
        $payload = privacyPayload();
        $action = privacyText($payload['action'] ?? '',80);

        if ($action === 'review_policy') {
            $policyId = (int)($payload['policy_id'] ?? 0);
            $retentionDays = (int)($payload['retention_days'] ?? 0);
            $status = privacyText($payload['status'] ?? '',40);
            $reason = privacyText($payload['reason'] ?? '',2000);
            $confirmed = !empty($payload['confirmed']);
            if ($policyId < 1 || $retentionDays < 30 || $retentionDays > 3650 || !in_array($status,['review_required','approved','paused'],true) || strlen($reason) < 12 || !$confirmed) {
                privacyJson(422,['success'=>false,'message'=>'Review the retention period, status, reason and confirmation.']);
            }
            $find = $pdo->prepare('SELECT id,label,version FROM privacy_retention_policies WHERE id=:id LIMIT 1');
            $find->execute([':id'=>$policyId]);
            $policy = $find->fetch(PDO::FETCH_ASSOC);
            if (!is_array($policy)) privacyJson(404,['success'=>false,'message'=>'The selected retention policy is unavailable.']);
            $nextVersion = (int)$policy['version'] + 1;
            $pdo->beginTransaction();
            try {
                $update = $pdo->prepare('UPDATE privacy_retention_policies SET retention_days=:days,status=:status,version=:version,change_reason=:reason,updated_by=\'authenticated admin\',reviewed_at=NOW() WHERE id=:id');
                $update->execute([':days'=>$retentionDays,':status'=>$status,':version'=>$nextVersion,':reason'=>$reason,':id'=>$policyId]);
                $version = $pdo->prepare('INSERT INTO privacy_retention_versions (policy_id,version,retention_days,status,change_reason,created_by) VALUES (:policy_id,:version,:days,:status,:reason,\'authenticated admin\')');
                $version->execute([':policy_id'=>$policyId,':version'=>$nextVersion,':days'=>$retentionDays,':status'=>$status,':reason'=>$reason]);
                privacyEvent($pdo,'retention_policy_reviewed',(string)$policy['label'],'authenticated admin','Version ' . $nextVersion . ' · ' . $retentionDays . ' days · ' . str_replace('_',' ',$status) . ' · ' . $reason);
                $pdo->commit();
            } catch (Throwable $error) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $error; }
            privacyJson(200,['success'=>true,'message'=>'Retention policy review recorded. No data was deleted.','state'=>privacyReadState($pdo)]);
        }

        if ($action === 'create_request') {
            $type = privacyText($payload['request_type'] ?? '',40);
            $kind = privacyText($payload['subject_kind'] ?? '',40);
            $reference = privacyNormalizeReference($kind,privacyText($payload['subject_reference'] ?? '',320));
            $note = privacyText($payload['note'] ?? '',2000);
            if (!in_array($type,['export','erasure'],true) || strlen($note) < 8) privacyJson(422,['success'=>false,'message'=>'Select export or erasure and add a clear request note.']);
            privacyValidateReference($kind,$reference);
            $mask = privacyMaskReference($kind,$reference);
            $hash = hash('sha256','privacy-subject|' . $kind . '|' . $reference);
            $matches = privacySubjectMatchCount($pdo,$kind,$reference);
            $save = $pdo->prepare("INSERT INTO privacy_requests (request_key,request_type,subject_kind,subject_hash,subject_mask,channel,status,match_count,request_note) VALUES (:key,:type,:kind,:hash,:mask,'admin','open',:matches,:note)");
            $save->execute([':key'=>bin2hex(random_bytes(16)),':type'=>$type,':kind'=>$kind,':hash'=>$hash,':mask'=>$mask,':matches'=>$matches,':note'=>$note]);
            $requestId = (int)$pdo->lastInsertId();
            privacyEvent($pdo,'privacy_request_opened',ucfirst($type) . ' request #' . $requestId,'authenticated admin',$mask . ' · ' . $matches . ' matching order/support record(s) · ' . $note);
            privacyJson(200,['success'=>true,'message'=>ucfirst($type) . ' request opened with a masked subject reference.','state'=>privacyReadState($pdo)]);
        }

        if ($action === 'advance_request') {
            $requestId = (int)($payload['request_id'] ?? 0);
            $next = privacyText($payload['status'] ?? '',50);
            $note = privacyText($payload['note'] ?? '',2000);
            if ($requestId < 1 || strlen($note) < 8) privacyJson(422,['success'=>false,'message'=>'Select a request outcome and add a review note.']);
            $find = $pdo->prepare('SELECT id,request_type,subject_mask,status FROM privacy_requests WHERE id=:id LIMIT 1');
            $find->execute([':id'=>$requestId]);
            $request = $find->fetch(PDO::FETCH_ASSOC);
            if (!is_array($request)) privacyJson(404,['success'=>false,'message'=>'The selected privacy request is unavailable.']);
            $transitions = [
                'open'=>['identity_verification','cancelled'],
                'identity_verification'=>['approved','rejected','cancelled'],
                'approved'=>['completed','cancelled'],
                'completed'=>[], 'rejected'=>[], 'cancelled'=>[],
            ];
            $current = (string)$request['status'];
            if (!in_array($next,$transitions[$current] ?? [],true)) privacyJson(409,['success'=>false,'message'=>'That request status change is not allowed from the current stage.']);
            $completed = $next === 'completed' ? 'NOW()' : 'completed_at';
            $update = $pdo->prepare("UPDATE privacy_requests SET status=:status,decision_note=:note,reviewed_by='authenticated admin',reviewed_at=NOW(),completed_at={$completed} WHERE id=:id AND status=:current");
            $update->execute([':status'=>$next,':note'=>$note,':id'=>$requestId,':current'=>$current]);
            privacyEvent($pdo,'privacy_request_' . $next,ucfirst((string)$request['request_type']) . ' request #' . $requestId,'authenticated admin',(string)$request['subject_mask'] . ' · ' . $note . ' · No automatic customer-data mutation.');
            privacyJson(200,['success'=>true,'message'=>'Privacy request moved to ' . str_replace('_',' ',$next) . '.','state'=>privacyReadState($pdo)]);
        }

        if ($action === 'run_consent_test') {
            $analytics = !empty($payload['analytics']);
            $marketing = !empty($payload['marketing']);
            $testId = bin2hex(random_bytes(16));
            $save = $pdo->prepare("INSERT INTO privacy_consent_events (consent_key,anonymous_hash,essential,analytics,marketing,source,policy_version) VALUES (:key,:hash,1,:analytics,:marketing,'admin_test',1)");
            $save->execute([':key'=>bin2hex(random_bytes(16)),':hash'=>hash('sha256','admin-test|' . $testId),':analytics'=>$analytics?1:0,':marketing'=>$marketing?1:0]);
            privacyEvent($pdo,'cookie_consent_test','Cookie consent contract','authenticated admin','Essential on · Analytics ' . ($analytics?'on':'off') . ' · Marketing ' . ($marketing?'on':'off') . ' · Synthetic test excluded from storefront totals.');
            privacyJson(200,['success'=>true,'message'=>'Cookie-consent contract test recorded separately from storefront totals.','state'=>privacyReadState($pdo)]);
        }

        privacyJson(422,['success'=>false,'message'=>'Unsupported Privacy Center action.']);
    }

    privacyJson(200,['success'=>true]+privacyReadState($pdo));
} catch (InvalidArgumentException $error) {
    privacyJson(422,['success'=>false,'message'=>$error->getMessage()]);
} catch (Throwable $error) {
    error_log('manage_privacy_center.php: ' . $error->getMessage());
    privacyJson(500,['success'=>false,'message'=>'Privacy Center could not complete the protected request.']);
}
