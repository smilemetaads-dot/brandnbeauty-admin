"use client";

import type { ReportsData } from "@/lib/reports/supabaseReports";

export default function RealReportsPage({
  reportsData,
}: {
  reportsData: ReportsData;
}) {
  return (
    <div className="min-h-screen bg-stone-50 p-4 text-slate-900 md:p-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm text-slate-500">Admin / Reports</div>
            <h1 className="text-3xl font-bold">Reports &amp; Insights</h1>
            <p className="mt-2 text-sm text-slate-500">
              Understand your business performance clearly
            </p>
          </div>
          <div className="flex gap-3">
            <select className="rounded-xl border border-slate-300 px-4 py-2 text-sm">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
            <button className="rounded-xl bg-[#5E7F85] px-4 py-2 text-sm text-white">
              Export All
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {reportsData.kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="text-sm text-slate-500">{kpi.label}</div>
              <div className="mt-2 text-2xl font-bold">{kpi.value}</div>
              <div className="mt-1 text-xs text-slate-500">{kpi.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {reportsData.reports.map((report) => (
            <div
              key={report.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <h2 className="text-lg font-semibold">{report.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{report.desc}</p>
              <button className="mt-4 text-sm font-medium text-[#5E7F85]">
                View Report
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">AI Business Insights</h2>
          <div className="mt-4 space-y-3">
            {reportsData.insights.map((item) => (
              <div
                key={item}
                className="rounded-xl bg-stone-50 p-4 text-sm text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Export Smart Segments</h2>
            <div className="mt-4 space-y-2">
              <button className="w-full rounded-xl bg-stone-100 p-3 text-sm">
                Export VIP Customers
              </button>
              <button className="w-full rounded-xl bg-stone-100 p-3 text-sm">
                Export COD Risk
              </button>
              <button className="w-full rounded-xl bg-stone-100 p-3 text-sm">
                Export New Customers
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Smart Recommendation</h2>
            <div className="mt-4 space-y-3 text-sm">
              {reportsData.recommendations.map((item) => (
                <div key={item} className="rounded-xl bg-stone-50 p-4">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
