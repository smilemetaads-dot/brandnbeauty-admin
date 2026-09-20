const DEFAULT_BNB_API_BASE_URL =
  "http://localhost/BrandnBeauty/brandnbeauty-backend/php";

export function getBnbApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BNB_API_BASE_URL?.trim() ||
    DEFAULT_BNB_API_BASE_URL
  ).replace(/\/+$/, "");
}

export function bnbApiUrl(endpoint: string) {
  return `${getBnbApiBaseUrl()}/${endpoint.replace(/^\/+/, "")}`;
}

export type BnbApiRuntime = {
  baseUrl: string;
  local: boolean;
  secure: boolean;
  source: "environment" | "local_fallback";
};

export function getBnbApiRuntime(): BnbApiRuntime {
  const baseUrl = getBnbApiBaseUrl();
  let local = false;
  let secure = false;

  try {
    const parsed = new URL(baseUrl);
    local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    secure = parsed.protocol === "https:";
  } catch {
    // The readiness screen reports malformed public configuration without exposing secrets.
  }

  return {
    baseUrl,
    local,
    secure,
    source: process.env.NEXT_PUBLIC_BNB_API_BASE_URL?.trim()
      ? "environment"
      : "local_fallback",
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
      return `http://localhost${path}`;
    }
  }

  return bnbApiUrl(path);
}
