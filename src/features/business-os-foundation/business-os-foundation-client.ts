import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type Raw = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value : "";
const num = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const nullableNum = (value: unknown) => value === null || value === undefined ? null : num(value);

export type FoundationItem = {
  key: string;
  name: string;
  status: string;
  tables: Record<string, boolean>;
};

export type SourceTruth = {
  domain: string;
  owner: string;
  rule: string;
};

export type FeatureFlag = {
  id: number;
  flagKey: string;
  domainName: string;
  lifecycle: "disabled" | "preview" | "enabled";
  riskLevel: string;
  requiresApproval: boolean;
  description: string;
  ownerName: string;
  rolloutNote: string;
  version: number;
  updatedAt: string;
};

export type ActionBoundary = {
  actionKey: string;
  domainName: string;
  actionLabel: string;
  actionKind: "read" | "draft" | "execute";
  executionMode: "read_only" | "draft_only" | "human_approval" | "manual_only" | "blocked";
  riskLevel: string;
  featureFlagKey: string;
  requiredPermission: string;
  aiAllowed: boolean;
  humanApprovalRequired: boolean;
  downstreamAutoExecute: boolean;
  description: string;
  version: number;
  updatedAt: string;
};

export type BusinessOsFoundationState = {
  summary: {
    pendingApprovals: number | null;
    openTasks: number | null;
    openAlerts: number | null;
    activeRules: number | null;
    activeWorkflows: number | null;
    activeRoles: number | null;
    activeIntegrations: number | null;
    featureFlagsEnabled: number | null;
    featureFlagsPreview: number | null;
  };
  registry: FoundationItem[];
  sourceOfTruth: SourceTruth[];
  featureFlags: FeatureFlag[];
  actionBoundary: ActionBoundary[];
  queues: {
    approvals: Raw[];
    alerts: Raw[];
    tasks: Raw[];
  };
  architecture: {
    flow: string[];
    aiSourceOfTruth: boolean;
    defaultAiWriteMode: string;
    highRiskActions: string;
  };
  generatedAt: string;
};

function normalize(payload: Raw): BusinessOsFoundationState {
  const summary = (payload.summary ?? {}) as Raw;
  const architecture = (payload.architecture ?? {}) as Raw;

  return {
    summary: {
      pendingApprovals: nullableNum(summary.pending_approvals),
      openTasks: nullableNum(summary.open_tasks),
      openAlerts: nullableNum(summary.open_alerts),
      activeRules: nullableNum(summary.active_rules),
      activeWorkflows: nullableNum(summary.active_workflows),
      activeRoles: nullableNum(summary.active_roles),
      activeIntegrations: nullableNum(summary.active_integrations),
      featureFlagsEnabled: nullableNum(summary.feature_flags_enabled),
      featureFlagsPreview: nullableNum(summary.feature_flags_preview),
    },
    registry: ((payload.registry ?? []) as Raw[]).map((item) => ({
      key: text(item.key),
      name: text(item.name),
      status: text(item.status),
      tables: ((item.tables ?? {}) as Record<string, unknown>)
        ? Object.fromEntries(Object.entries((item.tables ?? {}) as Record<string, unknown>).map(([key,value]) => [key, Boolean(value)]))
        : {},
    })),
    sourceOfTruth: ((payload.source_of_truth ?? []) as Raw[]).map((item) => ({
      domain: text(item.domain),
      owner: text(item.owner),
      rule: text(item.rule),
    })),
    featureFlags: ((payload.feature_flags ?? []) as Raw[]).map((item) => ({
      id: num(item.id),
      flagKey: text(item.flag_key),
      domainName: text(item.domain_name),
      lifecycle: (["disabled","preview","enabled"].includes(text(item.lifecycle)) ? text(item.lifecycle) : "disabled") as FeatureFlag["lifecycle"],
      riskLevel: text(item.risk_level),
      requiresApproval: Boolean(num(item.requires_approval)),
      description: text(item.description),
      ownerName: text(item.owner_name),
      rolloutNote: text(item.rollout_note),
      version: num(item.version),
      updatedAt: text(item.updated_at),
    })),
    actionBoundary: ((payload.action_boundary ?? []) as Raw[]).map((item) => ({
      actionKey: text(item.action_key),
      domainName: text(item.domain_name),
      actionLabel: text(item.action_label),
      actionKind: (["read","draft","execute"].includes(text(item.action_kind)) ? text(item.action_kind) : "read") as ActionBoundary["actionKind"],
      executionMode: (["read_only","draft_only","human_approval","manual_only","blocked"].includes(text(item.execution_mode)) ? text(item.execution_mode) : "blocked") as ActionBoundary["executionMode"],
      riskLevel: text(item.risk_level),
      featureFlagKey: text(item.feature_flag_key),
      requiredPermission: text(item.required_permission),
      aiAllowed: Boolean(num(item.ai_allowed)),
      humanApprovalRequired: Boolean(num(item.human_approval_required)),
      downstreamAutoExecute: Boolean(num(item.downstream_auto_execute)),
      description: text(item.description),
      version: num(item.version),
      updatedAt: text(item.updated_at),
    })),    queues: {
      approvals: (payload.queues as Raw | undefined)?.approvals as Raw[] ?? [],
      alerts: (payload.queues as Raw | undefined)?.alerts as Raw[] ?? [],
      tasks: (payload.queues as Raw | undefined)?.tasks as Raw[] ?? [],
    },
    architecture: {
      flow: Array.isArray(architecture.flow) ? architecture.flow.map(text) : [],
      aiSourceOfTruth: Boolean(architecture.ai_source_of_truth),
      defaultAiWriteMode: text(architecture.default_ai_write_mode),
      highRiskActions: text(architecture.high_risk_actions),
    },
    generatedAt: text(payload.generated_at),
  };
}

export async function loadBusinessOsFoundation() {
  const response = await fetch(bnbApiUrl("get_business_os_foundation.php"), {
    cache: "no-store",
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
  });
  const payload = await response.json().catch(() => ({})) as Raw & { success?: boolean; message?: string };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Business OS foundation could not be loaded.");
  return normalize(payload);
}

export async function changeBusinessOsFeatureFlag(
  flagKey: string,
  lifecycle: FeatureFlag["lifecycle"],
  reason: string,
  confirmed = false,
) {
  const response = await fetch(bnbApiUrl("manage_business_os_foundation.php"), {
    method: "POST",
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      action: "change_feature_flag",
      flag_key: flagKey,
      lifecycle,
      reason,
      confirmed,
    }),
  });
  const payload = await response.json().catch(() => ({})) as { success?: boolean; message?: string };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Feature flag change failed.");
  return payload.message ?? "Feature flag saved.";
}
