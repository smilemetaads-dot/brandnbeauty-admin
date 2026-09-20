import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export const MANAGE_AUTOMATION_ALERTS_ENDPOINT = "manage_automation_alerts.php";

type Raw = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const nullableText = (value: unknown) => text(value) || null;

export type AutomationAlert = {
  acknowledgedAt: string | null; businessImpact: string; conditionText: string; dedupMinutes: number;
  entityRef: string; escalationMinutes: number; firstSeenAt: string | null; id: number; lastSeenAt: string | null;
  occurrenceCount: number; ownerName: string; policyName: string; resolutionCause: string; resolutionEvidence: string;
  resolutionSummary: string; resolvedAt: string | null; severity: string; slaDueAt: string | null; snoozedUntil: string | null;
  sourceType: string; status: string; title: string;
};
export type AlertPolicy = {
  alertCount: number; conditionText: string; dedupMinutes: number; escalationMinutes: number; id: number; isBuiltin: boolean;
  lastSeenAt: string | null; name: string; openCount: number; ownerName: string; policyKey: string; severity: string;
  slaMinutes: number; sourceType: string; status: string; version: number;
};
export type AlertActivity = { actorName: string; alertId: number; createdAt: string | null; entityRef: string; eventType: string; id: number; note: string; title: string };
export type AlertDaily = { alertDate: string; created: number; critical: number; resolved: number };
export type AutomationAlertsState = {
  activity: AlertActivity[];
  alerts: AutomationAlert[];
  capabilities: { inventorySource: boolean; orderSource: boolean; trackingSource: boolean; workflowSource: boolean };
  daily: AlertDaily[];
  engine: { executionMode: string; lastScanAt: string | null; timezone: string };
  generatedAt: string | null;
  policies: AlertPolicy[];
  summary: { activePolicies: number; openAlerts: number; resolved30d: number; slaBreached: number; snoozed: number; unacknowledged: number; urgentAlerts: number };
};

function normalize(payload: Raw): AutomationAlertsState {
  const capabilities = (payload.capabilities ?? {}) as Raw;
  const engine = (payload.engine ?? {}) as Raw;
  const summary = (payload.summary ?? {}) as Raw;
  return {
    activity: ((payload.activity ?? []) as Raw[]).map((item) => ({ actorName: text(item.actor_name), alertId: number(item.alert_id), createdAt: nullableText(item.created_at), entityRef: text(item.entity_ref), eventType: text(item.event_type), id: number(item.id), note: text(item.note), title: text(item.title) })),
    alerts: ((payload.alerts ?? []) as Raw[]).map((item) => ({ acknowledgedAt: nullableText(item.acknowledged_at), businessImpact: text(item.business_impact), conditionText: text(item.condition_text), dedupMinutes: number(item.dedup_minutes), entityRef: text(item.entity_ref), escalationMinutes: number(item.escalation_minutes), firstSeenAt: nullableText(item.first_seen_at), id: number(item.id), lastSeenAt: nullableText(item.last_seen_at), occurrenceCount: number(item.occurrence_count), ownerName: text(item.owner_name), policyName: text(item.policy_name), resolutionCause: text(item.resolution_cause), resolutionEvidence: text(item.resolution_evidence), resolutionSummary: text(item.resolution_summary), resolvedAt: nullableText(item.resolved_at), severity: text(item.severity), slaDueAt: nullableText(item.sla_due_at), snoozedUntil: nullableText(item.snoozed_until), sourceType: text(item.source_type), status: text(item.status), title: text(item.title) })),
    capabilities: { inventorySource: Boolean(capabilities.inventory_source), orderSource: Boolean(capabilities.order_source), trackingSource: Boolean(capabilities.tracking_source), workflowSource: Boolean(capabilities.workflow_source) },
    daily: ((payload.daily ?? []) as Raw[]).map((item) => ({ alertDate: text(item.event_date), created: number(item.created), critical: number(item.critical), resolved: number(item.resolved) })),
    engine: { executionMode: text(engine.execution_mode), lastScanAt: nullableText(engine.last_scan_at), timezone: text(engine.timezone) },
    generatedAt: nullableText(payload.generated_at),
    policies: ((payload.policies ?? []) as Raw[]).map((item) => ({ alertCount: number(item.alert_count), conditionText: text(item.condition_text), dedupMinutes: number(item.dedup_minutes), escalationMinutes: number(item.escalation_minutes), id: number(item.id), isBuiltin: Boolean(number(item.is_builtin)), lastSeenAt: nullableText(item.last_seen_at), name: text(item.name), openCount: number(item.open_count), ownerName: text(item.owner_name), policyKey: text(item.policy_key), severity: text(item.severity), slaMinutes: number(item.sla_minutes), sourceType: text(item.source_type), status: text(item.status), version: number(item.version) })),
    summary: { activePolicies: number(summary.active_policies), openAlerts: number(summary.open_alerts), resolved30d: number(summary.resolved_30d), slaBreached: number(summary.sla_breached), snoozed: number(summary.snoozed), unacknowledged: number(summary.unacknowledged), urgentAlerts: number(summary.urgent_alerts) },
  };
}

async function request(options?: RequestInit) {
  const response = await fetch(bnbApiUrl(MANAGE_AUTOMATION_ALERTS_ENDPOINT), { cache: "no-store", ...options, headers: adminAuthHeaders({ "Content-Type": "application/json", ...(options?.headers as Record<string, string> | undefined) }) });
  const payload = await response.json().catch(() => ({})) as Raw & { message?: string; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Automation alerts could not be loaded.");
  return { message: payload.message ?? "", state: normalize(payload) };
}

export const loadAutomationAlerts = () => request().then((result) => result.state);
export const scanAutomationAlerts = () => request({ method: "POST", body: JSON.stringify({ action: "run_scan" }) });
export const acknowledgeAutomationAlert = (id: number, ownerName: string, note: string) => request({ method: "POST", body: JSON.stringify({ action: "acknowledge", id, owner_name: ownerName, note }) });
export const snoozeAutomationAlert = (id: number, minutes: number, reason: string) => request({ method: "POST", body: JSON.stringify({ action: "snooze", id, minutes, reason }) });
export const resolveAutomationAlert = (id: number, cause: string, summary: string, evidence: string) => request({ method: "POST", body: JSON.stringify({ action: "resolve", id, cause, summary, evidence }) });
export const createAlertPolicyDraft = (values: Record<string, unknown>) => request({ method: "POST", body: JSON.stringify({ action: "create_policy", ...values }) });
export const changeAlertPolicyStatus = (id: number, status: "active" | "paused" | "draft", reason: string) => request({ method: "POST", body: JSON.stringify({ action: "change_policy_status", id, status, reason }) });
