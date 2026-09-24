"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  OwnerException,
  OwnerExceptionFeed,
  loadOwnerExceptionFeed,
  reviewBusinessOsApproval,
} from "./business-os-control-client";

const severityTone: Record<string,string> = {
  critical: "border-rose-200 bg-rose-50 text-rose-800",
  high: "border-orange-200 bg-orange-50 text-orange-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-slate-200 bg-slate-50 text-slate-700",
};

export function LiveBusinessOsControlWorkspace() {
  const [feed,setFeed] = useState<OwnerExceptionFeed | null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [selected,setSelected] = useState<OwnerException | null>(null);
  const [decision,setDecision] = useState<"approved"|"rejected">("approved");
  const [note,setNote] = useState("");
  const [saving,setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setFeed(await loadOwnerExceptionFeed()); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "Owner exception feed unavailable."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(id);
  }, [refresh]);

  const priority = useMemo(
    () => (feed?.items ?? []).filter(item => item.severity === "critical" || item.severity === "high"),
    [feed],
  );

  const openDecision = (item: OwnerException) => {
    setSelected(item);
    setDecision("approved");
    setNote("");
  };

  const saveDecision = async () => {
    if (!selected?.approval_id || !note.trim()) return;
    setSaving(true);
    setError("");
    try {
      const message = await reviewBusinessOsApproval(selected.approval_id, decision, note.trim());
      setNotice(message);
      setSelected(null);
      await refresh();
      window.setTimeout(() => setNotice(""), 4500);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Decision could not be recorded.");
    } finally {
      setSaving(false);
    }
  };

  return <div className="space-y-5">
    <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3b646d]">Management by exception</p>
        <h1 className="mt-2 text-[28px] font-bold tracking-[-.035em] text-[#17231f] sm:text-[32px]">Business OS Control</h1>
        <p className="mt-1.5 max-w-3xl text-[12.5px] leading-5 text-[#66736d]">Owner-facing exceptions and protected decisions from the existing alerts, approvals, tasks and integration registry. Routine department work stays in its own workspace.</p>
      </div>
      <button onClick={() => void refresh()} className="h-10 rounded-xl border bg-white px-4 text-[9px] font-bold text-[#596962]">{loading ? "Refreshing…" : "Refresh"}</button>
    </section>

    {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[10px] font-semibold text-rose-700">{error}</div> : null}
    {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[10px] font-semibold text-emerald-700">{notice}</div> : null}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {[
        ["Critical",feed?.summary.critical ?? 0],
        ["High",feed?.summary.high ?? 0],
        ["Approvals",feed?.summary.approvals ?? 0],
        ["Alerts",feed?.summary.alerts ?? 0],
        ["Tasks",feed?.summary.tasks ?? 0],
        ["Integration issues",feed?.summary.integration_issues ?? 0],
      ].map(([label,value]) => <article key={String(label)} className="rounded-2xl border border-[#e2e8e5] bg-white p-4"><p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#87928d]">{label}</p><strong className="mt-3 block text-[22px] text-[#17231f]">{value}</strong></article>)}
    </section>

    <section className="rounded-2xl border border-[#e2e8e5] bg-white">
      <div className="border-b p-5">
        <h2 className="text-[16px] font-bold text-[#23322b]">Needs owner attention</h2>
        <p className="mt-1 text-[8px] text-[#7c8882]">Only critical/high items. Approval records are decisions only; approval never executes the protected downstream business action.</p>
      </div>
      <div className="divide-y">
        {priority.length === 0 ? <div className="p-6 text-[10px] text-[#7d8983]">No critical or high-priority owner exceptions right now.</div> : priority.map(item => <ExceptionRow key={item.ref} item={item} onDecision={openDecision}/>)}
      </div>
    </section>

    <section className="rounded-2xl border border-[#e2e8e5] bg-white">
      <div className="border-b p-5"><h2 className="text-[16px] font-bold text-[#23322b]">All current exceptions</h2></div>
      <div className="divide-y">
        {(feed?.items ?? []).length === 0 ? <div className="p-6 text-[10px] text-[#7d8983]">No current exceptions.</div> : (feed?.items ?? []).map(item => <ExceptionRow key={item.ref} item={item} onDecision={openDecision}/>)}
      </div>
    </section>

    {selected ? <div className="fixed inset-0 z-[160] flex items-center justify-center bg-[#17231f]/35 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.currentTarget === event.target) setSelected(null); }}><section className="w-full max-w-lg rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.24)]"><header className="border-b p-5"><p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#3b646d]">Protected decision</p><h2 className="mt-1 text-[18px] font-bold text-[#23322b]">{selected.title}</h2><p className="mt-2 text-[8px] leading-4 text-[#7d8983]">{selected.risk_reason || selected.detail}</p></header><div className="space-y-4 p-5"><label className="block text-[8px] font-bold text-[#65736c]">Decision<select value={decision} onChange={event => setDecision(event.target.value as "approved"|"rejected")} className="mt-2 h-10 w-full rounded-xl border px-3 text-[9px]"><option value="approved">Approve</option><option value="rejected">Reject</option></select></label><label className="block text-[8px] font-bold text-[#65736c]">Decision note<textarea rows={4} value={note} onChange={event => setNote(event.target.value)} placeholder="Why is this decision being made?" className="mt-2 w-full rounded-xl border p-3 text-[9px]"/></label><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[8px] leading-4 text-amber-900"><b>Safety boundary:</b> this records the owner decision only. It will not send a message, book a courier, move inventory, change ad spend, reconcile finance, issue a refund or make a payment.</div></div><footer className="flex justify-end gap-2 border-t p-4"><button onClick={() => setSelected(null)} className="h-10 rounded-xl border px-4 text-[8px] font-bold">Cancel</button><button disabled={saving || !note.trim()} onClick={() => void saveDecision()} className="h-10 rounded-xl bg-[#3b646d] px-4 text-[8px] font-bold text-white disabled:opacity-40">{saving ? "Saving…" : "Record decision"}</button></footer></section></div> : null}
  </div>;
}

function ExceptionRow({ item,onDecision }: { item: OwnerException; onDecision: (item: OwnerException) => void }) {
  return <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2 py-1 text-[7px] font-bold ${severityTone[item.severity] || severityTone.low}`}>{item.severity.toUpperCase()}</span>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[7px] font-bold text-slate-600">{item.kind}</span>
        <span className="text-[7px] font-semibold text-[#8b9691]">{item.owner}</span>
      </div>
      <b className="mt-2 block text-[10px] text-[#405049]">{item.title}</b>
      <p className="mt-1 text-[7.5px] leading-4 text-[#7d8983]">{item.detail}</p>
      {item.risk_reason ? <p className="mt-1 text-[7.5px] leading-4 text-orange-700">Risk: {item.risk_reason}</p> : null}
    </div>
    {item.actionable && item.approval_id ? <button onClick={() => onDecision(item)} className="h-9 shrink-0 rounded-xl border border-[#cfd9d5] px-3 text-[8px] font-bold text-[#596962]">Review decision</button> : null}
  </div>;
}
