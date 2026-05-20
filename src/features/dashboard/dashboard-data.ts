import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type DashboardInventoryMovement = {
  created_at: string | null;
  id: string;
  movement_type: string;
  new_stock: number;
  previous_stock: number;
  product_name: string | null;
  product_sku: string | null;
  quantity: number;
};

export type DashboardSummary = {
  codDue: number;
  courierQueue: number;
  deliveredOrders: number;
  latestInventoryMovements: DashboardInventoryMovement[];
  lowStockProducts: number;
  newOrders: number;
  outOfStockProducts: number;
  packedOrders: number;
  packingQueue: number;
  returnedOrders: number;
  shippedOrders: number;
  totalOrders: number;
  totalProducts: number;
};

type DashboardOrderRow = {
  courier_status: string | null;
  due_amount: number | null;
  order_status: string | null;
};

type DashboardProductRow = {
  stock: number | null;
};

type ProductSummary = {
  name: string | null;
  sku: string | null;
} | null;

type DashboardMovementRow = Omit<
  DashboardInventoryMovement,
  "product_name" | "product_sku"
> & {
  products: ProductSummary | ProductSummary[];
};

const defaultSummary: DashboardSummary = {
  codDue: 0,
  courierQueue: 0,
  deliveredOrders: 0,
  latestInventoryMovements: [],
  lowStockProducts: 0,
  newOrders: 0,
  outOfStockProducts: 0,
  packedOrders: 0,
  packingQueue: 0,
  returnedOrders: 0,
  shippedOrders: 0,
  totalOrders: 0,
  totalProducts: 0,
};

const PACKING_QUEUE_STATUSES = [
  "confirmed",
  "processing",
  "ready_to_pack",
  "packed",
];

const COURIER_QUEUE_STATUSES = ["ready", "sent", "delivered", "returned", "failed"];

function getSingleProductSummary(
  relation: ProductSummary | ProductSummary[],
): ProductSummary {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

export async function getDashboardSummaryFromSupabase(): Promise<DashboardSummary> {
  try {
    const supabase = createAdminSupabaseClient();
    const [ordersResponse, productsResponse, movementsResponse] =
      await Promise.all([
        supabase.from("orders").select("order_status, courier_status, due_amount"),
        supabase.from("products").select("stock"),
        supabase
          .from("inventory_movements")
          .select(
            "id, movement_type, quantity, previous_stock, new_stock, created_at, products(name, sku)",
          )
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

    if (ordersResponse.error || productsResponse.error || movementsResponse.error) {
      console.error("Failed to load dashboard summary from Supabase.");
      return defaultSummary;
    }

    const orders = (ordersResponse.data ?? []) as DashboardOrderRow[];
    const products = (productsResponse.data ?? []) as DashboardProductRow[];
    const movements = (movementsResponse.data ?? []) as DashboardMovementRow[];

    return {
      codDue: orders.reduce(
        (sum, order) => sum + Math.max(Number(order.due_amount ?? 0), 0),
        0,
      ),
      courierQueue: orders.filter(
        (order) =>
          order.order_status === "packed" ||
          order.order_status === "shipped" ||
          COURIER_QUEUE_STATUSES.includes(order.courier_status ?? ""),
      ).length,
      deliveredOrders: orders.filter(
        (order) => order.order_status === "delivered",
      ).length,
      latestInventoryMovements: movements.map((movement) => {
        const product = getSingleProductSummary(movement.products);

        return {
          created_at: movement.created_at,
          id: movement.id,
          movement_type: movement.movement_type,
          new_stock: movement.new_stock,
          previous_stock: movement.previous_stock,
          product_name: product?.name ?? null,
          product_sku: product?.sku ?? null,
          quantity: movement.quantity,
        };
      }),
      lowStockProducts: products.filter((product) => {
        const stock = Number(product.stock ?? 0);
        return stock > 0 && stock <= 10;
      }).length,
      newOrders: orders.filter((order) => order.order_status === "new").length,
      outOfStockProducts: products.filter(
        (product) => Number(product.stock ?? 0) <= 0,
      ).length,
      packedOrders: orders.filter((order) => order.order_status === "packed")
        .length,
      packingQueue: orders.filter((order) =>
        PACKING_QUEUE_STATUSES.includes(order.order_status ?? ""),
      ).length,
      returnedOrders: orders.filter((order) => order.order_status === "returned")
        .length,
      shippedOrders: orders.filter((order) => order.order_status === "shipped")
        .length,
      totalOrders: orders.length,
      totalProducts: products.length,
    };
  } catch {
    console.error("Failed to initialize dashboard summary data source.");
    return defaultSummary;
  }
}
