"use server";

import { revalidatePath } from "next/cache";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type MarkCourierSentActionState = {
  ok: boolean;
  message: string;
};

export type MarkDeliveredCodPaidActionState = {
  ok: boolean;
  message: string;
};

type CourierOrderStatusRow = {
  order_status: string;
  shipped_at: string | null;
};

type DeliveredCodPaidOrderRow = {
  delivered_at: string | null;
  order_status: string;
  total: number;
};

type CourierSentUpdatePayload = {
  courier_name: string;
  courier_note: string | null;
  courier_status?: "sent";
  courier_tracking_id: string | null;
  order_status?: "shipped";
  shipped_at?: string;
};

type DeliveredCodPaidUpdatePayload = {
  courier_status: "delivered";
  delivered_at?: string;
  due_amount: number;
  order_status: "delivered";
  paid_amount: number;
  payment_status: "paid";
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function revalidateCourierPaths() {
  revalidatePath("/courier");
  revalidatePath("/orders");
  revalidatePath("/orders/details");
  revalidatePath("/packing");
}

function revalidateDeliveredCodPaidPaths() {
  revalidatePath("/courier");
  revalidatePath("/orders");
  revalidatePath("/orders/details");
  revalidatePath("/inventory");
  revalidatePath("/products");
}

export async function markCourierSent(
  _previousState: MarkCourierSentActionState,
  formData: FormData,
): Promise<MarkCourierSentActionState> {
  const orderId = getString(formData, "orderId");
  const courierName = getString(formData, "courierName");
  const trackingId = getString(formData, "trackingId");
  const courierNote = getString(formData, "courierNote");

  if (!orderId) {
    return { ok: false, message: "Order is required." };
  }

  if (!courierName) {
    return { ok: false, message: "Courier name is required." };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data: order, error: loadError } = await supabase
      .from("orders")
      .select("order_status, shipped_at")
      .eq("id", orderId)
      .maybeSingle<CourierOrderStatusRow>();

    if (loadError || !order) {
      console.error("Failed to load courier order.", loadError);

      return {
        ok: false,
        message: "Order could not be loaded. Try again.",
      };
    }

    if (order.order_status !== "packed" && order.order_status !== "shipped") {
      return {
        ok: false,
        message: "Only packed orders can be sent to courier.",
      };
    }

    const payload: CourierSentUpdatePayload = {
      courier_name: courierName,
      courier_tracking_id: trackingId || null,
      courier_note: courierNote || null,
    };

    if (order.order_status === "packed") {
      payload.order_status = "shipped";
      payload.courier_status = "sent";

      if (!order.shipped_at) {
        payload.shipped_at = new Date().toISOString();
      }
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(payload)
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to mark courier sent.", updateError);

      return {
        ok: false,
        message: "Order could not be marked sent to courier. Try again.",
      };
    }

    revalidateCourierPaths();

    if (order.order_status === "shipped") {
      return { ok: true, message: "Courier info updated." };
    }

    return { ok: true, message: "Order marked as sent to courier." };
  } catch (error) {
    console.error("Failed to mark courier sent.", error);

    return {
      ok: false,
      message:
        "Order could not be marked sent to courier right now. Try again shortly.",
    };
  }
}

export async function markOrderDeliveredCodPaid(
  _previousState: MarkDeliveredCodPaidActionState,
  formData: FormData,
): Promise<MarkDeliveredCodPaidActionState> {
  const orderId = getString(formData, "orderId");

  if (!orderId) {
    return { ok: false, message: "Order is required." };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data: order, error: loadError } = await supabase
      .from("orders")
      .select("order_status, total, delivered_at")
      .eq("id", orderId)
      .maybeSingle<DeliveredCodPaidOrderRow>();

    if (loadError || !order) {
      console.error("Failed to load delivery order.", loadError);

      return {
        ok: false,
        message: "Order could not be loaded. Try again.",
      };
    }

    if (order.order_status === "delivered") {
      return { ok: true, message: "Order already delivered." };
    }

    if (order.order_status !== "shipped") {
      return {
        ok: false,
        message: "Only shipped orders can be marked delivered.",
      };
    }

    const payload: DeliveredCodPaidUpdatePayload = {
      order_status: "delivered",
      courier_status: "delivered",
      payment_status: "paid",
      paid_amount: order.total,
      due_amount: 0,
    };

    if (!order.delivered_at) {
      payload.delivered_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(payload)
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to mark order delivered and COD paid.", updateError);

      return {
        ok: false,
        message:
          "Order could not be marked delivered and COD paid. Try again.",
      };
    }

    revalidateDeliveredCodPaidPaths();

    return { ok: true, message: "Order marked delivered and COD paid." };
  } catch (error) {
    console.error("Failed to mark order delivered and COD paid.", error);

    return {
      ok: false,
      message:
        "Order could not be marked delivered and COD paid right now. Try again shortly.",
    };
  }
}
