import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type OwnerException = {
  kind: "alert" | "approval" | "task" | "integration";
  ref: string;
  title: string;
  detail: string;
  severity: "critical" | "high" | "medium" | "low";
  status: string;
  owner: string;
  created_at: string;
  actionable: boolean;
  approval_id: number | null;
  risk_reason?: string;
  entity_ref?: string;
  domain?: string;
};

export type OwnerExceptionFeed = {
  summary: {
    critical: number;
    high: number;
    approvals: number;
    alerts: number;
    tasks: number;
    integration_issues: number;
  };
  items: OwnerException[];
  generated_at: string;
};

export async function loadOwnerExceptionFeed(): Promise<OwnerExceptionFeed> {
  const response = await fetch(bnbApiUrl("get_owner_exception_feed.php"), {
    cache: "no-store",
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
  });
  const payload = await response.json().catch(() => ({})) as {
    success?: boolean;
    message?: string;
    summary?: OwnerExceptionFeed["summary"];
    items?: OwnerException[];
    generated_at?: string;
  };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Owner exception feed could not be loaded.");
  return {
    summary: payload.summary ?? { critical: 0, high: 0, approvals: 0, alerts: 0, tasks: 0, integration_issues: 0 },
    items: Array.isArray(payload.items) ? payload.items : [],
    generated_at: payload.generated_at ?? "",
  };
}

export async function reviewBusinessOsApproval(
  approvalId: number,
  decision: "approved" | "rejected",
  decisionNote: string,
) {
  const response = await fetch(bnbApiUrl("manage_business_os_approval.php"), {
    method: "POST",
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      approval_id: approvalId,
      decision,
      decision_note: decisionNote,
    }),
  });
  const payload = await response.json().catch(() => ({})) as { success?: boolean; message?: string };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Approval decision failed.");
  return payload.message ?? "Decision recorded.";
}
