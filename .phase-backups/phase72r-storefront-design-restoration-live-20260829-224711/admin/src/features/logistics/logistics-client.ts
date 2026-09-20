import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type LogisticsOrderItemRecord = {
  id: string;
  product_brand: string | null;
  product_id: string | null;
  product_image: string | null;
  product_name: string;
  product_size: string | null;
  product_sku: string | null;
  quantity: number;
  variant_id: string | null;
  variant_name: string | null;
  variant_sku: string | null;
};

export type LogisticsOrderRecord = {
  area: string | null;
  courier_name: string | null;
  courier_note: string | null;
  courier_status: string | null;
  courier_tracking_id: string | null;
  created_at: string | null;
  customer_name: string;
  customer_phone: string;
  delivered_at: string | null;
  delivery_zone: string | null;
  district: string | null;
  due_amount: number;
  id: string;
  order_items: LogisticsOrderItemRecord[];
  order_number: string | null;
  order_status: string;
  packed_at: string | null;
  paid_amount: number;
  payment_status: string;
  returned_at: string | null;
  shipped_at: string | null;
  shipping_address: string | null;
  stock_deducted: boolean;
  stock_restored: boolean;
  total: number;
  updated_at: string | null;
};

type ApiLogisticsOrder = {
  city?: string | null;
  courier_status?: string | null;
  courier_tracking_id?: string | null;
  created_at?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  due_amount?: number | string | null;
  fulfillment_courier?: string | null;
  id?: string | number | null;
  order_id?: string | number | null;
  order_status?: string | null;
  paid_amount?: number | string | null;
  payment_status?: string | null;
  shipping_address?: string | null;
  total_amount?: number | string | null;
  updated_at?: string | null;
};

type ApiOrderItem = {
  image?: string | null;
  product_id?: number | string | null;
  product_name?: string | null;
  quantity?: number | string | null;
  sku?: string | null;
  thumbnail?: string | null;
  variant_id?: number | string | null;
  variant_name?: string | null;
  variant_sku?: string | null;
};

type ApiOrderDetailsResponse = {
  items?: ApiOrderItem[];
  message?: string;
  success?: boolean;
};

export const LOGISTICS_META_ENDPOINT = bnbApiUrl("get_logistics_meta.php");
export const ORDER_DETAILS_ENDPOINT = bnbApiUrl("get_order_details.php");
export const UPDATE_ORDER_STATUS_ENDPOINT = bnbApiUrl("update_order_status.php");
export const COURIER_BOOKING_ENDPOINT = bnbApiUrl("manage_courier_booking.php");
export const COURIER_STATUS_SYNC_ENDPOINT = bnbApiUrl("sync_courier_status.php");

