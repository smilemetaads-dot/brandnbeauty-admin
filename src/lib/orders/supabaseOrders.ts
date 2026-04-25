import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminOrderRecord = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
};

export type AdminOrderItemRecord = {
  id: string;
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  imageUrl: string;
};

export type AdminOrderDetailsRecord = {
  order: AdminOrderRecord;
  items: AdminOrderItemRecord[];
};

export class OrderSaveError extends Error {
  constructor(
    message: string,
    readonly status = 500,
  ) {
    super(message);
    this.name = "OrderSaveError";
  }
}

type OrderRow = {
  id?: string | number | null;
  order_number?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  total?: number | string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  order_status?: string | null;
  stock_deducted?: boolean | null;
  stock_restored?: boolean | null;
  created_at?: string | null;
};

type OrderItemRow = {
  id?: string | number | null;
  product_id?: string | number | null;
  product_name?: string | null;
  sku?: string | null;
  unit_price?: number | string | null;
  quantity?: number | string | null;
  total_price?: number | string | null;
  image_url?: string | null;
};

const supportedOrderStatuses = [
  "new",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

export async function getOrdersFromSupabase(): Promise<AdminOrderRecord[]> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.warn("[admin-orders] Supabase service role config missing.");
    return [];
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_phone, total, payment_method, payment_status, order_status, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin-orders] Supabase orders query failed:", {
      table: "public.orders",
      code: error.code,
      message: error.message,
    });
    return [];
  }

  return (data ?? []).map(mapOrderRow);
}

export async function updateOrderStatusWithServiceRole(params: {
  id: string;
  orderStatus: string;
}): Promise<AdminOrderRecord> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new OrderSaveError("Supabase service role config is missing.");
  }

  const normalizedOrderStatus = normalizeSupportedOrderStatus(params.orderStatus);

  if (!normalizedOrderStatus) {
    throw new OrderSaveError("Order status is not supported.", 400);
  }

  if (
    normalizedOrderStatus === "cancelled" ||
    normalizedOrderStatus === "returned"
  ) {
    return restoreOrderStockAndUpdateStatus(
      supabase,
      params.id,
      normalizedOrderStatus,
    );
  }

  if (normalizedOrderStatus !== "confirmed") {
    return updateOrderStatusWithoutStockSync(supabase, params.id, normalizedOrderStatus);
  }

  await ensureOrderStockSyncReady(supabase);

  const rpcResult = await confirmOrderWithStockSync(supabase, params.id);

  if (rpcResult.error) {
    throw buildStockSyncError(rpcResult.error);
  }

  const orderRow = await getOrderRowById(supabase, params.id);

  if (!orderRow) {
    throw new OrderSaveError("This order could not be found for updating.", 404);
  }

  return mapOrderRow(orderRow);
}

export async function getOrderDetailsFromSupabase(params: {
  id?: string;
  orderNumber?: string;
}): Promise<AdminOrderDetailsRecord | null> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.warn("[admin-order-details] Supabase service role config missing.");
    return null;
  }

  let orderQuery = supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_phone, total, payment_method, payment_status, order_status, created_at",
    );

  if (params.id) {
    orderQuery = orderQuery.eq("id", params.id);
  } else if (params.orderNumber) {
    orderQuery = orderQuery.eq("order_number", params.orderNumber);
  } else {
    orderQuery = orderQuery.order("created_at", { ascending: false }).limit(1);
  }

  const { data: orderData, error: orderError } = await orderQuery.maybeSingle();

  if (orderError || !orderData) {
    if (orderError) {
      console.error("[admin-order-details] Supabase order details query failed:", {
        table: "public.orders",
        id: params.id ?? null,
        orderNumber: params.orderNumber ?? null,
        code: orderError.code,
        message: orderError.message,
      });
    }
    return null;
  }

  const { data: itemData, error: itemError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderData.id);

  if (itemError) {
    console.error("[admin-order-details] Supabase order items query failed:", {
      table: "public.order_items",
      orderId: orderData.id,
      code: itemError.code,
      message: itemError.message,
    });
    return null;
  }

  return {
    order: mapOrderRow(orderData),
    items: (itemData ?? []).map(mapOrderItemRow),
  };
}

function mapOrderRow(row: OrderRow): AdminOrderRecord {
  return {
    id: toText(row.id, ""),
    orderNumber: toText(row.order_number, "BNB-UNKNOWN"),
    customerName: toText(row.customer_name, "Unknown Customer"),
    customerPhone: toText(row.customer_phone, "N/A"),
    total: toNumber(row.total),
    paymentMethod: toPaymentMethod(row.payment_method),
    paymentStatus: toPaymentStatus(row.payment_status),
    orderStatus: toOrderStatus(row.order_status),
    createdAt: toText(row.created_at, ""),
  };
}

function mapOrderItemRow(row: OrderItemRow): AdminOrderItemRecord {
  const unitPrice = toNumber(row.unit_price);
  const quantity = toNumber(row.quantity);

  return {
    id: toText(row.id, ""),
    productId: toText(row.product_id, ""),
    name: toText(row.product_name, "Product"),
    sku: toText(row.sku, ""),
    unitPrice,
    quantity,
    totalPrice: toNumber(row.total_price) || unitPrice * quantity,
    imageUrl: toText(row.image_url, ""),
  };
}

async function ensureOrderStockSyncReady(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
) {
  const { error } = await supabase.from("orders").select("stock_deducted").limit(1);

  if (
    error &&
    (error.message.includes("stock_deducted") || error.code === "42703")
  ) {
    throw new OrderSaveError(
      "Order stock sync is not ready yet. Missing column `orders.stock_deducted`. Run the latest Supabase SQL migration.",
    );
  }
}

