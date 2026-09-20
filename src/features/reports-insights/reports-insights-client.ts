import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type ReportsPeriod = "Today" | "7D" | "30D" | "90D";
export type ReportDomainStatus = "ready" | "review" | "no_evidence" | "unavailable";

export type ReportDomain = {
  id: string;
  title: string;
  status: ReportDomainStatus;
  primary_label: string;
  primary_value: string;
  secondary_label: string;
  secondary_value: string;
  note: string;
  route: string;
};

export type ReportSignal = {
  id: string;
  level: "attention" | "watch" | "clear";
  title: string;
  note: string;
  route: string;
};

export type ReportProfitOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  revenue: number;
  direct_cost: number;
  contribution_profit: number | null;
  margin_percent: number | null;
  cost_state: "confirmed" | "estimated" | "missing";
};

export type ReportsInsightsState = {
  period: { key: ReportsPeriod; from: string; to: string };
  summary: {
    delivered_orders: number;
    delivered_revenue: number;
    confirmed_direct_costs: number;
    marketing_spend: number;
    approved_expenses: number;
    operating_profit: number | null;
    operating_margin: number | null;
    settled_cod: number;
    outstanding_cod: number;
    cost_coverage_percent: number;
    urgent_inventory: number;
    reorder_candidates: number;
    supplier_exposure_percent: number;
    attention_count: number;
    available_domains: number;
  };
  domains: ReportDomain[];
  signals: ReportSignal[];
  profit_orders: ReportProfitOrder[];
  quality: {
    mode: "read_only_consolidated_evidence";
    available_domains: number;
    unavailable_domains: string[];
    profit_state: "complete" | "needs_cost_evidence" | "unavailable";
  };
  methodology: {
    revenue: string;
    profit: string;
    inventory: string;
    supplier: string;
    boundary: string;
  };
  generated_at: string;
};

type ReportsResponse = Partial<ReportsInsightsState> & { success?: boolean; message?: string };
const endpoint = bnbApiUrl("manage_reports_insights.php");

export const emptyReportsInsightsState = (period: ReportsPeriod): ReportsInsightsState => ({
  period: { key: period, from: "", to: "" },
  summary: {
    delivered_orders: 0,
    delivered_revenue: 0,
    confirmed_direct_costs: 0,
    marketing_spend: 0,
    approved_expenses: 0,
    operating_profit: 0,
    operating_margin: null,
    settled_cod: 0,
    outstanding_cod: 0,
    cost_coverage_percent: 100,
    urgent_inventory: 0,
    reorder_candidates: 0,
    supplier_exposure_percent: 0,
    attention_count: 0,
    available_domains: 0,
  },
  domains: [],
  signals: [],
  profit_orders: [],
  quality: {
    mode: "read_only_consolidated_evidence",
    available_domains: 0,
    unavailable_domains: [],
    profit_state: "unavailable",
  },
  methodology: {
    revenue: "Delivered order totals only.",
    profit: "Confirmed direct costs, recorded marketing spend and approved expenses only.",
    inventory: "Observed order-item demand and current stock only.",
    supplier: "Controlled purchase and verified receipt evidence only.",
    boundary: "Read-only report. No business record is changed.",
  },
  generated_at: new Date(0).toISOString(),
});

function normalize(payload: ReportsResponse, period: ReportsPeriod): ReportsInsightsState {
  const fallback = emptyReportsInsightsState(period);
  return {
    ...fallback,
    ...payload,
    period: payload.period ?? fallback.period,
    summary: { ...fallback.summary, ...(payload.summary ?? {}) },
    quality: { ...fallback.quality, ...(payload.quality ?? {}) },
    methodology: { ...fallback.methodology, ...(payload.methodology ?? {}) },
    domains: Array.isArray(payload.domains) ? payload.domains : [],
    signals: Array.isArray(payload.signals) ? payload.signals : [],
    profit_orders: Array.isArray(payload.profit_orders) ? payload.profit_orders : [],
  };
}

export async function fetchReportsInsights(period: ReportsPeriod, signal?: AbortSignal) {
  const response = await fetch(`${endpoint}?period=${encodeURIComponent(period)}`, {
    cache: "no-store",
    headers: adminAuthHeaders(),
    signal,
  });
  const payload = (await response.json().catch(() => ({}))) as ReportsResponse;
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Reports & Insights is temporarily unavailable.");
  return normalize(payload, period);
}
