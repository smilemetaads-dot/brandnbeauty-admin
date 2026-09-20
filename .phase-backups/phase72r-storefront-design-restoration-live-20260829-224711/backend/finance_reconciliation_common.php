<?php

declare(strict_types=1);

require_once __DIR__ . '/product_catalog_schema.php';

function financeReconciliationText(mixed $value, int $limit = 500): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function financeReconciliationColumn(PDO $pdo, string $table, array $candidates): ?string
{
    $columns = array_map(static fn (array $row): string => (string) ($row['Field'] ?? ''), catalogColumns($pdo, $table));
    foreach ($candidates as $candidate) if (in_array($candidate, $columns, true)) return $candidate;
    return null;
}

function ensureFinanceReconciliationSchema(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS cod_reconciliation (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        order_id BIGINT UNSIGNED NOT NULL,
        courier_shipment_id BIGINT UNSIGNED NULL,
        expected_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        collected_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        settled_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        status ENUM('pending','collected','settled','mismatch','returned') NOT NULL DEFAULT 'pending',
        settlement_reference VARCHAR(191) NULL,
        finance_transaction_id BIGINT UNSIGNED NULL,
        note TEXT NULL,
        settled_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_cod_reconciliation_order (order_id),
        KEY idx_cod_reconciliation_status (status), KEY idx_cod_reconciliation_updated (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $columns = array_map(static fn (array $row): string => (string) ($row['Field'] ?? ''), catalogColumns($pdo, 'cod_reconciliation'));
    $additions = [
        'courier_shipment_id' => 'BIGINT UNSIGNED NULL AFTER order_id',
        'expected_amount' => 'DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER courier_shipment_id',
        'collected_amount' => 'DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER expected_amount',
        'settled_amount' => 'DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER collected_amount',
        'status' => "ENUM('pending','collected','settled','mismatch','returned') NOT NULL DEFAULT 'pending' AFTER settled_amount",
        'settlement_reference' => 'VARCHAR(191) NULL AFTER status',
        'finance_transaction_id' => 'BIGINT UNSIGNED NULL AFTER settlement_reference',
        'note' => 'TEXT NULL AFTER finance_transaction_id',
        'settled_at' => 'DATETIME NULL AFTER note',
        'created_at' => 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER settled_at',
        'updated_at' => 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at',
    ];
    foreach ($additions as $column => $definition) {
        if (!in_array($column, $columns, true)) $pdo->exec('ALTER TABLE cod_reconciliation ADD COLUMN ' . catalogIdentifier($column) . ' ' . $definition);
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS finance_reconciliation_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        reconciliation_id BIGINT UNSIGNED NOT NULL,
        order_id BIGINT UNSIGNED NOT NULL,
        action_name VARCHAR(60) NOT NULL,
        before_payload LONGTEXT NULL,
        after_payload LONGTEXT NOT NULL,
        reason VARCHAR(1000) NOT NULL,
        actor VARCHAR(191) NOT NULL DEFAULT 'Admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_finance_reconciliation_event_record (reconciliation_id, created_at),
        KEY idx_finance_reconciliation_event_order (order_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function financeReconciliationPeriod(mixed $value): array
{
    $key = strtoupper(financeReconciliationText($value, 10));
    $options = ['TODAY' => 0, '7D' => 6, '30D' => 29, '90D' => 89];
    if (!array_key_exists($key, $options)) $key = '30D';
    return ['key' => $key === 'TODAY' ? 'Today' : $key, 'from' => date('Y-m-d', strtotime('-' . $options[$key] . ' days')), 'to' => date('Y-m-d')];
}

function financeReconciliationExpression(?string $column, string $prefix, string $fallback): string
{
    return $column === null ? $fallback : $prefix . '.' . catalogIdentifier($column);
}

function financeReconciliationState(PDO $pdo, mixed $requestedPeriod): array
{
    ensureFinanceReconciliationSchema($pdo);
    $period = financeReconciliationPeriod($requestedPeriod);
    if (!catalogTableExists($pdo, 'orders')) {
        return ['period' => $period, 'summary' => ['records' => 0, 'expected' => 0, 'collected' => 0, 'settled' => 0, 'outstanding' => 0, 'issues' => 0], 'records' => [], 'generated_at' => date(DATE_ATOM)];
    }

    $orderId = financeReconciliationColumn($pdo, 'orders', ['id', 'order_id']);
    if ($orderId === null) throw new RuntimeException('The orders table needs an identifier column.');
    $customer = financeReconciliationColumn($pdo, 'orders', ['customer_name', 'billing_name', 'name']);
    $phone = financeReconciliationColumn($pdo, 'orders', ['customer_phone', 'billing_phone', 'phone']);
    $total = financeReconciliationColumn($pdo, 'orders', ['total_amount', 'grand_total', 'order_total', 'total']);
    $status = financeReconciliationColumn($pdo, 'orders', ['status', 'order_status']);
    $paymentMethod = financeReconciliationColumn($pdo, 'orders', ['payment_method', 'payment_type', 'payment_mode', 'payment_gateway']);
    $created = financeReconciliationColumn($pdo, 'orders', ['created_at', 'order_date', 'date_created']);
    $orderCourier = financeReconciliationColumn($pdo, 'orders', ['courier_name', 'delivery_partner']);
    $orderTracking = financeReconciliationColumn($pdo, 'orders', ['courier_tracking_id', 'tracking_code', 'tracking_id']);
    $orderDelivery = financeReconciliationColumn($pdo, 'orders', ['delivery_charge', 'shipping_charge', 'shipping_fee', 'delivery_fee']);

    $hasCourier = catalogTableExists($pdo, 'courier_shipments');
    $courierOrder = $hasCourier ? financeReconciliationColumn($pdo, 'courier_shipments', ['order_id']) : null;
    $joinCourier = $hasCourier && $courierOrder !== null;
    $courierId = $joinCourier ? financeReconciliationColumn($pdo, 'courier_shipments', ['id']) : null;
    $courierProvider = $joinCourier ? financeReconciliationColumn($pdo, 'courier_shipments', ['provider', 'courier_name']) : null;
    $courierTracking = $joinCourier ? financeReconciliationColumn($pdo, 'courier_shipments', ['tracking_code', 'tracking_id']) : null;
    $courierConsignment = $joinCourier ? financeReconciliationColumn($pdo, 'courier_shipments', ['consignment_id']) : null;
    $courierDelivery = $joinCourier ? financeReconciliationColumn($pdo, 'courier_shipments', ['delivery_fee', 'courier_charge']) : null;
    $courierCod = $joinCourier ? financeReconciliationColumn($pdo, 'courier_shipments', ['cod_amount', 'collection_amount']) : null;
    $courierJoin = $courierOrder ? 'LEFT JOIN courier_shipments cs ON cs.' . catalogIdentifier($courierOrder) . '=o.' . catalogIdentifier($orderId) : '';

    $orderTotal = financeReconciliationExpression($total, 'o', '0');
    $codCandidate = $courierCod ? 'NULLIF(cs.' . catalogIdentifier($courierCod) . ',0)' : 'NULL';
    $providerCandidate = $courierProvider ? "NULLIF(TRIM(cs." . catalogIdentifier($courierProvider) . "),'')" : 'NULL';
    $orderProviderCandidate = $orderCourier ? "NULLIF(TRIM(o." . catalogIdentifier($orderCourier) . "),'')" : 'NULL';
    $trackingCandidate = $courierTracking ? 'cs.' . catalogIdentifier($courierTracking) : financeReconciliationExpression($orderTracking, 'o', 'NULL');
    $consignmentCandidate = $courierConsignment ? 'cs.' . catalogIdentifier($courierConsignment) : 'NULL';
    $deliveryCandidate = $courierDelivery ? 'cs.' . catalogIdentifier($courierDelivery) : financeReconciliationExpression($orderDelivery, 'o', '0');
    $courierIdCandidate = $courierId ? 'cs.' . catalogIdentifier($courierId) : 'NULL';
    $conditions = [];
    $parameters = [];
    if ($created) {
        $conditions[] = 'DATE(o.' . catalogIdentifier($created) . ') BETWEEN :date_from AND :date_to';
        $parameters = [':date_from' => $period['from'], ':date_to' => $period['to']];
    }
    if ($paymentMethod || $courierCod) {
        $codChecks = [];
        if ($paymentMethod) $codChecks[] = "LOWER(TRIM(COALESCE(o." . catalogIdentifier($paymentMethod) . ",''))) IN ('cod','cash on delivery','cash_on_delivery','cash-on-delivery')";
        if ($courierCod) $codChecks[] = 'COALESCE(cs.' . catalogIdentifier($courierCod) . ',0)>0';
        $conditions[] = '(' . implode(' OR ', $codChecks) . ')';
    }
    if ($status) $conditions[] = "LOWER(TRIM(COALESCE(o." . catalogIdentifier($status) . ",''))) NOT IN ('cancelled','canceled','failed')";
    $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';
    $orderBy = $created ? 'o.' . catalogIdentifier($created) . ' DESC' : 'o.' . catalogIdentifier($orderId) . ' DESC';
    $sql = 'SELECT o.' . catalogIdentifier($orderId) . ' AS order_id,' .
        financeReconciliationExpression($customer, 'o', "'Guest Customer'") . ' AS customer_name,' .
        financeReconciliationExpression($phone, 'o', 'NULL') . ' AS customer_phone,' .
        $orderTotal . ' AS total_amount,' . financeReconciliationExpression($status, 'o', "'unknown'") . ' AS order_status,' .
        financeReconciliationExpression($created, 'o', 'NULL') . ' AS order_created_at,' .
        'COALESCE(' . $providerCandidate . ',' . $orderProviderCandidate . ",'Manual') AS provider," .
        $trackingCandidate . ' AS tracking_code,' . $consignmentCandidate . ' AS consignment_id,' .
        $deliveryCandidate . ' AS delivery_fee,' . $courierIdCandidate . ' AS courier_shipment_id,' .
        'cr.id AS reconciliation_id,COALESCE(NULLIF(cr.expected_amount,0),' . $codCandidate . ',' . $orderTotal . ',0) AS expected_amount,' .
        'COALESCE(cr.collected_amount,0) AS collected_amount,COALESCE(cr.settled_amount,0) AS settled_amount,' .
        "COALESCE(cr.status,'pending') AS reconciliation_status,cr.settlement_reference,cr.note,cr.settled_at,cr.created_at,cr.updated_at " .
        'FROM orders o ' . $courierJoin . ' LEFT JOIN cod_reconciliation cr ON cr.order_id=o.' . catalogIdentifier($orderId) . ' ' .
        $where . ' ORDER BY ' . $orderBy . ' LIMIT 1000';
    $statement = $pdo->prepare($sql);
    $statement->execute($parameters);
    $records = [];
    foreach (($statement->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) {
        $expected = round(max(0, (float) ($row['expected_amount'] ?? 0)), 2);
        $collected = round(max(0, (float) ($row['collected_amount'] ?? 0)), 2);
        $settled = round(max(0, (float) ($row['settled_amount'] ?? 0)), 2);
        $recordStatus = strtolower((string) ($row['reconciliation_status'] ?? 'pending'));
        $orderStatus = strtolower((string) ($row['order_status'] ?? ''));
        if (in_array($orderStatus, ['returned', 'return', 'refunded'], true)) $recordStatus = 'returned';
        elseif ($settled > 0) $recordStatus = abs($settled - $expected) <= 0.01 ? 'settled' : 'mismatch';
        elseif ($collected > 0) $recordStatus = 'collected';
        elseif (!in_array($recordStatus, ['pending', 'collected', 'settled', 'mismatch', 'returned'], true)) $recordStatus = 'pending';
        $records[] = [
            'id' => (string) ($row['reconciliation_id'] ?? ''), 'order_id' => (string) $row['order_id'],
            'customer_name' => financeReconciliationText($row['customer_name'] ?? 'Guest Customer', 190) ?: 'Guest Customer',
            'customer_phone' => financeReconciliationText($row['customer_phone'] ?? '', 50) ?: null,
            'total_amount' => round((float) ($row['total_amount'] ?? 0), 2), 'order_status' => (string) ($row['order_status'] ?? 'unknown'),
            'order_created_at' => $row['order_created_at'] ?? null, 'provider' => financeReconciliationText($row['provider'] ?? 'Manual', 100) ?: 'Manual',
            'tracking_code' => financeReconciliationText($row['tracking_code'] ?? '', 191) ?: null,
            'consignment_id' => financeReconciliationText($row['consignment_id'] ?? '', 191) ?: null,
            'courier_shipment_id' => isset($row['courier_shipment_id']) ? (string) $row['courier_shipment_id'] : null,
            'delivery_fee' => round(max(0, (float) ($row['delivery_fee'] ?? 0)), 2), 'expected_amount' => $expected,
            'collected_amount' => $collected, 'settled_amount' => $settled, 'outstanding_amount' => round(max(0, $expected - $settled), 2),
            'difference' => round($settled - $expected, 2), 'status' => $recordStatus,
            'settlement_reference' => financeReconciliationText($row['settlement_reference'] ?? '', 191) ?: null,
            'note' => financeReconciliationText($row['note'] ?? '', 1000) ?: null, 'settled_at' => $row['settled_at'] ?? null,
            'created_at' => $row['created_at'] ?? null, 'updated_at' => $row['updated_at'] ?? null,
        ];
    }
    $summary = ['records' => count($records), 'expected' => 0.0, 'collected' => 0.0, 'settled' => 0.0, 'outstanding' => 0.0, 'issues' => 0];
    foreach ($records as $record) {
        if ($record['status'] !== 'returned') $summary['expected'] += $record['expected_amount'];
        $summary['collected'] += $record['collected_amount']; $summary['settled'] += $record['settled_amount'];
        if (!in_array($record['status'], ['returned', 'settled'], true)) $summary['outstanding'] += $record['outstanding_amount'];
        if (in_array($record['status'], ['mismatch', 'returned'], true)) $summary['issues']++;
    }
    foreach (['expected', 'collected', 'settled', 'outstanding'] as $key) $summary[$key] = round($summary[$key], 2);
    return ['period' => $period, 'summary' => $summary, 'records' => $records, 'generated_at' => date(DATE_ATOM)];
}
