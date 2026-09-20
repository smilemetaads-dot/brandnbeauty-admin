<?php

declare(strict_types=1);

require_once __DIR__ . '/product_catalog_schema.php';

function productRecommendationsText(mixed $value, int $limit = 1000): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function productRecommendationsStringList(mixed $value, array $allowed): array
{
    if (is_string($value)) {
        $decoded = json_decode($value, true);
        $value = is_array($decoded) ? $decoded : [];
    }
    if (!is_array($value)) return [];
    $result = [];
    foreach ($value as $item) {
        $normalized = strtolower(productRecommendationsText($item, 60));
        if ($normalized !== '' && in_array($normalized, $allowed, true) && !in_array($normalized, $result, true)) $result[] = $normalized;
    }
    return $result;
}

function ensureProductRecommendationsSchema(PDO $pdo): void
{
    ensureProductCatalogSchema($pdo);
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS storefront_recommendations (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(191) NOT NULL,
            strategy VARCHAR(60) NOT NULL DEFAULT 'complete_routine',
            method VARCHAR(40) NOT NULL DEFAULT 'manual',
            source_product_id BIGINT UNSIGNED NULL,
            surfaces LONGTEXT NOT NULL,
            fallback_mode VARCHAR(40) NOT NULL DEFAULT 'hide_block',
            priority INT UNSIGNED NOT NULL DEFAULT 100,
            starts_at DATETIME NULL,
            ends_at DATETIME NULL,
            status ENUM('draft','active','paused','archived') NOT NULL DEFAULT 'draft',
            notes TEXT NULL,
            published_at DATETIME NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_storefront_recommendations_status (status, starts_at, ends_at),
            KEY idx_storefront_recommendations_source (source_product_id),
            KEY idx_storefront_recommendations_priority (priority, updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS storefront_recommendation_products (
            recommendation_id BIGINT UNSIGNED NOT NULL,
            product_id BIGINT UNSIGNED NOT NULL,
            position_number INT UNSIGNED NOT NULL DEFAULT 1,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (recommendation_id, product_id),
            KEY idx_storefront_recommendation_products_position (recommendation_id, position_number),
            KEY idx_storefront_recommendation_products_product (product_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS storefront_recommendation_events (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            recommendation_id BIGINT UNSIGNED NOT NULL,
            action_name VARCHAR(60) NOT NULL,
            before_payload LONGTEXT NULL,
            after_payload LONGTEXT NOT NULL,
            reason VARCHAR(1000) NOT NULL,
            actor VARCHAR(191) NOT NULL DEFAULT 'Admin',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_storefront_recommendation_events_record (recommendation_id, created_at),
            KEY idx_storefront_recommendation_events_action (action_name, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function productRecommendationsProductMap(PDO $pdo): array
{
    if (!catalogTableExists($pdo, 'products')) return [];
    ensureProductCatalogSchema($pdo);
    $map = [];
    foreach (catalogProductRows($pdo) as $product) {
        $id = (string) ($product['id'] ?? '');
        if ($id === '') continue;
        $map[$id] = [
            'id' => $id,
            'name' => productRecommendationsText($product['name'] ?? '', 191),
            'sku' => productRecommendationsText($product['sku'] ?? '', 191),
            'image' => productRecommendationsText($product['image'] ?? '', 2048),
            'status' => productRecommendationsText($product['status'] ?? 'draft', 40),
            'stock' => max(0, (int) ($product['stock'] ?? 0)),
        ];
    }
    return $map;
}

function productRecommendationsNeedsSource(string $strategy): bool
{
    return !in_array($strategy, ['best_sellers', 'new_arrivals'], true);
}

function productRecommendationsEffectiveStatus(array $row): string
{
    $status = strtolower((string) ($row['status'] ?? 'draft'));
    if ($status !== 'active') return $status;
    $now = time();
    $starts = !empty($row['starts_at']) ? strtotime((string) $row['starts_at']) : false;
    $ends = !empty($row['ends_at']) ? strtotime((string) $row['ends_at']) : false;
    if ($starts !== false && $starts > $now) return 'scheduled';
    if ($ends !== false && $ends <= $now) return 'expired';
    return 'active';
}

function productRecommendationsReadiness(array $row, array $targetProducts, ?array $sourceProduct): array
{
    $blockers = [];
    $name = productRecommendationsText($row['name'] ?? '', 191);
    $strategy = strtolower(productRecommendationsText($row['strategy'] ?? '', 60));
    $surfaces = productRecommendationsStringList($row['surfaces'] ?? [], ['product_page', 'cart', 'homepage', 'search_no_result']);
    if ($name === '') $blockers[] = 'Set name is required.';
    if (!in_array($strategy, ['complete_routine', 'frequently_bought_together', 'similar_alternative', 'upgrade', 'best_sellers', 'new_arrivals'], true)) $blockers[] = 'Choose a supported recommendation strategy.';
    if (productRecommendationsNeedsSource($strategy) && $sourceProduct === null) $blockers[] = 'A real source product is required for this strategy.';
    if (!$targetProducts) $blockers[] = 'Link at least one real recommended product.';
    if (!$surfaces) $blockers[] = 'Choose at least one storefront surface.';
    foreach ($targetProducts as $product) {
        if (($product['status'] ?? '') !== 'active') { $blockers[] = 'Every published target must be an active catalog product.'; break; }
    }
    foreach ($targetProducts as $product) {
        if ((int) ($product['stock'] ?? 0) <= 0) { $blockers[] = 'Every published target must currently have stock.'; break; }
    }
    if ($sourceProduct !== null) {
        foreach ($targetProducts as $product) if (($product['id'] ?? '') === ($sourceProduct['id'] ?? '')) { $blockers[] = 'Source and target products cannot be the same.'; break; }
    }
    $starts = !empty($row['starts_at']) ? strtotime((string) $row['starts_at']) : false;
    $ends = !empty($row['ends_at']) ? strtotime((string) $row['ends_at']) : false;
    if ($starts !== false && $ends !== false && $ends <= $starts) $blockers[] = 'End time must be later than start time.';
    return ['ready' => count($blockers) === 0, 'blockers' => array_values(array_unique($blockers))];
}

function productRecommendationsRows(PDO $pdo): array
{
    ensureProductRecommendationsSchema($pdo);
    $productMap = productRecommendationsProductMap($pdo);
    $targetsByRecommendation = [];
    $links = $pdo->query('SELECT recommendation_id,product_id,position_number FROM storefront_recommendation_products ORDER BY recommendation_id,position_number,product_id');
    foreach (($links->fetchAll(PDO::FETCH_ASSOC) ?: []) as $link) {
        $recommendationId = (string) ($link['recommendation_id'] ?? '');
        $productId = (string) ($link['product_id'] ?? '');
        if ($recommendationId === '' || $productId === '') continue;
        $targetsByRecommendation[$recommendationId][] = $productId;
    }
    $statement = $pdo->query('SELECT * FROM storefront_recommendations ORDER BY priority ASC,updated_at DESC,id DESC LIMIT 1000');
    $recommendations = [];
    foreach (($statement->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) {
        $id = (string) ($row['id'] ?? '');
        $sourceProductId = (string) ($row['source_product_id'] ?? '');
        $sourceProduct = $sourceProductId !== '' && isset($productMap[$sourceProductId]) ? $productMap[$sourceProductId] : null;
        $targetProductIds = $targetsByRecommendation[$id] ?? [];
        $targetProducts = [];
        foreach ($targetProductIds as $productId) if (isset($productMap[$productId])) $targetProducts[] = $productMap[$productId];
        $status = strtolower((string) ($row['status'] ?? 'draft'));
        if (!in_array($status, ['draft', 'active', 'paused', 'archived'], true)) $status = 'draft';
        $strategy = strtolower(productRecommendationsText($row['strategy'] ?? 'complete_routine', 60));
        if (!in_array($strategy, ['complete_routine', 'frequently_bought_together', 'similar_alternative', 'upgrade', 'best_sellers', 'new_arrivals'], true)) $strategy = 'complete_routine';
        $method = strtolower(productRecommendationsText($row['method'] ?? 'manual', 40)) === 'rule_assisted' ? 'rule_assisted' : 'manual';
        $fallbackMode = strtolower(productRecommendationsText($row['fallback_mode'] ?? 'hide_block', 40)) === 'best_in_stock' ? 'best_in_stock' : 'hide_block';
        $normalized = [
            'id' => $id,
            'name' => productRecommendationsText($row['name'] ?? '', 191),
            'strategy' => $strategy,
            'method' => $method,
            'source_product_id' => $sourceProductId,
            'source_product' => $sourceProduct,
            'target_product_ids' => $targetProductIds,
            'target_products' => $targetProducts,
            'surfaces' => productRecommendationsStringList($row['surfaces'] ?? [], ['product_page', 'cart', 'homepage', 'search_no_result']),
            'fallback_mode' => $fallbackMode,
            'priority' => max(1, (int) ($row['priority'] ?? 100)),
            'starts_at' => $row['starts_at'] ?? null,
            'ends_at' => $row['ends_at'] ?? null,
            'status' => $status,
            'notes' => productRecommendationsText($row['notes'] ?? '', 2000),
            'published_at' => $row['published_at'] ?? null,
            'created_at' => $row['created_at'] ?? null,
            'updated_at' => $row['updated_at'] ?? null,
        ];
        $normalized['effective_status'] = productRecommendationsEffectiveStatus($normalized);
        $normalized['readiness'] = productRecommendationsReadiness($normalized, $targetProducts, $sourceProduct);
        $recommendations[] = $normalized;
    }
    return $recommendations;
}

function productRecommendationsState(PDO $pdo): array
{
    $recommendations = productRecommendationsRows($pdo);
    $summary = ['total' => 0, 'active_now' => 0, 'scheduled' => 0, 'drafts' => 0, 'paused' => 0, 'needs_review' => 0, 'archived' => 0];
    foreach ($recommendations as $item) {
        if ($item['status'] === 'archived') { $summary['archived']++; continue; }
        $summary['total']++;
        if ($item['effective_status'] === 'active') $summary['active_now']++;
        if ($item['effective_status'] === 'scheduled') $summary['scheduled']++;
        if ($item['status'] === 'draft') $summary['drafts']++;
        if ($item['status'] === 'paused') $summary['paused']++;
        if (!($item['readiness']['ready'] ?? false)) $summary['needs_review']++;
    }
    return ['summary' => $summary, 'recommendations' => $recommendations, 'generated_at' => date(DATE_ATOM)];
}

function productRecommendationsPublicState(PDO $pdo): array
{
    $public = [];
    foreach (productRecommendationsRows($pdo) as $item) {
        if ($item['effective_status'] !== 'active') continue;
        $eligibleTargets = array_values(array_filter($item['target_products'], static fn (array $product): bool => ($product['status'] ?? '') === 'active' && (int) ($product['stock'] ?? 0) > 0));
        if (!$eligibleTargets) continue;
        $public[] = [
            'id' => $item['id'],
            'name' => $item['name'],
            'strategy' => $item['strategy'],
            'method' => $item['method'],
            'source_product_id' => $item['source_product_id'],
            'source_product' => $item['source_product'],
            'surfaces' => $item['surfaces'],
            'fallback_mode' => $item['fallback_mode'],
            'priority' => $item['priority'],
            'target_products' => $eligibleTargets,
        ];
    }
    return [
        'recommendations' => $public,
        'count' => count($public),
        'cart_application' => 'not_automatic',
        'customer_profiling' => 'not_recorded',
        'generated_at' => date(DATE_ATOM),
    ];
}

function productRecommendationsEvent(PDO $pdo, int $recommendationId, string $action, ?array $before, array $after, string $reason): void
{
    $statement = $pdo->prepare("INSERT INTO storefront_recommendation_events (recommendation_id,action_name,before_payload,after_payload,reason,actor) VALUES (:recommendation_id,:action_name,:before_payload,:after_payload,:reason,'Admin')");
    $statement->execute([
        ':recommendation_id' => $recommendationId,
        ':action_name' => $action,
        ':before_payload' => $before ? json_encode($before, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : null,
        ':after_payload' => json_encode($after, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        ':reason' => $reason,
    ]);
}
