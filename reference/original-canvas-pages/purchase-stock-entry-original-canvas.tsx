// REFERENCE ONLY.
// Original Canvas Purchase Stock Entry design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Purchase Stock Entry page.

import { type ReactNode, useState } from "react";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";
type StatItem = [string, string, string];
type ItemRow = [string, string, string, string, string, string, string, string];

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const cls =
    {
      default: "bg-slate-100 text-slate-700",
      good: "bg-emerald-50 text-emerald-700",
      warn: "bg-amber-50 text-amber-700",
      bad: "bg-rose-50 text-rose-700",
      brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    }[tone] || "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function StatCard({ item, index = 0 }: { item: StatItem; index?: number }) {
  const icons = ["Grid", "List", "BDT", "Go"];
  const trendText = String(item[2]).toLowerCase();
  const trendTone =
    trendText.includes("risk") ||
    trendText.includes("need") ||
    trendText.includes("blocked") ||
    trendText.includes("missing")
      ? "text-amber-600 bg-amber-50"
      : "text-emerald-700 bg-emerald-50";

  return (
    <button
      className="group relative w-full overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      type="button"
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5E7F85]/5 transition group-hover:bg-[#5E7F85]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-500">{item[0]}</div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {item[1]}
          </div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xl font-bold text-[#5E7F85]">
          {icons[index % icons.length]}
        </div>
      </div>
      <div
        className={`relative mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${trendTone}`}
      >
        {item[2]}
      </div>
    </button>
  );
}

function TableHead({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <thead className={`sticky top-0 z-10 bg-stone-50 text-slate-500 ${className}`}>
      {children}
    </thead>
  );
}

export default function PurchaseStockEntryPage() {
  const [paymentMethod, setPaymentMethod] = useState("Bank");

  const items: ItemRow[] = [
    ["Acne Control Facewash", "SKU-201", "48", "BDT 220", "BDT 550", "Sep 2027", "52%", "BDT 10,560"],
    ["Niacinamide Serum", "SKU-118", "24", "BDT 390", "BDT 750", "Jan 2028", "48%", "BDT 9,360"],
    ["Vitamin C Serum", "SKU-145", "18", "BDT 410", "BDT 790", "Aug 2026", "48%", "BDT 7,380"],
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5E7F85]">
              Inventory
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Purchase Stock Entry
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Add supplier purchase, update stock, monitor margin and prepare
              finance sync.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
              Save Draft
            </button>
            <button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">
              Post to Inventory
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Today Purchase", "BDT 27,300", "3 invoices added"],
          ["New SKUs", "3", "Fresh stock"],
          ["Pending Due", "BDT 18,500", "2 suppliers"],
          ["Avg Margin", "46%", "Healthy buying"],
        ].map((item, index) => (
          <StatCard item={item as StatItem} index={index} key={item[0]} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight">Purchase Entry</h2>
            <Badge tone="brand">Purchase Ready</Badge>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Supplier
              <select className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none">
                <option>Search / select supplier</option>
                <option>Some By Mi</option>
                <option>BrandnBeauty Factory</option>
                <option>Beauty of Joseon</option>
                <option>Simple</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Invoice No
              <input
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                placeholder="INV-2026-001"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Warehouse
              <input
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                placeholder="Main Warehouse"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Batch / GRN No
              <input
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-600 outline-none"
                placeholder="Auto GRN-1024"
              />
            </label>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <TableHead>
                <tr>
                  {[
                    "Product",
                    "SKU",
                    "Qty",
                    "Buy",
                    "Sell",
                    "Expiry",
                    "Margin",
                    "Total",
                    "Action",
                  ].map((head) => (
                    <th className="px-4 py-3 font-medium" key={head}>
                      {head}
                    </th>
                  ))}
                </tr>
              </TableHead>
              <tbody>
                {items.map((row) => (
                  <tr className="border-t border-slate-100 hover:bg-stone-50" key={row[0]}>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {row[0]}
                    </td>
                    {row.slice(1).map((cell, index) => (
                      <td className="px-4 py-3" key={`${row[0]}-${index}`}>
                        {index === 5 ? (
                          <span className="font-bold text-emerald-600">{cell}</span>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <button className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Summary</h2>
              <Badge tone="good">Live Sync</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["Subtotal", "BDT 27,300"],
                ["Transport / Other Cost", "BDT 800"],
                ["Previous Supplier Due", "BDT 18,500"],
                ["Paid Now", "BDT 10,000"],
                ["Remaining Due", "BDT 36,600"],
                ["Expected Stock Value", "BDT 54,700"],
              ].map(([label, value]) => (
                <div
                  className="flex justify-between rounded-2xl bg-stone-50 p-4 text-sm"
                  key={label}
                >
                  <span>{label}</span>
                  <b>{value}</b>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-stone-50 p-4">
              <div className="text-sm font-bold text-slate-900">Payment</div>
              <div className="mt-4 grid gap-3">
                <select
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  value={paymentMethod}
                >
                  <option>Bank</option>
                  <option>Cash</option>
                  <option>bKash</option>
                  <option>Due</option>
                </select>
                <input
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                  placeholder="Payment reference"
                />
                <input
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                  placeholder="Paid amount"
                />
              </div>
            </div>
            <button className="mt-4 w-full rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">
              Post to Inventory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
