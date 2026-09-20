"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createRetentionPlan, loadRetention, RetentionPlan, RetentionSegment, RetentionState, reviewRetentionPlan, saveRetentionControls } from "./retention-client";

type Tab = "Segments" | "Cohorts" | "Reorder intervals" | "Action plans" | "Data health";

const money = (value: number) => `৳${Math.round(value).toLocaleString("en-US")}`;
const percent = (value: number) => `${value.toFixed(1)}%`;
const dateTime = (value: string | null) => value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not recorded";
const today = new Date().toISOString().slice(0, 10);
const prior = new Date(Date.now() - 89 * 86400000).toISOString().slice(0, 10);
const field = "mt-1.5 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[9px] text-[#405049] outline-none focus:border-[#9eb7b4]";

function Icon({ name, size = 15 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    alert: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></>,
    report: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1A8 8 0 0 0 14.8 6L14.5 3h-5L9 6a8 8 0 0 0-1.6 1L5 6 3 9.5 5 11a7 7 0 0 0 0 2l-2 1.5L5 18l2.4-1A8 8 0 0 0 9 18l.5 3h5l.4-3a8 8 0 0 0 1.7-1L19 18l2-3.5-2-1.5a7 7 0 0 0 .1-1Z"/></>,
  };
  return <svg aria-hidden="true" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{paths[name] ?? paths.report}</svg>;
}

