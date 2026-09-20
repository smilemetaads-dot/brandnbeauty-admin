"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { getCatalogProducts, type CatalogProduct } from "@/features/products/products-client";
import {
  changeRecommendationStatus,
  fetchRecommendationsState,
  saveRecommendationDraft,
  type LiveRecommendation,
  type RecommendationDraftInput,
  type RecommendationEffectiveStatus,
  type RecommendationFallback,
  type RecommendationMethod,
  type RecommendationStrategy,
  type RecommendationSurface,
  type RecommendationsState,
} from "./recommendations-client";

type Filter = "all" | "active" | "scheduled" | "draft" | "paused" | "review";
type StatusAction = "publish" | "pause" | "archive";
type IconName = "alert" | "check" | "link" | "pause" | "plus" | "refresh" | "search" | "spark" | "store";

const iconPaths: Record<IconName, ReactNode> = {
  alert: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>,
  pause: <><path d="M9 5v14M15 5v14"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  spark: <><path d="m12 3-1.8 4.2L6 9l4.2 1.8L12 15l1.8-4.2L18 9l-4.2-1.8L12 3Z"/><path d="m19 15-.9 2.1L16 18l2.1.9L19 21l.9-2.1L22 18l-2.1-.9L19 15Z"/></>,
  store: <><path d="M3 9 5 3h14l2 6"/><path d="M5 13v8h14v-8M9 21v-6h6v6"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/></>,
};

function Icon({ name, size = 15 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{iconPaths[name]}</svg>;
}

const emptyState: RecommendationsState = {
  generatedAt: "",
  recommendations: [],
  summary: { activeNow: 0, archived: 0, drafts: 0, needsReview: 0, paused: 0, scheduled: 0, total: 0 },
};

const emptyDraft: RecommendationDraftInput = {
  endsAt: "",
  fallbackMode: "hide_block",
  id: "",
  method: "manual",
  name: "",
  notes: "",
  priority: 100,
  sourceProductId: "",
  startsAt: "",
  strategy: "complete_routine",
  surfaces: ["product_page"],
  targetProductIds: [],
};

const strategyLabel: Record<RecommendationStrategy, string> = {
  best_sellers: "Best sellers",
  complete_routine: "Complete the routine",
  frequently_bought_together: "Frequently bought together",
  new_arrivals: "New arrivals",
  similar_alternative: "Similar alternative",
  upgrade: "Upgrade",
};

const surfaceLabel: Record<RecommendationSurface, string> = {
  cart: "Cart",
  homepage: "Homepage",
  product_page: "Product page",
  search_no_result: "Search no-result",
};

const statusLabel: Record<RecommendationEffectiveStatus, string> = {
  active: "Active now",
  archived: "Archived",
  draft: "Draft",
  expired: "Expired",
  paused: "Paused",
  scheduled: "Scheduled",
};

const statusTone: Record<RecommendationEffectiveStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  archived: "bg-slate-100 text-slate-500 ring-slate-200",
  draft: "bg-[#edf3f4] text-[#4f706d] ring-[#cfddda]",
  expired: "bg-rose-50 text-rose-700 ring-rose-200",
  paused: "bg-amber-50 text-amber-700 ring-amber-200",
  scheduled: "bg-sky-50 text-sky-700 ring-sky-200",
};

function dateInput(value: string) {
  return value ? value.slice(0, 16).replace(" ", "T") : "";
}

function dateLabel(value: string) {
  if (!value) return "Always on";
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-US", { day: "numeric", hour: "numeric", minute: "2-digit", month: "short", year: "numeric" });
}

function sourceRequired(strategy: RecommendationStrategy) {
  return strategy !== "best_sellers" && strategy !== "new_arrivals";
}

