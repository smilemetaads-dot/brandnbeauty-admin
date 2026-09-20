import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type HeaderNavChild = {
  id: string;
  label: string;
  link: string;
};

export type HeaderNavItem = {
  children: HeaderNavChild[];
  id: string;
  kind: "collection" | "direct" | "mega";
  label: string;
  link: string;
  sortOrder: number;
  status: "active" | "draft" | "hidden";
};

export type HeaderNavigationConfig = {
  announcement: {
    enabled: boolean;
    link: string;
    text: string;
  };
  items: HeaderNavItem[];
  mobileShortcuts: string[];
  settings: {
    account: boolean;
    cart: boolean;
    language: boolean;
    search: boolean;
    sticky: boolean;
    wishlist: boolean;
  };
};

export type HeaderNavigationVersion = {
  publishedAt: string | null;
  publishedBy: string;
  version: number;
};

export type HeaderNavigationState = {
  draft: HeaderNavigationConfig;
  live: HeaderNavigationConfig;
  publishedAt: string | null;
  updatedAt: string | null;
  version: number;
  versions: HeaderNavigationVersion[];
};

type ApiChild = { id?: string; label?: string; link?: string };
type ApiItem = {
  children?: ApiChild[];
  id?: string;
  kind?: string;
  label?: string;
  link?: string;
  sort_order?: number | string;
  status?: string;
};
type ApiConfig = {
  announcement?: { enabled?: boolean | number | string; link?: string; text?: string };
  items?: ApiItem[];
  mobile_shortcuts?: string[];
  settings?: Record<string, boolean | number | string | undefined>;
};
type ApiVersion = {
  published_at?: string | null;
  published_by?: string;
  version?: number | string;
};
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

export const MANAGE_HEADER_NAVIGATION_ENDPOINT = bnbApiUrl("manage_header_navigation.php");
export const PUBLIC_HEADER_NAVIGATION_ENDPOINT = bnbApiUrl("get_header_navigation.php");

export const defaultHeaderNavigationConfig: HeaderNavigationConfig = {
  announcement: { enabled: false, link: "/", text: "" },
  items: [],
  mobileShortcuts: ["Home", "Search", "Wishlist", "Bag"],
  settings: { account: true, cart: true, language: false, search: true, sticky: true, wishlist: true },
};

function bool(value: boolean | number | string | null | undefined) {
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "active"].includes(String(value ?? "").toLowerCase());
}

function numberValue(value: number | string | null | undefined, fallback: number) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function text(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function normalizeConfig(config: ApiConfig | null | undefined): HeaderNavigationConfig {
  const rawSettings = config?.settings ?? {};
  return {
    announcement: {
      enabled: bool(config?.announcement?.enabled),
      link: text(config?.announcement?.link) || "/",
      text: text(config?.announcement?.text),
    },
    items: (config?.items ?? []).map((item, index) => {
      const rawKind = text(item.kind).toLowerCase();
      const kind: HeaderNavItem["kind"] = rawKind === "mega" || rawKind === "collection" ? rawKind : "direct";
      const rawStatus = text(item.status).toLowerCase();
      const status: HeaderNavItem["status"] = rawStatus === "active" || rawStatus === "hidden" ? rawStatus : "draft";
      return {
        children: (item.children ?? []).map((child, childIndex) => ({
          id: text(child.id) || `child-${index + 1}-${childIndex + 1}`,
          label: text(child.label),
          link: text(child.link) || "/",
        })),
        id: text(item.id) || `NAV-${String(index + 1).padStart(2, "0")}`,
        kind,
        label: text(item.label) || "Menu item",
        link: text(item.link) || "/",
        sortOrder: numberValue(item.sort_order, index + 1),
        status,
      };
    }).toSorted((left, right) => left.sortOrder - right.sortOrder),
    mobileShortcuts: (config?.mobile_shortcuts ?? []).map((shortcut) => text(shortcut)).filter(Boolean).slice(0, 4),
    settings: {
      account: bool(rawSettings.account),
      cart: bool(rawSettings.cart),
      language: bool(rawSettings.language),
      search: bool(rawSettings.search),
      sticky: bool(rawSettings.sticky),
      wishlist: bool(rawSettings.wishlist),
    },
  };
}

function apiConfig(config: HeaderNavigationConfig): ApiConfig {
  return {
    announcement: { ...config.announcement },
    items: config.items.map((item, index) => ({
      children: item.children.map((child) => ({ ...child })),
      id: item.id,
      kind: item.kind,
      label: item.label,
      link: item.link,
      sort_order: index + 1,
      status: item.status,
    })),
    mobile_shortcuts: config.mobileShortcuts,
    settings: { ...config.settings },
  };
}

async function parseResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as ApiResponse | null;
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || "Header navigation request could not be completed.");
  }
  return payload;
}

function stateFromPayload(payload: ApiResponse): HeaderNavigationState {
  return {
    draft: normalizeConfig(payload.draft),
    live: normalizeConfig(payload.live),
    publishedAt: payload.published_at ?? null,
    updatedAt: payload.updated_at ?? null,
    version: numberValue(payload.version, 1),
    versions: (payload.versions ?? []).map((version) => ({
      publishedAt: version.published_at ?? null,
      publishedBy: text(version.published_by) || "admin",
      version: numberValue(version.version, 0),
    })),
  };
}

export async function fetchHeaderNavigationState(signal?: AbortSignal) {
  const response = await fetch(MANAGE_HEADER_NAVIGATION_ENDPOINT, {
    cache: "no-store",
    headers: adminAuthHeaders(),
    signal,
  });
  return stateFromPayload(await parseResponse(response));
}

export async function saveHeaderNavigationDraft(config: HeaderNavigationConfig) {
  const response = await fetch(MANAGE_HEADER_NAVIGATION_ENDPOINT, {
    body: JSON.stringify({ config: apiConfig(config) }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "PUT",
  });
  return stateFromPayload(await parseResponse(response));
}

export async function publishHeaderNavigation(config: HeaderNavigationConfig) {
  const response = await fetch(MANAGE_HEADER_NAVIGATION_ENDPOINT, {
    body: JSON.stringify({ action: "publish", config: apiConfig(config) }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  return stateFromPayload(await parseResponse(response));
}

export async function restoreHeaderNavigationDraft(version: number) {
  const response = await fetch(MANAGE_HEADER_NAVIGATION_ENDPOINT, {
    body: JSON.stringify({ action: "restore_draft", version }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  return stateFromPayload(await parseResponse(response));
}
