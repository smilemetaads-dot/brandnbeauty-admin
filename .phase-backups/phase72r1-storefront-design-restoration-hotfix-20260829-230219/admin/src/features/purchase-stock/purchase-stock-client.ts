import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type PurchaseStatus = "draft" | "awaiting_approval" | "approved" | "partially_received" | "received" | "cancelled";

export type PurchaseSupplier = { id: string; name: string; paymentTerms: string; status: string };
export type PurchaseProduct = { brand: string; id: string; image: string; name: string; onHand: number; sku: string };
export type PurchaseLine = { batchCode: string; expiryDate: string; id: string; orderedQuantity: number; productId: string; productName: string; qcStatus: string; receivedQuantity: number; sku: string; unitCost: number };
export type PurchaseEvent = { actor: string; createdAt: string; detail: string; eventType: string; id: string; summary: string };
export type PurchaseOrder = {
  approvedAt: string; approvedBy: string; createdAt: string; createdBy: string; events: PurchaseEvent[]; expectedDate: string;
  id: string; internalNote: string; lines: PurchaseLine[]; otherCost: number; paidAmount: number; paymentTerms: string;
  purchaseNumber: string; receivedAt: string; shippingCost: number; status: PurchaseStatus; subtotal: number;
  supplierId: string; supplierName: string; totalCost: number; updatedAt: string;
};
export type PurchaseSummary = { awaitingApproval: number; incomingUnits: number; openOrders: number; openPurchaseValue: number; receiving: number; totalOrders: number };

const ENDPOINT = bnbApiUrl("manage_purchase_stock.php");

function text(value: unknown) { return typeof value === "string" || typeof value === "number" ? String(value).trim() : ""; }
function number(value: unknown) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function status(value: unknown): PurchaseStatus { return ["draft", "awaiting_approval", "approved", "partially_received", "received", "cancelled"].includes(String(value)) ? value as PurchaseStatus : "draft"; }

function line(raw: unknown): PurchaseLine | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>; const id = text(row.id); if (!id) return null;
  return { batchCode: text(row.batch_code), expiryDate: text(row.expiry_date), id, orderedQuantity: number(row.ordered_quantity), productId: text(row.product_id), productName: text(row.product_name), qcStatus: text(row.qc_status), receivedQuantity: number(row.received_quantity), sku: text(row.sku), unitCost: number(row.unit_cost) };
}

function event(raw: unknown): PurchaseEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>; const id = text(row.id); if (!id) return null;
  return { actor: text(row.actor), createdAt: text(row.created_at), detail: text(row.detail), eventType: text(row.event_type), id, summary: text(row.summary) };
}

function order(raw: unknown): PurchaseOrder | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>; const id = text(row.id); if (!id) return null;
  return {
    approvedAt: text(row.approved_at), approvedBy: text(row.approved_by), createdAt: text(row.created_at), createdBy: text(row.created_by),
    events: (Array.isArray(row.events) ? row.events : []).map(event).filter((item): item is PurchaseEvent => Boolean(item)), expectedDate: text(row.expected_date), id,
    internalNote: text(row.internal_note), lines: (Array.isArray(row.lines) ? row.lines : []).map(line).filter((item): item is PurchaseLine => Boolean(item)),
    otherCost: number(row.other_cost), paidAmount: number(row.paid_amount), paymentTerms: text(row.payment_terms), purchaseNumber: text(row.purchase_number),
    receivedAt: text(row.received_at), shippingCost: number(row.shipping_cost), status: status(row.status), subtotal: number(row.subtotal), supplierId: text(row.supplier_id),
    supplierName: text(row.supplier_name), totalCost: number(row.total_cost), updatedAt: text(row.updated_at),
  };
}

function parseState(payload: Record<string, unknown>) {
  const row = payload.state && typeof payload.state === "object" ? payload.state as Record<string, unknown> : payload;
  const rawSummary = row.summary && typeof row.summary === "object" ? row.summary as Record<string, unknown> : {};
  return {
    generatedAt: text(row.generated_at),
    orders: (Array.isArray(row.orders) ? row.orders : []).map(order).filter((item): item is PurchaseOrder => Boolean(item)),
    products: (Array.isArray(row.products) ? row.products : []).map((item) => { const value = item as Record<string, unknown>; return { brand: text(value.brand), id: text(value.id), image: text(value.image), name: text(value.name), onHand: number(value.on_hand), sku: text(value.sku) }; }).filter((item) => item.id && item.name),
    suppliers: (Array.isArray(row.suppliers) ? row.suppliers : []).map((item) => { const value = item as Record<string, unknown>; return { id: text(value.id), name: text(value.name), paymentTerms: text(value.payment_terms), status: text(value.status) }; }).filter((item) => item.id && item.name),
    summary: { awaitingApproval: number(rawSummary.awaiting_approval), incomingUnits: number(rawSummary.incoming_units), openOrders: number(rawSummary.open_orders), openPurchaseValue: number(rawSummary.open_purchase_value), receiving: number(rawSummary.receiving), totalOrders: number(rawSummary.total_orders) } as PurchaseSummary,
  };
}

async function request(body?: Record<string, unknown>, signal?: AbortSignal) {
  const response = await fetch(ENDPOINT, { body: body ? JSON.stringify(body) : undefined, cache: "no-store", headers: adminAuthHeaders(body ? { "Content-Type": "application/json" } : undefined), method: body ? "POST" : "GET", signal });
  const payload = await response.json() as Record<string, unknown> & { message?: string; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "The purchase request could not be completed.");
  return { ...parseState(payload), message: text(payload.message) };
}

export function getPurchaseStock(signal?: AbortSignal) { return request(undefined, signal); }
export function createPurchaseDraft(input: { expectedDate: string; internalNote: string; otherCost: number; paymentTerms: string; productId: string; quantity: number; shippingCost: number; supplierId: string; unitCost: number }) {
  return request({ action: "create_draft", expected_date: input.expectedDate, internal_note: input.internalNote, lines: [{ product_id: input.productId, quantity: input.quantity, unit_cost: input.unitCost }], other_cost: input.otherCost, payment_terms: input.paymentTerms, shipping_cost: input.shippingCost, supplier_id: input.supplierId });
}
export function decidePurchase(action: "approve_order" | "cancel_order" | "submit_for_approval", orderId: string, note: string) { return request({ action, confirm: action === "approve_order" ? "approve" : action === "cancel_order" ? "cancel" : "", note, order_id: orderId }); }
export function receivePurchaseLine(input: { batchCode: string; expiryDate: string; lineId: string; note: string; orderId: string; quantity: number }) { return request({ action: "receive_line", batch_code: input.batchCode, confirm: "receive", expiry_date: input.expiryDate, line_id: input.lineId, note: input.note, order_id: input.orderId, quantity: input.quantity }); }
