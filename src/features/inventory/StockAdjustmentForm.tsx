"use client";

import { useActionState } from "react";

import {
  adjustProductStock,
  type InventoryActionState,
} from "@/features/inventory/inventory-actions";

import type { InventoryProductRecord } from "./inventory-data";

type StockAdjustmentFormProps = {
  products: InventoryProductRecord[];
};

const initialState: InventoryActionState = {
  ok: false,
  message: "",
};

const inputClassName =
  "mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 shadow-sm transition focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/15";

const labelClassName = "text-sm font-medium text-slate-600";

export function StockAdjustmentForm({ products }: StockAdjustmentFormProps) {
  const [state, formAction, isPending] = useActionState(
    adjustProductStock,
    initialState,
  );

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[#5E7F85]/20 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-stone-50/70 px-6 py-4">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#5E7F85]">
          Safe Stock Control
        </div>
      </div>
      <div className="p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
            Manual Stock Adjustment
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Updates product stock, auto-syncs stock status, and logs the
            movement in inventory_movements. No hard delete.
          </p>
        </div>
        <div className="rounded-2xl bg-[#5E7F85]/10 px-4 py-3 text-xs font-bold text-[#5E7F85]">
          Movement logging connected
        </div>
      </div>

      <form action={formAction} className="mt-6 grid gap-5 lg:grid-cols-4">
        <label className={`${labelClassName} lg:col-span-2`}>
          Product
          <select
            className={inputClassName}
            disabled={products.length === 0 || isPending}
            name="productId"
            required
          >
            <option value="">Select product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku ?? "No SKU"}) - stock{" "}
                {product.stock}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClassName}>
          Adjustment type
          <select
            className={inputClassName}
            disabled={isPending}
            name="adjustmentType"
            required
          >
            <option value="stock_in">Stock In</option>
            <option value="stock_out">Stock Out</option>
            <option value="correction">Correction</option>
          </select>
        </label>

        <label className={labelClassName}>
          Quantity
          <input
            className={inputClassName}
            disabled={isPending}
            min="1"
            name="quantity"
            placeholder="1"
            required
            step="1"
            type="number"
          />
        </label>

        <label className={`${labelClassName} lg:col-span-3`}>
          Note
          <textarea
            className={`${inputClassName} min-h-24 resize-y`}
            disabled={isPending}
            name="note"
            placeholder="Optional adjustment reason"
          />
        </label>

        <div className="flex items-end">
          <button
            className="w-full rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isPending || products.length === 0}
            type="submit"
          >
            {isPending ? "Updating..." : "Update Stock"}
          </button>
        </div>

        {state.message ? (
          <div
            className={`rounded-2xl px-4 py-3 text-sm font-semibold lg:col-span-4 ${
              state.ok
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {state.message}
          </div>
        ) : null}
      </form>
      </div>
    </section>
  );
}
