import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type FinanceReconciliationPeriod = "Today" | "7D" | "30D" | "90D";
export type FinanceReconciliationStatus = "pending" | "collected" | "settled" | "mismatch" | "returned";

export type FinanceReconciliationRecord = {
  collected_amount: number;
  consignment_id: string | null;
  courier_shipment_id: string | null;
  created_at: string | null;
  customer_name: string;
  customer_phone: string | null;
  delivery_fee: number;
  difference: number;
  expected_amount: number;
  id: string;
  note: string | null;
  order_created_at: string | null;
  order_id: string;
  order_status: string;
  outstanding_amount: number;
  provider: string;
  settled_amount: number;
  settled_at: string | null;
  settlement_reference: string | null;
  status: FinanceReconciliationStatus;
  total_amount: number;
  tracking_code: string | null;
  updated_at: string | null;
};

export type FinanceReconciliationState = {
  generated_at: string;
  period: { from: string; key: FinanceReconciliationPeriod; to: string };
  records: FinanceReconciliationRecord[];
  summary: { collected: number; expected: number; issues: number; outstanding: number; records: number; settled: number };
};

type FinanceResponse = Partial<FinanceReconciliationState> & { message?: string; success?: boolean };
const ENDPOINT = bnbApiUrl("manage_finance_reconciliation.php");

const emptyState = (period: FinanceReconciliationPeriod): FinanceReconciliationState => ({
  generated_at: new Date(0).toISOString(),
  period: { from: "", key: period, to: "" },
  records: [],
  summary: { collected: 0, expected: 0, issues: 0, outstanding: 0, records: 0, settled: 0 },
});

function normalize(payload: FinanceResponse, period: FinanceReconciliationPeriod): FinanceReconciliationState {
  const fallback = emptyState(period);
  return {
    generated_at: String(payload.generated_at ?? fallback.generated_at),
    period: payload.period ?? fallback.period,
    records: Array.isArray(payload.records) ? payload.records : [],
    summary: payload.summary ?? fallback.summary,
  };
}

export async function fetchFinanceReconciliation(period: FinanceReconciliationPeriod, signal?: AbortSignal) {
  const response = await fetch(`${ENDPOINT}?period=${encodeURIComponent(period)}`, { cache: "no-store", headers: adminAuthHeaders(), signal });
  const payload = (await response.json().catch(() => null)) as FinanceResponse | null;
  if (!response.ok || !payload?.success) throw new Error(payload?.message ?? "Finance reconciliation could not be loaded.");
  return normalize(payload, period);
}

export async function saveFinanceReconciliation(input: {
  collectedAmount: number;
  confirmed: boolean;
  note: string;
  orderId: string;
  period: FinanceReconciliationPeriod;
  settledAmount: number;
  settlementReference: string;
}) {
  const response = await fetch(`${ENDPOINT}?period=${encodeURIComponent(input.period)}`, {
    body: JSON.stringify({
      action: "save_reconciliation",
      collected_amount: input.collectedAmount,
      confirmed: input.confirmed,
      note: input.note,
      order_id: input.orderId,
      period: input.period,
      settled_amount: input.settledAmount,
      settlement_reference: input.settlementReference,
    }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  const payload = (await response.json().catch(() => null)) as FinanceResponse | null;
  if (!response.ok || !payload?.success) throw new Error(payload?.message ?? "Reconciliation evidence could not be saved.");
  return { message: payload.message ?? "Reconciliation evidence saved.", state: normalize(payload, input.period) };
}

