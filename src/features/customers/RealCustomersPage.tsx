import Link from "next/link";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import type { CustomerSummaryRecord } from "./customers-data";

type RealCustomersPageProps = {
  customers: CustomerSummaryRecord[];
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
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  helper,
  index,
  label,
  tone = "brand",
  value,
}: {
  helper: string;
  index: number;
  label: string;
  tone?: BadgeTone;
  value: ReactNode;
}) {
  const icons = ["C", "R", "D", "!"];
  const helperClassName = {
    brand: "bg-[#527B86]/10 text-[#527B86]",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    default: "bg-stone-50 text-slate-600",
  }[tone];

  return (
    <section className="group relative overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#527B86]/5 transition group-hover:bg-[#527B86]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#527B86]/10 text-sm font-black text-[#527B86]">
          {icons[index % icons.length]}
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

function DisabledButton({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const className = {
    brand: "border-[#527B86]/20 bg-[#527B86]/10 text-[#527B86]",
    good: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warn: "border-amber-200 bg-amber-50 text-amber-700",
    bad: "border-rose-200 bg-rose-50 text-rose-700",
    default: "border-slate-200 bg-white text-slate-500",
  }[tone];

  return (
    <button
      className={`rounded-2xl border px-4 py-3 text-sm font-semibold opacity-75 ${className}`}
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function getRiskTone(riskLabel: CustomerSummaryRecord["riskLabel"]): BadgeTone {
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

function formatLocation(customer: CustomerSummaryRecord) {
  return `${customer.district ?? "No district"} / ${customer.area ?? "No area"}`;
}

function getTableSegment(customer: CustomerSummaryRecord) {
  if (customer.returnedCount >= 2) {
    return "High Return Risk";
  }

  if (customer.totalDue > 0) {
    return "Due Pending";
  }

  if (customer.orderCount >= 2) {
    return "Repeat Customer";
  }

  return "New Customer";
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
      <span className="text-slate-500">{label}</span>
      <b className="max-w-[65%] text-right text-slate-800">{value}</b>
    </div>
  );
}

function CustomerProfilePanel({
  customer,
}: {
  customer: CustomerSummaryRecord | undefined;
}) {
  if (!customer) {
    return (
      <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-medium text-slate-500">
          Customer Profile
        </div>
        <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
          No customer selected
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Customer profiles will appear here after orders are available.
        </p>
      </aside>
    );
  }

  return (
    <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-slate-500">
            Customer Profile
          </div>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
            {customer.name}
          </h3>
          <div className="mt-1 text-sm font-semibold text-slate-500">
            {customer.phone}
          </div>
        </div>
        <Badge tone={getRiskTone(customer.riskLabel)}>
          {getTableSegment(customer)}
        </Badge>
      </div>

      <dl className="mt-5 space-y-3">
        <DetailRow label="Orders" value={customer.orderCount} />
        <DetailRow
          label="Lifetime Value"
          value={formatMoney(customer.totalSpent)}
        />
        <DetailRow label="Total Due" value={formatMoney(customer.totalDue)} />
        <DetailRow label="Location" value={formatLocation(customer)} />
        <DetailRow label="Last Order" value={formatDate(customer.lastOrderAt)} />
      </dl>

      <div className="mt-5 grid gap-3">
        <Link
          className="rounded-2xl bg-[#527B86] px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90"
          href={`/customers/profile?phone=${encodeURIComponent(customer.phone)}`}
        >
          Open Profile
        </Link>
        <Link
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-stone-50"
          href={`/orders/details?id=${customer.lastOrderId}`}
        >
          Last Order Details
        </Link>
        <DisabledButton tone="good">WhatsApp Offer - Not Connected</DisabledButton>
        <DisabledButton>Call Customer - Not Connected</DisabledButton>
      </div>

      <div className="mt-5 rounded-2xl bg-stone-50 p-4">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
          Recent Orders
        </div>
        <div className="mt-3 space-y-2">
          {customer.recentOrders.map((order) => (
            <div
              className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-xs"
              key={order.id}
            >
              <div className="min-w-0">
                <div className="truncate font-bold text-slate-900">
                  {order.order_number ?? "No order number"}
                </div>
                <div className="text-slate-500">
                  {formatStatus(order.order_status)}
                </div>
              </div>
              <b className="shrink-0 text-slate-800">{formatMoney(order.total)}</b>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function RealCustomersPage({ customers }: RealCustomersPageProps) {
  const repeatCustomers = customers.filter(
    (customer) => customer.orderCount >= 2,
  ).length;
  const customersWithDue = customers.filter((customer) => customer.totalDue > 0)
    .length;
  const returnRiskCustomers = customers.filter(
    (customer) => customer.riskLabel === "High Return Risk",
  ).length;
  const totalCustomerDue = customers.reduce(
    (sum, customer) => sum + customer.totalDue,
    0,
  );
  const featuredCustomer = customers[0];

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                CRM Center
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Customers Database
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                Live customer summaries are generated from existing order
                records by normalized phone number. Dedicated customer records
                and customer mutations are not connected yet.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">{customers.length} grouped records</Badge>
              <Badge tone="default">Read Only</Badge>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Grouped by phone"
            index={0}
            label="Total Customers"
            value={customers.length}
          />
          <StatCard
            helper="2+ orders"
            index={1}
            label="Repeat Customers"
            tone="good"
            value={repeatCustomers}
          />
          <StatCard
            helper={`Due total ${formatMoney(totalCustomerDue)}`}
            index={2}
            label="Customers With Due"
            tone={customersWithDue ? "warn" : "good"}
            value={customersWithDue}
          />
          <StatCard
            helper="2+ returns"
            index={3}
            label="Return Risk"
            tone={returnRiskCustomers ? "bad" : "good"}
            value={returnRiskCustomers}
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    CRM Center
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Customers Database
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledButton>Export - Not Connected</DisabledButton>
                  <DisabledButton tone="brand">
                    Create Segment - Not Connected
                  </DisabledButton>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm font-medium text-slate-500 outline-none"
                  disabled
                  placeholder="Search customer / phone / district - Not connected"
                />
                <div className="flex flex-wrap gap-2">
                  {[
                    "All",
                    "Repeat Customer",
                    "Due Pending",
                    "High Return Risk",
                  ].map((item) => (
                    <button
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 opacity-75"
                      disabled
                      key={item}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {customers.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-stone-50 text-slate-500">
                    <tr>
                      {[
                        "Customer",
                        "Orders",
                        "Lifetime Spend",
                        "City/District",
                        "Segment/Risk",
                        "Last Order",
                        "Recent",
                        "Action",
                      ].map((heading) => (
                        <th className="px-5 py-4 font-medium" key={heading}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer, index) => (
                      <tr
                        className={`border-t border-slate-100 align-top transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#527B86] ${
                          index === 0
                            ? "bg-[#527B86]/[0.04] shadow-[inset_3px_0_0_#527B86]"
                            : "bg-white"
                        }`}
                        key={customer.phone}
                      >
                        <td className="px-5 py-4">
                          <div className="font-black text-slate-950">
                            {customer.name}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">
                            {customer.phone}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {formatText(customer.email)}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-black text-slate-950">
                          {customer.orderCount}
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-800">
                          {formatMoney(customer.totalSpent)}
                          <div className="mt-1 text-xs font-semibold text-slate-400">
                            Due {formatMoney(customer.totalDue)}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-700">
                            {formatLocation(customer)}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {formatText(customer.delivery_zone)}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={getRiskTone(customer.riskLabel)}>
                            {getTableSegment(customer)}
                          </Badge>
                          <div className="mt-2 space-y-1 text-xs font-semibold text-slate-500">
                            <div>Delivered {customer.deliveredCount}</div>
                            <div>Returned {customer.returnedCount}</div>
                            <div>Cancelled {customer.cancelledCount}</div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">
                            {customer.lastOrderNumber ?? "No order number"}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {formatStatus(customer.lastOrderStatus)}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {formatDate(customer.lastOrderAt)}
                          </div>
                        </td>
                        <td className="max-w-[240px] px-5 py-4">
                          <div className="space-y-2">
                            {customer.recentOrders.map((order) => (
                              <div
                                className="rounded-xl bg-stone-50 px-3 py-2 text-xs"
                                key={order.id}
                              >
                                <div className="font-bold text-slate-800">
                                  {order.order_number ?? "No order number"} /{" "}
                                  {formatMoney(order.total)}
                                </div>
                                <div className="mt-1 text-slate-500">
                                  {formatStatus(order.order_status)} / Due{" "}
                                  {formatMoney(order.due_amount)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-2">
                            <Link
                              className="inline-flex rounded-xl bg-[#527B86]/10 px-3 py-2 text-xs font-bold text-[#527B86] transition hover:bg-[#527B86] hover:text-white"
                              href={`/customers/profile?phone=${encodeURIComponent(
                                customer.phone,
                              )}`}
                            >
                              Profile
                            </Link>
                            <Link
                              className="inline-flex rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-800 hover:text-white"
                              href={`/orders/details?id=${customer.lastOrderId}`}
                            >
                              Last Order
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-14 text-center text-sm font-semibold text-slate-500">
                No customers could be grouped from order data yet.
              </div>
            )}
          </section>

          <div className="space-y-6">
            <CustomerProfilePanel customer={featuredCustomer} />

            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                Customer Note
              </div>
              <p className="mt-2 text-sm leading-6 text-amber-700">
                Profiles are read-only and generated from order history by
                phone number. Dedicated customer editing, segmentation,
                outreach, and manual order creation are not connected yet.
              </p>
            </section>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
