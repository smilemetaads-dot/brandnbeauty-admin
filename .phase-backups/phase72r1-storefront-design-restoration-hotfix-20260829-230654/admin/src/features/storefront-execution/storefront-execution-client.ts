import { bnbApiUrl } from "@/lib/bnb-api";

type JsonRecord = Record<string, unknown>;

export type StorefrontExecutionState = {
  activeHeroes: number;
  collections: number;
  connectedFeeds: number;
  footerColumns: number;
  navigationItems: number;
  products: number;
  publishedReviews: number;
  seoConnected: boolean;
  totalFeeds: number;
};

function record(value: unknown): JsonRecord { return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {}; }
function list(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function active(value: unknown) { return ["active", "published"].includes(String(value ?? "").toLowerCase()); }

async function read(endpoint: string) {
  const response = await fetch(bnbApiUrl(endpoint), { cache: "no-store", signal: AbortSignal.timeout(8000) });
  const payload = await response.json().catch(() => null) as JsonRecord | null;
  if (!response.ok || !payload || payload.success !== true) throw new Error(`${endpoint} is unavailable.`);
  return payload;
}

export async function loadStorefrontExecution(): Promise<StorefrontExecutionState> {
  const feeds = await Promise.allSettled([
    read("get_homepage_layout.php"), read("get_header_navigation.php"), read("get_footer_layout.php"), read("get_store_products.php"),
    read("get_collections.php"), read("get_reviews_results.php"), read("get_offers_deals.php"), read("get_seo_storefront.php"),
  ]);
  const value = (index: number): JsonRecord => feeds[index].status === "fulfilled" ? feeds[index].value : {};
  const homepage = record(value(0).homepage);
  const header = record(value(1).header_navigation);
  const footer = record(value(2).footer);

  return {
    activeHeroes: list(homepage.hero_banners).filter((item) => active(record(item).status)).length,
    collections: list(value(4).collections).length,
    connectedFeeds: feeds.filter((feed) => feed.status === "fulfilled").length,
    footerColumns: list(footer.columns).filter((item) => active(record(item).status)).length,
    navigationItems: list(header.items).filter((item) => active(record(item).status)).length,
    products: Number.isFinite(Number(value(3).total)) ? Number(value(3).total) : list(value(3).products).length,
    publishedReviews: list(value(5).entries).length,
    seoConnected: feeds[7].status === "fulfilled",
    totalFeeds: feeds.length,
  };
}
