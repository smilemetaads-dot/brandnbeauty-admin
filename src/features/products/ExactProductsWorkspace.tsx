"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  archiveCatalogProduct,
  getCatalogProducts,
  productImageUrl,
  publishProductDraft,
  saveProductDraft,
  type CatalogProduct,
  type CatalogSummary,
  type ProductStatus,
} from "@/features/products/products-client";

type IconName =
  | "alert"
  | "check"
  | "close"
  | "copy"
  | "download"
  | "edit"
  | "eye"
  | "history"
  | "more"
  | "plus"
  | "products"
  | "refresh"
  | "search"
  | "upload";
type ProductView =
  "All products" | "Live" | "Drafts" | "Stock risk" | "Content issues";
type BulkAction = "Publish" | "Move to draft" | "Archive";

const EDIT_PRODUCT_KEY = "bnb-product-editor-id";
const emptySummary: CatalogSummary = {
  active: 0,
  drafts: 0,
  lowStock: 0,
  outOfStock: 0,
  total: 0,
};
const productViews: ProductView[] = [
  "All products",
  "Live",
  "Drafts",
  "Stock risk",
  "Content issues",
];

const iconPaths: Record<IconName, ReactNode> = {
  alert: (
    <>
      <path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  products: (
    <>
      <path d="m21 8-9-5-9 5 9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8M12 13v8" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 1 0-2.34 5.66" />
      <path d="M20 4v7h-7" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M5 21h14" />
    </>
  ),
};

function Icon({
  className = "",
  name,
  size = 16,
}: {
  className?: string;
  name: IconName;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width={size}
    >
      {iconPaths[name]}
    </svg>
  );
}

function money(amount: number) {
  return `৳${new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(amount)}`;
}

function updatedText(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const seconds = Math.max(1, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(date);
}

function storefrontStatus(product: CatalogProduct) {
  if (product.status === "active") return "Live";
  if (product.status === "draft") return "Draft";
  if (product.status === "archived") return "Archived";
  return "Needs review";
}

function statusTone(product: CatalogProduct) {
  if (product.status === "active")
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (product.status === "draft")
    return "bg-slate-100 text-slate-600 ring-slate-200";
  if (product.status === "archived")
    return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

function contentReport(product: CatalogProduct) {
  const checks = [
    ["Name", Boolean(product.name)],
    ["Slug", Boolean(product.slug)],
    ["Brand", Boolean(product.brand)],
    ["Category", Boolean(product.category)],
    ["Price", product.price > 0],
    ["Cost", product.costPrice !== null],
    ["Image", Boolean(product.image)],
    ["Description", Boolean(product.shortDescription || product.description)],
    ["SEO title", Boolean(product.metaTitle)],
    ["Meta description", Boolean(product.metaDescription)],
  ] as const;
  const missing = checks.filter(([, ok]) => !ok).map(([label]) => label);
  return {
    issue: missing.length ? missing.slice(0, 3).join(" · ") : "Complete",
    quality: Math.round(
      ((checks.length - missing.length) / checks.length) * 100,
    ),
  };
}

function margin(product: CatalogProduct) {
  if (product.costPrice === null || product.price <= 0) return null;
  return Math.round(
    ((product.price - product.costPrice) / product.price) * 100,
  );
}

function openEditor(productId: string, onNavigate: (page: string) => void) {
  window.sessionStorage.setItem(EDIT_PRODUCT_KEY, productId);
  onNavigate("Add/Edit Product");
}

export function ExactProductsWorkspace({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [summary, setSummary] = useState<CatalogSummary>(emptySummary);
  const [view, setView] = useState<ProductView>("All products");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [brand, setBrand] = useState("All brands");
  const [status, setStatus] = useState("All statuses");
  const [sort, setSort] = useState("Recently updated");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(
    null,
  );
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);
  const [actionIds, setActionIds] = useState<string[]>([]);
  const [actionReason, setActionReason] = useState("");
  const [actionConfirmed, setActionConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }, []);

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError("");
    try {
      const result = await getCatalogProducts(signal);
      setProducts(result.products);
      setSummary(result.summary);
    } catch (error) {
      if (!signal?.aborted)
        setLoadError(
          error instanceof Error
            ? error.message
            : "Product catalog could not be loaded.",
        );
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const categories = useMemo(
    () => [
      "All categories",
      ...Array.from(
        new Set(products.map((product) => product.category).filter(Boolean)),
      ).sort(),
    ],
    [products],
  );
  const brands = useMemo(
    () => [
      "All brands",
      ...Array.from(
        new Set(products.map((product) => product.brand).filter(Boolean)),
      ).sort(),
    ],
    [products],
  );
  const reports = useMemo(
    () =>
      new Map(products.map((product) => [product.id, contentReport(product)])),
    [products],
  );
  const contentIssues = products.filter(
    (product) => (reports.get(product.id)?.quality || 0) < 90,
  ).length;
  const costCoverage = products.filter(
    (product) => product.costPrice !== null,
  ).length;
  const readiness = products.length
    ? Math.round(((products.length - contentIssues) / products.length) * 100)
    : 0;
  const viewCounts: Record<ProductView, number> = {
    "All products": summary.total,
    Live: summary.active,
    Drafts: products.filter(
      (product) => product.status === "draft" || Boolean(product.draftId),
    ).length,
    "Stock risk": summary.lowStock + summary.outOfStock,
    "Content issues": contentIssues,
  };

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = products.filter((product) => {
      const report = reports.get(product.id) || contentReport(product);
      const matchesQuery =
        !needle ||
        `${product.name} ${product.sku} ${product.brand}`
          .toLowerCase()
          .includes(needle);
      const matchesCategory =
        category === "All categories" || product.category === category;
      const matchesBrand = brand === "All brands" || product.brand === brand;
      const matchesStatus =
        status === "All statuses" || storefrontStatus(product) === status;
      const matchesView =
        view === "All products" ||
        (view === "Live" && product.status === "active") ||
        (view === "Drafts" &&
          (product.status === "draft" || Boolean(product.draftId))) ||
        (view === "Stock risk" && product.stock <= product.lowStockThreshold) ||
        (view === "Content issues" && report.quality < 90);
      return (
        matchesQuery &&
        matchesCategory &&
        matchesBrand &&
        matchesStatus &&
        matchesView
      );
    });
    return [...rows].sort((a, b) =>
      sort === "Low stock first"
        ? a.stock - b.stock
        : sort === "Highest margin"
          ? (margin(b) ?? -1) - (margin(a) ?? -1)
          : new Date(b.updatedAt || 0).getTime() -
            new Date(a.updatedAt || 0).getTime(),
    );
  }, [brand, category, products, query, reports, sort, status, view]);

  const allVisibleSelected =
    filtered.length > 0 &&
    filtered.every((product) => selectedIds.includes(product.id));

  function clearFilters() {
    setQuery("");
    setCategory("All categories");
    setBrand("All brands");
    setStatus("All statuses");
    setView("All products");
  }

  function openAction(action: BulkAction, ids = selectedIds) {
    setPendingAction(action);
    setActionIds(ids);
    setActionReason("");
    setActionConfirmed(false);
    setSelectedProduct(null);
  }

  async function applyAction() {
    if (!pendingAction || !actionConfirmed || !actionIds.length) return;
    setIsSaving(true);
    try {
      const targets = products.filter((product) =>
        actionIds.includes(product.id),
      );
      if (pendingAction === "Archive") {
        await Promise.all(
          targets.map((product) =>
            archiveCatalogProduct(product.id, actionReason),
          ),
        );
      } else if (pendingAction === "Publish") {
        const publishable = targets.filter((product) => product.draftId);
        if (!publishable.length)
          throw new Error(
            "Selected products have no saved draft to publish. Open the product editor first.",
          );
        await Promise.all(
          publishable.map((product) =>
            publishProductDraft(
              product.draftId,
              actionReason || "Approved from Products workspace",
            ),
          ),
        );
      } else {
        await Promise.all(
          targets.map(async (product) => {
            const saved = await saveProductDraft({
              ...product,
              status: "draft" as ProductStatus,
            });
            await publishProductDraft(saved.draftId, actionReason);
          }),
        );
      }
      showNotice(
        `${actionIds.length} product${actionIds.length === 1 ? "" : "s"} updated successfully.`,
      );
      setPendingAction(null);
      setSelectedIds([]);
      await load();
    } catch (error) {
      showNotice(
        error instanceof Error
          ? error.message
          : "The selected products could not be updated.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3b646d]" />
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3b646d]">
              Catalog operations
            </p>
          </div>
          <h1 className="mt-2 text-[28px] font-bold tracking-[-.035em] text-[#17231f] sm:text-[32px]">
            Products workspace
          </h1>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-5 text-[#66736d]">
            Keep every product sellable, accurate, profitable and ready for the
            storefront.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="flex h-10 items-center gap-2 rounded-xl border border-[#dce4e0] bg-white px-3.5 text-[9.5px] font-bold text-[#596962]"
            onClick={() =>
              showNotice(
                "Import remains disabled until the validated catalog-import backend is connected.",
              )
            }
            type="button"
          >
            <Icon name="upload" size={13} /> Import
          </button>
          <button
            className="flex h-10 items-center gap-2 rounded-xl border border-[#dce4e0] bg-white px-3.5 text-[9.5px] font-bold text-[#596962]"
            onClick={() =>
              showNotice(
                "Export will be enabled with the production catalog export endpoint.",
              )
            }
            type="button"
          >
            <Icon name="download" size={13} /> Export
          </button>
          <button
            className="flex h-10 items-center gap-2 rounded-xl bg-[#3b646d] px-4 text-[9.5px] font-bold text-white shadow-sm"
            onClick={() => openEditor("", onNavigate)}
            type="button"
          >
            <Icon name="plus" size={14} /> Add product
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Total products",
            String(summary.total),
            "Complete catalog",
            "products",
          ],
          [
            "Live storefront",
            String(summary.active),
            summary.total
              ? `${Math.round((summary.active / summary.total) * 100)}% of catalog`
              : "No catalog yet",
            "eye",
          ],
          [
            "Stock risk",
            String(summary.lowStock + summary.outOfStock),
            `${summary.lowStock} low · ${summary.outOfStock} out`,
            "alert",
          ],
          ["Content issues", String(contentIssues), "Needs enrichment", "edit"],
        ].map(([label, value, note, icon], index) => (
          <article
            className="rounded-2xl border border-[#e2e8e5] bg-white p-[18px] shadow-[0_1px_2px_rgba(24,45,39,.025)]"
            key={label}
          >
            <div className="flex items-start justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf3f4] text-[#3b646d]">
                <Icon name={icon as IconName} size={15} />
              </span>
              <span
                className={`rounded-full px-2 py-1 text-[7px] font-bold ${index < 2 ? "bg-emerald-50 text-emerald-700" : index === 2 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}
              >
                {index < 2 ? "Healthy" : "Review"}
              </span>
            </div>
            <b className="mt-4 block text-[22px] tracking-[-.03em] text-[#23322b]">
              {value}
            </b>
            <span className="mt-1 block text-[9px] font-bold text-[#65736c]">
              {label}
            </span>
            <small className="mt-1 block text-[8px] text-[#929d97]">
              {note}
            </small>
          </article>
        ))}
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <article className="rounded-2xl border border-[#e2e8e5] bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#84908a]">
                Catalog readiness
              </p>
              <b className="mt-1 block text-[13px] text-[#33423b]">
                {readiness}% ready to sell
              </b>
            </div>
            <span className="text-[18px] font-bold text-[#3b646d]">
              {readiness}%
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf1ef]">
            <div
              className="h-full rounded-full bg-[#5f8585]"
              style={{ width: `${readiness}%` }}
            />
          </div>
          <p className="mt-3 text-[8px] leading-4 text-[#87928d]">
            {contentIssues} products need content, SEO, image or attribute
            review.
          </p>
        </article>
        <article className="rounded-2xl border border-[#e2e8e5] bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#84908a]">
                Profitability coverage
              </p>
              <b className="mt-1 block text-[13px] text-[#33423b]">
                {costCoverage} products have cost
              </b>
            </div>
            <span className="rounded-full bg-amber-50 px-2 py-1 text-[7px] font-bold text-amber-700">
              {Math.max(0, products.length - costCoverage)} missing
            </span>
          </div>
          <p className="mt-3 text-[8px] leading-4 text-[#87928d]">
            Cost is required before trustworthy margin and profitability
            reporting.
          </p>
        </article>
        <article className="rounded-2xl border border-[#d5e2df] bg-[#edf3f4] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#5d7775]">
                Storefront connection
              </p>
              <b className="mt-1 block text-[13px] text-[#304d4d]">
                Customer website unchanged
              </b>
            </div>
            <span className="rounded-full bg-white px-2 py-1 text-[7px] font-bold text-emerald-700">
              Connected
            </span>
          </div>
          <p className="mt-3 text-[8px] leading-4 text-[#647b77]">
            Publish state, price and stock use the existing storefront contract.
          </p>
        </article>
      </section>

      {loadError ? (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[9px] font-bold text-rose-700">
          <span>{loadError}</span>
          <button onClick={() => void load()} type="button">
            Try again
          </button>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-[#e2e8e5] bg-white">
        <div className="border-b border-[#e8ecea] px-4 pt-4 sm:px-5">
          <div className="flex gap-1 overflow-x-auto">
            {productViews.map((item) => (
              <button
                className={`whitespace-nowrap border-b-2 px-3 pb-3 text-[9px] font-bold transition ${view === item ? "border-[#3b646d] text-[#3b646d]" : "border-transparent text-[#87928d] hover:text-[#53645d]"}`}
                key={item}
                onClick={() => setView(item)}
                type="button"
              >
                {item}
                <span
                  className={`ml-2 rounded-full px-1.5 py-0.5 text-[7px] ${view === item ? "bg-[#edf3f4]" : "bg-[#f2f4f3]"}`}
                >
                  {viewCounts[item]}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3 border-b border-[#e8ecea] bg-[#fbfcfb] p-4 sm:p-5">
          <div className="flex flex-col gap-2 lg:flex-row">
            <label className="relative min-w-0 flex-1">
              <Icon
                className="absolute left-3 top-3 text-[#8a9590]"
                name="search"
                size={14}
              />
              <input
                className="h-10 w-full rounded-xl border border-[#dce4e0] bg-white pl-9 pr-3 text-[9.5px] font-medium text-[#405049] outline-none focus:border-[#9eb7b4]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search product, SKU or brand..."
                value={query}
              />
            </label>
            {[
              [category, setCategory, categories],
              [brand, setBrand, brands],
              [
                status,
                setStatus,
                ["All statuses", "Live", "Draft", "Needs review", "Archived"],
              ],
              [
                sort,
                setSort,
                ["Recently updated", "Low stock first", "Highest margin"],
              ],
            ].map(([value, setter, options], index) => (
              <select
                className="h-10 rounded-xl border border-[#dce4e0] bg-white px-3 text-[9px] font-bold text-[#58675f] outline-none"
                key={index}
                onChange={(event) =>
                  (setter as (value: string) => void)(event.target.value)
                }
                value={value as string}
              >
                {(options as string[]).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            ))}
          </div>
          {query ||
          category !== "All categories" ||
          brand !== "All brands" ||
          status !== "All statuses" ||
          view !== "All products" ? (
            <div className="flex items-center justify-between gap-3 text-[8px] text-[#84908a]">
              <span>{filtered.length} matching live catalog records</span>
              <button
                className="font-bold text-[#3b646d]"
                onClick={clearFilters}
                type="button"
              >
                Clear all filters
              </button>
            </div>
          ) : null}
        </div>

        {selectedIds.length ? (
          <div className="flex flex-col gap-3 border-b border-[#d8e4e0] bg-[#edf3f4] px-4 py-3 sm:flex-row sm:items-center sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-[#3b646d] px-2 text-[8px] font-bold text-white">
                {selectedIds.length}
              </span>
              <b className="text-[9px] text-[#405b58]">products selected</b>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="h-8 rounded-lg border border-[#c7d8d3] bg-white px-3 text-[8px] font-bold text-[#416764]"
                onClick={() => openAction("Publish")}
                type="button"
              >
                Publish
              </button>
              <button
                className="h-8 rounded-lg border border-[#c7d8d3] bg-white px-3 text-[8px] font-bold text-[#58675f]"
                onClick={() => openAction("Move to draft")}
                type="button"
              >
                Move to draft
              </button>
              <button
                className="h-8 rounded-lg border border-rose-200 bg-white px-3 text-[8px] font-bold text-rose-700"
                onClick={() => openAction("Archive")}
                type="button"
              >
                Archive
              </button>
              <button
                aria-label="Clear selection"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#708079]"
                onClick={() => setSelectedIds([])}
                type="button"
              >
                <Icon name="close" size={13} />
              </button>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="px-5 py-20 text-center text-[9px] font-bold text-[#87928d]">
            Loading real products...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left">
              <thead className="bg-[#fafbfa] text-[7.5px] font-bold uppercase tracking-[.1em] text-[#8a9590]">
                <tr>
                  <th className="w-12 px-5 py-3.5">
                    <input
                      aria-label="Select all visible products"
                      checked={allVisibleSelected}
                      className="h-3.5 w-3.5 accent-[#3b646d]"
                      onChange={(event) =>
                        setSelectedIds((current) =>
                          event.target.checked
                            ? Array.from(
                                new Set([
                                  ...current,
                                  ...filtered.map((product) => product.id),
                                ]),
                              )
                            : current.filter(
                                (id) =>
                                  !filtered.some(
                                    (product) => product.id === id,
                                  ),
                              ),
                        )
                      }
                      type="checkbox"
                    />
                  </th>
                  <th className="px-2 py-3.5">Product</th>
                  <th className="px-4 py-3.5">Catalog</th>
                  <th className="px-4 py-3.5">Price & margin</th>
                  <th className="px-4 py-3.5">Stock</th>
                  <th className="px-4 py-3.5">Storefront</th>
                  <th className="px-4 py-3.5">Content</th>
                  <th className="px-4 py-3.5">Updated</th>
                  <th className="w-12 px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0ee]">
                {filtered.map((product) => {
                  const report =
                    reports.get(product.id) || contentReport(product);
                  const productMargin = margin(product);
                  const image = productImageUrl(product.image);
                  return (
                    <tr
                      className="group text-[8.5px] text-[#5f6e67] hover:bg-[#fafcfb]"
                      key={product.id}
                    >
                      <td className="px-5 py-4">
                        <input
                          aria-label={`Select ${product.name}`}
                          checked={selectedIds.includes(product.id)}
                          className="h-3.5 w-3.5 accent-[#3b646d]"
                          onChange={(event) =>
                            setSelectedIds((current) =>
                              event.target.checked
                                ? [...current, product.id]
                                : current.filter((id) => id !== product.id),
                            )
                          }
                          type="checkbox"
                        />
                      </td>
                      <td className="px-2 py-4">
                        <button
                          className="flex min-w-[260px] items-center gap-3 text-left"
                          onClick={() => setSelectedProduct(product)}
                          type="button"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e1e8e5] bg-[#f5f8f7] text-[#5f817c]">
                            {image ? (
                              <img
                                alt=""
                                className="h-full w-full object-contain"
                                src={image}
                              />
                            ) : (
                              <Icon name="products" size={16} />
                            )}
                          </span>
                          <span>
                            <b className="block max-w-[235px] truncate text-[9.5px] text-[#33423b]">
                              {product.name}
                            </b>
                            <small className="mt-1 block font-mono text-[7px] text-[#929d97]">
                              {product.sku || `Product #${product.id}`}
                            </small>
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <b className="block text-[8px] text-[#53625c]">
                          {product.category || "Uncategorized"}
                        </b>
                        <span className="mt-1 block text-[7px] text-[#929d97]">
                          {product.brand || "Brand not set"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <b className="block text-[9px] text-[#34433d]">
                          {money(product.price)}
                        </b>
                        <span
                          className={`mt-1 block text-[7px] font-bold ${productMargin === null ? "text-amber-700" : "text-emerald-700"}`}
                        >
                          {productMargin === null
                            ? "Cost missing"
                            : `${productMargin}% gross margin`}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <b
                          className={`block text-[9px] ${product.stock === 0 ? "text-rose-700" : product.stock <= product.lowStockThreshold ? "text-amber-700" : "text-[#405049]"}`}
                        >
                          {product.stock}
                        </b>
                        <span className="mt-1 block text-[7px] text-[#929d97]">
                          {product.stock === 0
                            ? "Out of stock"
                            : product.stock <= product.lowStockThreshold
                              ? "Low stock"
                              : "In stock"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[7px] font-bold ring-1 ring-inset ${statusTone(product)}`}
                        >
                          {storefrontStatus(product)}
                        </span>
                        <span className="mt-1.5 block text-[7px] text-[#929d97]">
                          {product.status === "active"
                            ? "Visible on website"
                            : "Not publicly visible"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-[#e8ecea]">
                            <div
                              className={`h-full rounded-full ${report.quality >= 90 ? "bg-emerald-500" : report.quality >= 70 ? "bg-amber-500" : "bg-rose-500"}`}
                              style={{ width: `${report.quality}%` }}
                            />
                          </div>
                          <b className="text-[7.5px] text-[#596861]">
                            {report.quality}%
                          </b>
                        </div>
                        <span
                          className={`mt-1.5 block max-w-[125px] truncate text-[7px] ${report.issue === "Complete" ? "text-[#929d97]" : "text-amber-700"}`}
                        >
                          {report.issue}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[7.5px] text-[#718079]">
                          {updatedText(product.updatedAt)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          aria-label={`Open ${product.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8a9590] hover:bg-[#edf3f4] hover:text-[#3b646d]"
                          onClick={() => setSelectedProduct(product)}
                          type="button"
                        >
                          <Icon name="more" size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && !filtered.length ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3f4] text-[#3b646d]">
              <Icon name="search" size={19} />
            </span>
            <b className="mt-4 text-[12px] text-[#405049]">
              No matching products
            </b>
            <p className="mt-1 text-[9px] text-[#929d97]">
              Try a different search or clear the active filters.
            </p>
            <button
              className="mt-4 h-9 rounded-xl border border-[#dce4e0] bg-white px-4 text-[8.5px] font-bold text-[#3b646d]"
              onClick={clearFilters}
              type="button"
            >
              Clear filters
            </button>
          </div>
        ) : null}
        <div className="flex flex-col gap-2 border-t border-[#e8ecea] bg-[#fafbfa] px-5 py-3 text-[8px] text-[#87928d] sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {filtered.length} live catalog records · {summary.total}{" "}
            total
          </span>
          <span>
            Search, filters and product editing use the existing backend API.
          </span>
        </div>
      </section>

      <section className="flex gap-3 rounded-2xl border border-[#d8e4e1] bg-[#edf3f4] p-4 text-[8px] leading-4 text-[#526965]">
        <Icon className="mt-0.5 shrink-0" name="check" size={13} />
        <p>
          <b>Module boundary:</b> this page is for search, monitoring and
          controlled bulk maintenance. Product content, SEO, variants, media and
          pricing history belong inside Add/Edit Product.
        </p>
      </section>

      {selectedProduct ? (
        <div
          className="fixed inset-0 z-[70] bg-[#17231f]/30 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelectedProduct(null);
          }}
        >
          <aside className="absolute inset-y-0 right-0 w-full max-w-[470px] overflow-y-auto bg-white shadow-[-25px_0_70px_rgba(17,35,30,.18)]">
            <div className="flex items-start justify-between border-b border-[#e8ecea] p-5">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#3b646d]">
                  Quick product inspector
                </p>
                <h2 className="mt-1.5 max-w-[350px] text-[18px] font-bold leading-6 text-[#23322b]">
                  {selectedProduct.name}
                </h2>
                <p className="mt-1 font-mono text-[8px] text-[#929d97]">
                  {selectedProduct.sku || `Product #${selectedProduct.id}`}
                </p>
              </div>
              <button
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2f5f3] text-[#65736c]"
                onClick={() => setSelectedProduct(null)}
                type="button"
              >
                <Icon name="close" size={14} />
              </button>
            </div>
            <div className="space-y-5 p-5">
              <div className="flex h-52 items-center justify-center overflow-hidden rounded-xl border border-[#e2e8e5] bg-[#fafbfa]">
                {productImageUrl(selectedProduct.image) ? (
                  <img
                    alt={selectedProduct.name}
                    className="h-full w-full object-contain"
                    src={productImageUrl(selectedProduct.image) || ""}
                  />
                ) : (
                  <Icon name="products" size={28} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Stock", `${selectedProduct.stock}`],
                  ["Selling price", money(selectedProduct.price)],
                  [
                    "Gross margin",
                    margin(selectedProduct) === null
                      ? "Cost missing"
                      : `${margin(selectedProduct)}%`,
                  ],
                  [
                    "Content quality",
                    `${contentReport(selectedProduct).quality}%`,
                  ],
                ].map(([label, value]) => (
                  <div
                    className="rounded-xl border border-[#e2e8e5] p-4"
                    key={label}
                  >
                    <span className="text-[7px] font-bold uppercase tracking-[.1em] text-[#929d97]">
                      {label}
                    </span>
                    <b className="mt-2 block text-[9px] text-[#405049]">
                      {value}
                    </b>
                  </div>
                ))}
              </div>
              <button
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#3b646d] text-[9px] font-bold text-white"
                onClick={() => openEditor(selectedProduct.id, onNavigate)}
                type="button"
              >
                <Icon name="edit" size={13} /> Open full product editor
              </button>
              <button
                className="flex h-10 w-full items-center justify-center rounded-xl text-[8.5px] font-bold text-rose-700"
                onClick={() => openAction("Archive", [selectedProduct.id])}
                type="button"
              >
                Archive product
              </button>
              <div className="flex gap-3 rounded-xl bg-[#edf3f4] p-4 text-[8px] leading-4 text-[#526965]">
                <Icon className="mt-0.5 shrink-0" name="history" size={13} />
                <p>
                  Product changes use the existing draft, publish and archive
                  workflow. Existing order history is never deleted.
                </p>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {pendingAction ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#17231f]/45 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setPendingAction(null);
          }}
        >
          <div className="max-h-[92vh] w-full max-w-[540px] overflow-y-auto rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.24)]">
            <div className="flex items-start justify-between border-b border-[#e8ecea] p-5">
              <div>
                <p
                  className={`text-[8px] font-bold uppercase tracking-[.14em] ${pendingAction === "Archive" ? "text-rose-700" : "text-[#3b646d]"}`}
                >
                  Human approval required
                </p>
                <h2 className="mt-1.5 text-[18px] font-bold text-[#23322b]">
                  {pendingAction} {actionIds.length} product
                  {actionIds.length === 1 ? "" : "s"}
                </h2>
                <p className="mt-1 text-[8.5px] text-[#929d97]">
                  This changes real storefront publication state.
                </p>
              </div>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5f3] text-[#65736c]"
                onClick={() => setPendingAction(null)}
                type="button"
              >
                <Icon name="close" size={14} />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50/65 p-4 text-[8px] leading-4 text-amber-800">
                <Icon className="mt-0.5 shrink-0" name="alert" size={13} />
                <p>
                  {pendingAction === "Publish"
                    ? "Only selected products with a saved draft can be published."
                    : pendingAction === "Move to draft"
                      ? "Selected products will be published as draft and disappear from the customer storefront."
                      : "Archived products remain recoverable for audit and historical orders, but cannot be sold."}
                </p>
              </div>
              <label className="block text-[8px] font-bold uppercase tracking-[.1em] text-[#75827c]">
                Change reason
                <textarea
                  className="mt-2 min-h-20 w-full resize-none rounded-xl border border-[#dce4e0] p-3 text-[8.5px] font-medium normal-case tracking-normal text-[#4d5d55] outline-none"
                  onChange={(event) => setActionReason(event.target.value)}
                  value={actionReason}
                />
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#dce5e1] p-4">
                <input
                  checked={actionConfirmed}
                  className="mt-0.5 h-4 w-4 accent-[#3b646d]"
                  onChange={(event) => setActionConfirmed(event.target.checked)}
                  type="checkbox"
                />
                <span className="text-[8px] leading-4 text-[#596861]">
                  I reviewed the selected products and approve this real catalog
                  change.
                </span>
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#e8ecea] bg-[#fafbfa] p-5">
              <button
                className="h-10 rounded-xl border border-[#dce4e0] bg-white px-4 text-[8.5px] font-bold text-[#66756e]"
                onClick={() => setPendingAction(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className={`h-10 rounded-xl px-4 text-[8.5px] font-bold text-white disabled:opacity-45 ${pendingAction === "Archive" ? "bg-rose-700" : "bg-[#3b646d]"}`}
                disabled={
                  !actionConfirmed ||
                  (pendingAction !== "Publish" && !actionReason.trim()) ||
                  isSaving
                }
                onClick={() => void applyAction()}
                type="button"
              >
                {isSaving
                  ? "Working..."
                  : `Confirm ${pendingAction.toLowerCase()}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {notice ? (
        <div className="fixed bottom-5 right-5 z-[100] max-w-sm rounded-xl bg-[#223c3f] px-4 py-3 text-[9px] font-semibold leading-5 text-white shadow-xl">
          {notice}
        </div>
      ) : null}
    </div>
  );
}