async function ensureOrderStockRestoreReady(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
) {
  const { error } = await supabase
    .from("orders")
    .select("stock_deducted, stock_restored")
    .limit(1);

  if (
    error &&
    (error.message.includes("stock_restored") || error.code === "42703")
  ) {
    throw new OrderSaveError(
      "Order stock restore is not ready yet. Missing column `orders.stock_restored`. Run the latest Supabase SQL migration.",
    );
  }
}

async function restoreOrderStockAndUpdateStatus(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  orderId: string,
  orderStatus: "cancelled" | "returned",
) {
  await ensureOrderStockRestoreReady(supabase);

  const numericOrderId = Number(orderId);

  if (!Number.isInteger(numericOrderId) || numericOrderId <= 0) {
    throw new OrderSaveError(
      "Order stock restore requires a numeric order id for `restore_order_stock(target_order_id bigint, restore_reason text)`.",
    );
  }

  const { error } = await supabase.rpc("restore_order_stock", {
    target_order_id: numericOrderId,
    restore_reason: orderStatus,
  });

  if (error) {
    if (error.message.includes("stock_restored") || error.code === "42703") {
      throw new OrderSaveError(
        "Order stock restore is not ready yet. Missing column `orders.stock_restored`. Run the latest Supabase SQL migration.",
      );
    }

    if (
      error.message.includes("Could not find the function") ||
      error.message.includes("restore_order_stock") ||
      error.code === "42883"
    ) {
      throw new OrderSaveError(
        "Order stock restore is not ready yet. Missing RPC function `restore_order_stock(target_order_id bigint, restore_reason text)`.",
      );
    }

    throw new OrderSaveError(error.message);
  }

  return updateOrderStatusWithoutStockSync(supabase, orderId, orderStatus);
}

async function confirmOrderWithStockSync(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  orderId: string,
) {
  const numericOrderId = Number(orderId);

  if (Number.isInteger(numericOrderId) && numericOrderId > 0) {
    const numericRpcResult = await supabase.rpc("confirm_order_and_deduct_stock", {
      target_order_id: numericOrderId,
    });

    if (!numericRpcResult.error) {
      return numericRpcResult;
    }

    if (!isMissingFunctionError(numericRpcResult.error)) {
      return numericRpcResult;
    }
  }

  return supabase.rpc("admin_update_order_status", {
    target_order_id: orderId,
    next_order_status: "confirmed",
  });
}

async function getOrderRowById(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  orderId: string,
): Promise<OrderRow | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_phone, total, payment_method, payment_status, order_status, created_at",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new OrderSaveError(error.message);
  }

  return data as OrderRow | null;
}

function buildStockSyncError(error: { message: string; code?: string | null }) {
  if (
    error.message.includes("stock_deducted") ||
    error.code === "42703"
  ) {
    return new OrderSaveError(
      "Order stock sync is not ready yet. Missing column `orders.stock_deducted`. Run the latest Supabase SQL migration.",
    );
  }

  if (isMissingFunctionError(error)) {
    return new OrderSaveError(
      "Order stock sync is not ready yet. Missing RPC function `confirm_order_and_deduct_stock(target_order_id bigint)` or legacy `admin_update_order_status(target_order_id uuid, next_order_status text)`.",
    );
  }

  return new OrderSaveError(error.message);
}

function isMissingFunctionError(error: { message: string; code?: string | null }) {
  return (
    error.message.includes("Could not find the function") ||
    error.message.includes("confirm_order_and_deduct_stock") ||
    error.message.includes("admin_update_order_status") ||
    error.code === "42883"
  );
}

async function updateOrderStatusWithoutStockSync(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  orderId: string,
  orderStatus: string,
) {
  const { data, error } = await supabase
    .from("orders")
    .update({ order_status: orderStatus })
    .eq("id", orderId)
    .select(
      "id, order_number, customer_name, customer_phone, total, payment_method, payment_status, order_status, created_at",
    )
    .maybeSingle();

  if (error) {
    throw new OrderSaveError(error.message);
  }

  if (!data) {
    throw new OrderSaveError("This order could not be found for updating.", 404);
  }

  return mapOrderRow(data);
}

function toText(value: unknown, fallback: string) {
  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

function toNumber(value: unknown) {
  const numericValue = Number(
    typeof value === "string" ? value.replace(/[^0-9.]/g, "") : value,
  );
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function toPaymentMethod(value: unknown) {
  const normalizedValue = toText(value, "").toLowerCase();

  if (normalizedValue === "bkash") {
    return "bKash";
  }

  if (normalizedValue === "cod" || !normalizedValue) {
    return "COD";
  }

  return toText(value, "COD");
}

function toPaymentStatus(value: unknown) {
  const normalizedValue = toText(value, "").toLowerCase();

  if (normalizedValue === "paid") {
    return "Paid";
  }

  if (normalizedValue === "verified") {
    return "Verified";
  }

  if (normalizedValue === "failed") {
    return "Failed";
  }

  if (normalizedValue === "pending" || !normalizedValue) {
    return "Pending";
  }

  return toTitleCase(normalizedValue);
}

function toOrderStatus(value: unknown) {
  const normalizedValue = toText(value, "").toLowerCase();

  if (!normalizedValue) {
    return "New";
  }

  return toTitleCase(normalizedValue);
}

function normalizeSupportedOrderStatus(value: string) {
  const normalizedValue = value.trim().toLowerCase();

  return supportedOrderStatuses.includes(
    normalizedValue as (typeof supportedOrderStatuses)[number],
  )
    ? normalizedValue
    : null;
}

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
