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

function headerNavigationJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function defaultHeaderNavigationConfig(): array
{
    return [
        'announcement' => [
            'enabled' => true,
            'text' => '100% authentic products · Free delivery over ৳1,500',
            'link' => '/offers',
        ],
        'settings' => [
            'sticky' => true,
            'search' => true,
            'wishlist' => true,
            'account' => true,
            'cart' => true,
            'language' => false,
        ],
        'mobile_shortcuts' => ['Home', 'Search', 'Wishlist', 'Bag'],
        'items' => [
            ['id' => 'NAV-01', 'label' => 'New Arrivals', 'link' => '/collections/new-arrivals', 'kind' => 'direct', 'status' => 'active', 'sort_order' => 1, 'children' => []],
            ['id' => 'NAV-02', 'label' => 'Skincare', 'link' => '/category/skincare', 'kind' => 'mega', 'status' => 'active', 'sort_order' => 2, 'children' => [
                ['id' => 'NAV-02-01', 'label' => 'Cleansers', 'link' => '/category/cleansers'],
                ['id' => 'NAV-02-02', 'label' => 'Serums', 'link' => '/category/serums'],
                ['id' => 'NAV-02-03', 'label' => 'Moisturizers', 'link' => '/category/moisturizers'],
                ['id' => 'NAV-02-04', 'label' => 'Sunscreen', 'link' => '/category/sunscreen'],
            ]],
            ['id' => 'NAV-03', 'label' => 'Haircare', 'link' => '/category/haircare', 'kind' => 'collection', 'status' => 'active', 'sort_order' => 3, 'children' => []],
            ['id' => 'NAV-04', 'label' => 'Fragrance', 'link' => '/category/fragrance', 'kind' => 'collection', 'status' => 'active', 'sort_order' => 4, 'children' => []],
            ['id' => 'NAV-05', 'label' => "Men's Care", 'link' => '/category/mens-care', 'kind' => 'collection', 'status' => 'active', 'sort_order' => 5, 'children' => []],
            ['id' => 'NAV-06', 'label' => 'Mom & Baby', 'link' => '/category/mom-baby', 'kind' => 'collection', 'status' => 'active', 'sort_order' => 6, 'children' => []],
            ['id' => 'NAV-07', 'label' => 'Brands', 'link' => '/brands', 'kind' => 'mega', 'status' => 'active', 'sort_order' => 7, 'children' => [
                ['id' => 'NAV-07-01', 'label' => 'COSRX', 'link' => '/brands/cosrx'],
                ['id' => 'NAV-07-02', 'label' => 'Anua', 'link' => '/brands/anua'],
                ['id' => 'NAV-07-03', 'label' => 'CeraVe', 'link' => '/brands/cerave'],
                ['id' => 'NAV-07-04', 'label' => 'AXIS-Y', 'link' => '/brands/axis-y'],
            ]],
            ['id' => 'NAV-08', 'label' => 'Offers', 'link' => '/offers', 'kind' => 'direct', 'status' => 'active', 'sort_order' => 8, 'children' => []],
        ],
    ];
}

