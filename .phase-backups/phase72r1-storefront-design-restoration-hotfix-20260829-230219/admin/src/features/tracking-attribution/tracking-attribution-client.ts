import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export const MANAGE_TRACKING_ATTRIBUTION_ENDPOINT = "manage_tracking_attribution.php";

type Raw = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const nullableText = (value: unknown) => text(value) || null;

export type TrackingSettings = { attributionModel: "last_non_direct" | "first_touch" | "last_touch"; capiEnabled: boolean; dedupWindowHours: number; ga4MeasurementId: string; gtmContainerId: string; metaPixelId: string; retentionDays: number; updatedAt: string | null };
export type TrackingConnector = { configured: boolean; eventCount: number; identifier: string; key: string; name: string; note: string };
export type TrackingEventHealth = { browser: number; contract: string; duplicates: number; ga4: number; invalid: number; lastSeenAt: string | null; meta: number; name: string; server: number; status: "Healthy" | "Warning" | "No data"; valid: number };
export type TrackingDaily = { browserEvents: number; date: string; duplicates: number; serverEvents: number; testEvents: number };
export type AttributionSource = { campaign: string; delivered: number; deliveredRevenue: number; medium: string; orders: number; returnCancel: number; source: string; utmComplete: boolean };
export type AttributionSummary = { attributedDelivered: number; attributedDeliveredRevenue: number; attributedOrders: number; deliveredOrders: number; deliveredRevenue: number; totalOrders: number };
export type RemediationTask = { createdAt: string | null; dueDate: string | null; eventName: string; evidenceNote: string; id: number; owner: string; resolutionNote: string; resolvedAt: string | null; severity: string; status: string; title: string };
export type TrackingAttributionState = {
  attribution: { available: boolean; sources: AttributionSource[]; summary: AttributionSummary };
  collectorEndpoint: string;
  connectors: TrackingConnector[];
  daily: TrackingDaily[];
  environment: "production" | "staging";
  eventHealth: TrackingEventHealth[];
  generatedAt: string | null;
  range: { from: string; to: string };
  remediations: RemediationTask[];
  settings: TrackingSettings;
  summary: { duplicates: number; events: number; lastEventAt: string | null; validEvents: number };
};

function normalize(payload: Raw): TrackingAttributionState {
  const settings = (payload.settings ?? {}) as Raw;
  const attribution = (payload.attribution ?? {}) as Raw;
  const attributionSummary = (attribution.summary ?? {}) as Raw;
  const summary = (payload.summary ?? {}) as Raw;
  return {
    attribution: {
      available: Boolean(attribution.available),
      sources: ((attribution.sources ?? []) as Raw[]).map((item) => ({ campaign: text(item.campaign), delivered: number(item.delivered), deliveredRevenue: number(item.delivered_revenue), medium: text(item.medium), orders: number(item.orders), returnCancel: number(item.return_cancel), source: text(item.source), utmComplete: Boolean(item.utm_complete) })),
      summary: { attributedDelivered: number(attributionSummary.attributed_delivered), attributedDeliveredRevenue: number(attributionSummary.attributed_delivered_revenue), attributedOrders: number(attributionSummary.attributed_orders), deliveredOrders: number(attributionSummary.delivered_orders), deliveredRevenue: number(attributionSummary.delivered_revenue), totalOrders: number(attributionSummary.total_orders) },
    },
    collectorEndpoint: text(payload.collector_endpoint),
    connectors: ((payload.connectors ?? []) as Raw[]).map((item) => ({ configured: Boolean(item.configured), eventCount: number(item.event_count), identifier: text(item.identifier), key: text(item.key), name: text(item.name), note: text(item.note) })),
    daily: ((payload.daily ?? []) as Raw[]).map((item) => ({ browserEvents: number(item.browser_events), date: text(item.event_date), duplicates: number(item.duplicates), serverEvents: number(item.server_events), testEvents: number(item.test_events) })),
    environment: (text(payload.environment) || "production") as TrackingAttributionState["environment"],
    eventHealth: ((payload.event_health ?? []) as Raw[]).map((item) => ({ browser: number(item.browser), contract: text(item.contract), duplicates: number(item.duplicates), ga4: number(item.ga4), invalid: number(item.invalid), lastSeenAt: nullableText(item.last_seen_at), meta: number(item.meta), name: text(item.name), server: number(item.server), status: (text(item.status) || "No data") as TrackingEventHealth["status"], valid: number(item.valid) })),
    generatedAt: nullableText(payload.generated_at),
    range: { from: text((payload.range as Raw | undefined)?.from), to: text((payload.range as Raw | undefined)?.to) },
    remediations: ((payload.remediations ?? []) as Raw[]).map((item) => ({ createdAt: nullableText(item.created_at), dueDate: nullableText(item.due_date), eventName: text(item.event_name), evidenceNote: text(item.evidence_note), id: number(item.id), owner: text(item.owner_name), resolutionNote: text(item.resolution_note), resolvedAt: nullableText(item.resolved_at), severity: text(item.severity), status: text(item.status), title: text(item.title) })),
    settings: { attributionModel: (text(settings.attribution_model) || "last_non_direct") as TrackingSettings["attributionModel"], capiEnabled: Boolean(number(settings.capi_enabled)), dedupWindowHours: number(settings.dedup_window_hours) || 72, ga4MeasurementId: text(settings.ga4_measurement_id), gtmContainerId: text(settings.gtm_container_id), metaPixelId: text(settings.meta_pixel_id), retentionDays: number(settings.retention_days) || 90, updatedAt: nullableText(settings.updated_at) },
    summary: { duplicates: number(summary.duplicates), events: number(summary.events), lastEventAt: nullableText(summary.last_event_at), validEvents: number(summary.valid_events) },
  };
}

async function request(dateFrom: string, dateTo: string, environment: string, options?: RequestInit) {
  const query = new URLSearchParams();
  if (dateFrom) query.set("date_from", dateFrom); if (dateTo) query.set("date_to", dateTo); if (environment) query.set("environment", environment);
  const response = await fetch(`${bnbApiUrl(MANAGE_TRACKING_ATTRIBUTION_ENDPOINT)}?${query}`, { cache: "no-store", ...options, headers: adminAuthHeaders({ "Content-Type": "application/json", ...(options?.headers as Record<string, string> | undefined) }) });
  const payload = await response.json().catch(() => ({})) as Raw & { message?: string; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Tracking and attribution data could not be loaded.");
  return { message: payload.message ?? "", state: normalize(payload) };
}

export const loadTrackingAttribution = (from = "", to = "", environment = "production") => request(from, to, environment).then((result) => result.state);
export const saveTrackingSettings = (settings: Record<string, unknown>, from: string, to: string, environment: string) => request(from, to, environment, { method: "POST", body: JSON.stringify({ action: "save_settings", ...settings }) });
export const runSafeTrackingTest = (eventName: string, reference: string, from: string, to: string, environment: string) => request(from, to, environment, { method: "POST", body: JSON.stringify({ action: "run_safe_test", event_name: eventName, reference }) });
export const createTrackingRemediation = (task: Record<string, unknown>, from: string, to: string, environment: string) => request(from, to, environment, { method: "POST", body: JSON.stringify({ action: "create_remediation", ...task }) });
export const resolveTrackingRemediation = (id: number, resolutionNote: string, from: string, to: string, environment: string) => request(from, to, environment, { method: "POST", body: JSON.stringify({ action: "resolve_remediation", id, resolution_note: resolutionNote }) });
