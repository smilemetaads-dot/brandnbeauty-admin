import Link from "next/link";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import { MarkPackedButton } from "./MarkPackedButton";
import type { PackingOrderRecord } from "./packing-data";

type RealPackingDeskPageProps = {
  orders: PackingOrderRecord[];
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

function getOrderStatusTone(status: string): BadgeTone {
  if (status === "packed") {
    return "good";
  }

  if (status === "ready_to_pack" || status === "processing") {
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

  if (status === "ready" || status === "sent") {
    return "brand";
  }

  return "default";
}

function getPriorityTone(order: PackingOrderRecord): BadgeTone {
  if (!order.stock_deducted || order.stock_restored) {
    return "bad";
  }

  if (order.due_amount > 0 || order.order_status === "ready_to_pack") {
    return "warn";
  }

  return "good";
}

function getPriorityLabel(order: PackingOrderRecord) {
  if (!order.stock_deducted) {
    return "Stock Check";
  }

  if (order.stock_restored) {
    return "Review";
  }

  if (order.due_amount > 0) {
    return "COD Due";
  }

  if (order.order_status === "ready_to_pack") {
    return "Ready";
  }

  return "Normal";
}

function formatStatus(value: string | null) {
  return value ? value.replaceAll("_", " ") : "not set";
}

function formatText(value: string | null) {
  return value || "Not available";
}

function formatBoolean(value: boolean) {
  return value ? "Yes" : "No";
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

function formatLocation(order: PackingOrderRecord) {
  return `${order.district ?? "No district"} / ${order.area ?? "No area"}`;
}

export function RealPackingDeskPage({ orders }: RealPackingDeskPageProps) {
  const readyToPackOrders = orders.filter(
    (order) => order.order_status === "ready_to_pack",
  ).length;
  const packedOrders = orders.filter(
    (order) => order.order_status === "packed",
  ).length;

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Live ready queue"
            icon="#"
            label="Ready to Pack"
            tone="warn"
            value={readyToPackOrders}
          />
          <StatCard
            helper="Not Connected"
            icon="P"
            label="Printed Slips"
            tone="default"
            value="0"
          />
          <StatCard
            helper="Ready courier later"
            icon=">"
            label="Packed"
            tone="good"
            value={packedOrders}
          />
          <StatCard
            helper="Visual placeholder"
            icon="!"
            label="Mismatch Risk"
            tone="bad"
            value="0"
          />
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                Packing Operations
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Packing Desk
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Print slips, verify products, and mark parcels ready without
                mistakes. This live version is read-only until packing, print,
                and courier handoff workflows are connected.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DisabledButton>Bulk Print Slips N/C</DisabledButton>
              <DisabledButton primary>Mark Ready Courier N/C</DisabledButton>
            </div>
          </div>

          <div className="border-b border-slate-100 bg-[#527B86]/5 px-6 py-4 text-sm font-bold text-[#527B86]">
            {orders.length} live packing orders visible. Packing mutation,
            print slip, courier handoff, stock sync, and hard delete are not
            performed on this page.
          </div>

          {orders.length ? (
            <div className="grid gap-5 p-6 xl:grid-cols-3">
              {orders.map((order) => {
                const checkedCount = 0;
                const itemCount = order.order_items.reduce(
                  (sum, item) => sum + item.quantity,
                  0,
                );

                return (
                  <article
                    className="flex h-full flex-col rounded-[1.5rem] border border-slate-200 bg-stone-50 p-5 shadow-sm"
                    key={order.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-lg font-black text-slate-950">
                          {order.order_number ?? "No order number"}
                        </div>
                        <div className="mt-1 font-bold text-slate-800">
                          {order.customer_name}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-500">
                          {order.customer_phone}
                        </div>
                      </div>
                      <Badge tone={getPriorityTone(order)}>
                        {getPriorityLabel(order)}
                      </Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge tone={getOrderStatusTone(order.order_status)}>
                        {formatStatus(order.order_status)}
                      </Badge>
                      <Badge tone={getPaymentStatusTone(order.payment_status)}>
                        {formatStatus(order.payment_status)}
                      </Badge>
                      <Badge tone={getCourierStatusTone(order.courier_status)}>
                        {formatStatus(order.courier_status)}
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Zone</span>
                        <b className="text-right text-slate-900">
                          {formatLocation(order)}
                        </b>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Delivery</span>
                        <b className="text-right text-slate-900">
                          {formatText(order.delivery_zone)}
                        </b>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Total / Due</span>
                        <b className="text-right text-slate-900">
                          {formatMoney(order.total)} / {formatMoney(order.due_amount)}
                        </b>
                      </div>
                    </div>

                    <div className="mt-5 flex-1 rounded-2xl bg-white p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                          Pick Items
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
                          {checkedCount}/{order.order_items.length} checked
                        </span>
                      </div>

                      {order.order_items.length ? (
                        <div className="space-y-3">
                          {order.order_items.map((item) => (
                            <label
                              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-stone-50 px-3 py-3 text-sm"
                              key={item.id}
                            >
                              <span className="min-w-0">
                                <span className="block truncate font-bold text-slate-800">
                                  {item.product_name}
                                </span>
                                <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
                                  {formatText(item.product_sku)} /{" "}
                                  {formatText(item.product_brand)} /{" "}
                                  {formatText(item.product_size)}
                                </span>
                              </span>
                              <span className="flex shrink-0 items-center gap-3">
                                <b className="text-slate-900">
                                  Qty {item.quantity}
                                </b>
                                <input
                                  className="h-4 w-4 rounded border-slate-300"
                                  disabled
                                  type="checkbox"
                                />
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl bg-stone-50 p-4 text-sm text-slate-500">
                          No order items found for this packing order.
                        </div>
                      )}
                    </div>

                    <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
                      Read-only checklist. Packing mutation, print slip, and
                      courier handoff are not connected yet.
                    </div>

                    <div className="mt-auto grid gap-3 pt-5 sm:grid-cols-2">
                      <DisabledButton>Print Slip N/C</DisabledButton>
                      <MarkPackedButton
                        currentStatus={order.order_status}
                        orderId={order.id}
                      />
                      <Link
                        className="rounded-2xl border border-[#527B86]/30 bg-[#527B86]/10 px-4 py-3 text-center text-sm font-bold text-[#527B86] transition hover:bg-[#527B86] hover:text-white sm:col-span-2"
                        href={`/orders/details?id=${order.id}`}
                      >
                        Open Details
                      </Link>
                    </div>

                    <div className="mt-4 grid gap-2 border-t border-slate-200 pt-4 text-xs font-semibold text-slate-500">
                      <div className="flex justify-between gap-3">
                        <span>Items</span>
                        <b className="text-slate-900">{itemCount}</b>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Stock deducted</span>
                        <b className="text-slate-900">
                          {formatBoolean(order.stock_deducted)}
                        </b>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Stock restored</span>
                        <b className="text-slate-900">
                          {formatBoolean(order.stock_restored)}
                        </b>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Updated</span>
                        <b className="text-right text-slate-900">
                          {formatDate(order.updated_at)}
                        </b>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-slate-500">
              No packing orders found. Orders appear here after they reach
              confirmed, processing, ready_to_pack, or packed status.
            </div>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            "Packing mutation not connected yet",
            "Print slip not connected yet",
            "Courier handoff not connected yet",
          ].map((note) => (
            <div
              className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700"
              key={note}
            >
              {note}
            </div>
          ))}
        </section>
      </div>
    </AdminShell>
  );
}
