import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import type {
  SupplierAnalyticsData,
  SupplierAnalyticsRecord,
  SupplierAnalyticsRecentPurchase,
  SupplierProductPurchaseSummary,
} from "./supplier-analytics-data";

type RealSupplierAnalyticsPageProps = {
  analytics: SupplierAnalyticsData;
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

type StatCardItem = {
  active?: boolean;
  helper: string;
  label: string;
  value: ReactNode;
};

type TrendPoint = {
  label: string;
  pending: number;
  received: number;
};

type HealthMetric = {
  label: string;
  value: number;
};

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const className = {
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
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

function DisabledButton({
  children,
  primary = false,
}: {
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      className={
        primary
          ? "rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white opacity-60 shadow-sm"
          : "rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-400"
      }
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function StatCard({ item, index }: { index: number; item: StatCardItem }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-500">{item.label}</div>
          <div className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950">
            {item.value}
          </div>
        </div>
        <div
          className={
            item.active
              ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xs font-black text-[#5E7F85]"
              : "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-xs font-black text-slate-500"
          }
        >
          {String(index + 1).padStart(2, "0")}
        </div>
      </div>
      <div className="mt-4 text-xs font-bold text-slate-400">
        {item.helper}
      </div>
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

function formatStatus(value: string | null | undefined) {
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
  if (status === "active" || status === "primary") {
    return "good";
  }

  if (status === "inactive") {
    return "bad";
  }

  return "default";
}

function getPercent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((value / total) * 100));
}

function getSelectedSupplier(records: SupplierAnalyticsRecord[]) {
  return (
    records.find((record) => record.purchaseCount > 0) ??
    records[0] ??
    null
  );
}

function getSupplierHealthScore(supplier: SupplierAnalyticsRecord | null) {
  if (!supplier || supplier.purchaseCount === 0) {
    return 0;
  }

  const receivedScore = getPercent(
    supplier.receivedPurchaseCount,
    supplier.purchaseCount,
  );
  const pendingScore = Math.max(
    0,
    100 - getPercent(supplier.pendingPurchaseCount, supplier.purchaseCount),
  );
  const itemScore = getPercent(
    supplier.totalItemsReceived,
    supplier.totalItemsOrdered,
  );
  const valueScore = getPercent(
    supplier.receivedPurchaseValue,
    supplier.totalPurchaseValue,
  );

  return Math.round((receivedScore + pendingScore + itemScore + valueScore) / 4);
}

function getHealthMetrics(
  supplier: SupplierAnalyticsRecord | null,
): HealthMetric[] {
  if (!supplier) {
    return [
      { label: "Reliability", value: 0 },
      { label: "Receive Safety", value: 0 },
      { label: "Payment Health", value: 0 },
      { label: "Stock Availability", value: 0 },
    ];
  }

  return [
    {
      label: "Reliability",
      value: getPercent(supplier.receivedPurchaseCount, supplier.purchaseCount),
    },
    {
      label: "Receive Safety",
      value: Math.max(
        0,
        100 - getPercent(supplier.pendingPurchaseCount, supplier.purchaseCount),
      ),
    },
    {
      label: "Payment Health",
      value: getPercent(
        supplier.receivedPurchaseValue,
        supplier.totalPurchaseValue,
      ),
    },
    {
      label: "Stock Availability",
      value: getPercent(
        supplier.totalItemsReceived,
        supplier.totalItemsOrdered,
      ),
    },
  ];
}

function getTrendPoints(
  recentPurchases: SupplierAnalyticsRecentPurchase[],
): TrendPoint[] {
  const monthFormatter = new Intl.DateTimeFormat("en", { month: "short" });
  const trendMap = recentPurchases.reduce((map, purchase) => {
    const date = purchase.created_at ? new Date(purchase.created_at) : null;
    const label = date ? monthFormatter.format(date) : "No date";
    const current = map.get(label) ?? { label, pending: 0, received: 0 };

    if (purchase.stock_received) {
      current.received += purchase.total_cost;
    } else {
      current.pending += purchase.total_cost;
    }

    map.set(label, current);
    return map;
  }, new Map<string, TrendPoint>());
  const points = [...trendMap.values()].slice(0, 6);

  if (points.length) {
    return points;
  }

  return [
    { label: "Jan", pending: 0, received: 0 },
    { label: "Feb", pending: 0, received: 0 },
    { label: "Mar", pending: 0, received: 0 },
    { label: "Apr", pending: 0, received: 0 },
    { label: "May", pending: 0, received: 0 },
    { label: "Jun", pending: 0, received: 0 },
  ];
}

function getProductTone(product: SupplierProductPurchaseSummary): BadgeTone {
  const receivedPercent = getPercent(product.totalReceived, product.totalOrdered);

  if (receivedPercent >= 90) {
    return "good";
  }

  if (receivedPercent >= 50) {
    return "warn";
  }

  return "bad";
}

export function RealSupplierAnalyticsPage({
  analytics,
}: RealSupplierAnalyticsPageProps) {
  const { productSummaries, recentPurchases, records, summary } = analytics;
  const selectedSupplier = getSelectedSupplier(records);
  const healthScore = getSupplierHealthScore(selectedSupplier);
  const healthMetrics = getHealthMetrics(selectedSupplier);
  const trendPoints = getTrendPoints(recentPurchases);
  const maxTrendValue = Math.max(
    1,
    ...trendPoints.map((point) => Math.max(point.pending, point.received)),
  );
  const topProducts = productSummaries.slice(0, 5);
  const statCards: StatCardItem[] = [
    {
      helper: `${summary.totalPurchaseEntries} purchase entries`,
      label: "Purchase Value",
      value: formatMoney(summary.totalPurchaseValue),
    },
    {
      active: true,
      helper: "Stock received value",
      label: "Received Value",
      value: formatMoney(summary.receivedPurchaseValue),
    },
    {
      active: true,
      helper: `${summary.pendingPurchaseCount} pending purchases`,
      label: "Pending Value",
      value: formatMoney(summary.pendingPurchaseValue),
    },
    {
      helper: `${summary.activeSuppliers} active suppliers`,
      label: "Supplier Count",
      value: summary.totalSuppliers,
    },
  ];
  const alerts = [
    summary.pendingPurchaseCount
      ? `${summary.pendingPurchaseCount} purchase entries are still pending receive.`
      : "No pending receive entries in current supplier analytics.",
    selectedSupplier
      ? `${selectedSupplier.supplierName} is the current live supplier focus.`
      : "No supplier rows exist yet for live supplier focus.",
    productSummaries.length
      ? `${productSummaries.length} product purchase summaries are available.`
      : "No purchase item rows exist yet for product summary.",
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                Supplier Analytics Control Room
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Analyze supplier profitability, receive health, pending purchase
                value and product purchase performance from live supplier and
                purchase data.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                aria-label="Selected supplier"
                className="min-w-[220px] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 opacity-80 outline-none shadow-sm"
                defaultValue={selectedSupplier?.supplierName ?? "No suppliers"}
                disabled
              >
                <option>{selectedSupplier?.supplierName ?? "No suppliers"}</option>
              </select>
              <select
                aria-label="Date range"
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 opacity-80 outline-none shadow-sm"
                defaultValue="Live data"
                disabled
              >
                <option>Live data</option>
              </select>
              <DisabledButton primary>Create Reorder Plan</DisabledButton>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Selected supplier:{" "}
              <b className="text-slate-900">
                {selectedSupplier?.supplierName ?? "Not available"}
              </b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Health score:{" "}
              <b className="text-[#5E7F85]">{healthScore}%</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Last purchase:{" "}
              <b className="text-slate-900">
                {formatDate(selectedSupplier?.lastPurchaseAt ?? null)}
              </b>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((item, index) => (
            <StatCard index={index} item={item} key={item.label} />
          ))}
        </section>

        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-sm shadow-sm">
          <div className="font-bold text-amber-800">Supplier Insight</div>
          <p className="mt-1 leading-6 text-amber-700">
            This panel is a read-only live summary. Export, forecast, reorder
            and scoring controls remain disabled until real workflows are
            connected.
          </p>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Trend View
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  Received vs Pending Purchase Trend
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  Pending
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#5E7F85]/10 px-3 py-1 text-xs font-bold text-[#5E7F85]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#5E7F85]" />
                  Received
                </span>
              </div>
            </div>
            <div className="mt-6 flex items-end gap-4 overflow-x-auto pb-2">
              {trendPoints.map((point) => (
                <div
                  className="flex min-w-[88px] flex-col items-center gap-3"
                  key={point.label}
                >
                  <div className="text-[11px] font-semibold text-slate-500">
                    {point.label}
                  </div>
                  <div className="flex h-60 items-end gap-2 rounded-2xl bg-stone-50 px-3 py-2">
                    <div className="flex h-full items-end">
                      <div
                        className="w-5 rounded-xl bg-slate-300"
                        style={{
                          height: `${(point.pending / maxTrendValue) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex h-full items-end">
                      <div
                        className="w-5 rounded-xl bg-[#5E7F85]"
                        style={{
                          height: `${(point.received / maxTrendValue) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-center text-[11px] leading-5 text-slate-500">
                    <div>P {formatMoney(point.pending)}</div>
                    <div>R {formatMoney(point.received)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Supplier Health
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    {selectedSupplier?.supplierName ?? "No supplier selected"}
                  </h2>
                  <div className="mt-1 text-sm text-slate-500">
                    {formatText(selectedSupplier?.phone)} /{" "}
                    {formatText(selectedSupplier?.email)}
                  </div>
                </div>
                <Badge tone={getStatusTone(selectedSupplier?.status ?? "")}>
                  {formatStatus(selectedSupplier?.status)}
                </Badge>
              </div>
              <div className="mt-5 flex items-center justify-center">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-stone-100">
                  <div
                    className="absolute inset-0 rounded-full border-[10px] border-[#5E7F85]"
                    style={{ clipPath: `inset(${100 - healthScore}% 0 0 0)` }}
                  />
                  <div className="text-center">
                    <div className="text-2xl font-black text-[#5E7F85]">
                      {healthScore}%
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Health
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm">
                {healthMetrics.map((metric) => (
                  <div key={metric.label}>
                    <div className="mb-2 flex justify-between text-xs font-bold text-slate-500">
                      <span>{metric.label}</span>
                      <span>{metric.value}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-[#5E7F85]"
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-rose-800">Risk Watch</div>
              <p className="mt-2 text-sm leading-6 text-rose-700">
                Pending receive value and low received quantity percentages are
                the only live risk signals shown here. No supplier mutation or
                purchase receive action is connected from this page.
              </p>
            </section>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="text-sm font-medium text-slate-500">
                Product Performance
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Top Supplier Products
              </h2>
            </div>
            {topProducts.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-stone-50 text-slate-500">
                    <tr>
                      {[
                        "Product",
                        "SKU",
                        "Ordered",
                        "Received",
                        "Value",
                        "Status",
                      ].map((heading) => (
                        <th className="px-5 py-4 font-medium" key={heading}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product) => (
                      <tr
                        className="border-t border-slate-100 transition hover:bg-stone-50"
                        key={`${product.productName}-${product.sku}`}
                      >
                        <td className="px-5 py-4 font-bold text-slate-900">
                          {product.productName}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-600">
                          {formatText(product.sku)}
                        </td>
                        <td className="px-5 py-4 font-semibold">
                          {product.totalOrdered}
                        </td>
                        <td className="px-5 py-4 font-semibold text-emerald-700">
                          {product.totalReceived}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {formatMoney(product.totalValue)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={getProductTone(product)}>
                            {getPercent(
                              product.totalReceived,
                              product.totalOrdered,
                            )}
                            % received
                          </Badge>
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
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Priority Alerts
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              Supplier Actions
            </h2>
            <div className="mt-5 space-y-3">
              {alerts.map((item) => (
                <div
                  className="rounded-2xl bg-stone-50 p-4 text-sm font-semibold leading-6 text-slate-700"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3">
              <DisabledButton primary>Open Supplier Details</DisabledButton>
              <DisabledButton>Create Purchase Order</DisabledButton>
              <DisabledButton>Payment Entry</DisabledButton>
              <DisabledButton>Export Analytics</DisabledButton>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Supplier Performance
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  Purchase Scorecard
                </h2>
              </div>
              <Badge tone="brand">{records.length} suppliers</Badge>
            </div>

            {records.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-[980px] text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase tracking-[0.08em] text-slate-400">
                    <tr>
                      <th className="px-5 py-4 font-black">Supplier</th>
                      <th className="px-5 py-4 font-black">Status</th>
                      <th className="px-5 py-4 font-black">Purchases</th>
                      <th className="px-5 py-4 font-black">Received</th>
                      <th className="px-5 py-4 font-black">Pending</th>
                      <th className="px-5 py-4 font-black">Total Value</th>
                      <th className="px-5 py-4 font-black">Reliability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((supplier) => (
                      <tr
                        className="bg-white hover:bg-stone-50"
                        key={supplier.supplierId}
                      >
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
                        <td className="px-5 py-4">
                          <Badge
                            tone={getReliabilityTone(supplier.reliabilityLabel)}
                          >
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
            <div className="text-sm font-medium text-slate-500">
              Recent Purchases
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
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
                        {purchase.stock_received ? "received" : "pending"}
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
      </div>
    </AdminShell>
  );
}
