import { cache } from "react";

import { bnbApiAssetUrl, bnbApiUrl } from "@/lib/bnb-api";

export type PreviewProduct = {
  available: boolean;
  brand: string;
  category: string;
  comparePrice: number | null;
  description: string;
  featured: boolean;
  id: number;
  image: string;
  metaDescription: string;
  metaTitle: string;
  name: string;
  price: number;
  shortDescription: string;
  sku: string;
  slug: string;
  status: string;
  stock: number;
  updatedAt: string | null;
};

export type PreviewProductDetail = {
  product: PreviewProduct;
  related: PreviewProduct[];
};

export type PreviewCollection = {
  description: string;
  desktopImage: string;
  eyebrow: string;
  href: string;
  id: number;
  mobileImage: string;
  productCount: number;
  seoDescription: string;
  seoTitle: string;
  slug: string;
  title: string;
};

export type PreviewHero = {
  ctaText: string;
  desktopImage: string;
  id: string;
  link: string;
  mobileImage: string;
  status: string;
  subtitle: string;
  title: string;
};

export type PreviewSection = {
  displayLimit: number;
  enabled: boolean;
  id: string;
  source: string;
  subtitle: string;
  title: string;
};

export type PreviewNavigation = {
  announcement: { enabled: boolean; link: string; text: string };
  items: Array<{
    children: Array<{ id: string; label: string; link: string }>;
    id: string;
    label: string;
    link: string;
    status: string;
  }>;
  mobileShortcuts: string[];
  settings: { account: boolean; cart: boolean; search: boolean; sticky: boolean; wishlist: boolean };
};

export type PreviewFooter = {
  brand: { address: string; description: string; email: string; facebook: string; instagram: string; phone: string; whatsapp: string; youtube: string };
  columns: Array<{ id: string; links: Array<{ id: string; label: string; status: string; url: string }>; status: string; title: string }>;
  settings: { contactBlock: boolean; copyright: string; newsletter: boolean; paymentBadges: boolean; socialLinks: boolean; trustStrip: boolean };
  trustItems: Array<{ active: boolean; id: string; label: string; note: string }>;
};

export type PreviewReview = {
  customer: string;
  featured: boolean;
  id: number;
  media: string;
  product: string;
  rating: number;
  text: string;
  verified: boolean;
};

export type PreviewOffer = {
  code: string;
  discountValue: number;
  id: number;
  name: string;
  summary: string;
  type: string;
};

export type StorefrontPreviewSnapshot = {
  collections: PreviewCollection[];
  connected: {
    collections: boolean;
    footer: boolean;
    header: boolean;
    homepage: boolean;
    offers: boolean;
    products: boolean;
    reviews: boolean;
    seo: boolean;
  };
  footer: PreviewFooter;
  heroes: PreviewHero[];
  homepage: { pageSubtitle: string; pageTitle: string; publishedAt: string | null; sections: PreviewSection[]; version: number };
  navigation: PreviewNavigation;
  offers: PreviewOffer[];
  products: PreviewProduct[];
  reviews: PreviewReview[];
  seo: { canonicalBase: string; defaultDescription: string; defaultOgImage: string; defaultTitle: string; indexingEnabled: boolean; siteName: string; siteUrl: string; sitemapEnabled: boolean };
};

type JsonRecord = Record<string, unknown>;

const emptyNavigation: PreviewNavigation = {
  announcement: { enabled: false, link: "/", text: "" },
  items: [],
  mobileShortcuts: ["Home", "Search", "Bag"],
  settings: { account: false, cart: true, search: true, sticky: true, wishlist: false },
};

const emptyFooter: PreviewFooter = {
  brand: { address: "", description: "", email: "", facebook: "", instagram: "", phone: "", whatsapp: "", youtube: "" },
  columns: [],
  settings: { contactBlock: false, copyright: "", newsletter: false, paymentBadges: false, socialLinks: false, trustStrip: false },
  trustItems: [],
};

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || text(value) === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function bool(value: unknown) {
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "active", "published"].includes(text(value).toLowerCase());
}

async function publicPayload(endpoint: string, search?: URLSearchParams) {
  const url = `${bnbApiUrl(endpoint)}${search?.size ? `?${search.toString()}` : ""}`;
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  const payload = await response.json().catch(() => null) as JsonRecord | null;
  if (!response.ok || !payload || payload.success !== true) throw new Error(text(payload?.message) || `${endpoint} is unavailable.`);
  return payload;
}

