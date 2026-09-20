<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/admin_auth.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) === 1) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, PUT, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

requireAdminAuth();

function footerCmsJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function defaultFooterCmsConfig(): array
{
    return [
        'brand' => [
            'description' => 'Your trusted destination for authentic skincare, haircare and beauty products.',
            'phone' => '01715 647547',
            'email' => 'care@brandnbeauty.com',
            'address' => 'Dhaka, Bangladesh',
            'facebook' => 'https://facebook.com/brandnbeauty',
            'instagram' => 'https://instagram.com/brandnbeauty',
            'whatsapp' => '',
            'youtube' => '',
        ],
        'settings' => [
            'newsletter' => true,
            'contact_block' => true,
            'social_links' => true,
            'trust_strip' => true,
            'payment_badges' => true,
            'copyright' => '© 2026 BrandnBeauty. All rights reserved.',
        ],
        'columns' => [
            [
                'id' => 'FTR-01', 'title' => 'Shop', 'status' => 'active', 'sort_order' => 1,
                'links' => [
                    ['id' => 'FTR-01-L01', 'label' => 'New Arrivals', 'url' => '/collections/new-arrivals', 'status' => 'active', 'sort_order' => 1],
                    ['id' => 'FTR-01-L02', 'label' => 'Best Sellers', 'url' => '/collections/best-sellers', 'status' => 'active', 'sort_order' => 2],
                    ['id' => 'FTR-01-L03', 'label' => 'Brands', 'url' => '/brands', 'status' => 'active', 'sort_order' => 3],
                    ['id' => 'FTR-01-L04', 'label' => 'Offers', 'url' => '/offers', 'status' => 'active', 'sort_order' => 4],
                ],
            ],
            [
                'id' => 'FTR-02', 'title' => 'Help & Support', 'status' => 'active', 'sort_order' => 2,
                'links' => [
                    ['id' => 'FTR-02-L01', 'label' => 'Contact Us', 'url' => '/pages/contact-us', 'status' => 'active', 'sort_order' => 1],
                    ['id' => 'FTR-02-L02', 'label' => 'Delivery Information', 'url' => '/pages/delivery', 'status' => 'active', 'sort_order' => 2],
                    ['id' => 'FTR-02-L03', 'label' => 'Returns & Exchanges', 'url' => '/pages/returns', 'status' => 'active', 'sort_order' => 3],
                    ['id' => 'FTR-02-L04', 'label' => 'Frequently Asked Questions', 'url' => '/pages/faq', 'status' => 'active', 'sort_order' => 4],
                ],
            ],
            [
                'id' => 'FTR-03', 'title' => 'About BrandnBeauty', 'status' => 'active', 'sort_order' => 3,
                'links' => [
                    ['id' => 'FTR-03-L01', 'label' => 'Our Story', 'url' => '/pages/about-us', 'status' => 'active', 'sort_order' => 1],
                    ['id' => 'FTR-03-L02', 'label' => 'Authenticity Promise', 'url' => '/pages/authenticity', 'status' => 'active', 'sort_order' => 2],
                    ['id' => 'FTR-03-L03', 'label' => 'Beauty Journal', 'url' => '/blogs/beauty-journal', 'status' => 'active', 'sort_order' => 3],
                ],
            ],
            [
                'id' => 'FTR-04', 'title' => 'Policies', 'status' => 'active', 'sort_order' => 4,
                'links' => [
                    ['id' => 'FTR-04-L01', 'label' => 'Privacy Policy', 'url' => '/policies/privacy-policy', 'status' => 'active', 'sort_order' => 1],
                    ['id' => 'FTR-04-L02', 'label' => 'Terms & Conditions', 'url' => '/policies/terms-of-service', 'status' => 'active', 'sort_order' => 2],
                    ['id' => 'FTR-04-L03', 'label' => 'Refund Policy', 'url' => '/policies/refund-policy', 'status' => 'active', 'sort_order' => 3],
                ],
            ],
        ],
        'trust_items' => [
            ['id' => 'TR-01', 'label' => '100% Authentic Products', 'note' => 'Sourced from verified channels', 'active' => true, 'sort_order' => 1],
            ['id' => 'TR-02', 'label' => 'Verified Brands', 'note' => 'Curated brand partners', 'active' => true, 'sort_order' => 2],
            ['id' => 'TR-03', 'label' => 'Clear Product Information', 'note' => 'Practical, transparent guidance', 'active' => true, 'sort_order' => 3],
            ['id' => 'TR-04', 'label' => 'Customer Support', 'note' => 'Help before and after order', 'active' => true, 'sort_order' => 4],
        ],
    ];
}

