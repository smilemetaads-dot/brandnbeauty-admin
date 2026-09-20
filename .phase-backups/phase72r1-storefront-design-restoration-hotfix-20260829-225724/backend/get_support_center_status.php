<?php

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

try {
    $pdo = getDatabaseConnection();
    $required = ['support_sla_policies','support_tickets','support_messages','support_handoffs','support_events'];
    $query = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=:table');
    $missing = [];
    foreach ($required as $table) {
        $query->execute([':table'=>$table]);
        if ((int)$query->fetchColumn() < 1) $missing[] = $table;
    }
    echo json_encode([
        'success'=>true,
        'service'=>'support-center',
        'database_connected'=>true,
        'schema_installed'=>$missing===[],
        'missing_tables'=>$missing,
        'automatic_refund'=>false,
        'automatic_restock'=>false,
        'automatic_customer_block'=>false,
        'automatic_delivery_status_change'=>false,
        'checked_at'=>date(DATE_ATOM),
    ],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('get_support_center_status.php: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success'=>false,'service'=>'support-center','message'=>'Support Center database health check failed.'],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
}
