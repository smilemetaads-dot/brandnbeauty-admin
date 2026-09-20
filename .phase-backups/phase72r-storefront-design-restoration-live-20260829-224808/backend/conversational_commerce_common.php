<?php
declare(strict_types=1);

function commerceText(mixed $value, int $limit = 1000): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function ensureConversationalCommerceSchema(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS commerce_conversations (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        conversation_key CHAR(32) NOT NULL,
        channel ENUM('messenger','whatsapp','instagram','website_chat','other') NOT NULL,
        thread_reference_hash CHAR(64) NOT NULL,
        thread_mask VARCHAR(80) NOT NULL,
        contact_reference_hash CHAR(64) NOT NULL,
        contact_mask VARCHAR(80) NOT NULL,
        intent_summary VARCHAR(1000) NOT NULL,
        permitted_purpose ENUM('sales_service','support','unknown') NOT NULL DEFAULT 'unknown',
        contact_consent ENUM('active','unknown','withdrawn') NOT NULL DEFAULT 'unknown',
        messaging_window ENUM('open','closed','unknown') NOT NULL DEFAULT 'unknown',
        identity_status ENUM('unresolved','suggested','verified','held') NOT NULL DEFAULT 'unresolved',
        customer_reference VARCHAR(190) NULL,
        lead_stage ENUM('new_inquiry','interested','order_draft','order_created','purchased','delivered','closed') NOT NULL DEFAULT 'new_inquiry',
        campaign_reference VARCHAR(255) NULL,
        ad_reference VARCHAR(255) NULL,
        order_reference VARCHAR(190) NULL,
        delivery_reference VARCHAR(190) NULL,
        owner VARCHAR(190) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_commerce_conversation_key (conversation_key),
        UNIQUE KEY uq_commerce_thread (channel, thread_reference_hash),
        KEY idx_commerce_stage (lead_stage, updated_at),
        KEY idx_commerce_contact (contact_reference_hash, updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("CREATE TABLE IF NOT EXISTS commerce_reply_drafts (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        conversation_id BIGINT UNSIGNED NOT NULL,
        language ENUM('bangla','banglish','english') NOT NULL,
        exact_text TEXT NOT NULL,
        facts_verified TINYINT(1) NOT NULL DEFAULT 0,
        human_approved TINYINT(1) NOT NULL DEFAULT 0,
        created_by VARCHAR(190) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_commerce_reply (conversation_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("CREATE TABLE IF NOT EXISTS commerce_identity_reviews (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        conversation_id BIGINT UNSIGNED NOT NULL,
        decision ENUM('verified','held','unresolved','suggested') NOT NULL,
        candidate_customer_reference VARCHAR(190) NULL,
        reason VARCHAR(1000) NOT NULL,
        reviewed_by VARCHAR(190) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_commerce_identity (conversation_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("CREATE TABLE IF NOT EXISTS commerce_order_drafts (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        conversation_id BIGINT UNSIGNED NOT NULL,
        product_id BIGINT UNSIGNED NOT NULL,
        product_name_snapshot VARCHAR(255) NOT NULL,
        sku_snapshot VARCHAR(190) NULL,
        unit_price_snapshot DECIMAL(14,2) NOT NULL,
        stock_snapshot INT NOT NULL,
        quantity INT UNSIGNED NOT NULL,
        delivery_zone ENUM('dhaka_city','dhaka_sub_area','outside_dhaka') NOT NULL,
        delivery_charge DECIMAL(14,2) NOT NULL,
        draft_total DECIMAL(14,2) NOT NULL,
        status ENUM('review_required','converted','cancelled') NOT NULL DEFAULT 'review_required',
        created_by VARCHAR(190) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_commerce_order_draft (conversation_id, status, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("CREATE TABLE IF NOT EXISTS commerce_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        conversation_id BIGINT UNSIGNED NOT NULL,
        action_name VARCHAR(60) NOT NULL,
        before_json LONGTEXT NULL,
        after_json LONGTEXT NOT NULL,
        reason VARCHAR(1000) NOT NULL,
        actor VARCHAR(190) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_commerce_event (conversation_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function commerceProducts(PDO $pdo): array
{
    if (!function_exists('catalogProductRows')) return [];
    $rows = catalogProductRows($pdo);
    $products = [];
    foreach ($rows as $row) {
        $products[] = [
            'id' => (string) ($row['id'] ?? ''),
            'name' => (string) ($row['name'] ?? ''),
            'sku' => (string) ($row['sku'] ?? ''),
            'price' => (float) ($row['price'] ?? 0),
            'stock' => (int) ($row['stock'] ?? 0),
            'status' => (string) ($row['status'] ?? 'draft'),
        ];
        if (count($products) >= 1000) break;
    }
    return $products;
}

function commerceFindProduct(PDO $pdo, int $productId): ?array
{
    foreach (commerceProducts($pdo) as $product) {
        if ((int) $product['id'] === $productId) return $product;
    }
    return null;
}

function readConversationalCommerceState(PDO $pdo): array
{
    $rows = $pdo->query("SELECT c.*,
        (SELECT COUNT(*) FROM commerce_reply_drafts r WHERE r.conversation_id=c.id) reply_draft_count,
        (SELECT COUNT(*) FROM commerce_order_drafts d WHERE d.conversation_id=c.id AND d.status='review_required') order_draft_count,
        (SELECT d.draft_total FROM commerce_order_drafts d WHERE d.conversation_id=c.id ORDER BY d.id DESC LIMIT 1) latest_draft_total
        FROM commerce_conversations c
        ORDER BY FIELD(c.lead_stage,'new_inquiry','interested','order_draft','order_created','purchased','delivered','closed'),c.updated_at DESC,c.id DESC LIMIT 1000")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $summary = ['total' => count($rows), 'open' => 0, 'needs_review' => 0, 'reply_drafts' => 0, 'order_drafts' => 0, 'attributed' => 0, 'delivered' => 0];
    $conversations = [];
    foreach ($rows as $row) {
        $stage = (string) $row['lead_stage'];
        if (!in_array($stage, ['delivered', 'closed'], true)) $summary['open']++;
        if ($row['identity_status'] !== 'verified' || $row['contact_consent'] !== 'active' || $row['messaging_window'] !== 'open') $summary['needs_review']++;
        $summary['reply_drafts'] += (int) $row['reply_draft_count'];
        $summary['order_drafts'] += (int) $row['order_draft_count'];
        if ($row['campaign_reference'] || $row['ad_reference']) $summary['attributed']++;
        if ($stage === 'delivered') $summary['delivered']++;
        $conversations[] = [
            'id' => (string) $row['id'], 'conversation_key' => $row['conversation_key'], 'channel' => $row['channel'],
            'thread_reference' => $row['thread_mask'], 'contact_reference' => $row['contact_mask'], 'intent_summary' => $row['intent_summary'],
            'permitted_purpose' => $row['permitted_purpose'], 'contact_consent' => $row['contact_consent'], 'messaging_window' => $row['messaging_window'],
            'identity_status' => $row['identity_status'], 'customer_reference' => $row['customer_reference'] ?: '', 'lead_stage' => $stage,
            'campaign_reference' => $row['campaign_reference'] ?: '', 'ad_reference' => $row['ad_reference'] ?: '',
            'order_reference' => $row['order_reference'] ?: '', 'delivery_reference' => $row['delivery_reference'] ?: '', 'owner' => $row['owner'],
            'reply_draft_count' => (int) $row['reply_draft_count'], 'order_draft_count' => (int) $row['order_draft_count'],
            'latest_draft_total' => $row['latest_draft_total'] === null ? null : (float) $row['latest_draft_total'], 'updated_at' => $row['updated_at'],
        ];
    }
    return [
        'summary' => $summary, 'conversations' => $conversations, 'products' => commerceProducts($pdo),
        'quality' => ['page_load' => 'read_only', 'contact_identity' => 'hashed', 'automatic_message' => 'disabled', 'automatic_merge' => 'disabled', 'automatic_order' => 'disabled', 'invented_product_facts' => 'blocked', 'seeded_conversations' => 0],
        'generated_at' => date(DATE_ATOM),
    ];
}
