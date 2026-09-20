"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  archiveReviewEntry,
  defaultReviewsCmsConfig,
  fetchReviewsCmsState,
  moderateReviewEntry,
  publishReviewsCms,
  restoreReviewsCmsDraft,
  saveReviewEntry,
  saveReviewsCmsDraft,
  type ReviewEntry,
  type ReviewsCmsConfig,
  type ReviewsCmsVersion,
} from "@/features/reviews-results/reviews-results-client";

type Tab = "Review queue" | "Section settings" | "Moderation safeguards" | "Version history";
type EntryForm = Omit<ReviewEntry, "createdAt" | "updatedAt">;
type IconName = "alert" | "archive" | "check" | "close" | "edit" | "eye" | "history" | "plus" | "refresh" | "save" | "shield" | "star";

const iconPaths: Record<IconName, ReactNode> = {
  alert: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  archive: <><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v12h14V8M10 12h4"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></>,
  save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  star: <path d="m12 2.5 3 6 6.7 1-4.9 4.7 1.2 6.7-6-3.2-6 3.2 1.2-6.7-4.9-4.7 6.7-1Z"/>,
};

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{iconPaths[name]}</svg>;
}

const emptyEntry = (): EntryForm => ({
  adminNote: "", consentObtained: false, customerDisplayName: "", duration: "", entryType: "review",
  featured: false, id: 0, mediaUrl: "", orderReference: "", productName: "", rating: 5,
  reviewText: "", source: "manual", status: "pending", verifiedPurchase: false,
});

const inputClass = "mt-1.5 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[10px] font-semibold normal-case tracking-normal text-[#405049] outline-none focus:border-[#719294]";
const textareaClass = `${inputClass} h-24 resize-y py-3`;

function dateText(value: string | null) {
  if (!value) return "Not published yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not published yet" : new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function statusTone(status: ReviewEntry["status"]) {
  if (status === "approved") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "rejected") return "bg-rose-50 text-rose-700 ring-rose-200";
  if (status === "archived") return "bg-slate-100 text-slate-600 ring-slate-200";
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return <button aria-label={`Toggle ${label}`} className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-[#416f73]" : "bg-[#d8dfdc]"}`} onClick={onChange} type="button"><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`}/></button>;
}

function Kpi({ helper, icon, label, value }: { helper: string; icon: IconName; label: string; value: string }) {
  return <article className="rounded-2xl border border-[#e0e7e4] bg-white p-4 shadow-[0_1px_2px_rgba(25,50,45,.03)]"><div className="flex items-start justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[.08em] text-[#718079]">{label}</p><p className="mt-2 text-[24px] font-bold tracking-[-.04em] text-[#17231f]">{value}</p></div><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#edf4f3] text-[#3d696d]"><Icon name={icon} size={14}/></span></div><p className="mt-3 border-t border-[#eff2f0] pt-2.5 text-[8.5px] font-semibold text-[#77847e]">{helper}</p></article>;
}

function Modal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#10211d]/45 p-4"><section className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-2xl border border-[#dfe6e2] bg-[#fbfcfb] shadow-2xl"><header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e4e9e6] bg-white px-5 py-4"><div><p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#819089]">Reviews &amp; Real Results</p><h3 className="mt-1 text-base font-bold text-[#17231f]">{title}</h3></div><button aria-label="Close" className="rounded-lg border border-[#dfe6e2] p-2 text-[#60716a]" onClick={onClose} type="button"><Icon name="close" size={15}/></button></header>{children}</section></div>;
}

