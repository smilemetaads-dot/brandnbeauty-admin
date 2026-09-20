"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

import {
  createLiveSupplier,
  fetchLiveSuppliers,
  updateLiveSupplier,
  type LiveSupplier,
  type SupplierInput,
} from "@/features/suppliers/live-suppliers-client";

type SupplierFilter = "Active" | "All" | "Follow-up" | "Inactive";
type IconName = "alert" | "box" | "check" | "close" | "copy" | "download" | "edit" | "eye" | "finance" | "phone" | "plus" | "refresh" | "search" | "supplier";

const emptyForm: SupplierInput = { address: "", contactPerson: "", email: "", name: "", notes: "", paymentTerms: "Cash", phone: "", status: "active", supplierType: "Distributor" };

const iconPaths: Record<IconName, ReactNode> = {
  alert: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  box: <><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4"/></>,
  download: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>,
  edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  finance: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3 5.2 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L9 10.9a16 16 0 0 0 4.1 4.1l1.2-1.2a2 2 0 0 1 2.1-.5 13 13 0 0 0 2.9.7A2 2 0 0 1 22 16.9Z"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  supplier: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5M16 4v5M8 14h3M8 17h6"/></>,
};

function Icon({ className = "", name, size = 16 }: { className?: string; name: IconName; size?: number }) {
  return <svg aria-hidden="true" className={className} fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{iconPaths[name]}</svg>;
}

function money(value: number) {
  return `৳${Number(value || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}

function dateText(value: string | null, withTime = false) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-BD", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
}

function labelText(value: string) {
  return value.replaceAll("_", " ").split(" ").filter(Boolean).map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`).join(" ");
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "BN";
}

function supplierHealth(supplier: LiveSupplier) {
  if (supplier.status === "inactive") return { label: "Inactive", tone: "bg-slate-100 text-slate-600" };
  if (supplier.pendingPurchaseCount > 0) return { label: "Follow-up", tone: "bg-amber-50 text-amber-700" };
  if (supplier.receivedPurchaseCount >= 2) return { label: "Reliable", tone: "bg-emerald-50 text-emerald-700" };
  return { label: "Active", tone: "bg-[#edf3f4] text-[#426870]" };
}

function purchaseTone(status: string, stockReceived: boolean) {
  if (stockReceived || status === "received") return "bg-emerald-50 text-emerald-700";
  if (status === "cancelled") return "bg-rose-50 text-rose-700";
  return "bg-amber-50 text-amber-700";
}

function Kpi({ helper, icon, label, tone = "brand", value }: { helper: string; icon: IconName; label: string; tone?: "brand" | "good" | "warn"; value: string }) {
  const colors = tone === "good" ? "bg-emerald-50 text-emerald-700" : tone === "warn" ? "bg-amber-50 text-amber-700" : "bg-[#edf3f4] text-[#3b646d]";
  return <article className="rounded-2xl border border-[#e2e8e5] bg-white p-4 shadow-[0_1px_2px_rgba(25,50,45,.03)]"><div className="flex items-start justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[.08em] text-[#74817b]">{label}</p><p className="mt-2 text-[23px] font-bold tracking-[-.035em] text-[#17231f]">{value}</p></div><span className={`flex h-8 w-8 items-center justify-center rounded-xl ${colors}`}><Icon name={icon} size={15}/></span></div><p className="mt-3 border-t border-[#eff2f0] pt-2.5 text-[9px] font-semibold text-[#77847e]">{helper}</p></article>;
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return <div className="flex items-start justify-between gap-4 border-b border-[#eef2f0] py-2.5 last:border-0"><dt className="text-[9.5px] font-semibold text-[#7b8882]">{label}</dt><dd className="max-w-[65%] text-right text-[9.5px] font-bold text-[#26352f]">{value}</dd></div>;
}

