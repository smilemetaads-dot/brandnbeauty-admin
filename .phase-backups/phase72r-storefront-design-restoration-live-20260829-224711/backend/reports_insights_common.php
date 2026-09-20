<?php

declare(strict_types=1);

require_once __DIR__ . '/profitability_common.php';
require_once __DIR__ . '/finance_reconciliation_common.php';
require_once __DIR__ . '/expense_management_common.php';
require_once __DIR__ . '/inventory_intelligence_common.php';
require_once __DIR__ . '/supplier_analytics_common.php';

function reportsInsightsMoney(float|int $value): string
{
    return 'BDT ' . number_format((float) $value, 0, '.', ',');
}

function reportsInsightsProbe(string $name, callable $reader): array
{
    try {
        return ['available' => true, 'name' => $name, 'data' => $reader(), 'error' => null];
    } catch (Throwable $error) {
        error_log('reports_insights_common.php [' . $name . ']: ' . $error->getMessage());
        return ['available' => false, 'name' => $name, 'data' => [], 'error' => 'This evidence source is temporarily unavailable.'];
    }
}

function reportsInsightsState(PDO $pdo, mixed $requestedPeriod): array
{
    $period = profitabilityPeriod($requestedPeriod);
    $periodKey = $period['key'];
    $profit = reportsInsightsProbe('Profitability Control', static fn (): array => profitabilityState($pdo, $periodKey));
    $finance = reportsInsightsProbe('Finance Reconciliation', static fn (): array => financeReconciliationState($pdo, $periodKey));
    $expenses = reportsInsightsProbe('Expenses & Cost Management', static fn (): array => expenseManagementState($pdo, $periodKey));
    $inventory = reportsInsightsProbe('Inventory Intelligence', static fn (): array => inventoryIntelligenceState($pdo));
    $suppliers = reportsInsightsProbe('Supplier Analytics', static fn (): array => supplierAnalyticsState($pdo, '90D'));

    $profitSummary = $profit['available'] ? ($profit['data']['summary'] ?? []) : [];
    $financeSummary = $finance['available'] ? ($finance['data']['summary'] ?? []) : [];
    $expenseSummary = $expenses['available'] ? ($expenses['data']['summary'] ?? []) : [];
    $inventorySummary = $inventory['available'] ? ($inventory['data']['summary'] ?? []) : [];
    $supplierSummary = $suppliers['available'] ? ($suppliers['data']['summary'] ?? []) : [];

    $summary = [
        'delivered_orders' => (int) ($profitSummary['delivered_orders'] ?? 0),
        'delivered_revenue' => round((float) ($profitSummary['delivered_revenue'] ?? 0), 2),
        'confirmed_direct_costs' => round((float) ($profitSummary['confirmed_direct_costs'] ?? 0), 2),
        'marketing_spend' => round((float) ($profitSummary['marketing_spend'] ?? 0), 2),
        'approved_expenses' => round((float) ($expenseSummary['approved_cost'] ?? $profitSummary['operating_expenses'] ?? 0), 2),
        'operating_profit' => array_key_exists('operating_profit', $profitSummary) ? $profitSummary['operating_profit'] : null,
        'operating_margin' => array_key_exists('operating_margin', $profitSummary) ? $profitSummary['operating_margin'] : null,
        'settled_cod' => round((float) ($financeSummary['settled'] ?? 0), 2),
        'outstanding_cod' => round((float) ($financeSummary['outstanding'] ?? 0), 2),
        'cost_coverage_percent' => round((float) ($profitSummary['cost_coverage_percent'] ?? 0), 1),
        'urgent_inventory' => (int) ($inventorySummary['urgent'] ?? 0),
        'reorder_candidates' => (int) ($inventorySummary['reorder_candidates'] ?? 0),
        'supplier_exposure_percent' => round((float) ($supplierSummary['top_supplier_exposure'] ?? 0), 1),
        'attention_count' => 0,
        'available_domains' => count(array_filter([$profit, $finance, $expenses, $inventory, $suppliers], static fn (array $domain): bool => $domain['available'])),
    ];

    $domains = [];
    $domains[] = [
        'id' => 'profitability', 'title' => 'Delivered profitability',
        'status' => !$profit['available'] ? 'unavailable' : (((int) ($profitSummary['needs_cost'] ?? 0)) > 0 ? 'review' : (((int) ($profitSummary['delivered_orders'] ?? 0)) > 0 ? 'ready' : 'no_evidence')),
        'primary_label' => 'Revenue', 'primary_value' => reportsInsightsMoney($summary['delivered_revenue']),
        'secondary_label' => 'Operating profit', 'secondary_value' => $summary['operating_profit'] === null ? 'Needs cost evidence' : reportsInsightsMoney((float) $summary['operating_profit']),
        'note' => !$profit['available'] ? $profit['error'] : ((int) ($profitSummary['needs_cost'] ?? 0) > 0 ? ((int) $profitSummary['needs_cost']) . ' delivered order(s) need confirmed cost evidence.' : 'Delivered revenue and confirmed cost evidence only.'),
        'route' => 'Profitability Control',
    ];
    $domains[] = [
        'id' => 'cod', 'title' => 'COD reconciliation',
        'status' => !$finance['available'] ? 'unavailable' : ((((int) ($financeSummary['issues'] ?? 0)) > 0 || $summary['outstanding_cod'] > 0) ? 'review' : (((int) ($financeSummary['records'] ?? 0)) > 0 ? 'ready' : 'no_evidence')),
        'primary_label' => 'Settled', 'primary_value' => reportsInsightsMoney($summary['settled_cod']),
        'secondary_label' => 'Outstanding', 'secondary_value' => reportsInsightsMoney($summary['outstanding_cod']),
        'note' => !$finance['available'] ? $finance['error'] : 'Expected, collected and human-confirmed courier settlement evidence.',
        'route' => 'Finance Reconciliation',
    ];
    $domains[] = [
        'id' => 'expenses', 'title' => 'Operating expenses',
        'status' => !$expenses['available'] ? 'unavailable' : ((((int) ($expenseSummary['awaiting_approval'] ?? 0)) > 0 || ((int) ($expenseSummary['approved_unpaid'] ?? 0)) > 0) ? 'review' : (((int) ($expenseSummary['records'] ?? 0)) > 0 ? 'ready' : 'no_evidence')),
        'primary_label' => 'Approved cost', 'primary_value' => reportsInsightsMoney($summary['approved_expenses']),
        'secondary_label' => 'Awaiting approval', 'secondary_value' => (string) ((int) ($expenseSummary['awaiting_approval'] ?? 0)),
        'note' => !$expenses['available'] ? $expenses['error'] : 'Approved and paid ledger evidence; drafts are excluded from profit.',
        'route' => 'Expenses & Cost Management',
    ];
    $domains[] = [
        'id' => 'inventory', 'title' => 'Inventory planning',
        'status' => !$inventory['available'] ? 'unavailable' : (($summary['urgent_inventory'] > 0 || $summary['reorder_candidates'] > 0) ? 'review' : (((int) ($inventorySummary['observed_demand_skus'] ?? 0)) > 0 ? 'ready' : 'no_evidence')),
        'primary_label' => 'Urgent', 'primary_value' => (string) $summary['urgent_inventory'],
        'secondary_label' => 'Reorder candidates', 'secondary_value' => (string) $summary['reorder_candidates'],
        'note' => !$inventory['available'] ? $inventory['error'] : 'Observed 30/90-day demand compared with live on-hand stock.',
        'route' => 'Inventory Intelligence',
    ];
    $domains[] = [
        'id' => 'suppliers', 'title' => 'Supplier performance',
        'status' => !$suppliers['available'] ? 'unavailable' : (($summary['supplier_exposure_percent'] > 50) ? 'review' : (((int) ($supplierSummary['evidence_suppliers'] ?? 0)) > 0 ? 'ready' : 'no_evidence')),
        'primary_label' => 'Evidence suppliers', 'primary_value' => (string) ((int) ($supplierSummary['evidence_suppliers'] ?? 0)),
        'secondary_label' => 'Top exposure', 'secondary_value' => $summary['supplier_exposure_percent'] . '%',
        'note' => !$suppliers['available'] ? $suppliers['error'] : 'Rolling 90-day controlled purchase and verified receipt evidence.',
        'route' => 'Supplier Analytics',
    ];

    $signals = [];
    $addSignal = static function (array &$target, string $id, string $level, string $title, string $note, string $route): void {
        $target[] = compact('id', 'level', 'title', 'note', 'route');
    };
    foreach ([$profit, $finance, $expenses, $inventory, $suppliers] as $domain) {
        if (!$domain['available']) $addSignal($signals, 'source-' . md5((string) $domain['name']), 'attention', $domain['name'] . ' needs attention', 'Its live evidence could not be loaded; other report domains remain available.', (string) $domain['name']);
    }
    if ((int) ($profitSummary['needs_cost'] ?? 0) > 0) $addSignal($signals, 'cost-evidence', 'attention', 'Profit is still provisional', (int) $profitSummary['needs_cost'] . ' delivered order(s) need confirmed direct-cost evidence.', 'Profitability Control');
    if ($summary['operating_profit'] !== null && (float) $summary['operating_profit'] < 0) $addSignal($signals, 'operating-loss', 'attention', 'Operating result is negative', reportsInsightsMoney(abs((float) $summary['operating_profit'])) . ' loss is visible for the selected period.', 'Profitability Control');
    if ($summary['outstanding_cod'] > 0) $addSignal($signals, 'cod-outstanding', 'watch', 'COD remains outstanding', reportsInsightsMoney($summary['outstanding_cod']) . ' has not reached human-confirmed settlement.', 'Finance Reconciliation');
    if ((int) ($financeSummary['issues'] ?? 0) > 0) $addSignal($signals, 'cod-issues', 'attention', 'Courier evidence needs review', (int) $financeSummary['issues'] . ' mismatch or returned record(s) need review.', 'Finance Reconciliation');
    if ((int) ($expenseSummary['awaiting_approval'] ?? 0) > 0) $addSignal($signals, 'expense-approval', 'watch', 'Expenses await approval', (int) $expenseSummary['awaiting_approval'] . ' operating expense draft(s) need a person to approve or reject them.', 'Expenses & Cost Management');
    if ($summary['urgent_inventory'] > 0) $addSignal($signals, 'inventory-urgent', 'attention', 'Inventory cover is urgent', $summary['urgent_inventory'] . ' SKU(s) are at or below the observed lead-time cover.', 'Inventory Intelligence');
    elseif ($summary['reorder_candidates'] > 0) $addSignal($signals, 'inventory-reorder', 'watch', 'Reorder evidence is available', $summary['reorder_candidates'] . ' SKU(s) have positive evidence-based reorder quantities.', 'Inventory Intelligence');
    if ($summary['supplier_exposure_percent'] > 50) $addSignal($signals, 'supplier-exposure', 'watch', 'Supplier concentration is high', $summary['supplier_exposure_percent'] . '% of rolling purchase spend belongs to the top supplier.', 'Supplier Analytics');
    if ($signals === []) $addSignal($signals, 'clear', 'clear', 'No management exception found', 'Available live evidence has no current warning for the selected period.', 'Reports & Insights');
    $summary['attention_count'] = count(array_filter($signals, static fn (array $signal): bool => $signal['level'] !== 'clear'));

    $profitOrders = [];
    if ($profit['available']) {
        foreach (array_slice($profit['data']['orders'] ?? [], 0, 100) as $order) {
            $profitOrders[] = [
                'id' => (string) ($order['id'] ?? ''),
                'order_number' => (string) ($order['order_number'] ?? ''),
                'customer_name' => (string) ($order['customer_name'] ?? 'Guest Customer'),
                'revenue' => round((float) ($order['revenue'] ?? 0), 2),
                'direct_cost' => round((float) ($order['direct_cost'] ?? 0), 2),
                'contribution_profit' => isset($order['contribution_profit']) ? round((float) $order['contribution_profit'], 2) : null,
                'margin_percent' => isset($order['margin_percent']) ? round((float) $order['margin_percent'], 1) : null,
                'cost_state' => (string) ($order['cost_state'] ?? 'missing'),
            ];
        }
    }

    $unavailable = array_values(array_map(static fn (array $domain): string => (string) $domain['name'], array_filter([$profit, $finance, $expenses, $inventory, $suppliers], static fn (array $domain): bool => !$domain['available'])));
    return [
        'period' => $period,
        'summary' => $summary,
        'domains' => $domains,
        'signals' => $signals,
        'profit_orders' => $profitOrders,
        'quality' => [
            'mode' => 'read_only_consolidated_evidence',
            'available_domains' => $summary['available_domains'],
            'unavailable_domains' => $unavailable,
            'profit_state' => !$profit['available'] ? 'unavailable' : ((string) ($profit['data']['quality']['profit_state'] ?? 'needs_cost_evidence')),
        ],
        'methodology' => [
            'revenue' => 'Delivered order totals only. Ordered revenue is never presented as realized revenue.',
            'profit' => 'Confirmed direct costs, recorded marketing spend and approved or paid operating expenses only.',
            'inventory' => 'Observed confirmed-to-delivered order-item demand compared with live product stock.',
            'supplier' => 'Rolling 90-day non-cancelled controlled purchases and verified receipt movements.',
            'boundary' => 'Read-only consolidated evidence. No stock, order, supplier, finance, bank or marketing record is changed.',
        ],
        'generated_at' => date(DATE_ATOM),
    ];
}