function ensureHeaderNavigationTables(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS header_navigation_state (
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
        "CREATE TABLE IF NOT EXISTS header_navigation_versions (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            version_no INT UNSIGNED NOT NULL,
            config_json LONGTEXT NOT NULL,
            published_by VARCHAR(190) NULL,
            published_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_header_navigation_version (version_no)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $count = $pdo->query('SELECT COUNT(*) FROM header_navigation_state WHERE id = 1')->fetchColumn();
    if ((int) $count === 0) {
        $defaultJson = json_encode(defaultHeaderNavigationConfig(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $insert = $pdo->prepare(
            'INSERT INTO header_navigation_state (id, draft_json, live_json, version_no, updated_by, published_at)
             VALUES (1, :draft_json, :live_json, 1, :updated_by, CURRENT_TIMESTAMP)'
        );
        $insert->execute([
            ':draft_json' => $defaultJson,
            ':live_json' => $defaultJson,
            ':updated_by' => 'system-seed',
        ]);
    }

    $state = $pdo->query('SELECT live_json, version_no, published_at FROM header_navigation_state WHERE id = 1 LIMIT 1')->fetch() ?: [];
    $seedVersion = $pdo->prepare(
        'INSERT IGNORE INTO header_navigation_versions (version_no, config_json, published_by, published_at)
         VALUES (:version_no, :config_json, :published_by, :published_at)'
    );
    $seedVersion->execute([
        ':version_no' => (int) ($state['version_no'] ?? 1),
        ':config_json' => (string) ($state['live_json'] ?? '{}'),
        ':published_by' => 'system-seed',
        ':published_at' => $state['published_at'] ?? date('Y-m-d H:i:s'),
    ]);
}

function headerNavigationText(mixed $value, int $limit = 500): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function headerNavigationBool(mixed $value): bool
{
    if (is_bool($value)) return $value;
    return in_array(strtolower(trim((string) $value)), ['1', 'true', 'yes', 'active'], true);
}

function headerNavigationPath(mixed $value, string $fallback = '/'): string
{
    $path = headerNavigationText($value, 1000);
    return str_starts_with($path, '/') ? $path : $fallback;
}

function normalizeHeaderNavigationConfig(mixed $input): array
{
    if (!is_array($input)) {
        headerNavigationJson(400, ['success' => false, 'message' => 'A valid header configuration is required.']);
    }

    $announcementInput = is_array($input['announcement'] ?? null) ? $input['announcement'] : [];
    $settingsInput = is_array($input['settings'] ?? null) ? $input['settings'] : [];
    $itemsInput = is_array($input['items'] ?? null) ? $input['items'] : [];
    $items = [];
    $seenIds = [];
    $seenLabels = [];

    foreach (array_slice($itemsInput, 0, 20) as $index => $item) {
        if (!is_array($item)) continue;
        $id = preg_replace('/[^a-zA-Z0-9_-]/', '', headerNavigationText($item['id'] ?? '', 80)) ?: 'NAV-' . str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT);
        $label = headerNavigationText($item['label'] ?? '', 120);
        $labelKey = strtolower($label);
        $link = headerNavigationPath($item['link'] ?? '', '');
        if ($label === '' || $link === '') {
            headerNavigationJson(422, ['success' => false, 'message' => 'Every menu item needs a label and an internal link beginning with /.']);
        }
        if (isset($seenIds[$id]) || isset($seenLabels[$labelKey])) {
            headerNavigationJson(422, ['success' => false, 'message' => 'Menu labels and identifiers must be unique.']);
        }
        $seenIds[$id] = true;
        $seenLabels[$labelKey] = true;
        $kind = strtolower(headerNavigationText($item['kind'] ?? 'direct', 30));
        if (!in_array($kind, ['direct', 'collection', 'mega'], true)) $kind = 'direct';
        $status = strtolower(headerNavigationText($item['status'] ?? 'draft', 30));
        if (!in_array($status, ['active', 'draft', 'hidden'], true)) $status = 'draft';
        $children = [];
        $seenChildLabels = [];
        $childrenInput = is_array($item['children'] ?? null) ? $item['children'] : [];
        foreach (array_slice($childrenInput, 0, 20) as $childIndex => $child) {
            if (!is_array($child)) continue;
            $childLabel = headerNavigationText($child['label'] ?? '', 120);
            $childLink = headerNavigationPath($child['link'] ?? '', '');
            $childKey = strtolower($childLabel);
            if ($childLabel === '' || $childLink === '' || isset($seenChildLabels[$childKey])) continue;
            $seenChildLabels[$childKey] = true;
            $children[] = [
                'id' => preg_replace('/[^a-zA-Z0-9_-]/', '', headerNavigationText($child['id'] ?? '', 80)) ?: $id . '-' . str_pad((string) ($childIndex + 1), 2, '0', STR_PAD_LEFT),
                'label' => $childLabel,
                'link' => $childLink,
            ];
        }
        $items[] = [
            'id' => $id,
            'label' => $label,
            'link' => $link,
            'kind' => $kind,
            'status' => $status,
            'sort_order' => max(1, min(100, (int) ($item['sort_order'] ?? ($index + 1)))),
            'children' => $kind === 'mega' ? $children : [],
        ];
    }

    usort($items, static fn (array $left, array $right): int => $left['sort_order'] <=> $right['sort_order']);
    foreach ($items as $index => &$item) $item['sort_order'] = $index + 1;
    unset($item);

    $allowedShortcuts = ['Home', 'Search', 'Categories', 'Wishlist', 'Account', 'Bag'];
    $shortcutInput = is_array($input['mobile_shortcuts'] ?? null) ? $input['mobile_shortcuts'] : [];
    $shortcuts = [];
    foreach ($shortcutInput as $shortcut) {
        $shortcut = headerNavigationText($shortcut, 30);
        if (in_array($shortcut, $allowedShortcuts, true) && !in_array($shortcut, $shortcuts, true)) $shortcuts[] = $shortcut;
        if (count($shortcuts) === 4) break;
    }
    foreach ($allowedShortcuts as $shortcut) {
        if (count($shortcuts) === 4) break;
        if (!in_array($shortcut, $shortcuts, true)) $shortcuts[] = $shortcut;
    }

    return [
        'announcement' => [
            'enabled' => headerNavigationBool($announcementInput['enabled'] ?? true),
            'text' => headerNavigationText($announcementInput['text'] ?? '', 240),
            'link' => headerNavigationPath($announcementInput['link'] ?? '/', '/'),
        ],
        'settings' => [
            'sticky' => headerNavigationBool($settingsInput['sticky'] ?? true),
            'search' => headerNavigationBool($settingsInput['search'] ?? true),
            'wishlist' => headerNavigationBool($settingsInput['wishlist'] ?? true),
            'account' => headerNavigationBool($settingsInput['account'] ?? true),
            'cart' => headerNavigationBool($settingsInput['cart'] ?? true),
            'language' => headerNavigationBool($settingsInput['language'] ?? false),
        ],
        'mobile_shortcuts' => $shortcuts,
        'items' => $items,
    ];
}

function validateHeaderNavigationPublication(array $config): void
{
    $activeItems = array_values(array_filter($config['items'], static fn (array $item): bool => $item['status'] === 'active'));
    if (count($activeItems) === 0) {
        headerNavigationJson(422, ['success' => false, 'message' => 'At least one active primary menu item is required before publishing.']);
    }
    foreach ($activeItems as $item) {
        if ($item['kind'] === 'mega' && count($item['children']) < 2) {
            headerNavigationJson(422, ['success' => false, 'message' => $item['label'] . ' needs at least two valid mega-menu destinations.']);
        }
    }
    if ($config['announcement']['enabled'] && $config['announcement']['text'] === '') {
        headerNavigationJson(422, ['success' => false, 'message' => 'The enabled announcement strip needs a message.']);
    }
}

function readHeaderNavigationState(PDO $pdo): array
{
    $row = $pdo->query(
        'SELECT draft_json, live_json, version_no, updated_at, published_at
         FROM header_navigation_state WHERE id = 1 LIMIT 1'
    )->fetch() ?: [];
    $fallback = defaultHeaderNavigationConfig();
    $draft = json_decode((string) ($row['draft_json'] ?? ''), true);
    $live = json_decode((string) ($row['live_json'] ?? ''), true);
    $versions = $pdo->query(
        'SELECT version_no, published_by, published_at
         FROM header_navigation_versions ORDER BY version_no DESC LIMIT 12'
    )->fetchAll() ?: [];

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

function headerNavigationPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

try {
    $pdo = getDatabaseConnection();
    ensureHeaderNavigationTables($pdo);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        headerNavigationJson(200, array_merge(['success' => true], readHeaderNavigationState($pdo)));
    }

    if ($method === 'PUT') {
        $payload = headerNavigationPayload();
        $config = normalizeHeaderNavigationConfig($payload['config'] ?? $payload);
        $statement = $pdo->prepare(
            'UPDATE header_navigation_state SET draft_json = :draft_json, updated_by = :updated_by WHERE id = 1'
        );
        $statement->execute([
            ':draft_json' => json_encode($config, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            ':updated_by' => 'admin',
        ]);
        headerNavigationJson(200, array_merge([
            'success' => true,
            'message' => 'Header navigation draft saved successfully.',
        ], readHeaderNavigationState($pdo)));
    }

    if ($method === 'POST') {
        $payload = headerNavigationPayload();
        $action = strtolower(headerNavigationText($payload['action'] ?? 'publish', 40));

        if ($action === 'restore_draft') {
            $versionNumber = max(1, (int) ($payload['version'] ?? 0));
            $versionStatement = $pdo->prepare(
                'SELECT config_json FROM header_navigation_versions WHERE version_no = :version_no LIMIT 1'
            );
            $versionStatement->execute([':version_no' => $versionNumber]);
            $versionRow = $versionStatement->fetch();
            if (!$versionRow) headerNavigationJson(404, ['success' => false, 'message' => 'The selected navigation version was not found.']);
            $versionConfig = json_decode((string) $versionRow['config_json'], true);
            $config = normalizeHeaderNavigationConfig($versionConfig);
            $restore = $pdo->prepare(
                'UPDATE header_navigation_state SET draft_json = :draft_json, updated_by = :updated_by WHERE id = 1'
            );
            $restore->execute([
                ':draft_json' => json_encode($config, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
                ':updated_by' => 'admin-restore',
            ]);
            headerNavigationJson(200, array_merge([
                'success' => true,
                'message' => 'Version ' . $versionNumber . ' loaded as a new draft. The live header was not changed.',
            ], readHeaderNavigationState($pdo)));
        }

        $config = normalizeHeaderNavigationConfig($payload['config'] ?? []);
        validateHeaderNavigationPublication($config);
        $configJson = json_encode($config, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $pdo->beginTransaction();
        $locked = $pdo->query('SELECT version_no FROM header_navigation_state WHERE id = 1 FOR UPDATE')->fetch() ?: [];
        $nextVersion = (int) ($locked['version_no'] ?? 1) + 1;
        $publish = $pdo->prepare(
            'UPDATE header_navigation_state
             SET draft_json = :draft_json, live_json = :live_json, version_no = :version_no,
                 published_at = CURRENT_TIMESTAMP, updated_by = :updated_by
             WHERE id = 1'
        );
        $publish->execute([
            ':draft_json' => $configJson,
            ':live_json' => $configJson,
            ':version_no' => $nextVersion,
            ':updated_by' => 'admin',
        ]);
        $history = $pdo->prepare(
            'INSERT INTO header_navigation_versions (version_no, config_json, published_by, published_at)
             VALUES (:version_no, :config_json, :published_by, CURRENT_TIMESTAMP)'
        );
        $history->execute([
            ':version_no' => $nextVersion,
            ':config_json' => $configJson,
            ':published_by' => 'admin',
        ]);
        $pdo->commit();
        headerNavigationJson(200, array_merge([
            'success' => true,
            'message' => 'Header navigation version ' . $nextVersion . ' published successfully.',
        ], readHeaderNavigationState($pdo)));
    }

    headerNavigationJson(405, ['success' => false, 'message' => 'Only GET, PUT, and POST requests are allowed.']);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('Header navigation request failed: ' . $exception->getMessage());
    headerNavigationJson(500, ['success' => false, 'message' => 'Header navigation request could not be completed right now.']);
}
