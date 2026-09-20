import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export const MANAGE_PRIVACY_CENTER_ENDPOINT = "manage_privacy_center.php";

type Raw = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const flag = (value: unknown) => value === true || value === 1 || value === "1";
const nullableText = (value: unknown) => text(value) || null;
const rows = (value: unknown) => Array.isArray(value) ? value as Raw[] : [];

export type PrivacyRetentionPolicy = {
  changeReason: string; id: number; label: string; policyKey: string; retentionDays: number;
  reviewedAt: string | null; scope: string; status: string; updatedAt: string | null; updatedBy: string; version: number;
};
export type PrivacyRequest = {
  channel: string; completedAt: string | null; decisionNote: string; id: number; matchCount: number;
  requestKey: string; requestNote: string; requestType: "export" | "erasure"; requestedAt: string | null;
  requestedBy: string; reviewedAt: string | null; reviewedBy: string; status: string;
  subjectKind: "phone" | "email" | "order_reference"; subjectMask: string;
};
export type PrivacyConsent = { analytics: boolean; essential: boolean; id: number; marketing: boolean; occurredAt: string | null; policyVersion: number; source: string };
export type PrivacyEvent = { actorName: string; createdAt: string | null; eventType: string; id: number; note: string; subjectLabel: string };
export type PrivacyCategory = { defaultEnabled: boolean; key: string; label: string; required: boolean };
export type PrivacyCenterState = {
  consentBreakdown: { allOptional: number; analytics: number; essentialOnly: number; marketing: number };
  consents: PrivacyConsent[]; cookieConfig: { categories: PrivacyCategory[]; policyVersion: number };
  events: PrivacyEvent[]; generatedAt: string | null; policies: PrivacyRetentionPolicy[]; requests: PrivacyRequest[];
  safety: { automaticErasure: boolean; automaticRetentionDeletion: boolean; essentialConsentCanBeDisabled: boolean; legalAdvice: boolean; rawSubjectReferenceReturned: boolean; retentionCronConfigured: boolean };
  summary: { adminTests: number; erasureRequests: number; exportRequests: number; openRequests: number; policiesReviewRequired: number; storefrontConsents: number; totalRequests: number };
};

const normalize = (payload: Raw): PrivacyCenterState => {
  const summary = (payload.summary ?? {}) as Raw;
  const breakdown = (payload.consent_breakdown ?? {}) as Raw;
  const config = (payload.cookie_config ?? {}) as Raw;
  const safety = (payload.safety ?? {}) as Raw;
  return {
    consentBreakdown: { allOptional: number(breakdown.all_optional), analytics: number(breakdown.analytics), essentialOnly: number(breakdown.essential_only), marketing: number(breakdown.marketing) },
    consents: rows(payload.consents).map((item) => ({ analytics: flag(item.analytics), essential: flag(item.essential), id: number(item.id), marketing: flag(item.marketing), occurredAt: nullableText(item.occurred_at), policyVersion: number(item.policy_version), source: text(item.source) })),
    cookieConfig: { categories: rows(config.categories).map((item) => ({ defaultEnabled: flag(item.default_enabled), key: text(item.key), label: text(item.label), required: flag(item.required) })), policyVersion: number(config.policy_version) },
    events: rows(payload.events).map((item) => ({ actorName: text(item.actor_name), createdAt: nullableText(item.created_at), eventType: text(item.event_type), id: number(item.id), note: text(item.note), subjectLabel: text(item.subject_label) })),
    generatedAt: nullableText(payload.generated_at),
    policies: rows(payload.policies).map((item) => ({ changeReason: text(item.change_reason), id: number(item.id), label: text(item.label), policyKey: text(item.policy_key), retentionDays: number(item.retention_days), reviewedAt: nullableText(item.reviewed_at), scope: text(item.scope_description), status: text(item.status), updatedAt: nullableText(item.updated_at), updatedBy: text(item.updated_by), version: number(item.version) })),
    requests: rows(payload.requests).map((item) => ({ channel: text(item.channel), completedAt: nullableText(item.completed_at), decisionNote: text(item.decision_note), id: number(item.id), matchCount: number(item.match_count), requestKey: text(item.request_key), requestNote: text(item.request_note), requestType: text(item.request_type) as "export" | "erasure", requestedAt: nullableText(item.requested_at), requestedBy: text(item.requested_by), reviewedAt: nullableText(item.reviewed_at), reviewedBy: text(item.reviewed_by), status: text(item.status), subjectKind: text(item.subject_kind) as "phone" | "email" | "order_reference", subjectMask: text(item.subject_mask) })),
    safety: { automaticErasure: flag(safety.automatic_erasure), automaticRetentionDeletion: flag(safety.automatic_retention_deletion), essentialConsentCanBeDisabled: flag(safety.essential_consent_can_be_disabled), legalAdvice: flag(safety.legal_advice), rawSubjectReferenceReturned: flag(safety.raw_subject_reference_returned), retentionCronConfigured: flag(safety.retention_cron_configured) },
    summary: { adminTests: number(summary.admin_tests), erasureRequests: number(summary.erasure_requests), exportRequests: number(summary.export_requests), openRequests: number(summary.open_requests), policiesReviewRequired: number(summary.policies_review_required), storefrontConsents: number(summary.storefront_consents), totalRequests: number(summary.total_requests) },
  };
};

async function request(options?: RequestInit) {
  const response = await fetch(bnbApiUrl(MANAGE_PRIVACY_CENTER_ENDPOINT), { cache: "no-store", ...options, headers: adminAuthHeaders({ "Content-Type": "application/json", ...(options?.headers as Record<string, string> | undefined) }) });
  const payload = await response.json().catch(() => ({})) as Raw & { message?: string; state?: Raw; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Privacy Center could not be loaded.");
  return { message: payload.message ?? "", state: normalize(payload.state && typeof payload.state === "object" ? payload.state : payload) };
}

export const loadPrivacyCenter = () => request().then((result) => result.state);
export const reviewPrivacyPolicy = (policyId: number, retentionDays: number, status: string, reason: string) => request({ method: "POST", body: JSON.stringify({ action: "review_policy", policy_id: policyId, retention_days: retentionDays, status, reason, confirmed: true }) });
export const createPrivacyRequest = (requestType: "export" | "erasure", subjectKind: string, subjectReference: string, note: string) => request({ method: "POST", body: JSON.stringify({ action: "create_request", request_type: requestType, subject_kind: subjectKind, subject_reference: subjectReference, note }) });
export const advancePrivacyRequest = (requestId: number, status: string, note: string) => request({ method: "POST", body: JSON.stringify({ action: "advance_request", request_id: requestId, status, note }) });
export const runPrivacyConsentTest = (analytics: boolean, marketing: boolean) => request({ method: "POST", body: JSON.stringify({ action: "run_consent_test", analytics, marketing }) });
