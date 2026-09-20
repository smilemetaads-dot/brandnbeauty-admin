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

export function bnbApiAssetUrl(
  path: string | null | undefined,
  fallback?: string,
) {
  if (!path) return fallback;
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
