<?php

declare(strict_types=1);

require_once __DIR__ . '/product_catalog_schema.php';

function ingredientIntelligenceText(mixed $value, int $limit = 1000): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function ingredientIntelligenceList(mixed $value, int $limit = 40): array
{
    if (is_string($value)) {
        $decoded = json_decode($value, true);
        $value = is_array($decoded) ? $decoded : [];
    }
    if (!is_array($value)) return [];
    $result = [];
    foreach ($value as $item) {
        $text = ingredientIntelligenceText($item, 191);
        if ($text !== '' && !in_array($text, $result, true)) $result[] = $text;
        if (count($result) >= $limit) break;
    }
    return $result;
}

function ensureIngredientIntelligenceSchema(PDO $pdo): void
{
    ensureProductCatalogSchema($pdo);
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS ingredient_profiles (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(191) NOT NULL,
            inci VARCHAR(191) NOT NULL,
            aliases LONGTEXT NOT NULL,
            family VARCHAR(191) NOT NULL,
            roles LONGTEXT NOT NULL,
            concerns LONGTEXT NOT NULL,
            strength_guidance VARCHAR(1000) NULL,
            usage_guidance TEXT NOT NULL,
            safety_level ENUM('routine_safe','use_with_care','professional_review') NOT NULL DEFAULT 'routine_safe',
            evidence_status ENUM('unverified','verified','review_due','restricted') NOT NULL DEFAULT 'unverified',
            summary TEXT NOT NULL,
            owner VARCHAR(191) NOT NULL,
            status ENUM('draft','active','restricted','archived') NOT NULL DEFAULT 'draft',
            published_at DATETIME NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_ingredient_profiles_status (status,evidence_status,updated_at),
            KEY idx_ingredient_profiles_inci (inci),
            KEY idx_ingredient_profiles_family (family)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS ingredient_evidence_sources (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            ingredient_id BIGINT UNSIGNED NOT NULL,
            source_name VARCHAR(191) NOT NULL,
            source_reference VARCHAR(1000) NULL,
            source_type VARCHAR(80) NOT NULL DEFAULT 'registered_evidence',
            status ENUM('registered','review_due','rejected') NOT NULL DEFAULT 'registered',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_ingredient_sources_profile (ingredient_id,created_at),
            KEY idx_ingredient_sources_status (status,created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS product_ingredient_links (
            ingredient_id BIGINT UNSIGNED NOT NULL,
            product_id BIGINT UNSIGNED NOT NULL,
            declared_name VARCHAR(191) NULL,
            concentration_context VARCHAR(1000) NULL,
            status ENUM('draft','verified','blocked') NOT NULL DEFAULT 'draft',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (ingredient_id,product_id),
            KEY idx_product_ingredient_links_product (product_id,status),
            KEY idx_product_ingredient_links_status (status,updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS ingredient_compatibility_rules (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            first_ingredient_id BIGINT UNSIGNED NOT NULL,
            second_ingredient_id BIGINT UNSIGNED NOT NULL,
            relationship ENUM('compatible','use_with_care','separate_schedule','do_not_combine') NOT NULL DEFAULT 'compatible',
            scope VARCHAR(1000) NULL,
            instruction TEXT NOT NULL,
            evidence_status ENUM('unverified','verified','review_due','restricted') NOT NULL DEFAULT 'unverified',
            owner VARCHAR(191) NOT NULL,
            status ENUM('draft','active','archived') NOT NULL DEFAULT 'draft',
            published_at DATETIME NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_ingredient_rules_status (status,evidence_status,updated_at),
            KEY idx_ingredient_rules_pair (first_ingredient_id,second_ingredient_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS ingredient_intelligence_events (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            entity_type ENUM('profile','rule') NOT NULL,
            entity_id BIGINT UNSIGNED NOT NULL,
            action_name VARCHAR(60) NOT NULL,
            before_payload LONGTEXT NULL,
            after_payload LONGTEXT NOT NULL,
            reason VARCHAR(1000) NOT NULL,
            actor VARCHAR(191) NOT NULL DEFAULT 'Admin',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_ingredient_events_entity (entity_type,entity_id,created_at),
            KEY idx_ingredient_events_action (action_name,created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function ingredientIntelligenceProductMap(PDO $pdo): array
{
    if (!catalogTableExists($pdo, 'products')) return [];
    $map = [];
    foreach (catalogProductRows($pdo) as $product) {
        $id = (string) ($product['id'] ?? '');
        if ($id === '') continue;
        $map[$id] = [
            'id' => $id,
            'name' => ingredientIntelligenceText($product['name'] ?? '', 191),
            'sku' => ingredientIntelligenceText($product['sku'] ?? '', 191),
            'status' => ingredientIntelligenceText($product['status'] ?? 'draft', 40),
        ];
    }
    return $map;
}

function ingredientIntelligenceProfileReadiness(array $profile, array $sources): array
{
    $blockers = [];
    if (ingredientIntelligenceText($profile['name'] ?? '', 191) === '') $blockers[] = 'Display name is required.';
    if (ingredientIntelligenceText($profile['inci'] ?? '', 191) === '') $blockers[] = 'A normalized INCI name is required.';
    if (ingredientIntelligenceText($profile['family'] ?? '', 191) === '') $blockers[] = 'Ingredient family is required.';
    if (ingredientIntelligenceText($profile['owner'] ?? '', 191) === '') $blockers[] = 'A human evidence owner is required.';
    if (strlen(ingredientIntelligenceText($profile['summary'] ?? '', 4000)) < 12) $blockers[] = 'An evidence-aware summary is required.';
    if (strlen(ingredientIntelligenceText($profile['usage_guidance'] ?? '', 4000)) < 8) $blockers[] = 'Usage guidance is required.';
    if (($profile['evidence_status'] ?? '') !== 'verified') $blockers[] = 'Evidence status must be verified before publication.';
    if (!$sources) $blockers[] = 'Register at least one named evidence source.';
    return ['ready' => count($blockers) === 0, 'blockers' => $blockers];
}

function ingredientIntelligenceRuleReadiness(array $rule, array $profileMap): array
{
    $blockers = [];
    $first = (string) ($rule['first_ingredient_id'] ?? '');
    $second = (string) ($rule['second_ingredient_id'] ?? '');
    if ($first === '' || !isset($profileMap[$first])) $blockers[] = 'Choose the first governed ingredient profile.';
    if ($second === '' || !isset($profileMap[$second])) $blockers[] = 'Choose the second governed ingredient profile.';
    if ($first !== '' && $first === $second) $blockers[] = 'A compatibility rule requires two different ingredients.';
    if (isset($profileMap[$first]) && ($profileMap[$first]['status'] ?? '') !== 'active') $blockers[] = 'The first ingredient profile must be active.';
    if (isset($profileMap[$second]) && ($profileMap[$second]['status'] ?? '') !== 'active') $blockers[] = 'The second ingredient profile must be active.';
    if (($rule['evidence_status'] ?? '') !== 'verified') $blockers[] = 'Rule evidence must be verified before publication.';
    if (strlen(ingredientIntelligenceText($rule['instruction'] ?? '', 4000)) < 8) $blockers[] = 'An operational instruction is required.';
    if (ingredientIntelligenceText($rule['owner'] ?? '', 191) === '') $blockers[] = 'A human evidence owner is required.';
    return ['ready' => count($blockers) === 0, 'blockers' => array_values(array_unique($blockers))];
}

function ingredientIntelligenceProfiles(PDO $pdo): array
{
    ensureIngredientIntelligenceSchema($pdo);
    $sourcesByProfile = [];
    foreach (($pdo->query('SELECT * FROM ingredient_evidence_sources ORDER BY ingredient_id,id')->fetchAll(PDO::FETCH_ASSOC) ?: []) as $source) {
        $sourcesByProfile[(string) $source['ingredient_id']][] = [
            'id' => (string) $source['id'],
            'name' => ingredientIntelligenceText($source['source_name'] ?? '', 191),
            'reference' => ingredientIntelligenceText($source['source_reference'] ?? '', 1000),
            'source_type' => ingredientIntelligenceText($source['source_type'] ?? '', 80),
            'status' => ingredientIntelligenceText($source['status'] ?? '', 40),
        ];
    }
    $productMap = ingredientIntelligenceProductMap($pdo);
    $linksByProfile = [];
    foreach (($pdo->query('SELECT * FROM product_ingredient_links ORDER BY ingredient_id,product_id')->fetchAll(PDO::FETCH_ASSOC) ?: []) as $link) {
        $profileId = (string) $link['ingredient_id'];
        $productId = (string) $link['product_id'];
        $product = $productMap[$productId] ?? ['name' => '', 'sku' => ''];
        $linksByProfile[$profileId][] = [
            'product_id' => $productId,
            'product_name' => $product['name'] ?? '',
            'sku' => $product['sku'] ?? '',
            'declared_name' => ingredientIntelligenceText($link['declared_name'] ?? '', 191),
            'concentration_context' => ingredientIntelligenceText($link['concentration_context'] ?? '', 1000),
            'status' => ingredientIntelligenceText($link['status'] ?? 'draft', 40),
        ];
    }
    $rows = $pdo->query('SELECT * FROM ingredient_profiles ORDER BY updated_at DESC,id DESC LIMIT 1000')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $profiles = [];
    foreach ($rows as $row) {
        $id = (string) $row['id'];
        $sources = $sourcesByProfile[$id] ?? [];
        $profile = [
            'id' => $id,
            'name' => ingredientIntelligenceText($row['name'] ?? '', 191),
            'inci' => ingredientIntelligenceText($row['inci'] ?? '', 191),
            'aliases' => ingredientIntelligenceList($row['aliases'] ?? []),
            'family' => ingredientIntelligenceText($row['family'] ?? '', 191),
            'roles' => ingredientIntelligenceList($row['roles'] ?? []),
            'concerns' => ingredientIntelligenceList($row['concerns'] ?? []),
            'strength_guidance' => ingredientIntelligenceText($row['strength_guidance'] ?? '', 1000),
            'usage_guidance' => ingredientIntelligenceText($row['usage_guidance'] ?? '', 4000),
            'safety_level' => ingredientIntelligenceText($row['safety_level'] ?? 'routine_safe', 40),
            'evidence_status' => ingredientIntelligenceText($row['evidence_status'] ?? 'unverified', 40),
            'summary' => ingredientIntelligenceText($row['summary'] ?? '', 4000),
            'owner' => ingredientIntelligenceText($row['owner'] ?? '', 191),
            'status' => ingredientIntelligenceText($row['status'] ?? 'draft', 40),
            'sources' => $sources,
            'product_links' => $linksByProfile[$id] ?? [],
            'published_at' => $row['published_at'] ?? null,
            'created_at' => $row['created_at'] ?? null,
            'updated_at' => $row['updated_at'] ?? null,
        ];
        $profile['readiness'] = ingredientIntelligenceProfileReadiness($profile, $sources);
        $profiles[] = $profile;
    }
    return $profiles;
}

function ingredientIntelligenceRules(PDO $pdo, array $profiles): array
{
    $profileMap = [];
    foreach ($profiles as $profile) $profileMap[(string) $profile['id']] = $profile;
    $rows = $pdo->query('SELECT * FROM ingredient_compatibility_rules ORDER BY updated_at DESC,id DESC LIMIT 1000')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $rules = [];
    foreach ($rows as $row) {
        $firstId = (string) ($row['first_ingredient_id'] ?? '');
        $secondId = (string) ($row['second_ingredient_id'] ?? '');
        $rule = [
            'id' => (string) $row['id'],
            'first_ingredient_id' => $firstId,
            'first_ingredient_name' => $profileMap[$firstId]['name'] ?? '',
            'second_ingredient_id' => $secondId,
            'second_ingredient_name' => $profileMap[$secondId]['name'] ?? '',
            'relationship' => ingredientIntelligenceText($row['relationship'] ?? 'compatible', 40),
            'scope' => ingredientIntelligenceText($row['scope'] ?? '', 1000),
            'instruction' => ingredientIntelligenceText($row['instruction'] ?? '', 4000),
            'evidence_status' => ingredientIntelligenceText($row['evidence_status'] ?? 'unverified', 40),
            'owner' => ingredientIntelligenceText($row['owner'] ?? '', 191),
            'status' => ingredientIntelligenceText($row['status'] ?? 'draft', 40),
            'published_at' => $row['published_at'] ?? null,
            'created_at' => $row['created_at'] ?? null,
            'updated_at' => $row['updated_at'] ?? null,
        ];
        $rule['readiness'] = ingredientIntelligenceRuleReadiness($rule, $profileMap);
        $rules[] = $rule;
    }
    return $rules;
}

function ingredientIntelligenceState(PDO $pdo): array
{
    $profiles = ingredientIntelligenceProfiles($pdo);
    $rules = ingredientIntelligenceRules($pdo, $profiles);
    $summary = ['total' => 0, 'active' => 0, 'drafts' => 0, 'review_due' => 0, 'restricted' => 0, 'archived' => 0, 'rules' => 0, 'mapped_products' => 0];
    $mappedProducts = [];
    foreach ($profiles as $profile) {
        if ($profile['status'] === 'archived') { $summary['archived']++; continue; }
        $summary['total']++;
        if ($profile['status'] === 'active') $summary['active']++;
        if ($profile['status'] === 'draft') $summary['drafts']++;
        if ($profile['status'] === 'restricted') $summary['restricted']++;
        if ($profile['evidence_status'] === 'review_due' || !($profile['readiness']['ready'] ?? false)) $summary['review_due']++;
        foreach ($profile['product_links'] as $link) $mappedProducts[(string) $link['product_id']] = true;
    }
    foreach ($rules as $rule) if ($rule['status'] !== 'archived') $summary['rules']++;
    $summary['mapped_products'] = count($mappedProducts);
    return ['profiles' => $profiles, 'rules' => $rules, 'summary' => $summary, 'generated_at' => date(DATE_ATOM)];
}

function ingredientIntelligencePublicState(PDO $pdo): array
{
    $state = ingredientIntelligenceState($pdo);
    $profiles = array_values(array_filter($state['profiles'], static fn (array $profile): bool => $profile['status'] === 'active' && $profile['evidence_status'] === 'verified'));
    $activeIds = [];
    foreach ($profiles as $profile) $activeIds[(string) $profile['id']] = true;
    $rules = array_values(array_filter($state['rules'], static fn (array $rule): bool => $rule['status'] === 'active' && isset($activeIds[(string) $rule['first_ingredient_id']], $activeIds[(string) $rule['second_ingredient_id']])));
    return ['profiles' => $profiles, 'rules' => $rules, 'profile_count' => count($profiles), 'rule_count' => count($rules), 'medical_diagnosis' => 'not_provided', 'automatic_claim_publication' => 'disabled', 'generated_at' => date(DATE_ATOM)];
}

function ingredientIntelligenceEvent(PDO $pdo, string $entityType, int $entityId, string $action, ?array $before, array $after, string $reason): void
{
    $statement = $pdo->prepare("INSERT INTO ingredient_intelligence_events (entity_type,entity_id,action_name,before_payload,after_payload,reason,actor) VALUES (:entity_type,:entity_id,:action_name,:before_payload,:after_payload,:reason,'Admin')");
    $statement->execute([
        ':entity_type' => $entityType,
        ':entity_id' => $entityId,
        ':action_name' => $action,
        ':before_payload' => $before ? json_encode($before, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
        ':after_payload' => json_encode($after, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ':reason' => $reason,
    ]);
}
