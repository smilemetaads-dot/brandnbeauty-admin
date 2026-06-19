"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import {
  AdminBadge,
  AdminChartCard,
  AdminSectionCard,
  AdminStatCard,
  AdminTable,
  AdminTableHead,
} from "@/components/admin/AdminUiPrimitives";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

type DashboardInventoryMovement = {
  created_at: string | null;
  id: string;
  movement_type: string;
  new_stock: number;
  previous_stock: number;
  product_name: string | null;
  product_sku: string | null;
  quantity: number;
};

type DashboardRecentProduct = {
  created_at: string | null;
  id: number;
  image_url: string | null;
  price: number;
  product_name: string;
  status: string;
  stock_quantity: number;
};

type DashboardRevenueTrend = {
  date: string;
  label: string;
  revenue: number;
};

type DashboardSummary = {
  codDue: number;
  courierQueue: number;
  dailyRevenueTrends: DashboardRevenueTrend[];
  deliveredOrders: number;
  latestInventoryMovements: DashboardInventoryMovement[];
  lowStockProducts: number;
  newOrders: number;
  outOfStockProducts: number;
  packedOrders: number;
  packingQueue: number;
  pendingOrders: number;
  recentProducts: DashboardRecentProduct[];
  returnedOrders: number;
  shippedOrders: number;
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
};

type DashboardStatsPayload = {
  daily_revenue_trends?: unknown;
  pending_orders?: unknown;
  total_orders?: unknown;
  total_revenue?: unknown;
};

type DashboardStatsResponse = {
  chart_data?: unknown;
  stats?: DashboardStatsPayload;
  success?: boolean;
};

type AdminProductRow = {
  created_at?: unknown;
  id?: unknown;
  image_url?: unknown;
  name?: unknown;
  price?: unknown;
  product_name?: unknown;
  status?: unknown;
  stock?: unknown;
  stock_quantity?: unknown;
};

const dashboardShortcuts = [
  ["Confirm Orders", "/orders"],
  ["Print Invoices", "/orders/details/invoice"],
  ["Send Courier", "/courier"],
  ["Create Purchase Entry", "/purchases"],
];

const DASHBOARD_STATS_ENDPOINT = bnbApiUrl("get_dashboard_stats.php");
const DASHBOARD_CHART_STATS_ENDPOINT = bnbApiUrl("dashboard_stats.php");
const ADMIN_PRODUCTS_ENDPOINT = bnbApiUrl("admin_products.php");

const defaultSummary: DashboardSummary = {
  codDue: 0,
  courierQueue: 0,
  dailyRevenueTrends: [],
  deliveredOrders: 0,
  latestInventoryMovements: [],
  lowStockProducts: 0,
  newOrders: 0,
  outOfStockProducts: 0,
  packedOrders: 0,
  packingQueue: 0,
  pendingOrders: 0,
  recentProducts: [],
  returnedOrders: 0,
  shippedOrders: 0,
  totalOrders: 0,
  totalProducts: 0,
  totalRevenue: 0,
};

function toNumber(value: unknown) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function normalizeRevenueTrend(value: unknown): DashboardRevenueTrend | null {
  if (!value || typeof value !== "object") return null;

  const trend = value as Record<string, unknown>;
  const date = String(trend.date ?? "");
  const label = String(
    trend.label ??
      (date
        ? new Intl.DateTimeFormat("en", { weekday: "short" }).format(
            new Date(`${date}T00:00:00`),
          )
        : ""),
  );

  if (!date && !label) return null;

  return {
    date,
    label,
    revenue: toNumber(trend.revenue),
  };
}

function normalizeDashboardStats(value: unknown): Pick<
  DashboardSummary,
  "dailyRevenueTrends" | "newOrders" | "pendingOrders" | "totalOrders" | "totalRevenue"
> {
  if (!value || typeof value !== "object") {
    return {
      dailyRevenueTrends: [],
      newOrders: 0,
      pendingOrders: 0,
      totalOrders: 0,
      totalRevenue: 0,
    };
  }

  const payload = value as DashboardStatsResponse;
  const stats = payload.stats ?? {};
  const pendingOrders = toNumber(stats.pending_orders);
  const dailyRevenueTrends = Array.isArray(stats.daily_revenue_trends)
    ? stats.daily_revenue_trends
        .map(normalizeRevenueTrend)
        .filter((trend): trend is DashboardRevenueTrend => Boolean(trend))
    : [];

  return {
    dailyRevenueTrends,
    newOrders: pendingOrders,
    pendingOrders,
    totalOrders: toNumber(stats.total_orders),
    totalRevenue: toNumber(stats.total_revenue),
  };
}

