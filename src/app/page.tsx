import Link from "next/link";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { getDashboardSummaryFromSupabase } from "@/features/dashboard/dashboard-data";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

type KpiCardProps = {
  helper: string;
  label: string;
  tone?: BadgeTone;
  value: ReactNode;
};

const quickLinks = [
  ["Products", "/products", "Catalog list and editor"],
  ["Inventory", "/inventory", "Stock and movement history"],
  ["Orders", "/orders", "Live order command center"],
  ["Packing Desk", "/packing", "Ready-to-pack operations"],
  ["Courier & Payments", "/courier", "Courier and COD queue"],
];

const disabledActions = [
  "Print Invoices",
  "Bulk Courier Upload",
  "Payment Gateway Sync",
  "Advanced COD Settlement",
];

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const className = {
    brand: "bg-[#527B86]/10 text-[#527B86]",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    default: "bg-slate-100 text-slate-600",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {children}
    </span>
  );
}

function KpiCard({ helper, label, tone = "brand", value }: KpiCardProps) {
  const helperClassName = {
    brand: "bg-[#527B86]/10 text-[#527B86]",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    default: "bg-stone-50 text-slate-600",
  }[tone];

  return (
    <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-3 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </div>
      <div
        className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${helperClassName}`}
      >
        {helper}
      </div>
    </section>
  );
}

function DisabledQuickAction({ children }: { children: ReactNode }) {
  return (
    <button
      className="flex w-full items-center justify-between rounded-2xl bg-stone-50 p-4 text-left text-sm font-semibold text-slate-400"
      disabled
      type="button"
    >
      <span>{children}</span>
      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-400">
        Not Connected
      </span>
    </button>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-BD", {
    currency: "BDT",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const summary = await getDashboardSummaryFromSupabase();
  const flowItems = [
    ["Orders", summary.totalOrders, `${summary.newOrders} new`],
    ["Packing", summary.packingQueue, `${summary.packedOrders} packed`],
    ["Courier", summary.courierQueue, `${summary.shippedOrders} shipped`],
    [
      "Delivery/Return",
      summary.deliveredOrders + summary.returnedOrders,
      `${summary.deliveredOrders} delivered / ${summary.returnedOrders} returned`,
    ],
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-[#527B86] via-[#6f949a] to-[#d9e5e1] p-6 text-white">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">
                  Overview
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight">
                  Admin Command Dashboard
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/85">
                  Live operations snapshot for catalog, orders, inventory,
                  packing, courier, COD, and stock movement workflows.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                  <div className="text-xs text-white/70">Orders</div>
                  <div className="mt-1 text-lg font-black">
                    {summary.totalOrders}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                  <div className="text-xs text-white/70">Products</div>
                  <div className="mt-1 text-lg font-black">
                    {summary.totalProducts}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                  <div className="text-xs text-white/70">COD Due</div>
                  <div className="mt-1 text-lg font-black">
                    {formatMoney(summary.codDue)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            helper={`${summary.newOrders} new`}
            label="Total Orders"
            value={summary.totalOrders}
          />
          <KpiCard
            helper="Confirmed to packed"
            label="Packing Queue"
            tone="warn"
            value={summary.packingQueue}
          />
          <KpiCard
            helper="Packed, shipped, courier-active"
            label="Courier Queue"
            value={summary.courierQueue}
          />
          <KpiCard
            helper="Open customer balance"
            label="COD Due"
            tone={summary.codDue > 0 ? "warn" : "good"}
            value={formatMoney(summary.codDue)}
          />
          <KpiCard
            helper={`${summary.outOfStockProducts} out of stock`}
            label="Low Stock"
            tone={
              summary.lowStockProducts || summary.outOfStockProducts
                ? "bad"
                : "good"
            }
            value={`${summary.lowStockProducts} / ${summary.outOfStockProducts}`}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_390px]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Operations Flow
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  Orders to Delivery
                </h2>
              </div>
              <Badge tone="good">Live Summary</Badge>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-4">
              {flowItems.map(([label, count, helper]) => (
                <div
                  className="rounded-2xl border border-slate-200 bg-stone-50 p-4"
                  key={label}
                >
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    {label}
                  </div>
                  <div className="mt-3 text-3xl font-black text-slate-950">
                    {count}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-500">
                    {helper}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Quick Links
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              Open Live Modules
            </h2>
            <div className="mt-5 space-y-3">
              {quickLinks.map(([label, href, helper]) => (
                <Link
                  className="flex items-center justify-between gap-4 rounded-2xl bg-stone-50 px-4 py-3 text-sm transition hover:bg-[#527B86]/10"
                  href={href}
                  key={href}
                >
                  <span>
                    <span className="block font-bold text-slate-950">
                      {label}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">
                      {helper}
                    </span>
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#527B86]">
                    Open
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_390px]">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-6">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Recent Activity
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  Inventory Movements
                </h2>
              </div>
              <Badge tone="brand">Latest 5</Badge>
            </div>
            {summary.latestInventoryMovements.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-stone-50 text-slate-500">
                    <tr>
                      {["Product", "Movement", "Quantity", "Stock"].map(
                        (heading) => (
                          <th className="px-5 py-4 font-medium" key={heading}>
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {summary.latestInventoryMovements.map((movement) => (
                      <tr
                        className="border-t border-slate-100 transition hover:bg-stone-50"
                        key={movement.id}
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-950">
                            {movement.product_name ?? "Unknown product"}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {movement.product_sku ?? "No SKU"}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone="default">
                            {formatStatus(movement.movement_type)}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-800">
                          {movement.quantity}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {movement.previous_stock} to {movement.new_stock}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-sm font-semibold text-slate-500">
                No inventory movement rows found yet.
              </div>
            )}
          </section>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Inventory Watch
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Stock Health
              </h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between rounded-2xl bg-stone-50 px-4 py-3">
                  <span className="font-semibold text-slate-500">
                    Total products
                  </span>
                  <b>{summary.totalProducts}</b>
                </div>
                <div className="flex justify-between rounded-2xl bg-amber-50 px-4 py-3">
                  <span className="font-semibold text-amber-700">
                    Low stock
                  </span>
                  <b className="text-amber-700">{summary.lowStockProducts}</b>
                </div>
                <div className="flex justify-between rounded-2xl bg-rose-50 px-4 py-3">
                  <span className="font-semibold text-rose-700">
                    Out of stock
                  </span>
                  <b className="text-rose-700">
                    {summary.outOfStockProducts}
                  </b>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Quick Actions
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Still Not Connected
              </h2>
              <div className="mt-5 space-y-3">
                {disabledActions.map((item) => (
                  <DisabledQuickAction key={item}>{item}</DisabledQuickAction>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
