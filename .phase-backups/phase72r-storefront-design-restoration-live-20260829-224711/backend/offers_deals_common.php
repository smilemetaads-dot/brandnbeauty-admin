<?php

declare(strict_types=1);

require_once __DIR__ . '/product_catalog_schema.php';

function offersDealsText(mixed $value, int $limit = 500): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function offersDealsStringList(mixed $value, array $allowed = []): array
{
    if (is_string($value)) {
        $decoded = json_decode($value, true);
        $value = is_array($decoded) ? $decoded : [];
    }
    if (!is_array($value)) return [];
    $items = [];
    foreach ($value as $item) {
        $text = strtolower(offersDealsText($item, 80));
        if ($text === '' || ($allowed && !in_array($text, $allowed, true)) || in_array($text, $items, true)) continue;
        $items[] = $text;
    }
    return $items;
}

function ensureOffersDealsSchema(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS storefront_offers (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(191) NOT NULL,
        code VARCHAR(80) NULL,
        offer_type ENUM('percentage','fixed_amount','free_shipping') NOT NULL DEFAULT 'percentage',
        discount_value DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        minimum_order DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        maximum_discount DECIMAL(14,2) NULL,
        eligibility_summary VARCHAR(1000) NOT NULL,
        usage_limit INT UNSIGNED NULL,
        per_customer_limit INT UNSIGNED NULL,
        stackable TINYINT(1) NOT NULL DEFAULT 0,
        starts_at DATETIME NULL,
        ends_at DATETIME NULL,
        channels LONGTEXT NOT NULL,
        homepage_eligible TINYINT(1) NOT NULL DEFAULT 0,
        status ENUM('draft','active','paused','ended','archived') NOT NULL DEFAULT 'draft',
        notes TEXT NULL,
        published_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_storefront_offers_code (code),
        KEY idx_storefront_offers_status_schedule (status, starts_at, ends_at),
        KEY idx_storefront_offers_updated (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS storefront_offer_products (
        offer_id BIGINT UNSIGNED NOT NULL,
        product_id BIGINT UNSIGNED NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (offer_id, product_id),
        KEY idx_storefront_offer_products_product (product_id, offer_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS storefront_offer_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        offer_id BIGINT UNSIGNED NOT NULL,
        action_name VARCHAR(60) NOT NULL,
        before_payload LONGTEXT NULL,
        after_payload LONGTEXT NOT NULL,
        reason VARCHAR(1000) NOT NULL,
        actor VARCHAR(191) NOT NULL DEFAULT 'Admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_storefront_offer_events_offer (offer_id, created_at),
        KEY idx_storefront_offer_events_action (action_name, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function offersDealsEffectiveStatus(array $row): string
{
    $status = strtolower((string) ($row['status'] ?? 'draft'));
    if ($status !== 'active') return in_array($status, ['draft', 'paused', 'ended', 'archived'], true) ? $status : 'draft';
    $now = time();
    $starts = !empty($row['starts_at']) ? strtotime((string) $row['starts_at']) : false;
    $ends = !empty($row['ends_at']) ? strtotime((string) $row['ends_at']) : false;
    if ($starts !== false && $starts > $now) return 'scheduled';
    if ($ends !== false && $ends < $now) return 'expired';
    return 'active';
}

function offersDealsReadiness(array $row, array $productIds = []): array
{
    $blockers = [];
    $name = offersDealsText($row['name'] ?? '', 191);
    $code = offersDealsText($row['code'] ?? '', 80);
    $type = strtolower(offersDealsText($row['offer_type'] ?? '', 40));
    $value = (float) ($row['discount_value'] ?? 0);
    $eligibility = offersDealsText($row['eligibility_summary'] ?? '', 1000);
    $channels = offersDealsStringList($row['channels'] ?? [], ['website', 'admin', 'messenger', 'facebook']);
    $starts = !empty($row['starts_at']) ? strtotime((string) $row['starts_at']) : false;
    $ends = !empty($row['ends_at']) ? strtotime((string) $row['ends_at']) : false;
    if ($name === '') $blockers[] = 'Campaign name is required.';
    if ($code === '') $blockers[] = 'A unique offer code is required before publish.';
    if (!in_array($type, ['percentage', 'fixed_amount', 'free_shipping'], true)) $blockers[] = 'Choose a supported discount type.';
    if ($type !== 'free_shipping' && $value <= 0) $blockers[] = 'Discount value must be greater than zero.';
    if ($type === 'percentage' && $value > 100) $blockers[] = 'Percentage discount cannot exceed 100%.';
    if ($eligibility === '') $blockers[] = 'Eligibility must be documented.';
    if (!$channels) $blockers[] = 'At least one allowed channel is required.';
    if ($starts !== false && $ends !== false && $ends <= $starts) $blockers[] = 'End time must be later than start time.';
    if (!$productIds && stripos($eligibility, 'storewide') === false && stripos($eligibility, 'all product') === false) $blockers[] = 'Link products or explicitly document a storewide rule.';
    return ['ready' => count($blockers) === 0, 'blockers' => $blockers];
}

function offersDealsProductMap(PDO $pdo): array
{
    if (!catalogTableExists($pdo, 'products')) return [];
    ensureProductCatalogSchema($pdo);
    $map = [];
    foreach (catalogProductRows($pdo) as $product) {
        $id = (string) ($product['id'] ?? '');
        if ($id === '') continue;
        $map[$id] = [
            'id' => $id,
            'name' => offersDealsText($product['name'] ?? '', 191),
            'sku' => offersDealsText($product['sku'] ?? '', 191),
        ];
    }
    return $map;
}

function offersDealsRows(PDO $pdo): array
{
    ensureOffersDealsSchema($pdo);
    $links = [];
    $linkStatement = $pdo->query('SELECT offer_id,product_id FROM storefront_offer_products ORDER BY offer_id,product_id');
    foreach (($linkStatement->fetchAll(PDO::FETCH_ASSOC) ?: []) as $link) {
        $offerId = (string) ($link['offer_id'] ?? '');
        $productId = (string) ($link['product_id'] ?? '');
        if ($offerId !== '' && $productId !== '') $links[$offerId][] = $productId;
    }
    $productMap = offersDealsProductMap($pdo);
    $statement = $pdo->query('SELECT * FROM storefront_offers ORDER BY updated_at DESC,id DESC LIMIT 1000');
    $offers = [];
    foreach (($statement->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) {
        $id = (string) ($row['id'] ?? '');
        $productIds = $links[$id] ?? [];
        $products = [];
        foreach ($productIds as $productId) if (isset($productMap[$productId])) $products[] = $productMap[$productId];
        $status = strtolower((string) ($row['status'] ?? 'draft'));
        if (!in_array($status, ['draft', 'active', 'paused', 'ended', 'archived'], true)) $status = 'draft';
        $normalized = [
            'id' => $id,
            'name' => offersDealsText($row['name'] ?? '', 191),
            'code' => offersDealsText($row['code'] ?? '', 80),
            'offer_type' => strtolower(offersDealsText($row['offer_type'] ?? 'percentage', 40)),
            'discount_value' => round(max(0, (float) ($row['discount_value'] ?? 0)), 2),
            'minimum_order' => round(max(0, (float) ($row['minimum_order'] ?? 0)), 2),
            'maximum_discount' => $row['maximum_discount'] === null ? null : round(max(0, (float) $row['maximum_discount']), 2),
            'eligibility_summary' => offersDealsText($row['eligibility_summary'] ?? '', 1000),
            'usage_limit' => $row['usage_limit'] === null ? null : max(1, (int) $row['usage_limit']),
            'per_customer_limit' => $row['per_customer_limit'] === null ? null : max(1, (int) $row['per_customer_limit']),
            'stackable' => (bool) ($row['stackable'] ?? false),
            'starts_at' => $row['starts_at'] ?? null,
            'ends_at' => $row['ends_at'] ?? null,
            'channels' => offersDealsStringList($row['channels'] ?? [], ['website', 'admin', 'messenger', 'facebook']),
            'homepage_eligible' => (bool) ($row['homepage_eligible'] ?? false),
            'status' => $status,
            'notes' => offersDealsText($row['notes'] ?? '', 2000),
            'product_ids' => $productIds,
            'products' => $products,
            'published_at' => $row['published_at'] ?? null,
            'created_at' => $row['created_at'] ?? null,
            'updated_at' => $row['updated_at'] ?? null,
        ];
        $normalized['effective_status'] = offersDealsEffectiveStatus($normalized);
        $normalized['readiness'] = offersDealsReadiness($normalized, $productIds);
        $offers[] = $normalized;
    }
    return $offers;
}

function offersDealsState(PDO $pdo): array
{
    $offers = offersDealsRows($pdo);
    $summary = ['total' => 0, 'active_now' => 0, 'scheduled' => 0, 'drafts' => 0, 'paused' => 0, 'needs_review' => 0, 'archived' => 0];
    foreach ($offers as $offer) {
        if ($offer['status'] === 'archived') { $summary['archived']++; continue; }
        $summary['total']++;
        if ($offer['effective_status'] === 'active') $summary['active_now']++;
        if ($offer['effective_status'] === 'scheduled') $summary['scheduled']++;
        if ($offer['status'] === 'draft') $summary['drafts']++;
        if ($offer['status'] === 'paused') $summary['paused']++;
        if (!($offer['readiness']['ready'] ?? false)) $summary['needs_review']++;
    }
    return ['summary' => $summary, 'offers' => $offers, 'generated_at' => date(DATE_ATOM)];
}

function offersDealsPublicState(PDO $pdo): array
{
    $public = [];
    foreach (offersDealsRows($pdo) as $offer) {
        if ($offer['effective_status'] !== 'active' || !in_array('website', $offer['channels'], true)) continue;
        $public[] = [
            'id' => $offer['id'],
            'name' => $offer['name'],
            'code' => $offer['code'],
            'offer_type' => $offer['offer_type'],
            'discount_value' => $offer['discount_value'],
            'minimum_order' => $offer['minimum_order'],
            'maximum_discount' => $offer['maximum_discount'],
            'eligibility_summary' => $offer['eligibility_summary'],
            'usage_limit' => $offer['usage_limit'],
            'per_customer_limit' => $offer['per_customer_limit'],
            'stackable' => $offer['stackable'],
            'starts_at' => $offer['starts_at'],
            'ends_at' => $offer['ends_at'],
            'homepage_eligible' => $offer['homepage_eligible'],
            'product_ids' => $offer['product_ids'],
        ];
    }
    return [
        'offers' => $public,
        'count' => count($public),
        'checkout_application' => 'not_automatic',
        'generated_at' => date(DATE_ATOM),
    ];
}

function offersDealsEvent(PDO $pdo, int $offerId, string $action, ?array $before, array $after, string $reason): void
{
    $statement = $pdo->prepare("INSERT INTO storefront_offer_events (offer_id,action_name,before_payload,after_payload,reason,actor) VALUES (:offer_id,:action_name,:before_payload,:after_payload,:reason,'Admin')");
    $statement->execute([
        ':offer_id' => $offerId,
        ':action_name' => $action,
        ':before_payload' => $before ? json_encode($before, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : null,
        ':after_payload' => json_encode($after, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        ':reason' => $reason,
    ]);
}
