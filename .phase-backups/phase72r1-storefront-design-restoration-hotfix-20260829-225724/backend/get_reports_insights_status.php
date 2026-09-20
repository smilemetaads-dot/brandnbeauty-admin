<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/reports_insights_common.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

try {
    $pdo = getDatabaseConnection();
    $state = reportsInsightsState($pdo, '30D');
    echo json_encode([
        'success' => true,
        'module' => 'reports-insights',
        'database_connected' => true,
        'available_domains' => (int) ($state['quality']['available_domains'] ?? 0),
        'unavailable_domains' => $state['quality']['unavailable_domains'] ?? [],
        'domain_count' => count($state['domains'] ?? []),
        'signal_count' => count($state['signals'] ?? []),
        'mode' => 'read_only_consolidated_evidence',
        'checked_at' => date(DATE_ATOM),
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('get_reports_insights_status.php: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'module' => 'reports-insights', 'message' => 'Reports & Insights readiness could not be verified.']);
}
