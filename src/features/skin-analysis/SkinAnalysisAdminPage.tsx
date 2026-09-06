"use client";

import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_BNB_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "";

const metricCards = [
  ["total", "Analyses"],
  ["success_rate", "Success Rate"],
  ["errors", "Errors"],
  ["retries", "Retries"],
  ["avg_latency_ms", "Avg Latency"],
  ["estimated_units", "Units"],
] as const;

export default function SkinAnalysisAdminPage() {
  const [data, setData] = useState<any>(null);
  const [range, setRange] = useState("30d");

  useEffect(() => {
    const base = API_BASE.replace(/\/+$/, "");
    fetch(`${base}/php/skin-analysis/admin/metrics.php?range=${range}`, {
      cache: "no-store",
      credentials: "include",
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ error: true }));
  }, [range]);

  const summary = data?.summary || {};

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-[0.14em] text-[#5E7F85]">AI SKIN ANALYSIS</div>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">Monitoring & Pilot Control</h1>
          <p className="mt-2 text-sm text-slate-500">Operational health for the controlled Skin Analysis pilot.</p>
        </div>
        <select value={range} onChange={(e) => setRange(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {data?.error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Skin Analysis metrics are unavailable. Verify the PHP backend and admin authentication before pilot use.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metricCards.map(([key, label]) => {
            const raw = summary[key];
            const value =
              key === "success_rate"
                ? `${raw ?? 0}%`
                : key === "avg_latency_ms"
                  ? raw
                    ? `${(Number(raw) / 1000).toFixed(1)}s`
                    : "—"
                  : raw ?? 0;

            return (
              <div key={key} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">{label}</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Pilot safety note</div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Keep this admin route protected by the shared BrandnBeauty server-valid admin session. Cost controls and hard kill-switch remain backend responsibilities.
        </p>
      </div>
    </main>
  );
}
