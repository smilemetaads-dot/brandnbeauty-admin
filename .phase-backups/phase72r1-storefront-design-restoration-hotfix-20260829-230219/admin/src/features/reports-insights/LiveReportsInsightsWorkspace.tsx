"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  emptyReportsInsightsState,
  fetchReportsInsights,
  type ReportDomainStatus,
  type ReportsInsightsState,
  type ReportsPeriod,
} from "./reports-insights-client";

type IconName = "alert" | "check" | "download" | "finance" | "inventory" | "refresh" | "reports" | "store";

const iconPaths: Record<IconName, React.ReactNode> = {
  alert: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  download: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>,
  finance: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></>,
  inventory: <><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></>,
  reports: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
  store: <><path d="M3 9 5 3h14l2 6"/><path d="M5 13v8h14v-8M9 21v-6h6v6"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/></>,
};

function Icon({ name, size = 15 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{iconPaths[name]}</svg>;
}

const money = (value: number | null) => value === null ? "Needs evidence" : `BDT ${Math.round(value).toLocaleString("en-BD")}`;
const percent = (value: number | null) => value === null ? "—" : `${value}%`;
const statusTone: Record<ReportDomainStatus, string> = {
  ready: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  review: "bg-amber-50 text-amber-700 ring-amber-200",
  no_evidence: "bg-[#edf3f4] text-[#4f706d] ring-[#cfddda]",
  unavailable: "bg-rose-50 text-rose-700 ring-rose-200",
};
const statusLabel: Record<ReportDomainStatus, string> = {
  ready: "Ready",
  review: "Review",
  no_evidence: "No evidence",
  unavailable: "Unavailable",
};

export function LiveReportsInsightsWorkspace({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [period, setPeriod] = useState<ReportsPeriod>("30D");
  const [state, setState] = useState<ReportsInsightsState>(() => emptyReportsInsightsState("30D"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback((signal?: AbortSignal) => {
    void fetchReportsInsights(period, signal).then((next) => {
      setState(next);
    }).catch((caught: unknown) => {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError(caught instanceof Error ? caught.message : "Reports & Insights is temporarily unavailable.");
    }).finally(() => {
      if (!signal?.aborted) setLoading(false);
    });
  }, [period]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const summary = state.summary;
  const cards = useMemo(() => [
    ["Delivered revenue", money(summary.delivered_revenue), `${summary.delivered_orders} delivered order(s)`, "finance" as IconName],
    ["Operating profit", money(summary.operating_profit), summary.operating_profit === null ? "Incomplete cost evidence" : `${percent(summary.operating_margin)} margin`, summary.operating_profit !== null && summary.operating_profit < 0 ? "alert" as IconName : "check" as IconName],
    ["Settled COD", money(summary.settled_cod), `${money(summary.outstanding_cod)} outstanding`, "finance" as IconName],
    ["Inventory priority", String(summary.urgent_inventory), `${summary.reorder_candidates} reorder candidate(s)`, summary.urgent_inventory ? "alert" as IconName : "inventory" as IconName],
    ["Management review", String(summary.attention_count), `${summary.available_domains}/5 evidence domains available`, summary.attention_count ? "alert" as IconName : "check" as IconName],
  ], [summary]);

  const exportCsv = () => {
    const rows = [
      ["BrandnBeauty Reports & Insights", state.period.key],
      ["Generated", state.generated_at],
      [],
      ["Metric", "Value"],
      ["Delivered revenue", summary.delivered_revenue],
      ["Confirmed direct costs", summary.confirmed_direct_costs],
      ["Marketing spend", summary.marketing_spend],
      ["Approved expenses", summary.approved_expenses],
      ["Operating profit", summary.operating_profit ?? "Needs cost evidence"],
      ["Settled COD", summary.settled_cod],
      ["Outstanding COD", summary.outstanding_cod],
      [],
      ["Domain", "Status", "Primary", "Secondary", "Note"],
      ...state.domains.map((domain) => [domain.title, statusLabel[domain.status], `${domain.primary_label}: ${domain.primary_value}`, `${domain.secondary_label}: ${domain.secondary_value}`, domain.note]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `brandnbeauty-management-report-${state.period.key.toLowerCase()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="flex items-center gap-2 text-[8.5px] font-extrabold uppercase tracking-[.18em] text-[#547874]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Live management evidence</p>
        <h1 className="mt-2 text-[26px] font-bold tracking-[-.045em] text-[#17231f]">Reports &amp; insights command center</h1>
        <p className="mt-1.5 max-w-3xl text-[10px] font-medium text-[#74817b]">Read delivered revenue, confirmed profit, COD settlement, inventory priorities and supplier evidence from one controlled report.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="flex rounded-xl border border-[#dfe6e3] bg-white p-1">{(["Today", "7D", "30D", "90D"] as ReportsPeriod[]).map((item) => <button className={`rounded-lg px-3 py-2 text-[8.5px] font-bold ${period === item ? "bg-[#edf3f4] text-[#426d72]" : "text-[#7c8983]"}`} key={item} onClick={() => { setLoading(true); setError(""); setPeriod(item); }} type="button">{item}</button>)}</div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[9px] font-bold text-[#62706a] disabled:opacity-50" disabled={loading} onClick={() => { setLoading(true); setError(""); void load(); }} type="button"><Icon name="refresh"/>Refresh</button>
        <button className="inline-flex items-center gap-2 rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[9px] font-bold text-[#62706a] disabled:opacity-40" disabled={loading || !state.domains.length} onClick={exportCsv} type="button"><Icon name="download"/>Export CSV</button>
      </div>
    </header>

    <section className="flex flex-col gap-3 rounded-2xl border border-[#d9e5e3] bg-[#edf6f6] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#426d72]"><Icon name="reports" size={18}/></span><div><b className="text-[8px] text-[#3d625f]">Finance + inventory + supplier evidence · MySQL connected</b><p className="mt-1 text-[6.5px] text-[#758781]">Every number comes from an existing live module; partial evidence remains visibly partial.</p></div></div>
      <span className={`self-start rounded-full px-3 py-2 text-[6.5px] font-bold sm:self-auto ${state.quality.unavailable_domains.length ? "bg-amber-50 text-amber-700" : "bg-white text-[#54716c]"}`}>{state.quality.unavailable_domains.length ? `${state.quality.unavailable_domains.length} source(s) unavailable` : "Read-only · zero automatic actions"}</span>
    </section>

    {error ? <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[8px] font-bold text-rose-700"><span>{error}</span><button className="underline" onClick={() => { setLoading(true); setError(""); void load(); }} type="button">Try again</button></div> : null}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, detail, icon]) => <article className="rounded-2xl border border-[#dfe6e3] bg-white p-4" key={label}><div className="flex items-start justify-between"><div><p className="text-[7px] font-extrabold uppercase tracking-[.12em] text-[#7c8983]">{label}</p><b className="mt-2 block text-[20px] tracking-[-.04em] text-[#17231f]">{value}</b></div><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${icon === "alert" ? "bg-amber-50 text-amber-700" : "bg-[#edf3f4] text-[#426d72]"}`}><Icon name={icon as IconName}/></span></div><p className="mt-4 border-t border-[#edf0ee] pt-3 text-[6.5px] text-[#84908a]">{detail}</p></article>)}</section>

    <section className="grid min-h-[590px] gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,.75fr)]">
      <article className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">
        <div className="border-b border-[#e8ecea] p-5"><p className="text-[7px] font-extrabold uppercase tracking-[.12em] text-[#7d8983]">Evidence domains</p><h2 className="mt-1.5 text-[15px] font-bold text-[#26362f]">One view, five controlled sources</h2><p className="mt-1 text-[7px] text-[#8a9690]">Open a source module to investigate or record missing human-confirmed evidence.</p></div>
        {state.domains.length ? <div className="divide-y divide-[#edf0ee]">{state.domains.map((domain) => <button className="grid w-full gap-3 p-4 text-left hover:bg-[#fafbfa] sm:grid-cols-[minmax(0,1.25fr)_minmax(110px,.55fr)_minmax(110px,.55fr)_auto] sm:items-center" key={domain.id} onClick={() => onNavigate(domain.route)} type="button"><div><div className="flex flex-wrap items-center gap-2"><b className="text-[9px] text-[#405049]">{domain.title}</b><span className={`rounded-full px-2 py-1 text-[6px] font-bold ring-1 ring-inset ${statusTone[domain.status]}`}>{statusLabel[domain.status]}</span></div><p className="mt-1.5 text-[6.5px] leading-3 text-[#8b9691]">{domain.note}</p></div><div><span className="block text-[6px] uppercase tracking-[.08em] text-[#929d97]">{domain.primary_label}</span><b className="mt-1 block text-[8px] text-[#405049]">{domain.primary_value}</b></div><div><span className="block text-[6px] uppercase tracking-[.08em] text-[#929d97]">{domain.secondary_label}</span><b className="mt-1 block text-[8px] text-[#405049]">{domain.secondary_value}</b></div><span className="text-[8px] font-bold text-[#426d72]">Open →</span></button>)}</div> : <div className="flex min-h-[460px] flex-col items-center justify-center px-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3f4] text-[#426d72]"><Icon name="reports" size={19}/></span><b className="mt-4 text-[10px] text-[#34433d]">No report source available</b><p className="mt-1.5 text-[7px] text-[#8b9691]">Refresh after the live modules are connected.</p></div>}
      </article>

      <aside className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">
        <div className="border-b border-[#e8ecea] p-5"><p className="text-[7px] font-extrabold uppercase tracking-[.12em] text-[#7d8983]">Decision signals</p><h2 className="mt-1.5 text-[15px] font-bold text-[#26362f]">What needs attention</h2><p className="mt-1 text-[7px] text-[#8a9690]">Evidence only—no rule changes stock, orders, suppliers or finance records.</p></div>
        <div className="divide-y divide-[#edf0ee]">{state.signals.map((signal) => <button className="flex w-full items-start gap-3 p-4 text-left hover:bg-[#fafbfa]" key={signal.id} onClick={() => onNavigate(signal.route)} type="button"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${signal.level === "attention" ? "bg-rose-50 text-rose-700" : signal.level === "watch" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}><Icon name={signal.level === "clear" ? "check" : "alert"}/></span><span className="min-w-0 flex-1"><b className="block text-[8px] text-[#405049]">{signal.title}</b><span className="mt-1.5 block text-[6.5px] leading-3.5 text-[#8b9691]">{signal.note}</span></span><span className="pt-1 text-[8px] font-bold text-[#426d72]">→</span></button>)}</div>
        <div className="m-4 rounded-xl bg-[#edf3f4] p-4"><div className="flex items-center gap-2 text-[#426d72]"><Icon name="check"/><b className="text-[8px]">Reporting boundary</b></div><p className="mt-2 text-[6.5px] leading-4 text-[#667b76]">{state.methodology.boundary}</p></div>
      </aside>
    </section>

    <section className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">
      <div className="flex flex-col gap-2 border-b border-[#e8ecea] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[7px] font-extrabold uppercase tracking-[.12em] text-[#7d8983]">Delivered order evidence</p><h2 className="mt-1.5 text-[15px] font-bold text-[#26362f]">Profit contribution snapshot</h2></div><button className="text-left text-[8px] font-bold text-[#426d72]" onClick={() => onNavigate("Profitability Control")} type="button">Open Profitability Control →</button></div>
      {state.profit_orders.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-[#fafbfa] text-[6.5px] font-bold uppercase tracking-[.1em] text-[#8a9590]"><tr><th className="px-4 py-3.5">Order</th><th className="px-3 py-3.5">Revenue</th><th className="px-3 py-3.5">Direct cost</th><th className="px-3 py-3.5">Contribution</th><th className="px-3 py-3.5">Margin</th><th className="px-3 py-3.5">Evidence</th></tr></thead><tbody className="divide-y divide-[#edf0ee]">{state.profit_orders.map((order) => <tr className="text-[8px] text-[#5f6e67]" key={order.id}><td className="px-4 py-4"><b className="block text-[#405049]">{order.order_number}</b><span className="mt-1 block text-[6.5px] text-[#929d97]">{order.customer_name}</span></td><td className="px-3 py-4 font-bold">{money(order.revenue)}</td><td className="px-3 py-4">{money(order.direct_cost)}</td><td className="px-3 py-4 font-bold">{money(order.contribution_profit)}</td><td className="px-3 py-4">{percent(order.margin_percent)}</td><td className="px-3 py-4 capitalize">{order.cost_state.replace("_", " ")}</td></tr>)}</tbody></table></div> : <div className="flex min-h-[190px] flex-col items-center justify-center px-6 text-center"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf3f4] text-[#426d72]"><Icon name="finance" size={18}/></span><b className="mt-3 text-[9px] text-[#34433d]">No delivered report record found</b><p className="mt-1.5 text-[6.5px] text-[#8b9691]">This is valid until the first real delivered order enters the selected period.</p></div>}
    </section>

    <section className="grid gap-3 lg:grid-cols-3"><article className="rounded-2xl border border-[#dfe6e3] bg-white p-4"><p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#84908a]">Delivered truth</p><b className="mt-2 block text-[9px] text-[#405049]">Ordered revenue is not realized profit</b><p className="mt-2 text-[7px] leading-4 text-[#87928d]">{state.methodology.revenue}</p></article><article className="rounded-2xl border border-[#dfe6e3] bg-white p-4"><p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#84908a]">Complete costs</p><b className="mt-2 block text-[9px] text-[#405049]">Missing evidence stays visible</b><p className="mt-2 text-[7px] leading-4 text-[#87928d]">{state.methodology.profit}</p></article><article className="rounded-2xl border border-[#d5e2df] bg-[#edf3f4] p-4"><p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#5e7875]">Safety boundary</p><b className="mt-2 block text-[9px] text-[#304d4d]">Read-only management report</b><p className="mt-2 text-[7px] leading-4 text-[#647b77]">No stock, order, supplier, finance or marketing record is changed.</p></article></section>
  </div>;
}
