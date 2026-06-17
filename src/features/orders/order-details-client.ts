export type OrderItemRecord = {
  created_at: string | null;
  id: string;
  order_id: string;
  product_brand: string | null;
  product_id: string | null;
  product_name: string;
  product_size: string | null;
  product_sku: string | null;
  product_slug: string | null;
  quantity: number;
  total_price: number;
  unit_price: number;
};

export type OrderDetailsRecord = {
  area: string | null;
  cancelled_at: string | null;
  confirmed_at: string | null;
  courier_name: string | null;
  courier_note: string | null;
  courier_status: string | null;
  courier_tracking_id: string | null;
  created_at: string | null;
  customer_address: string | null;
  customer_email: string | null;
  customer_name: string;
  customer_phone: string;
  delivered_at: string | null;
  delivery_charge: number;
  delivery_zone: string | null;
  discount: number;
  district: string | null;
  due_amount: number;
  id: string;
  note: string | null;
  order_items: OrderItemRecord[];
  order_number: string | null;
  order_status: string;
  packed_at: string | null;
  paid_amount: number;
  payment_status: string;
  returned_at: string | null;
  shipped_at: string | null;
  source: string | null;
  stock_deducted: boolean;
  stock_deducted_at: string | null;
  stock_restored: boolean;
  stock_restored_at: string | null;
  subtotal: number;
  total: number;
  updated_at: string | null;
};

type ApiOrder = {
  city?: string | null;
  created_at?: string | null;
  customer_email?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  delivery_charge?: number | string | null;
  id?: number | string | null;
  order_id?: number | string | null;
  order_note?: string | null;
  payment_status?: string | null;
  shipping_address?: string | null;
  status?: string | null;
  subtotal_amount?: number | string | null;
  total_amount?: number | string | null;
  updated_at?: string | null;
};

type ApiOrderItem = {
  image?: string | null;
  line_total?: number | string | null;
  price?: number | string | null;
  product_id?: number | string | null;
  product_name?: string | null;
  quantity?: number | string | null;
  sku?: string | null;
  thumbnail?: string | null;
};

type ApiOrderDetailsResponse = {
  items?: ApiOrderItem[];
  message?: string;
  order?: ApiOrder;
  success?: boolean;
};

export const ORDER_DETAILS_ENDPOINT =
  "http://localhost/BrandnBeauty/brandnbeauty-backend/php/get_order_details.php";

function toNumber(value: number | string | null | undefined) {
  const numericValue = Number(value ?? 0);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function normalizeStatus(value: string | null | undefined, fallback: string) {
  const status = String(value ?? fallback).trim().toLowerCase();

  return status || fallback;
}

function isPaymentComplete(paymentStatus: string) {
  return ["paid", "completed", "success", "successful"].includes(paymentStatus);
}

export function normalizeOrderDetails(
  payload: ApiOrderDetailsResponse,
): OrderDetailsRecord | null {
  if (!payload.success || !payload.order) {
    return null;
  }

  const apiOrder = payload.order;
  const id = String(apiOrder.order_id ?? apiOrder.id ?? "");
  const paymentStatus = normalizeStatus(
    apiOrder.payment_status,
    "cash_on_delivery",
  );
  const total = toNumber(apiOrder.total_amount);
  const subtotal = toNumber(apiOrder.subtotal_amount);
  const deliveryCharge = toNumber(apiOrder.delivery_charge);
  const paidAmount = isPaymentComplete(paymentStatus) ? total : 0;
  const dueAmount = Math.max(total - paidAmount, 0);

  return {
    area: apiOrder.city ?? null,
    cancelled_at: null,
    confirmed_at: null,
    courier_name: null,
    courier_note: null,
    courier_status: "not_sent",
    courier_tracking_id: null,
    created_at: apiOrder.created_at ?? null,
    customer_address: apiOrder.shipping_address ?? null,
    customer_email: apiOrder.customer_email ?? null,
    customer_name: apiOrder.customer_name ?? "Guest Customer",
    customer_phone: apiOrder.customer_phone ?? "Not available",
    delivered_at:
      apiOrder.status === "delivered" ? (apiOrder.updated_at ?? null) : null,
    delivery_charge: deliveryCharge,
    delivery_zone: apiOrder.city ?? null,
    discount: 0,
    district: apiOrder.city ?? null,
    due_amount: dueAmount,
    id,
    note: apiOrder.order_note ?? null,
    order_items: (payload.items ?? []).map((item, index) => {
      const quantity = toNumber(item.quantity);
      const unitPrice = toNumber(item.price);
      const lineTotal = toNumber(item.line_total) || unitPrice * quantity;

      return {
        created_at: null,
        id: `${id}-${item.product_id ?? index}`,
        order_id: id,
        product_brand: null,
        product_id:
          item.product_id === null || item.product_id === undefined
            ? null
            : String(item.product_id),
        product_name: item.product_name ?? "Unnamed Product",
        product_size: null,
        product_sku: item.sku ?? null,
        product_slug: null,
        quantity,
        total_price: lineTotal,
        unit_price: unitPrice,
      };
    }),
    order_number: id ? `BNB-${id.padStart(6, "0")}` : null,
    order_status: normalizeStatus(apiOrder.status, "pending"),
    packed_at: apiOrder.status === "packed" ? (apiOrder.updated_at ?? null) : null,
    paid_amount: paidAmount,
    payment_status: paymentStatus,
    returned_at:
      apiOrder.status === "returned" ? (apiOrder.updated_at ?? null) : null,
    shipped_at:
      apiOrder.status === "shipped" ? (apiOrder.updated_at ?? null) : null,
    source: "MySQL",
    stock_deducted: true,
    stock_deducted_at: apiOrder.created_at ?? null,
    stock_restored: ["cancelled", "returned"].includes(
      normalizeStatus(apiOrder.status, "pending"),
    ),
    stock_restored_at: ["cancelled", "returned"].includes(
      normalizeStatus(apiOrder.status, "pending"),
    )
      ? (apiOrder.updated_at ?? null)
      : null,
    subtotal,
    total,
    updated_at: apiOrder.updated_at ?? apiOrder.created_at ?? null,
  };
}

export async function fetchOrderDetails(
  orderId: string,
  signal?: AbortSignal,
): Promise<OrderDetailsRecord | null> {
  const response = await fetch(
    `${ORDER_DETAILS_ENDPOINT}?id=${encodeURIComponent(orderId)}`,
    {
      cache: "no-store",
      signal,
    },
  );

  if (response.status === 404) {
    return null;
  }

  const payload = (await response.json()) as ApiOrderDetailsResponse;

  if (!response.ok) {
    throw new Error(payload.message ?? "Order details request failed.");
  }

  return normalizeOrderDetails(payload);
}
