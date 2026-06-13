// REFERENCE ONLY.
// Original Canvas Checkout & Shipping Rules design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Checkout & Shipping Rules page.

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
  const icons = ["#", "Flow", "Rule", "!"];

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

export default function OrderSettingsPlaceholderPage() {
  const page = "Checkout & Shipping Rules";
  const features = [
    "Dhaka City delivery charge",
    "Dhaka Sub-Area delivery charge",
    "Outside Dhaka delivery charge",
    "Free delivery threshold",
    "Payment method visibility",
    "Checkout required fields",
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          helper="Ready for build"
          index={0}
          label="Module Status"
          value="Added"
        />
        <StatCard
          helper="Checkout flow"
          index={1}
          label="Frontend Match"
          value="Planned"
        />
        <StatCard helper="Build later" index={2} label="Rules" value="0" />
        <StatCard
          helper="Order conversion"
          index={3}
          label="Priority"
          value="High"
        />
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-slate-500">
              Order Flow Module
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight">{page}</h2>
            <div className="mt-2 text-sm leading-6 text-slate-500">
              This page is added to the Orders menu. Full page build will be done
              later.
            </div>
          </div>
          <Badge tone="brand">New Module</Badge>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <div
              className="rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-slate-700"
              key={feature}
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
