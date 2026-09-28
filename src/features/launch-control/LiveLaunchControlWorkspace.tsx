"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadLaunchControl,
  type LaunchControlGate,
  type LaunchControlState,
} from "./launch-control-client";

const emptyState: LaunchControlState = {
  generatedAt: "",
  gates: [],
  summary: { ready: 0, review: 0, blocked: 0, unavailable: 0, total: 0 },
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

function tone(status: LaunchControlGate["status"]) {
  if (status === "ready") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "blocked") return "bg-rose-50 text-rose-700 ring-rose-200";
  if (status === "unavailable") return "bg-slate-100 text-slate-600 ring-slate-200";
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

function label(status: LaunchControlGate["status"]) {
  return status === "ready"
    ? "Ready"
    : status === "blocked"
      ? "Blocked"
      : status === "unavailable"
        ? "Unavailable"
        : "Review";
}

export function LiveLaunchControlWorkspace() {
  const [state, setState] = useState<LaunchControlState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh(signal?: AbortSignal) {
    setLoading(true);
    setError("");
    try {
      setState(await loadLaunchControl(signal));
    } catch (caught) {
      if (!signal?.aborted) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Launch control evidence could not be loaded.",
        );
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, []);

  const launchState = useMemo(() => {
    if (state.summary.blocked > 0 || state.summary.unavailable > 0) return "blocked";
    if (state.summary.review > 0) return "review";
    return state.summary.total > 0 ? "ready" : "review";
  }, [state.summary]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#547874]">
            Batch 5 · Final pre-launch hardening
          </p>
          <h1 className="mt-2 text-[28px] font-bold tracking-[-.04em] text-[#17231f]">
            Launch Control Center
          </h1>
          <p className="mt-1.5 max-w-4xl text-[10px] font-medium leading-5 text-[#74817b]">
            A read-only owner launch gate across production readiness, launch verification,
            security, backup/recovery, tracking and operational attention. It does not deploy,
            change DNS, switch production, publish content or change ad budgets.
          </p>
        </div>
        <button
          className="rounded-xl border border-[#d9e2de] bg-white px-4 py-2.5 text-[8px] font-bold text-[#405049]"
          onClick={() => void refresh()}
          type="button"
        >
          Refresh evidence
        </button>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[9px] font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <section
        className={`rounded-2xl border p-5 ${
          launchState === "ready"
            ? "border-emerald-200 bg-emerald-50"
            : launchState === "blocked"
              ? "border-rose-200 bg-rose-50"
              : "border-amber-200 bg-amber-50"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#718079]">
              Current release state
            </p>
            <h2 className="mt-2 text-[22px] font-extrabold capitalize text-[#283a34]">
              {launchState === "ready"
                ? "Ready for human launch approval"
                : launchState === "blocked"
                  ? "Launch blocked by evidence"
                  : "Launch evidence needs review"}
            </h2>
            <p className="mt-2 text-[8px] text-[#66736d]">
              Human release decision is always required. This workspace never performs the release automatically.
            </p>
          </div>
          <span className={`rounded-full px-4 py-2 text-[8px] font-bold uppercase ring-1 ring-inset ${tone(launchState)}`}>
            {label(launchState)}
          </span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Total gates", state.summary.total],
          ["Ready", state.summary.ready],
          ["Review", state.summary.review],
          ["Blocked", state.summary.blocked],
          ["Unavailable", state.summary.unavailable],
        ].map(([name, value]) => (
          <article className="rounded-2xl border border-[#dfe6e3] bg-white p-4" key={String(name)}>
            <p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#87928d]">{name}</p>
            <strong className="mt-3 block text-[22px] text-[#17231f]">{value}</strong>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="text-[12px] font-bold text-[#2f4039]">Launch gates</h2>
            <p className="mt-1 text-[7.5px] text-[#87928d]">
              Existing governed evidence only; no new hidden launch score is invented here.
            </p>
          </div>
          <span className="text-[7px] text-[#87928d]">
            {state.generatedAt ? new Date(state.generatedAt).toLocaleString("en-BD") : "Not loaded"}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[9px] text-[#87928d]">Loading launch evidence…</div>
        ) : (
          <div className="divide-y">
            {state.gates.map((gate) => (
              <article className="grid gap-4 p-4 lg:grid-cols-[1fr_110px_100px_100px_auto] lg:items-center" key={gate.key}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-[9px] text-[#33443d]">{gate.label}</b>
                    <span className={`rounded-full px-2 py-1 text-[6.5px] font-bold uppercase ring-1 ring-inset ${tone(gate.status)}`}>
                      {label(gate.status)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[7.5px] leading-4 text-[#7d8a84]">{gate.evidence}</p>
                </div>
                <div>
                  <p className="text-[6.5px] text-[#929d97]">Score</p>
                  <b className="text-[9px]">{gate.score === null ? "—" : `${gate.score}/100`}</b>
                </div>
                <div>
                  <p className="text-[6.5px] text-[#929d97]">Blockers</p>
                  <b className="text-[9px]">{gate.blockers}</b>
                </div>
                <div>
                  <p className="text-[6.5px] text-[#929d97]">Review</p>
                  <b className="text-[9px]">{gate.reviews}</b>
                </div>
                <div className="text-right">
                  {gate.href ? (
                    <a className="inline-flex rounded-lg border px-3 py-2 text-[7.5px] font-bold text-[#50635c]" href={gate.href}>
                      Open source
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Automatic deployment", state.safety.automaticDeployment],
          ["Automatic DNS / production switch", state.safety.automaticDnsChange || state.safety.automaticProductionSwitch],
          ["Automatic ad/content changes", state.safety.automaticAdBudgetChange || state.safety.automaticContentPublication],
          ["Business-data mutation", state.safety.businessDataMutation],
        ].map(([name, enabled]) => (
          <article className="rounded-xl border bg-[#fafcfb] p-4" key={String(name)}>
            <p className="text-[7px] font-bold text-[#7d8a84]">{name}</p>
            <b className="mt-2 block text-[9px] text-[#33443d]">{enabled ? "Unexpected — review required" : "Disabled / protected"}</b>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-[8px] leading-4 text-sky-900">
        <b>Launch boundary:</b> this page is evidence-only. Final launch remains a human-approved Batch 6 action after hardening and live acceptance pass.
      </section>
    </div>
  );
}