function escapeCsv(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function SupplierProfile({ onEdit, onNavigate, onNotice, supplier }: { onEdit: () => void; onNavigate: (page: string) => void; onNotice: (message: string, error?: boolean) => void; supplier: LiveSupplier | undefined }) {
  if (!supplier) return <aside className="rounded-2xl border border-[#e2e8e5] bg-white p-6"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3f4] text-[#426870]"><Icon name="supplier" size={18}/></span><h3 className="mt-4 text-[15px] font-bold text-[#1c2b26]">Select a supplier</h3><p className="mt-2 text-[10px] leading-5 text-[#7a8781]">Choose a supplier to see contact, payable context and purchase history.</p></aside>;

  const health = supplierHealth(supplier);
  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(supplier?.phone ?? "");
      onNotice("Supplier phone copied.");
    } catch {
      onNotice("Phone could not be copied.", true);
    }
  }

  return <aside className="overflow-hidden rounded-2xl border border-[#dfe7e3] bg-white"><div className="bg-[linear-gradient(135deg,#edf4f2,#f8faf9)] p-5"><div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#426d72] text-[12px] font-extrabold text-white">{initials(supplier.name)}</span><span className={`rounded-full px-2.5 py-1 text-[8px] font-bold ${health.tone}`}>{health.label}</span></div><h3 className="mt-4 text-[17px] font-bold tracking-[-.02em] text-[#1d2c27]">{supplier.name}</h3><p className="mt-1 text-[9.5px] font-semibold text-[#75837d]">{supplier.supplierType || "Supplier"} · {supplier.contactPerson || "No contact person"}</p><div className="mt-4 grid grid-cols-3 gap-2"><a className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#426d72] px-2 py-2.5 text-[8.5px] font-bold text-white" href={supplier.phone ? `tel:${supplier.phone}` : undefined}><Icon name="phone" size={12}/> Call</a><button className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#d7e1dd] bg-white px-2 py-2.5 text-[8.5px] font-bold text-[#49676a]" onClick={() => void copyPhone()} type="button"><Icon name="copy" size={12}/> Copy</button><button className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#d7e1dd] bg-white px-2 py-2.5 text-[8.5px] font-bold text-[#49676a]" onClick={onEdit} type="button"><Icon name="edit" size={12}/> Edit</button></div></div><div className="p-5"><p className="text-[8.5px] font-extrabold uppercase tracking-[.14em] text-[#8a9690]">Contact & terms</p><dl className="mt-2"><Detail label="Phone" value={supplier.phone || "Not provided"}/><Detail label="Email" value={supplier.email || "Not provided"}/><Detail label="Address" value={supplier.address || "Not provided"}/><Detail label="Payment terms" value={supplier.paymentTerms || "Not provided"}/></dl><p className="mt-5 text-[8.5px] font-extrabold uppercase tracking-[.14em] text-[#8a9690]">Purchase summary</p><div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-xl bg-[#f5f8f6] p-3"><p className="text-[8px] font-bold text-[#7f8b85]">Total purchases</p><p className="mt-1 text-[13px] font-extrabold text-[#26352f]">{money(supplier.totalPurchaseValue)}</p></div><div className="rounded-xl bg-[#f5f8f6] p-3"><p className="text-[8px] font-bold text-[#7f8b85]">Pending value</p><p className="mt-1 text-[13px] font-extrabold text-amber-700">{money(supplier.pendingPurchaseValue)}</p></div><div className="rounded-xl bg-[#f5f8f6] p-3"><p className="text-[8px] font-bold text-[#7f8b85]">Purchase entries</p><p className="mt-1 text-[13px] font-extrabold text-[#26352f]">{supplier.purchaseCount}</p></div><div className="rounded-xl bg-[#f5f8f6] p-3"><p className="text-[8px] font-bold text-[#7f8b85]">Received</p><p className="mt-1 text-[13px] font-extrabold text-emerald-700">{supplier.receivedPurchaseCount}</p></div></div><div className="mt-4 grid grid-cols-2 gap-2"><button className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#426d72] px-3 py-2.5 text-[8.5px] font-bold text-white" onClick={() => onNavigate("Purchase Stock Entry")} type="button"><Icon name="box" size={12}/> New purchase</button><button className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#d7e1dd] bg-white px-3 py-2.5 text-[8.5px] font-bold text-[#49676a]" onClick={() => onNavigate("Finance Reconciliation")} type="button"><Icon name="finance" size={12}/> Finance</button></div><div className="mt-5 flex items-center justify-between"><p className="text-[8.5px] font-extrabold uppercase tracking-[.14em] text-[#8a9690]">Recent purchases</p><span className="text-[8.5px] font-bold text-[#536f6b]">{supplier.purchaseCount} total</span></div><div className="mt-3 max-h-[300px] space-y-2 overflow-y-auto pr-1">{supplier.recentPurchases.length ? supplier.recentPurchases.map((purchase) => <div className="rounded-xl border border-[#e5ebe8] bg-[#fbfcfb] p-3" key={purchase.id}><div className="flex items-start justify-between gap-3"><div><p className="text-[9.5px] font-extrabold text-[#26352f]">{purchase.purchaseNumber}</p><p className="mt-1 text-[8px] text-[#8a9690]">{dateText(purchase.createdAt, true)}</p></div><span className={`rounded-full px-2 py-1 text-[7.5px] font-bold ${purchaseTone(purchase.status, purchase.stockReceived)}`}>{labelText(purchase.stockReceived ? "received" : purchase.status)}</span></div><p className="mt-2 border-t border-[#edf1ef] pt-2 text-[10px] font-extrabold text-[#26352f]">{money(purchase.totalCost)}</p></div>) : <div className="rounded-xl border border-dashed border-[#dfe6e3] p-4 text-center text-[8.5px] leading-4 text-[#8b9691]">No purchase entry is linked to this supplier yet.</div>}</div>{supplier.notes ? <div className="mt-4 rounded-xl bg-[#f5f8f6] p-3 text-[8.5px] leading-4 text-[#61706a]"><b className="block text-[#41534c]">Internal note</b>{supplier.notes}</div> : null}</div></aside>;
}

