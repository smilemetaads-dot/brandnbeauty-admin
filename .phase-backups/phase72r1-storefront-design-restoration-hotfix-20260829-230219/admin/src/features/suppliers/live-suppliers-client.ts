import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type LiveSupplierPurchase = {
  createdAt: string | null;
  id: string;
  purchaseNumber: string;
  status: string;
  stockReceived: boolean;
  totalCost: number;
};

export type LiveSupplier = {
  address: string | null;
  cancelledPurchaseCount: number;
  contactPerson: string | null;
  createdAt: string | null;
  email: string | null;
  id: string;
  name: string;
  notes: string | null;
  paymentTerms: string | null;
  pendingPurchaseCount: number;
  pendingPurchaseValue: number;
  phone: string | null;
  purchaseCount: number;
  receivedPurchaseCount: number;
  receivedPurchaseValue: number;
  recentPurchases: LiveSupplierPurchase[];
  status: "active" | "inactive";
  supplierType: string | null;
  totalPurchaseValue: number;
  updatedAt: string | null;
};

export type SupplierInput = {
  address: string;
  contactPerson: string;
  email: string;
  name: string;
  notes: string;
  paymentTerms: string;
  phone: string;
  status: "active" | "inactive";
  supplierType: string;
};

type ApiPurchase = {
  created_at?: string | null;
  id?: string | number | null;
  purchase_number?: string | null;
  purchase_status?: string | null;
  stock_received?: boolean | number | string | null;
  total_cost?: number | string | null;
};

type ApiSupplier = {
  address?: string | null;
  cancelled_purchase_count?: number | string | null;
  contact_name?: string | null;
  contact_person?: string | null;
  created_at?: string | null;
  email?: string | null;
  id?: string | number | null;
  name?: string | null;
  notes?: string | null;
  payment_terms?: string | null;
  pending_purchase_count?: number | string | null;
  pending_purchase_value?: number | string | null;
  phone?: string | null;
  purchase_count?: number | string | null;
  received_purchase_count?: number | string | null;
  received_purchase_value?: number | string | null;
  recent_purchases?: ApiPurchase[];
  status?: string | null;
  supplier_type?: string | null;
  total_purchase_value?: number | string | null;
  updated_at?: string | null;
};

type SuppliersResponse = {
  message?: string;
  success?: boolean;
  supplier?: ApiSupplier;
  suppliers?: ApiSupplier[];
};

export const SUPPLIERS_ENDPOINT = bnbApiUrl("manage_suppliers.php");

function numberValue(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function textValue(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  return text || null;
}

function booleanValue(value: boolean | number | string | null | undefined) {
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "received"].includes(String(value ?? "").toLowerCase());
}

function normalizePurchase(purchase: ApiPurchase): LiveSupplierPurchase {
  return {
    createdAt: textValue(purchase.created_at),
    id: String(purchase.id ?? ""),
    purchaseNumber: textValue(purchase.purchase_number) ?? "Recorded purchase",
    status: textValue(purchase.purchase_status)?.toLowerCase() ?? "recorded",
    stockReceived: booleanValue(purchase.stock_received),
    totalCost: numberValue(purchase.total_cost),
  };
}

export function normalizeSupplier(supplier: ApiSupplier): LiveSupplier {
  const status = textValue(supplier.status)?.toLowerCase() === "inactive" ? "inactive" : "active";

  return {
    address: textValue(supplier.address),
    cancelledPurchaseCount: numberValue(supplier.cancelled_purchase_count),
    contactPerson: textValue(supplier.contact_person ?? supplier.contact_name),
    createdAt: textValue(supplier.created_at),
    email: textValue(supplier.email),
    id: String(supplier.id ?? ""),
    name: textValue(supplier.name) ?? "Unnamed Supplier",
    notes: textValue(supplier.notes),
    paymentTerms: textValue(supplier.payment_terms),
    pendingPurchaseCount: numberValue(supplier.pending_purchase_count),
    pendingPurchaseValue: numberValue(supplier.pending_purchase_value),
    phone: textValue(supplier.phone),
    purchaseCount: numberValue(supplier.purchase_count),
    receivedPurchaseCount: numberValue(supplier.received_purchase_count),
    receivedPurchaseValue: numberValue(supplier.received_purchase_value),
    recentPurchases: (supplier.recent_purchases ?? []).map(normalizePurchase),
    status,
    supplierType: textValue(supplier.supplier_type),
    totalPurchaseValue: numberValue(supplier.total_purchase_value),
    updatedAt: textValue(supplier.updated_at ?? supplier.created_at),
  };
}

function requestPayload(input: SupplierInput) {
  return {
    address: input.address,
    contact_person: input.contactPerson,
    email: input.email,
    name: input.name,
    notes: input.notes,
    payment_terms: input.paymentTerms,
    phone: input.phone,
    status: input.status,
    supplier_type: input.supplierType,
  };
}

async function parseResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as SuppliersResponse | null;
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || "Supplier request could not be completed.");
  }
  return payload;
}

export async function fetchLiveSuppliers(signal?: AbortSignal) {
  const response = await fetch(SUPPLIERS_ENDPOINT, {
    cache: "no-store",
    headers: adminAuthHeaders(),
    signal,
  });
  const payload = await parseResponse(response);

  return (payload.suppliers ?? []).map(normalizeSupplier);
}

export async function createLiveSupplier(input: SupplierInput) {
  const response = await fetch(SUPPLIERS_ENDPOINT, {
    body: JSON.stringify(requestPayload(input)),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  const payload = await parseResponse(response);

  if (!payload.supplier) throw new Error("Supplier was saved but no record was returned.");
  return normalizeSupplier(payload.supplier);
}

export async function updateLiveSupplier(id: string, input: SupplierInput) {
  const response = await fetch(SUPPLIERS_ENDPOINT, {
    body: JSON.stringify({ id, ...requestPayload(input) }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "PUT",
  });
  const payload = await parseResponse(response);

  if (!payload.supplier) throw new Error("Supplier was updated but no record was returned.");
  return normalizeSupplier(payload.supplier);
}
