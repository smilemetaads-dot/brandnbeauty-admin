"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  createInventoryDraft,
  discardInventoryDraft,
  getInventory,
  postInventoryDraft,
  type InventoryHealth,
  type InventoryMovement,
  type InventoryProduct,
  type InventorySummary,
  type MovementType,
} from "@/features/inventory/inventory-client";
import { productImageUrl } from "@/features/products/products-client";

type Filter = "all" | InventoryHealth | "drafts";
type IconName = "alert" | "box" | "check" | "close" | "history" | "plus" | "refresh" | "search";

const emptySummary: InventorySummary = { draftAdjustments: 0, inStock: 0, lowStock: 0, onHandUnits: 0, outOfStock: 0, totalSkus: 0 };
const paths: Record<IconName, ReactNode> = {
  alert: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  box: <><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
};

function Icon({ name, size = 15 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{paths[name]}</svg>;
}

function Kpi({ helper, label, tone = "normal", value }: { helper: string; label: string; tone?: "good" | "normal" | "warn"; value: string }) {
  return <article className="rounded-2xl border border-[#dfe6e3] bg-white p-4"><div className="flex items-center justify-between"><p className="text-[8px] font-extrabold uppercase tracking-[.11em] text-[#7d8983]">{label}</p><span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone === "warn" ? "bg-amber-50 text-amber-700" : tone === "good" ? "bg-emerald-50 text-emerald-700" : "bg-[#edf3f4] text-[#426d72]"}`}><Icon name={tone === "warn" ? "alert" : tone === "good" ? "check" : "box"} size={13}/></span></div><b className="mt-2 block text-[22px] tracking-[-.04em] text-[#17231f]">{value}</b><p className="mt-3 border-t border-[#edf0ee] pt-3 text-[7.5px] text-[#839089]">{helper}</p></article>;
}

function healthLabel(value: InventoryHealth) {
  return value === "out" ? "Out of stock" : value === "low" ? "Low stock" : "In stock";
}

function healthTone(value: InventoryHealth) {
  return value === "out" ? "bg-rose-50 text-rose-700 ring-rose-200" : value === "low" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200";
}

function dateText(value: string) {
  const date = new Date(value);
  return !value || Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

export function LiveInventoryWorkspace({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [summary, setSummary] = useState<InventorySummary>(emptySummary);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [movementType, setMovementType] = useState<MovementType>("count");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("Cycle count correction");
  const [referenceCode, setReferenceCode] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [draftId, setDraftId] = useState("");
  const [expectedBefore, setExpectedBefore] = useState(0);
  const [expectedAfter, setExpectedAfter] = useState(0);
  const [postConfirmed, setPostConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const result = await getInventory(signal);
      setProducts(result.products);
      setMovements(result.movements);
      setSummary(result.summary);
      setSelectedId((current) => result.products.some((item) => item.id === current) ? current : result.products[0]?.id || "");
    } catch (loadError) {
      if (!signal?.aborted) setError(loadError instanceof Error ? loadError.message : "Inventory could not be loaded.");
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
    return products.filter((item) => {
      const matchesFilter = filter === "all" || (filter === "drafts" ? item.adjustmentDrafts > 0 : item.health === filter);
      return matchesFilter && (!needle || [item.name, item.sku, item.brand, item.category].some((value) => value.toLowerCase().includes(needle)));
    });
  }, [filter, products, query]);
  const selected = products.find((item) => item.id === selectedId) || products[0];
  const selectedMovements = movements.filter((item) => item.productId === selected?.id).slice(0, 5);
  const preview = movementType === "count" ? quantity : movementType === "increase" ? (selected?.onHand || 0) + quantity : (selected?.onHand || 0) - quantity;
  const draftReady = Boolean(selected && quantity >= (movementType === "count" ? 0 : 1) && reason.trim().length >= 4 && referenceCode.trim().length >= 3 && preview >= 0);

  function openAdjustment() {
    if (!selected) return;
    setMovementType("count");
    setQuantity(selected.onHand);
    setReason("Cycle count correction");
    setReferenceCode("");
    setInternalNote("");
    setDraftId("");
    setExpectedBefore(selected.onHand);
    setExpectedAfter(selected.onHand);
    setPostConfirmed(false);
    setAdjustOpen(true);
  }

  function chooseMovement(type: MovementType) {
    setMovementType(type);
    setQuantity(type === "count" ? selected?.onHand || 0 : 0);
    setReason(type === "increase" ? "Opening balance correction" : type === "decrease" ? "Damage / sample / write-off" : "Cycle count correction");
    setDraftId("");
    setPostConfirmed(false);
  }

  async function saveDraft() {
    if (!selected) return;
    setSaving(true);
    try {
      const result = await createInventoryDraft({ internalNote, movementType, productId: selected.id, quantity, reason, referenceCode });
      setDraftId(result.draftId);
      setExpectedBefore(result.expectedBefore);
      setExpectedAfter(result.expectedAfter);
      setNotice("Adjustment draft saved. Live stock is unchanged.");
    } catch (saveError) {
      setNotice(saveError instanceof Error ? saveError.message : "Adjustment draft could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function postDraft() {
    if (!draftId || !postConfirmed) return;
    setSaving(true);
    try {
      await postInventoryDraft(draftId);
      setAdjustOpen(false);
      setNotice("Stock movement posted with immutable before/after evidence.");
      await load();
    } catch (saveError) {
      setNotice(saveError instanceof Error ? saveError.message : "Stock movement could not be posted.");
    } finally {
      setSaving(false);
    }
  }

  async function discardDraft() {
    if (!draftId) return;
    setSaving(true);
    try {
      await discardInventoryDraft(draftId);
      setDraftId("");
      setPostConfirmed(false);
      setNotice("Adjustment draft discarded. Live stock is unchanged.");
      await load();
    } catch (saveError) {
      setNotice(saveError instanceof Error ? saveError.message : "Draft could not be discarded.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="space-y-4"><header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="flex items-center gap-2 text-[8.5px] font-extrabold uppercase tracking-[.18em] text-[#547874]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Live inventory</p><h1 className="mt-2 text-[26px] font-bold tracking-[-.045em] text-[#17231f]">Inventory control command center</h1><p className="mt-1.5 max-w-3xl text-[10px] font-medium text-[#74817b]">Read the existing product stock column, review availability, and post controlled adjustments through a recoverable ledger.</p></div><div className="flex flex-wrap gap-2"><button className="inline-flex items-center gap-2 rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[9px] font-bold text-[#62706a] disabled:opacity-50" disabled={loading} onClick={() => void load()} type="button"><Icon name="refresh"/>Refresh</button><button className="inline-flex items-center gap-2 rounded-xl bg-[#426d72] px-3.5 py-2.5 text-[9px] font-bold text-white" disabled={!selected} onClick={openAdjustment} type="button"><Icon name="plus"/>New adjustment draft</button></div></header><section className="rounded-2xl border border-[#dfe8e5] bg-[#edf5f5] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#426d72]"><Icon name="box" size={17}/></span><div><p className="text-[9px] font-bold text-[#395c5b]">Existing products stock · MySQL connected</p><p className="mt-1 text-[8px] text-[#72827c]">Page load never changes stock. Reserved and incoming stay zero until their source workflows are explicitly connected.</p></div></div><span className="rounded-full bg-white px-3 py-2 text-[8px] font-bold text-[#54716e]">Draft → human confirmation → movement</span></div></section><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Kpi helper="Existing product records" label="Total SKUs" value={String(summary.totalSkus)}/><Kpi helper="Sum of live stock balances" label="On-hand units" value={summary.onHandUnits.toLocaleString("en-BD")}/><Kpi helper="Above configured threshold" label="In stock" tone="good" value={String(summary.inStock)}/><Kpi helper="Positive, at/below threshold" label="Low stock" tone={summary.lowStock ? "warn" : "good"} value={String(summary.lowStock)}/><Kpi helper="Currently unavailable" label="Out of stock" tone={summary.outOfStock ? "warn" : "good"} value={String(summary.outOfStock)}/></section>{error ? <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[9px] font-bold text-rose-700"><span className="flex items-center gap-2"><Icon name="alert"/>{error}</span><button className="underline" onClick={() => void load()} type="button">Try again</button></div> : null}<section className="grid min-h-[650px] gap-3 xl:grid-cols-[minmax(0,1.25fr)_390px]"><div className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white"><div className="border-b border-[#e7ece9] p-4"><div className="flex flex-col gap-3 md:flex-row"><label className="relative h-10 flex-1"><span className="pointer-events-none absolute left-3 top-3 text-[#8a9590]"><Icon name="search"/></span><input className="h-10 w-full rounded-xl border border-[#dfe6e3] pl-9 pr-3 text-[9px] font-semibold outline-none focus:border-[#759493]" onChange={(event) => setQuery(event.target.value)} placeholder="Search product, SKU, brand..." value={query}/></label><div className="flex flex-wrap gap-2">{(["all", "in_stock", "low", "out", "drafts"] as Filter[]).map((item) => <button className={`h-10 rounded-xl px-3 text-[8px] font-bold ${filter === item ? "bg-[#426d72] text-white" : "bg-[#f2f5f3] text-[#697770]"}`} key={item} onClick={() => setFilter(item)} type="button">{item === "all" ? "All" : item === "drafts" ? `Drafts ${summary.draftAdjustments}` : healthLabel(item)}</button>)}</div></div></div>{loading ? <div className="p-12 text-center text-[9px] font-bold text-[#839089]">Loading real stock balances...</div> : visible.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-[#fafbfa] text-[7.5px] font-extrabold uppercase tracking-[.1em] text-[#84908a]"><tr><th className="px-4 py-3.5">Product</th><th className="px-3 py-3.5">On hand</th><th className="px-3 py-3.5">Available</th><th className="px-3 py-3.5">Threshold</th><th className="px-3 py-3.5">Health</th><th className="px-4 py-3.5">Drafts</th></tr></thead><tbody className="divide-y divide-[#edf0ee]">{visible.map((item) => <tr className={`cursor-pointer text-[8.5px] ${selected?.id === item.id ? "bg-[#f2f7f5]" : "hover:bg-[#fafcfb]"}`} key={item.id} onClick={() => setSelectedId(item.id)}><td className="px-4 py-3.5"><b className="block max-w-[320px] truncate text-[9px] text-[#35443d]">{item.name}</b><small className="mt-1 block text-[7px] text-[#909b95]">{item.sku || `Product #${item.id}`} · {item.brand || "Brand not set"}</small></td><td className="px-3 py-3.5 font-bold text-[#405049]">{item.onHand}</td><td className="px-3 py-3.5 font-bold text-[#405049]">{item.available}</td><td className="px-3 py-3.5 text-[#75827c]">{item.lowStockThreshold}</td><td className="px-3 py-3.5"><span className={`rounded-full px-2 py-1 text-[6.5px] font-bold ring-1 ring-inset ${healthTone(item.health)}`}>{healthLabel(item.health)}</span></td><td className="px-4 py-3.5">{item.adjustmentDrafts ? <span className="rounded-full bg-amber-50 px-2 py-1 text-[6.5px] font-bold text-amber-700">{item.adjustmentDrafts} review</span> : <span className="text-[#a0aaa5]">—</span>}</td></tr>)}</tbody></table></div> : <div className="flex min-h-[420px] items-center justify-center text-center"><div><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3f4] text-[#426d72]"><Icon name="box" size={20}/></span><h2 className="mt-3 text-[13px] font-bold text-[#34443d]">No matching stock record</h2><p className="mt-1 text-[8.5px] text-[#85918b]">Clear the search or filter.</p></div></div>}</div><aside className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">{selected ? <><div className="border-b border-[#e7ece9] p-5"><p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-[#7d8983]">Stock inspector</p><h2 className="mt-1.5 text-[17px] font-bold leading-6 text-[#26362f]">{selected.name}</h2><p className="mt-1 text-[7.5px] text-[#87928d]">{selected.sku || `Product #${selected.id}`} · {selected.category || "No category"}</p></div><div className="space-y-4 p-5"><div className="flex h-40 items-center justify-center rounded-2xl bg-[#eef4f2] text-[#426d72]" style={productImageUrl(selected.image) ? { backgroundImage: `url(${productImageUrl(selected.image)})`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "contain" } : undefined}>{!productImageUrl(selected.image) ? <Icon name="box" size={28}/> : null}</div><div className="grid grid-cols-2 gap-2">{[["On hand", selected.onHand], ["Available", selected.available], ["Reserved", `${selected.reserved} · not connected`], ["Incoming", `${selected.incoming} · not connected`]].map(([label, value]) => <div className="rounded-xl border border-[#e2e8e5] p-3" key={label}><span className="text-[6.5px] font-bold uppercase tracking-[.08em] text-[#929d97]">{label}</span><b className="mt-1.5 block truncate text-[8.5px] text-[#405049]">{value}</b></div>)}</div><button className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#426d72] text-[9px] font-bold text-white" onClick={openAdjustment} type="button"><Icon name="plus"/>Create adjustment draft</button><button className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#dce4e0] text-[8.5px] font-bold text-[#5f7068]" onClick={() => onNavigate("Purchase Stock Entry")} type="button"><Icon name="box"/>Open purchasing</button><div className="rounded-xl bg-[#edf3f4] p-4"><div className="flex items-center gap-2"><Icon name="history"/><b className="text-[8px] text-[#405b58]">Recent movement evidence</b></div>{selectedMovements.length ? <div className="mt-3 divide-y divide-[#dce6e2]">{selectedMovements.map((item) => <div className="py-2.5" key={item.id}><div className="flex items-center justify-between"><b className="text-[7.5px] text-[#405049]">{signed(item.quantityDelta)} units · {item.reason}</b><span className="text-[6.5px] text-[#87928d]">#{item.id}</span></div><p className="mt-1 text-[6.5px] text-[#788984]">{item.beforeQuantity} → {item.afterQuantity} · {item.referenceCode} · {dateText(item.createdAt)}</p></div>)}</div> : <p className="mt-2 text-[7px] leading-4 text-[#72857f]">No Phase 55 movement has been posted for this product. Existing balances remain the source of truth.</p>}</div></div></> : <div className="p-10 text-center text-[9px] font-bold text-[#829089]">Select a stock record</div>}</aside></section>{adjustOpen && selected ? <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#17231f]/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target && !saving) setAdjustOpen(false); }}><section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.25)]"><header className="flex items-start justify-between border-b border-[#e8ecea] p-5"><div><p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#3b646d]">Controlled stock movement</p><h2 className="mt-1.5 text-[18px] font-bold text-[#23322b]">{selected.name}</h2><p className="mt-1 text-[7.5px] text-[#87928d]">Draft first. Live balance changes only after separate human confirmation.</p></div><button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5f3] text-[#65736c]" disabled={saving} onClick={() => setAdjustOpen(false)} type="button"><Icon name="close"/></button></header><div className="space-y-4 p-5"><div className="grid grid-cols-3 gap-2">{(["increase", "decrease", "count"] as MovementType[]).map((item) => <button className={`h-10 rounded-xl border text-[8px] font-bold ${movementType === item ? "border-[#426d72] bg-[#edf3f4] text-[#426d72]" : "border-[#dce4e0] text-[#718079]"}`} disabled={Boolean(draftId)} key={item} onClick={() => chooseMovement(item)} type="button">{item === "count" ? "Cycle count" : item.charAt(0).toUpperCase() + item.slice(1)}</button>)}</div><div className="grid gap-3 sm:grid-cols-2"><label className="text-[7.5px] font-bold uppercase tracking-[.08em] text-[#65736c]">{movementType === "count" ? "Counted on-hand" : "Movement quantity"}<input className="mt-2 h-10 w-full rounded-xl border border-[#dce4e0] px-3 text-[9px] font-bold outline-none" disabled={Boolean(draftId)} min="0" onChange={(event) => setQuantity(Math.max(0, Number(event.target.value) || 0))} type="number" value={quantity}/></label><label className="text-[7.5px] font-bold uppercase tracking-[.08em] text-[#65736c]">Reason<select className="mt-2 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[8px] font-semibold normal-case tracking-normal outline-none" disabled={Boolean(draftId)} onChange={(event) => setReason(event.target.value)} value={reason}><option>Cycle count correction</option><option>Opening balance correction</option><option>Damage / sample / write-off</option><option>Supplier correction</option><option>Other approved reason</option></select></label></div><label className="block text-[7.5px] font-bold uppercase tracking-[.08em] text-[#65736c]">Supporting reference<input className="mt-2 h-10 w-full rounded-xl border border-[#dce4e0] px-3 text-[9px] font-semibold normal-case tracking-normal outline-none" disabled={Boolean(draftId)} onChange={(event) => setReferenceCode(event.target.value)} placeholder="Count sheet or approved document ID" value={referenceCode}/></label><label className="block text-[7.5px] font-bold uppercase tracking-[.08em] text-[#65736c]">Internal note<textarea className="mt-2 min-h-20 w-full resize-y rounded-xl border border-[#dce4e0] p-3 text-[9px] font-medium normal-case tracking-normal outline-none" disabled={Boolean(draftId)} onChange={(event) => setInternalNote(event.target.value)} placeholder="What was physically verified?" value={internalNote}/></label><div className={`rounded-xl border p-4 ${preview < 0 ? "border-rose-200 bg-rose-50" : "border-[#d8e4e1] bg-[#edf3f4]"}`}><p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#70837f]">Balance preview</p><b className="mt-1 block text-[13px] text-[#405b58]">{draftId ? expectedBefore : selected.onHand} → {draftId ? expectedAfter : preview} on hand</b><p className="mt-2 text-[7px] leading-4 text-[#72857f]">Order-linked deductions, returns and purchase receipts must stay in their owning workflows.</p></div>{draftId ? <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><input checked={postConfirmed} className="mt-0.5 h-4 w-4 accent-[#426d72]" onChange={(event) => setPostConfirmed(event.target.checked)} type="checkbox"/><span><b className="block text-[8.5px] text-amber-800">I verified the physical quantity and reference</b><small className="mt-1 block text-[7px] leading-4 text-amber-700">Posting creates an immutable movement with actor, reason, reference, time and before/after balance.</small></span></label> : <div className="rounded-xl border border-[#dfe6e3] p-4 text-[7.5px] leading-4 text-[#6e7d76]">Saving this draft does not change the live product stock.</div>}</div><footer className="flex flex-col-reverse gap-2 border-t border-[#e8ecea] p-4 sm:flex-row sm:justify-end"><button className="h-10 rounded-xl border border-[#dce4e0] px-4 text-[8.5px] font-bold text-[#65736c]" disabled={saving} onClick={() => setAdjustOpen(false)} type="button">Close</button>{draftId ? <><button className="h-10 rounded-xl border border-rose-100 px-4 text-[8.5px] font-bold text-rose-700 disabled:opacity-40" disabled={saving} onClick={() => void discardDraft()} type="button">Discard draft</button><button className="h-10 rounded-xl bg-[#426d72] px-5 text-[8.5px] font-bold text-white disabled:opacity-40" disabled={!postConfirmed || saving} onClick={() => void postDraft()} type="button">{saving ? "Posting..." : "Post confirmed movement"}</button></> : <button className="h-10 rounded-xl bg-[#426d72] px-5 text-[8.5px] font-bold text-white disabled:opacity-40" disabled={!draftReady || saving} onClick={() => void saveDraft()} type="button">{saving ? "Saving..." : "Save adjustment draft"}</button>}</footer></section></div> : null}{notice ? <div className="fixed bottom-6 right-6 z-[100] max-w-sm rounded-xl bg-[#335e63] px-4 py-3 text-[9.5px] font-bold leading-5 text-white shadow-xl">{notice}</div> : null}</div>;
}
