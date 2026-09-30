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

export function bnbApiAssetUrl(
  path: string | null | undefined,
  fallback?: string | null,
) {
  if (!path) return fallback ?? null;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/BrandnBeauty/")) {
    try {
      return `${new URL(getBnbApiBaseUrl()).origin}${path}`;
    } catch {
      return fallback ?? null;
    }
  }
  return bnbApiUrl(path);
}