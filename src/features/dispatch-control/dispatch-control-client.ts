import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type DispatchQueueOrder = {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  city: string;
  total_amount: number;
  order_status: string;
  packing_session_status: string | null;
  packing_completed_at: string | null;
  shipment_id: string | null;
  provider: string | null;
  consignment_id: string | null;
  tracking_code: string | null;
  booking_status: string | null;
  delivery_fee: number;
  cod_amount: number;
  clearance_status: "cleared" | "blocked" | "batched";
  block_reason: string | null;
  batch_id: string | null;
  batch_code: string | null;
  batch_status: string | null;
  updated_at: string | null;
};

export type DispatchBatch = {
  id: string | number;
  batch_code: string;
  provider: string;
  status: "draft" | "ready" | "partial" | "handed_over" | "closed";
  order_count: number;
  cod_total: number | string;
  created_by: string;
  created_at: string;
  handed_over_by: string | null;
  handed_over_at: string | null;
  acknowledgement_reference: string | null;
  note: string | null;
  handed_over_count: number | string;
  failed_count: number | string;
  pending_count: number | string;
};

export type DispatchData = {
  summary: {
    packed: number;
    cleared: number;
    blocked: number;
    batched: number;
    open_batches: number;
  };
  queue: DispatchQueueOrder[];
  batches: DispatchBatch[];
};

const ENDPOINT = bnbApiUrl("manage_dispatch_control.php");

async function request(
  method: "GET" | "POST",
  body?: Record<string, unknown>,
  signal?: AbortSignal,
) {
  const response = await fetch(ENDPOINT, {
    method,
    cache: "no-store",
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
    signal,
  });

  const payload = await response.json().catch(() => ({})) as {
    success?: boolean;
    message?: string;
    [key: string]: unknown;
  };

  if (!response.ok && response.status !== 207) {
    throw new Error(payload.message || "Dispatch request failed.");
  }
  if (payload.success === false) {
    throw new Error(payload.message || "Dispatch request failed.");
  }

  return payload;
}

export async function loadDispatchControl(signal?: AbortSignal): Promise<DispatchData> {
  return await request("GET", undefined, signal) as unknown as DispatchData;
}

export async function createDispatchBatch(provider: string, orderIds: string[]) {
  return request("POST", {
    action: "create_batch",
    provider,
    order_ids: orderIds,
  });
}

export async function handoverDispatchBatch(
  batchId: string,
  acknowledgementReference = "",
) {
  return request("POST", {
    action: "handover_batch",
    batch_id: batchId,
    acknowledgement_reference: acknowledgementReference,
  });
}
