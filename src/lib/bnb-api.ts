import { resolveLegacyMediaUrl } from "./legacy-media-map";

const LOCAL_BNB_API_BASE_URL =
  "http://localhost/BrandnBeauty/brandnbeauty-backend/php";
const PRODUCTION_BNB_API_BASE_URL = "https://api.brandnbeauty.com/php";

function normalizeBnbApiBaseUrl(value: string) {
  const clean = value.trim().replace(/\/+$/, "");
  return clean.endsWith("/php") ? clean : `${clean}/php`;
}

function runtimeDefaultBnbApiBaseUrl() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") {
      return LOCAL_BNB_API_BASE_URL;
    }
  }
  return PRODUCTION_BNB_API_BASE_URL;
}

export function getBnbApiBaseUrl() {
  const configured =
    process.env.NEXT_PUBLIC_BNB_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim();

  return normalizeBnbApiBaseUrl(
    configured || runtimeDefaultBnbApiBaseUrl(),
  );
}

export function bnbApiUrl(endpoint: string) {
  return `${getBnbApiBaseUrl()}/${endpoint.replace(/^\/+/, "")}`;
}

export type BnbApiRuntime = {
  baseUrl: string;
  local: boolean;
  secure: boolean;
  source: "environment" | "production_fallback" | "local_fallback";
};

export function getBnbApiRuntime(): BnbApiRuntime {
  const baseUrl = getBnbApiBaseUrl();
  let local = false;
  let secure = false;
  try {
    const parsed = new URL(baseUrl);
    local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    secure = parsed.protocol === "https:";
  } catch {}

  const configured =
    process.env.NEXT_PUBLIC_BNB_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim();

  return {
    baseUrl,
    local,
    secure,
    source: configured
      ? "environment"
      : local
        ? "local_fallback"
        : "production_fallback",
  };
}

const LEGACY_BACKEND_PATH_PREFIX = "/BrandnBeauty/brandnbeauty-backend";

function normalizeBackendAssetPath(pathname: string) {
  if (
    pathname === `${LEGACY_BACKEND_PATH_PREFIX}/php` ||
    pathname === `${LEGACY_BACKEND_PATH_PREFIX}/uploads`
  ) {
    return pathname.slice(LEGACY_BACKEND_PATH_PREFIX.length);
  }

  if (
    pathname.startsWith(`${LEGACY_BACKEND_PATH_PREFIX}/php/`) ||
    pathname.startsWith(`${LEGACY_BACKEND_PATH_PREFIX}/uploads/`)
  ) {
    return pathname.slice(LEGACY_BACKEND_PATH_PREFIX.length);
  }

  return pathname;
}

function normalizeAbsoluteBnbAssetUrl(value: string) {
  try {
    const parsed = new URL(value);
    const apiBase = new URL(getBnbApiBaseUrl());
    const hostname = parsed.hostname.toLowerCase();
    const normalizedPath = normalizeBackendAssetPath(parsed.pathname);
    const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(hostname);
    const isApiHost = hostname === apiBase.hostname.toLowerCase();

    if (!isLocalHost && !isApiHost && normalizedPath === parsed.pathname) {
      return value;
    }

    return `${apiBase.origin}${normalizedPath}${parsed.search}${parsed.hash}`;
  } catch {
    return value;
  }
}

export function bnbApiAssetUrl(
  path: string | null | undefined,
  fallback?: string | null,
) {
  if (!path) return fallback ?? null;
  const mapped = resolveLegacyMediaUrl(path);
  if (mapped) return mapped;
  if (/^https?:\/\//i.test(path)) return normalizeAbsoluteBnbAssetUrl(path);

  try {
    const apiBase = new URL(getBnbApiBaseUrl());
    const normalizedPath = normalizeBackendAssetPath(path);

    if (normalizedPath === "/php" || normalizedPath.startsWith("/php/")) {
      return `${apiBase.origin}${normalizedPath}`;
    }

    if (path.startsWith("/uploads/")) {
      return `${apiBase.origin}${path}`;
    }

    if (path.startsWith("/BrandnBeauty/")) {
      return `${apiBase.origin}${path}`;
    }
  } catch {
    return fallback ?? null;
  }

  if (path.startsWith("/")) return path;
  return bnbApiUrl(path);
}