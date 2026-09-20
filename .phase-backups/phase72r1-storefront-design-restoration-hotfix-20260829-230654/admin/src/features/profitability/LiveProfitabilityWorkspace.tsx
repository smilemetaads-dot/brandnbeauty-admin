"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  emptyProfitabilityState,
  fetchProfitability,
  saveProfitabilityCostEvidence,
  type ProfitabilityCostState,
  type ProfitabilityOrder,
  type ProfitabilityPeriod,
  type ProfitabilityState,
} from "./profitability-client";

type Filter = "all" | "profitable" | "loss" | "needs_cost";
type IconName = "alert" | "check" | "download" | "finance" | "history" | "refresh" | "search";

const iconPaths: Record<IconName, React.ReactNode> = {
  alert: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  download: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>,
  finance: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
};

function Icon({ name, size = 15 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{iconPaths[name]}</svg>;
}

const money = (value: number) => new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(value);
const costLabel: Record<ProfitabilityCostState, string> = { confirmed: "Confirmed", estimated: "Estimated", missing: "Needs cost" };
const costTone: Record<ProfitabilityCostState, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  estimated: "bg-amber-50 text-amber-700 ring-amber-200",
  missing: "bg-rose-50 text-rose-700 ring-rose-200",
};
const fieldClass = "mt-1.5 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[8px] font-semibold text-[#52615a] outline-none focus:border-[#9eb7b4]";

function dateLabel(value: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(date);
}

