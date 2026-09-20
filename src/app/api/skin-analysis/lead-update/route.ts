import { NextRequest, NextResponse } from "next/server";

function backendBase() {
  return (
    process.env.NEXT_PUBLIC_BNB_API_BASE_URL ||
    "http://localhost/BrandnBeauty/brandnbeauty-backend/php"
  ).replace(/\/+$/, "");
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-admin-token") || "";
  const payload = await request.text();

  const response = await fetch(
    `${backendBase()}/skin-analysis/admin/update_handoff.php`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        ...(token ? { "x-admin-token": token } : {}),
      },
      body: payload,
    },
  );

  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") || "application/json" },
  });
}
