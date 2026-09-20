import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type SeoTemplate = { descriptionTemplate: string; indexable: boolean; pageType: string; titleTemplate: string };
export type SeoConfig = {
  breadcrumbSchema: boolean; canonicalBase: string; defaultDescription: string; defaultOgImage: string; defaultTitle: string;
  facebookPage: string; followLinks: boolean; includeBrands: boolean; includeCategories: boolean; includeCollections: boolean;
  includeConcerns: boolean; includeProducts: boolean; indexingEnabled: boolean; organizationSchema: boolean; productSchema: boolean;
  robotsCustomRules: string; siteName: string; siteUrl: string; sitemapEnabled: boolean; templates: SeoTemplate[];
  titleSuffix: string; twitterHandle: string;
};
export type SeoRedirect = { createdAt: string | null; fromPath: string; hits: number; id: number; reason: string; redirectType: 301 | 302; status: "active" | "archived" | "draft"; toPath: string; updatedAt: string | null };
export type SeoAuditCheck = { area: string; detail: string; id: string; label: string; status: "critical" | "pass" | "warning" };
export type SeoAudit = { checks: SeoAuditCheck[]; createdAt: string | null; criticalCount: number; id: number; passedCount: number; runBy: string; score: number; warningCount: number };
export type SeoVersion = { publishedAt: string | null; publishedBy: string; version: number };
export type SeoState = { audits: SeoAudit[]; draft: SeoConfig; live: SeoConfig; publishedAt: string | null; redirects: SeoRedirect[]; updatedAt: string | null; version: number; versions: SeoVersion[] };

type ApiObject = Record<string, unknown>;
type ApiResponse = ApiObject & { success?: boolean; message?: string };

export const MANAGE_SEO_STOREFRONT_ENDPOINT = bnbApiUrl("manage_seo_storefront.php");
export const PUBLIC_SEO_STOREFRONT_ENDPOINT = bnbApiUrl("get_seo_storefront.php");

export const defaultSeoConfig: SeoConfig = {
  breadcrumbSchema: true, canonicalBase: "https://brandnbeauty.com",
  defaultDescription: "Shop authentic skincare, haircare, fragrance and beauty products in Bangladesh with clear product information and dependable delivery.",
  defaultOgImage: "", defaultTitle: "BrandnBeauty | Authentic Beauty in Bangladesh", facebookPage: "", followLinks: true,
  includeBrands: true, includeCategories: true, includeCollections: true, includeConcerns: true, includeProducts: true,
  indexingEnabled: true, organizationSchema: true, productSchema: true,
  robotsCustomRules: "Disallow: /admin\nDisallow: /checkout\nDisallow: /account", siteName: "BrandnBeauty",
  siteUrl: "https://brandnbeauty.com", sitemapEnabled: true,
  templates: [
    { descriptionTemplate: "Shop {product_name} in Bangladesh. See ingredients, suitability, authentic sourcing and delivery information.", indexable: true, pageType: "Product", titleTemplate: "{product_name}{title_suffix}" },
    { descriptionTemplate: "Explore authentic {category_name} products at BrandnBeauty with clear product details and delivery across Bangladesh.", indexable: true, pageType: "Category", titleTemplate: "{category_name}{title_suffix}" },
    { descriptionTemplate: "Discover carefully selected products for {concern_name}. Compare ingredients, suitability and routine guidance.", indexable: true, pageType: "Concern", titleTemplate: "{concern_name} Products{title_suffix}" },
    { descriptionTemplate: "Shop authentic {brand_name} products in Bangladesh from BrandnBeauty.", indexable: true, pageType: "Brand", titleTemplate: "{brand_name} Products{title_suffix}" },
    { descriptionTemplate: "Explore the {collection_name} collection from BrandnBeauty.", indexable: true, pageType: "Collection", titleTemplate: "{collection_name}{title_suffix}" },
  ], titleSuffix: " | BrandnBeauty", twitterHandle: "",
};

