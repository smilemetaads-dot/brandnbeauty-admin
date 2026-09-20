<?php

declare(strict_types=1);

require_once __DIR__ . '/product_catalog_schema.php';

function replenishmentText(mixed $value, int $limit = 1000): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function replenishmentTableExists(PDO $pdo, string $table): bool { return catalogTableExists($pdo, $table); }

function replenishmentColumns(PDO $pdo, string $table): array
{
    return array_map(static fn(array $row): string => strtolower((string) $row['Field']), catalogColumns($pdo, $table));
}

function replenishmentColumn(array $columns, array $candidates): ?string
{
    foreach ($candidates as $candidate) if (in_array($candidate, $columns, true)) return $candidate;
    return null;
}

function replenishmentNormalizePhone(mixed $value): string
{
    $digits = preg_replace('/\D+/', '', replenishmentText($value, 80)) ?? '';
    return preg_match('/^8801\d{9}$/', $digits) === 1 ? '0' . substr($digits, 3) : $digits;
}

function replenishmentIdentity(array $row): string
{
    $customerId = replenishmentText($row['customer_id'] ?? '', 190);
    if ($customerId !== '' && $customerId !== '0') return hash('sha256', 'customer:' . $customerId);
    $phone = replenishmentNormalizePhone($row['customer_phone'] ?? '');
    if (strlen($phone) >= 7) return hash('sha256', 'phone:' . $phone);
    $email = strtolower(replenishmentText($row['customer_email'] ?? '', 320));
    return $email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) ? hash('sha256', 'email:' . $email) : '';
}

