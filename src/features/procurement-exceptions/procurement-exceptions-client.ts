import {
  getInventoryIntelligence,
  type IntelligenceProduct,
} from "@/features/inventory-intelligence/inventory-intelligence-client";
import {
  getPurchaseStock,
  type PurchaseOrder,
} from "@/features/purchase-stock/purchase-stock-client";
import {
  getSupplierAnalytics,
  type SupplierAnalyticsRow,
} from "@/features/supplier-analytics/supplier-analytics-client";

export type ReorderException = {
  kind: "reorder";
  product: IntelligenceProduct;
};

export type PurchaseException =
  | {
      kind: "awaiting_approval";
      order: PurchaseOrder;
    }
  | {
      kind: "overdue_receiving";
      order: PurchaseOrder;
    }
  | {
      kind: "quarantine";
      order: PurchaseOrder;
      openUnits: number;
    };

export type SupplierException = {
  kind: "supplier_review";
  supplier: SupplierAnalyticsRow;
};

function overdue(order: PurchaseOrder) {
  if (!order.expectedDate) return false;
  if (!["approved", "partially_received"].includes(order.status)) return false;
  const expected = new Date(order.expectedDate);
  if (Number.isNaN(expected.getTime())) return false;
  return expected.getTime() < Date.now();
}

function openQuarantine(order: PurchaseOrder) {
  return order.lines.reduce(
    (sum, line) => sum + Math.max(0, line.quarantineOpenQuantity || 0),
    0,
  );
}

export async function loadProcurementExceptions(signal?: AbortSignal) {
  const [inventory, purchases, suppliers] = await Promise.all([
    getInventoryIntelligence(signal),
    getPurchaseStock(signal),
    getSupplierAnalytics("90D", signal),
  ]);

  const reorder: ReorderException[] = inventory.products
    .filter(
      (product) =>
        product.recommendedQuantity > 0 ||
        ["urgent", "review", "watch"].includes(product.priority),
    )
    .map((product) => ({ kind: "reorder", product }));

  const purchase: PurchaseException[] = [];
  for (const order of purchases.orders) {
    if (order.status === "awaiting_approval") {
      purchase.push({ kind: "awaiting_approval", order });
    }
    if (overdue(order)) {
      purchase.push({ kind: "overdue_receiving", order });
    }
    const quarantine = openQuarantine(order);
    if (quarantine > 0) {
      purchase.push({ kind: "quarantine", order, openUnits: quarantine });
    }
  }

  const supplier: SupplierException[] = suppliers.suppliers
    .filter((item) => ["review", "watch"].includes(item.evidenceState))
    .map((item) => ({ kind: "supplier_review", supplier: item }));

  return {
    inventory,
    purchases,
    suppliers,
    reorder,
    purchase,
    supplier,
    summary: {
      reorderCandidates: reorder.length,
      urgentReorders: reorder.filter((item) => item.product.priority === "urgent").length,
      awaitingApproval: purchase.filter((item) => item.kind === "awaiting_approval").length,
      overdueReceiving: purchase.filter((item) => item.kind === "overdue_receiving").length,
      quarantineOrders: purchase.filter((item) => item.kind === "quarantine").length,
      supplierReview: supplier.length,
    },
  };
}
