import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export const MANAGE_ROLES_PERMISSIONS_ENDPOINT = "manage_roles_permissions.php";

type Raw = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const nullableText = (value: unknown) => text(value) || null;

export type AccessRole = { assignmentCount: number; description: string; id: number; isBuiltin: boolean; isProtected: boolean; name: string; permissionIds: number[]; permissionKeys: string[]; status: string; version: number };
export type AccessPermission = { description: string; domainName: string; id: number; isSensitive: boolean; name: string; permissionKey: string };
export type AccessAssignment = { createdAt: string | null; id: number; isProtected: boolean; roleId: number; roleName: string; status: string; subjectName: string; subjectRef: string; subjectType: string };
export type AccessVersion = { createdAt: string | null; createdBy: string; id: number; reason: string; roleId: number; roleName: string; version: number };
export type AccessActivity = { actorName: string; createdAt: string | null; eventType: string; id: number; note: string; subjectLabel: string };
export type RolesPermissionsState = {
  activity: AccessActivity[];
  assignments: AccessAssignment[];
  capabilities: { adminAuth: boolean; audit: boolean; registry: boolean; userDirectory: boolean };
  engine: { enforcementMode: string; lastChangeAt: string | null; timezone: string };
  generatedAt: string | null;
  permissions: AccessPermission[];
  roles: AccessRole[];
  summary: { activeRoles: number; assignments: number; changes30d: number; permissions: number; protectedRoles: number; totalRoles: number };
  versions: AccessVersion[];
};

function normalize(payload: Raw): RolesPermissionsState {
  const capabilities = (payload.capabilities ?? {}) as Raw;
  const engine = (payload.engine ?? {}) as Raw;
  const summary = (payload.summary ?? {}) as Raw;
  return {
    activity: ((payload.activity ?? []) as Raw[]).map((item) => ({ actorName: text(item.actor_name), createdAt: nullableText(item.created_at), eventType: text(item.event_type), id: number(item.id), note: text(item.note), subjectLabel: text(item.subject_label) })),
    assignments: ((payload.assignments ?? []) as Raw[]).map((item) => ({ createdAt: nullableText(item.created_at), id: number(item.id), isProtected: Boolean(number(item.is_protected)), roleId: number(item.role_id), roleName: text(item.role_name), status: text(item.status), subjectName: text(item.subject_name), subjectRef: text(item.subject_ref), subjectType: text(item.subject_type) })),
    capabilities: { adminAuth: Boolean(capabilities.admin_auth), audit: Boolean(capabilities.audit), registry: Boolean(capabilities.registry), userDirectory: Boolean(capabilities.user_directory) },
    engine: { enforcementMode: text(engine.enforcement_mode), lastChangeAt: nullableText(engine.last_change_at), timezone: text(engine.timezone) },
    generatedAt: nullableText(payload.generated_at),
    permissions: ((payload.permissions ?? []) as Raw[]).map((item) => ({ description: text(item.description), domainName: text(item.domain_name), id: number(item.id), isSensitive: Boolean(number(item.is_sensitive)), name: text(item.name), permissionKey: text(item.permission_key) })),
    roles: ((payload.roles ?? []) as Raw[]).map((item) => ({ assignmentCount: number(item.assignment_count), description: text(item.description), id: number(item.id), isBuiltin: Boolean(number(item.is_builtin)), isProtected: Boolean(number(item.is_protected)), name: text(item.name), permissionIds: ((item.permission_ids ?? []) as unknown[]).map(number), permissionKeys: ((item.permission_keys ?? []) as unknown[]).map(text), status: text(item.status), version: number(item.version) })),
    summary: { activeRoles: number(summary.active_roles), assignments: number(summary.assignments), changes30d: number(summary.changes_30d), permissions: number(summary.permissions), protectedRoles: number(summary.protected_roles), totalRoles: number(summary.total_roles) },
    versions: ((payload.versions ?? []) as Raw[]).map((item) => ({ createdAt: nullableText(item.created_at), createdBy: text(item.created_by), id: number(item.id), reason: text(item.reason), roleId: number(item.role_id), roleName: text(item.role_name), version: number(item.version) })),
  };
}

async function request(options?: RequestInit) {
  const response = await fetch(bnbApiUrl(MANAGE_ROLES_PERMISSIONS_ENDPOINT), { cache: "no-store", ...options, headers: adminAuthHeaders({ "Content-Type": "application/json", ...(options?.headers as Record<string, string> | undefined) }) });
  const payload = await response.json().catch(() => ({})) as Raw & { message?: string; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Roles and permissions could not be loaded.");
  return { message: payload.message ?? "", state: normalize(payload) };
}

export const loadRolesPermissions = () => request().then((result) => result.state);
export const createRoleDraft = (values: { description: string; name: string; reason: string }) => request({ method: "POST", body: JSON.stringify({ action: "create_role", ...values }) });
export const updateRolePermissions = (roleId: number, permissionIds: number[], reason: string) => request({ method: "POST", body: JSON.stringify({ action: "update_permissions", role_id: roleId, permission_ids: permissionIds, reason }) });
export const changeRoleStatus = (roleId: number, status: "active" | "paused" | "draft" | "archived", reason: string) => request({ method: "POST", body: JSON.stringify({ action: "change_role_status", role_id: roleId, status, reason }) });
export const createRoleAssignment = (values: { reason: string; role_id: number; subject_name: string; subject_ref: string; subject_type: string }) => request({ method: "POST", body: JSON.stringify({ action: "create_assignment", ...values }) });
export const changeAssignmentStatus = (assignmentId: number, status: "active" | "paused" | "revoked", reason: string) => request({ method: "POST", body: JSON.stringify({ action: "change_assignment_status", assignment_id: assignmentId, status, reason }) });
