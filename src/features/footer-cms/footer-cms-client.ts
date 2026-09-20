import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type FooterLink = {
  id: string;
  label: string;
  sortOrder: number;
  status: "active" | "draft" | "hidden";
  url: string;
};

export type FooterColumn = {
  id: string;
  links: FooterLink[];
  sortOrder: number;
  status: "active" | "draft" | "hidden";
  title: string;
};

export type FooterTrustItem = {
  active: boolean;
  id: string;
  label: string;
  note: string;
  sortOrder: number;
};

export type FooterCmsConfig = {
  brand: {
    address: string;
    description: string;
    email: string;
    facebook: string;
    instagram: string;
    phone: string;
    whatsapp: string;
    youtube: string;
  };
  columns: FooterColumn[];
  settings: {
    contactBlock: boolean;
    copyright: string;
    newsletter: boolean;
    paymentBadges: boolean;
    socialLinks: boolean;
    trustStrip: boolean;
  };
  trustItems: FooterTrustItem[];
};

export type FooterCmsVersion = {
  publishedAt: string | null;
  publishedBy: string;
  version: number;
};

export type FooterCmsState = {
  draft: FooterCmsConfig;
  live: FooterCmsConfig;
  publishedAt: string | null;
  updatedAt: string | null;
  version: number;
  versions: FooterCmsVersion[];
};

type ApiLink = { id?: string; label?: string; sort_order?: number | string; status?: string; url?: string };
type ApiColumn = { id?: string; links?: ApiLink[]; sort_order?: number | string; status?: string; title?: string };
type ApiTrustItem = { active?: boolean | number | string; id?: string; label?: string; note?: string; sort_order?: number | string };
type ApiConfig = {
  brand?: Record<string, string | undefined>;
  columns?: ApiColumn[];
  settings?: Record<string, boolean | number | string | undefined>;
  trust_items?: ApiTrustItem[];
};
type ApiVersion = { published_at?: string | null; published_by?: string; version?: number | string };
type ApiResponse = {
  draft?: ApiConfig;
  live?: ApiConfig;
  message?: string;
  published_at?: string | null;
  success?: boolean;
  updated_at?: string | null;
  version?: number | string;
  versions?: ApiVersion[];
};

export const MANAGE_FOOTER_CMS_ENDPOINT = bnbApiUrl("manage_footer_cms.php");
export const PUBLIC_FOOTER_ENDPOINT = bnbApiUrl("get_footer_layout.php");

export const defaultFooterCmsConfig: FooterCmsConfig = {
  brand: { address: "", description: "", email: "", facebook: "", instagram: "", phone: "", whatsapp: "", youtube: "" },
  columns: [],
  settings: { contactBlock: true, copyright: "", newsletter: true, paymentBadges: true, socialLinks: true, trustStrip: true },
  trustItems: [],
};

function bool(value: boolean | number | string | null | undefined) {
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "active"].includes(String(value ?? "").toLowerCase());
}

function numberValue(value: number | string | null | undefined, fallback: number) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function text(value: boolean | number | string | null | undefined) {
  return String(value ?? "").trim();
}

function status(value: string | null | undefined): FooterColumn["status"] {
  const normalized = text(value).toLowerCase();
  return normalized === "active" || normalized === "hidden" ? normalized : "draft";
}

