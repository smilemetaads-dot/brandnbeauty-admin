import { NextRequest, NextResponse } from "next/server";

import { serverAdminAuthHeaders } from "@/lib/admin-auth-server";

const backendBase =
  process.env.BNB_BACKEND_API_BASE?.replace(/\/+$/, "") ||
  "https://api.brandnbeauty.com/php";
const controlKey = process.env.BNB_BOT_CONTROL_KEY || "";
const REQUEST_TIMEOUT_MS = 10_000;

async function requireAdminSession() {
  const headers = await serverAdminAuthHeaders();
  return Boolean(headers.Authorization || headers["X-Admin-Token"]);
}

async function backendFetch(path: string, init?: RequestInit) {
  if (!controlKey) throw new Error("AI_COMMERCE_CONTROL_KEY_MISSING");

  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  headers.set("X-Bot-Control-Key", controlKey);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(`${backendBase}/${path}`, {
      ...init,
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function readJsonResponse(response: Response, label: string) {
  const text = await response.text();
  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${label}_INVALID_JSON_HTTP_${response.status}`);
  }

  if (!response.ok) {
    const object = data && typeof data === "object" ? data as Record<string, unknown> : {};
    const message =
      (typeof object.message === "string" && object.message) ||
      (typeof object.error === "string" && object.error) ||
      `HTTP_${response.status}`;
    throw new Error(`${label}_${message}`);
  }

  return data;
}

export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json(
      { success: false, error: "ADMIN_SESSION_REQUIRED" },
      { status: 401 },
    );
  }

  try {
    const statusResponse = await backendFetch("get_messenger_bot_phase17_status.php");
    const status = await readJsonResponse(statusResponse, "STATUS");

    const queueResponse = await backendFetch(
      "messenger_bot_reply_review_api.php?limit=50",
    );
    const queue = await readJsonResponse(queueResponse, "QUEUE");

    return NextResponse.json({
      success: true,
      status,
      queue,
      diagnostics: {
        backend_origin: new URL(backendBase).origin,
        status_http: statusResponse.status,
        queue_http: queueResponse.status,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? "BACKEND_REQUEST_TIMEOUT"
          : error.message
        : "AI_COMMERCE_CONTROL_UNAVAILABLE";

    return NextResponse.json(
      {
        success: false,
        error: message,
        diagnostics: {
          backend_origin: (() => {
            try {
              return new URL(backendBase).origin;
            } catch {
              return "INVALID_BACKEND_BASE";
            }
          })(),
          control_key_configured: Boolean(controlKey),
        },
      },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdminSession())) {
    return NextResponse.json(
      { success: false, error: "ADMIN_SESSION_REQUIRED" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const response = await backendFetch("messenger_bot_reply_review_api.php", {
      method: "POST",
      body: JSON.stringify({ ...body, confirmed: true }),
    });
    const data = await readJsonResponse(response, "ACTION");
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? "BACKEND_REQUEST_TIMEOUT"
          : error.message
        : "AI_COMMERCE_ACTION_FAILED";

    return NextResponse.json(
      { success: false, error: message },
      { status: 502 },
    );
  }
}
