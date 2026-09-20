import "server-only";

import { serverAdminAuthHeaders } from "@/lib/admin-auth-server";
import { bnbApiUrl } from "@/lib/bnb-api";

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
  supplier_name?: string | null;
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

type SuppliersResponse = SupplierRow[] | {
  suppliers?: SupplierRow[];
  success?: boolean;
};

type FinanceInventoryResponse = {
  purchases?: Array<{
    created_at?: string | null;
    id?: string | number | null;
    purchase_number?: string | null;
    status?: string | null;
    supplier_name?: string | null;
    total_cost?: string | number | null;
  }>;
  success?: boolean;
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

function normalizeSuppliers(payload: SuppliersResponse): SupplierRow[] {
  const rows = Array.isArray(payload) ? payload : payload.suppliers ?? [];

  return rows.map((supplier) => ({
    contact_person: supplier.contact_person ?? null,
    created_at: supplier.created_at ?? null,
    email: supplier.email ?? null,
    id: String(supplier.id ?? ""),
    name: supplier.name || "Unnamed Supplier",
    payment_terms: supplier.payment_terms ?? null,
    phone: supplier.phone ?? null,
    status: supplier.status || "active",
  }));
}

function normalizePurchases(payload: FinanceInventoryResponse): PurchaseEntryRow[] {
  return (payload.purchases ?? []).map((purchase) => ({
    created_at: purchase.created_at ?? null,
    id: String(purchase.id ?? ""),
    purchase_number: purchase.purchase_number || "Recorded purchase",
    purchase_status: purchase.status ?? "recorded",
    received_at: null,
    stock_received: purchase.status === "received",
    supplier_id: null,
    supplier_name: purchase.supplier_name ?? null,
    total_cost: Number(purchase.total_cost ?? 0),
  }));
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

export async function getSupplierAnalytics(): Promise<SupplierAnalyticsData> {
  try {
    const authHeaders = await serverAdminAuthHeaders();
    const [suppliersResponse, financeResponse] = await Promise.all([
      fetch(bnbApiUrl("get_suppliers.php"), {
        cache: "no-store",
        headers: authHeaders,
      }),
      fetch(bnbApiUrl("get_finance_inventory.php"), {
        cache: "no-store",
        headers: authHeaders,
      }),
    ]);
    const [suppliersPayload, financePayload] = await Promise.all([
      suppliersResponse.json() as Promise<SuppliersResponse>,
      financeResponse.json() as Promise<FinanceInventoryResponse>,
    ]);

    if (!suppliersResponse.ok || !financeResponse.ok) {
      console.error("Failed to load supplier analytics from PHP.");
      return emptySupplierAnalyticsData;
    }

    const suppliers = normalizeSuppliers(suppliersPayload);
    const purchases = normalizePurchases(financePayload);
    const items: PurchaseEntryItemRow[] = [];
    const suppliersById = new Map(
      suppliers.map((supplier) => [supplier.id, supplier]),
    );
    const suppliersByName = new Map(
      suppliers.map((supplier) => [supplier.name.toLowerCase(), supplier]),
    );
    const purchasesWithSupplierIds = purchases.map((purchase) => {
      if (purchase.supplier_id || !purchase.supplier_name) return purchase;
      const supplier = suppliersByName.get(purchase.supplier_name.toLowerCase());

      return {
        ...purchase,
        supplier_id: supplier?.id ?? null,
      };
    });
    const purchasesById = new Map(
      purchasesWithSupplierIds.map((purchase) => [purchase.id, purchase]),
    );
    const itemsByPurchase = buildItemsByPurchase(items);

    return {
      productSummaries: buildProductSummaries(items, purchasesById),
      recentPurchases: purchasesWithSupplierIds
        .slice()
        .sort(sortByCreatedAtDesc)
        .slice(0, 8)
        .map((purchase) =>
          buildRecentPurchase(
            purchase,
            suppliersById.get(purchase.supplier_id ?? "")?.name ??
              purchase.supplier_name ??
              "Unknown supplier",
          ),
        ),
      records: buildSupplierRecords(suppliers, purchasesWithSupplierIds, itemsByPurchase),
      summary: buildSummary(suppliers, purchasesWithSupplierIds),
    };
  } catch {
    console.error("Failed to initialize PHP supplier analytics data source.");
    return emptySupplierAnalyticsData;
  }
}