function record(value: unknown): ApiObject { return value && typeof value === "object" && !Array.isArray(value) ? value as ApiObject : {}; }
function array(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function text(value: unknown) { return String(value ?? "").trim(); }
function numberValue(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
function bool(value: unknown) { return typeof value === "boolean" ? value : ["1", "true", "yes", "active"].includes(text(value).toLowerCase()); }

function normalizeConfig(value: unknown): SeoConfig {
  const data = record(value); const templates = array(data.templates).map((item) => { const row = record(item); return { descriptionTemplate: text(row.description_template), indexable: bool(row.indexable), pageType: text(row.page_type), titleTemplate: text(row.title_template) }; }).filter((item) => item.pageType);
  return {
    breadcrumbSchema: bool(data.breadcrumb_schema), canonicalBase: text(data.canonical_base) || defaultSeoConfig.canonicalBase,
    defaultDescription: text(data.default_description) || defaultSeoConfig.defaultDescription, defaultOgImage: text(data.default_og_image),
    defaultTitle: text(data.default_title) || defaultSeoConfig.defaultTitle, facebookPage: text(data.facebook_page), followLinks: bool(data.follow_links),
    includeBrands: bool(data.include_brands), includeCategories: bool(data.include_categories), includeCollections: bool(data.include_collections),
    includeConcerns: bool(data.include_concerns), includeProducts: bool(data.include_products), indexingEnabled: bool(data.indexing_enabled),
    organizationSchema: bool(data.organization_schema), productSchema: bool(data.product_schema), robotsCustomRules: text(data.robots_custom_rules),
    siteName: text(data.site_name) || defaultSeoConfig.siteName, siteUrl: text(data.site_url) || defaultSeoConfig.siteUrl,
    sitemapEnabled: bool(data.sitemap_enabled), templates: templates.length ? templates : defaultSeoConfig.templates,
    titleSuffix: text(data.title_suffix), twitterHandle: text(data.twitter_handle),
  };
}

function apiConfig(config: SeoConfig) {
  return {
    breadcrumb_schema: config.breadcrumbSchema, canonical_base: config.canonicalBase, default_description: config.defaultDescription,
    default_og_image: config.defaultOgImage, default_title: config.defaultTitle, facebook_page: config.facebookPage,
    follow_links: config.followLinks, include_brands: config.includeBrands, include_categories: config.includeCategories,
    include_collections: config.includeCollections, include_concerns: config.includeConcerns, include_products: config.includeProducts,
    indexing_enabled: config.indexingEnabled, organization_schema: config.organizationSchema, product_schema: config.productSchema,
    robots_custom_rules: config.robotsCustomRules, site_name: config.siteName, site_url: config.siteUrl,
    sitemap_enabled: config.sitemapEnabled, templates: config.templates.map((template) => ({ description_template: template.descriptionTemplate, indexable: template.indexable, page_type: template.pageType, title_template: template.titleTemplate })),
    title_suffix: config.titleSuffix, twitter_handle: config.twitterHandle,
  };
}

function normalizeState(payload: ApiResponse): SeoState {
  return {
    audits: array(payload.audits).map((item) => { const row = record(item); return { checks: array(row.checks).map((check) => { const value = record(check); const status = text(value.status); return { area: text(value.area), detail: text(value.detail), id: text(value.id), label: text(value.label), status: status === "critical" || status === "warning" ? status : "pass" }; }), createdAt: text(row.created_at) || null, criticalCount: numberValue(row.critical_count), id: numberValue(row.id), passedCount: numberValue(row.passed_count), runBy: text(row.run_by) || "admin", score: numberValue(row.score), warningCount: numberValue(row.warning_count) }; }),
    draft: normalizeConfig(payload.draft), live: normalizeConfig(payload.live), publishedAt: text(payload.published_at) || null,
    redirects: array(payload.redirects).map((item) => { const row = record(item); const status = text(row.status); return { createdAt: text(row.created_at) || null, fromPath: text(row.from_path), hits: numberValue(row.hits), id: numberValue(row.id), reason: text(row.reason), redirectType: numberValue(row.redirect_type, 301) === 302 ? 302 : 301, status: status === "active" || status === "archived" ? status : "draft", toPath: text(row.to_path), updatedAt: text(row.updated_at) || null }; }),
    updatedAt: text(payload.updated_at) || null, version: numberValue(payload.version, 1),
    versions: array(payload.versions).map((item) => { const row = record(item); return { publishedAt: text(row.published_at) || null, publishedBy: text(row.published_by) || "admin", version: numberValue(row.version) }; }),
  };
}

async function parseResponse(response: Response) {
  const payload = await response.json().catch(() => null) as ApiResponse | null;
  if (!response.ok || !payload?.success) throw new Error(payload?.message || "SEO request could not be completed.");
  return payload;
}

async function postAction(body: Record<string, unknown>) {
  const response = await fetch(MANAGE_SEO_STOREFRONT_ENDPOINT, { body: JSON.stringify(body), headers: adminAuthHeaders({ "Content-Type": "application/json" }), method: "POST" });
  return normalizeState(await parseResponse(response));
}

export async function fetchSeoState(signal?: AbortSignal) {
  const response = await fetch(MANAGE_SEO_STOREFRONT_ENDPOINT, { cache: "no-store", headers: adminAuthHeaders(), signal });
  return normalizeState(await parseResponse(response));
}
export async function saveSeoDraft(config: SeoConfig) {
  const response = await fetch(MANAGE_SEO_STOREFRONT_ENDPOINT, { body: JSON.stringify({ config: apiConfig(config) }), headers: adminAuthHeaders({ "Content-Type": "application/json" }), method: "PUT" });
  return normalizeState(await parseResponse(response));
}
export async function publishSeo(config: SeoConfig) { return postAction({ action: "publish", config: apiConfig(config) }); }
export async function runSeoAudit() { return postAction({ action: "run_audit" }); }
export async function saveSeoRedirect(redirect: Pick<SeoRedirect, "fromPath" | "id" | "reason" | "redirectType" | "toPath">) { return postAction({ action: "save_redirect", redirect: { from_path: redirect.fromPath, id: redirect.id, reason: redirect.reason, redirect_type: redirect.redirectType, to_path: redirect.toPath } }); }
export async function archiveSeoRedirect(id: number) { return postAction({ action: "archive_redirect", id }); }
export async function restoreSeoDraft(version: number) { return postAction({ action: "restore_draft", version }); }
