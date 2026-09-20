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
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

requireAdminAuth();

function seoJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function seoText(mixed $value, int $limit = 500): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function seoBool(mixed $value): bool
{
    if (is_bool($value)) return $value;
    return in_array(strtolower(trim((string) $value)), ['1', 'true', 'yes', 'active'], true);
}

function seoLength(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);
}

function seoUrl(mixed $value, bool $allowEmpty = false): string
{
    $url = rtrim(seoText($value, 1000), '/');
    if ($allowEmpty && $url === '') return '';
    return filter_var($url, FILTER_VALIDATE_URL) && preg_match('/^https:\/\//i', $url) === 1 ? $url : '';
}

function defaultSeoConfig(): array
{
    return [
        'site_name' => 'BrandnBeauty',
        'site_url' => 'https://brandnbeauty.com',
        'default_title' => 'BrandnBeauty | Authentic Beauty in Bangladesh',
        'title_suffix' => ' | BrandnBeauty',
        'default_description' => 'Shop authentic skincare, haircare, fragrance and beauty products in Bangladesh with clear product information and dependable delivery.',
        'canonical_base' => 'https://brandnbeauty.com',
        'default_og_image' => '',
        'twitter_handle' => '',
        'facebook_page' => '',
        'indexing_enabled' => true,
        'follow_links' => true,
        'sitemap_enabled' => true,
        'include_products' => true,
        'include_categories' => true,
        'include_concerns' => true,
        'include_brands' => true,
        'include_collections' => true,
        'product_schema' => true,
        'organization_schema' => true,
        'breadcrumb_schema' => true,
        'robots_custom_rules' => "Disallow: /admin\nDisallow: /checkout\nDisallow: /account",
        'templates' => [
            ['page_type' => 'Product', 'title_template' => '{product_name}{title_suffix}', 'description_template' => 'Shop {product_name} in Bangladesh. See ingredients, suitability, authentic sourcing and delivery information.', 'indexable' => true],
            ['page_type' => 'Category', 'title_template' => '{category_name}{title_suffix}', 'description_template' => 'Explore authentic {category_name} products at BrandnBeauty with clear product details and delivery across Bangladesh.', 'indexable' => true],
            ['page_type' => 'Concern', 'title_template' => '{concern_name} Products{title_suffix}', 'description_template' => 'Discover carefully selected products for {concern_name}. Compare ingredients, suitability and routine guidance.', 'indexable' => true],
            ['page_type' => 'Brand', 'title_template' => '{brand_name} Products{title_suffix}', 'description_template' => 'Shop authentic {brand_name} products in Bangladesh from BrandnBeauty.', 'indexable' => true],
            ['page_type' => 'Collection', 'title_template' => '{collection_name}{title_suffix}', 'description_template' => 'Explore the {collection_name} collection from BrandnBeauty.', 'indexable' => true],
        ],
    ];
}

