"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  defaultHeaderNavigationConfig,
  fetchHeaderNavigationState,
  publishHeaderNavigation,
  restoreHeaderNavigationDraft,
  saveHeaderNavigationDraft,
  type HeaderNavChild,
  type HeaderNavItem,
  type HeaderNavigationConfig,
  type HeaderNavigationVersion,
} from "@/features/header-navigation/header-navigation-client";

type NavigationTab = "Header settings" | "Menu structure" | "Mobile navigation" | "Version history";
type PreviewDevice = "Desktop" | "Mobile";
type IconName = "alert" | "bag" | "check" | "chevron" | "close" | "content" | "edit" | "eye" | "history" | "menu" | "plus" | "refresh" | "save" | "search" | "settings" | "store" | "user";

const iconPaths: Record<IconName, ReactNode> = {
  alert: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  bag: <><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/><path d="M4 7h16l-1 14H5L4 7Z"/><path d="M9 11v1a3 3 0 0 0 6 0v-1"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  content: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
  edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></>,
  save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34A1.7 1.7 0 0 0 14 20.9V21h-4v-.09a1.7 1.7 0 0 0-1.05-1.51 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3 14v-4a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3h4a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.6 1v4a1.7 1.7 0 0 0-1.6 1Z"/></>,
  store: <><path d="M3 9 5 3h14l2 6"/><path d="M5 13v8h14v-8M9 21v-6h6v6"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/></>,
  user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
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

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return <button aria-label={`Toggle ${label}`} className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-[#426d72]" : "bg-[#d8dfdc]"}`} onClick={onChange} type="button"><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${checked ? "left-6" : "left-1"}`}/></button>;
}

function statusTone(status: HeaderNavItem["status"]) {
  if (status === "active") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "draft") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function childLines(children: HeaderNavChild[]) {
  return children.map((child) => `${child.label} | ${child.link}`).join("\n");
}

function parseChildLines(value: string, parentId: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean).flatMap((line, index) => {
    const [rawLabel, rawLink] = line.split("|");
    const label = rawLabel?.trim() || "";
    const link = rawLink?.trim() || "";
    if (!label || !link.startsWith("/")) return [];
    return [{ id: `${parentId}-${String(index + 1).padStart(2, "0")}`, label, link }];
  });
}

const inputClass = "mt-1.5 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[9.5px] font-semibold normal-case tracking-normal text-[#42524b] outline-none focus:border-[#759493]";

