import Link from "next/link";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { getDashboardSummaryFromSupabase } from "@/features/dashboard/dashboard-data";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

type KpiCardProps = {
  helper: string;
  icon: string;
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
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
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

function KpiCard({ helper, icon, label, tone = "brand", value }: KpiCardProps) {
  const helperClassName = {
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    default: "bg-stone-50 text-slate-600",
  }[tone];

  return (
    <section className="group relative overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 text-2xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-sm font-black text-[#5E7F85] transition group-hover:bg-[#5E7F85] group-hover:text-white">
          {icon}
        </div>
      </div>
      <div
        className={`relative mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${helperClassName}`}
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

function ProgressRow({
  label,
  note,
  value,
}: {
  label: string;
  note: string;
  value: number;
}) {
  const safeValue = Math.max(0, Math.min(value, 100));

  return (
    <div>
      <div className="mb-2 flex justify-between gap-3 text-xs font-bold text-slate-500">
        <span>{label}</span>
        <span>{safeValue}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full bg-[#5E7F85]"
          style={{ width: `${safeValue}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-slate-500">{note}</div>
    </div>
  );
}

function getPercent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
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
  const activeOrderTotal =
    summary.newOrders + summary.packingQueue + summary.courierQueue;
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
  const priorityItems = [
    {
      helper: "Order queue",
      label:
        summary.newOrders > 0
          ? `${summary.newOrders} orders need review`
          : "No new orders waiting",
      tone: summary.newOrders > 0 ? "warn" : "good",
    },
    {
      helper: "Inventory",
      label:
        summary.lowStockProducts + summary.outOfStockProducts > 0
          ? `${summary.lowStockProducts + summary.outOfStockProducts} products need stock attention`
          : "Stock alerts clear",
      tone:
        summary.lowStockProducts + summary.outOfStockProducts > 0
          ? "bad"
          : "good",
    },
    {
      helper: "Courier",
      label:
        summary.courierQueue > 0
          ? `${summary.courierQueue} orders in courier flow`
          : "Courier queue clear",
      tone: summary.courierQueue > 0 ? "brand" : "good",
    },
    {
      helper: "COD",
      label:
        summary.codDue > 0
          ? `${formatMoney(summary.codDue)} open balance`
          : "No COD due balance",
      tone: summary.codDue > 0 ? "warn" : "good",
    },
  ] as const;
  const healthRows = [
    {
      label: "Order Flow",
      note: `${summary.deliveredOrders} delivered / ${summary.returnedOrders} returned`,
      value: getPercent(summary.deliveredOrders, summary.totalOrders),
    },
    {
      label: "Packing Readiness",
      note: `${summary.packedOrders} packed from ${summary.packingQueue} in queue`,
      value: getPercent(summary.packedOrders, summary.packingQueue),
    },
    {
      label: "Courier Progress",
      note: `${summary.shippedOrders} shipped from ${summary.courierQueue} courier-active`,
      value: getPercent(summary.shippedOrders, summary.courierQueue),
    },
    {
      label: "Stock Health",
      note: `${summary.lowStockProducts} low / ${summary.outOfStockProducts} out of stock`,
      value:
        summary.totalProducts === 0
          ? 0
          : 100 -
            getPercent(
              summary.lowStockProducts + summary.outOfStockProducts,
              summary.totalProducts,
            ),
    },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-[#5E7F85] via-[#6f949a] to-[#d9e5e1] p-6 text-white">
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
                  <div className="text-xs text-white/70">Today Focus</div>
                  <div className="mt-1 text-lg font-black">
                    {summary.newOrders} New
                  </div>
                </div>
                <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                  <div className="text-xs text-white/70">Operations</div>
                  <div className="mt-1 text-lg font-black">
                    {activeOrderTotal} Active
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
            icon="OR"
            label="Total Orders"
            value={summary.totalOrders}
          />
          <KpiCard
            helper="Confirmed to packed"
            icon="PK"
            label="Packing Queue"
            tone="warn"
            value={summary.packingQueue}
          />
          <KpiCard
            helper="Packed, shipped, courier-active"
            icon="CR"
            label="Courier Queue"
            value={summary.courierQueue}
          />
          <KpiCard
            helper="Open customer balance"
            icon="BDT"
            label="COD Due"
            tone={summary.codDue > 0 ? "warn" : "good"}
            value={formatMoney(summary.codDue)}
          />
          <KpiCard
            helper={`${summary.outOfStockProducts} out of stock`}
            icon="ST"
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
                  Operations Pulse
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  Orders to Delivery
                </h2>
              </div>
              <Badge tone="good">Live Summary</Badge>
            </div>
            <div className="mt-6 flex min-h-72 items-end gap-4 overflow-x-auto rounded-3xl bg-stone-50 p-5">
              {flowItems.map(([label, count, helper]) => {
                const numericCount = Number(count);
                const maxCount = Math.max(
                  1,
                  ...flowItems.map(([, value]) => Number(value)),
                );

                return (
                  <div
                    className="flex min-w-[7rem] flex-1 flex-col items-center gap-3"
                    key={label}
                  >
                    <div className="text-xs font-semibold text-slate-500">
                      {numericCount}
                    </div>
                    <div className="flex h-44 w-full items-end justify-center rounded-2xl bg-white p-2">
                      <div
                        className="w-9 rounded-2xl bg-[#5E7F85]"
                        style={{
                          height: `${Math.max(8, (numericCount / maxCount) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        {label}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-400">
                        {helper}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Action Priority
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  Today Must Do
                </h2>
              </div>
              <Badge tone="brand">Live Signals</Badge>
            </div>
            <div className="mt-5 space-y-3">
              {priorityItems.map((item) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-2xl bg-stone-50 px-4 py-4 text-sm"
                  key={item.helper}
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {item.label}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      {item.helper}
                    </div>
                  </div>
                  <Badge tone={item.tone}>{item.tone === "good" ? "Clear" : "Review"}</Badge>
                </div>
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
                        className="border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85]"
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
                Business Health
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Snapshot
              </h2>
              <div className="mt-5 space-y-4">
                {healthRows.map((row) => (
                  <ProgressRow
                    key={row.label}
                    label={row.label}
                    note={row.note}
                    value={row.value}
                  />
                ))}
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

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                <span className="font-semibold text-amber-700">Low stock</span>
                <b className="text-amber-700">{summary.lowStockProducts}</b>
              </div>
              <div className="flex justify-between rounded-2xl bg-rose-50 px-4 py-3">
                <span className="font-semibold text-rose-700">
                  Out of stock
                </span>
                <b className="text-rose-700">{summary.outOfStockProducts}</b>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:col-span-1 xl:col-span-2">
            <div className="text-sm font-medium text-slate-500">
              Quick Links
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              Open Live Modules
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {quickLinks.map(([label, href, helper]) => (
                <Link
                  className="flex items-center justify-between gap-4 rounded-2xl bg-stone-50 px-4 py-3 text-sm transition hover:bg-[#5E7F85]/10"
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
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#5E7F85]">
                    Open
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </section>
      </div>
    </AdminShell>
  );
}
