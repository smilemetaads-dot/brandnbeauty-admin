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
  label,
  tone = "brand",
  value,
}: {
  helper: string;
  label: string;
  tone?: BadgeTone;
  value: ReactNode;
}) {
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

export function RealReportsFinancePage({
  summary,
}: RealReportsFinancePageProps) {
  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                Reports & Finance
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Reports & Finance
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                Live read-only reporting from orders, payments, courier
                statuses, products, and inventory movement history.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">Live Data</Badge>
              <Badge tone="default">Read Only</Badge>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard
            helper="All order totals"
            label="Gross Sales"
            value={formatMoney(summary.grossSales)}
          />
          <StatCard
            helper={`${summary.paidOrders} paid orders`}
            label="Paid Amount"
            tone="good"
            value={formatMoney(summary.paidAmount)}
          />
          <StatCard
            helper={`${summary.dueOrders} orders with due`}
            label="Total Due"
            tone={summary.totalDue ? "warn" : "good"}
            value={formatMoney(summary.totalDue)}
          />
          <StatCard
            helper={`${summary.deliveredOrders} delivered`}
            label="Delivered Sales"
            tone="good"
            value={formatMoney(summary.deliveredSales)}
          />
          <StatCard
            helper={`${summary.returnedOrders} returned`}
            label="Returned Value"
            tone={summary.returnedValue ? "bad" : "good"}
            value={formatMoney(summary.returnedValue)}
          />
          <StatCard
            helper="Paid / gross sales"
            label="Payment Collection"
            tone={summary.paymentCollectionRate >= 80 ? "good" : "warn"}
            value={formatPercent(summary.paymentCollectionRate)}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard
            helper="All statuses"
            label="Total Orders"
            value={summary.totalOrders}
          />
          <StatCard
            helper="Completed orders"
            label="Delivered"
            tone="good"
            value={summary.deliveredOrders}
          />
          <StatCard
            helper="Returned status"
            label="Returned"
            tone={summary.returnedOrders ? "bad" : "good"}
            value={summary.returnedOrders}
          />
          <StatCard
            helper="Cancelled status"
            label="Cancelled"
            tone={summary.cancelledOrders ? "bad" : "good"}
            value={summary.cancelledOrders}
          />
          <StatCard
            helper="Delivered / total"
            label="Delivery Success"
            tone={summary.deliverySuccessRate >= 80 ? "good" : "warn"}
            value={formatPercent(summary.deliverySuccessRate)}
          />
          <StatCard
            helper="Returned / total"
            label="Return Rate"
            tone={summary.returnRate > 10 ? "bad" : "good"}
            value={formatPercent(summary.returnRate)}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Catalog products"
            label="Total Products"
            value={summary.totalProducts}
          />
          <StatCard
            helper="Stock 1 to 10"
            label="Low Stock"
            tone={summary.lowStockProducts ? "warn" : "good"}
            value={summary.lowStockProducts}
          />
          <StatCard
            helper="Stock 0 or below"
            label="Out of Stock"
            tone={summary.outOfStockProducts ? "bad" : "good"}
            value={summary.outOfStockProducts}
          />
          <StatCard
            helper="Inventory movement rows"
            label="Recent Movements"
            value={summary.recentMovementCount}
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
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

            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                Read-Only Notes
              </div>
              <div className="mt-3 space-y-3 text-sm font-semibold leading-6 text-amber-700">
                <p>Advanced COD reconciliation not connected yet.</p>
                <p>Export/download not connected yet.</p>
                <p>Payment gateway not connected yet.</p>
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
                <div className="flex justify-between">
                  <dt className="text-slate-500">Ready</dt>
                  <dd className="font-bold text-slate-800">
                    {summary.courierReady}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Sent</dt>
                  <dd className="font-bold text-slate-800">
                    {summary.courierSent}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Delivered</dt>
                  <dd className="font-bold text-slate-800">
                    {summary.courierDelivered}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Returned</dt>
                  <dd className="font-bold text-slate-800">
                    {summary.courierReturned}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Failed</dt>
                  <dd className="font-bold text-slate-800">
                    {summary.courierFailed}
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </div>
    </AdminShell>
  );
}
