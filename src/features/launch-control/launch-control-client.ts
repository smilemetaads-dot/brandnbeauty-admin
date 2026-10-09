import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";
import { loadProductionReadiness } from "@/features/production-readiness/production-readiness-client";
import { loadLaunchVerification } from "@/features/launch-verification/launch-verification-client";
import { loadSecurityCenter } from "@/features/security-center/security-center-client";
import { loadSecurityAudit } from "@/features/security-audit/security-audit-client";
import { loadBackupRestore } from "@/features/backup-restore/backup-restore-client";
import { loadOwnerCommandCenter } from "@/features/owner-command-center/owner-command-center-client";

export type LaunchControlStatus = "ready" | "review" | "blocked" | "unavailable";

export type LaunchControlGate = {
  key: string;
  label: string;
  status: LaunchControlStatus;
  score: number | null;
  blockers: number;
  reviews: number;
  evidence: string;
  href: string | null;
};

export type LaunchControlState = {
  generatedAt: string;
  gates: LaunchControlGate[];
  summary: {
    ready: number;
    review: number;
    blocked: number;
    unavailable: number;
    total: number;
  };
  safety: {
    automaticDeployment: false;
    automaticDnsChange: false;
    automaticProductionSwitch: false;
    automaticAdBudgetChange: false;
    automaticContentPublication: false;
    businessDataMutation: false;
    humanReleaseRequired: true;
  };
};

type TrackingPayload = {
  success?: boolean;
  summary?: {
    event_count?: number | string;
    tracked_value?: number | string;
    capi_sent?: number | string;
    capi_failed?: number | string;
  };
  message?: string;
};

async function loadTrackingHealth(signal?: AbortSignal): Promise<TrackingPayload> {
  const response = await fetch(bnbApiUrl("get_tracking_health.php"), {
    cache: "no-store",
    headers: adminAuthHeaders(),
    signal,
  });
  const payload = (await response.json().catch(() => ({}))) as TrackingPayload;
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Tracking health is unavailable.");
  }
  return payload;
}

async function safe<T>(label: string, loader: () => Promise<T>) {
  try {
    return { ok: true as const, value: await loader(), error: "" };
  } catch (error) {
    return {
      ok: false as const,
      value: null,
      error: error instanceof Error ? error.message : `${label} is unavailable.`,
    };
  }
}

function normalizeStatus(
  blocked: number,
  review: number,
  explicit?: string,
): LaunchControlStatus {
  const value = (explicit || "").toLowerCase();
  if (blocked > 0 || value.includes("blocked") || value === "failed") return "blocked";
  if (
    review > 0 ||
    value.includes("review") ||
    value.includes("not_scanned") ||
    value.includes("pending")
  ) {
    return "review";
  }
  if (value === "ready" || value === "passed" || value === "complete") return "ready";
  return blocked === 0 && review === 0 ? "ready" : "review";
}

