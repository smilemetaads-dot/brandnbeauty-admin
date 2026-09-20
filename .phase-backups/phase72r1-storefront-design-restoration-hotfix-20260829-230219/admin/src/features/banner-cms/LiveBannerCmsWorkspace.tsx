"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  defaultHomepageConfig,
  fetchHomepageCmsState,
  publishHomepage,
  saveHomepageDraft,
  uploadHomepageImage,
  type HomepageConfig,
  type HomepageHero,
} from "@/features/homepage-cms/homepage-cms-client";
import { bnbApiAssetUrl } from "@/lib/bnb-api";

type IconName = "alert" | "check" | "close" | "copy" | "down" | "eye" | "image" | "plus" | "refresh" | "save" | "trash" | "up" | "upload";
type BannerFilter = "all" | HomepageHero["status"] | "review";

const iconPaths: Record<IconName, ReactNode> = {
  alert: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  copy: <><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4"/></>,
  down: <path d="m6 9 6 6 6-6"/>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></>,
  save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></>,
  trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6"/><path d="M10 11v5M14 11v5"/></>,
  up: <path d="m18 15-6-6-6 6"/>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 21h14"/></>,
};

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{iconPaths[name]}</svg>;
}

function bannerNeedsReview(banner: HomepageHero) {
  return !banner.title.trim() || !banner.desktopImage.trim() || (banner.status === "active" && !banner.link.trim());
}

