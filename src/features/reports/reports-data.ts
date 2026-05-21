import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type ReportsLatestOrder = {
  courier_status: string | null;
  created_at: string | null;
  customer_name: string | null;
  id: string;
  order_number: string | null;
  order_status: string | null;
  payment_status: string | null;
  total: number;
};

export type ReportsLatestInventoryMovement = {
  created_at: string | null;
  id: string;
  movement_type: string | null;
  new_stock: number;
  note: string | null;
  previous_stock: number;
  quantity: number;
};

export type ReportsFinanceSummary = {
  cancelledOrders: number;
  cancelledValue: number;
  codPendingOrders: number;
  confirmedOrders: number;
  courierDelivered: number;
  courierFailed: number;
  courierReady: number;
  courierReturned: number;
  courierSent: number;
  deliveredOrders: number;
  deliveredSales: number;
  deliverySuccessRate: number;
  dueOrders: number;
  failedPaymentOrders: number;
  grossSales: number;
  latestInventoryMovements: ReportsLatestInventoryMovement[];
  latestOrders: ReportsLatestOrder[];
  lowStockProducts: number;
  newOrders: number;
  outOfStockProducts: number;
  packedOrders: number;
  paidAmount: number;
  paidOrders: number;
  paymentCollectionRate: number;
  recentMovementCount: number;
  returnRate: number;
  returnedOrders: number;
  returnedValue: number;
  shippedOrders: number;
  totalDue: number;
  totalOrders: number;
  totalProducts: number;
};

type ReportsOrderRow = {
  courier_status: string | null;
  created_at: string | null;
  customer_name: string | null;
  due_amount: number | null;
  id: string;
  order_number: string | null;
  order_status: string | null;
  paid_amount: number | null;
  payment_status: string | null;
  total: number | null;
};

type ReportsProductRow = {
  stock: number | null;
};

type ReportsInventoryMovementRow = {
  created_at: string | null;
  id: string;
  movement_type: string | null;
  new_stock: number | null;
  note: string | null;
  previous_stock: number | null;
  quantity: number | null;
};

const defaultSummary: ReportsFinanceSummary = {
  cancelledOrders: 0,
  cancelledValue: 0,
  codPendingOrders: 0,
  confirmedOrders: 0,
  courierDelivered: 0,
  courierFailed: 0,
  courierReady: 0,
  courierReturned: 0,
  courierSent: 0,
  deliveredOrders: 0,
  deliveredSales: 0,
  deliverySuccessRate: 0,
  dueOrders: 0,
  failedPaymentOrders: 0,
  grossSales: 0,
  latestInventoryMovements: [],
  latestOrders: [],
  lowStockProducts: 0,
  newOrders: 0,
  outOfStockProducts: 0,
  packedOrders: 0,
  paidAmount: 0,
  paidOrders: 0,
  paymentCollectionRate: 0,
  recentMovementCount: 0,
  returnRate: 0,
  returnedOrders: 0,
  returnedValue: 0,
  shippedOrders: 0,
  totalDue: 0,
  totalOrders: 0,
  totalProducts: 0,
};

function toNumber(value: number | null | undefined) {
  return Number(value ?? 0);
}

function getRatio(numerator: number, denominator: number) {
  if (!denominator) {
    return 0;
  }

  return (numerator / denominator) * 100;
}

function countByStatus<T>(
  rows: T[],
  field: keyof T,
  status: string,
) {
  return rows.filter((row) => row[field] === status).length;
}

