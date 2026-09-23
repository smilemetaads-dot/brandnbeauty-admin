"use client";

import { useState, type FormEvent } from "react";

import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type ImportRow = {
  identity_source?: "product_id" | "sku_or_slug" | "new_product" | null;
  matched_product_id?: number | null;
  maturity_preview?: "C0" | "C1" | "C2" | "C3" | null;
  message: string;
  row: number;
  status: string;
  warnings?: string[];
};

type ImportResult = {
  commit_expires_at?: string | null;
  commit_token?: string | null;
  dry_run?: boolean;
  message?: string;
  rows?: ImportRow[];
  success?: boolean;
  summary?: {
    created?: number;
    errors?: number;
    skipped?: number;
    updated?: number;
    warnings?: number;
    would_create?: number;
    would_update?: number;
  };
};

type ProductCsvImportPanelProps = {
  onClose: () => void;
  onImported: () => Promise<void>;
};

const IMPORT_ENDPOINT = bnbApiUrl("import_products_csv.php");
const CSV_HEADERS = [
  "product_id",
  "product_type",
  "parent_sku",
  "variant_sku",
  "variant_name",
  "option_name",
  "option_value",
  "product_name",
  "slug",
  "sku",
  "price",
  "sale_price",
  "stock_quantity",
  "image_url",
  "gallery_images",
  "category_slug",
  "subcategory_slug",
  "concern_slug",
  "concern_slugs",
  "brand_slug",
  "short_description",
  "description",
  "benefits",
  "how_to_use",
  "ingredients",
  "warnings",
  "suitable_for",
  "faq",
  "status",
  "inventory_mode",
  "availability_status",
  "minimum_order_quantity",
];

const CSV_TEMPLATE = [
  CSV_HEADERS.join(","),
  [
    "",
    "single",
    "",
    "",
    "",
    "",
    "",
    "REPLACE WITH REAL SINGLE PRODUCT",
    "replace-with-real-single-product",
    "REAL-SKU-001",
    "0.00",
    "",
    "0",
    "",
    "",
    "skincare",
    "",
    "",
    "acne|brightening",
    "brandnbeauty",
    "Replace with verified product copy",
    "Replace with verified PDP description",
    "",
    "",
    "",
    "",
    "",
    "",
    "draft",
    "stocked",
    "available",
    "1",
  ].join(","),
  [
    "",
    "variant",
    "REAL-PARENT-001",
    "REAL-PARENT-001-A",
    "Replace with real variant A",
    "Size",
    "REPLACE",
    "REPLACE WITH REAL VARIANT PRODUCT",
    "replace-with-real-variant-product",
    "",
    "0.00",
    "",
    "0",
    "",
    "",
    "skincare",
    "",
    "",
    "acne|brightening",
    "brandnbeauty",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "draft",
    "stocked",
    "available",
    "1",
  ].join(","),
  [
    "",
    "variant",
    "REAL-PARENT-001",
    "REAL-PARENT-001-B",
    "Replace with real variant B",
    "Size",
    "REPLACE",
    "REPLACE WITH REAL VARIANT PRODUCT",
    "replace-with-real-variant-product",
    "",
    "0.00",
    "",
    "0",
    "",
    "",
    "skincare",
    "",
    "",
    "acne|brightening",
    "brandnbeauty",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "draft",
    "stocked",
    "available",
    "1",
  ].join(","),
].join("\r\n");

const toneByStatus: Record<string, string> = {
  created: "bg-emerald-50 text-emerald-700",
  updated: "bg-sky-50 text-sky-700",
  variant_attached: "bg-teal-50 text-teal-700",
  ready_create: "bg-emerald-50 text-emerald-700",
  ready_update: "bg-sky-50 text-sky-700",
  ready_variant: "bg-teal-50 text-teal-700",
  skipped: "bg-amber-50 text-amber-700",
  error: "bg-rose-50 text-rose-700",
};