function SupplierModal({ editing, form, isSaving, onChange, onClose, onSubmit }: { editing: LiveSupplier | null; form: SupplierInput; isSaving: boolean; onChange: (field: keyof SupplierInput, value: string) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const inputClass = "mt-1.5 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[9.5px] font-semibold normal-case tracking-normal text-[#42524b] outline-none focus:border-[#759493]";
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#17231f]/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><form className="max-h-[92vh] w-full max-w-[650px] overflow-y-auto rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.24)]" onSubmit={onSubmit}><div className="flex items-start justify-between border-b border-[#e8ecea] p-5"><div><p className="text-[8.5px] font-bold uppercase tracking-[.15em] text-[#3b646d]">Live supplier record</p><h2 className="mt-1.5 text-[18px] font-bold text-[#23322b]">{editing ? "Edit supplier" : "Add supplier"}</h2></div><button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5f3] text-[#65736c]" onClick={onClose} type="button"><Icon name="close" size={15}/></button></div><div className="grid gap-4 p-5 sm:grid-cols-2">{([['Supplier name','name','text'],['Contact person','contactPerson','text'],['Mobile number','phone','text'],['Email address','email','email']] as const).map(([label, field, type]) => <label className="text-[8.5px] font-bold uppercase tracking-[.1em] text-[#77847e]" key={field}>{label}<input autoFocus={field === "name"} className={inputClass} onChange={(event) => onChange(field, event.target.value)} required={field === "name"} type={type} value={form[field]}/></label>)}<label className="text-[8.5px] font-bold uppercase tracking-[.1em] text-[#77847e]">Supplier type<select className={inputClass} onChange={(event) => onChange("supplierType", event.target.value)} value={form.supplierType}><option>Distributor</option><option>Authorized distributor</option><option>Importer</option><option>Local wholesaler</option><option>Packaging supplier</option></select></label><label className="text-[8.5px] font-bold uppercase tracking-[.1em] text-[#77847e]">Payment terms<input className={inputClass} onChange={(event) => onChange("paymentTerms", event.target.value)} placeholder="Cash, 7 days, 30 days..." value={form.paymentTerms}/></label><label className="text-[8.5px] font-bold uppercase tracking-[.1em] text-[#77847e]">Status<select className={inputClass} onChange={(event) => onChange("status", event.target.value)} value={form.status}><option value="active">Active</option><option value="inactive">Inactive</option></select></label><label className="text-[8.5px] font-bold uppercase tracking-[.1em] text-[#77847e] sm:col-span-2">Address<textarea className={`${inputClass} min-h-20 py-3`} onChange={(event) => onChange("address", event.target.value)} value={form.address}/></label><label className="text-[8.5px] font-bold uppercase tracking-[.1em] text-[#77847e] sm:col-span-2">Internal notes<textarea className={`${inputClass} min-h-20 py-3`} onChange={(event) => onChange("notes", event.target.value)} value={form.notes}/></label></div><div className="flex justify-end gap-2 border-t border-[#e8ecea] bg-[#fafbfa] p-5"><button className="h-10 rounded-xl border border-[#dce4e0] bg-white px-4 text-[9.5px] font-bold text-[#66756e]" onClick={onClose} type="button">Cancel</button><button className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#3b646d] px-4 text-[9.5px] font-bold text-white disabled:opacity-50" disabled={isSaving} type="submit"><Icon name="check" size={13}/>{isSaving ? "Saving..." : editing ? "Save changes" : "Create supplier"}</button></div></form></div>;
}

export function LiveSuppliersWorkspace({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [suppliers, setSuppliers] = useState<LiveSupplier[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SupplierFilter>("All");
  const [focusedId, setFocusedId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LiveSupplier | null>(null);
  const [form, setForm] = useState<SupplierInput>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);

  const showNotice = useCallback((message: string, isError = false) => {
    setNotice(message);
    setNoticeError(isError);
    window.setTimeout(() => setNotice(""), 3200);
  }, []);

  const loadSuppliers = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError("");
    try {
      const records = await fetchLiveSuppliers(signal);
      setSuppliers(records);
      setFocusedId((current) => records.some((supplier) => supplier.id === current) ? current : records[0]?.id || "");
    } catch (error) {
      if (!signal?.aborted) setLoadError(error instanceof Error ? error.message : "Live suppliers could not be loaded.");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadSuppliers(controller.signal), 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [loadSuppliers]);

  const filtered = useMemo(() => suppliers.filter((supplier) => {
    const matchesFilter = filter === "All" || (filter === "Active" && supplier.status === "active") || (filter === "Inactive" && supplier.status === "inactive") || (filter === "Follow-up" && supplier.pendingPurchaseCount > 0);
    const search = `${supplier.name} ${supplier.contactPerson || ""} ${supplier.phone || ""} ${supplier.email || ""} ${supplier.address || ""}`.toLowerCase();
    return matchesFilter && (!query || search.includes(query.trim().toLowerCase()));
  }), [filter, query, suppliers]);
  const focused = filtered.find((supplier) => supplier.id === focusedId) || filtered[0];
  const activeCount = suppliers.filter((supplier) => supplier.status === "active").length;
  const pendingCount = suppliers.reduce((sum, supplier) => sum + supplier.pendingPurchaseCount, 0);
  const purchaseValue = suppliers.reduce((sum, supplier) => sum + supplier.totalPurchaseValue, 0);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit() {
    if (!focused) return;
    setEditing(focused);
    setForm({ address: focused.address || "", contactPerson: focused.contactPerson || "", email: focused.email || "", name: focused.name, notes: focused.notes || "", paymentTerms: focused.paymentTerms || "Cash", phone: focused.phone || "", status: focused.status, supplierType: focused.supplierType || "Distributor" });
    setModalOpen(true);
  }

  async function saveSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) return;
    setIsSaving(true);
    try {
      const saved = editing ? await updateLiveSupplier(editing.id, form) : await createLiveSupplier(form);
      setSuppliers((current) => editing ? current.map((supplier) => supplier.id === saved.id ? saved : supplier) : [saved, ...current]);
      setFocusedId(saved.id);
      setModalOpen(false);
      showNotice(editing ? "Supplier updated successfully." : "Supplier created successfully.");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Supplier could not be saved.", true);
    } finally {
      setIsSaving(false);
    }
  }

  function exportSuppliers() {
    const rows = [["Supplier", "Contact", "Phone", "Email", "Status", "Purchase Entries", "Total Purchase Value", "Pending Purchase Value"], ...filtered.map((supplier) => [supplier.name, supplier.contactPerson || "", supplier.phone || "", supplier.email || "", supplier.status, supplier.purchaseCount, supplier.totalPurchaseValue, supplier.pendingPurchaseValue])];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `brandnbeauty-suppliers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice(`${filtered.length} suppliers exported.`);
  }

  const counts: Record<SupplierFilter, number> = { Active: activeCount, All: suppliers.length, "Follow-up": suppliers.filter((supplier) => supplier.pendingPurchaseCount > 0).length, Inactive: suppliers.filter((supplier) => supplier.status === "inactive").length };

  return <div className="space-y-4"><header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="flex items-center gap-2 text-[8.5px] font-extrabold uppercase tracking-[.18em] text-[#547874]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Supply operations</p><h1 className="mt-2 text-[26px] font-bold tracking-[-.045em] text-[#17231f]">Suppliers command center</h1><p className="mt-1.5 text-[10px] font-medium text-[#74817b]">Manage real supplier records and review linked MySQL purchase activity.</p></div><div className="flex flex-wrap gap-2"><button className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[9.5px] font-bold text-[#62706a] disabled:opacity-50" disabled={isLoading} onClick={() => void loadSuppliers()} type="button"><Icon className={isLoading ? "animate-spin" : ""} name="refresh" size={14}/> Refresh</button><button className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[9.5px] font-bold text-[#62706a] disabled:opacity-50" disabled={!filtered.length} onClick={exportSuppliers} type="button"><Icon name="download" size={14}/> Export</button><button className="inline-flex items-center gap-1.5 rounded-xl bg-[#426d72] px-3.5 py-2.5 text-[9.5px] font-bold text-white" onClick={openCreate} type="button"><Icon name="plus" size={14}/> Add supplier</button></div></header><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi helper="Operational supplier records" icon="supplier" label="Total suppliers" value={String(suppliers.length)}/><Kpi helper="Available for purchasing" icon="check" label="Active suppliers" tone="good" value={String(activeCount)}/><Kpi helper="Linked purchase entries" icon="box" label="Purchase value" value={money(purchaseValue)}/><Kpi helper="Open purchase follow-ups" icon="alert" label="Pending purchases" tone="warn" value={String(pendingCount)}/></section>{loadError ? <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[9.5px] font-bold text-rose-700"><span className="flex items-center gap-2"><Icon name="alert" size={14}/>{loadError}</span><button className="underline" onClick={() => void loadSuppliers()} type="button">Try again</button></div> : null}<section className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white"><div className="flex flex-col gap-3 border-b border-[#e7ece9] p-4 xl:flex-row xl:items-center xl:justify-between"><div className="flex flex-wrap gap-1.5">{(["All", "Active", "Follow-up", "Inactive"] as SupplierFilter[]).map((item) => <button className={`rounded-lg px-3 py-2 text-[9px] font-bold ${filter === item ? "bg-[#426d72] text-white" : "bg-[#f4f7f5] text-[#6f7c76]"}`} key={item} onClick={() => setFilter(item)} type="button">{item} <span className={filter === item ? "text-white/70" : "text-[#9aa49f]"}>{counts[item]}</span></button>)}</div><label className="relative block w-full xl:w-[310px]"><Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#93a09a]" name="search" size={14}/><input className="w-full rounded-xl border border-[#dfe6e3] bg-[#fbfcfb] py-2.5 pl-9 pr-3 text-[9.5px] font-semibold outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Search supplier, contact or phone..." value={query}/></label></div><div className="grid xl:grid-cols-[minmax(0,1fr)_340px]"><div className="min-w-0 overflow-x-auto"><table className="w-full min-w-[760px] border-collapse"><thead><tr className="border-b border-[#e8edeb] bg-[#fbfcfb] text-left text-[8px] font-extrabold uppercase tracking-[.12em] text-[#89958f]"><th className="px-4 py-3">Supplier</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Terms</th><th className="px-4 py-3">Purchases</th><th className="px-4 py-3">Pending</th><th className="px-4 py-3">Health</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody>{isLoading && !suppliers.length ? Array.from({ length: 5 }).map((_, index) => <tr className="border-b border-[#edf1ef]" key={index}><td className="px-4 py-4" colSpan={7}><div className="h-8 animate-pulse rounded-lg bg-[#f0f3f1]"/></td></tr>) : filtered.map((supplier) => { const health = supplierHealth(supplier); return <tr className={`cursor-pointer border-b border-[#edf1ef] hover:bg-[#f8faf9] ${focused?.id === supplier.id ? "bg-[#f3f7f5]" : ""}`} key={supplier.id} onClick={() => setFocusedId(supplier.id)}><td className="px-4 py-3.5"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e7efed] text-[9px] font-extrabold text-[#426d72]">{initials(supplier.name)}</span><div><p className="text-[9.5px] font-extrabold text-[#25342f]">{supplier.name}</p><p className="mt-1 text-[8px] text-[#8a9690]">{supplier.supplierType || "Supplier"}</p></div></div></td><td className="px-4 py-3.5"><p className="text-[9px] font-bold text-[#50605a]">{supplier.contactPerson || "Not provided"}</p><p className="mt-1 text-[8px] text-[#96a09b]">{supplier.phone || supplier.email || "No contact"}</p></td><td className="px-4 py-3.5 text-[9px] font-bold text-[#50605a]">{supplier.paymentTerms || "Not set"}</td><td className="px-4 py-3.5"><p className="text-[10px] font-extrabold text-[#26352f]">{money(supplier.totalPurchaseValue)}</p><p className="mt-1 text-[8px] text-[#89958f]">{supplier.purchaseCount} entries</p></td><td className="px-4 py-3.5"><p className="text-[10px] font-extrabold text-amber-700">{money(supplier.pendingPurchaseValue)}</p><p className="mt-1 text-[8px] text-[#89958f]">{supplier.pendingPurchaseCount} open</p></td><td className="px-4 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[8px] font-bold ${health.tone}`}>{health.label}</span></td><td className="px-4 py-3.5 text-right"><button className="inline-flex items-center gap-1 rounded-lg border border-[#dce5e1] bg-white px-2.5 py-2 text-[8px] font-bold text-[#536f6b]" onClick={(event) => { event.stopPropagation(); setFocusedId(supplier.id); }} type="button"><Icon name="eye" size={12}/> Profile</button></td></tr>; })}</tbody></table>{!isLoading && !filtered.length ? <div className="px-6 py-14 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0f4f2] text-[#69847f]"><Icon name="supplier" size={18}/></span><h3 className="mt-3 text-[12px] font-bold text-[#283731]">No suppliers found</h3><p className="mt-1 text-[9px] text-[#89958f]">Add the first supplier or change your search filter.</p><button className="mt-4 rounded-xl bg-[#426d72] px-4 py-2.5 text-[9px] font-bold text-white" onClick={openCreate} type="button">Add supplier</button></div> : null}<div className="flex items-center justify-between border-t border-[#e8edeb] px-4 py-3 text-[8.5px] font-semibold text-[#89958f]"><span>Showing {filtered.length} of {suppliers.length} suppliers</span><span className="font-bold text-emerald-700">MySQL connected</span></div></div><div className="border-t border-[#e2e8e5] bg-[#fbfcfb] p-3 xl:border-l xl:border-t-0"><SupplierProfile onEdit={openEdit} onNavigate={onNavigate} onNotice={showNotice} supplier={focused}/></div></div></section>{modalOpen ? <SupplierModal editing={editing} form={form} isSaving={isSaving} onChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))} onClose={() => setModalOpen(false)} onSubmit={(event) => void saveSupplier(event)}/> : null}{notice ? <div className={`fixed bottom-6 right-6 z-[90] rounded-xl px-4 py-3 text-[10px] font-bold text-white shadow-xl ${noticeError ? "bg-rose-600" : "bg-[#335e63]"}`}>{notice}</div> : null}</div>;
}
