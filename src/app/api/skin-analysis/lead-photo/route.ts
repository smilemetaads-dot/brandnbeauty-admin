import { NextRequest, NextResponse } from "next/server";

function backendBase() {
  return (
    process.env.NEXT_PUBLIC_BNB_API_BASE_URL ||
    "http://localhost/BrandnBeauty/brandnbeauty-backend/php"
  ).replace(/\/+$/, "");
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "";
  const angle = request.nextUrl.searchParams.get("angle") || "front";
  const token = request.headers.get("x-admin-token") || "";

  const response = await fetch(
    `${backendBase()}/skin-analysis/admin/photo_preview.php?id=${encodeURIComponent(id)}&angle=${encodeURIComponent(angle)}`,
    {
      cache: "no-store",
      headers: token ? { "x-admin-token": token } : {},
    },
  );

  if (!response.ok) {
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") || "application/json" },
    });
  }

  const buffer = await response.arrayBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "content-type": response.headers.get("content-type") || "image/jpeg",
      "cache-control": "no-store, private, max-age=0",
    },
  });
}
