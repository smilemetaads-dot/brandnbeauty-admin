import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type CompatibilityContext = "same_routine" | "am" | "pm" | "alternating" | "comparison";
export type CompatibilityOutcome = "compatible" | "use_with_care" | "separate_schedule" | "hold" | "insufficient_evidence";
export type CompatibilityStatus = "draft" | "reviewed" | "archived";
export type CompatibilityDecisionName = "approve_evidence" | "confirm_schedule" | "confirm_hold" | "request_evidence";

export type CompatibilityProduct = { id: string; name: string; sku: string; status: string };
export type CompatibilityRuleMatch = { id: string; firstIngredient: string; secondIngredient: string; relationship: string; scope: string; instruction: string };
export type CompatibilityDecision = { id: string; action: string; decision: string; reason: string; actor: string; createdAt: string };
export type CompatibilityCheck = {
  context: CompatibilityContext;
  createdAt: string;
  decisions: CompatibilityDecision[];
  evidenceGaps: string[];
  id: string;
  matchedRules: CompatibilityRuleMatch[];
  outcome: CompatibilityOutcome;
  owner: string;
  productIds: string[];
  products: CompatibilityProduct[];
  rationale: string[];
  reviewedAt: string;
  status: CompatibilityStatus;
  title: string;
  updatedAt: string;
};
export type CompatibilitySummary = { total: number; compatible: number; needsReview: number; holds: number; insufficientEvidence: number; drafts: number };
export type RoutineCompatibilityState = { checks: CompatibilityCheck[]; generatedAt: string; products: CompatibilityProduct[]; summary: CompatibilitySummary };
export type CompatibilityDraft = { context: CompatibilityContext; owner: string; productIds: string[]; title: string };

const ENDPOINT = bnbApiUrl("manage_routine_compatibility.php");

function text(value: unknown) { return typeof value === "string" || typeof value === "number" ? String(value).trim() : ""; }
function list(value: unknown) { return Array.isArray(value) ? value.map(text).filter(Boolean) : []; }
function numberValue(value: unknown) { const parsed = Number(value ?? 0); return Number.isFinite(parsed) ? parsed : 0; }
function object(value: unknown) { return value && typeof value === "object" ? value as Record<string, unknown> : {}; }
function context(value: unknown): CompatibilityContext { const item = text(value).toLowerCase(); return item === "am" || item === "pm" || item === "alternating" || item === "comparison" ? item : "same_routine"; }
function outcome(value: unknown): CompatibilityOutcome { const item = text(value).toLowerCase(); return item === "compatible" || item === "use_with_care" || item === "separate_schedule" || item === "hold" ? item : "insufficient_evidence"; }
function status(value: unknown): CompatibilityStatus { const item = text(value).toLowerCase(); return item === "reviewed" || item === "archived" ? item : "draft"; }
function product(value: unknown): CompatibilityProduct | null { const row = object(value); const id = text(row.id); const name = text(row.name); return id && name ? { id, name, sku: text(row.sku), status: text(row.status) || "draft" } : null; }
function rule(value: unknown): CompatibilityRuleMatch | null { const row = object(value); const id = text(row.id); return id ? { id, firstIngredient: text(row.first_ingredient), secondIngredient: text(row.second_ingredient), relationship: text(row.relationship), scope: text(row.scope), instruction: text(row.instruction) } : null; }
function decision(value: unknown): CompatibilityDecision | null { const row = object(value); const id = text(row.id); return id ? { id, action: text(row.action), decision: text(row.decision), reason: text(row.reason), actor: text(row.actor), createdAt: text(row.created_at) } : null; }
function check(value: unknown): CompatibilityCheck | null {
  const row = object(value); const id = text(row.id); const title = text(row.title); if (!id || !title) return null;
  return { context: context(row.context), createdAt: text(row.created_at), decisions: Array.isArray(row.decisions) ? row.decisions.map(decision).filter((item): item is CompatibilityDecision => Boolean(item)) : [], evidenceGaps: list(row.evidence_gaps), id, matchedRules: Array.isArray(row.matched_rules) ? row.matched_rules.map(rule).filter((item): item is CompatibilityRuleMatch => Boolean(item)) : [], outcome: outcome(row.outcome), owner: text(row.owner), productIds: list(row.product_ids), products: Array.isArray(row.products) ? row.products.map(product).filter((item): item is CompatibilityProduct => Boolean(item)) : [], rationale: list(row.rationale), reviewedAt: text(row.reviewed_at), status: status(row.status), title, updatedAt: text(row.updated_at) };
}
function normalize(payload: Record<string, unknown>): RoutineCompatibilityState {
  const summary = object(payload.summary);
  return { checks: Array.isArray(payload.checks) ? payload.checks.map(check).filter((item): item is CompatibilityCheck => Boolean(item)) : [], generatedAt: text(payload.generated_at), products: Array.isArray(payload.products) ? payload.products.map(product).filter((item): item is CompatibilityProduct => Boolean(item)) : [], summary: { total: numberValue(summary.total), compatible: numberValue(summary.compatible), needsReview: numberValue(summary.needs_review), holds: numberValue(summary.holds), insufficientEvidence: numberValue(summary.insufficient_evidence), drafts: numberValue(summary.drafts) } };
}
async function request(body?: Record<string, unknown>, signal?: AbortSignal): Promise<RoutineCompatibilityState> {
  const response = await fetch(ENDPOINT, body ? { body: JSON.stringify(body), headers: adminAuthHeaders({ "Content-Type": "application/json" }), method: "POST", signal } : { cache: "no-store", headers: adminAuthHeaders(), signal });
  const payload = await response.json() as Record<string, unknown> & { message?: string; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Routine compatibility is temporarily unavailable.");
  return normalize(payload);
}
export function fetchRoutineCompatibility(signal?: AbortSignal) { return request(undefined, signal); }
export function saveCompatibilityDraft(draft: CompatibilityDraft) { return request({ action: "save_check_draft", confirmed: true, context: draft.context, owner: draft.owner, product_ids: draft.productIds, title: draft.title }); }
export function recordCompatibilityDecision(id: string, decisionName: CompatibilityDecisionName, actor: string, reason: string) { return request({ action: "record_decision", actor, confirmed: true, decision: decisionName, id, reason }); }

