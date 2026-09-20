import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export const MANAGE_AUTOMATION_RULES_ENDPOINT = "manage_automation_rules.php";

type Raw = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const nullableText = (value: unknown) => text(value) || null;

export type AutomationRule = {
  approvalRequired: boolean; conditionText: string; dependencyText: string; domainName: string; fallbackText: string;
  id: number; isBuiltin: boolean; lastResult: string | null; lastSimulatedAt: string | null; matchedCount: number;
  name: string; outcomeText: string; ownerName: string; priority: number; riskLevel: string; ruleKey: string;
  scopeName: string; simulationCount: number; sourceType: string; status: string; version: number;
};
export type RuleSimulation = { createdAt: string | null; evidenceText: string; id: number; matchedRecords: number; result: string; ruleId: number; ruleName: string };
export type RuleVersion = { createdAt: string | null; createdBy: string; id: number; reason: string; ruleId: number; ruleName: string; version: number };
export type RuleActivity = { actorName: string; createdAt: string | null; eventType: string; id: number; note: string; ruleId: number; ruleName: string };
export type RuleDaily = { clear: number; evaluationDate: string; matched: number; unavailable: number };
export type AutomationRulesState = {
  activity: RuleActivity[];
  capabilities: { alerts: boolean; inventory: boolean; orders: boolean; tracking: boolean; workflows: boolean };
  daily: RuleDaily[];
  engine: { executionMode: string; lastSimulationAt: string | null; timezone: string };
  generatedAt: string | null;
  rules: AutomationRule[];
  simulations: RuleSimulation[];
  summary: { activeRules: number; draftRules: number; matchedLatest: number; protectedRules: number; simulations30d: number; totalRules: number };
  versions: RuleVersion[];
};

function normalize(payload: Raw): AutomationRulesState {
  const capabilities = (payload.capabilities ?? {}) as Raw;
  const engine = (payload.engine ?? {}) as Raw;
  const summary = (payload.summary ?? {}) as Raw;
  return {
    activity: ((payload.activity ?? []) as Raw[]).map((item) => ({ actorName: text(item.actor_name), createdAt: nullableText(item.created_at), eventType: text(item.event_type), id: number(item.id), note: text(item.note), ruleId: number(item.rule_id), ruleName: text(item.rule_name) })),
    capabilities: { alerts: Boolean(capabilities.alerts), inventory: Boolean(capabilities.inventory), orders: Boolean(capabilities.orders), tracking: Boolean(capabilities.tracking), workflows: Boolean(capabilities.workflows) },
    daily: ((payload.daily ?? []) as Raw[]).map((item) => ({ clear: number(item.clear_count), evaluationDate: text(item.evaluation_date), matched: number(item.matched_count), unavailable: number(item.unavailable_count) })),
    engine: { executionMode: text(engine.execution_mode), lastSimulationAt: nullableText(engine.last_simulation_at), timezone: text(engine.timezone) },
    generatedAt: nullableText(payload.generated_at),
    rules: ((payload.rules ?? []) as Raw[]).map((item) => ({ approvalRequired: Boolean(number(item.approval_required)), conditionText: text(item.condition_text), dependencyText: text(item.dependency_text), domainName: text(item.domain_name), fallbackText: text(item.fallback_text), id: number(item.id), isBuiltin: Boolean(number(item.is_builtin)), lastResult: nullableText(item.last_result), lastSimulatedAt: nullableText(item.last_simulated_at), matchedCount: number(item.matched_count), name: text(item.name), outcomeText: text(item.outcome_text), ownerName: text(item.owner_name), priority: number(item.priority), riskLevel: text(item.risk_level), ruleKey: text(item.rule_key), scopeName: text(item.scope_name), simulationCount: number(item.simulation_count), sourceType: text(item.source_type), status: text(item.status), version: number(item.version) })),
    simulations: ((payload.simulations ?? []) as Raw[]).map((item) => ({ createdAt: nullableText(item.created_at), evidenceText: text(item.evidence_text), id: number(item.id), matchedRecords: number(item.matched_records), result: text(item.result), ruleId: number(item.rule_id), ruleName: text(item.rule_name) })),
    summary: { activeRules: number(summary.active_rules), draftRules: number(summary.draft_rules), matchedLatest: number(summary.matched_latest), protectedRules: number(summary.protected_rules), simulations30d: number(summary.simulations_30d), totalRules: number(summary.total_rules) },
    versions: ((payload.versions ?? []) as Raw[]).map((item) => ({ createdAt: nullableText(item.created_at), createdBy: text(item.created_by), id: number(item.id), reason: text(item.reason), ruleId: number(item.rule_id), ruleName: text(item.rule_name), version: number(item.version) })),
  };
}

async function request(options?: RequestInit) {
  const response = await fetch(bnbApiUrl(MANAGE_AUTOMATION_RULES_ENDPOINT), { cache: "no-store", ...options, headers: adminAuthHeaders({ "Content-Type": "application/json", ...(options?.headers as Record<string, string> | undefined) }) });
  const payload = await response.json().catch(() => ({})) as Raw & { message?: string; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Automation rules could not be loaded.");
  return { message: payload.message ?? "", state: normalize(payload) };
}

export const loadAutomationRules = () => request().then((result) => result.state);
export const simulateAutomationRules = () => request({ method: "POST", body: JSON.stringify({ action: "run_safe_simulation" }) });
export const createAutomationRuleDraft = (values: Record<string, unknown>) => request({ method: "POST", body: JSON.stringify({ action: "create_rule", ...values }) });
export const changeAutomationRuleStatus = (id: number, status: "active" | "paused" | "draft" | "archived", reason: string) => request({ method: "POST", body: JSON.stringify({ action: "change_status", id, status, reason }) });
