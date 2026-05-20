import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const PACKING_ORDER_STATUSES = [
  "confirmed",
  "processing",
  "ready_to_pack",
  "packed",
];

export type PackingOrderItemRecord = {
  id: string;
  product_name: string;
  product_sku: string | null;
  product_brand: string | null;
  product_size: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export type PackingOrderRecord = {
  id: string;
  order_number: string | null;
  customer_name: string;
  customer_phone: string;
  district: string | null;
  area: string | null;
  delivery_zone: string | null;
  total: number;
  due_amount: number;
  order_status: string;
  payment_status: string;
  courier_status: string | null;
  stock_deducted: boolean;
  stock_restored: boolean;
  created_at: string | null;
  updated_at: string | null;
  order_items: PackingOrderItemRecord[];
};

type PackingOrderRow = Omit<PackingOrderRecord, "order_items"> & {
  order_items: PackingOrderItemRecord[] | null;
};

export async function getPackingOrdersFromSupabase(): Promise<
  PackingOrderRecord[]
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
          due_amount,
          order_status,
          payment_status,
          courier_status,
          stock_deducted,
          stock_restored,
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
      .in("order_status", PACKING_ORDER_STATUSES)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load packing orders from Supabase.");
      return [];
    }

    return ((data ?? []) as PackingOrderRow[]).map((order) => ({
      ...order,
      order_items: order.order_items ?? [],
    }));
  } catch {
    console.error("Failed to initialize packing data source.");
    return [];
  }
}
