import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

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

type SupplierRow = {
  id: string;
  name: string;
};

type PurchaseEntryRow = {
  created_at: string | null;
  id: string;
  purchase_number: string;
  supplier_id: string | null;
};

type PurchaseEntryItemRow = {
  created_at: string | null;
  id: string;
  product_id: string | null;
  product_name: string | null;
  product_sku: string | null;
  purchase_entry_id: string;
  quantity: number | null;
  received_quantity: number | null;
  total_cost: number | null;
  unit_cost: number | null;
};

type PriceAccumulator = {
  firstSeenAt: string | null;
  lastPurchaseDate: string | null;
  lastUnitCost: number;
  productId: string | null;
  productName: string;
  productSku: string | null;
  purchaseIds: Set<string>;
  supplierId: string | null;
  supplierName: string;
  totalPurchaseValue: number;
  totalQuantityOrdered: number;
  totalQuantityReceived: number;
  unitCostCount: number;
  unitCostSum: number;
  unitCosts: number[];
};

const emptySummary: SupplierProductPriceHistorySummary = {
  averageUnitCost: 0,
  priceChangeWatchCount: 0,
  totalPurchaseLines: 0,
  totalPurchaseValue: 0,
  trackedProducts: 0,
  trackedSuppliers: 0,
};

const emptyPriceHistoryData: SupplierProductPriceHistoryData = {
  records: [],
  recentRows: [],
  summary: emptySummary,
};

function toNumber(value: number | null | undefined) {
  return Number(value ?? 0);
}

function getItemDate(
  item: PurchaseEntryItemRow,
  purchase: PurchaseEntryRow | undefined,
) {
  return item.created_at ?? purchase?.created_at ?? null;
}

function sortByCreatedAtDesc<
  T extends {
    created_at: string | null;
  },
>(left: T, right: T) {
  return (
    new Date(right.created_at ?? 0).getTime() -
    new Date(left.created_at ?? 0).getTime()
  );
}

function buildRecordKey(
  item: PurchaseEntryItemRow,
  purchase: PurchaseEntryRow | undefined,
) {
  return [
    item.product_id ?? item.product_name ?? "unknown-product",
    purchase?.supplier_id ?? "unknown-supplier",
  ].join("::");
}

function buildHistoryRecords(
  items: PurchaseEntryItemRow[],
  purchasesById: Map<string, PurchaseEntryRow>,
  suppliersById: Map<string, SupplierRow>,
) {
  const recordsByKey = items.reduce((map, item) => {
    const purchase = purchasesById.get(item.purchase_entry_id);
    const supplier = suppliersById.get(purchase?.supplier_id ?? "");
    const itemDate = getItemDate(item, purchase);
    const key = buildRecordKey(item, purchase);
    const unitCost = toNumber(item.unit_cost);
    const current =
      map.get(key) ??
      ({
        firstSeenAt: itemDate,
        lastPurchaseDate: itemDate,
        lastUnitCost: unitCost,
        productId: item.product_id,
        productName: item.product_name ?? "Unknown product",
        productSku: item.product_sku,
        purchaseIds: new Set<string>(),
        supplierId: purchase?.supplier_id ?? null,
        supplierName: supplier?.name ?? "Unknown supplier",
        totalPurchaseValue: 0,
        totalQuantityOrdered: 0,
        totalQuantityReceived: 0,
        unitCostCount: 0,
        unitCostSum: 0,
        unitCosts: [],
      } satisfies PriceAccumulator);

    current.purchaseIds.add(item.purchase_entry_id);
    current.totalQuantityOrdered += toNumber(item.quantity);
    current.totalQuantityReceived += toNumber(item.received_quantity);
    current.totalPurchaseValue += toNumber(item.total_cost);
    current.unitCostCount += 1;
    current.unitCostSum += unitCost;
    current.unitCosts.push(unitCost);

    if (
      new Date(itemDate ?? 0).getTime() >=
      new Date(current.lastPurchaseDate ?? 0).getTime()
    ) {
      current.lastPurchaseDate = itemDate;
      current.lastUnitCost = unitCost;
    }

    map.set(key, current);
    return map;
  }, new Map<string, PriceAccumulator>());

  return [...recordsByKey.values()]
    .map((record) => ({
      average_unit_cost:
        record.unitCostCount > 0 ? record.unitCostSum / record.unitCostCount : 0,
      highest_unit_cost: record.unitCosts.length
        ? Math.max(...record.unitCosts)
        : 0,
      last_purchase_date: record.lastPurchaseDate,
      last_unit_cost: record.lastUnitCost,
      lowest_unit_cost: record.unitCosts.length ? Math.min(...record.unitCosts) : 0,
      product_id: record.productId,
      product_name: record.productName,
      product_sku: record.productSku,
      purchase_count: record.purchaseIds.size,
      supplier_id: record.supplierId,
      supplier_name: record.supplierName,
      total_purchase_value: record.totalPurchaseValue,
      total_quantity_ordered: record.totalQuantityOrdered,
      total_quantity_received: record.totalQuantityReceived,
    }))
    .sort(
      (left, right) =>
        new Date(right.last_purchase_date ?? 0).getTime() -
        new Date(left.last_purchase_date ?? 0).getTime(),
    );
}

