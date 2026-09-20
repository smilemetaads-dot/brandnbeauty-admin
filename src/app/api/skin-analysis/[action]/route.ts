import { NextRequest, NextResponse } from "next/server";

const BACKEND =
  process.env.BNB_BACKEND_SERVER_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost/BrandnBeauty/brandnbeauty-backend";

const endpoints: Record<string, { file: string; method: "GET" | "POST" }> = {
  metrics: { file: "metrics.php", method: "GET" },
  settings: { file: "get_settings.php", method: "GET" },
  update: { file: "update_settings.php", method: "POST" },
};

function resolveToken(request: NextRequest) {
  const headerToken = request.headers.get("x-admin-token");
  if (headerToken) return headerToken;

  const authorization = request.headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return request.cookies.get("brandnbeauty_admin_token")?.value || "";
}

async function forward(
  request: NextRequest,
  action: string,
  method: "GET" | "POST",
) {
  const target = endpoints[action];
  if (!target || target.method !== method) {
    return NextResponse.json({ error: "unsupported_action" }, { status: 404 });
  }

  const token = resolveToken(request);
  if (!token) {
    return NextResponse.json({ error: "admin_token_missing" }, { status: 401 });
  }

  const base = BACKEND.replace(/\/+$/, "");
  const url = new URL(`${base}/php/skin-analysis/admin/${target.file}`);

  if (action === "metrics") {
    const range = request.nextUrl.searchParams.get("range");
    if (range) url.searchParams.set("range", range);
  }

  const headers: HeadersInit = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    "X-Admin-Token": token,
  };

  let body: string | undefined;
  if (method === "POST") {
    headers["Content-Type"] = "application/json";
    body = await request.text();
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
      cache: "no-store",
    });

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: {
        "content-type":
          response.headers.get("content-type") || "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "skin_analysis_backend_unreachable" },
      { status: 502 },
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ action: string }> },
) {
  const { action } = await context.params;
  return forward(request, action, "GET");
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ action: string }> },
) {
  const { action } = await context.params;
  return forward(request, action, "POST");
}
