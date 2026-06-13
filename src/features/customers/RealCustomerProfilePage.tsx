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
  const icons = ["O", "T", "R", "L"];
  const helperClassName = {
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    default: "bg-stone-50 text-slate-600",
  }[tone];

  return (
    <section className="group relative overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5E7F85]/5 transition group-hover:bg-[#5E7F85]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-sm font-black text-[#5E7F85]">
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

function DisabledButton({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const className = {
    brand: "border-[#5E7F85]/20 bg-[#5E7F85]/10 text-[#5E7F85]",
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

function BackLink() {
  return (
    <Link
      className="inline-flex rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-bold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white"
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

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
  return [profile.district, profile.area].filter(Boolean).join(" / ");
}

function getLatestOrder(profile: CustomerProfileRecord) {
  return profile.orders[0];
}

function getLoyaltyScore(profile: CustomerProfileRecord) {
  const repeatScore = Math.min(profile.orderCount * 8, 48);
  const spendScore = Math.min(Math.round(profile.totalSpent / 500), 32);
  const duePenalty = profile.totalDue > 0 ? 10 : 0;
  const returnPenalty = Math.min(profile.returnedCount * 8, 20);

  return Math.max(0, Math.min(100, repeatScore + spendScore - duePenalty - returnPenalty));
}

function getSpendTrend(profile: CustomerProfileRecord) {
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const sortedOrders = profile.orders
    .toSorted((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;

      return aTime - bTime;
    })
    .slice(-6);

  const values = sortedOrders.map((order) => order.total);
  const paddedValues = [
    ...Array(Math.max(0, 6 - values.length)).fill(0),
    ...values,
  ].slice(-6);

  return paddedValues.map((value, index) => ({
    label: monthLabels[index],
    value,
  }));
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
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5E7F85]">
                  Customer Profile
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                  Profile Not Found
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

  const latestOrder = getLatestOrder(profile);
  const location = getLocation(profile) || "Location not available";
  const loyaltyScore = getLoyaltyScore(profile);
  const spendTrend = getSpendTrend(profile);
  const maxSpend = Math.max(...spendTrend.map((item) => item.value), 1);

  return (
    <AdminShell>
      <div className="space-y-6">
        <BackLink />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="From matching orders"
            index={0}
            label="Total Orders"
            value={profile.orderCount}
          />
          <StatCard
            helper="High repeat potential"
            index={1}
            label="Lifetime Value"
            value={formatMoney(profile.totalSpent)}
          />
          <StatCard
            helper={profile.totalDue > 0 ? `Due ${formatMoney(profile.totalDue)}` : "Low risk customer"}
            index={2}
            label="COD Risk Score"
            tone={getRiskTone(profile.riskLabel)}
            value={`${Math.max(0, 100 - loyaltyScore)}/100`}
          />
          <StatCard
            helper={latestOrder?.order_number ?? "No order number"}
            index={3}
            label="Last Order"
            value={formatDate(profile.lastOrderAt)}
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-br from-[#5E7F85]/10 via-white to-stone-50 p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] bg-[#5E7F85] text-2xl font-black text-white shadow-sm">
                      {getInitials(profile.name)}
                      <div className="absolute -bottom-2 -right-2 rounded-full border-4 border-white bg-white">
                        <Badge tone={getRiskTone(profile.riskLabel)}>
                          {profile.riskLabel}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500">
                        Customer Identity
                      </div>
                      <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                        {profile.name}
                      </h1>
                      <div className="mt-1 text-sm font-semibold text-slate-500">
                        {profile.phone} / {location}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge tone={getRiskTone(profile.riskLabel)}>
                          {profile.riskLabel}
                        </Badge>
                        <Badge tone="default">Read Only</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] bg-white p-4 text-center shadow-sm ring-1 ring-slate-100">
                    <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border-[8px] border-stone-100">
                      <div
                        className="absolute inset-0 rounded-full border-[8px] border-[#5E7F85]"
                        style={{
                          clipPath: `inset(${100 - loyaltyScore}% 0 0 0)`,
                        }}
                      />
                      <div className="text-xl font-black text-[#5E7F85]">
                        {loyaltyScore}%
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Loyalty
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 p-6 md:grid-cols-3">
                <div className="rounded-2xl bg-stone-50 p-4">
                  <div className="text-xs text-slate-500">First Order</div>
                  <div className="mt-1 font-bold text-slate-900">
                    {formatDate(profile.firstOrderAt)}
                  </div>
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  <div className="text-xs text-slate-500">Orders</div>
                  <div className="mt-1 font-bold text-slate-900">
                    {profile.orderCount}
                  </div>
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  <div className="text-xs text-slate-500">Spend</div>
                  <div className="mt-1 font-bold text-slate-900">
                    {formatMoney(profile.totalSpent)}
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card eyebrow="Purchase Timeline" title="6 Order Spend Trend">
                <div className="flex h-40 items-end gap-3 rounded-2xl bg-stone-50 p-4">
                  {spendTrend.map((item) => (
                    <div
                      className="flex flex-1 flex-col items-center gap-2"
                      key={item.label}
                    >
                      <div
                        className="w-full rounded-xl bg-[#5E7F85]"
                        style={{
                          height: `${Math.max(8, (item.value / maxSpend) * 100)}%`,
                        }}
                      />
                      <div className="text-[10px] text-slate-500">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card eyebrow="Order Insights" title="Most Purchased">
                <div className="space-y-3">
                  {[
                    `${profile.deliveredCount} delivered orders`,
                    `${profile.shippedCount} shipped orders`,
                    `${profile.returnedCount} returned orders`,
                  ].map((item) => (
                    <div
                      className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700"
                      key={item}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Order History
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Recent Orders
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="brand">{profile.orders.length} orders</Badge>
                  <DisabledButton>Export</DisabledButton>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-stone-50 text-slate-500">
                    <tr>
                      {[
                        "Order",
                        "Status",
                        "Payment",
                        "Courier",
                        "Total",
                        "Due",
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
                        className="border-t border-slate-100 align-top transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85]"
                        key={order.id}
                      >
                        <td className="px-5 py-4 font-black text-slate-950">
                          {order.order_number ?? "No order number"}
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
                        <td className="px-5 py-4 font-bold text-slate-800">
                          {formatMoney(order.total)}
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-800">
                          {formatMoney(order.due_amount)}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            className="inline-flex rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-bold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white"
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

            <div className="grid gap-6 lg:grid-cols-3">
              <Card eyebrow="Live Activity Feed" title="Order Activity">
                <div className="space-y-3 text-sm">
                  <div className="rounded-2xl bg-stone-50 px-4 py-3 font-semibold text-slate-700">
                    Delivered orders: {profile.deliveredCount}
                  </div>
                  <div className="rounded-2xl bg-stone-50 px-4 py-3 font-semibold text-slate-700">
                    Shipped orders: {profile.shippedCount}
                  </div>
                  <div className="rounded-2xl bg-stone-50 px-4 py-3 font-semibold text-slate-700">
                    Last order: {formatDate(profile.lastOrderAt)}
                  </div>
                </div>
              </Card>

              <Card eyebrow="Tags & Notes" title="Read-Only Notes">
                <div className="flex flex-wrap gap-2">
                  <Badge tone={getRiskTone(profile.riskLabel)}>
                    {profile.riskLabel}
                  </Badge>
                  <Badge tone={profile.totalDue > 0 ? "warn" : "good"}>
                    {profile.totalDue > 0 ? "Due Pending" : "No Due"}
                  </Badge>
                  <Badge tone={profile.orderCount >= 2 ? "good" : "default"}>
                    {profile.orderCount >= 2 ? "Repeat" : "New"}
                  </Badge>
                </div>
                <p className="mt-4 rounded-xl bg-stone-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-700">
                  Profile is generated from matching order rows by phone number.
                  Dedicated notes, customer tags, and manual segmentation are not
                  connected yet.
                </p>
              </Card>

              <Card eyebrow="Risk Intelligence" title="Order Risk">
                <dl className="space-y-3">
                  <DetailRow
                    label="Returned"
                    value={profile.returnedCount}
                  />
                  <DetailRow
                    label="Cancelled"
                    value={profile.cancelledCount}
                  />
                  <DetailRow
                    label="Due"
                    value={formatMoney(profile.totalDue)}
                  />
                </dl>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <Card title="Action Center">
              <div className="grid gap-3">
                <DisabledButton tone="brand">
                  Create Order - Not Connected
                </DisabledButton>
                <DisabledButton tone="good">
                  WhatsApp Offer - Not Connected
                </DisabledButton>
                <DisabledButton>Call Customer - Not Connected</DisabledButton>
                <DisabledButton>Upsell Combo - Not Connected</DisabledButton>
                <DisabledButton>Recovery Offer - Not Connected</DisabledButton>
                <DisabledButton>Export - Not Connected</DisabledButton>
              </div>
            </Card>

            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                AI Recommendation
              </div>
              <p className="mt-2 text-sm leading-6 text-amber-700">
                Suggestions are preview-only. This page shows live order-derived
                profile data only and does not create offers, customer notes, or
                outreach history.
              </p>
            </section>

            <Card eyebrow="Current Route" title="Profile Source">
              <dl className="space-y-3">
                <DetailRow label="Phone" value={profile.phone} />
                <DetailRow
                  label="Source"
                  value="Orders grouped by normalized phone"
                />
                <DetailRow label="Mutation" value="Not connected" />
              </dl>
            </Card>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
