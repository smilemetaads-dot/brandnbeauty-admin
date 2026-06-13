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

type StatCardItem = {
  active?: boolean;
  helper: string;
  label: string;
  value: ReactNode;
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
          ? "rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white opacity-60 shadow-sm"
          : "rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-400 shadow-sm"
      }
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function StatCard({ item, index }: { index: number; item: StatCardItem }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
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
    return "bg-emerald-50/25";
  }

  return "bg-white";
}

function getDifferenceTone(value: number) {
  if (value > 0) {
    return "text-rose-600";
  }

  if (value < 0) {
    return "text-amber-700";
  }

  return "text-emerald-700";
}

export function RealCodReconciliationPage({
  summary,
}: RealCodReconciliationPageProps) {
  const selectedOrder = summary.orders[0] ?? null;
  const statCards: StatCardItem[] = [
    {
      helper: "From live COD candidates",
      label: "Expected COD",
      value: formatMoney(summary.totalCodExpected),
    },
    {
      helper: `${summary.paidOrders} paid orders`,
      label: "Received",
      value: formatMoney(summary.totalCollected),
    },
    {
      active: true,
      helper: "Needs review",
      label: "Mismatch",
      value: formatMoney(Math.max(0, summary.totalDue)),
    },
    {
      active: true,
      helper: `${summary.pendingSettlementCount} awaiting courier`,
      label: "Pending Settlement",
      value: formatMoney(summary.totalDue),
    },
  ];
  const mismatchCount = summary.mismatchCount;

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((item, index) => (
            <StatCard index={index} item={item} key={item.label} />
          ))}
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                Finance Reconciliation Control Room
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Match courier COD, payment received, delivery charge and
                mismatch records from live order, payment and courier fields.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <DisabledButton>Import Courier Sheet</DisabledButton>
              <DisabledButton>Export CSV</DisabledButton>
              <DisabledButton primary>Mark Reviewed</DisabledButton>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Collection rate:{" "}
              <b className="text-[#5E7F85]">
                {formatPercent(summary.collectionRate)}
              </b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Mismatch orders:{" "}
              <b className="text-rose-700">{mismatchCount}</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Date view: <b className="text-amber-700">Live orders</b>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap items-center gap-2 rounded-[1.4rem] border border-slate-200 bg-white p-2 shadow-sm">
          {["Courier COD", "Mismatch", "Pending", "All"].map((tab, index) => (
            <button
              className={
                index === 0
                  ? "rounded-xl bg-[#5E7F85] px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
                  : "rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400"
              }
              disabled
              key={tab}
              type="button"
            >
              {tab}
            </button>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="overflow-visible rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Settlement Matching
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Courier Payment Reconciliation
                  </h2>
                </div>
                <DisabledButton primary>Resolve Selected</DisabledButton>
              </div>
              <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-stone-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    "Today",
                    "Yesterday",
                    "7D",
                    "30D",
                    "This Month",
                    "All",
                  ].map((item, index) => (
                    <button
                      className={
                        index === 5
                          ? "rounded-full bg-[#5E7F85] px-4 py-2 text-xs font-semibold text-white"
                          : "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500"
                      }
                      disabled
                      key={item}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                  <button
                    className="inline-flex min-w-[150px] items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm"
                    disabled
                    type="button"
                  >
                    From
                  </button>
                  <button
                    className="inline-flex min-w-[150px] items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm"
                    disabled
                    type="button"
                  >
                    To
                  </button>
                  <button
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500"
                    disabled
                    type="button"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {summary.orders.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-[1180px] text-left text-sm">
                  <thead className="bg-stone-50 text-slate-500">
                    <tr>
                      {[
                        "Order",
                        "Customer",
                        "Courier",
                        "Expected",
                        "Received",
                        "Due",
                        "Difference",
                        "Status",
                        "Action",
                      ].map((heading) => (
                        <th className="px-5 py-4 font-medium" key={heading}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {summary.orders.map((order) => {
                      const difference = order.total - order.paid_amount;

                      return (
                        <tr
                          className={`border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85] ${getRowClassName(order)}`}
                          key={order.id}
                        >
                          <td className="px-5 py-4 font-bold text-slate-900">
                            {formatText(order.order_number)}
                            <div className="mt-1 text-xs font-semibold text-slate-400">
                              {formatDateTime(order.updated_at)}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-800">
                              {formatText(order.customer_name)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatText(order.customer_phone)}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <Badge tone="brand">
                              {formatText(order.courier_name)}
                            </Badge>
                            <div className="mt-1 text-xs font-semibold text-slate-400">
                              {formatText(order.courier_tracking_id)}
                            </div>
                          </td>
                          <td className="px-5 py-4 font-semibold">
                            {formatMoney(order.total)}
                          </td>
                          <td className="px-5 py-4 font-semibold text-emerald-700">
                            {formatMoney(order.paid_amount)}
                          </td>
                          <td className="px-5 py-4 font-semibold text-amber-700">
                            {formatMoney(order.due_amount)}
                          </td>
                          <td className="px-5 py-4 font-bold">
                            <span className={getDifferenceTone(difference)}>
                              {formatMoney(difference)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="space-y-2">
                              <Badge
                                tone={getSettlementStatusTone(
                                  order.settlementStatus,
                                )}
                              >
                                {order.settlementStatus}
                              </Badge>
                              <div className="flex flex-wrap gap-1">
                                <Badge
                                  tone={getOrderStatusTone(order.order_status)}
                                >
                                  {formatStatus(order.order_status)}
                                </Badge>
                                <Badge
                                  tone={getPaymentStatusTone(
                                    order.payment_status,
                                  )}
                                >
                                  {formatStatus(order.payment_status)}
                                </Badge>
                                <Badge
                                  tone={getCourierStatusTone(
                                    order.courier_status,
                                  )}
                                >
                                  {formatStatus(order.courier_status)}
                                </Badge>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <Link
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-[#5E7F85] transition hover:border-[#5E7F85]/30 hover:bg-[#5E7F85]/5"
                              href={`/orders/details?id=${order.id}`}
                            >
                              Open
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-sm font-semibold text-slate-500">
                No reconciliation records found for selected filters.
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Collection Health
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                COD Collection
              </h3>
              <div className="mt-5 flex items-center justify-center">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-8 border-stone-100">
                  <div
                    className="absolute inset-0 rounded-full border-8 border-[#5E7F85]"
                    style={{
                      clipPath: `inset(${100 - Math.min(100, summary.collectionRate)}% 0 0 0)`,
                    }}
                  />
                  <div className="text-center">
                    <div className="text-2xl font-black text-[#5E7F85]">
                      {Math.round(summary.collectionRate)}%
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Collected
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Expected</span>
                  <b>{formatMoney(summary.totalCodExpected)}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Received</span>
                  <b className="text-emerald-700">
                    {formatMoney(summary.totalCollected)}
                  </b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pending/Diff</span>
                  <b className="text-rose-600">{formatMoney(summary.totalDue)}</b>
                </div>
              </div>
            </section>

            {selectedOrder ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-500">
                      Selected Record
                    </div>
                    <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                      {formatText(selectedOrder.order_number)}
                    </h3>
                  </div>
                  <Badge
                    tone={getSettlementStatusTone(
                      selectedOrder.settlementStatus,
                    )}
                  >
                    {selectedOrder.settlementStatus}
                  </Badge>
                </div>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Customer</span>
                    <b className="text-right">
                      {formatText(selectedOrder.customer_name)}
                    </b>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Expected</span>
                    <b>{formatMoney(selectedOrder.total)}</b>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Received</span>
                    <b>{formatMoney(selectedOrder.paid_amount)}</b>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Courier</span>
                    <b className="text-right">
                      {formatText(selectedOrder.courier_name)}
                    </b>
                  </div>
                </div>
                <div className="mt-5 grid gap-3">
                  <DisabledButton primary>Mark Matched</DisabledButton>
                  <DisabledButton>Add Adjustment Note</DisabledButton>
                </div>
              </section>
            ) : null}

            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                Finance Note
              </div>
              <p className="mt-2 text-sm leading-6 text-amber-700">
                Mismatch records should be reviewed before marking courier
                payment as settled. Settlement buttons here are preview-only and
                do not mutate payment, courier, order, or stock data.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
