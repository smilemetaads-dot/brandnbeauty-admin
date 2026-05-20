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
    <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-3 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </div>
      <div
        className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${helperClassName}`}
      >
        {helper}
      </div>
    </div>
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
          ? "rounded-2xl bg-[#527B86] px-4 py-3 text-sm font-bold text-white opacity-45"
          : "rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-400"
      }
      disabled
      type="button"
    >
      {children}
    </button>
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
  const readyOrders = orders.filter(
    (order) => order.courier_status === "ready",
  ).length;
  const sentOrders = orders.filter(
    (order) => order.courier_status === "sent",
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
  const codDue = orders.reduce((sum, order) => sum + order.due_amount, 0);

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                Courier Operations
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Courier & Payments
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                Live courier and COD payment queue for packed, shipped,
                delivered, returned, and courier-ready orders. Courier sending,
                COD reconciliation, and payment mutation are not connected yet.
              </p>
            </div>
            <Badge tone="brand">Live Read Only</Badge>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard
            helper="Live queue"
            label="Courier Queue"
            value={orders.length}
          />
          <StatCard
            helper="Courier ready"
            label="Ready for Courier"
            tone="brand"
            value={readyOrders}
          />
          <StatCard helper="In transit" label="Sent" value={sentOrders} />
          <StatCard
            helper="Completed"
            label="Delivered"
            tone="good"
            value={deliveredOrders}
          />
          <StatCard
            helper="Review needed"
            label="Returned"
            tone="bad"
            value={returnedOrders}
          />
          <StatCard
            helper="COD outstanding"
            label="COD Due"
            tone="warn"
            value={formatMoney(codDue)}
          />
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Safe Placeholders
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Courier & Payment Controls
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <DisabledButton primary>Send Courier N/C</DisabledButton>
              <DisabledButton>Mark COD Paid N/C</DisabledButton>
              <DisabledButton>Reconcile Payment N/C</DisabledButton>
              <DisabledButton>Export Courier Sheet N/C</DisabledButton>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              "Courier sent action not connected yet",
              "COD reconciliation not connected yet",
              "Payment mutation not connected yet",
            ].map((note) => (
              <div
                className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700"
                key={note}
              >
                {note}
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-[#527B86]/5 px-6 py-4 text-sm font-bold text-[#527B86]">
            {orders.length} live courier/payment orders visible. Courier
            mutation, COD paid action, reconciliation, stock sync, and hard
            delete are not performed here.
          </div>

          {orders.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-slate-500">
                  <tr>
                    {[
                      "Order",
                      "Customer",
                      "Amount",
                      "Zone",
                      "Status",
                      "Courier",
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
                      className="border-t border-slate-100 bg-white align-top transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#527B86]"
                      key={order.id}
                    >
                      <td className="px-5 py-4">
                        <div className="font-black text-slate-950">
                          {order.order_number ?? "No order number"}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-500">
                          Tracking {formatText(order.courier_tracking_id)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800">
                          {order.customer_name}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {order.customer_phone}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-black text-slate-950">
                          {formatMoney(order.total)}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-500">
                          Paid {formatMoney(order.paid_amount)}
                        </div>
                        <div className="text-xs font-semibold text-amber-700">
                          Due {formatMoney(order.due_amount)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800">
                          {formatLocation(order)}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {formatText(order.delivery_zone)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-start gap-2">
                          <Badge tone={getOrderStatusTone(order.order_status)}>
                            {formatStatus(order.order_status)}
                          </Badge>
                          <Badge
                            tone={getPaymentStatusTone(order.payment_status)}
                          >
                            {formatStatus(order.payment_status)}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-start gap-2">
                          <Badge
                            tone={getCourierStatusTone(order.courier_status)}
                          >
                            {formatStatus(order.courier_status)}
                          </Badge>
                          <div className="text-xs font-semibold text-slate-500">
                            {formatText(order.courier_name)}
                          </div>
                          <div className="text-xs text-slate-400">
                            {formatText(order.courier_note)}
                          </div>
                        </div>
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
                        <div className="flex min-w-[150px] flex-col gap-2">
                          <Link
                            className="rounded-xl bg-[#527B86]/10 px-3 py-2 text-center text-xs font-bold text-[#527B86] transition hover:bg-[#527B86] hover:text-white"
                            href={`/orders/details?id=${order.id}`}
                          >
                            Open Details
                          </Link>
                          <DisabledButton>Send Courier N/C</DisabledButton>
                          <DisabledButton>COD Paid N/C</DisabledButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              No courier or payment orders found. Packed, shipped, delivered,
              returned, and courier-ready orders appear here.
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
