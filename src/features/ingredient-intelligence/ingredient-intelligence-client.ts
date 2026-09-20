import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type IngredientProfileStatus = "draft" | "active" | "restricted" | "archived";
export type IngredientEvidenceStatus = "unverified" | "verified" | "review_due" | "restricted";
export type IngredientSafetyLevel = "routine_safe" | "use_with_care" | "professional_review";
export type IngredientRuleRelationship = "compatible" | "use_with_care" | "separate_schedule" | "do_not_combine";
export type IngredientRuleStatus = "draft" | "active" | "archived";

export type IngredientEvidenceSource = {
  id: string;
  name: string;
  reference: string;
  sourceType: string;
  status: string;
};

export type IngredientProductLink = {
  concentrationContext: string;
  declaredName: string;
  productId: string;
  productName: string;
  sku: string;
  status: string;
};

export type IngredientProfile = {
  aliases: string[];
  concerns: string[];
  createdAt: string;
  evidenceStatus: IngredientEvidenceStatus;
  family: string;
  id: string;
  inci: string;
  name: string;
  owner: string;
  productLinks: IngredientProductLink[];
  publishedAt: string;
  readiness: { blockers: string[]; ready: boolean };
  roles: string[];
  safetyLevel: IngredientSafetyLevel;
  sources: IngredientEvidenceSource[];
  status: IngredientProfileStatus;
  strengthGuidance: string;
  summary: string;
  updatedAt: string;
  usageGuidance: string;
};

export type IngredientCompatibilityRule = {
  createdAt: string;
  evidenceStatus: IngredientEvidenceStatus;
  firstIngredientId: string;
  firstIngredientName: string;
  id: string;
  instruction: string;
  owner: string;
  publishedAt: string;
  readiness: { blockers: string[]; ready: boolean };
  relationship: IngredientRuleRelationship;
  scope: string;
  secondIngredientId: string;
  secondIngredientName: string;
  status: IngredientRuleStatus;
  updatedAt: string;
};

export type IngredientIntelligenceSummary = {
  active: number;
  archived: number;
  drafts: number;
  mappedProducts: number;
  restricted: number;
  reviewDue: number;
  rules: number;
  total: number;
};

export type IngredientIntelligenceState = {
  generatedAt: string;
  profiles: IngredientProfile[];
  rules: IngredientCompatibilityRule[];
  summary: IngredientIntelligenceSummary;
};

export type IngredientProfileDraft = {
  aliases: string[];
  concerns: string[];
  evidenceStatus: IngredientEvidenceStatus;
  family: string;
  id: string;
  inci: string;
  name: string;
  owner: string;
  productIds: string[];
  roles: string[];
  safetyLevel: IngredientSafetyLevel;
  sourceName: string;
  sourceReference: string;
  strengthGuidance: string;
  summary: string;
  usageGuidance: string;
};

export type IngredientRuleDraft = {
  evidenceStatus: IngredientEvidenceStatus;
  firstIngredientId: string;
  id: string;
  instruction: string;
  owner: string;
  relationship: IngredientRuleRelationship;
  scope: string;
  secondIngredientId: string;
};

type ApiPayload = {
  generated_at?: unknown;
  message?: string;
  profiles?: unknown[];
  rules?: unknown[];
  success?: boolean;
  summary?: unknown;
};

const ENDPOINT = bnbApiUrl("manage_ingredient_intelligence.php");

function text(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function list(value: unknown) {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function evidenceStatus(value: unknown): IngredientEvidenceStatus {
  const status = text(value).toLowerCase();
  return status === "verified" || status === "review_due" || status === "restricted" ? status : "unverified";
}

function safetyLevel(value: unknown): IngredientSafetyLevel {
  const level = text(value).toLowerCase();
  return level === "use_with_care" || level === "professional_review" ? level : "routine_safe";
}

function profileStatus(value: unknown): IngredientProfileStatus {
  const status = text(value).toLowerCase();
  return status === "active" || status === "restricted" || status === "archived" ? status : "draft";
}

function ruleStatus(value: unknown): IngredientRuleStatus {
  const status = text(value).toLowerCase();
  return status === "active" || status === "archived" ? status : "draft";
}

function relationship(value: unknown): IngredientRuleRelationship {
  const item = text(value).toLowerCase();
  return item === "use_with_care" || item === "separate_schedule" || item === "do_not_combine" ? item : "compatible";
}

function readiness(value: unknown) {
  const row = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return { blockers: list(row.blockers), ready: Boolean(row.ready) };
}

function normalizeSource(value: unknown): IngredientEvidenceSource | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const name = text(row.name);
  if (!name) return null;
  return { id: text(row.id), name, reference: text(row.reference), sourceType: text(row.source_type), status: text(row.status) };
}

function normalizeProductLink(value: unknown): IngredientProductLink | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const productId = text(row.product_id);
  if (!productId) return null;
  return {
    concentrationContext: text(row.concentration_context),
    declaredName: text(row.declared_name),
    productId,
    productName: text(row.product_name),
    sku: text(row.sku),
    status: text(row.status),
  };
}