function normalizeDashboardChart(value: unknown): DashboardRevenueTrend[] {
  if (!value || typeof value !== "object") return [];

  const payload = value as DashboardStatsResponse;

  return Array.isArray(payload.chart_data)
    ? payload.chart_data
        .map(normalizeRevenueTrend)
        .filter((trend): trend is DashboardRevenueTrend => Boolean(trend))
    : [];
}

function normalizeRecentProduct(value: unknown): DashboardRecentProduct | null {
  if (!value || typeof value !== "object") return null;

  const product = value as AdminProductRow;
  const id = toNumber(product.id);
  const productName = String(product.product_name ?? product.name ?? "").trim();

  if (!id || !productName) return null;

  return {
    created_at:
      typeof product.created_at === "string" && product.created_at.length > 0
        ? product.created_at
        : null,
    id,
    image_url:
      typeof product.image_url === "string" && product.image_url.length > 0
        ? product.image_url
        : null,
    price: toNumber(product.price),
    product_name: productName,
    status: String(product.status ?? "draft"),
    stock_quantity: toNumber(product.stock_quantity ?? product.stock),
  };
}

function normalizeDashboardProducts(value: unknown): Pick<
  DashboardSummary,
  "lowStockProducts" | "outOfStockProducts" | "recentProducts" | "totalProducts"
> {
  const products = Array.isArray(value)
    ? value
        .map(normalizeRecentProduct)
        .filter((product): product is DashboardRecentProduct =>
          Boolean(product),
        )
    : [];

  return {
    lowStockProducts: products.filter(
      (product) => product.stock_quantity > 0 && product.stock_quantity < 5,
    ).length,
    outOfStockProducts: products.filter(
      (product) => product.stock_quantity === 0,
    ).length,
    recentProducts: products.slice(0, 5),
    totalProducts: products.length,
  };
}

function getPercent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-BD", {
    currency: "BDT",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

