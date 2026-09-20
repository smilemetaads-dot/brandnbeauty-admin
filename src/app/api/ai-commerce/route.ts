import { NextRequest, NextResponse } from "next/server";

import { serverAdminAuthHeaders } from "@/lib/admin-auth-server";

const backendBase =
  process.env.BNB_BACKEND_API_BASE?.replace(/\/+$/, "") ||
  "https://api.brandnbeauty.com/php";
const controlKey = process.env.BNB_BOT_CONTROL_KEY || "";

async function requireAdminSession() {
  const headers = await serverAdminAuthHeaders();
  return Boolean(headers.Authorization || headers["X-Admin-Token"]);
}

async function backendFetch(path: string, init?: RequestInit) {
  if (!controlKey) throw new Error("AI_COMMERCE_CONTROL_KEY_MISSING");

  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  headers.set("X-Bot-Control-Key", controlKey);

  return fetch(`${backendBase}/${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const [statusRes, queueRes] = await Promise.all([
      backendFetch("get_messenger_bot_phase17_status.php"),
      backendFetch("messenger_bot_reply_review_api.php?limit=50"),
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
        error: error instanceof Error ? error.message : "AI Commerce control unavailable.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const response = await backendFetch("messenger_bot_reply_review_api.php", {
      method: "POST",
      body: JSON.stringify({ ...body, confirmed: true }),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "AI Commerce action failed.",
      },
      { status: 500 },
    );
  }
}
