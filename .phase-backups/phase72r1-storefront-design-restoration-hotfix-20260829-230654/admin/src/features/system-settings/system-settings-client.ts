import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export const MANAGE_SYSTEM_SETTINGS_ENDPOINT = "manage_system_settings.php";

type Raw = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const nullableText = (value: unknown) => text(value) || null;

export type SettingValue = string | boolean;
export type SettingValues = Record<string, SettingValue>;
export type SettingDefinition = { categoryName: string; description: string; id: number; inputType: "email" | "select" | "text" | "toggle"; isProtected: boolean; key: string; label: string; options: string[]; sortOrder: number };
export type SettingsVersion = { createdAt: string | null; createdBy: string; id: number; reason: string; version: number };
export type SettingsActivity = { actorName: string; createdAt: string | null; eventType: string; id: number; note: string; settingKeys: string[] };
export type SettingsValidation = { issues: string[]; valid: boolean };
export type SystemSettingsState = {
  activeSettings: SettingValues;
  activity: SettingsActivity[];
  capabilities: { accessRegistry: boolean; adminAuth: boolean; audit: boolean; integrations: boolean };
  definitions: SettingDefinition[];
  dirtyKeys: string[];
  draftSettings: SettingValues | null;
  engine: { lastPublishedAt: string | null; lastValidationAt: string | null; mode: string; timezone: string };
  generatedAt: string | null;
  summary: { activeVersion: number; changes30d: number; draftChanges: number; protectedControls: number; settingsCount: number; validations30d: number };
  validation: SettingsValidation;
  versions: SettingsVersion[];
};

function values(value: unknown): SettingValues {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Raw).filter(([, item]) => typeof item === "string" || typeof item === "boolean")) as SettingValues;
}

function normalize(payload: Raw): SystemSettingsState {
  const capabilities = (payload.capabilities ?? {}) as Raw;
  const engine = (payload.engine ?? {}) as Raw;
  const summary = (payload.summary ?? {}) as Raw;
  const validation = (payload.validation ?? {}) as Raw;
  return {
    activeSettings: values(payload.active_settings),
    activity: ((payload.activity ?? []) as Raw[]).map((item) => ({ actorName: text(item.actor_name), createdAt: nullableText(item.created_at), eventType: text(item.event_type), id: number(item.id), note: text(item.note), settingKeys: text(item.setting_keys).split(",").filter(Boolean) })),
    capabilities: { accessRegistry: Boolean(capabilities.access_registry), adminAuth: Boolean(capabilities.admin_auth), audit: Boolean(capabilities.audit), integrations: Boolean(capabilities.integrations) },
    definitions: ((payload.definitions ?? []) as Raw[]).map((item) => ({ categoryName: text(item.category_name), description: text(item.description), id: number(item.id), inputType: text(item.input_type) as SettingDefinition["inputType"], isProtected: Boolean(number(item.is_protected)), key: text(item.setting_key), label: text(item.label), options: ((item.options ?? []) as unknown[]).map(text), sortOrder: number(item.sort_order) })),
    dirtyKeys: ((payload.dirty_keys ?? []) as unknown[]).map(text),
    draftSettings: payload.draft_settings && typeof payload.draft_settings === "object" ? values(payload.draft_settings) : null,
    engine: { lastPublishedAt: nullableText(engine.last_published_at), lastValidationAt: nullableText(engine.last_validation_at), mode: text(engine.mode), timezone: text(engine.timezone) },
    generatedAt: nullableText(payload.generated_at),
    summary: { activeVersion: number(summary.active_version), changes30d: number(summary.changes_30d), draftChanges: number(summary.draft_changes), protectedControls: number(summary.protected_controls), settingsCount: number(summary.settings_count), validations30d: number(summary.validations_30d) },
    validation: { issues: ((validation.issues ?? []) as unknown[]).map(text), valid: validation.valid !== false },
    versions: ((payload.versions ?? []) as Raw[]).map((item) => ({ createdAt: nullableText(item.created_at), createdBy: text(item.created_by), id: number(item.id), reason: text(item.reason), version: number(item.version) })),
  };
}

async function request(options?: RequestInit) {
  const response = await fetch(bnbApiUrl(MANAGE_SYSTEM_SETTINGS_ENDPOINT), { cache: "no-store", ...options, headers: adminAuthHeaders({ "Content-Type": "application/json", ...(options?.headers as Record<string, string> | undefined) }) });
  const payload = await response.json().catch(() => ({})) as Raw & { message?: string; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "System settings could not be loaded.");
  return { message: payload.message ?? "", state: normalize(payload) };
}

export const loadSystemSettings = () => request().then((result) => result.state);
export const saveSettingsDraft = (settingValues: SettingValues) => request({ method: "POST", body: JSON.stringify({ action: "save_draft", values: settingValues }) });
export const validateSystemSettings = (settingValues: SettingValues) => request({ method: "POST", body: JSON.stringify({ action: "run_validation", values: settingValues }) });
export const publishSettingsDraft = (reason: string) => request({ method: "POST", body: JSON.stringify({ action: "publish_draft", reason }) });
export const discardSettingsDraft = () => request({ method: "POST", body: JSON.stringify({ action: "discard_draft" }) });
