import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicEnv } from "./env";

// Server Components / route guards use this anon-key client for auth cookies.
// Service-role access stays isolated in admin.ts.
export async function createSupabaseServerClient() {
  const { anonKey, url } = getSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies; middleware will
          // handle session refresh writes once route protection is connected.
        }
      },
    },
  });
}