function product(value: unknown): PreviewProduct {
  const item = record(value);
  const stock = Math.max(0, numberValue(item.stock_quantity));
  return {
    available: bool(item.available) || stock > 0,
    brand: text(item.brand_name),
    category: text(item.category_name),
    comparePrice: nullableNumber(item.compare_price),
    description: text(item.description),
    featured: bool(item.featured),
    id: numberValue(item.id),
    image: bnbApiAssetUrl(text(item.image_url)) || "",
    metaDescription: text(item.meta_description),
    metaTitle: text(item.meta_title),
    name: text(item.product_name) || "Untitled product",
    price: Math.max(0, numberValue(item.price)),
    shortDescription: text(item.short_description),
    sku: text(item.sku),
    slug: text(item.slug),
    status: text(item.status).toLowerCase() || "active",
    stock,
    updatedAt: text(item.updated_at) || null,
  };
}

function collection(value: unknown): PreviewCollection {
  const item = record(value);
  const slug = text(item.slug);
  return {
    description: text(item.description),
    desktopImage: bnbApiAssetUrl(text(item.desktop_image_url)) || "",
    eyebrow: text(item.eyebrow_label),
    href: `/storefront-preview/collections/${encodeURIComponent(slug)}`,
    id: numberValue(item.id),
    mobileImage: bnbApiAssetUrl(text(item.mobile_image_url)) || "",
    productCount: numberValue(item.product_count),
    seoDescription: text(item.seo_description),
    seoTitle: text(item.seo_title),
    slug,
    title: text(item.title) || "Untitled collection",
  };
}

function normalizeNavigation(payload: JsonRecord): PreviewNavigation {
  const config = record(payload.header_navigation);
  const announcement = record(config.announcement);
  const settings = record(config.settings);
  return {
    announcement: { enabled: bool(announcement.enabled), link: text(announcement.link) || "/", text: text(announcement.text) },
    items: list(config.items).map((entry, index) => {
      const item = record(entry);
      return {
        children: list(item.children).map((child, childIndex) => {
          const value = record(child);
          return { id: text(value.id) || `child-${index}-${childIndex}`, label: text(value.label), link: text(value.link) || "/" };
        }),
        id: text(item.id) || `nav-${index}`,
        label: text(item.label) || "Menu",
        link: text(item.link) || "/",
        status: text(item.status).toLowerCase() || "draft",
      };
    }),
    mobileShortcuts: list(config.mobile_shortcuts).map(text).filter(Boolean).slice(0, 4),
    settings: {
      account: bool(settings.account), cart: bool(settings.cart), search: bool(settings.search), sticky: bool(settings.sticky), wishlist: bool(settings.wishlist),
    },
  };
}

function normalizeFooter(payload: JsonRecord): PreviewFooter {
  const config = record(payload.footer);
  const brand = record(config.brand);
  const settings = record(config.settings);
  return {
    brand: {
      address: text(brand.address), description: text(brand.description), email: text(brand.email), facebook: text(brand.facebook), instagram: text(brand.instagram), phone: text(brand.phone), whatsapp: text(brand.whatsapp), youtube: text(brand.youtube),
    },
    columns: list(config.columns).map((entry, index) => {
      const item = record(entry);
      return {
        id: text(item.id) || `footer-${index}`,
        links: list(item.links).map((link, linkIndex) => { const value = record(link); return { id: text(value.id) || `footer-link-${linkIndex}`, label: text(value.label), status: text(value.status).toLowerCase(), url: text(value.url) || "/" }; }),
        status: text(item.status).toLowerCase(),
        title: text(item.title) || "Links",
      };
    }),
    settings: {
      contactBlock: bool(settings.contact_block), copyright: text(settings.copyright), newsletter: bool(settings.newsletter), paymentBadges: bool(settings.payment_badges), socialLinks: bool(settings.social_links), trustStrip: bool(settings.trust_strip),
    },
    trustItems: list(config.trust_items).map((entry, index) => { const item = record(entry); return { active: bool(item.active), id: text(item.id) || `trust-${index}`, label: text(item.label), note: text(item.note) }; }),
  };
}

