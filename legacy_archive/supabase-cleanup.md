# Archived Supabase Helpers

Archived in Batch 12F.

These inactive helper files were removed from `src` because they were not
imported by active routes:

- `src/app/api/health/supabase/route.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/env.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/supabase/server.ts`

The active admin runtime now uses PHP/MySQL endpoints.

`src/lib/supabase/admin.ts` remains intentionally because some legacy/future
modules still import its disabled adapter. Removing it would break the current
build before those modules are rewritten to PHP/MySQL or fully archived.
