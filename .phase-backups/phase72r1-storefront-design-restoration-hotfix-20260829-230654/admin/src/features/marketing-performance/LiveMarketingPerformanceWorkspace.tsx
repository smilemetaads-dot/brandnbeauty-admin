"use client";

import { useEffect, useMemo, useState } from "react";

import {
  type CampaignPerformance,
  type MarketingPerformanceState,
  type SpendDraft,
  loadMarketingPerformance,
  saveMarketingSpend,
  voidMarketingSpend,
} from "./marketing-performance-client";

type Tab = "Campaign performance" | "Daily trend" | "Spend ledger" | "Data quality";

const money = (value: number | null) => value === null ? "Unavailable" : `৳${Math.round(value).toLocaleString("en-BD")}`;
const ratio = (value: number | null) => value === null ? "—" : `${value.toFixed(2)}×`;
const dateTime = (value: string | null) => value ? new Date(value).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" }) : "Not available";

function Glyph({ name, size = 16 }: { name: "alert" | "calendar" | "check" | "download" | "plus" | "refresh" | "search" | "trend"; size?: number }) {
  const paths = {
    alert: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    check: <path d="m5 12 4 4L19 6"/>, download: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>,
    plus: <path d="M12 5v14M5 12h14"/>, refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>, trend: <><path d="M3 17 9 11l4 4 8-9"/><path d="M15 6h6v6"/></>,
  };
  return <svg aria-hidden="true" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{paths[name]}</svg>;
}

function Kpi({ label, note, tone = "slate", value }: { label: string; note: string; tone?: "amber" | "emerald" | "slate" | "teal"; value: string }) {
  const color = tone === "emerald" ? "bg-emerald-50 text-emerald-700" : tone === "amber" ? "bg-amber-50 text-amber-700" : tone === "teal" ? "bg-[#edf3f4] text-[#416f73]" : "bg-slate-50 text-slate-600";
  return <article className="rounded-2xl border border-[#dfe6e2] bg-white p-5 shadow-[0_1px_2px_rgba(23,42,35,.02)]"><div className="flex items-start justify-between gap-3"><div><p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#718079]">{label}</p><b className="mt-3 block text-2xl tracking-tight text-[#17251f]">{value}</b></div><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}><Glyph name="trend"/></span></div><p className="mt-4 border-t border-[#edf0ee] pt-3 text-[8px] font-medium leading-4 text-[#84908a]">{note}</p></article>;
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#17251f]/35 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.25)]"><header className="flex items-center justify-between border-b border-[#e5ebe8] p-5"><div><p className="text-[8px] font-bold uppercase tracking-[.13em] text-[#477479]">Controlled entry</p><h2 className="mt-1 text-lg font-bold text-[#203029]">{title}</h2></div><button aria-label="Close" className="h-9 w-9 rounded-xl bg-[#f1f5f3] text-lg text-[#64756d]" onClick={onClose}>×</button></header>{children}</section></div>;
}

