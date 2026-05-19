import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type OrderRecord = {
  id: string;
  order_number: string | null;
  source: string | null;
  customer_name: string;
  customer_phone: string;
  district: string | null;
  area: string | null;
  delivery_zone: string | null;
  subtotal: number;
  delivery_charge: number;
  discount: number;
  total: number;
  paid_amount: number;
  due_amount: number;
  order_status: string;
  payment_status: string;
  courier_status: string | null;
  courier_name: string | null;
  courier_tracking_id: string | null;
  stock_deducted: boolean;
  stock_restored: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type OrderItemRecord = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string | null;
  product_sku: string | null;
  product_brand: string | null;
  product_size: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string | null;
};

export type OrderDetailsRecord = {
  id: string;
  order_number: string | null;
  source: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string | null;
  district: string | null;
  area: string | null;
  delivery_zone: string | null;
  note: string | null;
  subtotal: number;
  delivery_charge: number;
  discount: number;
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
  stock_deducted_at: string | null;
  stock_restored: boolean;
  stock_restored_at: string | null;
  confirmed_at: string | null;
  packed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  returned_at: string | null;
  cancelled_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  order_items: OrderItemRecord[];
};

export async function getOrdersFromSupabase(): Promise<OrderRecord[]> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .select(
        [
          "id",
          "order_number",
          "source",
          "customer_name",
          "customer_phone",
          "district",
          "area",
          "delivery_zone",
          "subtotal",
          "delivery_charge",
          "discount",
          "total",
          "paid_amount",
          "due_amount",
          "order_status",
          "payment_status",
          "courier_status",
          "courier_name",
          "courier_tracking_id",
          "stock_deducted",
          "stock_restored",
          "created_at",
          "updated_at",
        ].join(", "),
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load orders from Supabase.");
      return [];
    }

    return (data ?? []) as unknown as OrderRecord[];
  } catch {
    console.error("Failed to initialize orders data source.");
    return [];
  }
}

export async function getOrderDetailsFromSupabase(
  id: string,
): Promise<OrderDetailsRecord | null> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
          id,
          order_number,
          source,
          customer_name,
          customer_phone,
          customer_email,
          customer_address,
          district,
          area,
          delivery_zone,
          note,
          subtotal,
          delivery_charge,
          discount,
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
          stock_deducted_at,
          stock_restored,
          stock_restored_at,
          confirmed_at,
          packed_at,
          shipped_at,
          delivered_at,
          returned_at,
          cancelled_at,
          created_at,
          updated_at,
          order_items (
            id,
            order_id,
            product_id,
            product_name,
            product_slug,
            product_sku,
            product_brand,
            product_size,
            quantity,
            unit_price,
            total_price,
            created_at
          )
        `,
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Failed to load order details from Supabase.");
      return null;
    }

    if (!data) {
      return null;
    }

    const order = data as unknown as OrderDetailsRecord;
    return {
      ...order,
      order_items: order.order_items ?? [],
    };
  } catch {
    console.error("Failed to initialize order details data source.");
    return null;
  }
}
