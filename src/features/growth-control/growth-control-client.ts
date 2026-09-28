import {
  loadContentCreative,
  type ContentCreativeState,
} from "@/features/content-creative/content-creative-client";
import {
  loadMarketingPerformance,
  type MarketingPerformanceState,
} from "@/features/marketing-performance/marketing-performance-client";
import {
  loadMetaAds,
  type MetaAdsState,
} from "@/features/meta-ads/meta-ads-client";
import {
  loadTrackingAttribution,
  type TrackingAttributionState,
} from "@/features/tracking-attribution/tracking-attribution-client";

export type GrowthControlState = {
  content: ContentCreativeState;
  marketing: MarketingPerformanceState;
  meta: MetaAdsState;
  tracking: TrackingAttributionState;
  summary: {
    contentBriefsOpen: number;
    creativeReviewNeeded: number;
    productContentGaps: number;
    missingMediaConsent: number;
    trackingWarnings: number;
    openTrackingRemediations: number;
    connectorsConfigured: number;
    connectorsTotal: number;
    metaConnected: boolean;
    metaPendingChanges: number;
    metaDrafts: number;
    metaFailedSyncs: number;
    spend: number;
    deliveredRevenue: number;
    deliveredRoas: number | null;
    contributionAfterAds: number | null;
    attributedOrders: number;
    unattributedOrders: number;
  };
};

export async function loadGrowthControl(signal?: AbortSignal): Promise<GrowthControlState> {
  const [content, marketing, meta, tracking] = await Promise.all([
    loadContentCreative(),
    loadMarketingPerformance(),
    loadMetaAds(),
    loadTrackingAttribution("", "", "production"),
  ]);

  const contentBriefsOpen = content.briefs.filter(
    (item) => !["approved", "rejected"].includes(item.status.toLowerCase()),
  ).length;

  const creativeReviewNeeded = content.creatives.filter((item) => {
    const health = item.health.toLowerCase();
    return !item.review || health.includes("fatig") || health.includes("watch") || health.includes("review");
  }).length;

  const trackingWarnings = tracking.eventHealth.filter(
    (item) => item.status !== "Healthy",
  ).length;

  const openTrackingRemediations = tracking.remediations.filter(
    (item) => !["resolved", "closed"].includes(item.status.toLowerCase()),
  ).length;

  const connectorsConfigured = tracking.connectors.filter(
    (item) => item.configured,
  ).length;

  const metaPendingChanges = meta.changeRequests.filter(
    (item) => item.status === "pending" || item.status === "approved",
  ).length;

  const metaFailedSyncs = meta.syncRuns.filter(
    (item) => item.status.toLowerCase() === "failed",
  ).length;

  return {
    content,
    marketing,
    meta,
    tracking,
    summary: {
      contentBriefsOpen,
      creativeReviewNeeded,
      productContentGaps: content.productReadiness.gaps.length,
      missingMediaConsent: content.supportingHealth.reviewMedia.missingConsent,
      trackingWarnings,
      openTrackingRemediations,
      connectorsConfigured,
      connectorsTotal: tracking.connectors.length,
      metaConnected: meta.connection.connected,
      metaPendingChanges,
      metaDrafts: meta.drafts.length,
      metaFailedSyncs,
      spend: marketing.summary.spend,
      deliveredRevenue: marketing.summary.deliveredRevenue,
      deliveredRoas: marketing.summary.deliveredRoas,
      contributionAfterAds: marketing.summary.contributionAfterAds,
      attributedOrders: tracking.attribution.summary.attributedOrders,
      unattributedOrders:
        Math.max(
          0,
          tracking.attribution.summary.totalOrders -
            tracking.attribution.summary.attributedOrders,
        ),
    },
  };
}
