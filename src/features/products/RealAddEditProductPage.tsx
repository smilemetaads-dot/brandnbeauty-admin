"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import type { BrandRecord } from "@/features/catalog/brands-data";
import type { CategoryRecord } from "@/features/catalog/categories-data";
import type { ConcernRecord } from "@/features/catalog/concerns-data";
import { saveProduct } from "@/features/products/product-actions";
import type { ProductRecord } from "@/features/products/products-data";

type RealAddEditProductPageProps = {
  categories: CategoryRecord[];
  concerns: ConcernRecord[];
  brands: BrandRecord[];
  product: ProductRecord | null;
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const inputClassName =
  "mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#527B86] focus:ring-2 focus:ring-[#527B86]/15";

const labelClassName = "text-sm font-medium text-slate-600";

const attributesPlaceholder = `{
  "skin_type": "oily",
  "color": "gold",
  "material": "leather",
  "size": "medium"
}`;

const formatPrice = (price: number | null | undefined) =>
  new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(price ?? 0);

const formatStatus = (status: string | null | undefined) => {
  const labels: Record<string, string> = {
    active: "Active",
    draft: "Draft",
    low_stock: "Low Stock",
    out_of_stock: "Out of Stock",
  };

  return status ? (labels[status] ?? status) : "Draft";
};

const getStatusTone = (status: string | null | undefined): BadgeTone => {
  if (status === "active") {
    return "good";
  }

  if (status === "low_stock") {
    return "warn";
  }

  return "bad";
};

function formatAttributes(attributes: ProductRecord["attributes"]) {
  if (!attributes || Object.keys(attributes).length === 0) {
    return "";
  }

  return JSON.stringify(attributes, null, 2);
}

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const className = {
    brand: "bg-[#527B86]/10 text-[#527B86]",
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
  label,
  value,
  helper,
  active = false,
}: {
  label: string;
  value: string;
  helper: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border bg-white p-5 shadow-sm ${
        active ? "border-[#527B86] ring-2 ring-[#527B86]/15" : "border-slate-200"
      }`}
    >
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </div>
      <div className="mt-3 inline-flex rounded-full bg-stone-50 px-3 py-1 text-xs font-semibold text-slate-600">
        {helper}
      </div>
    </div>
  );
}

function DisabledAction({ children }: { children: ReactNode }) {
  return (
    <button
      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-400"
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

export function RealAddEditProductPage({
  categories,
  concerns,
  brands,
  product,
}: RealAddEditProductPageProps) {
  const [state, formAction, isPending] = useActionState(saveProduct, {
    ok: false,
    message: "",
  });
  const isEditing = Boolean(product);
  const selectedConcernCount = product?.concernIds.length ?? 0;
  const hasAttributes = Boolean(
    product?.attributes && Object.keys(product.attributes).length > 0,
  );
  const productTitle = product?.name || "New Product Draft";
  const stockValue = (product?.price ?? 0) * (product?.stock ?? 0);
  const readinessItems = [
    Boolean(product?.name),
    Boolean(product?.slug),
    Boolean(product?.price),
    Boolean(product?.stock),
    Boolean(product?.image),
    Boolean(product?.short_description),
    selectedConcernCount > 0,
    hasAttributes,
  ];
  const readinessScore = Math.round(
    (readinessItems.filter(Boolean).length / readinessItems.length) * 100,
  );

  return (
    <AdminShell>
      <form action={formAction} className="space-y-6">
        {product ? <input name="id" type="hidden" value={product.id} /> : null}

        <section className="sticky top-3 z-20 rounded-[1.6rem] border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#527B86]">
                Product Editor
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-600">
                {productTitle} / {product?.sku || "SKU pending"}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone={state.message ? (state.ok ? "good" : "bad") : "default"}>
                  {state.message || "Unsaved changes"}
                </Badge>
                <Badge tone={getStatusTone(product?.status)}>
                  {formatStatus(product?.status)}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                href="/products"
              >
                Back to Products
              </Link>
              <DisabledAction>Preview Not Connected</DisabledAction>
              <button
                className="rounded-2xl bg-[#527B86] px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={isPending}
                type="submit"
              >
                {isPending
                  ? "Saving..."
                  : isEditing
                    ? "Update Product"
                    : "Save Product"}
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Live options"
            label="Brands"
            value={String(brands.length)}
          />
          <StatCard
            helper="Live options"
            label="Categories"
            value={String(categories.length)}
          />
          <StatCard
            helper="Multi-select mapping"
            label="Concerns"
            value={String(concerns.length)}
          />
          <StatCard
            active
            helper="Current draft completeness"
            label="Editor Readiness"
            value={`${readinessScore}%`}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-xl font-bold tracking-tight text-slate-950">
                  Product Master Form
                </h1>
                <Badge tone="brand">{isEditing ? "Edit Mode" : "Create Mode"}</Badge>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className={labelClassName}>
                  Product Name
                  <input
                    className={inputClassName}
                    defaultValue={product?.name ?? ""}
                    name="name"
                    placeholder="Product Name"
                    required
                    type="text"
                  />
                </label>

                <label className={labelClassName}>
                  Slug
                  <input
                    className={inputClassName}
                    defaultValue={product?.slug ?? ""}
                    name="slug"
                    placeholder="product-slug"
                    required
                    type="text"
                  />
                </label>

                <label className={labelClassName}>
                  SKU
                  <input
                    className={inputClassName}
                    defaultValue={product?.sku ?? ""}
                    name="sku"
                    placeholder="SKU"
                    type="text"
                  />
                </label>

                <label className={labelClassName}>
                  Status
                  <select
                    className={inputClassName}
                    defaultValue={product?.status ?? "draft"}
                    name="status"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">
                    Pricing & Inventory
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Single-product pricing remains connected to the live
                    Supabase product record.
                  </p>
                </div>
                <Badge tone="brand">Single Product</Badge>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <label className={labelClassName}>
                  Price
                  <input
                    className={inputClassName}
                    defaultValue={product?.price ?? ""}
                    min="0"
                    name="price"
                    placeholder="0"
                    required
                    step="0.01"
                    type="number"
                  />
                </label>

                <label className={labelClassName}>
                  Old price
                  <input
                    className={inputClassName}
                    defaultValue={product?.old_price ?? ""}
                    min="0"
                    name="oldPrice"
                    placeholder="0"
                    step="0.01"
                    type="number"
                  />
                </label>

                <label className={labelClassName}>
                  Stock
                  <input
                    className={inputClassName}
                    defaultValue={product?.stock ?? ""}
                    min="0"
                    name="stock"
                    placeholder="0"
                    required
                    step="1"
                    type="number"
                  />
                </label>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-stone-50 p-4">
                  <div className="text-xs font-semibold text-slate-500">
                    Current Price
                  </div>
                  <div className="mt-1 text-lg font-bold text-slate-950">
                    BDT {formatPrice(product?.price)}
                  </div>
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  <div className="text-xs font-semibold text-slate-500">
                    Current Stock
                  </div>
                  <div className="mt-1 text-lg font-bold text-slate-950">
                    {product?.stock ?? 0}
                  </div>
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  <div className="text-xs font-semibold text-slate-500">
                    Stock Value
                  </div>
                  <div className="mt-1 text-lg font-bold text-slate-950">
                    BDT {formatPrice(stockValue)}
                  </div>
                </div>
              </div>
              <div className="mt-5 rounded-2xl border border-slate-200 bg-stone-50 p-4 text-sm font-medium leading-6 text-slate-600">
                Variant product rows, courier cost, profit automation, and bulk
                variant import are source-design placeholders only and are not
                connected in this schema phase.
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  Catalog Mapping
                </h2>
                <Badge tone="brand">Live Options</Badge>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className={labelClassName}>
                  Brand
                  <select
                    className={inputClassName}
                    defaultValue={product?.brand_id ?? ""}
                    name="brandId"
                  >
                    <option value="">Select brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={labelClassName}>
                  Category
                  <select
                    className={inputClassName}
                    defaultValue={product?.category_id ?? ""}
                    name="categoryId"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <fieldset className="mt-5">
                <legend className={labelClassName}>Concerns</legend>
                <div className="mt-2 grid gap-2 rounded-[1.5rem] border border-slate-200 bg-stone-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {concerns.length > 0 ? (
                    concerns.map((concern) => (
                      <label
                        className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-medium text-slate-700"
                        key={concern.id}
                      >
                        <input
                          className="h-4 w-4 rounded border-slate-300 text-[#527B86]"
                          defaultChecked={
                            product?.concernIds.includes(concern.id) ?? false
                          }
                          name="concernIds"
                          type="checkbox"
                          value={concern.id}
                        />
                        {concern.name}
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No concerns available.
                    </p>
                  )}
                </div>
              </fieldset>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">
                    Content & Media
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    The image URL and short description are live fields. Gallery,
                    uploads, AI content, FAQ, reviews, and PDP blocks are parked
                    as Not Connected.
                  </p>
                </div>
                <Badge tone="warn">Media Placeholder</Badge>
              </div>
              <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_320px]">
                <div className="space-y-5">
                  <label className={labelClassName}>
                    Image URL
                    <input
                      className={inputClassName}
                      defaultValue={product?.image ?? ""}
                      name="image"
                      placeholder="Image URL"
                      type="text"
                    />
                  </label>

                  <label className={labelClassName}>
                    Short description
                    <textarea
                      className={`${inputClassName} min-h-28 resize-y`}
                      defaultValue={product?.short_description ?? ""}
                      name="shortDescription"
                      placeholder="Short product description"
                    />
                  </label>
                </div>

                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-stone-50 p-5">
                  <div className="flex aspect-square items-center justify-center rounded-[1.25rem] bg-white text-xs font-bold text-slate-400">
                    Main Image Preview
                  </div>
                  <div className="mt-4 grid gap-2">
                    <DisabledAction>Upload Not Connected</DisabledAction>
                    <DisabledAction>Gallery Not Connected</DisabledAction>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  Attributes JSON
                </h2>
                <Badge tone={hasAttributes ? "good" : "default"}>
                  Flexible Metadata
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use this live JSON field for future-ready product details such
                as skin type, color, material, size, routine step, and other
                lifestyle metadata.
              </p>
              <textarea
                className={`${inputClassName} min-h-48 resize-y font-mono text-xs leading-5`}
                defaultValue={formatAttributes(product?.attributes ?? null)}
                name="attributesJson"
                placeholder={attributesPlaceholder}
              />
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  Live Product Preview
                </h2>
                <Badge tone="brand">PDP</Badge>
              </div>
              <div className="mt-5 rounded-3xl border border-slate-200 p-4">
                <div className="flex h-56 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-stone-50 text-xs font-bold text-slate-400">
                  {product?.image ? "Image URL Saved" : "Main Product Image"}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone={product?.featured ? "brand" : "default"}>
                    {product?.featured ? "Featured" : "Standard"}
                  </Badge>
                  <Badge tone={getStatusTone(product?.status)}>
                    {formatStatus(product?.status)}
                  </Badge>
                  <Badge tone={hasAttributes ? "good" : "default"}>
                    Attributes {hasAttributes ? "yes" : "no"}
                  </Badge>
                </div>
                <div className="mt-3 text-lg font-bold leading-snug text-slate-950">
                  {productTitle}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  SKU {product?.sku || "pending"}
                </div>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-2xl font-bold text-slate-950">
                    BDT {formatPrice(product?.price)}
                  </span>
                  {product?.old_price ? (
                    <span className="pb-1 text-sm text-slate-400 line-through">
                      BDT {formatPrice(product.old_price)}
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-slate-600">
                    {brands.find((brand) => brand.id === product?.brand_id)
                      ?.name ?? "Brand pending"}
                  </span>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-slate-600">
                    {categories.find(
                      (category) => category.id === product?.category_id,
                    )?.name ?? "Category pending"}
                  </span>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-slate-600">
                    Stock {product?.stock ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-950">
                  Publish Control
                </h2>
                <Badge tone={readinessScore >= 70 ? "good" : "warn"}>
                  {readinessScore >= 70 ? "Ready" : "Needs Review"}
                </Badge>
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <div className="rounded-2xl bg-stone-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span>Status Mapping</span>
                    <b className="text-[#527B86]">
                      {formatStatus(product?.status)}
                    </b>
                  </div>
                  <div className="mt-2 text-xs leading-5 text-slate-500">
                    Source Published maps to Active. Hidden maps to Draft.
                    Low Stock and Out of Stock use the live status values.
                  </div>
                </div>
                <label className="flex items-center justify-between rounded-2xl bg-stone-50 p-4">
                  <span>Featured</span>
                  <input
                    className="h-4 w-4 rounded border-slate-300 text-[#527B86]"
                    defaultChecked={product?.featured ?? false}
                    name="featured"
                    type="checkbox"
                  />
                </label>
                {[
                  "AI Content Studio",
                  "Variant Rows",
                  "PDP Blocks",
                  "FAQ / Reviews",
                  "Trust Badges",
                ].map((item) => (
                  <div
                    className="flex items-center justify-between rounded-2xl bg-stone-50 p-4"
                    key={item}
                  >
                    <span>{item}</span>
                    <Badge tone="default">Not Connected</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-3">
                <button
                  className="w-full rounded-2xl bg-[#527B86] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={isPending}
                  type="submit"
                >
                  {isPending
                    ? "Saving..."
                    : isEditing
                      ? "Update Product"
                      : "Save Product"}
                </button>
                <DisabledAction>Publish Modal Not Connected</DisabledAction>
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
              <h2 className="text-xl font-bold text-amber-900">
                Smart Checks
              </h2>
              <div className="mt-4 space-y-3 text-sm text-amber-900">
                {[
                  ["Product name", Boolean(product?.name)],
                  ["Slug", Boolean(product?.slug)],
                  ["Price", Boolean(product?.price)],
                  ["Stock", Boolean(product?.stock)],
                  ["Concerns", selectedConcernCount > 0],
                  ["Attributes JSON", hasAttributes],
                ].map(([label, ok]) => (
                  <div
                    className={`rounded-2xl p-4 ${
                      ok
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-white/70 text-amber-900"
                    }`}
                    key={String(label)}
                  >
                    {ok ? "Ready" : "Review"} {label}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </form>
    </AdminShell>
  );
}
