"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type EventRow = {
  created_at: string | null; delivery_status: string; event_id: string;
  fbclid: string | null; gclid: string | null; order_id: string | null;
  order_status: string | null; total_amount: number | string | null;
  utm_campaign: string | null; utm_medium: string | null; utm_source: string | null;
};
type Summary = { capi_failed: number | string; capi_sent: number | string; event_count: number | string; tracked_value: number | string };
const money = (value: number) => new Intl.NumberFormat("en-BD", { currency: "BDT", maximumFractionDigits: 0, style: "currency" }).format(value);
const sourceName = (event: EventRow) => event.utm_source ?? (event.fbclid ? "Facebook" : event.gclid ? "Google" : "Direct / Unknown");

export function TrackingHealthPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState("Loading verified conversion events...");
  useEffect(() => {
    const controller = new AbortController();
    fetch(bnbApiUrl("get_tracking_health.php"), { cache: "no-store", headers: adminAuthHeaders(), signal: controller.signal })
      .then(async (response) => { const payload = await response.json(); if (!response.ok || !payload.success) throw new Error(payload.message); return payload; })
      .then((payload) => { setEvents(Array.isArray(payload.events) ? payload.events : []); setSummary(payload.summary ?? null); setMessage(""); })
      .catch((error) => { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Tracking health unavailable."); });
    return () => controller.abort();
  }, []);
  const stats = [
    ["Verified Purchases", Number(summary?.event_count ?? 0)],
    ["Tracked Value", money(Number(summary?.tracked_value ?? 0))],
    ["CAPI Sent", Number(summary?.capi_sent ?? 0)],
    ["CAPI Failed", Number(summary?.capi_failed ?? 0)],
  ];
  return <AdminShell><div className="space-y-6">
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-[#5E7F85]">Growth</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-950">Tracking &amp; Attribution</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Verified Purchase signals with consent-aware source and campaign attribution. The same event ID is used for browser Pixel and CAPI deduplication.</p>
    </section>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value]) => <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" key={String(label)}><div className="text-sm text-slate-500">{label}</div><div className="mt-2 text-2xl font-black text-slate-950">{value}</div></div>)}</section>
    <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5"><h2 className="text-xl font-bold text-slate-950">Recent Purchase Signals</h2><p className="mt-1 text-sm text-slate-500">UTM and click attribution appears only when the visitor granted marketing consent.</p></div>
      {message ? <div className="p-10 text-center text-sm font-semibold text-slate-500">{message}</div> : events.length ? <div className="overflow-x-auto"><table className="min-w-[940px] text-left text-sm">
        <thead className="bg-stone-50 text-slate-500"><tr>{["Event ID", "Order", "Value", "Source / Campaign", "Status", "CAPI", "Received"].map((head) => <th className="px-5 py-4 font-medium" key={head}>{head}</th>)}</tr></thead>
        <tbody>{events.map((event) => <tr className="border-t border-slate-100" key={event.event_id}>
          <td className="max-w-56 truncate px-5 py-4 font-semibold text-[#5E7F85]">{event.event_id}</td>
          <td className="px-5 py-4 font-bold">BNB-{String(event.order_id ?? "").padStart(6, "0")}</td>
          <td className="px-5 py-4">{money(Number(event.total_amount ?? 0))}</td>
          <td className="px-5 py-4"><div className="font-semibold capitalize">{sourceName(event)}</div><div className="mt-1 text-xs text-slate-400">{[event.utm_medium, event.utm_campaign].filter(Boolean).join(" / ") || "No campaign tag"}</div></td>
          <td className="px-5 py-4 capitalize">{event.order_status ?? "Unknown"}</td>
          <td className="px-5 py-4 capitalize">{event.delivery_status.replaceAll("_", " ")}</td>
          <td className="px-5 py-4 text-slate-500">{event.created_at ? new Date(event.created_at).toLocaleString("en-BD") : "—"}</td>
        </tr>)}</tbody>
      </table></div> : <div className="p-10 text-center text-sm font-semibold text-slate-500">No verified Purchase signal yet. Complete a test order to create the first event.</div>}
    </section>
  </div></AdminShell>;
}