function toNumber(value: string | number | null | undefined) {
  const numericValue = Number(value ?? 0);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function normalizeStatus(value: string | null | undefined, fallback: string) {
  const status = String(value ?? fallback).trim().toLowerCase();

  return status || fallback;
}

function normalizeOrderItem(orderId: string, item: ApiOrderItem, index: number): LogisticsOrderItemRecord {
  return {
    id: `${orderId}-${item.product_id ?? item.variant_id ?? index}`,
    product_brand: null,
    product_id:
      item.product_id === null || item.product_id === undefined
        ? null
        : String(item.product_id),
    product_image: item.image ?? item.thumbnail ?? null,
    product_name: item.product_name ?? "Unnamed Product",
    product_size: item.variant_name ?? null,
    product_sku: item.sku ?? null,
    quantity: toNumber(item.quantity),
    variant_id:
      item.variant_id === null || item.variant_id === undefined
        ? null
        : String(item.variant_id),
    variant_name: item.variant_name ?? null,
    variant_sku: item.variant_sku ?? null,
  };
}

export function normalizeLogisticsOrder(order: ApiLogisticsOrder): LogisticsOrderRecord {
  const id = String(order.order_id ?? order.id ?? "");
  const orderStatus = normalizeStatus(order.order_status, "pending");
  const courierStatus = normalizeStatus(order.courier_status, "not_sent");

  return {
    area: order.city ?? null,
    courier_name: order.fulfillment_courier ?? null,
    courier_note: null,
    courier_status: courierStatus,
    courier_tracking_id: order.courier_tracking_id ?? null,
    created_at: order.created_at ?? null,
    customer_name: order.customer_name ?? "Guest Customer",
    customer_phone: order.customer_phone ?? "Not available",
    delivered_at: orderStatus === "delivered" ? (order.updated_at ?? null) : null,
    delivery_zone: order.city ?? null,
    district: order.city ?? null,
    due_amount: toNumber(order.due_amount),
    id,
    order_items: [],
    order_number: id ? `BNB-${id.padStart(6, "0")}` : null,
    order_status: orderStatus,
    packed_at: ["packed", "shipped"].includes(orderStatus)
      ? (order.updated_at ?? null)
      : null,
    paid_amount: toNumber(order.paid_amount),
    payment_status: normalizeStatus(order.payment_status, "cod_pending"),
    returned_at: orderStatus === "returned" ? (order.updated_at ?? null) : null,
    shipped_at: orderStatus === "shipped" ? (order.updated_at ?? null) : null,
    shipping_address: order.shipping_address ?? null,
    stock_deducted: !["pending", "cancelled", "returned"].includes(orderStatus),
    stock_restored: ["cancelled", "returned"].includes(orderStatus),
    total: toNumber(order.total_amount),
    updated_at: order.updated_at ?? order.created_at ?? null,
  };
}

async function fetchOrderItems(orderId: string, signal?: AbortSignal): Promise<LogisticsOrderItemRecord[]> {
  if (!orderId) {
    return [];
  }

  const response = await fetch(`${ORDER_DETAILS_ENDPOINT}?id=${encodeURIComponent(orderId)}`, {
    cache: "no-store",
    headers: adminAuthHeaders(),
    signal,
  });

  const payload = (await response.json().catch(() => null)) as ApiOrderDetailsResponse | null;

  if (!response.ok || !payload?.success) {
    return [];
  }

  return (payload.items ?? []).map((item, index) => normalizeOrderItem(orderId, item, index));
}

export async function fetchLogisticsOrders(signal?: AbortSignal) {
  const response = await fetch(LOGISTICS_META_ENDPOINT, {
    cache: "no-store",
    headers: adminAuthHeaders(),
    signal,
  });
  const payload = (await response.json()) as ApiLogisticsOrder[] | {
    message?: string;
    success?: boolean;
  };

  if (!response.ok || !Array.isArray(payload)) {
    throw new Error(
      !Array.isArray(payload) ? payload.message ?? "Logistics request failed." : "Logistics request failed.",
    );
  }

  const orders = payload.map(normalizeLogisticsOrder);
  const packableOrders = new Set(["confirmed", "processing", "packed", "shipped"]);

  return Promise.all(
    orders.map(async (order) => {
      if (!packableOrders.has(order.order_status)) {
        return order;
      }

      return {
        ...order,
        order_items: await fetchOrderItems(order.id, signal),
      };
    }),
  );
}

export async function updateOrderStatus(orderId: string, status: string) {
  const response = await fetch(UPDATE_ORDER_STATUS_ENDPOINT, {
    body: JSON.stringify({
      order_id: orderId,
      status,
    }),
    headers: adminAuthHeaders({
      "Content-Type": "application/json",
    }),
    method: "POST",
  });
  const payload = (await response.json().catch(() => null)) as {
    message?: string;
    success?: boolean;
  } | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? "Order status update failed.");
  }

  return payload;
}

export async function bookCourier(input: {
  codAmount: number;
  consignmentId?: string;
  deliveryFee?: number;
  orderId: string;
  provider: string;
  trackingCode?: string;
}) {
  const response = await fetch(COURIER_BOOKING_ENDPOINT, {
    body: JSON.stringify({
      cod_amount: input.codAmount,
      consignment_id: input.consignmentId ?? "",
      delivery_fee: input.deliveryFee ?? 0,
      order_id: input.orderId,
      provider: input.provider,
      tracking_code: input.trackingCode ?? "",
    }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  const payload = (await response.json().catch(() => null)) as {
    message?: string;
    success?: boolean;
  } | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? "Courier booking could not be saved.");
  }

  return payload;
}

export async function syncCourierStatus(input: {
  note?: string;
  orderId: string;
  status: "delivered" | "returned" | "in_transit";
}) {
  const response = await fetch(COURIER_STATUS_SYNC_ENDPOINT, {
    body: JSON.stringify({
      event_reference: `admin-${input.orderId}-${input.status}-${Date.now()}`,
      note: input.note ?? "",
      order_id: input.orderId,
      status: input.status,
    }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  const payload = (await response.json().catch(() => null)) as { message?: string; success?: boolean } | null;
  if (!response.ok || !payload?.success) throw new Error(payload?.message ?? "Courier status could not be synchronized.");
  return payload;
}

