import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export const MANAGE_SECURITY_CENTER_ENDPOINT = "manage_security_center.php";

type Raw = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const nullableText = (value: unknown) => text(value) || null;
const rows = (value: unknown) => Array.isArray(value) ? value as Raw[] : [];

export type SecurityControl = { changeReason: string; controlValue: string; description: string; enforcementMode: string; id: number; key: string; label: string; updatedAt: string | null; updatedBy: string; valueType: "toggle" | "number" | "text"; version: number };
export type SecurityFinding = { acknowledgedAt: string | null; checkKey: string; domain: string; evidence: string; firstSeenAt: string | null; id: number; lastSeenAt: string | null; occurrenceCount: number; ownerName: string; recommendation: string; resolutionEvidence: string; resolvedAt: string | null; severity: string; status: string; title: string };
export type SecurityScan = { createdAt: string | null; failedChecks: number; id: number; passedChecks: number; reason: string; resultSummary: string; scanKey: string; score: number; totalChecks: number; warningChecks: number };
export type SecurityEvent = { actorName: string; createdAt: string | null; eventType: string; id: number; note: string; subjectLabel: string };
export type SecuritySource = { key: string; label: string; ready: boolean };
export type SecurityCenterState = {
  controls: SecurityControl[];
  engine: { lastScanAt: string | null; lastScore: number; mode: string };
  events: SecurityEvent[];
  findings: SecurityFinding[];
  generatedAt: string | null;
  safety: { automaticLockout: boolean; businessDataMutation: boolean; mode: string; secretValuesReturned: boolean };
  scans: SecurityScan[];
  sources: SecuritySource[];
  summary: { acknowledgedFindings: number; activeControls: number; openFindings: number; passedChecks: number; score: number; totalChecks: number; urgentFindings: number; verifiedBackups: number };
};

function normalize(payload: Raw): SecurityCenterState {
  const engine = (payload.engine ?? {}) as Raw;
  const safety = (payload.safety ?? {}) as Raw;
  const summary = (payload.summary ?? {}) as Raw;
  return {
    controls: rows(payload.controls).map((item) => ({ changeReason: text(item.change_reason), controlValue: text(item.control_value), description: text(item.description), enforcementMode: text(item.enforcement_mode), id: number(item.id), key: text(item.control_key), label: text(item.label), updatedAt: nullableText(item.updated_at), updatedBy: text(item.updated_by), valueType: text(item.value_type) as SecurityControl["valueType"], version: number(item.version) })),
    engine: { lastScanAt: nullableText(engine.last_scan_at), lastScore: number(engine.last_score), mode: text(engine.mode) },
    events: rows(payload.events).map((item) => ({ actorName: text(item.actor_name), createdAt: nullableText(item.created_at), eventType: text(item.event_type), id: number(item.id), note: text(item.note), subjectLabel: text(item.subject_label) })),
    findings: rows(payload.findings).map((item) => ({ acknowledgedAt: nullableText(item.acknowledged_at), checkKey: text(item.check_key), domain: text(item.domain_name), evidence: text(item.evidence), firstSeenAt: nullableText(item.first_seen_at), id: number(item.id), lastSeenAt: nullableText(item.last_seen_at), occurrenceCount: number(item.occurrence_count), ownerName: text(item.owner_name), recommendation: text(item.recommendation), resolutionEvidence: text(item.resolution_evidence), resolvedAt: nullableText(item.resolved_at), severity: text(item.severity), status: text(item.status), title: text(item.title) })),
    generatedAt: nullableText(payload.generated_at),
    safety: { automaticLockout: Boolean(safety.automatic_lockout), businessDataMutation: Boolean(safety.business_data_mutation), mode: text(safety.mode), secretValuesReturned: Boolean(safety.secret_values_returned) },
    scans: rows(payload.scans).map((item) => ({ createdAt: nullableText(item.created_at), failedChecks: number(item.failed_checks), id: number(item.id), passedChecks: number(item.passed_checks), reason: text(item.reason), resultSummary: text(item.result_summary), scanKey: text(item.scan_key), score: number(item.score), totalChecks: number(item.total_checks), warningChecks: number(item.warning_checks) })),
    sources: rows(payload.sources).map((item) => ({ key: text(item.key), label: text(item.label), ready: Boolean(item.ready) })),
    summary: { acknowledgedFindings: number(summary.acknowledged_findings), activeControls: number(summary.active_controls), openFindings: number(summary.open_findings), passedChecks: number(summary.passed_checks), score: number(summary.score), totalChecks: number(summary.total_checks), urgentFindings: number(summary.urgent_findings), verifiedBackups: number(summary.verified_backups) },
  };
}

async function request(options?: RequestInit) {
  const response = await fetch(bnbApiUrl(MANAGE_SECURITY_CENTER_ENDPOINT), { cache: "no-store", ...options, headers: adminAuthHeaders({ "Content-Type": "application/json", ...(options?.headers as Record<string, string> | undefined) }) });
  const payload = await response.json().catch(() => ({})) as Raw & { message?: string; state?: Raw; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Security Center could not be loaded.");
  return { message: payload.message ?? "", state: normalize(payload.state && typeof payload.state === "object" ? payload.state : payload) };
}

export const loadSecurityCenter = () => request().then((result) => result.state);
export const runSecurityScan = (reason: string) => request({ method: "POST", body: JSON.stringify({ action: "run_scan", reason }) });
export const acknowledgeSecurityFinding = (findingId: number, note: string) => request({ method: "POST", body: JSON.stringify({ action: "acknowledge_finding", finding_id: findingId, note }) });
export const resolveSecurityFinding = (findingId: number, evidence: string) => request({ method: "POST", body: JSON.stringify({ action: "resolve_finding", finding_id: findingId, evidence, confirmed: true }) });
export const saveSecurityControl = (controlKey: string, controlValue: string, reason: string) => request({ method: "POST", body: JSON.stringify({ action: "save_control", control_key: controlKey, control_value: controlValue, reason, confirmed: true }) });