export async function getReportsFinanceSummaryFromSupabase(): Promise<ReportsFinanceSummary> {
  try {
    const supabase = createAdminSupabaseClient();
    const [ordersResponse, productsResponse, movementsResponse] =
      await Promise.all([
        supabase
          .from("orders")
          .select(
            [
              "id",
              "order_number",
              "customer_name",
              "total",
              "paid_amount",
              "due_amount",
              "order_status",
              "payment_status",
              "courier_status",
              "created_at",
            ].join(", "),
          )
          .order("created_at", { ascending: false }),
        supabase.from("products").select("stock"),
        supabase
          .from("inventory_movements")
          .select(
            "id, movement_type, quantity, previous_stock, new_stock, note, created_at",
          )
          .order("created_at", { ascending: false }),
      ]);

    if (ordersResponse.error || productsResponse.error || movementsResponse.error) {
      console.error("Failed to load reports and finance summary from Supabase.");
      return defaultSummary;
    }

    const orders = (ordersResponse.data ?? []) as unknown as ReportsOrderRow[];
    const products = (productsResponse.data ??
      []) as unknown as ReportsProductRow[];
    const movements = (movementsResponse.data ??
      []) as unknown as ReportsInventoryMovementRow[];
    const grossSales = orders.reduce(
      (sum, order) => sum + toNumber(order.total),
      0,
    );
    const paidAmount = orders.reduce(
      (sum, order) => sum + toNumber(order.paid_amount),
      0,
    );
    const totalOrders = orders.length;
    const deliveredOrders = countByStatus(orders, "order_status", "delivered");
    const returnedOrders = countByStatus(orders, "order_status", "returned");

    return {
      cancelledOrders: countByStatus(orders, "order_status", "cancelled"),
      cancelledValue: orders
        .filter((order) => order.order_status === "cancelled")
        .reduce((sum, order) => sum + toNumber(order.total), 0),
      codPendingOrders: countByStatus(orders, "payment_status", "cod_pending"),
      confirmedOrders: countByStatus(orders, "order_status", "confirmed"),
      courierDelivered: countByStatus(
        orders,
        "courier_status",
        "delivered",
      ),
      courierFailed: countByStatus(orders, "courier_status", "failed"),
      courierReady: countByStatus(orders, "courier_status", "ready"),
      courierReturned: countByStatus(orders, "courier_status", "returned"),
      courierSent: countByStatus(orders, "courier_status", "sent"),
      deliveredOrders,
      deliveredSales: orders
        .filter((order) => order.order_status === "delivered")
        .reduce((sum, order) => sum + toNumber(order.total), 0),
      deliverySuccessRate: getRatio(deliveredOrders, totalOrders),
      dueOrders: orders.filter((order) => toNumber(order.due_amount) > 0).length,
      failedPaymentOrders: countByStatus(orders, "payment_status", "failed"),
      grossSales,
      latestInventoryMovements: movements.slice(0, 5).map((movement) => ({
        created_at: movement.created_at,
        id: movement.id,
        movement_type: movement.movement_type,
        new_stock: toNumber(movement.new_stock),
        note: movement.note,
        previous_stock: toNumber(movement.previous_stock),
        quantity: toNumber(movement.quantity),
      })),
      latestOrders: orders.slice(0, 5).map((order) => ({
        courier_status: order.courier_status,
        created_at: order.created_at,
        customer_name: order.customer_name,
        id: order.id,
        order_number: order.order_number,
        order_status: order.order_status,
        payment_status: order.payment_status,
        total: toNumber(order.total),
      })),
      lowStockProducts: products.filter((product) => {
        const stock = toNumber(product.stock);
        return stock > 0 && stock <= 10;
      }).length,
      newOrders: countByStatus(orders, "order_status", "new"),
      outOfStockProducts: products.filter((product) => toNumber(product.stock) <= 0)
        .length,
      packedOrders: countByStatus(orders, "order_status", "packed"),
      paidAmount,
      paidOrders: countByStatus(orders, "payment_status", "paid"),
      paymentCollectionRate: getRatio(paidAmount, grossSales),
      recentMovementCount: movements.length,
      returnRate: getRatio(returnedOrders, totalOrders),
      returnedOrders,
      returnedValue: orders
        .filter((order) => order.order_status === "returned")
        .reduce((sum, order) => sum + toNumber(order.total), 0),
      shippedOrders: countByStatus(orders, "order_status", "shipped"),
      totalDue: orders.reduce(
        (sum, order) => sum + toNumber(order.due_amount),
        0,
      ),
      totalOrders,
      totalProducts: products.length,
    };
  } catch {
    console.error("Failed to initialize reports and finance data source.");
    return defaultSummary;
  }
}
