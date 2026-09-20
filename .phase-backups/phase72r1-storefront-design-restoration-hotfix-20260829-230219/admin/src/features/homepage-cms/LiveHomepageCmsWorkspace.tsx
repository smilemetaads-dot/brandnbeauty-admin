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
  type HomepageSection,
} from "@/features/homepage-cms/homepage-cms-client";
import { bnbApiAssetUrl } from "@/lib/bnb-api";

type CmsTab = "Hero slider" | "Page structure";
type IconName = "alert" | "calendar" | "check" | "close" | "content" | "down" | "eye" | "image" | "plus" | "refresh" | "save" | "settings" | "up" | "upload";

const iconPaths: Record<IconName, ReactNode> = {
  alert: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  content: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
  down: <path d="m6 9 6 6 6-6"/>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></>,
  save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34A1.7 1.7 0 0 0 14 20.9V21h-4v-.09a1.7 1.7 0 0 0-1.05-1.51 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3 14v-4a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3h4a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.6 1v4a1.7 1.7 0 0 0-1.6 1Z"/></>,
  up: <path d="m18 15-6-6-6 6"/>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 21h14"/></>,
};

function Icon({ className = "", name, size = 16 }: { className?: string; name: IconName; size?: number }) {
  return <svg aria-hidden="true" className={className} fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{iconPaths[name]}</svg>;
}

function dateText(value: string | null) {
  if (!value) return "Not published yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not published yet";
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function Kpi({ helper, icon, label, tone = "brand", value }: { helper: string; icon: IconName; label: string; tone?: "brand" | "good" | "warn"; value: string }) {
  const colors = tone === "good" ? "bg-emerald-50 text-emerald-700" : tone === "warn" ? "bg-amber-50 text-amber-700" : "bg-[#edf3f4] text-[#3b646d]";
  return <article className="rounded-2xl border border-[#e2e8e5] bg-white p-4"><div className="flex items-start justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[.08em] text-[#74817b]">{label}</p><p className="mt-2 text-[23px] font-bold tracking-[-.035em] text-[#17231f]">{value}</p></div><span className={`flex h-8 w-8 items-center justify-center rounded-xl ${colors}`}><Icon name={icon} size={15}/></span></div><p className="mt-3 border-t border-[#eff2f0] pt-2.5 text-[9px] font-semibold text-[#77847e]">{helper}</p></article>;
}

function SectionEditor({ section, onChange }: { section: HomepageSection | undefined; onChange: (patch: Partial<HomepageSection>) => void }) {
  if (!section) return <div className="rounded-2xl border border-[#e2e8e5] bg-white p-6 text-[10px] text-[#7a8781]">Select a homepage section to edit its settings.</div>;
  const inputClass = "mt-1.5 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[9.5px] font-semibold normal-case tracking-normal text-[#42524b] outline-none focus:border-[#759493]";
  return <div className="rounded-2xl border border-[#e2e8e5] bg-white p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-[#7e8b85]">Section settings</p><h3 className="mt-1.5 text-[16px] font-bold text-[#22312b]">{section.title}</h3><p className="mt-1 text-[8.5px] text-[#8a9690]">Source: {section.source}</p></div><label className="flex items-center gap-2 text-[8.5px] font-bold text-[#61716a]"><input checked={section.enabled} className="h-4 w-4 accent-[#426d72]" onChange={(event) => onChange({ enabled: event.target.checked })} type="checkbox"/> Visible</label></div><div className="mt-5 grid gap-4"><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7e8b85]">Section title<input className={inputClass} onChange={(event) => onChange({ title: event.target.value })} value={section.title}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7e8b85]">Section subtitle<textarea className={`${inputClass} min-h-20 py-3`} onChange={(event) => onChange({ subtitle: event.target.value })} value={section.subtitle}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7e8b85]">Display limit<input className={inputClass} max={24} min={1} onChange={(event) => onChange({ displayLimit: Math.max(1, Number(event.target.value) || 1) })} type="number" value={section.displayLimit}/></label></div><div className="mt-5 rounded-xl bg-[#f4f7f5] p-3 text-[8px] leading-4 text-[#74817b]">Content items remain owned by {section.source}. This screen controls homepage title, visibility, order and item limit.</div></div>;
}

