"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BusinessOsFoundationState,
  FeatureFlag,
  changeBusinessOsFeatureFlag,
  loadBusinessOsFoundation,
} from "./business-os-foundation-client";

const pretty = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const valueText = (value: number | null) => value === null ? "N/A" : String(value);

function Pill({ value }: { value: string }) {
  const tone = value === "READY" || value === "enabled"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : value === "PARTIAL" || value === "preview"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-slate-100 text-slate-600 ring-slate-200";
  return <span className={`inline-flex rounded-full px-2 py-1 text-[7px] font-bold ring-1 ring-inset ${tone}`}>{pretty(value)}</span>;
}

export function LiveBusinessOsFoundationWorkspace() {
  const [state, setState] = useState<BusinessOsFoundationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<FeatureFlag | null>(null);
  const [lifecycle, setLifecycle] = useState<FeatureFlag["lifecycle"]>("disabled");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setState(await loadBusinessOsFoundation());
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Business OS foundation could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const readyCount = useMemo(() => state?.registry.filter((item) => item.status === "READY").length ?? 0, [state]);

  const openFlag = (flag: FeatureFlag) => {
    setSelected(flag);
    setLifecycle(flag.lifecycle);
    setReason("");
    setConfirmed(false);
  };

  const saveFlag = async () => {
    if (!selected || !reason.trim()) return;
    setSaving(true);
    setError("");
    try {
      const message = await changeBusinessOsFeatureFlag(selected.flagKey, lifecycle, reason.trim(), confirmed);
      setNotice(message);
      setSelected(null);
      await refresh();
      window.setTimeout(() => setNotice(""), 4000);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Feature flag could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !state) return <div className="rounded-2xl border bg-white p-6 text-sm text-slate-500">Loading shared Business OS foundation…</div>;

  return <div className="space-y-5">
    <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3b646d]">Shared control plane</p>
        <h1 className="mt-2 text-[28px] font-bold tracking-[-.035em] text-[#17231f] sm:text-[32px]">Business OS Foundation</h1>
        <p className="mt-1.5 max-w-3xl text-[12.5px] leading-5 text-[#66736d]">One view of the shared flags, approval/task/alert queues, access governance, integrations, automation and canonical data ownership used by all later handoffs.</p>
      </div>
      <button onClick={() => void refresh()} className="h-10 rounded-xl border bg-white px-4 text-[9px] font-bold text-[#596962]">Refresh</button>
    </section>

    {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[10px] font-semibold text-rose-700">{error}</div> : null}
    {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[10px] font-semibold text-emerald-700">{notice}</div> : null}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {[
        ["Foundation ready", `${readyCount}/${state?.registry.length ?? 0}`],
        ["Pending approvals", valueText(state?.summary.pendingApprovals ?? null)],
        ["Open alerts", valueText(state?.summary.openAlerts ?? null)],
        ["Open tasks", valueText(state?.summary.openTasks ?? null)],
        ["Active workflows", valueText(state?.summary.activeWorkflows ?? null)],
      ].map(([label,value]) => <article key={label} className="rounded-2xl border border-[#e2e8e5] bg-white p-4"><p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#87928d]">{label}</p><strong className="mt-3 block text-[22px] text-[#17231f]">{value}</strong></article>)}
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <div className="rounded-2xl border border-[#e2e8e5] bg-white">
        <div className="border-b p-5"><h2 className="text-[16px] font-bold text-[#23322b]">Shared foundation registry</h2><p className="mt-1 text-[8px] text-[#7c8882]">Reuses existing approvals, tasks, alerts, audit, roles, integrations and automation instead of creating duplicates.</p></div>
        <div className="divide-y">
          {(state?.registry ?? []).map((item) => <div key={item.key} className="flex items-start justify-between gap-4 p-4"><div><b className="text-[10px] text-[#405049]">{item.name}</b><p className="mt-1 text-[7px] leading-4 text-[#87928d]">{Object.entries(item.tables).map(([table,ok]) => `${table}: ${ok ? "present" : "missing"}`).join(" · ")}</p></div><Pill value={item.status}/></div>)}
        </div>
      </div>

      <div className="rounded-2xl border border-[#e2e8e5] bg-white">
        <div className="border-b p-5"><h2 className="text-[16px] font-bold text-[#23322b]">Operating architecture</h2></div>
        <div className="space-y-2 p-5">
          {(state?.architecture.flow ?? []).map((step,index) => <div key={step} className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#edf3f4] text-[8px] font-bold text-[#426d72]">{index+1}</span><b className="text-[9px] text-[#405049]">{step}</b></div>)}
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-[8px] leading-4 text-amber-900">AI is not a source of truth. Default Business AI write mode is <b>{state?.architecture.defaultAiWriteMode || "READ_ONLY"}</b>. High-risk actions remain <b>{state?.architecture.highRiskActions || "HUMAN_APPROVAL_REQUIRED"}</b>.</div>
        </div>
      </div>
    </section>

    <section className="rounded-2xl border border-[#e2e8e5] bg-white">
      <div className="border-b p-5"><h2 className="text-[16px] font-bold text-[#23322b]">AI / Action boundary</h2><p className="mt-1 text-[8px] text-[#7c8882]">One canonical policy for what AI may read or draft and which business actions remain human-controlled, manual-only or blocked.</p></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left">
          <thead className="bg-[#fafbfa] text-[7px] font-bold uppercase tracking-[.1em] text-[#87928d]"><tr><th className="px-4 py-3">Action</th><th className="px-4 py-3">Domain</th><th className="px-4 py-3">Mode</th><th className="px-4 py-3">Risk</th><th className="px-4 py-3">AI</th><th className="px-4 py-3">Approval</th><th className="px-4 py-3">Auto execute</th></tr></thead>
          <tbody className="divide-y">
            {(state?.actionBoundary ?? []).map((action) => <tr key={action.actionKey}><td className="px-4 py-3"><b className="text-[9px] text-[#405049]">{action.actionLabel}</b><p className="mt-1 text-[7px] text-[#89958f]">{action.actionKey}</p></td><td className="px-4 py-3 text-[8px] text-[#65736c]">{action.domainName}</td><td className="px-4 py-3"><Pill value={action.executionMode}/></td><td className="px-4 py-3 text-[8px] font-bold text-[#65736c]">{pretty(action.riskLevel)}</td><td className="px-4 py-3 text-[8px] font-bold text-[#65736c]">{action.aiAllowed ? "Allowed" : "No"}</td><td className="px-4 py-3 text-[8px] font-bold text-[#65736c]">{action.humanApprovalRequired ? "Required" : "No"}</td><td className="px-4 py-3 text-[8px] font-bold text-rose-700">{action.downstreamAutoExecute ? "Yes" : "No"}</td></tr>)}
          </tbody>
        </table>
      </div>
    </section>

    <section className="rounded-2xl border border-[#e2e8e5] bg-white">
      <div className="border-b p-5"><h2 className="text-[16px] font-bold text-[#23322b]">Canonical source of truth</h2></div>
      <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
        {(state?.sourceOfTruth ?? []).map((item) => <article key={item.domain} className="rounded-xl border p-4"><p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#81908a]">{item.domain}</p><b className="mt-2 block text-[10px] text-[#405049]">{item.owner}</b><p className="mt-2 text-[7.5px] leading-4 text-[#7d8983]">{item.rule}</p></article>)}
      </div>
    </section>

    <section className="rounded-2xl border border-[#e2e8e5] bg-white">
      <div className="border-b p-5"><h2 className="text-[16px] font-bold text-[#23322b]">Feature flag registry</h2><p className="mt-1 text-[8px] text-[#7c8882]">Advanced capabilities start disabled/preview and are activated deliberately. Changing a flag does not itself execute a business action.</p></div>
      <div className="divide-y">
        {(state?.featureFlags ?? []).map((flag) => <div key={flag.flagKey} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><b className="text-[10px] text-[#405049]">{pretty(flag.flagKey)}</b><Pill value={flag.lifecycle}/><span className="text-[7px] text-[#8a9690]">{flag.domainName} · {pretty(flag.riskLevel)} risk · v{flag.version}</span></div><p className="mt-1 text-[7.5px] leading-4 text-[#7d8983]">{flag.description}</p></div><button onClick={() => openFlag(flag)} className="h-9 shrink-0 rounded-xl border px-3 text-[8px] font-bold text-[#596962]">Change state</button></div>)}
      </div>
    </section>

    {selected ? <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#17231f]/35 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}><section className="w-full max-w-lg rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.24)]"><header className="border-b p-5"><p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#3b646d]">Governed feature control</p><h2 className="mt-1 text-[18px] font-bold text-[#23322b]">{pretty(selected.flagKey)}</h2></header><div className="space-y-4 p-5"><label className="block text-[8px] font-bold text-[#65736c]">Lifecycle<select value={lifecycle} onChange={(event) => setLifecycle(event.target.value as FeatureFlag["lifecycle"])} className="mt-2 h-10 w-full rounded-xl border px-3 text-[9px]"><option value="disabled">Disabled</option><option value="preview">Preview</option><option value="enabled">Enabled</option></select></label><label className="block text-[8px] font-bold text-[#65736c]">Audit reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border p-3 text-[9px]" placeholder="Why is this state changing?"/></label>{selected.requiresApproval && lifecycle === "enabled" ? <label className="flex items-start gap-2 text-[8px] leading-4 text-amber-800"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5"/>I confirm this protected feature is intentionally being enabled. This still does not authorize downstream spend/payment/refund/write actions.</label> : null}</div><footer className="flex justify-end gap-2 border-t p-4"><button onClick={() => setSelected(null)} className="h-10 rounded-xl border px-4 text-[8px] font-bold">Cancel</button><button disabled={saving || !reason.trim() || (selected.requiresApproval && lifecycle === "enabled" && !confirmed)} onClick={() => void saveFlag()} className="h-10 rounded-xl bg-[#3b646d] px-4 text-[8px] font-bold text-white disabled:opacity-40">{saving ? "Saving…" : "Save governed state"}</button></footer></section></div> : null}
  </div>;
}
