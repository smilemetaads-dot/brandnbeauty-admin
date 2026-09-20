<?php

declare(strict_types=1);

function launchText(mixed $value, int $limit = 1800): string
{
    $value = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($value, 0, $limit) : substr($value, 0, $limit);
}

function launchTableExists(PDO $pdo, string $table): bool
{
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    $query->execute([':table' => $table]);
    return (int) $query->fetchColumn() > 0;
}

function launchColumnExists(PDO $pdo, string $table, string $column): bool
{
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=:table AND column_name=:column');
    $query->execute([':table' => $table, ':column' => $column]);
    return (int) $query->fetchColumn() > 0;
}

function launchCount(PDO $pdo, string $table, string $where = '1=1'): int
{
    if (!launchTableExists($pdo, $table)) return 0;
    $safe = str_replace('`', '``', $table);
    return (int) $pdo->query('SELECT COUNT(*) FROM `' . $safe . '` WHERE ' . $where)->fetchColumn();
}

function ensureLaunchVerificationSchema(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS launch_verification_runs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        run_key CHAR(32) NOT NULL,
        reason VARCHAR(1200) NOT NULL,
        score TINYINT UNSIGNED NOT NULL,
        passed_checks SMALLINT UNSIGNED NOT NULL,
        review_checks SMALLINT UNSIGNED NOT NULL,
        blocked_checks SMALLINT UNSIGNED NOT NULL,
        total_checks SMALLINT UNSIGNED NOT NULL,
        release_status ENUM('blocked','review_required','eligible_for_approval') NOT NULL,
        evidence_hash CHAR(64) NOT NULL,
        snapshot_json LONGTEXT NOT NULL,
        created_by VARCHAR(190) NOT NULL DEFAULT 'authenticated admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_launch_verification_run_key (run_key),
        KEY idx_launch_verification_status (release_status,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS launch_verification_checks (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        run_id BIGINT UNSIGNED NOT NULL,
        gate_key VARCHAR(120) NOT NULL,
        label VARCHAR(240) NOT NULL,
        domain_name VARCHAR(100) NOT NULL,
        owner_name VARCHAR(190) NOT NULL,
        severity ENUM('critical','high','medium','low') NOT NULL,
        outcome ENUM('passed','review','blocked') NOT NULL,
        evidence VARCHAR(2000) NOT NULL,
        required_proof VARCHAR(2000) NOT NULL,
        linked_workspace VARCHAR(160) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_launch_verification_check (run_id,gate_key),
        KEY idx_launch_verification_queue (run_id,outcome,severity)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS launch_verification_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        run_id BIGINT UNSIGNED NULL,
        event_type VARCHAR(100) NOT NULL,
        actor_name VARCHAR(190) NOT NULL DEFAULT 'authenticated admin',
        note VARCHAR(2000) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_launch_verification_event (run_id,event_type,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function launchGate(string $key, string $label, string $domain, string $owner, string $severity, string $outcome, string $evidence, string $proof, string $workspace): array
{
    return compact('key', 'label', 'domain', 'owner', 'severity', 'outcome', 'evidence', 'proof', 'workspace');
}

function launchOrderEvidence(PDO $pdo): array
{
    if (!launchTableExists($pdo, 'orders')) return ['total' => 0, 'delivered' => 0, 'outcome' => 'blocked', 'evidence' => 'The existing orders table was not found.'];
    $total = launchCount($pdo, 'orders');
    $delivered = 0;
    foreach (['status', 'order_status', 'delivery_status'] as $column) {
        if (!launchColumnExists($pdo, 'orders', $column)) continue;
        $safeColumn = str_replace('`', '``', $column);
        $delivered = (int) $pdo->query("SELECT COUNT(*) FROM `orders` WHERE LOWER(COALESCE(`{$safeColumn}`,'')) IN ('delivered','completed','complete')")->fetchColumn();
        break;
    }
    $outcome = $total === 0 ? 'review' : ($delivered > 0 ? 'passed' : 'review');
    $evidence = $total . ' order record(s) and ' . $delivered . ' delivered/completed outcome(s) were observed without changing any order.';
    return compact('total', 'delivered', 'outcome', 'evidence');
}

function collectLaunchVerificationEvidence(PDO $pdo): array
{
    $trackingConfigured = false;
    $trackingEvents = 0;
    if (launchTableExists($pdo, 'tracking_attribution_settings')) {
        $settings = $pdo->query('SELECT gtm_container_id,ga4_measurement_id,meta_pixel_id,capi_enabled FROM tracking_attribution_settings WHERE id=1')->fetch(PDO::FETCH_ASSOC) ?: [];
        $trackingConfigured = trim((string)($settings['gtm_container_id'] ?? '')) !== '' || trim((string)($settings['ga4_measurement_id'] ?? '')) !== '' || trim((string)($settings['meta_pixel_id'] ?? '')) !== '';
    }
    if (launchTableExists($pdo, 'tracking_event_ledger')) $trackingEvents = launchCount($pdo, 'tracking_event_ledger', 'schema_valid=1');

    $seoPublished = false;
    if (launchTableExists($pdo, 'seo_cms_state')) {
        $seo = $pdo->query('SELECT live_json,published_at FROM seo_cms_state WHERE id=1')->fetch(PDO::FETCH_ASSOC) ?: [];
        $config = json_decode((string)($seo['live_json'] ?? '{}'), true);
        $seoPublished = is_array($config)
            && !empty($config['indexing_enabled'])
            && !empty($config['sitemap_enabled'])
            && str_starts_with((string)($config['site_url'] ?? ''), 'https://')
            && trim((string)($seo['published_at'] ?? '')) !== '';
    }
    $seoAudit = launchTableExists($pdo, 'seo_health_audits') ? ($pdo->query('SELECT score,critical_count,warning_count,created_at FROM seo_health_audits ORDER BY id DESC LIMIT 1')->fetch(PDO::FETCH_ASSOC) ?: null) : null;

    $orders = launchOrderEvidence($pdo);
    $operationsTables = ['inventory_movements', 'purchase_stock_orders', 'finance_reconciliation_events'];
    $operationSources = count(array_filter($operationsTables, static fn(string $table): bool => launchTableExists($pdo, $table)));
    $verifiedBackups = launchCount($pdo, 'backup_restore_artifacts', "status='verified'");
    $restoreDrills = launchCount($pdo, 'backup_restore_drills', "result='passed'");
    $securityAudits = launchCount($pdo, 'security_audit_runs');
    $urgentFindings = launchTableExists($pdo, 'security_findings') ? launchCount($pdo, 'security_findings', "status<>'resolved' AND severity IN ('critical','high')") : 0;
    $readiness = launchTableExists($pdo, 'deployment_readiness_runs') ? ($pdo->query('SELECT score,passed_checks,review_checks,failed_checks,status,created_at FROM deployment_readiness_runs ORDER BY id DESC LIMIT 1')->fetch(PDO::FETCH_ASSOC) ?: null) : null;

    $trackingOutcome = $trackingConfigured ? ($trackingEvents > 0 ? 'passed' : 'review') : 'review';
    $seoOutcome = !$seoPublished ? 'blocked' : ($seoAudit === null ? 'review' : ((int)$seoAudit['critical_count'] > 0 ? 'blocked' : 'passed'));
    $recoveryOutcome = ($verifiedBackups > 0 && $restoreDrills > 0) ? 'passed' : 'blocked';
    $securityOutcome = $urgentFindings > 0 ? 'blocked' : ($securityAudits > 0 ? 'passed' : 'review');
    $readinessOutcome = $readiness === null ? 'review' : ((int)$readiness['failed_checks'] > 0 ? 'blocked' : ((int)$readiness['review_checks'] > 0 ? 'review' : 'passed'));

    $gates = [
        launchGate('database_api', 'Database & protected API', 'Platform', 'Engineering', 'critical', 'passed', 'The protected verification API established a live PDO connection and authenticated request.', 'Keep admin authentication and database connectivity healthy.', 'Production Readiness'),
        launchGate('tracking_measurement', 'GA4 / GTM / Meta measurement', 'Tracking', 'Growth / Engineering', 'critical', $trackingOutcome, $trackingConfigured ? $trackingEvents . ' valid tracking event(s) exist; connector identifiers are configured.' : 'No GA4, GTM or Meta identifier has been configured in the live tracking settings.', 'Verify identifiers, event value/currency and browser/server event_id deduplication in provider tools.', 'Tracking & Attribution'),
        launchGate('technical_seo', 'Technical SEO & indexing', 'Storefront', 'Storefront', 'critical', $seoOutcome, $seoPublished ? ($seoAudit === null ? 'Published HTTPS SEO configuration exists; no configuration audit has been recorded.' : 'Latest SEO audit score ' . (int)$seoAudit['score'] . ' with ' . (int)$seoAudit['critical_count'] . ' critical issue(s).') : 'A published HTTPS indexing and sitemap configuration was not observed.', 'Validate canonicals, sitemap, robots, redirects and visible structured data on the production host.', 'SEO & Storefront Health'),
        launchGate('commerce_outcome', 'Order-to-delivered outcome', 'Commerce', 'Operations', 'critical', $orders['outcome'], $orders['evidence'], 'Complete one real product → checkout → order → pack → courier → delivered lifecycle with traceable evidence.', 'Orders'),
        launchGate('operational_ledgers', 'Stock, purchasing & COD controls', 'Operations', 'Operations / Finance', 'high', $operationSources === count($operationsTables) ? 'passed' : 'blocked', $operationSources . '/' . count($operationsTables) . ' required controlled ledger source(s) are installed.', 'Confirm stock movement, controlled receipt and COD reconciliation evidence without manual database edits.', 'Reports & Insights'),
        launchGate('verified_recovery', 'Verified backup & restore drill', 'Recovery', 'Engineering', 'critical', $recoveryOutcome, $verifiedBackups . ' verified backup(s) and ' . $restoreDrills . ' passed integrity/restore drill(s) were observed.', 'Create a protected backup and complete a verification drill before release approval.', 'Backup & Restore'),
        launchGate('security_control', 'Security evidence', 'Security', 'Security / Engineering', 'critical', $securityOutcome, $securityAudits . ' security audit run(s) and ' . $urgentFindings . ' unresolved critical/high finding(s) were observed.', 'Run the security evidence audit and resolve or formally disposition critical/high findings.', 'Security Audit'),
        launchGate('production_runtime', 'Production runtime readiness', 'Release', 'Engineering', 'critical', $readinessOutcome, $readiness === null ? 'No Production Readiness scan has been recorded.' : 'Latest Production Readiness score ' . (int)$readiness['score'] . '/100 with ' . (int)$readiness['failed_checks'] . ' failed and ' . (int)$readiness['review_checks'] . ' review check(s).', 'Verify production host, HTTPS, environment configuration, runtime errors and recovery evidence.', 'Production Readiness'),
        launchGate('mobile_performance', 'Mobile storefront proof', 'Storefront', 'Storefront', 'high', 'review', 'No automatic claim is made from server-side evidence about real-device LCP, INP, CLS or checkout usability.', 'Test key journeys at 360/375/390/412 px, slow 4G and a Facebook in-app browser; attach human evidence.', 'Storefront Execution'),
        launchGate('human_release', 'Human go-live approval', 'Governance', 'Owner', 'critical', 'review', 'This module never approves, deploys, switches DNS or publishes production automatically.', 'An authorized owner reviews every gate and records the separate go-live decision.', 'Launch Verification'),
    ];

    return ['gates' => $gates, 'snapshot' => [
        'tracking_configured' => $trackingConfigured, 'tracking_events' => $trackingEvents,
        'seo_published' => $seoPublished, 'seo_audit' => $seoAudit,
        'orders' => $orders, 'operation_sources' => $operationSources,
        'verified_backups' => $verifiedBackups, 'restore_drills' => $restoreDrills,
        'security_audits' => $securityAudits, 'urgent_findings' => $urgentFindings,
        'production_readiness' => $readiness, 'captured_at' => date(DATE_ATOM),
    ]];
}

function runLaunchVerification(PDO $pdo, string $reason): int
{
    if (strlen($reason) < 12) throw new InvalidArgumentException('Add a clear verification reason (at least 12 characters).');
    $evidence = collectLaunchVerificationEvidence($pdo);
    $gates = $evidence['gates'];
    $passed = count(array_filter($gates, static fn(array $gate): bool => $gate['outcome'] === 'passed'));
    $review = count(array_filter($gates, static fn(array $gate): bool => $gate['outcome'] === 'review'));
    $blocked = count($gates) - $passed - $review;
    $score = (int) round((($passed * 100) + ($review * 55)) / count($gates));
    $releaseStatus = $blocked > 0 ? 'blocked' : ($review > 0 ? 'review_required' : 'eligible_for_approval');
    $snapshot = json_encode($evidence['snapshot'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '{}';
    $hash = hash('sha256', $snapshot . '|' . json_encode($gates, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

    $pdo->beginTransaction();
    try {
        $save = $pdo->prepare('INSERT INTO launch_verification_runs (run_key,reason,score,passed_checks,review_checks,blocked_checks,total_checks,release_status,evidence_hash,snapshot_json) VALUES (:key,:reason,:score,:passed,:review,:blocked,:total,:status,:hash,:snapshot)');
        $save->execute([':key' => bin2hex(random_bytes(16)), ':reason' => launchText($reason, 1200), ':score' => $score, ':passed' => $passed, ':review' => $review, ':blocked' => $blocked, ':total' => count($gates), ':status' => $releaseStatus, ':hash' => $hash, ':snapshot' => $snapshot]);
        $runId = (int) $pdo->lastInsertId();
        $saveGate = $pdo->prepare('INSERT INTO launch_verification_checks (run_id,gate_key,label,domain_name,owner_name,severity,outcome,evidence,required_proof,linked_workspace) VALUES (:run_id,:key,:label,:domain,:owner,:severity,:outcome,:evidence,:proof,:workspace)');
        foreach ($gates as $gate) {
            $saveGate->execute([':run_id' => $runId, ':key' => $gate['key'], ':label' => $gate['label'], ':domain' => $gate['domain'], ':owner' => $gate['owner'], ':severity' => $gate['severity'], ':outcome' => $gate['outcome'], ':evidence' => launchText($gate['evidence'], 2000), ':proof' => launchText($gate['proof'], 2000), ':workspace' => $gate['workspace']]);
        }
        $event = $pdo->prepare("INSERT INTO launch_verification_events (run_id,event_type,note) VALUES (:run_id,'protected_verification',:note)");
        $event->execute([':run_id' => $runId, ':note' => 'Evidence ' . substr($hash, 0, 12) . ' · ' . $releaseStatus . ' · No deployment, DNS, tracking transmission or business mutation executed.']);
        $pdo->commit();
        return $runId;
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
}

function readLaunchVerificationState(PDO $pdo): array
{
    ensureLaunchVerificationSchema($pdo);
    $runs = $pdo->query('SELECT id,run_key,reason,score,passed_checks,review_checks,blocked_checks,total_checks,release_status,evidence_hash,created_by,created_at FROM launch_verification_runs ORDER BY id DESC LIMIT 60')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $latest = $runs[0] ?? null;
    $gates = [];
    if (is_array($latest)) {
        $query = $pdo->prepare("SELECT id,gate_key,label,domain_name,owner_name,severity,outcome,evidence,required_proof,linked_workspace,created_at FROM launch_verification_checks WHERE run_id=:run_id ORDER BY FIELD(outcome,'blocked','review','passed'),FIELD(severity,'critical','high','medium','low'),id");
        $query->execute([':run_id' => $latest['id']]);
        $gates = $query->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }
    return [
        'summary' => ['total_runs' => count($runs), 'latest_score' => (int)($latest['score'] ?? 0), 'passed_checks' => (int)($latest['passed_checks'] ?? 0), 'review_checks' => (int)($latest['review_checks'] ?? 0), 'blocked_checks' => (int)($latest['blocked_checks'] ?? 0), 'total_checks' => (int)($latest['total_checks'] ?? 0), 'release_status' => (string)($latest['release_status'] ?? 'not_scanned')],
        'runs' => $runs, 'gates' => $gates,
        'safety' => ['automatic_deployment' => false, 'automatic_dns_change' => false, 'automatic_tracking_transmission' => false, 'business_data_mutation' => false, 'human_release_required' => true],
        'generated_at' => date(DATE_ATOM),
    ];
}
