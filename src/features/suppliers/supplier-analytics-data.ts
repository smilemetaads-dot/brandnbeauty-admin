import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type SupplierAnalyticsRecentPurchase = {
  created_at: string | null;
  id: string;
  purchase_number: string;
  purchase_status: string;
  stock_received: boolean;
  supplierName: string;
  total_cost: number;
};

export type SupplierAnalyticsRecord = {
  cancelledPurchaseCount: number;
  email: string | null;
  lastPurchaseAt: string | null;
  pendingPurchaseCount: number;
  pendingPurchaseValue: number;
  phone: string | null;
  purchaseCount: number;
  receivedPurchaseCount: number;
  receivedPurchaseValue: number;
  recentPurchases: SupplierAnalyticsRecentPurchase[];
  reliabilityLabel: string;
  status: string;
  supplierId: string;
  supplierName: string;
  totalItemsOrdered: number;
  totalItemsReceived: number;
  totalPurchaseValue: number;
};

export type SupplierAnalyticsSummary = {
  activeSuppliers: number;
  cancelledPurchaseCount: number;
  pendingPurchaseCount: number;
  pendingPurchaseValue: number;
  receivedPurchaseCount: number;
  receivedPurchaseValue: number;
  totalPurchaseEntries: number;
  totalPurchaseValue: number;
  totalSuppliers: number;
};

export type SupplierProductPurchaseSummary = {
  productName: string;
  sku: string | null;
  supplierCount: number;
  totalOrdered: number;
  totalReceived: number;
  totalValue: number;
};

export type SupplierAnalyticsData = {
  productSummaries: SupplierProductPurchaseSummary[];
  recentPurchases: SupplierAnalyticsRecentPurchase[];
  records: SupplierAnalyticsRecord[];
  summary: SupplierAnalyticsSummary;
};

type SupplierRow = {
  contact_person: string | null;
  created_at: string | null;
  email: string | null;
  id: string;
  name: string;
  payment_terms: string | null;
  phone: string | null;
  status: string;
};

type PurchaseEntryRow = {
  created_at: string | null;
  id: string;
  purchase_number: string;
  purchase_status: string | null;
  received_at: string | null;
  stock_received: boolean | null;
  supplier_id: string | null;
  total_cost: number | null;
};

type PurchaseEntryItemRow = {
  id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  purchase_entry_id: string;
  quantity: number | null;
  received_quantity: number | null;
  total_cost: number | null;
  unit_cost: number | null;
};

type ProductPurchaseSummaryAccumulator = Omit<
  SupplierProductPurchaseSummary,
  "supplierCount"
> & {
  supplierIds: Set<string>;
};

const emptySummary: SupplierAnalyticsSummary = {
  activeSuppliers: 0,
  cancelledPurchaseCount: 0,
  pendingPurchaseCount: 0,
  pendingPurchaseValue: 0,
  receivedPurchaseCount: 0,
  receivedPurchaseValue: 0,
  totalPurchaseEntries: 0,
  totalPurchaseValue: 0,
  totalSuppliers: 0,
};

const emptySupplierAnalyticsData: SupplierAnalyticsData = {
  productSummaries: [],
  recentPurchases: [],
  records: [],
  summary: emptySummary,
};

function toNumber(value: number | null | undefined) {
  return Number(value ?? 0);
}

function isReceivedPurchase(purchase: PurchaseEntryRow) {
  return Boolean(purchase.stock_received) || purchase.purchase_status === "received";
}

function isPendingPurchase(purchase: PurchaseEntryRow) {
  return (
    !Boolean(purchase.stock_received) && purchase.purchase_status !== "cancelled"
  );
}