function ProgressRow({
  label,
  note,
  value,
}: {
  label: string;
  note: string;
  value: number;
}) {
  const safeValue = Math.max(0, Math.min(value, 100));

  return (
    <div>
      <div className="mb-2 flex justify-between gap-3 text-xs font-bold text-slate-500">
        <span>{label}</span>
        <span>{safeValue}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full bg-[#5E7F85]"
          style={{ width: `${safeValue}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-slate-500">{note}</div>
    </div>
  );
}

function PriorityRow({
  children,
  helper,
  tone,
}: {
  children: ReactNode;
  helper: string;
  tone: BadgeTone;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-stone-50 px-4 py-4 text-sm">
      <div>
        <div className="font-bold text-slate-900">{children}</div>
        <div className="mt-1 text-xs font-semibold text-slate-500">
          {helper}
        </div>
      </div>
      <AdminBadge tone={tone}>{tone === "bad" ? "High" : "Medium"}</AdminBadge>
    </div>
  );
}

function EmptyTableRow({ children }: { children: ReactNode }) {
  return (
    <tr className="border-t border-slate-100">
      <td className="px-5 py-12 text-sm font-semibold text-slate-500" colSpan={6}>
        {children}
      </td>
    </tr>
  );
}

export default function Home() {
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboardStats() {
      try {
        const [statsResponse, chartResponse, productsResponse] = await Promise.all([
          fetch(DASHBOARD_STATS_ENDPOINT, {
            cache: "no-store",
            headers: adminAuthHeaders(),
            signal: controller.signal,
          }),
          fetch(DASHBOARD_CHART_STATS_ENDPOINT, {
            cache: "no-store",
            headers: adminAuthHeaders(),
            signal: controller.signal,
          }),
          fetch(ADMIN_PRODUCTS_ENDPOINT, {
            cache: "no-store",
            headers: adminAuthHeaders(),
            signal: controller.signal,
          }),
        ]);

        if (!statsResponse.ok) {
          throw new Error("Failed to load admin dashboard stats.");
        }

        const statsPayload = (await statsResponse.json()) as unknown;
        const dashboardStats = normalizeDashboardStats(statsPayload);
        const dashboardChart = chartResponse.ok
          ? normalizeDashboardChart((await chartResponse.json()) as unknown)
          : [];
        const dashboardProducts = productsResponse.ok
          ? normalizeDashboardProducts((await productsResponse.json()) as unknown)
          : normalizeDashboardProducts([]);

        setSummary((currentSummary) => ({
          ...currentSummary,
          ...dashboardStats,
          dailyRevenueTrends: dashboardChart.length
            ? dashboardChart
            : dashboardStats.dailyRevenueTrends,
          ...dashboardProducts,
        }));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Admin dashboard stats could not be loaded.", error);
          setSummary(defaultSummary);
        }
      }
    }

    void Promise.resolve().then(() => loadDashboardStats());

    return () => {
      controller.abort();
    };
  }, []);

  const readyForDispatch = summary.packingQueue + summary.courierQueue;
  const stockAlertTotal = summary.lowStockProducts + summary.outOfStockProducts;
  const hasRevenueTrend = summary.dailyRevenueTrends.some(
    (trend) => trend.revenue > 0,
  );
  const chartBars = summary.dailyRevenueTrends.map((trend) => ({
    label: trend.label,
    value: hasRevenueTrend ? trend.revenue : 0,
    valueLabel: formatMoney(trend.revenue),
  }));
  const priorityItems = [
    {
      helper: "Order queue",
      label:
        summary.pendingOrders > 0
          ? `${summary.pendingOrders} orders need confirmation`
          : "All orders confirmed",
      tone: summary.pendingOrders > 0 ? "bad" : "good",
    },
    {
      helper: "Inventory",
      label:
        stockAlertTotal > 0
          ? `${summary.lowStockProducts} low / ${summary.outOfStockProducts} out of stock`
          : "Stock alerts clear",
      tone: stockAlertTotal > 0 ? "warn" : "good",
    },
    {
      helper: "Courier",
      label:
        summary.courierQueue > 0
          ? `${summary.courierQueue} parcels need courier follow-up`
          : "Courier queue clear",
      tone: summary.courierQueue > 0 ? "bad" : "good",
    },
    {
      helper: "Finance",
      label:
        summary.codDue > 0
          ? `${formatMoney(summary.codDue)} COD balance open`
          : "No COD due balance",
      tone: summary.codDue > 0 ? "warn" : "good",
    },
  ] as const;
  const healthRows = [
    {
      label: "Order Flow",
      note: `${summary.deliveredOrders} delivered / ${summary.returnedOrders} returned`,
      value: getPercent(summary.deliveredOrders, summary.totalOrders),
    },
    {
      label: "Stock Health",
      note: `${summary.lowStockProducts} low / ${summary.outOfStockProducts} out of stock`,
      value:
        summary.totalProducts === 0
          ? 0
          : 100 - getPercent(stockAlertTotal, summary.totalProducts),
    },
    {
      label: "COD Balance",
      note:
        summary.codDue > 0
          ? `${formatMoney(summary.codDue)} open COD`
          : "No COD due balance",
      value: summary.codDue > 0 ? 0 : 100,
    },
    {
      label: "Courier Readiness",
      note: `${readyForDispatch} ready or courier-active parcels`,
      value: getPercent(readyForDispatch, Math.max(summary.totalOrders, 1)),
    },
  ];

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
                  Overview
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight">
                  Admin Command Dashboard
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/85">
                  One clean control room for orders, stock, courier, finance,
                  suppliers and growth signals.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                  <div className="text-xs text-white/70">Today Focus</div>
                  <div className="mt-1 text-lg font-black">
                    {summary.totalOrders} Orders
                  </div>
                </div>
                <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                  <div className="text-xs text-white/70">Dispatch</div>
                  <div className="mt-1 text-lg font-black">
                    {readyForDispatch} Ready
                  </div>
                </div>
                <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                  <div className="text-xs text-white/70">COD Due</div>
                  <div className="mt-1 text-lg font-black">
                    {formatMoney(summary.codDue)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            helper="Live MySQL orders"
            index={0}
            label="Total Orders"
            value={summary.totalOrders || 0}
          />
          <AdminStatCard
            helper="All order revenue"
            index={1}
            label="Revenue"
            value={formatMoney(summary.totalRevenue || 0)}
          />
          <AdminStatCard
            active={summary.lowStockProducts > 0}
            helper="Below reorder threshold"
            index={2}
            label="Low Stock"
            value={summary.lowStockProducts || 0}
          />
          <AdminStatCard
            active={summary.pendingOrders > 0}
            helper="Awaiting confirmation"
            index={3}
            label="Pending Orders"
            value={summary.pendingOrders || 0}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <AdminChartCard
            bars={chartBars}
            label="Sales Trend"
            title="Weekly Revenue Overview"
          />

          <AdminSectionCard
            actions={<AdminBadge tone="warn">4 Alerts</AdminBadge>}
            subtitle="Action Priority"
            title="Today Must Do"
          >
            <div className="mt-5 space-y-3">
              {priorityItems.map((item) => (
                <PriorityRow
                  helper={item.helper}
                  key={item.helper}
                  tone={item.tone}
                >
                  {item.label}
                </PriorityRow>
              ))}
            </div>
          </AdminSectionCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_390px]">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-6">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Operations
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  Recent Products
                </h2>
              </div>
              <AdminBadge tone="brand">Live</AdminBadge>
            </div>
            <div className="overflow-x-auto">
              <AdminTable>
                <AdminTableHead>
                  <tr>
                    {["Product", "Stock", "Price", "Source", "Status", "Action"].map(
                      (heading) => (
                        <th className="px-5 py-4 font-medium" key={heading}>
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </AdminTableHead>
                <tbody>
                  {summary.recentProducts.length > 0 ? (
                    summary.recentProducts.map((product) => (
                      <tr
                        className="border-t border-slate-100 transition hover:bg-stone-50"
                        key={product.id}
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">
                            {product.product_name}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Product #{product.id}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700">
                          {product.stock_quantity}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700">
                          {formatMoney(product.price)}
                        </td>
                        <td className="px-5 py-4">
                          <AdminBadge tone="brand">MySQL</AdminBadge>
                        </td>
                        <td className="px-5 py-4">
                          <AdminBadge
                            tone={product.status === "active" ? "good" : "warn"}
                          >
                            {formatStatus(product.status)}
                          </AdminBadge>
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            className="text-sm font-bold text-[#5E7F85] hover:text-slate-950"
                            href="/products/edit"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <EmptyTableRow>
                      Recent products will appear here after products are added
                      from the product editor.
                    </EmptyTableRow>
                  )}
                </tbody>
              </AdminTable>
            </div>
          </section>

          <div className="space-y-6">
            <AdminSectionCard subtitle="Business Health" title="Snapshot">
              <div className="mt-5 space-y-4">
                {healthRows.map((row) => (
                  <ProgressRow
                    key={row.label}
                    label={row.label}
                    note={row.note}
                    value={row.value}
                  />
                ))}
              </div>
            </AdminSectionCard>

            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">ERP Note</div>
              <div className="mt-2 text-sm leading-6 text-amber-700">
                Dashboard should stay summary-only. Detailed actions should
                happen inside Orders, Inventory, Courier and Finance pages.
              </div>
            </section>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <AdminSectionCard subtitle="Low Stock Alert" title="Restock Watch">
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <b>Total products</b>
                  <span className="font-bold text-slate-700">
                    {summary.totalProducts}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Live catalog count
                </div>
              </div>
              <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <b>Low stock products</b>
                  <span className="font-bold text-amber-700">
                    {summary.lowStockProducts} left
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">Reorder soon</div>
              </div>
              <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <b>Out of stock products</b>
                  <span className="font-bold text-rose-700">
                    {summary.outOfStockProducts} left
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">Sales blocked</div>
              </div>
            </div>
          </AdminSectionCard>

          <AdminSectionCard subtitle="Top Products" title="Sales Winners">
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <b>Live winners unavailable</b>
                  <span className="font-bold text-[#5E7F85]">
                    {summary.totalOrders} orders
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Dashboard summary does not load product-level sales rankings.
                </div>
              </div>
              {summary.latestInventoryMovements.slice(0, 2).map((movement, index) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm"
                  key={movement.id}
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      #{index + 2} {movement.product_name ?? "Unknown product"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {formatStatus(movement.movement_type)}
                    </div>
                  </div>
                  <b className="text-[#5E7F85]">{movement.quantity}</b>
                </div>
              ))}
            </div>
          </AdminSectionCard>

          <AdminSectionCard
            className="md:col-span-2 xl:col-span-1"
            subtitle="Quick Actions"
            title="Control Shortcuts"
          >
            <div className="mt-5 space-y-3">
              {dashboardShortcuts.map(([label, href]) => (
                <Link
                  className="group flex w-full items-center justify-between rounded-2xl bg-stone-50 p-4 text-left text-sm font-semibold text-slate-700 transition hover:bg-stone-100"
                  href={href}
                  key={href}
                >
                  <span>{label}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5E7F85]/10 text-sm font-bold text-[#5E7F85] transition group-hover:translate-x-0.5 group-hover:bg-[#5E7F85] group-hover:text-white">
                    &gt;
                  </span>
                </Link>
              ))}
            </div>
          </AdminSectionCard>
        </section>
      </div>
    </AdminShell>
  );
}