export const getStorefrontPreviewSnapshot = cache(async (): Promise<StorefrontPreviewSnapshot> => {
  const requests = await Promise.allSettled([
    publicPayload("get_homepage_layout.php"), publicPayload("get_header_navigation.php"), publicPayload("get_footer_layout.php"),
    publicPayload("get_store_products.php", new URLSearchParams({ limit: "1000" })), publicPayload("get_collections.php", new URLSearchParams({ limit: "24" })),
    publicPayload("get_reviews_results.php"), publicPayload("get_offers_deals.php"), publicPayload("get_seo_storefront.php"),
  ]);
  const value = (index: number) => requests[index].status === "fulfilled" ? requests[index].value : {};
  const homepagePayload = value(0);
  const homepage = record(homepagePayload.homepage);
  const seoPayload = value(7);
  const seo = record(seoPayload.config);

  return {
    collections: list(value(4).collections).map(collection),
    connected: {
      homepage: requests[0].status === "fulfilled", header: requests[1].status === "fulfilled", footer: requests[2].status === "fulfilled", products: requests[3].status === "fulfilled", collections: requests[4].status === "fulfilled", reviews: requests[5].status === "fulfilled", offers: requests[6].status === "fulfilled", seo: requests[7].status === "fulfilled",
    },
    footer: requests[2].status === "fulfilled" ? normalizeFooter(value(2)) : emptyFooter,
    heroes: list(homepage.hero_banners).map((entry, index) => { const item = record(entry); return { ctaText: text(item.cta_text), desktopImage: bnbApiAssetUrl(text(item.image_url)) || "", id: text(item.id) || `hero-${index}`, link: text(item.link) || "/", mobileImage: bnbApiAssetUrl(text(item.mobile_image_url)) || "", status: text(item.status).toLowerCase(), subtitle: text(item.subtitle), title: text(item.title) }; }).filter((item) => item.status === "active"),
    homepage: {
      pageSubtitle: text(homepage.page_subtitle), pageTitle: text(homepage.page_title), publishedAt: text(homepagePayload.published_at) || null, version: numberValue(homepagePayload.version),
      sections: list(homepage.sections).map((entry, index) => { const item = record(entry); return { displayLimit: Math.max(1, Math.min(24, numberValue(item.display_limit, 6))), enabled: bool(item.enabled), id: text(item.id) || `section-${index}`, source: text(item.source), subtitle: text(item.subtitle), title: text(item.title) || "Featured products" }; }).filter((item) => item.enabled),
    },
    navigation: requests[1].status === "fulfilled" ? normalizeNavigation(value(1)) : emptyNavigation,
    offers: list(value(6).offers).map((entry) => { const item = record(entry); return { code: text(item.code), discountValue: numberValue(item.discount_value), id: numberValue(item.id), name: text(item.name), summary: text(item.eligibility_summary), type: text(item.offer_type) }; }),
    products: list(value(3).products).map(product).filter((item) => ["active", "published", "out_of_stock"].includes(item.status)),
    reviews: list(value(5).entries).map((entry) => { const item = record(entry); return { customer: text(item.customer_display_name), featured: bool(item.featured), id: numberValue(item.id), media: bnbApiAssetUrl(text(item.media_url)) || "", product: text(item.product_name), rating: Math.max(1, Math.min(5, numberValue(item.rating, 5))), text: text(item.review_text), verified: bool(item.verified_purchase) }; }),
    seo: { canonicalBase: text(seo.canonical_base) || "https://brandnbeauty.com", defaultDescription: text(seo.default_description), defaultOgImage: bnbApiAssetUrl(text(seo.default_og_image)) || "", defaultTitle: text(seo.default_title) || "BrandnBeauty", indexingEnabled: bool(seo.indexing_enabled), siteName: text(seo.site_name) || "BrandnBeauty", siteUrl: text(seo.site_url) || "https://brandnbeauty.com", sitemapEnabled: bool(seo.sitemap_enabled) },
  };
});

export async function getPreviewCollection(slug: string) {
  try {
    const payload = await publicPayload("get_collection.php", new URLSearchParams({ slug }));
    const rawCollection = record(payload.collection);
    return { ...collection(rawCollection), products: list(rawCollection.products).map(product) };
  } catch {
    return null;
  }
}

export const getPreviewProductDetail = cache(async (slug: string): Promise<PreviewProductDetail | null> => {
  try {
    const payload = await publicPayload("get_store_product.php", new URLSearchParams({ slug }));
    return {
      product: product(payload.product),
      related: list(payload.related_products).map(product),
    };
  } catch {
    const snapshot = await getStorefrontPreviewSnapshot();
    const selected = snapshot.products.find((item) => item.slug === slug) ?? null;
    if (!selected) return null;
    const related = snapshot.products.filter((item) => item.id !== selected.id && (
      (selected.category && item.category === selected.category) ||
      (selected.brand && item.brand === selected.brand)
    )).slice(0, 4);
    return { product: selected, related };
  }
});

export async function getPreviewProduct(slug: string) {
  return (await getPreviewProductDetail(slug))?.product ?? null;
}

export function previewHref(href: string) {
  const clean = text(href);
  if (!clean || clean === "/") return "/storefront-preview";
  if (/^(https?:|mailto:|tel:|#)/i.test(clean)) return clean;
  if (clean.startsWith("/storefront-preview")) return clean;
  return `/storefront-preview${clean.startsWith("/") ? clean : `/${clean}`}`;
}

export function money(value: number) {
  return `৳${Math.max(0, value).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}
