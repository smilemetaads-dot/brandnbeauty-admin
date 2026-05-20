import Link from "next/link";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

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
  label,
  value,
}: {
  helper: string;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-3 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </div>
      <div className="mt-4 inline-flex rounded-full bg-[#527B86]/10 px-3 py-1 text-xs font-bold text-[#527B86]">
        {helper}
      </div>
    </div>
  );
}

function DisabledButton({ children }: { children: ReactNode }) {
  return (
    <button
      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-400"
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
  const stockDeductedOrders = orders.filter(
    (order) => order.stock_deducted,
  ).length;

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                Order Operations
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Packing Desk
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                Live read-only packing queue for confirmed, processing,
                ready-to-pack, and packed orders. Packing mutation, print slip,
                and courier handoff are not connected yet.
              </p>
            </div>
            <Badge tone="brand">Live Read Only</Badge>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Confirmed through packed"
            label="Packing Queue"
            value={orders.length}
          />
          <StatCard
            helper="Ready queue"
            label="Ready to Pack"
            value={readyToPackOrders}
          />
          <StatCard helper="Packed status" label="Packed" value={packedOrders} />
          <StatCard
            helper="Safe stock flag"
            label="Stock Deducted"
            value={stockDeductedOrders}
          />
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Queue Notes
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Packing Controls
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <DisabledButton>Packing Mutation N/C</DisabledButton>
              <DisabledButton>Print Slip N/C</DisabledButton>
              <DisabledButton>Courier Handoff N/C</DisabledButton>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              "Packing mutation not connected yet",
              "Print slip not connected yet",
              "Courier handoff not connected yet",
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

        {orders.length ? (
          <section className="space-y-4">
            {orders.map((order) => {
              const itemCount = order.order_items.reduce(
                (sum, item) => sum + item.quantity,
                0,
              );

              return (
                <article
                  className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
                  key={order.id}
                >
                  <div className="grid gap-5 border-b border-slate-100 p-6 xl:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-black tracking-tight text-slate-950">
                          {order.order_number ?? "No order number"}
                        </h2>
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
                      <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                            Customer
                          </div>
                          <div className="mt-1 font-bold text-slate-900">
                            {order.customer_name}
                          </div>
                          <div className="text-slate-500">
                            {order.customer_phone}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                            District / Area
                          </div>
                          <div className="mt-1 font-bold text-slate-900">
                            {formatLocation(order)}
                          </div>
                          <div className="text-slate-500">
                            {formatText(order.delivery_zone)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                            Stock Sync
                          </div>
                          <div className="mt-1 font-bold text-slate-900">
                            Deducted: {formatBoolean(order.stock_deducted)}
                          </div>
                          <div className="text-slate-500">
                            Restored: {formatBoolean(order.stock_restored)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 xl:items-end">
                      <div className="rounded-2xl bg-stone-50 px-4 py-3 text-right">
                        <div className="text-xs font-bold text-slate-500">
                          {itemCount} items
                        </div>
                        <div className="mt-1 text-lg font-black text-slate-950">
                          {formatMoney(order.total)}
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                          Due {formatMoney(order.due_amount)}
                        </div>
                      </div>
                      <Link
                        className="inline-flex justify-center rounded-2xl bg-[#527B86]/10 px-4 py-3 text-sm font-bold text-[#527B86] transition hover:bg-[#527B86] hover:text-white"
                        href={`/orders/details?id=${order.id}`}
                      >
                        Open Details
                      </Link>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-3 text-sm font-bold text-slate-900">
                      Items for Packing
                    </div>
                    {order.order_items.length ? (
                      <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-stone-50 text-slate-500">
                            <tr>
                              {["Product", "SKU", "Brand", "Size", "Qty"].map(
                                (heading) => (
                                  <th
                                    className="px-4 py-3 font-medium"
                                    key={heading}
                                    scope="col"
                                  >
                                    {heading}
                                  </th>
                                ),
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {order.order_items.map((item) => (
                              <tr
                                className="border-t border-slate-100"
                                key={item.id}
                              >
                                <td className="px-4 py-3 font-bold text-slate-900">
                                  {item.product_name}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {formatText(item.product_sku)}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {formatText(item.product_brand)}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {formatText(item.product_size)}
                                </td>
                                <td className="px-4 py-3 font-bold text-slate-900">
                                  {item.quantity}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-stone-50 p-4 text-sm text-slate-500">
                        No order items found for this packing order.
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            No packing orders found. Orders appear here after they reach
            confirmed, processing, ready_to_pack, or packed status.
          </section>
        )}
      </div>
    </AdminShell>
  );
}
