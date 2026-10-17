"use client";

import Link from "next/link";

import { AdminShell } from "@/components/admin/AdminShell";
import { formatBdt, useLiveDashboard } from "@/features/dashboard/use-live-dashboard";

function Kpi({
  label,
  value,
  helper,
  href,
}: {
  label: string;
  value: string;
  helper: string;
  href: string;
}) {
  return (
    <Link className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#527B86]/40" href={href}>
      <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</div>
      <div className="mt-3 text-xs font-bold text-slate-500">{helper}</div>
    </Link>
  );
}

export default function BusinessAnalyticsPage() {
  const { data, owner, error, status, updatedAt, refresh } = useLiveDashboard();
  const maxSales = Math.max(1, ...owner.trend.map((row) => row.sales));
  const deliveredRate = data.totalOrders > 0 ? (data.deliveredOrders / data.totalOrders) * 100 : 0;
  const repeatRate =
    owner.retention.known_customers > 0
      ? (owner.retention.repeat_customers / owner.retention.known_customers) * 100
      : 0;

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#527B86]">
                <span className={`h-2 w-2 rounded-full ${
                  status === "connected" ? "bg-emerald-500" : status === "error" ? "bg-rose-500" : "bg-amber-400"
                }`} />
                {status === "connected" ? "Live production analytics" : status === "error" ? "Analytics needs attention" : "Refreshing"}
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Business Analytics</h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Revenue, orders, fulfilment, COD, inventory, product demand and customer retention from the same
                production owner-dashboard source used by the Control Center.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-400">
                {updatedAt ? `Updated ${updatedAt.toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" })}` : "Waiting for data"}
              </span>
              <button
                className="rounded-2xl bg-[#527B86] px-4 py-2.5 text-sm font-black text-white disabled:opacity-40"
                disabled={status === "loading"}
                onClick={() => void refresh()}
                type="button"
              >
                {status === "loading" ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">{error}</section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Booked Revenue" value={formatBdt(data.totalRevenue)} helper="All non-cancelled order value" href="/orders" />
          <Kpi label="Total Orders" value={data.totalOrders.toLocaleString("en-BD")} helper={`${owner.today.orders} orders today`} href="/orders" />
          <Kpi label="COD Due" value={formatBdt(data.codDue)} helper={`${data.codMismatchCount} reconciliation mismatches`} href="/finance/reconciliation" />
          <Kpi label="Delivered Rate" value={`${deliveredRate.toFixed(1)}%`} helper={`${data.deliveredOrders} delivered orders`} href="/delivery-monitoring" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">7-day trend</div>
            <h2 className="mt-2 text-xl font-black text-slate-950">Booked sales & order volume</h2>
            <div className="mt-6 grid h-72 grid-cols-7 items-end gap-2">
              {owner.trend.map((row) => {
                const height = Math.max(8, (row.sales / maxSales) * 100);
                return (
                  <div className="flex h-full flex-col justify-end gap-2" key={row.date}>
                    <div className="text-center text-xs font-black text-slate-500">{row.orders}</div>
                    <div
                      className="w-full rounded-t-2xl bg-[#527B86]/85"
                      style={{ height: `${height}%` }}
                      title={`${row.label}: ${formatBdt(row.sales)} · ${row.orders} orders`}
                    />
                    <div className="text-center text-xs font-black text-slate-400">{row.label}</div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Customer retention</div>
            <h2 className="mt-2 text-xl font-black text-slate-950">Known buyer mix</h2>
            <div className="mt-5 space-y-3">
              {[
                ["Known customers", owner.retention.known_customers],
                ["Single-order customers", owner.retention.new_customers],
                ["Repeat customers", owner.retention.repeat_customers],
              ].map(([label, value]) => (
                <div className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-4" key={label}>
                  <span className="text-sm font-bold text-slate-600">{label}</span>
                  <b className="text-xl text-slate-950">{Number(value).toLocaleString("en-BD")}</b>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-[#527B86]/10 px-4 py-4 text-sm font-black text-[#527B86]">
              Repeat share: {repeatRate.toFixed(1)}%
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-end justify-between border-b border-slate-100 p-5">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Top products</div>
                <h2 className="mt-2 text-xl font-black text-slate-950">Demand from real orders</h2>
              </div>
              <Link className="text-sm font-black text-[#527B86]" href="/products">Catalog →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[620px] w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs font-black uppercase tracking-[0.1em] text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Product</th>
                    <th className="px-5 py-4">Qty</th>
                    <th className="px-5 py-4">Sales</th>
                    <th className="px-5 py-4">Avg price</th>
                    <th className="px-5 py-4">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {owner.top_products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-5 py-4 font-black text-slate-900">{product.name}</td>
                      <td className="px-5 py-4 font-bold text-slate-600">{product.quantity_sold}</td>
                      <td className="px-5 py-4 font-bold text-slate-700">{formatBdt(product.sales)}</td>
                      <td className="px-5 py-4 text-slate-600">{formatBdt(product.average_price)}</td>
                      <td className="px-5 py-4 font-bold text-slate-600">{product.stock_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Operational exceptions</div>
            <h2 className="mt-2 text-xl font-black text-slate-950">Priority signals</h2>
            <div className="mt-5 space-y-3">
              {owner.priorities.length ? (
                owner.priorities.map((priority) => (
                  <div
                    className={`flex items-center justify-between rounded-2xl border px-4 py-4 ${
                      priority.severity === "high"
                        ? "border-rose-200 bg-rose-50 text-rose-800"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}
                    key={priority.key}
                  >
                    <span className="text-sm font-black">{priority.label}</span>
                    <b className="rounded-full bg-white/80 px-3 py-1.5">{priority.count}</b>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-emerald-50 px-4 py-5 text-sm font-bold text-emerald-700">
                  No current dashboard exception.
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["New", owner.pipeline.new, "/orders"],
            ["Packing", owner.pipeline.packing, "/packing"],
            ["Shipped", owner.pipeline.shipped, "/delivery-monitoring"],
            ["Return / cancel", owner.pipeline.return_cancel, "/returns/receiving"],
          ].map(([label, value, href]) => (
            <Link className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" href={String(href)} key={label}>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</div>
              <div className="mt-2 text-3xl font-black text-slate-950">{Number(value).toLocaleString("en-BD")}</div>
            </Link>
          ))}
        </section>

        <p className="px-1 text-xs font-semibold leading-5 text-slate-400">
          Revenue is booked order value excluding cancelled orders. COD values come from reconciliation.
          Profit is intentionally excluded from headline analytics until direct-cost and ad-spend coverage is complete.
        </p>
      </div>
    </AdminShell>
  );
}
