<?php

declare(strict_types=1);

require_once __DIR__ . '/inventory_schema.php';

function intelligencePickColumn(PDO $pdo, string $table, array $candidates): ?string
{
    $columns = array_map(static fn (array $row): string => (string) $row['Field'], catalogColumns($pdo, $table));
    foreach ($candidates as $candidate) {
        if (in_array($candidate, $columns, true)) return $candidate;
    }
    return null;
}

function intelligenceDemandAdapter(PDO $pdo): array
{
    $itemTable = null;
    foreach (['order_items', 'order_details', 'order_products'] as $candidate) {
        if (catalogTableExists($pdo, $candidate)) { $itemTable = $candidate; break; }
    }
    if ($itemTable === null) {
        return ['ready' => false, 'message' => 'No compatible order-item table was found. Forecasting is intentionally disabled.'];
    }

    $productId = intelligencePickColumn($pdo, $itemTable, ['product_id', 'productId']);
    $quantity = intelligencePickColumn($pdo, $itemTable, ['quantity', 'qty', 'product_qty', 'item_quantity']);
    $itemDate = intelligencePickColumn($pdo, $itemTable, ['created_at', 'added_at', 'date_created', 'order_date']);
    $itemOrderId = intelligencePickColumn($pdo, $itemTable, ['order_id', 'orderId']);

    if ($productId === null || $quantity === null) {
        return ['ready' => false, 'message' => 'The order-item table does not expose stable product and quantity columns. Forecasting is intentionally disabled.'];
    }

    $orderReady = catalogTableExists($pdo, 'orders');
    $orderId = $orderReady ? intelligencePickColumn($pdo, 'orders', ['id', 'order_id']) : null;
    $orderDate = $orderReady ? intelligencePickColumn($pdo, 'orders', ['created_at', 'order_date', 'date_created']) : null;
    $orderStatus = $orderReady ? intelligencePickColumn($pdo, 'orders', ['status', 'order_status']) : null;
    $canJoinOrders = $itemOrderId !== null && $orderId !== null;

    if ($itemDate === null && (!$canJoinOrders || $orderDate === null)) {
        return ['ready' => false, 'message' => 'No compatible order date was found. Forecasting is intentionally disabled.'];
    }

    return [
        'ready' => true,
        'item_table' => $itemTable,
        'product_id' => $productId,
        'quantity' => $quantity,
        'item_date' => $itemDate,
        'item_order_id' => $itemOrderId,
        'order_id' => $orderId,
        'order_date' => $orderDate,
        'order_status' => $orderStatus,
        'join_orders' => $canJoinOrders,
        'message' => $orderStatus !== null && $canJoinOrders
            ? 'Observed demand uses confirmed-to-delivered order items and excludes unconfirmed or failed outcomes.'
            : 'Observed demand uses dated order items; order-status filtering is unavailable in the detected schema.',
    ];
}

function intelligenceDemandRows(PDO $pdo, array $adapter): array
{
    if (empty($adapter['ready'])) return [];

    $table = catalogIdentifier((string) $adapter['item_table']);
    $product = 'i.' . catalogIdentifier((string) $adapter['product_id']);
    $quantity = 'GREATEST(0, COALESCE(i.' . catalogIdentifier((string) $adapter['quantity']) . ',0))';
    $join = '';
    $date = '';
    $statusWhere = '';

    if (!empty($adapter['join_orders'])) {
        $join = ' LEFT JOIN `orders` o ON o.' . catalogIdentifier((string) $adapter['order_id']) . '=i.' . catalogIdentifier((string) $adapter['item_order_id']);
    }
    if (!empty($adapter['item_date'])) {
        $date = 'i.' . catalogIdentifier((string) $adapter['item_date']);
    } else {
        $date = 'o.' . catalogIdentifier((string) $adapter['order_date']);
    }
    if (!empty($adapter['join_orders']) && !empty($adapter['order_status'])) {
        $status = 'LOWER(TRIM(COALESCE(o.' . catalogIdentifier((string) $adapter['order_status']) . ",'')))";
        $statusWhere = " AND {$status} IN ('confirm','confirmed','processing','packed','ready_to_ship','shipped','delivered','completed','complete','fulfilled')";
    }

    $sql = "SELECT {$product} AS product_id,
        SUM(CASE WHEN {$date} >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN {$quantity} ELSE 0 END) AS sold_30d,
        SUM(CASE WHEN {$date} >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN {$quantity} ELSE 0 END) AS sold_90d
        FROM {$table} i{$join}
        WHERE {$product} IS NOT NULL AND {$date} >= DATE_SUB(NOW(), INTERVAL 90 DAY){$statusWhere}
        GROUP BY {$product}";

    $indexed = [];
    foreach ($pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
        $indexed[(string) $row['product_id']] = [
            'sold_30d' => max(0, (int) $row['sold_30d']),
            'sold_90d' => max(0, (int) $row['sold_90d']),
        ];
    }
    return $indexed;
}