function dateText(value: string | null) {
  if (!value) return "Not published yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not published yet";
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function Kpi({ helper, icon, label, tone = "brand", value }: { helper: string; icon: IconName; label: string; tone?: "brand" | "good" | "warn"; value: string }) {
  const colors = tone === "good" ? "bg-emerald-50 text-emerald-700" : tone === "warn" ? "bg-amber-50 text-amber-700" : "bg-[#edf3f4] text-[#3b646d]";
  return <article className="rounded-2xl border border-[#e2e8e5] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[.08em] text-[#74817b]">{label}</p><p className="mt-2 text-[23px] font-bold tracking-[-.035em] text-[#17231f]">{value}</p></div><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${colors}`}><Icon name={icon} size={15}/></span></div><p className="mt-3 border-t border-[#eff2f0] pt-2.5 text-[9px] font-semibold text-[#77847e]">{helper}</p></article>;
}

function ArtworkField({ busy, label, onChange, onUpload, value }: { busy: boolean; label: string; onChange: (value: string) => void; onUpload: (file: File) => void; value: string }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const preview = bnbApiAssetUrl(value, null);
  return <div className="rounded-xl border border-[#dfe6e3] bg-[#fbfcfb] p-3"><div className="aspect-[16/6] overflow-hidden rounded-lg bg-[#edf3f4] bg-cover bg-center" style={preview ? { backgroundImage: `url(${preview})` } : undefined}>{!preview ? <span className="flex h-full items-center justify-center text-[#739096]"><Icon name="image" size={20}/></span> : null}</div><div className="mt-3 flex items-center justify-between gap-2"><p className="text-[8px] font-bold uppercase tracking-[.08em] text-[#74817b]">{label}</p><button className="inline-flex items-center gap-1 rounded-lg bg-[#edf3f4] px-2.5 py-1.5 text-[8px] font-bold text-[#426d72] disabled:opacity-50" disabled={busy} onClick={() => fileInput.current?.click()} type="button"><Icon name="upload" size={11}/>{busy ? "Uploading" : "Upload"}</button></div><input accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file); event.currentTarget.value = ""; }} ref={fileInput} type="file"/><input className="mt-2 h-9 w-full rounded-lg border border-[#dce4e0] bg-white px-3 text-[8.5px] font-semibold text-[#4c5c55] outline-none focus:border-[#759493]" onChange={(event) => onChange(event.target.value)} placeholder="Or paste image URL" value={value}/></div>;
}

export function LiveBannerCmsWorkspace() {
  const [config, setConfig] = useState<HomepageConfig>(defaultHomepageConfig);
  const [liveConfig, setLiveConfig] = useState<HomepageConfig>(defaultHomepageConfig);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState<BannerFilter>("all");
  const [query, setQuery] = useState("");
  const [version, setVersion] = useState(1);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishConfirmed, setPublishConfirmed] = useState(false);

  const showNotice = useCallback((message: string, error = false) => {
    setNotice(message);
    setNoticeError(error);
    window.setTimeout(() => setNotice(""), 3400);
  }, []);

  const loadBanners = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError("");
    try {
      const state = await fetchHomepageCmsState(signal);
      setConfig(state.draft);
      setLiveConfig(state.live);
      setVersion(state.version);
      setPublishedAt(state.publishedAt);
      setSelectedId((current) => state.draft.heroBanners.some((banner) => banner.id === current) ? current : state.draft.heroBanners[0]?.id || "");
      setIsDirty(false);
    } catch (error) {
      if (!signal?.aborted) setLoadError(error instanceof Error ? error.message : "Banner CMS could not be loaded.");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadBanners(controller.signal), 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [loadBanners]);

  const banners = config.heroBanners;
  const selected = banners.find((banner) => banner.id === selectedId) || banners[0];
  const activeCount = banners.filter((banner) => banner.status === "active").length;
  const draftCount = banners.filter((banner) => banner.status === "draft").length;
  const reviewCount = banners.filter(bannerNeedsReview).length;
  const draftDifferentFromLive = useMemo(() => JSON.stringify(config) !== JSON.stringify(liveConfig), [config, liveConfig]);
  const visibleBanners = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return banners.filter((banner) => {
      const matchesFilter = filter === "all" || (filter === "review" ? bannerNeedsReview(banner) : banner.status === filter);
      const matchesQuery = !needle || [banner.title, banner.subtitle, banner.link].some((value) => value.toLowerCase().includes(needle));
      return matchesFilter && matchesQuery;
    });
  }, [banners, filter, query]);

  function changeConfig(updater: (current: HomepageConfig) => HomepageConfig) {
    setConfig(updater);
    setIsDirty(true);
  }

  function updateBanner(id: string, patch: Partial<HomepageHero>) {
    changeConfig((current) => ({ ...current, heroBanners: current.heroBanners.map((banner) => banner.id === id ? { ...banner, ...patch } : banner) }));
  }

  function addBanner() {
    if (banners.length >= 12) { showNotice("A maximum of 12 banners is allowed.", true); return; }
    const id = `hero-${Date.now()}`;
    const banner: HomepageHero = { ctaText: "Shop now", desktopImage: "", id, link: "/products", mobileImage: "", sortOrder: banners.length + 1, status: "draft", subtitle: "", title: "New banner campaign" };
    changeConfig((current) => ({ ...current, heroBanners: [...current.heroBanners, banner] }));
    setSelectedId(id);
  }

  function duplicateBanner(banner: HomepageHero) {
    if (banners.length >= 12) { showNotice("A maximum of 12 banners is allowed.", true); return; }
    const copy = { ...banner, id: `hero-${Date.now()}`, sortOrder: banners.length + 1, status: "draft" as const, title: `${banner.title || "Banner"} copy` };
    changeConfig((current) => ({ ...current, heroBanners: [...current.heroBanners, copy] }));
    setSelectedId(copy.id);
  }

  function removeBanner(banner: HomepageHero) {
    if (!window.confirm(`Delete “${banner.title || "Untitled banner"}” from the draft? The live version will stay unchanged until Publish.`)) return;
    changeConfig((current) => ({ ...current, heroBanners: current.heroBanners.filter((item) => item.id !== banner.id).map((item, index) => ({ ...item, sortOrder: index + 1 })) }));
    setSelectedId((current) => current === banner.id ? banners.find((item) => item.id !== banner.id)?.id || "" : current);
  }

  function moveBanner(id: string, direction: -1 | 1) {
    changeConfig((current) => {
      const next = [...current.heroBanners];
      const index = next.findIndex((banner) => banner.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, heroBanners: next.map((banner, position) => ({ ...banner, sortOrder: position + 1 })) };
    });
  }

  async function uploadImage(file: File, target: "desktopImage" | "mobileImage") {
    if (!selected) return;
    if (file.size > 5 * 1024 * 1024) { showNotice("Image must be 5 MB or smaller.", true); return; }
    setIsUploading(true);
    try {
      const url = await uploadHomepageImage(file);
      updateBanner(selected.id, { [target]: url });
      showNotice("Banner artwork uploaded.");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Banner artwork upload failed.", true);
    } finally {
      setIsUploading(false);
    }
  }

  async function saveDraft() {
    setIsSaving(true);
    try {
      const state = await saveHomepageDraft(config);
      setConfig(state.draft);
      setLiveConfig(state.live);
      setIsDirty(false);
      showNotice("Banner draft saved in MySQL.");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Banner draft could not be saved.", true);
    } finally {
      setIsSaving(false);
    }
  }

  async function publishNow() {
    setIsSaving(true);
    try {
      const state = await publishHomepage(config);
      setConfig(state.draft);
      setLiveConfig(state.live);
      setVersion(state.version);
      setPublishedAt(state.publishedAt);
      setIsDirty(false);
      setPublishOpen(false);
      setPublishConfirmed(false);
      showNotice(`Banner configuration published in homepage version ${state.version}.`);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Banner configuration could not be published.", true);
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass = "mt-1.5 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[9.5px] font-semibold normal-case tracking-normal text-[#42524b] outline-none focus:border-[#759493]";

  return <div className="space-y-4"><header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="flex items-center gap-2 text-[8.5px] font-extrabold uppercase tracking-[.18em] text-[#547874]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Storefront campaigns</p><h1 className="mt-2 text-[26px] font-bold tracking-[-.045em] text-[#17231f]">Banner CMS command center</h1><p className="mt-1.5 max-w-3xl text-[10px] font-medium text-[#74817b]">Manage customer-facing homepage banners from the same recoverable draft and live source used by Homepage CMS.</p></div><div className="flex flex-wrap gap-2"><button className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[9.5px] font-bold text-[#62706a] disabled:opacity-50" disabled={isLoading} onClick={() => void loadBanners()} type="button"><Icon name="refresh" size={14}/> Refresh</button><button className="inline-flex items-center gap-1.5 rounded-xl border border-[#bfcfca] bg-white px-3.5 py-2.5 text-[9.5px] font-bold text-[#426d72] disabled:opacity-50" disabled={isSaving || (!isDirty && !draftDifferentFromLive)} onClick={() => void saveDraft()} type="button"><Icon name="save" size={14}/>{isSaving ? "Saving..." : "Save draft"}</button><button className="inline-flex items-center gap-1.5 rounded-xl bg-[#426d72] px-3.5 py-2.5 text-[9.5px] font-bold text-white disabled:opacity-50" disabled={isSaving || (!isDirty && !draftDifferentFromLive)} onClick={() => setPublishOpen(true)} type="button"><Icon name="check" size={14}/> Publish</button></div></header><section className="rounded-2xl border border-[#dfe8e5] bg-[#edf5f5] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#426d72]"><Icon name="image" size={17}/></span><div><p className="text-[9px] font-bold text-[#395c5b]">Shared source · MySQL connected</p><p className="mt-1 text-[8px] text-[#72827c]">Banner CMS edits hero_banners only; homepage sections and copy remain untouched.</p></div></div><div className="rounded-full bg-white px-3 py-2 text-[8px] font-bold text-[#54716e]">Live homepage v{version}</div></div></section><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Kpi helper="Draft and live records" icon="image" label="Total banners" value={String(banners.length)}/><Kpi helper="Customer-visible after publish" icon="check" label="Active" tone="good" value={String(activeCount)}/><Kpi helper="Internal work in progress" icon="save" label="Draft" value={String(draftCount)}/><Kpi helper="Missing required content" icon="alert" label="Needs review" tone={reviewCount ? "warn" : "good"} value={String(reviewCount)}/><Kpi helper={dateText(publishedAt)} icon="eye" label="Publication" tone={draftDifferentFromLive || isDirty ? "warn" : "good"} value={draftDifferentFromLive || isDirty ? "Changes" : "Up to date"}/></section>{loadError ? <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[9.5px] font-bold text-rose-700"><span className="flex items-center gap-2"><Icon name="alert" size={14}/>{loadError}</span><button className="underline" onClick={() => void loadBanners()} type="button">Try again</button></div> : null}<section className="grid min-h-[650px] gap-3 xl:grid-cols-[390px_minmax(0,1fr)]"><div className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white"><div className="border-b border-[#e7ece9] p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-[#7d8983]">Banner records</p><h2 className="mt-1 text-[15px] font-bold text-[#26362f]">Homepage campaigns</h2></div><button className="inline-flex items-center gap-1.5 rounded-xl bg-[#426d72] px-3 py-2 text-[8.5px] font-bold text-white" onClick={addBanner} type="button"><Icon name="plus" size={12}/> New banner</button></div><input className="mt-4 h-10 w-full rounded-xl border border-[#dfe6e3] px-3 text-[9px] font-semibold text-[#4c5c55] outline-none focus:border-[#759493]" onChange={(event) => setQuery(event.target.value)} placeholder="Search headline or link..." value={query}/><div className="mt-3 flex flex-wrap gap-1.5">{(["all", "active", "draft", "inactive", "review"] as BannerFilter[]).map((item) => <button className={`rounded-lg px-2.5 py-2 text-[8px] font-bold capitalize ${filter === item ? "bg-[#426d72] text-white" : "bg-[#f1f4f2] text-[#718078]"}`} key={item} onClick={() => setFilter(item)} type="button">{item}</button>)}</div></div>{isLoading ? <div className="p-10 text-center text-[9px] font-bold text-[#839089]">Loading real banners...</div> : visibleBanners.length ? <div className="divide-y divide-[#edf1ef]">{visibleBanners.map((banner) => { const actualIndex = banners.findIndex((item) => item.id === banner.id); const preview = bnbApiAssetUrl(banner.desktopImage, null); return <button className={`grid w-full grid-cols-[58px_minmax(0,1fr)_70px] items-center gap-3 p-3 text-left ${selected?.id === banner.id ? "bg-[#f1f6f4]" : "hover:bg-[#f8faf9]"}`} key={banner.id} onClick={() => setSelectedId(banner.id)} type="button"><span className="h-10 overflow-hidden rounded-lg bg-[#eaf1ef] bg-cover bg-center" style={preview ? { backgroundImage: `url(${preview})` } : undefined}>{!preview ? <span className="flex h-full items-center justify-center text-[#789297]"><Icon name="image" size={14}/></span> : null}</span><span className="min-w-0"><span className="flex items-center gap-1.5"><b className="truncate text-[9px] text-[#34433d]">{banner.title || "Untitled banner"}</b>{bannerNeedsReview(banner) ? <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[6.5px] font-bold text-amber-700">Review</span> : null}</span><small className="mt-1 block truncate text-[7.5px] capitalize text-[#85918b]">{banner.status} · order {actualIndex + 1}</small></span><span className="flex justify-end gap-1"><span className={`flex h-7 w-7 items-center justify-center rounded-lg border bg-white ${actualIndex === 0 ? "pointer-events-none opacity-30" : ""}`} onClick={(event) => { event.stopPropagation(); moveBanner(banner.id, -1); }}><Icon name="up" size={10}/></span><span className={`flex h-7 w-7 items-center justify-center rounded-lg border bg-white ${actualIndex === banners.length - 1 ? "pointer-events-none opacity-30" : ""}`} onClick={(event) => { event.stopPropagation(); moveBanner(banner.id, 1); }}><Icon name="down" size={10}/></span></span></button>; })}</div> : <div className="p-10 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf3f4] text-[#426d72]"><Icon name="image" size={17}/></span><p className="mt-3 text-[9px] font-bold text-[#53635c]">No matching banner found</p><p className="mt-1 text-[8px] text-[#8a9690]">Change the filter or create the first real campaign.</p></div>}</div><div className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">{selected ? <><div className="flex items-start justify-between gap-3 border-b border-[#e7ece9] p-5"><div><p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-[#7d8983]">Edit banner</p><h2 className="mt-1 text-[17px] font-bold text-[#26362f]">{selected.title || "Untitled banner"}</h2><p className="mt-1 text-[8px] text-[#87928d]">Draft changes remain recoverable until a human publishes them.</p></div><div className="flex gap-1.5"><button aria-label="Duplicate banner" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf3f4] text-[#426d72]" onClick={() => duplicateBanner(selected)} type="button"><Icon name="copy" size={14}/></button><button aria-label="Delete banner" className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600" onClick={() => removeBanner(selected)} type="button"><Icon name="trash" size={14}/></button></div></div><div className="grid gap-4 p-5 sm:grid-cols-2"><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7e8b85] sm:col-span-2">Headline<input className={inputClass} onChange={(event) => updateBanner(selected.id, { title: event.target.value })} value={selected.title}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7e8b85] sm:col-span-2">Supporting copy<textarea className={`${inputClass} min-h-20 py-3`} onChange={(event) => updateBanner(selected.id, { subtitle: event.target.value })} value={selected.subtitle}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7e8b85]">CTA text<input className={inputClass} onChange={(event) => updateBanner(selected.id, { ctaText: event.target.value })} value={selected.ctaText}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7e8b85]">Destination link<input className={inputClass} onChange={(event) => updateBanner(selected.id, { link: event.target.value })} placeholder="/collections/acne-care" value={selected.link}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7e8b85]">Status<select className={inputClass} onChange={(event) => updateBanner(selected.id, { status: event.target.value as HomepageHero["status"] })} value={selected.status}><option value="active">Active</option><option value="draft">Draft</option><option value="inactive">Inactive</option></select></label><div className="sm:col-span-2 grid gap-3 sm:grid-cols-2"><ArtworkField busy={isUploading} label="Desktop artwork · 1600 × 405" onChange={(value) => updateBanner(selected.id, { desktopImage: value })} onUpload={(file) => void uploadImage(file, "desktopImage")} value={selected.desktopImage}/><ArtworkField busy={isUploading} label="Mobile artwork · 16:9" onChange={(value) => updateBanner(selected.id, { mobileImage: value })} onUpload={(file) => void uploadImage(file, "mobileImage")} value={selected.mobileImage}/></div><div className="sm:col-span-2 rounded-xl bg-[#f3f7f5] p-4"><div className="flex items-center gap-2 text-[8.5px] font-bold text-[#4f6b65]"><Icon name={bannerNeedsReview(selected) ? "alert" : "check"} size={13}/>{bannerNeedsReview(selected) ? "Needs content review" : "Banner content is ready"}</div><p className="mt-1 text-[8px] leading-4 text-[#7d8983]">Active banners require a headline, desktop artwork and destination link. Mobile artwork is strongly recommended.</p></div></div></> : <div className="flex min-h-[500px] items-center justify-center p-8 text-center"><div><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3f4] text-[#426d72]"><Icon name="image" size={19}/></span><h2 className="mt-3 text-[14px] font-bold text-[#34443d]">Select a banner</h2><p className="mt-1 text-[8.5px] text-[#85918b]">Choose a campaign from the list or create a new one.</p></div></div>}</div></section>{publishOpen ? <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#17231f]/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setPublishOpen(false); }}><div className="w-full max-w-[560px] overflow-hidden rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.24)]"><div className="flex items-start justify-between border-b border-[#e8ecea] p-5"><div><p className="text-[8.5px] font-bold uppercase tracking-[.14em] text-[#426d72]">Human approval required</p><h2 className="mt-1.5 text-[18px] font-bold text-[#22312b]">Publish banner configuration</h2><p className="mt-1 text-[9px] text-[#84908a]">This publishes the complete homepage draft as version {version + 1}, preserving the current live version in MySQL.</p></div><button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5f3] text-[#65736c]" onClick={() => setPublishOpen(false)} type="button"><Icon name="close" size={14}/></button></div><div className="space-y-4 p-5"><div className="grid grid-cols-3 gap-3"><div className="rounded-xl bg-[#f5f8f6] p-3"><span className="text-[8px] font-bold text-[#7d8983]">Total</span><b className="mt-1 block text-[15px] text-[#33443d]">{banners.length}</b></div><div className="rounded-xl bg-[#f5f8f6] p-3"><span className="text-[8px] font-bold text-[#7d8983]">Active</span><b className="mt-1 block text-[15px] text-[#33443d]">{activeCount}</b></div><div className="rounded-xl bg-[#f5f8f6] p-3"><span className="text-[8px] font-bold text-[#7d8983]">Review</span><b className="mt-1 block text-[15px] text-[#33443d]">{reviewCount}</b></div></div>{reviewCount ? <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-[8.5px] leading-4 text-amber-800"><b className="block">Review recommended</b>{reviewCount} banner(s) have missing required content. They can remain draft or inactive.</div> : null}<label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#dfe6e3] p-4"><input checked={publishConfirmed} className="mt-0.5 h-4 w-4 accent-[#426d72]" onChange={(event) => setPublishConfirmed(event.target.checked)} type="checkbox"/><span className="text-[8.5px] leading-4 text-[#596962]">I reviewed banner status, artwork, links and ordering and approve publishing this homepage version.</span></label></div><div className="flex justify-end gap-2 border-t border-[#e8ecea] bg-[#fafbfa] p-5"><button className="h-10 rounded-xl border border-[#dce4e0] bg-white px-4 text-[9px] font-bold text-[#66756e]" onClick={() => setPublishOpen(false)} type="button">Cancel</button><button className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#426d72] px-4 text-[9px] font-bold text-white disabled:opacity-40" disabled={!publishConfirmed || isSaving} onClick={() => void publishNow()} type="button"><Icon name="check" size={13}/>{isSaving ? "Publishing..." : "Publish banners"}</button></div></div></div> : null}{notice ? <div className={`fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-[10px] font-bold text-white shadow-xl ${noticeError ? "bg-rose-600" : "bg-[#335e63]"}`}>{notice}</div> : null}</div>;
}
