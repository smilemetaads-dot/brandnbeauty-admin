import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type IntelligencePriority = "urgent" | "review" | "watch" | "stable" | "no_history" | "source_unavailable";

export type IntelligenceProduct = {
  brand: string;
  category: string;
  dailyVelocity: number;
  daysCover: number | null;
  id: string;
  image: string;
  leadTimeDays: number;
  lowStockThreshold: number;
  name: string;
  onHand: number;
  priority: IntelligencePriority;
  recommendedQuantity: number;
  safetyDays: number;
  sku: string;
  sold30d: number;
  sold90d: number;
  velocityBasis: string;
};

export type IntelligenceSummary = {
  noHistory: number;
  observedDemandSkus: number;
  reorderCandidates: number;
  review: number;
  totalSkus: number;
  urgent: number;
};

export type IntelligenceSource = {
  itemTable: string;
  message: string;
  ready: boolean;
  statusGuarded: boolean;
};

export type IntelligencePolicy = {
  leadTimeDays: number;
  safetyDays: number;
  targetCoverDays: number;
};

const ENDPOINT = bnbApiUrl("manage_inventory_intelligence.php");

function text(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function priority(value: unknown): IntelligencePriority {
  return ["urgent", "review", "watch", "stable", "no_history", "source_unavailable"].includes(String(value))
    ? value as IntelligencePriority
    : "no_history";
}

function product(raw: unknown): IntelligenceProduct | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = text(row.id);
  const name = text(row.name);
  if (!id || !name) return null;
  const rawCover = row.days_cover;
  return {
    brand: text(row.brand),
    category: text(row.category),
    dailyVelocity: Math.max(0, number(row.daily_velocity)),
    daysCover: rawCover === null || rawCover === undefined || rawCover === "" ? null : Math.max(0, number(rawCover)),
    id,
    image: text(row.image),
    leadTimeDays: Math.max(0, number(row.lead_time_days)),
    lowStockThreshold: Math.max(0, number(row.low_stock_threshold)),
    name,
    onHand: Math.max(0, number(row.on_hand)),
    priority: priority(row.priority),
    recommendedQuantity: Math.max(0, number(row.recommended_quantity)),
    safetyDays: Math.max(0, number(row.safety_days)),
    sku: text(row.sku),
    sold30d: Math.max(0, number(row.sold_30d)),
    sold90d: Math.max(0, number(row.sold_90d)),
    velocityBasis: text(row.velocity_basis),
  };
}

export async function getInventoryIntelligence(signal?: AbortSignal): Promise<{
  generatedAt: string;
  policy: IntelligencePolicy;
  products: IntelligenceProduct[];
  source: IntelligenceSource;
  summary: IntelligenceSummary;
}> {
  const response = await fetch(ENDPOINT, { cache: "no-store", headers: adminAuthHeaders(), signal });
  const payload = await response.json() as Record<string, unknown> & { message?: string; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Inventory intelligence could not be loaded.");
  const rawProducts = Array.isArray(payload.products) ? payload.products : [];
  const products = rawProducts.map(product).filter((item): item is IntelligenceProduct => Boolean(item));
  const rawSummary = payload.summary && typeof payload.summary === "object" ? payload.summary as Record<string, unknown> : {};
  const rawSource = payload.source && typeof payload.source === "object" ? payload.source as Record<string, unknown> : {};
  const rawPolicy = payload.policy && typeof payload.policy === "object" ? payload.policy as Record<string, unknown> : {};
  return {
    generatedAt: text(payload.generated_at),
    policy: {
      leadTimeDays: number(rawPolicy.lead_time_days),
      safetyDays: number(rawPolicy.safety_days),
      targetCoverDays: number(rawPolicy.target_cover_days),
    },
    products,
    source: {
      itemTable: text(rawSource.item_table),
      message: text(rawSource.message),
      ready: Boolean(rawSource.ready),
      statusGuarded: Boolean(rawSource.status_guarded),
    },
    summary: {
      noHistory: number(rawSummary.no_history),
      observedDemandSkus: number(rawSummary.observed_demand_skus),
      reorderCandidates: number(rawSummary.reorder_candidates),
      review: number(rawSummary.review),
      totalSkus: number(rawSummary.total_skus) || products.length,
      urgent: number(rawSummary.urgent),
    },
  };
}
