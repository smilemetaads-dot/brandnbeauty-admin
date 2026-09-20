"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  getInventoryIntelligence,
  type IntelligencePolicy,
  type IntelligencePriority,
  type IntelligenceProduct,
  type IntelligenceSource,
  type IntelligenceSummary,
} from "@/features/inventory-intelligence/inventory-intelligence-client";
import { productImageUrl } from "@/features/products/products-client";

type Filter = "all" | IntelligencePriority;
type IconName = "alert" | "box" | "chart" | "check" | "clock" | "refresh" | "search";

const emptySummary: IntelligenceSummary = { noHistory: 0, observedDemandSkus: 0, reorderCandidates: 0, review: 0, totalSkus: 0, urgent: 0 };
const emptySource: IntelligenceSource = { itemTable: "", message: "", ready: false, statusGuarded: false };
const emptyPolicy: IntelligencePolicy = { leadTimeDays: 14, safetyDays: 7, targetCoverDays: 21 };
const paths: Record<IconName, ReactNode> = {
  alert: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  box: <><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></>,
  chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
};

function Icon({ name, size = 15 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{paths[name]}</svg>;
}

function label(value: IntelligencePriority) {
  return value === "no_history" ? "No history" : value === "source_unavailable" ? "Source unavailable" : value.charAt(0).toUpperCase() + value.slice(1);
}

function tone(value: IntelligencePriority) {
  if (value === "urgent") return "bg-rose-50 text-rose-700 ring-rose-200";
  if (value === "review") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (value === "watch") return "bg-sky-50 text-sky-700 ring-sky-200";
  if (value === "stable") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return "bg-[#f1f4f2] text-[#718079] ring-[#dfe6e3]";
}

function Kpi({ helper, labelText, toneName = "normal", value }: { helper: string; labelText: string; toneName?: "good" | "normal" | "warn"; value: string }) {
  return <article className="rounded-2xl border border-[#dfe6e3] bg-white p-4"><div className="flex items-center justify-between"><p className="text-[8px] font-extrabold uppercase tracking-[.11em] text-[#7d8983]">{labelText}</p><span className={`flex h-8 w-8 items-center justify-center rounded-xl ${toneName === "warn" ? "bg-amber-50 text-amber-700" : toneName === "good" ? "bg-emerald-50 text-emerald-700" : "bg-[#edf3f4] text-[#426d72]"}`}><Icon name={toneName === "warn" ? "alert" : toneName === "good" ? "check" : "chart"} size={13}/></span></div><b className="mt-2 block text-[22px] tracking-[-.04em] text-[#17231f]">{value}</b><p className="mt-3 border-t border-[#edf0ee] pt-3 text-[7.5px] text-[#839089]">{helper}</p></article>;
}

function dateText(value: string) {
  const date = new Date(value);
  return !value || Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function LiveInventoryIntelligenceWorkspace({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [products, setProducts] = useState<IntelligenceProduct[]>([]);
  const [summary, setSummary] = useState<IntelligenceSummary>(emptySummary);
  const [source, setSource] = useState<IntelligenceSource>(emptySource);
  const [policy, setPolicy] = useState<IntelligencePolicy>(emptyPolicy);
  const [generatedAt, setGeneratedAt] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const result = await getInventoryIntelligence(signal);
      setProducts(result.products);
      setSummary(result.summary);
      setSource(result.source);
      setPolicy(result.policy);
      setGeneratedAt(result.generatedAt);
      setSelectedId((current) => result.products.some((item) => item.id === current) ? current : result.products[0]?.id || "");
    } catch (loadError) {
      if (!signal?.aborted) setError(loadError instanceof Error ? loadError.message : "Inventory intelligence could not be loaded.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void load(controller.signal), 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [load]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((item) => (filter === "all" || item.priority === filter) && (!needle || [item.name, item.sku, item.brand, item.category].some((value) => value.toLowerCase().includes(needle))));
  }, [filter, products, query]);
  const selected = products.find((item) => item.id === selectedId) || products[0];

  return <div className="space-y-4"><header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="flex items-center gap-2 text-[8.5px] font-extrabold uppercase tracking-[.18em] text-[#547874]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Live planning evidence</p><h1 className="mt-2 text-[26px] font-bold tracking-[-.045em] text-[#17231f]">Inventory intelligence command center</h1><p className="mt-1.5 max-w-3xl text-[10px] font-medium text-[#74817b]">Turn real stock and observed order-item history into explainable coverage and reorder priorities—without changing stock or creating purchases.</p></div><button className="inline-flex items-center gap-2 self-start rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[9px] font-bold text-[#62706a] disabled:opacity-50 lg:self-auto" disabled={loading} onClick={() => void load()} type="button"><Icon name="refresh"/>Refresh evidence</button></header><section className={`rounded-2xl border p-4 ${source.ready ? "border-[#dfe8e5] bg-[#edf5f5]" : "border-amber-200 bg-amber-50"}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white ${source.ready ? "text-[#426d72]" : "text-amber-700"}`}><Icon name={source.ready ? "chart" : "alert"} size={17}/></span><div><p className={`text-[9px] font-bold ${source.ready ? "text-[#395c5b]" : "text-amber-800"}`}>{source.ready ? `Observed orders · ${source.itemTable} connected` : "Demand source unavailable · safe fallback active"}</p><p className={`mt-1 text-[8px] ${source.ready ? "text-[#72827c]" : "text-amber-700"}`}>{source.message}</p></div></div><span className="rounded-full bg-white px-3 py-2 text-[8px] font-bold text-[#54716e]">Read-only · zero automatic actions</span></div></section><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Kpi helper="Existing product records" labelText="Total SKUs" value={String(summary.totalSkus)}/><Kpi helper="Sales evidence in last 90 days" labelText="Observed demand" toneName={source.ready ? "good" : "warn"} value={String(summary.observedDemandSkus)}/><Kpi helper="Cover at/below default lead time" labelText="Urgent" toneName={summary.urgent ? "warn" : "good"} value={String(summary.urgent)}/><Kpi helper="Positive evidence-based quantity" labelText="Reorder candidates" toneName={summary.reorderCandidates ? "warn" : "good"} value={String(summary.reorderCandidates)}/><Kpi helper="No observed 90-day demand" labelText="No history" value={String(summary.noHistory)}/></section>{error ? <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[9px] font-bold text-rose-700"><span className="flex items-center gap-2"><Icon name="alert"/>{error}</span><button className="underline" onClick={() => void load()} type="button">Try again</button></div> : null}<section className="grid min-h-[650px] gap-3 xl:grid-cols-[minmax(0,1.25fr)_390px]"><div className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white"><div className="border-b border-[#e7ece9] p-4"><div className="flex flex-col gap-3"><label className="relative h-10"><span className="pointer-events-none absolute left-3 top-3 text-[#8a9590]"><Icon name="search"/></span><input className="h-10 w-full rounded-xl border border-[#dfe6e3] pl-9 pr-3 text-[9px] font-semibold outline-none focus:border-[#759493]" onChange={(event) => setQuery(event.target.value)} placeholder="Search product, SKU, brand or category..." value={query}/></label><div className="flex flex-wrap gap-2">{(["all", "urgent", "review", "watch", "stable", "no_history"] as Filter[]).map((item) => <button className={`h-9 rounded-xl px-3 text-[8px] font-bold ${filter === item ? "bg-[#426d72] text-white" : "bg-[#f2f5f3] text-[#697770]"}`} key={item} onClick={() => setFilter(item)} type="button">{item === "all" ? "All" : label(item)}</button>)}</div></div></div>{loading ? <div className="p-12 text-center text-[9px] font-bold text-[#839089]">Calculating real inventory evidence...</div> : visible.length ? <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-[#fafbfa] text-[7.5px] font-extrabold uppercase tracking-[.1em] text-[#84908a]"><tr><th className="px-4 py-3.5">Product</th><th className="px-3 py-3.5">On hand</th><th className="px-3 py-3.5">Sold 30D</th><th className="px-3 py-3.5">Sold 90D</th><th className="px-3 py-3.5">Daily velocity</th><th className="px-3 py-3.5">Days cover</th><th className="px-3 py-3.5">Suggested</th><th className="px-4 py-3.5">Priority</th></tr></thead><tbody className="divide-y divide-[#edf0ee]">{visible.map((item) => <tr className={`cursor-pointer text-[8.5px] ${selected?.id === item.id ? "bg-[#f2f7f5]" : "hover:bg-[#fafcfb]"}`} key={item.id} onClick={() => setSelectedId(item.id)}><td className="px-4 py-3.5"><b className="block max-w-[280px] truncate text-[9px] text-[#35443d]">{item.name}</b><small className="mt-1 block text-[7px] text-[#909b95]">{item.sku || `Product #${item.id}`} · {item.brand || "Brand not set"}</small></td><td className="px-3 py-3.5 font-bold text-[#405049]">{item.onHand}</td><td className="px-3 py-3.5 font-bold text-[#405049]">{item.sold30d}</td><td className="px-3 py-3.5 text-[#65736c]">{item.sold90d}</td><td className="px-3 py-3.5 text-[#65736c]">{item.dailyVelocity.toFixed(2)}</td><td className="px-3 py-3.5 font-bold text-[#405049]">{item.daysCover === null ? "—" : `${item.daysCover}d`}</td><td className="px-3 py-3.5 font-bold text-[#405049]">{item.recommendedQuantity || "—"}</td><td className="px-4 py-3.5"><span className={`rounded-full px-2 py-1 text-[6.5px] font-bold ring-1 ring-inset ${tone(item.priority)}`}>{label(item.priority)}</span></td></tr>)}</tbody></table></div> : <div className="flex min-h-[420px] items-center justify-center text-center"><div><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3f4] text-[#426d72]"><Icon name="box" size={20}/></span><h2 className="mt-3 text-[13px] font-bold text-[#34443d]">No matching evidence row</h2><p className="mt-1 text-[8.5px] text-[#85918b]">Clear the search or priority filter.</p></div></div>}</div><aside className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">{selected ? <><div className="border-b border-[#e7ece9] p-5"><p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-[#7d8983]">Planning inspector</p><h2 className="mt-1.5 text-[17px] font-bold leading-6 text-[#26362f]">{selected.name}</h2><p className="mt-1 text-[7.5px] text-[#87928d]">{selected.sku || `Product #${selected.id}`} · {selected.category || "No category"}</p></div><div className="space-y-4 p-5"><div className="flex h-36 items-center justify-center rounded-2xl bg-[#eef4f2] text-[#426d72]" style={productImageUrl(selected.image) ? { backgroundImage: `url(${productImageUrl(selected.image)})`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "contain" } : undefined}>{!productImageUrl(selected.image) ? <Icon name="box" size={28}/> : null}</div><div className="grid grid-cols-2 gap-2">{[["On hand", selected.onHand], ["30-day sold", selected.sold30d], ["Days cover", selected.daysCover === null ? "—" : `${selected.daysCover} days`], ["Suggested", selected.recommendedQuantity || "None"]].map(([itemLabel, value]) => <div className="rounded-xl border border-[#e2e8e5] p-3" key={itemLabel}><span className="text-[6.5px] font-bold uppercase tracking-[.08em] text-[#929d97]">{itemLabel}</span><b className="mt-1.5 block truncate text-[8.5px] text-[#405049]">{value}</b></div>)}</div><div className="rounded-xl bg-[#edf3f4] p-4"><div className="flex items-center gap-2"><Icon name="clock"/><b className="text-[8px] text-[#405b58]">Why this priority</b></div><p className="mt-2 text-[7px] leading-4 text-[#72857f]">{selected.velocityBasis}. Default planning assumes {selected.leadTimeDays} lead-time days plus {selected.safetyDays} safety days. Current result: <b>{label(selected.priority)}</b>.</p></div><button className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#426d72] text-[9px] font-bold text-white" onClick={() => onNavigate("Inventory")} type="button"><Icon name="box"/>Open live inventory</button><button className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#dce4e0] text-[8.5px] font-bold text-[#5f7068]" onClick={() => onNavigate("Purchase Stock Entry")} type="button"><Icon name="chart"/>Open purchasing</button><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[7px] leading-4 text-amber-800"><b>No automatic purchase:</b> this recommendation is evidence only. Supplier, cash, lead time and approval must be verified by a person.</div></div></> : <div className="p-10 text-center text-[9px] font-bold text-[#829089]">Select an evidence row</div>}</aside></section><section className="grid gap-3 lg:grid-cols-2"><article className="rounded-2xl border border-[#e2e8e5] bg-white p-4"><p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#84908a]">Planning assumptions</p><b className="mt-1 block text-[12px] text-[#33423b]">{policy.leadTimeDays} days lead time + {policy.safetyDays} days safety = {policy.targetCoverDays} days target</b><p className="mt-3 text-[7.5px] leading-4 text-[#87928d]">These are visible conservative defaults, not hidden AI settings. Purchase Stock Entry remains the owner of supplier-specific lead time and approval.</p></article><article className="rounded-2xl border border-[#d6e2df] bg-[#edf3f4] p-4"><p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#5d7775]">Evidence freshness</p><b className="mt-1 block text-[12px] text-[#304d4d]">Generated {dateText(generatedAt)}</b><p className="mt-3 text-[7.5px] leading-4 text-[#647b77]">{source.statusGuarded ? "Only confirmed-to-delivered order states are included." : "Order-status filtering is unavailable; interpret demand conservatively."} Refresh recalculates without writing any record.</p></article></section></div>;
}
