import Link from "next/link";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import type { OrderRecord } from "./orders-data";

type RealOrdersPageProps = {
  orders: OrderRecord[];
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

function CommandStatCard({
  active = false,
  helper,
  icon,
  label,
  tone = "default",
  value,
}: {
  active?: boolean;
  helper: string;
  icon: string;
  label: string;
  tone?: BadgeTone;
  value: string;
}) {
  const helperClassName = {
    brand: "bg-[#527B86]/10 text-[#527B86]",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    default: "bg-stone-50 text-slate-600",
  }[tone];

  return (
    <div
      className={`group relative overflow-hidden rounded-[1.7rem] border bg-white p-5 text-left shadow-sm transition ${
        active ? "border-[#527B86] ring-2 ring-[#527B86]/15" : "border-slate-200"
      }`}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#527B86]/5" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1">
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
}: {
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      className={
        primary
          ? "rounded-2xl bg-[#527B86] px-5 py-3 text-sm font-bold text-white opacity-45"
          : "rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-400"
      }
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function SelectShell({
  compact = false,
  label,
}: {
  compact?: boolean;
  label: string;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-stone-50 px-4 py-2 text-xs font-bold text-slate-500 shadow-sm ${
        compact ? "min-w-[118px]" : "min-w-[132px]"
      }`}
    >
      <span>{label}</span>
      <span className="text-[10px] text-slate-400">v</span>
    </div>
  );
}

function getOrderStatusTone(status: string): BadgeTone {
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

  if (status === "sent" || status === "ready") {
    return "brand";
  }

  return "default";
}

function getPriorityTone(order: OrderRecord): BadgeTone {
  if (order.order_status === "cancelled" || order.order_status === "returned") {
    return "bad";
  }

  if (order.order_status === "new" || order.due_amount > 0) {
    return "warn";
  }

  return "good";
}

function getPriorityLabel(order: OrderRecord) {
  if (order.order_status === "cancelled" || order.order_status === "returned") {
    return "Review";
  }

  if (order.order_status === "new") {
    return "New";
  }

  if (order.due_amount > 0) {
    return "COD Due";
  }

  return "Normal";
}

function getRowClassName(order: OrderRecord) {
  if (order.order_status === "cancelled" || order.order_status === "returned") {
    return "bg-rose-50/35";
  }

  if (order.order_status === "new") {
    return "bg-amber-50/35";
  }

  if (order.courier_status === "delivered") {
    return "bg-emerald-50/35";
  }

  return "bg-white";
}

function formatStatus(value: string | null) {
  return value ? value.replaceAll("_", " ") : "not set";
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-BD", {
    currency: "BDT",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
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

function formatLocation(order: OrderRecord) {
  const area = order.area ?? "No area";
  const district = order.district ?? "No district";
  return `${district} / ${area}`;
}

export function RealOrdersPage({ orders }: RealOrdersPageProps) {
  const totalOrders = orders.length;
  const pendingConfirmOrders = orders.filter((order) =>
    ["new", "processing"].includes(order.order_status),
  ).length;
  const readyCourierOrders = orders.filter((order) =>
    ["ready", "not_sent"].includes(order.courier_status ?? ""),
  ).length;
  const returnRiskOrders = orders.filter(
    (order) =>
      ["returned", "cancelled"].includes(order.order_status) ||
      order.due_amount > 0,
  ).length;
  const confirmedOrders = orders.filter(
    (order) => order.order_status === "confirmed",
  ).length;
  const deliveredOrders = orders.filter(
    (order) => order.order_status === "delivered",
  ).length;
  const totalDue = orders.reduce((sum, order) => sum + order.due_amount, 0);
  const previewOrder = orders[0] ?? null;

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CommandStatCard
            active
            helper="Live intake"
            icon="#"
            label="Today Orders"
            tone="brand"
            value={String(totalOrders)}
          />
          <CommandStatCard
            helper="Need action"
            icon="!"
            label="Pending Confirm"
            tone="warn"
            value={String(pendingConfirmOrders)}
          />
          <CommandStatCard
            helper="Dispatch not connected"
            icon=">"
            label="Ready Courier"
            tone="brand"
            value={String(readyCourierOrders)}
          />
          <CommandStatCard
            helper="Review queue"
            icon="?"
            label="Return Risk"
            tone="bad"
            value={String(returnRiskOrders)}
          />
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                  Order Operations
                </div>
                <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
                  Orders Command Center
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  Live Supabase order list with source-inspired controls. Search,
                  bulk actions, courier dispatch, and status updates are visual
                  placeholders until their safe workflows are connected.
                </p>
              </div>
              <Badge tone="brand">Live Read Only</Badge>
            </div>

            <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
              <div className="relative max-w-lg">
                <input
                  className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-10 text-sm outline-none placeholder:text-slate-400"
                  disabled
                  placeholder="Search orders not connected yet"
                  type="text"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  /
                </span>
              </div>
              <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                <DisabledButton>Add Order</DisabledButton>
                <DisabledButton>Export</DisabledButton>
                <DisabledButton>Bulk Confirm</DisabledButton>
                <DisabledButton>Print Invoice</DisabledButton>
                <DisabledButton primary>Send Courier</DisabledButton>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500"
                disabled
                type="button"
              >
                Priority Queue
              </button>
              <SelectShell label="All Sources" />
              <SelectShell label="All Statuses" />
              <SelectShell compact label="All Zones" />
              <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                Filters visual only
              </span>
            </div>
          </div>

          <div className="border-b border-slate-100 bg-[#527B86]/5 px-6 py-4 text-sm font-bold text-[#527B86]">
            {totalOrders} live orders visible. Mutation, courier upload, stock
            deduction, and hard delete are not connected.
          </div>

          {orders.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-slate-500">
                  <tr>
                    {[
                      "Order",
                      "Customer",
                      "Source",
                      "Amount",
                      "Zone",
                      "Priority",
                      "Status",
                      "Courier",
                      "Payment",
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
                      className={`border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#527B86] ${getRowClassName(
                        order,
                      )}`}
                      key={order.id}
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-950">
                          {order.order_number ?? "No number"}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-400">
                          Created {formatDate(order.created_at)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">
                          {order.customer_name}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {order.customer_phone}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {order.source ?? "Unknown"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">
                          {formatMoney(order.total)}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-500">
                          Due {formatMoney(order.due_amount)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-700">
                          {order.district ?? "No district"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {order.delivery_zone ?? "No zone"}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={getPriorityTone(order)}>
                          {getPriorityLabel(order)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={getOrderStatusTone(order.order_status)}>
                          {formatStatus(order.order_status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={getCourierStatusTone(order.courier_status)}>
                          {formatStatus(order.courier_status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={getPaymentStatusTone(order.payment_status)}>
                          {formatStatus(order.payment_status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            className="inline-flex rounded-xl bg-[#527B86]/10 px-3 py-2 text-xs font-bold text-[#527B86] transition hover:bg-[#527B86] hover:text-white"
                            href={`/orders/details?id=${order.id}`}
                          >
                            Open
                          </Link>
                          <button
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-400"
                            disabled
                            type="button"
                          >
                            Update N/C
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              No orders found. Apply the reviewed test seed or create orders in a
              later workflow to populate this list.
            </div>
          )}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Source Preview Panel
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  Ops Drawer
                </h2>
              </div>
              <Badge tone="default">Latest Live Order</Badge>
            </div>

            {previewOrder ? (
              <div className="mt-5 space-y-4 text-sm">
                <div className="rounded-2xl bg-stone-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-950">
                        {previewOrder.order_number ?? "No number"}
                      </div>
                      <div className="mt-1 font-semibold text-slate-700">
                        {previewOrder.customer_name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {previewOrder.customer_phone}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge tone={getPriorityTone(previewOrder)}>
                        {getPriorityLabel(previewOrder)}
                      </Badge>
                      <div className="mt-2 text-xs font-semibold text-slate-500">
                        Derived from live status and due
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 rounded-2xl bg-stone-50 p-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-slate-500">Zone</div>
                    <div className="font-semibold text-slate-800">
                      {formatLocation(previewOrder)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Amount</div>
                    <div className="font-semibold text-slate-800">
                      {formatMoney(previewOrder.total)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Source</div>
                    <div className="font-semibold text-slate-800">
                      {previewOrder.source ?? "Unknown"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Courier</div>
                    <div className="font-semibold text-slate-800">
                      {formatStatus(previewOrder.courier_status)}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-amber-50 p-4 text-xs font-bold text-amber-700">
                  This panel is a read-only quick summary. Real risk scoring,
                  call, WhatsApp, print, confirm, and courier flows are not
                  connected yet.
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-400"
                    disabled
                    type="button"
                  >
                    Call N/C
                  </button>
                  <button
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-300"
                    disabled
                    type="button"
                  >
                    WhatsApp N/C
                  </button>
                  <button
                    className="rounded-2xl bg-[#527B86] px-4 py-3 text-sm font-bold text-white opacity-45"
                    disabled
                    type="button"
                  >
                    Confirm N/C
                  </button>
                  <button
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-400"
                    disabled
                    type="button"
                  >
                    Print N/C
                  </button>
                  <Link
                    className="rounded-2xl border border-[#527B86]/30 bg-[#527B86]/10 px-4 py-3 text-center text-sm font-bold text-[#527B86] transition hover:bg-[#527B86] hover:text-white sm:col-span-2"
                    href={`/orders/details?id=${previewOrder.id}`}
                  >
                    Open Full Details
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-stone-50 p-6 text-sm text-slate-500">
                No live order is available for the quick preview panel.
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">
              Quick Actions
            </h2>
            <div className="mt-3 rounded-2xl bg-stone-50 p-3 text-xs font-bold text-slate-500">
              Selected: 0 / Visible: {orders.length}
            </div>
            <div className="mt-5 space-y-3">
              {[
                "Bulk Confirm Not Connected",
                "Mark Packed Not Connected",
                "Print Invoices Not Connected",
                "Send to Courier Not Connected",
              ].map((item) => (
                <button
                  className="flex w-full items-center justify-between rounded-2xl bg-stone-50 p-4 text-left text-sm font-bold text-slate-400"
                  disabled
                  key={item}
                  type="button"
                >
                  <span>{item}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400">
                    N/C
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl bg-stone-50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Confirmed</span>
                <b className="text-slate-900">{confirmedOrders}</b>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Delivered</span>
                <b className="text-slate-900">{deliveredOrders}</b>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total Due</span>
                <b className="text-slate-900">{formatMoney(totalDue)}</b>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
