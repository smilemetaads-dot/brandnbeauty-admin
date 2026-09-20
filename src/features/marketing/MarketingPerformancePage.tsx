"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type Campaign = { campaign_name: string; delivered_count: number; delivered_revenue: number; delivered_roas: number | null; order_count: number; platform: string; purchase_revenue: number; purchase_roas: number | null; returned_count: number; revenue_after_ads: number; spend: number };
const ENDPOINT = bnbApiUrl("manage_marketing_performance.php");
const money = (value: number) => new Intl.NumberFormat("en-BD", { currency: "BDT", maximumFractionDigits: 0, style: "currency" }).format(value);

export function MarketingPerformancePage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(ENDPOINT, { cache: "no-store", headers: adminAuthHeaders(), signal });
      const payload = await response.json(); if (!response.ok || !payload.success) throw new Error(payload.message);
      setCampaigns(Array.isArray(payload.campaigns) ? payload.campaigns : []);
    } catch (error) { if (!signal?.aborted) setMessage(error instanceof Error ? error.message : "Marketing performance unavailable."); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  async function saveSpend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setSaving(true); setMessage("");
    try {
      const response = await fetch(ENDPOINT, { method: "POST", headers: adminAuthHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ spend_date: form.get("spend_date"), platform: form.get("platform"), campaign_name: form.get("campaign_name"), campaign_id: form.get("campaign_id"), spend_amount: Number(form.get("spend_amount") ?? 0), note: form.get("note") }) });
      const payload = await response.json(); if (!response.ok || !payload.success) throw new Error(payload.message);
      setMessage(payload.message); event.currentTarget.reset(); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Spend could not be saved."); }
    finally { setSaving(false); }
  }
  const spend = campaigns.reduce((sum, row) => sum + Number(row.spend || 0), 0);
  const paidCampaigns = campaigns.filter((row) => Number(row.spend || 0) > 0);
  const purchaseRevenue = paidCampaigns.reduce((sum, row) => sum + Number(row.purchase_revenue || 0), 0);
  const deliveredRevenue = paidCampaigns.reduce((sum, row) => sum + Number(row.delivered_revenue || 0), 0);
  return <AdminShell><div className="space-y-6">
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#5E7F85]">Growth</p><h1 className="mt-2 text-2xl font-bold text-slate-950">Marketing Performance</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Compare real campaign spend with attributed purchase and delivered revenue. Delivered ROAS is the primary COD-business metric.</p></section>
    {message ? <div className="rounded-2xl border border-[#5E7F85]/20 bg-[#5E7F85]/5 px-5 py-4 text-sm font-semibold text-slate-700">{message}</div> : null}
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[["Ad Spend", money(spend)], ["Purchase Revenue", money(purchaseRevenue)], ["Delivered Revenue", money(deliveredRevenue)], ["Delivered ROAS", spend > 0 ? `${(deliveredRevenue / spend).toFixed(2)}x` : "Needs spend"]].map(([label, value]) => <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" key={label}><div className="text-sm text-slate-500">{label}</div><div className="mt-2 text-2xl font-black text-slate-950">{value}</div></div>)}</section>
    <form className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-6" onSubmit={saveSpend}>
      <label className="text-sm font-semibold text-slate-700">Date<input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3" name="spend_date" required type="date" /></label>
      <label className="text-sm font-semibold text-slate-700">Platform<select className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3" name="platform"><option value="facebook">Facebook / Meta</option><option value="google">Google</option><option value="other">Other</option></select></label>
      <label className="text-sm font-semibold text-slate-700 xl:col-span-2">Campaign name<input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3" name="campaign_name" placeholder="Must match utm_campaign" required /></label>
      <label className="text-sm font-semibold text-slate-700">Spend (BDT)<input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3" min="0" name="spend_amount" required step="0.01" type="number" /></label>
      <label className="text-sm font-semibold text-slate-700">Campaign ID<input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3" name="campaign_id" placeholder="Optional" /></label>
      <label className="text-sm font-semibold text-slate-700 md:col-span-2 xl:col-span-5">Note<input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3" name="note" placeholder="Optional statement/reference" /></label>
      <button className="rounded-xl bg-[#5E7F85] px-4 py-3 text-sm font-bold text-white disabled:bg-slate-300 xl:self-end" disabled={saving} type="submit">{saving ? "Saving..." : "Save Spend"}</button>
    </form>
    <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="text-xl font-bold text-slate-950">Campaign Performance</h2><p className="mt-1 text-sm text-slate-500">Revenue after ads is not profit; COGS, courier, packaging, returns, and fees are not yet deducted here.</p></div>{campaigns.length ? <div className="overflow-x-auto"><table className="min-w-[1050px] text-left text-sm"><thead className="bg-stone-50 text-slate-500"><tr>{["Campaign", "Spend", "Orders", "Purchase Revenue", "Purchase ROAS", "Delivered", "Delivered Revenue", "Delivered ROAS", "Returns"].map((head) => <th className="px-5 py-4 font-medium" key={head}>{head}</th>)}</tr></thead><tbody>{campaigns.map((row) => <tr className="border-t border-slate-100" key={`${row.platform}-${row.campaign_name}`}><td className="px-5 py-4"><div className="font-bold text-slate-950">{row.campaign_name}</div><div className="mt-1 text-xs capitalize text-slate-400">{row.platform}</div></td><td className="px-5 py-4 font-semibold">{money(row.spend)}</td><td className="px-5 py-4">{row.order_count}</td><td className="px-5 py-4">{money(row.purchase_revenue)}</td><td className="px-5 py-4 font-bold">{row.purchase_roas === null ? "—" : `${row.purchase_roas.toFixed(2)}x`}</td><td className="px-5 py-4">{row.delivered_count}</td><td className="px-5 py-4 font-semibold text-emerald-700">{money(row.delivered_revenue)}</td><td className="px-5 py-4 font-bold text-[#5E7F85]">{row.delivered_roas === null ? "—" : `${row.delivered_roas.toFixed(2)}x`}</td><td className="px-5 py-4 text-rose-700">{row.returned_count}</td></tr>)}</tbody></table></div> : <div className="p-10 text-center text-sm font-semibold text-slate-500">No campaign spend or attributed orders yet.</div>}</section>
  </div></AdminShell>;
}
