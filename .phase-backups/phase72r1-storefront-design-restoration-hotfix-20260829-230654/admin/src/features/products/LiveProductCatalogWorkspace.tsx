"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  archiveCatalogProduct,
  discardProductDraft,
  emptyCatalogProduct,
  getCatalogProduct,
  getCatalogProducts,
  productImageUrl,
  publishProductDraft,
  saveProductDraft,
  uploadProductImage,
  type CatalogProduct,
  type CatalogSummary,
  type ProductStatus,
} from "@/features/products/products-client";

type IconName = "alert" | "box" | "check" | "close" | "edit" | "image" | "plus" | "refresh" | "save" | "search" | "trash" | "upload";
type CatalogFilter = "all" | ProductStatus | "low_stock" | "has_draft";

const EDIT_PRODUCT_KEY = "bnb-product-editor-id";
const emptySummary: CatalogSummary = { active: 0, drafts: 0, lowStock: 0, outOfStock: 0, total: 0 };

const iconPaths: Record<IconName, ReactNode> = {
  alert: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  box: <><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></>,
  save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5"/></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 21h14"/></>,
};

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{iconPaths[name]}</svg>;
}

function money(value: number) {
  return `৳${new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(value)}`;
}

function dateText(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function statusLabel(value: ProductStatus) {
  return value === "out_of_stock" ? "Out of stock" : value.charAt(0).toUpperCase() + value.slice(1);
}

function statusTone(value: ProductStatus) {
  if (value === "active") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (value === "archived") return "bg-rose-50 text-rose-700 ring-rose-200";
  if (value === "out_of_stock") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function Kpi({ helper, label, tone = "normal", value }: { helper: string; label: string; tone?: "good" | "normal" | "warn"; value: string }) {
  return <article className="rounded-2xl border border-[#dfe6e3] bg-white p-4"><div className="flex items-center justify-between gap-3"><p className="text-[8px] font-extrabold uppercase tracking-[.11em] text-[#7d8983]">{label}</p><span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone === "good" ? "bg-emerald-50 text-emerald-700" : tone === "warn" ? "bg-amber-50 text-amber-700" : "bg-[#edf3f4] text-[#426d72]"}`}><Icon name={tone === "warn" ? "alert" : tone === "good" ? "check" : "box"} size={13}/></span></div><b className="mt-2 block text-[22px] tracking-[-.04em] text-[#17231f]">{value}</b><p className="mt-3 border-t border-[#edf0ee] pt-3 text-[7.5px] text-[#839089]">{helper}</p></article>;
}

function openProductEditor(id: string, onNavigate: (page: string) => void) {
  window.sessionStorage.setItem(EDIT_PRODUCT_KEY, id);
  onNavigate("Add/Edit Product");
}

export function LiveProductsWorkspace({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [summary, setSummary] = useState<CatalogSummary>(emptySummary);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CatalogFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [archiveConfirmed, setArchiveConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError("");
    try {
      const result = await getCatalogProducts(signal);
      setProducts(result.products);
      setSummary(result.summary);
      setSelectedId((current) => result.products.some((item) => item.id === current) ? current : result.products[0]?.id || "");
    } catch (error) {
      if (!signal?.aborted) setLoadError(error instanceof Error ? error.message : "Product catalog could not be loaded.");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void load(controller.signal), 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [load]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((item) => {
      const lowStock = item.stock > 0 && item.stock <= item.lowStockThreshold;
      const matchesFilter = filter === "all" || (filter === "low_stock" ? lowStock : filter === "has_draft" ? Boolean(item.draftId) : item.status === filter);
      const matchesQuery = !needle || [item.name, item.sku, item.brand, item.category].some((value) => value.toLowerCase().includes(needle));
      return matchesFilter && matchesQuery;
    });
  }, [filter, products, query]);
  const selected = products.find((item) => item.id === selectedId) || products[0];

  async function archiveSelected() {
    if (!selected) return;
    setIsSaving(true);
    try {
      await archiveCatalogProduct(selected.id, archiveReason);
      setArchiveOpen(false);
      setArchiveReason("");
      setArchiveConfirmed(false);
      setNotice("Product archived. Existing orders and catalog history were preserved.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Product could not be archived.");
    } finally {
      setIsSaving(false);
    }
  }

  return <div className="space-y-4"><header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="flex items-center gap-2 text-[8.5px] font-extrabold uppercase tracking-[.18em] text-[#547874]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Live catalog</p><h1 className="mt-2 text-[26px] font-bold tracking-[-.045em] text-[#17231f]">Product catalog command center</h1><p className="mt-1.5 max-w-3xl text-[10px] font-medium text-[#74817b]">Search real products, inspect price and stock, and move controlled product changes through recoverable drafts.</p></div><div className="flex flex-wrap gap-2"><button className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[9.5px] font-bold text-[#62706a] disabled:opacity-50" disabled={isLoading} onClick={() => void load()} type="button"><Icon name="refresh" size={14}/> Refresh</button><button className="inline-flex items-center gap-1.5 rounded-xl bg-[#426d72] px-3.5 py-2.5 text-[9.5px] font-bold text-white" onClick={() => openProductEditor("", onNavigate)} type="button"><Icon name="plus" size={14}/> New product draft</button></div></header><section className="rounded-2xl border border-[#dfe8e5] bg-[#edf5f5] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#426d72]"><Icon name="box" size={17}/></span><div><p className="text-[9px] font-bold text-[#395c5b]">Existing products table · MySQL connected</p><p className="mt-1 text-[8px] text-[#72827c]">The adapter detects the current schema. Page load never creates, edits or seeds products.</p></div></div><div className="rounded-full bg-white px-3 py-2 text-[8px] font-bold text-[#54716e]">Safe draft → human publish</div></div></section><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Kpi helper="All real catalog records" label="Total products" value={String(summary.total)}/><Kpi helper="Customer-visible status" label="Active" tone="good" value={String(summary.active)}/><Kpi helper="Live catalog unchanged" label="Draft changes" tone={summary.drafts ? "warn" : "normal"} value={String(summary.drafts)}/><Kpi helper="At or below reorder level" label="Low stock" tone={summary.lowStock ? "warn" : "good"} value={String(summary.lowStock)}/><Kpi helper="Currently unavailable" label="Out of stock" tone={summary.outOfStock ? "warn" : "good"} value={String(summary.outOfStock)}/></section>{loadError ? <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[9.5px] font-bold text-rose-700"><span className="flex items-center gap-2"><Icon name="alert" size={14}/>{loadError}</span><button className="underline" onClick={() => void load()} type="button">Try again</button></div> : null}<section className="grid min-h-[650px] gap-3 xl:grid-cols-[minmax(0,1.25fr)_390px]"><div className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white"><div className="border-b border-[#e7ece9] p-4"><div className="flex flex-col gap-3 md:flex-row md:items-center"><label className="relative h-10 min-w-0 flex-1"><span className="pointer-events-none absolute left-3 top-3 z-10 text-[#8a9590]"><Icon name="search" size={14}/></span><input className="h-10 w-full rounded-xl border border-[#dfe6e3] bg-transparent pl-9 pr-3 text-[9px] font-semibold text-[#4c5c55] outline-none focus:border-[#759493]" onChange={(event) => setQuery(event.target.value)} placeholder="Search product, SKU, brand or category..." value={query}/></label><div className="flex flex-wrap gap-1.5">{(["all", "active", "draft", "inactive", "low_stock", "out_of_stock", "has_draft"] as CatalogFilter[]).map((item) => <button className={`rounded-lg px-2.5 py-2 text-[7.5px] font-bold ${filter === item ? "bg-[#426d72] text-white" : "bg-[#f1f4f2] text-[#718078]"}`} key={item} onClick={() => setFilter(item)} type="button">{item === "all" ? "All" : item === "low_stock" ? "Low stock" : item === "out_of_stock" ? "Out" : item === "has_draft" ? "Draft changes" : statusLabel(item)}</button>)}</div></div></div>{isLoading ? <div className="p-12 text-center text-[9px] font-bold text-[#839089]">Loading real products...</div> : visible.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-[#fafbfa] text-[7.5px] font-extrabold uppercase tracking-[.1em] text-[#84908a]"><tr><th className="px-4 py-3.5">Product</th><th className="px-3 py-3.5">Price</th><th className="px-3 py-3.5">Stock</th><th className="px-3 py-3.5">Status</th><th className="px-3 py-3.5">Draft</th><th className="px-4 py-3.5">Updated</th></tr></thead><tbody className="divide-y divide-[#edf0ee]">{visible.map((item) => <tr className={`cursor-pointer text-[8.5px] text-[#596861] ${selected?.id === item.id ? "bg-[#f2f7f5]" : "hover:bg-[#fafcfb]"}`} key={item.id} onClick={() => setSelectedId(item.id)}><td className="px-4 py-3.5"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#edf3f4] text-[#426d72]" style={productImageUrl(item.image) ? { backgroundImage: `url(${productImageUrl(item.image)})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}>{!productImageUrl(item.image) ? <Icon name="box" size={14}/> : null}</span><span className="min-w-0"><b className="block max-w-[260px] truncate text-[9px] text-[#35443d]">{item.name}</b><small className="mt-1 block truncate text-[7px] text-[#909b95]">{item.sku || `Product #${item.id}`} · {item.brand || "Brand not set"}</small></span></div></td><td className="px-3 py-3.5 font-bold text-[#405049]">{money(item.price)}</td><td className="px-3 py-3.5"><b className={item.stock <= item.lowStockThreshold ? "text-amber-700" : "text-[#405049]"}>{item.stock}</b><small className="mt-1 block text-[6.5px] text-[#929d97]">Alert {item.lowStockThreshold}</small></td><td className="px-3 py-3.5"><span className={`rounded-full px-2 py-1 text-[6.5px] font-bold ring-1 ring-inset ${statusTone(item.status)}`}>{statusLabel(item.status)}</span></td><td className="px-3 py-3.5">{item.draftId ? <span className="rounded-full bg-amber-50 px-2 py-1 text-[6.5px] font-bold text-amber-700">Review #{item.draftId}</span> : <span className="text-[#a0aaa5]">—</span>}</td><td className="px-4 py-3.5 text-[7px]">{dateText(item.updatedAt)}</td></tr>)}</tbody></table></div> : <div className="flex min-h-[420px] items-center justify-center p-8 text-center"><div><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3f4] text-[#426d72]"><Icon name="box" size={19}/></span><h2 className="mt-3 text-[13px] font-bold text-[#34443d]">No matching product found</h2><p className="mt-1 text-[8.5px] text-[#85918b]">Clear filters or create the first real product draft.</p></div></div>}</div><aside className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">{selected ? <><div className="border-b border-[#e7ece9] p-5"><p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-[#7d8983]">Product inspector</p><h2 className="mt-1.5 text-[17px] font-bold leading-6 text-[#26362f]">{selected.name}</h2><p className="mt-1 text-[7.5px] text-[#87928d]">{selected.sku || `Product #${selected.id}`} · {selected.category || "No category"}</p></div><div className="space-y-4 p-5"><div className="flex h-44 items-center justify-center overflow-hidden rounded-2xl bg-[#eef4f2] text-[#426d72]" style={productImageUrl(selected.image) ? { backgroundImage: `url(${productImageUrl(selected.image)})`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "contain" } : undefined}>{!productImageUrl(selected.image) ? <Icon name="image" size={30}/> : null}</div><div className="grid grid-cols-2 gap-2">{[["Selling price", money(selected.price)], ["Current stock", String(selected.stock)], ["Brand", selected.brand || "—"], ["Draft state", selected.draftId ? `Review #${selected.draftId}` : "Up to date"]].map(([label, value]) => <div className="rounded-xl border border-[#e2e8e5] p-3" key={label}><span className="text-[6.5px] font-bold uppercase tracking-[.08em] text-[#929d97]">{label}</span><b className="mt-1.5 block truncate text-[8.5px] text-[#405049]">{value}</b></div>)}</div><p className="text-[8px] leading-4 text-[#78857f]">{selected.shortDescription || "No short product description has been added."}</p><button className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#426d72] text-[9px] font-bold text-white" onClick={() => openProductEditor(selected.id, onNavigate)} type="button"><Icon name="edit" size={13}/> Open safe editor</button><button className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-rose-100 text-[8.5px] font-bold text-rose-700" disabled={selected.status === "archived"} onClick={() => setArchiveOpen(true)} type="button"><Icon name="trash" size={12}/> Archive product</button><div className="rounded-xl bg-[#edf3f4] p-4 text-[7.5px] leading-4 text-[#526965]">Archive never deletes the product, historical orders or audit versions.</div></div></> : <div className="flex min-h-[500px] items-center justify-center p-8 text-center"><div><Icon name="box" size={24}/><p className="mt-3 text-[9px] font-bold">Select a product</p></div></div>}</aside></section>{archiveOpen && selected ? <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#17231f]/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setArchiveOpen(false); }}><div className="w-full max-w-[540px] overflow-hidden rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.24)]"><div className="flex items-start justify-between border-b border-[#e8ecea] p-5"><div><p className="text-[8px] font-bold uppercase tracking-[.14em] text-rose-700">Human approval required</p><h2 className="mt-1.5 text-[18px] font-bold text-[#22312b]">Archive {selected.name}</h2><p className="mt-1 text-[8.5px] text-[#84908a]">The record stays recoverable and attached to previous orders.</p></div><button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5f3] text-[#65736c]" onClick={() => setArchiveOpen(false)} type="button"><Icon name="close" size={14}/></button></div><div className="space-y-4 p-5"><label className="block text-[8px] font-bold uppercase tracking-[.1em] text-[#75827c]">Archive reason<textarea className="mt-2 min-h-24 w-full resize-none rounded-xl border border-[#dce4e0] p-3 text-[9px] font-medium normal-case tracking-normal outline-none" onChange={(event) => setArchiveReason(event.target.value)} placeholder="Why should this product leave the sellable catalog?" value={archiveReason}/></label><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#dce5e1] p-4"><input checked={archiveConfirmed} className="mt-0.5 h-4 w-4 accent-[#426d72]" onChange={(event) => setArchiveConfirmed(event.target.checked)} type="checkbox"/><span className="text-[8.5px] leading-4 text-[#596962]">I reviewed the product and approve removing it from sellable catalog visibility.</span></label></div><div className="flex justify-end gap-2 border-t border-[#e8ecea] bg-[#fafbfa] p-5"><button className="h-10 rounded-xl border border-[#dce4e0] bg-white px-4 text-[9px] font-bold text-[#66756e]" onClick={() => setArchiveOpen(false)} type="button">Cancel</button><button className="h-10 rounded-xl bg-rose-700 px-4 text-[9px] font-bold text-white disabled:opacity-40" disabled={!archiveConfirmed || !archiveReason.trim() || isSaving} onClick={() => void archiveSelected()} type="button">{isSaving ? "Archiving..." : "Archive safely"}</button></div></div></div> : null}{notice ? <div className="fixed bottom-6 right-6 z-[100] max-w-sm rounded-xl bg-[#335e63] px-4 py-3 text-[9.5px] font-bold leading-5 text-white shadow-xl">{notice}</div> : null}</div>;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <label className="block text-[7.5px] font-bold uppercase tracking-[.1em] text-[#75827c]"><span>{label}</span>{children}</label>;
}

export function LiveProductEditorWorkspace({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [draft, setDraft] = useState<CatalogProduct>({ ...emptyCatalogProduct });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishConfirmed, setPublishConfirmed] = useState(false);
  const [publishReason, setPublishReason] = useState("");

  const loadProduct = useCallback(async (id: string, signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError("");
    try {
      setDraft(id ? await getCatalogProduct(id, signal) : { ...emptyCatalogProduct });
    } catch (error) {
      if (!signal?.aborted) setLoadError(error instanceof Error ? error.message : "Product editor could not be loaded.");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const selectedId = window.sessionStorage.getItem(EDIT_PRODUCT_KEY) || "";
      void Promise.all([
        getCatalogProducts(controller.signal).then((result) => setProducts(result.products)),
        loadProduct(selectedId, controller.signal),
      ]).catch(() => undefined);
    }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [loadProduct]);

  const inputClass = "mt-1.5 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[9px] font-semibold normal-case tracking-normal text-[#405049] outline-none focus:border-[#759493]";
  const textareaClass = `${inputClass} min-h-24 resize-y py-3 leading-5`;
  const ready = Boolean(draft.name.trim()) && draft.price >= 0 && draft.stock >= 0 && (!draft.slug || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug));

  function change(patch: Partial<CatalogProduct>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  async function saveDraft() {
    setIsSaving(true);
    try {
      const result = await saveProductDraft(draft);
      setDraft(result.product);
      setNotice("Draft saved in MySQL. The live product was not changed.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Product draft could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function publish() {
    setIsSaving(true);
    try {
      let draftId = draft.draftId;
      if (!draftId) {
        const saved = await saveProductDraft(draft);
        draftId = saved.draftId;
        setDraft(saved.product);
      }
      const published = await publishProductDraft(draftId, publishReason);
      setDraft(published);
      window.sessionStorage.setItem(EDIT_PRODUCT_KEY, published.id);
      setPublishOpen(false);
      setPublishConfirmed(false);
      setPublishReason("");
      setNotice("Product changes published. A recoverable version was recorded.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Product could not be published.");
    } finally {
      setIsSaving(false);
    }
  }

  async function discard() {
    if (!draft.draftId || !window.confirm("Discard this draft? The live product will remain unchanged.")) return;
    setIsSaving(true);
    try {
      await discardProductDraft(draft.draftId);
      if (draft.id) await loadProduct(draft.id);
      else setDraft({ ...emptyCatalogProduct });
      setNotice("Draft discarded. Live catalog was not changed.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Draft could not be discarded.");
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadImage(file: File) {
    setIsUploading(true);
    try {
      change({ image: await uploadProductImage(file) });
      setNotice("Product image uploaded to the existing media store.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Product image upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return <div className="space-y-4"><header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="flex items-center gap-2 text-[8.5px] font-extrabold uppercase tracking-[.18em] text-[#547874]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Controlled product change</p><h1 className="mt-2 text-[26px] font-bold tracking-[-.045em] text-[#17231f]">{draft.id ? "Edit product" : "Create product draft"}</h1><p className="mt-1.5 max-w-3xl text-[10px] font-medium text-[#74817b]">Save recoverable work first, then publish only after reviewing price, stock, visibility and customer-facing content.</p></div><div className="flex flex-wrap gap-2"><button className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[9px] font-bold text-[#62706a]" onClick={() => onNavigate("Products")} type="button">Back to products</button>{draft.draftId ? <button className="inline-flex items-center gap-1.5 rounded-xl border border-rose-100 bg-white px-3.5 py-2.5 text-[9px] font-bold text-rose-700 disabled:opacity-40" disabled={isSaving} onClick={() => void discard()} type="button"><Icon name="trash" size={13}/> Discard draft</button> : null}<button className="inline-flex items-center gap-1.5 rounded-xl border border-[#bfcfca] bg-white px-3.5 py-2.5 text-[9px] font-bold text-[#426d72] disabled:opacity-40" disabled={!ready || isSaving || isLoading} onClick={() => void saveDraft()} type="button"><Icon name="save" size={13}/>{isSaving ? "Saving..." : "Save draft"}</button><button className="inline-flex items-center gap-1.5 rounded-xl bg-[#426d72] px-3.5 py-2.5 text-[9px] font-bold text-white disabled:opacity-40" disabled={!ready || isSaving || isLoading} onClick={() => setPublishOpen(true)} type="button"><Icon name="check" size={13}/> Review & publish</button></div></header>{loadError ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[9px] font-bold text-rose-700">{loadError}</div> : null}<section className="rounded-2xl border border-[#dfe8e5] bg-[#edf5f5] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#426d72]"><Icon name={draft.draftId ? "save" : "box"} size={17}/></span><div><p className="text-[9px] font-bold text-[#395c5b]">{draft.draftId ? `Recoverable draft #${draft.draftId}` : draft.id ? "Live product loaded · no draft yet" : "New product · not in live catalog"}</p><p className="mt-1 text-[8px] text-[#72827c]">Save draft does not change price, stock or storefront visibility.</p></div></div><select className="h-10 rounded-xl border border-white bg-white px-3 text-[8.5px] font-bold text-[#54716e] outline-none" onChange={(event) => { const id = event.target.value; window.sessionStorage.setItem(EDIT_PRODUCT_KEY, id); void loadProduct(id); }} value={draft.id}><option value="">New product draft</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div></section>{isLoading ? <div className="rounded-2xl border bg-white p-16 text-center text-[9px] font-bold text-[#839089]">Loading product editor...</div> : <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_350px]"><div className="space-y-4"><article className="rounded-2xl border border-[#dfe6e3] bg-white p-5"><div className="mb-4"><p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-[#7d8983]">Identity & organization</p><h2 className="mt-1 text-[14px] font-bold text-[#26362f]">Customer-facing product identity</h2></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Product name *"><input className={inputClass} onChange={(event) => { const name = event.target.value; change({ name, slug: draft.slug || slugify(name) }); }} value={draft.name}/></Field><Field label="URL slug"><input className={inputClass} onChange={(event) => change({ slug: slugify(event.target.value) })} value={draft.slug}/></Field><Field label="SKU"><input className={inputClass} onChange={(event) => change({ sku: event.target.value })} value={draft.sku}/></Field><Field label="Publication status"><select className={inputClass} onChange={(event) => change({ status: event.target.value as ProductStatus })} value={draft.status}><option value="draft">Draft / hidden</option><option value="active">Active / visible</option><option value="inactive">Inactive</option><option value="out_of_stock">Out of stock</option></select></Field><Field label="Brand"><input className={inputClass} onChange={(event) => change({ brand: event.target.value })} value={draft.brand}/></Field><Field label="Category"><input className={inputClass} onChange={(event) => change({ category: event.target.value })} value={draft.category}/></Field></div></article><article className="rounded-2xl border border-[#dfe6e3] bg-white p-5"><div className="mb-4"><p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-[#7d8983]">Commercial & stock</p><h2 className="mt-1 text-[14px] font-bold text-[#26362f]">Price, cost and availability</h2></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Field label="Selling price *"><input className={inputClass} min="0" onChange={(event) => change({ price: Math.max(0, Number(event.target.value) || 0) })} type="number" value={draft.price}/></Field><Field label="Compare price"><input className={inputClass} min="0" onChange={(event) => change({ comparePrice: event.target.value === "" ? null : Math.max(0, Number(event.target.value) || 0) })} type="number" value={draft.comparePrice ?? ""}/></Field><Field label="Cost price"><input className={inputClass} min="0" onChange={(event) => change({ costPrice: event.target.value === "" ? null : Math.max(0, Number(event.target.value) || 0) })} type="number" value={draft.costPrice ?? ""}/></Field><Field label="Current stock *"><input className={inputClass} min="0" onChange={(event) => change({ stock: Math.max(0, Math.floor(Number(event.target.value) || 0)) })} type="number" value={draft.stock}/></Field><Field label="Low-stock alert"><input className={inputClass} min="0" onChange={(event) => change({ lowStockThreshold: Math.max(0, Math.floor(Number(event.target.value) || 0)) })} type="number" value={draft.lowStockThreshold}/></Field><label className="mt-5 flex h-10 items-center justify-between rounded-xl border border-[#dce4e0] px-3 text-[8.5px] font-bold text-[#596861]"><span>Featured product</span><input checked={draft.featured} className="h-4 w-4 accent-[#426d72]" onChange={(event) => change({ featured: event.target.checked })} type="checkbox"/></label></div></article><article className="rounded-2xl border border-[#dfe6e3] bg-white p-5"><div className="mb-4"><p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-[#7d8983]">Product content</p><h2 className="mt-1 text-[14px] font-bold text-[#26362f]">Clear, useful and claim-safe copy</h2></div><div className="space-y-3"><Field label="Short description"><textarea className={textareaClass} onChange={(event) => change({ shortDescription: event.target.value })} value={draft.shortDescription}/></Field><Field label="Full description"><textarea className={`${textareaClass} min-h-40`} onChange={(event) => change({ description: event.target.value })} value={draft.description}/></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="SEO title"><input className={inputClass} maxLength={191} onChange={(event) => change({ metaTitle: event.target.value })} value={draft.metaTitle}/></Field><Field label="Meta description"><textarea className={textareaClass} maxLength={255} onChange={(event) => change({ metaDescription: event.target.value })} value={draft.metaDescription}/></Field></div></div></article></div><aside className="space-y-4"><article className="rounded-2xl border border-[#dfe6e3] bg-white p-5"><p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-[#7d8983]">Primary image</p><div className="mt-4 flex h-64 items-center justify-center overflow-hidden rounded-2xl bg-[#eef4f2] text-[#426d72]" style={productImageUrl(draft.image) ? { backgroundImage: `url(${productImageUrl(draft.image)})`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "contain" } : undefined}>{!productImageUrl(draft.image) ? <Icon name="image" size={34}/> : null}</div><Field label="Image URL"><input className={inputClass} onChange={(event) => change({ image: event.target.value })} value={draft.image}/></Field><label className="mt-3 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#cddbd7] bg-[#f7faf9] text-[8.5px] font-bold text-[#416764]"><Icon name="upload" size={12}/>{isUploading ? "Uploading..." : "Upload JPG, PNG or WebP"}<input accept="image/jpeg,image/png,image/webp" className="hidden" disabled={isUploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); event.currentTarget.value = ""; }} type="file"/></label></article><article className="rounded-2xl border border-[#d8e4e1] bg-[#edf3f4] p-5"><p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-[#5d7775]">Publication readiness</p><div className="mt-4 space-y-2">{[["Product name", Boolean(draft.name.trim())], ["Valid price", draft.price >= 0], ["Valid stock", draft.stock >= 0], ["URL slug", Boolean(draft.slug)], ["Product image", Boolean(draft.image)], ["Description", Boolean(draft.shortDescription || draft.description)]].map(([label, valid]) => <div className="flex items-center justify-between text-[8px]" key={String(label)}><span className="text-[#70837f]">{label as string}</span><span className={`flex h-5 w-5 items-center justify-center rounded-full ${valid ? "bg-white text-emerald-700" : "bg-amber-50 text-amber-700"}`}><Icon name={valid ? "check" : "alert"} size={9}/></span></div>)}</div></article><article className="rounded-2xl border border-amber-100 bg-amber-50/65 p-5 text-[8px] leading-4 text-amber-800"><b className="block">Stock boundary</b><p className="mt-2">Publishing may update the current stock value. Future stock receipts and adjustments should use Inventory so every movement has its own reason and ledger entry.</p></article></aside></section>}{publishOpen ? <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#17231f]/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setPublishOpen(false); }}><div className="w-full max-w-[580px] overflow-hidden rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.24)]"><div className="flex items-start justify-between border-b border-[#e8ecea] p-5"><div><p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#426d72]">Human approval required</p><h2 className="mt-1.5 text-[18px] font-bold text-[#22312b]">Publish product changes</h2><p className="mt-1 text-[8.5px] text-[#84908a]">This can change customer-visible content, price, stock and availability.</p></div><button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5f3] text-[#65736c]" onClick={() => setPublishOpen(false)} type="button"><Icon name="close" size={14}/></button></div><div className="space-y-4 p-5"><div className="grid grid-cols-3 gap-2">{[["Price", money(draft.price)], ["Stock", String(draft.stock)], ["Status", statusLabel(draft.status)]].map(([label, value]) => <div className="rounded-xl bg-[#f5f8f6] p-3" key={label}><span className="text-[7px] font-bold text-[#7d8983]">{label}</span><b className="mt-1 block truncate text-[10px] text-[#33443d]">{value}</b></div>)}</div><Field label="Publication note (optional)"><textarea className={textareaClass} onChange={(event) => setPublishReason(event.target.value)} placeholder="Reason or campaign context for the version history" value={publishReason}/></Field><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#dfe6e3] p-4"><input checked={publishConfirmed} className="mt-0.5 h-4 w-4 accent-[#426d72]" onChange={(event) => setPublishConfirmed(event.target.checked)} type="checkbox"/><span className="text-[8.5px] leading-4 text-[#596962]">I reviewed product name, price, stock, status, image and customer-facing content and approve publishing this version.</span></label></div><div className="flex justify-end gap-2 border-t border-[#e8ecea] bg-[#fafbfa] p-5"><button className="h-10 rounded-xl border border-[#dce4e0] bg-white px-4 text-[9px] font-bold text-[#66756e]" onClick={() => setPublishOpen(false)} type="button">Keep draft</button><button className="h-10 rounded-xl bg-[#426d72] px-4 text-[9px] font-bold text-white disabled:opacity-40" disabled={!publishConfirmed || isSaving} onClick={() => void publish()} type="button">{isSaving ? "Publishing..." : "Publish product"}</button></div></div></div> : null}{notice ? <div className="fixed bottom-6 right-6 z-[100] max-w-sm rounded-xl bg-[#335e63] px-4 py-3 text-[9.5px] font-bold leading-5 text-white shadow-xl">{notice}</div> : null}</div>;
}
