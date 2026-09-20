"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import type { CustomerOrderSummaryRecord, CustomerProfileRecord } from "./customers-data";

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
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    default: "bg-slate-100 text-slate-600",
  }[tone];

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize ${className}`}>
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
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
      {eyebrow ? <div className="text-sm font-medium text-slate-500">{eyebrow}</div> : null}
      <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function StatCard({ label, value, helper }: { label: string; value: ReactNode; helper: string }) {
  return (
    <section className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</div>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-slate-800 sm:max-w-[68%] sm:text-right">{value}</dd>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      className="inline-flex rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-bold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#5E7F85] focus:ring-offset-2"
      href="/customers"
    >
      Back to Customers
    </Link>
  );
}

function formatMoney(value: number | null | undefined) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "Tk 0";
  }

  return new Intl.NumberFormat("en-BD", {
    currency: "BDT",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount).replace("BDT", "Tk");
}

function formatStatus(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`)
    .join(" ");
}

function getOrderStatusTone(status: string | null | undefined): BadgeTone {
  if (status === "delivered") {
    return "good";
  }

  if (status === "cancelled" || status === "returned") {
    return "bad";
  }

  if (status === "pending" || status === "pending_sourcing" || status === "processing") {
    return "warn";
  }

  return "brand";
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatText(value: string | null | undefined, fallback = "Not provided") {
  const normalized = value?.trim();

  return normalized || fallback;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "BN";
}

function getLocation(profile: CustomerProfileRecord) {
  const parts = [profile.district, profile.area].map((part) => part?.trim()).filter(Boolean);

  return parts.join(", ");
}

function getLatestOrder(profile: CustomerProfileRecord) {
  return profile.orders[0];
}

function OrderMobileCard({ order }: { order: CustomerOrderSummaryRecord }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-slate-950">{order.order_number ?? `Order ${order.id}`}</div>
          <div className="mt-1 text-xs text-slate-500">{formatDate(order.created_at)}</div>
        </div>
        <Badge tone={getOrderStatusTone(order.order_status)}>{formatStatus(order.order_status)}</Badge>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Total</dt>
          <dd className="mt-1 font-semibold text-slate-800">{formatMoney(order.total)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Payment</dt>
          <dd className="mt-1 text-slate-700">{formatStatus(order.payment_status)}</dd>
        </div>
      </dl>
      <Link
        className="mt-4 inline-flex rounded-lg bg-[#5E7F85]/10 px-3 py-2 text-xs font-bold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#5E7F85] focus:ring-offset-2"
        href={`/orders/details?id=${order.id}`}
      >
        View Order
      </Link>
    </article>
  );
}

function CustomerContactCard({ profile }: { profile: CustomerProfileRecord }) {
  const [copyState, setCopyState] = useState("Copy Phone");
  const location = getLocation(profile);

  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(profile.phone);
      setCopyState("Copied");
      window.setTimeout(() => setCopyState("Copy Phone"), 1800);
    } catch {
      setCopyState("Copy failed");
      window.setTimeout(() => setCopyState("Copy Phone"), 1800);
    }
  }

  return (
    <Card title="Contact Information">
      <dl>
        <DetailRow
          label="Phone"
          value={
            <span className="inline-flex flex-wrap items-center justify-end gap-2">
              <a className="text-[#3D676E] underline-offset-4 hover:underline" href={`tel:${profile.phone}`}>
                {profile.phone}
              </a>
              <button
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-[#5E7F85] hover:text-[#3D676E] focus:outline-none focus:ring-2 focus:ring-[#5E7F85] focus:ring-offset-2"
                onClick={() => void copyPhone()}
                type="button"
              >
                {copyState}
              </button>
            </span>
          }
        />
        <DetailRow
          label="Email"
          value={
            profile.email ? (
              <a className="text-[#3D676E] underline-offset-4 hover:underline" href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
            ) : (
              "Not provided"
            )
          }
        />
        <DetailRow label="Address" value={formatText(profile.address)} />
        <DetailRow label="Location" value={location || "Not provided"} />
      </dl>
    </Card>
  );
}

export function RealCustomerProfilePage({ profile }: RealCustomerProfilePageProps) {
  if (!profile) {
    return (
      <AdminShell>
        <div className="space-y-6">
          <BackLink />
          <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5E7F85]">Customer Profile</div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Profile Not Found</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  This customer profile could not be loaded from existing order data. Return to Customers and open a profile from an existing customer row.
                </p>
              </div>
              <Badge tone="default">Read Only</Badge>
            </div>
          </section>
        </div>
      </AdminShell>
    );
  }

  const latestOrder = getLatestOrder(profile);
  const location = getLocation(profile);

  return (
    <AdminShell>
      <div className="space-y-6">
        <BackLink />

        <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-[#5E7F85]/10 via-white to-stone-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#5E7F85] text-xl font-black text-white shadow-sm">
                {getInitials(profile.name)}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500">Customer Profile</div>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{profile.name}</h1>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {profile.phone}{location ? ` / ${location}` : ""}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard helper="Orders linked to this customer." label="Total Orders" value={profile.orderCount} />
          <StatCard helper="Real order-derived spend." label="Total Spent" value={formatMoney(profile.totalSpent)} />
          <StatCard helper={latestOrder?.order_number ?? "No order reference"} label="Last Order" value={formatDate(profile.lastOrderAt)} />
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">Order History</div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Customer Orders</h2>
              </div>
              <Badge tone="brand">{profile.orders.length} orders</Badge>
            </div>

            {profile.orders.length === 0 ? (
              <div className="p-10 text-center text-sm font-medium text-slate-500">No orders found for this customer.</div>
            ) : (
              <>
                <div className="grid gap-3 p-4 md:hidden">
                  {profile.orders.map((order) => (
                    <OrderMobileCard key={order.id} order={order} />
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-stone-50 text-slate-500">
                      <tr>
                        {['Order Reference', 'Date', 'Status', 'Total', 'Action'].map((heading) => (
                          <th className="px-5 py-4 font-medium" key={heading}>{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {profile.orders.map((order) => (
                        <tr className="border-t border-slate-100 align-top transition hover:bg-stone-50" key={order.id}>
                          <td className="px-5 py-4 font-bold text-slate-950">{order.order_number ?? `Order ${order.id}`}</td>
                          <td className="px-5 py-4 text-slate-600">{formatDate(order.created_at)}</td>
                          <td className="px-5 py-4">
                            <Badge tone={getOrderStatusTone(order.order_status)}>{formatStatus(order.order_status)}</Badge>
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-800">{formatMoney(order.total)}</td>
                          <td className="px-5 py-4">
                            <Link
                              className="inline-flex rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-bold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#5E7F85] focus:ring-offset-2"
                              href={`/orders/details?id=${order.id}`}
                            >
                              View Order
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          <div className="space-y-6">
            <CustomerContactCard profile={profile} />
            <Card title="Customer Summary">
              <dl>
                <DetailRow label="First Order" value={formatDate(profile.firstOrderAt)} />
                <DetailRow label="Last Order" value={formatDate(profile.lastOrderAt)} />
                <DetailRow label="Total Orders" value={profile.orderCount} />
                <DetailRow label="Total Spent" value={formatMoney(profile.totalSpent)} />
              </dl>
            </Card>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
