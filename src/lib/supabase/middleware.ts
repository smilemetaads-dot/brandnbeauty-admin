import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabasePublicEnv } from "./env";

// Future Next middleware session checks use this anon-key client.
// This helper only wires cookies; it does not enforce route protection.
export function createSupabaseMiddlewareClient(request: NextRequest) {
  const { anonKey, url } = getSupabasePublicEnv();
  const response = NextResponse.next({
    request,
  });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, options, value }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  return { response, supabase };
}
