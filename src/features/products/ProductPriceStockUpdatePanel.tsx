"use client";

import { useState, type FormEvent } from "react";

import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type UpdateType = "single" | "variant";

type PriceStockRow = {
  after?: Record<string, string | number | null>;
  before?: Record<string, string | number | null>;
  changes?: string[];
  errors?: string[];
  message?: string;
  option_value?: string;
  parent_sku?: string;
  product_id?: number | null;
  product_name?: string;
  row: number;
  sku?: string;
  status: string;
  variant_id?: number | null;
  variant_sku?: string;
  warnings?: string[];
};

type PriceStockResult = {
  backup_path?: string;
  message?: string;
  mode?: "preview" | "apply";
  rows?: PriceStockRow[];
  success?: boolean;
  summary?: {
    invalid_rows?: number;
    missing_skus?: number;
    rows_matched?: number;
    rows_to_update?: number;
    unchanged_rows?: number;
    updated_rows?: number;
  };
  update_type?: UpdateType;
};

type ProductPriceStockUpdatePanelProps = {
  onApplied: () => Promise<void>;
  onClose: () => void;
};

const PRICE_STOCK_ENDPOINT = bnbApiUrl("update_price_stock_csv.php");

const statusClassName: Record<string, string> = {
  invalid: "bg-rose-50 text-rose-700",
  missing_sku: "bg-amber-50 text-amber-700",
  to_update: "bg-sky-50 text-sky-700",
  unchanged: "bg-stone-100 text-slate-600",
  updated: "bg-emerald-50 text-emerald-700",
};

function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";

  return String(value);
}

function getRowSku(row: PriceStockRow, updateType: UpdateType) {
  return updateType === "variant" ? row.variant_sku : row.sku;
}

export function ProductPriceStockUpdatePanel({
  onApplied,
  onClose,
}: ProductPriceStockUpdatePanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PriceStockResult | null>(null);
  const [updateType, setUpdateType] = useState<UpdateType>("single");

  const hasSuccessfulPreview =
    result?.success === true &&
    result.mode === "preview" &&
    (result.summary?.invalid_rows ?? 0) === 0 &&
    (result.summary?.missing_skus ?? 0) === 0;
  const rowsToUpdate = result?.summary?.rows_to_update ?? 0;

  async function submitUpdate(mode: "preview" | "apply") {
    if (!file) {
      setResult({ message: "Choose a CSV file before previewing.", success: false });
      return;
    }

    const body = new FormData();
    body.set("file", file);
    body.set("mode", mode);
    body.set("update_type", updateType);
    if (mode === "apply") {
      body.set("confirm_apply", "APPLY_PRICE_STOCK_UPDATES");
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(PRICE_STOCK_ENDPOINT, {
        body,
        headers: adminAuthHeaders(),
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as PriceStockResult | null;

      if (!response.ok || !payload) {
        throw new Error(payload?.message ?? "Price and stock update failed.");
      }

      setResult(payload);
      if (mode === "apply" && payload.success) {
        await onApplied();
      }
    } catch (error) {
      setResult({
        message: error instanceof Error ? error.message : "Price and stock update failed.",
        success: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitUpdate("preview");
  }

  return (
    <section className="border-y border-slate-200 bg-stone-50/70 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Price & Stock Update</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            SKU-only update for real pricing and inventory. Blank price or stock cells
            leave the current value unchanged; product content, mappings, images and
            status are not updated here.
          </p>
        </div>
        <button
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>

      <form className="mt-5 grid gap-4 lg:grid-cols-[180px_1fr_auto]" onSubmit={handlePreview}>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">CSV type</span>
          <select
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none"
            onChange={(event) => {
              setUpdateType(event.target.value as UpdateType);
              setResult(null);
            }}
            value={updateType}
          >
            <option value="single">Single products</option>
            <option value="variant">Variant rows</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Update CSV</span>
          <input
            accept=".csv,text/csv"
            className="block h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#5E7F85]/10 file:px-3 file:py-2 file:font-semibold file:text-[#5E7F85]"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setResult(null);
            }}
            type="file"
          />
        </label>
        <button
          className="self-end rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Checking..." : "Preview"}
        </button>
      </form>

      {result ? (
        <div className="mt-5 space-y-4">
          <div
            className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
              result.success ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
            }`}
          >
            {result.message}
            {result.backup_path ? (
              <span className="block pt-1 text-xs font-medium">
                Backup: {result.backup_path}
              </span>
            ) : null}
          </div>

          {result.summary ? (
            <div className="grid gap-2 text-sm sm:grid-cols-3 xl:grid-cols-6">
              {[
                ["Matched", result.summary.rows_matched ?? 0],
                ["To update", result.summary.rows_to_update ?? 0],
                ["Updated", result.summary.updated_rows ?? 0],
                ["Unchanged", result.summary.unchanged_rows ?? 0],
                ["Missing SKU", result.summary.missing_skus ?? 0],
                ["Invalid", result.summary.invalid_rows ?? 0],
              ].map(([label, value]) => (
                <div className="rounded-xl bg-white px-3 py-2 text-slate-600" key={label}>
                  {label}: <b className="text-slate-950">{value}</b>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!hasSuccessfulPreview || rowsToUpdate <= 0 || isSubmitting}
              onClick={() => void submitUpdate("apply")}
              type="button"
            >
              {isSubmitting ? "Applying..." : "Apply Approved Updates"}
            </button>
            {hasSuccessfulPreview && rowsToUpdate <= 0 ? (
              <span className="self-center text-sm font-semibold text-slate-500">
                No changed values to apply.
              </span>
            ) : null}
          </div>

          {result.rows?.length ? (
            <div className="max-h-96 overflow-auto rounded-2xl border border-slate-200 bg-white">
              <table className="min-w-full text-left text-xs">
                <thead className="sticky top-0 bg-stone-50 text-slate-500">
                  <tr>
                    {[
                      "Row",
                      updateType === "variant" ? "Variant SKU" : "SKU",
                      "Product",
                      "Status",
                      "Before",
                      "After",
                      "Message",
                    ].map((heading) => (
                      <th className="px-3 py-3 font-bold" key={heading}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => (
                    <tr className="border-t border-slate-100" key={`${row.row}-${getRowSku(row, updateType)}`}>
                      <td className="px-3 py-3 font-semibold text-slate-500">{row.row}</td>
                      <td className="px-3 py-3 font-semibold text-slate-900">
                        {getRowSku(row, updateType) ?? "-"}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {row.product_name ?? "-"}
                        {row.option_value ? (
                          <span className="block text-[11px] text-slate-500">
                            {row.option_value}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2 py-1 font-bold ${
                            statusClassName[row.status] ?? "bg-stone-100 text-slate-600"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {row.before
                          ? `P ${formatValue(row.before.regular_price)} / S ${formatValue(
                              row.before.sale_price,
                            )} / Q ${formatValue(row.before.stock_quantity)}`
                          : "-"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {row.after
                          ? `P ${formatValue(row.after.regular_price)} / S ${formatValue(
                              row.after.sale_price,
                            )} / Q ${formatValue(row.after.stock_quantity)}`
                          : "-"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {row.message ?? "-"}
                        {row.warnings?.length ? (
                          <span className="block text-[11px] text-amber-700">
                            {row.warnings.join(" ")}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
