"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";

import { bnbApiAssetUrl } from "@/lib/bnb-api";
import {
  collectionAction,
  emptyCollectionDraft,
  getCollection,
  getCollectionProducts,
  getCollections,
  saveCollection,
  uploadCollectionImage,
  type CollectionDraft,
  type CollectionProduct,
  type CollectionStatus,
  type CollectionSummary,
} from "./collections-client";

type Props = { onNavigate: (page: string) => void };
type Filter = "all" | CollectionStatus;

function Icon({ name }: { name: "alert" | "box" | "check" | "close" | "image" | "link" | "plus" | "refresh" | "search" | "up" | "down" }) {
  const paths = {
    alert: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
    box: <><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    up: <path d="m18 15-6-6-6 6"/>,
    down: <path d="m6 9 6 6 6-6"/>,
  }[name];
  return <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">{paths}</svg>;
}

function Kpi({ helper, icon, label, tone = "brand", value }: { helper: string; icon: "box" | "check" | "alert" | "link"; label: string; tone?: "brand" | "good" | "warn"; value: string }) {
  const color = tone === "good" ? "bg-emerald-50 text-emerald-700" : tone === "warn" ? "bg-amber-50 text-amber-700" : "bg-[#edf3f4] text-[#3b646d]";
  return <article className="rounded-2xl border border-[#dfe6e3] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[8px] font-bold uppercase tracking-[.1em] text-[#718079]">{label}</p><p className="mt-2 text-[22px] font-bold tracking-[-.04em] text-[#17231f]">{value}</p></div><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}><Icon name={icon}/></span></div><p className="mt-4 border-t border-[#edf1ef] pt-3 text-[7.5px] font-semibold text-[#87928d]">{helper}</p></article>;
}

function Pill({ children, status }: { children: ReactNode; status: CollectionStatus }) {
  const color = status === "active" ? "bg-emerald-50 text-emerald-700" : status === "draft" ? "bg-amber-50 text-amber-700" : status === "deleted" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-2 py-1 text-[7.5px] font-bold capitalize ${color}`}>{children}</span>;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function dateText(value: string) {
  if (!value) return "Not saved";
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? "Saved" : date.toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" });
}

function artwork(value: string) {
  const source = bnbApiAssetUrl(value, "");
  return source ? { backgroundImage: `url("${source.replace(/["\\]/g, "")}")` } : undefined;
}