function inventoryIntelligenceState(PDO $pdo): array
{
    ensureInventorySchema($pdo);
    $products = inventoryProductRows($pdo);
    $adapter = intelligenceDemandAdapter($pdo);
    $demand = intelligenceDemandRows($pdo, $adapter);
    $leadDays = 14;
    $safetyDays = 7;
    $targetDays = $leadDays + $safetyDays;
    $rows = [];

    foreach ($products as $product) {
        $observed = $demand[(string) $product['id']] ?? ['sold_30d' => 0, 'sold_90d' => 0];
        $sold30 = (int) $observed['sold_30d'];
        $sold90 = (int) $observed['sold_90d'];
        $velocity = $sold30 > 0 ? $sold30 / 30 : ($sold90 > 0 ? $sold90 / 90 : 0.0);
        $onHand = max(0, (int) $product['on_hand']);
        $daysCover = $velocity > 0 ? round($onHand / $velocity, 1) : null;
        $recommended = !empty($adapter['ready']) && $velocity > 0 ? max(0, (int) ceil(($velocity * $targetDays) - $onHand)) : 0;
        $priority = 'no_history';
        if (empty($adapter['ready'])) $priority = 'source_unavailable';
        elseif ($velocity > 0 && ($onHand === 0 || ($daysCover !== null && $daysCover <= $leadDays))) $priority = 'urgent';
        elseif ($velocity > 0 && ($onHand <= (int) $product['low_stock_threshold'] || ($daysCover !== null && $daysCover <= $targetDays))) $priority = 'review';
        elseif ($recommended > 0) $priority = 'watch';
        elseif ($velocity > 0) $priority = 'stable';

        $rows[] = array_merge($product, [
            'sold_30d' => $sold30,
            'sold_90d' => $sold90,
            'daily_velocity' => round($velocity, 3),
            'velocity_basis' => $sold30 > 0 ? '30-day observed demand' : ($sold90 > 0 ? '90-day fallback demand' : 'No observed demand'),
            'days_cover' => $daysCover,
            'lead_time_days' => $leadDays,
            'safety_days' => $safetyDays,
            'recommended_quantity' => $recommended,
            'priority' => $priority,
        ]);
    }

    $rank = ['urgent' => 0, 'review' => 1, 'watch' => 2, 'stable' => 3, 'no_history' => 4, 'source_unavailable' => 5];
    usort($rows, static function (array $left, array $right) use ($rank): int {
        $priority = ($rank[$left['priority']] ?? 9) <=> ($rank[$right['priority']] ?? 9);
        return $priority !== 0 ? $priority : ((int) $right['sold_30d'] <=> (int) $left['sold_30d']);
    });

    $count = static fn (string $priority): int => count(array_filter($rows, static fn (array $row): bool => $row['priority'] === $priority));
    return [
        'source' => [
            'ready' => (bool) ($adapter['ready'] ?? false),
            'item_table' => (string) ($adapter['item_table'] ?? ''),
            'status_guarded' => !empty($adapter['join_orders']) && !empty($adapter['order_status']),
            'message' => (string) ($adapter['message'] ?? 'Demand evidence is unavailable.'),
        ],
        'policy' => ['lead_time_days' => $leadDays, 'safety_days' => $safetyDays, 'target_cover_days' => $targetDays, 'mode' => 'read_only_default_assumptions'],
        'summary' => [
            'total_skus' => count($rows),
            'observed_demand_skus' => count(array_filter($rows, static fn (array $row): bool => (int) $row['sold_90d'] > 0)),
            'urgent' => $count('urgent'),
            'review' => $count('review'),
            'reorder_candidates' => count(array_filter($rows, static fn (array $row): bool => (int) $row['recommended_quantity'] > 0)),
            'no_history' => $count('no_history'),
        ],
        'products' => $rows,
        'generated_at' => date(DATE_ATOM),
    ];
}
