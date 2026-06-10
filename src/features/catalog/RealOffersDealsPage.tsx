import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

type OfferPreview = {
  badge: string;
  channel: string;
  conflict: "Safe" | "Watch" | "Conflict";
  conversion: string;
  discount: string;
  discountCost: string;
  end: string;
  id: string;
  margin: string;
  netProfit: string;
  orders: string;
  products: string[];
  revenue: string;
  start: string;
  status: "Live" | "Scheduled" | "Ending Soon" | "Draft";
  stock: "Safe" | "Watch" | "Fast Moving";
  title: string;
  type: string;
  visibility: string;
};

const offers: OfferPreview[] = [
  {
    badge: "BOGO",
    channel: "Website",
    conflict: "Watch",
    conversion: "23%",
    discount: "1 Free",
    discountCost: "Tk 11,200",
    end: "May 07",
    id: "bogo-cleanser",
    margin: "42%",
    netProfit: "Tk 18,300",
    orders: "58",
    products: ["Acne Balance Facewash", "Glow Support Cleanser"],
    revenue: "Tk 42,500",
    start: "May 01",
    status: "Live",
    stock: "Safe",
    title: "Buy 1 Get 1 Facewash Deal",
    type: "Buy 1 Get 1",
    visibility: "Homepage",
  },
  {
    badge: "Combo",
    channel: "Website + Messenger",
    conflict: "Conflict",
    conversion: "21%",
    discount: "Tk 150 Off",
    discountCost: "Tk 6,600",
    end: "May 18",
    id: "glow-combo",
    margin: "51%",
    netProfit: "Tk 31,200",
    orders: "44",
    products: ["Barrier Calm Serum", "Hydra Gel Moisturizer", "Daily Sun Gel"],
    revenue: "Tk 68,400",
    start: "May 03",
    status: "Live",
    stock: "Watch",
    title: "Glow Routine Combo",
    type: "Combo Offer",
    visibility: "PDP + Cart",
  },
  {
    badge: "Free Delivery",
    channel: "Website",
    conflict: "Safe",
    conversion: "19%",
    discount: "Delivery Free",
    discountCost: "Tk 9,120",
    end: "May 31",
    id: "free-delivery",
    margin: "Healthy",
    netProfit: "Tk 37,400",
    orders: "76",
    products: ["All visible products above threshold"],
    revenue: "Tk 92,200",
    start: "May 01",
    status: "Scheduled",
    stock: "Safe",
    title: "Free Delivery Over Tk 999",
    type: "Free Shipping",
    visibility: "Checkout",
  },
  {
    badge: "Clearance",
    channel: "Website",
    conflict: "Watch",
    conversion: "24%",
    discount: "Up to 40%",
    discountCost: "Tk 8,200",
    end: "May 05",
    id: "clearance",
    margin: "Low",
    netProfit: "Tk 4,100",
    orders: "21",
    products: ["Old Toner Sample", "Near expiry body wash", "Slow moving moisturizer"],
    revenue: "Tk 18,800",
    start: "Apr 25",
    status: "Ending Soon",
    stock: "Fast Moving",
    title: "Clearance Stock Sale",
    type: "Clearance Sale",
    visibility: "Offers Page",
  },
  {
    badge: "Inbox Deal",
    channel: "Messenger",
    conflict: "Safe",
    conversion: "21%",
    discount: "Tk 100 Off",
    discountCost: "Tk 3,300",
    end: "May 12",
    id: "messenger",
    margin: "48%",
    netProfit: "Tk 14,600",
    orders: "33",
    products: ["Peeling Gel", "Brightening Soap"],
    revenue: "Tk 31,200",
    start: "May 02",
    status: "Draft",
    stock: "Safe",
    title: "Messenger Exclusive Combo",
    type: "Messenger Deal",
    visibility: "Hidden",
  },
];

const selectedOffer = offers[0];
const topOffers = [offers[2], offers[1], offers[0]];

const safetyRows = [
  ["Stock", true],
  ["Margin", true],
  ["Conflict", false],
  ["Dates", true],
  ["Visibility", true],
  ["Messenger", true],
] as const;

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const toneClassName: Record<BadgeTone, string> = {
    bad: "bg-rose-50 text-rose-700 ring-rose-100",
    brand: "bg-[#5E7F85]/10 text-[#4f747a] ring-[#5E7F85]/15",
    default: "bg-slate-100 text-slate-600 ring-slate-200",
    good: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    warn: "bg-amber-50 text-amber-700 ring-amber-100",
  };

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${toneClassName[tone]}`}
    >
      {children}
    </span>
  );
}

function DisabledButton({
  children,
  className = "",
  title = "Offers workflow is not connected yet",
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <button
      aria-label={title}
      className={`cursor-not-allowed disabled:opacity-100 ${className}`}
      disabled
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}

function StatCard({
  active = false,
  item,
}: {
  active?: boolean;
  item: [string, string, string];
}) {
  return (
    <div
      className={`rounded-[1.6rem] border p-5 shadow-sm transition ${
        active
          ? "border-[#5E7F85]/20 bg-[#5E7F85]/10"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-500">{item[0]}</div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            {item[1]}
          </div>
          <div className="mt-2 text-xs font-semibold text-slate-500">
            {item[2]}
          </div>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-[#5E7F85] shadow-sm">
          %
        </span>
      </div>
    </div>
  );
}

