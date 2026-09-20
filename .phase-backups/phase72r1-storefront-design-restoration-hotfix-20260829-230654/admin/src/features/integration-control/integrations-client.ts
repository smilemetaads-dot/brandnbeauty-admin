import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export const MANAGE_INTEGRATIONS_ENDPOINT = "manage_integrations.php";

type Raw = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const nullableText = (value: unknown) => text(value) || null;

export type IntegrationConnection = {
  activatedAt: string | null;
  credentialStored: boolean;
  defaultEndpoint: string;
  description: string;
  discoveredConnected: boolean;
  discoveredLastSeenAt: string | null;
  discoveredReference: string;
  discoverySource: string;
  domainName: string;
  effectiveStatus: string;
  endpointUrl: string;
  environment: string;
  id: number;
  key: string;
  lastError: string | null;
  lastLocalTestAt: string | null;
  lastTestResult: string;
  lifecycle: string;
  ownerName: string;
  providerName: string;
  publicReference: string;
  requiresSecret: boolean;
  secretHint: string;
  supportsWebhook: boolean;
  updatedAt: string | null;
  version: number;
  webhookPath: string;
  webhookStatus: string;
};
export type IntegrationTest = { checks: Array<{ detail: string; name: string; passed: boolean }>; createdAt: string | null; id: number; integrationKey: string; note: string; providerName: string; result: string; testType: string; testedBy: string };
export type IntegrationWebhook = { domainName: string; id: number; integrationKey: string; lastEventAt: string | null; providerName: string; routePath: string; signingRequired: boolean; status: string; version: number };
export type IntegrationActivity = { actorName: string; createdAt: string | null; eventType: string; id: number; integrationKey: string; note: string; providerName: string };
export type IntegrationsState = {
  activity: IntegrationActivity[];
  capabilities: { adminAuth: boolean; audit: boolean; discovery: boolean; encryption: boolean };
  connections: IntegrationConnection[];
  engine: { credentialStorage: string; mode: string; timezone: string };
  generatedAt: string | null;
  summary: { active: number; connected: number; connections: number; credentials: number; failedTests30d: number; setupRequired: number; tests30d: number };
  tests: IntegrationTest[];
  webhooks: IntegrationWebhook[];
};

function normalize(payload: Raw): IntegrationsState {
  const capabilities = (payload.capabilities ?? {}) as Raw;
  const engine = (payload.engine ?? {}) as Raw;
  const summary = (payload.summary ?? {}) as Raw;
  return {
    activity: ((payload.activity ?? []) as Raw[]).map((item) => ({ actorName: text(item.actor_name), createdAt: nullableText(item.created_at), eventType: text(item.event_type), id: number(item.id), integrationKey: text(item.integration_key), note: text(item.note), providerName: text(item.provider_name) })),
    capabilities: { adminAuth: Boolean(capabilities.admin_auth), audit: Boolean(capabilities.audit), discovery: Boolean(capabilities.discovery), encryption: Boolean(capabilities.encryption) },
    connections: ((payload.connections ?? []) as Raw[]).map((item) => ({ activatedAt: nullableText(item.activated_at), credentialStored: Boolean(item.credential_stored), defaultEndpoint: text(item.default_endpoint), description: text(item.description), discoveredConnected: Boolean(item.discovered_connected), discoveredLastSeenAt: nullableText(item.discovered_last_seen_at), discoveredReference: text(item.discovered_reference), discoverySource: text(item.discovery_source), domainName: text(item.domain_name), effectiveStatus: text(item.effective_status), endpointUrl: text(item.endpoint_url), environment: text(item.environment), id: number(item.id), key: text(item.integration_key), lastError: nullableText(item.last_error), lastLocalTestAt: nullableText(item.last_local_test_at), lastTestResult: text(item.last_test_result), lifecycle: text(item.lifecycle), ownerName: text(item.owner_name), providerName: text(item.provider_name), publicReference: text(item.public_reference), requiresSecret: Boolean(number(item.requires_secret)), secretHint: text(item.secret_hint), supportsWebhook: Boolean(number(item.supports_webhook)), updatedAt: nullableText(item.updated_at), version: number(item.version), webhookPath: text(item.route_path), webhookStatus: text(item.webhook_status) })),
    engine: { credentialStorage: text(engine.credential_storage), mode: text(engine.mode), timezone: text(engine.timezone) },
    generatedAt: nullableText(payload.generated_at),
    summary: { active: number(summary.active), connected: number(summary.connected), connections: number(summary.connections), credentials: number(summary.credentials), failedTests30d: number(summary.failed_tests_30d), setupRequired: number(summary.setup_required), tests30d: number(summary.tests_30d) },
    tests: ((payload.tests ?? []) as Raw[]).map((item) => ({ checks: ((item.checks ?? []) as Raw[]).map((check) => ({ detail: text(check.detail), name: text(check.name), passed: Boolean(check.passed) })), createdAt: nullableText(item.created_at), id: number(item.id), integrationKey: text(item.integration_key), note: text(item.note), providerName: text(item.provider_name), result: text(item.result), testType: text(item.test_type), testedBy: text(item.tested_by) })),
    webhooks: ((payload.webhooks ?? []) as Raw[]).map((item) => ({ domainName: text(item.domain_name), id: number(item.id), integrationKey: text(item.integration_key), lastEventAt: nullableText(item.last_event_at), providerName: text(item.provider_name), routePath: text(item.route_path), signingRequired: Boolean(number(item.signing_required)), status: text(item.status), version: number(item.version) })),
  };
}

async function request(options?: RequestInit) {
  const response = await fetch(bnbApiUrl(MANAGE_INTEGRATIONS_ENDPOINT), { cache: "no-store", ...options, headers: adminAuthHeaders({ "Content-Type": "application/json", ...(options?.headers as Record<string, string> | undefined) }) });
  const payload = await response.json().catch(() => ({})) as Raw & { message?: string; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Integrations could not be loaded.");
  return { message: payload.message ?? "", state: normalize(payload) };
}

export const loadIntegrations = () => request().then((result) => result.state);
export const saveIntegrationConnection = (values: { endpoint_url: string; environment: string; integration_key: string; owner_name: string; public_reference: string; reason: string; secret: string }) => request({ method: "POST", body: JSON.stringify({ action: "save_connection", ...values }) });
export const runIntegrationLocalTest = (integrationKey: string) => request({ method: "POST", body: JSON.stringify({ action: "run_local_test", integration_key: integrationKey }) });
export const changeIntegrationLifecycle = (integrationKey: string, lifecycle: "active" | "paused", reason: string) => request({ method: "POST", body: JSON.stringify({ action: "change_lifecycle", integration_key: integrationKey, lifecycle, reason }) });
export const changeIntegrationWebhook = (integrationKey: string, status: "disabled" | "ready", reason: string) => request({ method: "POST", body: JSON.stringify({ action: "change_webhook", integration_key: integrationKey, status, reason }) });