function toDraft(item: LiveRecommendation): RecommendationDraftInput {
  return {
    endsAt: dateInput(item.endsAt),
    fallbackMode: item.fallbackMode,
    id: item.id,
    method: item.method,
    name: item.name,
    notes: item.notes,
    priority: item.priority,
    sourceProductId: item.sourceProductId,
    startsAt: dateInput(item.startsAt),
    strategy: item.strategy,
    surfaces: item.surfaces,
    targetProductIds: item.targetProductIds,
  };
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-[7px] font-extrabold uppercase tracking-[.1em] text-[#74817b]">{label}</span>{children}</label>;
}

const inputClass = "h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[9px] font-semibold text-[#405049] outline-none focus:border-[#8eaaa6]";

function RecommendationModal({ draft, products, saving, onChange, onClose, onSave }: {
  draft: RecommendationDraftInput;
  products: CatalogProduct[];
  saving: boolean;
  onChange: (updates: Partial<RecommendationDraftInput>) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const [query, setQuery] = useState("");
  const visibleProducts = products.filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase())).slice(0, 100);
  const invalidDates = Boolean(draft.startsAt && draft.endsAt && new Date(draft.endsAt).getTime() <= new Date(draft.startsAt).getTime());
  const complete = draft.name.trim() && draft.targetProductIds.length && draft.surfaces.length && (!sourceRequired(draft.strategy) || draft.sourceProductId) && !invalidDates;

  return <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#17231f]/40 p-3 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.25)]">
      <header className="sticky top-0 z-10 flex items-start justify-between border-b border-[#e8ecea] bg-white/95 p-5 backdrop-blur"><div><p className="text-[8px] font-extrabold uppercase tracking-[.15em] text-[#426d72]">Recoverable merchandising draft</p><h2 className="mt-1.5 text-[18px] font-bold text-[#23322b]">{draft.id ? "Edit recommendation draft" : "New recommendation draft"}</h2><p className="mt-1 text-[7.5px] text-[#87928d]">Saving never changes products, prices, stock, carts or customer history.</p></div><button className="h-9 rounded-xl border border-[#dfe6e3] px-3 text-[8px] font-bold text-[#6d7973]" onClick={onClose} type="button">Close</button></header>
      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Set name *"><input className={inputClass} onChange={(event) => onChange({ name: event.target.value })} placeholder="Internal recommendation name" value={draft.name}/></Field><Field label="Priority"><input className={inputClass} max="9999" min="1" onChange={(event) => onChange({ priority: Math.max(1, Number(event.target.value) || 1) })} type="number" value={draft.priority}/></Field></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Strategy"><select className={inputClass} onChange={(event) => onChange({ sourceProductId: "", strategy: event.target.value as RecommendationStrategy })} value={draft.strategy}>{(Object.keys(strategyLabel) as RecommendationStrategy[]).map((strategy) => <option key={strategy} value={strategy}>{strategyLabel[strategy]}</option>)}</select></Field><Field label="Method"><select className={inputClass} onChange={(event) => onChange({ method: event.target.value as RecommendationMethod })} value={draft.method}><option value="manual">Manual</option><option value="rule_assisted">Rule-assisted</option></select></Field></div>
          <div className="rounded-2xl border border-[#e2e8e5] p-4"><p className="text-[7px] font-extrabold uppercase tracking-[.12em] text-[#84908a]">Source product</p><p className="mt-1 text-[7px] text-[#8a9690]">{sourceRequired(draft.strategy) ? "Required for this product-specific strategy." : "Optional for this catalog-wide strategy."}</p><select className={`${inputClass} mt-3`} onChange={(event) => onChange({ sourceProductId: event.target.value, targetProductIds: draft.targetProductIds.filter((id) => id !== event.target.value) })} value={draft.sourceProductId}><option value="">{sourceRequired(draft.strategy) ? "Choose a live catalog product" : "Catalog-wide source"}</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}{product.sku ? ` · ${product.sku}` : ""}</option>)}</select></div>
          <div className="rounded-2xl border border-[#e2e8e5] p-4"><div className="flex items-end justify-between gap-3"><div><p className="text-[7px] font-extrabold uppercase tracking-[.12em] text-[#84908a]">Recommended products *</p><p className="mt-1 text-[7px] text-[#8a9690]">Select real catalog targets. Source and target cannot be the same.</p></div><span className="text-[8px] font-bold text-[#426d72]">{draft.targetProductIds.length} selected</span></div><input className={`${inputClass} mt-3`} onChange={(event) => setQuery(event.target.value)} placeholder="Search live catalog..." value={query}/><div className="mt-3 max-h-60 overflow-y-auto rounded-xl border border-[#e3e9e6]">{visibleProducts.filter((product) => product.id !== draft.sourceProductId).map((product) => <label className="flex cursor-pointer items-center justify-between gap-3 border-b border-[#edf1ef] px-3 py-2.5 last:border-b-0" key={product.id}><span><b className="block text-[8px] text-[#405049]">{product.name}</b><small className="mt-1 block text-[6.5px] text-[#929d97]">{product.sku || `Product #${product.id}`} · stock {product.stock} · {product.status}</small></span><input checked={draft.targetProductIds.includes(product.id)} className="h-4 w-4 accent-[#3b646d]" onChange={(event) => onChange({ targetProductIds: event.target.checked ? [...draft.targetProductIds, product.id] : draft.targetProductIds.filter((id) => id !== product.id) })} type="checkbox"/></label>)}{!visibleProducts.length ? <p className="p-4 text-center text-[7px] text-[#8b9691]">No catalog product matches this search.</p> : null}</div></div>
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#e2e8e5] p-4"><p className="text-[7px] font-extrabold uppercase tracking-[.12em] text-[#84908a]">Storefront surfaces *</p><div className="mt-3 grid grid-cols-2 gap-2">{(["product_page", "cart", "homepage", "search_no_result"] as RecommendationSurface[]).map((surface) => <label className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-[7px] font-bold ${draft.surfaces.includes(surface) ? "border-[#9fb8b5] bg-[#edf3f4] text-[#426d72]" : "border-[#dfe6e3] text-[#75827c]"}`} key={surface}><input checked={draft.surfaces.includes(surface)} className="accent-[#426d72]" onChange={(event) => onChange({ surfaces: event.target.checked ? [...draft.surfaces, surface] : draft.surfaces.filter((item) => item !== surface) })} type="checkbox"/>{surfaceLabel[surface]}</label>)}</div></div>
          <div className="rounded-2xl border border-[#e2e8e5] p-4"><Field label="Unavailable target fallback"><select className={inputClass} onChange={(event) => onChange({ fallbackMode: event.target.value as RecommendationFallback })} value={draft.fallbackMode}><option value="hide_block">Hide unavailable item/block</option><option value="best_in_stock">Use next linked in-stock target</option></select></Field><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Starts"><input className={inputClass} onChange={(event) => onChange({ startsAt: event.target.value })} type="datetime-local" value={draft.startsAt}/></Field><Field label="Ends"><input className={inputClass} onChange={(event) => onChange({ endsAt: event.target.value })} type="datetime-local" value={draft.endsAt}/></Field></div>{invalidDates ? <p className="mt-2 text-[7px] font-bold text-rose-700">End time must be later than the start time.</p> : null}</div>
          <Field label="Internal notes"><textarea className="min-h-28 w-full resize-none rounded-xl border border-[#dce4e0] p-3 text-[9px] font-medium leading-5 text-[#405049] outline-none focus:border-[#8eaaa6]" onChange={(event) => onChange({ notes: event.target.value })} placeholder="Evidence, rationale or review notes" value={draft.notes}/></Field>
          <div className="rounded-xl border border-[#d5e2df] bg-[#edf3f4] p-4"><b className="text-[8px] text-[#405b58]">Draft-only safety</b><p className="mt-2 text-[7px] leading-4 text-[#70837f]">A separate human-confirmed publish step is required. No cart item is ever inserted automatically.</p></div>
        </aside>
      </div>
      <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-[#e8ecea] bg-white/95 p-4 backdrop-blur sm:flex-row sm:justify-end"><button className="h-10 rounded-xl border border-[#dce4e0] px-4 text-[8px] font-bold text-[#65736c]" onClick={onClose} type="button">Cancel</button><button className="h-10 rounded-xl bg-[#426d72] px-5 text-[8px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={!complete || saving} onClick={onSave} type="button">{saving ? "Saving..." : "Save recoverable draft"}</button></footer>
    </section>
  </div>;
}