function ensureReplenishmentSchema(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS replenishment_controls (
        id TINYINT UNSIGNED NOT NULL, due_lead_days SMALLINT UNSIGNED NOT NULL DEFAULT 3,
        minimum_delivered_cycles SMALLINT UNSIGNED NOT NULL DEFAULT 2,
        outreach_cooldown_days SMALLINT UNSIGNED NOT NULL DEFAULT 21,
        require_consent TINYINT(1) NOT NULL DEFAULT 1, require_stock_price TINYINT(1) NOT NULL DEFAULT 1,
        require_routine_context TINYINT(1) NOT NULL DEFAULT 1, human_approval_required TINYINT(1) NOT NULL DEFAULT 1,
        automatic_reminder_enabled TINYINT(1) NOT NULL DEFAULT 0, automatic_cart_order_enabled TINYINT(1) NOT NULL DEFAULT 0,
        updated_by VARCHAR(190) NOT NULL DEFAULT 'Admin', updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("CREATE TABLE IF NOT EXISTS replenishment_control_versions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, controls_json LONGTEXT NOT NULL, reason VARCHAR(1000) NOT NULL,
        created_by VARCHAR(190) NOT NULL DEFAULT 'Admin', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("CREATE TABLE IF NOT EXISTS replenishment_action_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, signal_key CHAR(64) NOT NULL,
        action_name ENUM('prepare_reminder_draft','prepare_cart_draft','snooze','hold','close') NOT NULL,
        reason VARCHAR(1000) NOT NULL, actor VARCHAR(190) NOT NULL DEFAULT 'Admin', metadata_json LONGTEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id),
        KEY idx_replenishment_signal (signal_key,created_at), KEY idx_replenishment_action (action_name,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function replenishmentControls(PDO $pdo): array
{
    $defaults = ['due_lead_days'=>3,'minimum_delivered_cycles'=>2,'outreach_cooldown_days'=>21,'require_consent'=>true,'require_stock_price'=>true,'require_routine_context'=>true,'human_approval_required'=>true,'automatic_reminder_enabled'=>false,'automatic_cart_order_enabled'=>false];
    $row = $pdo->query('SELECT * FROM replenishment_controls WHERE id=1')->fetch(PDO::FETCH_ASSOC);
    if (!$row) return $defaults;
    foreach (['require_consent','require_stock_price','require_routine_context','human_approval_required','automatic_reminder_enabled','automatic_cart_order_enabled'] as $key) $row[$key] = (bool) $row[$key];
    return array_merge($defaults, $row);
}

function replenishmentOrderEvidence(PDO $pdo): array
{
    if (!replenishmentTableExists($pdo, 'orders') || !replenishmentTableExists($pdo, 'order_items')) return [];
    $orders = replenishmentColumns($pdo, 'orders'); $items = replenishmentColumns($pdo, 'order_items');
    $oid = replenishmentColumn($orders, ['id','order_id']); $status = replenishmentColumn($orders, ['status','order_status']);
    $created = replenishmentColumn($orders, ['delivered_at','created_at','order_date','created_on']);
    $customer = replenishmentColumn($orders, ['customer_id']); $phone = replenishmentColumn($orders, ['customer_phone','phone','billing_phone']); $email = replenishmentColumn($orders, ['customer_email','email','billing_email']);
    $itemOrder = replenishmentColumn($items, ['order_id']); $product = replenishmentColumn($items, ['product_id']);
    $quantity = replenishmentColumn($items, ['quantity','qty','product_quantity']); $unitPrice = replenishmentColumn($items, ['unit_price','price','product_price','selling_price']);
    if (!$oid || !$status || !$created || !$itemOrder || !$product) return [];
    $select = ['o.'.catalogIdentifier($oid).' AS order_id','o.'.catalogIdentifier($status).' AS order_status','o.'.catalogIdentifier($created).' AS event_date','i.'.catalogIdentifier($product).' AS product_id'];
    $select[] = $quantity ? 'i.'.catalogIdentifier($quantity).' AS quantity' : '1 AS quantity';
    $select[] = $unitPrice ? 'i.'.catalogIdentifier($unitPrice).' AS unit_price' : 'NULL AS unit_price';
    $select[] = $customer ? 'o.'.catalogIdentifier($customer).' AS customer_id' : "'' AS customer_id";
    $select[] = $phone ? 'o.'.catalogIdentifier($phone).' AS customer_phone' : "'' AS customer_phone";
    $select[] = $email ? 'o.'.catalogIdentifier($email).' AS customer_email' : "'' AS customer_email";
    $sql = 'SELECT '.implode(',', $select).' FROM orders o INNER JOIN order_items i ON i.'.catalogIdentifier($itemOrder).'=o.'.catalogIdentifier($oid).' ORDER BY o.'.catalogIdentifier($created).' ASC';
    return $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

function readReplenishmentState(PDO $pdo): array
{
    $controls = replenishmentControls($pdo); $products = [];
    foreach (catalogProductRows($pdo) as $item) $products[(string) $item['id']] = $item;
    $groups = [];
    foreach (replenishmentOrderEvidence($pdo) as $row) {
        if (!in_array(strtolower(replenishmentText($row['order_status'] ?? '', 50)), ['delivered','completed'], true)) continue;
        $identity = replenishmentIdentity($row); $productId = replenishmentText($row['product_id'] ?? '', 40);
        if ($identity === '' || $productId === '' || !isset($products[$productId])) continue;
        $key = hash('sha256', $identity.':'.$productId); $date = substr(replenishmentText($row['event_date'] ?? '', 30), 0, 10);
        if ($date === '') continue;
        $groups[$key] ??= ['identity'=>$identity,'product_id'=>$productId,'deliveries'=>[]];
        $groups[$key]['deliveries'][] = ['date'=>$date,'order_id'=>replenishmentText($row['order_id'] ?? '', 40),'unit_price'=>$row['unit_price'] === null ? null : (float) $row['unit_price']];
    }
    $latestActions = [];
    foreach (($pdo->query('SELECT e.* FROM replenishment_action_events e INNER JOIN (SELECT signal_key,MAX(id) id FROM replenishment_action_events GROUP BY signal_key) x ON x.id=e.id')->fetchAll(PDO::FETCH_ASSOC) ?: []) as $event) $latestActions[$event['signal_key']] = $event;
    $signals = []; $today = new DateTimeImmutable('today');
    foreach ($groups as $signalKey => $group) {
        $deliveries = $group['deliveries']; if (count($deliveries) < 2) continue;
        usort($deliveries, static fn(array $a,array $b): int => strcmp($a['date'],$b['date']));
        $intervals=[]; for($i=1;$i<count($deliveries);$i++) $intervals[] = max(1,(int)(new DateTimeImmutable($deliveries[$i-1]['date']))->diff(new DateTimeImmutable($deliveries[$i]['date']))->format('%a'));
        $cycle = max(14,min(180,(int) round(array_sum($intervals)/count($intervals)))); $last = $deliveries[count($deliveries)-1];
        $dueDate=(new DateTimeImmutable($last['date']))->modify('+'.$cycle.' days'); $dueIn=(int)$today->diff($dueDate)->format('%r%a');
        $stage=$dueIn<=0?'due_now':($dueIn<=(int)$controls['due_lead_days']?'due_soon':'watch'); $product=$products[$group['product_id']];
        $gates=[]; $gates[]=['key'=>'purchase_history','label'=>'Repeat delivered purchase history','state'=>'pass'];
        $gates[]=['key'=>'consent','label'=>'Identity-linked outreach consent','state'=>'blocked','detail'=>'No safely linked customer consent source is available.'];
        $gates[]=['key'=>'routine','label'=>'Active routine context','state'=>'blocked','detail'=>'Live routine ownership is not connected yet.'];
        $gates[]=['key'=>'stock_price','label'=>'Current stock and published price','state'=>($product['stock']>0 && $product['price']>0)?'pass':'blocked'];
        $latest=$latestActions[$signalKey]??null; $paused=$latest && in_array($latest['action_name'],['snooze','hold','close'],true);
        if($paused) $stage='paused'; $ready=!$paused && $product['stock']>0 && $product['price']>0 && !$controls['require_consent'] && !$controls['require_routine_context'];
        $signals[]=['signal_key'=>$signalKey,'customer_reference'=>'Customer • '.strtoupper(substr($group['identity'],0,6)),'product_id'=>$group['product_id'],'product_name'=>$product['name'],'sku'=>$product['sku'],'image'=>$product['image'],'purchases'=>count($deliveries),'last_order_reference'=>'Order #'.$last['order_id'],'last_delivered_at'=>$last['date'],'cycle_days'=>$cycle,'due_in_days'=>$dueIn,'stage'=>$stage,'stock'=>$product['stock'],'current_price'=>$product['price'],'last_paid_price'=>$last['unit_price'],'consent_state'=>'unlinked','routine_state'=>'not_connected','ready_for_outreach'=>$ready,'gates'=>$gates,'latest_action'=>$latest?['name'=>$latest['action_name'],'created_at'=>$latest['created_at']]:null];
    }
    usort($signals, static fn(array $a,array $b): int => $a['due_in_days']<=>$b['due_in_days']);
    $summary=['observed'=>count($signals),'ready'=>0,'due_now'=>0,'due_soon'=>0,'blocked'=>0];
    foreach($signals as $signal){ if($signal['ready_for_outreach'])$summary['ready']++; else $summary['blocked']++; if($signal['stage']==='due_now')$summary['due_now']++; if($signal['stage']==='due_soon')$summary['due_soon']++; }
    return ['summary'=>$summary,'signals'=>$signals,'controls'=>$controls,'quality'=>['orders_connected'=>replenishmentTableExists($pdo,'orders'),'order_items_connected'=>replenishmentTableExists($pdo,'order_items'),'products_connected'=>replenishmentTableExists($pdo,'products'),'consent_connected'=>false,'routine_connected'=>false,'privacy_boundary'=>'Customer identity is hashed server-side and never returned.'],'generated_at'=>date(DATE_ATOM)];
}
