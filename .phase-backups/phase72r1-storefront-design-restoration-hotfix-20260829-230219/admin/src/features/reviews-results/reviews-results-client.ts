import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type ReviewEntry = {
  adminNote: string;
  consentObtained: boolean;
  createdAt: string | null;
  customerDisplayName: string;
  duration: string;
  entryType: "real_result" | "review";
  featured: boolean;
  id: number;
  mediaUrl: string;
  orderReference: string;
  productName: string;
  rating: number;
  reviewText: string;
  source: "facebook" | "manual" | "messenger" | "website";
  status: "approved" | "archived" | "pending" | "rejected";
  updatedAt: string | null;
  verifiedPurchase: boolean;
};

export type ReviewsCmsConfig = {
  displayLimit: number;
  heading: string;
  minimumRating: number;
  showMedia: boolean;
  showRatings: boolean;
  showVerifiedBadge: boolean;
  supportingLine: string;
  visible: boolean;
};

export type ReviewsCmsVersion = {
  publishedAt: string | null;
  publishedBy: string;
  version: number;
};

export type ReviewsCmsState = {
  draft: ReviewsCmsConfig;
  entries: ReviewEntry[];
  live: ReviewsCmsConfig;
  publishedAt: string | null;
  updatedAt: string | null;
  version: number;
  versions: ReviewsCmsVersion[];
};

type ApiEntry = {
  admin_note?: string;
  consent_obtained?: boolean | number | string;
  created_at?: string | null;
  customer_display_name?: string;
  duration?: string;
  entry_type?: string;
  featured?: boolean | number | string;
  id?: number | string;
  media_url?: string;
  order_reference?: string;
  product_name?: string;
  rating?: number | string;
  review_text?: string;
  source?: string;
  status?: string;
  updated_at?: string | null;
  verified_purchase?: boolean | number | string;
};
type ApiConfig = {
  display_limit?: number | string;
  heading?: string;
  minimum_rating?: number | string;
  show_media?: boolean | number | string;
  show_ratings?: boolean | number | string;
  show_verified_badge?: boolean | number | string;
  supporting_line?: string;
  visible?: boolean | number | string;
};
type ApiVersion = { published_at?: string | null; published_by?: string; version?: number | string };
type ApiResponse = {
  draft?: ApiConfig;
  entries?: ApiEntry[];
  live?: ApiConfig;
  message?: string;
  published_at?: string | null;
  success?: boolean;
  updated_at?: string | null;
  version?: number | string;
  versions?: ApiVersion[];
};

export const MANAGE_REVIEWS_RESULTS_ENDPOINT = bnbApiUrl("manage_reviews_results.php");
export const PUBLIC_REVIEWS_RESULTS_ENDPOINT = bnbApiUrl("get_reviews_results.php");

export const defaultReviewsCmsConfig: ReviewsCmsConfig = {
  displayLimit: 6,
  heading: "Real reviews. Thoughtful routines.",
  minimumRating: 1,
  showMedia: true,
  showRatings: true,
  showVerifiedBadge: true,
  supportingLine: "Customer experiences shared with permission—individual results can vary.",
  visible: true,
};

function bool(value: boolean | number | string | null | undefined) {
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "active"].includes(String(value ?? "").toLowerCase());
}

function numberValue(value: number | string | null | undefined, fallback: number) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function text(value: boolean | number | string | null | undefined) {
  return String(value ?? "").trim();
}

function normalizeConfig(config: ApiConfig | null | undefined): ReviewsCmsConfig {
  return {
    displayLimit: Math.max(1, Math.min(24, numberValue(config?.display_limit, 6))),
    heading: text(config?.heading) || defaultReviewsCmsConfig.heading,
    minimumRating: Math.max(1, Math.min(5, numberValue(config?.minimum_rating, 1))),
    showMedia: bool(config?.show_media),
    showRatings: bool(config?.show_ratings),
    showVerifiedBadge: bool(config?.show_verified_badge),
    supportingLine: text(config?.supporting_line) || defaultReviewsCmsConfig.supportingLine,
    visible: bool(config?.visible),
  };
}