function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-stone-50 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
      {children}
    </thead>
  );
}

export function RealOffersDealsPage() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#5E7F85] via-[#6f949a] to-[#d9e5e1] p-6 text-white">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/15" />
            <div className="absolute bottom-0 left-1/2 h-36 w-36 rounded-full bg-white/10" />
            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">
                  Catalog Promotions
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight">
                  Offers & Deals Control Room
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/85">
                  Create BOGO, combo, clearance, free delivery and Messenger-only
                  offers with stock, margin, conflict and automation safety
                  control.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <DisabledButton className="rounded-2xl bg-white/15 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur">
                  Preview Page
                </DisabledButton>
                <DisabledButton className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-sm">
                  Create Offer
                </DisabledButton>
              </div>
            </div>
          </div>
          <div className="grid gap-3 border-t border-white/20 bg-stone-50/80 p-4 text-sm md:grid-cols-5">
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Offer revenue: <b className="text-[#5E7F85]">Tk 253,100</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Net profit: <b className="text-emerald-700">Tk 105,600</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Discount cost: <b className="text-amber-700">Preview</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Date view: <b className="text-slate-900">30D</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Conflict: <b className="text-rose-700">1</b>
            </div>
          </div>
        </section>

        <section className="overflow-visible rounded-[1.7rem] border border-[#5E7F85]/15 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#5E7F85]">
                Campaign Period Filter
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-600">
                Performance numbers are preview-only until offer analytics are
                connected.
              </div>
            </div>
            <div className="flex flex-col gap-3 xl:items-end">
              <div className="flex flex-wrap gap-2">
                {["Today", "7D", "30D", "This Month"].map((item) => (
                  <DisabledButton
                    className={`rounded-full px-4 py-2 text-xs font-semibold ${
                      item === "30D"
                        ? "bg-[#5E7F85] text-white"
                        : "border border-slate-200 bg-white text-slate-600"
                    }`}
                    key={item}
                  >
                    {item}
                  </DisabledButton>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <DisabledButton className="rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  May 01, 2026
                </DisabledButton>
                <DisabledButton className="rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  May 31, 2026
                </DisabledButton>
                <DisabledButton className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">
                  Apply
                </DisabledButton>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard active item={["Active Offers", "2", "Live on storefront"]} />
          <StatCard item={["Offer Revenue", "Tk 253,100", "Free Delivery Over Tk 999"]} />
          <StatCard item={["Conversion Rate", "21%", "Clicks to order"]} />
          <StatCard active item={["Ending / Conflict", "1/1", "Need decision"]} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Promotion Engine
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Offer Campaign List
                  </h2>
                  <div className="mt-2 text-sm text-slate-500">
                    Manage discount rules, product mapping, margins, conflicts
                    and storefront placement.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledButton className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                    Bulk Schedule
                  </DisabledButton>
                  <DisabledButton className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">
                    Create Offer
                  </DisabledButton>
                </div>
              </div>
              <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                <div className="relative max-w-xl">
                  <input
                    className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-10 text-sm outline-none"
                    disabled
                    placeholder="Search offer / type / channel / conflict..."
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    Search
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "All",
                    "Live",
                    "Scheduled",
                    "Ending Soon",
                    "Draft",
                    "Buy 1 Get 1",
                    "Combo Offer",
                    "Clearance Sale",
                    "Conflict",
                    "Hidden",
                  ].map((item) => (
                    <DisabledButton
                      className={`rounded-full px-4 py-2 text-xs font-semibold ${
                        item === "All"
                          ? "bg-[#5E7F85] text-white"
                          : "border border-slate-200 bg-white text-slate-600"
                      }`}
                      key={item}
                    >
                      {item}
                    </DisabledButton>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1120px] text-left text-sm xl:min-w-full">
                <TableHead>
                  <tr>
                    {[
                      "Offer",
                      "Type",
                      "Revenue",
                      "Profit",
                      "Conv.",
                      "Discount Cost",
                      "Stock",
                      "Conflict",
                      "Status",
                      "Action",
                    ].map((head) => (
                      <th className="px-5 py-4 font-medium" key={head}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </TableHead>
                <tbody>
                  {offers.map((offer) => (
                    <tr
                      className={`border-t border-slate-100 transition ${
                        offer.id === selectedOffer.id
                          ? "bg-[#5E7F85]/[0.06] shadow-[inset_3px_0_0_#5E7F85]"
                          : offer.conflict === "Conflict"
                            ? "bg-rose-50/25"
                            : offer.status === "Ending Soon"
                              ? "bg-amber-50/30"
                              : "bg-white"
                      }`}
                      key={offer.id}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xs font-black text-[#5E7F85]">
                            %
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {offer.title}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {offer.badge} / {offer.channel} / {offer.visibility}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone="brand">{offer.type}</Badge>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {offer.revenue}
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-700">
                        {offer.netProfit}
                      </td>
                      <td className="px-5 py-4 font-semibold">{offer.conversion}</td>
                      <td className="px-5 py-4 font-semibold text-amber-700">
                        {offer.discountCost}
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={offer.stock === "Safe" ? "good" : "warn"}>
                          {offer.stock}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          tone={
                            offer.conflict === "Conflict"
                              ? "bad"
                              : offer.conflict === "Watch"
                                ? "warn"
                                : "good"
                          }
                        >
                          {offer.conflict}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          tone={
                            offer.status === "Live"
                              ? "good"
                              : offer.status === "Ending Soon" ||
                                  offer.status === "Scheduled"
                                ? "warn"
                                : "default"
                          }
                        >
                          {offer.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <DisabledButton className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-semibold text-[#5E7F85]">
                            Edit
                          </DisabledButton>
                          <DisabledButton className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                            Open
                          </DisabledButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Selected Offer
                  </div>
                  <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    {selectedOffer.title}
                  </h3>
                  <div className="mt-1 text-xs text-slate-500">
                    {selectedOffer.type} / {selectedOffer.channel}
                  </div>
                </div>
                <Badge tone="good">{selectedOffer.status}</Badge>
              </div>
              <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-stone-50 p-4">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5E7F85] via-[#789ca2] to-[#d9e5e1] p-5 text-white shadow-sm">
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15" />
                  <div className="relative">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
                      {selectedOffer.badge}
                    </div>
                    <div className="mt-3 text-2xl font-black tracking-tight">
                      {selectedOffer.title}
                    </div>
                    <div className="mt-2 text-sm font-medium text-white/85">
                      {selectedOffer.discount} / {selectedOffer.start} to{" "}
                      {selectedOffer.end}
                    </div>
                    <DisabledButton className="mt-5 rounded-2xl bg-white px-4 py-2 text-xs font-bold text-slate-900">
                      Shop Offer
                    </DisabledButton>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Revenue", selectedOffer.revenue],
                    ["Orders", selectedOffer.orders],
                    ["Net Profit", selectedOffer.netProfit],
                    ["Discount Cost", selectedOffer.discountCost],
                  ].map(([label, value]) => (
                    <div className="rounded-2xl bg-white p-4" key={label}>
                      <div className="text-xs text-slate-500">{label}</div>
                      <div className="mt-1 font-bold text-slate-900">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <DisabledButton className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">
                  Edit Offer
                </DisabledButton>
                <DisabledButton className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                  Duplicate Offer
                </DisabledButton>
                <DisabledButton className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  Pause Offer
                </DisabledButton>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Top Performing Offers
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                30D
              </h3>
              <div className="mt-4 space-y-3">
                {topOffers.map((offer, index) => (
                  <div
                    className={`w-full rounded-2xl px-4 py-3 text-left text-xs ${
                      offer.id === selectedOffer.id
                        ? "bg-[#5E7F85]/10 ring-2 ring-[#5E7F85]/15"
                        : "bg-stone-50"
                    }`}
                    key={offer.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-slate-800">
                        #{index + 1} {offer.title}
                      </span>
                      <span className="font-black text-[#5E7F85]">
                        {offer.netProfit}
                      </span>
                    </div>
                    <div className="mt-2 text-slate-500">
                      Revenue {offer.revenue} / Orders {offer.orders}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Offer Safety Panel
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Publish Protection
              </h3>
              <div className="mt-4 grid gap-2">
                {safetyRows.map(([label, ok]) => (
                  <div
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-bold ${
                      ok
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                    key={label}
                  >
                    <span>{label}</span>
                    <span>{ok ? "Safe" : "Review"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-6 shadow-sm">
              <div className="text-sm font-bold text-[#5E7F85]">
                Automation Rule Summary
              </div>
              <div className="mt-4 space-y-3 text-xs font-semibold leading-5 text-slate-700">
                {[
                  "Stock low হলে offer auto pause হবে",
                  "Offer expired হলে auto disable হবে",
                  "Double discount conflict হলে publish block হবে",
                  "Messenger sync ON থাকলে inbox offer reply তে যাবে",
                ].map((item) => (
                  <div className="rounded-2xl bg-white px-4 py-3" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Product Mapping
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Offer Products
              </h3>
              <div className="mt-4 space-y-2">
                {selectedOffer.products.map((item, index) => (
                  <div
                    className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 text-xs"
                    key={item}
                  >
                    <span className="font-bold text-slate-700">{item}</span>
                    <span className="rounded-full bg-white px-2 py-1 font-bold text-[#5E7F85]">
                      #{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Offer Builder
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Create / Edit Offer Preview
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                This builder mirrors the Canvas controls but is preview-only
                until a real Offers schema and action workflow are connected.
              </p>
            </div>
            <Badge tone="warn">Not Connected</Badge>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              "Offer storefront preview",
              "Product mapping",
              "Discount safety check",
              "Date schedule",
              "Messenger offer sync",
              "Margin protection",
              "Conflict checker",
              "Auto pause rules",
            ].map((item) => (
              <div
                className="rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-slate-700"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
