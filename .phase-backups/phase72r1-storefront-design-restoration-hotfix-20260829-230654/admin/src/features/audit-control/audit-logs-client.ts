import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export const MANAGE_AUDIT_LOGS_ENDPOINT = "manage_audit_logs.php";

type Raw = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const nullableText = (value: unknown) => text(value) || null;
const rows = (value: unknown) => Array.isArray(value) ? value as Raw[] : [];

export type AuditEvent = { action: string; actor: string; domain: string; evidence: string; eventRef: string; fingerprint: string; note: string; occurredAt: string | null; outcome: string; risk: string; sourceId: string; sourceLabel: string; sourceTable: string; subject: string };
export type AuditSource = { available: boolean; domain: string; eventCount: number; label: string; last24h: number; latestAt: string | null; sourceError: string; table: string };
export type AuditDaily = { eventDate: string; events: number; sensitive: number };
export type IntegrityRun = { chainHead: string; checkedBy: string; createdAt: string | null; eventCount: number; id: number; mismatchCount: number; newCount: number; result: string; segmentName: string; verifiedCount: number };
export type AuditInvestigation = { createdAt: string | null; createdBy: string; eventRef: string; id: number; note: string; ownerName: string; resolutionNote: string; resolvedAt: string | null; severity: string; sourceId: string; sourceTable: string; status: string; title: string };
export type AuditExportRequest = { createdAt: string | null; exportFormat: string; id: number; rangeName: string; reason: string; redacted: boolean; requestedBy: string; scopeName: string; status: string };
export type AuditLogsState = {
  capabilities: { adminAuth: boolean; rawJsonExposed: boolean; redactedExportOnly: boolean; sourceMutation: boolean };
  daily: AuditDaily[];
  engine: { integrityScope: string; mode: string; timezone: string };
  events: AuditEvent[];
  exportRequests: AuditExportRequest[];
  generatedAt: string | null;
  integrityRuns: IntegrityRun[];
  investigations: AuditInvestigation[];
  sources: AuditSource[];
  summary: { currentSegment: number; events24h: number; eventsTotal: number; failedSegment: number; integrityStatus: string; openInvestigations: number; sensitiveSegment: number; sourcesAvailable: number; sourcesTotal: number };
};

function normalize(payload: Raw): AuditLogsState {
  const capabilities = (payload.capabilities ?? {}) as Raw;
  const engine = (payload.engine ?? {}) as Raw;
  const summary = (payload.summary ?? {}) as Raw;
  return {
    capabilities: { adminAuth: Boolean(capabilities.admin_auth), rawJsonExposed: Boolean(capabilities.raw_json_exposed), redactedExportOnly: Boolean(capabilities.redacted_export_only), sourceMutation: Boolean(capabilities.source_mutation) },
    daily: rows(payload.daily).map((item) => ({ eventDate: text(item.event_date), events: number(item.events), sensitive: number(item.sensitive) })),
    engine: { integrityScope: text(engine.integrity_scope), mode: text(engine.mode), timezone: text(engine.timezone) },
    events: rows(payload.events).map((item) => ({ action: text(item.action), actor: text(item.actor), domain: text(item.domain), evidence: text(item.evidence), eventRef: text(item.event_ref), fingerprint: text(item.fingerprint), note: text(item.note), occurredAt: nullableText(item.occurred_at), outcome: text(item.outcome), risk: text(item.risk), sourceId: text(item.source_id), sourceLabel: text(item.source_label), sourceTable: text(item.source_table), subject: text(item.subject) })),
    exportRequests: rows(payload.export_requests).map((item) => ({ createdAt: nullableText(item.created_at), exportFormat: text(item.export_format), id: number(item.id), rangeName: text(item.range_name), reason: text(item.reason), redacted: Boolean(number(item.redacted)), requestedBy: text(item.requested_by), scopeName: text(item.scope_name), status: text(item.status) })),
    generatedAt: nullableText(payload.generated_at),
    integrityRuns: rows(payload.integrity_runs).map((item) => ({ chainHead: text(item.chain_head), checkedBy: text(item.checked_by), createdAt: nullableText(item.created_at), eventCount: number(item.event_count), id: number(item.id), mismatchCount: number(item.mismatch_count), newCount: number(item.new_count), result: text(item.result), segmentName: text(item.segment_name), verifiedCount: number(item.verified_count) })),
    investigations: rows(payload.investigations).map((item) => ({ createdAt: nullableText(item.created_at), createdBy: text(item.created_by), eventRef: text(item.event_ref), id: number(item.id), note: text(item.note), ownerName: text(item.owner_name), resolutionNote: text(item.resolution_note), resolvedAt: nullableText(item.resolved_at), severity: text(item.severity), sourceId: text(item.source_id), sourceTable: text(item.source_table), status: text(item.status), title: text(item.title) })),
    sources: rows(payload.sources).map((item) => ({ available: Boolean(item.available), domain: text(item.domain), eventCount: number(item.event_count), label: text(item.label), last24h: number(item.last_24h), latestAt: nullableText(item.latest_at), sourceError: text(item.source_error), table: text(item.table) })),
    summary: { currentSegment: number(summary.current_segment), events24h: number(summary.events_24h), eventsTotal: number(summary.events_total), failedSegment: number(summary.failed_segment), integrityStatus: text(summary.integrity_status) || "not_checked", openInvestigations: number(summary.open_investigations), sensitiveSegment: number(summary.sensitive_segment), sourcesAvailable: number(summary.sources_available), sourcesTotal: number(summary.sources_total) },
  };
}

async function request(options?: RequestInit) {
  const response = await fetch(bnbApiUrl(MANAGE_AUDIT_LOGS_ENDPOINT), { cache: "no-store", ...options, headers: adminAuthHeaders({ "Content-Type": "application/json", ...(options?.headers as Record<string, string> | undefined) }) });
  const payload = await response.json().catch(() => ({})) as Raw & { message?: string; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Audit Logs could not be loaded.");
  return { message: payload.message ?? "", state: normalize(payload) };
}

export const loadAuditLogs = () => request().then((result) => result.state);
export const verifyAuditIntegrity = () => request({ method: "POST", body: JSON.stringify({ action: "verify_integrity" }) });
export const createAuditInvestigation = (values: { event_ref: string; note: string; owner_name: string; severity: string; title: string }) => request({ method: "POST", body: JSON.stringify({ action: "create_investigation", ...values }) });
export const resolveAuditInvestigation = (investigationId: number, resolutionNote: string) => request({ method: "POST", body: JSON.stringify({ action: "resolve_investigation", investigation_id: investigationId, resolution_note: resolutionNote }) });
export const requestAuditExport = (reason: string) => request({ method: "POST", body: JSON.stringify({ action: "request_export", export_format: "CSV", range_name: "Current loaded segment", redacted: true, reason, scope_name: "Current visible events" }) });
