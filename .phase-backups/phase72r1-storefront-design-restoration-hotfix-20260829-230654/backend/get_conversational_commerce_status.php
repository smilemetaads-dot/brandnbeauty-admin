<?php
declare(strict_types=1);
require_once __DIR__.'/config/db.php';
require_once __DIR__.'/conversational_commerce_common.php';
header('Content-Type: application/json; charset=utf-8'); header('X-Content-Type-Options: nosniff');
try {
    $pdo=getDatabaseConnection(); ensureConversationalCommerceSchema($pdo);
    echo json_encode(['success'=>true,'module'=>'conversational-commerce-hub','database'=>'connected','contact_identity'=>'hashed','reply_delivery'=>'draft_only','customer_merge'=>'human_review_only','order_creation'=>'disabled','stock_mutation'=>'disabled','automatic_message'=>'disabled','seeded_conversations'=>0,'schema_ready'=>true],JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    error_log('Conversational commerce status error: '.$e->getMessage()); http_response_code(500); echo json_encode(['success'=>false,'module'=>'conversational-commerce-hub','database'=>'unavailable']);
}
