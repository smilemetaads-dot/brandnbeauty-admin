"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import type {
  InventoryMovementRecord,
  InventoryProductRecord,
} from "./inventory-data";
import { StockAdjustmentForm } from "./StockAdjustmentForm";

type RealInventoryPageProps = {
  movements: InventoryMovementRecord[];
  products: InventoryProductRecord[];
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const LOW_STOCK_THRESHOLD = 10;
const HEALTHY_STOCK_SCALE = 50;

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
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

function StatCard({
  active = false,
  helper,
  icon,
  label,
  value,
}: {
  active?: boolean;
  helper: string;
  icon: string;
  label: string;
  value: string;
}) {
  const trendTone =
    helper.toLowerCase().includes("need") ||
    helper.toLowerCase().includes("blocked") ||
    helper.toLowerCase().includes("zero")
      ? "bg-amber-50 text-amber-600"
      : "bg-emerald-50 text-emerald-700";

  return (
    <div
      className={`group relative w-full overflow-hidden rounded-[1.7rem] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? "border-[#5E7F85] ring-2 ring-[#5E7F85]/15" : "border-slate-200"
      }`}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5E7F85]/5 transition group-hover:bg-[#5E7F85]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xs font-black text-[#5E7F85] transition group-hover:bg-[#5E7F85] group-hover:text-white">
          {icon}
        </div>
      </div>
      <div
        className={`relative mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${trendTone}`}
      >
        {helper}
      </div>
    </div>
  );
}

function DisabledAction({
  children,
  variant = "secondary",
}: {
  children: React.ReactNode;
  variant?: "brand" | "secondary";
}) {
  return (
    <button
      className={
        variant === "brand"
          ? "rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white opacity-60"
          : "rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-400"
      }
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function QuickActionButton({
  children,
  connected = false,
}: {
  children: React.ReactNode;
  connected?: boolean;
}) {
  return (
    <button
      className={`group flex w-full items-center justify-between rounded-2xl p-4 text-left text-sm font-semibold ${
        connected ? "bg-emerald-50 text-emerald-700" : "bg-stone-50 text-slate-400"
      }`}
      disabled
      type="button"
    >
      <span>{children}</span>
      <span
        className={`flex h-8 min-w-8 items-center justify-center rounded-xl bg-white px-2 text-[11px] font-bold ${
          connected ? "text-emerald-700" : "text-slate-400"
        }`}
      >
        {connected ? "Live" : "Later"}
      </span>
    </button>
  );
}

function getStockTone(stock: number): BadgeTone {
  if (stock <= 0) return "bad";
  if (stock <= LOW_STOCK_THRESHOLD) return "warn";
  return "good";
}

function getStockLabel(stock: number) {
  if (stock <= 0) return "Out";
  if (stock <= LOW_STOCK_THRESHOLD) return "Low";
  return "Healthy";
}

function getStockPercentage(stock: number) {
  return Math.min(Math.max((stock / HEALTHY_STOCK_SCALE) * 100, 0), 100);
}

function getReorderLevel(stock: number) {
  return stock <= LOW_STOCK_THRESHOLD ? LOW_STOCK_THRESHOLD : HEALTHY_STOCK_SCALE;
}

function formatDate(value: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMovementType(value: string) {
  const labels: Record<string, string> = {
    stock_in: "Stock In",
    stock_out: "Stock Out",
    correction: "Correction",
    order_deduction: "Order Deduction",
    order_restore: "Order Restore",
    manual_adjustment: "Manual Adjustment",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}

function movementTone(value: string): BadgeTone {
  if (value.includes("out") || value.includes("deduction")) return "bad";
  if (value.includes("correction")) return "warn";
  return "brand";
}

export function RealInventoryPage({
  movements,
  products,
}: RealInventoryPageProps) {
  const [inventorySearch, setInventorySearch] = useState("");
  const [stockFilter, setStockFilter] = useState("All");

  const totalSkus = products.length;
  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD,
  );
  const outOfStockProducts = products.filter((product) => product.stock <= 0);
  const activeProductsCount = products.filter(
    (product) => product.status === "active",
  ).length;
  const lowStockCount = lowStockProducts.length;
  const outOfStockCount = outOfStockProducts.length;
  const todayMovementTotal = movements.reduce(
    (sum, movement) => sum + Math.abs(movement.quantity),
    0,
  );
  const stockFilters = ["All", "Healthy", "Low", "Out"];
  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const stockLabel = getStockLabel(product.stock);
        const matchesStatus = stockFilter === "All" || stockLabel === stockFilter;
        const haystack = [
          product.name,
          product.sku,
          product.slug,
          product.brands?.name,
          product.categories?.name,
          product.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const query = inventorySearch.trim().toLowerCase();

        return matchesStatus && (query === "" || haystack.includes(query));
      }),
    [inventorySearch, products, stockFilter],
  );

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Across live products"
            icon="SKUs"
            label="Total SKUs"
            value={String(totalSkus)}
          />
          <StatCard
            active={lowStockCount > 0}
            helper="Need reorder soon"
            icon="Low"
            label="Low Stock"
            value={String(lowStockCount)}
          />
          <StatCard
            active={outOfStockCount > 0}
            helper="Sales blocked"
            icon="Out"
            label="Out of Stock"
            value={String(outOfStockCount)}
          />
          <StatCard
            helper="In + out combined"
            icon="Move"
            label="Today Movement"
            value={String(todayMovementTotal)}
          />
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  Inventory Control Center
                </h2>
                <Badge tone="brand">Automation Ready</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Clean stock view with low-risk manual control and future sync
                support.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DisabledAction>Import CSV</DisabledAction>
              <DisabledAction variant="brand">Add Stock</DisabledAction>
            </div>
          </div>

          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative max-w-md flex-1">
                <input
                  className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-11 text-sm outline-none placeholder:text-slate-400 focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/15"
                  onChange={(event) => setInventorySearch(event.target.value)}
                  placeholder="Search product / SKU / supplier..."
                  value={inventorySearch}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  S
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {stockFilters.map((item) => (
                  <button
                    className={`rounded-full px-4 py-2 text-xs font-semibold ${
                      stockFilter === item
                        ? "bg-[#5E7F85] text-white"
                        : "border border-slate-200 bg-white text-slate-600"
                    }`}
                    key={item}
                    onClick={() => setStockFilter(item)}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-stone-50 text-slate-500">
                <tr>
                  {[
                    "Product",
                    "SKU",
                    "Qty",
                    "Reorder",
                    "Available",
                    "Status",
                    "Action",
                  ].map((head) => (
                    <th className="px-5 py-4 font-medium" key={head}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const status = getStockLabel(product.stock);
                    const reorderLevel = getReorderLevel(product.stock);
                    const availableStock = Math.max(product.stock, 0);
                    const stockPercentage = getStockPercentage(product.stock);

                    return (
                      <tr
                        className={`border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85] ${
                          status === "Out"
                            ? "bg-rose-50/40"
                            : status === "Low"
                              ? "bg-amber-50/40"
                              : "bg-white"
                        }`}
                        key={product.id}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {product.image ? (
                              <Image
                                alt=""
                                className="h-11 w-11 rounded-2xl bg-stone-100 object-cover"
                                height={44}
                                src={product.image}
                                unoptimized
                                width={44}
                              />
                            ) : (
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xs font-black text-[#5E7F85]">
                                {product.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-slate-900">
                                {product.name}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                Supplier: {product.brands?.name ?? "No brand"} -
                                Updated {formatDate(product.updated_at)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {product.sku ?? "No SKU"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">
                            {product.stock}
                          </div>
                          <div className="mt-2 h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[#5E7F85]"
                              style={{ width: `${stockPercentage}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {reorderLevel}
                        </td>
                        <td
                          className={`px-5 py-4 font-semibold ${
                            availableStock === 0
                              ? "text-rose-600"
                              : availableStock <= reorderLevel
                                ? "text-amber-600"
                                : "text-slate-900"
                          }`}
                        >
                          {availableStock}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={getStockTone(product.stock)}>{status}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400"
                              disabled
                              type="button"
                            >
                              Adjust
                            </button>
                            <button
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400"
                              disabled
                              type="button"
                            >
                              Open
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      className="px-5 py-14 text-center text-sm text-slate-500"
                      colSpan={7}
                    >
                      No stock item found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <StockAdjustmentForm products={products} />

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-amber-900">Smart Alerts</h2>
            <div className="mt-4 space-y-3 text-sm text-amber-900">
              <div className="rounded-2xl bg-white/70 p-4">
                {lowStockCount} SKUs below reorder level.
                {lowStockProducts[0] ? ` Watch: ${lowStockProducts[0].name}.` : ""}
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                {outOfStockCount} products out of stock.
                {outOfStockProducts[0]
                  ? ` First blocked item: ${outOfStockProducts[0].name}.`
                  : ""}
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                {activeProductsCount} active products are currently sellable.
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                Duplicate stock entry protection is handled by the connected
                adjustment action.
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">
              Today Stock Movement
            </h2>
            <div className="mt-5 space-y-3">
              {movements.slice(0, 3).map((movement) => (
                <div className="rounded-2xl bg-stone-50 p-4 text-sm" key={movement.id}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">
                      {formatMovementType(movement.movement_type)}
                    </span>
                    <span
                      className={
                        movement.quantity >= 0
                          ? "font-bold text-emerald-600"
                          : "font-bold text-rose-600"
                      }
                    >
                      {movement.quantity >= 0 ? "+" : ""}
                      {movement.quantity}
                    </span>
                  </div>
                  <div className="mt-1 text-slate-500">
                    {movement.products?.name ?? "Unknown product"} -{" "}
                    {movement.note ?? "Action Log"}
                  </div>
                </div>
              ))}
              {movements.length === 0 ? (
                <div className="rounded-2xl bg-stone-50 p-4 text-sm text-slate-500">
                  No movement rows found yet.
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:col-span-2 xl:col-span-1">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">
              Quick Actions
            </h2>
            <div className="mt-5 space-y-3">
              <QuickActionButton connected>
                Manual Stock Adjustment - Connected
              </QuickActionButton>
              <QuickActionButton>Bulk Update - Not Connected</QuickActionButton>
              <QuickActionButton>Export Report - Not Connected</QuickActionButton>
            </div>
          </section>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  Stock Ledger
                </h2>
                <Badge tone="brand">Connected</Badge>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Latest read-only movement rows from inventory_movements.
              </p>
            </div>
            <Badge tone="default">Recent {movements.length}</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-stone-50 text-slate-500">
                <tr>
                  {[
                    "Product",
                    "Movement Type",
                    "Quantity",
                    "Previous Stock",
                    "New Stock",
                    "Note",
                    "Created At",
                  ].map((head) => (
                    <th className="px-5 py-4 font-medium" key={head}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movements.length > 0 ? (
                  movements.map((movement) => (
                    <tr
                      className="border-t border-slate-100 bg-white transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85]"
                      key={movement.id}
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-950">
                          {movement.products?.name ?? "Unknown product"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {movement.products?.sku ?? "No SKU"} /{" "}
                          {movement.products?.slug ?? movement.product_id}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={movementTone(movement.movement_type)}>
                          {formatMovementType(movement.movement_type)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {movement.quantity}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {movement.previous_stock}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-950">
                        {movement.new_stock}
                      </td>
                      <td className="max-w-[260px] px-5 py-4 text-slate-600">
                        {movement.note ?? "No note"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(movement.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-5 py-14 text-center text-sm text-slate-500"
                      colSpan={7}
                    >
                      No inventory movements found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
