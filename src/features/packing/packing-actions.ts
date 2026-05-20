"use server";

import { revalidatePath } from "next/cache";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type MarkPackedActionState = {
  ok: boolean;
  message: string;
};

const PACKABLE_ORDER_STATUSES = [
  "confirmed",
  "processing",
  "ready_to_pack",
] as const;

type PackableOrderStatus = (typeof PACKABLE_ORDER_STATUSES)[number];

type PackingOrderStatusRow = {
  order_status: string;
  packed_at: string | null;
};

type PackingStatusUpdatePayload = {
  order_status: "packed";
  packed_at?: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function isPackableStatus(value: string): value is PackableOrderStatus {
  return PACKABLE_ORDER_STATUSES.includes(value as PackableOrderStatus);
}

export async function markOrderPacked(
  _previousState: MarkPackedActionState,
  formData: FormData,
): Promise<MarkPackedActionState> {
  const orderId = getString(formData, "orderId");

  if (!orderId) {
    return { ok: false, message: "Order is required." };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data: order, error: loadError } = await supabase
      .from("orders")
      .select("order_status, packed_at")
      .eq("id", orderId)
      .maybeSingle<PackingOrderStatusRow>();

    if (loadError || !order) {
      console.error("Failed to load packing order.", loadError);

      return {
        ok: false,
        message: "Order could not be loaded. Try again.",
      };
    }

    if (order.order_status === "packed") {
      return { ok: true, message: "Order already packed." };
    }

    if (!isPackableStatus(order.order_status)) {
      return {
        ok: false,
        message:
          "Only confirmed, processing, or ready to pack orders can be marked packed.",
      };
    }

    const payload: PackingStatusUpdatePayload = {
      order_status: "packed",
    };

    if (!order.packed_at) {
      payload.packed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(payload)
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to mark order packed.", updateError);

      return {
        ok: false,
        message: "Order could not be marked packed. Try again.",
      };
    }

    revalidatePath("/packing");
    revalidatePath("/orders");
    revalidatePath("/orders/details");

    return { ok: true, message: "Order marked as packed." };
  } catch (error) {
    console.error("Failed to mark order packed.", error);

    return {
      ok: false,
      message: "Order could not be marked packed right now. Try again shortly.",
    };
  }
}
