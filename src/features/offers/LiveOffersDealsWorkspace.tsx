"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { getCatalogProducts, type CatalogProduct } from "@/features/products/products-client";
import {
  changeOfferStatus,
  fetchOffersState,
  saveOfferDraft,
  type LiveOffer,
  type OfferChannel,
  type OfferDraftInput,
  type OfferEffectiveStatus,
  type OffersState,
  type OfferType,
} from "./offers-client";

type Filter = "all" | "active" | "scheduled" | "draft" | "paused" | "review";
type StatusAction = "publish" | "pause" | "end" | "archive";
type IconName = "alert" | "calendar" | "check" | "coupon" | "eye" | "pause" | "plus" | "refresh" | "search" | "store";

const iconPaths: Record<IconName, ReactNode> = {
  alert: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  coupon: <><path d="M20 12a2 2 0 0 0 0-4V5H4v3a2 2 0 0 0 0 4v3a2 2 0 0 0 0 4v2h16v-2a2 2 0 0 0 0-4Z"/><path d="M13 5v16"/></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  pause: <><path d="M9 5v14M15 5v14"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  store: <><path d="M3 9 5 3h14l2 6"/><path d="M5 13v8h14v-8M9 21v-6h6v6"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/></>,
};

function Icon({ name, size = 15 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{iconPaths[name]}</svg>;
}

const emptyState: OffersState = {
  generatedAt: "",
  offers: [],
  summary: { activeNow: 0, archived: 0, drafts: 0, needsReview: 0, paused: 0, scheduled: 0, total: 0 },
};

const emptyDraft: OfferDraftInput = {
  channels: ["website"],
  code: "",
  discountValue: 0,
  eligibilitySummary: "",
  endsAt: "",
  homepageEligible: false,
  id: "",
  maximumDiscount: null,
  minimumOrder: 0,
  name: "",
  notes: "",
  perCustomerLimit: 1,
  productIds: [],
  stackable: false,
  startsAt: "",
  usageLimit: null,
  offerType: "percentage",
};

const statusLabel: Record<OfferEffectiveStatus, string> = {
  active: "Active now",
  archived: "Archived",
  draft: "Draft",
  ended: "Ended",
  expired: "Expired",
  paused: "Paused",
  scheduled: "Scheduled",
};

const statusTone: Record<OfferEffectiveStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  archived: "bg-slate-100 text-slate-500 ring-slate-200",
  draft: "bg-[#edf3f4] text-[#4f706d] ring-[#cfddda]",
  ended: "bg-rose-50 text-rose-700 ring-rose-200",
  expired: "bg-rose-50 text-rose-700 ring-rose-200",
  paused: "bg-amber-50 text-amber-700 ring-amber-200",
  scheduled: "bg-sky-50 text-sky-700 ring-sky-200",
};

function dateInput(value: string) {
  return value ? value.slice(0, 16).replace(" ", "T") : "";
}

function dateLabel(value: string) {
  if (!value) return "Open";
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-US", { day: "numeric", hour: "numeric", minute: "2-digit", month: "short", year: "numeric" });
}

function money(value: number | null) {
  if (value === null) return "No cap";
  return `BDT ${Math.round(value).toLocaleString("en-BD")}`;
}

function benefit(offer: LiveOffer) {
  if (offer.offerType === "free_shipping") return "Free shipping";
  if (offer.offerType === "fixed_amount") return `${money(offer.discountValue)} off`;
  return `${offer.discountValue}% off${offer.maximumDiscount !== null ? ` · max ${money(offer.maximumDiscount)}` : ""}`;
}