function normalizeProfile(value: unknown): IngredientProfile | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = text(row.id);
  const name = text(row.name);
  if (!id || !name) return null;
  return {
    aliases: list(row.aliases),
    concerns: list(row.concerns),
    createdAt: text(row.created_at),
    evidenceStatus: evidenceStatus(row.evidence_status),
    family: text(row.family),
    id,
    inci: text(row.inci),
    name,
    owner: text(row.owner),
    productLinks: (Array.isArray(row.product_links) ? row.product_links : []).map(normalizeProductLink).filter((item): item is IngredientProductLink => Boolean(item)),
    publishedAt: text(row.published_at),
    readiness: readiness(row.readiness),
    roles: list(row.roles),
    safetyLevel: safetyLevel(row.safety_level),
    sources: (Array.isArray(row.sources) ? row.sources : []).map(normalizeSource).filter((item): item is IngredientEvidenceSource => Boolean(item)),
    status: profileStatus(row.status),
    strengthGuidance: text(row.strength_guidance),
    summary: text(row.summary),
    updatedAt: text(row.updated_at),
    usageGuidance: text(row.usage_guidance),
  };
}

function normalizeRule(value: unknown): IngredientCompatibilityRule | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = text(row.id);
  if (!id) return null;
  return {
    createdAt: text(row.created_at),
    evidenceStatus: evidenceStatus(row.evidence_status),
    firstIngredientId: text(row.first_ingredient_id),
    firstIngredientName: text(row.first_ingredient_name),
    id,
    instruction: text(row.instruction),
    owner: text(row.owner),
    publishedAt: text(row.published_at),
    readiness: readiness(row.readiness),
    relationship: relationship(row.relationship),
    scope: text(row.scope),
    secondIngredientId: text(row.second_ingredient_id),
    secondIngredientName: text(row.second_ingredient_name),
    status: ruleStatus(row.status),
    updatedAt: text(row.updated_at),
  };
}

function normalizeSummary(value: unknown, profiles: IngredientProfile[], rules: IngredientCompatibilityRule[]): IngredientIntelligenceSummary {
  const row = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    active: numberValue(row.active),
    archived: numberValue(row.archived),
    drafts: numberValue(row.drafts),
    mappedProducts: numberValue(row.mapped_products),
    restricted: numberValue(row.restricted),
    reviewDue: numberValue(row.review_due),
    rules: numberValue(row.rules) || rules.filter((item) => item.status !== "archived").length,
    total: numberValue(row.total) || profiles.filter((item) => item.status !== "archived").length,
  };
}

async function parseResponse(response: Response): Promise<IngredientIntelligenceState> {
  const payload = (await response.json().catch(() => null)) as ApiPayload | null;
  if (!response.ok || !payload?.success) throw new Error(payload?.message || "Ingredient Intelligence request could not be completed.");
  const profiles = (payload.profiles ?? []).map(normalizeProfile).filter((item): item is IngredientProfile => Boolean(item));
  const rules = (payload.rules ?? []).map(normalizeRule).filter((item): item is IngredientCompatibilityRule => Boolean(item));
  return { generatedAt: text(payload.generated_at), profiles, rules, summary: normalizeSummary(payload.summary, profiles, rules) };
}

async function post(payload: Record<string, unknown>) {
  const response = await fetch(ENDPOINT, {
    body: JSON.stringify({ ...payload, confirmed: true }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  return parseResponse(response);
}

export async function fetchIngredientIntelligence(signal?: AbortSignal) {
  const response = await fetch(ENDPOINT, { cache: "no-store", headers: adminAuthHeaders(), signal });
  return parseResponse(response);
}

export function saveIngredientProfileDraft(input: IngredientProfileDraft) {
  return post({
    action: "save_profile_draft",
    aliases: input.aliases,
    concerns: input.concerns,
    evidence_status: input.evidenceStatus,
    family: input.family,
    id: input.id || null,
    inci: input.inci,
    name: input.name,
    owner: input.owner,
    product_ids: input.productIds,
    roles: input.roles,
    safety_level: input.safetyLevel,
    source_name: input.sourceName,
    source_reference: input.sourceReference,
    strength_guidance: input.strengthGuidance,
    summary: input.summary,
    usage_guidance: input.usageGuidance,
  });
}

export function changeIngredientProfileStatus(id: string, action: "publish_profile" | "restrict_profile" | "archive_profile", reason: string) {
  return post({ action, id, reason });
}

export function saveIngredientRuleDraft(input: IngredientRuleDraft) {
  return post({
    action: "save_rule_draft",
    evidence_status: input.evidenceStatus,
    first_ingredient_id: input.firstIngredientId,
    id: input.id || null,
    instruction: input.instruction,
    owner: input.owner,
    relationship: input.relationship,
    scope: input.scope,
    second_ingredient_id: input.secondIngredientId,
  });
}

export function changeIngredientRuleStatus(id: string, action: "publish_rule" | "archive_rule", reason: string) {
  return post({ action, id, reason });
}