export function LiveCollectionsWorkspace({ onNavigate }: Props) {
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [products, setProducts] = useState<CollectionProduct[]>([]);
  const [draft, setDraft] = useState<CollectionDraft>({ ...emptyCollectionDraft });
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"desktop" | "mobile" | "">("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const [nextCollections, nextProducts] = await Promise.all([getCollections(signal), getCollectionProducts(signal)]);
      setCollections(nextCollections);
      setProducts(nextProducts);
      if (!selectedId && nextCollections[0]) {
        const first = await getCollection(nextCollections[0].id, signal);
        setSelectedId(first.id);
        setDraft(first);
      }
    } catch (loadError) {
      if (!signal?.aborted) setError(loadError instanceof Error ? loadError.message : "Collections could not be loaded.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void load(controller.signal), 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [load]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  const ordered = useMemo(() => [...collections].sort((a, b) => a.sortOrder - b.sortOrder || Number(a.id) - Number(b.id)), [collections]);
  const visible = useMemo(() => ordered.filter((item) => (filter === "all" || item.status === filter) && `${item.title} ${item.slug} ${item.eyebrow}`.toLowerCase().includes(query.toLowerCase())), [filter, ordered, query]);
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const selectedProducts = useMemo(() => draft.productIds.map((id) => productById.get(id)).filter((item): item is CollectionProduct => Boolean(item)), [draft.productIds, productById]);
  const availableProducts = useMemo(() => {
    const selected = new Set(draft.productIds);
    const search = productQuery.trim().toLowerCase();
    return products.filter((product) => !selected.has(product.id) && (!search || `${product.name} ${product.sku} ${product.brand}`.toLowerCase().includes(search))).slice(0, 30);
  }, [draft.productIds, productQuery, products]);
  const liveCollections = collections.filter((item) => item.status === "active");
  const homepageReady = liveCollections.filter((item) => item.productCount > 0 && Boolean(item.desktopImage || item.mobileImage)).length;

  function change(patch: Partial<CollectionDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setDirty(true);
    setNotice("");
    setError("");
  }

  function create() {
    setDraft({ ...emptyCollectionDraft, sortOrder: Math.max(1, collections.length + 1) });
    setSelectedId("");
    setProductQuery("");
    setDirty(false);
    setNotice("");
    setError("");
  }

  async function open(item: CollectionSummary) {
    if (dirty && !window.confirm("Discard the unsaved collection changes?")) return;
    setError("");
    try {
      const next = await getCollection(item.id);
      setDraft(next);
      setSelectedId(next.id);
      setDirty(false);
      setProductQuery("");
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : "Collection could not be opened.");
    }
  }

  async function save() {
    if (!draft.title.trim()) { setError("Collection title is required."); return; }
    const normalizedSlug = draft.slug || slugify(draft.title);
    if (!normalizedSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) { setError("Use a valid lowercase slug."); return; }
    setSaving(true);
    setError("");
    try {
      const saved = await saveCollection({ ...draft, slug: normalizedSlug });
      setDraft(saved);
      setSelectedId(saved.id);
      setDirty(false);
      setNotice("Collection saved in MySQL. Active collections now feed Homepage Editor’s Picks in this order.");
      setCollections(await getCollections());
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Collection could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function runAction(action: string, input: Record<string, unknown>, message?: string) {
    setError("");
    try {
      const response = await collectionAction(action, input);
      setNotice(message || response);
      const next = await getCollections();
      setCollections(next);
      if (action === "delete" && String(input.id) === selectedId) create();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Collection could not be updated.");
    }
  }

  async function move(item: CollectionSummary, direction: -1 | 1) {
    const index = ordered.findIndex((entry) => entry.id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];
    await runAction("reorder", { order: next.map((entry) => entry.id) });
  }

  function addProduct(product: CollectionProduct) {
    if (!draft.productIds.includes(product.id)) change({ productIds: [...draft.productIds, product.id] });
  }

  function removeProduct(id: string) {
    change({ productIds: draft.productIds.filter((productId) => productId !== id) });
  }

  function moveProduct(id: string, direction: -1 | 1) {
    const index = draft.productIds.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= draft.productIds.length) return;
    const next = [...draft.productIds];
    [next[index], next[target]] = [next[target], next[index]];
    change({ productIds: next });
  }

  async function upload(event: ChangeEvent<HTMLInputElement>, target: "desktop" | "mobile") {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(target);
    setError("");
    try {
      const url = await uploadCollectionImage(file);
      change(target === "desktop" ? { desktopImage: url } : { mobileImage: url });
      setNotice(`${target === "desktop" ? "Desktop" : "Mobile"} collection image uploaded.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setUploading("");
    }
  }

  const inputClass = "mt-1.5 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[9px] font-semibold text-[#35453e] outline-none focus:border-[#7e9b96]";
  const labelClass = "text-[7.5px] font-bold uppercase tracking-[.1em] text-[#7b8882]";

  return <div className="space-y-4">
    <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="flex items-center gap-2 text-[8.5px] font-extrabold uppercase tracking-[.18em] text-[#547874]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Catalog editorial</p><h1 className="mt-2 text-[28px] font-bold tracking-[-.045em] text-[#17231f]">Collections command center</h1><p className="mt-1.5 max-w-3xl text-[10px] font-medium leading-4 text-[#74817b]">Create ordered editorial product groups for Homepage Editor’s Picks and customer-facing collection pages—without creating bundles, SKUs or stock movement.</p></div><div className="flex flex-wrap gap-2"><button className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dce4e0] bg-white px-3.5 text-[9px] font-bold text-[#5f6e67]" disabled={loading} onClick={() => void load()} type="button"><Icon name="refresh"/>{loading ? "Loading..." : "Refresh"}</button><button className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#3b646d] px-4 text-[9px] font-bold text-white" onClick={create} type="button"><Icon name="plus"/>Create collection</button></div></header>

    <section className="rounded-2xl border border-[#d7e3df] bg-[#edf4f2] p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#3b646d]"><Icon name="link"/></span><div><p className="text-[9px] font-bold text-[#385a59]">Storefront route connected</p><p className="mt-1 text-[7.5px] text-[#6e8179]">Every active slug opens at /collections/[slug]. Homepage Editor’s Picks follows active collection order and section display limit.</p></div></div><div className="flex gap-2"><button className="rounded-xl border border-[#bdd0ca] bg-white px-3 py-2 text-[8px] font-bold text-[#426d72]" onClick={() => onNavigate("Homepage CMS")} type="button">Homepage CMS</button><button className="rounded-xl border border-[#bdd0ca] bg-white px-3 py-2 text-[8px] font-bold text-[#426d72]" onClick={() => onNavigate("SEO & Storefront Health")} type="button">SEO health</button></div></div></section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi helper="Real MySQL collection records" icon="box" label="Total collections" value={String(collections.length)}/><Kpi helper="Customer-visible collection pages" icon="check" label="Active" tone="good" value={String(liveCollections.length)}/><Kpi helper="Active with products and artwork" icon="link" label="Homepage ready" tone="good" value={String(homepageReady)}/><Kpi helper="Draft, hidden or missing content" icon="alert" label="Needs review" tone="warn" value={String(collections.length-homepageReady)}/></section>

    {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[9px] font-bold text-emerald-700">{notice}</div> : null}
    {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[9px] font-bold text-rose-700">{error}</div> : null}

    <section className="grid gap-4 xl:grid-cols-[minmax(0,.9fr)_minmax(520px,1.1fr)]">
      <article className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white"><div className="border-b border-[#e7ece9] p-4"><div className="flex flex-col gap-3"><div className="flex items-center justify-between"><div><p className="text-[8px] font-bold uppercase tracking-[.1em] text-[#82908a]">Collection records</p><h2 className="mt-1 text-[15px] font-bold text-[#26362f]">Storefront destinations</h2></div><span className="rounded-full bg-[#edf3f4] px-2.5 py-1 text-[8px] font-bold text-[#426d72]">{visible.length} shown</span></div><label className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9993]"><Icon name="search"/></span><input className="h-10 w-full rounded-xl border border-[#dce4e0] pl-10 pr-3 text-[9px] outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Search title or slug..." value={query}/></label><div className="flex flex-wrap gap-1.5">{(["all","active","draft","inactive","deleted"] as Filter[]).map((item) => <button className={`rounded-lg px-2.5 py-2 text-[8px] font-bold capitalize ${filter===item?"bg-[#3b646d] text-white":"bg-[#f2f5f3] text-[#74817b]"}`} key={item} onClick={() => setFilter(item)} type="button">{item}</button>)}</div></div></div>
        {loading ? <div className="p-8 text-center text-[9px] font-bold text-[#7d8983]">Loading live collections...</div> : visible.length===0 ? <div className="p-10 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf3f4] text-[#426d72]"><Icon name="box"/></span><p className="mt-3 text-[10px] font-bold text-[#4b5b54]">No collection found</p><p className="mt-1 text-[8px] text-[#8b9691]">Create the first real collection or change the filter.</p><button className="mt-4 rounded-xl bg-[#3b646d] px-4 py-2.5 text-[8px] font-bold text-white" onClick={create} type="button">Create collection</button></div> : <div className="divide-y divide-[#edf1ef]">{visible.map((item) => <div className={`grid gap-3 p-4 ${selectedId===item.id?"bg-[#f3f7f5]":"hover:bg-[#fafcfb]"}`} key={item.id}><button className="flex min-w-0 items-start gap-3 text-left" onClick={() => void open(item)} type="button"><span className="h-12 w-12 shrink-0 rounded-xl bg-[#edf3f4] bg-cover bg-center" style={artwork(item.desktopImage || item.mobileImage)}>{!item.desktopImage&&!item.mobileImage?<span className="flex h-full items-center justify-center text-[#52777a]"><Icon name="image"/></span>:null}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><b className="truncate text-[9.5px] text-[#2f3f38]">{item.title}</b><Pill status={item.status}>{item.status}</Pill></span><span className="mt-1 block truncate text-[8px] font-semibold text-[#6f7d77]">/collections/{item.slug}</span><span className="mt-2 flex flex-wrap gap-2 text-[7px] text-[#929d97]"><span>{item.productCount} products</span><span>Sort {item.sortOrder}</span><span>{dateText(item.updatedAt)}</span></span></span></button><div className="flex flex-wrap justify-end gap-1.5"><button aria-label={`Move ${item.title} up`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dce4e0] bg-white disabled:opacity-30" disabled={ordered[0]?.id===item.id} onClick={() => void move(item,-1)} type="button"><Icon name="up"/></button><button aria-label={`Move ${item.title} down`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dce4e0] bg-white disabled:opacity-30" disabled={ordered.at(-1)?.id===item.id} onClick={() => void move(item,1)} type="button"><Icon name="down"/></button>{item.status==="deleted"?<button className="h-8 rounded-lg bg-[#3b646d] px-3 text-[8px] font-bold text-white" onClick={() => void runAction("restore",{id:item.id})} type="button">Restore</button>:<><a className="inline-flex h-8 items-center rounded-lg border border-[#dce4e0] bg-white px-3 text-[8px] font-bold text-[#52635c]" href={`/collections/${encodeURIComponent(item.slug)}`} rel="noreferrer" target="_blank">Preview</a><button className="h-8 rounded-lg border border-rose-100 bg-rose-50 px-3 text-[8px] font-bold text-rose-700" onClick={() => { if(window.confirm(`Delete ${item.title}? Products will remain unchanged.`)) void runAction("delete",{id:item.id,confirm:"delete"}); }} type="button">Delete</button></>}</div></div>)}</div>}
      </article>

      <form className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white" onSubmit={(event) => { event.preventDefault(); void save(); }}><div className="flex items-start justify-between gap-3 border-b border-[#e7ece9] p-4"><div><p className="text-[8px] font-bold uppercase tracking-[.1em] text-[#82908a]">{draft.id?"Edit collection":"New collection"}</p><h2 className="mt-1 text-[15px] font-bold text-[#26362f]">{draft.title || "Untitled collection"}</h2><p className="mt-1 text-[7.5px] text-[#89958f]">Metadata, ordered products, SEO and responsive artwork.</p></div><button aria-label="Clear editor" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5f3] text-[#6b7972]" onClick={create} type="button"><Icon name="close"/></button></div>
        <div className="space-y-4 p-4"><div className="grid gap-3 sm:grid-cols-2"><label className={labelClass}>Title<input className={inputClass} maxLength={191} onChange={(event) => { const title=event.target.value; change({title,slug:draft.id||draft.slug?draft.slug:slugify(title)}); }} value={draft.title}/></label><label className={labelClass}>Slug<input className={inputClass} maxLength={191} onChange={(event) => change({slug:slugify(event.target.value)})} value={draft.slug}/></label><label className={labelClass}>Eyebrow label<input className={inputClass} maxLength={120} onChange={(event) => change({eyebrow:event.target.value})} value={draft.eyebrow}/></label><div className="grid grid-cols-2 gap-2"><label className={labelClass}>Status<select className={inputClass} onChange={(event) => change({status:event.target.value as CollectionDraft["status"]})} value={draft.status}><option value="draft">Draft</option><option value="inactive">Inactive</option><option value="active">Active</option></select></label><label className={labelClass}>Sort order<input className={inputClass} min={0} onChange={(event) => change({sortOrder:Number(event.target.value)||0})} type="number" value={draft.sortOrder}/></label></div></div><label className={labelClass}>Description<textarea className="mt-1.5 min-h-20 w-full rounded-xl border border-[#dce4e0] p-3 text-[9px] font-semibold outline-none" maxLength={5000} onChange={(event) => change({description:event.target.value})} value={draft.description}/></label>
          <div className="grid gap-3 sm:grid-cols-2">{(["desktop","mobile"] as const).map((target) => { const value=target==="desktop"?draft.desktopImage:draft.mobileImage; return <label className="rounded-xl border border-[#dfe6e3] bg-[#fafcfb] p-3" key={target}><span className={labelClass}>{target} artwork</span><span className="mt-2 flex h-24 items-center justify-center rounded-xl bg-[#edf3f4] bg-cover bg-center text-[#52777a]" style={artwork(value)}>{!value?<Icon name="image"/>:null}</span><input accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-[7px]" disabled={Boolean(uploading)} onChange={(event) => void upload(event,target)} type="file"/><span className="mt-1 block text-[7px] text-[#8c9993]">{uploading===target?"Uploading...":"JPG, PNG or WebP · max 5 MB"}</span></label>; })}</div>
          <div className="grid gap-3 sm:grid-cols-2"><label className={labelClass}>SEO title<input className={inputClass} maxLength={191} onChange={(event) => change({seoTitle:event.target.value})} value={draft.seoTitle}/></label><label className={labelClass}>SEO description<textarea className="mt-1.5 min-h-16 w-full rounded-xl border border-[#dce4e0] p-3 text-[8.5px] font-semibold outline-none" maxLength={255} onChange={(event) => change({seoDescription:event.target.value})} value={draft.seoDescription}/></label></div>
          <section className="rounded-xl border border-[#dfe6e3]"><div className="flex items-center justify-between border-b border-[#e8edeb] bg-[#fafcfb] px-3 py-2.5"><div><p className="text-[8px] font-bold text-[#52635c]">Ordered products</p><p className="mt-0.5 text-[7px] text-[#929d97]">{selectedProducts.length} selected · no stock or price mutation</p></div></div><div className="divide-y divide-[#edf1ef]">{selectedProducts.length===0?<div className="p-4 text-center text-[8px] text-[#8b9691]">No product selected yet.</div>:selectedProducts.map((product,index) => <div className="flex items-center gap-2 p-3" key={product.id}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#edf3f4] text-[8px] font-bold text-[#426d72]">{index+1}</span><span className="min-w-0 flex-1"><b className="block truncate text-[8.5px] text-[#34443d]">{product.name}</b><small className="mt-0.5 block text-[7px] text-[#929d97]">{product.sku||`ID ${product.id}`} · Stock {product.stock}</small></span><button aria-label="Move product up" className="flex h-7 w-7 items-center justify-center rounded-lg border disabled:opacity-30" disabled={index===0} onClick={() => moveProduct(product.id,-1)} type="button"><Icon name="up"/></button><button aria-label="Move product down" className="flex h-7 w-7 items-center justify-center rounded-lg border disabled:opacity-30" disabled={index===selectedProducts.length-1} onClick={() => moveProduct(product.id,1)} type="button"><Icon name="down"/></button><button className="h-7 rounded-lg bg-rose-50 px-2 text-[7px] font-bold text-rose-700" onClick={() => removeProduct(product.id)} type="button">Remove</button></div>)}</div></section>
          <section className="rounded-xl border border-[#dfe6e3] bg-[#fafcfb] p-3"><label className="relative block"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9993]"><Icon name="search"/></span><input className="h-9 w-full rounded-xl border border-[#dce4e0] bg-white pl-10 pr-3 text-[8.5px] outline-none" onChange={(event) => setProductQuery(event.target.value)} placeholder="Search real products by name or SKU..." value={productQuery}/></label><div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">{availableProducts.length===0?<p className="p-3 text-center text-[7.5px] text-[#8b9691]">No matching product available.</p>:availableProducts.map((product) => <button className="flex w-full items-center gap-2 rounded-lg bg-white p-2.5 text-left hover:bg-[#edf3f4]" key={product.id} onClick={() => addProduct(product)} type="button"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#edf3f4] text-[#426d72]"><Icon name="plus"/></span><span className="min-w-0 flex-1"><b className="block truncate text-[8px] text-[#34443d]">{product.name}</b><small className="text-[7px] text-[#929d97]">{product.sku||`ID ${product.id}`} · Stock {product.stock}</small></span></button>)}</div></section>
        </div><div className="flex flex-col gap-2 border-t border-[#e7ece9] bg-[#fafcfb] p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-[7.5px] text-[#89958f]">Active pages become publicly readable; publishing remains a human action.</p><button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#3b646d] px-5 text-[9px] font-bold text-white disabled:opacity-40" disabled={saving||!dirty} type="submit"><Icon name="check"/>{saving?"Saving...":"Save collection"}</button></div></form>
    </section>
  </div>;
}
