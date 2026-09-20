import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export const MANAGE_BACKUP_RESTORE_ENDPOINT = "manage_backup_restore.php";

type Raw = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const nullableText = (value: unknown) => text(value) || null;
const rows = (value: unknown) => Array.isArray(value) ? value as Raw[] : [];

export type BackupArtifact = { backupKey: string; createdAt: string | null; createdBy: string; downloadReady: boolean; failureNote: string; fileName: string; id: number; rowCount: number; sha256: string; sizeBytes: number; status: string; storageFormat: string; tableCount: number; verifiedAt: string | null; verifiedBy: string };
export type BackupDrill = { backupKey: string; checkedBy: string; checkedSizeBytes: number; checkedTables: number; createdAt: string | null; drillType: string; fileName: string; id: number; result: string; resultSummary: string };
export type RestoreRequest = { backupKey: string; createdAt: string | null; executionMode: string; fileName: string; id: number; maintenanceWindow: string; reason: string; requester: string; status: string };
export type BackupRestoreState = {
  artifacts: BackupArtifact[];
  drills: BackupDrill[];
  engine: { downloadPolicy: string; mode: string; restoreExecution: string; storage: string };
  generatedAt: string | null;
  restoreRequests: RestoreRequest[];
  storage: { freeBytes: number; private: boolean; publicWebAccess: boolean };
  summary: { failedBackups: number; latestBackupAt: string | null; latestVerifiedAt: string | null; pendingRestoreRequests: number; restoreDrills: number; totalBackups: number; verifiedBackups: number };
};

function normalize(payload: Raw): BackupRestoreState {
  const engine = (payload.engine ?? {}) as Raw;
  const storage = (payload.storage ?? {}) as Raw;
  const summary = (payload.summary ?? {}) as Raw;
  return {
    artifacts: rows(payload.artifacts).map((item) => ({ backupKey: text(item.backup_key), createdAt: nullableText(item.created_at), createdBy: text(item.created_by), downloadReady: Boolean(number(item.download_ready)), failureNote: text(item.failure_note), fileName: text(item.file_name), id: number(item.id), rowCount: number(item.row_count), sha256: text(item.sha256), sizeBytes: number(item.size_bytes), status: text(item.status), storageFormat: text(item.storage_format), tableCount: number(item.table_count), verifiedAt: nullableText(item.verified_at), verifiedBy: text(item.verified_by) })),
    drills: rows(payload.drills).map((item) => ({ backupKey: text(item.backup_key), checkedBy: text(item.checked_by), checkedSizeBytes: number(item.checked_size_bytes), checkedTables: number(item.checked_tables), createdAt: nullableText(item.created_at), drillType: text(item.drill_type), fileName: text(item.file_name), id: number(item.id), result: text(item.result), resultSummary: text(item.result_summary) })),
    engine: { downloadPolicy: text(engine.download_policy), mode: text(engine.mode), restoreExecution: text(engine.restore_execution), storage: text(engine.storage) },
    generatedAt: nullableText(payload.generated_at),
    restoreRequests: rows(payload.restore_requests).map((item) => ({ backupKey: text(item.backup_key), createdAt: nullableText(item.created_at), executionMode: text(item.execution_mode), fileName: text(item.file_name), id: number(item.id), maintenanceWindow: text(item.maintenance_window), reason: text(item.reason), requester: text(item.requester), status: text(item.status) })),
    storage: { freeBytes: number(storage.free_bytes), private: Boolean(storage.private), publicWebAccess: Boolean(storage.public_web_access) },
    summary: { failedBackups: number(summary.failed_backups), latestBackupAt: nullableText(summary.latest_backup_at), latestVerifiedAt: nullableText(summary.latest_verified_at), pendingRestoreRequests: number(summary.pending_restore_requests), restoreDrills: number(summary.restore_drills), totalBackups: number(summary.total_backups), verifiedBackups: number(summary.verified_backups) },
  };
}

async function request(options?: RequestInit) {
  const response = await fetch(bnbApiUrl(MANAGE_BACKUP_RESTORE_ENDPOINT), { cache: "no-store", ...options, headers: adminAuthHeaders({ "Content-Type": "application/json", ...(options?.headers as Record<string, string> | undefined) }) });
  const payload = await response.json().catch(() => ({})) as Raw & { message?: string; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Backup & Restore could not be loaded.");
  return { message: payload.message ?? "", state: normalize(payload) };
}

export const loadBackupRestore = () => request().then((result) => result.state);
export const createProtectedBackup = (reason: string) => request({ method: "POST", body: JSON.stringify({ action: "create_backup", confirmed: true, reason }) });
export const verifyProtectedBackup = (backupKey: string) => request({ method: "POST", body: JSON.stringify({ action: "verify_backup", backup_key: backupKey }) });
export const runRestoreDrill = (backupKey: string) => request({ method: "POST", body: JSON.stringify({ action: "run_restore_drill", backup_key: backupKey }) });
export const requestMaintenanceRestore = (backupKey: string, maintenanceWindow: string, reason: string) => request({ method: "POST", body: JSON.stringify({ action: "request_restore", backup_key: backupKey, confirmed: true, maintenance_window: maintenanceWindow, reason }) });

export async function downloadProtectedBackup(artifact: BackupArtifact) {
  const response = await fetch(`${bnbApiUrl(MANAGE_BACKUP_RESTORE_ENDPOINT)}?download=${encodeURIComponent(artifact.backupKey)}`, { cache: "no-store", headers: adminAuthHeaders() });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(payload.message || "The verified backup could not be downloaded.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = artifact.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