function HeroEditor({ hero, isUploading, onChange, onUpload }: { hero: HomepageHero | undefined; isUploading: boolean; onChange: (patch: Partial<HomepageHero>) => void; onUpload: (file: File, target: "desktopImage" | "mobileImage") => void }) {
  const desktopInput = useRef<HTMLInputElement>(null);
  const mobileInput = useRef<HTMLInputElement>(null);
  if (!hero) return <div className="rounded-2xl border border-[#e2e8e5] bg-white p-6 text-[10px] text-[#7a8781]">Add or select a hero slide to edit it.</div>;
  const inputClass = "mt-1.5 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[9.5px] font-semibold normal-case tracking-normal text-[#42524b] outline-none focus:border-[#759493]";
  const previewImage = bnbApiAssetUrl(hero.desktopImage, null);
  return <div className="overflow-hidden rounded-2xl border border-[#e2e8e5] bg-white"><div className="relative min-h-40 bg-[linear-gradient(135deg,#426d72,#9bb0aa)] bg-cover bg-center p-5 text-white" style={previewImage ? { backgroundImage: `linear-gradient(90deg,rgba(20,46,48,.72),rgba(20,46,48,.18)),url(${previewImage})` } : undefined}><span className="rounded-full bg-white/15 px-2.5 py-1 text-[7.5px] font-bold uppercase tracking-[.1em]">{hero.status}</span><h3 className="mt-8 max-w-[75%] text-[20px] font-bold leading-tight">{hero.title || "Hero headline preview"}</h3><p className="mt-2 max-w-[70%] text-[9px] text-white/80">{hero.subtitle || "Add supporting campaign copy."}</p></div><div className="grid gap-4 p-5 sm:grid-cols-2"><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7e8b85] sm:col-span-2">Headline<input className={inputClass} onChange={(event) => onChange({ title: event.target.value })} value={hero.title}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7e8b85] sm:col-span-2">Subtitle<textarea className={`${inputClass} min-h-20 py-3`} onChange={(event) => onChange({ subtitle: event.target.value })} value={hero.subtitle}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7e8b85]">Button text<input className={inputClass} onChange={(event) => onChange({ ctaText: event.target.value })} value={hero.ctaText}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7e8b85]">Button link<input className={inputClass} onChange={(event) => onChange({ link: event.target.value })} placeholder="/products" value={hero.link}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7e8b85]">Visibility<select className={inputClass} onChange={(event) => onChange({ status: event.target.value as HomepageHero["status"] })} value={hero.status}><option value="active">Active</option><option value="draft">Draft</option><option value="inactive">Inactive</option></select></label><div className="sm:col-span-2 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-[#e2e8e5] p-3"><p className="text-[8px] font-bold text-[#6d7b75]">Desktop image · 1600 × 405</p><input accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file, "desktopImage"); }} ref={desktopInput} type="file"/><button className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#edf3f4] px-3 text-[8px] font-bold text-[#426d72] disabled:opacity-50" disabled={isUploading} onClick={() => desktopInput.current?.click()} type="button"><Icon name="upload" size={12}/>{isUploading ? "Uploading..." : "Upload desktop"}</button><input className={inputClass} onChange={(event) => onChange({ desktopImage: event.target.value })} placeholder="Or paste image URL" value={hero.desktopImage}/></div><div className="rounded-xl border border-[#e2e8e5] p-3"><p className="text-[8px] font-bold text-[#6d7b75]">Mobile image · 16:9</p><input accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file, "mobileImage"); }} ref={mobileInput} type="file"/><button className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#edf3f4] px-3 text-[8px] font-bold text-[#426d72] disabled:opacity-50" disabled={isUploading} onClick={() => mobileInput.current?.click()} type="button"><Icon name="upload" size={12}/>{isUploading ? "Uploading..." : "Upload mobile"}</button><input className={inputClass} onChange={(event) => onChange({ mobileImage: event.target.value })} placeholder="Or paste image URL" value={hero.mobileImage}/></div></div></div></div>;
}

