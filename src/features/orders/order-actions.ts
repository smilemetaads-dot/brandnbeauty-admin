"use server";

import { revalidatePath } from "next/cache";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type OrderStatusActionState = {
  ok: boolean;
  message: string;
};

const ORDER_STATUSES = [
  "new",
  "confirmed",
  "processing",
  "ready_to_pack",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

const PAYMENT_STATUSES = [
  "cod_pending",
  "partial_paid",
  "paid",
  "refunded",
  "failed",
] as const;

const COURIER_STATUSES = [
  "not_sent",
  "ready",
  "sent",
  "delivered",
  "returned",
  "failed",
] as const;

const STOCK_DEDUCTION_ORDER_STATUSES = [
  "confirmed",
  "processing",
  "ready_to_pack",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
type CourierStatus = (typeof COURIER_STATUSES)[number];

type OrderTimestampRow = {
  confirmed_at: string | null;
  packed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  returned_at: string | null;
  cancelled_at: string | null;
};

type OrderStatusUpdatePayload = {
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  courier_status: CourierStatus;
  confirmed_at?: string;
  packed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  returned_at?: string;
  cancelled_at?: string;
};

type StockDeductionResult = {
  ok?: boolean;
  message?: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

function isPaymentStatus(value: string): value is PaymentStatus {
  return PAYMENT_STATUSES.includes(value as PaymentStatus);
}

function isCourierStatus(value: string): value is CourierStatus {
  return COURIER_STATUSES.includes(value as CourierStatus);
}

function shouldDeductStock(orderStatus: OrderStatus) {
  return STOCK_DEDUCTION_ORDER_STATUSES.includes(
    orderStatus as (typeof STOCK_DEDUCTION_ORDER_STATUSES)[number],
  );
}

function getSafeStockDeductionErrorMessage(errorMessage: string | undefined) {
  if (!errorMessage) {
    return "Stock deduction could not be completed.";
  }

  if (errorMessage.includes("Insufficient stock")) {
    return errorMessage;
  }

  if (
    errorMessage === "Order not found." ||
    errorMessage === "Order has no items to deduct." ||
    errorMessage ===
      "Every order item must have a product before stock can be deducted." ||
    errorMessage === "One or more order products could not be found."
  ) {
    return errorMessage;
  }

  return "Stock deduction could not be completed.";
}

function getStockDeductionMessage(data: StockDeductionResult | null) {
  if (data?.message === "Stock already deducted.") {
    return "Stock already deducted.";
  }

  return "Stock deducted successfully.";
}

function revalidateOrderStatusPaths() {
  revalidatePath("/orders");
  revalidatePath("/orders/details");
  revalidatePath("/inventory");
  revalidatePath("/products");
}

function addStatusTimestamp(
  payload: OrderStatusUpdatePayload,
  timestamps: OrderTimestampRow,
  orderStatus: OrderStatus,
) {
  const now = new Date().toISOString();

  if (orderStatus === "confirmed" && !timestamps.confirmed_at) {
    payload.confirmed_at = now;
  }

  if (orderStatus === "packed" && !timestamps.packed_at) {
    payload.packed_at = now;
  }

  if (orderStatus === "shipped" && !timestamps.shipped_at) {
    payload.shipped_at = now;
  }

  if (orderStatus === "delivered" && !timestamps.delivered_at) {
    payload.delivered_at = now;
  }

  if (orderStatus === "returned" && !timestamps.returned_at) {
    payload.returned_at = now;
  }

  if (orderStatus === "cancelled" && !timestamps.cancelled_at) {
    payload.cancelled_at = now;
  }
}

export async function updateOrderStatuses(
  _previousState: OrderStatusActionState,
  formData: FormData,
): Promise<OrderStatusActionState> {
  const orderId = getString(formData, "orderId");
  const orderStatus = getString(formData, "orderStatus");
  const paymentStatus = getString(formData, "paymentStatus");
  const courierStatus = getString(formData, "courierStatus");

  if (!orderId) {
    return { ok: false, message: "Order is required." };
  }

  if (!isOrderStatus(orderStatus)) {
    return { ok: false, message: "Choose a valid order status." };
  }

  if (!isPaymentStatus(paymentStatus)) {
    return { ok: false, message: "Choose a valid payment status." };
  }

  if (!isCourierStatus(courierStatus)) {
    return { ok: false, message: "Choose a valid courier status." };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data: timestamps, error: loadError } = await supabase
      .from("orders")
      .select(
        [
          "confirmed_at",
          "packed_at",
          "shipped_at",
          "delivered_at",
          "returned_at",
          "cancelled_at",
        ].join(", "),
      )
      .eq("id", orderId)
      .single<OrderTimestampRow>();

    if (loadError || !timestamps) {
      console.error("Failed to load order status timestamps.", loadError);

      return {
        ok: false,
        message: "Order could not be loaded. Try again.",
      };
    }

    const payload: OrderStatusUpdatePayload = {
      order_status: orderStatus,
      payment_status: paymentStatus,
      courier_status: courierStatus,
    };

    addStatusTimestamp(payload, timestamps, orderStatus);

    const { error: updateError } = await supabase
      .from("orders")
      .update(payload)
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order statuses.", updateError);

      return {
        ok: false,
        message: "Order status could not be updated. Try again.",
      };
    }

    if (shouldDeductStock(orderStatus)) {
      const { data: stockResult, error: stockError } = await supabase.rpc(
        "deduct_order_stock",
        { p_order_id: orderId },
      );

      revalidateOrderStatusPaths();

      if (stockError) {
        console.error("Failed to deduct order stock.", stockError);

        const safeMessage = getSafeStockDeductionErrorMessage(
          stockError.message,
        );

        return {
          ok: false,
          message: `Order status updated, but stock deduction failed: ${safeMessage}`,
        };
      }

      return {
        ok: true,
        message: `Order status updated successfully. ${getStockDeductionMessage(
          stockResult as StockDeductionResult | null,
        )}`,
      };
    }

    revalidateOrderStatusPaths();

    return { ok: true, message: "Order status updated successfully." };
  } catch (error) {
    console.error("Failed to update order statuses.", error);

    return {
      ok: false,
      message: "Order status could not be updated right now. Try again shortly.",
    };
  }
}
