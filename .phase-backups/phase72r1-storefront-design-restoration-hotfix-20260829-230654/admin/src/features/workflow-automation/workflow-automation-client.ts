import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export const MANAGE_WORKFLOW_AUTOMATION_ENDPOINT = "manage_workflow_automation.php";

type Raw = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const nullableText = (value: unknown) => text(value) || null;

export type Workflow = { actionType: string; conditionText: string; domain: string; failurePolicy: string; id: number; lastRunAt: string | null; name: string; ownerName: string; riskLevel: string; runCount: number; status: string; successCount: number; triggerType: string; version: number; waitingCount: number; workflowKey: string };
export type WorkflowRun = { attempt: number; createdAt: string | null; entityRef: string; finishedAt: string | null; id: number; isSimulation: boolean; startedAt: string | null; status: string; step: string; workflowName: string };
export type WorkflowApproval = { actionSummary: string; createdAt: string | null; decisionNote: string; entityRef: string; id: number; riskReason: string; reviewedAt: string | null; status: string; workflowName: string };
export type WorkflowDaily = { exceptions: number; runDate: string; runs: number; simulations: number; succeeded: number };
export type WorkflowAutomationState = {
  approvals: WorkflowApproval[];
  capabilities: { inventorySource: boolean; orderSource: boolean; trackingSource: boolean };
  daily: WorkflowDaily[];
  engine: { executionMode: string; lastScanAt: string | null; timezone: string };
  generatedAt: string | null;
  runs: WorkflowRun[];
  summary: { activeWorkflows: number; failedRuns: number; pendingApprovals: number; simulations: number; successRate: number; totalRuns: number };
  workflows: Workflow[];
};

function normalize(payload: Raw): WorkflowAutomationState {
  const engine = (payload.engine ?? {}) as Raw;
  const summary = (payload.summary ?? {}) as Raw;
  const capabilities = (payload.capabilities ?? {}) as Raw;
  return {
    approvals: ((payload.approvals ?? []) as Raw[]).map((item) => ({ actionSummary: text(item.action_summary), createdAt: nullableText(item.created_at), decisionNote: text(item.decision_note), entityRef: text(item.entity_ref), id: number(item.id), riskReason: text(item.risk_reason), reviewedAt: nullableText(item.reviewed_at), status: text(item.status), workflowName: text(item.workflow_name) })),
    capabilities: { inventorySource: Boolean(capabilities.inventory_source), orderSource: Boolean(capabilities.order_source), trackingSource: Boolean(capabilities.tracking_source) },
    daily: ((payload.daily ?? []) as Raw[]).map((item) => ({ exceptions: number(item.exceptions), runDate: text(item.run_date), runs: number(item.runs), simulations: number(item.simulations), succeeded: number(item.succeeded) })),
    engine: { executionMode: text(engine.execution_mode), lastScanAt: nullableText(engine.last_scan_at), timezone: text(engine.timezone) },
    generatedAt: nullableText(payload.generated_at),
    runs: ((payload.runs ?? []) as Raw[]).map((item) => ({ attempt: number(item.attempt), createdAt: nullableText(item.created_at), entityRef: text(item.entity_ref), finishedAt: nullableText(item.finished_at), id: number(item.id), isSimulation: Boolean(number(item.is_simulation)), startedAt: nullableText(item.started_at), status: text(item.status), step: text(item.step), workflowName: text(item.workflow_name) })),
    summary: { activeWorkflows: number(summary.active_workflows), failedRuns: number(summary.failed_runs), pendingApprovals: number(summary.pending_approvals), simulations: number(summary.simulations), successRate: number(summary.success_rate), totalRuns: number(summary.total_runs) },
    workflows: ((payload.workflows ?? []) as Raw[]).map((item) => ({ actionType: text(item.action_type), conditionText: text(item.condition_text), domain: text(item.domain), failurePolicy: text(item.failure_policy), id: number(item.id), lastRunAt: nullableText(item.last_run_at), name: text(item.name), ownerName: text(item.owner_name), riskLevel: text(item.risk_level), runCount: number(item.run_count), status: text(item.status), successCount: number(item.success_count), triggerType: text(item.trigger_type), version: number(item.version), waitingCount: number(item.waiting_count), workflowKey: text(item.workflow_key) })),
  };
}

async function request(options?: RequestInit) {
  const response = await fetch(bnbApiUrl(MANAGE_WORKFLOW_AUTOMATION_ENDPOINT), { cache: "no-store", ...options, headers: adminAuthHeaders({ "Content-Type": "application/json", ...(options?.headers as Record<string, string> | undefined) }) });
  const payload = await response.json().catch(() => ({})) as Raw & { message?: string; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Workflow automation data could not be loaded.");
  return { message: payload.message ?? "", state: normalize(payload) };
}

export const loadWorkflowAutomation = () => request().then((result) => result.state);
export const runWorkflowScan = () => request({ method: "POST", body: JSON.stringify({ action: "run_scan" }) });
export const createWorkflowDraft = (values: Record<string, unknown>) => request({ method: "POST", body: JSON.stringify({ action: "create_workflow", ...values }) });
export const changeWorkflowStatus = (id: number, status: "active" | "paused" | "draft", reason: string) => request({ method: "POST", body: JSON.stringify({ action: "change_status", id, status, reason }) });
export const simulateWorkflow = (id: number, reference: string) => request({ method: "POST", body: JSON.stringify({ action: "simulate_workflow", id, reference }) });
export const reviewWorkflowApproval = (id: number, status: "approved" | "rejected", decisionNote: string) => request({ method: "POST", body: JSON.stringify({ action: "review_approval", id, status, decision_note: decisionNote }) });
