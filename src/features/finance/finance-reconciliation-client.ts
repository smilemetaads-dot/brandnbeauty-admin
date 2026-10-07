import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type FinanceReconciliationStatus =
  | "pending"
  | "collected"
  | "settled"
  | "mismatch"
  | "returned";

export type FinanceReconciliationPeriod = "Today" | "7D" | "30D" | "90D";

export type FinanceReconciliationSummary = {
  records: number;
  expected: number;
  collected: number;
  deductions: number;
  net_expected: number;
  settled: number;
  outstanding: number;
  issues: number;
  unposted_settlements: number;
};

export type FinanceReconciliationRecord = {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string | null;
  total_amount: number;
  order_status: string;
  order_created_at: string | null;
  provider: string;
  tracking_code: string | null;
  consignment_id: string | null;
  courier_shipment_id: string | null;
  delivery_fee: number;
  expected_amount: number;
  collected_amount: number;
  courier_deduction_amount: number;
  other_deduction_amount: number;
  deduction_total: number;
  net_expected_amount: number;
  settled_amount: number;
  outstanding_amount: number;
  difference: number;
  status: FinanceReconciliationStatus;
  settlement_reference: string | null;
  settlement_date: string | null;
  finance_transaction_id: string | null;
  cash_posted: boolean;
  settlement_account_name: string | null;
  legacy_unposted_settlement: boolean;
  note: string | null;
  settled_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type FinanceReconciliationData = {
  success: boolean;
  module: string;
  message?: string;
  generated_at: string;
  period: {
    key: FinanceReconciliationPeriod;
    from: string;
    to: string;
  };
  summary: FinanceReconciliationSummary;
  records: FinanceReconciliationRecord[];
  rules?: Record<string, boolean>;
};

const ENDPOINT = bnbApiUrl("manage_finance_reconciliation.php");

function normalizeRecord(
  row: Partial<FinanceReconciliationRecord>,
): FinanceReconciliationRecord {
  const number = (value: unknown) => Number(value ?? 0) || 0;
  const text = (value: unknown, fallback = "") =>
    String(value ?? fallback);

  return {
    id: text(row.id),
    order_id: text(row.order_id),
    customer_name: text(row.customer_name, "Guest Customer"),
    customer_phone: row.customer_phone ?? null,
    total_amount: number(row.total_amount),
    order_status: text(row.order_status, "unknown"),
    order_created_at: row.order_created_at ?? null,
    provider: text(row.provider, "Manual"),
    tracking_code: row.tracking_code ?? null,
    consignment_id: row.consignment_id ?? null,
    courier_shipment_id: row.courier_shipment_id ?? null,
    delivery_fee: number(row.delivery_fee),
    expected_amount: number(row.expected_amount),
    collected_amount: number(row.collected_amount),
    courier_deduction_amount: number(row.courier_deduction_amount),
    other_deduction_amount: number(row.other_deduction_amount),
    deduction_total: number(row.deduction_total),
    net_expected_amount: number(row.net_expected_amount),
    settled_amount: number(row.settled_amount),
    outstanding_amount: number(row.outstanding_amount),
    difference: number(row.difference),
    status: (row.status ?? "pending") as FinanceReconciliationStatus,
    settlement_reference: row.settlement_reference ?? null,
    settlement_date: row.settlement_date ?? null,
    finance_transaction_id: row.finance_transaction_id ?? null,
    cash_posted: Boolean(row.cash_posted),
    settlement_account_name: row.settlement_account_name ?? null,
    legacy_unposted_settlement: Boolean(row.legacy_unposted_settlement),
    note: row.note ?? null,
    settled_at: row.settled_at ?? null,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  };
}

function normalizeData(payload: FinanceReconciliationData) {
  return {
    ...payload,
    records: Array.isArray(payload.records)
      ? payload.records.map((row) => normalizeRecord(row))
      : [],
  };
}

export async function fetchFinanceReconciliation(
  period: FinanceReconciliationPeriod,
  signal?: AbortSignal,
): Promise<FinanceReconciliationData> {
  const response = await fetch(
    `${ENDPOINT}?period=${encodeURIComponent(period)}`,
    {
      cache: "no-store",
      headers: adminAuthHeaders(),
      signal,
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | FinanceReconciliationData
    | null;

  if (!response.ok || !payload?.success) {
    throw new Error(
      payload?.message ?? "Finance reconciliation could not be loaded.",
    );
  }

  return normalizeData(payload);
}

export async function saveFinanceReconciliation(input: {
  orderId: string;
  period: FinanceReconciliationPeriod;
  collectedAmount: number;
  courierDeductionAmount: number;
  otherDeductionAmount: number;
  settledAmount: number;
  settlementReference: string;
  settlementDate: string;
  note: string;
}): Promise<FinanceReconciliationData> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      action: "save_reconciliation",
      confirmed: true,
      order_id: input.orderId,
      period: input.period,
      collected_amount: input.collectedAmount,
      courier_deduction_amount: input.courierDeductionAmount,
      other_deduction_amount: input.otherDeductionAmount,
      settled_amount: input.settledAmount,
      settlement_reference: input.settlementReference,
      settlement_date: input.settlementDate,
      note: input.note,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | FinanceReconciliationData
    | null;

  if (!response.ok || !payload?.success) {
    throw new Error(
      payload?.message ?? "Finance reconciliation could not be saved.",
    );
  }

  return normalizeData(payload);
}
