import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export const MANAGE_CONTENT_CREATIVE_ENDPOINT = "manage_content_creative.php";

type Raw = Record<string, unknown>;

export type CreativeReview = { decision: "blocked" | "check" | "clear"; evidenceReference: string; note: string; reviewedAt: string | null; type: string };
export type CreativeDecision = { createdAt: string | null; decision: string; note: string; owner: string };
export type CreativeRecord = { adsetName: string; campaignName: string; clicks: number; cpc: number; creativeId: string; creativeName: string; ctr: number; frequency: number; health: string; id: string; impressions: number; lastSyncedAt: string | null; latestDecision: CreativeDecision | null; name: string; reach: number; results: number; resultType: string; review: CreativeReview | null; spend: number; status: string };
export type CreativeBrief = { audience: string; creativeFormat: string; createdAt: string | null; exclusions: string; hookMessage: string; id: number; objective: string; productScope: string; proofEvidence: string; reviewNote: string; reviewedAt: string | null; status: string };
export type ReviewLog = { creativeName: string; creativeRef: string; decision: string; evidenceReference: string; id: number; note: string; reviewType: string; reviewedAt: string | null };
export type ProductGap = { id: string; missingDescription: boolean; missingImage: boolean; name: string; status: string };
export type ContentCreativeState = {
  briefs: CreativeBrief[];
  controls: { fatigueThreshold: number; minimumResults: number; minimumSpend: number; requireClaimReview: boolean; requireRightsReview: boolean };
  creatives: CreativeRecord[];
  generatedAt: string | null;
  productReadiness: { available: boolean; gaps: ProductGap[]; total: number; withDescription: number; withImage: number };
  range: { from: string; to: string };
  reviews: ReviewLog[];
  supportingHealth: { homepageHeroCount: number; meta: { ads: number; connected: boolean; lastSyncAt: string | null }; reviewMedia: { consentedMedia: number; missingConsent: number; totalMedia: number } };
};

const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const nullableText = (value: unknown) => text(value) || null;

function review(value: unknown): CreativeReview | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Raw;
  return { decision: (text(item.decision) || "check") as CreativeReview["decision"], evidenceReference: text(item.evidence_reference), note: text(item.note), reviewedAt: nullableText(item.reviewed_at), type: text(item.type) };
}

function decision(value: unknown): CreativeDecision | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Raw;
  return { createdAt: nullableText(item.created_at), decision: text(item.decision), note: text(item.note), owner: text(item.owner) };
}

function normalize(payload: Raw): ContentCreativeState {
  const controls = (payload.controls ?? {}) as Raw;
  const product = (payload.product_readiness ?? {}) as Raw;
  const health = (payload.supporting_health ?? {}) as Raw;
  const meta = (health.meta ?? {}) as Raw;
  const media = (health.review_media ?? {}) as Raw;
  return {
    controls: { fatigueThreshold: number(controls.fatigue_threshold) || 3.5, minimumResults: number(controls.minimum_results) || 10, minimumSpend: number(controls.minimum_spend), requireClaimReview: Boolean(number(controls.require_claim_review)), requireRightsReview: Boolean(number(controls.require_rights_review)) },
    creatives: ((payload.creatives ?? []) as Raw[]).map((item) => ({ adsetName: text(item.adset_name), campaignName: text(item.campaign_name), clicks: number(item.clicks), cpc: number(item.cpc), creativeId: text(item.creative_id), creativeName: text(item.creative_name), ctr: number(item.ctr), frequency: number(item.frequency), health: text(item.health), id: text(item.id), impressions: number(item.impressions), lastSyncedAt: nullableText(item.last_synced_at), latestDecision: decision(item.latest_decision), name: text(item.name), reach: number(item.reach), results: number(item.results), resultType: text(item.result_type), review: review(item.review), spend: number(item.spend), status: text(item.status) })),
    briefs: ((payload.briefs ?? []) as Raw[]).map((item) => ({ audience: text(item.audience), creativeFormat: text(item.creative_format), createdAt: nullableText(item.created_at), exclusions: text(item.exclusions), hookMessage: text(item.hook_message), id: number(item.id), objective: text(item.objective), productScope: text(item.product_scope), proofEvidence: text(item.proof_evidence), reviewNote: text(item.review_note), reviewedAt: nullableText(item.reviewed_at), status: text(item.status) })),
    reviews: ((payload.reviews ?? []) as Raw[]).map((item) => ({ creativeName: text(item.creative_name), creativeRef: text(item.creative_ref), decision: text(item.decision), evidenceReference: text(item.evidence_reference), id: number(item.id), note: text(item.note), reviewType: text(item.review_type), reviewedAt: nullableText(item.reviewed_at) })),
    productReadiness: { available: Boolean(product.available), gaps: ((product.gaps ?? []) as Raw[]).map((item) => ({ id: text(item.id), missingDescription: Boolean(item.missing_description), missingImage: Boolean(item.missing_image), name: text(item.name), status: text(item.status) })), total: number(product.total), withDescription: number(product.with_description), withImage: number(product.with_image) },
    supportingHealth: { homepageHeroCount: number(health.homepage_hero_count), meta: { ads: number(meta.ads), connected: Boolean(meta.connected), lastSyncAt: nullableText(meta.last_sync_at) }, reviewMedia: { consentedMedia: number(media.consented_media), missingConsent: number(media.missing_consent), totalMedia: number(media.total_media) } },
    generatedAt: nullableText(payload.generated_at),
    range: { from: text((payload.range as Raw | undefined)?.from), to: text((payload.range as Raw | undefined)?.to) },
  };
}

async function request(from: string, to: string, options?: RequestInit) {
  const query = new URLSearchParams(); if (from) query.set("date_from", from); if (to) query.set("date_to", to);
  const response = await fetch(`${bnbApiUrl(MANAGE_CONTENT_CREATIVE_ENDPOINT)}${query.size ? `?${query}` : ""}`, { cache: "no-store", ...options, headers: adminAuthHeaders({ "Content-Type": "application/json", ...(options?.headers as Record<string, string> | undefined) }) });
  const payload = await response.json().catch(() => ({})) as Raw & { message?: string; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Content intelligence could not be loaded.");
  return { message: payload.message ?? "", state: normalize(payload) };
}

const post = (action: string, values: Record<string, unknown>, from: string, to: string) => request(from, to, { method: "POST", body: JSON.stringify({ action, ...values }) });

export const loadContentCreative = (from = "", to = "") => request(from, to).then((result) => result.state);
export const saveCreativeControls = (values: Record<string, unknown>, from: string, to: string) => post("save_controls", values, from, to);
export const saveCreativeBrief = (values: Record<string, unknown>, from: string, to: string) => post("save_brief", values, from, to);
export const saveCreativeReview = (values: Record<string, unknown>, from: string, to: string) => post("save_review", values, from, to);
export const saveCreativeDecision = (values: Record<string, unknown>, from: string, to: string) => post("save_decision", values, from, to);
export const reviewCreativeBrief = (id: number, briefDecision: "approved" | "rejected", note: string, from: string, to: string) => post("review_brief", { decision: briefDecision, id, note }, from, to);
