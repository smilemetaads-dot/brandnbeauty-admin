import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import type { SupplierProductPriceHistoryData } from "./supplier-price-history-data";

type RealSupplierPriceHistoryPageProps = {
  priceHistory: SupplierProductPriceHistoryData;
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const className = {
    brand: "bg-[#527B86]/10 text-[#527B86]",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    default: "bg-slate-100 text-slate-600",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {children}
    </span>
  );
}

function DisabledButton({ children }: { children: ReactNode }) {
  return (
    <button
      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-400 opacity-75"
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function StatCard({
  helper,
  label,
  marker,
  tone = "brand",
  value,
}: {
  helper: string;
  label: string;
  marker: string;
  tone?: BadgeTone;
  value: ReactNode;
}) {
  const markerClassName = {
    brand: "bg-[#527B86]/10 text-[#527B86]",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    default: "bg-slate-100 text-slate-600",
  }[tone];

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-black ${markerClassName}`}
        >
          {marker}
        </div>
      </div>
      <div className="mt-4 text-xs font-bold text-slate-400">{helper}</div>
    </section>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-BD", {
    currency: "BDT",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatText(value: string | null | undefined) {
  return value || "Not available";
}

export function RealSupplierPriceHistoryPage({
  priceHistory,
}: RealSupplierPriceHistoryPageProps) {
  const { records, recentRows, summary } = priceHistory;

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                Supplier Cost Control
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Supplier Product Price History
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Read-only purchase item price history by product and supplier.
                This page does not receive stock, change product inventory, or
                mutate purchase rows.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DisabledButton>Export Price History - N/C</DisabledButton>
              <DisabledButton>Supplier Quote Compare - N/C</DisabledButton>
              <DisabledButton>Price Alert Rules - N/C</DisabledButton>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-600">
              This page is read-only and based on purchase_entry_items.
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-600">
              No stock change happens here.
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-600">
              Price change alerts are basic, not AI.
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard
            helper="Products with purchase lines"
            label="Tracked Products"
            marker="PRO"
            value={summary.trackedProducts}
          />
          <StatCard
            helper="Suppliers with purchase lines"
            label="Tracked Suppliers"
            marker="SUP"
            value={summary.trackedSuppliers}
          />
          <StatCard
            helper="Purchase item rows"
            label="Purchase Lines"
            marker="ROW"
            tone="default"
            value={summary.totalPurchaseLines}
          />
          <StatCard
            helper="Across purchase item rows"
            label="Avg Unit Cost"
            marker="AVG"
            value={formatMoney(summary.averageUnitCost)}
          />
          <StatCard
            helper="All tracked lines"
            label="Total Purchase Value"
            marker="BDT"
            tone="good"
            value={formatMoney(summary.totalPurchaseValue)}
          />
          <StatCard
            helper="Highest cost above lowest"
            label="Price Changes"
            marker="VAR"
            tone="warn"
            value={summary.priceChangeWatchCount}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-950">
                  Product Supplier Costs
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  Aggregated unit cost history grouped by product and supplier.
                </p>
              </div>
              <Badge tone="brand">{records.length} tracked pairs</Badge>
            </div>

            {records.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-[1280px] text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase tracking-[0.08em] text-slate-400">
                    <tr>
                      <th className="px-5 py-4 font-black">Product</th>
                      <th className="px-5 py-4 font-black">SKU</th>
                      <th className="px-5 py-4 font-black">Supplier</th>
                      <th className="px-5 py-4 font-black">Purchases</th>
                      <th className="px-5 py-4 font-black">Ordered</th>
                      <th className="px-5 py-4 font-black">Received</th>
                      <th className="px-5 py-4 font-black">Last Cost</th>
                      <th className="px-5 py-4 font-black">Lowest</th>
                      <th className="px-5 py-4 font-black">Highest</th>
                      <th className="px-5 py-4 font-black">Average</th>
                      <th className="px-5 py-4 font-black">Last Purchase</th>
                      <th className="px-5 py-4 font-black">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((record) => (
                      <tr
                        className="bg-white hover:bg-stone-50"
                        key={`${record.product_id}-${record.product_name}-${record.supplier_id}`}
                      >
                        <td className="px-5 py-4 font-black text-slate-950">
                          {record.product_name}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-600">
                          {formatText(record.product_sku)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700">
                          {record.supplier_name}
                        </td>
                        <td className="px-5 py-4 font-black text-slate-900">
                          {record.purchase_count}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700">
                          {record.total_quantity_ordered}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700">
                          {record.total_quantity_received}
                        </td>
                        <td className="px-5 py-4 font-black text-slate-900">
                          {formatMoney(record.last_unit_cost)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-emerald-700">
                          {formatMoney(record.lowest_unit_cost)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-amber-700">
                          {formatMoney(record.highest_unit_cost)}
                        </td>
                        <td className="px-5 py-4 font-black text-slate-900">
                          {formatMoney(record.average_unit_cost)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-600">
                          {formatDate(record.last_purchase_date)}
                        </td>
                        <td className="px-5 py-4 font-black text-slate-900">
                          {formatMoney(record.total_purchase_value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-sm font-semibold text-slate-500">
                No purchase item rows found for price history yet.
              </div>
            )}
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
              Recent Prices
            </div>
            <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
              Latest Purchase Lines
            </h2>
            <div className="mt-5 space-y-3">
              {recentRows.length ? (
                recentRows.map((row) => (
                  <div
                    className="rounded-2xl border border-slate-200 bg-stone-50 p-4"
                    key={`${row.purchase_number}-${row.product_name}-${row.created_at}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black text-slate-950">
                          {row.product_name}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-500">
                          {formatText(row.product_sku)}
                        </div>
                      </div>
                      <Badge tone="brand">{formatMoney(row.unit_cost)}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500">
                      <span>{row.purchase_number}</span>
                      <span className="text-right">Qty {row.quantity}</span>
                      <span>{row.supplier_name}</span>
                      <span className="text-right">{formatDate(row.created_at)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm font-semibold text-slate-500">
                  No recent price rows found.
                </div>
              )}
            </div>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