function normalizeConfig(config: ApiConfig | null | undefined): FooterCmsConfig {
  const brand = config?.brand ?? {};
  const settings = config?.settings ?? {};
  return {
    brand: {
      address: text(brand.address),
      description: text(brand.description),
      email: text(brand.email),
      facebook: text(brand.facebook),
      instagram: text(brand.instagram),
      phone: text(brand.phone),
      whatsapp: text(brand.whatsapp),
      youtube: text(brand.youtube),
    },
    columns: (config?.columns ?? []).map((column, columnIndex) => ({
      id: text(column.id) || `FTR-${String(columnIndex + 1).padStart(2, "0")}`,
      links: (column.links ?? []).map((link, linkIndex) => ({
        id: text(link.id) || `FTR-${columnIndex + 1}-L-${linkIndex + 1}`,
        label: text(link.label),
        sortOrder: numberValue(link.sort_order, linkIndex + 1),
        status: status(link.status),
        url: text(link.url) || "/",
      })).toSorted((left, right) => left.sortOrder - right.sortOrder),
      sortOrder: numberValue(column.sort_order, columnIndex + 1),
      status: status(column.status),
      title: text(column.title) || "Footer column",
    })).toSorted((left, right) => left.sortOrder - right.sortOrder),
    settings: {
      contactBlock: bool(settings.contact_block),
      copyright: text(settings.copyright),
      newsletter: bool(settings.newsletter),
      paymentBadges: bool(settings.payment_badges),
      socialLinks: bool(settings.social_links),
      trustStrip: bool(settings.trust_strip),
    },
    trustItems: (config?.trust_items ?? []).map((item, index) => ({
      active: bool(item.active),
      id: text(item.id) || `TR-${String(index + 1).padStart(2, "0")}`,
      label: text(item.label),
      note: text(item.note),
      sortOrder: numberValue(item.sort_order, index + 1),
    })).toSorted((left, right) => left.sortOrder - right.sortOrder),
  };
}

function apiConfig(config: FooterCmsConfig): ApiConfig {
  return {
    brand: { ...config.brand },
    columns: config.columns.map((column, columnIndex) => ({
      id: column.id,
      links: column.links.map((link, linkIndex) => ({ ...link, sort_order: linkIndex + 1 })),
      sort_order: columnIndex + 1,
      status: column.status,
      title: column.title,
    })),
    settings: {
      contact_block: config.settings.contactBlock,
      copyright: config.settings.copyright,
      newsletter: config.settings.newsletter,
      payment_badges: config.settings.paymentBadges,
      social_links: config.settings.socialLinks,
      trust_strip: config.settings.trustStrip,
    },
    trust_items: config.trustItems.map((item, index) => ({ ...item, sort_order: index + 1 })),
  };
}

async function parseResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as ApiResponse | null;
  if (!response.ok || !payload?.success) throw new Error(payload?.message || "Footer CMS request could not be completed.");
  return payload;
}

function stateFromPayload(payload: ApiResponse): FooterCmsState {
  return {
    draft: normalizeConfig(payload.draft),
    live: normalizeConfig(payload.live),
    publishedAt: payload.published_at ?? null,
    updatedAt: payload.updated_at ?? null,
    version: numberValue(payload.version, 1),
    versions: (payload.versions ?? []).map((entry) => ({
      publishedAt: entry.published_at ?? null,
      publishedBy: text(entry.published_by) || "admin",
      version: numberValue(entry.version, 0),
    })),
  };
}

export async function fetchFooterCmsState(signal?: AbortSignal) {
  const response = await fetch(MANAGE_FOOTER_CMS_ENDPOINT, { cache: "no-store", headers: adminAuthHeaders(), signal });
  return stateFromPayload(await parseResponse(response));
}

export async function saveFooterCmsDraft(config: FooterCmsConfig) {
  const response = await fetch(MANAGE_FOOTER_CMS_ENDPOINT, {
    body: JSON.stringify({ config: apiConfig(config) }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "PUT",
  });
  return stateFromPayload(await parseResponse(response));
}

export async function publishFooterCms(config: FooterCmsConfig) {
  const response = await fetch(MANAGE_FOOTER_CMS_ENDPOINT, {
    body: JSON.stringify({ action: "publish", config: apiConfig(config) }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  return stateFromPayload(await parseResponse(response));
}

export async function restoreFooterCmsDraft(version: number) {
  const response = await fetch(MANAGE_FOOTER_CMS_ENDPOINT, {
    body: JSON.stringify({ action: "restore_draft", version }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  return stateFromPayload(await parseResponse(response));
}
