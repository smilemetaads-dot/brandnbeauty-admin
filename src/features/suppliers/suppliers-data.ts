import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type SupplierRecord = {
  address: string | null;
  contact_person: string | null;
  created_at: string | null;
  email: string | null;
  id: string;
  name: string;
  notes: string | null;
  payment_terms: string | null;
  pendingPurchaseCount: number;
  phone: string | null;
  purchaseCount: number;
  status: string;
  totalPurchaseValue: number;
  updated_at: string | null;
};

type SupplierRow = Omit<
  SupplierRecord,
  "pendingPurchaseCount" | "purchaseCount" | "totalPurchaseValue"
>;

type PurchaseSummaryRow = {
  purchase_status: string | null;
  supplier_id: string | null;
  total_cost: number | null;
};

type SupplierPurchaseSummary = {
  pendingPurchaseCount: number;
  purchaseCount: number;
  totalPurchaseValue: number;
};

const emptyPurchaseSummary: SupplierPurchaseSummary = {
  pendingPurchaseCount: 0,
  purchaseCount: 0,
  totalPurchaseValue: 0,
};

function toNumber(value: number | null | undefined) {
  return Number(value ?? 0);
}

function buildPurchaseSummaryBySupplier(
  purchases: PurchaseSummaryRow[],
): Map<string, SupplierPurchaseSummary> {
  return purchases.reduce((summaryBySupplier, purchase) => {
    if (!purchase.supplier_id) {
      return summaryBySupplier;
    }

    const current =
      summaryBySupplier.get(purchase.supplier_id) ?? emptyPurchaseSummary;
    const nextSummary = {
      pendingPurchaseCount:
        current.pendingPurchaseCount +
        (purchase.purchase_status !== "received" &&
        purchase.purchase_status !== "cancelled"
          ? 1
          : 0),
      purchaseCount: current.purchaseCount + 1,
      totalPurchaseValue:
        current.totalPurchaseValue + toNumber(purchase.total_cost),
    };

    summaryBySupplier.set(purchase.supplier_id, nextSummary);
    return summaryBySupplier;
  }, new Map<string, SupplierPurchaseSummary>());
}

export async function getSuppliersFromSupabase(): Promise<SupplierRecord[]> {
  try {
    const supabase = createAdminSupabaseClient();
    const [suppliersResponse, purchasesResponse] = await Promise.all([
      supabase
        .from("suppliers")
        .select(
          [
            "id",
            "name",
            "contact_person",
            "phone",
            "email",
            "address",
            "payment_terms",
            "status",
            "notes",
            "created_at",
            "updated_at",
          ].join(", "),
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("purchase_entries")
        .select("supplier_id, purchase_status, total_cost"),
    ]);

    if (suppliersResponse.error || purchasesResponse.error) {
      console.error("Failed to load suppliers from Supabase.");
      return [];
    }

    const purchaseSummaryBySupplier = buildPurchaseSummaryBySupplier(
      (purchasesResponse.data ?? []) as unknown as PurchaseSummaryRow[],
    );

    return ((suppliersResponse.data ?? []) as unknown as SupplierRow[]).map(
      (supplier) => {
        const summary =
          purchaseSummaryBySupplier.get(supplier.id) ?? emptyPurchaseSummary;

        return {
          ...supplier,
          pendingPurchaseCount: summary.pendingPurchaseCount,
          purchaseCount: summary.purchaseCount,
          totalPurchaseValue: summary.totalPurchaseValue,
        };
      },
    );
  } catch {
    console.error("Failed to initialize suppliers data source.");
    return [];
  }
}
