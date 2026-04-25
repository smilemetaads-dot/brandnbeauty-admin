import "server-only";

import { createClient } from "@supabase/supabase-js";

function getSupabaseAdminConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return { supabaseUrl, serviceRoleKey };
}

export function getSupabaseAdminDiagnostics() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasServiceRoleKey: Boolean(serviceRoleKey),
    serviceRoleKeyLength: serviceRoleKey?.length ?? 0,
    serviceRoleKeyLooksPublishable:
      serviceRoleKey?.startsWith("sb_publishable_") ?? false,
    serviceRoleKeyLooksSecret: serviceRoleKey?.startsWith("sb_secret_") ?? false,
    serviceRoleKeyLooksJwt:
      serviceRoleKey?.startsWith("eyJ") && serviceRoleKey.includes("."),
  };
}

export function createSupabaseAdminClient() {
  const config = getSupabaseAdminConfig();

  if (!config) {
    return null;
  }

  return createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: "public",
    },
  });
}
