import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type HomepageSection = {
  displayLimit: number;
  enabled: boolean;
  id: string;
  sortOrder: number;
  source: string;
  subtitle: string;
  title: string;
};

export type HomepageHero = {
  ctaText: string;
  desktopImage: string;
  id: string;
  link: string;
  mobileImage: string;
  sortOrder: number;
  status: "active" | "draft" | "inactive";
  subtitle: string;
  title: string;
};

export type HomepageConfig = {
  heroBanners: HomepageHero[];
  pageSubtitle: string;
  pageTitle: string;
  sections: HomepageSection[];
};

export type HomepageCmsState = {
  draft: HomepageConfig;
  live: HomepageConfig;
  publishedAt: string | null;
  updatedAt: string | null;
  version: number;
};

type ApiSection = {
  display_limit?: number | string;
  enabled?: boolean | number | string;
  id?: string;
  sort_order?: number | string;
  source?: string;
  subtitle?: string;
  title?: string;
};

type ApiHero = {
  cta_text?: string;
  id?: string;
  image_url?: string;
  link?: string;
  mobile_image_url?: string;
  sort_order?: number | string;
  status?: string;
  subtitle?: string;
  title?: string;
};

type ApiConfig = {
  hero_banners?: ApiHero[];
  page_subtitle?: string;
  page_title?: string;
  sections?: ApiSection[];
};

type ApiResponse = {
  draft?: ApiConfig;
  live?: ApiConfig;
  message?: string;
  published_at?: string | null;
  success?: boolean;
  updated_at?: string | null;
  version?: number | string;
};

export const MANAGE_HOMEPAGE_CMS_ENDPOINT = bnbApiUrl("manage_homepage_cms.php");
export const PUBLIC_HOMEPAGE_LAYOUT_ENDPOINT = bnbApiUrl("get_homepage_layout.php");
export const UPLOAD_HOMEPAGE_MEDIA_ENDPOINT = bnbApiUrl("upload_homepage_media.php");

export const defaultHomepageConfig: HomepageConfig = {
  heroBanners: [],
  pageSubtitle: "Authentic skincare and beauty products for every routine.",
  pageTitle: "Beauty chosen with care",
  sections: [],
};

function numberValue(value: number | string | null | undefined, fallback: number) {
  const number = Number(value ?? fallback);
  return Number.isFinite(number) ? number : fallback;
}

function booleanValue(value: boolean | number | string | null | undefined) {
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "active"].includes(String(value ?? "").toLowerCase());
}

function textValue(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function normalizeConfig(config: ApiConfig | null | undefined): HomepageConfig {
  return {
    heroBanners: (config?.hero_banners ?? []).map((hero, index) => {
      const rawStatus = textValue(hero.status).toLowerCase();
      const status: HomepageHero["status"] = rawStatus === "active" || rawStatus === "inactive" ? rawStatus : "draft";
      return {
        ctaText: textValue(hero.cta_text),
        desktopImage: textValue(hero.image_url),
        id: textValue(hero.id) || `hero-${index + 1}`,
        link: textValue(hero.link),
        mobileImage: textValue(hero.mobile_image_url),
        sortOrder: numberValue(hero.sort_order, index + 1),
        status,
        subtitle: textValue(hero.subtitle),
        title: textValue(hero.title),
      };
    }).toSorted((left, right) => left.sortOrder - right.sortOrder),
    pageSubtitle: textValue(config?.page_subtitle),
    pageTitle: textValue(config?.page_title),
    sections: (config?.sections ?? []).map((section, index) => ({
      displayLimit: numberValue(section.display_limit, 6),
      enabled: booleanValue(section.enabled),
      id: textValue(section.id) || `section-${index + 1}`,
      sortOrder: numberValue(section.sort_order, index + 1),
      source: textValue(section.source) || "Homepage CMS",
      subtitle: textValue(section.subtitle),
      title: textValue(section.title) || "Homepage Section",
    })).toSorted((left, right) => left.sortOrder - right.sortOrder),
  };
}

function apiConfig(config: HomepageConfig): ApiConfig {
  return {
    hero_banners: config.heroBanners.map((hero, index) => ({
      cta_text: hero.ctaText,
      id: hero.id,
      image_url: hero.desktopImage,
      link: hero.link,
      mobile_image_url: hero.mobileImage,
      sort_order: index + 1,
      status: hero.status,
      subtitle: hero.subtitle,
      title: hero.title,
    })),
    page_subtitle: config.pageSubtitle,
    page_title: config.pageTitle,
    sections: config.sections.map((section, index) => ({
      display_limit: section.displayLimit,
      enabled: section.enabled,
      id: section.id,
      sort_order: index + 1,
      source: section.source,
      subtitle: section.subtitle,
      title: section.title,
    })),
  };
}

async function parseResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as ApiResponse | null;
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || "Homepage CMS request could not be completed.");
  }
  return payload;
}

function stateFromPayload(payload: ApiResponse): HomepageCmsState {
  return {
    draft: normalizeConfig(payload.draft),
    live: normalizeConfig(payload.live),
    publishedAt: payload.published_at ?? null,
    updatedAt: payload.updated_at ?? null,
    version: numberValue(payload.version, 1),
  };
}

export async function fetchHomepageCmsState(signal?: AbortSignal) {
  const response = await fetch(MANAGE_HOMEPAGE_CMS_ENDPOINT, {
    cache: "no-store",
    headers: adminAuthHeaders(),
    signal,
  });
  return stateFromPayload(await parseResponse(response));
}

export async function saveHomepageDraft(config: HomepageConfig) {
  const response = await fetch(MANAGE_HOMEPAGE_CMS_ENDPOINT, {
    body: JSON.stringify({ config: apiConfig(config) }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "PUT",
  });
  return stateFromPayload(await parseResponse(response));
}

export async function publishHomepage(config: HomepageConfig) {
  const response = await fetch(MANAGE_HOMEPAGE_CMS_ENDPOINT, {
    body: JSON.stringify({ config: apiConfig(config) }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  return stateFromPayload(await parseResponse(response));
}

export async function uploadHomepageImage(file: File) {
  const body = new FormData();
  body.append("image", file);
  const response = await fetch(UPLOAD_HOMEPAGE_MEDIA_ENDPOINT, {
    body,
    headers: adminAuthHeaders(),
    method: "POST",
  });
  const payload = (await response.json().catch(() => null)) as { message?: string; success?: boolean; url?: string } | null;
  if (!response.ok || !payload?.success || !payload.url) {
    throw new Error(payload?.message || "Homepage image could not be uploaded.");
  }
  return payload.url;
}
