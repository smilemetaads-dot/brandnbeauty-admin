import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type OwnerAttention = {
  key: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  detail: string;
  href: string;
};

export type OwnerCommandCenterData = {
  health: {
    orders: {
      available: boolean;
      today_orders: number | null;
      confirmed_sales: number | null;
      pipeline: Record<string, number> | null;
      message?: string | null;
    };
    inventory: {
      available: boolean;
      low_stock: number | null;
      out_of_stock: number | null;
      total_products: number | null;
    };
    exceptions: {
      pending_approvals: number | null;
      open_tasks: number | null;
      open_alerts: number | null;
      critical_alerts: number | null;
      high_alerts: number | null;
    };
    integrations: {
      available: boolean;
      active: number | null;
      issues: number | null;
      not_configured: number | null;
    };
    foundation: Record<string, boolean>;
  };
  needs_attention: OwnerAttention[];
  availability_notes: Record<string, string>;
  principles: {
    real_data_only: boolean;
    missing_data_label: string;
    ai_source_of_truth: boolean;
    management_source_of_truth: boolean;
    owner_mode: string;
  };
  generated_at: string;
};

export async function loadOwnerCommandCenter(): Promise<OwnerCommandCenterData> {
  const response = await fetch(bnbApiUrl("get_owner_command_center.php"), {
    cache: "no-store",
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
  });
  const payload = await response.json().catch(() => ({})) as OwnerCommandCenterData & { success?: boolean; message?: string };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Owner Command Center is unavailable.");
  return payload;
}
