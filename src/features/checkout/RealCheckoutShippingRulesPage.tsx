import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

type BadgeTone = "brand" | "good" | "warn" | "default";

const deliveryRules = [
  {
    coverage: "Dhaka district, regular city areas",
    label: "Dhaka City",
    charge: "Tk 60",
    source: "Storefront checkout",
  },
  {
    coverage: "Keraniganj, Demra, Savar, Ashulia, Dhamrai, Dohar, Nawabganj",
    label: "Dhaka Sub-Area",
    charge: "Tk 80",
    source: "Storefront checkout",
  },
  {
    coverage: "All other Bangladesh districts",
    label: "Outside Dhaka",
    charge: "Tk 120",
    source: "Storefront checkout",
  },
];

const requiredFields = [
  ["Full name", "Required"],
  ["Bangladesh mobile number", "Required"],
  ["Delivery address", "Required"],
  ["District", "Required"],
  ["Area / Thana", "Required"],
  ["Email", "Optional"],
];

const liveSafety = [
  "Order totals are recalculated by the live place-order endpoint before the order is created.",
  "Stocked products are checked against available stock before checkout submission.",
  "On-demand and minimum-order rules are respected by the storefront cart/checkout flow.",
  "An idempotency key protects the place-order request from accidental duplicate submissions.",
];

function Badge({ children, tone = "default" }: { children: ReactNode; tone?: BadgeTone }) {
  const classes = {
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    default: "bg-slate-100 text-slate-700",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
  }[tone];

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${classes}`}>{children}</span>;
}

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">{value}</div>
      <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p>
    </section>
  );
}

export function RealCheckoutShippingRulesPage() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#5E7F85]">Live Storefront Truth</div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Checkout & Shipping Rules</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Read-only view of the rules currently enforced by the production storefront. This page intentionally does not pretend to be an editable settings screen.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="good">Live</Badge>
              <Badge tone="brand">Read only</Badge>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Payment Method" value="COD only" helper="Cash on Delivery is the active checkout payment method." />
          <StatCard label="Dhaka City" value="Tk 60" helper="Current storefront delivery charge." />
          <StatCard label="Dhaka Sub-Area" value="Tk 80" helper="Current storefront delivery charge." />
          <StatCard label="Outside Dhaka" value="Tk 120" helper="Current storefront delivery charge." />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-6">
                <div className="text-sm font-medium text-slate-500">Delivery Matrix</div>
                <h2 className="mt-1 text-xl font-black text-slate-950">Rules in production checkout</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[760px] text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase tracking-[0.1em] text-slate-400">
                    <tr>
                      <th className="px-5 py-4">Zone</th>
                      <th className="px-5 py-4">Coverage</th>
                      <th className="px-5 py-4">Charge</th>
                      <th className="px-5 py-4">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryRules.map((rule) => (
                      <tr className="border-t border-slate-100" key={rule.label}>
                        <td className="px-5 py-4 font-black text-slate-950">{rule.label}</td>
                        <td className="px-5 py-4 font-semibold text-slate-600">{rule.coverage}</td>
                        <td className="px-5 py-4 font-black text-[#5E7F85]">{rule.charge}</td>
                        <td className="px-5 py-4"><Badge tone="good">{rule.source}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">Customer Input</div>
              <h2 className="mt-1 text-xl font-black text-slate-950">Checkout field requirements</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {requiredFields.map(([label, value]) => (
                  <div className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-4" key={label}>
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                    <Badge tone={value === "Required" ? "brand" : "default"}>{value}</Badge>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-[#5E7F85]/20 bg-[#5E7F85]/5 p-6 shadow-sm">
              <div className="text-sm font-bold text-[#5E7F85]">Payment rule</div>
              <h2 className="mt-1 text-xl font-black text-slate-950">Cash on Delivery</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                bKash and bank-transfer controls are not exposed here because they are not active checkout methods.
              </p>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">Checkout safety</div>
              <h2 className="mt-1 text-xl font-black text-slate-950">Live protections</h2>
              <div className="mt-5 space-y-3">
                {liveSafety.map((item) => (
                  <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">Configuration status</div>
              <p className="mt-2 text-sm leading-6 text-amber-900">
                These values are currently code-controlled in the storefront. Changing them requires a reviewed storefront change; this Admin page is a truthful read-only mirror.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
