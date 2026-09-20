<?php

declare(strict_types=1);

require_once __DIR__ . '/product_catalog_schema.php';

function expenseManagementText(mixed $value, int $limit = 500): string
{
    $text = trim(is_scalar($value) ? (string) $value : '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function expenseManagementCategories(): array
{
    return ['salary', 'rent', 'utilities', 'software', 'professional_fees', 'office', 'packaging', 'courier', 'content', 'other'];
}

function ensureExpenseManagementSchema(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS operating_expenses (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        expense_date DATE NOT NULL,
        category VARCHAR(80) NOT NULL,
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        payment_method VARCHAR(50) NULL,
        reference VARCHAR(191) NULL,
        note TEXT NULL,
        vendor VARCHAR(191) NULL,
        cost_center VARCHAR(100) NULL,
        status ENUM('draft','submitted','approved','paid','rejected') NOT NULL DEFAULT 'draft',
        payment_status ENUM('unpaid','paid') NOT NULL DEFAULT 'unpaid',
        payment_reference VARCHAR(191) NULL,
        approval_note TEXT NULL,
        approved_at DATETIME NULL,
        paid_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_operating_expenses_date (expense_date),
        KEY idx_operating_expenses_status_date (status, expense_date),
        KEY idx_operating_expenses_category_date (category, expense_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $columns = array_map(static fn (array $row): string => (string) ($row['Field'] ?? ''), catalogColumns($pdo, 'operating_expenses'));
    $hadStatus = in_array('status', $columns, true);
    $additions = [
        'vendor' => 'VARCHAR(191) NULL',
        'cost_center' => 'VARCHAR(100) NULL',
        'status' => "ENUM('draft','submitted','approved','paid','rejected') NOT NULL DEFAULT 'draft'",
        'payment_status' => "ENUM('unpaid','paid') NOT NULL DEFAULT 'unpaid'",
        'payment_reference' => 'VARCHAR(191) NULL',
        'approval_note' => 'TEXT NULL',
        'approved_at' => 'DATETIME NULL',
        'paid_at' => 'DATETIME NULL',
        'created_at' => 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
        'updated_at' => 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    ];
    foreach ($additions as $column => $definition) {
        if (!in_array($column, $columns, true)) $pdo->exec('ALTER TABLE operating_expenses ADD COLUMN ' . catalogIdentifier($column) . ' ' . $definition);
    }
    if (!$hadStatus) $pdo->exec("UPDATE operating_expenses SET status='approved' WHERE status='draft'");

    $pdo->exec("CREATE TABLE IF NOT EXISTS finance_expense_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        expense_id BIGINT UNSIGNED NOT NULL,
        action_name VARCHAR(60) NOT NULL,
        before_payload LONGTEXT NULL,
        after_payload LONGTEXT NOT NULL,
        reason VARCHAR(1000) NOT NULL,
        actor VARCHAR(191) NOT NULL DEFAULT 'Admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_finance_expense_events_record (expense_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function expenseManagementPeriod(mixed $value): array
{
    $key = strtoupper(expenseManagementText($value, 10));
    $options = ['TODAY' => 0, '7D' => 6, '30D' => 29, '90D' => 89];
    if (!array_key_exists($key, $options)) $key = '30D';
    return ['key' => $key === 'TODAY' ? 'Today' : $key, 'from' => date('Y-m-d', strtotime('-' . $options[$key] . ' days')), 'to' => date('Y-m-d')];
}

function expenseManagementState(PDO $pdo, mixed $requestedPeriod): array
{
    ensureExpenseManagementSchema($pdo);
    $period = expenseManagementPeriod($requestedPeriod);
    $statement = $pdo->prepare("SELECT id,expense_date,category,description,amount,payment_method,reference,note,vendor,cost_center,status,payment_status,payment_reference,approval_note,approved_at,paid_at,created_at,updated_at FROM operating_expenses WHERE expense_date BETWEEN :date_from AND :date_to ORDER BY expense_date DESC,id DESC LIMIT 1000");
    $statement->execute([':date_from' => $period['from'], ':date_to' => $period['to']]);
    $records = [];
    $validStatuses = ['draft', 'submitted', 'approved', 'paid', 'rejected'];
    foreach (($statement->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) {
        $status = strtolower((string) ($row['status'] ?? 'draft'));
        if (!in_array($status, $validStatuses, true)) $status = 'draft';
        $records[] = [
            'id' => (string) $row['id'],
            'expense_date' => (string) $row['expense_date'],
            'category' => expenseManagementText($row['category'] ?? 'other', 80) ?: 'other',
            'description' => expenseManagementText($row['description'] ?? '', 255),
            'amount' => round(max(0, (float) ($row['amount'] ?? 0)), 2),
            'payment_method' => expenseManagementText($row['payment_method'] ?? '', 50) ?: null,
            'reference' => expenseManagementText($row['reference'] ?? '', 191) ?: null,
            'note' => expenseManagementText($row['note'] ?? '', 1000) ?: null,
            'vendor' => expenseManagementText($row['vendor'] ?? '', 191) ?: null,
            'cost_center' => expenseManagementText($row['cost_center'] ?? '', 100) ?: null,
            'status' => $status,
            'payment_status' => strtolower((string) ($row['payment_status'] ?? 'unpaid')) === 'paid' ? 'paid' : 'unpaid',
            'payment_reference' => expenseManagementText($row['payment_reference'] ?? '', 191) ?: null,
            'approval_note' => expenseManagementText($row['approval_note'] ?? '', 1000) ?: null,
            'approved_at' => $row['approved_at'] ?? null,
            'paid_at' => $row['paid_at'] ?? null,
            'created_at' => $row['created_at'] ?? null,
            'updated_at' => $row['updated_at'] ?? null,
        ];
    }
    $summary = ['records' => count($records), 'approved_cost' => 0.0, 'paid' => 0.0, 'drafts' => 0, 'awaiting_approval' => 0, 'approved_unpaid' => 0, 'rejected' => 0];
    $categoryTotals = [];
    foreach ($records as $record) {
        if (in_array($record['status'], ['approved', 'paid'], true)) {
            $summary['approved_cost'] += $record['amount'];
            $categoryTotals[$record['category']] = ($categoryTotals[$record['category']] ?? 0) + $record['amount'];
        }
        if ($record['status'] === 'paid') $summary['paid'] += $record['amount'];
        if ($record['status'] === 'draft') $summary['drafts']++;
        if ($record['status'] === 'submitted') $summary['awaiting_approval']++;
        if ($record['status'] === 'approved') $summary['approved_unpaid']++;
        if ($record['status'] === 'rejected') $summary['rejected']++;
    }
    $summary['approved_cost'] = round($summary['approved_cost'], 2);
    $summary['paid'] = round($summary['paid'], 2);
    foreach ($categoryTotals as $category => $total) $categoryTotals[$category] = round($total, 2);
    arsort($categoryTotals);
    return ['period' => $period, 'summary' => $summary, 'category_totals' => $categoryTotals, 'categories' => expenseManagementCategories(), 'records' => $records, 'generated_at' => date(DATE_ATOM)];
}

function expenseManagementEvent(PDO $pdo, int $expenseId, string $action, ?array $before, array $after, string $reason): void
{
    $statement = $pdo->prepare("INSERT INTO finance_expense_events (expense_id,action_name,before_payload,after_payload,reason,actor) VALUES (:expense_id,:action_name,:before_payload,:after_payload,:reason,'Admin')");
    $statement->execute([
        ':expense_id' => $expenseId,
        ':action_name' => $action,
        ':before_payload' => $before ? json_encode($before, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : null,
        ':after_payload' => json_encode($after, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        ':reason' => $reason,
    ]);
}
