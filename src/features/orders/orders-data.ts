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
