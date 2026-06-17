export type LogisticsOrderItemRecord = {
  id: string;
  product_brand: string | null;
  product_id: string | null;
  product_name: string;
  product_size: string | null;
  product_sku: string | null;
  quantity: number;
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

export const LOGISTICS_META_ENDPOINT =
  "http://localhost/BrandnBeauty/brandnbeauty-backend/php/get_logistics_meta.php";

function toNumber(value: string | number | null | undefined) {
  const numericValue = Number(value ?? 0);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function normalizeStatus(value: string | null | undefined, fallback: string) {
  const status = String(value ?? fallback).trim().toLowerCase();

  return status || fallback;
}

export function normalizeLogisticsOrder(
  order: ApiLogisticsOrder,
): LogisticsOrderRecord {
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
    packed_at: ["packed", "ready_to_ship", "shipped"].includes(orderStatus)
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

export async function fetchLogisticsOrders(signal?: AbortSignal) {
  const response = await fetch(LOGISTICS_META_ENDPOINT, {
    cache: "no-store",
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

  return payload.map(normalizeLogisticsOrder);
}
