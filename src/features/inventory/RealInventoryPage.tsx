"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

type InventoryProduct = {
  is_low_stock?: boolean;
  price: number;
  product_id: string;
  product_image: string | null;
  product_name: string;
  stock_quantity: number;
  stock_value?: number;
};

type InventorySummary = {
  low_stock_items_count: number;
  total_stock_value: number;
  total_unique_products: number;
};

type InventoryResponse = {
  inventory?: unknown;
  message?: string;
  success?: boolean;
  summary?: Partial<InventorySummary>;
};

const INVENTORY_ENDPOINT =
  "http://localhost/BrandnBeauty/brandnbeauty-backend/php/get_inventory.php";
const LOW_STOCK_THRESHOLD = 5;

function toNumber(value: unknown) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function toStringOrNull(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : null;
}

function normalizeProduct(value: unknown): InventoryProduct | null {
  if (!value || typeof value !== "object") return null;

  const product = value as Record<string, unknown>;
  const productId = String(product.product_id ?? product.id ?? "");
  const productName = String(product.product_name ?? product.name ?? "").trim();
  const price = toNumber(product.price);
  const stockQuantity = Math.trunc(toNumber(product.stock_quantity ?? product.stock));

  if (!productId || !productName) return null;

  return {
    is_low_stock: Boolean(product.is_low_stock ?? stockQuantity <= LOW_STOCK_THRESHOLD),
    price,
    product_id: productId,
    product_image: toStringOrNull(product.product_image ?? product.image_url ?? product.image),
    product_name: productName,
    stock_quantity: stockQuantity,
    stock_value: toNumber(product.stock_value ?? price * stockQuantity),
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-BD", {
    currency: "BDT",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function MetricCard({
  danger = false,
  helper,
  label,
  value,
}: {
  danger?: boolean;
  helper: string;
  label: string;
  value: string;
}) {
  return (
    <section
      className={`group relative overflow-hidden rounded-[1.7rem] border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        danger ? "border-rose-200 ring-2 ring-rose-100" : "border-slate-200"
      }`}
    >
      <div
        className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${
          danger ? "bg-rose-100" : "bg-[#5E7F85]/10"
        }`}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div
            className={`mt-3 text-2xl font-black tracking-tight ${
              danger ? "text-rose-700" : "text-slate-950"
            }`}
          >
            {value}
          </div>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-black ${
            danger
              ? "bg-rose-50 text-rose-700"
              : "bg-[#5E7F85]/10 text-[#5E7F85]"
          }`}
        >
          {danger ? "!" : "#"}
        </div>
      </div>
      <div
        className={`relative mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
          danger ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
        }`}
      >
        {helper}
      </div>
    </section>
  );
}

function StockBadge({ quantity }: { quantity: number }) {
  const isLow = quantity <= LOW_STOCK_THRESHOLD;

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
        isLow ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {isLow ? `Low: ${quantity}` : `In stock: ${quantity}`}
    </span>
  );
}

export function RealInventoryPage() {
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<InventorySummary>({
    low_stock_items_count: 0,
    total_stock_value: 0,
    total_unique_products: 0,
  });

  const loadInventory = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      const response = await fetch(INVENTORY_ENDPOINT, {
        cache: "no-store",
        signal,
      });
      const payload = (await response.json()) as InventoryResponse;

      if (!response.ok || payload.success === false) {
        throw new Error(payload.message ?? "Inventory request failed.");
      }

      const nextInventory = Array.isArray(payload.inventory)
        ? payload.inventory
            .map(normalizeProduct)
            .filter((product): product is InventoryProduct => Boolean(product))
        : [];

      setInventory(nextInventory);
      setSummary({
        low_stock_items_count: Math.trunc(
          toNumber(payload.summary?.low_stock_items_count),
        ),
        total_stock_value: toNumber(payload.summary?.total_stock_value),
        total_unique_products: Math.trunc(
          toNumber(payload.summary?.total_unique_products),
        ),
      });
    } catch (error) {
      if (!signal?.aborted) {
        console.error("Inventory data could not be loaded.", error);
        setInventory([]);
        setSummary({
          low_stock_items_count: 0,
          total_stock_value: 0,
          total_unique_products: 0,
        });
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void Promise.resolve().then(() => loadInventory(controller.signal));

    return () => {
      controller.abort();
    };
  }, [loadInventory]);

  const lowStockProducts = useMemo(
    () => inventory.filter((product) => product.stock_quantity <= LOW_STOCK_THRESHOLD),
    [inventory],
  );

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            helper="Active product catalog"
            label="Total Products"
            value={String(summary.total_unique_products)}
          />
          <MetricCard
            helper="Price x stock quantity"
            label="Total Inventory Value"
            value={formatMoney(summary.total_stock_value)}
          />
          <MetricCard
            danger={summary.low_stock_items_count > 0}
            helper={
              summary.low_stock_items_count > 0
                ? "Needs reorder attention"
                : "No urgent stock alerts"
            }
            label="Low Stock Alert"
            value={String(summary.low_stock_items_count)}
          />
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Stock Alert & Inventory Log
              </div>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                Live Inventory
              </h1>
            </div>
            <div
              className={`rounded-full px-4 py-2 text-xs font-black ${
                lowStockProducts.length
                  ? "bg-rose-50 text-rose-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {lowStockProducts.length
                ? `${lowStockProducts.length} low stock item(s)`
                : "Stock health clear"}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-stone-50 text-slate-500">
                <tr>
                  {["Product Image", "Product Name", "Price", "Stock Quantity"].map(
                    (heading) => (
                      <th className="px-5 py-4 font-medium" key={heading}>
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-5 py-14 text-center text-sm text-slate-500" colSpan={4}>
                      Loading live inventory from local MySQL...
                    </td>
                  </tr>
                ) : inventory.length ? (
                  inventory.map((product) => {
                    const isLowStock = product.stock_quantity <= LOW_STOCK_THRESHOLD;

                    return (
                      <tr
                        className={`border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85] ${
                          isLowStock ? "bg-rose-50/50" : "bg-white"
                        }`}
                        key={product.product_id}
                      >
                        <td className="px-5 py-4">
                          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-stone-100 text-xs font-black text-slate-400">
                            {product.product_image ? (
                              <img
                                alt={product.product_name}
                                className="h-full w-full object-cover"
                                src={product.product_image}
                              />
                            ) : (
                              product.product_name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-black text-slate-950">
                            {product.product_name}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">
                            ID: {product.product_id}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-800">
                          {formatMoney(product.price)}
                        </td>
                        <td className="px-5 py-4">
                          <StockBadge quantity={product.stock_quantity} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-5 py-14 text-center text-sm text-slate-500" colSpan={4}>
                      No active product inventory found.
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
