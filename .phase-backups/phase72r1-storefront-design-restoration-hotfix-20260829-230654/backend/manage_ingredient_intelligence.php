<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/ingredient_intelligence_common.php';

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

function ingredientIntelligenceJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function ingredientIntelligenceProfileRaw(PDO $pdo, int $id, bool $lock = false): ?array
{
    $statement = $pdo->prepare('SELECT * FROM ingredient_profiles WHERE id=:id LIMIT 1' . ($lock ? ' FOR UPDATE' : ''));
    $statement->execute([':id' => $id]);
    $row = $statement->fetch(PDO::FETCH_ASSOC);
    if (!$row) return null;
    $sources = $pdo->prepare('SELECT * FROM ingredient_evidence_sources WHERE ingredient_id=:id ORDER BY id');
    $sources->execute([':id' => $id]);
    $row['sources'] = $sources->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $links = $pdo->prepare('SELECT * FROM product_ingredient_links WHERE ingredient_id=:id ORDER BY product_id');
    $links->execute([':id' => $id]);
    $row['product_links'] = $links->fetchAll(PDO::FETCH_ASSOC) ?: [];
    return $row;
}

function ingredientIntelligenceRuleRaw(PDO $pdo, int $id, bool $lock = false): ?array
{
    $statement = $pdo->prepare('SELECT * FROM ingredient_compatibility_rules WHERE id=:id LIMIT 1' . ($lock ? ' FOR UPDATE' : ''));
    $statement->execute([':id' => $id]);
    $row = $statement->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function ingredientIntelligenceProductIds(PDO $pdo, mixed $value): array
{
    if (!is_array($value)) return [];
    $available = ingredientIntelligenceProductMap($pdo);
    $ids = [];
    foreach ($value as $candidate) {
        $id = (string) max(0, (int) $candidate);
        if ($id === '0' || isset($ids[$id])) continue;
        if (!isset($available[$id])) throw new InvalidArgumentException('One mapped product no longer exists in the live catalog.');
        $ids[$id] = true;
    }
    return array_keys($ids);
}

function ingredientIntelligenceProfileMap(PDO $pdo): array
{
    $map = [];
    foreach (ingredientIntelligenceProfiles($pdo) as $profile) $map[(string) $profile['id']] = $profile;
    return $map;
}

try {
    $pdo = getDatabaseConnection();
    ensureIngredientIntelligenceSchema($pdo);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'GET') ingredientIntelligenceJson(200, array_merge(['success' => true, 'module' => 'ingredient-intelligence'], ingredientIntelligenceState($pdo)));
    if ($method !== 'POST') ingredientIntelligenceJson(405, ['success' => false, 'message' => 'Method not allowed.']);
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($payload)) ingredientIntelligenceJson(422, ['success' => false, 'message' => 'A valid ingredient action is required.']);
    if (($payload['confirmed'] ?? false) !== true) ingredientIntelligenceJson(422, ['success' => false, 'message' => 'Human confirmation is required before ingredient intelligence changes.']);
    $action = strtolower(ingredientIntelligenceText($payload['action'] ?? '', 60));

    if ($action === 'save_profile_draft') {
        $id = max(0, (int) ($payload['id'] ?? 0));
        $name = ingredientIntelligenceText($payload['name'] ?? '', 191);
        $inci = ingredientIntelligenceText($payload['inci'] ?? '', 191);
        $family = ingredientIntelligenceText($payload['family'] ?? '', 191);
        $owner = ingredientIntelligenceText($payload['owner'] ?? '', 191);
        $summary = ingredientIntelligenceText($payload['summary'] ?? '', 4000);
        $usage = ingredientIntelligenceText($payload['usage_guidance'] ?? '', 4000);
        $strength = ingredientIntelligenceText($payload['strength_guidance'] ?? '', 1000);
        $aliases = ingredientIntelligenceList($payload['aliases'] ?? []);
        $roles = ingredientIntelligenceList($payload['roles'] ?? []);
        $concerns = ingredientIntelligenceList($payload['concerns'] ?? []);
        $safety = strtolower(ingredientIntelligenceText($payload['safety_level'] ?? 'routine_safe', 40));
        $evidence = strtolower(ingredientIntelligenceText($payload['evidence_status'] ?? 'unverified', 40));
        $sourceName = ingredientIntelligenceText($payload['source_name'] ?? '', 191);
        $sourceReference = ingredientIntelligenceText($payload['source_reference'] ?? '', 1000);
        $productIds = ingredientIntelligenceProductIds($pdo, $payload['product_ids'] ?? []);
        if ($name === '' || $inci === '' || $family === '' || $owner === '' || strlen($summary) < 12 || strlen($usage) < 8) ingredientIntelligenceJson(422, ['success' => false, 'message' => 'Name, INCI, family, owner, summary and usage guidance are required.']);
        if (!in_array($safety, ['routine_safe', 'use_with_care', 'professional_review'], true)) ingredientIntelligenceJson(422, ['success' => false, 'message' => 'Choose a supported safety level.']);
        if (!in_array($evidence, ['unverified', 'verified', 'review_due', 'restricted'], true)) ingredientIntelligenceJson(422, ['success' => false, 'message' => 'Choose a supported evidence status.']);

        $pdo->beginTransaction();
        $before = $id > 0 ? ingredientIntelligenceProfileRaw($pdo, $id, true) : null;
        if ($id > 0 && !$before) { $pdo->rollBack(); ingredientIntelligenceJson(404, ['success' => false, 'message' => 'The selected ingredient profile was not found.']); }
        if ($before && in_array((string) ($before['status'] ?? 'draft'), ['active', 'archived'], true)) { $pdo->rollBack(); ingredientIntelligenceJson(409, ['success' => false, 'message' => 'Restrict an active profile before editing. Archived profiles cannot be rewritten.']); }
        $parameters = [
            ':name' => $name,
            ':inci' => $inci,
            ':aliases' => json_encode($aliases, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ':family' => $family,
            ':roles' => json_encode($roles, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ':concerns' => json_encode($concerns, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ':strength_guidance' => $strength === '' ? null : $strength,
            ':usage_guidance' => $usage,
            ':safety_level' => $safety,
            ':evidence_status' => $evidence,
            ':summary' => $summary,
            ':owner' => $owner,
        ];
        if ($id === 0) {
            $statement = $pdo->prepare("INSERT INTO ingredient_profiles (name,inci,aliases,family,roles,concerns,strength_guidance,usage_guidance,safety_level,evidence_status,summary,owner,status) VALUES (:name,:inci,:aliases,:family,:roles,:concerns,:strength_guidance,:usage_guidance,:safety_level,:evidence_status,:summary,:owner,'draft')");
            $statement->execute($parameters);
            $id = (int) $pdo->lastInsertId();
        } else {
            $parameters[':id'] = $id;
            $statement = $pdo->prepare("UPDATE ingredient_profiles SET name=:name,inci=:inci,aliases=:aliases,family=:family,roles=:roles,concerns=:concerns,strength_guidance=:strength_guidance,usage_guidance=:usage_guidance,safety_level=:safety_level,evidence_status=:evidence_status,summary=:summary,owner=:owner,status='draft' WHERE id=:id");
            $statement->execute($parameters);
        }
        $pdo->prepare('DELETE FROM ingredient_evidence_sources WHERE ingredient_id=:id')->execute([':id' => $id]);
        if ($sourceName !== '') {
            $source = $pdo->prepare("INSERT INTO ingredient_evidence_sources (ingredient_id,source_name,source_reference,source_type,status) VALUES (:ingredient_id,:source_name,:source_reference,'registered_evidence','registered')");
            $source->execute([':ingredient_id' => $id, ':source_name' => $sourceName, ':source_reference' => $sourceReference === '' ? null : $sourceReference]);
        }
        $pdo->prepare('DELETE FROM product_ingredient_links WHERE ingredient_id=:id')->execute([':id' => $id]);
        $link = $pdo->prepare("INSERT INTO product_ingredient_links (ingredient_id,product_id,declared_name,status) VALUES (:ingredient_id,:product_id,:declared_name,'draft')");
        foreach ($productIds as $productId) $link->execute([':ingredient_id' => $id, ':product_id' => (int) $productId, ':declared_name' => $inci]);
        $after = ingredientIntelligenceProfileRaw($pdo, $id) ?? [];
        ingredientIntelligenceEvent($pdo, 'profile', $id, $before ? 'update_profile_draft' : 'create_profile_draft', $before, $after, 'Ingredient evidence draft saved by a human administrator.');
        $pdo->commit();
        ingredientIntelligenceJson(200, array_merge(['success' => true, 'module' => 'ingredient-intelligence', 'message' => 'Ingredient draft saved. No product, claim, routine or customer record changed.'], ingredientIntelligenceState($pdo)));
    }

    if ($action === 'save_rule_draft') {
        $id = max(0, (int) ($payload['id'] ?? 0));
        $firstId = max(0, (int) ($payload['first_ingredient_id'] ?? 0));
        $secondId = max(0, (int) ($payload['second_ingredient_id'] ?? 0));
        $relationship = strtolower(ingredientIntelligenceText($payload['relationship'] ?? 'compatible', 40));
        $scope = ingredientIntelligenceText($payload['scope'] ?? '', 1000);
        $instruction = ingredientIntelligenceText($payload['instruction'] ?? '', 4000);
        $evidence = strtolower(ingredientIntelligenceText($payload['evidence_status'] ?? 'unverified', 40));
        $owner = ingredientIntelligenceText($payload['owner'] ?? '', 191);
        $profileMap = ingredientIntelligenceProfileMap($pdo);
        if ($firstId === 0 || $secondId === 0 || $firstId === $secondId || !isset($profileMap[(string) $firstId], $profileMap[(string) $secondId])) ingredientIntelligenceJson(422, ['success' => false, 'message' => 'Choose two different real ingredient profiles.']);
        if (!in_array($relationship, ['compatible', 'use_with_care', 'separate_schedule', 'do_not_combine'], true)) ingredientIntelligenceJson(422, ['success' => false, 'message' => 'Choose a supported relationship.']);
        if (!in_array($evidence, ['unverified', 'verified', 'review_due', 'restricted'], true) || strlen($instruction) < 8 || $owner === '') ingredientIntelligenceJson(422, ['success' => false, 'message' => 'Rule evidence, owner and operational instruction are required.']);
        $pdo->beginTransaction();
        $before = $id > 0 ? ingredientIntelligenceRuleRaw($pdo, $id, true) : null;
        if ($id > 0 && !$before) { $pdo->rollBack(); ingredientIntelligenceJson(404, ['success' => false, 'message' => 'The selected compatibility rule was not found.']); }
        if ($before && in_array((string) ($before['status'] ?? 'draft'), ['active', 'archived'], true)) { $pdo->rollBack(); ingredientIntelligenceJson(409, ['success' => false, 'message' => 'Published or archived rules cannot be rewritten.']); }
        $parameters = [':first_id' => $firstId, ':second_id' => $secondId, ':relationship' => $relationship, ':scope' => $scope === '' ? null : $scope, ':instruction' => $instruction, ':evidence_status' => $evidence, ':owner' => $owner];
        if ($id === 0) {
            $statement = $pdo->prepare("INSERT INTO ingredient_compatibility_rules (first_ingredient_id,second_ingredient_id,relationship,scope,instruction,evidence_status,owner,status) VALUES (:first_id,:second_id,:relationship,:scope,:instruction,:evidence_status,:owner,'draft')");
            $statement->execute($parameters);
            $id = (int) $pdo->lastInsertId();
        } else {
            $parameters[':id'] = $id;
            $statement = $pdo->prepare("UPDATE ingredient_compatibility_rules SET first_ingredient_id=:first_id,second_ingredient_id=:second_id,relationship=:relationship,scope=:scope,instruction=:instruction,evidence_status=:evidence_status,owner=:owner,status='draft' WHERE id=:id");
            $statement->execute($parameters);
        }
        $after = ingredientIntelligenceRuleRaw($pdo, $id) ?? [];
        ingredientIntelligenceEvent($pdo, 'rule', $id, $before ? 'update_rule_draft' : 'create_rule_draft', $before, $after, 'Compatibility rule draft saved by a human administrator.');
        $pdo->commit();
        ingredientIntelligenceJson(200, array_merge(['success' => true, 'module' => 'ingredient-intelligence', 'message' => 'Compatibility rule draft saved. No routine or customer record changed.'], ingredientIntelligenceState($pdo)));
    }

    $reason = ingredientIntelligenceText($payload['reason'] ?? '', 1000);
    $id = max(0, (int) ($payload['id'] ?? 0));
    if ($id === 0 || $reason === '') ingredientIntelligenceJson(422, ['success' => false, 'message' => 'Select a record and write an audit reason.']);

    if (in_array($action, ['publish_profile', 'restrict_profile', 'archive_profile'], true)) {
        $pdo->beginTransaction();
        $before = ingredientIntelligenceProfileRaw($pdo, $id, true);
        if (!$before) { $pdo->rollBack(); ingredientIntelligenceJson(404, ['success' => false, 'message' => 'The selected ingredient profile was not found.']); }
        $current = (string) ($before['status'] ?? 'draft');
        if ($action === 'publish_profile') {
            if (!in_array($current, ['draft', 'restricted'], true)) { $pdo->rollBack(); ingredientIntelligenceJson(409, ['success' => false, 'message' => 'Only a draft or restricted profile can be published.']); }
            $readiness = ingredientIntelligenceProfileReadiness($before, $before['sources'] ?? []);
            if (!($readiness['ready'] ?? false)) { $pdo->rollBack(); ingredientIntelligenceJson(422, ['success' => false, 'message' => 'Resolve evidence blockers before publication.', 'blockers' => $readiness['blockers'] ?? []]); }
            $pdo->prepare("UPDATE ingredient_profiles SET status='active',published_at=NOW() WHERE id=:id")->execute([':id' => $id]);
            $pdo->prepare("UPDATE product_ingredient_links SET status='verified' WHERE ingredient_id=:id")->execute([':id' => $id]);
        } elseif ($action === 'restrict_profile') {
            if ($current !== 'active') { $pdo->rollBack(); ingredientIntelligenceJson(409, ['success' => false, 'message' => 'Only an active profile can be restricted.']); }
            $pdo->prepare("UPDATE ingredient_profiles SET status='restricted',evidence_status='restricted' WHERE id=:id")->execute([':id' => $id]);
            $pdo->prepare("UPDATE product_ingredient_links SET status='blocked' WHERE ingredient_id=:id")->execute([':id' => $id]);
        } else {
            if ($current === 'active') { $pdo->rollBack(); ingredientIntelligenceJson(409, ['success' => false, 'message' => 'Restrict an active profile before archiving.']); }
            if ($current === 'archived') { $pdo->rollBack(); ingredientIntelligenceJson(409, ['success' => false, 'message' => 'This ingredient profile is already archived.']); }
            $pdo->prepare("UPDATE ingredient_profiles SET status='archived' WHERE id=:id")->execute([':id' => $id]);
        }
        $after = ingredientIntelligenceProfileRaw($pdo, $id) ?? [];
        ingredientIntelligenceEvent($pdo, 'profile', $id, $action, $before, $after, $reason);
        $pdo->commit();
        ingredientIntelligenceJson(200, array_merge(['success' => true, 'module' => 'ingredient-intelligence', 'message' => 'Ingredient profile decision recorded with append-only evidence.'], ingredientIntelligenceState($pdo)));
    }

    if (in_array($action, ['publish_rule', 'archive_rule'], true)) {
        $pdo->beginTransaction();
        $before = ingredientIntelligenceRuleRaw($pdo, $id, true);
        if (!$before) { $pdo->rollBack(); ingredientIntelligenceJson(404, ['success' => false, 'message' => 'The selected compatibility rule was not found.']); }
        $current = (string) ($before['status'] ?? 'draft');
        if ($action === 'publish_rule') {
            if ($current !== 'draft') { $pdo->rollBack(); ingredientIntelligenceJson(409, ['success' => false, 'message' => 'Only a draft compatibility rule can be published.']); }
            $readiness = ingredientIntelligenceRuleReadiness($before, ingredientIntelligenceProfileMap($pdo));
            if (!($readiness['ready'] ?? false)) { $pdo->rollBack(); ingredientIntelligenceJson(422, ['success' => false, 'message' => 'Resolve rule blockers before publication.', 'blockers' => $readiness['blockers'] ?? []]); }
            $pdo->prepare("UPDATE ingredient_compatibility_rules SET status='active',published_at=NOW() WHERE id=:id")->execute([':id' => $id]);
        } else {
            if ($current === 'active') { $pdo->rollBack(); ingredientIntelligenceJson(409, ['success' => false, 'message' => 'Active rules remain immutable. Restrict a related profile if a safety hold is required.']); }
            if ($current === 'archived') { $pdo->rollBack(); ingredientIntelligenceJson(409, ['success' => false, 'message' => 'This rule is already archived.']); }
            $pdo->prepare("UPDATE ingredient_compatibility_rules SET status='archived' WHERE id=:id")->execute([':id' => $id]);
        }
        $after = ingredientIntelligenceRuleRaw($pdo, $id) ?? [];
        ingredientIntelligenceEvent($pdo, 'rule', $id, $action, $before, $after, $reason);
        $pdo->commit();
        ingredientIntelligenceJson(200, array_merge(['success' => true, 'module' => 'ingredient-intelligence', 'message' => 'Compatibility rule decision recorded with append-only evidence.'], ingredientIntelligenceState($pdo)));
    }

    ingredientIntelligenceJson(422, ['success' => false, 'message' => 'The ingredient intelligence action is not supported.']);
} catch (InvalidArgumentException $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    ingredientIntelligenceJson(422, ['success' => false, 'module' => 'ingredient-intelligence', 'message' => $error->getMessage()]);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('manage_ingredient_intelligence.php: ' . $error->getMessage());
    ingredientIntelligenceJson(500, ['success' => false, 'module' => 'ingredient-intelligence', 'message' => 'Ingredient Intelligence is temporarily unavailable.']);
}
