import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type PackingCheck = {
  is_checked: boolean;
  checked_at: string | null;
  note: string | null;
};

export type PackingItem = {
  order_item_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  sku: string | null;
  quantity: number;
  inventory_mode: string;
  verified_quantity: number;
  verified_at: string | null;
  note: string | null;
};

export type PackingOrder = {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  city: string;
  total_amount: number;
  order_status: string;
  order_note: string | null;
  created_at: string | null;
  updated_at: string | null;
  session: {
    id: string;
    status: string;
    verification_mode: string;
    started_by: string | null;
    started_at: string | null;
    slip_printed_at: string | null;
    verification_completed_at: string | null;
    completed_at: string | null;
    packing_note: string | null;
  } | null;
  items: PackingItem[];
  checks: Record<string, PackingCheck>;
  progress: {
    total_items: number;
    verified_items: number;
    expected_units: number;
    verified_units: number;
    total_checks: number;
    checked_checks: number;
  };
  ready_to_complete: boolean;
  legacy_packed_without_session: boolean;
};

export type PackingData = {
  summary: {
    confirmed: number;
    processing: number;
    ready: number;
    packed: number;
    legacy_packed_without_session: number;
  };
  orders: PackingOrder[];
  required_checks: string[];
};

const ENDPOINT = bnbApiUrl("manage_packing_sessions.php");

async function packingRequest(
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

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Packing request failed.");
  }

  return payload;
}

export async function loadPackingDesk(signal?: AbortSignal): Promise<PackingData> {
  return await packingRequest("GET", undefined, signal) as unknown as PackingData;
}

export async function startPacking(orderId: string) {
  return packingRequest("POST", { action: "start", order_id: orderId });
}

export async function markPackingSlipPrinted(orderId: string) {
  return packingRequest("POST", { action: "print_slip", order_id: orderId });
}

export async function verifyPackingItem(
  orderId: string,
  orderItemId: string,
  verified: boolean,
) {
  return packingRequest("POST", {
    action: "verify_item",
    order_id: orderId,
    order_item_id: orderItemId,
    verified,
  });
}

export async function togglePackingCheck(
  orderId: string,
  checkKey: string,
  checked: boolean,
) {
  return packingRequest("POST", {
    action: "toggle_check",
    order_id: orderId,
    check_key: checkKey,
    checked,
  });
}

export async function savePackingNote(orderId: string, packingNote: string) {
  return packingRequest("POST", {
    action: "save_note",
    order_id: orderId,
    packing_note: packingNote,
  });
}

export async function completePacking(orderId: string) {
  return packingRequest("POST", {
    action: "complete",
    order_id: orderId,
  });
}
