"use client";

const reports = [
  { title: "Sales Report", desc: "Track daily, weekly, monthly revenue" },
  { title: "Order Report", desc: "Order volume, success vs return" },
  { title: "Product Report", desc: "Top selling & low performing products" },
  { title: "Customer Report", desc: "VIP, repeat & risky customers" },
];

const insights = [
  "Sales increased 12% compared to last week",
  "COD return rate is rising in Dhaka region",
  "Top 3 products generate 65% revenue",
  "VIP customers contribute 48% total sales",
];

const kpis = [
  { label: "Revenue", value: "Tk 84,500", sub: "+12%" },
  { label: "Orders", value: "128", sub: "37 pending" },
  { label: "Return Rate", value: "14.8%", sub: "Up risk" },
  { label: "Profit", value: "Tk 21,640", sub: "after cost" },
];

export default function RealReportsPage() {
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
          {kpis.map((kpi) => (
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
          {reports.map((report) => (
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
            {insights.map((item) => (
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
              <div className="rounded-xl bg-stone-50 p-4">
                Increase budget on top 3 performing products
              </div>
              <div className="rounded-xl bg-stone-50 p-4">
                Reduce COD orders in high-risk zones
              </div>
              <div className="rounded-xl bg-stone-50 p-4">
                Focus on repeat customer retention
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
