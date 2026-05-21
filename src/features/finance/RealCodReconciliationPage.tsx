import Link from "next/link";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import type {
  CodReconciliationOrderRecord,
  CodReconciliationSummary,
  CodSettlementStatus,
} from "./reconciliation-data";

type RealCodReconciliationPageProps = {
  summary: CodReconciliationSummary;
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
  marker,
  tone = "brand",
  value,
}: {
  helper: string;
  label: string;
  marker: string;
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
    <section className="group relative overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#527B86]/5 transition group-hover:bg-[#527B86]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#527B86]/10 text-sm font-black text-[#527B86]">
          {marker}
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

function DisabledButton({ children }: { children: ReactNode }) {
  return (
    <button
      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-400 opacity-75"
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function SidePanel({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-black uppercase tracking-[0.12em] text-slate-400">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-600">
        {children}
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

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getOrderStatusTone(status: string | null): BadgeTone {
  if (status === "delivered") {
    return "good";
  }

  if (status === "returned" || status === "cancelled") {
    return "bad";
  }

  if (status === "shipped" || status === "sent") {
    return "brand";
  }

  return "default";
}

function getPaymentStatusTone(status: string | null): BadgeTone {
  if (status === "paid") {
    return "good";
  }

  if (status === "failed" || status === "refunded") {
    return "bad";
  }

  if (status === "cod_pending" || status === "partial_paid") {
    return "warn";
  }

  return "default";
}

function getCourierStatusTone(status: string | null): BadgeTone {
  if (status === "delivered") {
    return "good";
  }

  if (status === "returned" || status === "failed") {
    return "bad";
  }

  if (status === "sent") {
    return "brand";
  }

  return "default";
}

function getSettlementStatusTone(status: CodSettlementStatus): BadgeTone {
  if (status === "Paid") {
    return "good";
  }

  if (status === "Failed" || status === "Returned") {
    return "bad";
  }

  if (status === "Due Pending" || status === "Review") {
    return "warn";
  }

  return "brand";
}

function getRowClassName(order: CodReconciliationOrderRecord) {
  if (order.settlementStatus === "Failed" || order.settlementStatus === "Returned") {
    return "bg-rose-50/30";
  }

  if (order.settlementStatus === "Due Pending" || order.settlementStatus === "Review") {
    return "bg-amber-50/30";
  }

  if (order.settlementStatus === "Paid") {
    return "bg-emerald-50/30";
  }

  return "bg-white";
}

export function RealCodReconciliationPage({
  summary,
}: RealCodReconciliationPageProps) {
  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.16em] text-[#527B86]">
              Finance Control Room
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              COD Reconciliation
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
              Read-only settlement view from live orders data for delivered,
              returned, sent, due, COD pending, paid, failed, refunded, and
              partial paid orders.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DisabledButton>Import Courier Sheet — N/C</DisabledButton>
            <DisabledButton>Export CSV — N/C</DisabledButton>
            <DisabledButton>Mark Reviewed — N/C</DisabledButton>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard
            helper={`${summary.orders.length} records`}
            label="Expected COD"
            marker="COD"
            value={formatMoney(summary.totalCodExpected)}
          />
          <StatCard
            helper={`${summary.paidOrders} paid orders`}
            label="Collected"
            marker="BDT"
            tone="good"
            value={formatMoney(summary.totalCollected)}
          />
          <StatCard
            helper={`${summary.pendingSettlementCount} pending`}
            label="Pending Due"
            marker="DUE"
            tone="warn"
            value={formatMoney(summary.totalDue)}
          />
          <StatCard
            helper="Paid / expected"
            label="Collection Rate"
            marker="%"
            tone="brand"
            value={formatPercent(summary.collectionRate)}
          />
          <StatCard
            helper="Return queue"
            label="Returned"
            marker="RTN"
            tone="bad"
            value={summary.returnedCount}
          />
          <StatCard
            helper={`${summary.failedOrders} failed`}
            label="Mismatch / Review"
            marker="REV"
            tone="warn"
            value={summary.mismatchCount}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Reconciliation Table
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Live read-only COD settlement candidates from `public.orders`.
                </p>
              </div>
              <Badge tone="brand">{summary.orders.length} orders</Badge>
            </div>

            {summary.orders.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-[1320px] text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase tracking-[0.08em] text-slate-400">
                    <tr>
                      <th className="px-5 py-4 font-black">Order No</th>
                      <th className="px-5 py-4 font-black">Customer</th>
                      <th className="px-5 py-4 font-black">Phone</th>
                      <th className="px-5 py-4 font-black">Courier</th>
                      <th className="px-5 py-4 font-black">Tracking ID</th>
                      <th className="px-5 py-4 font-black">Total</th>
                      <th className="px-5 py-4 font-black">Paid</th>
                      <th className="px-5 py-4 font-black">Due</th>
                      <th className="px-5 py-4 font-black">Order Status</th>
                      <th className="px-5 py-4 font-black">Payment Status</th>
                      <th className="px-5 py-4 font-black">Courier Status</th>
                      <th className="px-5 py-4 font-black">
                        Settlement Status
                      </th>
                      <th className="px-5 py-4 font-black">Updated At</th>
                      <th className="px-5 py-4 font-black">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary.orders.map((order) => (
                      <tr className={getRowClassName(order)} key={order.id}>
                        <td className="px-5 py-4 font-black text-slate-900">
                          {formatText(order.order_number)}
                          <div className="mt-1 text-xs font-semibold text-slate-400">
                            {formatText(order.district)} / {formatText(order.area)}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700">
                          {formatText(order.customer_name)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-600">
                          {formatText(order.customer_phone)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-600">
                          {formatText(order.courier_name)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-600">
                          {formatText(order.courier_tracking_id)}
                        </td>
                        <td className="px-5 py-4 font-black text-slate-900">
                          {formatMoney(order.total)}
                        </td>
                        <td className="px-5 py-4 font-black text-emerald-700">
                          {formatMoney(order.paid_amount)}
                        </td>
                        <td className="px-5 py-4 font-black text-amber-700">
                          {formatMoney(order.due_amount)}
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
                          <Badge tone={getCourierStatusTone(order.courier_status)}>
                            {formatStatus(order.courier_status)}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            tone={getSettlementStatusTone(order.settlementStatus)}
                          >
                            {order.settlementStatus}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-600">
                          {formatDateTime(order.updated_at)}
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-[#527B86] transition hover:border-[#527B86]/30 hover:bg-[#527B86]/5"
                            href={`/orders/details?id=${order.id}`}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-sm font-semibold text-slate-500">
                No COD reconciliation orders found from the live orders data.
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <SidePanel title="COD Collection Health">
              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-700">
                <span>Collected</span>
                <strong>{formatMoney(summary.totalCollected)}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 text-amber-700">
                <span>Pending due</span>
                <strong>{formatMoney(summary.totalDue)}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-rose-50 px-4 py-3 text-rose-700">
                <span>Returned</span>
                <strong>{summary.returnedCount}</strong>
              </div>
            </SidePanel>

            <SidePanel title="Settlement Notes">
              <p>
                Paid rows have `payment_status = paid` and zero due amount.
                Returned and failed rows remain visible for manual finance
                review.
              </p>
              <p>
                Settlement status is derived from order, payment, courier, and
                due fields only. No payment or courier mutation is connected.
              </p>
            </SidePanel>

            <SidePanel title="Pending Features">
              <ul className="space-y-2">
                <li>Courier sheet import not connected yet.</li>
                <li>Mark reviewed not connected yet.</li>
                <li>Settlement mutation not connected yet.</li>
                <li>Export CSV not connected yet.</li>
              </ul>
            </SidePanel>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