function toDraft(offer: LiveOffer): OfferDraftInput {
  return {
    channels: offer.channels,
    code: offer.code,
    discountValue: offer.discountValue,
    eligibilitySummary: offer.eligibilitySummary,
    endsAt: dateInput(offer.endsAt),
    homepageEligible: offer.homepageEligible,
    id: offer.id,
    maximumDiscount: offer.maximumDiscount,
    minimumOrder: offer.minimumOrder,
    name: offer.name,
    notes: offer.notes,
    perCustomerLimit: offer.perCustomerLimit,
    productIds: offer.productIds,
    stackable: offer.stackable,
    startsAt: dateInput(offer.startsAt),
    usageLimit: offer.usageLimit,
    offerType: offer.offerType,
  };
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-[7px] font-extrabold uppercase tracking-[.1em] text-[#74817b]">{label}</span>{children}</label>;
}

const inputClass = "h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[9px] font-semibold text-[#405049] outline-none focus:border-[#8eaaa6]";

function OfferModal({ draft, products, saving, onChange, onClose, onSave }: {
  draft: OfferDraftInput;
  products: CatalogProduct[];
  saving: boolean;
  onChange: (updates: Partial<OfferDraftInput>) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const [productQuery, setProductQuery] = useState("");
  const visibleProducts = products.filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(productQuery.toLowerCase())).slice(0, 80);
  const invalidDates = Boolean(draft.startsAt && draft.endsAt && new Date(draft.endsAt).getTime() <= new Date(draft.startsAt).getTime());
  const complete = draft.name.trim() && draft.eligibilitySummary.trim() && draft.channels.length && !invalidDates && (draft.offerType === "free_shipping" || draft.discountValue > 0);

  return <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#17231f]/40 p-3 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.25)]">
      <header className="sticky top-0 z-10 flex items-start justify-between border-b border-[#e8ecea] bg-white/95 p-5 backdrop-blur"><div><p className="text-[8px] font-extrabold uppercase tracking-[.15em] text-[#426d72]">Recoverable commercial draft</p><h2 className="mt-1.5 text-[18px] font-bold text-[#23322b]">{draft.id ? "Edit offer draft" : "New offer draft"}</h2><p className="mt-1 text-[7.5px] text-[#87928d]">Saving cannot change checkout, order totals or customer-visible status.</p></div><button className="h-9 rounded-xl border border-[#dfe6e3] px-3 text-[8px] font-bold text-[#6d7973]" onClick={onClose} type="button">Close</button></header>
      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Campaign name *"><input className={inputClass} onChange={(event) => onChange({ name: event.target.value })} placeholder="Customer-safe internal name" value={draft.name}/></Field><Field label="Offer code"><input className={inputClass} onChange={(event) => onChange({ code: event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })} placeholder="Required before publish" value={draft.code}/></Field></div>
          <div className="rounded-2xl border border-[#e2e8e5] p-4"><p className="text-[7px] font-extrabold uppercase tracking-[.12em] text-[#84908a]">Discount rule</p><div className="mt-3 grid gap-3 sm:grid-cols-3"><Field label="Type"><select className={inputClass} onChange={(event) => onChange({ offerType: event.target.value as OfferType })} value={draft.offerType}><option value="percentage">Percentage</option><option value="fixed_amount">Fixed amount</option><option value="free_shipping">Free shipping</option></select></Field><Field label="Value"><input className={inputClass} disabled={draft.offerType === "free_shipping"} min="0" onChange={(event) => onChange({ discountValue: Number(event.target.value) || 0 })} type="number" value={draft.offerType === "free_shipping" ? 0 : draft.discountValue}/></Field><Field label="Minimum order"><input className={inputClass} min="0" onChange={(event) => onChange({ minimumOrder: Number(event.target.value) || 0 })} type="number" value={draft.minimumOrder}/></Field></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Maximum discount"><input className={inputClass} min="0" onChange={(event) => onChange({ maximumDiscount: event.target.value ? Number(event.target.value) : null })} placeholder="No cap" type="number" value={draft.maximumDiscount ?? ""}/></Field><Field label="Eligibility summary *"><input className={inputClass} onChange={(event) => onChange({ eligibilitySummary: event.target.value })} placeholder="e.g. Selected products · min BDT 1,000" value={draft.eligibilitySummary}/></Field></div></div>
          <div className="rounded-2xl border border-[#e2e8e5] p-4"><p className="text-[7px] font-extrabold uppercase tracking-[.12em] text-[#84908a]">Schedule &amp; channels</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Starts"><input className={inputClass} onChange={(event) => onChange({ startsAt: event.target.value })} type="datetime-local" value={draft.startsAt}/></Field><Field label="Ends"><input className={inputClass} onChange={(event) => onChange({ endsAt: event.target.value })} type="datetime-local" value={draft.endsAt}/></Field></div>{invalidDates ? <p className="mt-2 text-[7px] font-bold text-rose-700">End time must be later than the start time.</p> : null}<div className="mt-4 flex flex-wrap gap-2">{(["website", "admin", "messenger", "facebook"] as OfferChannel[]).map((channel) => <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[7.5px] font-bold capitalize ${draft.channels.includes(channel) ? "border-[#9fb8b5] bg-[#edf3f4] text-[#3b646d]" : "border-[#dce4e0] text-[#718079]"}`} key={channel}><input checked={draft.channels.includes(channel)} className="accent-[#3b646d]" onChange={(event) => onChange({ channels: event.target.checked ? [...draft.channels, channel] : draft.channels.filter((item) => item !== channel) })} type="checkbox"/>{channel}</label>)}</div></div>
          <div className="rounded-2xl border border-[#e2e8e5] p-4"><div className="flex items-end justify-between gap-3"><div><p className="text-[7px] font-extrabold uppercase tracking-[.12em] text-[#84908a]">Linked products</p><p className="mt-1 text-[7px] text-[#8a9690]">Leave empty only when the written eligibility intentionally applies storewide.</p></div><span className="text-[8px] font-bold text-[#426d72]">{draft.productIds.length} selected</span></div><div className="relative mt-3"><Icon name="search" size={13}/><input className={`${inputClass} mt-2`} onChange={(event) => setProductQuery(event.target.value)} placeholder="Search live catalog..." value={productQuery}/></div><div className="mt-3 max-h-52 overflow-y-auto rounded-xl border border-[#e3e9e6]">{visibleProducts.map((product) => <label className="flex cursor-pointer items-center justify-between gap-3 border-b border-[#edf1ef] px-3 py-2.5 last:border-b-0" key={product.id}><span><b className="block text-[8px] text-[#405049]">{product.name}</b><small className="mt-1 block text-[6.5px] text-[#929d97]">{product.sku || `Product #${product.id}`} · stock {product.stock}</small></span><input checked={draft.productIds.includes(product.id)} className="h-4 w-4 accent-[#3b646d]" onChange={(event) => onChange({ productIds: event.target.checked ? [...draft.productIds, product.id] : draft.productIds.filter((id) => id !== product.id) })} type="checkbox"/></label>)}{!visibleProducts.length ? <p className="p-4 text-center text-[7px] text-[#8b9691]">No catalog product matches this search.</p> : null}</div></div>
        </div>
        <aside className="space-y-3">
          <div className="rounded-2xl border border-[#d8e4e1] bg-[#edf3f4] p-4"><p className="text-[7px] font-extrabold uppercase tracking-[.1em] text-[#5d7775]">Usage guardrails</p><div className="mt-3 grid grid-cols-2 gap-3"><Field label="Maximum uses"><input className={inputClass} min="1" onChange={(event) => onChange({ usageLimit: event.target.value ? Number(event.target.value) : null })} placeholder="Unlimited" type="number" value={draft.usageLimit ?? ""}/></Field><Field label="Per customer"><input className={inputClass} min="1" onChange={(event) => onChange({ perCustomerLimit: event.target.value ? Number(event.target.value) : null })} placeholder="Unlimited" type="number" value={draft.perCustomerLimit ?? ""}/></Field></div></div>
          <label className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-[#e2e8e5] p-4"><span><b className="block text-[8.5px] text-[#405049]">Allow stacking</b><small className="mt-1 block text-[7px] leading-4 text-[#929d97]">Checkout must still implement and verify explicit conflict rules.</small></span><input checked={draft.stackable} className="h-4 w-4 accent-[#3b646d]" onChange={(event) => onChange({ stackable: event.target.checked })} type="checkbox"/></label>
          <label className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-[#e2e8e5] p-4"><span><b className="block text-[8.5px] text-[#405049]">Homepage eligible</b><small className="mt-1 block text-[7px] leading-4 text-[#929d97]">Homepage CMS still owns creative, position and final display.</small></span><input checked={draft.homepageEligible} className="h-4 w-4 accent-[#3b646d]" onChange={(event) => onChange({ homepageEligible: event.target.checked })} type="checkbox"/></label>
          <Field label="Internal rule note"><textarea className="w-full resize-none rounded-xl border border-[#dce4e0] bg-white p-3 text-[9px] leading-5 outline-none focus:border-[#8eaaa6]" onChange={(event) => onChange({ notes: event.target.value })} placeholder="Evidence, exclusions, margin review or owner" rows={5} value={draft.notes}/></Field>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2 text-amber-800"><Icon name="alert"/><b className="text-[8px]">Publication remains separate</b></div><p className="mt-2 text-[7px] leading-4 text-amber-700">This saves a draft only. Publishing later requires a unique code, complete rule, human confirmation and an audit reason.</p></div>
        </aside>
      </div>
      <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-[#e8ecea] bg-white/95 p-4 backdrop-blur sm:flex-row sm:justify-end"><button className="h-10 rounded-xl border border-[#dce4e0] px-4 text-[8.5px] font-bold text-[#65736c]" onClick={onClose} type="button">Cancel</button><button className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#3b646d] px-5 text-[8.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={!complete || saving} onClick={onSave} type="button"><Icon name="check"/>{saving ? "Saving..." : "Save offer draft"}</button></footer>
    </section>
  </div>;
}

function StatusModal({ action, offer, saving, onAction, onClose }: { action: StatusAction; offer: LiveOffer; saving: boolean; onAction: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const requiresReason = true;
  const blocked = action === "publish" && !offer.readiness.ready;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#17231f]/40 p-3 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section className="w-full max-w-xl rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.25)]"><header className="border-b border-[#e8ecea] p-5"><p className="text-[8px] font-extrabold uppercase tracking-[.14em] text-[#426d72]">Human approval required</p><h2 className="mt-1.5 text-[18px] font-bold capitalize text-[#23322b]">{action} {offer.name}</h2><p className="mt-1 text-[7.5px] text-[#87928d]">The before/after state, actor, reason and time will be preserved.</p></header><div className="space-y-4 p-5">{blocked ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4"><b className="text-[8.5px] text-rose-800">Publication blockers</b><ul className="mt-2 space-y-1 text-[7px] text-rose-700">{offer.readiness.blockers.map((blocker) => <li key={blocker}>• {blocker}</li>)}</ul></div> : <div className="rounded-xl border border-[#d8e4e1] bg-[#edf3f4] p-4"><b className="text-[8.5px] text-[#405b58]">{action === "publish" ? "Makes the approved rule eligible for the public storefront feed." : action === "pause" ? "Removes the rule from the public feed without deleting history." : action === "end" ? "Closes the campaign permanently while preserving attribution." : "Removes the record from active operations while preserving evidence."}</b><p className="mt-2 text-[7px] leading-4 text-[#70837f]">No order total, payment, stock or existing customer record is changed by this action.</p></div>}<Field label={`${requiresReason ? "Audit reason *" : "Release note"}`}><textarea className="w-full resize-none rounded-xl border border-[#dce4e0] p-3 text-[9px] leading-5 outline-none" onChange={(event) => setReason(event.target.value)} rows={4} value={reason}/></Field><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#d8e4e1] bg-[#edf3f4] p-4"><input checked={confirmed} className="mt-0.5 h-4 w-4 accent-[#3b646d]" onChange={(event) => setConfirmed(event.target.checked)} type="checkbox"/><span><b className="block text-[8.5px] text-[#405b58]">I reviewed rule, schedule and customer impact</b><small className="mt-1 block text-[7px] leading-4 text-[#70837f]">Checkout integration remains a separately controlled implementation.</small></span></label></div><footer className="flex justify-end gap-2 border-t border-[#e8ecea] p-4"><button className="h-10 rounded-xl border border-[#dce4e0] px-4 text-[8.5px] font-bold text-[#65736c]" onClick={onClose} type="button">Cancel</button><button className={`h-10 rounded-xl px-5 text-[8.5px] font-bold text-white disabled:opacity-40 ${action === "publish" ? "bg-[#3b646d]" : action === "pause" ? "bg-amber-600" : "bg-rose-700"}`} disabled={blocked || !confirmed || !reason.trim() || saving} onClick={() => onAction(reason.trim())} type="button">{saving ? "Saving..." : `${action[0].toUpperCase()}${action.slice(1)} offer`}</button></footer></section></div>;
}

export function LiveOffersDealsWorkspace({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [state, setState] = useState<OffersState>(emptyState);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [focusedId, setFocusedId] = useState("");
  const [draft, setDraft] = useState<OfferDraftInput>(emptyDraft);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<StatusAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    setError("");
    setWarning("");
    const [offersResult, productsResult] = await Promise.allSettled([fetchOffersState(signal), getCatalogProducts(signal)]);
    if (offersResult.status === "rejected") {
      if (!(offersResult.reason instanceof DOMException && offersResult.reason.name === "AbortError")) setError(offersResult.reason instanceof Error ? offersResult.reason.message : "Offers & Deals is temporarily unavailable.");
    } else {
      setState(offersResult.value);
      setFocusedId((current) => current && offersResult.value.offers.some((offer) => offer.id === current) ? current : offersResult.value.offers[0]?.id ?? "");
    }
    if (productsResult.status === "rejected") {
      if (!(productsResult.reason instanceof DOMException && productsResult.reason.name === "AbortError")) setWarning("Offers loaded, but the product selector is temporarily unavailable.");
    } else setProducts(productsResult.value.products);
    if (!signal?.aborted) setLoading(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => void load(controller.signal));
    return () => controller.abort();
  }, [load]);

  const offers = useMemo(() => state.offers.filter((offer) => {
    const matchesQuery = `${offer.name} ${offer.code} ${offer.eligibilitySummary}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "active" && offer.effectiveStatus === "active") || (filter === "scheduled" && offer.effectiveStatus === "scheduled") || (filter === "draft" && offer.status === "draft") || (filter === "paused" && offer.status === "paused") || (filter === "review" && !offer.readiness.ready);
    return matchesQuery && matchesFilter && offer.status !== "archived";
  }), [filter, query, state.offers]);
  const focused = state.offers.find((offer) => offer.id === focusedId) ?? offers[0] ?? null;
  const showNotice = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2800); };

  const saveDraft = async () => {
    setSaving(true); setError("");
    try {
      const next = await saveOfferDraft(draft);
      setState(next);
      setEditorOpen(false);
      const selected = next.offers.find((offer) => offer.code === draft.code && offer.name === draft.name) ?? next.offers[0];
      setFocusedId(selected?.id ?? "");
      showNotice("Offer draft saved. No checkout or customer record changed.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Offer draft could not be saved."); }
    finally { setSaving(false); }
  };

  const applyStatus = async (reason: string) => {
    if (!focused || !pendingAction) return;
    setSaving(true); setError("");
    try {
      const next = await changeOfferStatus(focused.id, pendingAction, reason);
      setState(next); setPendingAction(null); showNotice(`Offer ${pendingAction} action recorded with audit evidence.`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Offer status could not be changed."); }
    finally { setSaving(false); }
  };

  const cards = [
    ["Total offers", state.summary.total, "Real campaign records", "coupon" as IconName],
    ["Active now", state.summary.activeNow, "Public feed eligible", "check" as IconName],
    ["Scheduled", state.summary.scheduled, "Starts in the future", "calendar" as IconName],
    ["Drafts", state.summary.drafts, "Internal work in progress", "coupon" as IconName],
    ["Needs review", state.summary.needsReview, "Missing publish requirements", "alert" as IconName],
  ] as const;
  const filters: [Filter, string, number][] = [["all", "All", state.summary.total], ["active", "Active", state.summary.activeNow], ["scheduled", "Scheduled", state.summary.scheduled], ["draft", "Draft", state.summary.drafts], ["paused", "Paused", state.summary.paused], ["review", "Review", state.summary.needsReview]];

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="flex items-center gap-2 text-[8.5px] font-extrabold uppercase tracking-[.18em] text-[#547874]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Live promotion rules</p><h1 className="mt-2 text-[26px] font-bold tracking-[-.045em] text-[#17231f]">Offers &amp; deals command center</h1><p className="mt-1.5 max-w-3xl text-[10px] font-medium text-[#74817b]">Create recoverable promotion drafts, link real products and publish only after a separate human review.</p></div><div className="flex flex-wrap gap-2"><button className="inline-flex items-center gap-2 rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[9px] font-bold text-[#62706a] disabled:opacity-50" disabled={loading} onClick={() => { setLoading(true); void load(); }} type="button"><Icon name="refresh"/>Refresh</button><button className="inline-flex items-center gap-2 rounded-xl bg-[#426d72] px-4 py-2.5 text-[9px] font-bold text-white" onClick={() => { setDraft({ ...emptyDraft }); setEditorOpen(true); }} type="button"><Icon name="plus"/>New offer draft</button></div></header>
    <section className="flex flex-col gap-3 rounded-2xl border border-[#d9e5e3] bg-[#edf6f6] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#426d72]"><Icon name="coupon" size={18}/></span><div><b className="text-[8px] text-[#3d625f]">Offers + product links · MySQL connected</b><p className="mt-1 text-[6.5px] text-[#758781]">Draft save never changes customer totals; public feed contains only human-published, currently scheduled rules.</p></div></div><span className="self-start rounded-full bg-white px-3 py-2 text-[6.5px] font-bold text-[#54716c] sm:self-auto">Draft → human approval → public feed</span></section>
    {error ? <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[8px] font-bold text-rose-700"><span>{error}</span><button className="underline" onClick={() => { setLoading(true); void load(); }} type="button">Try again</button></div> : null}{warning ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[8px] font-bold text-amber-700">{warning}</div> : null}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, detail, icon]) => <article className="rounded-2xl border border-[#dfe6e3] bg-white p-4" key={label}><div className="flex items-start justify-between"><div><p className="text-[7px] font-extrabold uppercase tracking-[.12em] text-[#7c8983]">{label}</p><b className="mt-2 block text-[20px] tracking-[-.04em] text-[#17231f]">{value}</b></div><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${icon === "alert" && value ? "bg-amber-50 text-amber-700" : "bg-[#edf3f4] text-[#426d72]"}`}><Icon name={icon}/></span></div><p className="mt-4 border-t border-[#edf0ee] pt-3 text-[6.5px] text-[#84908a]">{detail}</p></article>)}</section>
    <section className="grid min-h-[660px] gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
      <article className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white"><div className="border-b border-[#e8ecea] p-4"><label className="relative block"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#93a09a]"><Icon name="search"/></span><input className="h-11 w-full rounded-xl border border-[#dfe6e3] pl-10 pr-3 text-[9.5px] font-semibold outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Search offer name, code or eligibility..." value={query}/></label><div className="mt-3 flex flex-wrap gap-2">{filters.map(([key, label, count]) => <button className={`rounded-lg px-3 py-2 text-[8px] font-bold ${filter === key ? "bg-[#426d72] text-white" : "bg-[#f2f5f3] text-[#6f7c76]"}`} key={key} onClick={() => setFilter(key)} type="button">{label} {count}</button>)}</div></div>
        {loading && !state.offers.length ? <div className="flex min-h-[520px] items-center justify-center text-[9px] font-bold text-[#84908a]">Loading real offer records...</div> : offers.length ? <div className="divide-y divide-[#edf0ee]">{offers.map((offer) => <button className={`grid w-full gap-3 p-4 text-left hover:bg-[#fafbfa] sm:grid-cols-[minmax(0,1.2fr)_minmax(100px,.55fr)_minmax(110px,.55fr)_auto] sm:items-center ${focused?.id === offer.id ? "bg-[#f3f7f5]" : ""}`} key={offer.id} onClick={() => setFocusedId(offer.id)} type="button"><div><div className="flex flex-wrap items-center gap-2"><b className="text-[9px] text-[#405049]">{offer.name}</b><span className={`rounded-full px-2 py-1 text-[6px] font-bold ring-1 ring-inset ${statusTone[offer.effectiveStatus]}`}>{statusLabel[offer.effectiveStatus]}</span></div><p className="mt-1.5 text-[6.5px] text-[#8b9691]">{offer.code || "Code required before publish"} · {offer.eligibilitySummary}</p></div><div><span className="block text-[6px] uppercase tracking-[.08em] text-[#929d97]">Benefit</span><b className="mt-1 block text-[8px] text-[#405049]">{benefit(offer)}</b></div><div><span className="block text-[6px] uppercase tracking-[.08em] text-[#929d97]">Linked products</span><b className="mt-1 block text-[8px] text-[#405049]">{offer.productIds.length || "Storewide"}</b></div><span className="text-[8px] font-bold text-[#426d72]">Inspect →</span></button>)}</div> : <div className="flex min-h-[520px] flex-col items-center justify-center px-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3f4] text-[#426d72]"><Icon name="coupon" size={19}/></span><b className="mt-4 text-[10px] text-[#34433d]">No offer record found</b><p className="mt-1.5 text-[7px] text-[#8b9691]">Create a real draft only when a promotion is intended.</p><button className="mt-4 rounded-xl bg-[#426d72] px-4 py-2.5 text-[8px] font-bold text-white" onClick={() => { setDraft({ ...emptyDraft }); setEditorOpen(true); }} type="button">New offer draft</button></div>}
      </article>
      <aside className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">{focused ? <><div className="border-b border-[#e8ecea] p-5"><p className="text-[7px] font-extrabold uppercase tracking-[.12em] text-[#7d8983]">Rule inspector</p><div className="mt-2 flex flex-wrap items-center gap-2"><h2 className="text-[15px] font-bold text-[#26362f]">{focused.name}</h2><span className={`rounded-full px-2 py-1 text-[6px] font-bold ring-1 ring-inset ${statusTone[focused.effectiveStatus]}`}>{statusLabel[focused.effectiveStatus]}</span></div><p className="mt-1.5 font-mono text-[7px] text-[#8a9690]">{focused.code || "No code assigned"}</p></div><div className="space-y-4 p-5"><div className="grid grid-cols-2 gap-3">{[["Benefit", benefit(focused)], ["Minimum order", money(focused.minimumOrder)], ["Usage limit", focused.usageLimit ?? "Unlimited"], ["Per customer", focused.perCustomerLimit ?? "Unlimited"]].map(([label, value]) => <div className="rounded-xl border border-[#e3e9e6] p-3" key={label}><span className="text-[6px] font-bold uppercase tracking-[.08em] text-[#929d97]">{label}</span><b className="mt-1.5 block text-[8.5px] text-[#405049]">{value}</b></div>)}</div><div className="rounded-xl bg-[#f5f8f6] p-4"><p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#7d8983]">Eligibility</p><b className="mt-2 block text-[8.5px] text-[#405049]">{focused.eligibilitySummary}</b><p className="mt-2 text-[7px] leading-4 text-[#84908a]">{focused.productIds.length ? `${focused.productIds.length} real product link(s)` : "Storewide scope claimed by the written rule"}</p></div><div className="grid grid-cols-2 gap-3"><div><span className="text-[6px] font-bold uppercase text-[#929d97]">Starts</span><b className="mt-1 block text-[7.5px] text-[#405049]">{dateLabel(focused.startsAt)}</b></div><div><span className="text-[6px] font-bold uppercase text-[#929d97]">Ends</span><b className="mt-1 block text-[7.5px] text-[#405049]">{dateLabel(focused.endsAt)}</b></div></div><div><span className="text-[6px] font-bold uppercase text-[#929d97]">Channels</span><div className="mt-2 flex flex-wrap gap-1.5">{focused.channels.map((channel) => <span className="rounded-full bg-[#edf3f4] px-2 py-1 text-[6.5px] font-bold capitalize text-[#4f706d]" key={channel}>{channel}</span>)}</div></div>{focused.readiness.ready ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex items-center gap-2 text-emerald-800"><Icon name="check"/><b className="text-[8px]">Publication requirements complete</b></div><p className="mt-2 text-[7px] leading-4 text-emerald-700">A human still needs to confirm publication and record a reason.</p></div> : <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2 text-amber-800"><Icon name="alert"/><b className="text-[8px]">Needs review</b></div><ul className="mt-2 space-y-1 text-[7px] text-amber-700">{focused.readiness.blockers.map((blocker) => <li key={blocker}>• {blocker}</li>)}</ul></div>}<div className="grid gap-2 sm:grid-cols-2"><button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#426d72] text-[8px] font-bold text-white disabled:opacity-40" disabled={focused.status === "active" || focused.status === "ended" || focused.status === "archived"} onClick={() => setPendingAction("publish")} type="button"><Icon name="eye"/>Publish</button><button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dce4e0] text-[8px] font-bold text-[#66746e] disabled:opacity-40" disabled={focused.status !== "draft" && focused.status !== "paused"} onClick={() => { setDraft(toDraft(focused)); setEditorOpen(true); }} type="button">Edit draft</button><button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-200 text-[8px] font-bold text-amber-700 disabled:opacity-40" disabled={focused.status !== "active"} onClick={() => setPendingAction("pause")} type="button"><Icon name="pause"/>Pause</button><button className="h-10 rounded-xl border border-rose-200 text-[8px] font-bold text-rose-700 disabled:opacity-40" disabled={focused.status === "archived"} onClick={() => setPendingAction(focused.status === "draft" || focused.status === "ended" ? "archive" : "end")} type="button">{focused.status === "draft" || focused.status === "ended" ? "Archive" : "End"}</button></div><button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#dce4e0] py-3 text-[8px] font-bold text-[#426d72]" onClick={() => onNavigate("Homepage CMS")} type="button"><Icon name="store"/>Open Homepage CMS</button><div className="rounded-xl bg-[#edf3f4] p-4"><b className="text-[8px] text-[#405b58]">Checkout boundary</b><p className="mt-2 text-[7px] leading-4 text-[#70837f]">Phase 63 publishes an authoritative feed. It does not silently add a discount engine or rewrite any existing checkout total.</p></div></div></> : <div className="flex min-h-[650px] flex-col items-center justify-center px-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3f4] text-[#426d72]"><Icon name="coupon" size={19}/></span><b className="mt-4 text-[10px] text-[#34433d]">Select an offer</b><p className="mt-1.5 text-[7px] text-[#8b9691]">Choose a real draft or create the first one.</p></div>}</aside>
    </section>
    <section className="grid gap-3 lg:grid-cols-3"><article className="rounded-2xl border border-[#dfe6e3] bg-white p-4"><p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#84908a]">Source of truth</p><b className="mt-2 block text-[9px] text-[#405049]">MySQL rules and product links</b><p className="mt-2 text-[7px] leading-4 text-[#87928d]">No browser-only campaign state and no seeded promotion.</p></article><article className="rounded-2xl border border-[#dfe6e3] bg-white p-4"><p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#84908a]">Controlled release</p><b className="mt-2 block text-[9px] text-[#405049]">Draft and publish stay separate</b><p className="mt-2 text-[7px] leading-4 text-[#87928d]">Status changes require human confirmation and append-only evidence.</p></article><article className="rounded-2xl border border-[#d5e2df] bg-[#edf3f4] p-4"><p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#5e7875]">Safety boundary</p><b className="mt-2 block text-[9px] text-[#304d4d]">Zero automatic order mutation</b><p className="mt-2 text-[7px] leading-4 text-[#647b77]">Publishing does not change orders, payments, stock or customer history.</p></article></section>
    {editorOpen ? <OfferModal draft={draft} onChange={(updates) => setDraft((current) => ({ ...current, ...updates }))} onClose={() => setEditorOpen(false)} onSave={() => void saveDraft()} products={products} saving={saving}/> : null}
    {pendingAction && focused ? <StatusModal action={pendingAction} offer={focused} onAction={(reason) => void applyStatus(reason)} onClose={() => setPendingAction(null)} saving={saving}/> : null}
    {notice ? <div className="fixed bottom-5 right-5 z-[110] max-w-sm rounded-xl bg-[#223c3f] px-4 py-3 text-[9px] font-semibold leading-5 text-white shadow-xl">{notice}</div> : null}
  </div>;
}
