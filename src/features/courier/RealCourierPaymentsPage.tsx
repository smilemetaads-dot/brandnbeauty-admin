import Link from "next/link";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import type { CourierPaymentOrderRecord } from "./courier-data";

type RealCourierPaymentsPageProps = {
  orders: CourierPaymentOrderRecord[];
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
  icon,
  label,
  tone = "brand",
  value,
}: {
  helper: string;
  icon: string;
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
    <div className="group relative overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#527B86]/5 transition group-hover:bg-[#527B86]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 text-2xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#527B86]/10 text-xl font-black text-[#527B86]">
          {icon}
        </div>
      </div>
      <div
        className={`relative mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${helperClassName}`}
      >
        {helper}
      </div>
    </div>
  );
}

function DisabledButton({
  children,
  primary = false,
  small = false,
}: {
  children: ReactNode;
  primary?: boolean;
  small?: boolean;
}) {
  return (
    <button
      className={`${
        small ? "rounded-xl px-3 py-2 text-xs" : "rounded-2xl px-5 py-3 text-sm"
      } font-bold ${
        primary
          ? "bg-[#527B86] text-white opacity-45"
          : "border border-slate-300 bg-white text-slate-400"
      }`}
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function SelectShell({ label }: { label: string }) {
  return (
    <div className="relative min-w-[150px] rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-stone-50 px-4 py-2 text-xs font-bold text-slate-500 shadow-sm">
      <span>{label}</span>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
        v
      </span>
    </div>
  );
}

function getOrderStatusTone(status: string): BadgeTone {
  if (status === "delivered") {
    return "good";
  }

  if (status === "returned") {
    return "bad";
  }

  if (status === "packed" || status === "shipped") {
    return "brand";
  }

  return "default";
}

function getPaymentStatusTone(status: string): BadgeTone {
  if (status === "paid") {
    return "good";
  }

  if (status === "failed" || status === "refunded") {
    return "bad";
  }

  return "warn";
}

function getCourierStatusTone(status: string | null): BadgeTone {
  if (status === "delivered") {
    return "good";
  }

  if (status === "returned" || status === "failed") {
    return "bad";
  }

  if (status === "ready" || status === "sent") {
    return "brand";
  }

  return "default";
}

function getRowClassName(order: CourierPaymentOrderRecord) {
  if (order.order_status === "returned" || order.courier_status === "returned") {
    return "bg-rose-50/30";
  }

  if (order.due_amount > 0 || order.courier_status === "failed") {
    return "bg-amber-50/30";
  }

  if (order.order_status === "delivered" || order.courier_status === "delivered") {
    return "bg-emerald-50/30";
  }

  if (order.order_status === "packed" || order.courier_status === "ready") {
    return "bg-[#527B86]/[0.04]";
  }

  return "bg-white";
}

function formatStatus(value: string | null) {
  return value ? value.replaceAll("_", " ") : "not set";
}

function formatText(value: string | null) {
  return value || "Not available";
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-BD", {
    currency: "BDT",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatLocation(order: CourierPaymentOrderRecord) {
  return `${order.district ?? "No district"} / ${order.area ?? "No area"}`;
}

function getItemsSummary(order: CourierPaymentOrderRecord) {
  if (!order.order_items.length) {
    return "No items found";
  }

  return order.order_items
    .slice(0, 3)
    .map((item) => `${item.product_name} x${item.quantity}`)
    .join(", ");
}

export function RealCourierPaymentsPage({
  orders,
}: RealCourierPaymentsPageProps) {
  const readyDispatchOrders = orders.filter(
    (order) => order.courier_status === "ready" || order.order_status === "packed",
  ).length;
  const deliveredOrders = orders.filter(
    (order) =>
      order.courier_status === "delivered" ||
      order.order_status === "delivered",
  ).length;
  const returnedOrders = orders.filter(
    (order) =>
      order.courier_status === "returned" || order.order_status === "returned",
  ).length;
  const mismatchOrders = orders.filter(
    (order) =>
      order.payment_status === "failed" ||
      order.courier_status === "failed" ||
      order.due_amount > 0,
  ).length;
  const codPipeline = orders.reduce((sum, order) => sum + order.due_amount, 0);
  const totalPaid = orders.reduce((sum, order) => sum + order.paid_amount, 0);
  const collectedPercent =
    codPipeline + totalPaid > 0
      ? Math.round((totalPaid / (codPipeline + totalPaid)) * 100)
      : 0;
  const focusedOrder = orders[0] ?? null;

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Can send later"
            icon="#"
            label="Ready Dispatch"
            value={readyDispatchOrders}
          />
          <StatCard
            helper="Awaiting settlement"
            icon="T"
            label="COD Pipeline"
            tone="warn"
            value={formatMoney(codPipeline)}
          />
          <StatCard
            helper="Not Connected"
            icon="C"
            label="Courier Charge"
            tone="default"
            value="0"
          />
          <StatCard
            helper="Need finance review"
            icon="!"
            label="Mismatch"
            tone="bad"
            value={mismatchOrders}
          />
        </section>

        <section className="rounded-2xl border border-[#527B86]/20 bg-[#527B86]/5 px-5 py-4 text-sm font-bold text-[#527B86]">
          {readyDispatchOrders} parcels ready for courier upload. Courier API,
          COD settlement, tracking sync, and export are not connected yet.
        </section>

        <section className="flex flex-wrap items-center gap-2 rounded-[1.4rem] border border-slate-200 bg-white p-2 shadow-sm">
          {["Dispatch", "Tracking", "Settlement"].map((tab, index) => (
            <button
              className={`rounded-xl px-4 py-2.5 text-sm font-bold ${
                index === 0
                  ? "bg-[#527B86] text-white shadow-sm"
                  : "text-slate-500"
              }`}
              disabled
              key={tab}
              type="button"
            >
              {tab}
            </button>
          ))}
          <span className="ml-auto rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
            Tabs visual only
          </span>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Courier Dispatch Center
                  </div>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                    Courier Dispatch Queue
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    Live packed, shipped, delivered, returned, and courier-ready
                    orders. Dispatch, tracking sync, settlement, and export are
                    safe placeholders in this step.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledButton>Export CSV N/C</DisabledButton>
                  <DisabledButton primary>Send to Courier N/C</DisabledButton>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <SelectShell label="All Partners" />
                <SelectShell label="All Settlements" />
                <DisabledButton small>Sync Tracking N/C</DisabledButton>
                <DisabledButton small>Finance Review N/C</DisabledButton>
              </div>
            </div>

            <div className="border-b border-slate-100 bg-stone-50/70 px-6 py-4 text-sm font-bold text-slate-600">
              Live records: {orders.length}. Selection, courier upload, COD
              paid, payment reconciliation, stock sync, and hard delete are not
              performed here.
            </div>

            {orders.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-stone-50 text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-medium">
                        <input
                          className="h-4 w-4 rounded border-slate-300"
                          disabled
                          type="checkbox"
                        />
                      </th>
                      {[
                        "Order",
                        "Customer",
                        "Partner",
                        "Tracking",
                        "COD",
                        "Courier",
                        "Settlement",
                        "Items",
                        "Action",
                      ].map((heading) => (
                        <th
                          className="px-5 py-4 font-medium"
                          key={heading}
                          scope="col"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        className={`border-t border-slate-100 align-top transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#527B86] ${getRowClassName(
                          order,
                        )}`}
                        key={order.id}
                      >
                        <td className="px-5 py-4">
                          <input
                            className="h-4 w-4 rounded border-slate-300"
                            disabled
                            type="checkbox"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-black text-slate-950">
                            {order.order_number ?? "No order number"}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">
                            {formatStatus(order.order_status)}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-800">
                            {order.customer_name}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {order.customer_phone}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {formatLocation(order)}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone="brand">
                            {formatText(order.courier_name)}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-800">
                          {formatText(order.courier_tracking_id)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-black text-slate-950">
                            {formatMoney(order.due_amount)}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Paid {formatMoney(order.paid_amount)}
                          </div>
                          <div className="text-xs text-slate-500">
                            Total {formatMoney(order.total)}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col items-start gap-2">
                            <Badge
                              tone={getCourierStatusTone(order.courier_status)}
                            >
                              {formatStatus(order.courier_status)}
                            </Badge>
                            <Badge tone={getOrderStatusTone(order.order_status)}>
                              {formatStatus(order.order_status)}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={getPaymentStatusTone(order.payment_status)}>
                            {formatStatus(order.payment_status)}
                          </Badge>
                        </td>
                        <td className="max-w-[260px] px-5 py-4">
                          <div className="font-semibold text-slate-700">
                            {getItemsSummary(order)}
                          </div>
                          {order.order_items.length > 3 ? (
                            <div className="mt-1 text-xs text-slate-500">
                              +{order.order_items.length - 3} more rows
                            </div>
                          ) : null}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex min-w-[130px] flex-col gap-2">
                            <Link
                              className="rounded-xl bg-[#527B86]/10 px-3 py-2 text-center text-xs font-bold text-[#527B86] transition hover:bg-[#527B86] hover:text-white"
                              href={`/orders/details?id=${order.id}`}
                            >
                              Open
                            </Link>
                            <DisabledButton small>Sync N/C</DisabledButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-14 text-center text-sm text-slate-500">
                No courier or payment orders found for the live queue.
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Dispatch Summary
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                COD Collection
              </h2>
              <div className="mt-5 flex items-center justify-center">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-8 border-stone-100">
                  <div
                    className="absolute inset-0 rounded-full border-8 border-[#527B86]"
                    style={{
                      clipPath: `inset(${100 - collectedPercent}% 0 0 0)`,
                    }}
                  />
                  <div className="relative text-center">
                    <div className="text-2xl font-black text-slate-900">
                      {collectedPercent}%
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Paid
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">COD Pipeline</span>
                  <b>{formatMoney(codPipeline)}</b>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Paid Amount</span>
                  <b className="text-emerald-700">{formatMoney(totalPaid)}</b>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Difference</span>
                  <b className="text-rose-600">{formatMoney(codPipeline)}</b>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Courier Health
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Partner Performance
              </h2>
              <div className="mt-5 space-y-3">
                {[
                  `${deliveredOrders} delivered orders`,
                  `${returnedOrders} returned orders`,
                  "Courier API setup pending",
                ].map((item) => (
                  <div
                    className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-bold text-slate-700"
                    key={item}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Shipment Details
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    {focusedOrder?.order_number ?? "No active order"}
                  </h2>
                </div>
                <Badge tone={getPaymentStatusTone(focusedOrder?.payment_status ?? "")}>
                  {formatStatus(focusedOrder?.payment_status ?? null)}
                </Badge>
              </div>
              {focusedOrder ? (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Customer</span>
                    <b className="text-right">{focusedOrder.customer_name}</b>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Tracking</span>
                    <b className="text-right">
                      {formatText(focusedOrder.courier_tracking_id)}
                    </b>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Partner</span>
                    <b className="text-right">
                      {formatText(focusedOrder.courier_name)}
                    </b>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">COD Due</span>
                    <b className="text-right">{formatMoney(focusedOrder.due_amount)}</b>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl bg-stone-50 p-4 text-sm text-slate-500">
                  No live order is available for shipment preview.
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">Ops Note</div>
              <div className="mt-2 text-sm leading-6 text-amber-700">
                Only courier-ready orders should be uploaded later. Delivered
                courier status, COD reconciliation, and payment updates will be
                connected in future safe workflows.
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AdminShell>
  );
}