export function LiveHeaderNavigationWorkspace() {
  const [config, setConfig] = useState<HeaderNavigationConfig>(defaultHeaderNavigationConfig);
  const [liveConfig, setLiveConfig] = useState<HeaderNavigationConfig>(defaultHeaderNavigationConfig);
  const [versions, setVersions] = useState<HeaderNavigationVersion[]>([]);
  const [version, setVersion] = useState(1);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [tab, setTab] = useState<NavigationTab>("Menu structure");
  const [selectedId, setSelectedId] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("Desktop");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"Create" | "Edit">("Edit");
  const [editorDraft, setEditorDraft] = useState({ children: "", kind: "direct" as HeaderNavItem["kind"], label: "", link: "", status: "draft" as HeaderNavItem["status"] });
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishConfirmed, setPublishConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);

  const selected = config.items.find((item) => item.id === selectedId) || config.items[0];
  const draftDifferentFromLive = useMemo(() => JSON.stringify(config) !== JSON.stringify(liveConfig), [config, liveConfig]);
  const validationBlockers = useMemo(() => {
    const blockers: string[] = [];
    const labels = new Set<string>();
    config.items.forEach((item) => {
      const normalizedLabel = item.label.trim().toLowerCase();
      if (!normalizedLabel || !item.link.startsWith("/")) blockers.push(`${item.label || "Unnamed item"}: label or link is invalid.`);
      if (labels.has(normalizedLabel)) blockers.push(`${item.label}: duplicate primary label.`);
      labels.add(normalizedLabel);
      if (item.status === "active" && item.kind === "mega" && item.children.length < 2) blockers.push(`${item.label}: active mega menu needs at least two destinations.`);
    });
    if (!config.items.some((item) => item.status === "active")) blockers.push("At least one active primary menu item is required.");
    if (new Set(config.mobileShortcuts).size !== config.mobileShortcuts.length) blockers.push("Mobile shortcuts must be unique.");
    if (config.announcement.enabled && !config.announcement.text.trim()) blockers.push("The announcement strip needs a message.");
    return blockers;
  }, [config]);

  const showNotice = useCallback((message: string, error = false) => {
    setNotice(message);
    setNoticeError(error);
    window.setTimeout(() => setNotice(""), 3400);
  }, []);

  const loadNavigation = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError("");
    try {
      const state = await fetchHeaderNavigationState(signal);
      setConfig(state.draft);
      setLiveConfig(state.live);
      setVersion(state.version);
      setVersions(state.versions);
      setPublishedAt(state.publishedAt);
      setSelectedId((current) => state.draft.items.some((item) => item.id === current) ? current : state.draft.items[0]?.id || "");
      setIsDirty(false);
    } catch (error) {
      if (!signal?.aborted) setLoadError(error instanceof Error ? error.message : "Header navigation could not be loaded.");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadNavigation(controller.signal), 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [loadNavigation]);

  function changeConfig(updater: (current: HeaderNavigationConfig) => HeaderNavigationConfig) {
    setConfig(updater);
    setIsDirty(true);
  }

  function moveItem(id: string, direction: -1 | 1) {
    changeConfig((current) => {
      const items = [...current.items];
      const index = items.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= items.length) return current;
      [items[index], items[target]] = [items[target], items[index]];
      return { ...current, items: items.map((item, position) => ({ ...item, sortOrder: position + 1 })) };
    });
  }

  function toggleItem(id: string) {
    changeConfig((current) => ({ ...current, items: current.items.map((item) => item.id === id ? { ...item, status: item.status === "hidden" ? "draft" : "hidden" } : item) }));
  }

  function openEditor(mode: "Create" | "Edit", target = selected) {
    setEditorMode(mode);
    if (mode === "Edit" && target) {
      setEditorDraft({ children: childLines(target.children), kind: target.kind, label: target.label, link: target.link, status: target.status });
    } else {
      setEditorDraft({ children: "", kind: "direct", label: "", link: "/", status: "draft" });
    }
    setEditorOpen(true);
  }

  function saveMenuItem() {
    const label = editorDraft.label.trim();
    const link = editorDraft.link.trim();
    if (!label || !link.startsWith("/")) { showNotice("Menu label and an internal link beginning with / are required.", true); return; }
    const duplicate = config.items.some((item) => item.label.trim().toLowerCase() === label.toLowerCase() && (editorMode === "Create" || item.id !== selected?.id));
    if (duplicate) { showNotice("A primary menu item already uses this label.", true); return; }
    const id = editorMode === "Edit" && selected ? selected.id : `NAV-${Date.now()}`;
    const children = editorDraft.kind === "mega" ? parseChildLines(editorDraft.children, id) : [];
    if (editorDraft.kind === "mega" && editorDraft.status === "active" && children.length < 2) { showNotice("An active mega menu needs at least two valid lines: Label | /link", true); return; }
    const item: HeaderNavItem = { children, id, kind: editorDraft.kind, label, link, sortOrder: editorMode === "Edit" && selected ? selected.sortOrder : config.items.length + 1, status: editorDraft.status };
    changeConfig((current) => ({ ...current, items: editorMode === "Edit" && selected ? current.items.map((entry) => entry.id === selected.id ? item : entry) : [...current.items, item] }));
    setSelectedId(id);
    setEditorOpen(false);
    showNotice(`Navigation item ${editorMode === "Create" ? "added" : "updated"} in the draft.`);
  }

  function removeSelectedItem() {
    if (!selected || !window.confirm(`Remove ${selected.label} from the draft navigation?`)) return;
    const remaining = config.items.filter((item) => item.id !== selected.id);
    changeConfig((current) => ({ ...current, items: remaining.map((item, index) => ({ ...item, sortOrder: index + 1 })) }));
    setSelectedId(remaining[0]?.id || "");
    setEditorOpen(false);
    showNotice("Menu item removed from the draft.");
  }

  async function saveDraft() {
    setIsSaving(true);
    try {
      const state = await saveHeaderNavigationDraft(config);
      setConfig(state.draft);
      setLiveConfig(state.live);
      setVersions(state.versions);
      setIsDirty(false);
      showNotice("Header navigation draft saved in MySQL.");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Header navigation draft could not be saved.", true);
    } finally {
      setIsSaving(false);
    }
  }

  async function publishNow() {
    setIsSaving(true);
    try {
      const state = await publishHeaderNavigation(config);
      setConfig(state.draft);
      setLiveConfig(state.live);
      setVersion(state.version);
      setVersions(state.versions);
      setPublishedAt(state.publishedAt);
      setIsDirty(false);
      setPublishOpen(false);
      setPublishConfirmed(false);
      showNotice(`Header navigation version ${state.version} published.`);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Header navigation could not be published.", true);
    } finally {
      setIsSaving(false);
    }
  }

  async function restoreDraft(targetVersion: number) {
    if (!window.confirm(`Load version ${targetVersion} as the editable draft? The current live header will not change.`)) return;
    setIsSaving(true);
    try {
      const state = await restoreHeaderNavigationDraft(targetVersion);
      setConfig(state.draft);
      setLiveConfig(state.live);
      setVersions(state.versions);
      setSelectedId(state.draft.items[0]?.id || "");
      setIsDirty(false);
      setTab("Menu structure");
      showNotice(`Version ${targetVersion} loaded as draft. Review before publishing.`);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Navigation version could not be restored.", true);
    } finally {
      setIsSaving(false);
    }
  }

  const settingRows: Array<{ helper: string; icon: IconName; key: keyof HeaderNavigationConfig["settings"]; label: string }> = [
    { helper: "Keep primary navigation visible while scrolling", icon: "menu", key: "sticky", label: "Sticky header" },
    { helper: "Product, brand and concern search entry", icon: "search", key: "search", label: "Store search" },
    { helper: "Customer saved-product shortcut", icon: "check", key: "wishlist", label: "Wishlist" },
    { helper: "Login and customer profile shortcut", icon: "user", key: "account", label: "Customer account" },
    { helper: "Cart shortcut with item count", icon: "bag", key: "cart", label: "Shopping bag" },
    { helper: "Optional Bangla and English control", icon: "content", key: "language", label: "Language switcher" },
  ];

  const activeItems = config.items.filter((item) => item.status === "active");
  const megaMenus = config.items.filter((item) => item.kind === "mega").length;

  return <div className="space-y-4">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="flex items-center gap-2 text-[8.5px] font-extrabold uppercase tracking-[.18em] text-[#547874]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Storefront navigation</p><h1 className="mt-2 text-[26px] font-bold tracking-[-.045em] text-[#17231f]">Header & navigation</h1><p className="mt-1.5 text-[10px] font-medium text-[#74817b]">Manage one responsive menu source with recoverable MySQL draft and live versions.</p></div>
      <div className="flex flex-wrap gap-2"><button className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[9.5px] font-bold text-[#62706a]" onClick={() => setPreviewOpen(true)} type="button"><Icon name="eye" size={14}/> Preview</button><button className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[9.5px] font-bold text-[#62706a] disabled:opacity-50" disabled={isLoading} onClick={() => void loadNavigation()} type="button"><Icon className={isLoading ? "animate-spin" : ""} name="refresh" size={14}/> Refresh</button><button className="inline-flex items-center gap-1.5 rounded-xl border border-[#bfcfca] bg-white px-3.5 py-2.5 text-[9.5px] font-bold text-[#426d72] disabled:opacity-50" disabled={isSaving || (!isDirty && !draftDifferentFromLive)} onClick={() => void saveDraft()} type="button"><Icon name="save" size={14}/> {isSaving ? "Saving..." : "Save draft"}</button><button className="inline-flex items-center gap-1.5 rounded-xl bg-[#426d72] px-3.5 py-2.5 text-[9.5px] font-bold text-white disabled:opacity-40" disabled={isSaving || (!isDirty && !draftDifferentFromLive) || validationBlockers.length > 0} onClick={() => setPublishOpen(true)} type="button"><Icon name="check" size={14}/> Publish</button></div>
    </header>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi helper="Customer-visible primary links" icon="menu" label="Active menu items" tone="good" value={`${activeItems.length}/${config.items.length}`}/><Kpi helper="Nested discovery groups" icon="content" label="Mega menus" value={String(megaMenus)}/><Kpi helper="Current public header" icon="check" label="Live version" value={`v${version}`}/><Kpi helper={dateText(publishedAt)} icon="history" label="Publication status" tone={draftDifferentFromLive || isDirty ? "warn" : "good"} value={draftDifferentFromLive || isDirty ? "Draft changes" : "Up to date"}/></section>

    {loadError ? <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[9.5px] font-bold text-rose-700"><span className="flex items-center gap-2"><Icon name="alert" size={14}/>{loadError}</span><button className="underline" onClick={() => void loadNavigation()} type="button">Try again</button></div> : null}
    {validationBlockers.length ? <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[9px] font-bold text-amber-800"><Icon name="alert" size={13}/>{validationBlockers.length} draft validation issue{validationBlockers.length === 1 ? "" : "s"} must be fixed before publishing.</div> : null}

    <section className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">
      <div className="flex overflow-x-auto border-b border-[#e7ece9] bg-[#fafbfa] px-3">{(["Menu structure", "Header settings", "Mobile navigation", "Version history"] as NavigationTab[]).map((item) => <button className={`relative min-w-fit px-4 py-4 text-[9.5px] font-bold ${tab === item ? "text-[#426d72]" : "text-[#7b8882]"}`} key={item} onClick={() => setTab(item)} type="button">{item}{tab === item ? <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#426d72]"/> : null}</button>)}</div>

      {tab === "Menu structure" ? <div className="grid xl:grid-cols-[minmax(0,1fr)_370px]">
        <div className="min-w-0"><div className="flex items-center justify-between gap-3 border-b border-[#edf1ef] p-4"><div><p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#84908a]">Primary menu order</p><p className="mt-1 text-[8px] text-[#8b9691]">Use arrows to control desktop and mobile order.</p></div><button className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#edf3f4] px-3 text-[8.5px] font-bold text-[#426d72]" onClick={() => openEditor("Create")} type="button"><Icon name="plus" size={12}/> Add menu item</button></div><div className="divide-y divide-[#edf1ef]">{config.items.map((item, index) => <div className={selected?.id === item.id ? "grid grid-cols-[minmax(0,1fr)_108px_104px] items-center gap-3 bg-[#f4f8f6] p-3" : "grid grid-cols-[minmax(0,1fr)_108px_104px] items-center gap-3 p-3"} key={item.id}><button className="flex min-w-0 items-center gap-3 text-left" onClick={() => setSelectedId(item.id)} type="button"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf3f4] text-[8px] font-extrabold text-[#426d72]">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0"><b className="block truncate text-[9.5px] text-[#34433d]">{item.label}</b><small className="mt-1 block truncate text-[7.5px] text-[#8b9691]">{item.link} · {item.kind}</small></span></button><span className={`rounded-full px-2 py-1 text-center text-[7.5px] font-bold capitalize ring-1 ring-inset ${statusTone(item.status)}`}>{item.status}</span><span className="flex justify-end gap-1"><button aria-label={`Move ${item.label} up`} className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white disabled:opacity-30" disabled={index === 0} onClick={() => moveItem(item.id, -1)} type="button"><Icon className="-rotate-90" name="chevron" size={10}/></button><button aria-label={`Move ${item.label} down`} className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white disabled:opacity-30" disabled={index === config.items.length - 1} onClick={() => moveItem(item.id, 1)} type="button"><Icon className="rotate-90" name="chevron" size={10}/></button><button aria-label={`${item.status === "hidden" ? "Show" : "Hide"} ${item.label}`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf3f4] text-[#426d72]" onClick={() => toggleItem(item.id)} type="button"><Icon name="eye" size={11}/></button></span></div>)}</div></div>
        <aside className="border-t border-[#e8ecea] bg-[#fbfcfb] p-5 xl:border-l xl:border-t-0">{selected ? <><div className="flex items-start justify-between"><div><p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#84908a]">Selected menu item</p><h2 className="mt-1.5 text-[16px] font-bold text-[#2b3933]">{selected.label}</h2></div><span className={`rounded-full px-2.5 py-1 text-[7.5px] font-bold capitalize ring-1 ring-inset ${statusTone(selected.status)}`}>{selected.status}</span></div><div className="mt-4 rounded-xl border border-[#e2e8e5] bg-white p-4"><span className="text-[7px] font-bold uppercase tracking-[.1em] text-[#919c97]">Destination</span><b className="mt-1.5 block truncate text-[9px] text-[#43524b]">{selected.link}</b><div className="mt-3 flex items-center justify-between border-t border-[#edf0ee] pt-3 text-[8px]"><span className="text-[#8d9893]">Navigation type</span><b className="capitalize text-[#4d5d55]">{selected.kind}</b></div></div>{selected.children.length ? <div className="mt-4"><div className="flex items-center justify-between"><p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#84908a]">Mega-menu destinations</p><span className="text-[8px] font-bold text-[#426d72]">{selected.children.length}</span></div><div className="mt-2 grid grid-cols-2 gap-2">{selected.children.map((child) => <span className="rounded-lg border border-[#e2e8e5] bg-white px-3 py-2 text-[7.5px] font-semibold text-[#5d6b65]" key={child.id}>{child.label}</span>)}</div></div> : <div className="mt-4 rounded-xl border border-[#e2e8e5] bg-white p-4 text-[8px] leading-4 text-[#7c8882]">This item opens one storefront destination directly.</div>}<button className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#426d72] text-[9px] font-bold text-white" onClick={() => openEditor("Edit")} type="button"><Icon name="edit" size={12}/> Edit selected item</button></> : <p className="text-[9px] text-[#84908a]">Add or select a menu item.</p>}</aside>
      </div> : null}

      {tab === "Header settings" ? <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_390px]"><div className="overflow-hidden rounded-xl border border-[#e2e8e5]"><div className="border-b border-[#e8ecea] bg-[#fafbfa] p-4"><p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#84908a]">Header capabilities</p><p className="mt-1 text-[8px] text-[#7c8882]">Show only controls that help discovery, trust or checkout.</p></div><div className="divide-y divide-[#edf0ee]">{settingRows.map((row) => <div className="flex items-center gap-3 p-4" key={row.key}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf3f4] text-[#426d72]"><Icon name={row.icon} size={14}/></span><div className="min-w-0 flex-1"><b className="block text-[9.5px] text-[#405049]">{row.label}</b><span className="mt-1 block text-[7.5px] text-[#929d97]">{row.helper}</span></div><Toggle checked={config.settings[row.key]} label={row.label} onChange={() => changeConfig((current) => ({ ...current, settings: { ...current.settings, [row.key]: !current.settings[row.key] } }))}/></div>)}</div></div><aside className="space-y-4"><div className="rounded-xl border border-[#e2e8e5] bg-white p-4"><div className="flex items-start justify-between"><div><p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#84908a]">Announcement strip</p><b className="mt-1.5 block text-[12px] text-[#405049]">Sitewide trust or campaign message</b></div><Toggle checked={config.announcement.enabled} label="Announcement strip" onChange={() => changeConfig((current) => ({ ...current, announcement: { ...current.announcement, enabled: !current.announcement.enabled } }))}/></div><label className="mt-4 block text-[8px] font-bold uppercase tracking-[.1em] text-[#7e8b85]">Message<input className={inputClass} onChange={(event) => changeConfig((current) => ({ ...current, announcement: { ...current.announcement, text: event.target.value } }))} value={config.announcement.text}/></label><label className="mt-3 block text-[8px] font-bold uppercase tracking-[.1em] text-[#7e8b85]">Destination<input className={inputClass} onChange={(event) => changeConfig((current) => ({ ...current, announcement: { ...current.announcement, link: event.target.value } }))} value={config.announcement.link}/></label></div><div className="rounded-xl border border-[#d4e0dc] bg-[#edf3f4] p-4"><b className="text-[9px] text-[#365556]">Single source rule</b><p className="mt-1.5 text-[8px] leading-4 text-[#627871]">Desktop and mobile use the same menu records. Campaign copy belongs in the announcement strip.</p></div></aside></div> : null}

      {tab === "Mobile navigation" ? <div className="grid gap-6 p-5 lg:grid-cols-[330px_minmax(0,1fr)]"><div className="mx-auto w-full max-w-[300px] rounded-[28px] border-[7px] border-[#263b3c] bg-white p-3 shadow-[0_18px_45px_rgba(34,56,51,.14)]"><div className="flex items-center justify-between border-b border-[#e8ecea] px-2 py-3"><Icon name="menu" size={15}/><b className="text-[11px] text-[#31545c]">brandnbeauty</b><div className="flex gap-2">{config.settings.search ? <Icon name="search" size={13}/> : null}{config.settings.cart ? <Icon name="bag" size={13}/> : null}</div></div><div className="space-y-1 py-3">{config.items.filter((item) => item.status !== "hidden").slice(0, 7).map((item) => <div className="flex items-center justify-between rounded-xl px-3 py-3 text-[9px] font-bold text-[#4d5d55]" key={item.id}><span>{item.label}</span><Icon name="chevron" size={11}/></div>)}</div><div className="grid grid-cols-4 border-t border-[#e8ecea] pt-3 text-center text-[6.5px] font-bold text-[#77847e]">{config.mobileShortcuts.map((shortcut) => <span className="flex flex-col items-center gap-1" key={shortcut}><Icon name={shortcut === "Home" ? "store" : shortcut === "Search" ? "search" : shortcut === "Bag" ? "bag" : shortcut === "Account" ? "user" : "check"} size={13}/>{shortcut}</span>)}</div></div><div><p className="text-[8px] font-bold uppercase tracking-[.13em] text-[#84908a]">Mobile bottom bar</p><h3 className="mt-1 text-[16px] font-bold text-[#2b3933]">Choose four unique shortcuts</h3><p className="mt-2 max-w-xl text-[9px] leading-4 text-[#7c8882]">These use existing storefront destinations and remain within easy thumb reach.</p><div className="mt-5 space-y-3">{Array.from({ length: 4 }, (_, index) => <label className="flex items-center gap-3 rounded-xl border border-[#e2e8e5] p-3" key={index}><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#edf3f4] text-[9px] font-bold text-[#426d72]">{index + 1}</span><span className="text-[8px] font-bold uppercase tracking-[.1em] text-[#84908a]">Shortcut</span><select className="ml-auto h-9 min-w-[190px] rounded-xl border border-[#dce4e0] bg-white px-3 text-[9px] font-semibold text-[#4f5e57] outline-none" onChange={(event) => changeConfig((current) => ({ ...current, mobileShortcuts: Array.from({ length: 4 }, (_, itemIndex) => itemIndex === index ? event.target.value : current.mobileShortcuts[itemIndex] || ["Home", "Search", "Wishlist", "Bag"][itemIndex]) }))} value={config.mobileShortcuts[index] || ["Home", "Search", "Wishlist", "Bag"][index]}>{["Home", "Search", "Categories", "Wishlist", "Account", "Bag"].map((option) => <option key={option}>{option}</option>)}</select></label>)}</div></div></div> : null}

      {tab === "Version history" ? <div className="p-5"><div className="overflow-x-auto rounded-xl border border-[#e2e8e5]"><table className="w-full min-w-[720px] text-left"><thead className="bg-[#fafbfa] text-[8px] font-bold uppercase tracking-[.1em] text-[#8a9590]"><tr><th className="px-5 py-3.5">Version</th><th className="px-3 py-3.5">Published</th><th className="px-3 py-3.5">Actor</th><th className="px-3 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Action</th></tr></thead><tbody className="divide-y divide-[#edf0ee]">{versions.map((entry) => <tr className="text-[9px] text-[#596861]" key={entry.version}><td className="px-5 py-4 font-bold text-[#35443d]">v{entry.version}</td><td className="px-3 py-4">{dateText(entry.publishedAt)}</td><td className="px-3 py-4 font-semibold">{entry.publishedBy}</td><td className="px-3 py-4"><span className={entry.version === version ? "rounded-full bg-emerald-50 px-2.5 py-1 text-[7px] font-bold text-emerald-700" : "rounded-full bg-slate-100 px-2.5 py-1 text-[7px] font-bold text-slate-600"}>{entry.version === version ? "Current" : "Previous"}</span></td><td className="px-5 py-4 text-right"><button className="font-bold text-[#426d72] disabled:opacity-30" disabled={entry.version === version || isSaving} onClick={() => void restoreDraft(entry.version)} type="button">Load as draft</button></td></tr>)}</tbody></table></div><div className="mt-4 flex gap-3 rounded-xl bg-[#edf3f4] p-4 text-[8px] leading-4 text-[#526965]"><Icon className="mt-0.5 shrink-0" name="history" size={13}/><p>Loading a previous version changes only the draft. The live storefront remains unchanged until a separate reviewed publish.</p></div></div> : null}
    </section>

    {editorOpen ? <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#17231f]/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setEditorOpen(false); }}><div className="max-h-[92vh] w-full max-w-[650px] overflow-y-auto rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.24)]"><div className="flex items-start justify-between border-b border-[#e8ecea] p-5"><div><p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#426d72]">{editorMode} navigation item</p><h2 className="mt-1.5 text-[18px] font-bold text-[#22312b]">{editorMode === "Create" ? "Add storefront destination" : `Edit ${selected?.label || "menu item"}`}</h2></div><button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5f3]" onClick={() => setEditorOpen(false)} type="button"><Icon name="close" size={14}/></button></div><div className="grid gap-4 p-5 sm:grid-cols-2"><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7e8b85]">Menu label<input className={inputClass} onChange={(event) => setEditorDraft((current) => ({ ...current, label: event.target.value }))} value={editorDraft.label}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7e8b85]">Status<select className={inputClass} onChange={(event) => setEditorDraft((current) => ({ ...current, status: event.target.value as HeaderNavItem["status"] }))} value={editorDraft.status}><option value="active">Active</option><option value="draft">Draft</option><option value="hidden">Hidden</option></select></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7e8b85] sm:col-span-2">Destination link<input className={inputClass} onChange={(event) => setEditorDraft((current) => ({ ...current, link: event.target.value }))} placeholder="/category/skincare" value={editorDraft.link}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7e8b85] sm:col-span-2">Navigation type<select className={inputClass} onChange={(event) => setEditorDraft((current) => ({ ...current, kind: event.target.value as HeaderNavItem["kind"] }))} value={editorDraft.kind}><option value="direct">Direct link</option><option value="collection">Collection</option><option value="mega">Mega menu</option></select></label>{editorDraft.kind === "mega" ? <label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7e8b85] sm:col-span-2">Mega-menu destinations<textarea className={`${inputClass} min-h-28 py-3`} onChange={(event) => setEditorDraft((current) => ({ ...current, children: event.target.value }))} placeholder={"Cleansers | /category/cleansers\nSerums | /category/serums"} value={editorDraft.children}/><span className="mt-1.5 block text-[7.5px] font-medium normal-case tracking-normal text-[#929d97]">One destination per line: Label | /internal-link</span></label> : null}</div><div className="flex flex-col-reverse gap-2 border-t border-[#e8ecea] bg-[#fafbfa] p-5 sm:flex-row sm:justify-between"><div>{editorMode === "Edit" ? <button className="h-10 rounded-xl border border-rose-200 bg-white px-4 text-[9px] font-bold text-rose-700" onClick={removeSelectedItem} type="button">Remove item</button> : null}</div><div className="flex gap-2"><button className="h-10 rounded-xl border border-[#dce4e0] bg-white px-4 text-[9px] font-bold" onClick={() => setEditorOpen(false)} type="button">Cancel</button><button className="h-10 rounded-xl bg-[#426d72] px-4 text-[9px] font-bold text-white" onClick={saveMenuItem} type="button">Save menu draft</button></div></div></div></div> : null}

    {previewOpen ? <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#17231f]/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setPreviewOpen(false); }}><div className="max-h-[92vh] w-full max-w-[1050px] overflow-y-auto rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.24)]"><div className="flex items-start justify-between border-b border-[#e8ecea] p-5"><div><p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#426d72]">Responsive draft preview</p><h2 className="mt-1.5 text-[18px] font-bold text-[#22312b]">Header & navigation</h2></div><div className="flex items-center gap-2"><div className="flex rounded-xl border p-1">{(["Desktop", "Mobile"] as PreviewDevice[]).map((device) => <button className={`rounded-lg px-3 py-2 text-[8px] font-bold ${previewDevice === device ? "bg-[#edf3f4] text-[#426d72]" : "text-[#84908a]"}`} key={device} onClick={() => setPreviewDevice(device)} type="button">{device}</button>)}</div><button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5f3]" onClick={() => setPreviewOpen(false)} type="button"><Icon name="close" size={14}/></button></div></div><div className="bg-[#f4f6f5] p-5 sm:p-8">{previewDevice === "Desktop" ? <div className="overflow-hidden rounded-2xl border bg-white shadow-lg">{config.announcement.enabled ? <div className="bg-[#426d72] px-4 py-2 text-center text-[8px] font-semibold text-white">{config.announcement.text}</div> : null}<div className="flex items-center gap-5 border-b px-6 py-4"><b className="text-[18px] text-[#31545c]">brandnbeauty</b>{config.settings.search ? <div className="flex h-9 max-w-[360px] flex-1 items-center gap-2 rounded-full border px-4 text-[8px] text-[#8c9792]"><Icon name="search" size={12}/>Search products, brands or concerns</div> : null}<div className="ml-auto flex gap-3">{config.settings.wishlist ? <Icon name="check" size={15}/> : null}{config.settings.account ? <Icon name="user" size={15}/> : null}{config.settings.cart ? <Icon name="bag" size={15}/> : null}</div></div><div className="flex flex-wrap justify-center gap-5 px-5 py-3">{config.items.filter((item) => item.status === "active").map((item) => <span className="text-[8.5px] font-bold text-[#5f6d66]" key={item.id}>{item.label}</span>)}</div><div className="h-52 bg-gradient-to-br from-[#eef3f1] to-white p-7"><span className="text-[8px] font-bold uppercase tracking-[.14em] text-[#80908a]">Storefront content</span><h3 className="mt-2 text-[24px] font-bold text-[#31545c]">Authentic Beauty You Can Trust</h3></div></div> : <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[30px] border-[8px] border-[#263b3c] bg-white">{config.announcement.enabled ? <div className="bg-[#426d72] px-3 py-2 text-center text-[7px] font-semibold text-white">{config.announcement.text}</div> : null}<div className="flex items-center justify-between border-b px-4 py-4"><Icon name="menu" size={16}/><b className="text-[13px] text-[#31545c]">brandnbeauty</b><div className="flex gap-3">{config.settings.search ? <Icon name="search" size={14}/> : null}{config.settings.cart ? <Icon name="bag" size={14}/> : null}</div></div><div className="divide-y px-3 py-2">{config.items.filter((item) => item.status === "active").map((item) => <div className="flex items-center justify-between px-2 py-3.5 text-[9px] font-bold text-[#53645d]" key={item.id}><span>{item.label}</span><Icon name="chevron" size={11}/></div>)}</div></div>}</div><div className="flex justify-end border-t p-5"><button className="h-10 rounded-xl bg-[#426d72] px-5 text-[9px] font-bold text-white" onClick={() => setPreviewOpen(false)} type="button">Close preview</button></div></div></div> : null}

    {publishOpen ? <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#17231f]/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setPublishOpen(false); }}><div className="w-full max-w-[580px] overflow-hidden rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.24)]"><div className="flex items-start justify-between border-b p-5"><div><p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#426d72]">Human approval required</p><h2 className="mt-1.5 text-[18px] font-bold text-[#22312b]">Publish header version {version + 1}</h2><p className="mt-1 text-[9px] text-[#84908a]">The current public version remains available in version history.</p></div><button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5f3]" onClick={() => setPublishOpen(false)} type="button"><Icon name="close" size={14}/></button></div><div className="space-y-4 p-5"><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#f5f8f6] p-3"><span className="text-[8px] font-bold text-[#7d8983]">Active menu items</span><b className="mt-1 block text-[15px] text-[#33443d]">{activeItems.length}</b></div><div className="rounded-xl bg-[#f5f8f6] p-3"><span className="text-[8px] font-bold text-[#7d8983]">Mega menus</span><b className="mt-1 block text-[15px] text-[#33443d]">{megaMenus}</b></div></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4"><input checked={publishConfirmed} className="mt-0.5 h-4 w-4 accent-[#426d72]" onChange={(event) => setPublishConfirmed(event.target.checked)} type="checkbox"/><span className="text-[8.5px] leading-4 text-[#596962]">I reviewed menu order, labels, internal destinations, mobile shortcuts and customer impact.</span></label></div><div className="flex justify-end gap-2 border-t bg-[#fafbfa] p-5"><button className="h-10 rounded-xl border bg-white px-4 text-[9px] font-bold" onClick={() => setPublishOpen(false)} type="button">Cancel</button><button className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#426d72] px-4 text-[9px] font-bold text-white disabled:opacity-40" disabled={!publishConfirmed || isSaving} onClick={() => void publishNow()} type="button"><Icon name="check" size={13}/>{isSaving ? "Publishing..." : "Publish navigation"}</button></div></div></div> : null}

    {notice ? <div className={`fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-[10px] font-bold text-white shadow-xl ${noticeError ? "bg-rose-600" : "bg-[#335e63]"}`}>{notice}</div> : null}
  </div>;
}
