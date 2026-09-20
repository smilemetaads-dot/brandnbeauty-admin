import "server-only";

import { cookies } from "next/headers";

const ADMIN_TOKEN_COOKIE = "brandnbeauty_admin_token";

export async function serverAdminAuthHeaders(): Promise<Record<string, string>> {
  const token = (await cookies()).get(ADMIN_TOKEN_COOKIE)?.value ?? "";

  return token
    ? {
        Authorization: `Bearer ${token}`,
        "X-Admin-Token": token,
      }
    : {};
}