export function LiveHomepageCmsWorkspace() {
  const [config, setConfig] = useState<HomepageConfig>(defaultHomepageConfig);
  const [liveConfig, setLiveConfig] = useState<HomepageConfig>(defaultHomepageConfig);
  const [tab, setTab] = useState<CmsTab>("Page structure");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedHeroId, setSelectedHeroId] = useState("");
  const [version, setVersion] = useState(1);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishConfirmed, setPublishConfirmed] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);

  const showNotice = useCallback((message: string, error = false) => {
    setNotice(message);
    setNoticeError(error);
    window.setTimeout(() => setNotice(""), 3400);
  }, []);

  const loadCms = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError("");
    try {
      const state = await fetchHomepageCmsState(signal);
      setConfig(state.draft);
      setLiveConfig(state.live);
      setVersion(state.version);
      setPublishedAt(state.publishedAt);
      setSelectedSectionId((current) => state.draft.sections.some((section) => section.id === current) ? current : state.draft.sections[0]?.id || "");
      setSelectedHeroId((current) => state.draft.heroBanners.some((hero) => hero.id === current) ? current : state.draft.heroBanners[0]?.id || "");
      setIsDirty(false);
    } catch (error) {
      if (!signal?.aborted) setLoadError(error instanceof Error ? error.message : "Homepage CMS could not be loaded.");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadCms(controller.signal), 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [loadCms]);

  const selectedSection = config.sections.find((section) => section.id === selectedSectionId) || config.sections[0];
  const selectedHero = config.heroBanners.find((hero) => hero.id === selectedHeroId) || config.heroBanners[0];
  const activeSections = config.sections.filter((section) => section.enabled).length;
  const activeHeroes = config.heroBanners.filter((hero) => hero.status === "active").length;
  const draftDifferentFromLive = useMemo(() => JSON.stringify(config) !== JSON.stringify(liveConfig), [config, liveConfig]);

  function changeConfig(updater: (current: HomepageConfig) => HomepageConfig) {
    setConfig(updater);
    setIsDirty(true);
  }

  function moveSection(id: string, direction: -1 | 1) {
    changeConfig((current) => {
      const sections = [...current.sections];
      const index = sections.findIndex((section) => section.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= sections.length) return current;
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...current, sections: sections.map((section, position) => ({ ...section, sortOrder: position + 1 })) };
    });
  }

  function moveHero(id: string, direction: -1 | 1) {
    changeConfig((current) => {
      const heroes = [...current.heroBanners];
      const index = heroes.findIndex((hero) => hero.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= heroes.length) return current;
      [heroes[index], heroes[target]] = [heroes[target], heroes[index]];
      return { ...current, heroBanners: heroes.map((hero, position) => ({ ...hero, sortOrder: position + 1 })) };
    });
  }

  function addHero() {
    const id = `hero-${Date.now()}`;
    const hero: HomepageHero = { ctaText: "Shop now", desktopImage: "", id, link: "/products", mobileImage: "", sortOrder: config.heroBanners.length + 1, status: "draft", subtitle: "", title: "New homepage campaign" };
    changeConfig((current) => ({ ...current, heroBanners: [...current.heroBanners, hero] }));
    setSelectedHeroId(id);
    setTab("Hero slider");
  }

  async function uploadImage(file: File, target: "desktopImage" | "mobileImage") {
    if (file.size > 5 * 1024 * 1024) { showNotice("Image must be 5 MB or smaller.", true); return; }
    setIsUploading(true);
    try {
      const url = await uploadHomepageImage(file);
      changeConfig((current) => ({ ...current, heroBanners: current.heroBanners.map((hero) => hero.id === selectedHero?.id ? { ...hero, [target]: url } : hero) }));
      showNotice("Homepage image uploaded.");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Image upload failed.", true);
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
      showNotice("Homepage draft saved in MySQL.");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Homepage draft could not be saved.", true);
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
      showNotice(`Homepage version ${state.version} published.`);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Homepage could not be published.", true);
    } finally {
      setIsSaving(false);
    }
  }

  return <div className="space-y-4"><header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="flex items-center gap-2 text-[8.5px] font-extrabold uppercase tracking-[.18em] text-[#547874]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Storefront CMS</p><h1 className="mt-2 text-[26px] font-bold tracking-[-.045em] text-[#17231f]">Homepage command center</h1><p className="mt-1.5 text-[10px] font-medium text-[#74817b]">Control homepage structure and hero campaigns with recoverable draft and live versions.</p></div><div className="flex flex-wrap gap-2"><button className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[9.5px] font-bold text-[#62706a] disabled:opacity-50" disabled={isLoading} onClick={() => void loadCms()} type="button"><Icon className={isLoading ? "animate-spin" : ""} name="refresh" size={14}/> Refresh</button><button className="inline-flex items-center gap-1.5 rounded-xl border border-[#bfcfca] bg-white px-3.5 py-2.5 text-[9.5px] font-bold text-[#426d72] disabled:opacity-50" disabled={isSaving || (!isDirty && !draftDifferentFromLive)} onClick={() => void saveDraft()} type="button"><Icon name="save" size={14}/> {isSaving ? "Saving..." : "Save draft"}</button><button className="inline-flex items-center gap-1.5 rounded-xl bg-[#426d72] px-3.5 py-2.5 text-[9.5px] font-bold text-white disabled:opacity-50" disabled={isSaving || (!isDirty && !draftDifferentFromLive)} onClick={() => setPublishOpen(true)} type="button"><Icon name="check" size={14}/> Publish</button></div></header><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi helper="Visible homepage blocks" icon="content" label="Active sections" tone="good" value={`${activeSections}/${config.sections.length}`}/><Kpi helper="Visible carousel campaigns" icon="image" label="Active hero slides" value={String(activeHeroes)}/><Kpi helper="Current public configuration" icon="check" label="Live version" value={`v${version}`}/><Kpi helper={dateText(publishedAt)} icon="calendar" label="Publication status" tone={draftDifferentFromLive || isDirty ? "warn" : "good"} value={draftDifferentFromLive || isDirty ? "Draft changes" : "Up to date"}/></section>{loadError ? <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[9.5px] font-bold text-rose-700"><span className="flex items-center gap-2"><Icon name="alert" size={14}/>{loadError}</span><button className="underline" onClick={() => void loadCms()} type="button">Try again</button></div> : null}<section className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white"><div className="flex flex-col gap-3 border-b border-[#e7ece9] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex rounded-xl border border-[#dfe6e3] bg-[#f7f9f8] p-1">{(["Page structure", "Hero slider"] as CmsTab[]).map((item) => <button className={`rounded-lg px-4 py-2 text-[9px] font-bold ${tab === item ? "bg-white text-[#426d72] shadow-sm" : "text-[#7b8882]"}`} key={item} onClick={() => setTab(item)} type="button">{item}</button>)}</div>{tab === "Hero slider" ? <button className="inline-flex items-center gap-1.5 rounded-xl bg-[#edf3f4] px-3.5 py-2.5 text-[9px] font-bold text-[#426d72]" onClick={addHero} type="button"><Icon name="plus" size={13}/> Add hero slide</button> : <div className="text-[8.5px] font-semibold text-[#84908a]">Drag-free controlled ordering · use arrows</div>}</div>{tab === "Page structure" ? <div className="grid gap-3 p-4 xl:grid-cols-[minmax(0,1fr)_350px]"><div className="overflow-hidden rounded-2xl border border-[#e2e8e5]"><div className="border-b border-[#e8edeb] bg-[#fbfcfb] px-4 py-3"><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7f8b85]">Homepage headline<input className="mt-2 h-10 w-full rounded-xl border border-[#dce4e0] px-3 text-[10px] font-bold normal-case tracking-normal text-[#35453e] outline-none" onChange={(event) => changeConfig((current) => ({ ...current, pageTitle: event.target.value }))} value={config.pageTitle}/></label><label className="mt-3 block text-[8px] font-bold uppercase tracking-[.1em] text-[#7f8b85]">Homepage supporting line<input className="mt-2 h-10 w-full rounded-xl border border-[#dce4e0] px-3 text-[9.5px] font-semibold normal-case tracking-normal text-[#50605a] outline-none" onChange={(event) => changeConfig((current) => ({ ...current, pageSubtitle: event.target.value }))} value={config.pageSubtitle}/></label></div><div className="divide-y divide-[#edf1ef]">{config.sections.map((section, index) => <button className={`grid w-full grid-cols-[36px_minmax(0,1fr)_70px_72px] items-center gap-3 p-4 text-left hover:bg-[#f8faf9] ${selectedSection?.id === section.id ? "bg-[#f3f7f5]" : ""}`} key={section.id} onClick={() => setSelectedSectionId(section.id)} type="button"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf3f4] text-[9px] font-extrabold text-[#426d72]">{index + 1}</span><span className="min-w-0"><b className="block truncate text-[9.5px] text-[#34433d]">{section.title}</b><small className="mt-1 block truncate text-[7.5px] text-[#8b9691]">{section.source} · {section.displayLimit} items</small></span><span className={`rounded-full px-2 py-1 text-center text-[7.5px] font-bold ${section.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{section.enabled ? "Visible" : "Hidden"}</span><span className="flex justify-end gap-1"><span className={`flex h-7 w-7 items-center justify-center rounded-lg border ${index === 0 ? "opacity-30" : "bg-white"}`} onClick={(event) => { event.stopPropagation(); moveSection(section.id, -1); }}><Icon name="up" size={11}/></span><span className={`flex h-7 w-7 items-center justify-center rounded-lg border ${index === config.sections.length - 1 ? "opacity-30" : "bg-white"}`} onClick={(event) => { event.stopPropagation(); moveSection(section.id, 1); }}><Icon name="down" size={11}/></span></span></button>)}</div></div><SectionEditor onChange={(patch) => changeConfig((current) => ({ ...current, sections: current.sections.map((section) => section.id === selectedSection?.id ? { ...section, ...patch } : section) }))} section={selectedSection}/></div> : <div className="grid gap-3 p-4 xl:grid-cols-[310px_minmax(0,1fr)]"><div className="overflow-hidden rounded-2xl border border-[#e2e8e5] bg-white"><div className="border-b border-[#e8edeb] bg-[#fbfcfb] px-4 py-3 text-[8px] font-bold uppercase tracking-[.1em] text-[#84908a]">Hero slides · {config.heroBanners.length}/12</div>{config.heroBanners.length ? <div className="divide-y divide-[#edf1ef]">{config.heroBanners.map((hero, index) => <button className={`grid w-full grid-cols-[34px_minmax(0,1fr)_60px] items-center gap-3 p-3 text-left ${selectedHero?.id === hero.id ? "bg-[#f3f7f5]" : "hover:bg-[#f8faf9]"}`} key={hero.id} onClick={() => setSelectedHeroId(hero.id)} type="button"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf3f4] text-[#426d72]"><Icon name="image" size={13}/></span><span className="min-w-0"><b className="block truncate text-[9px] text-[#34433d]">{hero.title || `Hero ${index + 1}`}</b><small className="mt-1 block text-[7px] capitalize text-[#8b9691]">{hero.status}</small></span><span className="flex justify-end gap-1"><span className="flex h-7 w-7 items-center justify-center rounded-lg border bg-white" onClick={(event) => { event.stopPropagation(); moveHero(hero.id, -1); }}><Icon name="up" size={10}/></span><span className="flex h-7 w-7 items-center justify-center rounded-lg border bg-white" onClick={(event) => { event.stopPropagation(); moveHero(hero.id, 1); }}><Icon name="down" size={10}/></span></span></button>)}</div> : <div className="p-8 text-center"><span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3f4] text-[#426d72]"><Icon name="image" size={16}/></span><p className="mt-3 text-[9px] font-bold text-[#53635c]">No hero slide yet</p><button className="mt-3 rounded-lg bg-[#426d72] px-3 py-2 text-[8px] font-bold text-white" onClick={addHero} type="button">Add first slide</button></div>}</div><HeroEditor hero={selectedHero} isUploading={isUploading} onChange={(patch) => changeConfig((current) => ({ ...current, heroBanners: current.heroBanners.map((hero) => hero.id === selectedHero?.id ? { ...hero, ...patch } : hero) }))} onUpload={(file, target) => void uploadImage(file, target)}/></div>}</section>{publishOpen ? <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#17231f]/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setPublishOpen(false); }}><div className="w-full max-w-[560px] overflow-hidden rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.24)]"><div className="flex items-start justify-between border-b border-[#e8ecea] p-5"><div><p className="text-[8.5px] font-bold uppercase tracking-[.14em] text-[#426d72]">Human approval required</p><h2 className="mt-1.5 text-[18px] font-bold text-[#22312b]">Publish homepage version {version + 1}</h2><p className="mt-1 text-[9px] text-[#84908a]">This updates the public homepage configuration. Version {version} remains recorded in the database.</p></div><button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5f3] text-[#65736c]" onClick={() => setPublishOpen(false)} type="button"><Icon name="close" size={14}/></button></div><div className="space-y-4 p-5"><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#f5f8f6] p-3"><span className="text-[8px] font-bold text-[#7d8983]">Visible sections</span><b className="mt-1 block text-[15px] text-[#33443d]">{activeSections}</b></div><div className="rounded-xl bg-[#f5f8f6] p-3"><span className="text-[8px] font-bold text-[#7d8983]">Active hero slides</span><b className="mt-1 block text-[15px] text-[#33443d]">{activeHeroes}</b></div></div><div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-[8.5px] leading-4 text-amber-800"><b className="block">Check before publishing</b>Confirm desktop/mobile hero images, links, section order and visibility.</div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#dfe6e3] p-4"><input checked={publishConfirmed} className="mt-0.5 h-4 w-4 accent-[#426d72]" onChange={(event) => setPublishConfirmed(event.target.checked)} type="checkbox"/><span className="text-[8.5px] leading-4 text-[#596962]">I reviewed the homepage draft and approve publishing it to the customer-facing configuration.</span></label></div><div className="flex justify-end gap-2 border-t border-[#e8ecea] bg-[#fafbfa] p-5"><button className="h-10 rounded-xl border border-[#dce4e0] bg-white px-4 text-[9px] font-bold text-[#66756e]" onClick={() => setPublishOpen(false)} type="button">Cancel</button><button className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#426d72] px-4 text-[9px] font-bold text-white disabled:opacity-40" disabled={!publishConfirmed || isSaving} onClick={() => void publishNow()} type="button"><Icon name="check" size={13}/>{isSaving ? "Publishing..." : "Publish homepage"}</button></div></div></div> : null}{notice ? <div className={`fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-[10px] font-bold text-white shadow-xl ${noticeError ? "bg-rose-600" : "bg-[#335e63]"}`}>{notice}</div> : null}</div>;
}
