import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type RecommendationStatus = "draft" | "active" | "paused" | "archived";
export type RecommendationEffectiveStatus = RecommendationStatus | "scheduled" | "expired";
export type RecommendationStrategy = "complete_routine" | "frequently_bought_together" | "similar_alternative" | "upgrade" | "best_sellers" | "new_arrivals";
export type RecommendationMethod = "manual" | "rule_assisted";
export type RecommendationSurface = "product_page" | "cart" | "homepage" | "search_no_result";
export type RecommendationFallback = "hide_block" | "best_in_stock";

export type RecommendationProduct = {
  id: string;
  image: string;
  name: string;
  sku: string;
  status: string;
  stock: number;
};

export type LiveRecommendation = {
  createdAt: string;
  effectiveStatus: RecommendationEffectiveStatus;
  endsAt: string;
  fallbackMode: RecommendationFallback;
  id: string;
  method: RecommendationMethod;
  name: string;
  notes: string;
  priority: number;
  publishedAt: string;
  readiness: { blockers: string[]; ready: boolean };
  sourceProduct: RecommendationProduct | null;
  sourceProductId: string;
  startsAt: string;
  status: RecommendationStatus;
  strategy: RecommendationStrategy;
  surfaces: RecommendationSurface[];
  targetProductIds: string[];
  targetProducts: RecommendationProduct[];
  updatedAt: string;
};

export type RecommendationsSummary = {
  activeNow: number;
  archived: number;
  drafts: number;
  needsReview: number;
  paused: number;
  scheduled: number;
  total: number;
};

export type RecommendationsState = {
  generatedAt: string;
  recommendations: LiveRecommendation[];
  summary: RecommendationsSummary;
};

export type RecommendationDraftInput = {
  endsAt: string;
  fallbackMode: RecommendationFallback;
  id: string;
  method: RecommendationMethod;
  name: string;
  notes: string;
  priority: number;
  sourceProductId: string;
  startsAt: string;
  strategy: RecommendationStrategy;
  surfaces: RecommendationSurface[];
  targetProductIds: string[];
};

type RecommendationsResponse = {
  generated_at?: unknown;
  message?: string;
  recommendations?: unknown[];
  success?: boolean;
  summary?: unknown;
};

const MANAGE_RECOMMENDATIONS_ENDPOINT = bnbApiUrl("manage_product_recommendations.php");

