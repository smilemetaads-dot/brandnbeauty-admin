import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type AdminAccessContext = {
  assignmentEnforced: boolean;
  enforcementSource: "protected_owner" | "assignment_registry" | "session_role" | string;
  isSuperAdmin: boolean;
  permissionKeys: string[];
  roleKeys: string[];
  schemaReady: boolean;
  subject: {
    email: string;
    id: string;
    name: string;
    sessionRole: string;
  };
};

type Raw = Record<string, unknown>;

const text = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value.map(text).map((item) => item.trim()).filter(Boolean)
    : [];
}

export async function loadAdminAccessContext(signal?: AbortSignal): Promise<AdminAccessContext> {
  const response = await fetch(bnbApiUrl("get_admin_permissions.php"), {
    cache: "no-store",
    headers: adminAuthHeaders(),
    signal,
  });

  const payload = await response.json().catch(() => null) as
    | { success?: boolean; schema_ready?: boolean; access?: Raw; message?: string }
    | null;

  if (!response.ok || !payload?.success || !payload.access) {
    throw new Error(payload?.message || "Admin permission context could not be loaded.");
  }

  const access = payload.access;
  const subject = (access.subject ?? {}) as Raw;

  return {
    assignmentEnforced: Boolean(access.assignment_enforced),
    enforcementSource: text(access.enforcement_source),
    isSuperAdmin: Boolean(access.is_super_admin),
    permissionKeys: stringList(access.permission_keys),
    roleKeys: stringList(access.role_keys),
    schemaReady: Boolean(payload.schema_ready),
    subject: {
      email: text(subject.email),
      id: text(subject.id),
      name: text(subject.name) || "Admin",
      sessionRole: text(subject.session_role) || "admin",
    },
  };
}
