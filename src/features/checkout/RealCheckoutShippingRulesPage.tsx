import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const shippingRules = [
  {
    helper: "Dhaka metro preview",
    label: "Dhaka City delivery charge",
    value: "Tk 60",
  },
  {
    helper: "Near-Dhaka area preview",
    label: "Dhaka Sub-Area delivery charge",
    value: "Tk 90",
  },
  {
    helper: "Nationwide courier preview",
    label: "Outside Dhaka delivery charge",
    value: "Tk 120",
  },
  {
    helper: "Conversion rule preview",
    label: "Free delivery threshold",
    value: "Tk 999",
  },
];

const zoneRows = [
  {
    charge: "Tk 60",
    coverage: "Inside Dhaka metro",
    eta: "24-48h",
    rule: "Dhaka City",
    status: "Preview",
  },
  {
    charge: "Tk 90",
    coverage: "Savar, Keraniganj, Narayanganj",
    eta: "2-3 days",
    rule: "Dhaka Sub-Area",
    status: "Preview",
  },
  {
    charge: "Tk 120",
    coverage: "All other Bangladesh districts",
    eta: "3-5 days",
    rule: "Outside Dhaka",
    status: "Preview",
  },
];

const courierRules = [
  {
    partner: "Steadfast",
    priority: "Primary COD courier",
    scope: "Dhaka + outside Dhaka",
    status: "Setup pending",
  },
  {
    partner: "Pathao",
    priority: "Fallback courier",
    scope: "Metro delivery only",
    status: "Preview",
  },
  {
    partner: "Manual Dispatch",
    priority: "Admin fallback",
    scope: "Any covered zone",
    status: "Preview",
  },
];

const features = [
  "Dhaka City delivery charge",
  "Dhaka Sub-Area delivery charge",
  "Outside Dhaka delivery charge",
  "Free delivery threshold",
  "Payment method visibility",
  "Checkout required fields",
];

const paymentMethods = ["Cash on Delivery", "bKash", "Bank Transfer"];
const requiredFields = ["Customer name", "Phone number", "District", "Address"];
const checkoutNotes = [
  "Do not expose delivery charge controls to storefront until real settings are connected.",
  "Checkout should keep recalculating totals server-side before order creation.",
  "COD and online payment visibility must be wired through a safe action later.",
];

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const className = {
    bad: "bg-rose-50 text-rose-700",
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    default: "bg-slate-100 text-slate-700",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  helper,
  icon,
  label,
  tone = "good",
  value,
}: {
  helper: string;
  icon: string;
  label: string;
  tone?: BadgeTone;
  value: ReactNode;
}) {
  const helperClassName = {
    bad: "bg-rose-50 text-rose-700",
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    default: "bg-stone-50 text-slate-600",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <div className="group relative overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5E7F85]/5 transition group-hover:bg-[#5E7F85]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 truncate text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xs font-bold text-[#5E7F85] transition group-hover:bg-[#5E7F85] group-hover:text-white">
          {icon}
        </div>
      </div>
      <div
        className={`relative mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${helperClassName}`}
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
          ? "rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white opacity-45"
          : "rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-400"
      }
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function PreviewField({
  helper,
  label,
  value,
}: {
  helper: string;
  label: string;
  value: string;
}) {
  return (
    <label className="block rounded-2xl bg-stone-50 p-4">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <input
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none disabled:bg-white disabled:text-slate-500"
        disabled
        readOnly
        value={value}
      />
      <span className="mt-2 block text-xs text-slate-500">{helper}</span>
    </label>
  );
}

function PreviewSwitch({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <button
        className="rounded-full bg-[#5E7F85]/10 px-3 py-1 text-xs font-bold text-[#5E7F85] opacity-70"
        disabled
        type="button"
      >
        Preview only
      </button>
    </div>
  );
}

function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: ReactNode }) {
  return (
    <td className="px-4 py-4 align-top text-sm font-semibold text-slate-700">
      {children}
    </td>
  );
}

