<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/routine_compatibility_common.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['https://brandnbeauty.com', 'https://www.brandnbeauty.com', 'https://admin.brandnbeauty.com'];
$localOrigin = preg_match('/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/', $origin) === 1;
if ($localOrigin || in_array($origin, $allowedOrigins, true)) { header('Access-Control-Allow-Origin: ' . $origin); header('Vary: Origin'); }
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }
requireAdminAuth();

function routineCompatibilityJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = getDatabaseConnection();
    ensureRoutineCompatibilitySchema($pdo);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'GET') routineCompatibilityJson(200, array_merge(['success' => true, 'module' => 'routine-product-compatibility'], routineCompatibilityState($pdo)));
    if ($method !== 'POST') routineCompatibilityJson(405, ['success' => false, 'message' => 'Method not allowed.']);
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($payload)) routineCompatibilityJson(422, ['success' => false, 'message' => 'A valid compatibility action is required.']);
    if (($payload['confirmed'] ?? false) !== true) routineCompatibilityJson(422, ['success' => false, 'message' => 'Human confirmation is required.']);
    $action = strtolower(routineCompatibilityText($payload['action'] ?? '', 60));

    if ($action === 'save_check_draft') {
        $title = routineCompatibilityText($payload['title'] ?? '', 191);
        $owner = routineCompatibilityText($payload['owner'] ?? '', 191);
        $context = strtolower(routineCompatibilityText($payload['context'] ?? 'same_routine', 40));
        if (!in_array($context, ['same_routine', 'am', 'pm', 'alternating', 'comparison'], true)) $context = 'same_routine';
        $productIds = routineCompatibilityProductIds($pdo, $payload['product_ids'] ?? []);
        if (strlen($title) < 3 || $owner === '' || count($productIds) < 2) routineCompatibilityJson(422, ['success' => false, 'message' => 'Title, owner and at least two real products are required.']);
        $evaluation = routineCompatibilityEvaluate($pdo, $productIds, $context);
        $pdo->beginTransaction();
        $statement = $pdo->prepare("INSERT INTO routine_compatibility_checks (title,context,product_ids,product_snapshot,outcome,rationale,matched_rules,evidence_gaps,owner,status) VALUES (:title,:context,:product_ids,:product_snapshot,:outcome,:rationale,:matched_rules,:evidence_gaps,:owner,'draft')");
        $statement->execute([
            ':title' => $title,
            ':context' => $context,
            ':product_ids' => json_encode($productIds, JSON_UNESCAPED_UNICODE),
            ':product_snapshot' => json_encode($evaluation['product_snapshot'], JSON_UNESCAPED_UNICODE),
            ':outcome' => $evaluation['outcome'],
            ':rationale' => json_encode($evaluation['rationale'], JSON_UNESCAPED_UNICODE),
            ':matched_rules' => json_encode($evaluation['matched_rules'], JSON_UNESCAPED_UNICODE),
            ':evidence_gaps' => json_encode($evaluation['evidence_gaps'], JSON_UNESCAPED_UNICODE),
            ':owner' => $owner,
        ]);
        $id = (int) $pdo->lastInsertId();
        $after = routineCompatibilityCheckRaw($pdo, $id, false) ?: [];
        $event = $pdo->prepare("INSERT INTO routine_compatibility_decisions (check_id,action_name,decision_name,reason,actor,before_payload,after_payload) VALUES (:id,'save_draft','draft_saved',:reason,:actor,NULL,:after_payload)");
        $event->execute([':id' => $id, ':reason' => 'Human-confirmed compatibility evidence snapshot.', ':actor' => $owner, ':after_payload' => json_encode($after, JSON_UNESCAPED_UNICODE)]);
        $pdo->commit();
        routineCompatibilityJson(200, array_merge(['success' => true, 'message' => 'Compatibility check draft saved.'], routineCompatibilityState($pdo)));
    }

    if ($action === 'record_decision') {
        $id = max(0, (int) ($payload['id'] ?? 0));
        $decision = strtolower(routineCompatibilityText($payload['decision'] ?? '', 80));
        $reason = routineCompatibilityText($payload['reason'] ?? '', 1000);
        $actor = routineCompatibilityText($payload['actor'] ?? '', 191);
        $allowed = ['approve_evidence', 'confirm_schedule', 'confirm_hold', 'request_evidence'];
        if ($id < 1 || !in_array($decision, $allowed, true) || strlen($reason) < 12 || $actor === '') routineCompatibilityJson(422, ['success' => false, 'message' => 'A valid decision, accountable owner and detailed reason are required.']);
        $pdo->beginTransaction();
        $before = routineCompatibilityCheckRaw($pdo, $id, true);
        if (!$before) { $pdo->rollBack(); routineCompatibilityJson(404, ['success' => false, 'message' => 'The selected check was not found.']); }
        if (($before['status'] ?? '') === 'archived') { $pdo->rollBack(); routineCompatibilityJson(409, ['success' => false, 'message' => 'Archived checks cannot receive new decisions.']); }
        $outcome = (string) ($before['outcome'] ?? 'insufficient_evidence');
        if (in_array($outcome, ['hold', 'insufficient_evidence'], true) && in_array($decision, ['approve_evidence', 'confirm_schedule'], true)) { $pdo->rollBack(); routineCompatibilityJson(409, ['success' => false, 'message' => 'A hold or insufficient-evidence result cannot be approved as compatible.']); }
        if ($outcome === 'hold' && $decision !== 'confirm_hold' && $decision !== 'request_evidence') { $pdo->rollBack(); routineCompatibilityJson(409, ['success' => false, 'message' => 'This hard result can only be held or returned for more evidence.']); }
        $pdo->prepare("UPDATE routine_compatibility_checks SET status='reviewed',reviewed_at=NOW() WHERE id=:id")->execute([':id' => $id]);
        $after = routineCompatibilityCheckRaw($pdo, $id, false) ?: [];
        $event = $pdo->prepare("INSERT INTO routine_compatibility_decisions (check_id,action_name,decision_name,reason,actor,before_payload,after_payload) VALUES (:id,'human_decision',:decision,:reason,:actor,:before_payload,:after_payload)");
        $event->execute([':id' => $id, ':decision' => $decision, ':reason' => $reason, ':actor' => $actor, ':before_payload' => json_encode($before, JSON_UNESCAPED_UNICODE), ':after_payload' => json_encode($after, JSON_UNESCAPED_UNICODE)]);
        $pdo->commit();
        routineCompatibilityJson(200, array_merge(['success' => true, 'message' => 'Human compatibility decision recorded.'], routineCompatibilityState($pdo)));
    }

    routineCompatibilityJson(422, ['success' => false, 'message' => 'Unknown compatibility action.']);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('manage_routine_compatibility.php: ' . $error->getMessage());
    routineCompatibilityJson(500, ['success' => false, 'message' => 'Routine compatibility is temporarily unavailable.']);
}