function text(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function numberValue(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function normalizeStatus(value: unknown): RecommendationStatus {
  const status = text(value).toLowerCase();
  return status === "active" || status === "paused" || status === "archived" ? status : "draft";
}

function normalizeEffectiveStatus(value: unknown, fallback: RecommendationStatus): RecommendationEffectiveStatus {
  const status = text(value).toLowerCase();
  return status === "scheduled" || status === "expired" ? status : normalizeStatus(status || fallback);
}

function normalizeStrategy(value: unknown): RecommendationStrategy {
  const strategy = text(value).toLowerCase();
  return strategy === "frequently_bought_together" || strategy === "similar_alternative" || strategy === "upgrade" || strategy === "best_sellers" || strategy === "new_arrivals" ? strategy : "complete_routine";
}

function normalizeMethod(value: unknown): RecommendationMethod {
  return text(value).toLowerCase() === "rule_assisted" ? "rule_assisted" : "manual";
}

function normalizeFallback(value: unknown): RecommendationFallback {
  return text(value).toLowerCase() === "best_in_stock" ? "best_in_stock" : "hide_block";
}

function normalizeSurfaces(value: unknown): RecommendationSurface[] {
  const allowed = new Set<RecommendationSurface>(["product_page", "cart", "homepage", "search_no_result"]);
  return stringList(value).filter((item): item is RecommendationSurface => allowed.has(item as RecommendationSurface));
}

function normalizeProduct(value: unknown): RecommendationProduct | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = text(row.id);
  const name = text(row.name);
  if (!id || !name) return null;
  return {
    id,
    image: text(row.image),
    name,
    sku: text(row.sku),
    status: text(row.status),
    stock: Math.max(0, numberValue(row.stock)),
  };
}

function normalizeRecommendation(value: unknown): LiveRecommendation | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = text(row.id);
  const name = text(row.name);
  if (!id || !name) return null;
  const status = normalizeStatus(row.status);
  const readiness = row.readiness && typeof row.readiness === "object" ? row.readiness as Record<string, unknown> : {};
  return {
    createdAt: text(row.created_at),
    effectiveStatus: normalizeEffectiveStatus(row.effective_status, status),
    endsAt: text(row.ends_at),
    fallbackMode: normalizeFallback(row.fallback_mode),
    id,
    method: normalizeMethod(row.method),
    name,
    notes: text(row.notes),
    priority: Math.max(1, numberValue(row.priority) || 100),
    publishedAt: text(row.published_at),
    readiness: { blockers: stringList(readiness.blockers), ready: Boolean(readiness.ready) },
    sourceProduct: normalizeProduct(row.source_product),
    sourceProductId: text(row.source_product_id),
    startsAt: text(row.starts_at),
    status,
    strategy: normalizeStrategy(row.strategy),
    surfaces: normalizeSurfaces(row.surfaces),
    targetProductIds: stringList(row.target_product_ids),
    targetProducts: (Array.isArray(row.target_products) ? row.target_products : []).map(normalizeProduct).filter((item): item is RecommendationProduct => Boolean(item)),
    updatedAt: text(row.updated_at),
  };
}

function normalizeSummary(value: unknown, recommendations: LiveRecommendation[]): RecommendationsSummary {
  const row = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    activeNow: numberValue(row.active_now),
    archived: numberValue(row.archived),
    drafts: numberValue(row.drafts),
    needsReview: numberValue(row.needs_review),
    paused: numberValue(row.paused),
    scheduled: numberValue(row.scheduled),
    total: numberValue(row.total) || recommendations.filter((item) => item.status !== "archived").length,
  };
}

async function parseResponse(response: Response): Promise<RecommendationsState> {
  const payload = (await response.json().catch(() => null)) as RecommendationsResponse | null;
  if (!response.ok || !payload?.success) throw new Error(payload?.message || "Product Recommendations request could not be completed.");
  const recommendations = (payload.recommendations ?? []).map(normalizeRecommendation).filter((item): item is LiveRecommendation => Boolean(item));
  return { generatedAt: text(payload.generated_at), recommendations, summary: normalizeSummary(payload.summary, recommendations) };
}

export async function fetchRecommendationsState(signal?: AbortSignal): Promise<RecommendationsState> {
  const response = await fetch(MANAGE_RECOMMENDATIONS_ENDPOINT, { cache: "no-store", headers: adminAuthHeaders(), signal });
  return parseResponse(response);
}

export async function saveRecommendationDraft(input: RecommendationDraftInput): Promise<RecommendationsState> {
  const response = await fetch(MANAGE_RECOMMENDATIONS_ENDPOINT, {
    body: JSON.stringify({
      action: "save_draft",
      confirmed: true,
      ends_at: input.endsAt || null,
      fallback_mode: input.fallbackMode,
      id: input.id || null,
      method: input.method,
      name: input.name,
      notes: input.notes,
      priority: input.priority,
      source_product_id: input.sourceProductId || null,
      starts_at: input.startsAt || null,
      strategy: input.strategy,
      surfaces: input.surfaces,
      target_product_ids: input.targetProductIds,
    }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  return parseResponse(response);
}

export async function changeRecommendationStatus(id: string, action: "publish" | "pause" | "archive", reason: string): Promise<RecommendationsState> {
  const response = await fetch(MANAGE_RECOMMENDATIONS_ENDPOINT, {
    body: JSON.stringify({ action, confirmed: true, id, reason }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  return parseResponse(response);
}
