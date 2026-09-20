import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type SupplierAnalyticsTimeframe = "90D" | "6M" | "12M";
export type SupplierEvidenceState = "building" | "no_evidence" | "review" | "stable" | "watch";
export type SupplierAnalyticsRow = {
  averageLeadDays: number | null; completedCount: number; evidenceState: SupplierEvidenceState; fulfillmentRate: number | null;
  id: string; lastPurchaseAt: string; name: string; onTimeRate: number | null; openCommitment: number; openCount: number;
  orderedUnits: number; paymentTerms: string; purchaseCount: number; purchaseSpend: number; receivedUnits: number;
  score: number | null; spendShare: number; status: string; supplierType: string;
};
export type SupplierAnalyticsSummary = {
  averageLeadDays: number | null; completedReceipts: number; evidenceSuppliers: number; onTimeRate: number | null;
  purchaseSpend: number; receivedUnits: number; topSupplierExposure: number; totalSuppliers: number;
};
export type SupplierTrendPoint = { key: string; label: string; receivedUnits: number; spend: number };
export type SupplierAnalyticsState = {
  generatedAt: string; methodology: { boundary: string; receipts: string; score: string; spend: string };
  summary: SupplierAnalyticsSummary; suppliers: SupplierAnalyticsRow[]; timeframe: SupplierAnalyticsTimeframe; trend: SupplierTrendPoint[];
};

function text(value: unknown) { return typeof value === "string" || typeof value === "number" ? String(value).trim() : ""; }
function number(value: unknown) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function nullableNumber(value: unknown) { return value === null || value === undefined || value === "" ? null : number(value); }
function evidenceState(value: unknown): SupplierEvidenceState { return ["building", "no_evidence", "review", "stable", "watch"].includes(String(value)) ? value as SupplierEvidenceState : "no_evidence"; }

function parseState(payload: Record<string, unknown>): SupplierAnalyticsState {
  const rawSummary = payload.summary && typeof payload.summary === "object" ? payload.summary as Record<string, unknown> : {};
  const rawMethodology = payload.methodology && typeof payload.methodology === "object" ? payload.methodology as Record<string, unknown> : {};
  const timeframe = ["90D", "6M", "12M"].includes(String(payload.timeframe)) ? payload.timeframe as SupplierAnalyticsTimeframe : "6M";
  const suppliers = (Array.isArray(payload.suppliers) ? payload.suppliers : []).map((item): SupplierAnalyticsRow | null => {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>; const id = text(row.id); const name = text(row.name); if (!id || !name) return null;
    return {
      averageLeadDays: nullableNumber(row.average_lead_days), completedCount: number(row.completed_count), evidenceState: evidenceState(row.evidence_state),
      fulfillmentRate: nullableNumber(row.fulfillment_rate), id, lastPurchaseAt: text(row.last_purchase_at), name, onTimeRate: nullableNumber(row.on_time_rate),
      openCommitment: number(row.open_commitment), openCount: number(row.open_count), orderedUnits: number(row.ordered_units), paymentTerms: text(row.payment_terms),
      purchaseCount: number(row.purchase_count), purchaseSpend: number(row.purchase_spend), receivedUnits: number(row.received_units), score: nullableNumber(row.score),
      spendShare: number(row.spend_share), status: text(row.status), supplierType: text(row.supplier_type),
    };
  }).filter((item): item is SupplierAnalyticsRow => Boolean(item));
  const trend = (Array.isArray(payload.trend) ? payload.trend : []).map((item): SupplierTrendPoint | null => {
    if (!item || typeof item !== "object") return null; const row = item as Record<string, unknown>; const key = text(row.key); if (!key) return null;
    return { key, label: text(row.label), receivedUnits: number(row.received_units), spend: number(row.spend) };
  }).filter((item): item is SupplierTrendPoint => Boolean(item));
  return {
    generatedAt: text(payload.generated_at), methodology: { boundary: text(rawMethodology.boundary), receipts: text(rawMethodology.receipts), score: text(rawMethodology.score), spend: text(rawMethodology.spend) },
    summary: { averageLeadDays: nullableNumber(rawSummary.average_lead_days), completedReceipts: number(rawSummary.completed_receipts), evidenceSuppliers: number(rawSummary.evidence_suppliers), onTimeRate: nullableNumber(rawSummary.on_time_rate), purchaseSpend: number(rawSummary.purchase_spend), receivedUnits: number(rawSummary.received_units), topSupplierExposure: number(rawSummary.top_supplier_exposure), totalSuppliers: number(rawSummary.total_suppliers) },
    suppliers, timeframe, trend,
  };
}

export async function getSupplierAnalytics(timeframe: SupplierAnalyticsTimeframe, signal?: AbortSignal): Promise<SupplierAnalyticsState> {
  const response = await fetch(`${bnbApiUrl("manage_supplier_analytics.php")}?timeframe=${encodeURIComponent(timeframe)}`, { cache: "no-store", headers: adminAuthHeaders(), signal });
  const payload = await response.json() as Record<string, unknown> & { message?: string; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(text(payload.message) || "Supplier Analytics could not be loaded.");
  return parseState(payload);
}
