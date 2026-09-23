import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type PurchaseStatus =
  | "draft"
  | "awaiting_approval"
  | "approved"
  | "partially_received"
  | "received"
  | "cancelled";

export type PurchaseSupplier = {
  id: string;
  name: string;
  paymentTerms: string;
  status: string;
};

export type PurchaseProduct = {
  available: number;
  brand: string;
  damaged: number;
  id: string;
  image: string;
  incoming: number;
  name: string;
  onHand: number;
  quarantine: number;
  reserved: number;
  sku: string;
};

export type PurchaseReceipt = {
  actor: string;
  batchCode: string;
  createdAt: string;
  damagedQuantity: number;
  expiryDate: string;
  id: string;
  productId: string;
  purchaseLineId: string;
  qcResult: string;
  quarantineOpenQuantity: number;
  quarantineQuantity: number;
  receivedQuantity: number;
  sellableQuantity: number;
  supplierReturnQuantity: number;
  verificationNote: string;
};

export type PurchaseLine = {
  batchCode: string;
  damagedReceivedQuantity: number;
  expiryDate: string;
  id: string;
  orderedQuantity: number;
  productId: string;
  productName: string;
  qcStatus: string;
  quarantineOpenQuantity: number;
  quarantineReceivedQuantity: number;
  receivedQuantity: number;
  receipts: PurchaseReceipt[];
  sellableReceivedQuantity: number;
  sku: string;
  supplierReturnQuantity: number;
  unitCost: number;
};

export type PurchaseEvent = {
  actor: string;
  createdAt: string;
  detail: string;
  eventType: string;
  id: string;
  summary: string;
};

export type FinanceObligation = {
  amount: number;
  dueDate: string;
  id: string;
  paidAmount: number;
  reference: string;
  status: string;
};

export type PurchaseOrder = {
  approvedAt: string;
  approvedBy: string;
  createdAt: string;
  createdBy: string;
  events: PurchaseEvent[];
  expectedDate: string;
  financeObligation: FinanceObligation | null;
  financeObligationId: string;
  id: string;
  internalNote: string;
  lines: PurchaseLine[];
  otherCost: number;
  paidAmount: number;
  paymentTerms: string;
  purchaseNumber: string;
  receivedAt: string;
  receipts: PurchaseReceipt[];
  shippingCost: number;
  status: PurchaseStatus;
  subtotal: number;
  supplierId: string;
  supplierName: string;
  totalCost: number;
  updatedAt: string;
};

export type PurchaseSummary = {
  awaitingApproval: number;
  damagedUnits: number;
  incomingUnits: number;
  linkedPayables: number;
  openOrders: number;
  openPurchaseValue: number;
  openQuarantineReceipts: number;
  quarantineUnits: number;
  receiving: number;
  sellableReceivedUnits: number;
  supplierReturnUnits: number;
  totalOrders: number;
};

const ENDPOINT = bnbApiUrl("manage_purchase_stock.php");

function text(value: unknown) {
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
}

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function purchaseStatus(value: unknown): PurchaseStatus {
  const candidate = String(value);
  return [
    "draft",
    "awaiting_approval",
    "approved",
    "partially_received",
    "received",
    "cancelled",
  ].includes(candidate)
    ? (candidate as PurchaseStatus)
    : "draft";
}

function parseReceipt(raw: unknown): PurchaseReceipt | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = text(row.id);
  if (!id) return null;

  return {
    actor: text(row.actor),
    batchCode: text(row.batch_code),
    createdAt: text(row.created_at),
    damagedQuantity: number(row.damaged_quantity),
    expiryDate: text(row.expiry_date),
    id,
    productId: text(row.product_id),
    purchaseLineId: text(row.purchase_line_id),
    qcResult: text(row.qc_result),
    quarantineOpenQuantity: number(row.quarantine_open_quantity),
    quarantineQuantity: number(row.quarantine_quantity),
    receivedQuantity: number(row.received_quantity),
    sellableQuantity: number(row.sellable_quantity),
    supplierReturnQuantity: number(row.supplier_return_quantity),
    verificationNote: text(row.verification_note),
  };
}