function ensureSeoTables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS seo_cms_state (
        id TINYINT UNSIGNED NOT NULL, draft_json LONGTEXT NOT NULL, live_json LONGTEXT NOT NULL,
        version_no INT UNSIGNED NOT NULL DEFAULT 1, updated_by VARCHAR(190) NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        published_at TIMESTAMP NULL DEFAULT NULL, PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS seo_cms_versions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, version_no INT UNSIGNED NOT NULL,
        config_json LONGTEXT NOT NULL, published_by VARCHAR(190) NULL,
        published_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id),
        UNIQUE KEY uq_seo_cms_version (version_no)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS seo_redirects (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, from_path VARCHAR(1000) NOT NULL,
        to_path VARCHAR(1000) NOT NULL, redirect_type SMALLINT UNSIGNED NOT NULL DEFAULT 301,
        reason VARCHAR(500) NULL, status VARCHAR(30) NOT NULL DEFAULT 'draft', hits BIGINT UNSIGNED NOT NULL DEFAULT 0,
        created_by VARCHAR(190) NULL, created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_seo_redirect_from (from_path), KEY idx_seo_redirect_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS seo_health_audits (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, score TINYINT UNSIGNED NOT NULL,
        critical_count INT UNSIGNED NOT NULL DEFAULT 0, warning_count INT UNSIGNED NOT NULL DEFAULT 0,
        passed_count INT UNSIGNED NOT NULL DEFAULT 0, checks_json LONGTEXT NOT NULL,
        run_by VARCHAR(190) NULL, created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_seo_audit_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $count = (int) $pdo->query('SELECT COUNT(*) FROM seo_cms_state WHERE id = 1')->fetchColumn();
    if ($count === 0) {
        $json = json_encode(defaultSeoConfig(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $insert = $pdo->prepare('INSERT INTO seo_cms_state (id, draft_json, live_json, version_no, updated_by, published_at) VALUES (1, :draft, :live, 1, :actor, CURRENT_TIMESTAMP)');
        $insert->execute([':draft' => $json, ':live' => $json, ':actor' => 'system-seed']);
    }
    $state = $pdo->query('SELECT live_json, version_no, published_at FROM seo_cms_state WHERE id = 1 LIMIT 1')->fetch() ?: [];
    $seed = $pdo->prepare('INSERT IGNORE INTO seo_cms_versions (version_no, config_json, published_by, published_at) VALUES (:version, :config, :actor, :published)');
    $seed->execute([':version' => (int) ($state['version_no'] ?? 1), ':config' => (string) ($state['live_json'] ?? '{}'), ':actor' => 'system-seed', ':published' => $state['published_at'] ?? date('Y-m-d H:i:s')]);
}

function normalizeSeoConfig(mixed $input): array
{
    if (!is_array($input)) seoJson(400, ['success' => false, 'message' => 'A valid SEO configuration is required.']);
    $templates = [];
    foreach (($input['templates'] ?? []) as $template) {
        if (!is_array($template)) continue;
        $pageType = seoText($template['page_type'] ?? '', 60);
        if ($pageType === '') continue;
        $templates[] = [
            'page_type' => $pageType,
            'title_template' => seoText($template['title_template'] ?? '', 120),
            'description_template' => seoText($template['description_template'] ?? '', 320),
            'indexable' => seoBool($template['indexable'] ?? true),
        ];
    }
    return [
        'site_name' => seoText($input['site_name'] ?? '', 120),
        'site_url' => seoUrl($input['site_url'] ?? ''),
        'default_title' => seoText($input['default_title'] ?? '', 120),
        'title_suffix' => seoText($input['title_suffix'] ?? '', 60),
        'default_description' => seoText($input['default_description'] ?? '', 320),
        'canonical_base' => seoUrl($input['canonical_base'] ?? ''),
        'default_og_image' => seoUrl($input['default_og_image'] ?? '', true),
        'twitter_handle' => seoText($input['twitter_handle'] ?? '', 100),
        'facebook_page' => seoUrl($input['facebook_page'] ?? '', true),
        'indexing_enabled' => seoBool($input['indexing_enabled'] ?? true),
        'follow_links' => seoBool($input['follow_links'] ?? true),
        'sitemap_enabled' => seoBool($input['sitemap_enabled'] ?? true),
        'include_products' => seoBool($input['include_products'] ?? true),
        'include_categories' => seoBool($input['include_categories'] ?? true),
        'include_concerns' => seoBool($input['include_concerns'] ?? true),
        'include_brands' => seoBool($input['include_brands'] ?? true),
        'include_collections' => seoBool($input['include_collections'] ?? true),
        'product_schema' => seoBool($input['product_schema'] ?? true),
        'organization_schema' => seoBool($input['organization_schema'] ?? true),
        'breadcrumb_schema' => seoBool($input['breadcrumb_schema'] ?? true),
        'robots_custom_rules' => seoText($input['robots_custom_rules'] ?? '', 2000),
        'templates' => array_slice($templates, 0, 20),
    ];
}

function validateSeoPublication(array $config): void
{
    if ($config['site_name'] === '' || $config['site_url'] === '' || $config['canonical_base'] === '') seoJson(422, ['success' => false, 'message' => 'Site name, HTTPS site URL and canonical base are required.']);
    if ($config['default_title'] === '' || seoLength($config['default_title']) > 70) seoJson(422, ['success' => false, 'message' => 'Default title is required and must be 70 characters or fewer.']);
    if (seoLength($config['default_description']) < 50 || seoLength($config['default_description']) > 180) seoJson(422, ['success' => false, 'message' => 'Default description must be between 50 and 180 characters.']);
    if (count($config['templates']) === 0) seoJson(422, ['success' => false, 'message' => 'At least one SEO page template is required.']);
    foreach ($config['templates'] as $template) {
        if ($template['title_template'] === '' || $template['description_template'] === '') seoJson(422, ['success' => false, 'message' => $template['page_type'] . ' needs both title and description templates.']);
    }
}

function normalizeRedirect(mixed $input): array
{
    if (!is_array($input)) seoJson(400, ['success' => false, 'message' => 'A valid redirect is required.']);
    $from = seoText($input['from_path'] ?? '', 1000);
    $to = seoText($input['to_path'] ?? '', 1000);
    if (!str_starts_with($from, '/') || !str_starts_with($to, '/')) seoJson(422, ['success' => false, 'message' => 'Both redirect paths must begin with /.']);
    if ($from === $to) seoJson(422, ['success' => false, 'message' => 'A redirect cannot point to the same path.']);
    if (str_contains($from, '://') || str_contains($to, '://')) seoJson(422, ['success' => false, 'message' => 'Only internal paths are allowed.']);
    return ['id' => max(0, (int) ($input['id'] ?? 0)), 'from_path' => $from, 'to_path' => $to, 'redirect_type' => in_array((int) ($input['redirect_type'] ?? 301), [301, 302], true) ? (int) $input['redirect_type'] : 301, 'reason' => seoText($input['reason'] ?? '', 500)];
}

function runSeoAudit(array $config, array $redirects): array
{
    $checks = [];
    $add = static function (string $id, string $area, string $label, string $detail, string $status) use (&$checks): void { $checks[] = compact('id', 'area', 'label', 'detail', 'status'); };
    $add('site-url', 'Crawl & index', 'Secure production URL', $config['site_url'] !== '' ? $config['site_url'] : 'A valid HTTPS site URL is missing.', $config['site_url'] !== '' ? 'pass' : 'critical');
    $add('canonical', 'Crawl & index', 'Canonical base', $config['canonical_base'] === $config['site_url'] ? 'Canonical base matches the production URL.' : 'Canonical base and site URL do not match.', $config['canonical_base'] === $config['site_url'] && $config['site_url'] !== '' ? 'pass' : 'critical');
    $add('indexing', 'Crawl & index', 'Storefront indexing', $config['indexing_enabled'] ? 'Public indexing is enabled.' : 'The live storefront is set to noindex.', $config['indexing_enabled'] ? 'pass' : 'critical');
    $add('sitemap', 'Crawl & index', 'XML sitemap', $config['sitemap_enabled'] ? 'Dynamic sitemap publication is enabled.' : 'Sitemap publication is disabled.', $config['sitemap_enabled'] ? 'pass' : 'warning');
    $titleLength = seoLength($config['default_title']);
    $add('default-title', 'Search appearance', 'Default search title', $titleLength . ' characters.', $titleLength >= 25 && $titleLength <= 65 ? 'pass' : ($titleLength > 0 && $titleLength <= 70 ? 'warning' : 'critical'));
    $descriptionLength = seoLength($config['default_description']);
    $add('description', 'Search appearance', 'Default description', $descriptionLength . ' characters.', $descriptionLength >= 80 && $descriptionLength <= 170 ? 'pass' : ($descriptionLength >= 50 && $descriptionLength <= 180 ? 'warning' : 'critical'));
    $add('og-image', 'Social sharing', 'Default social image', $config['default_og_image'] !== '' ? 'A secure social preview image is configured.' : 'No default Open Graph image is configured.', $config['default_og_image'] !== '' ? 'pass' : 'warning');
    $schemaCount = (int) $config['product_schema'] + (int) $config['organization_schema'] + (int) $config['breadcrumb_schema'];
    $add('schema', 'Structured data', 'Schema coverage', $schemaCount . ' of 3 schema groups enabled.', $schemaCount === 3 ? 'pass' : ($schemaCount > 0 ? 'warning' : 'critical'));
    $templateProblems = array_filter($config['templates'], static fn (array $template): bool => $template['title_template'] === '' || $template['description_template'] === '');
    $add('templates', 'Search appearance', 'Page templates', count($templateProblems) === 0 ? count($config['templates']) . ' page templates are complete.' : count($templateProblems) . ' templates are incomplete.', count($templateProblems) === 0 && count($config['templates']) >= 5 ? 'pass' : (count($templateProblems) === 0 ? 'warning' : 'critical'));
    $loops = 0; $fromPaths = [];
    foreach ($redirects as $redirect) $fromPaths[(string) $redirect['from_path']] = (string) $redirect['to_path'];
    foreach ($fromPaths as $from => $to) if ($from === $to || (($fromPaths[$to] ?? '') === $from)) $loops++;
    $add('redirects', 'Redirects', 'Redirect safety', $loops === 0 ? count($redirects) . ' redirect records checked; no direct loop found.' : $loops . ' redirect loop risks found.', $loops === 0 ? 'pass' : 'critical');
    $counts = ['critical' => 0, 'warning' => 0, 'pass' => 0];
    foreach ($checks as $check) $counts[$check['status']]++;
    $score = (int) round((($counts['pass'] * 100) + ($counts['warning'] * 55)) / max(1, count($checks)));
    return ['score' => $score, 'critical_count' => $counts['critical'], 'warning_count' => $counts['warning'], 'passed_count' => $counts['pass'], 'checks' => $checks];
}

function readSeoState(PDO $pdo): array
{
    $row = $pdo->query('SELECT draft_json, live_json, version_no, updated_at, published_at FROM seo_cms_state WHERE id = 1 LIMIT 1')->fetch() ?: [];
    $fallback = defaultSeoConfig();
    $draft = json_decode((string) ($row['draft_json'] ?? ''), true);
    $live = json_decode((string) ($row['live_json'] ?? ''), true);
    $redirects = $pdo->query("SELECT id, from_path, to_path, redirect_type, reason, status, hits, created_at, updated_at FROM seo_redirects ORDER BY status = 'draft' DESC, updated_at DESC, id DESC LIMIT 250")->fetchAll() ?: [];
    $audits = $pdo->query('SELECT id, score, critical_count, warning_count, passed_count, checks_json, run_by, created_at FROM seo_health_audits ORDER BY id DESC LIMIT 12')->fetchAll() ?: [];
    $versions = $pdo->query('SELECT version_no, published_by, published_at FROM seo_cms_versions ORDER BY version_no DESC LIMIT 12')->fetchAll() ?: [];
    return [
        'draft' => is_array($draft) ? $draft : $fallback, 'live' => is_array($live) ? $live : $fallback,
        'version' => (int) ($row['version_no'] ?? 1), 'updated_at' => $row['updated_at'] ?? null, 'published_at' => $row['published_at'] ?? null,
        'redirects' => array_map(static fn (array $item): array => [...$item, 'id' => (int) $item['id'], 'redirect_type' => (int) $item['redirect_type'], 'hits' => (int) $item['hits']], $redirects),
        'audits' => array_map(static fn (array $item): array => ['id' => (int) $item['id'], 'score' => (int) $item['score'], 'critical_count' => (int) $item['critical_count'], 'warning_count' => (int) $item['warning_count'], 'passed_count' => (int) $item['passed_count'], 'checks' => json_decode((string) $item['checks_json'], true) ?: [], 'run_by' => $item['run_by'] ?? 'admin', 'created_at' => $item['created_at'] ?? null], $audits),
        'versions' => array_map(static fn (array $item): array => ['version' => (int) $item['version_no'], 'published_by' => $item['published_by'] ?? 'admin', 'published_at' => $item['published_at'] ?? null], $versions),
    ];
}

function seoPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

try {
    $pdo = getDatabaseConnection();
    ensureSeoTables($pdo);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'GET') seoJson(200, array_merge(['success' => true], readSeoState($pdo)));

    if ($method === 'PUT') {
        $payload = seoPayload(); $config = normalizeSeoConfig($payload['config'] ?? $payload);
        $save = $pdo->prepare('UPDATE seo_cms_state SET draft_json = :config, updated_by = :actor WHERE id = 1');
        $save->execute([':config' => json_encode($config, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), ':actor' => 'admin']);
        seoJson(200, array_merge(['success' => true, 'message' => 'SEO draft saved successfully.'], readSeoState($pdo)));
    }

    if ($method === 'POST') {
        $payload = seoPayload(); $action = strtolower(seoText($payload['action'] ?? 'publish', 40));
        if ($action === 'save_redirect') {
            $redirect = normalizeRedirect($payload['redirect'] ?? []);
            $loop = $pdo->prepare("SELECT COUNT(*) FROM seo_redirects WHERE from_path = :to_path AND to_path = :from_path AND status <> 'archived' AND id <> :id");
            $loop->execute([':to_path' => $redirect['to_path'], ':from_path' => $redirect['from_path'], ':id' => $redirect['id']]);
            if ((int) $loop->fetchColumn() > 0) seoJson(422, ['success' => false, 'message' => 'This redirect would create a direct loop.']);
            try {
                if ($redirect['id'] > 0) {
                    $save = $pdo->prepare("UPDATE seo_redirects SET from_path = :from_path, to_path = :to_path, redirect_type = :redirect_type, reason = :reason, status = 'draft' WHERE id = :id");
                    $save->execute([':from_path' => $redirect['from_path'], ':to_path' => $redirect['to_path'], ':redirect_type' => $redirect['redirect_type'], ':reason' => $redirect['reason'], ':id' => $redirect['id']]);
                } else {
                    $save = $pdo->prepare("INSERT INTO seo_redirects (from_path, to_path, redirect_type, reason, status, created_by) VALUES (:from_path, :to_path, :redirect_type, :reason, 'draft', 'admin')");
                    $save->execute([':from_path' => $redirect['from_path'], ':to_path' => $redirect['to_path'], ':redirect_type' => $redirect['redirect_type'], ':reason' => $redirect['reason']]);
                }
            } catch (PDOException $exception) {
                if ((string) $exception->getCode() === '23000') seoJson(409, ['success' => false, 'message' => 'That old path already has a redirect.']);
                throw $exception;
            }
            seoJson(200, array_merge(['success' => true, 'message' => 'Redirect saved as draft for validation.'], readSeoState($pdo)));
        }
        if ($action === 'archive_redirect') {
            $archive = $pdo->prepare("UPDATE seo_redirects SET status = 'archived' WHERE id = :id");
            $archive->execute([':id' => max(1, (int) ($payload['id'] ?? 0))]);
            seoJson(200, array_merge(['success' => true, 'message' => 'Redirect archived safely.'], readSeoState($pdo)));
        }
        if ($action === 'run_audit') {
            $state = readSeoState($pdo); $activeRedirects = array_values(array_filter($state['redirects'], static fn (array $item): bool => $item['status'] !== 'archived'));
            $audit = runSeoAudit(normalizeSeoConfig($state['draft']), $activeRedirects);
            $save = $pdo->prepare('INSERT INTO seo_health_audits (score, critical_count, warning_count, passed_count, checks_json, run_by) VALUES (:score, :critical, :warning, :passed, :checks, :actor)');
            $save->execute([':score' => $audit['score'], ':critical' => $audit['critical_count'], ':warning' => $audit['warning_count'], ':passed' => $audit['passed_count'], ':checks' => json_encode($audit['checks'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), ':actor' => 'admin']);
            seoJson(200, array_merge(['success' => true, 'message' => 'SEO configuration audit completed.'], readSeoState($pdo)));
        }
        if ($action === 'restore_draft') {
            $version = max(1, (int) ($payload['version'] ?? 0));
            $statement = $pdo->prepare('SELECT config_json FROM seo_cms_versions WHERE version_no = :version LIMIT 1'); $statement->execute([':version' => $version]); $row = $statement->fetch();
            if (!$row) seoJson(404, ['success' => false, 'message' => 'The selected SEO version was not found.']);
            $config = normalizeSeoConfig(json_decode((string) $row['config_json'], true));
            $restore = $pdo->prepare('UPDATE seo_cms_state SET draft_json = :config, updated_by = :actor WHERE id = 1');
            $restore->execute([':config' => json_encode($config, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), ':actor' => 'admin-restore']);
            seoJson(200, array_merge(['success' => true, 'message' => 'Version ' . $version . ' loaded as draft. Live SEO was not changed.'], readSeoState($pdo)));
        }

        $config = normalizeSeoConfig($payload['config'] ?? []); validateSeoPublication($config);
        $redirects = $pdo->query("SELECT from_path, to_path FROM seo_redirects WHERE status <> 'archived'")->fetchAll() ?: [];
        $audit = runSeoAudit($config, $redirects);
        if ($audit['critical_count'] > 0) seoJson(422, ['success' => false, 'message' => 'Publishing is blocked by ' . $audit['critical_count'] . ' critical SEO configuration issue(s). Run the audit and resolve them first.']);
        $json = json_encode($config, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $pdo->beginTransaction();
        $locked = $pdo->query('SELECT version_no FROM seo_cms_state WHERE id = 1 FOR UPDATE')->fetch() ?: [];
        $nextVersion = (int) ($locked['version_no'] ?? 1) + 1;
        $publish = $pdo->prepare('UPDATE seo_cms_state SET draft_json = :config, live_json = :config, version_no = :version, published_at = CURRENT_TIMESTAMP, updated_by = :actor WHERE id = 1');
        $publish->execute([':config' => $json, ':version' => $nextVersion, ':actor' => 'admin']);
        $history = $pdo->prepare('INSERT INTO seo_cms_versions (version_no, config_json, published_by, published_at) VALUES (:version, :config, :actor, CURRENT_TIMESTAMP)');
        $history->execute([':version' => $nextVersion, ':config' => $json, ':actor' => 'admin']);
        $pdo->exec("UPDATE seo_redirects SET status = 'active' WHERE status = 'draft'");
        $pdo->commit();
        seoJson(200, array_merge(['success' => true, 'message' => 'SEO configuration version ' . $nextVersion . ' published successfully.'], readSeoState($pdo)));
    }
    seoJson(405, ['success' => false, 'message' => 'Only GET, PUT and POST requests are allowed.']);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('SEO and Storefront Health request failed: ' . $exception->getMessage());
    seoJson(500, ['success' => false, 'message' => 'SEO and Storefront Health request could not be completed right now.']);
}