function ensureFooterCmsTables(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS footer_cms_state (
            id TINYINT UNSIGNED NOT NULL,
            draft_json LONGTEXT NOT NULL,
            live_json LONGTEXT NOT NULL,
            version_no INT UNSIGNED NOT NULL DEFAULT 1,
            updated_by VARCHAR(190) NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            published_at TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS footer_cms_versions (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            version_no INT UNSIGNED NOT NULL,
            config_json LONGTEXT NOT NULL,
            published_by VARCHAR(190) NULL,
            published_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_footer_cms_version (version_no)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $count = $pdo->query('SELECT COUNT(*) FROM footer_cms_state WHERE id = 1')->fetchColumn();
    if ((int) $count === 0) {
        $defaultJson = json_encode(defaultFooterCmsConfig(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $insert = $pdo->prepare(
            'INSERT INTO footer_cms_state (id, draft_json, live_json, version_no, updated_by, published_at)
             VALUES (1, :draft_json, :live_json, 1, :updated_by, CURRENT_TIMESTAMP)'
        );
        $insert->execute([
            ':draft_json' => $defaultJson,
            ':live_json' => $defaultJson,
            ':updated_by' => 'system-seed',
        ]);
    }

    $state = $pdo->query('SELECT live_json, version_no, published_at FROM footer_cms_state WHERE id = 1 LIMIT 1')->fetch() ?: [];
    $seedVersion = $pdo->prepare(
        'INSERT IGNORE INTO footer_cms_versions (version_no, config_json, published_by, published_at)
         VALUES (:version_no, :config_json, :published_by, :published_at)'
    );
    $seedVersion->execute([
        ':version_no' => (int) ($state['version_no'] ?? 1),
        ':config_json' => (string) ($state['live_json'] ?? '{}'),
        ':published_by' => 'system-seed',
        ':published_at' => $state['published_at'] ?? date('Y-m-d H:i:s'),
    ]);
}

function footerCmsText(mixed $value, int $limit = 500): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function footerCmsBool(mixed $value): bool
{
    if (is_bool($value)) return $value;
    return in_array(strtolower(trim((string) $value)), ['1', 'true', 'yes', 'active'], true);
}

function footerCmsStatus(mixed $value): string
{
    $status = strtolower(footerCmsText($value, 30));
    return in_array($status, ['active', 'draft', 'hidden'], true) ? $status : 'draft';
}

function footerCmsInternalPath(mixed $value, string $fallback = ''): string
{
    $path = footerCmsText($value, 1000);
    return str_starts_with($path, '/') ? $path : $fallback;
}

function footerCmsExternalUrl(mixed $value): string
{
    $url = footerCmsText($value, 1000);
    if ($url === '') return '';
    return filter_var($url, FILTER_VALIDATE_URL) && preg_match('/^https:\/\//i', $url) === 1 ? $url : '';
}

function normalizeFooterCmsConfig(mixed $input): array
{
    if (!is_array($input)) footerCmsJson(400, ['success' => false, 'message' => 'A valid footer configuration is required.']);

    $brandInput = is_array($input['brand'] ?? null) ? $input['brand'] : [];
    $settingsInput = is_array($input['settings'] ?? null) ? $input['settings'] : [];
    $columnsInput = is_array($input['columns'] ?? null) ? $input['columns'] : [];
    $columns = [];
    $seenColumnIds = [];
    $seenColumnTitles = [];

    foreach (array_slice($columnsInput, 0, 8) as $columnIndex => $column) {
        if (!is_array($column)) continue;
        $id = preg_replace('/[^a-zA-Z0-9_-]/', '', footerCmsText($column['id'] ?? '', 80)) ?: 'FTR-' . str_pad((string) ($columnIndex + 1), 2, '0', STR_PAD_LEFT);
        $title = footerCmsText($column['title'] ?? '', 120);
        $titleKey = strtolower($title);
        if ($title === '') footerCmsJson(422, ['success' => false, 'message' => 'Every footer column needs a title.']);
        if (isset($seenColumnIds[$id]) || isset($seenColumnTitles[$titleKey])) footerCmsJson(422, ['success' => false, 'message' => 'Footer column titles and identifiers must be unique.']);
        $seenColumnIds[$id] = true;
        $seenColumnTitles[$titleKey] = true;
        $links = [];
        $seenLinkIds = [];
        $seenLinkLabels = [];
        $linksInput = is_array($column['links'] ?? null) ? $column['links'] : [];
        foreach (array_slice($linksInput, 0, 20) as $linkIndex => $link) {
            if (!is_array($link)) continue;
            $linkId = preg_replace('/[^a-zA-Z0-9_-]/', '', footerCmsText($link['id'] ?? '', 80)) ?: $id . '-L' . str_pad((string) ($linkIndex + 1), 2, '0', STR_PAD_LEFT);
            $label = footerCmsText($link['label'] ?? '', 120);
            $labelKey = strtolower($label);
            $url = footerCmsInternalPath($link['url'] ?? '', '');
            if ($label === '' || $url === '') footerCmsJson(422, ['success' => false, 'message' => $title . ' contains an invalid link. Use an internal path beginning with /.']);
            if (isset($seenLinkIds[$linkId]) || isset($seenLinkLabels[$labelKey])) footerCmsJson(422, ['success' => false, 'message' => $title . ' contains duplicate link labels or identifiers.']);
            $seenLinkIds[$linkId] = true;
            $seenLinkLabels[$labelKey] = true;
            $links[] = [
                'id' => $linkId,
                'label' => $label,
                'url' => $url,
                'status' => footerCmsStatus($link['status'] ?? 'draft'),
                'sort_order' => max(1, min(100, (int) ($link['sort_order'] ?? ($linkIndex + 1)))),
            ];
        }
        usort($links, static fn (array $left, array $right): int => $left['sort_order'] <=> $right['sort_order']);
        foreach ($links as $linkIndex => &$link) $link['sort_order'] = $linkIndex + 1;
        unset($link);
        $columns[] = [
            'id' => $id,
            'title' => $title,
            'status' => footerCmsStatus($column['status'] ?? 'draft'),
            'sort_order' => max(1, min(100, (int) ($column['sort_order'] ?? ($columnIndex + 1)))),
            'links' => $links,
        ];
    }
    usort($columns, static fn (array $left, array $right): int => $left['sort_order'] <=> $right['sort_order']);
    foreach ($columns as $columnIndex => &$column) $column['sort_order'] = $columnIndex + 1;
    unset($column);

    $trustItems = [];
    $trustInput = is_array($input['trust_items'] ?? null) ? $input['trust_items'] : [];
    $seenTrustIds = [];
    foreach (array_slice($trustInput, 0, 8) as $trustIndex => $item) {
        if (!is_array($item)) continue;
        $id = preg_replace('/[^a-zA-Z0-9_-]/', '', footerCmsText($item['id'] ?? '', 80)) ?: 'TR-' . str_pad((string) ($trustIndex + 1), 2, '0', STR_PAD_LEFT);
        if (isset($seenTrustIds[$id])) continue;
        $seenTrustIds[$id] = true;
        $trustItems[] = [
            'id' => $id,
            'label' => footerCmsText($item['label'] ?? '', 120),
            'note' => footerCmsText($item['note'] ?? '', 240),
            'active' => footerCmsBool($item['active'] ?? true),
            'sort_order' => max(1, min(100, (int) ($item['sort_order'] ?? ($trustIndex + 1)))),
        ];
    }
    usort($trustItems, static fn (array $left, array $right): int => $left['sort_order'] <=> $right['sort_order']);
    foreach ($trustItems as $trustIndex => &$item) $item['sort_order'] = $trustIndex + 1;
    unset($item);

    return [
        'brand' => [
            'description' => footerCmsText($brandInput['description'] ?? '', 400),
            'phone' => footerCmsText($brandInput['phone'] ?? '', 80),
            'email' => footerCmsText($brandInput['email'] ?? '', 190),
            'address' => footerCmsText($brandInput['address'] ?? '', 300),
            'facebook' => footerCmsExternalUrl($brandInput['facebook'] ?? ''),
            'instagram' => footerCmsExternalUrl($brandInput['instagram'] ?? ''),
            'whatsapp' => footerCmsExternalUrl($brandInput['whatsapp'] ?? ''),
            'youtube' => footerCmsExternalUrl($brandInput['youtube'] ?? ''),
        ],
        'settings' => [
            'newsletter' => footerCmsBool($settingsInput['newsletter'] ?? true),
            'contact_block' => footerCmsBool($settingsInput['contact_block'] ?? true),
            'social_links' => footerCmsBool($settingsInput['social_links'] ?? true),
            'trust_strip' => footerCmsBool($settingsInput['trust_strip'] ?? true),
            'payment_badges' => footerCmsBool($settingsInput['payment_badges'] ?? true),
            'copyright' => footerCmsText($settingsInput['copyright'] ?? '', 200),
        ],
        'columns' => $columns,
        'trust_items' => $trustItems,
    ];
}

function validateFooterCmsPublication(array $config): void
{
    $activeColumns = array_values(array_filter($config['columns'], static fn (array $column): bool => $column['status'] === 'active'));
    if (count($activeColumns) === 0) footerCmsJson(422, ['success' => false, 'message' => 'At least one active footer column is required before publishing.']);
    foreach ($activeColumns as $column) {
        $activeLinks = array_values(array_filter($column['links'], static fn (array $link): bool => $link['status'] === 'active'));
        if (count($activeLinks) === 0) footerCmsJson(422, ['success' => false, 'message' => $column['title'] . ' needs at least one active link.']);
    }
    if ($config['settings']['contact_block']) {
        if ($config['brand']['phone'] === '' || !filter_var($config['brand']['email'], FILTER_VALIDATE_EMAIL) || $config['brand']['address'] === '') {
            footerCmsJson(422, ['success' => false, 'message' => 'Visible contact block needs phone, valid email and address.']);
        }
    }
    if ($config['settings']['trust_strip']) {
        $activeTrust = array_values(array_filter($config['trust_items'], static fn (array $item): bool => $item['active'] && $item['label'] !== ''));
        if (count($activeTrust) < 2) footerCmsJson(422, ['success' => false, 'message' => 'Visible trust strip needs at least two active messages.']);
    }
    if ($config['settings']['copyright'] === '') footerCmsJson(422, ['success' => false, 'message' => 'Copyright line is required before publishing.']);
}

function readFooterCmsState(PDO $pdo): array
{
    $row = $pdo->query('SELECT draft_json, live_json, version_no, updated_at, published_at FROM footer_cms_state WHERE id = 1 LIMIT 1')->fetch() ?: [];
    $fallback = defaultFooterCmsConfig();
    $draft = json_decode((string) ($row['draft_json'] ?? ''), true);
    $live = json_decode((string) ($row['live_json'] ?? ''), true);
    $versions = $pdo->query('SELECT version_no, published_by, published_at FROM footer_cms_versions ORDER BY version_no DESC LIMIT 12')->fetchAll() ?: [];
    return [
        'draft' => is_array($draft) ? $draft : $fallback,
        'live' => is_array($live) ? $live : $fallback,
        'version' => (int) ($row['version_no'] ?? 1),
        'updated_at' => $row['updated_at'] ?? null,
        'published_at' => $row['published_at'] ?? null,
        'versions' => array_map(static fn (array $version): array => [
            'version' => (int) ($version['version_no'] ?? 0),
            'published_by' => $version['published_by'] ?? 'admin',
            'published_at' => $version['published_at'] ?? null,
        ], $versions),
    ];
}

function footerCmsPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

try {
    $pdo = getDatabaseConnection();
    ensureFooterCmsTables($pdo);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') footerCmsJson(200, array_merge(['success' => true], readFooterCmsState($pdo)));

    if ($method === 'PUT') {
        $payload = footerCmsPayload();
        $config = normalizeFooterCmsConfig($payload['config'] ?? $payload);
        $statement = $pdo->prepare('UPDATE footer_cms_state SET draft_json = :draft_json, updated_by = :updated_by WHERE id = 1');
        $statement->execute([
            ':draft_json' => json_encode($config, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            ':updated_by' => 'admin',
        ]);
        footerCmsJson(200, array_merge(['success' => true, 'message' => 'Footer CMS draft saved successfully.'], readFooterCmsState($pdo)));
    }

    if ($method === 'POST') {
        $payload = footerCmsPayload();
        $action = strtolower(footerCmsText($payload['action'] ?? 'publish', 40));
        if ($action === 'restore_draft') {
            $versionNumber = max(1, (int) ($payload['version'] ?? 0));
            $versionStatement = $pdo->prepare('SELECT config_json FROM footer_cms_versions WHERE version_no = :version_no LIMIT 1');
            $versionStatement->execute([':version_no' => $versionNumber]);
            $versionRow = $versionStatement->fetch();
            if (!$versionRow) footerCmsJson(404, ['success' => false, 'message' => 'The selected footer version was not found.']);
            $versionConfig = json_decode((string) $versionRow['config_json'], true);
            $config = normalizeFooterCmsConfig($versionConfig);
            $restore = $pdo->prepare('UPDATE footer_cms_state SET draft_json = :draft_json, updated_by = :updated_by WHERE id = 1');
            $restore->execute([
                ':draft_json' => json_encode($config, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
                ':updated_by' => 'admin-restore',
            ]);
            footerCmsJson(200, array_merge(['success' => true, 'message' => 'Version ' . $versionNumber . ' loaded as a new draft. The live footer was not changed.'], readFooterCmsState($pdo)));
        }

        $config = normalizeFooterCmsConfig($payload['config'] ?? []);
        validateFooterCmsPublication($config);
        $configJson = json_encode($config, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $pdo->beginTransaction();
        $locked = $pdo->query('SELECT version_no FROM footer_cms_state WHERE id = 1 FOR UPDATE')->fetch() ?: [];
        $nextVersion = (int) ($locked['version_no'] ?? 1) + 1;
        $publish = $pdo->prepare(
            'UPDATE footer_cms_state SET draft_json = :draft_json, live_json = :live_json, version_no = :version_no,
             published_at = CURRENT_TIMESTAMP, updated_by = :updated_by WHERE id = 1'
        );
        $publish->execute([
            ':draft_json' => $configJson,
            ':live_json' => $configJson,
            ':version_no' => $nextVersion,
            ':updated_by' => 'admin',
        ]);
        $history = $pdo->prepare(
            'INSERT INTO footer_cms_versions (version_no, config_json, published_by, published_at)
             VALUES (:version_no, :config_json, :published_by, CURRENT_TIMESTAMP)'
        );
        $history->execute([
            ':version_no' => $nextVersion,
            ':config_json' => $configJson,
            ':published_by' => 'admin',
        ]);
        $pdo->commit();
        footerCmsJson(200, array_merge(['success' => true, 'message' => 'Footer CMS version ' . $nextVersion . ' published successfully.'], readFooterCmsState($pdo)));
    }

    footerCmsJson(405, ['success' => false, 'message' => 'Only GET, PUT, and POST requests are allowed.']);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('Footer CMS request failed: ' . $exception->getMessage());
    footerCmsJson(500, ['success' => false, 'message' => 'Footer CMS request could not be completed right now.']);
}
