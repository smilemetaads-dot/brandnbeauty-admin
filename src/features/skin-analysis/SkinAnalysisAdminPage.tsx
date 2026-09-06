"use client";

import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_BNB_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "";

export default function SkinAnalysisAdminPage() {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const base = API_BASE.replace(/\/+$/, "");
    fetch(`${base}/php/skin-analysis/admin/metrics.php?range=${range}`, {
      cache: "no-store",
      credentials: "include",
    })
      .then((response) => response.json())
      .then(setData)
      .catch(() => setData({ error: true }));
  }, [range]);

  const summary = data?.summary;

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-[.14em] text-teal-700">AI SKIN ANALYSIS</div>
          <h1 className="mt-1 text-3xl font-semibold">Monitoring & Cost Control</h1>
          <p className="mt-2 text-sm text-slate-500">Operational health, conversion and provider usage.</p>
        </div>
        <select value={range} onChange={(event) => setRange(event.target.value)} className="rounded-xl border bg-white px-4 py-2">
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {summary ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {[
            ["Analyses", summary.total],
            ["Success Rate", `${summary.success_rate ?? 0}%`],
            ["Retry Rate", `${summary.retry_rate ?? 0}%`],
            ["Beauty Passports", summary.beauty_passport_saves ?? 0],
            ["Add to Cart", summary.add_to_cart ?? 0],
            ["Avg Latency", summary.avg_latency_ms ? `${(summary.avg_latency_ms / 1000).toFixed(1)}s` : "—"],
            ["Estimated Units", summary.estimated_units ?? 0],
            ["Estimated Cost", `৳${summary.estimated_cost_bdt ?? 0}`],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-xs text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-semibold">{value}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border bg-white p-6 text-sm text-slate-500">Loading Skin Analysis metrics…</div>
      )}

      {data?.error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Skin Analysis backend metrics endpoint is not available yet.
        </div>
      )}
    </main>
  );
}
