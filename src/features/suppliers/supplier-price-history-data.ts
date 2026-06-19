import "server-only";

export type SupplierProductPriceHistoryRecord = {
  average_unit_cost: number;
  highest_unit_cost: number;
  last_purchase_date: string | null;
  last_unit_cost: number;
  lowest_unit_cost: number;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  purchase_count: number;
  supplier_id: string | null;
  supplier_name: string;
  total_purchase_value: number;
  total_quantity_ordered: number;
  total_quantity_received: number;
};

export type SupplierProductPriceHistorySummary = {
  averageUnitCost: number;
  priceChangeWatchCount: number;
  totalPurchaseLines: number;
  totalPurchaseValue: number;
  trackedProducts: number;
  trackedSuppliers: number;
};

export type SupplierProductRecentPriceRow = {
  created_at: string | null;
  product_name: string;
  product_sku: string | null;
  purchase_number: string;
  quantity: number;
  supplier_name: string;
  unit_cost: number;
};

export type SupplierProductPriceHistoryData = {
  records: SupplierProductPriceHistoryRecord[];
  recentRows: SupplierProductRecentPriceRow[];
  summary: SupplierProductPriceHistorySummary;
};

const emptyPriceHistoryData: SupplierProductPriceHistoryData = {
  records: [],
  recentRows: [],
  summary: {
    averageUnitCost: 0,
    priceChangeWatchCount: 0,
    totalPurchaseLines: 0,
    totalPurchaseValue: 0,
    trackedProducts: 0,
    trackedSuppliers: 0,
  },
};

export async function getSupplierProductPriceHistory(): Promise<SupplierProductPriceHistoryData> {
  return emptyPriceHistoryData;
}