function getReliabilityLabel({
  pendingPurchaseCount,
  purchaseCount,
  receivedPurchaseCount,
}: {
  pendingPurchaseCount: number;
  purchaseCount: number;
  receivedPurchaseCount: number;
}) {
  if (receivedPurchaseCount >= 2 && pendingPurchaseCount === 0) {
    return "Reliable";
  }

  if (pendingPurchaseCount > 0) {
    return "Pending Follow-up";
  }

  if (purchaseCount <= 1) {
    return "New Supplier";
  }

  return "Review";
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

function buildRecentPurchase(
  purchase: PurchaseEntryRow,
  supplierName: string,
): SupplierAnalyticsRecentPurchase {
  return {
    created_at: purchase.created_at,
    id: purchase.id,
    purchase_number: purchase.purchase_number,
    purchase_status: purchase.purchase_status ?? "draft",
    stock_received: Boolean(purchase.stock_received),
    supplierName,
    total_cost: toNumber(purchase.total_cost),
  };
}

function buildSummary(
  suppliers: SupplierRow[],
  purchases: PurchaseEntryRow[],
): SupplierAnalyticsSummary {
  return purchases.reduce(
    (summary, purchase) => {
      const purchaseValue = toNumber(purchase.total_cost);
      const received = isReceivedPurchase(purchase);
      const pending = isPendingPurchase(purchase);
      const cancelled = purchase.purchase_status === "cancelled";

      return {
        ...summary,
        cancelledPurchaseCount:
          summary.cancelledPurchaseCount + (cancelled ? 1 : 0),
        pendingPurchaseCount: summary.pendingPurchaseCount + (pending ? 1 : 0),
        pendingPurchaseValue:
          summary.pendingPurchaseValue + (pending ? purchaseValue : 0),
        receivedPurchaseCount:
          summary.receivedPurchaseCount + (received ? 1 : 0),
        receivedPurchaseValue:
          summary.receivedPurchaseValue + (received ? purchaseValue : 0),
        totalPurchaseEntries: summary.totalPurchaseEntries + 1,
        totalPurchaseValue: summary.totalPurchaseValue + purchaseValue,
      };
    },
    {
      ...emptySummary,
      activeSuppliers: suppliers.filter((supplier) => supplier.status === "active")
        .length,
      totalSuppliers: suppliers.length,
    },
  );
}

function buildSupplierRecords(
  suppliers: SupplierRow[],
  purchases: PurchaseEntryRow[],
  itemsByPurchase: Map<string, PurchaseEntryItemRow[]>,
): SupplierAnalyticsRecord[] {
  const purchasesBySupplier = purchases.reduce((map, purchase) => {
    if (!purchase.supplier_id) {
      return map;
    }

    const supplierPurchases = map.get(purchase.supplier_id) ?? [];
    supplierPurchases.push(purchase);
    map.set(purchase.supplier_id, supplierPurchases);
    return map;
  }, new Map<string, PurchaseEntryRow[]>());

  return suppliers.map((supplier) => {
    const supplierPurchases = (
      purchasesBySupplier.get(supplier.id) ?? []
    ).sort(sortByCreatedAtDesc);
    const purchaseCount = supplierPurchases.length;
    const receivedPurchaseCount = supplierPurchases.filter(isReceivedPurchase)
      .length;
    const pendingPurchaseCount = supplierPurchases.filter(isPendingPurchase).length;
    const cancelledPurchaseCount = supplierPurchases.filter(
      (purchase) => purchase.purchase_status === "cancelled",
    ).length;
    const totalPurchaseValue = supplierPurchases.reduce(
      (sum, purchase) => sum + toNumber(purchase.total_cost),
      0,
    );
    const receivedPurchaseValue = supplierPurchases.reduce(
      (sum, purchase) =>
        sum + (isReceivedPurchase(purchase) ? toNumber(purchase.total_cost) : 0),
      0,
    );
    const pendingPurchaseValue = supplierPurchases.reduce(
      (sum, purchase) =>
        sum + (isPendingPurchase(purchase) ? toNumber(purchase.total_cost) : 0),
      0,
    );
    const supplierItems = supplierPurchases.flatMap(
      (purchase) => itemsByPurchase.get(purchase.id) ?? [],
    );

    return {
      cancelledPurchaseCount,
      email: supplier.email,
      lastPurchaseAt: supplierPurchases[0]?.created_at ?? null,
      pendingPurchaseCount,
      pendingPurchaseValue,
      phone: supplier.phone,
      purchaseCount,
      receivedPurchaseCount,
      receivedPurchaseValue,
      recentPurchases: supplierPurchases
        .slice(0, 3)
        .map((purchase) => buildRecentPurchase(purchase, supplier.name)),
      reliabilityLabel: getReliabilityLabel({
        pendingPurchaseCount,
        purchaseCount,
        receivedPurchaseCount,
      }),
      status: supplier.status,
      supplierId: supplier.id,
      supplierName: supplier.name,
      totalItemsOrdered: supplierItems.reduce(
        (sum, item) => sum + toNumber(item.quantity),
        0,
      ),
      totalItemsReceived: supplierItems.reduce(
        (sum, item) => sum + toNumber(item.received_quantity),
        0,
      ),
      totalPurchaseValue,
    };
  });
}

function buildItemsByPurchase(
  items: PurchaseEntryItemRow[],
): Map<string, PurchaseEntryItemRow[]> {
  return items.reduce((itemsByPurchase, item) => {
    const purchaseItems = itemsByPurchase.get(item.purchase_entry_id) ?? [];
    purchaseItems.push(item);
    itemsByPurchase.set(item.purchase_entry_id, purchaseItems);
    return itemsByPurchase;
  }, new Map<string, PurchaseEntryItemRow[]>());
}

function buildProductSummaries(
  items: PurchaseEntryItemRow[],
  purchasesById: Map<string, PurchaseEntryRow>,
): SupplierProductPurchaseSummary[] {
  const summariesByProduct = items.reduce(
    (summaryMap, item) => {
      const key = item.product_id ?? `${item.product_name}-${item.product_sku}`;
      const purchase = purchasesById.get(item.purchase_entry_id);
      const current = summaryMap.get(key) ?? {
        productName: item.product_name,
        sku: item.product_sku,
        supplierIds: new Set<string>(),
        totalOrdered: 0,
        totalReceived: 0,
        totalValue: 0,
      };

      if (purchase?.supplier_id) {
        current.supplierIds.add(purchase.supplier_id);
      }

      current.totalOrdered += toNumber(item.quantity);
      current.totalReceived += toNumber(item.received_quantity);
      current.totalValue += toNumber(item.total_cost);
      summaryMap.set(key, current);
      return summaryMap;
    },
    new Map<string, ProductPurchaseSummaryAccumulator>(),
  );

  return [...summariesByProduct.values()]
    .map(({ supplierIds, ...summary }) => ({
      ...summary,
      supplierCount: supplierIds.size,
    }))
    .sort((left, right) => right.totalValue - left.totalValue)
    .slice(0, 12);
}

export async function getSupplierAnalyticsFromSupabase(): Promise<SupplierAnalyticsData> {
  try {
    const supabase = createAdminSupabaseClient();
    const [suppliersResponse, purchasesResponse, itemsResponse] =
      await Promise.all([
        supabase
          .from("suppliers")
          .select(
            [
              "id",
              "name",
              "contact_person",
              "phone",
              "email",
              "status",
              "payment_terms",
              "created_at",
            ].join(", "),
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("purchase_entries")
          .select(
            [
              "id",
              "purchase_number",
              "supplier_id",
              "purchase_status",
              "total_cost",
              "stock_received",
              "received_at",
              "created_at",
            ].join(", "),
          )
          .order("created_at", { ascending: false }),
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
            ].join(", "),
          ),
      ]);

    if (
      suppliersResponse.error ||
      purchasesResponse.error ||
      itemsResponse.error
    ) {
      console.error("Failed to load supplier analytics from Supabase.");
      return emptySupplierAnalyticsData;
    }

    const suppliers = (suppliersResponse.data ?? []) as unknown as SupplierRow[];
    const purchases = (
      purchasesResponse.data ?? []
    ) as unknown as PurchaseEntryRow[];
    const items = (
      itemsResponse.data ?? []
    ) as unknown as PurchaseEntryItemRow[];
    const suppliersById = new Map(
      suppliers.map((supplier) => [supplier.id, supplier]),
    );
    const purchasesById = new Map(
      purchases.map((purchase) => [purchase.id, purchase]),
    );
    const itemsByPurchase = buildItemsByPurchase(items);

    return {
      productSummaries: buildProductSummaries(items, purchasesById),
      recentPurchases: purchases
        .slice()
        .sort(sortByCreatedAtDesc)
        .slice(0, 8)
        .map((purchase) =>
          buildRecentPurchase(
            purchase,
            suppliersById.get(purchase.supplier_id ?? "")?.name ??
              "Unknown supplier",
          ),
        ),
      records: buildSupplierRecords(suppliers, purchases, itemsByPurchase),
      summary: buildSummary(suppliers, purchases),
    };
  } catch {
    console.error("Failed to initialize supplier analytics data source.");
    return emptySupplierAnalyticsData;
  }
}
