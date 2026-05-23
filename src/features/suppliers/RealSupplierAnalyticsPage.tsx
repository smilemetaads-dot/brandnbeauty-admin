import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import type { SupplierAnalyticsData } from "./supplier-analytics-data";

type RealSupplierAnalyticsPageProps = {
  analytics: SupplierAnalyticsData;
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

function formatStatus(value: string | null) {
  return value ? value.replaceAll("_", " ") : "not set";
}

function getReliabilityTone(label: string): BadgeTone {
  if (label === "Reliable") {
    return "good";
  }

  if (label === "Pending Follow-up") {
    return "warn";
  }

  if (label === "Review") {
    return "bad";
  }

  return "default";
}

function getStatusTone(status: string): BadgeTone {
  return status === "active" ? "good" : "default";
}

export function RealSupplierAnalyticsPage({
  analytics,
}: RealSupplierAnalyticsPageProps) {
  const { productSummaries, recentPurchases, records, summary } = analytics;

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                Supplier Intelligence
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Supplier Analytics
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Live supplier analytics calculated from suppliers, purchase
                entries, and purchase entry items. No supplier scoring AI,
                export, forecast, mutation, stock update, or receive RPC call is
                connected from this page.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DisabledButton>Export Analytics - N/C</DisabledButton>
              <DisabledButton>Supplier Scorecard - N/C</DisabledButton>
              <DisabledButton>Purchase Forecast - N/C</DisabledButton>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-600">
              Supplier analytics are calculated from purchase entries.
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-600">
              Supplier scoring is basic and not AI.
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-600">
              No mutation from this page.
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard
            helper={`${summary.activeSuppliers} active suppliers`}
            label="Total Suppliers"
            marker="SUP"
            value={summary.totalSuppliers}
          />
          <StatCard
            helper={`${summary.totalPurchaseEntries} purchase rows`}
            label="Total Purchase Value"
            marker="BDT"
            value={formatMoney(summary.totalPurchaseValue)}
          />
          <StatCard
            helper="Received purchase rows"
            label="Received Value"
            marker="IN"
            tone="good"
            value={formatMoney(summary.receivedPurchaseValue)}
          />
          <StatCard
            helper="Pending receive value"
            label="Pending Value"
            marker="PEN"
            tone="warn"
            value={formatMoney(summary.pendingPurchaseValue)}
          />
          <StatCard
            helper="Stock received"
            label="Received Purchases"
            marker="REC"
            tone="good"
            value={summary.receivedPurchaseCount}
          />
          <StatCard
            helper={`${summary.cancelledPurchaseCount} cancelled`}
            label="Pending Purchases"
            marker="WAIT"
            tone="warn"
            value={summary.pendingPurchaseCount}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-950">
                  Supplier Performance
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  Basic purchase and receipt performance grouped by supplier.
                </p>
              </div>
              <Badge tone="brand">{records.length} suppliers</Badge>
            </div>

            {records.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-[1320px] text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase tracking-[0.08em] text-slate-400">
                    <tr>
                      <th className="px-5 py-4 font-black">Supplier</th>
                      <th className="px-5 py-4 font-black">Status</th>
                      <th className="px-5 py-4 font-black">Purchases</th>
                      <th className="px-5 py-4 font-black">Received</th>
                      <th className="px-5 py-4 font-black">Pending</th>
                      <th className="px-5 py-4 font-black">Total Value</th>
                      <th className="px-5 py-4 font-black">Received Value</th>
                      <th className="px-5 py-4 font-black">Pending Value</th>
                      <th className="px-5 py-4 font-black">Items</th>
                      <th className="px-5 py-4 font-black">Last Purchase</th>
                      <th className="px-5 py-4 font-black">Reliability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((supplier) => (
                      <tr className="bg-white hover:bg-stone-50" key={supplier.supplierId}>
                        <td className="px-5 py-4">
                          <div className="font-black text-slate-950">
                            {supplier.supplierName}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-slate-400">
                            {formatText(supplier.phone)} /{" "}
                            {formatText(supplier.email)}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={getStatusTone(supplier.status)}>
                            {formatStatus(supplier.status)}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 font-black text-slate-900">
                          {supplier.purchaseCount}
                        </td>
                        <td className="px-5 py-4 font-black text-emerald-700">
                          {supplier.receivedPurchaseCount}
                        </td>
                        <td className="px-5 py-4 font-black text-amber-700">
                          {supplier.pendingPurchaseCount}
                        </td>
                        <td className="px-5 py-4 font-black text-slate-900">
                          {formatMoney(supplier.totalPurchaseValue)}
                        </td>
                        <td className="px-5 py-4 font-black text-slate-900">
                          {formatMoney(supplier.receivedPurchaseValue)}
                        </td>
                        <td className="px-5 py-4 font-black text-slate-900">
                          {formatMoney(supplier.pendingPurchaseValue)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700">
                          {supplier.totalItemsOrdered} /{" "}
                          {supplier.totalItemsReceived}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-600">
                          {formatDate(supplier.lastPurchaseAt)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={getReliabilityTone(supplier.reliabilityLabel)}>
                            {supplier.reliabilityLabel}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-sm font-semibold text-slate-500">
                No suppliers found for analytics yet.
              </div>
            )}
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
              Recent Purchases
            </div>
            <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
              Latest Activity
            </h2>
            <div className="mt-5 space-y-3">
              {recentPurchases.length ? (
                recentPurchases.map((purchase) => (
                  <div
                    className="rounded-2xl border border-slate-200 bg-stone-50 p-4"
                    key={purchase.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black text-slate-950">
                          {purchase.purchase_number}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-500">
                          {purchase.supplierName}
                        </div>
                      </div>
                      <Badge tone={purchase.stock_received ? "good" : "warn"}>
                        {purchase.stock_received ? "yes" : "no"}
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500">
                      <span>{formatStatus(purchase.purchase_status)}</span>
                      <span className="text-right">
                        {formatMoney(purchase.total_cost)}
                      </span>
                      <span className="col-span-2">
                        {formatDate(purchase.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm font-semibold text-slate-500">
                  No recent purchases found.
                </div>
              )}
            </div>
          </aside>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950">
                Product Purchase Summary
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                Product-level purchase volume across suppliers.
              </p>
            </div>
            <Badge tone="default">{productSummaries.length} products</Badge>
          </div>

          {productSummaries.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase tracking-[0.08em] text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-black">Product</th>
                    <th className="px-5 py-4 font-black">SKU</th>
                    <th className="px-5 py-4 font-black">Ordered Qty</th>
                    <th className="px-5 py-4 font-black">Received Qty</th>
                    <th className="px-5 py-4 font-black">Purchase Value</th>
                    <th className="px-5 py-4 font-black">Supplier Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productSummaries.map((product) => (
                    <tr
                      className="bg-white hover:bg-stone-50"
                      key={`${product.productName}-${product.sku}`}
                    >
                      <td className="px-5 py-4 font-black text-slate-950">
                        {product.productName}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-600">
                        {formatText(product.sku)}
                      </td>
                      <td className="px-5 py-4 font-black text-slate-900">
                        {product.totalOrdered}
                      </td>
                      <td className="px-5 py-4 font-black text-emerald-700">
                        {product.totalReceived}
                      </td>
                      <td className="px-5 py-4 font-black text-slate-900">
                        {formatMoney(product.totalValue)}
                      </td>
                      <td className="px-5 py-4 font-black text-slate-900">
                        {product.supplierCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-sm font-semibold text-slate-500">
              No purchase item rows found for product summary yet.
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