export function LiveMarketingPerformanceWorkspace() {
  const [state, setState] = useState<MarketingPerformanceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("Campaign performance");
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("All platforms");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<CampaignPerformance | null>(null);
  const [spendOpen, setSpendOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState<SpendDraft>({ campaignId: "", campaignName: "", note: "", platform: "Meta", spendAmount: 0, spendDate: "" });

  const show = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 3200); };
  const apply = (next: MarketingPerformanceState) => { setState(next); setDateFrom(next.range.from); setDateTo(next.range.to); setError(""); };
  const refresh = async (from = dateFrom, to = dateTo) => {
    setLoading(true);
    try { apply(await loadMarketingPerformance(from || undefined, to || undefined)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Marketing performance could not be loaded."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const handle = window.setTimeout(() => void refresh("", ""), 0);
    return () => window.clearTimeout(handle);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const platforms = useMemo(() => ["All platforms", ...Array.from(new Set(state?.campaigns.map((item) => item.platform) ?? [])).sort()], [state]);
  const visible = useMemo(() => (state?.campaigns ?? []).filter((item) => (platform === "All platforms" || item.platform === platform) && `${item.platform} ${item.campaign}`.toLowerCase().includes(query.trim().toLowerCase())), [platform, query, state]);
  const maxDaily = Math.max(1, ...(state?.daily.map((item) => Math.max(item.orderedRevenue, item.deliveredRevenue, item.spend)) ?? [1]));

  const openSpend = (campaign?: CampaignPerformance) => {
    setDraft({ campaignId: "", campaignName: campaign?.campaign === "Unattributed" ? "" : campaign?.campaign ?? "", note: "", platform: campaign?.platform === "Unattributed" ? "Meta" : campaign?.platform ?? "Meta", spendAmount: 0, spendDate: dateTo });
    setSpendOpen(true);
  };
  const saveSpend = async () => {
    if (!draft.spendDate || !draft.platform.trim() || !draft.campaignName.trim() || draft.spendAmount < 0) { show("Date, platform, campaign and a valid amount are required."); return; }
    setSaving(true);
    try { apply(await saveMarketingSpend(draft, dateFrom, dateTo)); setSpendOpen(false); show("Spend saved with audit history."); }
    catch (reason) { show(reason instanceof Error ? reason.message : "Spend could not be saved."); }
    finally { setSaving(false); }
  };
  const voidSpend = async (id: number) => {
    const reason = window.prompt("Why should this spend entry be corrected to zero?");
    if (!reason?.trim()) return;
    setSaving(true);
    try { apply(await voidMarketingSpend(id, reason.trim(), dateFrom, dateTo)); show("Spend corrected to zero; history retained."); }
    catch (cause) { show(cause instanceof Error ? cause.message : "Spend could not be corrected."); }
    finally { setSaving(false); }
  };
  const exportCsv = () => {
    if (!state) return;
    const rows = [["Platform", "Campaign", "Spend BDT", "Placed orders", "Ordered revenue BDT", "Delivered orders", "Delivered revenue BDT", "Delivered ROAS", "Return/Cancel orders", "Contribution after ads BDT"], ...visible.map((item) => [item.platform, item.campaign, item.spend, item.placedOrders, item.orderedRevenue, item.deliveredOrders, item.deliveredRevenue, item.deliveredRoas ?? "Unavailable", item.returnCancelOrders, item.contributionAfterAds ?? "Unavailable"])] ;
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); link.download = `marketing-performance-${dateFrom}-${dateTo}.csv`; link.click(); URL.revokeObjectURL(link.href); show("Filtered campaign CSV downloaded.");
  };

  const input = "mt-1.5 h-10 w-full rounded-xl border border-[#dce5e1] bg-[#fafbfa] px-3 text-[9px] font-semibold text-[#405049] outline-none focus:border-[#8aa8a3] focus:bg-white";
  const s = state?.summary;

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[.18em] text-[#3f7276]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>Growth intelligence</p><h1 className="mt-3 text-[28px] font-bold tracking-[-.035em] text-[#14231d]">Marketing performance command center</h1><p className="mt-2 text-[9px] text-[#687871]">Compare real order outcomes, delivered economics and recorded advertising spend without mixing platform claims with collected cash.</p></div><div className="flex flex-wrap gap-2"><button className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dce4e0] bg-white px-4 text-[9px] font-semibold text-[#5b6c64]" onClick={() => void refresh()}><Glyph name="refresh"/>Refresh</button><button className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dce4e0] bg-white px-4 text-[9px] font-semibold text-[#5b6c64]" onClick={exportCsv}><Glyph name="download"/>Export CSV</button><button className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#416f73] px-4 text-[9px] font-semibold text-white" onClick={() => openSpend()}><Glyph name="plus"/>Record spend</button></div></header>

    {error && <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[9px] font-semibold text-rose-700"><span className="flex items-center gap-2"><Glyph name="alert"/>{error}</span><button className="underline" onClick={() => void refresh()}>Try again</button></div>}
    {!error && state?.quality.unattributedOrders ? <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[9px] leading-5 text-amber-800"><Glyph name="alert"/><p><b>{state.quality.unattributedOrders} order{state.quality.unattributedOrders === 1 ? "" : "s"} are unattributed.</b> Their order outcome remains visible under Unattributed, but it is not assigned to a paid campaign.</p></div> : null}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <Kpi label="Recorded spend" note="Manual, CSV or connected-platform ledger" tone="amber" value={money(s?.spend ?? 0)}/>
      <Kpi label="Ordered revenue" note={`${s?.placedOrders ?? 0} placed orders in selected cohort`} tone="teal" value={money(s?.orderedRevenue ?? 0)}/>
      <Kpi label="Delivered revenue" note={`${s?.deliveredOrders ?? 0} delivered orders`} tone="emerald" value={money(s?.deliveredRevenue ?? 0)}/>
      <Kpi label="Delivered ROAS" note="Delivered revenue ÷ recorded spend" tone="emerald" value={ratio(s?.deliveredRoas ?? null)}/>
      <Kpi label="Collected cash" note={state?.quality.collectionBasis ?? "Loading source status"} value={money(s?.collectedRevenue ?? null)}/>
      <Kpi label="Contribution after ads" note={state?.quality.profitBasis ?? "Loading source status"} tone={(s?.contributionAfterAds ?? 0) < 0 ? "amber" : "emerald"} value={money(s?.contributionAfterAds ?? null)}/>
    </section>

    <section className="overflow-hidden rounded-2xl border border-[#dce5e1] bg-white"><div className="flex flex-col gap-3 border-b border-[#e6ebe8] p-4 xl:flex-row xl:items-center"><div className="flex flex-wrap gap-1.5">{(["Campaign performance", "Daily trend", "Spend ledger", "Data quality"] as Tab[]).map((item) => <button className={`rounded-xl px-3.5 py-2 text-[9px] font-semibold ${tab === item ? "bg-[#416f73] text-white" : "bg-[#f4f7f5] text-[#67776f]"}`} key={item} onClick={() => setTab(item)}>{item}</button>)}</div><div className="ml-auto flex flex-col gap-2 sm:flex-row"><label className="relative"><span className="pointer-events-none absolute left-3 top-3 text-[#8a9690]"><Glyph name="search" size={13}/></span><input className="h-10 w-full rounded-xl border border-[#dce5e1] pl-9 pr-3 text-[9px] outline-none sm:w-64" onChange={(event) => setQuery(event.target.value)} placeholder="Search campaign or platform…" value={query}/></label><select className="h-10 rounded-xl border border-[#dce5e1] bg-white px-3 text-[9px] font-semibold text-[#596962]" onChange={(event) => setPlatform(event.target.value)} value={platform}>{platforms.map((item) => <option key={item}>{item}</option>)}</select><label className="flex h-10 items-center gap-2 rounded-xl border border-[#dce5e1] px-3 text-[#718079]"><Glyph name="calendar" size={13}/><input aria-label="Start date" className="w-[105px] bg-transparent text-[8px] outline-none" onChange={(event) => setDateFrom(event.target.value)} type="date" value={dateFrom}/><span>–</span><input aria-label="End date" className="w-[105px] bg-transparent text-[8px] outline-none" onChange={(event) => setDateTo(event.target.value)} type="date" value={dateTo}/></label><button className="h-10 rounded-xl border border-[#cddbd7] px-3 text-[9px] font-bold text-[#416f73]" onClick={() => void refresh(dateFrom, dateTo)}>Apply</button></div></div>

      {loading && !state ? <div className="flex min-h-[390px] items-center justify-center text-[10px] font-semibold text-[#75847d]">Loading live MySQL performance…</div>
      : tab === "Campaign performance" ? <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left"><thead className="bg-[#fafbfa] text-[7px] font-bold uppercase tracking-[.1em] text-[#89948f]"><tr><th className="px-5 py-3.5">Campaign</th><th className="px-3 py-3.5">Spend</th><th className="px-3 py-3.5">Placed</th><th className="px-3 py-3.5">Ordered revenue</th><th className="px-3 py-3.5">Delivered</th><th className="px-3 py-3.5">Delivered revenue</th><th className="px-3 py-3.5">ROAS</th><th className="px-3 py-3.5">Return / cancel</th><th className="px-3 py-3.5">Contribution</th><th className="px-5 py-3.5 text-right">Action</th></tr></thead><tbody className="divide-y divide-[#edf0ee]">{visible.map((item) => <tr className="text-[9px] text-[#5d6c65] hover:bg-[#fafcfb]" key={`${item.platform}-${item.campaign}`}><td className="px-5 py-4"><b className="block text-[10px] text-[#2b3b34]">{item.campaign}</b><span className="mt-1 block text-[8px] text-[#8b9691]">{item.platform}</span></td><td className="px-3 py-4 font-bold">{money(item.spend)}</td><td className="px-3 py-4">{item.placedOrders}</td><td className="px-3 py-4">{money(item.orderedRevenue)}</td><td className="px-3 py-4">{item.deliveredOrders}</td><td className="px-3 py-4 font-bold text-emerald-700">{money(item.deliveredRevenue)}</td><td className="px-3 py-4"><span className={`rounded-full px-2 py-1 font-bold ${item.deliveredRoas === null ? "bg-slate-100" : item.deliveredRoas >= 2 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{ratio(item.deliveredRoas)}</span></td><td className="px-3 py-4">{item.returnCancelOrders}</td><td className="px-3 py-4">{money(item.contributionAfterAds)}</td><td className="px-5 py-4 text-right"><button className="rounded-lg border border-[#dce4e0] px-2.5 py-2 text-[8px] font-bold" onClick={() => setSelected(item)}>Review</button></td></tr>)}</tbody></table>{!visible.length && <div className="flex min-h-[330px] flex-col items-center justify-center text-center"><Glyph name="trend" size={24}/><h3 className="mt-3 text-sm font-bold">No campaign outcomes found</h3><p className="mt-1 text-[9px] text-[#819088]">Record real spend or let order attribution create campaign rows.</p><button className="mt-4 rounded-xl bg-[#416f73] px-4 py-2.5 text-[9px] font-bold text-white" onClick={() => openSpend()}>Record first spend</button></div>}</div>
      : tab === "Daily trend" ? <div className="p-5"><div className="grid min-h-[390px] grid-cols-[repeat(auto-fit,minmax(45px,1fr))] items-end gap-2 rounded-2xl border border-[#e5ebe8] bg-[#fbfcfb] p-5">{state?.daily.map((item) => <div className="group flex h-full min-h-[300px] flex-col justify-end gap-1" key={item.day}><div className="text-center text-[7px] font-semibold text-[#596962] opacity-0 group-hover:opacity-100">{money(item.deliveredRevenue)}</div><div className="mx-auto w-[70%] rounded-t bg-emerald-300" style={{ height: `${Math.max(2, (item.deliveredRevenue / maxDaily) * 220)}px` }}/><div className="mx-auto w-[70%] bg-[#6f9598]" style={{ height: `${Math.max(2, (item.orderedRevenue / maxDaily) * 220)}px` }}/><div className="mx-auto w-[70%] bg-amber-300" style={{ height: `${Math.max(2, (item.spend / maxDaily) * 220)}px` }}/><span className="mt-2 text-center text-[6px] text-[#8d9893]">{item.day.slice(5)}</span></div>)}</div><div className="mt-3 flex flex-wrap gap-4 text-[8px] font-semibold text-[#718079]"><span><i className="mr-1 inline-block h-2 w-2 bg-emerald-300"/>Delivered revenue</span><span><i className="mr-1 inline-block h-2 w-2 bg-[#6f9598]"/>Ordered revenue</span><span><i className="mr-1 inline-block h-2 w-2 bg-amber-300"/>Spend</span></div></div>
      : tab === "Spend ledger" ? <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="bg-[#fafbfa] text-[7px] font-bold uppercase tracking-[.1em] text-[#89948f]"><tr><th className="px-5 py-3.5">Date</th><th className="px-4 py-3.5">Platform</th><th className="px-4 py-3.5">Campaign</th><th className="px-4 py-3.5">Amount</th><th className="px-4 py-3.5">Source</th><th className="px-4 py-3.5">Note</th><th className="px-5 py-3.5 text-right">Correction</th></tr></thead><tbody className="divide-y divide-[#edf0ee]">{state?.spendEntries.map((item) => <tr className="text-[9px] text-[#5d6c65]" key={item.id}><td className="px-5 py-4">{item.spendDate}</td><td className="px-4 py-4 font-bold">{item.platform}</td><td className="px-4 py-4">{item.campaignName}</td><td className="px-4 py-4 font-bold">{money(item.spendAmount)}</td><td className="px-4 py-4 capitalize">{item.source}</td><td className="max-w-[230px] truncate px-4 py-4">{item.note || "—"}</td><td className="px-5 py-4 text-right"><button className="rounded-lg border border-rose-200 px-2.5 py-2 text-[8px] font-bold text-rose-700 disabled:opacity-40" disabled={saving || item.spendAmount === 0} onClick={() => void voidSpend(item.id)}>Correct to zero</button></td></tr>)}</tbody></table>{!state?.spendEntries.length && <div className="flex min-h-[330px] items-center justify-center text-[9px] text-[#819088]">No recorded spend in this date range.</div>}</div>
      : <div className="grid gap-4 p-5 md:grid-cols-2"><article className="rounded-2xl border border-[#e2e8e5] p-5"><h2 className="text-sm font-bold">Source readiness</h2><div className="mt-4 space-y-3">{[["Order attribution", state?.quality.hasAttributionTable], ["Order costs", state?.quality.hasCostTable], ["COD reconciliation", state?.quality.hasCollectionTable], ["Marketing spend", true]].map(([label, ready]) => <div className="flex items-center justify-between rounded-xl bg-[#f7f9f8] p-3 text-[9px]" key={String(label)}><b>{String(label)}</b><span className={`rounded-full px-2 py-1 text-[7px] font-bold ${ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{ready ? "Available" : "Unavailable"}</span></div>)}</div></article><article className="rounded-2xl border border-[#e2e8e5] p-5"><h2 className="text-sm font-bold">Controlled definitions</h2><div className="mt-4 space-y-4 text-[8.5px] leading-5 text-[#697971]"><p><b className="block text-[#34433d]">Collection</b>{state?.quality.collectionBasis}</p><p><b className="block text-[#34433d]">Profit</b>{state?.quality.profitBasis}</p><p><b className="block text-[#34433d]">Date cohort</b>{state?.quality.orderDateBasis}</p><p><b className="block text-[#34433d]">Attribution coverage</b>{state?.quality.attributedOrders ?? 0} attributed · {state?.quality.unattributedOrders ?? 0} unattributed orders</p></div></article><div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[9px] leading-5 text-amber-800"><b>Decision boundary:</b> This phase records and analyzes spend. It does not automatically change budgets in Meta or Google, and it never substitutes missing finance data with invented values.</div></div>}
      <footer className="flex flex-col gap-1 border-t border-[#e7ece9] bg-[#fbfcfb] px-5 py-3 text-[7.5px] text-[#85918b] sm:flex-row sm:items-center sm:justify-between"><span>MySQL connected · Generated {dateTime(state?.generatedAt ?? null)}</span><span>{state?.quality.orderDateBasis}</span></footer>
    </section>

    {selected && <Modal onClose={() => setSelected(null)} title={selected.campaign}><div className="space-y-4 p-5"><div className="grid grid-cols-2 gap-3">{[["Platform", selected.platform], ["Recorded spend", money(selected.spend)], ["Ordered revenue", money(selected.orderedRevenue)], ["Delivered revenue", money(selected.deliveredRevenue)], ["Delivered ROAS", ratio(selected.deliveredRoas)], ["Contribution after ads", money(selected.contributionAfterAds)]].map(([label, value]) => <div className="rounded-xl border border-[#e2e8e5] p-3" key={label}><span className="text-[7px] text-[#89958f]">{label}</span><b className="mt-1 block text-[10px] text-[#34433d]">{value}</b></div>)}</div><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[8px] leading-4 text-amber-800">Review delivered economics and attribution coverage before making any external budget decision.</div></div><footer className="flex justify-end gap-2 border-t border-[#e5ebe8] p-4"><button className="rounded-xl border border-[#dce4e0] px-4 py-2.5 text-[9px] font-bold" onClick={() => setSelected(null)}>Close</button><button className="rounded-xl bg-[#416f73] px-4 py-2.5 text-[9px] font-bold text-white" onClick={() => { openSpend(selected); setSelected(null); }}>Add spend</button></footer></Modal>}
    {spendOpen && <Modal onClose={() => setSpendOpen(false)} title="Record campaign spend"><div className="grid gap-4 p-5 sm:grid-cols-2"><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#6c7a74]">Spend date<input className={input} onChange={(event) => setDraft((current) => ({ ...current, spendDate: event.target.value }))} type="date" value={draft.spendDate}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#6c7a74]">Platform<input className={input} maxLength={50} onChange={(event) => setDraft((current) => ({ ...current, platform: event.target.value }))} placeholder="Meta" value={draft.platform}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#6c7a74] sm:col-span-2">Campaign name<input className={input} maxLength={191} onChange={(event) => setDraft((current) => ({ ...current, campaignName: event.target.value }))} placeholder="Must match the UTM campaign for attribution" value={draft.campaignName}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#6c7a74]">Campaign ID (optional)<input className={input} maxLength={191} onChange={(event) => setDraft((current) => ({ ...current, campaignId: event.target.value }))} value={draft.campaignId}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#6c7a74]">Spend amount (BDT)<input className={input} min="0" onChange={(event) => setDraft((current) => ({ ...current, spendAmount: Number(event.target.value) }))} step="0.01" type="number" value={draft.spendAmount}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#6c7a74] sm:col-span-2">Evidence / note<textarea className="mt-1.5 min-h-24 w-full rounded-xl border border-[#dce5e1] bg-[#fafbfa] p-3 text-[9px] outline-none" maxLength={1000} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} placeholder="Invoice, platform report or correction context" value={draft.note}/></label><div className="sm:col-span-2 rounded-xl border border-[#d7e4e1] bg-[#edf3f4] p-4 text-[8px] leading-4 text-[#526e6b]">Saving the same date, platform, campaign name and campaign ID updates that record and preserves an audit snapshot.</div></div><footer className="flex justify-end gap-2 border-t border-[#e5ebe8] p-4"><button className="rounded-xl border border-[#dce4e0] px-4 py-2.5 text-[9px] font-bold" onClick={() => setSpendOpen(false)}>Cancel</button><button className="rounded-xl bg-[#416f73] px-4 py-2.5 text-[9px] font-bold text-white disabled:opacity-40" disabled={saving} onClick={() => void saveSpend()}>{saving ? "Saving…" : "Save spend"}</button></footer></Modal>}
    {notice && <div className="fixed bottom-6 right-6 z-[150] max-w-sm rounded-xl bg-[#233f42] px-4 py-3 text-[9px] font-semibold text-white shadow-xl">{notice}</div>}
  </div>;
}
