// REFERENCE ONLY.
// Original Canvas Orders design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Orders page.

import { type ReactNode, useState } from "react";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";
type StatItem = [string, string, string];
type OrderRow = {
  amount: string;
  courier: string;
  customer: string;
  id: string;
  phone: string;
  risk: "High" | "Medium" | "Low";
  riskReasons: string[];
  riskScore: number;
  source: string;
  status: string;
  zone: string;
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
    <button className="group relative w-full overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
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

function TableHead({ children }: { children: ReactNode }) {
  return <thead className="sticky top-0 z-10 bg-stone-50 text-slate-500">{children}</thead>;
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

const rows: OrderRow[] = [
  {
    amount: "BDT 1,200",
    courier: "Not Sent",
    customer: "Sadia Akter",
    id: "#1021",
    phone: "01700000000",
    risk: "Medium",
    riskReasons: ["COD order", "New customer"],
    riskScore: 54,
    source: "Facebook",
    status: "New",
    zone: "Dhaka",
  },
  {
    amount: "BDT 980",
    courier: "Returned",
    customer: "Raisa Khan",
    id: "#1018",
    phone: "01800000000",
    risk: "High",
    riskReasons: ["Previous return", "COD due"],
    riskScore: 82,
    source: "Website",
    status: "Hold",
    zone: "Gazipur",
  },
];

export default function OrdersPage() {
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const filtered = priorityOnly
    ? rows.filter((row) => row.risk === "High" || row.status === "New")
    : rows;
  const previewOrder = filtered[0] ?? null;
  const riskTone = (risk: OrderRow["risk"]): BadgeTone =>
    risk === "High" ? "bad" : risk === "Medium" ? "warn" : "good";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Today Orders", "128", "Live intake"],
          ["Pending Confirm", "37", "Need action"],
          ["Ready Courier", "62", "Dispatch now"],
          ["Return Risk", "12", "Watchlist"],
        ].map((item, index) => (
          <button className="text-left" key={item[0]} type="button">
            <StatCard item={item as StatItem} index={index} />
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight">Orders Command Center</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="relative max-w-lg">
              <input
                className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-10 text-sm outline-none"
                placeholder="Search order, customer, phone..."
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                Search
              </span>
            </div>
            <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
              {["Add Order", "Export", "Bulk Confirm", "Print Invoice", "Send Courier"].map(
                (item) => (
                  <button
                    className={
                      item === "Send Courier"
                        ? "rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white"
                        : "rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold"
                    }
                    key={item}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                priorityOnly
                  ? "bg-rose-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600"
              }`}
              onClick={() => setPriorityOnly((current) => !current)}
              type="button"
            >
              Priority Queue
            </button>
          </div>
        </div>

        {selectedOrders.length > 0 ? (
          <div className="border-b border-slate-100 bg-[#5E7F85]/5 px-6 py-4 text-sm font-semibold text-[#5E7F85]">
            {selectedOrders.length} order selected - Bulk confirm / print / courier ready
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <TableHead>
              <tr>
                <th className="px-5 py-4 font-medium">
                  <input className="h-4 w-4 rounded border-slate-300" type="checkbox" />
                </th>
                {[
                  "Order",
                  "Customer",
                  "Source",
                  "Amount",
                  "Zone",
                  "Risk",
                  "Status",
                  "Courier",
                  "Quick Status",
                  "Action",
                ].map((head) => (
                  <th className="px-5 py-4 font-medium" key={head}>
                    {head}
                  </th>
                ))}
              </tr>
            </TableHead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  className="cursor-pointer border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85]"
                  key={row.id}
                >
                  <td className="px-5 py-4">
                    <input
                      checked={selectedOrders.includes(row.id)}
                      className="h-4 w-4 rounded border-slate-300"
                      onChange={() =>
                        setSelectedOrders((current) =>
                          current.includes(row.id)
                            ? current.filter((item) => item !== row.id)
                            : [...current, row.id],
                        )
                      }
                      type="checkbox"
                    />
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{row.id}</td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-800">{row.customer}</div>
                    <div className="text-xs text-slate-500">{row.phone}</div>
                  </td>
                  <td className="px-5 py-4">{row.source}</td>
                  <td className="px-5 py-4 font-semibold">{row.amount}</td>
                  <td className="px-5 py-4">{row.zone}</td>
                  <td className="px-5 py-4">
                    <Badge tone={riskTone(row.risk)}>{row.risk}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone="brand">{row.status}</Badge>
                  </td>
                  <td className="px-5 py-4">{row.courier}</td>
                  <td className="px-5 py-4">
                    <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none">
                      <option>{row.status}</option>
                    </select>
                  </td>
                  <td className="px-5 py-4">Open / Update</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold tracking-tight">Ops Drawer</h2>
          {previewOrder ? (
            <div className="mt-5 space-y-4 text-sm">
              <div className="rounded-2xl bg-stone-50 p-4">
                <div className="font-bold text-slate-900">{previewOrder.id}</div>
                <div className="mt-1 font-semibold text-slate-700">
                  {previewOrder.customer}
                </div>
                <div className="mt-1 text-xs text-slate-500">{previewOrder.phone}</div>
              </div>
            </div>
          ) : null}
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold tracking-tight">Quick Actions</h2>
          <div className="mt-3 rounded-2xl bg-stone-50 p-3 text-xs font-semibold text-slate-500">
            Selected: {selectedOrders.length} - Visible: {filtered.length}
          </div>
          <div className="mt-5 space-y-3">
            {["Bulk Confirm", "Mark Packed", "Print Invoices", "Send to Courier"].map(
              (item) => (
                <QuickActionButton key={item}>{item}</QuickActionButton>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
