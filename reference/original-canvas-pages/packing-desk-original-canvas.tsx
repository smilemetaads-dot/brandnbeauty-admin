// REFERENCE ONLY.
// Original Canvas Packing Desk design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Packing Desk page.

import type { ReactNode } from "react";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

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
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function StatCard({
  helper,
  index,
  label,
  value,
}: {
  helper: string;
  index: number;
  label: string;
  value: ReactNode;
}) {
  const icons = ["#", "P", ">", "!"];

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
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xs font-bold text-[#5E7F85]">
          {icons[index % icons.length]}
        </div>
      </div>
      <div className="relative mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        {helper}
      </div>
    </div>
  );
}

export default function PackingDeskPage() {
  const orders = [
    {
      customer: "Sadia Akter",
      id: "#1021",
      items: [
        { name: "Acne Facewash", qty: 1 },
        { name: "Barrier Calm Serum", qty: 1 },
      ],
      note: "Confirm free sample before pack",
      phone: "01822XXXXXX",
      priority: "High",
    },
    {
      customer: "Raisa Khan",
      id: "#1018",
      items: [{ name: "Hydra Gel Moisturizer", qty: 1 }],
      note: "No gift wrap",
      phone: "01711XXXXXX",
      priority: "Normal",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          helper="Confirmed orders"
          index={0}
          label="Ready to Pack"
          value="37"
        />
        <StatCard helper="Today" index={1} label="Printed Slips" value="24" />
        <StatCard helper="Ready courier" index={2} label="Packed" value="62" />
        <StatCard helper="Need verify" index={3} label="Mismatch Risk" value="3" />
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Packing Desk</h2>
            <div className="mt-1 text-sm text-slate-500">
              Print slips, verify products, and mark parcels ready without
              mistakes.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold"
              type="button"
            >
              Bulk Print Slips
            </button>
            <button
              className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white"
              type="button"
            >
              Mark Ready Courier
            </button>
          </div>
        </div>

        <div className="grid gap-5 p-6 xl:grid-cols-3">
          {orders.map((order) => (
            <div
              className="flex h-full flex-col rounded-[1.5rem] border border-slate-200 bg-stone-50 p-5 shadow-sm"
              key={order.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-bold text-slate-900">
                    {order.id}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-700">
                    {order.customer}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {order.phone}
                  </div>
                </div>
                <Badge
                  tone={
                    order.priority === "High"
                      ? "bad"
                      : order.priority === "Medium"
                        ? "warn"
                        : "good"
                  }
                >
                  {order.priority}
                </Badge>
              </div>

              <div className="mt-5 flex-1 rounded-2xl bg-white p-4">
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Pick Items
                </div>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <label
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-stone-50 px-3 py-3 text-sm"
                      key={item.name}
                    >
                      <span className="font-semibold text-slate-800">
                        {item.name}
                      </span>
                      <span className="flex items-center gap-3">
                        <b>Qty {item.qty}</b>
                        <input
                          className="h-4 w-4 rounded border-slate-300"
                          type="checkbox"
                        />
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                {order.note}
              </div>

              <div className="mt-auto grid grid-cols-2 gap-3 pt-5">
                <button
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold"
                  type="button"
                >
                  Print Slip
                </button>
                <button
                  className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white"
                  type="button"
                >
                  Mark Packed
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
