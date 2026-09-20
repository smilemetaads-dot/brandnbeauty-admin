import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type OfferStatus = "draft" | "active" | "paused" | "ended" | "archived";
export type OfferEffectiveStatus = OfferStatus | "scheduled" | "expired";
export type OfferType = "percentage" | "fixed_amount" | "free_shipping";
export type OfferChannel = "website" | "admin" | "messenger" | "facebook";

export type OfferProduct = {
  id: string;
  name: string;
  sku: string;
};

export type LiveOffer = {
  channels: OfferChannel[];
  code: string;
  createdAt: string;
  discountValue: number;
  effectiveStatus: OfferEffectiveStatus;
  eligibilitySummary: string;
  endsAt: string;
  homepageEligible: boolean;
  id: string;
  maximumDiscount: number | null;
  minimumOrder: number;
  name: string;
  notes: string;
  perCustomerLimit: number | null;
  productIds: string[];
  products: OfferProduct[];
  publishedAt: string;
  readiness: { blockers: string[]; ready: boolean };
  stackable: boolean;
  startsAt: string;
  status: OfferStatus;
  updatedAt: string;
  usageLimit: number | null;
  offerType: OfferType;
};

export type OffersSummary = {
  activeNow: number;
  archived: number;
  drafts: number;
  needsReview: number;
  paused: number;
  scheduled: number;
  total: number;
};

export type OffersState = {
  generatedAt: string;
  offers: LiveOffer[];
  summary: OffersSummary;
};

export type OfferDraftInput = {
  channels: OfferChannel[];
  code: string;
  discountValue: number;
  eligibilitySummary: string;
  endsAt: string;
  homepageEligible: boolean;
  id: string;
  maximumDiscount: number | null;
  minimumOrder: number;
  name: string;
  notes: string;
  perCustomerLimit: number | null;
  productIds: string[];
  stackable: boolean;
  startsAt: string;
  usageLimit: number | null;
  offerType: OfferType;
};

type OffersResponse = {
  generated_at?: unknown;
  message?: string;
  offers?: unknown[];
  success?: boolean;
  summary?: unknown;
};

const MANAGE_OFFERS_ENDPOINT = bnbApiUrl("manage_offers_deals.php");

function text(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function numberValue(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function nullableNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function normalizeStatus(value: unknown): OfferStatus {
  const status = text(value).toLowerCase();
  return status === "active" || status === "paused" || status === "ended" || status === "archived" ? status : "draft";
}

function normalizeEffectiveStatus(value: unknown, fallback: OfferStatus): OfferEffectiveStatus {
  const status = text(value).toLowerCase();
  return status === "scheduled" || status === "expired" ? status : normalizeStatus(status || fallback);
}

function normalizeType(value: unknown): OfferType {
  const type = text(value).toLowerCase();
  return type === "fixed_amount" || type === "free_shipping" ? type : "percentage";
}

function normalizeChannels(value: unknown): OfferChannel[] {
  const allowed = new Set<OfferChannel>(["website", "admin", "messenger", "facebook"]);
  return stringList(value).filter((item): item is OfferChannel => allowed.has(item as OfferChannel));
}

function normalizeProduct(value: unknown): OfferProduct | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = text(row.id);
  const name = text(row.name);
  if (!id || !name) return null;
  return { id, name, sku: text(row.sku) };
}

function normalizeOffer(value: unknown): LiveOffer | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = text(row.id);
  const name = text(row.name);
  if (!id || !name) return null;
  const status = normalizeStatus(row.status);
  const readiness = row.readiness && typeof row.readiness === "object" ? row.readiness as Record<string, unknown> : {};
  return {
    channels: normalizeChannels(row.channels),
    code: text(row.code),
    createdAt: text(row.created_at),
    discountValue: numberValue(row.discount_value),
    effectiveStatus: normalizeEffectiveStatus(row.effective_status, status),
    eligibilitySummary: text(row.eligibility_summary),
    endsAt: text(row.ends_at),
    homepageEligible: Boolean(row.homepage_eligible),
    id,
    maximumDiscount: nullableNumber(row.maximum_discount),
    minimumOrder: numberValue(row.minimum_order),
    name,
    notes: text(row.notes),
    perCustomerLimit: nullableNumber(row.per_customer_limit),
    productIds: stringList(row.product_ids),
    products: (Array.isArray(row.products) ? row.products : []).map(normalizeProduct).filter((item): item is OfferProduct => Boolean(item)),
    publishedAt: text(row.published_at),
    readiness: { blockers: stringList(readiness.blockers), ready: Boolean(readiness.ready) },
    stackable: Boolean(row.stackable),
    startsAt: text(row.starts_at),
    status,
    updatedAt: text(row.updated_at),
    usageLimit: nullableNumber(row.usage_limit),
    offerType: normalizeType(row.offer_type),
  };
}

function normalizeSummary(value: unknown, offers: LiveOffer[]): OffersSummary {
  const row = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    activeNow: numberValue(row.active_now),
    archived: numberValue(row.archived),
    drafts: numberValue(row.drafts),
    needsReview: numberValue(row.needs_review),
    paused: numberValue(row.paused),
    scheduled: numberValue(row.scheduled),
    total: numberValue(row.total) || offers.filter((offer) => offer.status !== "archived").length,
  };
}

async function parseResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as OffersResponse | null;
  if (!response.ok || !payload?.success) throw new Error(payload?.message || "Offers & Deals request could not be completed.");
  const offers = (payload.offers ?? []).map(normalizeOffer).filter((item): item is LiveOffer => Boolean(item));
  return { generatedAt: text(payload.generated_at), offers, summary: normalizeSummary(payload.summary, offers) };
}

export async function fetchOffersState(signal?: AbortSignal): Promise<OffersState> {
  const response = await fetch(MANAGE_OFFERS_ENDPOINT, { cache: "no-store", headers: adminAuthHeaders(), signal });
  return parseResponse(response);
}

function draftPayload(input: OfferDraftInput) {
  return {
    channels: input.channels,
    code: input.code,
    discount_value: input.discountValue,
    eligibility_summary: input.eligibilitySummary,
    ends_at: input.endsAt || null,
    homepage_eligible: input.homepageEligible,
    id: input.id || null,
    maximum_discount: input.maximumDiscount,
    minimum_order: input.minimumOrder,
    name: input.name,
    notes: input.notes,
    offer_type: input.offerType,
    per_customer_limit: input.perCustomerLimit,
    product_ids: input.productIds,
    stackable: input.stackable,
    starts_at: input.startsAt || null,
    usage_limit: input.usageLimit,
  };
}

export async function saveOfferDraft(input: OfferDraftInput): Promise<OffersState> {
  const response = await fetch(MANAGE_OFFERS_ENDPOINT, {
    body: JSON.stringify({ action: "save_draft", confirmed: true, ...draftPayload(input) }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  return parseResponse(response);
}

export async function changeOfferStatus(id: string, action: "publish" | "pause" | "end" | "archive", reason: string): Promise<OffersState> {
  const response = await fetch(MANAGE_OFFERS_ENDPOINT, {
    body: JSON.stringify({ action, confirmed: true, id, reason }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  return parseResponse(response);
}
