"use client";

import { useCallback, useEffect, useState } from "react";
import { BackupArtifact, BackupRestoreState, createProtectedBackup, downloadProtectedBackup, loadBackupRestore, requestMaintenanceRestore, runRestoreDrill, verifyProtectedBackup } from "./backup-restore-client";

type Tab = "Backups" | "Restore drills" | "Restore requests" | "Recovery policy" | "Safety";
const tabs: Tab[] = ["Backups", "Restore drills", "Restore requests", "Recovery policy", "Safety"];
const field = "mt-1.5 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[9px] text-[#405049] outline-none focus:border-[#9eb7b4]";
const area = "mt-1.5 min-h-24 w-full resize-none rounded-xl border border-[#dce4e0] bg-white p-3 text-[9px] text-[#405049] outline-none focus:border-[#9eb7b4]";
const dateTime = (value: string | null) => { if (!value) return "Never"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date); };
const bytes = (value: number) => value < 1024 ? `${value} B` : value < 1048576 ? `${(value / 1024).toFixed(1)} KB` : value < 1073741824 ? `${(value / 1048576).toFixed(1)} MB` : `${(value / 1073741824).toFixed(1)} GB`;

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    backup: <><path d="M4 7h16v13H4z"/><path d="M7 3h10v4H7zM8 12h8M8 16h5"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    download: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>,
    refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></>,
    shield: <><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></>,
    warning: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  };
  return <svg aria-hidden="true" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{paths[name] ?? paths.backup}</svg>;
}

function Status({ value }: { value: string }) {
  const tone = value === "verified" || value === "passed" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : value === "failed" ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-amber-50 text-amber-700 ring-amber-200";
  return <span className={`${tone} inline-flex rounded-full px-2 py-1 text-[7px] font-bold capitalize ring-1 ring-inset`}>{value.replaceAll("_", " ")}</span>;
}

