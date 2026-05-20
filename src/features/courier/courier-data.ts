import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const COURIER_ORDER_STATUSES = ["packed", "shipped", "delivered", "returned"];
const COURIER_STATUSES = ["ready", "sent", "delivered", "returned", "failed"];

export type CourierPaymentOrderItemRecord = {
  id: string;
  product_name: string;
  product_sku: string | null;
  product_brand: string | null;
  product_size: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export type CourierPaymentOrderRecord = {
  id: string;
  order_number: string | null;
  customer_name: string;
  customer_phone: string;
  district: string | null;
  area: string | null;
  delivery_zone: string | null;
  total: number;
  paid_amount: number;
  due_amount: number;
  order_status: string;
  payment_status: string;
  courier_status: string | null;
  courier_name: string | null;
  courier_tracking_id: string | null;
  courier_note: string | null;
  stock_deducted: boolean;
  stock_restored: boolean;
  packed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  returned_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  order_items: CourierPaymentOrderItemRecord[];
};

type CourierPaymentOrderRow = Omit<CourierPaymentOrderRecord, "order_items"> & {
  order_items: CourierPaymentOrderItemRecord[] | null;
};

export async function getCourierPaymentOrdersFromSupabase(): Promise<
  CourierPaymentOrderRecord[]
> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
          id,
          order_number,
          customer_name,
          customer_phone,
          district,
          area,
          delivery_zone,
          total,
          paid_amount,
          due_amount,
          order_status,
          payment_status,
          courier_status,
          courier_name,
          courier_tracking_id,
          courier_note,
          stock_deducted,
          stock_restored,
          packed_at,
          shipped_at,
          delivered_at,
          returned_at,
          created_at,
          updated_at,
          order_items (
            id,
            product_name,
            product_sku,
            product_brand,
            product_size,
            quantity,
            unit_price,
            total_price
          )
        `,
      )
      .or(
        `order_status.in.(${COURIER_ORDER_STATUSES.join(
          ",",
        )}),courier_status.in.(${COURIER_STATUSES.join(",")})`,
      )
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to load courier and payment orders from Supabase.");
      return [];
    }

    return ((data ?? []) as CourierPaymentOrderRow[]).map((order) => ({
      ...order,
      order_items: order.order_items ?? [],
    }));
  } catch {
    console.error("Failed to initialize courier and payment data source.");
    return [];
  }
}