export function RealCheckoutShippingRulesPage() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Ready for build"
            icon="#"
            label="Module Status"
            value="Added"
          />
          <StatCard
            helper="Checkout flow"
            icon="Flow"
            label="Frontend Match"
            tone="brand"
            value="Planned"
          />
          <StatCard
            helper="Build later"
            icon="Rule"
            label="Rules"
            tone="default"
            value="0"
          />
          <StatCard
            helper="Order conversion"
            icon="!"
            label="Priority"
            tone="warn"
            value="High"
          />
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Order Flow Module
              </div>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Checkout & Shipping Rules
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Preview-only control room for delivery zones, shipping fees, COD
                visibility, and required checkout fields. No checkout rules are
                connected yet.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">New Module</Badge>
              <Badge tone="warn">Preview only</Badge>
            </div>
          </div>

          <div className="grid gap-3 p-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <div
                className="rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-slate-700"
                key={feature}
              >
                {feature}
              </div>
            ))}
          </div>
        </section>

        <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Shipping Fees
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Delivery Charge Rules
                  </h2>
                </div>
                <DisabledButton primary>Save Rules</DisabledButton>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {shippingRules.map((rule) => (
                  <PreviewField
                    helper={rule.helper}
                    key={rule.label}
                    label={rule.label}
                    value={rule.value}
                  />
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Zone Matrix
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Delivery Zone & Charge Table
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledButton>Import Zones</DisabledButton>
                  <DisabledButton primary>Publish Rules</DisabledButton>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[760px] text-left">
                  <thead className="bg-stone-50">
                    <tr>
                      <TableHeader>Rule</TableHeader>
                      <TableHeader>Coverage</TableHeader>
                      <TableHeader>Charge</TableHeader>
                      <TableHeader>ETA</TableHeader>
                      <TableHeader>Status</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {zoneRows.map((row) => (
                      <tr
                        className="border-t border-slate-100 hover:bg-stone-50"
                        key={row.rule}
                      >
                        <TableCell>
                          <span className="font-black text-slate-950">
                            {row.rule}
                          </span>
                        </TableCell>
                        <TableCell>{row.coverage}</TableCell>
                        <TableCell>{row.charge}</TableCell>
                        <TableCell>{row.eta}</TableCell>
                        <TableCell>
                          <Badge tone="warn">{row.status}</Badge>
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Courier Mapping
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Shipping Partner Rules
                  </h2>
                </div>
                <DisabledButton>Sync Courier Setup</DisabledButton>
              </div>

              <div className="grid gap-3 p-6 lg:grid-cols-3">
                {courierRules.map((rule) => (
                  <div
                    className="rounded-2xl border border-slate-100 bg-stone-50 p-4"
                    key={rule.partner}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black text-slate-950">
                          {rule.partner}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-500">
                          {rule.scope}
                        </div>
                      </div>
                      <Badge tone="default">{rule.status}</Badge>
                    </div>
                    <div className="mt-4 text-sm font-semibold leading-6 text-slate-700">
                      {rule.priority}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Checkout Restrictions
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Required Fields
                  </h2>
                </div>
                <Badge tone="brand">Safety first</Badge>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {requiredFields.map((field) => (
                  <PreviewSwitch key={field} label={field} />
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Payment Visibility
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Methods at Checkout
              </h2>
              <div className="mt-5 space-y-3">
                {paymentMethods.map((method) => (
                  <PreviewSwitch key={method} label={method} />
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                COD Controls
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Checkout Payment Rules
              </h2>
              <div className="mt-5 space-y-3">
                <PreviewField
                  helper="Preview-only threshold for COD eligibility."
                  label="Minimum COD order"
                  value="Tk 0"
                />
                <PreviewField
                  helper="Visual guardrail only; no checkout logic is changed."
                  label="Maximum COD order"
                  value="Tk 10,000"
                />
              </div>
            </section>

            <section className="rounded-[2rem] border border-[#5E7F85]/20 bg-[#5E7F85]/5 p-6 shadow-sm">
              <div className="text-sm font-bold text-[#5E7F85]">
                Preview Status
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This screen does not save checkout settings, write Supabase data,
                or modify storefront checkout behavior. Controls are visual only
                until real checkout/shipping actions exist.
              </p>
              <div className="mt-5">
                <DisabledButton>Preview Checkout</DisabledButton>
              </div>
            </section>

            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                Checkout Safety Notes
              </div>
              <div className="mt-4 space-y-3">
                {checkoutNotes.map((note) => (
                  <div
                    className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold leading-6 text-amber-800"
                    key={note}
                  >
                    {note}
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
