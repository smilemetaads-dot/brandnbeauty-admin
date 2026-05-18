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

function StatCard({
  label,
  value,
  helper,
  active = false,
}: {
  label: string;
  value: string;
  helper: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border bg-white p-5 shadow-sm ${
        active ? "border-[#527B86] ring-2 ring-[#527B86]/15" : "border-slate-200"
      }`}
    >
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </div>
      <div className="mt-3 inline-flex rounded-full bg-stone-50 px-3 py-1 text-xs font-semibold text-slate-600">
        {helper}
      </div>
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

function DisabledAction({ children }: { children: ReactNode }) {
  return (
    <button
      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-400"
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

export function RealOrdersPage({ orders }: RealOrdersPageProps) {
  const totalOrders = orders.length;
  const newOrders = orders.filter((order) => order.order_status === "new")
    .length;
  const confirmedOrders = orders.filter(
    (order) => order.order_status === "confirmed",
  ).length;
  const deliveredOrders = orders.filter(
    (order) => order.order_status === "delivered",
  ).length;
  const returnedCancelledOrders = orders.filter((order) =>
    ["returned", "cancelled"].includes(order.order_status),
  ).length;
  const totalDue = orders.reduce((sum, order) => sum + order.due_amount, 0);

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                Order Operations
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Orders
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Live Supabase order list scaffold for Bangladesh COD workflow.
                Status updates, courier actions, packing, and stock sync will
                be connected in later steps.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DisabledAction>Status Update Not Connected</DisabledAction>
              <DisabledAction>Courier Action Not Connected</DisabledAction>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-4">
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Source: <b className="text-[#527B86]">Live orders</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Details: <b className="text-[#527B86]">Linked</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Mutation: <b className="text-amber-700">Not connected</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Safety: <b className="text-emerald-700">No delete</b>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard
            active
            helper="All order rows"
            label="Total Orders"
            value={String(totalOrders)}
          />
          <StatCard
            helper="Awaiting confirmation"
            label="New Orders"
            value={String(newOrders)}
          />
          <StatCard
            helper="COD confirmation done"
            label="Confirmed Orders"
            value={String(confirmedOrders)}
          />
          <StatCard
            helper="Completed deliveries"
            label="Delivered Orders"
            value={String(deliveredOrders)}
          />
          <StatCard
            helper="Needs review"
            label="Returned/Cancelled"
            value={String(returnedCancelledOrders)}
          />
          <StatCard
            helper="Outstanding COD"
            label="Total Due"
            value={formatMoney(totalDue)}
          />
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Order Management
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Live Orders List
              </h2>
            </div>
            <Badge tone="brand">Read Only Scaffold</Badge>
          </div>

          {orders.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-slate-500">
                  <tr>
                    {[
                      "Order No",
                      "Customer",
                      "Phone",
                      "District/Area",
                      "Total",
                      "Due",
                      "Order Status",
                      "Payment Status",
                      "Courier Status",
                      "Created At",
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
                      className="border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#527B86]"
                      key={order.id}
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-950">
                          {order.order_number ?? "No number"}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-400">
                          {order.source ?? "unknown source"}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {order.customer_name}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {order.customer_phone}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <div>{order.district ?? "No district"}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {order.area ?? "No area"} ·{" "}
                          {order.delivery_zone ?? "No zone"}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {formatMoney(order.total)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {formatMoney(order.due_amount)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={getOrderStatusTone(order.order_status)}>
                          {formatStatus(order.order_status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={getPaymentStatusTone(order.payment_status)}>
                          {formatStatus(order.payment_status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={getCourierStatusTone(order.courier_status)}>
                          {formatStatus(order.courier_status)}
                        </Badge>
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
            <div className="p-6 text-sm text-slate-500">
              No orders found. Apply the reviewed test seed or create orders in
              a later workflow to populate this list.
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
