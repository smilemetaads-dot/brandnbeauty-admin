import Link from "next/link";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import type { CustomerProfileRecord } from "./customers-data";

type RealCustomerProfilePageProps = {
  profile: CustomerProfileRecord | null;
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

function Card({
  children,
  title,
  eyebrow,
}: {
  children: ReactNode;
  title: string;
  eyebrow?: string;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      {eyebrow ? (
        <div className="text-sm font-medium text-slate-500">{eyebrow}</div>
      ) : null}
      <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
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

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="max-w-[65%] text-right font-bold text-slate-800">
        {value}
      </dd>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      className="inline-flex rounded-xl bg-[#527B86]/10 px-3 py-2 text-xs font-bold text-[#527B86] transition hover:bg-[#527B86] hover:text-white"
      href="/customers"
    >
      Back to Customers
    </Link>
  );
}

function getRiskTone(riskLabel: CustomerProfileRecord["riskLabel"]): BadgeTone {
  if (riskLabel === "High Return Risk") {
    return "bad";
  }

  if (riskLabel === "Due Pending") {
    return "warn";
  }

  if (riskLabel === "Repeat Customer") {
    return "good";
  }

  return "default";
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-BD", {
    currency: "BDT",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
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

export function RealCustomerProfilePage({
  profile,
}: RealCustomerProfilePageProps) {
  if (!profile) {
    return (
      <AdminShell>
        <div className="space-y-6">
          <BackLink />
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                  Customers
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                  Customer Profile
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  This customer profile could not be generated from order data.
                  Return to Customers and open a profile from an existing phone
                  group.
                </p>
              </div>
              <Badge tone="default">Read Only</Badge>
            </div>
          </section>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <BackLink />

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                  Customer Profile
                </h1>
                <Badge tone={getRiskTone(profile.riskLabel)}>
                  {profile.riskLabel}
                </Badge>
              </div>
              <div className="mt-3 text-xl font-black text-slate-950">
                {profile.name}
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-500">
                {profile.phone}
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Customer profile is generated from orders by phone number.
                Dedicated customers table/profile editing is not connected yet.
              </p>
            </div>
            <Badge tone="default">Read Only</Badge>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard
            helper="Phone grouped"
            label="Total Orders"
            value={profile.orderCount}
          />
          <StatCard
            helper="Order totals"
            label="Total Spent"
            value={formatMoney(profile.totalSpent)}
          />
          <StatCard
            helper="Paid amount"
            label="Total Paid"
            tone="good"
            value={formatMoney(profile.totalPaid)}
          />
          <StatCard
            helper="Outstanding"
            label="Total Due"
            tone={profile.totalDue ? "warn" : "good"}
            value={formatMoney(profile.totalDue)}
          />
          <StatCard
            helper="Delivered orders"
            label="Delivered"
            tone="good"
            value={profile.deliveredCount}
          />
          <StatCard
            helper="Returned orders"
            label="Returned"
            tone={profile.returnedCount ? "bad" : "good"}
            value={profile.returnedCount}
          />
        </section>

        <section className="rounded-2xl border border-[#527B86]/20 bg-[#527B86]/5 px-5 py-4 text-sm font-bold text-[#527B86]">
          Customer profile is generated from orders by phone number. Dedicated
          customers table/profile editing is not connected yet.
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card eyebrow="Order-Derived Contact" title="Customer Info">
            <dl className="space-y-3">
              <DetailRow label="Phone" value={profile.phone} />
              <DetailRow label="Email" value={formatText(profile.email)} />
              <DetailRow label="Address" value={formatText(profile.address)} />
              <DetailRow label="District" value={formatText(profile.district)} />
              <DetailRow label="Area" value={formatText(profile.area)} />
              <DetailRow
                label="Delivery Zone"
                value={formatText(profile.delivery_zone)}
              />
            </dl>
          </Card>

          <Card eyebrow="Read-Only Signals" title="Behavior & Risk">
            <dl className="space-y-3">
              <DetailRow
                label="Risk Label"
                value={
                  <Badge tone={getRiskTone(profile.riskLabel)}>
                    {profile.riskLabel}
                  </Badge>
                }
              />
              <DetailRow label="Returned Count" value={profile.returnedCount} />
              <DetailRow label="Cancelled Count" value={profile.cancelledCount} />
              <DetailRow label="Shipped Count" value={profile.shippedCount} />
              <DetailRow label="Due Amount" value={formatMoney(profile.totalDue)} />
              <DetailRow
                label="First Order"
                value={formatDate(profile.firstOrderAt)}
              />
              <DetailRow label="Last Order" value={formatDate(profile.lastOrderAt)} />
            </dl>
          </Card>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Order History
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Orders From This Phone
              </h2>
            </div>
            <Badge tone="brand">{profile.orders.length} orders</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-slate-500">
                <tr>
                  {[
                    "Order Number",
                    "Total",
                    "Due",
                    "Order Status",
                    "Payment Status",
                    "Courier Status",
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
                {profile.orders.map((order) => (
                  <tr
                    className="border-t border-slate-100 align-top transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#527B86]"
                    key={order.id}
                  >
                    <td className="px-5 py-4 font-black text-slate-950">
                      {order.order_number ?? "No order number"}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-800">
                      {formatMoney(order.total)}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-800">
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
        </section>
      </div>
    </AdminShell>
  );
}
