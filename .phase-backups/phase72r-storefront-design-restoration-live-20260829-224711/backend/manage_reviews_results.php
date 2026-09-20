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

function reviewsResultsJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function defaultReviewsResultsConfig(): array
{
    return [
        'heading' => 'Real reviews. Thoughtful routines.',
        'supporting_line' => 'Customer experiences shared with permission—individual results can vary.',
        'visible' => true,
        'display_limit' => 6,
        'minimum_rating' => 1,
        'show_ratings' => true,
        'show_verified_badge' => true,
        'show_media' => true,
    ];
}

function ensureReviewsResultsTables(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS reviews_cms_state (
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
        "CREATE TABLE IF NOT EXISTS reviews_cms_versions (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            version_no INT UNSIGNED NOT NULL,
            config_json LONGTEXT NOT NULL,
            published_by VARCHAR(190) NULL,
            published_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_reviews_cms_version (version_no)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS reviews_cms_entries (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            entry_type VARCHAR(30) NOT NULL DEFAULT 'review',
            customer_display_name VARCHAR(120) NOT NULL,
            product_name VARCHAR(190) NOT NULL,
            rating TINYINT UNSIGNED NOT NULL DEFAULT 5,
            review_text TEXT NOT NULL,
            duration VARCHAR(120) NULL,
            media_url VARCHAR(1000) NULL,
            source VARCHAR(30) NOT NULL DEFAULT 'manual',
            order_reference VARCHAR(120) NULL,
            verified_purchase TINYINT(1) NOT NULL DEFAULT 0,
            consent_obtained TINYINT(1) NOT NULL DEFAULT 0,
            status VARCHAR(30) NOT NULL DEFAULT 'pending',
            featured TINYINT(1) NOT NULL DEFAULT 0,
            admin_note VARCHAR(500) NULL,
            created_by VARCHAR(190) NULL,
            moderated_by VARCHAR(190) NULL,
            moderated_at TIMESTAMP NULL DEFAULT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_reviews_cms_status (status, featured, rating),
            KEY idx_reviews_cms_type (entry_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $count = $pdo->query('SELECT COUNT(*) FROM reviews_cms_state WHERE id = 1')->fetchColumn();
    if ((int) $count === 0) {
        $defaultJson = json_encode(defaultReviewsResultsConfig(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $insert = $pdo->prepare(
            'INSERT INTO reviews_cms_state (id, draft_json, live_json, version_no, updated_by, published_at)
             VALUES (1, :draft_json, :live_json, 1, :updated_by, CURRENT_TIMESTAMP)'
        );
        $insert->execute([':draft_json' => $defaultJson, ':live_json' => $defaultJson, ':updated_by' => 'system-seed']);
    }

    $state = $pdo->query('SELECT live_json, version_no, published_at FROM reviews_cms_state WHERE id = 1 LIMIT 1')->fetch() ?: [];
    $seedVersion = $pdo->prepare(
        'INSERT IGNORE INTO reviews_cms_versions (version_no, config_json, published_by, published_at)
         VALUES (:version_no, :config_json, :published_by, :published_at)'
    );
    $seedVersion->execute([
        ':version_no' => (int) ($state['version_no'] ?? 1),
        ':config_json' => (string) ($state['live_json'] ?? '{}'),
        ':published_by' => 'system-seed',
        ':published_at' => $state['published_at'] ?? date('Y-m-d H:i:s'),
    ]);
}

function reviewsResultsText(mixed $value, int $limit = 500): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function reviewsResultsBool(mixed $value): bool
{
    if (is_bool($value)) return $value;
    return in_array(strtolower(trim((string) $value)), ['1', 'true', 'yes', 'active'], true);
}

function reviewsResultsMediaUrl(mixed $value): string
{
    $url = reviewsResultsText($value, 1000);
    if ($url === '') return '';
    if (str_starts_with($url, '/')) return $url;
    return filter_var($url, FILTER_VALIDATE_URL) && preg_match('/^https:\/\//i', $url) === 1 ? $url : '';
}

function normalizeReviewsResultsConfig(mixed $input): array
{
    if (!is_array($input)) reviewsResultsJson(400, ['success' => false, 'message' => 'A valid Reviews configuration is required.']);
    return [
        'heading' => reviewsResultsText($input['heading'] ?? '', 160),
        'supporting_line' => reviewsResultsText($input['supporting_line'] ?? '', 320),
        'visible' => reviewsResultsBool($input['visible'] ?? true),
        'display_limit' => max(1, min(24, (int) ($input['display_limit'] ?? 6))),
        'minimum_rating' => max(1, min(5, (int) ($input['minimum_rating'] ?? 1))),
        'show_ratings' => reviewsResultsBool($input['show_ratings'] ?? true),
        'show_verified_badge' => reviewsResultsBool($input['show_verified_badge'] ?? true),
        'show_media' => reviewsResultsBool($input['show_media'] ?? true),
    ];
}

function validateReviewsResultsPublication(array $config): void
{
    if ($config['visible'] && ($config['heading'] === '' || $config['supporting_line'] === '')) {
        reviewsResultsJson(422, ['success' => false, 'message' => 'Visible Reviews section needs a heading and supporting line.']);
    }
}

function normalizeReviewEntry(mixed $input): array
{
    if (!is_array($input)) reviewsResultsJson(400, ['success' => false, 'message' => 'A valid review entry is required.']);
    $type = strtolower(reviewsResultsText($input['entry_type'] ?? 'review', 30));
    if (!in_array($type, ['review', 'real_result'], true)) $type = 'review';
    $source = strtolower(reviewsResultsText($input['source'] ?? 'manual', 30));
    if (!in_array($source, ['manual', 'website', 'facebook', 'messenger'], true)) $source = 'manual';
    $name = reviewsResultsText($input['customer_display_name'] ?? '', 120);
    $product = reviewsResultsText($input['product_name'] ?? '', 190);
    $review = reviewsResultsText($input['review_text'] ?? '', 2000);
    if ($name === '' || $product === '' || $review === '') reviewsResultsJson(422, ['success' => false, 'message' => 'Display name, product and customer review are required.']);
    $duration = reviewsResultsText($input['duration'] ?? '', 120);
    if ($type === 'real_result' && $duration === '') reviewsResultsJson(422, ['success' => false, 'message' => 'A Real Result story needs the usage duration.']);
    return [
        'id' => max(0, (int) ($input['id'] ?? 0)),
        'entry_type' => $type,
        'customer_display_name' => $name,
        'product_name' => $product,
        'rating' => max(1, min(5, (int) ($input['rating'] ?? 5))),
        'review_text' => $review,
        'duration' => $duration,
        'media_url' => reviewsResultsMediaUrl($input['media_url'] ?? ''),
        'source' => $source,
        'order_reference' => reviewsResultsText($input['order_reference'] ?? '', 120),
        'verified_purchase' => reviewsResultsBool($input['verified_purchase'] ?? false),
        'consent_obtained' => reviewsResultsBool($input['consent_obtained'] ?? false),
        'admin_note' => reviewsResultsText($input['admin_note'] ?? '', 500),
    ];
}

function readReviewsResultsState(PDO $pdo): array
{
    $row = $pdo->query('SELECT draft_json, live_json, version_no, updated_at, published_at FROM reviews_cms_state WHERE id = 1 LIMIT 1')->fetch() ?: [];
    $fallback = defaultReviewsResultsConfig();
    $draft = json_decode((string) ($row['draft_json'] ?? ''), true);
    $live = json_decode((string) ($row['live_json'] ?? ''), true);
    $entries = $pdo->query(
        'SELECT id, entry_type, customer_display_name, product_name, rating, review_text, duration, media_url,
                source, order_reference, verified_purchase, consent_obtained, status, featured, admin_note,
                created_at, updated_at
         FROM reviews_cms_entries ORDER BY created_at DESC, id DESC LIMIT 250'
    )->fetchAll() ?: [];
    $versions = $pdo->query('SELECT version_no, published_by, published_at FROM reviews_cms_versions ORDER BY version_no DESC LIMIT 12')->fetchAll() ?: [];
    return [
        'draft' => is_array($draft) ? $draft : $fallback,
        'live' => is_array($live) ? $live : $fallback,
        'version' => (int) ($row['version_no'] ?? 1),
        'updated_at' => $row['updated_at'] ?? null,
        'published_at' => $row['published_at'] ?? null,
        'entries' => array_map(static fn (array $entry): array => [
            ...$entry,
            'id' => (int) $entry['id'],
            'rating' => (int) $entry['rating'],
            'verified_purchase' => (bool) $entry['verified_purchase'],
            'consent_obtained' => (bool) $entry['consent_obtained'],
            'featured' => (bool) $entry['featured'],
        ], $entries),
        'versions' => array_map(static fn (array $version): array => [
            'version' => (int) ($version['version_no'] ?? 0),
            'published_by' => $version['published_by'] ?? 'admin',
            'published_at' => $version['published_at'] ?? null,
        ], $versions),
    ];
}

function reviewsResultsPayload(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($payload) ? $payload : [];
}

try {
    $pdo = getDatabaseConnection();
    ensureReviewsResultsTables($pdo);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') reviewsResultsJson(200, array_merge(['success' => true], readReviewsResultsState($pdo)));

    if ($method === 'PUT') {
        $payload = reviewsResultsPayload();
        $config = normalizeReviewsResultsConfig($payload['config'] ?? $payload);
        $save = $pdo->prepare('UPDATE reviews_cms_state SET draft_json = :draft_json, updated_by = :updated_by WHERE id = 1');
        $save->execute([':draft_json' => json_encode($config, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), ':updated_by' => 'admin']);
        reviewsResultsJson(200, array_merge(['success' => true, 'message' => 'Reviews section draft saved successfully.'], readReviewsResultsState($pdo)));
    }

    if ($method === 'POST') {
        $payload = reviewsResultsPayload();
        $action = strtolower(reviewsResultsText($payload['action'] ?? 'publish', 40));

        if ($action === 'save_entry') {
            $entry = normalizeReviewEntry($payload['entry'] ?? []);
            if ($entry['id'] > 0) {
                $exists = $pdo->prepare('SELECT COUNT(*) FROM reviews_cms_entries WHERE id = :id');
                $exists->execute([':id' => $entry['id']]);
                if ((int) $exists->fetchColumn() === 0) reviewsResultsJson(404, ['success' => false, 'message' => 'The selected review was not found.']);
                $save = $pdo->prepare(
                    'UPDATE reviews_cms_entries SET entry_type = :entry_type, customer_display_name = :customer_display_name,
                     product_name = :product_name, rating = :rating, review_text = :review_text, duration = :duration,
                     media_url = :media_url, source = :source, order_reference = :order_reference,
                     verified_purchase = :verified_purchase, consent_obtained = :consent_obtained,
                     status = :status, featured = 0, admin_note = :admin_note, moderated_by = NULL, moderated_at = NULL
                     WHERE id = :id'
                );
                $save->execute([
                    ':entry_type' => $entry['entry_type'], ':customer_display_name' => $entry['customer_display_name'],
                    ':product_name' => $entry['product_name'], ':rating' => $entry['rating'], ':review_text' => $entry['review_text'],
                    ':duration' => $entry['duration'], ':media_url' => $entry['media_url'], ':source' => $entry['source'],
                    ':order_reference' => $entry['order_reference'], ':verified_purchase' => (int) $entry['verified_purchase'],
                    ':consent_obtained' => (int) $entry['consent_obtained'], ':status' => 'pending',
                    ':admin_note' => $entry['admin_note'], ':id' => $entry['id'],
                ]);
            } else {
                $save = $pdo->prepare(
                    'INSERT INTO reviews_cms_entries
                     (entry_type, customer_display_name, product_name, rating, review_text, duration, media_url,
                      source, order_reference, verified_purchase, consent_obtained, status, featured, admin_note, created_by)
                     VALUES (:entry_type, :customer_display_name, :product_name, :rating, :review_text, :duration,
                      :media_url, :source, :order_reference, :verified_purchase, :consent_obtained, :status, 0, :admin_note, :created_by)'
                );
                $save->execute([
                    ':entry_type' => $entry['entry_type'], ':customer_display_name' => $entry['customer_display_name'],
                    ':product_name' => $entry['product_name'], ':rating' => $entry['rating'], ':review_text' => $entry['review_text'],
                    ':duration' => $entry['duration'], ':media_url' => $entry['media_url'], ':source' => $entry['source'],
                    ':order_reference' => $entry['order_reference'], ':verified_purchase' => (int) $entry['verified_purchase'],
                    ':consent_obtained' => (int) $entry['consent_obtained'], ':status' => 'pending',
                    ':admin_note' => $entry['admin_note'], ':created_by' => 'admin',
                ]);
            }
            reviewsResultsJson(200, array_merge(['success' => true, 'message' => 'Review saved for moderation.'], readReviewsResultsState($pdo)));
        }

        if ($action === 'moderate_entry') {
            $id = max(1, (int) ($payload['id'] ?? 0));
            $status = strtolower(reviewsResultsText($payload['status'] ?? 'pending', 30));
            if (!in_array($status, ['pending', 'approved', 'rejected', 'archived'], true)) $status = 'pending';
            $featured = reviewsResultsBool($payload['featured'] ?? false);
            $entryStatement = $pdo->prepare('SELECT consent_obtained, rating, product_name, review_text, entry_type, duration FROM reviews_cms_entries WHERE id = :id LIMIT 1');
            $entryStatement->execute([':id' => $id]);
            $entry = $entryStatement->fetch();
            if (!$entry) reviewsResultsJson(404, ['success' => false, 'message' => 'The selected review was not found.']);
            if ($status === 'approved') {
                if (!(bool) $entry['consent_obtained']) reviewsResultsJson(422, ['success' => false, 'message' => 'Customer consent is required before a review can be approved.']);
                if ((string) $entry['product_name'] === '' || (string) $entry['review_text'] === '') reviewsResultsJson(422, ['success' => false, 'message' => 'Review content is incomplete.']);
                if ((string) $entry['entry_type'] === 'real_result' && (string) $entry['duration'] === '') reviewsResultsJson(422, ['success' => false, 'message' => 'Real Result duration is required.']);
            }
            if ($featured && ($status !== 'approved' || (int) $entry['rating'] < 4)) reviewsResultsJson(422, ['success' => false, 'message' => 'Only approved reviews rated 4 or 5 can be featured.']);
            $moderate = $pdo->prepare(
                'UPDATE reviews_cms_entries SET status = :status, featured = :featured, admin_note = :admin_note,
                 moderated_by = :moderated_by, moderated_at = CURRENT_TIMESTAMP WHERE id = :id'
            );
            $moderate->execute([
                ':status' => $status,
                ':featured' => $featured ? 1 : 0,
                ':admin_note' => reviewsResultsText($payload['admin_note'] ?? '', 500),
                ':moderated_by' => 'admin',
                ':id' => $id,
            ]);
            reviewsResultsJson(200, array_merge(['success' => true, 'message' => 'Moderation decision saved.'], readReviewsResultsState($pdo)));
        }

        if ($action === 'archive_entry') {
            $archive = $pdo->prepare('UPDATE reviews_cms_entries SET status = :status, featured = 0, moderated_by = :moderated_by, moderated_at = CURRENT_TIMESTAMP WHERE id = :id');
            $archive->execute([':status' => 'archived', ':moderated_by' => 'admin', ':id' => max(1, (int) ($payload['id'] ?? 0))]);
            reviewsResultsJson(200, array_merge(['success' => true, 'message' => 'Review archived. The source record was retained.'], readReviewsResultsState($pdo)));
        }

        if ($action === 'restore_draft') {
            $versionNumber = max(1, (int) ($payload['version'] ?? 0));
            $versionStatement = $pdo->prepare('SELECT config_json FROM reviews_cms_versions WHERE version_no = :version_no LIMIT 1');
            $versionStatement->execute([':version_no' => $versionNumber]);
            $versionRow = $versionStatement->fetch();
            if (!$versionRow) reviewsResultsJson(404, ['success' => false, 'message' => 'The selected Reviews version was not found.']);
            $versionConfig = json_decode((string) $versionRow['config_json'], true);
            $config = normalizeReviewsResultsConfig($versionConfig);
            $restore = $pdo->prepare('UPDATE reviews_cms_state SET draft_json = :draft_json, updated_by = :updated_by WHERE id = 1');
            $restore->execute([':draft_json' => json_encode($config, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), ':updated_by' => 'admin-restore']);
            reviewsResultsJson(200, array_merge(['success' => true, 'message' => 'Version ' . $versionNumber . ' loaded as a draft. The live review section was not changed.'], readReviewsResultsState($pdo)));
        }

        $config = normalizeReviewsResultsConfig($payload['config'] ?? []);
        validateReviewsResultsPublication($config);
        $configJson = json_encode($config, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $pdo->beginTransaction();
        $locked = $pdo->query('SELECT version_no FROM reviews_cms_state WHERE id = 1 FOR UPDATE')->fetch() ?: [];
        $nextVersion = (int) ($locked['version_no'] ?? 1) + 1;
        $publish = $pdo->prepare(
            'UPDATE reviews_cms_state SET draft_json = :draft_json, live_json = :live_json, version_no = :version_no,
             published_at = CURRENT_TIMESTAMP, updated_by = :updated_by WHERE id = 1'
        );
        $publish->execute([':draft_json' => $configJson, ':live_json' => $configJson, ':version_no' => $nextVersion, ':updated_by' => 'admin']);
        $history = $pdo->prepare(
            'INSERT INTO reviews_cms_versions (version_no, config_json, published_by, published_at)
             VALUES (:version_no, :config_json, :published_by, CURRENT_TIMESTAMP)'
        );
        $history->execute([':version_no' => $nextVersion, ':config_json' => $configJson, ':published_by' => 'admin']);
        $pdo->commit();
        reviewsResultsJson(200, array_merge(['success' => true, 'message' => 'Reviews section version ' . $nextVersion . ' published successfully.'], readReviewsResultsState($pdo)));
    }

    reviewsResultsJson(405, ['success' => false, 'message' => 'Only GET, PUT, and POST requests are allowed.']);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('Reviews and Real Results request failed: ' . $exception->getMessage());
    reviewsResultsJson(500, ['success' => false, 'message' => 'Reviews and Real Results request could not be completed right now.']);
}
