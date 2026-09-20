import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type InventoryHealth = "in_stock" | "low" | "out";
export type MovementType = "increase" | "decrease" | "count";

export type InventoryProduct = {
  adjustmentDrafts: number;
  available: number;
  brand: string;
  category: string;
  health: InventoryHealth;
  id: string;
  image: string;
  incoming: number;
  lowStockThreshold: number;
  name: string;
  onHand: number;
  reserved: number;
  sku: string;
  updatedAt: string;
};

export type InventoryMovement = {
  actor: string;
  afterQuantity: number;
  beforeQuantity: number;
  createdAt: string;
  id: string;
  movementType: string;
  productId: string;
  productName: string;
  quantityDelta: number;
  reason: string;
  referenceCode: string;
  sku: string;
};

export type InventorySummary = {
  draftAdjustments: number;
  inStock: number;
  lowStock: number;
  onHandUnits: number;
  outOfStock: number;
  totalSkus: number;
};

export type InventoryDraftInput = {
  internalNote: string;
  movementType: MovementType;
  productId: string;
  quantity: number;
  reason: string;
  referenceCode: string;
};

const MANAGE_INVENTORY = bnbApiUrl("manage_inventory.php");

function text(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function health(value: unknown): InventoryHealth {
  return value === "low" || value === "out" ? value : "in_stock";
}

function product(raw: unknown): InventoryProduct | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = text(row.id);
  const name = text(row.name);
  if (!id || !name) return null;
  return {
    adjustmentDrafts: Math.max(0, number(row.adjustment_drafts)),
    available: Math.max(0, number(row.available)),
    brand: text(row.brand),
    category: text(row.category),
    health: health(row.health),
    id,
    image: text(row.image),
    incoming: Math.max(0, number(row.incoming)),
    lowStockThreshold: Math.max(0, number(row.low_stock_threshold)),
    name,
    onHand: Math.max(0, number(row.on_hand)),
    reserved: Math.max(0, number(row.reserved)),
    sku: text(row.sku),
    updatedAt: text(row.updated_at),
  };
}

function movement(raw: unknown): InventoryMovement | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = text(row.id);
  if (!id) return null;
  return {
    actor: text(row.actor),
    afterQuantity: number(row.after_quantity),
    beforeQuantity: number(row.before_quantity),
    createdAt: text(row.created_at),
    id,
    movementType: text(row.movement_type),
    productId: text(row.product_id),
    productName: text(row.product_name),
    quantityDelta: number(row.quantity_delta),
    reason: text(row.reason),
    referenceCode: text(row.reference_code),
    sku: text(row.sku),
  };
}

function summary(raw: unknown, products: InventoryProduct[]): InventorySummary {
  const row = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  return {
    draftAdjustments: number(row.draft_adjustments),
    inStock: number(row.in_stock),
    lowStock: number(row.low_stock),
    onHandUnits: number(row.on_hand_units),
    outOfStock: number(row.out_of_stock),
    totalSkus: number(row.total_skus) || products.length,
  };
}

async function jsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "The inventory request could not be completed.");
  return payload;
}

export async function getInventory(signal?: AbortSignal): Promise<{ movements: InventoryMovement[]; products: InventoryProduct[]; summary: InventorySummary }> {
  const response = await fetch(MANAGE_INVENTORY, { cache: "no-store", headers: adminAuthHeaders(), signal });
  const payload = await jsonResponse<{ movements?: unknown[]; products?: unknown[]; summary?: unknown }>(response);
  const products = (payload.products || []).map(product).filter((item): item is InventoryProduct => Boolean(item));
  const movements = (payload.movements || []).map(movement).filter((item): item is InventoryMovement => Boolean(item));
  return { movements, products, summary: summary(payload.summary, products) };
}

export async function createInventoryDraft(input: InventoryDraftInput): Promise<{ draftId: string; expectedAfter: number; expectedBefore: number }> {
  const response = await fetch(MANAGE_INVENTORY, {
    body: JSON.stringify({
      action: "create_draft",
      internal_note: input.internalNote,
      movement_type: input.movementType,
      product_id: input.productId,
      quantity: input.quantity,
      reason: input.reason,
      reference_code: input.referenceCode,
    }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  const payload = await jsonResponse<{ draft?: Record<string, unknown> }>(response);
  const draft = payload.draft || {};
  return { draftId: text(draft.id), expectedAfter: number(draft.expected_after), expectedBefore: number(draft.expected_before) };
}

export async function postInventoryDraft(draftId: string): Promise<void> {
  const response = await fetch(MANAGE_INVENTORY, {
    body: JSON.stringify({ action: "post_draft", confirm: "post", draft_id: draftId }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  await jsonResponse(response);
}

export async function discardInventoryDraft(draftId: string): Promise<void> {
  const response = await fetch(MANAGE_INVENTORY, {
    body: JSON.stringify({ action: "discard_draft", confirm: "discard", draft_id: draftId }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  await jsonResponse(response);
}
