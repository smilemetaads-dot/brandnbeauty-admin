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

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-[#527B86] via-[#6f949a] to-[#d9e5e1] p-6 text-white">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">
                  Customers
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight">
                  Customers
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/85">
                  Live customer summary grouped from existing order records by
                  phone number. Dedicated customer profiles come later.
                </p>
              </div>
              <Badge tone="default">Read Only</Badge>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            helper="Grouped by phone"
            label="Total Customers"
            value={customers.length}
          />
          <StatCard
            helper="2+ orders"
            label="Repeat Customers"
            tone="good"
            value={repeatCustomers}
          />
          <StatCard
            helper="Outstanding balance"
            label="Customers With Due"
            tone={customersWithDue ? "warn" : "good"}
            value={customersWithDue}
          />
          <StatCard
            helper="2+ returns"
            label="Return Risk"
            tone={returnRiskCustomers ? "bad" : "good"}
            value={returnRiskCustomers}
          />
          <StatCard
            helper="From order due amounts"
            label="Total Customer Due"
            tone={totalCustomerDue ? "warn" : "good"}
            value={formatMoney(totalCustomerDue)}
          />
        </section>

        <section className="rounded-2xl border border-[#527B86]/20 bg-[#527B86]/5 px-5 py-4 text-sm font-bold text-[#527B86]">
          Customer data is grouped from orders by phone number. Dedicated
          customers table/profile, customer edit, and customer delete are not
          connected yet.
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Order-Derived Customers
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Customer Summary
              </h2>
            </div>
            <Badge tone="brand">{customers.length} grouped records</Badge>
          </div>

          {customers.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-slate-500">
                  <tr>
                    {[
                      "Customer",
                      "Location",
                      "Orders",
                      "Spend",
                      "Due",
                      "Delivery/Return",
                      "Risk",
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
                  {customers.map((customer) => (
                    <tr
                      className="border-t border-slate-100 align-top transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#527B86]"
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
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-700">
                          {formatLocation(customer)}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {formatText(customer.delivery_zone)}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-black text-slate-950">
                        {customer.orderCount}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800">
                        {formatMoney(customer.totalSpent)}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800">
                        {formatMoney(customer.totalDue)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1 text-xs font-semibold text-slate-500">
                          <div>Delivered {customer.deliveredCount}</div>
                          <div>Returned {customer.returnedCount}</div>
                          <div>Cancelled {customer.cancelledCount}</div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={getRiskTone(customer.riskLabel)}>
                          {customer.riskLabel}
                        </Badge>
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
                        <Link
                          className="inline-flex rounded-xl bg-[#527B86]/10 px-3 py-2 text-xs font-bold text-[#527B86] transition hover:bg-[#527B86] hover:text-white"
                          href={`/orders/details?id=${customer.lastOrderId}`}
                        >
                          Last Order
                        </Link>
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
      </div>
    </AdminShell>
  );
}
