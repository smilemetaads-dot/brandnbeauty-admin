<?php
declare(strict_types=1);
require_once __DIR__.'/config/db.php';
require_once __DIR__.'/admin_auth.php';
require_once __DIR__.'/product_catalog_schema.php';
require_once __DIR__.'/conversational_commerce_common.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) === 1) { header('Access-Control-Allow-Origin: '.$origin); header('Vary: Origin'); }
header('Content-Type: application/json; charset=utf-8'); header('Access-Control-Allow-Methods: GET, POST, OPTIONS'); header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token'); header('Cache-Control: no-store'); header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }
requireAdminAuth();
function commerceJson(int $status, array $payload): never { http_response_code($status); echo json_encode($payload, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE); exit; }
function commerceEvent(PDO $pdo, int $id, string $action, ?array $before, array $after, string $reason, string $actor): void {
    $q=$pdo->prepare('INSERT INTO commerce_events(conversation_id,action_name,before_json,after_json,reason,actor)VALUES(:id,:action,:before,:after,:reason,:actor)');
    $q->execute([':id'=>$id,':action'=>$action,':before'=>$before===null?null:json_encode($before,JSON_UNESCAPED_SLASHES),':after'=>json_encode($after,JSON_UNESCAPED_SLASHES),':reason'=>$reason,':actor'=>$actor]);
}

