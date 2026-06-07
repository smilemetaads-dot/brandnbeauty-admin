import Link from "next/link";
import type { ReactNode } from "react";

import {
  AdminBadge,
  AdminChartCard,
  AdminSectionCard,
  AdminTable,
  AdminTableHead,
} from "@/components/admin/AdminUiPrimitives";
import { AdminShell } from "@/components/admin/AdminShell";
import { getDashboardSummaryFromSupabase } from "@/features/dashboard/dashboard-data";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const dashboardShortcuts = [
  ["Confirm Orders", "/orders"],
  ["Print Invoices", "/orders/details/invoice"],
  ["Send Courier", "/courier"],
  ["Create Purchase Entry", "/purchases"],
];

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

function PriorityRow({
  children,
  helper,
  tone,
}: {
  children: ReactNode;
  helper: string;
  tone: BadgeTone;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-stone-50 px-4 py-4 text-sm">
      <div>
        <div className="font-bold text-slate-900">{children}</div>
        <div className="mt-1 text-xs font-semibold text-slate-500">
          {helper}
        </div>
      </div>
      <AdminBadge tone={tone}>{tone === "bad" ? "High" : "Medium"}</AdminBadge>
    </div>
  );
}

function EmptyTableRow({ children }: { children: ReactNode }) {
  return (
    <tr className="border-t border-slate-100">
      <td className="px-5 py-12 text-sm font-semibold text-slate-500" colSpan={6}>
        {children}
      </td>
    </tr>
  );
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const summary = await getDashboardSummaryFromSupabase();
  const readyForDispatch = summary.packingQueue + summary.courierQueue;
  const stockAlertTotal = summary.lowStockProducts + summary.outOfStockProducts;
  const activeOrderTotal =
    summary.newOrders + summary.packingQueue + summary.courierQueue;
  const maxChartValue = Math.max(
    summary.totalOrders,
    activeOrderTotal,
    summary.packingQueue,
    summary.packedOrders,
    summary.courierQueue,
    summary.shippedOrders,
    summary.deliveredOrders,
    1,
  );
  const chartBars = [
    {
      label: "Mon",
      value: summary.totalOrders,
      valueLabel: `${summary.totalOrders} orders`,
    },
    {
      label: "Tue",
      value: summary.newOrders,
      valueLabel: `${summary.newOrders} new`,
    },
    {
      label: "Wed",
      value: summary.packingQueue,
      valueLabel: `${summary.packingQueue} packing`,
    },
    {
      label: "Thu",
      value: summary.packedOrders,
      valueLabel: `${summary.packedOrders} packed`,
    },
    {
      label: "Fri",
      value: summary.courierQueue,
      valueLabel: `${summary.courierQueue} courier`,
    },
    {
      label: "Sat",
      value: summary.shippedOrders,
      valueLabel: `${summary.shippedOrders} shipped`,
    },
    {
      label: "Sun",
      value: summary.deliveredOrders,
      valueLabel: `${summary.deliveredOrders} delivered`,
    },
  ].map((bar) => ({
    ...bar,
    value: Math.max(bar.value, maxChartValue ? 0.08 : 0),
  }));
  const priorityItems = [
    {
      helper: "Order queue",
      label:
        summary.newOrders > 0
          ? `${summary.newOrders} orders need confirmation`
          : "No new orders waiting",
      tone: summary.newOrders > 0 ? "bad" : "good",
    },
    {
      helper: "Inventory",
      label:
        stockAlertTotal > 0
          ? `${stockAlertTotal} products need stock attention`
          : "Stock alerts clear",
      tone: stockAlertTotal > 0 ? "warn" : "good",
    },
    {
      helper: "Courier",
      label:
        summary.courierQueue > 0
          ? `${summary.courierQueue} parcels need courier follow-up`
          : "Courier queue clear",
      tone: summary.courierQueue > 0 ? "bad" : "good",
    },
    {
      helper: "Finance",
      label:
        summary.codDue > 0
          ? `${formatMoney(summary.codDue)} COD balance open`
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
      label: "Stock Health",
      note: `${summary.lowStockProducts} low / ${summary.outOfStockProducts} out of stock`,
      value:
        summary.totalProducts === 0
          ? 0
          : 100 - getPercent(stockAlertTotal, summary.totalProducts),
    },
    {
      label: "COD Balance",
      note:
        summary.codDue > 0
          ? `${formatMoney(summary.codDue)} open COD`
          : "No COD due balance",
      value: summary.codDue > 0 ? 0 : 100,
    },
    {
      label: "Courier Readiness",
      note: `${readyForDispatch} ready or courier-active parcels`,
      value: getPercent(readyForDispatch, Math.max(summary.totalOrders, 1)),
    },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#5E7F85] via-[#6f949a] to-[#d9e5e1] p-6 text-white">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/15" />
            <div className="absolute bottom-0 left-1/2 h-36 w-36 rounded-full bg-white/10" />
            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">
                  Overview
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight">
                  Admin Command Dashboard
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/85">
                  One clean control room for orders, stock, courier, finance,
                  suppliers and growth signals.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                  <div className="text-xs text-white/70">Today Focus</div>
                  <div className="mt-1 text-lg font-black">
                    {summary.totalOrders} Orders
                  </div>
                </div>
                <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                  <div className="text-xs text-white/70">Dispatch</div>
                  <div className="mt-1 text-lg font-black">
                    {readyForDispatch} Ready
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

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <AdminChartCard
            bars={chartBars}
            label="Sales Trend"
            title="Weekly Revenue Overview"
          />

          <AdminSectionCard
            actions={<AdminBadge tone="warn">4 Alerts</AdminBadge>}
            subtitle="Action Priority"
            title="Today Must Do"
          >
            <div className="mt-5 space-y-3">
              {priorityItems.map((item) => (
                <PriorityRow
                  helper={item.helper}
                  key={item.helper}
                  tone={item.tone}
                >
                  {item.label}
                </PriorityRow>
              ))}
            </div>
          </AdminSectionCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_390px]">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-6">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Operations
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  Recent Orders
                </h2>
              </div>
              <AdminBadge tone="brand">Live</AdminBadge>
            </div>
            <div className="overflow-x-auto">
              <AdminTable>
                <AdminTableHead>
                  <tr>
                    {["Order", "Customer", "Amount", "Source", "Status", "Action"].map(
                      (heading) => (
                        <th className="px-5 py-4 font-medium" key={heading}>
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </AdminTableHead>
                <tbody>
                  <EmptyTableRow>
                    Recent order rows are not loaded by the current dashboard
                    summary. Open Orders for live row-level order data.
                  </EmptyTableRow>
                </tbody>
              </AdminTable>
            </div>
          </section>

          <div className="space-y-6">
            <AdminSectionCard subtitle="Business Health" title="Snapshot">
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
            </AdminSectionCard>

            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">ERP Note</div>
              <div className="mt-2 text-sm leading-6 text-amber-700">
                Dashboard should stay summary-only. Detailed actions should
                happen inside Orders, Inventory, Courier and Finance pages.
              </div>
            </section>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <AdminSectionCard subtitle="Low Stock Alert" title="Restock Watch">
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <b>Total products</b>
                  <span className="font-bold text-slate-700">
                    {summary.totalProducts}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Live catalog count
                </div>
              </div>
              <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <b>Low stock products</b>
                  <span className="font-bold text-amber-700">
                    {summary.lowStockProducts} left
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">Reorder soon</div>
              </div>
              <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <b>Out of stock products</b>
                  <span className="font-bold text-rose-700">
                    {summary.outOfStockProducts} left
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">Sales blocked</div>
              </div>
            </div>
          </AdminSectionCard>

          <AdminSectionCard subtitle="Top Products" title="Sales Winners">
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <b>Live winners unavailable</b>
                  <span className="font-bold text-[#5E7F85]">
                    {summary.totalOrders} orders
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Dashboard summary does not load product-level sales rankings.
                </div>
              </div>
              {summary.latestInventoryMovements.slice(0, 2).map((movement, index) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm"
                  key={movement.id}
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      #{index + 2} {movement.product_name ?? "Unknown product"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {formatStatus(movement.movement_type)}
                    </div>
                  </div>
                  <b className="text-[#5E7F85]">{movement.quantity}</b>
                </div>
              ))}
            </div>
          </AdminSectionCard>

          <AdminSectionCard
            className="md:col-span-2 xl:col-span-1"
            subtitle="Quick Actions"
            title="Control Shortcuts"
          >
            <div className="mt-5 space-y-3">
              {dashboardShortcuts.map(([label, href]) => (
                <Link
                  className="group flex w-full items-center justify-between rounded-2xl bg-stone-50 p-4 text-left text-sm font-semibold text-slate-700 transition hover:bg-stone-100"
                  href={href}
                  key={href}
                >
                  <span>{label}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5E7F85]/10 text-sm font-bold text-[#5E7F85] transition group-hover:translate-x-0.5 group-hover:bg-[#5E7F85] group-hover:text-white">
                    &gt;
                  </span>
                </Link>
              ))}
            </div>
          </AdminSectionCard>
        </section>
      </div>
    </AdminShell>
  );
}
