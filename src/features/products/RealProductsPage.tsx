"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AdminBadge,
  AdminStatCard,
  AdminTable,
  AdminTableHead,
  AdminTableRow,
  getAdminStatusTone,
} from "@/components/admin/AdminUiPrimitives";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiAssetUrl, bnbApiUrl } from "@/lib/bnb-api";

import type { ProductRecord } from "./products-data";
import { ProductCsvImportPanel } from "./ProductCsvImportPanel";
import { ProductPriceStockUpdatePanel } from "./ProductPriceStockUpdatePanel";

type RealProductsPageProps = {
  products?: ProductRecord[];
};

type AdminProductRow = {
  active_variant_count?: unknown;
  attributes?: unknown;
  brand_id?: unknown;
  category?: unknown;
  category_id?: unknown;
  created_at?: unknown;
  description?: unknown;
  id?: unknown;
  image_url?: unknown;
  inventory_mode?: unknown;
  availability_status?: unknown;
  minimum_order_quantity?: unknown;
  name?: unknown;
  price?: unknown;
  product_name?: unknown;
  product_type?: unknown;
  max_variant_price?: unknown;
  min_variant_price?: unknown;
  sku?: unknown;
  slug?: unknown;
  status?: unknown;
  stock?: unknown;
  stock_quantity?: unknown;
  updated_at?: unknown;
  variant_count?: unknown;
  variant_stock?: unknown;
};

type CatalogRelation = {
  name: string | null;
  slug: string | null;
} | null;

type SearchableProductRecord = ProductRecord & {
  activeVariantCount: number;
  availabilityStatus: "available" | "unavailable";
  categoryParent?: CatalogRelation;
  inventoryMode: "stocked" | "on_demand";
  maxVariantPrice: number | null;
  minVariantPrice: number | null;
  minimumOrderQuantity: number;
  productType: "single" | "variant";
  subcategory?: CatalogRelation;
  variantCount: number;
};

type CatalogItem = {
  id: string;
  name: string;
  parent_id?: number | string | null;
  slug: string;
};

type CatalogMeta = {
  brandsById: Map<string, CatalogItem>;
  categoriesById: Map<string, CatalogItem>;
};

const PRODUCT_FILTERS = [
  "All Products",
  "Visible",
  "Hidden",
  "Active",
  "Low Stock",
  "Out of Stock",
  "Discontinued",
  "Notify Me",
  "Stocked",
  "On Demand",
  "Available",
  "Unavailable",
];

const BULK_INVENTORY_ENDPOINT = bnbApiUrl("bulk_inventory_mode_update.php");
const UPDATE_PRODUCT_ENDPOINT = bnbApiUrl("update_product.php");
const ADMIN_PRODUCTS_ENDPOINT = bnbApiUrl("admin_products.php");
const DELETE_CATALOG_ITEM_ENDPOINT = bnbApiUrl("delete_catalog_item.php");
const BRANDS_ENDPOINT = bnbApiUrl("get_brands.php?include_inactive=1");
const CATEGORIES_ENDPOINT = bnbApiUrl("get_categories.php?include_inactive=1");

const EMPTY_CATALOG_META: CatalogMeta = {
  brandsById: new Map<string, CatalogItem>(),
  categoriesById: new Map<string, CatalogItem>(),
};

function toNumber(value: unknown) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function toStringOrNull(value: unknown) {
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeStatus(status: string | null, stock: number) {
  if (status === "draft" || status === "inactive") {
    return status;
  }
  if (stock <= 0) return "out_of_stock";
  if (status === "active") return status;
  if (stock <= 10) return "low_stock";

  return "draft";
}

function normalizeImageUrl(imageUrl: string | null) {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

  return bnbApiAssetUrl(imageUrl);
}

function normalizeAttributes(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  return null;
}

function normalizeCatalogItem(value: unknown): CatalogItem | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Record<string, unknown>;
  const id = String(item.id ?? "");
  const name = String(item.name ?? "").trim();

  if (!id || !name) return null;

  return {
    id,
    name,
    parent_id:
      typeof item.parent_id === "number" || typeof item.parent_id === "string"
        ? item.parent_id
        : null,
    slug: toStringOrNull(item.slug) ?? slugify(name),
  };
}

function buildCatalogMap(payload: unknown): Map<string, CatalogItem> {
  const items = Array.isArray(payload)
    ? payload
        .map(normalizeCatalogItem)
        .filter((item): item is CatalogItem => Boolean(item))
    : [];

  return new Map(items.map((item) => [item.id, item]));
}

