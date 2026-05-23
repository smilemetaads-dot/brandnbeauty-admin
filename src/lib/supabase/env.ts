const missingEnvError = (name: string) =>
  new Error(`Missing required environment variable: ${name}`);

export function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw missingEnvError(name);
  }

  return value;
}

export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw missingEnvError("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!anonKey) {
    throw missingEnvError("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return {
    url,
    anonKey,
  };
}

export function getSupabaseAdminEnv() {
  return {
    url: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    serviceRoleKey: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}
