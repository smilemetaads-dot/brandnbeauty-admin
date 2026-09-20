import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export const MANAGE_RETENTION_ENDPOINT = "manage_retention_aov_clv.php";

type Raw = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const nullableText = (value: unknown) => text(value) || null;

export type RetentionControls = { churnDays: number; secondOrderDueDays: number; updatedAt: string | null; vipMinOrders: number };
export type RetentionSummary = { deliveredCustomers: number; deliveredOrders: number; deliveredRevenue: number; observedClv: number; periodAov: number; periodCustomers: number; periodOrders: number; periodRevenue: number; repeatCustomers: number; repeatRate: number };
export type RetentionSegment = { aov: number; customers: number; definition: string; key: string; name: string; orders: number; revenue: number };
export type RetentionCohort = { cohort: string; customers: number; orders: number; repeatCustomers: number; repeatRate: number; revenue: number };
export type RetentionInterval = { customerCount: number; intervalCount: number; key: string; label: string; share: number };
export type RetentionPlan = { channel: string; createdAt: string | null; id: number; marginFloor: number; note: string; objective: string; reviewedAt: string | null; segmentKey: string; status: string };
export type RetentionState = {
  cohorts: RetentionCohort[];
  controls: RetentionControls;
  generatedAt: string | null;
  plans: RetentionPlan[];
  quality: { deliveredStatus: string; identityBasis: string; ordersWithoutStableIdentity: number; privacyBoundary: string; revenueBasis: string };
  range: { from: string; to: string };
  reorderIntervals: RetentionInterval[];
  segments: RetentionSegment[];
  summary: RetentionSummary;
};

function normalize(payload: Raw): RetentionState {
  const controls = (payload.controls ?? {}) as Raw;
  const summary = (payload.summary ?? {}) as Raw;
  const quality = (payload.quality ?? {}) as Raw;
  const range = (payload.range ?? {}) as Raw;
  return {
    cohorts: ((payload.cohorts ?? []) as Raw[]).map((item) => ({ cohort: text(item.cohort), customers: number(item.customers), orders: number(item.orders), repeatCustomers: number(item.repeat_customers), repeatRate: number(item.repeat_rate), revenue: number(item.revenue) })),
    controls: { churnDays: number(controls.churn_days) || 120, secondOrderDueDays: number(controls.second_order_due_days) || 45, updatedAt: nullableText(controls.updated_at), vipMinOrders: number(controls.vip_min_orders) || 4 },
    generatedAt: nullableText(payload.generated_at),
    plans: ((payload.plans ?? []) as Raw[]).map((item) => ({ channel: text(item.channel), createdAt: nullableText(item.created_at), id: number(item.id), marginFloor: number(item.margin_floor), note: text(item.note), objective: text(item.objective), reviewedAt: nullableText(item.reviewed_at), segmentKey: text(item.segment_key), status: text(item.status) })),
    quality: { deliveredStatus: text(quality.delivered_status), identityBasis: text(quality.identity_basis), ordersWithoutStableIdentity: number(quality.orders_without_stable_identity), privacyBoundary: text(quality.privacy_boundary), revenueBasis: text(quality.revenue_basis) },
    range: { from: text(range.from), to: text(range.to) },
    reorderIntervals: ((payload.reorder_intervals ?? []) as Raw[]).map((item) => ({ customerCount: number(item.customer_count), intervalCount: number(item.interval_count), key: text(item.key), label: text(item.label), share: number(item.share) })),
    segments: ((payload.segments ?? []) as Raw[]).map((item) => ({ aov: number(item.aov), customers: number(item.customers), definition: text(item.definition), key: text(item.key), name: text(item.name), orders: number(item.orders), revenue: number(item.revenue) })),
    summary: { deliveredCustomers: number(summary.delivered_customers), deliveredOrders: number(summary.delivered_orders), deliveredRevenue: number(summary.delivered_revenue), observedClv: number(summary.observed_clv), periodAov: number(summary.period_aov), periodCustomers: number(summary.period_customers), periodOrders: number(summary.period_orders), periodRevenue: number(summary.period_revenue), repeatCustomers: number(summary.repeat_customers), repeatRate: number(summary.repeat_rate) },
  };
}

async function request(from: string, to: string, options?: RequestInit) {
  const query = new URLSearchParams();
  if (from) query.set("date_from", from);
  if (to) query.set("date_to", to);
  const response = await fetch(`${bnbApiUrl(MANAGE_RETENTION_ENDPOINT)}?${query}`, { cache: "no-store", ...options, headers: adminAuthHeaders({ "Content-Type": "application/json", ...(options?.headers as Record<string, string> | undefined) }) });
  const payload = await response.json().catch(() => ({})) as Raw & { message?: string; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Retention data could not be loaded.");
  return { message: payload.message ?? "", state: normalize(payload) };
}

export const loadRetention = (from = "", to = "") => request(from, to).then((result) => result.state);
export const saveRetentionControls = (values: Record<string, unknown>, from: string, to: string) => request(from, to, { method: "POST", body: JSON.stringify({ action: "save_controls", ...values }) });
export const createRetentionPlan = (values: Record<string, unknown>, from: string, to: string) => request(from, to, { method: "POST", body: JSON.stringify({ action: "create_plan", ...values }) });
export const reviewRetentionPlan = (id: number, status: "approved" | "rejected", note: string, from: string, to: string) => request(from, to, { method: "POST", body: JSON.stringify({ action: "review_plan", id, status, review_note: note }) });