function buildRecentRows(
  items: PurchaseEntryItemRow[],
  purchasesById: Map<string, PurchaseEntryRow>,
  suppliersById: Map<string, SupplierRow>,
): SupplierProductRecentPriceRow[] {
  return items
    .map((item) => {
      const purchase = purchasesById.get(item.purchase_entry_id);
      const supplier = suppliersById.get(purchase?.supplier_id ?? "");

      return {
        created_at: getItemDate(item, purchase),
        product_name: item.product_name ?? "Unknown product",
        product_sku: item.product_sku,
        purchase_number: purchase?.purchase_number ?? "Unknown purchase",
        quantity: toNumber(item.quantity),
        supplier_name: supplier?.name ?? "Unknown supplier",
        unit_cost: toNumber(item.unit_cost),
      };
    })
    .sort(sortByCreatedAtDesc)
    .slice(0, 10);
}

function buildSummary(
  records: SupplierProductPriceHistoryRecord[],
  items: PurchaseEntryItemRow[],
): SupplierProductPriceHistorySummary {
  const productKeys = new Set(
    records.map((record) => record.product_id ?? record.product_name),
  );
  const supplierKeys = new Set(
    records.map((record) => record.supplier_id ?? record.supplier_name),
  );
  const totalUnitCost = items.reduce(
    (sum, item) => sum + toNumber(item.unit_cost),
    0,
  );

  return {
    averageUnitCost: items.length ? totalUnitCost / items.length : 0,
    priceChangeWatchCount: records.filter(
      (record) => record.highest_unit_cost > record.lowest_unit_cost,
    ).length,
    totalPurchaseLines: items.length,
    totalPurchaseValue: records.reduce(
      (sum, record) => sum + record.total_purchase_value,
      0,
    ),
    trackedProducts: productKeys.size,
    trackedSuppliers: supplierKeys.size,
  };
}

export async function getSupplierProductPriceHistoryFromSupabase(): Promise<SupplierProductPriceHistoryData> {
  try {
    const supabase = createAdminSupabaseClient();
    const [suppliersResponse, purchasesResponse, itemsResponse] =
      await Promise.all([
        supabase.from("suppliers").select("id, name"),
        supabase
          .from("purchase_entries")
          .select("id, purchase_number, supplier_id, created_at"),
        supabase
          .from("purchase_entry_items")
          .select(
            [
              "id",
              "purchase_entry_id",
              "product_id",
              "product_name",
              "product_sku",
              "quantity",
              "received_quantity",
              "unit_cost",
              "total_cost",
              "created_at",
            ].join(", "),
          ),
      ]);

    if (
      suppliersResponse.error ||
      purchasesResponse.error ||
      itemsResponse.error
    ) {
      console.error("Failed to load supplier product price history.");
      return emptyPriceHistoryData;
    }

    const suppliers = (suppliersResponse.data ?? []) as unknown as SupplierRow[];
    const purchases = (
      purchasesResponse.data ?? []
    ) as unknown as PurchaseEntryRow[];
    const items = (itemsResponse.data ?? []) as unknown as PurchaseEntryItemRow[];
    const suppliersById = new Map(
      suppliers.map((supplier) => [supplier.id, supplier]),
    );
    const purchasesById = new Map(
      purchases.map((purchase) => [purchase.id, purchase]),
    );
    const records = buildHistoryRecords(items, purchasesById, suppliersById);

    return {
      records,
      recentRows: buildRecentRows(items, purchasesById, suppliersById),
      summary: buildSummary(records, items),
    };
  } catch {
    console.error("Failed to initialize supplier product price history source.");
    return emptyPriceHistoryData;
  }
}
