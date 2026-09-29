import { NextRequest, NextResponse } from "next/server";

import { serverAdminAuthHeaders } from "@/lib/admin-auth-server";

const backendBase =
  process.env.BNB_BACKEND_API_BASE?.replace(/\/+$/, "") ||
  "https://api.brandnbeauty.com/php";

async function adminSessionHeaders() {
  const headers = await serverAdminAuthHeaders();

  if (!headers.Authorization && !headers["X-Admin-Token"]) {
    return null;
  }

  return headers;
}

async function backendFetch(
  path: string,
  adminHeaders: Record<string, string>,
  init?: RequestInit,
) {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  for (const [key, value] of Object.entries(adminHeaders)) {
    headers.set(key, value);
  }

  return fetch(`${backendBase}/${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function GET() {
  const adminHeaders = await adminSessionHeaders();

  if (!adminHeaders) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  try {
    const [statusRes, queueRes] = await Promise.all([
      backendFetch("get_messenger_bot_phase17_status.php", adminHeaders),
      backendFetch(
        "messenger_bot_reply_review_api.php?limit=50",
        adminHeaders,
      ),
    ]);

    const status = await statusRes.json();
    const queue = await queueRes.json();

    return NextResponse.json(
      { success: statusRes.ok && queueRes.ok, status, queue },
      { status: statusRes.ok && queueRes.ok ? 200 : 502 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "AI Commerce control unavailable.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const adminHeaders = await adminSessionHeaders();

  if (!adminHeaders) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const response = await backendFetch(
      "messenger_bot_reply_review_api.php",
      adminHeaders,
      {
        method: "POST",
        body: JSON.stringify({ ...body, confirmed: true }),
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "AI Commerce action failed.",
      },
      { status: 500 },
    );
  }
}