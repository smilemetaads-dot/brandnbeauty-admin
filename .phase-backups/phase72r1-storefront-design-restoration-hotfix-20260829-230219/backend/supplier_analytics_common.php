<?php

declare(strict_types=1);

require_once __DIR__ . '/purchase_stock_schema.php';

function supplierAnalyticsTimeframe(mixed $value): array
{
    $key = strtoupper(trim(is_scalar($value) ? (string) $value : '6M'));
    $options = [
        '90D' => ['days' => 90, 'months' => 3],
        '6M' => ['days' => 183, 'months' => 6],
        '12M' => ['days' => 365, 'months' => 12],
    ];
    return ['key' => isset($options[$key]) ? $key : '6M'] + ($options[$key] ?? $options['6M']);
}

function supplierAnalyticsMonthKeys(int $months): array
{
    $keys = [];
    $start = strtotime(date('Y-m-01 00:00:00'));
    for ($offset = $months - 1; $offset >= 0; $offset--) {
        $point = strtotime('-' . $offset . ' months', $start);
        $key = date('Y-m', $point);
        $keys[$key] = ['key' => $key, 'label' => date('M', $point), 'spend' => 0.0, 'received_units' => 0];
    }
    return $keys;
}

function supplierAnalyticsState(PDO $pdo, string $requestedTimeframe): array
{
    $baseState = purchaseStockState($pdo);
    $timeframe = supplierAnalyticsTimeframe($requestedTimeframe);
    $cutoff = date('Y-m-d H:i:s', strtotime('-' . $timeframe['days'] . ' days'));
    $suppliers = [];
    foreach ($baseState['suppliers'] as $supplier) {
        $supplier['supplier_type'] = '';
        $supplier['purchase_count'] = 0;
        $supplier['completed_count'] = 0;
        $supplier['open_count'] = 0;
        $supplier['purchase_spend'] = 0.0;
        $supplier['open_commitment'] = 0.0;
        $supplier['ordered_units'] = 0;
        $supplier['received_units'] = 0;
        $supplier['fulfillment_rate'] = null;
        $supplier['on_time_rate'] = null;
        $supplier['average_lead_days'] = null;
        $supplier['score'] = null;
        $supplier['spend_share'] = 0.0;
        $supplier['evidence_state'] = 'no_evidence';
        $supplier['last_purchase_at'] = null;
        $supplier['_on_time'] = 0;
        $supplier['_lead_total'] = 0;
        $suppliers[$supplier['id']] = $supplier;
    }

    $orders = [];
    foreach ($baseState['orders'] as $order) {
        if (strtotime((string) $order['created_at']) < strtotime($cutoff)) continue;
        $order['ordered_units'] = array_sum(array_map(static fn (array $line): int => (int) $line['ordered_quantity'], $order['lines']));
        $order['received_units'] = array_sum(array_map(static fn (array $line): int => (int) $line['received_quantity'], $order['lines']));
        $order['supplier_name_snapshot'] = $order['supplier_name'];
        $orders[] = $order;
    }
    $trend = supplierAnalyticsMonthKeys((int) $timeframe['months']);
    $totalSpend = 0.0;
    $overallCompleted = 0;
    $overallOnTime = 0;
    $overallLeadTotal = 0;

    foreach ($orders as $order) {
        if ((string) $order['status'] === 'cancelled') continue;
        $supplierId = (string) $order['supplier_id'];
        if (!isset($suppliers[$supplierId])) {
            $suppliers[$supplierId] = [
                'id' => $supplierId, 'name' => (string) $order['supplier_name_snapshot'], 'supplier_type' => '', 'payment_terms' => (string) $order['payment_terms'], 'status' => 'historical',
                'purchase_count' => 0, 'completed_count' => 0, 'open_count' => 0, 'purchase_spend' => 0.0, 'open_commitment' => 0.0,
                'ordered_units' => 0, 'received_units' => 0, 'fulfillment_rate' => null, 'on_time_rate' => null, 'average_lead_days' => null,
                'score' => null, 'spend_share' => 0.0, 'evidence_state' => 'no_evidence', 'last_purchase_at' => null, '_on_time' => 0, '_lead_total' => 0,
            ];
        }
        $value = max(0, (float) $order['total_cost']);
        $orderedUnits = max(0, (int) $order['ordered_units']);
        $receivedUnits = max(0, (int) $order['received_units']);
        $suppliers[$supplierId]['purchase_count']++;
        $suppliers[$supplierId]['purchase_spend'] += $value;
        $suppliers[$supplierId]['ordered_units'] += $orderedUnits;
        $suppliers[$supplierId]['received_units'] += $receivedUnits;
        $suppliers[$supplierId]['last_purchase_at'] = $suppliers[$supplierId]['last_purchase_at'] ?? $order['created_at'];
        $totalSpend += $value;
        if (!in_array($order['status'], ['received', 'cancelled'], true)) {
            $suppliers[$supplierId]['open_count']++;
            $suppliers[$supplierId]['open_commitment'] += $value;
        }
        if ($order['status'] === 'received' && $order['received_at'] !== null) {
            $leadStart = $order['approved_at'] ?: $order['created_at'];
            $leadDays = max(0, (int) floor((strtotime((string) $order['received_at']) - strtotime((string) $leadStart)) / 86400));
            $onTime = strtotime((string) $order['received_at']) <= strtotime((string) $order['expected_date'] . ' 23:59:59');
            $suppliers[$supplierId]['completed_count']++;
            $suppliers[$supplierId]['_lead_total'] += $leadDays;
            $suppliers[$supplierId]['_on_time'] += $onTime ? 1 : 0;
            $overallCompleted++;
            $overallLeadTotal += $leadDays;
            $overallOnTime += $onTime ? 1 : 0;
        }
        $bucket = substr((string) $order['created_at'], 0, 7);
        if (isset($trend[$bucket])) {
            $trend[$bucket]['spend'] += $value;
            $trend[$bucket]['received_units'] += $receivedUnits;
        }
    }

    foreach ($suppliers as &$supplier) {
        if ($supplier['ordered_units'] > 0) $supplier['fulfillment_rate'] = round(($supplier['received_units'] / $supplier['ordered_units']) * 100, 1);
        if ($supplier['completed_count'] > 0) {
            $supplier['on_time_rate'] = round(($supplier['_on_time'] / $supplier['completed_count']) * 100, 1);
            $supplier['average_lead_days'] = round($supplier['_lead_total'] / $supplier['completed_count'], 1);
            $fulfillment = (float) ($supplier['fulfillment_rate'] ?? 0);
            $leadScore = max(0, 100 - ((float) $supplier['average_lead_days'] * 4));
            $supplier['score'] = round(((float) $supplier['on_time_rate'] * 0.45) + ($fulfillment * 0.40) + ($leadScore * 0.15), 1);
        }
        $supplier['spend_share'] = $totalSpend > 0 ? round(($supplier['purchase_spend'] / $totalSpend) * 100, 1) : 0.0;
        if ($supplier['purchase_count'] === 0) $supplier['evidence_state'] = 'no_evidence';
        elseif ($supplier['completed_count'] === 0) $supplier['evidence_state'] = 'building';
        elseif ($supplier['score'] < 70 || $supplier['spend_share'] > 50) $supplier['evidence_state'] = 'watch';
        elseif ($supplier['score'] < 85 || $supplier['spend_share'] > 35) $supplier['evidence_state'] = 'review';
        else $supplier['evidence_state'] = 'stable';
        unset($supplier['_on_time'], $supplier['_lead_total']);
        foreach (['purchase_spend', 'open_commitment', 'spend_share'] as $key) $supplier[$key] = round((float) $supplier[$key], 2);
    }
    unset($supplier);
    usort($suppliers, static fn (array $a, array $b): int => ($b['purchase_spend'] <=> $a['purchase_spend']) ?: strcmp($a['name'], $b['name']));
    $topExposure = $suppliers === [] ? 0.0 : max(array_column($suppliers, 'spend_share'));

    return [
        'timeframe' => $timeframe['key'],
        'summary' => [
            'total_suppliers' => count($suppliers),
            'evidence_suppliers' => count(array_filter($suppliers, static fn (array $row): bool => $row['purchase_count'] > 0)),
            'purchase_spend' => round($totalSpend, 2),
            'completed_receipts' => $overallCompleted,
            'received_units' => array_sum(array_column($trend, 'received_units')),
            'on_time_rate' => $overallCompleted > 0 ? round(($overallOnTime / $overallCompleted) * 100, 1) : null,
            'average_lead_days' => $overallCompleted > 0 ? round($overallLeadTotal / $overallCompleted, 1) : null,
            'top_supplier_exposure' => round($topExposure, 1),
        ],
        'suppliers' => array_values($suppliers),
        'trend' => array_values($trend),
        'methodology' => [
            'score' => '45% on-time delivery + 40% received-versus-ordered fulfillment + 15% actual lead-time efficiency.',
            'spend' => 'Non-cancelled Purchase Stock Entry value created inside the selected period.',
            'receipts' => 'Verified received quantities from controlled purchases created inside the selected period; every receipt is paired with immutable stock movement evidence.',
            'boundary' => 'Read-only evidence. No supplier, purchase, stock or Finance record is changed.',
        ],
        'generated_at' => date(DATE_ATOM),
    ];
}