function normalizeAdminProduct(
  value: unknown,
  catalogMeta: CatalogMeta = EMPTY_CATALOG_META,
): SearchableProductRecord | null {
  if (!value || typeof value !== "object") return null;

  const product = value as AdminProductRow;
  const id = String(product.id ?? "");
  const name = String(product.product_name ?? product.name ?? "").trim();

  if (!id || !name) return null;

  const productType = toStringOrNull(product.product_type) === "variant" ? "variant" : "single";
  const stock =
    productType === "variant"
      ? toNumber(product.variant_stock)
      : toNumber(product.stock_quantity ?? product.stock);
  const minVariantPrice =
    product.min_variant_price === null || product.min_variant_price === undefined
      ? null
      : toNumber(product.min_variant_price);
  const maxVariantPrice =
    product.max_variant_price === null || product.max_variant_price === undefined
      ? null
      : toNumber(product.max_variant_price);
  const categoryName = toStringOrNull(product.category);
  const attributes = normalizeAttributes(product.attributes);
  const importedSku = toStringOrNull(attributes?.import_sku);
  const importedSlug = toStringOrNull(attributes?.import_slug);
  const brandId = toStringOrNull(product.brand_id);
  const categoryId = toStringOrNull(product.category_id);
  const brand = brandId ? catalogMeta.brandsById.get(brandId) : null;
  const mappedCategory = categoryId ? catalogMeta.categoriesById.get(categoryId) : null;
  const parentCategory =
    mappedCategory?.parent_id !== null && mappedCategory?.parent_id !== undefined
      ? catalogMeta.categoriesById.get(String(mappedCategory.parent_id))
      : null;
  const parentRelation = parentCategory
    ? { name: parentCategory.name, slug: parentCategory.slug }
    : null;
  const subcategoryRelation =
    mappedCategory && parentCategory
      ? { name: mappedCategory.name, slug: mappedCategory.slug }
      : null;
  const categoryRelation =
    parentRelation ??
    (mappedCategory
      ? { name: mappedCategory.name, slug: mappedCategory.slug }
      : categoryName
        ? { name: categoryName, slug: slugify(categoryName) }
        : null);

  return {
    attributes,
    activeVariantCount: toNumber(product.active_variant_count),
    brand_id: brandId,
    brands: brand ? { name: brand.name, slug: brand.slug } : null,
    category_id: categoryId,
    categories: categoryRelation,
    categoryParent: parentRelation,
    concernIds: [],
    created_at: toStringOrNull(product.created_at),
    featured: false,
    id,
    image: normalizeImageUrl(toStringOrNull(product.image_url)),
    inventoryMode: toStringOrNull(product.inventory_mode) === "on_demand" ? "on_demand" : "stocked",
    name,
    old_price: null,
    price: productType === "variant" && minVariantPrice !== null ? minVariantPrice : toNumber(product.price),
    productType,
    availabilityStatus: toStringOrNull(product.availability_status) === "unavailable" ? "unavailable" : "available",
    minimumOrderQuantity: Math.max(1, Math.floor(toNumber(product.minimum_order_quantity) || 1)),
    short_description: toStringOrNull(product.description),
    sku: toStringOrNull(product.sku) ?? importedSku ?? `BNB-${id.padStart(4, "0")}`,
    slug:
      toStringOrNull(product.slug) ??
      importedSlug ??
      (slugify(name) || `product-${id}`),
    status: normalizeStatus(toStringOrNull(product.status), stock),
    stock,
    subcategory: subcategoryRelation,
    updated_at: toStringOrNull(product.updated_at),
    maxVariantPrice,
    minVariantPrice,
    variantCount: toNumber(product.variant_count),
  };
}