function parseLine(raw: unknown): PurchaseLine | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = text(row.id);
  if (!id) return null;

  return {
    batchCode: text(row.batch_code),
    damagedReceivedQuantity: number(row.damaged_received_quantity),
    expiryDate: text(row.expiry_date),
    id,
    orderedQuantity: number(row.ordered_quantity),
    productId: text(row.product_id),
    productName: text(row.product_name),
    qcStatus: text(row.qc_status),
    quarantineOpenQuantity: number(row.quarantine_open_quantity),
    quarantineReceivedQuantity: number(row.quarantine_received_quantity),
    receivedQuantity: number(row.received_quantity),
    receipts: (Array.isArray(row.receipts) ? row.receipts : [])
      .map(parseReceipt)
      .filter((item): item is PurchaseReceipt => Boolean(item)),
    sellableReceivedQuantity: number(row.sellable_received_quantity),
    sku: text(row.sku),
    supplierReturnQuantity: number(row.supplier_return_quantity),
    unitCost: number(row.unit_cost),
  };
}

function parseEvent(raw: unknown): PurchaseEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = text(row.id);
  if (!id) return null;

  return {
    actor: text(row.actor),
    createdAt: text(row.created_at),
    detail: text(row.detail),
    eventType: text(row.event_type),
    id,
    summary: text(row.summary),
  };
}

function parseObligation(raw: unknown): FinanceObligation | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = text(row.id);
  if (!id) return null;

  return {
    amount: number(row.amount),
    dueDate: text(row.due_date),
    id,
    paidAmount: number(row.paid_amount),
    reference: text(row.reference),
    status: text(row.status),
  };
}

function parseOrder(raw: unknown): PurchaseOrder | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = text(row.id);
  if (!id) return null;

  return {
    approvedAt: text(row.approved_at),
    approvedBy: text(row.approved_by),
    createdAt: text(row.created_at),
    createdBy: text(row.created_by),
    events: (Array.isArray(row.events) ? row.events : [])
      .map(parseEvent)
      .filter((item): item is PurchaseEvent => Boolean(item)),
    expectedDate: text(row.expected_date),
    financeObligation: parseObligation(row.finance_obligation),
    financeObligationId: text(row.finance_obligation_id),
    id,
    internalNote: text(row.internal_note),
    lines: (Array.isArray(row.lines) ? row.lines : [])
      .map(parseLine)
      .filter((item): item is PurchaseLine => Boolean(item)),
    otherCost: number(row.other_cost),
    paidAmount: number(row.paid_amount),
    paymentTerms: text(row.payment_terms),
    purchaseNumber: text(row.purchase_number),
    receivedAt: text(row.received_at),
    receipts: (Array.isArray(row.receipts) ? row.receipts : [])
      .map(parseReceipt)
      .filter((item): item is PurchaseReceipt => Boolean(item)),
    shippingCost: number(row.shipping_cost),
    status: purchaseStatus(row.status),
    subtotal: number(row.subtotal),
    supplierId: text(row.supplier_id),
    supplierName: text(row.supplier_name),
    totalCost: number(row.total_cost),
    updatedAt: text(row.updated_at),
  };
}

function parseState(payload: Record<string, unknown>) {
  const row =
    payload.state && typeof payload.state === "object"
      ? (payload.state as Record<string, unknown>)
      : payload;

  const rawSummary =
    row.summary && typeof row.summary === "object"
      ? (row.summary as Record<string, unknown>)
      : {};

  return {
    generatedAt: text(row.generated_at),
    orders: (Array.isArray(row.orders) ? row.orders : [])
      .map(parseOrder)
      .filter((item): item is PurchaseOrder => Boolean(item)),
    products: (Array.isArray(row.products) ? row.products : [])
      .map((item) => {
        const value = item as Record<string, unknown>;
        return {
          available: number(value.available),
          brand: text(value.brand),
          damaged: number(value.damaged),
          id: text(value.id),
          image: text(value.image),
          incoming: number(value.incoming),
          name: text(value.name),
          onHand: number(value.on_hand),
          quarantine: number(value.quarantine),
          reserved: number(value.reserved),
          sku: text(value.sku),
        };
      })
      .filter((item) => item.id && item.name),
    suppliers: (Array.isArray(row.suppliers) ? row.suppliers : [])
      .map((item) => {
        const value = item as Record<string, unknown>;
        return {
          id: text(value.id),
          name: text(value.name),
          paymentTerms: text(value.payment_terms),
          status: text(value.status),
        };
      })
      .filter((item) => item.id && item.name),
    summary: {
      awaitingApproval: number(rawSummary.awaiting_approval),
      damagedUnits: number(rawSummary.damaged_units),
      incomingUnits: number(rawSummary.incoming_units),
      linkedPayables: number(rawSummary.linked_payables),
      openOrders: number(rawSummary.open_orders),
      openPurchaseValue: number(rawSummary.open_purchase_value),
      openQuarantineReceipts: number(rawSummary.open_quarantine_receipts),
      quarantineUnits: number(rawSummary.quarantine_units),
      receiving: number(rawSummary.receiving),
      sellableReceivedUnits: number(rawSummary.sellable_received_units),
      supplierReturnUnits: number(rawSummary.supplier_return_units),
      totalOrders: number(rawSummary.total_orders),
    } as PurchaseSummary,
  };
}

