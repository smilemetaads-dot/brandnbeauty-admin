import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type Raw = Record<string, unknown>;
const text = (value: unknown) => String(value ?? "").trim();
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const rows = (value: unknown) => Array.isArray(value) ? value as Raw[] : [];

export type LaunchOutcome = "passed" | "review" | "blocked";
export type LaunchGate = {
  createdAt: string | null; domain: string; evidence: string; gateKey: string; id: number; label: string;
  linkedWorkspace: string; outcome: LaunchOutcome; owner: string; proof: string; severity: string;
};
export type LaunchRun = {
  blockedChecks: number; createdAt: string | null; createdBy: string; evidenceHash: string; id: number;
  passedChecks: number; reason: string; releaseStatus: string; reviewChecks: number; runKey: string; score: number; totalChecks: number;
};
export type LaunchVerificationState = {
  gates: LaunchGate[]; generatedAt: string | null; runs: LaunchRun[];
  safety: { automaticDeployment: boolean; automaticDnsChange: boolean; automaticTrackingTransmission: boolean; businessDataMutation: boolean; humanReleaseRequired: boolean };
  summary: { blockedChecks: number; latestScore: number; passedChecks: number; releaseStatus: string; reviewChecks: number; totalChecks: number; totalRuns: number };
};

function bool(value: unknown) { return value === true || value === 1 || value === "1"; }
function normalize(payload: Raw): LaunchVerificationState {
  const summary = (payload.summary ?? {}) as Raw;
  const safety = (payload.safety ?? {}) as Raw;
  return {
    gates: rows(payload.gates).map((item) => ({
      createdAt: text(item.created_at) || null, domain: text(item.domain_name), evidence: text(item.evidence), gateKey: text(item.gate_key),
      id: number(item.id), label: text(item.label), linkedWorkspace: text(item.linked_workspace),
      outcome: (text(item.outcome) || "review") as LaunchOutcome, owner: text(item.owner_name), proof: text(item.required_proof), severity: text(item.severity),
    })),
    generatedAt: text(payload.generated_at) || null,
    runs: rows(payload.runs).map((item) => ({
      blockedChecks: number(item.blocked_checks), createdAt: text(item.created_at) || null, createdBy: text(item.created_by), evidenceHash: text(item.evidence_hash),
      id: number(item.id), passedChecks: number(item.passed_checks), reason: text(item.reason), releaseStatus: text(item.release_status), reviewChecks: number(item.review_checks),
      runKey: text(item.run_key), score: number(item.score), totalChecks: number(item.total_checks),
    })),
    safety: {
      automaticDeployment: bool(safety.automatic_deployment), automaticDnsChange: bool(safety.automatic_dns_change),
      automaticTrackingTransmission: bool(safety.automatic_tracking_transmission), businessDataMutation: bool(safety.business_data_mutation),
      humanReleaseRequired: bool(safety.human_release_required),
    },
    summary: {
      blockedChecks: number(summary.blocked_checks), latestScore: number(summary.latest_score), passedChecks: number(summary.passed_checks),
      releaseStatus: text(summary.release_status) || "not_scanned", reviewChecks: number(summary.review_checks),
      totalChecks: number(summary.total_checks), totalRuns: number(summary.total_runs),
    },
  };
}

async function request(options?: RequestInit) {
  const response = await fetch(bnbApiUrl("manage_launch_verification.php"), {
    cache: "no-store", ...options,
    headers: adminAuthHeaders({ "Content-Type": "application/json", ...(options?.headers as Record<string, string> | undefined) }),
  });
  const payload = await response.json().catch(() => ({})) as Raw & { message?: string; success?: boolean; state?: Raw };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Launch verification evidence could not be loaded.");
  return { message: payload.message ?? "", state: normalize(payload.state ?? payload) };
}

export const loadLaunchVerification = () => request().then((result) => result.state);
export const runLaunchVerification = (reason: string) => request({ method: "POST", body: JSON.stringify({ action: "run_verification", confirmed: true, reason }) });
