"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type ProfitOrder = { id: number; order_number: string; customer_name: string; status: string; created_at: string; revenue: number; product_cost: number; packaging_cost: number; courier_cost: number; payment_fee: number; return_cost: number; other_cost: number; total_cost: number; contribution_profit: number; margin_percent: number | null; cost_source: "estimated" | "manual" | "snapshot"; note: string };
const ENDPOINT = bnbApiUrl("manage_order_profitability.php");
const money = (value: number) => new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(value);
const inputClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#5E7F85]";

export function OrderProfitabilityPage() {
  const [orders, setOrders] = useState<ProfitOrder[]>([]);
  const [selected, setSelected] = useState<ProfitOrder | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(ENDPOINT, { cache: "no-store", headers: adminAuthHeaders(), signal });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message);
      setOrders(Array.isArray(payload.orders) ? payload.orders : []);
    } catch (error) { if (!signal?.aborted) setMessage(error instanceof Error ? error.message : "Profitability data unavailable."); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  const summary = useMemo(() => {
    const recognized = orders.filter((order) => !["cancelled", "returned"].includes(order.status));
    const revenue = recognized.reduce((sum, order) => sum + Number(order.revenue || 0), 0);
    const costs = recognized.reduce((sum, order) => sum + Number(order.total_cost || 0), 0);
    const profit = recognized.reduce((sum, order) => sum + Number(order.contribution_profit || 0), 0);
    return { revenue, costs, profit, margin: revenue > 0 ? (profit / revenue) * 100 : null };
  }, [orders]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    const form = new FormData(event.currentTarget); setSaving(true); setMessage("");
    try {
      const response = await fetch(ENDPOINT, { method: "POST", headers: adminAuthHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ order_id: selected.id, product_cost: Number(form.get("product_cost")), packaging_cost: Number(form.get("packaging_cost")), courier_cost: Number(form.get("courier_cost")), payment_fee: Number(form.get("payment_fee")), return_cost: Number(form.get("return_cost")), other_cost: Number(form.get("other_cost")), note: form.get("note") }) });
      const payload = await response.json(); if (!response.ok || !payload.success) throw new Error(payload.message);
      setMessage(payload.message); setSelected(null); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Order costs could not be saved."); }
    finally { setSaving(false); }
  }
  return <AdminShell><div className="space-y-6">
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#5E7F85]">Finance</p><h1 className="mt-2 text-2xl font-bold text-slate-950">Order Profitability</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">See contribution profit per order after product, packaging, courier, payment, return and other direct costs. Estimated product cost uses the current catalog cost until you lock a manual value.</p></section>
    {message ? <div className="rounded-2xl border border-[#5E7F85]/20 bg-[#5E7F85]/5 px-5 py-4 text-sm font-semibold text-slate-700">{message}</div> : null}
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[["Recognized Revenue", money(summary.revenue)], ["Direct Costs", money(summary.costs)], ["Contribution Profit", money(summary.profit)], ["Contribution Margin", summary.margin === null ? "Needs revenue" : `${summary.margin.toFixed(1)}%`]].map(([label, value]) => <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" key={label}><div className="text-sm text-slate-500">{label}</div><div className="mt-2 text-2xl font-black text-slate-950">{value}</div></div>)}</section>
    <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="text-xl font-bold text-slate-950">Order Contribution</h2><p className="mt-1 text-sm text-slate-500">Operating expenses and advertising allocation are intentionally outside this first contribution-profit layer.</p></div>{orders.length ? <div className="overflow-x-auto"><table className="min-w-[1050px] text-left text-sm"><thead className="bg-stone-50 text-slate-500"><tr>{["Order", "Status", "Revenue", "Product Cost", "Other Direct Costs", "Contribution", "Margin", "Cost Quality", ""].map((head) => <th className="px-5 py-4 font-medium" key={head}>{head}</th>)}</tr></thead><tbody>{orders.map((order) => { const other = order.packaging_cost + order.courier_cost + order.payment_fee + order.return_cost + order.other_cost; return <tr className="border-t border-slate-100" key={order.id}><td className="px-5 py-4"><div className="font-bold text-slate-950">{order.order_number}</div><div className="mt-1 text-xs text-slate-400">{order.customer_name}</div></td><td className="px-5 py-4 capitalize">{order.status}</td><td className="px-5 py-4 font-semibold">{money(order.revenue)}</td><td className="px-5 py-4">{money(order.product_cost)}</td><td className="px-5 py-4">{money(other)}</td><td className={`px-5 py-4 font-bold ${order.contribution_profit < 0 ? "text-rose-700" : "text-emerald-700"}`}>{money(order.contribution_profit)}</td><td className="px-5 py-4">{order.margin_percent === null ? "—" : `${order.margin_percent}%`}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${order.cost_source === "manual" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{order.cost_source}</span></td><td className="px-5 py-4"><button className="font-bold text-[#5E7F85]" onClick={() => setSelected(order)} type="button">Edit costs</button></td></tr>; })}</tbody></table></div> : <div className="p-10 text-center text-sm font-semibold text-slate-500">No orders available yet.</div>}</section>
    {selected ? <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 p-3 sm:items-center"><form className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[1.5rem] bg-white p-6 shadow-2xl" onSubmit={save}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#5E7F85]">{selected.order_number}</p><h2 className="mt-1 text-xl font-bold text-slate-950">Edit direct costs</h2></div><button className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" onClick={() => setSelected(null)} type="button">Close</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{[["Product cost", "product_cost", selected.product_cost], ["Packaging cost", "packaging_cost", selected.packaging_cost], ["Courier cost", "courier_cost", selected.courier_cost], ["Payment fee", "payment_fee", selected.payment_fee], ["Return cost", "return_cost", selected.return_cost], ["Other direct cost", "other_cost", selected.other_cost]].map(([label, name, value]) => <label className="text-sm font-semibold text-slate-700" key={String(name)}>{label}<input className={inputClass} defaultValue={Number(value)} min="0" name={String(name)} step="0.01" type="number" /></label>)}</div><label className="mt-4 block text-sm font-semibold text-slate-700">Note<input className={inputClass} defaultValue={selected.note} name="note" placeholder="Cost source or adjustment reason" /></label><button className="mt-5 w-full rounded-xl bg-[#5E7F85] px-4 py-3 text-sm font-bold text-white disabled:bg-slate-300" disabled={saving} type="submit">{saving ? "Saving..." : "Save & Recalculate"}</button></form></div> : null}
  </div></AdminShell>;
}
