// REFERENCE ONLY.
// Original Canvas Inventory design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Inventory page.

import React, { type ReactNode, useState } from "react";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";
type StatItem = [string, string, string];
type InventoryRow = [
  string,
  string,
  number,
  number,
  "Healthy" | "Low" | "Out",
  string,
  string,
];
type MovementRow = [string, string, string, string];

const statSets = {
  Inventory: [
    ["Total SKUs", "248", "Across all categories"],
    ["Low Stock", "14", "Need reorder soon"],
    ["Out of Stock", "6", "Sales blocked"],
    ["Today Movement", "182", "In + out combined"],
  ] satisfies StatItem[],
};

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

function StatCard({
  active = false,
  index = 0,
  item,
  onClick = null,
}: {
  active?: boolean;
  index?: number;
  item: StatItem;
  onClick?: (() => void) | null;
}) {
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
      type="button"
      onClick={onClick || undefined}
      className={`group relative w-full overflow-hidden rounded-[1.7rem] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? "border-[#5E7F85] ring-2 ring-[#5E7F85]/15" : "border-slate-200"
      } ${onClick ? "cursor-pointer" : "cursor-default"}`}
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

function ActionButtons({ actions = ["Edit", "View"] }: { actions?: string[] }) {
  return (
    <div className="flex items-center gap-2">
      {actions.map((action, index) => (
        <button
          key={action}
          className={
            index === 0
              ? "rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-semibold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white"
              : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-stone-50"
          }
        >
          {action}
        </button>
      ))}
    </div>
  );
}

function QuickActionButton({ children }: { children: ReactNode }) {
  return (
    <button className="group flex w-full items-center justify-between rounded-2xl bg-stone-50 p-4 text-left text-sm font-semibold text-slate-700 transition hover:bg-stone-100">
      <span>{children}</span>
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5E7F85]/10 text-sm font-bold text-[#5E7F85] transition group-hover:translate-x-0.5 group-hover:bg-[#5E7F85] group-hover:text-white">
        Go
      </span>
    </button>
  );
}

export default function InventoryPage() {
  const [stockFilter, setStockFilter] = useState("All");
  const [inventorySearch, setInventorySearch] = useState("");

  const inventoryRows: InventoryRow[] = [
    ["Acne Control Facewash", "SKU-201", 148, 60, "Healthy", "Some By Mi", "2h ago"],
    ["Niacinamide Serum", "SKU-118", 22, 30, "Low", "BrandnBeauty", "Today"],
    ["Vitamin C Serum", "SKU-145", 0, 20, "Out", "BrandnBeauty", "Yesterday"],
    ["Ketoconazole Shampoo", "SKU-331", 58, 25, "Healthy", "Derma Plus", "3h ago"],
  ];

  const stockFilters = ["All", "Healthy", "Low", "Out"];
  const filteredRows = inventoryRows.filter((row) => {
    const matchesStatus = stockFilter === "All" || row[4] === stockFilter;
    const matchesSearch =
      inventorySearch === "" ||
      row.join(" ").toLowerCase().includes(inventorySearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stockMovements: MovementRow[] = [
    ["Stock In", "+48", "Acne Control Facewash", "Purchase Entry"],
    ["Reserved", "-12", "Niacinamide Serum", "New Orders"],
    ["Adjusted", "-2", "Ketoconazole Shampoo", "Damage"],
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statSets.Inventory.map((item, index) => (
          <StatCard
            key={item[0]}
            item={item}
            index={index}
            active={item[0] === "Low Stock" || item[0] === "Out of Stock"}
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight">
                Inventory Control Center
              </h2>
              <Badge tone="brand">Automation Ready</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Clean stock view with low-risk manual control and future sync support.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800">
              Import CSV
            </button>
            <button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">
              Add Stock
            </button>
          </div>
        </div>

        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative max-w-md flex-1">
              <input
                value={inventorySearch}
                onChange={(event) => setInventorySearch(event.target.value)}
                placeholder="Search product / SKU / supplier..."
                className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-10 text-sm outline-none"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                Search
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {stockFilters.map((item) => (
                <button
                  key={item}
                  onClick={() => setStockFilter(item)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold ${
                    stockFilter === item
                      ? "bg-[#5E7F85] text-white"
                      : "border border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <TableHead>
              <tr>
                {["Product", "SKU", "Qty", "Reorder", "Available", "Status", "Action"].map(
                  (head) => (
                    <th key={head} className="px-5 py-4 font-medium">
                      {head}
                    </th>
                  ),
                )}
              </tr>
            </TableHead>
            <tbody>
              {filteredRows.map((row) => {
                const available = Math.max(Number(row[2]) - 8, 0);
                const percentage = Math.min(
                  (Number(row[2]) / Math.max(Number(row[3]), 1)) * 100,
                  100,
                );
                const status = row[4];

                return (
                  <tr
                    key={row[1]}
                    className={`border-t border-slate-100 hover:bg-stone-50 ${
                      status === "Out"
                        ? "bg-rose-50/40"
                        : status === "Low"
                          ? "bg-amber-50/40"
                          : ""
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{row[0]}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Supplier: {row[5]} - Updated {row[6]}
                      </div>
                    </td>
                    <td className="px-5 py-4">{row[1]}</td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{row[2]}</div>
                      <div className="mt-2 h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#5E7F85]"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4">{row[3]}</td>
                    <td
                      className={`px-5 py-4 font-semibold ${
                        available === 0
                          ? "text-rose-600"
                          : available <= Number(row[3])
                            ? "text-amber-600"
                            : "text-slate-900"
                      }`}
                    >
                      {available}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        tone={
                          status === "Healthy"
                            ? "good"
                            : status === "Low"
                              ? "warn"
                              : "bad"
                        }
                      >
                        {status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <ActionButtons actions={["Adjust", "Open"]} />
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                    No stock item found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-bold text-amber-900">Smart Alerts</h2>
          <div className="mt-4 space-y-3 text-sm text-amber-900">
            <div className="rounded-2xl bg-white/70 p-4">14 SKUs below reorder level</div>
            <div className="rounded-2xl bg-white/70 p-4">6 products out of stock</div>
            <div className="rounded-2xl bg-white/70 p-4">BDT 42k sales blocked by OOS</div>
            <div className="rounded-2xl bg-white/70 p-4">
              Duplicate stock entry protection recommended
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold tracking-tight">Today Stock Movement</h2>
          <div className="mt-5 space-y-3">
            {stockMovements.map((item) => (
              <div key={item[0] + item[2]} className="rounded-2xl bg-stone-50 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-900">{item[0]}</span>
                  <span
                    className={
                      String(item[1]).startsWith("+")
                        ? "font-bold text-emerald-600"
                        : "font-bold text-rose-600"
                    }
                  >
                    {item[1]}
                  </span>
                </div>
                <div className="mt-1 text-slate-500">
                  {item[2]} - {item[3]}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:col-span-2 xl:col-span-1">
          <h2 className="text-xl font-bold tracking-tight">Quick Actions</h2>
          <div className="mt-5 space-y-3">
            {["Add Stock", "Stock Adjustment", "Bulk Update", "Export Report"].map((item) => (
              <QuickActionButton key={item}>{item}</QuickActionButton>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