function Kpi({ label, note, value, warning = false }: { label: string; note: string; value: string | number; warning?: boolean }) {
  return <article className="rounded-2xl border border-[#dfe6e2] bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#84908a]">{label}</p><b className="mt-4 block text-[22px] tracking-tight text-[#17231f]">{value}</b></div><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${warning ? "bg-amber-50 text-amber-700" : "bg-[#edf3f4] text-[#3b646d]"}`}><Icon name={warning ? "warning" : "backup"}/></span></div><p className="mt-4 border-t pt-3 text-[7px] leading-4 text-[#87928d]">{note}</p></article>;
}

function Modal({ children, onClose, subtitle, title }: { children: React.ReactNode; onClose: () => void; subtitle: string; title: string }) {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#17231f]/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section aria-modal="true" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl" role="dialog"><header className="flex items-start justify-between border-b p-5"><div><p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#3b646d]">{subtitle}</p><h2 className="mt-1 text-[17px] font-bold text-[#23322b]">{title}</h2></div><button aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5f3]" onClick={onClose}><Icon name="close"/></button></header>{children}</section></div>;
}

export function LiveBackupRestoreWorkspace({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [state, setState] = useState<BackupRestoreState | null>(null);
  const [tab, setTab] = useState<Tab>("Backups");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [selected, setSelected] = useState<BackupArtifact | null>(null);
  const [backupReason, setBackupReason] = useState("");
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [restoreReason, setRestoreReason] = useState("");
  const [maintenanceWindow, setMaintenanceWindow] = useState("");
  const [restoreConfirmed, setRestoreConfirmed] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => { try { setState(await loadBackupRestore()); setMessage(""); } catch (error) { if (!signal?.aborted) setMessage(error instanceof Error ? error.message : "Backup & Restore is unavailable."); } }, []);
  useEffect(() => {
    const controller = new AbortController();
    void loadBackupRestore().then((result) => { if (!controller.signal.aborted) { setState(result); setMessage(""); } }).catch((error: unknown) => { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Backup & Restore is unavailable."); });
    return () => controller.abort();
  }, []);
  async function act(action: () => Promise<{ message: string; state: BackupRestoreState }>) {
    setBusy(true); setMessage("");
    try { const result = await action(); setState(result.state); setMessage(result.message); return true; }
    catch (error) { setMessage(error instanceof Error ? error.message : "The protected action failed."); return false; }
    finally { setBusy(false); }
  }

  async function createBackup() {
    if (await act(() => createProtectedBackup(backupReason))) {
      setBackupOpen(false); setBackupReason(""); setBackupConfirmed(false);
    }
  }

  async function download(item: BackupArtifact) {
    setBusy(true); setMessage("");
    try { await downloadProtectedBackup(item); setMessage("Verified private backup downloaded."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Download failed."); }
    finally { setBusy(false); }
  }

  async function requestRestore() {
    if (!selected) return;
    if (await act(() => requestMaintenanceRestore(selected.backupKey, maintenanceWindow, restoreReason))) {
      setRestoreOpen(false); setRestoreReason(""); setMaintenanceWindow(""); setRestoreConfirmed(false);
    }
  }

  const summary = state?.summary;
  return <div className="space-y-5">
    <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#3b646d]">Recovery control plane</p></div><h1 className="mt-2 text-[28px] font-bold tracking-[-.035em] text-[#17231f] sm:text-[32px]">Backup & Restore command center</h1><p className="mt-1.5 max-w-3xl text-[11px] leading-5 text-[#66736d]">Create recoverable MySQL copies in private XAMPP storage, verify every byte and rehearse restoration without silently replacing the live database.</p></div><div className="flex flex-wrap gap-2"><button className="flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-[8px] font-bold text-[#596962]" disabled={busy} onClick={() => void load()}><Icon name="refresh"/>Refresh</button><button className="flex h-10 items-center gap-2 rounded-xl bg-[#3b646d] px-4 text-[8px] font-bold text-white disabled:opacity-50" disabled={busy} onClick={() => setBackupOpen(true)}><Icon name="backup"/>Create protected backup</button></div></section>

    {message && <div className={`rounded-xl border p-4 text-[8px] font-semibold ${message.toLowerCase().includes("failed") || message.toLowerCase().includes("unavailable") ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{message}</div>}

    <section className="flex flex-col gap-3 rounded-2xl border border-[#d8e4e1] bg-[#edf3f4] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#3b646d]"><Icon name="shield"/></span><div><b className="text-[9px] text-[#304d4d]">Private storage · MySQL connected</b><p className="mt-1 text-[7px] text-[#647b77]">Backup files stay outside public htdocs. Only checksum-verified files can be downloaded or selected for recovery.</p></div></div><span className="rounded-full bg-white px-3 py-2 text-[7px] font-bold text-[#3b646d]">{bytes(state?.storage.freeBytes ?? 0)} free</span></section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><Kpi label="Total backups" note="Real private artifacts" value={summary?.totalBackups ?? 0}/><Kpi label="Verified" note="Download eligible" value={summary?.verifiedBackups ?? 0}/><Kpi label="Failed" note="Blocked from recovery" value={summary?.failedBackups ?? 0} warning={Boolean(summary?.failedBackups)}/><Kpi label="Restore drills" note="No source mutation" value={summary?.restoreDrills ?? 0}/><Kpi label="Pending restore" note="Maintenance review" value={summary?.pendingRestoreRequests ?? 0} warning={Boolean(summary?.pendingRestoreRequests)}/><Kpi label="Recovery point" note="Latest verified copy" value={summary?.latestVerifiedAt ? "Ready" : "None"}/></section>

    <section className="overflow-hidden rounded-2xl border border-[#dfe6e2] bg-white"><header className="flex flex-col gap-3 border-b p-4 xl:flex-row xl:items-center xl:justify-between"><div className="flex flex-wrap gap-1">{tabs.map((item) => <button className={`h-10 rounded-xl px-4 text-[8px] font-bold ${tab === item ? "bg-[#3b646d] text-white" : "bg-[#f2f5f3] text-[#74817b]"}`} key={item} onClick={() => setTab(item)}>{item}{item === "Backups" ? ` ${state?.artifacts.length ?? 0}` : ""}</button>)}</div><span className="text-[7px] font-semibold text-[#87928d]">Generated {dateTime(state?.generatedAt ?? null)}</span></header>

      {tab === "Backups" && <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left"><thead className="bg-[#fafbfa] text-[6.5px] font-bold uppercase tracking-[.1em] text-[#8a9590]"><tr><th className="px-5 py-3">Backup</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Tables / rows</th><th className="px-4 py-3">Size</th><th className="px-4 py-3">Checksum</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right">Controls</th></tr></thead><tbody className="divide-y">{state?.artifacts.map((item) => <tr className="[content-visibility:auto] [contain-intrinsic-size:0_68px] text-[8px] text-[#596861]" key={item.id}><td className="px-5 py-4"><b className="block text-[#35443d]">{item.fileName}</b><span className="mt-1 block text-[6.5px] text-[#929d97]">{item.backupKey.slice(0,8)} · {item.storageFormat.replaceAll("_", " ")}</span></td><td className="px-4 py-4">{dateTime(item.createdAt)}</td><td className="px-4 py-4">{item.tableCount} / {item.rowCount.toLocaleString()}</td><td className="px-4 py-4">{bytes(item.sizeBytes)}</td><td className="px-4 py-4 font-mono text-[6.5px]">{item.sha256.slice(0,12)}…</td><td className="px-4 py-4"><Status value={item.status}/></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button className="h-8 rounded-lg border px-3 text-[7px] font-bold disabled:opacity-40" disabled={busy} onClick={() => void act(() => verifyProtectedBackup(item.backupKey))}>Verify</button><button className="h-8 rounded-lg border px-3 text-[7px] font-bold disabled:opacity-40" disabled={busy || !item.downloadReady} onClick={() => void download(item)}>Download</button><button className="h-8 rounded-lg bg-[#edf3f4] px-3 text-[7px] font-bold text-[#3b646d] disabled:opacity-40" disabled={busy || item.status !== "verified"} onClick={() => { setSelected(item); setRestoreOpen(true); }}>Restore plan</button></div></td></tr>)}{!state?.artifacts.length && <tr><td className="px-5 py-20 text-center text-[9px] text-[#87928d]" colSpan={7}>No real backup exists yet. Create the first protected copy—no sample artifact will be added.</td></tr>}</tbody></table></div>}

      {tab === "Restore drills" && <div className="divide-y">{state?.drills.map((item) => <div className="grid gap-3 p-5 text-[8px] sm:grid-cols-[1fr_160px_120px] sm:items-center" key={item.id}><div><b className="text-[#35443d]">{item.drillType.replaceAll("_", " ")} · {item.fileName}</b><p className="mt-1 text-[7px] leading-4 text-[#87928d]">{item.resultSummary}</p></div><span>{dateTime(item.createdAt)}</span><Status value={item.result}/></div>)}{!state?.drills.length && <p className="p-16 text-center text-[9px] text-[#87928d]">No integrity or restore-readiness drill has been recorded.</p>}</div>}

      {tab === "Restore requests" && <div className="divide-y">{state?.restoreRequests.map((item) => <div className="grid gap-3 p-5 text-[8px] lg:grid-cols-[1fr_220px_110px] lg:items-center" key={item.id}><div><b className="text-[#35443d]">{item.fileName}</b><p className="mt-1 text-[7px] leading-4 text-[#87928d]">{item.reason}</p></div><span><b className="block text-[6.5px] uppercase text-[#929d97]">Maintenance window</b>{item.maintenanceWindow}</span><Status value={item.status}/></div>)}{!state?.restoreRequests.length && <p className="p-16 text-center text-[9px] text-[#87928d]">No restore request exists. The live database has not been replaced.</p>}</div>}

      {tab === "Recovery policy" && <div className="grid gap-4 p-5 md:grid-cols-2"><Kpi label="Storage boundary" note="The browser receives metadata only; backup bytes remain in private XAMPP storage until authenticated download." value="Private"/><Kpi label="Download gate" note="A file becomes downloadable only after SHA-256, size, table manifest and completion marker checks pass." value="Verified only"/><Kpi label="Restore execution" note="The UI records a request and maintenance window; it cannot overwrite the live database." value="Maintenance only"/><Kpi label="Recovery cadence" note="Create a verified copy before deployments and at least daily while live orders are active." value="Daily + pre-change" warning/></div>}

      {tab === "Safety" && <div className="grid gap-4 p-5 md:grid-cols-2"><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><Icon name="shield"/><b className="mt-4 block text-[11px] text-emerald-900">What is protected</b><p className="mt-2 text-[8px] leading-5 text-emerald-800">Private filesystem permissions, checksum verification, no public backup URL, authenticated download and complete recovery-control audit evidence.</p></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><Icon name="warning"/><b className="mt-4 block text-[11px] text-amber-900">What is deliberately blocked</b><p className="mt-2 text-[8px] leading-5 text-amber-800">No browser-triggered SQL import, no silent overwrite, no unverified download and no claim that a restore succeeded without a controlled maintenance execution.</p></div></div>}
    </section>

    <section className="flex flex-col gap-3 rounded-2xl border border-[#d8e4e1] bg-[#edf3f4] p-5 sm:flex-row sm:items-center sm:justify-between"><div><b className="text-[10px] text-[#304d4d]">Recovery events are auditable</b><p className="mt-1 text-[7px] text-[#647b77]">Backup creation, verification, drills and restore requests are written to the control ledger.</p></div><button className="h-10 rounded-xl bg-white px-4 text-[8px] font-bold text-[#3b646d] ring-1 ring-[#cad9d5]" onClick={() => onNavigate("Audit Logs")}>Open Audit Logs</button></section>

    {backupOpen && <Modal onClose={() => setBackupOpen(false)} subtitle="Protected recovery point" title="Create database backup"><div className="space-y-4 p-5"><p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[8px] leading-4 text-emerald-800">Creates a consistent logical MySQL copy in private storage outside public htdocs. It does not change operational records.</p><label className="block text-[8px] font-bold">Backup reason<textarea className={area} placeholder="Example: Before Phase 46 deployment" value={backupReason} onChange={(event) => setBackupReason(event.target.value)}/></label><label className="flex gap-3 rounded-xl border p-4 text-[8px]"><input checked={backupConfirmed} onChange={(event) => setBackupConfirmed(event.target.checked)} type="checkbox"/><span>I understand the backup may contain protected business data and must remain private.</span></label></div><footer className="flex justify-end gap-2 border-t p-4"><button className="h-10 rounded-xl border px-4 text-[8px] font-bold" onClick={() => setBackupOpen(false)}>Cancel</button><button className="h-10 rounded-xl bg-[#3b646d] px-4 text-[8px] font-bold text-white disabled:opacity-40" disabled={busy || !backupConfirmed || backupReason.trim().length < 8} onClick={() => void createBackup()}>Create backup</button></footer></Modal>}

    {restoreOpen && selected && <Modal onClose={() => setRestoreOpen(false)} subtitle="Human-controlled recovery" title={`Plan restore · ${selected.fileName}`}><div className="space-y-4 p-5"><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[8px] leading-4 text-amber-800"><b>No automatic restore:</b> this records a maintenance request only. Run the restore-readiness drill first; the live database remains unchanged.</div><button className="h-10 w-full rounded-xl border border-[#bfd0cc] bg-[#edf3f4] text-[8px] font-bold text-[#3b646d] disabled:opacity-40" disabled={busy} onClick={() => void act(() => runRestoreDrill(selected.backupKey))}>Run restore-readiness drill</button><label className="block text-[8px] font-bold">Maintenance window<input className={field} placeholder="Example: Friday 2:00 AM–2:30 AM" value={maintenanceWindow} onChange={(event) => setMaintenanceWindow(event.target.value)}/></label><label className="block text-[8px] font-bold">Business reason<textarea className={area} value={restoreReason} onChange={(event) => setRestoreReason(event.target.value)}/></label><label className="flex gap-3 rounded-xl border p-4 text-[8px]"><input checked={restoreConfirmed} onChange={(event) => setRestoreConfirmed(event.target.checked)} type="checkbox"/><span>I confirm this is a request for authorized maintenance review, not permission for silent browser execution.</span></label></div><footer className="flex justify-end gap-2 border-t p-4"><button className="h-10 rounded-xl border px-4 text-[8px] font-bold" onClick={() => setRestoreOpen(false)}>Cancel</button><button className="h-10 rounded-xl bg-[#3b646d] px-4 text-[8px] font-bold text-white disabled:opacity-40" disabled={busy || !restoreConfirmed || restoreReason.trim().length < 8 || maintenanceWindow.trim().length < 4} onClick={() => void requestRestore()}>Record restore request</button></footer></Modal>}
  </div>;
}