export function ProductCsvImportPanel({
  onClose,
  onImported,
}: ProductCsvImportPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [updateMode, setUpdateMode] = useState(false);
  const [readyToCommit, setReadyToCommit] = useState(false);
  const [commitToken, setCommitToken] = useState<string | null>(null);
  const [commitExpiresAt, setCommitExpiresAt] = useState<string | null>(null);

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "brandnbeauty-product-import-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setResult({ message: "Choose a CSV file before importing.", success: false });
      return;
    }

    const body = new FormData();
    body.set("file", file);
    body.set("update_mode", updateMode ? "true" : "false");
    body.set("dry_run", readyToCommit ? "false" : "true");
    if (readyToCommit && commitToken) {
      body.set("commit_token", commitToken);
    }
    setIsImporting(true);
    setResult(null);

    try {
      const response = await fetch(IMPORT_ENDPOINT, {
        body,
        headers: adminAuthHeaders(),
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as ImportResult | null;

      if (!response.ok || !payload) {
        throw new Error(payload?.message ?? "CSV import could not be completed.");
      }

      setResult(payload);
      if (payload.dry_run) {
        const token = payload.success ? payload.commit_token ?? null : null;
        setCommitToken(token);
        setCommitExpiresAt(payload.commit_expires_at ?? null);
        setReadyToCommit(Boolean(payload.success && token));
      } else {
        setCommitToken(null);
        setCommitExpiresAt(null);
        setReadyToCommit(false);
      }
      if ((payload.summary?.created ?? 0) > 0 || (payload.summary?.updated ?? 0) > 0) {
        await onImported();
      }
    } catch (error) {
      setResult({
        message: error instanceof Error ? error.message : "CSV import could not be completed.",
        success: false,
      });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="border-y border-slate-200 bg-stone-50/70 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Bulk Product CSV Import</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Every file must pass a server-enforced dry run before commit. The commit
            token is one-time, expires after 30 minutes, and is bound to the exact file
            hash plus update-mode choice. Imported knowledge stays candidate-only until
            human verification.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
            onClick={downloadTemplate}
            type="button"
          >
            Download Template
          </button>
          <button
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-xs font-bold uppercase text-slate-500">Supported columns</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {CSV_HEADERS.map((header) => (
            <code
              className="rounded-lg bg-stone-100 px-2 py-1 text-[11px] text-slate-700"
              key={header}
            >
              {header}
            </code>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Required: product_type, product_name, price, stock_quantity. For an existing
          product update, product_id is the safest identity and requires update mode.
          When product_id is supplied, it must exist, product type must match, and any
          supplied SKU/slug must not belong to another product. Existing SKU/slug matching
          still works for legacy files. Physical stock is preserved on existing products;
          stock corrections belong to Inventory. Imported content can reach at most C3
          automatically; C4 always needs human verification.
        </p>
      </div>

      <form className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="product-csv">
            CSV file
          </label>
          <input
            accept=".csv,text/csv"
            className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#5E7F85]/10 file:px-3 file:py-2 file:font-semibold file:text-[#5E7F85]"
            id="product-csv"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setReadyToCommit(false);
              setCommitToken(null);
              setCommitExpiresAt(null);
              setResult(null);
            }}
            type="file"
          />
          <label className="mt-3 flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              checked={updateMode}
              className="h-4 w-4 rounded border-slate-300 text-[#5E7F85]"
              onChange={(event) => {
                setUpdateMode(event.target.checked);
                setReadyToCommit(false);
                setResult(null);
              }}
              type="checkbox"
            />
            Update existing products (product_id exact match preferred; SKU/slug fallback)
          </label>
        </div>
        <button
          className="self-end rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isImporting}
          type="submit"
        >
          {isImporting
            ? readyToCommit ? "Importing..." : "Validating..."
            : readyToCommit ? "Confirm & Import" : "Preview Dry Run"}
        </button>
      </form>

      {result ? (
        <div className="mt-5">
          <div
            className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
              result.success ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
            }`}
          >
            {result.message}
            {result.dry_run && result.commit_token ? (
              <span className="mt-1 block text-xs font-medium">
                Validation locked to this exact file
                {commitExpiresAt ? ` · expires ${commitExpiresAt}` : ""}.
              </span>
            ) : null}
          </div>
          {result.summary ? (
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-7">
              {[
                ["Created", result.summary.created ?? 0],
                ["Updated", result.summary.updated ?? 0],
                ["Will Create", result.summary.would_create ?? 0],
                ["Will Update", result.summary.would_update ?? 0],
                ["Skipped", result.summary.skipped ?? 0],
                ["Errors", result.summary.errors ?? 0],
                ["Warnings", result.summary.warnings ?? 0],
              ].map(([label, value]) => (
                <div className="rounded-xl bg-white px-3 py-2 text-slate-600" key={label}>
                  {label}: <b className="text-slate-950">{value}</b>
                </div>
              ))}
            </div>
          ) : null}
          {result.rows?.length ? (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Row</th>
                    <th className="px-4 py-3">Result</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3">Matched Product</th>
                    <th className="px-4 py-3">Identity</th>
                    <th className="px-4 py-3">Maturity</th>
                    <th className="px-4 py-3">Warnings</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => (
                    <tr className="border-t border-slate-100" key={`${row.row}-${row.status}`}>
                      <td className="px-4 py-3 font-semibold">{row.row}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            toneByStatus[row.status] ?? "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.message}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {row.matched_product_id ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {row.identity_source ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[#edf3f4] px-2 py-1 text-xs font-bold text-[#496c69]">
                          {row.maturity_preview ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-amber-700">
                        {row.warnings?.join(" ") || "-"}
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
