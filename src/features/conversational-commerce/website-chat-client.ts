import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type WebsiteChatSession = {
  id: string;
  customer_name: string;
  contact_mask: string;
  status: "open" | "waiting_customer" | "resolved" | "closed";
  assigned_to: string;
  unread_count: number;
  latest_message: string;
  updated_at: string;
};
export type WebsiteChatMessage = {
  id: string;
  sender: "customer" | "admin" | "system";
  body: string;
  author_label: string;
  created_at: string;
};
export type WebsiteChatAdminState = {
  summary: { total: number; open: number; waiting_customer: number; unread: number };
  sessions: WebsiteChatSession[];
  selected_session: WebsiteChatSession | null;
  messages: WebsiteChatMessage[];
};

const endpoint = bnbApiUrl("manage_website_chat.php");

async function request(path = "", body?: Record<string, unknown>, signal?: AbortSignal): Promise<WebsiteChatAdminState> {
  const response = await fetch(`${endpoint}${path}`, body ? {
    body: JSON.stringify(body),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
    signal,
  } : { cache: "no-store", headers: adminAuthHeaders(), signal });
  const data = await response.json().catch(() => ({})) as WebsiteChatAdminState & { message?: string; success?: boolean };
  if (!response.ok || data.success === false) throw new Error(data.message || "Website chat inbox is temporarily unavailable.");
  return data;
}

export const loadWebsiteChat = (sessionId = "", signal?: AbortSignal) => request(sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "", undefined, signal);
export const markWebsiteChatRead = (sessionId: string) => request("", { action: "mark_read", session_id: sessionId });
export const replyWebsiteChat = (input: Record<string, unknown>) => request("", { action: "reply", confirmed: true, ...input });
export const setWebsiteChatStatus = (input: Record<string, unknown>) => request("", { action: "set_status", confirmed: true, ...input });
