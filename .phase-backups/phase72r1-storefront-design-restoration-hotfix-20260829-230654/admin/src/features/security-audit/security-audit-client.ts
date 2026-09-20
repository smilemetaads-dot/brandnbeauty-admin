import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export const MANAGE_SECURITY_AUDIT_ENDPOINT = "manage_security_audit.php";

type Raw = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const nullableText = (value: unknown) => text(value) || null;
const rows = (value: unknown) => Array.isArray(value) ? value as Raw[] : [];

export type SecurityAuditRun = {
  auditKey: string; conclusion: string; evidenceHash: string; failedChecks: number; id: number;
  openedAt: string | null; openedBy: string; passedChecks: number; reason: string; reviewChecks: number;
  scope: string; score: number; signedOffAt: string | null; signedOffBy: string; status: string; totalChecks: number;
};
export type SecurityAuditCheck = {
  attestationNote: string; attestationStatus: string; attestedAt: string | null; attestedBy: string;
  auditId: number; checkKey: string; domain: string; evidence: string; id: number; outcome: string;
  recommendation: string; severity: string; sourceRef: string; title: string;
};
export type SecurityAuditEvent = { actorName: string; auditId: number; createdAt: string | null; eventType: string; id: number; note: string; subjectLabel: string };
export type SecurityAuditSource = { key: string; label: string; ready: boolean };
export type SecurityAuditState = {
  audits: SecurityAuditRun[]; checks: SecurityAuditCheck[]; events: SecurityAuditEvent[]; generatedAt: string | null;
  latestAudit: SecurityAuditRun | null; sources: SecurityAuditSource[];
  safety: { assuranceType: string; automaticAccessChange: boolean; businessDataMutation: boolean; externalCertification: boolean; secretValuesReturned: boolean };
  summary: { followUpChecks: number; latestScore: number; openAudits: number; signedOff: number; totalAudits: number; unreviewedChecks: number; verifiedBackups: number };
};

const normalizeRun = (item: Raw): SecurityAuditRun => ({
  auditKey: text(item.audit_key), conclusion: text(item.conclusion), evidenceHash: text(item.evidence_hash), failedChecks: number(item.failed_checks), id: number(item.id),
  openedAt: nullableText(item.opened_at), openedBy: text(item.opened_by), passedChecks: number(item.passed_checks), reason: text(item.reason), reviewChecks: number(item.review_checks),
  scope: text(item.scope_name), score: number(item.score), signedOffAt: nullableText(item.signed_off_at), signedOffBy: text(item.signed_off_by), status: text(item.status), totalChecks: number(item.total_checks),
});

function normalize(payload: Raw): SecurityAuditState {
  const summary = (payload.summary ?? {}) as Raw;
  const safety = (payload.safety ?? {}) as Raw;
  const latest = payload.latest_audit;
  return {
    audits: rows(payload.audits).map(normalizeRun),
    checks: rows(payload.checks).map((item) => ({ attestationNote: text(item.attestation_note), attestationStatus: text(item.attestation_status), attestedAt: nullableText(item.attested_at), attestedBy: text(item.attested_by), auditId: number(item.audit_id), checkKey: text(item.check_key), domain: text(item.domain_name), evidence: text(item.evidence), id: number(item.id), outcome: text(item.outcome), recommendation: text(item.recommendation), severity: text(item.severity), sourceRef: text(item.source_ref), title: text(item.title) })),
    events: rows(payload.events).map((item) => ({ actorName: text(item.actor_name), auditId: number(item.audit_id), createdAt: nullableText(item.created_at), eventType: text(item.event_type), id: number(item.id), note: text(item.note), subjectLabel: text(item.subject_label) })),
    generatedAt: nullableText(payload.generated_at),
    latestAudit: latest && typeof latest === "object" ? normalizeRun(latest as Raw) : null,
    safety: { assuranceType: text(safety.assurance_type), automaticAccessChange: Boolean(safety.automatic_access_change), businessDataMutation: Boolean(safety.business_data_mutation), externalCertification: Boolean(safety.external_certification), secretValuesReturned: Boolean(safety.secret_values_returned) },
    sources: rows(payload.sources).map((item) => ({ key: text(item.key), label: text(item.label), ready: Boolean(item.ready) })),
    summary: { followUpChecks: number(summary.follow_up_checks), latestScore: number(summary.latest_score), openAudits: number(summary.open_audits), signedOff: number(summary.signed_off), totalAudits: number(summary.total_audits), unreviewedChecks: number(summary.unreviewed_checks), verifiedBackups: number(summary.verified_backups) },
  };
}

async function request(options?: RequestInit) {
  const response = await fetch(bnbApiUrl(MANAGE_SECURITY_AUDIT_ENDPOINT), { cache: "no-store", ...options, headers: adminAuthHeaders({ "Content-Type": "application/json", ...(options?.headers as Record<string, string> | undefined) }) });
  const payload = await response.json().catch(() => ({})) as Raw & { message?: string; state?: Raw; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Security Audit could not be loaded.");
  return { message: payload.message ?? "", state: normalize(payload.state && typeof payload.state === "object" ? payload.state : payload) };
}

export const loadSecurityAudit = () => request().then((result) => result.state);
export const runSecurityAudit = (scope: string, reason: string) => request({ method: "POST", body: JSON.stringify({ action: "run_audit", scope, reason }) });
export const attestSecurityAuditCheck = (checkId: number, decision: "accepted" | "needs_follow_up", note: string) => request({ method: "POST", body: JSON.stringify({ action: "attest_check", check_id: checkId, decision, note }) });
export const signOffSecurityAudit = (auditId: number, conclusion: string) => request({ method: "POST", body: JSON.stringify({ action: "sign_off", audit_id: auditId, conclusion, confirmed: true }) });
