import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: "disabled",
    message: "Legacy health check is disabled. Admin runtime now uses PHP/MySQL.",
  });
}
