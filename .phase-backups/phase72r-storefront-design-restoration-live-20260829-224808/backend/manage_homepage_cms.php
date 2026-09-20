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

function homepageJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function defaultHomepageConfig(): array
{
    return [
        'page_title' => 'Beauty chosen with care',
        'page_subtitle' => 'Authentic skincare and beauty products for every routine.',
        'hero_banners' => [],
        'sections' => [
            ['id' => 'hero', 'title' => 'Hero Slider', 'subtitle' => 'Homepage campaign banners', 'source' => 'Homepage CMS', 'enabled' => true, 'sort_order' => 1, 'display_limit' => 5],
            ['id' => 'offers', 'title' => 'Special Offers', 'subtitle' => 'Current promotional collections', 'source' => 'Offers & Deals', 'enabled' => true, 'sort_order' => 2, 'display_limit' => 6],
            ['id' => 'categories', 'title' => 'Shop by Category', 'subtitle' => 'Browse beauty by product type', 'source' => 'Categories', 'enabled' => true, 'sort_order' => 3, 'display_limit' => 5],
            ['id' => 'concerns', 'title' => 'Shop by Concern', 'subtitle' => 'Find products for your skin goals', 'source' => 'Concerns', 'enabled' => true, 'sort_order' => 4, 'display_limit' => 7],
            ['id' => 'brands', 'title' => 'Featured Brands', 'subtitle' => 'Trusted beauty brands', 'source' => 'Brands', 'enabled' => true, 'sort_order' => 5, 'display_limit' => 8],
            ['id' => 'best-sellers', 'title' => 'Best Sellers', 'subtitle' => 'Customer favourites', 'source' => 'Products', 'enabled' => true, 'sort_order' => 6, 'display_limit' => 8],
            ['id' => 'editor-picks', 'title' => "Editor's Picks", 'subtitle' => 'Curated routines and collections', 'source' => 'Collections', 'enabled' => true, 'sort_order' => 7, 'display_limit' => 6],
            ['id' => 'real-results', 'title' => 'Real Results', 'subtitle' => 'Verified customer stories', 'source' => 'Reviews & Real Results', 'enabled' => true, 'sort_order' => 8, 'display_limit' => 6],
        ],
    ];
}

