import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

type BadgeTone = "brand" | "good" | "warn" | "default";

const operationalRows = [
  ["Admin print invoice", "Live", "Available from Order Details"],
  ["Customer thank-you page", "Live", "Shown after successful checkout"],
  ["Track Order", "Live", "Order reference + customer mobile"],
  ["Payment wording", "Live", "Cash on Delivery"],
  ["Customer PDF download", "Not built", "No customer-facing PDF download is claimed"],
  ["Editable thank-you copy", "Not built", "Copy is currently storefront code-controlled"],
];

const confirmationFacts = [
  "The thank-you page reads the successful order stored in the current browser session.",
  "Order reference, delivery details, ordered items and payment summary are shown when available.",
  "Track Order is linked from the thank-you page.",
  "Purchase tracking uses the order conversion token after checkout.",
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

function statusTone(status: string): BadgeTone {
  if (status === "Live") return "good";
  if (status === "Not built") return "warn";
  return "default";
}

export function RealInvoiceThankYouSettingsPage() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#5E7F85]">Order Confirmation Truth</div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Invoice & Thank You</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Operational status of the live invoice and post-checkout flow. Editable settings are not presented as live until a real persistence layer exists.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="good">Operational routes live</Badge>
              <Badge tone="warn">Settings partial</Badge>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="text-sm font-medium text-slate-500">Current capability</div>
            <h2 className="mt-1 text-xl font-black text-slate-950">What is actually available now</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[760px] text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-[0.1em] text-slate-400">
                <tr>
                  <th className="px-5 py-4">Capability</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Production truth</th>
                </tr>
              </thead>
              <tbody>
                {operationalRows.map(([capability, status, truth]) => (
                  <tr className="border-t border-slate-100" key={capability}>
                    <td className="px-5 py-4 font-black text-slate-950">{capability}</td>
                    <td className="px-5 py-4"><Badge tone={statusTone(status)}>{status}</Badge></td>
                    <td className="px-5 py-4 font-semibold text-slate-600">{truth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Thank-you flow</div>
            <h2 className="mt-1 text-xl font-black text-slate-950">Live customer confirmation</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {confirmationFacts.map((item) => (
                <div className="rounded-2xl bg-stone-50 px-4 py-4 text-sm font-semibold leading-6 text-slate-700" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-[#5E7F85]/20 bg-[#5E7F85]/5 p-6 shadow-sm">
              <div className="text-sm font-bold text-[#5E7F85]">Admin invoice</div>
              <h2 className="mt-1 text-xl font-black text-slate-950">Print route is live</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Staff can open an order and use Print Invoice. This page does not claim a PDF generator that does not exist.
              </p>
            </section>

            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">Why this stays Partial</div>
              <p className="mt-2 text-sm leading-6 text-amber-900">
                The live routes work, but there is not yet a persisted Admin settings API for changing invoice branding or thank-you copy. That is intentionally separated from launch-critical operations.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
