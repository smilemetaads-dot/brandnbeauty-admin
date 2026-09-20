import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type CodStatus = "pending" | "collected" | "settled" | "mismatch" | "returned";

export type CodRecord = {
  collected_amount: number;
  consignment_id: string | null;
  created_at: string | null;
  customer_name: string;
  customer_phone: string | null;
  delivery_fee: number;
  expected_amount: number;
  id: string;
  note: string | null;
  order_created_at: string | null;
  order_id: string;
  order_status: string;
  provider: string | null;
  settled_amount: number;
  settled_at: string | null;
  settlement_reference: string | null;
  status: CodStatus;
  total_amount: number;
  tracking_code: string | null;
  updated_at: string | null;
};

const ENDPOINT = bnbApiUrl("manage_cod_reconciliation.php");

function normalize(record: Record<string, unknown>): CodRecord {
  const money = (key: string) => Number(record[key] ?? 0) || 0;
  return {
    collected_amount: money("collected_amount"),
    consignment_id: (record.consignment_id as string | null) ?? null,
    created_at: (record.created_at as string | null) ?? null,
    customer_name: String(record.customer_name ?? "Guest Customer"),
    customer_phone: (record.customer_phone as string | null) ?? null,
    delivery_fee: money("delivery_fee"),
    expected_amount: money("expected_amount"),
    id: String(record.id ?? ""),
    note: (record.note as string | null) ?? null,
    order_created_at: (record.order_created_at as string | null) ?? null,
    order_id: String(record.order_id ?? ""),
    order_status: String(record.order_status ?? "unknown"),
    provider: (record.provider as string | null) ?? null,
    settled_amount: money("settled_amount"),
    settled_at: (record.settled_at as string | null) ?? null,
    settlement_reference: (record.settlement_reference as string | null) ?? null,
    status: String(record.status ?? "pending") as CodStatus,
    total_amount: money("total_amount"),
    tracking_code: (record.tracking_code as string | null) ?? null,
    updated_at: (record.updated_at as string | null) ?? null,
  };
}

export async function fetchCodRecords(signal?: AbortSignal): Promise<CodRecord[]> {
  const response = await fetch(ENDPOINT, { cache: "no-store", headers: adminAuthHeaders(), signal });
  const payload = await response.json().catch(() => null) as { message?: string; records?: Record<string, unknown>[]; success?: boolean } | null;
  if (!response.ok || !payload?.success) throw new Error(payload?.message ?? "COD records could not be loaded.");
  return (payload.records ?? []).map(normalize);
}

export async function updateCodRecord(input: {
  collectedAmount: number;
  note: string;
  recordId: string;
  settledAmount: number;
  settlementReference: string;
  status: CodStatus;
}) {
  const response = await fetch(ENDPOINT, {
    body: JSON.stringify({
      collected_amount: input.collectedAmount,
      note: input.note,
      record_id: input.recordId,
      settled_amount: input.settledAmount,
      settlement_reference: input.settlementReference,
      status: input.status,
    }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  const payload = await response.json().catch(() => null) as { message?: string; success?: boolean } | null;
  if (!response.ok || !payload?.success) throw new Error(payload?.message ?? "COD record could not be updated.");
  return payload;
}

