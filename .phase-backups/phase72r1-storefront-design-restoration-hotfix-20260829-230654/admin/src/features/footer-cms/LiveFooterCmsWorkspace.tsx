"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  defaultFooterCmsConfig,
  fetchFooterCmsState,
  publishFooterCms,
  restoreFooterCmsDraft,
  saveFooterCmsDraft,
  type FooterCmsConfig,
  type FooterCmsVersion,
  type FooterColumn,
  type FooterLink,
} from "@/features/footer-cms/footer-cms-client";

type FooterTab = "Brand & contact" | "Footer structure" | "Trust & display" | "Version history";
type PreviewDevice = "Desktop" | "Mobile";
type IconName = "alert" | "check" | "chevron" | "close" | "content" | "edit" | "eye" | "history" | "link" | "mail" | "phone" | "plus" | "refresh" | "save" | "settings" | "store" | "trash";

const iconPaths: Record<IconName, ReactNode> = {
  alert: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  content: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
  edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>,
  link: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
  phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 2 2.3Z"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></>,
  save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19 15a2 2 0 0 0 .4 2l-2.8 2.8a2 2 0 0 0-2-.4A2 2 0 0 0 13 21h-4a2 2 0 0 0-1.6-1.6 2 2 0 0 0-2 .4L2.6 17a2 2 0 0 0 .4-2A2 2 0 0 0 1 13V9a2 2 0 0 0 2-1 2 2 0 0 0-.4-2l2.8-2.8a2 2 0 0 0 2 .4A2 2 0 0 0 9 2h4a2 2 0 0 0 1.6 1.6 2 2 0 0 0 2-.4L19.4 6a2 2 0 0 0-.4 2 2 2 0 0 0 2 1v4a2 2 0 0 0-2 2Z"/></>,
  store: <><path d="M3 9 5 3h14l2 6"/><path d="M5 13v8h14v-8M9 21v-6h6v6"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/></>,
  trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6"/><path d="M10 11v5M14 11v5"/></>,
};

function Icon({ className = "", name, size = 16 }: { className?: string; name: IconName; size?: number }) {
  return <svg aria-hidden="true" className={className} fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{iconPaths[name]}</svg>;
}

