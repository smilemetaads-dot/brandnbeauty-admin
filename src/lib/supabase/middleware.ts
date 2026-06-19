import { NextResponse, type NextRequest } from "next/server";

export function createSupabaseMiddlewareClient(request: NextRequest) {
  void request;

  return {
    response: NextResponse.next(),
    supabase: null,
  };
}
