import "server-only";

import { bnbApiUrl } from "@/lib/bnb-api";

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

type ReportsProductRow = {
  created_at: string | null;
  id: string;
  name?: string | null;
  stock?: number | null;
  stock_quantity?: number | null;
};

type FinanceInventoryResponse = {
  inventory?: ReportsProductRow[];
  purchases?: unknown[];
  success?: boolean;
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

export async function getReportsFinanceSummary(): Promise<ReportsFinanceSummary> {
  try {
    const response = await fetch(bnbApiUrl("get_finance_inventory.php"), {
      cache: "no-store",
    });
    const payload = (await response.json()) as FinanceInventoryResponse;

    if (!response.ok || payload.success !== true) {
      console.error("Failed to load reports and finance summary from PHP.");
      return defaultSummary;
    }

    const products = payload.inventory ?? [];

    return {
      ...defaultSummary,
      latestInventoryMovements: products.slice(0, 5).map((product) => ({
        created_at: product.created_at,
        id: product.id,
        movement_type: "inventory_snapshot",
        new_stock: toNumber(product.stock_quantity ?? product.stock),
        note: product.name ?? null,
        previous_stock: 0,
        quantity: toNumber(product.stock_quantity ?? product.stock),
      })),
      lowStockProducts: products.filter((product) => {
        const stock = toNumber(product.stock_quantity ?? product.stock);
        return stock > 0 && stock <= 10;
      }).length,
      outOfStockProducts: products.filter((product) => {
        const stock = toNumber(product.stock_quantity ?? product.stock);
        return stock <= 0;
      }).length,
      recentMovementCount: payload.purchases?.length ?? 0,
      totalProducts: products.length,
    };
  } catch {
    console.error("Failed to initialize PHP reports and finance data source.");
    return defaultSummary;
  }
}