function dateText(value: string | null) {
  if (!value) return "Not published yet";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not published yet";
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

function statusTone(status: FooterColumn["status"]) {
  if (status === "active") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "draft") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return <button aria-label={`Toggle ${label}`} className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-[#426d72]" : "bg-[#d8dfdc]"}`} onClick={onChange} type="button"><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${checked ? "left-6" : "left-1"}`}/></button>;
}

function Kpi({ helper, icon, label, value }: { helper: string; icon: IconName; label: string; value: string }) {
  return <article className="rounded-2xl border border-[#e2e8e5] bg-white p-4 shadow-[0_1px_2px_rgba(25,50,45,.03)]"><div className="flex items-start justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[.08em] text-[#74817b]">{label}</p><p className="mt-2 text-[23px] font-bold tracking-[-.035em] text-[#17231f]">{value}</p></div><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#edf3f4] text-[#3b646d]"><Icon name={icon} size={14}/></span></div><p className="mt-3 border-t border-[#eff2f0] pt-2.5 text-[8.5px] font-semibold text-[#77847e]">{helper}</p></article>;
}

const inputClass = "mt-1.5 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[9.5px] font-semibold normal-case tracking-normal text-[#42524b] outline-none focus:border-[#759493]";

export function LiveFooterCmsWorkspace() {
  const [config, setConfig] = useState<FooterCmsConfig>(defaultFooterCmsConfig);
  const [liveConfig, setLiveConfig] = useState<FooterCmsConfig>(defaultFooterCmsConfig);
  const [versions, setVersions] = useState<FooterCmsVersion[]>([]);
  const [version, setVersion] = useState(1);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [tab, setTab] = useState<FooterTab>("Footer structure");
  const [selectedColumnId, setSelectedColumnId] = useState("");
  const [columnEditorOpen, setColumnEditorOpen] = useState(false);
  const [columnEditorMode, setColumnEditorMode] = useState<"Create" | "Edit">("Edit");
  const [columnDraft, setColumnDraft] = useState({ status: "draft" as FooterColumn["status"], title: "" });
  const [linkEditorOpen, setLinkEditorOpen] = useState(false);
  const [linkEditorMode, setLinkEditorMode] = useState<"Create" | "Edit">("Edit");
  const [editingLinkId, setEditingLinkId] = useState("");
  const [linkDraft, setLinkDraft] = useState({ label: "", status: "draft" as FooterLink["status"], url: "/" });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("Desktop");
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishConfirmed, setPublishConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);

  const selectedColumn = config.columns.find((column) => column.id === selectedColumnId) || config.columns[0];
  const totalLinks = config.columns.reduce((total, column) => total + column.links.length, 0);
  const activeLinks = config.columns.reduce((total, column) => total + column.links.filter((link) => link.status === "active").length, 0);
  const activeTrust = config.trustItems.filter((item) => item.active).length;
  const draftDifferentFromLive = useMemo(() => JSON.stringify(config) !== JSON.stringify(liveConfig), [config, liveConfig]);
  const validationBlockers = useMemo(() => {
    const blockers: string[] = [];
    const columnTitles = new Set<string>();
    config.columns.forEach((column) => {
      const title = column.title.trim().toLowerCase();
      if (!title) blockers.push("A footer column is missing its title.");
      if (columnTitles.has(title)) blockers.push(`${column.title}: duplicate column title.`);
      columnTitles.add(title);
      const linkLabels = new Set<string>();
      column.links.forEach((link) => {
        const label = link.label.trim().toLowerCase();
        if (!label || !link.url.startsWith("/")) blockers.push(`${column.title}: a link label or internal path is invalid.`);
        if (linkLabels.has(label)) blockers.push(`${column.title}: duplicate link label ${link.label}.`);
        linkLabels.add(label);
      });
      if (column.status === "active" && !column.links.some((link) => link.status === "active")) blockers.push(`${column.title}: active column needs at least one active link.`);
    });
    if (!config.columns.some((column) => column.status === "active")) blockers.push("At least one active footer column is required.");
    if (config.settings.contactBlock && (!config.brand.phone.trim() || !config.brand.email.includes("@") || !config.brand.address.trim())) blockers.push("Visible contact block needs phone, valid email and address.");
    if (config.settings.trustStrip && activeTrust < 2) blockers.push("Visible trust strip needs at least two active messages.");
    if (!config.settings.copyright.trim()) blockers.push("Copyright line is required.");
    return [...new Set(blockers)];
  }, [activeTrust, config]);

  const showNotice = useCallback((message: string, error = false) => {
    setNotice(message);
    setNoticeError(error);
    window.setTimeout(() => setNotice(""), 3400);
  }, []);

  const loadFooter = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError("");
    try {
      const state = await fetchFooterCmsState(signal);
      setConfig(state.draft);
      setLiveConfig(state.live);
      setVersions(state.versions);
      setVersion(state.version);
      setPublishedAt(state.publishedAt);
      setSelectedColumnId((current) => state.draft.columns.some((column) => column.id === current) ? current : state.draft.columns[0]?.id || "");
      setIsDirty(false);
    } catch (error) {
      if (!signal?.aborted) setLoadError(error instanceof Error ? error.message : "Footer CMS could not be loaded.");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadFooter(controller.signal), 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [loadFooter]);

  function changeConfig(updater: (current: FooterCmsConfig) => FooterCmsConfig) {
    setConfig(updater);
    setIsDirty(true);
  }

  function moveColumn(id: string, direction: -1 | 1) {
    changeConfig((current) => {
      const columns = [...current.columns];
      const index = columns.findIndex((column) => column.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= columns.length) return current;
      [columns[index], columns[target]] = [columns[target], columns[index]];
      return { ...current, columns: columns.map((column, position) => ({ ...column, sortOrder: position + 1 })) };
    });
  }

  function toggleColumn(id: string) {
    changeConfig((current) => ({ ...current, columns: current.columns.map((column) => column.id === id ? { ...column, status: column.status === "hidden" ? "draft" : "hidden" } : column) }));
  }

  function openColumnEditor(mode: "Create" | "Edit") {
    setColumnEditorMode(mode);
    setColumnDraft(mode === "Edit" && selectedColumn ? { status: selectedColumn.status, title: selectedColumn.title } : { status: "draft", title: "" });
    setColumnEditorOpen(true);
  }

  function saveColumn() {
    const title = columnDraft.title.trim();
    if (!title) { showNotice("Column title is required.", true); return; }
    const duplicate = config.columns.some((column) => column.title.toLowerCase() === title.toLowerCase() && (columnEditorMode === "Create" || column.id !== selectedColumn?.id));
    if (duplicate) { showNotice("A footer column already uses this title.", true); return; }
    const id = columnEditorMode === "Edit" && selectedColumn ? selectedColumn.id : `FTR-${Date.now()}`;
    changeConfig((current) => ({
      ...current,
      columns: columnEditorMode === "Edit" && selectedColumn
        ? current.columns.map((column) => column.id === selectedColumn.id ? { ...column, status: columnDraft.status, title } : column)
        : [...current.columns, { id, links: [], sortOrder: current.columns.length + 1, status: columnDraft.status, title }],
    }));
    setSelectedColumnId(id);
    setColumnEditorOpen(false);
    showNotice(`Footer column ${columnEditorMode === "Create" ? "added" : "updated"} in the draft.`);
  }

  function removeColumn() {
    if (!selectedColumn || !window.confirm(`Remove ${selectedColumn.title} and its links from the draft?`)) return;
    const remaining = config.columns.filter((column) => column.id !== selectedColumn.id);
    changeConfig((current) => ({ ...current, columns: remaining.map((column, index) => ({ ...column, sortOrder: index + 1 })) }));
    setSelectedColumnId(remaining[0]?.id || "");
    setColumnEditorOpen(false);
    showNotice("Footer column removed from the draft.");
  }

  function openLinkEditor(mode: "Create" | "Edit", link?: FooterLink) {
    setLinkEditorMode(mode);
    setEditingLinkId(link?.id || "");
    setLinkDraft(mode === "Edit" && link ? { label: link.label, status: link.status, url: link.url } : { label: "", status: "draft", url: "/" });
    setLinkEditorOpen(true);
  }

  function saveLink() {
    if (!selectedColumn) return;
    const label = linkDraft.label.trim();
    const url = linkDraft.url.trim();
    if (!label || !url.startsWith("/")) { showNotice("Link label and an internal path beginning with / are required.", true); return; }
    const duplicate = selectedColumn.links.some((link) => link.label.toLowerCase() === label.toLowerCase() && (linkEditorMode === "Create" || link.id !== editingLinkId));
    if (duplicate) { showNotice("This column already has a link with that label.", true); return; }
    changeConfig((current) => ({ ...current, columns: current.columns.map((column) => {
      if (column.id !== selectedColumn.id) return column;
      const nextLink: FooterLink = { id: linkEditorMode === "Edit" ? editingLinkId : `${column.id}-L-${Date.now()}`, label, sortOrder: linkEditorMode === "Edit" ? column.links.find((link) => link.id === editingLinkId)?.sortOrder || 1 : column.links.length + 1, status: linkDraft.status, url };
      return { ...column, links: linkEditorMode === "Edit" ? column.links.map((link) => link.id === editingLinkId ? nextLink : link) : [...column.links, nextLink] };
    }) }));
    setLinkEditorOpen(false);
    showNotice(`Footer link ${linkEditorMode === "Create" ? "added" : "updated"} in the draft.`);
  }

  function removeLink(link: FooterLink) {
    if (!selectedColumn || !window.confirm(`Remove ${link.label} from ${selectedColumn.title}?`)) return;
    changeConfig((current) => ({ ...current, columns: current.columns.map((column) => column.id === selectedColumn.id ? { ...column, links: column.links.filter((entry) => entry.id !== link.id).map((entry, index) => ({ ...entry, sortOrder: index + 1 })) } : column) }));
    showNotice("Footer link removed from the draft.");
  }

  function moveLink(id: string, direction: -1 | 1) {
    if (!selectedColumn) return;
    changeConfig((current) => ({ ...current, columns: current.columns.map((column) => {
      if (column.id !== selectedColumn.id) return column;
      const links = [...column.links];
      const index = links.findIndex((link) => link.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= links.length) return column;
      [links[index], links[target]] = [links[target], links[index]];
      return { ...column, links: links.map((link, position) => ({ ...link, sortOrder: position + 1 })) };
    }) }));
  }

  async function saveDraft() {
    setIsSaving(true);
    try {
      const state = await saveFooterCmsDraft(config);
      setConfig(state.draft); setLiveConfig(state.live); setVersions(state.versions); setVersion(state.version); setPublishedAt(state.publishedAt); setIsDirty(false);
      showNotice("Footer CMS draft saved in MySQL.");
    } catch (error) { showNotice(error instanceof Error ? error.message : "Draft could not be saved.", true); }
    finally { setIsSaving(false); }
  }

  async function publishNow() {
    if (!publishConfirmed || validationBlockers.length) return;
    setIsSaving(true);
    try {
      const state = await publishFooterCms(config);
      setConfig(state.draft); setLiveConfig(state.live); setVersions(state.versions); setVersion(state.version); setPublishedAt(state.publishedAt); setIsDirty(false); setPublishOpen(false); setPublishConfirmed(false);
      showNotice(`Footer version ${state.version} published successfully.`);
    } catch (error) { showNotice(error instanceof Error ? error.message : "Footer could not be published.", true); }
    finally { setIsSaving(false); }
  }

  async function restoreDraft(targetVersion: number) {
    if (!window.confirm(`Load footer version ${targetVersion} as a draft? The live footer will not change.`)) return;
    setIsSaving(true);
    try {
      const state = await restoreFooterCmsDraft(targetVersion);
      setConfig(state.draft); setLiveConfig(state.live); setVersions(state.versions); setVersion(state.version); setPublishedAt(state.publishedAt); setIsDirty(true); setTab("Footer structure");
      showNotice(`Version ${targetVersion} loaded as a draft.`);
    } catch (error) { showNotice(error instanceof Error ? error.message : "Version could not be restored.", true); }
    finally { setIsSaving(false); }
  }

  const settingRows: Array<{ helper: string; key: Exclude<keyof FooterCmsConfig["settings"], "copyright">; label: string }> = [
    { helper: "Email capture block above the main footer.", key: "newsletter", label: "Newsletter signup" },
    { helper: "Phone, email and address from Brand & contact.", key: "contactBlock", label: "Contact block" },
    { helper: "Facebook, Instagram and other social destinations.", key: "socialLinks", label: "Social links" },
    { helper: "Authenticity and customer-care messages.", key: "trustStrip", label: "Trust strip" },
    { helper: "Show supported payment and COD badges.", key: "paymentBadges", label: "Payment badges" },
  ];

  return <div className="space-y-5">
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[.16em] text-[#3b646d]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>Storefront foundation</div><h1 className="mt-2 text-[28px] font-bold tracking-[-.035em] text-[#17231f] sm:text-[32px]">Footer command center</h1><p className="mt-1.5 max-w-2xl text-[12.5px] leading-5 text-[#66736d]">Manage customer help, discovery, trust and legal destinations with recoverable publication.</p></div><div className="flex flex-wrap gap-2"><button className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dce4e0] bg-white px-3.5 text-[9px] font-bold text-[#53645d]" disabled={isLoading || isSaving} onClick={() => void loadFooter()} type="button"><Icon name="refresh" size={13}/>Refresh</button><button className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dce4e0] bg-white px-3.5 text-[9px] font-bold text-[#53645d]" onClick={() => setPreviewOpen(true)} type="button"><Icon name="eye" size={13}/>Preview</button><button className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dce4e0] bg-white px-3.5 text-[9px] font-bold text-[#53645d] disabled:opacity-40" disabled={!isDirty || isSaving} onClick={() => void saveDraft()} type="button"><Icon name="save" size={13}/>{isSaving ? "Saving..." : "Save draft"}</button><button className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#3b646d] px-4 text-[9px] font-bold text-white disabled:opacity-40" disabled={isLoading || isSaving} onClick={() => { setPublishConfirmed(false); setPublishOpen(true); }} type="button"><Icon name="check" size={13}/>Publish</button></div></section>

    {loadError ? <section className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[9px] font-semibold text-rose-700"><Icon name="alert" size={13}/><span className="flex-1">{loadError}</span><button className="font-bold underline" onClick={() => void loadFooter()} type="button">Try again</button></section> : null}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi helper={`${config.columns.filter((column) => column.status === "active").length} active customer groups`} icon="content" label="Footer columns" value={String(config.columns.length)}/><Kpi helper={`${activeLinks} currently customer-visible`} icon="link" label="Navigation links" value={String(totalLinks)}/><Kpi helper={`${activeTrust} active reassurance messages`} icon="check" label="Trust messages" value={String(config.trustItems.length)}/><Kpi helper={draftDifferentFromLive || isDirty ? "Unpublished changes present" : dateText(publishedAt)} icon="history" label="Live version" value={`v${version}`}/></section>

    <section className="overflow-hidden rounded-2xl border border-[#e1e7e4] bg-white shadow-[0_1px_2px_rgba(25,50,45,.03)]"><div className="flex overflow-x-auto border-b border-[#e8ecea] bg-[#fafbfa] px-2 sm:px-4">{(["Footer structure", "Brand & contact", "Trust & display", "Version history"] as FooterTab[]).map((item) => <button className={`relative min-w-fit px-4 py-4 text-[10px] font-bold ${tab === item ? "text-[#315a5f]" : "text-[#76827c]"}`} key={item} onClick={() => setTab(item)} type="button">{item}{tab === item ? <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#3b646d]"/> : null}</button>)}</div>

      {tab === "Footer structure" ? <div className="grid xl:grid-cols-[minmax(0,1fr)_410px]"><div className="min-w-0"><div className="flex flex-col gap-3 border-b border-[#edf0ee] p-4 sm:flex-row sm:items-center"><div><p className="text-[8px] font-bold uppercase tracking-[.13em] text-[#84908a]">Footer column order</p><p className="mt-1 text-[8px] text-[#7c8882]">Organize help, shopping, company and legal links.</p></div><button className="ml-auto inline-flex h-9 items-center gap-2 rounded-xl bg-[#3b646d] px-3.5 text-[8.5px] font-bold text-white" onClick={() => openColumnEditor("Create")} type="button"><Icon name="plus" size={12}/>Add column</button></div><div className="divide-y divide-[#edf0ee]">{config.columns.map((column, index) => <div className={`grid cursor-pointer gap-3 p-4 transition hover:bg-[#f9fbfa] sm:grid-cols-[42px_minmax(0,1fr)_100px_132px] sm:items-center ${selectedColumn?.id === column.id ? "bg-[#f7faf9]" : ""}`} key={column.id} onClick={() => setSelectedColumnId(column.id)}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3f4] text-[9px] font-bold text-[#3b646d]">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><b className="text-[10px] text-[#35443d]">{column.title}</b><span className={`rounded-full px-2 py-0.5 text-[7px] font-bold capitalize ring-1 ring-inset ${statusTone(column.status)}`}>{column.status}</span></div><p className="mt-1 text-[8px] text-[#909b95]">{column.links.length} links · {column.links.filter((link) => link.status === "active").length} active</p></div><span className="text-[8px] font-bold text-[#53645d]">{column.links.length} links</span><div className="flex items-center justify-end gap-1"><button aria-label={`Move ${column.title} up`} className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white disabled:opacity-30" disabled={index === 0} onClick={(event) => { event.stopPropagation(); moveColumn(column.id, -1); }} type="button"><Icon className="-rotate-90" name="chevron" size={10}/></button><button aria-label={`Move ${column.title} down`} className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white disabled:opacity-30" disabled={index === config.columns.length - 1} onClick={(event) => { event.stopPropagation(); moveColumn(column.id, 1); }} type="button"><Icon className="rotate-90" name="chevron" size={10}/></button><button aria-label={`${column.status === "hidden" ? "Show" : "Hide"} ${column.title}`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf3f4] text-[#426d72]" onClick={(event) => { event.stopPropagation(); toggleColumn(column.id); }} type="button"><Icon name="eye" size={11}/></button><button aria-label={`Edit ${column.title}`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf3f4] text-[#426d72]" onClick={(event) => { event.stopPropagation(); setSelectedColumnId(column.id); setColumnDraft({ status: column.status, title: column.title }); setColumnEditorMode("Edit"); setColumnEditorOpen(true); }} type="button"><Icon name="edit" size={11}/></button></div></div>)}</div></div><aside className="border-t border-[#e8ecea] bg-[#fbfcfb] p-5 xl:border-l xl:border-t-0">{selectedColumn ? <><div className="flex items-start justify-between"><div><p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#84908a]">Selected column</p><h2 className="mt-1.5 text-[16px] font-bold text-[#2b3933]">{selectedColumn.title}</h2></div><button className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#3b646d] px-3 text-[8px] font-bold text-white" onClick={() => openLinkEditor("Create")} type="button"><Icon name="plus" size={11}/>Add link</button></div><div className="mt-4 divide-y divide-[#edf0ee] overflow-hidden rounded-xl border border-[#e2e8e5] bg-white">{selectedColumn.links.map((link, index) => <div className="grid grid-cols-[minmax(0,1fr)_82px] gap-2 p-3" key={link.id}><button className="min-w-0 text-left" onClick={() => openLinkEditor("Edit", link)} type="button"><b className="block truncate text-[8.5px] text-[#43524b]">{link.label}</b><span className="mt-1 block truncate text-[7px] text-[#929d97]">{link.url}</span></button><span className="flex justify-end gap-1"><button aria-label={`Move ${link.label} up`} className="flex h-7 w-7 items-center justify-center rounded-lg border disabled:opacity-30" disabled={index === 0} onClick={() => moveLink(link.id, -1)} type="button"><Icon className="-rotate-90" name="chevron" size={9}/></button><button aria-label={`Move ${link.label} down`} className="flex h-7 w-7 items-center justify-center rounded-lg border disabled:opacity-30" disabled={index === selectedColumn.links.length - 1} onClick={() => moveLink(link.id, 1)} type="button"><Icon className="rotate-90" name="chevron" size={9}/></button><button aria-label={`Remove ${link.label}`} className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600" onClick={() => removeLink(link)} type="button"><Icon name="trash" size={9}/></button></span></div>)}{selectedColumn.links.length === 0 ? <div className="p-8 text-center text-[8px] text-[#929d97]">No links in this column yet.</div> : null}</div><div className="mt-4 rounded-xl bg-[#edf3f4] p-4 text-[8px] leading-4 text-[#526965]">Footer links use internal storefront paths beginning with / so broken external redirects cannot be published here.</div></> : <p className="text-[9px] text-[#84908a]">Add or select a footer column.</p>}</aside></div> : null}

      {tab === "Brand & contact" ? <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_390px]"><div className="grid gap-4 sm:grid-cols-2"><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#75827c] sm:col-span-2">Brand description<textarea className={`${inputClass} min-h-24 py-3`} maxLength={400} onChange={(event) => changeConfig((current) => ({ ...current, brand: { ...current.brand, description: event.target.value } }))} value={config.brand.description}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#75827c]">Support phone<input className={inputClass} onChange={(event) => changeConfig((current) => ({ ...current, brand: { ...current.brand, phone: event.target.value } }))} value={config.brand.phone}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#75827c]">Support email<input className={inputClass} onChange={(event) => changeConfig((current) => ({ ...current, brand: { ...current.brand, email: event.target.value } }))} type="email" value={config.brand.email}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#75827c] sm:col-span-2">Business address<input className={inputClass} onChange={(event) => changeConfig((current) => ({ ...current, brand: { ...current.brand, address: event.target.value } }))} value={config.brand.address}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#75827c]">Facebook URL<input className={inputClass} onChange={(event) => changeConfig((current) => ({ ...current, brand: { ...current.brand, facebook: event.target.value } }))} value={config.brand.facebook}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#75827c]">Instagram URL<input className={inputClass} onChange={(event) => changeConfig((current) => ({ ...current, brand: { ...current.brand, instagram: event.target.value } }))} value={config.brand.instagram}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#75827c]">WhatsApp URL<input className={inputClass} onChange={(event) => changeConfig((current) => ({ ...current, brand: { ...current.brand, whatsapp: event.target.value } }))} value={config.brand.whatsapp}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#75827c]">YouTube URL<input className={inputClass} onChange={(event) => changeConfig((current) => ({ ...current, brand: { ...current.brand, youtube: event.target.value } }))} value={config.brand.youtube}/></label></div><aside className="space-y-4"><div className="rounded-xl border border-[#e2e8e5] bg-white p-4"><p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#84908a]">Customer contact preview</p><p className="mt-3 text-[9px] leading-5 text-[#5f6d66]">{config.brand.description || "Add a short, trustworthy brand description."}</p><div className="mt-4 space-y-2 border-t pt-4 text-[8px] text-[#53645d]"><span className="flex items-center gap-2"><Icon name="phone" size={11}/>{config.brand.phone || "Phone not set"}</span><span className="flex items-center gap-2"><Icon name="mail" size={11}/>{config.brand.email || "Email not set"}</span><span className="flex items-center gap-2"><Icon name="store" size={11}/>{config.brand.address || "Address not set"}</span></div></div><div className="rounded-xl border border-[#d4e0dc] bg-[#edf3f4] p-4"><b className="text-[9px] text-[#365556]">Ownership boundary</b><p className="mt-1.5 text-[8px] leading-4 text-[#627871]">Footer CMS controls labels and destinations. Policy page content remains owned by its source pages.</p></div></aside></div> : null}

      {tab === "Trust & display" ? <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_390px]"><div><div className="flex items-end justify-between"><div><p className="text-[8px] font-bold uppercase tracking-[.13em] text-[#84908a]">Trust strip messages</p><h3 className="mt-1 text-[16px] font-bold text-[#2b3933]">Customer reassurance</h3></div><span className="text-[8px] font-bold text-[#426d72]">{activeTrust} active</span></div><div className="mt-4 space-y-3">{config.trustItems.map((item, index) => <div className="grid gap-3 rounded-xl border border-[#e2e8e5] p-3 sm:grid-cols-[42px_minmax(0,1fr)_minmax(0,1fr)_54px] sm:items-center" key={item.id}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf3f4] text-[9px] font-bold text-[#426d72]">{index + 1}</span><input aria-label={`Trust label ${index + 1}`} className="h-9 rounded-lg border px-3 text-[8.5px] font-semibold outline-none focus:border-[#759493]" onChange={(event) => changeConfig((current) => ({ ...current, trustItems: current.trustItems.map((entry) => entry.id === item.id ? { ...entry, label: event.target.value } : entry) }))} value={item.label}/><input aria-label={`Trust note ${index + 1}`} className="h-9 rounded-lg border px-3 text-[8.5px] outline-none focus:border-[#759493]" onChange={(event) => changeConfig((current) => ({ ...current, trustItems: current.trustItems.map((entry) => entry.id === item.id ? { ...entry, note: event.target.value } : entry) }))} value={item.note}/><Toggle checked={item.active} label={item.label} onChange={() => changeConfig((current) => ({ ...current, trustItems: current.trustItems.map((entry) => entry.id === item.id ? { ...entry, active: !entry.active } : entry) }))}/></div>)}</div></div><aside><div className="overflow-hidden rounded-xl border border-[#e2e8e5]"><div className="border-b bg-[#fafbfa] p-4"><p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#84908a]">Footer display controls</p></div><div className="divide-y divide-[#edf0ee]">{settingRows.map((row) => <div className="flex items-center gap-3 p-4" key={row.key}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf3f4] text-[#426d72]"><Icon name="settings" size={13}/></span><div className="min-w-0 flex-1"><b className="block text-[9px] text-[#405049]">{row.label}</b><span className="mt-1 block text-[7px] text-[#929d97]">{row.helper}</span></div><Toggle checked={Boolean(config.settings[row.key])} label={row.label} onChange={() => changeConfig((current) => ({ ...current, settings: { ...current.settings, [row.key]: !current.settings[row.key] } }))}/></div>)}</div></div><label className="mt-4 block text-[8px] font-bold uppercase tracking-[.1em] text-[#75827c]">Copyright line<input className={inputClass} maxLength={200} onChange={(event) => changeConfig((current) => ({ ...current, settings: { ...current.settings, copyright: event.target.value } }))} value={config.settings.copyright}/></label></aside></div> : null}

      {tab === "Version history" ? <div className="p-5"><div className="overflow-x-auto rounded-xl border border-[#e2e8e5]"><table className="w-full min-w-[720px] text-left"><thead className="bg-[#fafbfa] text-[8px] font-bold uppercase tracking-[.1em] text-[#8a9590]"><tr><th className="px-5 py-3.5">Version</th><th className="px-3 py-3.5">Published</th><th className="px-3 py-3.5">Actor</th><th className="px-3 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Action</th></tr></thead><tbody className="divide-y divide-[#edf0ee]">{versions.map((entry) => <tr className="text-[9px] text-[#596861]" key={entry.version}><td className="px-5 py-4 font-bold text-[#35443d]">v{entry.version}</td><td className="px-3 py-4">{dateText(entry.publishedAt)}</td><td className="px-3 py-4 font-semibold">{entry.publishedBy}</td><td className="px-3 py-4"><span className={entry.version === version ? "rounded-full bg-emerald-50 px-2.5 py-1 text-[7px] font-bold text-emerald-700" : "rounded-full bg-slate-100 px-2.5 py-1 text-[7px] font-bold text-slate-600"}>{entry.version === version ? "Current" : "Previous"}</span></td><td className="px-5 py-4 text-right"><button className="font-bold text-[#426d72] disabled:opacity-30" disabled={entry.version === version || isSaving} onClick={() => void restoreDraft(entry.version)} type="button">Load as draft</button></td></tr>)}</tbody></table></div><div className="mt-4 flex gap-3 rounded-xl bg-[#edf3f4] p-4 text-[8px] leading-4 text-[#526965]"><Icon className="mt-0.5 shrink-0" name="history" size={13}/><p>Loading a previous version changes only the draft. The live customer footer remains unchanged until a separate reviewed publish.</p></div></div> : null}
    </section>

    {columnEditorOpen ? <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#17231f]/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setColumnEditorOpen(false); }}><div className="w-full max-w-[560px] overflow-hidden rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.24)]"><div className="flex items-start justify-between border-b p-5"><div><p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#426d72]">{columnEditorMode} footer column</p><h2 className="mt-1.5 text-[18px] font-bold text-[#22312b]">{columnEditorMode === "Create" ? "Add customer link group" : `Edit ${selectedColumn?.title || "column"}`}</h2></div><button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5f3]" onClick={() => setColumnEditorOpen(false)} type="button"><Icon name="close" size={14}/></button></div><div className="grid gap-4 p-5 sm:grid-cols-2"><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#75827c] sm:col-span-2">Column title<input className={inputClass} onChange={(event) => setColumnDraft((current) => ({ ...current, title: event.target.value }))} value={columnDraft.title}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#75827c] sm:col-span-2">Status<select className={inputClass} onChange={(event) => setColumnDraft((current) => ({ ...current, status: event.target.value as FooterColumn["status"] }))} value={columnDraft.status}><option value="active">Active</option><option value="draft">Draft</option><option value="hidden">Hidden</option></select></label></div><div className="flex flex-col-reverse gap-2 border-t bg-[#fafbfa] p-5 sm:flex-row sm:justify-between"><div>{columnEditorMode === "Edit" ? <button className="h-10 rounded-xl border border-rose-200 bg-white px-4 text-[9px] font-bold text-rose-700" onClick={removeColumn} type="button">Remove column</button> : null}</div><div className="flex gap-2"><button className="h-10 rounded-xl border bg-white px-4 text-[9px] font-bold" onClick={() => setColumnEditorOpen(false)} type="button">Cancel</button><button className="h-10 rounded-xl bg-[#426d72] px-4 text-[9px] font-bold text-white" onClick={saveColumn} type="button">Save column draft</button></div></div></div></div> : null}

    {linkEditorOpen ? <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#17231f]/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setLinkEditorOpen(false); }}><div className="w-full max-w-[580px] overflow-hidden rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.24)]"><div className="flex items-start justify-between border-b p-5"><div><p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#426d72]">{linkEditorMode} footer link</p><h2 className="mt-1.5 text-[18px] font-bold text-[#22312b]">{selectedColumn?.title}</h2></div><button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5f3]" onClick={() => setLinkEditorOpen(false)} type="button"><Icon name="close" size={14}/></button></div><div className="grid gap-4 p-5 sm:grid-cols-2"><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#75827c]">Link label<input className={inputClass} onChange={(event) => setLinkDraft((current) => ({ ...current, label: event.target.value }))} value={linkDraft.label}/></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#75827c]">Status<select className={inputClass} onChange={(event) => setLinkDraft((current) => ({ ...current, status: event.target.value as FooterLink["status"] }))} value={linkDraft.status}><option value="active">Active</option><option value="draft">Draft</option><option value="hidden">Hidden</option></select></label><label className="text-[8px] font-bold uppercase tracking-[.1em] text-[#75827c] sm:col-span-2">Internal destination<input className={inputClass} onChange={(event) => setLinkDraft((current) => ({ ...current, url: event.target.value }))} placeholder="/pages/contact-us" value={linkDraft.url}/><span className="mt-1.5 block text-[7px] font-medium normal-case tracking-normal text-[#929d97]">Use a storefront path beginning with /</span></label></div><div className="flex justify-end gap-2 border-t bg-[#fafbfa] p-5"><button className="h-10 rounded-xl border bg-white px-4 text-[9px] font-bold" onClick={() => setLinkEditorOpen(false)} type="button">Cancel</button><button className="h-10 rounded-xl bg-[#426d72] px-4 text-[9px] font-bold text-white" onClick={saveLink} type="button">Save link draft</button></div></div></div> : null}

    {previewOpen ? <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#17231f]/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setPreviewOpen(false); }}><div className="max-h-[92vh] w-full max-w-[1080px] overflow-y-auto rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.24)]"><div className="flex items-start justify-between border-b p-5"><div><p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#426d72]">Responsive draft preview</p><h2 className="mt-1.5 text-[18px] font-bold text-[#22312b]">Storefront footer</h2></div><div className="flex items-center gap-2"><div className="flex rounded-xl border p-1">{(["Desktop", "Mobile"] as PreviewDevice[]).map((device) => <button className={`rounded-lg px-3 py-2 text-[8px] font-bold ${previewDevice === device ? "bg-[#edf3f4] text-[#426d72]" : "text-[#84908a]"}`} key={device} onClick={() => setPreviewDevice(device)} type="button">{device}</button>)}</div><button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5f3]" onClick={() => setPreviewOpen(false)} type="button"><Icon name="close" size={14}/></button></div></div><div className="bg-[#f4f6f5] p-5 sm:p-8"><div className={`mx-auto overflow-hidden rounded-2xl border bg-[#315b60] text-white shadow-xl ${previewDevice === "Mobile" ? "max-w-[360px]" : "max-w-[980px]"}`}>{config.settings.newsletter ? <div className={`border-b border-white/15 p-5 ${previewDevice === "Desktop" ? "flex items-center justify-between" : "space-y-3"}`}><div><b className="text-[12px]">Beauty guidance and thoughtful offers</b><p className="mt-1 text-[7.5px] text-white/65">Useful updates, no clutter.</p></div><div className="flex h-9 min-w-[260px] items-center justify-between rounded-full bg-white px-4 text-[7px] text-slate-500">Your email address <span className="font-bold text-[#315b60]">Subscribe</span></div></div> : null}{config.settings.trustStrip ? <div className={`grid gap-3 border-b border-white/15 bg-white/5 p-4 ${previewDevice === "Desktop" ? "grid-cols-4" : "grid-cols-2"}`}>{config.trustItems.filter((item) => item.active).map((item) => <div key={item.id}><b className="block text-[8px]">{item.label}</b><span className="mt-1 block text-[6.5px] text-white/60">{item.note}</span></div>)}</div> : null}<div className={`grid gap-6 p-6 ${previewDevice === "Desktop" ? "grid-cols-[1.2fr_repeat(4,1fr)]" : "grid-cols-2"}`}><div className={previewDevice === "Mobile" ? "col-span-2" : ""}><b className="text-[15px]">brandnbeauty</b><p className="mt-3 text-[7px] leading-4 text-white/65">{config.brand.description}</p>{config.settings.contactBlock ? <div className="mt-3 space-y-1 text-[7px] text-white/75"><p>{config.brand.phone}</p><p>{config.brand.email}</p><p>{config.brand.address}</p></div> : null}</div>{config.columns.filter((column) => column.status === "active").map((column) => <div key={column.id}><b className="text-[8px]">{column.title}</b><div className="mt-3 space-y-2">{column.links.filter((link) => link.status === "active").map((link) => <p className="text-[7px] text-white/65" key={link.id}>{link.label}</p>)}</div></div>)}</div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/15 px-6 py-4 text-[6.5px] text-white/55"><span>{config.settings.copyright}</span><span>{config.settings.paymentBadges ? "COD · bKash planned · Secure checkout" : ""}</span></div></div></div><div className="flex justify-end border-t p-5"><button className="h-10 rounded-xl bg-[#426d72] px-5 text-[9px] font-bold text-white" onClick={() => setPreviewOpen(false)} type="button">Close preview</button></div></div></div> : null}

    {publishOpen ? <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#17231f]/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setPublishOpen(false); }}><div className="max-h-[92vh] w-full max-w-[620px] overflow-y-auto rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.24)]"><div className="flex items-start justify-between border-b p-5"><div><div className="flex items-center gap-2"><p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#426d72]">Human approval required</p><span className={`rounded-full px-2 py-0.5 text-[7px] font-bold ${validationBlockers.length ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{validationBlockers.length ? `${validationBlockers.length} blocker` : "Validation passed"}</span></div><h2 className="mt-1.5 text-[18px] font-bold text-[#22312b]">Publish footer version {version + 1}</h2><p className="mt-1 text-[9px] text-[#84908a]">Current public version stays available in history.</p></div><button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5f3]" onClick={() => setPublishOpen(false)} type="button"><Icon name="close" size={14}/></button></div><div className="space-y-4 p-5">{validationBlockers.length ? <div className="rounded-xl border border-rose-100 bg-rose-50 p-4"><b className="text-[9px] text-rose-800">Publication blocked</b><ul className="mt-2 space-y-1 text-[8px] leading-4 text-rose-700">{validationBlockers.map((blocker) => <li key={blocker}>• {blocker}</li>)}</ul></div> : <div className="grid grid-cols-3 gap-3">{[["Active columns", config.columns.filter((column) => column.status === "active").length], ["Active links", activeLinks], ["Trust items", activeTrust]].map(([label, value]) => <div className="rounded-xl bg-[#f5f8f6] p-3" key={String(label)}><span className="text-[7px] font-bold text-[#7d8983]">{label}</span><b className="mt-1 block text-[15px] text-[#33443d]">{value}</b></div>)}</div>}<label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4"><input checked={publishConfirmed} className="mt-0.5 h-4 w-4 accent-[#426d72]" onChange={(event) => setPublishConfirmed(event.target.checked)} type="checkbox"/><span className="text-[8.5px] leading-4 text-[#596962]">I reviewed footer order, active links, contact details, trust messages, responsive preview and customer impact.</span></label></div><div className="flex justify-end gap-2 border-t bg-[#fafbfa] p-5"><button className="h-10 rounded-xl border bg-white px-4 text-[9px] font-bold" onClick={() => setPublishOpen(false)} type="button">Cancel</button><button className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#426d72] px-4 text-[9px] font-bold text-white disabled:opacity-40" disabled={!publishConfirmed || Boolean(validationBlockers.length) || isSaving} onClick={() => void publishNow()} type="button"><Icon name="check" size={13}/>{isSaving ? "Publishing..." : "Publish footer"}</button></div></div></div> : null}

    {notice ? <div className={`fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-[10px] font-bold text-white shadow-xl ${noticeError ? "bg-rose-600" : "bg-[#335e63]"}`}>{notice}</div> : null}
  </div>;
}