async function request(
  body?: Record<string, unknown>,
  signal?: AbortSignal,
) {
  const response = await fetch(ENDPOINT, {
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    headers: adminAuthHeaders(
      body ? { "Content-Type": "application/json" } : undefined,
    ),
    method: body ? "POST" : "GET",
    signal,
  });

  const payload = (await response.json().catch(() => null)) as
    | (Record<string, unknown> & {
        message?: string;
        success?: boolean;
      })
    | null;

  if (!response.ok || !payload || payload.success === false) {
    throw new Error(
      payload?.message || "The purchase request could not be completed.",
    );
  }

  return {
    ...parseState(payload),
    message: text(payload.message),
  };
}

export function getPurchaseStock(signal?: AbortSignal) {
  return request(undefined, signal);
}

export function createPurchaseDraft(input: {
  expectedDate: string;
  internalNote: string;
  otherCost: number;
  paymentTerms: string;
  productId: string;
  quantity: number;
  shippingCost: number;
  supplierId: string;
  unitCost: number;
}) {
  return request({
    action: "create_draft",
    expected_date: input.expectedDate,
    internal_note: input.internalNote,
    lines: [
      {
        product_id: input.productId,
        quantity: input.quantity,
        unit_cost: input.unitCost,
      },
    ],
    other_cost: input.otherCost,
    payment_terms: input.paymentTerms,
    shipping_cost: input.shippingCost,
    supplier_id: input.supplierId,
  });
}

export function decidePurchase(
  action: "approve_order" | "cancel_order" | "submit_for_approval",
  orderId: string,
  note: string,
) {
  return request({
    action,
    confirm:
      action === "approve_order"
        ? "approve"
        : action === "cancel_order"
          ? "cancel"
          : "",
    note,
    order_id: orderId,
  });
}

export function receivePurchaseLine(input: {
  batchCode: string;
  damagedQuantity: number;
  expiryDate: string;
  lineId: string;
  note: string;
  orderId: string;
  quantity: number;
  quarantineQuantity: number;
  sellableQuantity: number;
  supplierReturnQuantity: number;
}) {
  return request({
    action: "receive_line",
    batch_code: input.batchCode,
    confirm: "receive",
    damaged_quantity: input.damagedQuantity,
    expiry_date: input.expiryDate,
    line_id: input.lineId,
    note: input.note,
    order_id: input.orderId,
    quarantine_quantity: input.quarantineQuantity,
    quantity: input.quantity,
    sellable_quantity: input.sellableQuantity,
    supplier_return_quantity: input.supplierReturnQuantity,
  });
}

export function resolvePurchaseQuarantine(input: {
  note: string;
  quantity: number;
  receiptId: string;
  resolution:
    | "released_sellable"
    | "marked_damaged"
    | "returned_supplier";
}) {
  return request({
    action: "resolve_quarantine",
    confirm: "resolve",
    note: input.note,
    quantity: input.quantity,
    receipt_id: input.receiptId,
    resolution: input.resolution,
  });
}

export function createPurchasePayable(input: {
  amount: number;
  dueDate: string;
  note: string;
  orderId: string;
}) {
  return request({
    action: "create_payable",
    amount: input.amount,
    confirm: "create_payable",
    due_date: input.dueDate,
    note: input.note,
    order_id: input.orderId,
  });
}
