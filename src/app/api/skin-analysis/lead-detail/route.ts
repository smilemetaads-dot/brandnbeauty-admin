import { NextRequest, NextResponse } from "next/server";

function backendBase() {
  return (
    process.env.NEXT_PUBLIC_BNB_API_BASE_URL ||
    "http://localhost/BrandnBeauty/brandnbeauty-backend/php"
  ).replace(/\/+$/, "");
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "";
  const token = request.headers.get("x-admin-token") || "";

  const response = await fetch(
    `${backendBase()}/skin-analysis/admin/lead_detail.php?id=${encodeURIComponent(id)}`,
    {
      cache: "no-store",
      headers: token ? { "x-admin-token": token } : {},
    },
  );

  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") || "application/json" },
  });
}