export function LiveReviewsResultsWorkspace() {
  const [config, setConfig] = useState<ReviewsCmsConfig>(defaultReviewsCmsConfig);
  const [liveConfig, setLiveConfig] = useState<ReviewsCmsConfig>(defaultReviewsCmsConfig);
  const [entries, setEntries] = useState<ReviewEntry[]>([]);
  const [versions, setVersions] = useState<ReviewsCmsVersion[]>([]);
  const [version, setVersion] = useState(1);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Review queue");
  const [statusFilter, setStatusFilter] = useState<"all" | ReviewEntry["status"]>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | ReviewEntry["entryType"]>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(0);
  const [entryOpen, setEntryOpen] = useState(false);
  const [entryDraft, setEntryDraft] = useState<EntryForm>(emptyEntry);
  const [moderationOpen, setModerationOpen] = useState(false);
  const [moderationStatus, setModerationStatus] = useState<ReviewEntry["status"]>("approved");
  const [moderationFeatured, setModerationFeatured] = useState(false);
  const [moderationNote, setModerationNote] = useState("");
  const [humanConfirmed, setHumanConfirmed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishConfirmed, setPublishConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);

  const selected = entries.find((entry) => entry.id === selectedId) || null;
  const pending = entries.filter((entry) => entry.status === "pending").length;
  const approved = entries.filter((entry) => entry.status === "approved").length;
  const featured = entries.filter((entry) => entry.status === "approved" && entry.featured).length;
  const approvedRatings = entries.filter((entry) => entry.status === "approved").map((entry) => entry.rating);
  const averageRating = approvedRatings.length ? (approvedRatings.reduce((sum, rating) => sum + rating, 0) / approvedRatings.length).toFixed(1) : "—";
  const draftDifferentFromLive = useMemo(() => JSON.stringify(config) !== JSON.stringify(liveConfig), [config, liveConfig]);
  const validationBlockers = useMemo(() => {
    const blockers: string[] = [];
    if (config.visible && !config.heading.trim()) blockers.push("A visible section needs a heading.");
    if (config.visible && !config.supportingLine.trim()) blockers.push("A visible section needs a supporting line.");
    return blockers;
  }, [config]);
  const filtered = useMemo(() => entries.filter((entry) => {
    const haystack = `${entry.customerDisplayName} ${entry.productName} ${entry.reviewText} ${entry.orderReference}`.toLowerCase();
    return (statusFilter === "all" || entry.status === statusFilter) && (typeFilter === "all" || entry.entryType === typeFilter) && haystack.includes(search.trim().toLowerCase());
  }), [entries, search, statusFilter, typeFilter]);
  const previewEntries = useMemo(() => entries.filter((entry) => entry.status === "approved" && entry.consentObtained && entry.rating >= config.minimumRating).sort((a, b) => Number(b.featured) - Number(a.featured) || b.id - a.id).slice(0, config.displayLimit), [config.displayLimit, config.minimumRating, entries]);

  const showNotice = useCallback((message: string, error = false) => {
    setNotice(message); setNoticeError(error); window.setTimeout(() => setNotice(""), 3600);
  }, []);

  const applyState = useCallback((state: Awaited<ReturnType<typeof fetchReviewsCmsState>>) => {
    setConfig(state.draft); setLiveConfig(state.live); setEntries(state.entries); setVersions(state.versions);
    setVersion(state.version); setPublishedAt(state.publishedAt); setIsDirty(false);
    setSelectedId((current) => state.entries.some((entry) => entry.id === current) ? current : state.entries[0]?.id || 0);
  }, []);

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true); setLoadError("");
    try { applyState(await fetchReviewsCmsState(signal)); }
    catch (error) { if (!signal?.aborted) setLoadError(error instanceof Error ? error.message : "Reviews could not be loaded."); }
    finally { if (!signal?.aborted) setIsLoading(false); }
  }, [applyState]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void load(controller.signal), 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [load]);

  function changeConfig(patch: Partial<ReviewsCmsConfig>) { setConfig((current) => ({ ...current, ...patch })); setIsDirty(true); }

  function openEntry(entry?: ReviewEntry) {
    setEntryDraft(entry ? { adminNote: entry.adminNote, consentObtained: entry.consentObtained, customerDisplayName: entry.customerDisplayName, duration: entry.duration, entryType: entry.entryType, featured: false, id: entry.id, mediaUrl: entry.mediaUrl, orderReference: entry.orderReference, productName: entry.productName, rating: entry.rating, reviewText: entry.reviewText, source: entry.source, status: "pending", verifiedPurchase: entry.verifiedPurchase } : emptyEntry());
    setEntryOpen(true);
  }

  async function saveEntry() {
    if (!entryDraft.customerDisplayName.trim() || !entryDraft.productName.trim() || !entryDraft.reviewText.trim()) { showNotice("Customer display name, product and review are required.", true); return; }
    if (entryDraft.entryType === "real_result" && !entryDraft.duration.trim()) { showNotice("Real Result stories need a usage duration.", true); return; }
    setIsSaving(true);
    try { const state = await saveReviewEntry(entryDraft); applyState(state); setEntryOpen(false); setTab("Review queue"); showNotice("Review saved in Pending for human moderation."); }
    catch (error) { showNotice(error instanceof Error ? error.message : "Review could not be saved.", true); }
    finally { setIsSaving(false); }
  }

  function openModeration(entry: ReviewEntry) {
    setSelectedId(entry.id); setModerationStatus(entry.status === "archived" ? "pending" : entry.status);
    setModerationFeatured(entry.featured); setModerationNote(entry.adminNote); setHumanConfirmed(false); setModerationOpen(true);
  }

  async function saveModeration() {
    if (!selected) return;
    if (!humanConfirmed) { showNotice("A human moderator must confirm the decision.", true); return; }
    if (moderationStatus === "approved" && !selected.consentObtained) { showNotice("Customer consent is required before approval.", true); return; }
    if (moderationFeatured && (moderationStatus !== "approved" || selected.rating < 4)) { showNotice("Only approved 4–5 star reviews can be featured.", true); return; }
    setIsSaving(true);
    try { applyState(await moderateReviewEntry(selected.id, moderationStatus, moderationFeatured, moderationNote)); setModerationOpen(false); showNotice("Moderation decision saved."); }
    catch (error) { showNotice(error instanceof Error ? error.message : "Moderation could not be saved.", true); }
    finally { setIsSaving(false); }
  }

  async function archive(entry: ReviewEntry) {
    if (!window.confirm(`Archive the review from ${entry.customerDisplayName}? The record will be retained.`)) return;
    setIsSaving(true);
    try { applyState(await archiveReviewEntry(entry.id)); showNotice("Review archived; the source record was retained."); }
    catch (error) { showNotice(error instanceof Error ? error.message : "Review could not be archived.", true); }
    finally { setIsSaving(false); }
  }

  async function saveDraft() {
    setIsSaving(true);
    try { applyState(await saveReviewsCmsDraft(config)); showNotice("Reviews section draft saved."); }
    catch (error) { showNotice(error instanceof Error ? error.message : "Draft could not be saved.", true); }
    finally { setIsSaving(false); }
  }

  async function publish() {
    if (validationBlockers.length || !publishConfirmed) return;
    setIsSaving(true);
    try { applyState(await publishReviewsCms(config)); setPublishOpen(false); setPublishConfirmed(false); showNotice(`Reviews section v${version + 1} published.`); }
    catch (error) { showNotice(error instanceof Error ? error.message : "Reviews section could not be published.", true); }
    finally { setIsSaving(false); }
  }

  async function restore(versionNumber: number) {
    if (!window.confirm(`Load version ${versionNumber} into the draft? The live storefront will not change.`)) return;
    setIsSaving(true);
    try { applyState(await restoreReviewsCmsDraft(versionNumber)); setTab("Section settings"); setIsDirty(true); showNotice(`Version ${versionNumber} loaded as draft. Publish when ready.`); }
    catch (error) { showNotice(error instanceof Error ? error.message : "Version could not be restored.", true); }
    finally { setIsSaving(false); }
  }

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.18em] text-[#426b6d]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>Storefront trust</p><h1 className="mt-3 text-[28px] font-bold tracking-[-.045em] text-[#15221e]">Reviews &amp; Real Results</h1><p className="mt-1 text-[10px] font-medium text-[#718079]">Collect authentic customer stories, verify consent and publish only human-reviewed content.</p></div><div className="flex flex-wrap gap-2"><button className="flex h-10 items-center gap-2 rounded-xl border border-[#dce4e0] bg-white px-4 text-[10px] font-semibold text-[#60716a]" onClick={() => void load()} type="button"><Icon name="refresh"/>Refresh</button><button className="flex h-10 items-center gap-2 rounded-xl border border-[#dce4e0] bg-white px-4 text-[10px] font-semibold text-[#496761]" onClick={() => setPreviewOpen(true)} type="button"><Icon name="eye"/>Preview</button><button className="flex h-10 items-center gap-2 rounded-xl bg-[#416f73] px-4 text-[10px] font-semibold text-white shadow-sm" onClick={() => openEntry()} type="button"><Icon name="plus"/>Add review</button></div></header>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi helper="Customer stories retained" icon="star" label="Total entries" value={String(entries.length)}/><Kpi helper="Needs a human decision" icon="alert" label="Pending review" value={String(pending)}/><Kpi helper={`${averageRating} average approved rating`} icon="check" label="Approved" value={String(approved)}/><Kpi helper="Approved 4–5 star highlights" icon="shield" label="Featured" value={String(featured)}/></section>

    {loadError && <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[10px] font-semibold text-rose-700"><span className="flex items-center gap-2"><Icon name="alert"/> {loadError}</span><button className="underline" onClick={() => void load()} type="button">Try again</button></div>}

    <section className="overflow-hidden rounded-2xl border border-[#dfe6e2] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#e5eae7] p-4 lg:flex-row lg:items-center lg:justify-between"><nav className="flex flex-wrap gap-1 rounded-xl bg-[#f2f5f3] p-1">{(["Review queue", "Section settings", "Moderation safeguards", "Version history"] as Tab[]).map((item) => <button className={`rounded-lg px-3.5 py-2 text-[9.5px] font-semibold ${tab === item ? "bg-white text-[#345f62] shadow-sm" : "text-[#74817b]"}`} key={item} onClick={() => setTab(item)} type="button">{item}</button>)}</nav><div className="flex items-center gap-2"><span className={`rounded-full px-3 py-1.5 text-[8.5px] font-bold ring-1 ring-inset ${draftDifferentFromLive || isDirty ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"}`}>{draftDifferentFromLive || isDirty ? "Unpublished draft" : `Live v${version}`}</span><span className="text-[8.5px] font-semibold text-[#8b9691]">{dateText(publishedAt)}</span></div></div>

      {isLoading ? <div className="flex min-h-[380px] items-center justify-center text-[10px] font-semibold text-[#7a8781]">Loading live reviews from MySQL…</div> : tab === "Review queue" ? <div className="grid min-h-[560px] xl:grid-cols-[1fr_340px]">
        <div className="border-b border-[#e5eae7] xl:border-b-0 xl:border-r"><div className="flex flex-col gap-2 border-b border-[#e8ecea] p-4 sm:flex-row"><input aria-label="Search reviews" className={`${inputClass} mt-0 flex-1`} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer, product, order or review…" value={search}/><select aria-label="Filter status" className={`${inputClass} mt-0 sm:w-36`} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} value={statusFilter}><option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="archived">Archived</option></select><select aria-label="Filter type" className={`${inputClass} mt-0 sm:w-36`} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)} value={typeFilter}><option value="all">All types</option><option value="review">Reviews</option><option value="real_result">Real results</option></select></div>
          <div className="divide-y divide-[#edf0ee]">{filtered.length ? filtered.map((entry) => <article className={`grid cursor-pointer gap-3 p-4 transition hover:bg-[#f8faf9] sm:grid-cols-[minmax(0,1.5fr)_110px_125px] ${selectedId === entry.id ? "bg-[#f4f8f7]" : ""}`} key={entry.id} onClick={() => setSelectedId(entry.id)}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="truncate text-[10px] text-[#26342f]">{entry.customerDisplayName}</strong><span className="rounded-full bg-[#edf3f4] px-2 py-1 text-[7px] font-bold uppercase tracking-wide text-[#4b6f71]">{entry.entryType === "real_result" ? "Real Result" : "Review"}</span>{entry.verifiedPurchase && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[7px] font-bold text-emerald-700">Verified</span>}{entry.featured && <span className="text-amber-500">★ Featured</span>}</div><p className="mt-1 truncate text-[9px] font-semibold text-[#67756f]">{entry.productName}</p><p className="mt-2 line-clamp-2 text-[9px] leading-4 text-[#718079]">{entry.reviewText}</p></div><div><p className="text-[11px] tracking-[.08em] text-amber-500">{"★".repeat(entry.rating)}<span className="text-[#d8dfdc]">{"★".repeat(5 - entry.rating)}</span></p><p className="mt-1 text-[8px] font-semibold text-[#919b96]">{entry.source}</p></div><div className="flex items-start justify-between gap-2 sm:justify-end"><span className={`rounded-full px-2.5 py-1 text-[7.5px] font-bold capitalize ring-1 ring-inset ${statusTone(entry.status)}`}>{entry.status}</span><button aria-label={`Moderate ${entry.customerDisplayName}`} className="rounded-lg border border-[#dfe6e2] p-2 text-[#56716c]" onClick={(event) => { event.stopPropagation(); openModeration(entry); }} type="button"><Icon name="shield" size={14}/></button></div></article>) : <div className="flex min-h-[380px] flex-col items-center justify-center px-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3f2] text-[#477074]"><Icon name="star" size={20}/></span><h3 className="mt-4 text-sm font-bold text-[#25332e]">No reviews found</h3><p className="mt-1 max-w-sm text-[9px] leading-4 text-[#7a8781]">No fake customer reviews are added. Add the first genuine review, record consent, then approve it after human moderation.</p><button className="mt-4 rounded-xl bg-[#416f73] px-4 py-2.5 text-[9px] font-semibold text-white" onClick={() => openEntry()} type="button">Add first review</button></div>}</div>
          <footer className="border-t border-[#e8ecea] px-4 py-3 text-[8px] font-semibold text-[#87928d]">Showing {filtered.length} of {entries.length} retained review records</footer></div>
        <aside className="p-4">{selected ? <div className="sticky top-4"><div className="flex items-start justify-between"><div><p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#87928d]">Selected story</p><h3 className="mt-2 text-base font-bold text-[#1e2c27]">{selected.customerDisplayName}</h3><p className="mt-1 text-[9px] font-semibold text-[#6d7b75]">{selected.productName}</p></div><span className={`rounded-full px-2.5 py-1 text-[7.5px] font-bold capitalize ring-1 ring-inset ${statusTone(selected.status)}`}>{selected.status}</span></div><p className="mt-4 rounded-xl bg-[#f4f7f5] p-3 text-[9px] leading-4 text-[#64726c]">{selected.reviewText}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-[8.5px]"><div><dt className="font-bold uppercase tracking-wide text-[#929c97]">Consent</dt><dd className={`mt-1 font-semibold ${selected.consentObtained ? "text-emerald-700" : "text-rose-700"}`}>{selected.consentObtained ? "Recorded" : "Missing"}</dd></div><div><dt className="font-bold uppercase tracking-wide text-[#929c97]">Purchase</dt><dd className="mt-1 font-semibold text-[#4e625a]">{selected.verifiedPurchase ? "Verified" : "Not verified"}</dd></div><div><dt className="font-bold uppercase tracking-wide text-[#929c97]">Order reference</dt><dd className="mt-1 font-semibold text-[#4e625a]">{selected.orderReference || "Not provided"}</dd></div><div><dt className="font-bold uppercase tracking-wide text-[#929c97]">Usage duration</dt><dd className="mt-1 font-semibold text-[#4e625a]">{selected.duration || "Not applicable"}</dd></div></dl><div className="mt-5 grid grid-cols-2 gap-2"><button className="flex items-center justify-center gap-2 rounded-xl border border-[#dce4e0] py-2.5 text-[9px] font-semibold text-[#4e6862]" onClick={() => openEntry(selected)} type="button"><Icon name="edit" size={14}/>Edit</button><button className="flex items-center justify-center gap-2 rounded-xl bg-[#416f73] py-2.5 text-[9px] font-semibold text-white" onClick={() => openModeration(selected)} type="button"><Icon name="shield" size={14}/>Moderate</button></div><button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 py-2.5 text-[9px] font-semibold text-rose-700" onClick={() => void archive(selected)} type="button"><Icon name="archive" size={14}/>Archive safely</button></div> : <div className="flex min-h-[360px] items-center justify-center text-center text-[9px] text-[#85918b]">Select a review to inspect consent and moderation details.</div>}</aside>
      </div> : tab === "Section settings" ? <div className="grid gap-5 p-5 lg:grid-cols-[1fr_400px]"><div className="rounded-2xl border border-[#e3e9e6] p-5"><h3 className="text-sm font-bold text-[#1e2c27]">Public section settings</h3><p className="mt-1 text-[9px] text-[#77847e]">Save a recoverable draft first. Publishing updates only this storefront section.</p><label className="mt-5 block text-[8px] font-bold uppercase tracking-[.1em] text-[#7d8a84]">Section heading<input className={inputClass} maxLength={160} onChange={(event) => changeConfig({ heading: event.target.value })} value={config.heading}/></label><label className="mt-4 block text-[8px] font-bold uppercase tracking-[.1em] text-[#7d8a84]">Supporting line<textarea className={textareaClass} maxLength={320} onChange={(event) => changeConfig({ supportingLine: event.target.value })} value={config.supportingLine}/></label><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7d8a84]">Display limit<input className={inputClass} max={24} min={1} onChange={(event) => changeConfig({ displayLimit: Number(event.target.value) })} type="number" value={config.displayLimit}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7d8a84]">Minimum rating<select className={inputClass} onChange={(event) => changeConfig({ minimumRating: Number(event.target.value) })} value={config.minimumRating}>{[1,2,3,4,5].map((rating) => <option key={rating} value={rating}>{rating}+ stars</option>)}</select></label></div><div className="mt-5 divide-y divide-[#edf1ef] rounded-xl border border-[#e3e9e6]">{([{ key: "visible", label: "Show section on storefront" }, { key: "showRatings", label: "Show rating stars" }, { key: "showVerifiedBadge", label: "Show verified purchase badge" }, { key: "showMedia", label: "Show approved customer media" }] as const).map((setting) => <div className="flex items-center justify-between px-4 py-3" key={setting.key}><span className="text-[9px] font-semibold text-[#52635c]">{setting.label}</span><Toggle checked={config[setting.key]} label={setting.label} onChange={() => changeConfig({ [setting.key]: !config[setting.key] })}/></div>)}</div><div className="mt-5 flex flex-wrap gap-2"><button className="flex items-center gap-2 rounded-xl border border-[#dce4e0] bg-white px-4 py-2.5 text-[9px] font-semibold text-[#506962] disabled:opacity-50" disabled={isSaving || (!isDirty && !draftDifferentFromLive)} onClick={() => void saveDraft()} type="button"><Icon name="save" size={14}/>Save draft</button><button className="flex items-center gap-2 rounded-xl bg-[#416f73] px-4 py-2.5 text-[9px] font-semibold text-white disabled:opacity-50" disabled={isSaving} onClick={() => { setPublishConfirmed(false); setPublishOpen(true); }} type="button"><Icon name="check" size={14}/>Publish</button></div></div><div className="rounded-2xl border border-[#e3e9e6] bg-[#f7f9f8] p-5"><p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#829089]">Draft preview</p><h3 className="mt-4 text-xl font-bold tracking-[-.035em] text-[#1d2b26]">{config.heading || "Section heading"}</h3><p className="mt-2 text-[9px] leading-4 text-[#6f7e77]">{config.supportingLine || "Supporting line"}</p><div className="mt-5 space-y-3">{previewEntries.slice(0, 2).map((entry) => <div className="rounded-xl border border-[#e0e7e4] bg-white p-4" key={entry.id}>{config.showRatings && <p className="text-amber-500">{"★".repeat(entry.rating)}</p>}<p className="mt-2 line-clamp-3 text-[9px] leading-4 text-[#586861]">{entry.reviewText}</p><p className="mt-3 text-[8px] font-bold text-[#324b43]">{entry.customerDisplayName}{config.showVerifiedBadge && entry.verifiedPurchase ? " · Verified purchase" : ""}</p></div>)}{!previewEntries.length && <div className="rounded-xl border border-dashed border-[#d5dfda] bg-white p-6 text-center text-[9px] leading-4 text-[#829089]">No approved, consented reviews match this draft yet.</div>}</div></div></div> : tab === "Moderation safeguards" ? <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">{[{ title: "Consent first", text: "Approval is blocked until customer permission is recorded. Media is never public without approval." }, { title: "Human moderation", text: "Every status decision requires an explicit human confirmation in the admin screen." }, { title: "Truthful results", text: "Real Result stories require a usage duration. Individual outcomes are not promised." }, { title: "Safe featuring", text: "Only approved reviews rated 4 or 5 can be featured. Editing returns content to Pending." }].map((item) => <article className="rounded-2xl border border-[#e1e8e4] bg-[#f8faf9] p-5" key={item.title}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Icon name="shield"/></span><h3 className="mt-4 text-sm font-bold text-[#22312b]">{item.title}</h3><p className="mt-2 text-[9px] leading-4 text-[#718079]">{item.text}</p></article>)}</div> : <div className="p-5"><div className="mb-4"><h3 className="text-sm font-bold text-[#1e2c27]">Publication history</h3><p className="mt-1 text-[9px] text-[#77847e]">Restore puts an older configuration into draft only. It never republishes automatically.</p></div><div className="divide-y divide-[#e9eeeb] rounded-2xl border border-[#e1e8e4]">{versions.map((item) => <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" key={item.version}><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf3f4] text-[#456e72]"><Icon name="history" size={15}/></span><div><p className="text-[10px] font-bold text-[#2b3b35]">Version {item.version}{item.version === version ? " · Live" : ""}</p><p className="mt-1 text-[8px] font-semibold text-[#8a9690]">{dateText(item.publishedAt)} · {item.publishedBy}</p></div></div><button className="rounded-xl border border-[#dce4e0] px-4 py-2 text-[9px] font-semibold text-[#536d66]" onClick={() => void restore(item.version)} type="button">Restore to draft</button></div>)}</div></div>}
    </section>

    {entryOpen && <Modal onClose={() => setEntryOpen(false)} title={entryDraft.id ? "Edit review" : "Add genuine customer review"}><div className="grid gap-4 p-5 sm:grid-cols-2"><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7d8a84]">Customer display name<input className={inputClass} maxLength={120} onChange={(event) => setEntryDraft((current) => ({ ...current, customerDisplayName: event.target.value }))} value={entryDraft.customerDisplayName}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7d8a84]">Product<input className={inputClass} maxLength={190} onChange={(event) => setEntryDraft((current) => ({ ...current, productName: event.target.value }))} value={entryDraft.productName}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7d8a84]">Entry type<select className={inputClass} onChange={(event) => setEntryDraft((current) => ({ ...current, entryType: event.target.value as ReviewEntry["entryType"] }))} value={entryDraft.entryType}><option value="review">Review</option><option value="real_result">Real Result</option></select></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7d8a84]">Rating<select className={inputClass} onChange={(event) => setEntryDraft((current) => ({ ...current, rating: Number(event.target.value) }))} value={entryDraft.rating}>{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}</select></label>{entryDraft.entryType === "real_result" && <label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7d8a84] sm:col-span-2">Usage duration<input className={inputClass} maxLength={120} onChange={(event) => setEntryDraft((current) => ({ ...current, duration: event.target.value }))} placeholder="Example: Used for 8 weeks" value={entryDraft.duration}/></label>}<label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7d8a84] sm:col-span-2">Customer review<textarea className={`${textareaClass} h-32`} maxLength={2000} onChange={(event) => setEntryDraft((current) => ({ ...current, reviewText: event.target.value }))} value={entryDraft.reviewText}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7d8a84]">Source<select className={inputClass} onChange={(event) => setEntryDraft((current) => ({ ...current, source: event.target.value as ReviewEntry["source"] }))} value={entryDraft.source}><option value="manual">Manual</option><option value="website">Website</option><option value="facebook">Facebook</option><option value="messenger">Messenger</option></select></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7d8a84]">Order reference<input className={inputClass} maxLength={120} onChange={(event) => setEntryDraft((current) => ({ ...current, orderReference: event.target.value }))} value={entryDraft.orderReference}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7d8a84] sm:col-span-2">Approved media URL (optional)<input className={inputClass} maxLength={1000} onChange={(event) => setEntryDraft((current) => ({ ...current, mediaUrl: event.target.value }))} placeholder="Internal /uploads path or HTTPS URL" value={entryDraft.mediaUrl}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7d8a84] sm:col-span-2">Internal note<textarea className={textareaClass} maxLength={500} onChange={(event) => setEntryDraft((current) => ({ ...current, adminNote: event.target.value }))} value={entryDraft.adminNote}/></label><label className="flex items-start gap-3 rounded-xl border border-[#e1e8e4] p-3 text-[9px] font-semibold text-[#53645d]"><input checked={entryDraft.verifiedPurchase} className="mt-0.5" onChange={(event) => setEntryDraft((current) => ({ ...current, verifiedPurchase: event.target.checked }))} type="checkbox"/><span>Purchase evidence checked<br/><small className="font-medium text-[#89948f]">Use only after matching an order or receipt.</small></span></label><label className="flex items-start gap-3 rounded-xl border border-[#e1e8e4] p-3 text-[9px] font-semibold text-[#53645d]"><input checked={entryDraft.consentObtained} className="mt-0.5" onChange={(event) => setEntryDraft((current) => ({ ...current, consentObtained: event.target.checked }))} type="checkbox"/><span>Publication consent recorded<br/><small className="font-medium text-[#89948f]">Required before approval.</small></span></label></div><footer className="flex justify-end gap-2 border-t border-[#e3e9e6] bg-white p-4"><button className="rounded-xl border border-[#dce4e0] px-4 py-2.5 text-[9px] font-semibold text-[#61736b]" onClick={() => setEntryOpen(false)} type="button">Cancel</button><button className="rounded-xl bg-[#416f73] px-4 py-2.5 text-[9px] font-semibold text-white disabled:opacity-50" disabled={isSaving} onClick={() => void saveEntry()} type="button">{isSaving ? "Saving…" : "Save to Pending"}</button></footer></Modal>}

    {moderationOpen && selected && <Modal onClose={() => setModerationOpen(false)} title="Human moderation decision"><div className="p-5"><div className="rounded-xl bg-[#f3f7f5] p-4"><p className="text-[8px] font-bold uppercase tracking-[.1em] text-[#87938e]">Reviewing</p><p className="mt-2 text-[10px] font-bold text-[#2b3b35]">{selected.customerDisplayName} · {selected.productName}</p><p className="mt-2 text-[9px] leading-4 text-[#67766f]">{selected.reviewText}</p></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7d8a84]">Decision<select className={inputClass} onChange={(event) => { const next = event.target.value as ReviewEntry["status"]; setModerationStatus(next); if (next !== "approved") setModerationFeatured(false); }} value={moderationStatus}><option value="pending">Keep pending</option><option value="approved">Approve</option><option value="rejected">Reject</option><option value="archived">Archive</option></select></label><label className="flex items-center justify-between rounded-xl border border-[#e1e8e4] px-4 py-3 text-[9px] font-semibold text-[#53645d]"><span>Feature on top</span><Toggle checked={moderationFeatured} label="featured review" onChange={() => setModerationFeatured((current) => !current)}/></label></div><label className="mt-4 block text-[8px] font-bold uppercase tracking-[.1em] text-[#7d8a84]">Internal moderation note<textarea className={textareaClass} maxLength={500} onChange={(event) => setModerationNote(event.target.value)} value={moderationNote}/></label><div className={`mt-4 rounded-xl border p-4 text-[9px] ${selected.consentObtained ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}><strong>{selected.consentObtained ? "Consent recorded" : "Consent missing"}</strong><p className="mt-1 leading-4">{selected.consentObtained ? "This review is eligible for approval after content verification." : "Approval is blocked. Edit the review and record genuine customer consent first."}</p></div><label className="mt-4 flex items-start gap-3 rounded-xl border border-[#dce4e0] p-4 text-[9px] font-semibold text-[#4d625a]"><input checked={humanConfirmed} className="mt-0.5" onChange={(event) => setHumanConfirmed(event.target.checked)} type="checkbox"/><span>I personally checked the content, consent and evidence. This decision was not automatic.</span></label></div><footer className="flex justify-end gap-2 border-t border-[#e3e9e6] bg-white p-4"><button className="rounded-xl border border-[#dce4e0] px-4 py-2.5 text-[9px] font-semibold text-[#61736b]" onClick={() => setModerationOpen(false)} type="button">Cancel</button><button className="rounded-xl bg-[#416f73] px-4 py-2.5 text-[9px] font-semibold text-white disabled:opacity-50" disabled={isSaving || !humanConfirmed || (moderationStatus === "approved" && !selected.consentObtained)} onClick={() => void saveModeration()} type="button">Save decision</button></footer></Modal>}

    {previewOpen && <Modal onClose={() => setPreviewOpen(false)} title="Responsive storefront preview"><div className="bg-[#f2f5f3] p-5"><div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm"><p className="text-[8px] font-bold uppercase tracking-[.16em] text-[#4d7777]">Reviews &amp; Real Results</p><h2 className="mt-3 text-2xl font-bold tracking-[-.04em] text-[#17231f]">{config.heading}</h2><p className="mt-2 text-[10px] leading-5 text-[#6f7e77]">{config.supportingLine}</p>{!config.visible ? <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-[9px] text-amber-800">The section is hidden in this draft.</div> : <div className="mt-6 grid gap-3 sm:grid-cols-2">{previewEntries.map((entry) => <article className="rounded-xl border border-[#e1e8e4] p-4" key={entry.id}>{config.showRatings && <p className="text-amber-500">{"★".repeat(entry.rating)}</p>}<p className="mt-2 text-[9px] leading-4 text-[#5f7068]">{entry.reviewText}</p><p className="mt-3 text-[8px] font-bold text-[#31473f]">{entry.customerDisplayName}{config.showVerifiedBadge && entry.verifiedPurchase ? " · Verified" : ""}</p><p className="mt-1 text-[7.5px] text-[#8a9690]">{entry.productName}{entry.duration ? ` · ${entry.duration}` : ""}</p>{config.showMedia && entry.mediaUrl && <p className="mt-2 rounded-lg bg-[#f1f4f2] px-2 py-1.5 text-[7px] text-[#72817a]">Approved customer media attached</p>}</article>)}{!previewEntries.length && <div className="sm:col-span-2 rounded-xl border border-dashed border-[#d5dfda] p-7 text-center text-[9px] text-[#829089]">No approved, consented reviews meet the current rating filter.</div>}</div>}</div></div></Modal>}

    {publishOpen && <Modal onClose={() => setPublishOpen(false)} title="Publish Reviews section"><div className="p-5">{validationBlockers.length ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[9px] text-rose-800"><strong>Resolve before publishing</strong><ul className="mt-2 list-disc space-y-1 pl-4">{validationBlockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul></div> : <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[9px] leading-4 text-emerald-800">The section configuration is valid. Only approved and consented entries can appear publicly.</div>}<label className="mt-4 flex items-start gap-3 rounded-xl border border-[#dce4e0] p-4 text-[9px] font-semibold text-[#4d625a]"><input checked={publishConfirmed} className="mt-0.5" onChange={(event) => setPublishConfirmed(event.target.checked)} type="checkbox"/><span>I reviewed the section heading, visibility, rating filter and public preview.</span></label></div><footer className="flex justify-end gap-2 border-t border-[#e3e9e6] bg-white p-4"><button className="rounded-xl border border-[#dce4e0] px-4 py-2.5 text-[9px] font-semibold text-[#61736b]" onClick={() => setPublishOpen(false)} type="button">Cancel</button><button className="rounded-xl bg-[#416f73] px-4 py-2.5 text-[9px] font-semibold text-white disabled:opacity-50" disabled={isSaving || !publishConfirmed || validationBlockers.length > 0} onClick={() => void publish()} type="button">Publish v{version + 1}</button></footer></Modal>}

    {notice && <div className={`fixed bottom-6 right-6 z-[120] max-w-sm rounded-xl border px-4 py-3 text-[9.5px] font-semibold shadow-xl ${noticeError ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{notice}</div>}
  </div>;
}