function StatusModal({ action, item, saving, onAction, onClose }: { action: StatusAction; item: LiveRecommendation; saving: boolean; onAction: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const blockers = action === "publish" ? item.readiness.blockers : [];
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#17231f]/40 p-3 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"><header className="border-b border-[#e8ecea] p-5"><p className="text-[8px] font-extrabold uppercase tracking-[.14em] text-[#426d72]">Human confirmation</p><h2 className="mt-1.5 text-[17px] font-bold capitalize text-[#23322b]">{action} recommendation set</h2><p className="mt-1 text-[7.5px] text-[#87928d]">{item.name}</p></header><div className="space-y-4 p-5">{blockers.length ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><b className="text-[8px] text-amber-800">Publication is blocked</b><ul className="mt-2 space-y-1 text-[7px] text-amber-700">{blockers.map((blocker) => <li key={blocker}>• {blocker}</li>)}</ul></div> : null}<Field label="Audit reason *"><textarea className="min-h-24 w-full rounded-xl border border-[#dce4e0] p-3 text-[9px] outline-none" onChange={(event) => setReason(event.target.value)} placeholder="Why is this status change intended?" value={reason}/></Field><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e2e8e5] p-4"><input checked={confirmed} className="mt-0.5 h-4 w-4 accent-[#426d72]" onChange={(event) => setConfirmed(event.target.checked)} type="checkbox"/><span><b className="block text-[8px] text-[#405b58]">I reviewed the real product links, stock status, surfaces and schedule</b><small className="mt-1 block text-[7px] leading-4 text-[#87928d]">This action creates append-only evidence. It never changes product, stock, price, cart, order or customer records.</small></span></label></div><footer className="flex justify-end gap-2 border-t border-[#e8ecea] p-4"><button className="h-10 rounded-xl border border-[#dce4e0] px-4 text-[8px] font-bold text-[#65736c]" onClick={onClose} type="button">Cancel</button><button className="h-10 rounded-xl bg-[#426d72] px-5 text-[8px] font-bold capitalize text-white disabled:opacity-40" disabled={!confirmed || !reason.trim() || blockers.length > 0 || saving} onClick={() => onAction(reason)} type="button">{saving ? "Recording..." : action}</button></footer></section></div>;
}

export function LiveProductRecommendationsWorkspace({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [state, setState] = useState<RecommendationsState>(emptyState);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [focusedId, setFocusedId] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [notice, setNotice] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<RecommendationDraftInput>({ ...emptyDraft });
  const [pendingAction, setPendingAction] = useState<StatusAction | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setError(""); setWarning("");
    const [recommendationsResult, productsResult] = await Promise.allSettled([fetchRecommendationsState(signal), getCatalogProducts(signal)]);
    if (recommendationsResult.status === "rejected") {
      if (!(recommendationsResult.reason instanceof DOMException && recommendationsResult.reason.name === "AbortError")) setError(recommendationsResult.reason instanceof Error ? recommendationsResult.reason.message : "Product Recommendations is temporarily unavailable.");
    } else {
      setState(recommendationsResult.value);
      setFocusedId((current) => current && recommendationsResult.value.recommendations.some((item) => item.id === current) ? current : recommendationsResult.value.recommendations[0]?.id ?? "");
    }
    if (productsResult.status === "rejected") {
      if (!(productsResult.reason instanceof DOMException && productsResult.reason.name === "AbortError")) setWarning("Recommendations loaded, but the product selector is temporarily unavailable.");
    } else setProducts(productsResult.value.products);
    if (!signal?.aborted) setLoading(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => void load(controller.signal));
    return () => controller.abort();
  }, [load]);

  const recommendations = useMemo(() => state.recommendations.filter((item) => {
    const matchesQuery = `${item.name} ${item.sourceProduct?.name ?? ""} ${item.targetProducts.map((product) => product.name).join(" ")}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "active" && item.effectiveStatus === "active") || (filter === "scheduled" && item.effectiveStatus === "scheduled") || (filter === "draft" && item.status === "draft") || (filter === "paused" && item.status === "paused") || (filter === "review" && !item.readiness.ready);
    return matchesQuery && matchesFilter && item.status !== "archived";
  }).sort((a, b) => a.priority - b.priority), [filter, query, state.recommendations]);
  const focused = state.recommendations.find((item) => item.id === focusedId) ?? recommendations[0] ?? null;
  const showNotice = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2800); };

  const saveDraft = async () => {
    setSaving(true); setError("");
    try {
      const next = await saveRecommendationDraft(draft);
      setState(next); setEditorOpen(false);
      const selected = next.recommendations.find((item) => item.name === draft.name) ?? next.recommendations[0];
      setFocusedId(selected?.id ?? "");
      showNotice("Recommendation draft saved. No product, cart or order record changed.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Recommendation draft could not be saved."); }
    finally { setSaving(false); }
  };

  const applyStatus = async (reason: string) => {
    if (!focused || !pendingAction) return;
    setSaving(true); setError("");
    try {
      const next = await changeRecommendationStatus(focused.id, pendingAction, reason);
      setState(next); setPendingAction(null); showNotice(`Recommendation ${pendingAction} action recorded with audit evidence.`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Recommendation status could not be changed."); }
    finally { setSaving(false); }
  };

  const cards = [
    ["Total sets", state.summary.total, "Real recommendation records", "link" as IconName],
    ["Active now", state.summary.activeNow, "Public feed eligible", "check" as IconName],
    ["Scheduled", state.summary.scheduled, "Starts in the future", "spark" as IconName],
    ["Drafts", state.summary.drafts, "Internal work in progress", "link" as IconName],
    ["Needs review", state.summary.needsReview, "Product or safety blocker", "alert" as IconName],
  ] as const;
  const filters: [Filter, string, number][] = [["all", "All", state.summary.total], ["active", "Active", state.summary.activeNow], ["scheduled", "Scheduled", state.summary.scheduled], ["draft", "Draft", state.summary.drafts], ["paused", "Paused", state.summary.paused], ["review", "Review", state.summary.needsReview]];

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="flex items-center gap-2 text-[8.5px] font-extrabold uppercase tracking-[.18em] text-[#547874]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Live merchandising links</p><h1 className="mt-2 text-[26px] font-bold tracking-[-.045em] text-[#17231f]">Product recommendations command center</h1><p className="mt-1.5 max-w-3xl text-[10px] font-medium text-[#74817b]">Connect real source and target products through recoverable drafts, then publish only after a separate human safety review.</p></div><div className="flex flex-wrap gap-2"><button className="inline-flex items-center gap-2 rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[9px] font-bold text-[#62706a] disabled:opacity-50" disabled={loading} onClick={() => { setLoading(true); void load(); }} type="button"><Icon name="refresh"/>Refresh</button><button className="inline-flex items-center gap-2 rounded-xl bg-[#426d72] px-4 py-2.5 text-[9px] font-bold text-white" onClick={() => { setDraft({ ...emptyDraft }); setEditorOpen(true); }} type="button"><Icon name="plus"/>New recommendation draft</button></div></header>
    <section className="flex flex-col gap-3 rounded-2xl border border-[#d9e5e3] bg-[#edf6f6] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#426d72]"><Icon name="link" size={18}/></span><div><b className="text-[8px] text-[#3d625f]">Recommendation sets + real product links · MySQL connected</b><p className="mt-1 text-[6.5px] text-[#758781]">Public feed contains only human-published, current sets with eligible in-stock targets.</p></div></div><span className="self-start rounded-full bg-white px-3 py-2 text-[6.5px] font-bold text-[#54716c] sm:self-auto">Draft → safety review → public feed</span></section>
    {error ? <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[8px] font-bold text-rose-700"><span>{error}</span><button className="underline" onClick={() => { setLoading(true); void load(); }} type="button">Try again</button></div> : null}{warning ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[8px] font-bold text-amber-700">{warning}</div> : null}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, detail, icon]) => <article className="rounded-2xl border border-[#dfe6e3] bg-white p-4" key={label}><div className="flex items-start justify-between"><div><p className="text-[7px] font-extrabold uppercase tracking-[.12em] text-[#7c8983]">{label}</p><b className="mt-2 block text-[20px] tracking-[-.04em] text-[#17231f]">{value}</b></div><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${icon === "alert" && value ? "bg-amber-50 text-amber-700" : "bg-[#edf3f4] text-[#426d72]"}`}><Icon name={icon}/></span></div><p className="mt-4 border-t border-[#edf0ee] pt-3 text-[6.5px] text-[#84908a]">{detail}</p></article>)}</section>
    <section className="grid min-h-[660px] gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
      <article className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white"><div className="border-b border-[#e8ecea] p-4"><label className="relative block"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#93a09a]"><Icon name="search"/></span><input className="h-11 w-full rounded-xl border border-[#dfe6e3] pl-10 pr-3 text-[9.5px] font-semibold outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Search set, source or recommended product..." value={query}/></label><div className="mt-3 flex flex-wrap gap-2">{filters.map(([key, label, count]) => <button className={`rounded-lg px-3 py-2 text-[8px] font-bold ${filter === key ? "bg-[#426d72] text-white" : "bg-[#f2f5f3] text-[#6f7c76]"}`} key={key} onClick={() => setFilter(key)} type="button">{label} {count}</button>)}</div></div>
        {loading && !state.recommendations.length ? <div className="flex min-h-[520px] items-center justify-center text-[9px] font-bold text-[#84908a]">Loading real recommendation records...</div> : recommendations.length ? <div className="divide-y divide-[#edf0ee]">{recommendations.map((item) => <button className={`grid w-full gap-3 p-4 text-left hover:bg-[#fafbfa] sm:grid-cols-[minmax(0,1.25fr)_minmax(130px,.7fr)_minmax(90px,.45fr)_auto] sm:items-center ${focused?.id === item.id ? "bg-[#f3f7f5]" : ""}`} key={item.id} onClick={() => setFocusedId(item.id)} type="button"><div><div className="flex flex-wrap items-center gap-2"><b className="text-[9px] text-[#405049]">{item.name}</b><span className={`rounded-full px-2 py-1 text-[6px] font-bold ring-1 ring-inset ${statusTone[item.effectiveStatus]}`}>{statusLabel[item.effectiveStatus]}</span></div><p className="mt-1.5 text-[6.5px] text-[#8b9691]">{strategyLabel[item.strategy]} · priority {item.priority}</p></div><div><span className="block text-[6px] uppercase tracking-[.08em] text-[#929d97]">Source</span><b className="mt-1 block truncate text-[8px] text-[#405049]">{item.sourceProduct?.name || "Catalog-wide"}</b></div><div><span className="block text-[6px] uppercase tracking-[.08em] text-[#929d97]">Targets</span><b className="mt-1 block text-[8px] text-[#405049]">{item.targetProductIds.length}</b></div><span className="text-[8px] font-bold text-[#426d72]">Inspect →</span></button>)}</div> : <div className="flex min-h-[520px] flex-col items-center justify-center px-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3f4] text-[#426d72]"><Icon name="link" size={19}/></span><b className="mt-4 text-[10px] text-[#34433d]">No recommendation record found</b><p className="mt-1.5 text-[7px] text-[#8b9691]">Create a real draft only when a useful product relationship is intended.</p><button className="mt-4 rounded-xl bg-[#426d72] px-4 py-2.5 text-[8px] font-bold text-white" onClick={() => { setDraft({ ...emptyDraft }); setEditorOpen(true); }} type="button">New recommendation draft</button></div>}
      </article>
      <aside className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">{focused ? <><div className="border-b border-[#e8ecea] p-5"><p className="text-[7px] font-extrabold uppercase tracking-[.12em] text-[#7d8983]">Recommendation inspector</p><div className="mt-2 flex flex-wrap items-center gap-2"><h2 className="text-[15px] font-bold text-[#26362f]">{focused.name}</h2><span className={`rounded-full px-2 py-1 text-[6px] font-bold ring-1 ring-inset ${statusTone[focused.effectiveStatus]}`}>{statusLabel[focused.effectiveStatus]}</span></div><p className="mt-1.5 text-[7px] text-[#8a9690]">{strategyLabel[focused.strategy]} · {focused.method === "rule_assisted" ? "Rule-assisted" : "Manual"}</p></div><div className="space-y-4 p-5"><div className="grid grid-cols-2 gap-3">{[["Priority", focused.priority], ["Targets", focused.targetProductIds.length], ["Surfaces", focused.surfaces.length], ["Fallback", focused.fallbackMode === "best_in_stock" ? "Next in stock" : "Hide safely"]].map(([label, value]) => <div className="rounded-xl border border-[#e3e9e6] p-3" key={label}><span className="text-[6px] font-bold uppercase tracking-[.08em] text-[#929d97]">{label}</span><b className="mt-1.5 block text-[8.5px] text-[#405049]">{value}</b></div>)}</div><div className="rounded-xl bg-[#f5f8f6] p-4"><p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#7d8983]">Source product</p><b className="mt-2 block text-[8.5px] text-[#405049]">{focused.sourceProduct?.name || "Catalog-wide rule"}</b><p className="mt-2 text-[7px] text-[#84908a]">{focused.sourceProduct?.sku || "No individual source product"}</p></div><div><span className="text-[6px] font-bold uppercase text-[#929d97]">Recommended products</span><div className="mt-2 space-y-2">{focused.targetProducts.map((product) => <div className="flex items-center justify-between rounded-xl border border-[#e3e9e6] px-3 py-2.5" key={product.id}><div><b className="block text-[8px] text-[#405049]">{product.name}</b><small className="mt-1 block text-[6.5px] text-[#929d97]">{product.sku || `Product #${product.id}`}</small></div><span className={`rounded-full px-2 py-1 text-[6px] font-bold ${product.status === "active" && product.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>Stock {product.stock}</span></div>)}</div></div><div><span className="text-[6px] font-bold uppercase text-[#929d97]">Surfaces</span><div className="mt-2 flex flex-wrap gap-1.5">{focused.surfaces.map((surface) => <span className="rounded-full bg-[#edf3f4] px-2 py-1 text-[6.5px] font-bold text-[#4f706d]" key={surface}>{surfaceLabel[surface]}</span>)}</div></div><div className="grid grid-cols-2 gap-3"><div><span className="text-[6px] font-bold uppercase text-[#929d97]">Starts</span><b className="mt-1 block text-[7.5px] text-[#405049]">{dateLabel(focused.startsAt)}</b></div><div><span className="text-[6px] font-bold uppercase text-[#929d97]">Ends</span><b className="mt-1 block text-[7.5px] text-[#405049]">{dateLabel(focused.endsAt)}</b></div></div>{focused.readiness.ready ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex items-center gap-2 text-emerald-800"><Icon name="check"/><b className="text-[8px]">Publication requirements complete</b></div><p className="mt-2 text-[7px] leading-4 text-emerald-700">A human still needs to confirm publication and write an audit reason.</p></div> : <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2 text-amber-800"><Icon name="alert"/><b className="text-[8px]">Needs review</b></div><ul className="mt-2 space-y-1 text-[7px] text-amber-700">{focused.readiness.blockers.map((blocker) => <li key={blocker}>• {blocker}</li>)}</ul></div>}<div className="grid gap-2 sm:grid-cols-2"><button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#426d72] text-[8px] font-bold text-white disabled:opacity-40" disabled={focused.status === "active" || focused.status === "archived"} onClick={() => setPendingAction("publish")} type="button"><Icon name="store"/>Publish</button><button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dce4e0] text-[8px] font-bold text-[#66746e] disabled:opacity-40" disabled={focused.status === "active" || focused.status === "archived"} onClick={() => { setDraft(toDraft(focused)); setEditorOpen(true); }} type="button">Edit draft</button><button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-200 text-[8px] font-bold text-amber-700 disabled:opacity-40" disabled={focused.status !== "active"} onClick={() => setPendingAction("pause")} type="button"><Icon name="pause"/>Pause</button><button className="h-10 rounded-xl border border-rose-200 text-[8px] font-bold text-rose-700 disabled:opacity-40" disabled={focused.status === "active" || focused.status === "archived"} onClick={() => setPendingAction("archive")} type="button">Archive</button></div><button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#dce4e0] py-3 text-[8px] font-bold text-[#426d72]" onClick={() => onNavigate("Products")} type="button"><Icon name="store"/>Open live product catalog</button><div className="rounded-xl bg-[#edf3f4] p-4"><b className="text-[8px] text-[#405b58]">Customer safety boundary</b><p className="mt-2 text-[7px] leading-4 text-[#70837f]">The feed may display approved links. It never inserts cart items, changes prices, reserves stock or records customer behavior.</p></div></div></> : <div className="flex min-h-[650px] flex-col items-center justify-center px-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3f4] text-[#426d72]"><Icon name="link" size={19}/></span><b className="mt-4 text-[10px] text-[#34433d]">Select a recommendation</b><p className="mt-1.5 text-[7px] text-[#8b9691]">Choose a real draft or create the first one.</p></div>}</aside>
    </section>
    <section className="grid gap-3 lg:grid-cols-3"><article className="rounded-2xl border border-[#dfe6e3] bg-white p-4"><p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#84908a]">Source of truth</p><b className="mt-2 block text-[9px] text-[#405049]">MySQL sets and product links</b><p className="mt-2 text-[7px] leading-4 text-[#87928d]">No browser-only recommendation records and no seeded pairings.</p></article><article className="rounded-2xl border border-[#dfe6e3] bg-white p-4"><p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#84908a]">Controlled release</p><b className="mt-2 block text-[9px] text-[#405049]">Draft and publish stay separate</b><p className="mt-2 text-[7px] leading-4 text-[#87928d]">Publishing requires human confirmation and append-only evidence.</p></article><article className="rounded-2xl border border-[#d5e2df] bg-[#edf3f4] p-4"><p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#5e7875]">Safety boundary</p><b className="mt-2 block text-[9px] text-[#304d4d]">Zero automatic cart mutation</b><p className="mt-2 text-[7px] leading-4 text-[#647b77]">Recommendations cannot change products, prices, stock, orders or customers.</p></article></section>
    {editorOpen ? <RecommendationModal draft={draft} onChange={(updates) => setDraft((current) => ({ ...current, ...updates }))} onClose={() => setEditorOpen(false)} onSave={() => void saveDraft()} products={products} saving={saving}/> : null}
    {pendingAction && focused ? <StatusModal action={pendingAction} item={focused} onAction={(reason) => void applyStatus(reason)} onClose={() => setPendingAction(null)} saving={saving}/> : null}
    {notice ? <div className="fixed bottom-5 right-5 z-[110] max-w-sm rounded-xl bg-[#223c3f] px-4 py-3 text-[9px] font-semibold leading-5 text-white shadow-xl">{notice}</div> : null}
  </div>;
}