function Kpi({ label, note, value, warning = false }: { label: string; note: string; value: string; warning?: boolean }) {
  return <article className="rounded-2xl border border-[#e2e8e5] bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#7c8983]">{label}</p><strong className="mt-4 block text-[21px] tracking-tight text-[#182720]">{value}</strong></div><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${warning ? "bg-amber-50 text-amber-700" : "bg-[#edf3f4] text-[#477579]"}`}><Icon name={warning ? "alert" : "report"}/></span></div><p className="mt-4 border-t border-[#edf0ee] pt-3 text-[7px] leading-4 text-[#87928d]">{note}</p></article>;
}

function Modal({ children, onClose, subtitle, title }: { children: React.ReactNode; onClose: () => void; subtitle: string; title: string }) {
  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#17231f]/35 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.24)]"><header className="flex items-start justify-between border-b p-5"><div><p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#3b646d]">{subtitle}</p><h2 className="mt-1.5 text-[18px] font-bold text-[#23322b]">{title}</h2></div><button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5f3]" onClick={onClose}><Icon name="close"/></button></header>{children}</section></div>;
}

export function LiveRetentionAovClvWorkspace() {
  const [state, setState] = useState<RetentionState | null>(null);
  const [from, setFrom] = useState(prior);
  const [to, setTo] = useState(today);
  const [tab, setTab] = useState<Tab>("Segments");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [controlsOpen, setControlsOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [reviewing, setReviewing] = useState<RetentionPlan | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [controls, setControls] = useState({ vip: "4", churn: "120", due: "45", reason: "" });
  const [plan, setPlan] = useState({ segment: "new_first_time", objective: "Increase a second delivered order", channel: "Manual review queue", margin: "25", note: "" });

  const flash = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 3500); };
  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try { setState(await loadRetention(from, to)); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "Retention data could not be loaded."); }
    finally { setLoading(false); }
  }, [from, to]);
  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const filteredSegments = useMemo(() => (state?.segments ?? []).filter((item) => `${item.name} ${item.definition}`.toLowerCase().includes(query.toLowerCase())), [query, state?.segments]);
  const openControls = () => {
    const current = state?.controls;
    setControls({ vip: String(current?.vipMinOrders ?? 4), churn: String(current?.churnDays ?? 120), due: String(current?.secondOrderDueDays ?? 45), reason: "" });
    setConfirmed(false); setControlsOpen(true);
  };
  const openPlan = (segment?: RetentionSegment) => {
    const selected = segment ?? state?.segments[0];
    setPlan({ segment: selected?.key ?? "new_first_time", objective: selected?.key === "churn_risk" ? "Review dormant repeat customers" : "Increase a second delivered order", channel: "Manual review queue", margin: "25", note: selected?.definition ?? "" });
    setConfirmed(false); setPlanOpen(true);
  };
  const saveControls = async () => {
    setSaving(true);
    try {
      const result = await saveRetentionControls({ vip_min_orders: Number(controls.vip), churn_days: Number(controls.churn), second_order_due_days: Number(controls.due), reason: controls.reason }, from, to);
      setState(result.state); setControlsOpen(false); flash(result.message);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Controls could not be saved."); }
    finally { setSaving(false); }
  };
  const savePlan = async () => {
    setSaving(true);
    try {
      const result = await createRetentionPlan({ segment_key: plan.segment, objective: plan.objective, channel: plan.channel, margin_floor: Number(plan.margin), note: plan.note }, from, to);
      setState(result.state); setPlanOpen(false); setTab("Action plans"); flash(result.message);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Plan could not be saved."); }
    finally { setSaving(false); }
  };
  const review = async (item: RetentionPlan, status: "approved" | "rejected") => {
    setSaving(true);
    try { const result = await reviewRetentionPlan(item.id, status, `Human ${status} from Retention command center.`, from, to); setState(result.state); setReviewing(null); flash(result.message); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "Review could not be saved."); }
    finally { setSaving(false); }
  };

  const summary = state?.summary;
  return <div className="space-y-5">
    <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3b646d]">Customer growth intelligence</p></div><h1 className="mt-2 text-[28px] font-bold tracking-[-.035em] text-[#17231f] sm:text-[32px]">Retention / AOV / CLV command center</h1><p className="mt-1.5 max-w-3xl text-[12.5px] leading-5 text-[#66736d]">Measure repeat behaviour and observed customer value from delivered MySQL orders—without exposing customer identity or inventing forecast revenue.</p></div><div className="flex flex-wrap gap-2"><button className="flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-[9px] font-bold text-[#596962]" onClick={openControls}><Icon name="settings"/>Segment controls</button><button className="flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-[9px] font-bold text-[#596962]" onClick={() => void refresh()}><Icon name="refresh"/>Refresh</button><button className="flex h-10 items-center gap-2 rounded-xl bg-[#3b646d] px-4 text-[9px] font-bold text-white" onClick={() => openPlan()}><Icon name="plus"/>New action plan</button></div></section>

    {error && <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-[8px] font-bold text-rose-700"><span>{error}</span><button className="underline" onClick={() => void refresh()}>Try again</button></div>}
    {state?.quality.ordersWithoutStableIdentity ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-[8px] leading-4 text-amber-800"><b>{state.quality.ordersWithoutStableIdentity} order(s) have no stable phone or customer ID.</b> They stay outside repeat-customer and CLV calculations to prevent false identity matches.</div> : null}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><Kpi label="Period delivered revenue" note={`${summary?.periodOrders ?? 0} delivered orders in selected range`} value={money(summary?.periodRevenue ?? 0)}/><Kpi label="Period AOV" note="Delivered revenue ÷ delivered orders" value={(summary?.periodOrders ?? 0) ? money(summary?.periodAov ?? 0) : "—"}/><Kpi label="Observed CLV" note="Lifetime delivered revenue ÷ identified delivered customers" value={(summary?.deliveredCustomers ?? 0) ? money(summary?.observedClv ?? 0) : "—"}/><Kpi label="Repeat rate" note={`${summary?.repeatCustomers ?? 0} repeat of ${summary?.deliveredCustomers ?? 0} delivered customers`} value={(summary?.deliveredCustomers ?? 0) ? percent(summary?.repeatRate ?? 0) : "—"}/><Kpi label="Delivered customers" note="Stable, privacy-safe customer identity" value={String(summary?.deliveredCustomers ?? 0)}/><Kpi label="Selected activity" note={`${summary?.periodCustomers ?? 0} customers with delivered activity`} value={String(summary?.periodOrders ?? 0)} warning={(summary?.periodOrders ?? 0) === 0}/></section>

    <section className="overflow-hidden rounded-2xl border border-[#e2e8e5] bg-white"><div className="flex flex-col gap-3 border-b p-4 xl:flex-row xl:items-center xl:justify-between"><div className="flex gap-1 overflow-x-auto">{(["Segments", "Cohorts", "Reorder intervals", "Action plans", "Data health"] as Tab[]).map((item) => <button className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-[9px] font-bold ${tab === item ? "bg-[#3b646d] text-white" : "bg-[#f3f6f4] text-[#68766f]"}`} key={item} onClick={() => setTab(item)}>{item}{item === "Action plans" ? ` ${state?.plans.length ?? 0}` : ""}</button>)}</div><div className="flex flex-wrap items-center gap-2"><label className="relative"><Icon name="calendar"/><input className="h-10 rounded-xl border px-3 text-[9px]" onChange={(event) => setFrom(event.target.value)} type="date" value={from}/></label><span className="text-[#87928d]">—</span><input className="h-10 rounded-xl border px-3 text-[9px]" onChange={(event) => setTo(event.target.value)} type="date" value={to}/><button className="h-10 rounded-xl border px-4 text-[9px] font-bold" onClick={() => void refresh()}>Apply</button></div></div>

      {loading && !state ? <div className="flex min-h-96 items-center justify-center text-[9px] font-semibold text-[#87928d]">Loading real delivered-order history…</div> : null}
      {tab === "Segments" && state ? <div><div className="border-b bg-[#fbfcfb] p-4"><input className="h-10 w-full rounded-xl border px-4 text-[9px]" onChange={(event) => setQuery(event.target.value)} placeholder="Search segment or definition…" value={query}/></div><div className="overflow-x-auto"><table className="w-full min-w-[930px] text-left"><thead className="bg-[#fafbfa] text-[6.5px] font-bold uppercase tracking-[.1em] text-[#8a9590]"><tr><th className="px-5 py-3.5">Segment</th><th className="px-4 py-3.5">Definition</th><th className="px-4 py-3.5">Customers</th><th className="px-4 py-3.5">Delivered orders</th><th className="px-4 py-3.5">Delivered revenue</th><th className="px-4 py-3.5">AOV</th><th className="px-5 py-3.5 text-right">Action</th></tr></thead><tbody className="divide-y">{filteredSegments.map((item) => <tr className="text-[8px] text-[#5f6e67]" key={item.key}><td className="px-5 py-4 font-bold text-[#304d4d]">{item.name}</td><td className="max-w-md px-4 py-4 text-[#7b8982]">{item.definition}</td><td className="px-4 py-4 font-bold">{item.customers}</td><td className="px-4 py-4">{item.orders}</td><td className="px-4 py-4 font-bold text-[#3b646d]">{money(item.revenue)}</td><td className="px-4 py-4">{item.orders ? money(item.aov) : "—"}</td><td className="px-5 py-4 text-right"><button className="rounded-lg border px-3 py-2 font-bold text-[#3b646d]" onClick={() => openPlan(item)}>Plan</button></td></tr>)}</tbody></table>{!filteredSegments.length && <div className="flex min-h-72 items-center justify-center text-[8px] text-[#87928d]">No delivered-customer segments are available yet.</div>}</div></div> : null}

      {tab === "Cohorts" && state ? <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left"><thead className="bg-[#fafbfa] text-[6.5px] font-bold uppercase tracking-[.1em] text-[#8a9590]"><tr><th className="px-5 py-3.5">First delivered month</th><th className="px-4 py-3.5">Customers</th><th className="px-4 py-3.5">Repeat customers</th><th className="px-4 py-3.5">Repeat rate</th><th className="px-4 py-3.5">Delivered orders</th><th className="px-4 py-3.5">Delivered revenue</th></tr></thead><tbody className="divide-y">{state.cohorts.map((item) => <tr className="text-[8px]" key={item.cohort}><td className="px-5 py-4 font-bold text-[#304d4d]">{item.cohort}</td><td className="px-4 py-4">{item.customers}</td><td className="px-4 py-4">{item.repeatCustomers}</td><td className="px-4 py-4 font-bold text-[#3b646d]">{percent(item.repeatRate)}</td><td className="px-4 py-4">{item.orders}</td><td className="px-4 py-4 font-bold">{money(item.revenue)}</td></tr>)}</tbody></table>{!state.cohorts.length && <div className="flex min-h-80 items-center justify-center text-[8px] text-[#87928d]">A cohort appears after an identified delivered order exists.</div>}</div> : null}

      {tab === "Reorder intervals" && state ? <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">{state.reorderIntervals.map((item) => <article className="rounded-2xl border p-5" key={item.key}><p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#7c8983]">{item.label}</p><strong className="mt-4 block text-2xl text-[#304d4d]">{item.intervalCount}</strong><p className="mt-2 text-[8px] text-[#7b8982]">Observed reorder intervals · {item.customerCount} customers</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf1ef]"><div className="h-full rounded-full bg-[#5f8585]" style={{ width: `${item.share}%` }}/></div><b className="mt-2 block text-[8px] text-[#3b646d]">{percent(item.share)} of observed intervals</b></article>)}<article className="rounded-2xl border border-[#d6e2df] bg-[#edf3f4] p-5 md:col-span-2 xl:col-span-4"><b className="text-[9px] text-[#304d4d]">Observed timing only</b><p className="mt-2 text-[8px] leading-5 text-[#647b77]">Intervals are measured between consecutive delivered orders. They are not a forecast and no customer is contacted automatically.</p></article></div> : null}

      {tab === "Action plans" && state ? <div><div className="flex justify-end border-b bg-[#fbfcfb] p-4"><button className="flex h-10 items-center gap-2 rounded-xl bg-[#3b646d] px-4 text-[8px] font-bold text-white" onClick={() => openPlan()}><Icon name="plus"/>New plan</button></div><div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">{state.plans.map((item) => <article className="rounded-2xl border p-5" key={item.id}><div className="flex items-center justify-between"><span className={`rounded-full px-2 py-1 text-[6.5px] font-bold ${item.status === "approved" ? "bg-emerald-50 text-emerald-700" : item.status === "rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{item.status}</span><span className="text-[6.5px] text-[#929d97]">#{item.id}</span></div><h3 className="mt-3 text-[10px] font-bold">{item.objective}</h3><p className="mt-2 text-[7px] leading-4 text-[#7b8982]">{item.segmentKey.replaceAll("_", " ")} · {item.channel} · margin floor {percent(item.marginFloor)}</p><p className="mt-3 text-[7px] leading-4 text-[#87928d]">{item.note}</p>{item.status === "draft" && <button className="mt-4 rounded-lg border px-3 py-2 text-[7px] font-bold text-[#3b646d]" onClick={() => setReviewing(item)}>Review</button>}</article>)}{!state.plans.length && <div className="flex min-h-64 items-center justify-center text-[8px] text-[#87928d] md:col-span-2 xl:col-span-3">No internal retention plan has been created.</div>}</div></div> : null}

      {tab === "Data health" && state ? <div className="grid gap-4 p-5 md:grid-cols-2"><Kpi label="Identity basis" note="Used only for grouped calculations; identity is not returned to the browser" value={state.quality.identityBasis}/><Kpi label="Excluded identity" note="Orders excluded from repeat/CLV to avoid false matches" value={String(state.quality.ordersWithoutStableIdentity)} warning={state.quality.ordersWithoutStableIdentity > 0}/><article className="rounded-2xl border p-5"><b className="text-[9px] text-[#304d4d]">Revenue truth</b><p className="mt-3 text-[8px] leading-5 text-[#647b77]">{state.quality.revenueBasis}. Delivered status: <b>{state.quality.deliveredStatus}</b>.</p></article><article className="rounded-2xl border border-[#d6e2df] bg-[#edf3f4] p-5"><b className="text-[9px] text-[#304d4d]">Privacy boundary</b><p className="mt-3 text-[8px] leading-5 text-[#647b77]">{state.quality.privacyBoundary}</p></article></div> : null}
      {state ? <footer className="flex flex-col gap-1 border-t bg-[#fbfcfb] px-5 py-3 text-[7.5px] text-[#85918b] sm:flex-row sm:justify-between"><span>MySQL connected · Generated {dateTime(state.generatedAt)}</span><span>Observed CLV only · no message, upload or promotion is automatic</span></footer> : null}
    </section>

    {controlsOpen && <Modal onClose={() => setControlsOpen(false)} subtitle="Versioned segmentation controls" title="Retention controls"><div className="grid gap-4 p-5 sm:grid-cols-3"><label className="text-[8px] font-bold">VIP minimum delivered orders<input className={field} min="2" max="50" onChange={(event) => setControls((current) => ({ ...current, vip: event.target.value }))} type="number" value={controls.vip}/></label><label className="text-[8px] font-bold">Churn-risk inactivity days<input className={field} min="30" max="730" onChange={(event) => setControls((current) => ({ ...current, churn: event.target.value }))} type="number" value={controls.churn}/></label><label className="text-[8px] font-bold">Second-order due days<input className={field} min="7" max="365" onChange={(event) => setControls((current) => ({ ...current, due: event.target.value }))} type="number" value={controls.due}/></label><label className="text-[8px] font-bold sm:col-span-3">Change reason<textarea className="mt-1.5 min-h-24 w-full rounded-xl border p-3 text-[9px]" onChange={(event) => setControls((current) => ({ ...current, reason: event.target.value }))} value={controls.reason}/></label><label className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-[8px] leading-4 text-amber-800 sm:col-span-3"><input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox"/>I reviewed these definitions. Saving changes segmentation logic only; it does not contact customers.</label></div><footer className="flex justify-end gap-2 border-t p-4"><button className="rounded-xl border px-4 py-2.5 text-[8px] font-bold" onClick={() => setControlsOpen(false)}>Cancel</button><button className="rounded-xl bg-[#3b646d] px-4 py-2.5 text-[8px] font-bold text-white disabled:opacity-40" disabled={saving || !confirmed || !controls.reason.trim()} onClick={() => void saveControls()}>Save with audit reason</button></footer></Modal>}

    {planOpen && <Modal onClose={() => setPlanOpen(false)} subtitle="Internal review record only" title="Create retention action plan"><div className="grid gap-4 p-5 sm:grid-cols-2"><label className="text-[8px] font-bold">Source segment<select className={field} onChange={(event) => setPlan((current) => ({ ...current, segment: event.target.value }))} value={plan.segment}>{state?.segments.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}</select></label><label className="text-[8px] font-bold">Review channel<select className={field} onChange={(event) => setPlan((current) => ({ ...current, channel: event.target.value }))} value={plan.channel}><option>Manual review queue</option><option>CRM planning</option><option>Messenger planning</option><option>Email planning</option></select></label><label className="text-[8px] font-bold sm:col-span-2">Objective<input className={field} onChange={(event) => setPlan((current) => ({ ...current, objective: event.target.value }))} value={plan.objective}/></label><label className="text-[8px] font-bold">Contribution margin floor (%)<input className={field} min="0" max="100" onChange={(event) => setPlan((current) => ({ ...current, margin: event.target.value }))} type="number" value={plan.margin}/></label><label className="text-[8px] font-bold sm:col-span-2">Planning note<textarea className="mt-1.5 min-h-24 w-full rounded-xl border p-3 text-[9px]" onChange={(event) => setPlan((current) => ({ ...current, note: event.target.value }))} value={plan.note}/></label><label className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-[8px] leading-4 text-amber-800 sm:col-span-2"><input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox"/>Save a recoverable planning record only. Do not send messages, upload audiences, create coupons or spend budget.</label></div><footer className="flex justify-end gap-2 border-t p-4"><button className="rounded-xl border px-4 py-2.5 text-[8px] font-bold" onClick={() => setPlanOpen(false)}>Cancel</button><button className="rounded-xl bg-[#3b646d] px-4 py-2.5 text-[8px] font-bold text-white disabled:opacity-40" disabled={saving || !confirmed || !plan.objective.trim() || !plan.note.trim()} onClick={() => void savePlan()}>Save draft plan</button></footer></Modal>}

    {reviewing && <Modal onClose={() => setReviewing(null)} subtitle="Human approval checkpoint" title="Review retention plan"><div className="space-y-4 p-5"><article className="rounded-xl border bg-[#fafcfb] p-4"><b className="text-[10px]">{reviewing.objective}</b><p className="mt-2 text-[8px] leading-5 text-[#66736d]">{reviewing.note}</p></article><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[8px] leading-5 text-amber-800">Approval changes the internal plan status only. It cannot contact a customer or activate a campaign.</div></div><footer className="flex justify-end gap-2 border-t p-4"><button className="rounded-xl border border-rose-200 px-4 py-2.5 text-[8px] font-bold text-rose-700" disabled={saving} onClick={() => void review(reviewing, "rejected")}>Reject</button><button className="flex items-center gap-2 rounded-xl bg-[#3b646d] px-4 py-2.5 text-[8px] font-bold text-white" disabled={saving} onClick={() => void review(reviewing, "approved")}><Icon name="check"/>Approve record</button></footer></Modal>}
    {notice && <div className="fixed bottom-6 right-6 z-[170] max-w-md rounded-xl bg-[#233f42] px-4 py-3 text-[9px] font-semibold leading-5 text-white shadow-xl">{notice}</div>}
  </div>;
}