function normalizeEntry(entry: ApiEntry): ReviewEntry {
  const rawType = text(entry.entry_type).toLowerCase();
  const rawStatus = text(entry.status).toLowerCase();
  const rawSource = text(entry.source).toLowerCase();
  return {
    adminNote: text(entry.admin_note),
    consentObtained: bool(entry.consent_obtained),
    createdAt: entry.created_at ?? null,
    customerDisplayName: text(entry.customer_display_name) || "Customer",
    duration: text(entry.duration),
    entryType: rawType === "real_result" ? "real_result" : "review",
    featured: bool(entry.featured),
    id: numberValue(entry.id, 0),
    mediaUrl: text(entry.media_url),
    orderReference: text(entry.order_reference),
    productName: text(entry.product_name),
    rating: Math.max(1, Math.min(5, numberValue(entry.rating, 5))),
    reviewText: text(entry.review_text),
    source: rawSource === "facebook" || rawSource === "messenger" || rawSource === "website" ? rawSource : "manual",
    status: rawStatus === "approved" || rawStatus === "rejected" || rawStatus === "archived" ? rawStatus : "pending",
    updatedAt: entry.updated_at ?? null,
    verifiedPurchase: bool(entry.verified_purchase),
  };
}

function apiConfig(config: ReviewsCmsConfig): ApiConfig {
  return {
    display_limit: config.displayLimit,
    heading: config.heading,
    minimum_rating: config.minimumRating,
    show_media: config.showMedia,
    show_ratings: config.showRatings,
    show_verified_badge: config.showVerifiedBadge,
    supporting_line: config.supportingLine,
    visible: config.visible,
  };
}

function apiEntry(entry: Omit<ReviewEntry, "createdAt" | "updatedAt">) {
  return {
    admin_note: entry.adminNote,
    consent_obtained: entry.consentObtained,
    customer_display_name: entry.customerDisplayName,
    duration: entry.duration,
    entry_type: entry.entryType,
    featured: entry.featured,
    id: entry.id,
    media_url: entry.mediaUrl,
    order_reference: entry.orderReference,
    product_name: entry.productName,
    rating: entry.rating,
    review_text: entry.reviewText,
    source: entry.source,
    status: entry.status,
    verified_purchase: entry.verifiedPurchase,
  };
}

async function parseResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as ApiResponse | null;
  if (!response.ok || !payload?.success) throw new Error(payload?.message || "Reviews request could not be completed.");
  return payload;
}

function stateFromPayload(payload: ApiResponse): ReviewsCmsState {
  return {
    draft: normalizeConfig(payload.draft),
    entries: (payload.entries ?? []).map(normalizeEntry),
    live: normalizeConfig(payload.live),
    publishedAt: payload.published_at ?? null,
    updatedAt: payload.updated_at ?? null,
    version: numberValue(payload.version, 1),
    versions: (payload.versions ?? []).map((entry) => ({
      publishedAt: entry.published_at ?? null,
      publishedBy: text(entry.published_by) || "admin",
      version: numberValue(entry.version, 0),
    })),
  };
}

async function postAction(body: Record<string, unknown>) {
  const response = await fetch(MANAGE_REVIEWS_RESULTS_ENDPOINT, {
    body: JSON.stringify(body),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  return stateFromPayload(await parseResponse(response));
}

export async function fetchReviewsCmsState(signal?: AbortSignal) {
  const response = await fetch(MANAGE_REVIEWS_RESULTS_ENDPOINT, { cache: "no-store", headers: adminAuthHeaders(), signal });
  return stateFromPayload(await parseResponse(response));
}

export async function saveReviewsCmsDraft(config: ReviewsCmsConfig) {
  const response = await fetch(MANAGE_REVIEWS_RESULTS_ENDPOINT, {
    body: JSON.stringify({ config: apiConfig(config) }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "PUT",
  });
  return stateFromPayload(await parseResponse(response));
}

export async function publishReviewsCms(config: ReviewsCmsConfig) {
  return postAction({ action: "publish", config: apiConfig(config) });
}

export async function saveReviewEntry(entry: Omit<ReviewEntry, "createdAt" | "updatedAt">) {
  return postAction({ action: "save_entry", entry: apiEntry(entry) });
}

export async function moderateReviewEntry(id: number, status: ReviewEntry["status"], featured: boolean, adminNote: string) {
  return postAction({ action: "moderate_entry", admin_note: adminNote, featured, id, status });
}

export async function archiveReviewEntry(id: number) {
  return postAction({ action: "archive_entry", id });
}

export async function restoreReviewsCmsDraft(version: number) {
  return postAction({ action: "restore_draft", version });
}
