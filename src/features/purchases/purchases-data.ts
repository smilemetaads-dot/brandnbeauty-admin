import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type PurchaseEntryItemRecord = {
  created_at: string | null;
  id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  purchase_entry_id: string;
  quantity: number;
  received_quantity: number;
  total_cost: number;
  unit_cost: number;
};

export type PurchaseEntrySupplierRecord = {
  email: string | null;
  name: string | null;
  phone: string | null;
  status: string | null;
};

export type PurchaseEntryRecord = {
  created_at: string | null;
  id: string;
  items: PurchaseEntryItemRecord[];
  note: string | null;
  purchase_number: string;
  purchase_status: string;
  received_at: string | null;
  stock_received: boolean;
  stock_received_at: string | null;
  supplier: PurchaseEntrySupplierRecord | null;
  supplier_id: string | null;
  total_cost: number;
  updated_at: string | null;
};

export type PurchaseEntriesKpis = {
  cancelledPurchases: number;
  draftPurchases: number;
  orderedPurchases: number;
  partiallyReceivedPurchases: number;
  pendingReceivePurchases: number;
  receivedPurchaseValue: number;
  receivedPurchases: number;
  totalPurchases: number;
  totalPurchaseValue: number;
};

export type PurchaseEntriesData = {
  entries: PurchaseEntryRecord[];
  kpis: PurchaseEntriesKpis;
};

type PurchaseEntryRow = Omit<PurchaseEntryRecord, "items" | "supplier"> & {
  suppliers:
    | PurchaseEntrySupplierRecord
    | PurchaseEntrySupplierRecord[]
    | null;
};

const emptyKpis: PurchaseEntriesKpis = {
  cancelledPurchases: 0,
  draftPurchases: 0,
  orderedPurchases: 0,
  partiallyReceivedPurchases: 0,
  pendingReceivePurchases: 0,
  receivedPurchaseValue: 0,
  receivedPurchases: 0,
  totalPurchases: 0,
  totalPurchaseValue: 0,
};

const emptyPurchaseEntriesData: PurchaseEntriesData = {
  entries: [],
  kpis: emptyKpis,
};

function toNumber(value: number | null | undefined) {
  return Number(value ?? 0);
}

function normalizeSupplier(
  supplier: PurchaseEntryRow["suppliers"],
): PurchaseEntrySupplierRecord | null {
  if (Array.isArray(supplier)) {
    return supplier[0] ?? null;
  }

  return supplier;
}

function buildItemsByPurchase(
  items: PurchaseEntryItemRecord[],
): Map<string, PurchaseEntryItemRecord[]> {
  return items.reduce((itemsByPurchase, item) => {
    const purchaseItems = itemsByPurchase.get(item.purchase_entry_id) ?? [];
    purchaseItems.push({
      ...item,
      quantity: toNumber(item.quantity),
      received_quantity: toNumber(item.received_quantity),
      total_cost: toNumber(item.total_cost),
      unit_cost: toNumber(item.unit_cost),
    });
    itemsByPurchase.set(item.purchase_entry_id, purchaseItems);
    return itemsByPurchase;
  }, new Map<string, PurchaseEntryItemRecord[]>());
}

function buildKpis(entries: PurchaseEntryRecord[]): PurchaseEntriesKpis {
  return entries.reduce(
    (kpis, entry) => {
      const status = entry.purchase_status;
      const purchaseValue = toNumber(entry.total_cost);

      return {
        cancelledPurchases:
          kpis.cancelledPurchases + (status === "cancelled" ? 1 : 0),
        draftPurchases: kpis.draftPurchases + (status === "draft" ? 1 : 0),
        orderedPurchases:
          kpis.orderedPurchases + (status === "ordered" ? 1 : 0),
        partiallyReceivedPurchases:
          kpis.partiallyReceivedPurchases +
          (status === "partially_received" ? 1 : 0),
        pendingReceivePurchases:
          kpis.pendingReceivePurchases +
          (!entry.stock_received && status !== "cancelled" ? 1 : 0),
        receivedPurchaseValue:
          kpis.receivedPurchaseValue +
          (entry.stock_received || status === "received" ? purchaseValue : 0),
        receivedPurchases:
          kpis.receivedPurchases +
          (entry.stock_received || status === "received" ? 1 : 0),
        totalPurchases: kpis.totalPurchases + 1,
        totalPurchaseValue: kpis.totalPurchaseValue + purchaseValue,
      };
    },
    { ...emptyKpis },
  );
}

export async function getPurchaseEntriesFromSupabase(): Promise<PurchaseEntriesData> {
  try {
    const supabase = createAdminSupabaseClient();
    const [entriesResponse, itemsResponse] = await Promise.all([
      supabase
        .from("purchase_entries")
        .select(
          [
            "id",
            "purchase_number",
            "supplier_id",
            "purchase_status",
            "total_cost",
            "note",
            "received_at",
            "stock_received",
            "stock_received_at",
            "created_at",
            "updated_at",
            "suppliers(name, phone, email, status)",
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
            "created_at",
          ].join(", "),
        )
        .order("created_at", { ascending: true }),
    ]);

    if (entriesResponse.error || itemsResponse.error) {
      console.error("Failed to load purchase entries from Supabase.");
      return emptyPurchaseEntriesData;
    }

    const itemsByPurchase = buildItemsByPurchase(
      (itemsResponse.data ?? []) as unknown as PurchaseEntryItemRecord[],
    );
    const entries = (
      (entriesResponse.data ?? []) as unknown as PurchaseEntryRow[]
    ).map(({ suppliers, ...entry }) => ({
      ...entry,
      items: itemsByPurchase.get(entry.id) ?? [],
      purchase_status: entry.purchase_status ?? "draft",
      stock_received: Boolean(entry.stock_received),
      supplier: normalizeSupplier(suppliers),
      total_cost: toNumber(entry.total_cost),
    }));

    return {
      entries,
      kpis: buildKpis(entries),
    };
  } catch {
    console.error("Failed to initialize purchase entries data source.");
    return emptyPurchaseEntriesData;
  }
}
