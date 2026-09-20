import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export const MANAGE_MARKETING_PERFORMANCE_ENDPOINT = "manage_marketing_performance.php";

export type MarketingSummary = {
  collectedRevenue: number | null;
  confirmedRevenue: number;
  contributionAfterAds: number | null;
  deliveredOrders: number;
  deliveredRevenue: number;
  deliveredRoas: number | null;
  directCost: number | null;
  orderedRevenue: number;
  orderedRoas: number | null;
  placedOrders: number;
  returnCancelOrders: number;
  returnCancelValue: number;
  spend: number;
};

export type CampaignPerformance = MarketingSummary & { campaign: string; platform: string };
export type DailyPerformance = { day: string; deliveredRevenue: number; orderedRevenue: number; placedOrders: number; returnCancelOrders: number; spend: number };
export type SpendEntry = { campaignId: string; campaignName: string; createdAt: string | null; currency: string; id: number; note: string; platform: string; source: string; spendAmount: number; spendDate: string; updatedAt: string | null };
export type MarketingQuality = { attributedOrders: number; collectionBasis: string; hasAttributionTable: boolean; hasCollectionTable: boolean; hasCostTable: boolean; orderDateBasis: string; profitBasis: string; unattributedOrders: number };
export type MarketingPerformanceState = { campaigns: CampaignPerformance[]; daily: DailyPerformance[]; generatedAt: string | null; quality: MarketingQuality; range: { from: string; to: string }; spendEntries: SpendEntry[]; summary: MarketingSummary };
export type SpendDraft = { campaignId: string; campaignName: string; note: string; platform: string; spendAmount: number; spendDate: string };

type RawSummary = Record<string, unknown>;
type RawState = { campaigns?: RawSummary[]; daily?: RawSummary[]; generated_at?: string; quality?: RawSummary; range?: { from?: string; to?: string }; spend_entries?: RawSummary[]; summary?: RawSummary };

const numberValue = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const nullableNumber = (value: unknown) => value === null || value === undefined ? null : numberValue(value);
const stringValue = (value: unknown) => typeof value === "string" ? value : "";

function summary(raw: RawSummary = {}): MarketingSummary {
  return {
    collectedRevenue: nullableNumber(raw.collected_revenue), confirmedRevenue: numberValue(raw.confirmed_revenue),
    contributionAfterAds: nullableNumber(raw.contribution_after_ads), deliveredOrders: numberValue(raw.delivered_orders),
    deliveredRevenue: numberValue(raw.delivered_revenue), deliveredRoas: nullableNumber(raw.delivered_roas),
    directCost: nullableNumber(raw.direct_cost), orderedRevenue: numberValue(raw.ordered_revenue),
    orderedRoas: nullableNumber(raw.ordered_roas), placedOrders: numberValue(raw.placed_orders),
    returnCancelOrders: numberValue(raw.return_cancel_orders), returnCancelValue: numberValue(raw.return_cancel_value),
    spend: numberValue(raw.spend),
  };
}

function normalize(raw: RawState): MarketingPerformanceState {
  const quality = raw.quality ?? {};
  return {
    campaigns: (raw.campaigns ?? []).map((item) => ({ ...summary(item), campaign: stringValue(item.campaign), platform: stringValue(item.platform) })),
    daily: (raw.daily ?? []).map((item) => ({ day: stringValue(item.day), deliveredRevenue: numberValue(item.delivered_revenue), orderedRevenue: numberValue(item.ordered_revenue), placedOrders: numberValue(item.placed_orders), returnCancelOrders: numberValue(item.return_cancel_orders), spend: numberValue(item.spend) })),
    generatedAt: raw.generated_at ?? null,
    quality: {
      attributedOrders: numberValue(quality.attributed_orders), collectionBasis: stringValue(quality.collection_basis),
      hasAttributionTable: Boolean(quality.has_attribution_table), hasCollectionTable: Boolean(quality.has_collection_table),
      hasCostTable: Boolean(quality.has_cost_table), orderDateBasis: stringValue(quality.order_date_basis),
      profitBasis: stringValue(quality.profit_basis), unattributedOrders: numberValue(quality.unattributed_orders),
    },
    range: { from: raw.range?.from ?? "", to: raw.range?.to ?? "" },
    spendEntries: (raw.spend_entries ?? []).map((item) => ({
      campaignId: stringValue(item.campaign_id), campaignName: stringValue(item.campaign_name), createdAt: stringValue(item.created_at) || null,
      currency: stringValue(item.currency) || "BDT", id: numberValue(item.id), note: stringValue(item.note), platform: stringValue(item.platform),
      source: stringValue(item.source), spendAmount: numberValue(item.spend_amount), spendDate: stringValue(item.spend_date), updatedAt: stringValue(item.updated_at) || null,
    })),
    summary: summary(raw.summary),
  };
}

async function request(url: string, options?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...options, headers: adminAuthHeaders({ "Content-Type": "application/json", ...(options?.headers as Record<string, string> | undefined) }) });
  const payload = await response.json().catch(() => ({})) as RawState & { message?: string; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Marketing performance could not be loaded.");
  return normalize(payload);
}

export function loadMarketingPerformance(dateFrom?: string, dateTo?: string) {
  const query = new URLSearchParams();
  if (dateFrom) query.set("date_from", dateFrom);
  if (dateTo) query.set("date_to", dateTo);
  return request(`${bnbApiUrl(MANAGE_MARKETING_PERFORMANCE_ENDPOINT)}${query.size ? `?${query}` : ""}`);
}

export function saveMarketingSpend(draft: SpendDraft, dateFrom: string, dateTo: string) {
  return request(`${bnbApiUrl(MANAGE_MARKETING_PERFORMANCE_ENDPOINT)}?date_from=${encodeURIComponent(dateFrom)}&date_to=${encodeURIComponent(dateTo)}`, {
    method: "POST", body: JSON.stringify({ action: "save_spend", campaign_id: draft.campaignId, campaign_name: draft.campaignName, note: draft.note, platform: draft.platform, spend_amount: draft.spendAmount, spend_date: draft.spendDate }),
  });
}

export function voidMarketingSpend(id: number, reason: string, dateFrom: string, dateTo: string) {
  return request(`${bnbApiUrl(MANAGE_MARKETING_PERFORMANCE_ENDPOINT)}?date_from=${encodeURIComponent(dateFrom)}&date_to=${encodeURIComponent(dateTo)}`, {
    method: "POST", body: JSON.stringify({ action: "void_spend", id, reason }),
  });
}
