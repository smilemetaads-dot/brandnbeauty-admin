import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

type RecommendationRule = {
  addToCart: string;
  aovLift: string;
  automation: string;
  conversion: string;
  goal: "Conversion" | "AOV" | "Discovery" | "Recovery";
  id: string;
  placement: string;
  priority: "High" | "Medium" | "Low";
  products: string;
  productsList: string[];
  revenue: string;
  status: "Active" | "Scheduled" | "Draft";
  stock: "Safe" | "Watch" | "Mixed";
  title: string;
  trigger: string;
  type: string;
};

const recommendationRules: RecommendationRule[] = [
  {
    addToCart: "146",
    aovLift: "+22%",
    automation: "Auto Refresh",
    conversion: "18%",
    goal: "Conversion",
    id: "acne-routine",
    placement: "PDP",
    priority: "High",
    products: "4",
    productsList: [
      "Acne Balance Facewash",
      "Barrier Calm Serum",
      "Hydra Gel Moisturizer",
      "Daily Sun Gel",
    ],
    revenue: "Tk 84,500",
    status: "Active",
    stock: "Safe",
    title: "Acne Routine Builder",
    trigger: "Concern: Acne",
    type: "Complete Your Routine",
  },
  {
    addToCart: "118",
    aovLift: "+28%",
    automation: "Manual Locked",
    conversion: "19%",
    goal: "AOV",
    id: "fbt-serum",
    placement: "PDP + Cart",
    priority: "High",
    products: "2",
    productsList: ["Barrier Calm Serum", "Hydra Gel Moisturizer"],
    revenue: "Tk 62,200",
    status: "Active",
    stock: "Watch",
    title: "Serum + Moisturizer Combo",
    trigger: "Bought Together",
    type: "Frequently Bought Together",
  },
  {
    addToCart: "69",
    aovLift: "+11%",
    automation: "Auto Refresh",
    conversion: "13%",
    goal: "Discovery",
    id: "similar-facewash",
    placement: "PDP Bottom",
    priority: "Medium",
    products: "6",
    productsList: [
      "Acne Balance Facewash",
      "Hydra Gel Moisturizer",
      "Niacinamide Serum",
    ],
    revenue: "Tk 38,500",
    status: "Active",
    stock: "Safe",
    title: "Similar Facewash Suggestions",
    trigger: "Same Category",
    type: "Similar Products",
  },
  {
    addToCart: "92",
    aovLift: "+31%",
    automation: "Rule Based",
    conversion: "21%",
    goal: "AOV",
    id: "cart-upsell",
    placement: "Cart Drawer",
    priority: "High",
    products: "3",
    productsList: ["Daily Sun Gel", "Routine Bundle", "Hydra Gel Moisturizer"],
    revenue: "Tk 52,400",
    status: "Scheduled",
    stock: "Safe",
    title: "Cart Upsell Add-on",
    trigger: "Cart Value",
    type: "Cart Recommendation",
  },
  {
    addToCart: "44",
    aovLift: "+8%",
    automation: "Behavior Based",
    conversion: "6%",
    goal: "Recovery",
    id: "recently-viewed",
    placement: "PDP + Homepage",
    priority: "Low",
    products: "8",
    productsList: ["Routine Bundle", "Daily Sun Gel"],
    revenue: "Tk 21,200",
    status: "Draft",
    stock: "Mixed",
    title: "Recently Viewed Recovery",
    trigger: "Browsing History",
    type: "Recently Viewed",
  },
];

const selectedRule = recommendationRules[0];
const topRules = [recommendationRules[0], recommendationRules[1], recommendationRules[3]];

const strategyCards = [
  ["Conversion", "PDP routine + FBT", "Push add-to-cart"],
  ["AOV", "Cart add-on + bundle", "Increase order value"],
  ["Discovery", "Similar + recommended", "Help product browsing"],
  ["Recovery", "Recently viewed", "Bring users back"],
] as const;

const tabs = [
  "PDP Blocks",
  "Cart Upsell",
  "Routine Builder",
  "Automation",
] as const;