export function LiveProfitabilityWorkspace({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [period, setPeriod] = useState<ProfitabilityPeriod>("30D");
  const [state, setState] = useState<ProfitabilityState>(() => emptyProfitabilityState("30D"));
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [costs, setCosts] = useState({ product: "0", packaging: "0", courier: "0", payment: "0", returns: "0", other: "0" });
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const next = await fetchProfitability(period, signal);
      setState(next);
      setSelectedId((current) => next.orders.some((order) => order.id === current) ? current : next.orders[0]?.id ?? "");
    } catch (caught) {
      if (!signal?.aborted) setError(caught instanceof Error ? caught.message : "Profitability Control could not be loaded.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchProfitability(period, controller.signal)
      .then((next) => {
        setState(next);
        setSelectedId((current) => next.orders.some((order) => order.id === current) ? current : next.orders[0]?.id ?? "");
      })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Profitability Control could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [period]);

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return state.orders.filter((order) => {
      const matchesSearch = !search || `${order.order_number} ${order.customer_name}`.toLowerCase().includes(search);
      const matchesFilter = filter === "all"
        || (filter === "profitable" && order.cost_state === "confirmed" && (order.contribution_profit ?? 0) >= 0)
        || (filter === "loss" && order.cost_state === "confirmed" && (order.contribution_profit ?? 0) < 0)
        || (filter === "needs_cost" && order.cost_state !== "confirmed");
      return matchesSearch && matchesFilter;
    });
  }, [filter, query, state.orders]);

  const selected = useMemo(() => state.orders.find((order) => order.id === selectedId) ?? null, [selectedId, state.orders]);

  function openEditor(order: ProfitabilityOrder) {
    setSelectedId(order.id);
    setCosts({
      product: String(order.product_cost || ""),
      packaging: String(order.packaging_cost || ""),
      courier: String(order.courier_cost || ""),
      payment: String(order.payment_fee || ""),
      returns: String(order.return_cost || ""),
      other: String(order.other_cost || ""),
    });
    setReference(order.source_reference ?? "");
    setReason(order.note ?? "");
    setConfirmed(false);
    setEditorOpen(true);
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const result = await saveProfitabilityCostEvidence({
        orderId: selected.id,
        period,
        productCost: Number(costs.product || 0),
        packagingCost: Number(costs.packaging || 0),
        courierCost: Number(costs.courier || 0),
        paymentFee: Number(costs.payment || 0),
        returnCost: Number(costs.returns || 0),
        otherCost: Number(costs.other || 0),
        sourceReference: reference,
        reason,
        confirmed,
      });
      setState(result.state);
      setEditorOpen(false);
      setNotice(result.message);
      window.setTimeout(() => setNotice(""), 2800);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Cost evidence could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    if (!visible.length) return;
    const rows = [
      ["Order", "Customer", "Delivered revenue", "Direct cost", "Contribution", "Margin", "Cost evidence"],
      ...visible.map((order) => [order.order_number, order.customer_name, order.revenue, order.direct_cost, order.contribution_profit ?? "Needs cost", order.margin_percent ?? "Needs cost", costLabel[order.cost_state]]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `profitability-${state.period.from || period}-${state.period.to || "current"}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const summary = state.summary;
  const cards: Array<[string, string, string, IconName]> = [
    ["Delivered revenue", money(summary.delivered_revenue), `${summary.delivered_orders} delivered order(s)`, "finance"],
    ["Confirmed direct cost", money(summary.confirmed_direct_costs), `${summary.complete_orders} order(s) with evidence`, "check"],
    ["Marketing spend", money(summary.marketing_spend), state.quality.marketing_source.replaceAll("_", " "), "finance"],
    ["Approved expenses", money(summary.operating_expenses), "Approved or paid ledger records", "history"],
    ["Operating profit", summary.operating_profit === null ? "Needs cost" : money(summary.operating_profit), summary.operating_margin === null ? `${summary.needs_cost} order(s) incomplete` : `${summary.operating_margin}% margin`, summary.operating_profit === null ? "alert" : "check"],
  ];

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="flex items-center gap-2 text-[8.5px] font-extrabold uppercase tracking-[.18em] text-[#547874]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Live profit evidence</p>
        <h1 className="mt-2 text-[26px] font-bold tracking-[-.045em] text-[#17231f]">Profitability control command center</h1>
        <p className="mt-1.5 max-w-3xl text-[10px] font-medium text-[#74817b]">Measure what remains after delivered revenue, confirmed direct costs, recorded marketing spend and approved operating expenses.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="flex rounded-xl border border-[#dfe6e3] bg-white p-1">{(["Today", "7D", "30D", "90D"] as ProfitabilityPeriod[]).map((item) => <button className={`rounded-lg px-3 py-2 text-[8.5px] font-bold ${period === item ? "bg-[#edf3f4] text-[#426d72]" : "text-[#7c8983]"}`} key={item} onClick={() => { setLoading(true); setError(""); setPeriod(item); }} type="button">{item}</button>)}</div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[9px] font-bold text-[#62706a] disabled:opacity-50" disabled={loading} onClick={() => void load()} type="button"><Icon name="refresh"/>Refresh</button>
        <button className="inline-flex items-center gap-2 rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[9px] font-bold text-[#62706a] disabled:opacity-40" disabled={!visible.length} onClick={exportCsv} type="button"><Icon name="download"/>Export CSV</button>
      </div>
    </header>

    <section className="flex flex-col gap-3 rounded-2xl border border-[#d9e5e3] bg-[#edf6f6] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#426d72]"><Icon name="finance" size={18}/></span><div><b className="text-[8px] text-[#3d625f]">Orders + confirmed costs + marketing + expenses · MySQL connected</b><p className="mt-1 text-[6.5px] text-[#758781]">Page load is read-only. Incomplete costs never become a confident profit figure.</p></div></div>
      <span className={`self-start rounded-full px-3 py-2 text-[6.5px] font-bold sm:self-auto ${summary.needs_cost ? "bg-amber-50 text-amber-700" : "bg-white text-[#54716c]"}`}>{summary.needs_cost ? `${summary.needs_cost} need cost evidence` : "Delivered truth · complete costs"}</span>
    </section>

    {error ? <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[8px] font-bold text-rose-700"><span>{error}</span><button className="underline" onClick={() => void load()} type="button">Try again</button></div> : null}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, detail, icon]) => <article className="rounded-2xl border border-[#dfe6e3] bg-white p-4" key={label}><div className="flex items-start justify-between"><div><p className="text-[7px] font-extrabold uppercase tracking-[.12em] text-[#7c8983]">{label}</p><b className="mt-2 block text-[20px] tracking-[-.04em] text-[#17231f]">{value}</b></div><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${icon === "alert" ? "bg-amber-50 text-amber-700" : "bg-[#edf3f4] text-[#426d72]"}`}><Icon name={icon}/></span></div><p className="mt-4 border-t border-[#edf0ee] pt-3 text-[6.5px] text-[#84908a]">{detail}</p></article>)}</section>

    <section className="grid min-h-[600px] gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
      <article className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#e8ecea] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#91a09a]"><Icon name="search"/></span><input className="h-10 w-full rounded-xl border border-[#dce4e0] bg-white pl-9 pr-3 text-[8px] outline-none focus:border-[#9eb7b4]" onChange={(event) => setQuery(event.target.value)} placeholder="Search delivered order or customer..." value={query}/></div>
          <div className="flex flex-wrap gap-1.5">{([['all', 'All'], ['profitable', 'Profitable'], ['loss', 'Loss'], ['needs_cost', `Needs cost ${summary.needs_cost}`]] as Array<[Filter, string]>).map(([value, label]) => <button className={`rounded-lg px-3 py-2 text-[7.5px] font-bold ${filter === value ? "bg-[#3f7276] text-white" : "bg-[#f2f5f3] text-[#718079]"}`} key={value} onClick={() => setFilter(value)} type="button">{label}</button>)}</div>
        </div>
        {visible.length ? <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="bg-[#fafbfa] text-[6.5px] font-bold uppercase tracking-[.1em] text-[#8a9590]"><tr><th className="px-4 py-3.5">Order</th><th className="px-3 py-3.5">Revenue</th><th className="px-3 py-3.5">Direct cost</th><th className="px-3 py-3.5">Contribution</th><th className="px-3 py-3.5">Margin</th><th className="px-3 py-3.5">Evidence</th></tr></thead><tbody className="divide-y divide-[#edf0ee]">{visible.map((order) => <tr className={`cursor-pointer text-[8px] text-[#5f6e67] hover:bg-[#fafbfa] ${selectedId === order.id ? "bg-[#f2f7f6]" : ""}`} key={order.id} onClick={() => setSelectedId(order.id)}><td className="px-4 py-4"><b className="block text-[#405049]">{order.order_number}</b><span className="mt-1 block text-[6.5px] text-[#929d97]">{order.customer_name} · {dateLabel(order.created_at)}</span></td><td className="px-3 py-4 font-bold text-[#405049]">{money(order.revenue)}</td><td className="px-3 py-4">{money(order.direct_cost)}</td><td className={`px-3 py-4 font-bold ${order.contribution_profit !== null && order.contribution_profit < 0 ? "text-rose-700" : "text-[#405049]"}`}>{order.contribution_profit === null ? "Needs cost" : money(order.contribution_profit)}</td><td className="px-3 py-4">{order.margin_percent === null ? "—" : `${order.margin_percent}%`}</td><td className="px-3 py-4"><span className={`rounded-full px-2 py-1 text-[6.5px] font-bold ring-1 ring-inset ${costTone[order.cost_state]}`}>{costLabel[order.cost_state]}</span></td></tr>)}</tbody></table></div> : <div className="flex min-h-[470px] flex-col items-center justify-center px-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3f4] text-[#426d72]"><Icon name="finance" size={19}/></span><b className="mt-4 text-[10px] text-[#34433d]">No delivered profitability record found</b><p className="mt-1.5 text-[7px] text-[#8b9691]">Change the period/filter or wait for the first real delivered order.</p></div>}
      </article>

      <aside className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">{selected ? <><div className="border-b border-[#e7ece9] p-5"><p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-[#7d8983]">Profit inspector</p><h2 className="mt-1.5 text-[17px] font-bold text-[#26362f]">{selected.order_number}</h2><p className="mt-1 text-[7.5px] text-[#87928d]">{selected.customer_name} · {dateLabel(selected.created_at)}</p></div><div className="space-y-4 p-5"><div className="grid grid-cols-2 gap-2">{[["Delivered revenue", money(selected.revenue)], ["Direct cost", money(selected.direct_cost)], ["Contribution", selected.contribution_profit === null ? "Needs confirmed cost" : money(selected.contribution_profit)], ["Margin", selected.margin_percent === null ? "—" : `${selected.margin_percent}%`], ["Cost evidence", costLabel[selected.cost_state]], ["Reference", selected.source_reference ?? "Not recorded"]].map(([label, value]) => <div className="rounded-xl border border-[#e2e8e5] p-3" key={label}><span className="text-[6px] uppercase tracking-[.08em] text-[#929d97]">{label}</span><b className="mt-1 block break-words text-[7.5px] text-[#405049]">{value}</b></div>)}</div><div className="rounded-xl bg-[#edf3f4] p-4"><div className="flex items-center gap-2"><Icon name="history"/><b className="text-[8px] text-[#405b58]">Evidence boundary</b></div><p className="mt-2 text-[7px] leading-4 text-[#667b76]">Catalog costs remain estimates until a person confirms every direct-cost component with a source reference.</p></div><button className="h-11 w-full rounded-xl bg-[#3f7276] text-[8.5px] font-bold text-white" onClick={() => openEditor(selected)} type="button">Record cost evidence</button><button className="h-10 w-full rounded-xl border border-[#dce4e0] text-[8px] font-bold text-[#5c7069]" onClick={() => onNavigate("Expenses & Cost Management")} type="button">Open expense ledger</button></div></> : <div className="flex min-h-[590px] flex-col items-center justify-center px-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3f4] text-[#426d72]"><Icon name="finance" size={19}/></span><b className="mt-4 text-[10px] text-[#34433d]">Select an order</b><p className="mt-1.5 text-[7px] text-[#8b9691]">Choose a delivered order to inspect its profit evidence.</p></div>}</aside>
    </section>

    <section className="grid gap-3 lg:grid-cols-3"><article className="rounded-2xl border border-[#dfe6e3] bg-white p-4"><p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#84908a]">Delivered revenue</p><b className="mt-2 block text-[9px] text-[#405049]">Ordered revenue is not realized profit</b><p className="mt-2 text-[7px] leading-4 text-[#87928d]">{state.methodology.revenue}</p></article><article className="rounded-2xl border border-[#dfe6e3] bg-white p-4"><p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#84908a]">Cost evidence</p><b className="mt-2 block text-[9px] text-[#405049]">Missing cost remains visibly incomplete</b><p className="mt-2 text-[7px] leading-4 text-[#87928d]">{state.methodology.direct_costs}</p></article><article className="rounded-2xl border border-[#d5e2df] bg-[#edf3f4] p-4"><p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#5e7875]">Safety boundary</p><b className="mt-2 block text-[9px] text-[#304d4d]">No automatic financial action</b><p className="mt-2 text-[7px] leading-4 text-[#647b77]">{state.methodology.boundary}</p></article></section>

    {editorOpen && selected ? <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#17231f]/35 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setEditorOpen(false); }}><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-[0_28px_90px_rgba(18,37,31,.24)]"><header className="border-b border-[#e8ecea] p-5"><p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#3b646d]">Human-confirmed direct cost</p><h2 className="mt-1 text-[17px] font-bold text-[#23322b]">{selected.order_number} cost evidence</h2><p className="mt-1 text-[7.5px] text-[#87928d]">Saving recalculates profit only; it does not change the order, stock, price, courier or bank balance.</p></header><div className="grid gap-4 p-5 sm:grid-cols-2">{([['Product cost', 'product'], ['Packaging cost', 'packaging'], ['Courier cost', 'courier'], ['Payment fee', 'payment'], ['Return cost', 'returns'], ['Other direct cost', 'other']] as Array<[string, keyof typeof costs]>).map(([label, key]) => <label className="text-[7px] font-bold text-[#596962]" key={key}>{label}<input className={fieldClass} min="0" onChange={(event) => setCosts((current) => ({ ...current, [key]: event.target.value }))} step="0.01" type="number" value={costs[key]}/></label>)}<label className="sm:col-span-2 text-[7px] font-bold text-[#596962]">Source reference<input className={fieldClass} onChange={(event) => setReference(event.target.value)} placeholder="Invoice, courier statement or approved cost sheet" value={reference}/></label><label className="sm:col-span-2 text-[7px] font-bold text-[#596962]">Confirmation reason<textarea className="mt-1.5 min-h-20 w-full rounded-xl border border-[#dce4e0] p-3 text-[8px] leading-4 outline-none focus:border-[#9eb7b4]" onChange={(event) => setReason(event.target.value)} placeholder="Explain what was checked and why these costs are complete." value={reason}/></label><label className="sm:col-span-2 flex items-start gap-2 text-[7px] leading-4 text-[#65736c]"><input checked={confirmed} className="mt-0.5 h-4 w-4 accent-[#3b646d]" onChange={(event) => setConfirmed(event.target.checked)} type="checkbox"/>I checked every direct-cost component and confirm the reference and amounts above.</label></div><footer className="flex justify-end gap-2 border-t border-[#e8ecea] p-4"><button className="h-10 rounded-xl border border-[#dce4e0] px-4 text-[8px] font-bold text-[#596962]" onClick={() => setEditorOpen(false)} type="button">Cancel</button><button className="h-10 rounded-xl bg-[#3b646d] px-4 text-[8px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={saving || !reference.trim() || !reason.trim() || !confirmed} onClick={() => void save()} type="button">{saving ? "Saving..." : "Save cost evidence"}</button></footer></div></div> : null}
    {notice ? <div className="fixed bottom-5 right-5 z-[100] max-w-sm rounded-xl bg-[#223c3f] px-4 py-3 text-[9px] font-semibold leading-5 text-white shadow-xl">{notice}</div> : null}
  </div>;
}
