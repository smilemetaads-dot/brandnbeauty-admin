export type CmsBanner = {
  id: string;
  image_url: string | null;
  link: string;
  text: string;
  title: string;
};

export type CmsReview = {
  comment: string;
  customer_name: string;
  id: string;
  rating: number;
  verified: boolean;
};

export type CmsAnalyticsSummary = {
  active_promotions: number;
  direct_sales: number;
  gross_revenue: number;
};

export type CmsMeta = {
  analytics_summary: CmsAnalyticsSummary;
  banners: CmsBanner[];
  reviews: CmsReview[];
};

type CmsMetaResponse = Partial<CmsMeta> & {
  success?: boolean;
};

export const CMS_META_ENDPOINT =
  "http://localhost/BrandnBeauty/brandnbeauty-backend/php/get_cms_meta.php";

export const defaultCmsMeta: CmsMeta = {
  analytics_summary: {
    active_promotions: 0,
    direct_sales: 0,
    gross_revenue: 0,
  },
  banners: [],
  reviews: [],
};

export async function fetchCmsMeta(signal?: AbortSignal): Promise<CmsMeta> {
  const response = await fetch(CMS_META_ENDPOINT, {
    cache: "no-store",
    signal,
  });
  const payload = (await response.json()) as CmsMetaResponse;

  if (!response.ok || payload.success === false) {
    throw new Error("CMS metadata request failed.");
  }

  return {
    analytics_summary: {
      ...defaultCmsMeta.analytics_summary,
      ...(payload.analytics_summary ?? {}),
    },
    banners: Array.isArray(payload.banners) ? payload.banners : [],
    reviews: Array.isArray(payload.reviews) ? payload.reviews : [],
  };
}
