<?php

declare(strict_types=1);

require_once __DIR__ . '/product_catalog_schema.php';

function profitabilityText(mixed $value, int $limit = 500): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function profitabilityColumn(PDO $pdo, string $table, array $candidates): ?string
{
    $columns = array_map(static fn (array $row): string => (string) ($row['Field'] ?? ''), catalogColumns($pdo, $table));
    foreach ($candidates as $candidate) if (in_array($candidate, $columns, true)) return $candidate;
    return null;
}

function profitabilityPeriod(mixed $value): array
{
    $key = strtoupper(profitabilityText($value, 10));
    $options = ['TODAY' => 0, '7D' => 6, '30D' => 29, '90D' => 89];
    if (!array_key_exists($key, $options)) $key = '30D';
    return ['key' => $key === 'TODAY' ? 'Today' : $key, 'from' => date('Y-m-d', strtotime('-' . $options[$key] . ' days')), 'to' => date('Y-m-d')];
}

function ensureProfitabilitySchema(PDO $pdo): void
{
    ensureProductCatalogSchema($pdo);
    $pdo->exec("CREATE TABLE IF NOT EXISTS order_financials (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        order_id BIGINT UNSIGNED NOT NULL,
        product_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        packaging_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        courier_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        payment_fee DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        return_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        other_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        cost_source VARCHAR(40) NOT NULL DEFAULT 'manual',
        evidence_status VARCHAR(30) NOT NULL DEFAULT 'confirmed',
        source_reference VARCHAR(191) NOT NULL,
        note TEXT NOT NULL,
        confirmed_by VARCHAR(191) NOT NULL DEFAULT 'Admin',
        confirmed_at DATETIME NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_order_financials_order (order_id),
        KEY idx_order_financials_status (evidence_status, updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $columns = array_map(static fn (array $row): string => (string) ($row['Field'] ?? ''), catalogColumns($pdo, 'order_financials'));
    $additions = [
        'product_cost' => 'DECIMAL(14,2) NOT NULL DEFAULT 0.00',
        'packaging_cost' => 'DECIMAL(14,2) NOT NULL DEFAULT 0.00',
        'courier_cost' => 'DECIMAL(14,2) NOT NULL DEFAULT 0.00',
        'payment_fee' => 'DECIMAL(14,2) NOT NULL DEFAULT 0.00',
        'return_cost' => 'DECIMAL(14,2) NOT NULL DEFAULT 0.00',
        'other_cost' => 'DECIMAL(14,2) NOT NULL DEFAULT 0.00',
        'cost_source' => "VARCHAR(40) NOT NULL DEFAULT 'manual'",
        'evidence_status' => "VARCHAR(30) NOT NULL DEFAULT 'confirmed'",
        'source_reference' => "VARCHAR(191) NOT NULL DEFAULT ''",
        'note' => 'TEXT NULL',
        'confirmed_by' => "VARCHAR(191) NOT NULL DEFAULT 'Admin'",
        'confirmed_at' => 'DATETIME NULL',
        'created_at' => 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
        'updated_at' => 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    ];
    foreach ($additions as $column => $definition) {
        if (!in_array($column, $columns, true)) $pdo->exec('ALTER TABLE order_financials ADD COLUMN ' . catalogIdentifier($column) . ' ' . $definition);
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS order_financial_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        order_financial_id BIGINT UNSIGNED NOT NULL,
        order_id BIGINT UNSIGNED NOT NULL,
        action_name VARCHAR(60) NOT NULL,
        before_payload LONGTEXT NULL,
        after_payload LONGTEXT NOT NULL,
        reason VARCHAR(1000) NOT NULL,
        actor VARCHAR(191) NOT NULL DEFAULT 'Admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_order_financial_events_record (order_financial_id, created_at),
        KEY idx_order_financial_events_order (order_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function profitabilityProductCosts(PDO $pdo): array
{
    $costs = [];
    foreach (catalogProductRows($pdo) as $product) {
        $cost = $product['cost_price'];
        if ($cost !== null && (float) $cost > 0) $costs[(string) $product['id']] = (float) $cost;
    }
    return $costs;
}

function profitabilityItemEstimates(PDO $pdo, array $orderIds): array
{
    if ($orderIds === [] || !catalogTableExists($pdo, 'order_items')) return [];
    $orderColumn = profitabilityColumn($pdo, 'order_items', ['order_id']);
    $productColumn = profitabilityColumn($pdo, 'order_items', ['product_id']);
    $quantityColumn = profitabilityColumn($pdo, 'order_items', ['quantity', 'qty', 'product_quantity']);
    $costColumn = profitabilityColumn($pdo, 'order_items', ['unit_cost', 'cost_price', 'product_cost', 'purchase_price']);
    if ($orderColumn === null || $productColumn === null || $quantityColumn === null) return [];
    $ids = array_values(array_unique(array_map('intval', $orderIds)));
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $costSelect = $costColumn ? 'oi.' . catalogIdentifier($costColumn) : 'NULL';
    $statement = $pdo->prepare('SELECT oi.' . catalogIdentifier($orderColumn) . ' AS order_id,oi.' . catalogIdentifier($productColumn) . ' AS product_id,oi.' . catalogIdentifier($quantityColumn) . ' AS quantity,' . $costSelect . ' AS unit_cost FROM order_items oi WHERE oi.' . catalogIdentifier($orderColumn) . ' IN (' . $placeholders . ')');
    $statement->execute($ids);
    $catalogCosts = profitabilityProductCosts($pdo);
    $estimates = [];
    foreach (($statement->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) {
        $orderId = (string) ($row['order_id'] ?? '');
        $productId = (string) ($row['product_id'] ?? '');
        $quantity = max(0, (int) ($row['quantity'] ?? 0));
        $directCost = $row['unit_cost'] === null ? null : (float) $row['unit_cost'];
        $unitCost = $directCost !== null && $directCost > 0 ? $directCost : ($catalogCosts[$productId] ?? null);
        if (!isset($estimates[$orderId])) $estimates[$orderId] = ['product_cost' => 0.0, 'items' => 0, 'known_items' => 0];
        $estimates[$orderId]['items']++;
        if ($unitCost !== null && $quantity > 0) {
            $estimates[$orderId]['product_cost'] += $unitCost * $quantity;
            $estimates[$orderId]['known_items']++;
        }
    }
    foreach ($estimates as &$estimate) {
        $estimate['product_cost'] = round((float) $estimate['product_cost'], 2);
        $estimate['complete'] = $estimate['items'] > 0 && $estimate['known_items'] === $estimate['items'];
    }
    unset($estimate);
    return $estimates;
}

function profitabilityMarketingSpend(PDO $pdo, array $period): array
{
    $parameters = [':date_from' => $period['from'], ':date_to' => $period['to']];
    if (catalogTableExists($pdo, 'marketing_spend')) {
        $statement = $pdo->prepare('SELECT COALESCE(SUM(spend_amount),0) FROM marketing_spend WHERE spend_date BETWEEN :date_from AND :date_to');
        $statement->execute($parameters);
        $value = round(max(0, (float) $statement->fetchColumn()), 2);
        if ($value > 0 || !catalogTableExists($pdo, 'meta_ads_daily')) return ['value' => $value, 'source' => 'marketing_spend'];
    }
    if (catalogTableExists($pdo, 'meta_ads_daily')) {
        $statement = $pdo->prepare('SELECT COALESCE(SUM(spend),0) FROM meta_ads_daily WHERE insight_date BETWEEN :date_from AND :date_to');
        $statement->execute($parameters);
        return ['value' => round(max(0, (float) $statement->fetchColumn()), 2), 'source' => 'meta_ads_daily'];
    }
    return ['value' => 0.0, 'source' => 'not_connected'];
}

function profitabilityOperatingExpenses(PDO $pdo, array $period): array
{
    if (!catalogTableExists($pdo, 'operating_expenses')) return ['value' => 0.0, 'connected' => false];
    $statement = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM operating_expenses WHERE expense_date BETWEEN :date_from AND :date_to AND status IN ('approved','paid')");
    $statement->execute([':date_from' => $period['from'], ':date_to' => $period['to']]);
    return ['value' => round(max(0, (float) $statement->fetchColumn()), 2), 'connected' => true];
}

function profitabilityEmptyState(array $period): array
{
    return [
        'period' => $period,
        'summary' => ['delivered_orders' => 0, 'delivered_revenue' => 0.0, 'confirmed_direct_costs' => 0.0, 'known_direct_costs' => 0.0, 'marketing_spend' => 0.0, 'operating_expenses' => 0.0, 'operating_profit' => 0.0, 'operating_margin' => null, 'complete_orders' => 0, 'needs_cost' => 0, 'loss_orders' => 0, 'cost_coverage_percent' => 100.0],
        'orders' => [],
        'quality' => ['orders_connected' => false, 'order_items_connected' => false, 'catalog_costs_connected' => false, 'expenses_connected' => false, 'marketing_source' => 'not_connected', 'profit_state' => 'complete', 'page_load_mode' => 'read_only'],
        'methodology' => ['revenue' => 'Delivered order total only.', 'direct_costs' => 'Human-confirmed order cost evidence. Catalog product cost is shown only as an estimate.', 'operating_costs' => 'Recorded marketing spend plus approved or paid operating expenses.', 'boundary' => 'Read-only calculation. No price, stock, order, bank or advertising record is changed.'],
        'generated_at' => date(DATE_ATOM),
    ];
}

function profitabilityState(PDO $pdo, mixed $requestedPeriod): array
{
    ensureProfitabilitySchema($pdo);
    $period = profitabilityPeriod($requestedPeriod);
    $state = profitabilityEmptyState($period);
    $marketing = profitabilityMarketingSpend($pdo, $period);
    $expenses = profitabilityOperatingExpenses($pdo, $period);
    $state['summary']['marketing_spend'] = $marketing['value'];
    $state['summary']['operating_expenses'] = $expenses['value'];
    $state['quality']['marketing_source'] = $marketing['source'];
    $state['quality']['expenses_connected'] = $expenses['connected'];

    if (!catalogTableExists($pdo, 'orders')) return $state;
    $orderId = profitabilityColumn($pdo, 'orders', ['id', 'order_id']);
    $status = profitabilityColumn($pdo, 'orders', ['status', 'order_status']);
    $total = profitabilityColumn($pdo, 'orders', ['total_amount', 'grand_total', 'order_total', 'total']);
    $created = profitabilityColumn($pdo, 'orders', ['created_at', 'order_date', 'date_created']);
    if ($orderId === null || $status === null || $total === null || $created === null) return $state;
    $state['quality']['orders_connected'] = true;

    $number = profitabilityColumn($pdo, 'orders', ['order_number', 'order_no', 'invoice_number', 'code']);
    $customer = profitabilityColumn($pdo, 'orders', ['customer_name', 'billing_name', 'name']);
    $hasCourier = catalogTableExists($pdo, 'courier_shipments');
    $courierOrder = $hasCourier ? profitabilityColumn($pdo, 'courier_shipments', ['order_id']) : null;
    $courierFee = $hasCourier ? profitabilityColumn($pdo, 'courier_shipments', ['delivery_fee', 'courier_charge', 'shipping_cost']) : null;
    $courierExpression = $courierOrder && $courierFee
        ? '(SELECT COALESCE(MAX(cs.' . catalogIdentifier($courierFee) . '),0) FROM courier_shipments cs WHERE cs.' . catalogIdentifier($courierOrder) . '=o.' . catalogIdentifier($orderId) . ')'
        : '0';
    $numberExpression = $number ? 'o.' . catalogIdentifier($number) : "CONCAT('#',o." . catalogIdentifier($orderId) . ')';
    $customerExpression = $customer ? 'o.' . catalogIdentifier($customer) : "'Guest Customer'";
    $sql = 'SELECT o.' . catalogIdentifier($orderId) . ' AS order_id,' . $numberExpression . ' AS order_number,' . $customerExpression . ' AS customer_name,o.' . catalogIdentifier($status) . ' AS order_status,o.' . catalogIdentifier($total) . ' AS revenue,o.' . catalogIdentifier($created) . ' AS order_created_at,' . $courierExpression . " AS observed_courier_cost FROM orders o WHERE DATE(o." . catalogIdentifier($created) . ") BETWEEN :date_from AND :date_to AND LOWER(TRIM(COALESCE(o." . catalogIdentifier($status) . ",''))) IN ('delivered','completed','complete','fulfilled') ORDER BY o." . catalogIdentifier($created) . ' DESC,o.' . catalogIdentifier($orderId) . ' DESC LIMIT 1000';
    $statement = $pdo->prepare($sql);
    $statement->execute([':date_from' => $period['from'], ':date_to' => $period['to']]);
    $rows = $statement->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $orderIds = array_map(static fn (array $row): int => (int) $row['order_id'], $rows);
    $estimates = profitabilityItemEstimates($pdo, $orderIds);
    $state['quality']['order_items_connected'] = catalogTableExists($pdo, 'order_items');
    $state['quality']['catalog_costs_connected'] = profitabilityProductCosts($pdo) !== [];

    $financials = [];
    if ($orderIds !== []) {
        $placeholders = implode(',', array_fill(0, count($orderIds), '?'));
        $costStatement = $pdo->prepare('SELECT * FROM order_financials WHERE order_id IN (' . $placeholders . ')');
        $costStatement->execute($orderIds);
        foreach (($costStatement->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) $financials[(string) $row['order_id']] = $row;
    }

    $orders = [];
    foreach ($rows as $row) {
        $id = (string) $row['order_id'];
        $financial = $financials[$id] ?? null;
        $confirmed = is_array($financial) && strtolower((string) ($financial['evidence_status'] ?? 'confirmed')) === 'confirmed';
        $estimate = $estimates[$id] ?? ['product_cost' => 0.0, 'items' => 0, 'known_items' => 0, 'complete' => false];
        $costs = [
            'product_cost' => $confirmed ? (float) ($financial['product_cost'] ?? 0) : (float) $estimate['product_cost'],
            'packaging_cost' => $confirmed ? (float) ($financial['packaging_cost'] ?? 0) : 0.0,
            'courier_cost' => $confirmed ? (float) ($financial['courier_cost'] ?? 0) : max(0, (float) ($row['observed_courier_cost'] ?? 0)),
            'payment_fee' => $confirmed ? (float) ($financial['payment_fee'] ?? 0) : 0.0,
            'return_cost' => $confirmed ? (float) ($financial['return_cost'] ?? 0) : 0.0,
            'other_cost' => $confirmed ? (float) ($financial['other_cost'] ?? 0) : 0.0,
        ];
        foreach ($costs as $key => $value) $costs[$key] = round(max(0, $value), 2);
        $directCost = round(array_sum($costs), 2);
        $revenue = round(max(0, (float) ($row['revenue'] ?? 0)), 2);
        $contribution = $confirmed ? round($revenue - $directCost, 2) : null;
        $orders[] = array_merge([
            'id' => $id,
            'order_number' => profitabilityText($row['order_number'] ?? '#' . $id, 191) ?: '#' . $id,
            'customer_name' => profitabilityText($row['customer_name'] ?? 'Guest Customer', 191) ?: 'Guest Customer',
            'status' => strtolower(profitabilityText($row['order_status'] ?? 'delivered', 40)),
            'created_at' => $row['order_created_at'] ?? null,
            'revenue' => $revenue,
        ], $costs, [
            'direct_cost' => $directCost,
            'known_contribution' => round($revenue - $directCost, 2),
            'contribution_profit' => $contribution,
            'margin_percent' => $confirmed && $revenue > 0 ? round(($contribution / $revenue) * 100, 1) : null,
            'cost_state' => $confirmed ? 'confirmed' : ($directCost > 0 ? 'estimated' : 'missing'),
            'source_reference' => $confirmed ? profitabilityText($financial['source_reference'] ?? '', 191) : null,
            'note' => $confirmed ? profitabilityText($financial['note'] ?? '', 1000) : null,
            'confirmed_at' => $confirmed ? ($financial['confirmed_at'] ?? null) : null,
            'estimated_items' => (int) ($estimate['items'] ?? 0),
            'estimated_known_items' => (int) ($estimate['known_items'] ?? 0),
        ]);
    }

    $summary = $state['summary'];
    $summary['delivered_orders'] = count($orders);
    foreach ($orders as $order) {
        $summary['delivered_revenue'] += $order['revenue'];
        $summary['known_direct_costs'] += $order['direct_cost'];
        if ($order['cost_state'] === 'confirmed') {
            $summary['complete_orders']++;
            $summary['confirmed_direct_costs'] += $order['direct_cost'];
            if (($order['contribution_profit'] ?? 0) < 0) $summary['loss_orders']++;
        } else $summary['needs_cost']++;
    }
    foreach (['delivered_revenue', 'confirmed_direct_costs', 'known_direct_costs'] as $key) $summary[$key] = round((float) $summary[$key], 2);
    $summary['cost_coverage_percent'] = $summary['delivered_orders'] > 0 ? round(($summary['complete_orders'] / $summary['delivered_orders']) * 100, 1) : 100.0;
    $complete = $summary['needs_cost'] === 0;
    $summary['operating_profit'] = $complete ? round($summary['delivered_revenue'] - $summary['confirmed_direct_costs'] - $summary['marketing_spend'] - $summary['operating_expenses'], 2) : null;
    $summary['operating_margin'] = $complete && $summary['delivered_revenue'] > 0 ? round(($summary['operating_profit'] / $summary['delivered_revenue']) * 100, 1) : null;
    $state['summary'] = $summary;
    $state['orders'] = $orders;
    $state['quality']['profit_state'] = $complete ? 'complete' : 'needs_cost_evidence';
    return $state;
}

