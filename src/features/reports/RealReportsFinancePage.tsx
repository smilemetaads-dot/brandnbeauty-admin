import Link from "next/link";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import type { ReportsFinanceSummary } from "./reports-data";

type RealReportsFinancePageProps = {
  summary: ReportsFinanceSummary;
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

type KpiItem = {
  active?: boolean;
  helper: string;
  label: string;
  value: ReactNode;
};

type ReportCardItem = {
  badge: string;
  helper: string;
  icon: string;
  title: string;
  tone?: BadgeTone;
};

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
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize ${className}`}
    >
      {children}
    </span>
  );
}

function DisabledButton({
  children,
  primary = false,
}: {
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      className={
        primary
          ? "rounded-2xl bg-[#5E7F85] px-6 py-3 text-sm font-semibold text-white opacity-60 shadow-sm"
          : "rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-400 shadow-sm"
      }
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function StatCard({ item, index }: { index: number; item: KpiItem }) {
  return (
    <section
      className={`rounded-[2rem] border bg-white p-5 shadow-sm transition ${
        item.active
          ? "border-[#5E7F85] ring-2 ring-[#5E7F85]/15"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-500">{item.label}</div>
          <div className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950">
            {item.value}
          </div>
        </div>
        <div
          className={
            item.active
              ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xs font-black text-[#5E7F85]"
              : "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-xs font-black text-slate-500"
          }
        >
          {String(index + 1).padStart(2, "0")}
        </div>
      </div>
      <div className="mt-4 text-xs font-bold text-slate-400">
        {item.helper}
      </div>
    </section>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-BD", {
    currency: "BDT",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

function formatStatus(value: string | null) {
  return value ? value.replaceAll("_", " ") : "not set";
}

function formatText(value: string | null) {
  return value || "Not available";
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getOrderStatusTone(status: string | null): BadgeTone {
  if (status === "delivered") {
    return "good";
  }

  if (status === "cancelled" || status === "returned") {
    return "bad";
  }

  if (status === "new" || status === "processing") {
    return "warn";
  }

  return "brand";
}

function getPaymentStatusTone(status: string | null): BadgeTone {
  if (status === "paid") {
    return "good";
  }

  if (status === "failed" || status === "refunded") {
    return "bad";
  }

  return "warn";
}

function ReportCard({ report }: { report: ReportCardItem }) {
  return (
    <section className="group rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#5E7F85]/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-lg font-black text-[#5E7F85]">
          {report.icon}
        </div>
        <Badge tone={report.tone ?? "brand"}>{report.badge}</Badge>
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-950">{report.title}</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
        {report.helper}
      </p>
      <div className="mt-5 flex gap-2">
        <button
          className="rounded-xl bg-[#5E7F85]/10 px-4 py-2.5 text-sm font-semibold text-[#5E7F85] opacity-70"
          disabled
          type="button"
        >
          View
        </button>
        <button
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-400"
          disabled
          type="button"
        >
          Download
        </button>
      </div>
    </section>
  );
}

export function RealReportsFinancePage({
  summary,
}: RealReportsFinancePageProps) {
  const collectionGap = Math.max(summary.grossSales - summary.paidAmount, 0);
  const kpis: KpiItem[] = [
    {
      active: true,
      helper: "Live gross order value",
      label: "Revenue",
      value: formatMoney(summary.grossSales),
    },
    {
      helper: `${summary.newOrders + summary.confirmedOrders} need action`,
      label: "Orders",
      value: summary.totalOrders,
    },
    {
      active: true,
      helper: "Paid amount only",
      label: "Net Profit",
      value: formatMoney(summary.paidAmount),
    },
    {
      active: summary.totalDue > 0,
      helper: `${summary.dueOrders} due orders`,
      label: "COD Risk",
      value: formatPercent(summary.returnRate),
    },
  ];
  const reportCards: ReportCardItem[] = [
    {
      badge: "Revenue",
      helper: `${formatMoney(summary.grossSales)} gross sales from live orders.`,
      icon: "BDT",
      title: "Sales Report",
    },
    {
      badge: "Orders",
      helper: `${summary.deliveredOrders} delivered, ${summary.returnedOrders} returned, ${summary.cancelledOrders} cancelled.`,
      icon: "ORD",
      title: "Order Report",
    },
    {
      badge: "Profit",
      helper: `${formatMoney(summary.paidAmount)} paid amount with ${formatMoney(collectionGap)} collection gap.`,
      icon: "UP",
      title: "Profit Report",
      tone: "good",
    },
    {
      badge: "Products",
      helper: `${summary.lowStockProducts} low stock and ${summary.outOfStockProducts} out of stock products.`,
      icon: "PRD",
      title: "Product Report",
    },
    {
      badge: "Customers",
      helper: "Customer report generation waits for a dedicated customer data model.",
      icon: "CUS",
      title: "Customer Report",
      tone: "default",
    },
    {
      badge: "Risk",
      helper: `${formatMoney(summary.totalDue)} due value across ${summary.dueOrders} orders.`,
      icon: "!",
      title: "COD Risk Report",
      tone: summary.totalDue ? "warn" : "good",
    },
    {
      badge: "Courier",
      helper: `${summary.courierSent} sent, ${summary.courierDelivered} delivered, ${summary.courierReturned} returned.`,
      icon: "CAR",
      title: "Courier Report",
    },
    {
      badge: "Ads",
      helper: "Ad channel analytics are not connected to live data yet.",
      icon: "AD",
      title: "Ad Channel Report",
      tone: "default",
    },
  ];
  const intelligence = [
    [
      `Collection rate is ${formatPercent(summary.paymentCollectionRate)} from live paid amount.`,
      "Growth",
      "01",
    ],
    [
      `${summary.returnedOrders} returned orders and ${summary.courierReturned} courier returns need review.`,
      "Risk",
      "02",
    ],
    [
      `${summary.lowStockProducts + summary.outOfStockProducts} products need stock attention.`,
      "Product",
      "03",
    ],
    [
      `${summary.recentMovementCount} inventory movement rows available for reporting.`,
      "Ops",
      "04",
    ],
  ];
  const nextActions = [
    ["Review COD due orders before courier settlement", "COD Risk"],
    ["Prioritize order confirmation and packing flow", "Orders"],
    ["Protect low-stock and out-of-stock products", "Inventory"],
    ["Use live report data before manual campaign scaling", "Analytics"],
  ];
  const exports = [
    "Export VIP Customers",
    "Export COD Risk Orders",
    "Export Profit Sheet",
    "Export Courier Mismatch",
    "Export Low Stock Products",
  ];
  const generatedFiles = [
    ["Sales Summary", "Live", "Reports", "PDF", "Preview only"],
    ["Profit Report", "Live", "Finance", "CSV", "Preview only"],
    ["COD Risk Orders", "Live", "Operations", "CSV", "Preview only"],
    ["Courier Settlement", "Live", "Finance", "XLSX", "Preview only"],
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item, index) => (
            <StatCard index={index} item={item} key={item.label} />
          ))}
        </section>

        <section className="overflow-visible rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <h1 className="pt-1 text-xl font-bold tracking-tight text-slate-950">
                Business Reports
              </h1>
              <div className="flex flex-col items-start gap-3 xl:items-end">
                <div className="flex flex-wrap gap-2">
                  {["Today", "7D", "30D", "This Month"].map((item, index) => (
                    <button
                      className={
                        index === 1
                          ? "rounded-full bg-[#5E7F85] px-4 py-2 text-xs font-semibold text-white"
                          : "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-400"
                      }
                      disabled
                      key={item}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <DisabledButton>From</DisabledButton>
                  <DisabledButton>To</DisabledButton>
                  <DisabledButton primary>Apply Filter</DisabledButton>
                  <DisabledButton>Export All</DisabledButton>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-6 mb-5 flex flex-col gap-3 rounded-2xl border border-[#5E7F85]/15 bg-[#5E7F85]/5 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#5E7F85]">
                Selected Report
              </div>
              <div className="mt-1 text-lg font-bold text-slate-950">
                Sales Report
              </div>
            </div>
            <p className="max-w-2xl text-sm font-medium leading-6 text-slate-600">
              Live revenue, order, payment, courier, and inventory values are
              read from the existing reports summary. Report generation and
              downloads are not connected.
            </p>
          </div>

          <div className="grid gap-4 px-6 pb-6 md:grid-cols-2 xl:grid-cols-4">
            {reportCards.map((report) => (
              <ReportCard key={report.title} report={report} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Insights Engine
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              Business Intelligence
            </h2>
            <div className="mt-5 space-y-3">
              {intelligence.map(([text, tag, icon]) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-2xl bg-stone-50 px-4 py-4 text-sm"
                  key={text}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-bold text-[#5E7F85] shadow-sm">
                      {icon}
                    </span>
                    <span className="font-semibold text-slate-700">{text}</span>
                  </div>
                  <Badge tone={tag === "Risk" ? "warn" : "brand"}>{tag}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Action Planner
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              Next Best Actions
            </h2>
            <div className="mt-5 space-y-3">
              {nextActions.map(([text, sub], index) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-2xl bg-stone-50 px-4 py-4 text-sm"
                  key={text}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-500 shadow-sm">
                      {index + 1}
                    </span>
                    <span>
                      <div className="font-semibold text-slate-700">{text}</div>
                      <div className="mt-1 text-xs text-[#5E7F85]">{sub}</div>
                    </span>
                  </div>
                  <button
                    className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-bold text-[#5E7F85] opacity-70"
                    disabled
                    type="button"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.15fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Segment Export
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              Smart Segment Export
            </h2>
            <div className="mt-5 space-y-3">
              {exports.map((item) => (
                <div
                  className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-4 text-sm font-semibold text-slate-700"
                  key={item}
                >
                  <span>{item}</span>
                  <button
                    className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-bold text-[#5E7F85] opacity-70"
                    disabled
                    type="button"
                  >
                    Export
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="text-sm font-medium text-slate-500">
                Report Archive
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Generated Files
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-slate-500">
                  <tr>
                    {["Report", "Date", "Owner", "Type", "Status", "Action"].map(
                      (heading) => (
                        <th className="px-5 py-4 font-medium" key={heading}>
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {generatedFiles.map(([report, date, owner, type, status]) => (
                    <tr
                      className="border-t border-slate-100 transition hover:bg-stone-50"
                      key={report}
                    >
                      <td className="px-5 py-4 font-bold text-slate-950">
                        {report}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{date}</td>
                      <td className="px-5 py-4 text-slate-600">{owner}</td>
                      <td className="px-5 py-4">
                        <Badge tone="brand">{type}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone="default">{status}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-bold text-[#5E7F85] opacity-70"
                            disabled
                            type="button"
                          >
                            Open
                          </button>
                          <button
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-400"
                            disabled
                            type="button"
                          >
                            Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Live Report Preview
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  Latest Orders
                </h2>
              </div>
              <Badge tone="brand">{summary.latestOrders.length} orders</Badge>
            </div>
            {summary.latestOrders.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-stone-50 text-slate-500">
                    <tr>
                      {[
                        "Order",
                        "Customer",
                        "Total",
                        "Status",
                        "Payment",
                        "Created",
                        "Action",
                      ].map((heading) => (
                        <th className="px-5 py-4 font-medium" key={heading}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {summary.latestOrders.map((order) => (
                      <tr
                        className="border-t border-slate-100 align-top transition hover:bg-stone-50"
                        key={order.id}
                      >
                        <td className="px-5 py-4 font-black text-slate-950">
                          {order.order_number ?? "No order number"}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {formatText(order.customer_name)}
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-800">
                          {formatMoney(order.total)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={getOrderStatusTone(order.order_status)}>
                            {formatStatus(order.order_status)}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            tone={getPaymentStatusTone(order.payment_status)}
                          >
                            {formatStatus(order.payment_status)}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            className="inline-flex rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-bold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white"
                            href={`/orders/details?id=${order.id}`}
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-sm font-semibold text-slate-500">
                No recent orders found.
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                COD Collection Health
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Finance Snapshot
              </h2>
              <div className="mt-5 flex items-center justify-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-8 border-[#5E7F85]/15 bg-white">
                  <div className="text-center">
                    <div className="text-2xl font-black text-[#5E7F85]">
                      {formatPercent(summary.paymentCollectionRate)}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Collected
                    </div>
                  </div>
                </div>
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                {[
                  ["Expected COD/Gross", formatMoney(summary.grossSales)],
                  ["Received/Paid", formatMoney(summary.paidAmount)],
                  ["Pending/Due", formatMoney(summary.totalDue)],
                  ["Collection Gap", formatMoney(collectionGap)],
                ].map(([label, value]) => (
                  <div className="flex justify-between" key={label}>
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="font-bold text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                Finance Note
              </div>
              <div className="mt-3 space-y-3 text-sm font-semibold leading-6 text-amber-700">
                <p>Advanced COD reconciliation not connected yet.</p>
                <p>Export/download and generated report archives are preview-only.</p>
                <p>Payment gateway sync is pending.</p>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