try {
    $pdo = getDatabaseConnection(); ensureProductCatalogSchema($pdo); ensureConversationalCommerceSchema($pdo);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'GET') commerceJson(200, array_merge(['success'=>true], readConversationalCommerceState($pdo)));
    if ($method !== 'POST') commerceJson(405, ['success'=>false,'message'=>'Method not allowed.']);
    $input = json_decode(file_get_contents('php://input') ?: '', true); $input = is_array($input) ? $input : [];
    if (!($input['confirmed'] ?? false)) commerceJson(422, ['success'=>false,'message'=>'Explicit human confirmation is required.']);
    $action = commerceText($input['action'] ?? '', 60); $reason = commerceText($input['reason'] ?? '', 1000); $actor = commerceText($input['actor'] ?? 'Admin', 190);
    if (strlen($reason) < 12) commerceJson(422, ['success'=>false,'message'=>'A clear audit reason is required.']);

    if ($action === 'create_conversation_evidence') {
        $channel=commerceText($input['channel']??'',40); $thread=commerceText($input['thread_reference']??'',255); $contact=commerceText($input['contact_reference']??'',255); $intent=commerceText($input['intent_summary']??'',1000); $owner=commerceText($input['owner']??'',190);
        $purpose=commerceText($input['permitted_purpose']??'unknown',40); $consent=commerceText($input['contact_consent']??'unknown',40); $window=commerceText($input['messaging_window']??'unknown',40);
        if (!in_array($channel,['messenger','whatsapp','instagram','website_chat','other'],true)||$thread===''||$contact===''||strlen($intent)<8||$owner==='') commerceJson(422,['success'=>false,'message'=>'Channel, real thread/contact references, intent summary and owner are required.']);
        if (!in_array($purpose,['sales_service','support','unknown'],true)||!in_array($consent,['active','unknown','withdrawn'],true)||!in_array($window,['open','closed','unknown'],true)) commerceJson(422,['success'=>false,'message'=>'Conversation permission context is invalid.']);
        $threadHash=hash('sha256',strtolower($channel.'|'.$thread)); $contactHash=hash('sha256',strtolower($contact));
        $pdo->beginTransaction();
        $q=$pdo->prepare("INSERT INTO commerce_conversations(conversation_key,channel,thread_reference_hash,thread_mask,contact_reference_hash,contact_mask,intent_summary,permitted_purpose,contact_consent,messaging_window,campaign_reference,ad_reference,owner) VALUES(:key,:channel,:thread_hash,:thread_mask,:contact_hash,:contact_mask,:intent,:purpose,:consent,:window,:campaign,:ad,:owner)");
        $q->execute([':key'=>bin2hex(random_bytes(16)),':channel'=>$channel,':thread_hash'=>$threadHash,':thread_mask'=>'Thread • '.strtoupper(substr($threadHash,0,6)),':contact_hash'=>$contactHash,':contact_mask'=>'Contact • '.strtoupper(substr($contactHash,0,6)),':intent'=>$intent,':purpose'=>$purpose,':consent'=>$consent,':window'=>$window,':campaign'=>commerceText($input['campaign_reference']??'',255),':ad'=>commerceText($input['ad_reference']??'',255),':owner'=>$owner]);
        $id=(int)$pdo->lastInsertId(); commerceEvent($pdo,$id,'create_conversation_evidence',null,['stage'=>'new_inquiry','channel'=>$channel],$reason,$actor); $pdo->commit();
        commerceJson(200,array_merge(['success'=>true,'message'=>'Conversation evidence recorded; nothing was sent and no customer was merged.'],readConversationalCommerceState($pdo)));
    }

    $id=max(0,(int)($input['conversation_id']??0)); $find=$pdo->prepare('SELECT * FROM commerce_conversations WHERE id=:id LIMIT 1'); $find->execute([':id'=>$id]); $conversation=$find->fetch(PDO::FETCH_ASSOC);
    if (!$conversation) commerceJson(404,['success'=>false,'message'=>'Conversation evidence was not found.']);

    if ($action === 'create_reply_draft') {
        if ($conversation['contact_consent']!=='active'||$conversation['messaging_window']!=='open'||$conversation['permitted_purpose']==='unknown') commerceJson(422,['success'=>false,'message'=>'Active consent, an open messaging window and permitted purpose are required.']);
        $text=commerceText($input['exact_text']??'',5000); $language=commerceText($input['language']??'',20);
        if (strlen($text)<20||!in_array($language,['bangla','banglish','english'],true)||!($input['facts_verified']??false)||!($input['human_approved']??false)) commerceJson(422,['success'=>false,'message'=>'Verified facts, exact approved text and language are required.']);
        $q=$pdo->prepare('INSERT INTO commerce_reply_drafts(conversation_id,language,exact_text,facts_verified,human_approved,created_by)VALUES(:id,:language,:text,1,1,:actor)'); $q->execute([':id'=>$id,':language'=>$language,':text'=>$text,':actor'=>$actor]);
        commerceEvent($pdo,$id,'create_reply_draft',null,['reply_draft_id'=>(int)$pdo->lastInsertId(),'sent'=>false],$reason,$actor);
        commerceJson(200,array_merge(['success'=>true,'message'=>'Human-approved reply draft saved; no message was sent.'],readConversationalCommerceState($pdo)));
    }
    if ($action === 'record_identity_review') {
        $decision=commerceText($input['decision']??'',30); $candidate=commerceText($input['candidate_customer_reference']??'',190);
        if (!in_array($decision,['verified','held','unresolved','suggested'],true)||($decision==='verified'&&$candidate==='')) commerceJson(422,['success'=>false,'message'=>'A valid identity decision and candidate reference are required.']);
        $pdo->beginTransaction(); $q=$pdo->prepare('INSERT INTO commerce_identity_reviews(conversation_id,decision,candidate_customer_reference,reason,reviewed_by)VALUES(:id,:decision,:candidate,:reason,:actor)'); $q->execute([':id'=>$id,':decision'=>$decision,':candidate'=>$candidate,':reason'=>$reason,':actor'=>$actor]);
        $pdo->prepare('UPDATE commerce_conversations SET identity_status=:decision,customer_reference=:candidate WHERE id=:id')->execute([':decision'=>$decision,':candidate'=>$candidate,':id'=>$id]);
        commerceEvent($pdo,$id,'record_identity_review',['identity_status'=>$conversation['identity_status']],['identity_status'=>$decision,'customer_record_mutated'=>false],$reason,$actor); $pdo->commit();
        commerceJson(200,array_merge(['success'=>true,'message'=>'Identity review evidence saved; no customer profiles were merged.'],readConversationalCommerceState($pdo)));
    }
    if ($action === 'prepare_order_draft') {
        if ($conversation['identity_status']!=='verified') commerceJson(422,['success'=>false,'message'=>'Human-verified customer identity is required before an order draft.']);
        $product=commerceFindProduct($pdo,max(0,(int)($input['product_id']??0))); $quantity=max(1,min(20,(int)($input['quantity']??1))); $zone=commerceText($input['delivery_zone']??'',40); $charges=['dhaka_city'=>60.0,'dhaka_sub_area'=>80.0,'outside_dhaka'=>120.0];
        if (!$product||!isset($charges[$zone])) commerceJson(422,['success'=>false,'message'=>'A real product and delivery zone are required.']);
        if ((float)$product['price']<=0||(int)$product['stock']<$quantity||$product['status']!=='active') commerceJson(422,['success'=>false,'message'=>'The selected product needs an active published price and enough live stock.']);
        $total=(float)$product['price']*$quantity+$charges[$zone]; $pdo->beginTransaction();
        $q=$pdo->prepare('INSERT INTO commerce_order_drafts(conversation_id,product_id,product_name_snapshot,sku_snapshot,unit_price_snapshot,stock_snapshot,quantity,delivery_zone,delivery_charge,draft_total,created_by)VALUES(:id,:product_id,:name,:sku,:price,:stock,:quantity,:zone,:charge,:total,:actor)');
        $q->execute([':id'=>$id,':product_id'=>(int)$product['id'],':name'=>$product['name'],':sku'=>$product['sku'],':price'=>$product['price'],':stock'=>$product['stock'],':quantity'=>$quantity,':zone'=>$zone,':charge'=>$charges[$zone],':total'=>$total,':actor'=>$actor]);
        $pdo->prepare("UPDATE commerce_conversations SET lead_stage='order_draft' WHERE id=:id")->execute([':id'=>$id]); commerceEvent($pdo,$id,'prepare_order_draft',['lead_stage'=>$conversation['lead_stage']],['lead_stage'=>'order_draft','draft_total'=>$total,'stock_mutated'=>false,'order_created'=>false],$reason,$actor); $pdo->commit();
        commerceJson(200,array_merge(['success'=>true,'message'=>'Reviewable order draft saved from live price and stock; no order or stock movement occurred.'],readConversationalCommerceState($pdo)));
    }
    if ($action === 'update_stage') {
        $stage=commerceText($input['lead_stage']??'',40); $allowed=['new_inquiry','interested','order_draft','order_created','purchased','delivered','closed'];
        if (!in_array($stage,$allowed,true)) commerceJson(422,['success'=>false,'message'=>'Invalid lead stage.']);
        $orderRef=commerceText($input['order_reference']??'',190); $deliveryRef=commerceText($input['delivery_reference']??'',190);
        if (in_array($stage,['order_created','purchased','delivered'],true)&&$orderRef==='') commerceJson(422,['success'=>false,'message'=>'An existing order reference is required for this stage.']);
        if ($stage==='delivered'&&$deliveryRef==='') commerceJson(422,['success'=>false,'message'=>'Courier-confirmed delivery evidence is required.']);
        $pdo->beginTransaction(); $pdo->prepare('UPDATE commerce_conversations SET lead_stage=:stage,order_reference=:order_ref,delivery_reference=:delivery_ref WHERE id=:id')->execute([':stage'=>$stage,':order_ref'=>$orderRef,':delivery_ref'=>$deliveryRef,':id'=>$id]);
        commerceEvent($pdo,$id,'update_stage',['lead_stage'=>$conversation['lead_stage']],['lead_stage'=>$stage,'external_event_sent'=>false],$reason,$actor); $pdo->commit();
        commerceJson(200,array_merge(['success'=>true,'message'=>'Evidence-backed lead stage saved; no Meta event or order mutation occurred.'],readConversationalCommerceState($pdo)));
    }
    commerceJson(400,['success'=>false,'message'=>'Unknown action.']);
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack(); error_log('Conversational commerce database error: '.$e->getMessage());
    if ($e->getCode()==='23000') commerceJson(409,['success'=>false,'message'=>'This channel thread is already recorded.']);
    commerceJson(500,['success'=>false,'message'=>'Conversational commerce data could not be loaded.']);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack(); error_log('Conversational commerce error: '.$e->getMessage()); commerceJson(500,['success'=>false,'message'=>'Conversational commerce data could not be loaded.']);
}
