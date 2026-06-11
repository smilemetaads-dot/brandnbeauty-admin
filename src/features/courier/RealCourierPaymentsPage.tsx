import Link from "next/link";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import { MarkCourierSentForm } from "./MarkCourierSentForm";
import { MarkDeliveredCodPaidButton } from "./MarkDeliveredCodPaidButton";
import { MarkReturnedButton } from "./MarkReturnedButton";
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

function StatCard({
  helper,
  icon,
  label,
  tone = "good",
  value,
}: {
  helper: string;
  icon: string;
  label: string;
  tone?: BadgeTone;
  value: ReactNode;
}) {
  const helperClassName = {
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    default: "bg-stone-50 text-slate-600",
  }[tone];

  return (
    <div className="group relative overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5E7F85]/5 transition group-hover:bg-[#5E7F85]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 truncate text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xs font-bold text-[#5E7F85] transition group-hover:bg-[#5E7F85] group-hover:text-white">
          {icon}
        </div>
      </div>
      <div
        className={`relative mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${helperClassName}`}
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
      } font-semibold ${
        primary
          ? "bg-[#5E7F85] text-white opacity-45"
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

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <b className="text-right text-slate-900">{value}</b>
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
    return "bg-[#5E7F85]/[0.04]";
  }

  return "bg-white";
}

function getReadyDispatchCount(orders: CourierPaymentOrderRecord[]) {
  return orders.filter(
    (order) => order.courier_status === "ready" || order.order_status === "packed",
  ).length;
}

function getDeliveredCount(orders: CourierPaymentOrderRecord[]) {
  return orders.filter(
    (order) =>
      order.courier_status === "delivered" ||
      order.order_status === "delivered",
  ).length;
}

function getReturnedCount(orders: CourierPaymentOrderRecord[]) {
  return orders.filter(
    (order) =>
      order.courier_status === "returned" || order.order_status === "returned",
  ).length;
}

function getMismatchCount(orders: CourierPaymentOrderRecord[]) {
  return orders.filter(
    (order) =>
      order.payment_status === "failed" ||
      order.courier_status === "failed" ||
      order.due_amount > 0,
  ).length;
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
  const readyDispatchOrders = getReadyDispatchCount(orders);
  const deliveredOrders = getDeliveredCount(orders);
  const returnedOrders = getReturnedCount(orders);
  const mismatchOrders = getMismatchCount(orders);
  const codPipeline = orders.reduce((sum, order) => sum + order.due_amount, 0);
  const totalPaid = orders.reduce((sum, order) => sum + order.paid_amount, 0);
  const settlementBase = codPipeline + totalPaid;
  const collectedPercent =
    settlementBase > 0
      ? Math.round((totalPaid / settlementBase) * 100)
      : 0;
  const focusedOrder = orders[0] ?? null;

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Can send courier"
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
            helper="Not tracked"
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

        <section className="rounded-2xl border border-[#5E7F85]/20 bg-[#5E7F85]/5 px-5 py-4 text-sm font-semibold text-[#5E7F85]">
          {readyDispatchOrders} parcels ready for courier upload. Tracking sync,
          bulk export, and courier API upload remain preview-only.
        </section>

        <section className="flex flex-wrap items-center gap-2 rounded-[1.4rem] border border-slate-200 bg-white p-2 shadow-sm">
          {["Dispatch", "Tracking", "Settlement"].map((tab, index) => (
            <button
              className={`rounded-xl px-4 py-2.5 text-sm font-bold ${
                index === 0
                  ? "bg-[#5E7F85] text-white shadow-sm"
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
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Courier Dispatch Center
                  </div>
                  <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Courier Dispatch Queue
                  </h1>
                  <div className="mt-1 text-sm text-slate-500">
                    Send ready parcels to courier in bulk with one click.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledButton>Export CSV</DisabledButton>
                  <DisabledButton primary>Send to Courier</DisabledButton>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <SelectShell label="All Partners" />
                <SelectShell label="All Settlements" />
                <DisabledButton small>Sync Tracking</DisabledButton>
                <DisabledButton small>Finance Review</DisabledButton>
              </div>
            </div>

            <div className="border-b border-slate-100 bg-stone-50/70 px-6 py-4 text-sm font-semibold text-slate-600">
              Live records: {orders.length}. Selection, courier upload, COD
              reconciliation, tracking sync, export, and hard delete are
              preview-only here. Connected row actions remain available below.
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
                        "Charge",
                        "Courier",
                        "Settlement",
                        "Received",
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
                        className={`border-t border-slate-100 align-top transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85] ${getRowClassName(
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
                          <div className="text-xs text-slate-500">
                            Total {formatMoney(order.total)}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone="default">Not tracked</Badge>
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
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {formatMoney(order.paid_amount)}
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
                          <div className="flex min-w-[220px] flex-col gap-2">
                            <Link
                              className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-center text-xs font-bold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white"
                              href={`/orders/details?id=${order.id}`}
                            >
                              Open
                            </Link>
                            <MarkCourierSentForm
                              currentCourierName={order.courier_name}
                              currentCourierNote={order.courier_note}
                              currentOrderStatus={order.order_status}
                              currentTrackingId={order.courier_tracking_id}
                              orderId={order.id}
                            />
                            <MarkDeliveredCodPaidButton
                              currentOrderStatus={order.order_status}
                              orderId={order.id}
                            />
                            <MarkReturnedButton
                              currentOrderStatus={order.order_status}
                              orderId={order.id}
                            />
                            <DisabledButton small>Sync</DisabledButton>
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
                    className="absolute inset-0 rounded-full border-8 border-[#5E7F85]"
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
                <DetailRow label="COD Pipeline" value={formatMoney(codPipeline)} />
                <DetailRow
                  label="Paid Amount"
                  value={
                    <span className="text-emerald-700">
                      {formatMoney(totalPaid)}
                    </span>
                  }
                />
                <DetailRow
                  label="Pending / Difference"
                  value={
                    <span className="text-rose-600">
                      {formatMoney(codPipeline)}
                    </span>
                  }
                />
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
                    className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700"
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
                  <DetailRow label="Customer" value={focusedOrder.customer_name} />
                  <DetailRow
                    label="Tracking"
                    value={formatText(focusedOrder.courier_tracking_id)}
                  />
                  <DetailRow
                    label="Partner"
                    value={formatText(focusedOrder.courier_name)}
                  />
                  <DetailRow
                    label="COD Due"
                    value={formatMoney(focusedOrder.due_amount)}
                  />
                  <div className="mt-5 rounded-2xl bg-stone-50 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Tracking Timeline
                    </div>
                    <div className="mt-3 space-y-2">
                      {[
                        ["Packed", focusedOrder.packed_at],
                        ["Courier Sent", focusedOrder.shipped_at],
                        ["Delivered", focusedOrder.delivered_at],
                        ["Returned", focusedOrder.returned_at],
                      ].map(([label, value], index) => (
                        <div
                          className="flex items-center gap-3 text-xs font-semibold text-slate-700"
                          key={label}
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              value
                                ? "bg-emerald-500"
                                : index === 1
                                  ? "bg-[#5E7F85]"
                                  : "bg-slate-200"
                            }`}
                          />
                          {label}
                        </div>
                      ))}
                    </div>
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
