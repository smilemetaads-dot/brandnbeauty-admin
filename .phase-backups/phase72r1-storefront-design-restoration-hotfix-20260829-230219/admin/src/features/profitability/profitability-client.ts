import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type ProfitabilityPeriod = "Today" | "7D" | "30D" | "90D";
export type ProfitabilityCostState = "confirmed" | "estimated" | "missing";

export type ProfitabilityOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  created_at: string | null;
  revenue: number;
  product_cost: number;
  packaging_cost: number;
  courier_cost: number;
  payment_fee: number;
  return_cost: number;
  other_cost: number;
  direct_cost: number;
  known_contribution: number;
  contribution_profit: number | null;
  margin_percent: number | null;
  cost_state: ProfitabilityCostState;
  source_reference: string | null;
  note: string | null;
  confirmed_at: string | null;
  estimated_items: number;
  estimated_known_items: number;
};

export type ProfitabilityState = {
  period: { key: ProfitabilityPeriod; from: string; to: string };
  summary: {
    delivered_orders: number;
    delivered_revenue: number;
    confirmed_direct_costs: number;
    known_direct_costs: number;
    marketing_spend: number;
    operating_expenses: number;
    operating_profit: number | null;
    operating_margin: number | null;
    complete_orders: number;
    needs_cost: number;
    loss_orders: number;
    cost_coverage_percent: number;
  };
  orders: ProfitabilityOrder[];
  quality: {
    orders_connected: boolean;
    order_items_connected: boolean;
    catalog_costs_connected: boolean;
    expenses_connected: boolean;
    marketing_source: string;
    profit_state: "complete" | "needs_cost_evidence";
    page_load_mode: "read_only";
  };
  methodology: { revenue: string; direct_costs: string; operating_costs: string; boundary: string };
  generated_at: string;
};

type ProfitabilityResponse = Partial<ProfitabilityState> & { success?: boolean; message?: string };
const endpoint = bnbApiUrl("manage_profitability.php");

export const emptyProfitabilityState = (period: ProfitabilityPeriod): ProfitabilityState => ({
  period: { key: period, from: "", to: "" },
  summary: {
    delivered_orders: 0,
    delivered_revenue: 0,
    confirmed_direct_costs: 0,
    known_direct_costs: 0,
    marketing_spend: 0,
    operating_expenses: 0,
    operating_profit: 0,
    operating_margin: null,
    complete_orders: 0,
    needs_cost: 0,
    loss_orders: 0,
    cost_coverage_percent: 100,
  },
  orders: [],
  quality: {
    orders_connected: false,
    order_items_connected: false,
    catalog_costs_connected: false,
    expenses_connected: false,
    marketing_source: "not_connected",
    profit_state: "complete",
    page_load_mode: "read_only",
  },
  methodology: {
    revenue: "Delivered order total only.",
    direct_costs: "Human-confirmed order cost evidence.",
    operating_costs: "Recorded marketing spend and approved operating expenses.",
    boundary: "Read-only calculation.",
  },
  generated_at: new Date(0).toISOString(),
});

function normalize(payload: ProfitabilityResponse, period: ProfitabilityPeriod): ProfitabilityState {
  const fallback = emptyProfitabilityState(period);
  return {
    ...fallback,
    ...payload,
    period: payload.period ?? fallback.period,
    summary: { ...fallback.summary, ...(payload.summary ?? {}) },
    quality: { ...fallback.quality, ...(payload.quality ?? {}) },
    methodology: { ...fallback.methodology, ...(payload.methodology ?? {}) },
    orders: Array.isArray(payload.orders) ? payload.orders : [],
  };
}

async function parseResponse(response: Response, period: ProfitabilityPeriod) {
  const payload = (await response.json().catch(() => ({}))) as ProfitabilityResponse;
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Profitability Control is temporarily unavailable.");
  return { message: payload.message ?? "", state: normalize(payload, period) };
}

export async function fetchProfitability(period: ProfitabilityPeriod, signal?: AbortSignal) {
  const response = await fetch(`${endpoint}?period=${encodeURIComponent(period)}`, {
    cache: "no-store",
    headers: adminAuthHeaders(),
    signal,
  });
  return (await parseResponse(response, period)).state;
}

export async function saveProfitabilityCostEvidence(input: {
  orderId: string;
  period: ProfitabilityPeriod;
  productCost: number;
  packagingCost: number;
  courierCost: number;
  paymentFee: number;
  returnCost: number;
  otherCost: number;
  sourceReference: string;
  reason: string;
  confirmed: boolean;
}) {
  const response = await fetch(`${endpoint}?period=${encodeURIComponent(input.period)}`, {
    method: "POST",
    cache: "no-store",
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      action: "save_cost_evidence",
      order_id: input.orderId,
      period: input.period,
      product_cost: input.productCost,
      packaging_cost: input.packagingCost,
      courier_cost: input.courierCost,
      payment_fee: input.paymentFee,
      return_cost: input.returnCost,
      other_cost: input.otherCost,
      source_reference: input.sourceReference,
      reason: input.reason,
      confirmed: input.confirmed,
    }),
  });
  return parseResponse(response, input.period);
}