function normalizeAdminProducts(payload: unknown, catalogMeta: CatalogMeta = EMPTY_CATALOG_META) {
  return Array.isArray(payload)
    ? payload
        .map((product) => normalizeAdminProduct(product, catalogMeta))
        .filter((product): product is SearchableProductRecord => Boolean(product))
    : [];
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(price);

const formatStatus = (status: string | null) => {
  const labels: Record<string, string> = {
    active: "Active",
    draft: "Draft",
    inactive: "Inactive",
    low_stock: "Low Stock",
    out_of_stock: "Out of Stock",
  };

  return status ? (labels[status] ?? status) : "Unknown";
};

const getVisibilityLabel = (status: string | null) =>
  status === "draft" || status === "inactive" ? "Hidden" : "Visible";

const getStockRuleLabel = (status: string | null) => {
  if (status === "out_of_stock") return "Notify Me";
  if (status === "draft" || status === "inactive") return "Disabled";

  return "Sellable";
};

const isVariantProduct = (product: Pick<SearchableProductRecord, "productType">) =>
  product.productType === "variant";

const getPriceLabel = (product: SearchableProductRecord) => {
  if (!isVariantProduct(product)) {
    return `BDT ${formatPrice(product.price)}`;
  }

  if (product.minVariantPrice === null) {
    return "No active price";
  }

  if (
    product.maxVariantPrice === null ||
    product.maxVariantPrice === product.minVariantPrice
  ) {
    return `BDT ${formatPrice(product.minVariantPrice)}`;
  }

  return `From BDT ${formatPrice(product.minVariantPrice)}`;
};

const hasAttributes = (attributes: ProductRecord["attributes"]) =>
  Boolean(attributes && Object.keys(attributes).length > 0);

const getCategoryLabel = (product: SearchableProductRecord) =>
  [product.categories?.name, product.subcategory?.name].filter(Boolean).join(" / ") || "-";

const getSearchableText = (product: SearchableProductRecord) =>
  [
    product.name,
    product.sku,
    product.slug,
    product.brands?.name,
    product.brands?.slug,
    product.categories?.name,
    product.categories?.slug,
    product.subcategory?.name,
    product.subcategory?.slug,
    product.categoryParent?.name,
    product.categoryParent?.slug,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const getMatchesProductFilter = (product: SearchableProductRecord, filter: string) => {
  const visibility = getVisibilityLabel(product.status);

  switch (filter) {
    case "Visible":
      return visibility === "Visible";
    case "Hidden":
      return visibility === "Hidden";
    case "Active":
      return product.status === "active";
    case "Low Stock":
      return product.stock > 0 && product.stock <= 10;
    case "Out of Stock":
      return product.stock <= 0;
    case "Discontinued":
      return product.status === "inactive";
    case "Notify Me":
      return visibility === "Visible" && product.stock <= 0;
    case "Stocked":
      return product.inventoryMode === "stocked";
    case "On Demand":
      return product.inventoryMode === "on_demand";
    case "Available":
      return product.availabilityStatus === "available";
    case "Unavailable":
      return product.availabilityStatus === "unavailable";
    case "All Products":
    default:
      return true;
  }
};

function StatusControl({
  product,
  compact = false,
  onUpdated,
}: {
  compact?: boolean;
  onUpdated: () => Promise<void>;
  product: ProductRecord;
}) {
  const [status, setStatus] = useState(
    product.status === "inactive" ? "inactive" : product.status === "active" ? "active" : "draft",
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(UPDATE_PRODUCT_ENDPOINT, {
        body: JSON.stringify(
          isVariantProduct(product as SearchableProductRecord)
            ? {
                product_id: product.id,
                status,
              }
            : {
                price: product.price,
                product_id: product.id,
                status,
                stock_quantity: product.stock,
              },
        ),
        headers: adminAuthHeaders({
          "Content-Type": "application/json",
        }),
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Product status could not be updated.");
      }

      await onUpdated();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Product status could not be updated.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <input name="id" type="hidden" value={product.id} />
      <label className="sr-only" htmlFor={`status-${product.id}`}>
        Product status
      </label>
      <select
        className={`rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-stone-50 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/20 ${
          compact ? "px-3 py-2" : "px-4 py-3"
        }`}
        id={`status-${product.id}`}
        name="status"
        onChange={(event) => setStatus(event.target.value)}
        value={status}
      >
        <option
          disabled={
            isVariantProduct(product as SearchableProductRecord) &&
            (product as SearchableProductRecord).activeVariantCount <= 0
          }
          value="active"
        >
          Active
        </option>
        <option value="draft">Draft</option>
        <option value="inactive">Inactive</option>
      </select>
      <button
        className={`rounded-2xl bg-[#5E7F85] font-semibold text-white transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300 ${
          compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
        }`}
        disabled={isSaving}
        type="submit"
      >
        {isSaving ? "Saving..." : "Update"}
      </button>
    </form>
  );
}

function BulkInventoryModePanel({
  onApplied,
  onClose,
}: {
  onApplied: () => Promise<void>;
  onClose: () => void;
}) {
  const [isBusy, setIsBusy] = useState(false);
  const [result, setResult] = useState<{
    backup_path?: string | null;
    excluded_products?: Array<{ product_id: number; product_name: string; reason: string }>;
    matched_products?: number;
    mode?: string;
    on_demand_products?: number;
    stocked_products?: number;
    updated_products?: number;
    updated_variants?: number;
    variants_affected?: number;
  } | null>(null);
  const [message, setMessage] = useState("");

  const runBulkMode = async (mode: "dry_run" | "apply") => {
    setIsBusy(true);
    setMessage("");

    try {
      const response = await fetch(BULK_INVENTORY_ENDPOINT, {
        body: JSON.stringify({
          confirmation: mode === "apply" ? "APPLY_INVENTORY_MODE_UPDATE" : undefined,
          filters: { status: "all", product_type: "all" },
          mode,
          preset: "launch_inventory_modes",
        }),
        headers: adminAuthHeaders({ "Content-Type": "application/json" }),
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Bulk inventory update failed.");
      }

      setResult(payload);
      setMessage(mode === "apply" ? "Inventory launch setup applied." : "Dry run completed.");
      if (mode === "apply") {
        await onApplied();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bulk inventory update failed.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="border-t border-slate-100 bg-white p-5">
      <div className="rounded-[1.5rem] border border-slate-200 bg-stone-50 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-sm font-bold text-slate-900">Bulk Inventory Mode Setup</div>
            <div className="mt-1 text-sm leading-6 text-slate-600">
              Launch preset: The Derma Plus becomes Stocked; other real brands become On Demand. Physical stock, status, price, images, mappings, and content are unchanged.
            </div>
          </div>
          <button className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600" onClick={onClose} type="button">Close</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-2xl border border-[#5E7F85] bg-white px-4 py-3 text-sm font-semibold text-[#5E7F85] disabled:opacity-50" disabled={isBusy} onClick={() => runBulkMode("dry_run")} type="button">
            Dry Run
          </button>
          <button className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50" disabled={isBusy || !result} onClick={() => runBulkMode("apply")} type="button">
            Apply Launch Setup
          </button>
        </div>
        {message ? <div className="mt-3 text-sm font-semibold text-slate-700">{message}</div> : null}
        {result ? (
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-2xl bg-white p-4"><div className="text-xs font-semibold text-slate-500">Matched</div><div className="mt-1 text-lg font-bold">{result.matched_products ?? 0}</div></div>
            <div className="rounded-2xl bg-white p-4"><div className="text-xs font-semibold text-slate-500">Stocked</div><div className="mt-1 text-lg font-bold">{result.stocked_products ?? 0}</div></div>
            <div className="rounded-2xl bg-white p-4"><div className="text-xs font-semibold text-slate-500">On Demand</div><div className="mt-1 text-lg font-bold">{result.on_demand_products ?? 0}</div></div>
            <div className="rounded-2xl bg-white p-4"><div className="text-xs font-semibold text-slate-500">Variants Affected</div><div className="mt-1 text-lg font-bold">{result.variants_affected ?? 0}</div></div>
            <div className="rounded-2xl bg-white p-4"><div className="text-xs font-semibold text-slate-500">Updated Products</div><div className="mt-1 text-lg font-bold">{result.updated_products ?? 0}</div></div>
            <div className="rounded-2xl bg-white p-4"><div className="text-xs font-semibold text-slate-500">Updated Variants</div><div className="mt-1 text-lg font-bold">{result.updated_variants ?? 0}</div></div>
          </div>
        ) : null}
        {result?.backup_path ? <div className="mt-3 truncate rounded-2xl bg-white px-4 py-3 text-xs font-semibold text-slate-600">Backup: {result.backup_path}</div> : null}
        {result?.excluded_products?.length ? (
          <div className="mt-4 rounded-2xl bg-white p-4 text-xs text-slate-600">
            <div className="font-bold text-slate-900">Excluded products</div>
            <div className="mt-2 max-h-28 space-y-1 overflow-auto">
              {result.excluded_products.slice(0, 20).map((item) => (
                <div key={item.product_id}>{item.product_id} - {item.product_name}: {item.reason}</div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DraftArchiveButton({
  onUpdated,
  product,
}: {
  onUpdated: () => Promise<void>;
  product: ProductRecord;
}) {
  const [isSaving, setIsSaving] = useState(false);

  const handleClick = async () => {
    setIsSaving(true);

    try {
      const response = await fetch(UPDATE_PRODUCT_ENDPOINT, {
        body: JSON.stringify(
          isVariantProduct(product as SearchableProductRecord)
            ? {
                product_id: product.id,
                status: "draft",
              }
            : {
                price: product.price,
                product_id: product.id,
                status: "draft",
                stock_quantity: product.stock,
              },
        ),
        headers: adminAuthHeaders({
          "Content-Type": "application/json",
        }),
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Product status could not be updated.");
      }

      await onUpdated();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Product status could not be updated.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isSaving}
      onClick={handleClick}
      type="button"
    >
      {isSaving ? "Saving..." : "Set Draft Archive Safe"}
    </button>
  );
}

function DisabledAction({ children }: { children: ReactNode }) {
  return (
    <button
      className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-500 shadow-sm transition disabled:opacity-60"
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function ProductImage({
  className,
  product,
  size = 48,
}: {
  className?: string;
  product: ProductRecord;
  size?: number;
}) {
  if (!product.image) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-[10px] font-bold text-slate-400 ${className ?? ""}`}
        style={{ height: size, width: size }}
      >
        IMG
      </div>
    );
  }

  return (
    <Image
      alt=""
      className={`shrink-0 rounded-2xl bg-stone-100 object-cover ${className ?? ""}`}
      height={size}
      src={product.image}
      unoptimized
      width={size}
    />
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3">
      <span className="text-slate-500">{label}</span>
      <b className="text-right text-slate-950">{value}</b>
    </div>
  );
}

export function RealProductsPage({ products: initialProducts = [] }: RealProductsPageProps) {
  const [catalogMeta, setCatalogMeta] = useState<CatalogMeta>(EMPTY_CATALOG_META);
  const [products, setProducts] = useState<SearchableProductRecord[]>(
    initialProducts as SearchableProductRecord[],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Products");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deletingProductIds, setDeletingProductIds] = useState<string[]>([]);
  const [showBulkInventoryMode, setShowBulkInventoryMode] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showPriceStockUpdate, setShowPriceStockUpdate] = useState(false);

  const loadCatalogMeta = useCallback(async (signal?: AbortSignal) => {
    try {
      const [brandsResponse, categoriesResponse] = await Promise.all([
        fetch(BRANDS_ENDPOINT, { cache: "no-store", signal }),
        fetch(CATEGORIES_ENDPOINT, { cache: "no-store", signal }),
      ]);

      if (!brandsResponse.ok || !categoriesResponse.ok) {
        throw new Error("Catalog metadata could not be loaded.");
      }

      const [brandsPayload, categoriesPayload] = await Promise.all([
        brandsResponse.json() as Promise<unknown>,
        categoriesResponse.json() as Promise<unknown>,
      ]);

      setCatalogMeta({
        brandsById: buildCatalogMap(brandsPayload),
        categoriesById: buildCatalogMap(categoriesPayload),
      });
    } catch (error) {
      if (!signal?.aborted) {
        console.error("Catalog metadata could not be loaded.", error);
        setCatalogMeta(EMPTY_CATALOG_META);
      }
    }
  }, []);

  const loadProducts = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(ADMIN_PRODUCTS_ENDPOINT, {
        cache: "no-store",
        headers: adminAuthHeaders(),
        signal,
      });

      if (!response.ok) {
        throw new Error("Products could not be loaded.");
      }

      const payload = (await response.json()) as unknown;
      setProducts(normalizeAdminProducts(payload, catalogMeta));
    } catch (error) {
      if (!signal?.aborted) {
        console.error("Admin products could not be loaded.", error);
        setProducts([]);
      }
    }
  }, [catalogMeta]);

  useEffect(() => {
    const controller = new AbortController();

    void Promise.resolve().then(() => loadCatalogMeta(controller.signal));

    return () => {
      controller.abort();
    };
  }, [loadCatalogMeta]);

  useEffect(() => {
    const controller = new AbortController();

    void Promise.resolve().then(() => loadProducts(controller.signal));

    return () => {
      controller.abort();
    };
  }, [loadProducts]);

  const catalogValue = products.reduce(
    (sum, product) => sum + product.price * product.stock,
    0,
  );
  const visibleCount = products.filter(
    (product) => product.status !== "draft",
  ).length;
  const hiddenCount = products.filter(
    (product) => product.status === "draft",
  ).length;
  const visibleOutOfStockCount = products.filter(
    (product) =>
      product.status === "out_of_stock" && getVisibilityLabel(product.status) === "Visible",
  ).length;
  const lowOrOutCount = products.filter((product) =>
    ["low_stock", "out_of_stock"].includes(product.status ?? ""),
  ).length;
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesSearch =
          normalizedSearch === "" || getSearchableText(product).includes(normalizedSearch);
        return matchesSearch && getMatchesProductFilter(product, activeFilter);
      }),
    [activeFilter, normalizedSearch, products],
  );
  const selectedProduct = filteredProducts[0] ?? null;
  const hasActiveSearchOrFilter = normalizedSearch !== "" || activeFilter !== "All Products";
  const emptyProductMessage = hasActiveSearchOrFilter
    ? "No products match your search."
    : "No products found.";

  async function handleDeleteProduct(productId: string) {
    if (!window.confirm("Delete this product from the catalog?")) {
      return;
    }

    setDeletingProductIds((current) => Array.from(new Set([...current, productId])));
    setDeleteMessage("");

    try {
      const response = await fetch(DELETE_CATALOG_ITEM_ENDPOINT, {
        body: JSON.stringify({
          id: productId,
          type: "product",
        }),
        headers: adminAuthHeaders({
          "Content-Type": "application/json",
        }),
        method: "POST",
      });
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        success?: boolean;
      } | null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.message ?? "Product could not be deleted.");
      }

      setProducts((current) => current.filter((product) => product.id !== productId));
      setDeleteMessage(result.message ?? "Item deleted successfully");
    } catch (error) {
      setDeleteMessage(
        error instanceof Error ? error.message : "Product could not be deleted.",
      );
    } finally {
      setDeletingProductIds((current) => current.filter((id) => id !== productId));
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {deleteMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            {deleteMessage}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5E7F85]">
                Catalog
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                Products Control Room
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Manage product visibility, stock health, pricing, badges and
                quick catalog actions from one clean place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-stone-50"
                onClick={() => setShowCsvImport((current) => !current)}
                type="button"
              >
                Bulk Import
              </button>
              <button
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-stone-50"
                onClick={() => setShowPriceStockUpdate((current) => !current)}
                type="button"
              >
                Price & Stock
              </button>
              <button
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-stone-50"
                onClick={() => setShowBulkInventoryMode((current) => !current)}
                type="button"
              >
                Inventory Mode
              </button>
              <DisabledAction>Export</DisabledAction>
              <Link
                className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-950"
                href="/products/edit"
              >
                Add Product
              </Link>
            </div>
          </div>
          {showCsvImport ? (
            <ProductCsvImportPanel
              onClose={() => setShowCsvImport(false)}
              onImported={() => loadProducts()}
            />
          ) : null}
          {showPriceStockUpdate ? (
            <ProductPriceStockUpdatePanel
              onApplied={() => loadProducts()}
              onClose={() => setShowPriceStockUpdate(false)}
            />
          ) : null}
          {showBulkInventoryMode ? (
            <BulkInventoryModePanel
              onApplied={() => loadProducts()}
              onClose={() => setShowBulkInventoryMode(false)}
            />
          ) : null}
          <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-4">
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Stock value:{" "}
              <b className="text-[#5E7F85]">BDT {formatPrice(catalogValue)}</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Visible products:{" "}
              <b className="text-slate-900">{visibleCount}</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Hidden products: <b className="text-rose-700">{hiddenCount}</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Units sold: <b className="text-slate-900">Not tracked</b>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            helper="Current stock value"
            icon="BDT"
            label="Catalog Value"
            value={`BDT ${formatPrice(catalogValue)}`}
          />
          <AdminStatCard
            helper="Frontend visible"
            icon="VS"
            index={1}
            label="Visible SKUs"
            value={visibleCount}
          />
          <AdminStatCard
            active
            helper={`${lowOrOutCount} total stock alerts`}
            icon="OS"
            index={2}
            label="Visible OOS"
            value={visibleOutOfStockCount}
          />
          <AdminStatCard
            helper="Not on website"
            icon="HD"
            index={3}
            label="Hidden SKUs"
            value={hiddenCount}
          />
        </section>

        <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Product Management
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                    Product Master List
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledAction>Bulk Status</DisabledAction>
                  <button
                    className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white opacity-60"
                    disabled
                    type="button"
                  >
                    Quick Price
                  </button>
                </div>
              </div>
              <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(20rem,36rem)_1fr] xl:items-center">
                <div className="relative">
                  <input
                    className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-10 pr-20 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/20"
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search product / SKU / brand / category..."
                    type="search"
                    value={searchQuery}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    /
                  </span>
                  {searchQuery ? (
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-slate-900"
                      onClick={() => setSearchQuery("")}
                      type="button"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_FILTERS.map((item) => (
                    <button
                      className={`rounded-full px-4 py-2 text-xs font-semibold ${
                        item === activeFilter
                          ? "bg-[#5E7F85] text-white"
                          : "border border-slate-200 bg-white text-slate-600"
                      }`}
                      key={item}
                      onClick={() => setActiveFilter(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3 text-xs font-semibold text-slate-500">
                Showing {filteredProducts.length} of {products.length} products
              </div>
            </div>

            <div className="overflow-x-auto">
              <AdminTable className="min-w-[1080px]">
                <AdminTableHead>
                  <tr>
                    {[
                      "Product",
                      "SKU",
                      "Catalog",
                      "Price / Stock",
                      "Storefront",
                      "Status",
                      "Action",
                    ].map((head) => (
                      <th className="px-5 py-4 font-medium" key={head}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </AdminTableHead>
                <tbody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product, index) => (
                      <AdminTableRow
                        className={
                          index === 0
                            ? "bg-[#5E7F85]/[0.06] shadow-[inset_3px_0_0_#5E7F85]"
                            : product.status === "out_of_stock"
                              ? "bg-rose-50/25"
                              : product.status === "low_stock"
                                ? "bg-amber-50/25"
                                : undefined
                        }
                        key={product.id}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <ProductImage product={product} />
                            <div className="min-w-0">
                              <div className="max-w-[18rem] truncate font-bold text-slate-900">
                                {product.name}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {isVariantProduct(product)
                                  ? `${product.variantCount} variants`
                                  : `${product.featured ? "Featured" : "Standard"} item`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-slate-500">
                          {product.sku ?? "-"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-800">
                            {product.brands?.name ?? "-"}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {getCategoryLabel(product)}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">
                            {getPriceLabel(product)}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">
                            Physical {isVariantProduct(product) ? "variant stock" : "stock"} {product.stock}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <AdminBadge
                              tone={isVariantProduct(product) ? "brand" : "default"}
                            >
                              {isVariantProduct(product) ? "Variant" : "Single"}
                            </AdminBadge>
                            <AdminBadge
                              tone={
                                product.status === "draft" ? "bad" : "good"
                              }
                            >
                              {getVisibilityLabel(product.status)}
                            </AdminBadge>
                            <AdminBadge
                              tone={
                                product.status === "out_of_stock"
                                  ? "warn"
                                  : product.status === "draft"
                                    ? "bad"
                                    : "good"
                              }
                            >
                              {getStockRuleLabel(product.status)}
                            </AdminBadge>
                            <AdminBadge tone={product.inventoryMode === "on_demand" ? "warn" : "brand"}>
                              {product.inventoryMode === "on_demand" ? "On Demand" : "Stocked"}
                            </AdminBadge>
                            <AdminBadge tone={product.availabilityStatus === "unavailable" ? "bad" : "good"}>
                              {product.availabilityStatus === "unavailable" ? "Unavailable" : "Available"}
                            </AdminBadge>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <AdminBadge tone={getAdminStatusTone(product.status)}>
                            {formatStatus(product.status)}
                          </AdminBadge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-semibold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white"
                              href={`/products/edit?id=${product.id}`}
                            >
                              Edit
                            </Link>
                            <button
                              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={deletingProductIds.includes(product.id)}
                              onClick={() => handleDeleteProduct(product.id)}
                              type="button"
                            >
                              {deletingProductIds.includes(product.id)
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                            <StatusControl
                              compact
                              key={`${product.id}-${product.status}-row`}
                              onUpdated={loadProducts}
                              product={product}
                            />
                          </div>
                        </td>
                      </AdminTableRow>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="px-5 py-14 text-center text-sm text-slate-500"
                        colSpan={7}
                      >
                        {emptyProductMessage}
                      </td>
                    </tr>
                  )}
                </tbody>
              </AdminTable>
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              {selectedProduct ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-500">
                        Selected Product
                      </div>
                      <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                        {selectedProduct.name}
                      </h3>
                      <div className="mt-1 text-xs text-slate-500">
                        {selectedProduct.sku ?? "No SKU"}
                      </div>
                      <div className="mt-2">
                        <AdminBadge
                          tone={isVariantProduct(selectedProduct) ? "brand" : "default"}
                        >
                          {isVariantProduct(selectedProduct)
                            ? `${selectedProduct.variantCount} variants`
                            : "Single product"}
                        </AdminBadge>
                      </div>
                    </div>
                    <AdminBadge tone={getAdminStatusTone(selectedProduct.status)}>
                      {formatStatus(selectedProduct.status)}
                    </AdminBadge>
                  </div>
                  <div className="mt-5 rounded-3xl border border-slate-200 bg-stone-50 p-4">
                    {selectedProduct.image ? (
                      <Image
                        alt=""
                        className="h-52 w-full rounded-3xl border border-slate-200 bg-white object-cover"
                        height={208}
                        src={selectedProduct.image}
                        unoptimized
                        width={320}
                      />
                    ) : (
                      <div className="flex h-52 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-xs font-semibold text-slate-400">
                        Product Image Preview
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <AdminBadge
                        tone={selectedProduct.featured ? "brand" : "default"}
                      >
                        {selectedProduct.featured ? "Featured" : "Standard"}
                      </AdminBadge>
                      <AdminBadge
                        tone={
                          selectedProduct.status === "draft" ? "bad" : "good"
                        }
                      >
                        {getVisibilityLabel(selectedProduct.status)}
                      </AdminBadge>
                      <AdminBadge
                        tone={
                          selectedProduct.status === "out_of_stock"
                            ? "warn"
                            : selectedProduct.status === "draft"
                              ? "bad"
                              : "good"
                        }
                      >
                        {getStockRuleLabel(selectedProduct.status)}
                      </AdminBadge>
                      <AdminBadge tone="warn">
                        Physical {isVariantProduct(selectedProduct) ? "variant stock" : "stock"}{" "}
                        {selectedProduct.stock}
                      </AdminBadge>
                      <AdminBadge tone={selectedProduct.inventoryMode === "on_demand" ? "warn" : "brand"}>
                        {selectedProduct.inventoryMode === "on_demand" ? "On Demand" : "Stocked"}
                      </AdminBadge>
                      <AdminBadge tone={selectedProduct.availabilityStatus === "unavailable" ? "bad" : "good"}>
                        {selectedProduct.availabilityStatus === "unavailable" ? "Unavailable" : "Available"}
                      </AdminBadge>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3 text-sm">
                    <DetailRow
                      label="Product Type"
                      value={
                        isVariantProduct(selectedProduct)
                          ? `Variant (${selectedProduct.activeVariantCount} active)`
                          : "Single"
                      }
                    />
                    <DetailRow
                      label="Brand"
                      value={selectedProduct.brands?.name ?? "-"}
                    />
                    <DetailRow
                      label="Category"
                      value={getCategoryLabel(selectedProduct)}
                    />
                    <DetailRow
                      label="Website"
                      value={getVisibilityLabel(selectedProduct.status)}
                    />
                    <DetailRow
                      label="Stock Rule"
                      value={getStockRuleLabel(selectedProduct.status)}
                    />
                    <DetailRow
                      label="Inventory Mode"
                      value={selectedProduct.inventoryMode === "on_demand" ? "On Demand" : "Stocked"}
                    />
                    <DetailRow
                      label="Availability"
                      value={selectedProduct.availabilityStatus === "unavailable" ? "Unavailable" : "Available"}
                    />
                    <DetailRow
                      label="Minimum Order Qty"
                      value={String(selectedProduct.minimumOrderQuantity)}
                    />
                    <DetailRow
                      label="Physical Stock"
                      value={String(selectedProduct.stock)}
                    />
                    <DetailRow
                      label="Policy"
                      value={
                        selectedProduct.status === "draft"
                          ? "Hide from storefront"
                          : selectedProduct.status === "out_of_stock"
                            ? "Keep visible / notify"
                            : "Show normally"
                      }
                    />
                    <DetailRow
                      label="Attributes"
                      value={
                        hasAttributes(selectedProduct.attributes) ? "Yes" : "No"
                      }
                    />
                    <DetailRow
                      label="Selling Price"
                      value={getPriceLabel(selectedProduct)}
                    />
                  </div>
                  <div className="mt-5 grid gap-3">
                    <Link
                      className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-950"
                      href={`/products/edit?id=${selectedProduct.id}`}
                    >
                      Edit Product
                    </Link>
                    <StatusControl
                      key={`${selectedProduct.id}-${selectedProduct.status}-drawer`}
                      onUpdated={loadProducts}
                      product={selectedProduct}
                    />
                    <DraftArchiveButton onUpdated={loadProducts} product={selectedProduct} />
                    <button
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-500 opacity-60"
                      disabled
                      type="button"
                    >
                      Frontend Preview
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-stone-50 p-6 text-center text-sm font-medium text-slate-500">
                  {hasActiveSearchOrFilter
                    ? "No product is selected for the current filters."
                    : "Product details appear here after live products are added."}
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                Professional Visibility Rule
              </div>
              <div className="mt-2 text-sm leading-6 text-amber-700">
                Keep useful products visible when appropriate, but use Draft or
                Out of Stock for archive-safe control. No hard delete action is
                available on this page.
              </div>
            </section>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
