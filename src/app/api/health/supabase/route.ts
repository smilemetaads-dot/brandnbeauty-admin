import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Supabase connection check failed." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, supabase: "connected" });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Supabase connection check failed." },
      { status: 500 },
    );
  }
}
