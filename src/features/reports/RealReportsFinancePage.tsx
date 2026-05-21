import Link from "next/link";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import type { ReportsFinanceSummary } from "./reports-data";

type RealReportsFinancePageProps = {
  summary: ReportsFinanceSummary;
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

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
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize ${className}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  helper,
  index,
  label,
  tone = "brand",
  value,
}: {
  helper: string;
  index: number;
  label: string;
  tone?: BadgeTone;
  value: ReactNode;
}) {
  const icons = ["R", "O", "C", "!"];
  const helperClassName = {
    brand: "bg-[#527B86]/10 text-[#527B86]",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    default: "bg-stone-50 text-slate-600",
  }[tone];

  return (
    <section className="group relative overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#527B86]/5 transition group-hover:bg-[#527B86]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#527B86]/10 text-sm font-black text-[#527B86]">
          {icons[index % icons.length]}
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

function DisabledButton({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const className = {
    brand: "border-[#527B86]/20 bg-[#527B86]/10 text-[#527B86]",
    good: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warn: "border-amber-200 bg-amber-50 text-amber-700",
    bad: "border-rose-200 bg-rose-50 text-rose-700",
    default: "border-slate-200 bg-white text-slate-500",
  }[tone];

  return (
    <button
      className={`rounded-2xl border px-4 py-3 text-sm font-semibold opacity-75 ${className}`}
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-bold text-slate-700 transition hover:border-[#527B86]/30 hover:bg-[#527B86]/5 hover:text-[#527B86]"
      href={href}
    >
      {label}
    </Link>
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

function ReportCard({
  badge,
  helper,
  label,
  tone = "brand",
}: {
  badge: string;
  helper: string;
  label: string;
  tone?: BadgeTone;
}) {
  return (
    <section className="rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#527B86]/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#527B86]/10 text-sm font-black text-[#527B86]">
          {badge.slice(0, 1)}
        </div>
        <Badge tone={tone}>{badge}</Badge>
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-950">{label}</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
        {helper}
      </p>
      <div className="mt-5 flex gap-2">
        <DisabledButton tone="brand">View - Not Connected</DisabledButton>
        <DisabledButton>Download - Not Connected</DisabledButton>
      </div>
    </section>
  );
}

export function RealReportsFinancePage({
  summary,
}: RealReportsFinancePageProps) {
  const collectionGap = Math.max(summary.grossSales - summary.paidAmount, 0);

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                Reports & Insights
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Reports & Finance
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                Live read-only reporting from orders, payments, courier
                statuses, products, and inventory movement history. Report
                generation, filters, export, and reconciliation remain offline.
              </p>
            </div>
            <div className="flex flex-col gap-3 xl:items-end">
              <div className="flex flex-wrap gap-2">
                {["Today", "7D", "30D", "This Month"].map((item) => (
                  <button
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 opacity-75"
                    disabled
                    key={item}
                    type="button"
                  >
                    {item} - N/C
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <DisabledButton>From Date - Not Connected</DisabledButton>
                <DisabledButton>To Date - Not Connected</DisabledButton>
                <DisabledButton tone="brand">Apply Filter - N/C</DisabledButton>
                <DisabledButton>Export All - N/C</DisabledButton>
              </div>
            </div>
          </div>
          <div className="mx-6 mb-5 rounded-2xl border border-[#527B86]/15 bg-[#527B86]/5 px-5 py-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#527B86]">
              Selected Report
            </div>
            <div className="mt-1 text-lg font-bold text-slate-950">
              Live Operations Summary
            </div>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
              Gross sales, collection, order health, courier status, and
              inventory movement data are calculated from live Supabase rows.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="All order totals"
            index={0}
            label="Gross Sales"
            value={formatMoney(summary.grossSales)}
          />
          <StatCard
            helper={`${summary.totalOrders} total orders`}
            index={1}
            label="Orders"
            value={summary.totalOrders}
          />
          <StatCard
            helper="Paid / gross sales"
            index={2}
            label="Collection Rate"
            tone={summary.paymentCollectionRate >= 80 ? "good" : "warn"}
            value={formatPercent(summary.paymentCollectionRate)}
          />
          <StatCard
            helper={`${summary.dueOrders} orders with due`}
            index={3}
            label="COD Risk / Due"
            tone={summary.totalDue ? "warn" : "good"}
            value={formatMoney(summary.totalDue)}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper={`${summary.paidOrders} paid orders`}
            index={0}
            label="Paid Amount"
            tone="good"
            value={formatMoney(summary.paidAmount)}
          />
          <StatCard
            helper={`${summary.deliveredOrders} delivered`}
            index={1}
            label="Delivered Sales"
            tone="good"
            value={formatMoney(summary.deliveredSales)}
          />
          <StatCard
            helper={`${summary.returnedOrders} returned`}
            index={2}
            label="Returned Value"
            tone={summary.returnedValue ? "bad" : "good"}
            value={formatMoney(summary.returnedValue)}
          />
          <StatCard
            helper={`${summary.cancelledOrders} cancelled`}
            index={3}
            label="Cancelled Value"
            tone={summary.cancelledValue ? "bad" : "good"}
            value={formatMoney(summary.cancelledValue)}
          />
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Business Reports
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  Live Report Categories
                </h2>
              </div>
              <Badge tone="default">Generation Not Connected</Badge>
            </div>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
            <ReportCard
              badge="Sales"
              helper={`${formatMoney(summary.grossSales)} gross sales from live orders.`}
              label="Sales Report"
            />
            <ReportCard
              badge="Orders"
              helper={`${summary.deliveredOrders} delivered, ${summary.returnedOrders} returned, ${summary.cancelledOrders} cancelled.`}
              label="Order Report"
              tone="good"
            />
            <ReportCard
              badge="COD"
              helper={`${formatMoney(summary.totalDue)} due across ${summary.dueOrders} orders.`}
              label="COD Risk Report"
              tone={summary.totalDue ? "warn" : "good"}
            />
            <ReportCard
              badge="Products"
              helper={`${summary.lowStockProducts} low stock and ${summary.outOfStockProducts} out of stock products.`}
              label="Product Report"
            />
            <ReportCard
              badge="Courier"
              helper={`${summary.courierSent} sent, ${summary.courierDelivered} delivered, ${summary.courierReturned} returned.`}
              label="Courier Report"
            />
            <ReportCard
              badge="Customers"
              helper="Customer report generation waits for a dedicated customer data model."
              label="Customer Report"
              tone="default"
            />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                helper="All statuses"
                index={0}
                label="Total Orders"
                value={summary.totalOrders}
              />
              <StatCard
                helper="Delivered / total"
                index={1}
                label="Delivery Success"
                tone={summary.deliverySuccessRate >= 80 ? "good" : "warn"}
                value={formatPercent(summary.deliverySuccessRate)}
              />
              <StatCard
                helper="Returned / total"
                index={2}
                label="Return Rate"
                tone={summary.returnRate > 10 ? "bad" : "good"}
                value={formatPercent(summary.returnRate)}
              />
              <StatCard
                helper="Inventory movement rows"
                index={3}
                label="Recent Movements"
                value={summary.recentMovementCount}
              />
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Recent Activity
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
                          "Order Status",
                          "Payment",
                          "Courier",
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
                          className="border-t border-slate-100 align-top transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#527B86]"
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
                          <td className="px-5 py-4">
                            <Badge>{formatStatus(order.courier_status)}</Badge>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {formatDate(order.created_at)}
                          </td>
                          <td className="px-5 py-4">
                            <Link
                              className="inline-flex rounded-xl bg-[#527B86]/10 px-3 py-2 text-xs font-bold text-[#527B86] transition hover:bg-[#527B86] hover:text-white"
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
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Inventory Activity
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Latest Inventory Movements
                  </h2>
                </div>
                <Badge tone="brand">
                  {summary.latestInventoryMovements.length} movements
                </Badge>
              </div>
              {summary.latestInventoryMovements.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-stone-50 text-slate-500">
                      <tr>
                        {[
                          "Type",
                          "Quantity",
                          "Previous",
                          "New",
                          "Note",
                          "Created",
                        ].map((heading) => (
                          <th className="px-5 py-4 font-medium" key={heading}>
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {summary.latestInventoryMovements.map((movement) => (
                        <tr
                          className="border-t border-slate-100 align-top transition hover:bg-stone-50"
                          key={movement.id}
                        >
                          <td className="px-5 py-4">
                            <Badge tone="brand">
                              {formatStatus(movement.movement_type)}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-800">
                            {movement.quantity}
                          </td>
                          <td className="px-5 py-4 text-slate-700">
                            {movement.previous_stock}
                          </td>
                          <td className="px-5 py-4 text-slate-700">
                            {movement.new_stock}
                          </td>
                          <td className="max-w-[280px] px-5 py-4 text-slate-600">
                            {formatText(movement.note)}
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {formatDate(movement.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-12 text-center text-sm font-semibold text-slate-500">
                  No recent inventory movements found.
                </div>
              )}
            </section>
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
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-8 border-[#527B86]/15 bg-white">
                  <div className="text-center">
                    <div className="text-2xl font-black text-[#527B86]">
                      {formatPercent(summary.paymentCollectionRate)}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Collected
                    </div>
                  </div>
                </div>
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Expected COD/Gross</dt>
                  <dd className="font-bold text-slate-800">
                    {formatMoney(summary.grossSales)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Received/Paid</dt>
                  <dd className="font-bold text-emerald-700">
                    {formatMoney(summary.paidAmount)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Pending/Due</dt>
                  <dd className="font-bold text-amber-700">
                    {formatMoney(summary.totalDue)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Collection Gap</dt>
                  <dd className="font-bold text-rose-600">
                    {formatMoney(collectionGap)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Quick Links
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Operations
              </h2>
              <div className="mt-5 grid gap-3">
                <QuickLink href="/orders" label="Orders" />
                <QuickLink href="/inventory" label="Inventory" />
                <QuickLink href="/courier" label="Courier & Payments" />
                <QuickLink href="/customers" label="Customers" />
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Courier Snapshot
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Courier Status
              </h2>
              <dl className="mt-5 space-y-3 text-sm">
                {[
                  ["Ready", summary.courierReady],
                  ["Sent", summary.courierSent],
                  ["Delivered", summary.courierDelivered],
                  ["Returned", summary.courierReturned],
                  ["Failed", summary.courierFailed],
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
                <p>Export/download and generated report archives are not connected.</p>
                <p>Payment gateway sync is pending.</p>
              </div>
            </section>
          </aside>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Business Intelligence
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              Operational Notes
            </h2>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-stone-50 px-4 py-4 text-sm font-semibold text-slate-700">
                Collection rate is calculated from live paid amount divided by
                gross sales.
              </div>
              <div className="rounded-2xl bg-stone-50 px-4 py-4 text-sm font-semibold text-slate-700">
                COD risk is represented by total due, due orders, returns, and
                courier return counts.
              </div>
              <div className="rounded-2xl bg-stone-50 px-4 py-4 text-sm font-semibold text-slate-700">
                Inventory health uses live product stock and movement history.
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="text-sm font-medium text-slate-500">
                Report Archive
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Generated Files
              </h2>
            </div>
            <div className="grid gap-3 p-6 md:grid-cols-2">
              {[
                "Sales Summary",
                "Profit Report",
                "COD Risk Orders",
                "Courier Settlement",
              ].map((label) => (
                <div
                  className="rounded-2xl border border-slate-200 bg-stone-50 p-4"
                  key={label}
                >
                  <div className="font-bold text-slate-900">{label}</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">
                    Export/download not connected
                  </div>
                  <div className="mt-3">
                    <Badge tone="default">Not Connected</Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
