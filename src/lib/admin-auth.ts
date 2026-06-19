const ADMIN_TOKEN_STORAGE_KEY = "brandnbeauty_admin_token";

export function getAdminToken() {
  if (typeof window === "undefined") return "";

  return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || "";
}

export function adminAuthHeaders(
  headers: Record<string, string> = {},
): Record<string, string> {
  const token = getAdminToken();

  return token
    ? {
        ...headers,
        Authorization: `Bearer ${token}`,
        "X-Admin-Token": token,
      }
    : headers;
}
