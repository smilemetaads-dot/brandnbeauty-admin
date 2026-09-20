"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { fetchCodRecords, updateCodRecord, type CodRecord, type CodStatus } from "@/features/finance/cod-reconciliation-client";

type Tone = "good" | "warn" | "bad" | "brand" | "default";
const money = (value: number) => new Intl.NumberFormat("en-BD", { currency: "BDT", maximumFractionDigits: 0, style: "currency" }).format(value);
function date(value: string | null) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Not available" : new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(parsed);
}
function tone(status: CodStatus): Tone {
  if (status === "settled") return "good";
  if (status === "mismatch" || status === "returned") return "bad";
  if (status === "collected") return "brand";
  return "warn";
}
function Badge({ children, variant = "default" }: { children: ReactNode; variant?: Tone }) {
  const colors = { bad: "border-rose-200 bg-rose-50 text-rose-700", brand: "border-[#5E7F85]/20 bg-[#5E7F85]/10 text-[#5E7F85]", default: "border-slate-200 bg-slate-100 text-slate-600", good: "border-emerald-200 bg-emerald-50 text-emerald-700", warn: "border-amber-200 bg-amber-50 text-amber-700" }[variant];
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${colors}`}>{children}</span>;
}
function Stat({ helper, label, value }: { helper: string; label: string; value: ReactNode }) {
  return <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="text-sm font-medium text-slate-500">{label}</div><div className="mt-2 text-2xl font-black tracking-tight text-slate-950">{value}</div><div className="mt-3 text-xs font-bold text-[#5E7F85]">{helper}</div></section>;
}

export function RealCodReconciliationPage() {
  const [records, setRecords] = useState<CodRecord[]>([]);
  const [selected, setSelected] = useState<CodRecord | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | CodStatus>("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const next = await fetchCodRecords(signal);
      setRecords(next);
      setSelected((current) => next.find((item) => item.id === current?.id) ?? next[0] ?? null);
    } catch (error) {
      if (!signal?.aborted) setMessage(error instanceof Error ? error.message : "COD records could not be loaded.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const filtered = useMemo(() => records.filter((record) => {
    const needle = query.trim().toLowerCase();
    return (status === "all" || record.status === status) && (!needle || [record.order_id, record.customer_name, record.customer_phone, record.provider, record.tracking_code, record.settlement_reference].filter(Boolean).some((value) => String(value).toLowerCase().includes(needle)));
  }), [query, records, status]);
  const expected = records.filter((item) => item.status !== "returned").reduce((sum, item) => sum + item.expected_amount, 0);
  const settled = records.reduce((sum, item) => sum + item.settled_amount, 0);
  const open = records.filter((item) => ["pending", "collected", "mismatch"].includes(item.status)).reduce((sum, item) => sum + Math.max(0, item.expected_amount - item.settled_amount), 0);
  const issues = records.filter((item) => item.status === "mismatch" || item.status === "returned").length;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const data = new FormData(event.currentTarget);
    setSaving(true); setMessage("");
    try {
      const result = await updateCodRecord({ collectedAmount: Number(data.get("collected_amount") ?? 0), note: String(data.get("note") ?? ""), recordId: selected.id, settledAmount: Number(data.get("settled_amount") ?? 0), settlementReference: String(data.get("settlement_reference") ?? ""), status: String(data.get("status") ?? "pending") as CodStatus });
      setMessage(result.message ?? "COD record updated.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "COD record could not be updated."); }
    finally { setSaving(false); }
  }

  return <AdminShell><div className="space-y-6">
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5E7F85]">Finance Control</p><div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="text-2xl font-bold tracking-tight text-slate-950">COD Reconciliation</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Match courier collections with expected order amounts, settle payouts, and surface mismatches before they affect cash flow.</p></div><button className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700" onClick={() => void load()} type="button">Refresh</button></div></section>
    {message ? <div className="rounded-2xl border border-[#5E7F85]/20 bg-[#5E7F85]/5 px-5 py-4 text-sm font-semibold text-slate-700">{message}</div> : null}
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Stat helper={`${records.length} courier records`} label="Expected COD" value={money(expected)} /><Stat helper="Confirmed settlements" label="Settled" value={money(settled)} /><Stat helper="Pending collection or settlement" label="Outstanding" value={money(open)} /><Stat helper="Mismatch and returned" label="Needs Attention" value={issues} /></section>
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm"><div className="grid gap-3 border-b border-slate-100 p-5 md:grid-cols-[1fr_190px]"><input className="rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]" onChange={(event) => setQuery(event.target.value)} placeholder="Search order, customer, tracking..." value={query} /><select className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm" onChange={(event) => setStatus(event.target.value as "all" | CodStatus)} value={status}><option value="all">All statuses</option><option value="pending">Pending</option><option value="collected">Collected</option><option value="settled">Settled</option><option value="mismatch">Mismatch</option><option value="returned">Returned</option></select></div>
        {loading ? <div className="p-10 text-center text-sm font-semibold text-slate-500">Loading COD records...</div> : filtered.length ? <div className="overflow-x-auto"><table className="min-w-[900px] text-left text-sm"><thead className="bg-stone-50 text-slate-500"><tr>{["Order", "Customer", "Courier", "Expected", "Received", "Difference", "Status"].map((heading) => <th className="px-5 py-4 font-medium" key={heading}>{heading}</th>)}</tr></thead><tbody>{filtered.map((record) => { const difference = record.settled_amount - record.expected_amount; return <tr className={`cursor-pointer border-t border-slate-100 transition hover:bg-stone-50 ${selected?.id === record.id ? "bg-[#5E7F85]/5 shadow-[inset_3px_0_0_#5E7F85]" : ""}`} key={record.id} onClick={() => setSelected(record)}><td className="px-5 py-4"><Link className="font-bold text-[#5E7F85] hover:underline" href={`/orders/details?id=${record.order_id}`}>BNB-{record.order_id.padStart(6, "0")}</Link><div className="mt-1 text-xs text-slate-400">{date(record.order_created_at)}</div></td><td className="px-5 py-4 font-semibold text-slate-800">{record.customer_name}<div className="mt-1 text-xs text-slate-400">{record.customer_phone ?? "No phone"}</div></td><td className="px-5 py-4">{record.provider ?? "Manual"}<div className="mt-1 text-xs text-slate-400">{record.tracking_code ?? record.consignment_id ?? "No tracking"}</div></td><td className="px-5 py-4 font-semibold">{money(record.expected_amount)}</td><td className="px-5 py-4 font-semibold">{money(record.settled_amount || record.collected_amount)}</td><td className={`px-5 py-4 font-bold ${Math.abs(difference) >= .01 ? "text-rose-700" : "text-emerald-700"}`}>{money(difference)}</td><td className="px-5 py-4"><Badge variant={tone(record.status)}>{record.status}</Badge></td></tr>; })}</tbody></table></div> : <div className="p-10 text-center text-sm font-semibold text-slate-500">No COD records found. Book a packed order with a courier first.</div>}
      </div>
      <aside className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">{selected ? <form className="space-y-4" key={`${selected.id}-${selected.updated_at}`} onSubmit={submit}><div><div className="text-xs font-bold uppercase tracking-[0.16em] text-[#5E7F85]">Settlement Editor</div><h2 className="mt-2 text-xl font-bold text-slate-950">BNB-{selected.order_id.padStart(6, "0")}</h2><p className="mt-1 text-sm text-slate-500">Expected {money(selected.expected_amount)}</p></div><label className="block text-sm font-semibold text-slate-700">Status<select className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3" defaultValue={selected.status} name="status"><option value="pending">Pending</option><option value="collected">Collected</option><option value="settled">Settled</option><option value="mismatch">Mismatch</option><option value="returned">Returned</option></select></label><label className="block text-sm font-semibold text-slate-700">Collected amount<input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" defaultValue={selected.collected_amount} min="0" name="collected_amount" step="0.01" type="number" /></label><label className="block text-sm font-semibold text-slate-700">Settled amount<input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" defaultValue={selected.settled_amount} min="0" name="settled_amount" step="0.01" type="number" /></label><label className="block text-sm font-semibold text-slate-700">Settlement reference<input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" defaultValue={selected.settlement_reference ?? ""} name="settlement_reference" placeholder="Statement / transaction ID" /></label><label className="block text-sm font-semibold text-slate-700">Note<textarea className="mt-2 min-h-24 w-full rounded-2xl border border-slate-300 px-4 py-3" defaultValue={selected.note ?? ""} name="note" placeholder="Mismatch or return details" /></label><button className="w-full rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-bold text-white disabled:bg-slate-300" disabled={saving} type="submit">{saving ? "Saving..." : "Save Reconciliation"}</button><p className="text-xs leading-5 text-slate-400">A settled amount different from expected COD is automatically flagged as a mismatch.</p></form> : <div className="py-10 text-center text-sm font-semibold text-slate-500">Select a COD record to reconcile.</div>}</aside>
    </section>
  </div></AdminShell>;
}