export async function loadLaunchControl(signal?: AbortSignal): Promise<LaunchControlState> {
  const [
    production,
    launch,
    security,
    securityAudit,
    backup,
    owner,
    tracking,
  ] = await Promise.all([
    safe("Production readiness", () => loadProductionReadiness()),
    safe("Launch verification", () => loadLaunchVerification()),
    safe("Security center", () => loadSecurityCenter()),
    safe("Security audit", () => loadSecurityAudit()),
    safe("Backup & restore", () => loadBackupRestore()),
    safe("Owner command center", () => loadOwnerCommandCenter()),
    safe("Tracking health", () => loadTrackingHealth(signal)),
  ]);

  const gates: LaunchControlGate[] = [];

  if (production.ok) {
    const s = production.value.summary;
    gates.push({
      key: "production-readiness",
      label: "Production readiness",
      status: normalizeStatus(s.failedChecks, s.reviewChecks, s.releaseStatus),
      score: s.latestScore,
      blockers: s.failedChecks,
      reviews: s.reviewChecks,
      evidence: `${s.passedChecks}/${s.totalChecks} checks passed · release ${s.releaseStatus || "not scanned"}`,
      href: "/business-os/control",
    });
  } else {
    gates.push({
      key: "production-readiness",
      label: "Production readiness",
      status: "unavailable",
      score: null,
      blockers: 1,
      reviews: 0,
      evidence: production.error,
      href: "/business-os/control",
    });
  }

  if (launch.ok) {
    const s = launch.value.summary;
    gates.push({
      key: "launch-verification",
      label: "Launch verification",
      status: normalizeStatus(s.blockedChecks, s.reviewChecks, s.releaseStatus),
      score: s.latestScore,
      blockers: s.blockedChecks,
      reviews: s.reviewChecks,
      evidence: `${s.passedChecks}/${s.totalChecks} launch gates passed · ${s.releaseStatus || "not scanned"}`,
      href: "/business-os/control",
    });
  } else {
    gates.push({
      key: "launch-verification",
      label: "Launch verification",
      status: "unavailable",
      score: null,
      blockers: 1,
      reviews: 0,
      evidence: launch.error,
      href: "/business-os/control",
    });
  }

  if (security.ok) {
    const s = security.value.summary;
    const blockers = s.urgentFindings;
    const reviews = Math.max(0, s.openFindings - blockers);
    gates.push({
      key: "security-center",
      label: "Security center",
      status: normalizeStatus(blockers, reviews, blockers > 0 ? "blocked" : reviews > 0 ? "review" : "ready"),
      score: s.score,
      blockers,
      reviews,
      evidence: `${s.openFindings} open findings · ${s.urgentFindings} urgent · ${s.verifiedBackups} verified backups`,
      href: "/roles",
    });
  } else {
    gates.push({
      key: "security-center",
      label: "Security center",
      status: "unavailable",
      score: null,
      blockers: 1,
      reviews: 0,
      evidence: security.error,
      href: "/roles",
    });
  }

  if (securityAudit.ok) {
    const s = securityAudit.value.summary;
    const latest = securityAudit.value.latestAudit;
    const blocked =
      latest && latest.failedChecks > 0
        ? latest.failedChecks
        : 0;
    const review = s.followUpChecks + s.unreviewedChecks;
    gates.push({
      key: "security-audit",
      label: "Security audit",
      status: normalizeStatus(
        blocked,
        review,
        latest?.status || (s.totalAudits > 0 ? "review" : "not_scanned"),
      ),
      score: s.totalAudits > 0 ? s.latestScore : null,
      blockers: blocked,
      reviews: review,
      evidence:
        s.totalAudits > 0
          ? `${s.totalAudits} audit runs · ${s.signedOff} signed off · ${review} follow-up/unreviewed`
          : "No security audit has been recorded yet.",
      href: "/roles",
    });
  } else {
    gates.push({
      key: "security-audit",
      label: "Security audit",
      status: "unavailable",
      score: null,
      blockers: 1,
      reviews: 0,
      evidence: securityAudit.error,
      href: "/roles",
    });
  }

  if (backup.ok) {
    const s = backup.value.summary;
    const blocked = s.failedBackups;
    const review = s.verifiedBackups > 0 ? s.pendingRestoreRequests : 1 + s.pendingRestoreRequests;
    gates.push({
      key: "backup-restore",
      label: "Backup & recovery",
      status: normalizeStatus(blocked, review, blocked > 0 ? "blocked" : review > 0 ? "review" : "ready"),
      score: null,
      blockers: blocked,
      reviews: review,
      evidence: `${s.verifiedBackups} verified backups · ${s.restoreDrills} restore drills · ${s.pendingRestoreRequests} pending restore requests`,
      href: "/settings",
    });
  } else {
    gates.push({
      key: "backup-restore",
      label: "Backup & recovery",
      status: "unavailable",
      score: null,
      blockers: 1,
      reviews: 0,
      evidence: backup.error,
      href: "/settings",
    });
  }

  if (tracking.ok) {
    const s = tracking.value.summary || {};
    const events = Number(s.event_count || 0);
    const failed = Number(s.capi_failed || 0);
    gates.push({
      key: "tracking",
      label: "Tracking & attribution",
      status: failed > 0 ? "review" : events > 0 ? "ready" : "review",
      score: null,
      blockers: 0,
      reviews: failed > 0 || events === 0 ? 1 : 0,
      evidence:
        events > 0
          ? `${events} verified purchase events · ${Number(s.capi_sent || 0)} CAPI sent · ${failed} CAPI failed`
          : "Tracking endpoint is live but no verified Purchase event is recorded yet.",
      href: "/growth/tracking-attribution",
    });
  } else {
    gates.push({
      key: "tracking",
      label: "Tracking & attribution",
      status: "unavailable",
      score: null,
      blockers: 1,
      reviews: 0,
      evidence: tracking.error,
      href: "/growth/tracking-attribution",
    });
  }

  if (owner.ok) {
    const attention = owner.value.needs_attention || [];
    const critical = attention.filter((item) => item.severity === "critical").length;
    const high = attention.filter((item) => item.severity === "high").length;
    gates.push({
      key: "owner-operations",
      label: "Owner operations",
      status: critical > 0 ? "review" : high > 0 ? "review" : "ready",
      score: null,
      blockers: 0,
      reviews: critical + high,
      evidence: `${attention.length} owner-attention items · ${critical} critical · ${high} high`,
      href: "/business-os/owner-command-center",
    });
  } else {
    gates.push({
      key: "owner-operations",
      label: "Owner operations",
      status: "unavailable",
      score: null,
      blockers: 1,
      reviews: 0,
      evidence: owner.error,
      href: "/business-os/owner-command-center",
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    gates,
    summary: {
      ready: gates.filter((gate) => gate.status === "ready").length,
      review: gates.filter((gate) => gate.status === "review").length,
      blocked: gates.filter((gate) => gate.status === "blocked").length,
      unavailable: gates.filter((gate) => gate.status === "unavailable").length,
      total: gates.length,
    },
    safety: {
      automaticDeployment: false,
      automaticDnsChange: false,
      automaticProductionSwitch: false,
      automaticAdBudgetChange: false,
      automaticContentPublication: false,
      businessDataMutation: false,
      humanReleaseRequired: true,
    },
  };
}
