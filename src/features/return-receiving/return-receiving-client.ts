import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type ReturnItem = {
  order_item_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  inventory_mode: string;
};

export type ReturnOrder = {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  courier_name: string | null;
  courier_status: string | null;
  courier_tracking_id: string | null;
  order_updated_at: string | null;
  receipt_id: string | null;
  receipt_status: string;
  received_at: string | null;
  inspected_at: string | null;
  inspection_note: string | null;
  restocked_units: number;
  non_restock_units: number;
  items: ReturnItem[];
};

export type ReturnReceivingData = {
  summary: {
    returned_orders: number;
    pending_receiving: number;
    completed_receipts: number;
    restocked_units: number;
    non_restock_units: number;
  };
  returns: ReturnOrder[];
};

const ENDPOINT = bnbApiUrl("manage_return_receiving.php");

export async function loadReturnReceiving(signal?: AbortSignal): Promise<ReturnReceivingData> {
  const response = await fetch(ENDPOINT, {
    cache: "no-store",
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    signal,
  });
  const payload = await response.json().catch(() => ({})) as ReturnReceivingData & { success?: boolean; message?: string };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Return Receiving could not be loaded.");
  return payload;
}

export async function completeReturnReceiving(input: {
  orderId: string;
  inspectionNote: string;
  items: Array<{
    orderItemId: string;
    receivedQuantity: number;
    disposition: string;
    note: string;
  }>;
}) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      action: "receive_return",
      order_id: input.orderId,
      inspection_note: input.inspectionNote,
      items: input.items.map((item) => ({
        order_item_id: item.orderItemId,
        received_quantity: item.receivedQuantity,
        disposition: item.disposition,
        note: item.note,
      })),
    }),
  });
  const payload = await response.json().catch(() => ({})) as {
    success?: boolean;
    message?: string;
    restocked_units?: number;
    non_restock_units?: number;
  };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Return Receiving could not be completed.");
  return payload;
}
