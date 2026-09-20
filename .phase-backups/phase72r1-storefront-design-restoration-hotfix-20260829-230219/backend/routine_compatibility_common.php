<?php

declare(strict_types=1);

require_once __DIR__ . '/ingredient_intelligence_common.php';

function routineCompatibilityText(mixed $value, int $limit = 1000): string
{
    return ingredientIntelligenceText($value, $limit);
}

function routineCompatibilityJsonList(mixed $value): array
{
    if (is_string($value)) {
        $decoded = json_decode($value, true);
        $value = is_array($decoded) ? $decoded : [];
    }
    return is_array($value) ? array_values($value) : [];
}

function ensureRoutineCompatibilitySchema(PDO $pdo): void
{
    ensureIngredientIntelligenceSchema($pdo);
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS routine_compatibility_checks (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            title VARCHAR(191) NOT NULL,
            context ENUM('same_routine','am','pm','alternating','comparison') NOT NULL DEFAULT 'same_routine',
            product_ids LONGTEXT NOT NULL,
            product_snapshot LONGTEXT NOT NULL,
            outcome ENUM('compatible','use_with_care','separate_schedule','hold','insufficient_evidence') NOT NULL DEFAULT 'insufficient_evidence',
            rationale LONGTEXT NOT NULL,
            matched_rules LONGTEXT NOT NULL,
            evidence_gaps LONGTEXT NOT NULL,
            owner VARCHAR(191) NOT NULL,
            status ENUM('draft','reviewed','archived') NOT NULL DEFAULT 'draft',
            reviewed_at DATETIME NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_routine_checks_status (status,outcome,updated_at),
            KEY idx_routine_checks_owner (owner,updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS routine_compatibility_decisions (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            check_id BIGINT UNSIGNED NOT NULL,
            action_name VARCHAR(60) NOT NULL,
            decision_name VARCHAR(80) NOT NULL,
            reason VARCHAR(1000) NOT NULL,
            actor VARCHAR(191) NOT NULL DEFAULT 'Admin',
            before_payload LONGTEXT NULL,
            after_payload LONGTEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_routine_decisions_check (check_id,created_at),
            KEY idx_routine_decisions_action (action_name,created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function routineCompatibilityProducts(PDO $pdo): array
{
    $products = ingredientIntelligenceProductMap($pdo);
    uasort($products, static fn(array $a, array $b): int => strcasecmp((string) ($a['name'] ?? ''), (string) ($b['name'] ?? '')));
    return $products;
}

function routineCompatibilityProductIds(PDO $pdo, mixed $value): array
{
    if (!is_array($value)) return [];
    $available = routineCompatibilityProducts($pdo);
    $ids = [];
    foreach ($value as $candidate) {
        $id = (string) max(0, (int) $candidate);
        if ($id === '0' || isset($ids[$id])) continue;
        if (!isset($available[$id])) throw new InvalidArgumentException('One selected product no longer exists in the live catalog.');
        $ids[$id] = true;
    }
    return array_keys($ids);
}

function routineCompatibilityEvaluate(PDO $pdo, array $productIds, string $context): array
{
    $products = routineCompatibilityProducts($pdo);
    $productSnapshot = [];
    $gaps = [];
    foreach ($productIds as $productId) {
        $product = $products[$productId] ?? null;
        if (!$product) continue;
        $productSnapshot[] = ['id' => $productId, 'name' => $product['name'] ?? '', 'sku' => $product['sku'] ?? '', 'status' => $product['status'] ?? 'draft'];
        if (($product['status'] ?? '') !== 'active') $gaps[] = ($product['name'] ?: "Product #{$productId}") . ' is not an active catalog product.';
    }

    $placeholders = implode(',', array_fill(0, count($productIds), '?'));
    $statement = $pdo->prepare(
        "SELECT l.product_id,l.ingredient_id,l.status AS link_status,p.name,p.safety_level,p.evidence_status,p.status AS profile_status
         FROM product_ingredient_links l
         JOIN ingredient_profiles p ON p.id=l.ingredient_id
         WHERE l.product_id IN ({$placeholders})
         ORDER BY l.product_id,l.ingredient_id"
    );
    $statement->execute(array_map('intval', $productIds));
    $ingredientsByProduct = [];
    foreach (($statement->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) {
        $productId = (string) $row['product_id'];
        if (($row['link_status'] ?? '') !== 'verified' || ($row['profile_status'] ?? '') !== 'active' || ($row['evidence_status'] ?? '') !== 'verified') continue;
        $ingredientsByProduct[$productId][(string) $row['ingredient_id']] = [
            'id' => (string) $row['ingredient_id'],
            'name' => routineCompatibilityText($row['name'] ?? '', 191),
            'safety_level' => routineCompatibilityText($row['safety_level'] ?? '', 40),
        ];
    }
    foreach ($productIds as $productId) {
        if (empty($ingredientsByProduct[$productId])) {
            $name = (string) ($products[$productId]['name'] ?? "Product #{$productId}");
            $gaps[] = $name . ' has no active, verified ingredient mapping.';
        }
    }

    $rules = [];
    foreach (($pdo->query("SELECT * FROM ingredient_compatibility_rules WHERE status='active' AND evidence_status='verified'")->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) {
        $first = (string) $row['first_ingredient_id'];
        $second = (string) $row['second_ingredient_id'];
        $key = ((int) $first < (int) $second) ? "{$first}:{$second}" : "{$second}:{$first}";
        $rules[$key] = $row;
    }

    $matched = [];
    $rationale = [];
    $highest = 1;
    $severity = ['compatible' => 1, 'use_with_care' => 2, 'separate_schedule' => 3, 'do_not_combine' => 4];
    for ($left = 0; $left < count($productIds); $left++) {
        for ($right = $left + 1; $right < count($productIds); $right++) {
            $leftId = $productIds[$left];
            $rightId = $productIds[$right];
            foreach (($ingredientsByProduct[$leftId] ?? []) as $first) {
                foreach (($ingredientsByProduct[$rightId] ?? []) as $second) {
                    if ($first['id'] === $second['id']) continue;
                    if (($first['safety_level'] ?? '') === 'professional_review' || ($second['safety_level'] ?? '') === 'professional_review') {
                        $highest = max($highest, 4);
                        $rationale[] = 'A governed ingredient profile requires professional review.';
                    }
                    $key = ((int) $first['id'] < (int) $second['id']) ? "{$first['id']}:{$second['id']}" : "{$second['id']}:{$first['id']}";
                    if (!isset($rules[$key])) {
                        $gaps[] = "No active verified rule covers {$first['name']} + {$second['name']}.";
                        continue;
                    }
                    $rule = $rules[$key];
                    $relationship = (string) ($rule['relationship'] ?? 'compatible');
                    $highest = max($highest, $severity[$relationship] ?? 1);
                    $matched[$key] = [
                        'id' => (string) $rule['id'],
                        'first_ingredient' => $first['name'],
                        'second_ingredient' => $second['name'],
                        'relationship' => $relationship,
                        'scope' => routineCompatibilityText($rule['scope'] ?? '', 1000),
                        'instruction' => routineCompatibilityText($rule['instruction'] ?? '', 4000),
                    ];
                    $rationale[] = routineCompatibilityText($rule['instruction'] ?? '', 4000);
                }
            }
        }
    }

    $gaps = array_values(array_unique(array_filter($gaps)));
    $rationale = array_values(array_unique(array_filter($rationale)));
    if ($highest >= 4) $outcome = 'hold';
    elseif ($gaps) $outcome = 'insufficient_evidence';
    elseif (!$matched) { $outcome = 'insufficient_evidence'; $gaps[] = 'No governed pairwise evidence was available for this product selection.'; }
    elseif ($highest === 3) $outcome = 'separate_schedule';
    elseif ($highest === 2) $outcome = 'use_with_care';
    else $outcome = 'compatible';
    if (!$rationale) $rationale[] = $outcome === 'insufficient_evidence' ? 'The governed evidence is not complete enough to produce a compatibility result.' : 'The result follows active, verified ingredient compatibility evidence.';

    return [
        'context' => $context,
        'product_ids' => $productIds,
        'product_snapshot' => $productSnapshot,
        'outcome' => $outcome,
        'rationale' => $rationale,
        'matched_rules' => array_values($matched),
        'evidence_gaps' => $gaps,
    ];
}

function routineCompatibilityCheckRaw(PDO $pdo, int $id, bool $lock = false): ?array
{
    $statement = $pdo->prepare('SELECT * FROM routine_compatibility_checks WHERE id=:id LIMIT 1' . ($lock ? ' FOR UPDATE' : ''));
    $statement->execute([':id' => $id]);
    $row = $statement->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function routineCompatibilityChecks(PDO $pdo): array
{
    $decisions = [];
    foreach (($pdo->query('SELECT * FROM routine_compatibility_decisions ORDER BY created_at DESC,id DESC LIMIT 2000')->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) {
        $decisions[(string) $row['check_id']][] = [
            'id' => (string) $row['id'],
            'action' => routineCompatibilityText($row['action_name'] ?? '', 60),
            'decision' => routineCompatibilityText($row['decision_name'] ?? '', 80),
            'reason' => routineCompatibilityText($row['reason'] ?? '', 1000),
            'actor' => routineCompatibilityText($row['actor'] ?? '', 191),
            'created_at' => $row['created_at'] ?? null,
        ];
    }
    $checks = [];
    foreach (($pdo->query('SELECT * FROM routine_compatibility_checks ORDER BY updated_at DESC,id DESC LIMIT 1000')->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) {
        $id = (string) $row['id'];
        $checks[] = [
            'id' => $id,
            'title' => routineCompatibilityText($row['title'] ?? '', 191),
            'context' => routineCompatibilityText($row['context'] ?? 'same_routine', 40),
            'product_ids' => routineCompatibilityJsonList($row['product_ids'] ?? []),
            'products' => routineCompatibilityJsonList($row['product_snapshot'] ?? []),
            'outcome' => routineCompatibilityText($row['outcome'] ?? 'insufficient_evidence', 40),
            'rationale' => routineCompatibilityJsonList($row['rationale'] ?? []),
            'matched_rules' => routineCompatibilityJsonList($row['matched_rules'] ?? []),
            'evidence_gaps' => routineCompatibilityJsonList($row['evidence_gaps'] ?? []),
            'owner' => routineCompatibilityText($row['owner'] ?? '', 191),
            'status' => routineCompatibilityText($row['status'] ?? 'draft', 40),
            'decisions' => $decisions[$id] ?? [],
            'reviewed_at' => $row['reviewed_at'] ?? null,
            'created_at' => $row['created_at'] ?? null,
            'updated_at' => $row['updated_at'] ?? null,
        ];
    }
    return $checks;
}

function routineCompatibilityState(PDO $pdo): array
{
    ensureRoutineCompatibilitySchema($pdo);
    $checks = routineCompatibilityChecks($pdo);
    $products = [];
    foreach (routineCompatibilityProducts($pdo) as $product) {
        $products[] = [
            'id' => (string) ($product['id'] ?? ''),
            'name' => routineCompatibilityText($product['name'] ?? '', 191),
            'sku' => routineCompatibilityText($product['sku'] ?? '', 191),
            'status' => routineCompatibilityText($product['status'] ?? 'draft', 40),
        ];
    }
    $summary = ['total' => 0, 'compatible' => 0, 'needs_review' => 0, 'holds' => 0, 'insufficient_evidence' => 0, 'drafts' => 0];
    foreach ($checks as $check) {
        if ($check['status'] === 'archived') continue;
        $summary['total']++;
        if ($check['outcome'] === 'compatible') $summary['compatible']++;
        if (in_array($check['outcome'], ['use_with_care', 'separate_schedule'], true)) $summary['needs_review']++;
        if ($check['outcome'] === 'hold') $summary['holds']++;
        if ($check['outcome'] === 'insufficient_evidence') $summary['insufficient_evidence']++;
        if ($check['status'] === 'draft') $summary['drafts']++;
    }
    return ['checks' => $checks, 'products' => $products, 'summary' => $summary, 'generated_at' => date(DATE_ATOM)];
}
