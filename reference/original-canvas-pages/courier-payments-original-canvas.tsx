// REFERENCE ONLY.
// Original Canvas Courier & Payments design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Courier & Payments page.

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
  const icons = ["#", "T", "C", "!"];

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

export default function CourierPaymentsPage() {
  const mode = "Dispatch";
  const shipments = [
    {
      charge: 120,
      cod: 1930,
      courierStatus: "Ready to Send",
      customer: "Sadia Akter",
      id: "#1021",
      partner: "Steadfast",
      payment: "Unsettled",
      phone: "01822XXXXXX",
      received: 0,
      tracking: "Pending",
    },
    {
      charge: 70,
      cod: 980,
      courierStatus: "Delivered",
      customer: "Raisa Khan",
      id: "#1018",
      partner: "Pathao",
      payment: "Settled",
      phone: "01711XXXXXX",
      received: 910,
      tracking: "PT-88421",
    },
  ];
  const totalCod = shipments.reduce((sum, item) => sum + item.cod, 0);
  const totalCharges = shipments.reduce((sum, item) => sum + item.charge, 0);
  const totalReceived = shipments.reduce((sum, item) => sum + item.received, 0);
  const mismatchCount = shipments.filter(
    (item) => item.payment === "Mismatch" || item.payment === "Due",
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          helper="Can send courier"
          index={0}
          label="Ready Dispatch"
          value="62"
        />
        <StatCard
          helper="Awaiting settlement"
          index={1}
          label="COD Pipeline"
          value={`BDT ${totalCod}`}
        />
        <StatCard
          helper="Estimated cost"
          index={2}
          label="Courier Charge"
          value={`BDT ${totalCharges}`}
        />
        <StatCard
          helper="Need finance review"
          index={3}
          label="Mismatch"
          value={mismatchCount}
        />
      </div>

      <div className="rounded-2xl border border-[#5E7F85]/20 bg-[#5E7F85]/5 px-5 py-4 text-sm font-semibold text-[#5E7F85]">
        2 parcels ready for courier upload
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-[1.4rem] border border-slate-200 bg-white p-2 shadow-sm">
        {["Dispatch", "Tracking", "Settlement"].map((tab) => (
          <button
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              mode === tab ? "bg-[#5E7F85] text-white shadow-sm" : "text-slate-600"
            }`}
            key={tab}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Courier Dispatch Center
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight">
                  Courier Dispatch Queue
                </h2>
                <div className="mt-1 text-sm text-slate-500">
                  Send ready parcels to courier in bulk with one click.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold"
                  type="button"
                >
                  Export CSV
                </button>
                <button
                  className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white"
                  type="button"
                >
                  Send to Courier
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-slate-500">
                <tr>
                  {[
                    "Order",
                    "Customer",
                    "Partner",
                    "Tracking",
                    "COD",
                    "Charge",
                    "Courier",
                    "Settlement",
                    "Received",
                    "Action",
                  ].map((head) => (
                    <th className="px-5 py-4 font-medium" key={head}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shipments.map((item) => (
                  <tr
                    className="border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85]"
                    key={item.id}
                  >
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {item.id}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">
                        {item.customer}
                      </div>
                      <div className="text-xs text-slate-500">{item.phone}</div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone="brand">{item.partner}</Badge>
                    </td>
                    <td className="px-5 py-4 font-semibold">{item.tracking}</td>
                    <td className="px-5 py-4 font-semibold">BDT {item.cod}</td>
                    <td className="px-5 py-4">BDT {item.charge}</td>
                    <td className="px-5 py-4">
                      <Badge tone="brand">{item.courierStatus}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone="warn">{item.payment}</Badge>
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      BDT {item.received}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-semibold text-[#5E7F85]"
                        type="button"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Dispatch Summary
            </div>
            <h3 className="mt-1 text-xl font-bold tracking-tight">
              Today Dispatch
            </h3>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Expected COD</span>
                <b>BDT {totalCod - totalCharges}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Received</span>
                <b className="text-emerald-700">BDT {totalReceived}</b>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Courier Health
            </div>
            <h3 className="mt-1 text-xl font-bold tracking-tight">
              Partner Performance
            </h3>
            <div className="mt-5 space-y-3">
              {[
                "Steadfast: 86% delivery",
                "Pathao: 78% delivery",
                "Paperfly: setup pending",
              ].map((item) => (
                <div
                  className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