const builderItems = [
  "PDP recommendation preview",
  "Product sequence control",
  "Routine-step mapping",
  "Stock-safe automation",
  "Cart upsell rules",
  "Messenger sync",
  "Recently viewed recovery",
  "AOV lift tracking",
];

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
  title = "Recommendation workflow is not connected yet",
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
          Up
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

function goalTone(goal: RecommendationRule["goal"]): BadgeTone {
  if (goal === "AOV") {
    return "brand";
  }

  if (goal === "Recovery") {
    return "warn";
  }

  return "good";
}

export function RealProductRecommendationsPage() {
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
                  Catalog Intelligence
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight">
                  Product Recommendations Engine
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/85">
                  Control PDP recommendations, complete-routine blocks,
                  frequently bought together, cart upsells, similar products and
                  recovery rules with stock, margin and conversion safety.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <DisabledButton className="rounded-2xl bg-white/15 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur">
                  Preview PDP
                </DisabledButton>
                <DisabledButton className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-sm">
                  Create Rule
                </DisabledButton>
              </div>
            </div>
          </div>
          <div className="grid gap-3 border-t border-white/20 bg-stone-50/80 p-4 text-sm md:grid-cols-5">
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Revenue: <b className="text-[#5E7F85]">Tk 258,800</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Add to cart: <b className="text-emerald-700">469</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Avg conv.: <b className="text-slate-900">15%</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              AOV lift: <b className="text-[#5E7F85]">+20%</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Stock watch: <b className="text-amber-700">2</b>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard active item={["Active Rules", "3", "Live blocks"]} />
          <StatCard
            item={["Recommendation Sales", "Tk 258,800", "Attributed revenue"]}
          />
          <StatCard item={["AOV Lift", "+20%", "Bundle effect"]} />
          <StatCard active item={["Stock Watch", "2", "Review mapping"]} />
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-[#5E7F85]/15 bg-white shadow-sm">
          <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <div className="text-sm font-bold text-slate-900">
                Recommendation Strategy Board
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Use different goals for different placements: conversion, AOV,
                discovery and recovery.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Conversion", "AOV", "Discovery", "Recovery"].map((item) => (
                <DisabledButton
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    item === "Conversion"
                      ? "bg-[#5E7F85] text-white"
                      : "border border-slate-200 bg-stone-50 text-slate-600"
                  }`}
                  key={item}
                >
                  {item}
                </DisabledButton>
              ))}
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 md:grid-cols-4">
            {strategyCards.map(([goal, title, desc]) => (
              <div
                className={`rounded-2xl p-4 text-left ${
                  goal === "Conversion"
                    ? "bg-[#5E7F85] text-white shadow-sm"
                    : "bg-white text-slate-700"
                }`}
                key={goal}
              >
                <div className="font-bold">{title}</div>
                <div
                  className={`mt-1 text-xs ${
                    goal === "Conversion" ? "text-white/80" : "text-slate-500"
                  }`}
                >
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-wrap items-center gap-2 rounded-[1.4rem] border border-slate-200 bg-white p-2 shadow-sm">
          {tabs.map((tab) => (
            <DisabledButton
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                tab === "PDP Blocks"
                  ? "bg-[#5E7F85] text-white shadow-sm"
                  : "text-slate-600"
              }`}
              key={tab}
            >
              {tab}
            </DisabledButton>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Recommendation Rules
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Conversion Mapping List
                  </h2>
                  <div className="mt-2 text-sm text-slate-500">
                    Set product sequence, placement, trigger logic, stock safety
                    and conversion priority.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledButton className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                    Bulk Mapping
                  </DisabledButton>
                  <DisabledButton className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">
                    Create Rule
                  </DisabledButton>
                </div>
              </div>
              <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                <div className="relative max-w-xl">
                  <input
                    className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-10 text-sm outline-none"
                    disabled
                    placeholder="Search rule / type / placement / trigger..."
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    Search
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "All",
                    "Active",
                    "Scheduled",
                    "Draft",
                    "High",
                    "Safe",
                    "Watch",
                    "Conversion",
                    "AOV",
                    "Discovery",
                    "Recovery",
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
              <table className="min-w-[1100px] text-left text-sm xl:min-w-full">
                <TableHead>
                  <tr>
                    {[
                      "Rule",
                      "Type",
                      "Goal",
                      "Placement",
                      "Trigger",
                      "Revenue",
                      "Conv.",
                      "AOV",
                      "Stock",
                      "Action",
                    ].map((head) => (
                      <th className="px-5 py-4 font-medium" key={head}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </TableHead>
                <tbody>
                  {recommendationRules.map((rule) => (
                    <tr
                      className={`border-t border-slate-100 ${
                        rule.id === selectedRule.id
                          ? "bg-[#5E7F85]/[0.06] shadow-[inset_3px_0_0_#5E7F85]"
                          : rule.stock !== "Safe"
                            ? "bg-amber-50/25"
                            : "bg-white"
                      }`}
                      key={rule.id}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xs font-black text-[#5E7F85]">
                            REC
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {rule.title}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {rule.products} products / {rule.automation}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone="brand">{rule.type}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={goalTone(rule.goal)}>{rule.goal}</Badge>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {rule.placement}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{rule.trigger}</td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {rule.revenue}
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {rule.conversion}
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-700">
                        {rule.aovLift}
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={rule.stock === "Safe" ? "good" : "warn"}>
                          {rule.stock}
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
                    Selected Rule
                  </div>
                  <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    {selectedRule.title}
                  </h3>
                  <div className="mt-1 text-xs text-slate-500">
                    {selectedRule.type} / {selectedRule.placement}
                  </div>
                </div>
                <Badge tone="good">{selectedRule.status}</Badge>
              </div>
              <div className="mt-5 rounded-3xl border border-slate-200 bg-stone-50 p-4">
                <div className="rounded-3xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-bold text-slate-900">
                      PDP Preview Block
                    </div>
                    <Badge tone="brand">{selectedRule.products} items</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {selectedRule.productsList.slice(0, 4).map((item, index) => (
                      <div
                        className="rounded-2xl border border-slate-100 bg-stone-50 p-3"
                        key={item}
                      >
                        <div className="flex aspect-square items-center justify-center rounded-xl bg-white text-xs font-bold text-slate-400">
                          IMG
                        </div>
                        <div className="mt-2 text-xs font-bold text-slate-800">
                          {item}
                        </div>
                        <div className="mt-1 text-[10px] text-[#5E7F85]">
                          Sequence #{index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Revenue", selectedRule.revenue],
                    ["Add to Cart", selectedRule.addToCart],
                    ["Conversion", selectedRule.conversion],
                    ["AOV Lift", selectedRule.aovLift],
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
                  Edit Rule
                </DisabledButton>
                <DisabledButton className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                  Duplicate Rule
                </DisabledButton>
                <DisabledButton className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  Pause Rule
                </DisabledButton>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Live Sequence Test
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Preview Product
              </h3>
              <div className="mt-4 rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700">
                Acne Balance Facewash
              </div>
              <div className="mt-4 space-y-2">
                {selectedRule.productsList.map((item, index) => (
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

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">Top Rules</div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Revenue Ranking
              </h3>
              <div className="mt-4 space-y-3">
                {topRules.map((rule, index) => (
                  <div
                    className={`w-full rounded-2xl px-4 py-3 text-left text-xs ${
                      rule.id === selectedRule.id
                        ? "bg-[#5E7F85]/10 ring-2 ring-[#5E7F85]/15"
                        : "bg-stone-50"
                    }`}
                    key={rule.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-slate-800">
                        #{index + 1} {rule.title}
                      </span>
                      <span className="font-black text-[#5E7F85]">
                        {rule.revenue}
                      </span>
                    </div>
                    <div className="mt-2 text-slate-500">
                      AOV {rule.aovLift} / Conv {rule.conversion}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                Professional Rule
              </div>
              <div className="mt-2 text-sm leading-6 text-amber-700">
                Prioritize same concern, next routine step, in-stock products,
                healthy margin and proven best sellers. Out-of-stock products
                should be excluded from conversion blocks unless it is a notify-me
                recovery strategy.
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Recommendation Builder
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Create / Edit Rule Preview
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                This builder mirrors the Canvas controls but remains
                preview-only until a real recommendation schema and action
                workflow are connected.
              </p>
            </div>
            <Badge tone="warn">Not Connected</Badge>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {builderItems.map((item) => (
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