function ensureHomepageTable(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS homepage_cms_state (
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

    $statement = $pdo->prepare('SELECT COUNT(*) FROM homepage_cms_state WHERE id = 1');
    $statement->execute();
    if ((int) $statement->fetchColumn() === 0) {
        $defaultJson = json_encode(defaultHomepageConfig(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $insert = $pdo->prepare(
            'INSERT INTO homepage_cms_state (id, draft_json, live_json, version_no, updated_by, published_at)
             VALUES (1, :draft_json, :live_json, 1, :updated_by, CURRENT_TIMESTAMP)'
        );
        $insert->execute([
            ':draft_json' => $defaultJson,
            ':live_json' => $defaultJson,
            ':updated_by' => 'system-seed',
        ]);
    }
}

function homepageText(mixed $value, int $limit = 500): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function homepageBool(mixed $value): bool
{
    if (is_bool($value)) return $value;
    return in_array(strtolower(trim((string) $value)), ['1', 'true', 'yes', 'active'], true);
}

function homepageInt(mixed $value, int $fallback, int $min, int $max): int
{
    $number = filter_var($value, FILTER_VALIDATE_INT);
    if ($number === false) return $fallback;
    return max($min, min($max, (int) $number));
}

function normalizeHomepageConfig(mixed $input): array
{
    if (!is_array($input)) {
        homepageJson(400, ['success' => false, 'message' => 'A valid homepage configuration is required.']);
    }

    $sectionsInput = is_array($input['sections'] ?? null) ? $input['sections'] : [];
    $heroesInput = is_array($input['hero_banners'] ?? null) ? $input['hero_banners'] : [];
    $sections = [];
    $seenSections = [];

    foreach (array_slice($sectionsInput, 0, 20) as $index => $section) {
        if (!is_array($section)) continue;
        $id = preg_replace('/[^a-z0-9-]/', '', strtolower(homepageText($section['id'] ?? '', 80))) ?: 'section-' . ($index + 1);
        if (isset($seenSections[$id])) continue;
        $seenSections[$id] = true;
        $sections[] = [
            'id' => $id,
            'title' => homepageText($section['title'] ?? '', 190) ?: 'Homepage Section',
            'subtitle' => homepageText($section['subtitle'] ?? '', 500),
            'source' => homepageText($section['source'] ?? 'Homepage CMS', 190) ?: 'Homepage CMS',
            'enabled' => homepageBool($section['enabled'] ?? true),
            'sort_order' => homepageInt($section['sort_order'] ?? ($index + 1), $index + 1, 1, 100),
            'display_limit' => homepageInt($section['display_limit'] ?? 6, 6, 1, 24),
        ];
    }
    usort($sections, static fn (array $left, array $right): int => $left['sort_order'] <=> $right['sort_order']);
    foreach ($sections as $index => &$section) {
        $section['sort_order'] = $index + 1;
    }
    unset($section);

    $heroes = [];
    $seenHeroes = [];
    foreach (array_slice($heroesInput, 0, 12) as $index => $hero) {
        if (!is_array($hero)) continue;
        $id = preg_replace('/[^a-zA-Z0-9_-]/', '', homepageText($hero['id'] ?? '', 80)) ?: 'hero-' . ($index + 1);
        if (isset($seenHeroes[$id])) continue;
        $seenHeroes[$id] = true;
        $status = strtolower(homepageText($hero['status'] ?? 'draft', 20));
        if (!in_array($status, ['active', 'inactive', 'draft'], true)) $status = 'draft';
        $heroes[] = [
            'id' => $id,
            'title' => homepageText($hero['title'] ?? '', 190),
            'subtitle' => homepageText($hero['subtitle'] ?? '', 500),
            'cta_text' => homepageText($hero['cta_text'] ?? '', 100),
            'link' => homepageText($hero['link'] ?? '', 1000),
            'image_url' => homepageText($hero['image_url'] ?? '', 2000),
            'mobile_image_url' => homepageText($hero['mobile_image_url'] ?? '', 2000),
            'status' => $status,
            'sort_order' => homepageInt($hero['sort_order'] ?? ($index + 1), $index + 1, 1, 100),
        ];
    }
    usort($heroes, static fn (array $left, array $right): int => $left['sort_order'] <=> $right['sort_order']);
    foreach ($heroes as $index => &$hero) {
        $hero['sort_order'] = $index + 1;
    }
    unset($hero);

    return [
        'page_title' => homepageText($input['page_title'] ?? '', 190),
        'page_subtitle' => homepageText($input['page_subtitle'] ?? '', 500),
        'hero_banners' => $heroes,
        'sections' => $sections,
    ];
}

function readHomepageState(PDO $pdo): array
{
    $statement = $pdo->query(
        'SELECT draft_json, live_json, version_no, updated_at, published_at
         FROM homepage_cms_state WHERE id = 1 LIMIT 1'
    );
    $row = $statement->fetch() ?: [];
    $fallback = defaultHomepageConfig();
    $draft = json_decode((string) ($row['draft_json'] ?? ''), true);
    $live = json_decode((string) ($row['live_json'] ?? ''), true);

    return [
        'draft' => is_array($draft) ? $draft : $fallback,
        'live' => is_array($live) ? $live : $fallback,
        'version' => (int) ($row['version_no'] ?? 1),
        'updated_at' => $row['updated_at'] ?? null,
        'published_at' => $row['published_at'] ?? null,
    ];
}

function homepagePayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

try {
    $pdo = getDatabaseConnection();
    ensureHomepageTable($pdo);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        homepageJson(200, array_merge(['success' => true], readHomepageState($pdo)));
    }

    if ($method === 'PUT') {
        $payload = homepagePayload();
        $config = normalizeHomepageConfig($payload['config'] ?? $payload);
        $statement = $pdo->prepare(
            'UPDATE homepage_cms_state SET draft_json = :draft_json, updated_by = :updated_by WHERE id = 1'
        );
        $statement->execute([
            ':draft_json' => json_encode($config, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            ':updated_by' => 'admin',
        ]);
        homepageJson(200, array_merge([
            'success' => true,
            'message' => 'Homepage draft saved successfully.',
        ], readHomepageState($pdo)));
    }

    if ($method === 'POST') {
        $payload = homepagePayload();
        $config = isset($payload['config']) ? normalizeHomepageConfig($payload['config']) : null;
        $pdo->beginTransaction();
        if ($config !== null) {
            $save = $pdo->prepare('UPDATE homepage_cms_state SET draft_json = :draft_json WHERE id = 1');
            $save->execute([':draft_json' => json_encode($config, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)]);
        }
        $publish = $pdo->prepare(
            'UPDATE homepage_cms_state
             SET live_json = draft_json, version_no = version_no + 1,
                 published_at = CURRENT_TIMESTAMP, updated_by = :updated_by
             WHERE id = 1'
        );
        $publish->execute([':updated_by' => 'admin']);
        $pdo->commit();
        homepageJson(200, array_merge([
            'success' => true,
            'message' => 'Homepage published successfully.',
        ], readHomepageState($pdo)));
    }

    homepageJson(405, ['success' => false, 'message' => 'Only GET, PUT, and POST requests are allowed.']);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('Homepage CMS request failed: ' . $exception->getMessage());
    homepageJson(500, ['success' => false, 'message' => 'Homepage CMS request could not be completed right now.']);
}
