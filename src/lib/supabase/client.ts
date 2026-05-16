import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "./env";

export function createBrowserSupabaseClient() {
  const { url, anonKey } = getSupabasePublicEnv();

  return createClient(url, anonKey);
}
