"use client";

import { useActionState, useState } from "react";

import {
  createPurchaseEntry,
  type PurchaseActionState,
  updatePurchaseEntry,
} from "@/features/purchases/purchase-actions";

import type {
  PurchaseEntryRecord,
  PurchaseFormOptions,
} from "./purchases-data";

type PurchaseEntryFormProps = {
  entry?: PurchaseEntryRecord;
  mode: "create" | "edit";
  options: PurchaseFormOptions;
};

type ItemRow = {
  id: string;
  productId: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
};

const initialState: PurchaseActionState = {
  ok: false,
  message: "",
};

const inputClassName =
  "mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#527B86] focus:ring-2 focus:ring-[#527B86]/15 disabled:bg-slate-100 disabled:text-slate-400";

const labelClassName = "text-sm font-medium text-slate-600";

function createBlankRow(index: number): ItemRow {
  return {
    id: `new-${Date.now()}-${index}`,
    productId: "",
    quantity: 1,
    receivedQuantity: 0,
    unitCost: 0,
  };
}

function buildInitialRows(entry: PurchaseEntryRecord | undefined): ItemRow[] {
  if (!entry?.items.length) {
    return [createBlankRow(0)];
  }

  return entry.items.map((item, index) => ({
    id: item.id || `item-${index}`,
    productId: item.product_id ?? "",
    quantity: item.quantity,
    receivedQuantity: item.received_quantity,
    unitCost: item.unit_cost,
  }));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-BD", {
    currency: "BDT",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function toInputNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

export function PurchaseEntryForm({
  entry,
  mode,
  options,
}: PurchaseEntryFormProps) {
  const action = mode === "create" ? createPurchaseEntry : updatePurchaseEntry;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [rows, setRows] = useState<ItemRow[]>(() => buildInitialRows(entry));
  const isCreateMode = mode === "create";
  const canSubmit = options.products.length > 0;
  const draftTotal = rows.reduce(
    (sum, row) => sum + toInputNumber(row.quantity) * toInputNumber(row.unitCost),
    0,
  );

  function updateRow(rowId: string, values: Partial<ItemRow>) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              ...values,
            }
          : row,
      ),
    );
  }

  function addRow() {
    setRows((currentRows) => [
      ...currentRows,
      createBlankRow(currentRows.length),
    ]);
  }

  function removeRow(rowId: string) {
    setRows((currentRows) =>
      currentRows.length === 1
        ? currentRows
        : currentRows.filter((row) => row.id !== rowId),
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {isCreateMode ? null : (
        <input name="purchaseId" type="hidden" value={entry?.id ?? ""} />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className={`${labelClassName} lg:col-span-1`}>
          Invoice No / Purchase Number
          <input
            className={inputClassName}
            defaultValue={entry?.purchase_number ?? ""}
            disabled={isPending}
            name="purchase_number"
            placeholder="INV-2026-001"
            required
            type="text"
          />
        </label>

        <label className={`${labelClassName} lg:col-span-1`}>
          Supplier
          <select
            className={inputClassName}
            defaultValue={entry?.supplier_id ?? ""}
            disabled={isPending}
            name="supplier_id"
          >
            <option value="">No supplier selected</option>
            {options.suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
                {supplier.phone ? ` - ${supplier.phone}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClassName}>
          Warehouse
          <input
            className={`${inputClassName} font-semibold text-slate-400`}
            disabled
            placeholder="Main Warehouse preview"
            type="text"
          />
        </label>

        <label className={labelClassName}>
          Batch / GRN No
          <input
            className={`${inputClassName} font-semibold text-slate-400`}
            disabled
            placeholder="Generated after receive"
            type="text"
          />
        </label>

        <label className={`${labelClassName} lg:col-span-1`}>
          Status
          <select
            className={inputClassName}
            defaultValue={entry?.purchase_status ?? "draft"}
            disabled={isPending}
            name="purchase_status"
          >
            <option value="draft">Draft</option>
            <option value="ordered">Ordered</option>
            <option value="partially_received">Partially Received</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>

        <div className="rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3">
          <div className="text-xs font-bold text-slate-400">Draft Total</div>
          <div className="mt-1 text-lg font-black text-slate-950">
            {formatMoney(draftTotal)}
          </div>
        </div>
      </div>

      <label className={labelClassName}>
        Note
        <textarea
          className={`${inputClassName} min-h-24 resize-y`}
          defaultValue={entry?.note ?? ""}
          disabled={isPending}
          name="note"
          placeholder="Purchase note"
        />
      </label>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 p-3">
          <div className="text-xs text-slate-500">Landed Cost</div>
          <div className="mt-1 font-bold">{formatMoney(draftTotal)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-3">
          <div className="text-xs text-slate-500">Avg Margin</div>
          <div className="mt-1 font-bold text-slate-400">Not tracked</div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-3">
          <div className="text-xs text-slate-500">Units Added</div>
          <div className="mt-1 font-bold">
            {rows.reduce((sum, row) => sum + toInputNumber(row.quantity), 0)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-3">
          <div className="text-xs text-slate-500">Stock Value</div>
          <div className="mt-1 font-bold">{formatMoney(draftTotal)}</div>
        </div>
      </div>

      <section className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-stone-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-black text-slate-950">
              Purchase Items
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Product name and SKU are snapshotted from the selected product
              when the purchase is saved.
            </p>
          </div>
          <button
            className="rounded-2xl border border-[#527B86]/30 bg-white px-4 py-3 text-sm font-bold text-[#527B86] disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={isPending}
            onClick={addRow}
            type="button"
          >
            Add Item
          </button>
        </div>

        {rows.map((row, index) => {
          const selectedProduct = options.products.find(
            (product) => product.id === row.productId,
          );
          const lineTotal =
            toInputNumber(row.quantity) * toInputNumber(row.unitCost);

          return (
            <div
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[minmax(220px,1.4fr)_1fr_1fr_1fr_auto_auto]"
              key={row.id}
            >
              <label className={labelClassName}>
                Product
                <select
                  className={inputClassName}
                  disabled={isPending}
                  name="item_product_id"
                  onChange={(event) =>
                    updateRow(row.id, { productId: event.target.value })
                  }
                  required={index === 0}
                  value={row.productId}
                >
                  <option value="">Select product</option>
                  {options.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                      {product.sku ? ` - ${product.sku}` : ""}
                    </option>
                  ))}
                </select>
                {selectedProduct ? (
                  <span className="mt-1 block text-xs font-semibold text-slate-400">
                    Current stock: {selectedProduct.stock}
                  </span>
                ) : null}
              </label>

              <label className={labelClassName}>
                Quantity
                <input
                  className={inputClassName}
                  disabled={isPending}
                  min="0"
                  name="item_quantity"
                  onChange={(event) =>
                    updateRow(row.id, { quantity: Number(event.target.value) })
                  }
                  step="1"
                  type="number"
                  value={row.quantity}
                />
              </label>

              <label className={labelClassName}>
                Received Qty
                <input
                  className={inputClassName}
                  disabled={isPending}
                  min="0"
                  name="item_received_quantity"
                  onChange={(event) =>
                    updateRow(row.id, {
                      receivedQuantity: Number(event.target.value),
                    })
                  }
                  step="1"
                  type="number"
                  value={row.receivedQuantity}
                />
              </label>

              <label className={labelClassName}>
                Unit Cost
                <input
                  className={inputClassName}
                  disabled={isPending}
                  min="0"
                  name="item_unit_cost"
                  onChange={(event) =>
                    updateRow(row.id, { unitCost: Number(event.target.value) })
                  }
                  step="0.01"
                  type="number"
                  value={row.unitCost}
                />
              </label>

              <div className="rounded-2xl bg-stone-50 px-4 py-3">
                <div className="text-xs font-bold text-slate-400">
                  Line Total
                </div>
                <div className="mt-1 font-black text-slate-950">
                  {formatMoney(lineTotal)}
                </div>
              </div>

              <button
                className="self-end rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isPending || rows.length === 1}
                onClick={() => removeRow(row.id)}
                type="button"
              >
                Remove
              </button>
            </div>
          );
        })}
      </section>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900">
        This save does not update stock. Stock increases only when the existing
        Receive Stock action is used.
      </div>

      {options.products.length === 0 ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          Add products before creating purchase item rows.
        </div>
      ) : null}

      {state.message ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
            state.ok
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <button
        className="w-full rounded-2xl bg-[#527B86] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={isPending || !canSubmit}
        type="submit"
      >
        {isPending
          ? "Saving..."
          : isCreateMode
            ? "Create Purchase"
            : "Save Purchase"}
      </button>
    </form>
  );
}
