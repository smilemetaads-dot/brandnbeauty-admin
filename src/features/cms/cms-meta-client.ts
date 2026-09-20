import { bnbApiUrl } from "@/lib/bnb-api";

export type HomepageHeroBanner = {
  cta_text: string;
  id: string;
  image_url: string | null;
  link: string;
  mobile_image_url?: string | null;
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
  start_at?: string | null;
  end_at?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
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
  editor_pick_collection_ids: string;
  editor_pick_product_ids: string;
  hero_banners: HomepageHeroBanner[];
  offer_cards: HomepageOfferCard[];
};

export type HomepageProductOption = {
  id: string;
  name: string;
};

export type HomepageCollectionOption = {
  desktop_image_url: string;
  mobile_image_url: string;
  eyebrow_label: string;
  id: string;
  product_count: number;
  slug: string;
  sort_order: number;
  status: string;
  title: string;
};

type HomepageCmsResponse = Partial<HomepageCmsData> & {
  success?: boolean;
};

export const CMS_META_ENDPOINT = bnbApiUrl("get_cms_meta.php");
export const MANAGE_REVIEWS_ENDPOINT = bnbApiUrl("manage_reviews.php");
export const HOMEPAGE_CMS_ENDPOINT = bnbApiUrl("get_homepage_cms.php");
export const MANAGE_COLLECTIONS_ENDPOINT = bnbApiUrl("manage_collections.php");
export const STORE_PRODUCTS_ENDPOINT = bnbApiUrl("get_store_products.php");
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
  editor_pick_collection_ids: "",
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

export async function fetchHomepageCms(
  signal?: AbortSignal,
  options: { includeInactive?: boolean; headers?: Record<string, string> } = {},
): Promise<HomepageCmsData> {
  const response = await fetch(
    options.includeInactive
      ? `${HOMEPAGE_CMS_ENDPOINT}?include_inactive=1`
      : HOMEPAGE_CMS_ENDPOINT,
    {
      cache: "no-store",
      headers: options.headers,
      signal,
    },
  );
  const payload = (await response.json()) as HomepageCmsResponse;

  if (!response.ok || payload.success === false) {
    throw new Error("Homepage CMS request failed.");
  }

  return {
    editor_pick_collection_ids:
      typeof payload.editor_pick_collection_ids === "string"
        ? payload.editor_pick_collection_ids
        : "",
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

export async function fetchHomepageProductOptions(
  signal?: AbortSignal,
): Promise<HomepageProductOption[]> {
  const response = await fetch(STORE_PRODUCTS_ENDPOINT, {
    cache: "no-store",
    signal,
  });
  const payload = (await response.json()) as {
    products?: Array<{ id?: number | string; product_name?: string }>;
    success?: boolean;
  };

  if (!response.ok || payload.success === false || !Array.isArray(payload.products)) {
    throw new Error("Homepage products could not be loaded.");
  }

  return payload.products
    .map((product) => ({
      id: String(product.id ?? "").trim(),
      name: String(product.product_name ?? "").trim(),
    }))
    .filter((product) => product.id && product.name);
}

export async function fetchHomepageCollectionOptions(
  signal?: AbortSignal,
  headers?: Record<string, string>,
): Promise<HomepageCollectionOption[]> {
  const response = await fetch(MANAGE_COLLECTIONS_ENDPOINT, {
    cache: "no-store",
    headers,
    signal,
  });
  const payload = (await response.json()) as {
    collections?: Array<{
      desktop_image_url?: string | null;
      mobile_image_url?: string | null;
      eyebrow_label?: string | null;
      id?: number | string;
      product_count?: number | string;
      slug?: string | null;
      sort_order?: number | string;
      status?: string | null;
      title?: string | null;
    }>;
    success?: boolean;
  };

  if (!response.ok || payload.success === false || !Array.isArray(payload.collections)) {
    throw new Error("Homepage collections could not be loaded.");
  }

  return payload.collections
    .map((collection) => ({
      eyebrow_label: String(collection.eyebrow_label ?? "").trim(),
      desktop_image_url: String(collection.desktop_image_url ?? "").trim(),
      mobile_image_url: String(collection.mobile_image_url ?? "").trim(),
      id: String(collection.id ?? "").trim(),
      product_count: Number(collection.product_count) || 0,
      slug: String(collection.slug ?? "").trim(),
      sort_order: Number(collection.sort_order) || 0,
      status: String(collection.status ?? "draft").trim() || "draft",
      title: String(collection.title ?? "").trim(),
    }))
    .filter((collection) => collection.id && collection.title && collection.status !== "deleted")
    .sort((a, b) => a.sort_order - b.sort_order || Number(a.id) - Number(b.id));
}