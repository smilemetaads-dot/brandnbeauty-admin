import { bnbApiUrl } from "@/lib/bnb-api";

export type HomepageHeroBanner = {
  cta_text: string;
  id: string;
  image_url: string | null;
  link: string;
  sort_order: number;
  status: string;
  subtitle: string;
  title: string;
};

export type HomepageOfferCard = {
  discount: string;
  id: string;
  image_url: string | null;
  link: string;
  sort_order: number;
  status: string;
  subtitle: string;
  title: string;
};

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
  featured?: boolean;
  id: string;
  image_url?: string | null;
  product_id?: number | null;
  rating: number;
  result_image_url?: string | null;
  sort_order?: number;
  status?: string;
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

export type HomepageCmsData = {
  editor_pick_product_ids: string;
  hero_banners: HomepageHeroBanner[];
  offer_cards: HomepageOfferCard[];
};

type HomepageCmsResponse = Partial<HomepageCmsData> & {
  success?: boolean;
};

export const CMS_META_ENDPOINT = bnbApiUrl("get_cms_meta.php");
export const MANAGE_REVIEWS_ENDPOINT = bnbApiUrl("manage_reviews.php");
export const HOMEPAGE_CMS_ENDPOINT = bnbApiUrl("get_homepage_cms.php");
export const UPDATE_HOMEPAGE_CMS_ENDPOINT = bnbApiUrl("update_homepage_cms.php");

export const defaultCmsMeta: CmsMeta = {
  analytics_summary: {
    active_promotions: 0,
    direct_sales: 0,
    gross_revenue: 0,
  },
  banners: [],
  reviews: [],
};

export const defaultHomepageCmsData: HomepageCmsData = {
  editor_pick_product_ids: "",
  hero_banners: [],
  offer_cards: [],
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

export async function fetchHomepageCms(signal?: AbortSignal): Promise<HomepageCmsData> {
  const response = await fetch(HOMEPAGE_CMS_ENDPOINT, {
    cache: "no-store",
    signal,
  });
  const payload = (await response.json()) as HomepageCmsResponse;

  if (!response.ok || payload.success === false) {
    throw new Error("Homepage CMS request failed.");
  }

  return {
    editor_pick_product_ids:
      typeof payload.editor_pick_product_ids === "string"
        ? payload.editor_pick_product_ids
        : "",
    hero_banners: Array.isArray(payload.hero_banners)
      ? payload.hero_banners
      : [],
    offer_cards: Array.isArray(payload.offer_cards) ? payload.offer_cards : [],
  };
}
