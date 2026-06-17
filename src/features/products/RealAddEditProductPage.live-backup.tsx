"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useActionState } from "react";

import { AdminBadge } from "@/components/admin/AdminUiPrimitives";
import { AdminShell } from "@/components/admin/AdminShell";

import type { BrandRecord } from "@/features/catalog/brands-data";
import type { CategoryRecord } from "@/features/catalog/categories-data";
import type { ConcernRecord } from "@/features/catalog/concerns-data";
import { saveProduct } from "@/features/products/product-actions";
import type { ProductRecord } from "@/features/products/products-data";

type RealAddEditProductPageProps = {
  brands: BrandRecord[];
  categories: CategoryRecord[];
  concerns: ConcernRecord[];
  product: ProductRecord | null;
};

const inputClassName =
  "mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/15 disabled:bg-stone-50 disabled:text-slate-400";

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

const formatAttributes = (attributes: ProductRecord["attributes"]) =>
  attributes && Object.keys(attributes).length > 0
    ? JSON.stringify(attributes, null, 2)
    : "";

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "good" | "warn" | "bad" | "brand";
}) {
  return <AdminBadge tone={tone}>{children}</AdminBadge>;
}

function DisabledAction({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      className={`rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-500 opacity-60 shadow-sm ${className}`}
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function DisabledPrimaryAction({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      className={`rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white opacity-60 shadow-sm ${className}`}
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function SectionCard({
  badge,
  children,
  title,
  tone = "brand",
}: {
  badge?: ReactNode;
  children: ReactNode;
  title: ReactNode;
  tone?: "default" | "good" | "warn" | "bad" | "brand";
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        {badge ? <Badge tone={tone}>{badge}</Badge> : null}
      </div>
      {children}
    </section>
  );
}

function VisualInput({
  label,
  placeholder,
  rows,
}: {
  label: string;
  placeholder: string;
  rows?: number;
}) {
  return (
    <label className={labelClassName}>
      {label}
      {rows ? (
        <textarea
          className={`${inputClassName} min-h-20 resize-none`}
          disabled
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <input
          className={inputClassName}
          disabled
          placeholder={placeholder}
          type="text"
        />
      )}
    </label>
  );
}

function StatCard({
  active = false,
  helper,
  index = 0,
  label,
  value,
}: {
  active?: boolean;
  helper: ReactNode;
  index?: number;
  label: ReactNode;
  value: ReactNode;
}) {
  const icons = ["SEO", "BDT", "IMG", "%"];
  const helperText = String(helper).toLowerCase();
  const trendTone =
    helperText.includes("review") ||
    helperText.includes("not connected") ||
    helperText.includes("missing")
      ? "text-amber-600 bg-amber-50"
      : "text-emerald-700 bg-emerald-50";

  return (
    <button
      className={`group relative w-full overflow-hidden rounded-[1.7rem] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active
          ? "border-[#5E7F85] ring-2 ring-[#5E7F85]/15"
          : "border-slate-200"
      }`}
      disabled
      type="button"
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5E7F85]/5 transition group-hover:bg-[#5E7F85]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xs font-bold text-[#5E7F85]">
          {icons[index % icons.length]}
        </div>
      </div>
      <div
        className={`relative mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${trendTone}`}
      >
        {helper}
      </div>
    </button>
  );
}

function MiniMetric({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="rounded-2xl bg-stone-50 p-4">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-bold text-slate-900">{value}</div>
    </div>
  );
}

function CheckRow({ label, ok }: { label: ReactNode; ok: boolean }) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
      }`}
    >
      {ok ? "Ready" : "Review"} {label}
    </div>
  );
}

function InfoRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <span className="text-right text-slate-500">{value}</span>
    </div>
  );
}

function StorefrontTogglePreview({
  active = false,
  label,
}: {
  active?: boolean;
  label: string;
}) {
  return (
    <button
      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold ${
        active ? "bg-[#5E7F85]/10 text-[#5E7F85]" : "bg-stone-50 text-slate-600"
      }`}
      disabled
      type="button"
    >
      <span>{label}</span>
      <span>{active ? "ON" : "OFF"}</span>
    </button>
  );
}

export function RealAddEditProductPage({
  brands,
  categories,
  concerns,
  product,
}: RealAddEditProductPageProps) {
  const [state, formAction, isPending] = useActionState(saveProduct, {
    ok: false,
    message: "",
  });

  const productTitle = product?.name || "New Product Draft";
  const hasImage = Boolean(product?.image);
  const hasAttributes = Boolean(
    product?.attributes && Object.keys(product.attributes).length > 0,
  );
  const selectedConcernCount = product?.concernIds.length ?? 0;
  const seoScoreItems = [
    Boolean(product?.name),
    Boolean(product?.slug),
    Boolean(product?.short_description),
    hasImage,
  ];
  const seoScore = Math.round(
    (seoScoreItems.filter(Boolean).length / seoScoreItems.length) * 100,
  );
  const discount =
    product?.old_price && product.old_price > product.price
      ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
      : 0;
  const stockValue = (product?.price ?? 0) * (product?.stock ?? 0);
  const stockReady = (product?.stock ?? 0) > 0;
  const brandName =
    brands.find((brand) => brand.id === product?.brand_id)?.name ??
    product?.brands?.name ??
    "Brand pending";
  const statusValue = product?.status ?? "draft";
  const statusReady = stockReady || statusValue !== "active";
  const smartChecks = [
    ["Product name", Boolean(product?.name)],
    ["Slug", Boolean(product?.slug)],
    ["Sale price", Boolean(product?.price)],
    ["Stock or variant stock", statusReady],
    ["Main image", hasImage],
    ["Short description", Boolean(product?.short_description)],
    ["Attributes JSON", hasAttributes],
  ] as const;

  return (
    <AdminShell>
      <form action={formAction} className="space-y-6">
        {product ? <input name="id" type="hidden" value={product.id} /> : null}

        <section className="sticky top-3 z-20 rounded-[1.6rem] border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#5E7F85]">
                Product Editor
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-600">
                {productTitle} <span className="text-slate-300">&bull;</span>{" "}
                {product?.sku || "SKU/1001"}
              </div>
              <div className="mt-2 inline-flex">
                <Badge
                  tone={
                    state.message ? (state.ok ? "good" : "bad") : "default"
                  }
                >
                  {state.message || "Unsaved changes"}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#5E7F85]/40 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Saving..." : "Save Draft"}
              </button>
              <DisabledAction>Preview</DisabledAction>
              <button
                className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Saving..." : "Publish"}
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper={seoScore >= 75 ? "Looks ready" : "Review"}
            index={0}
            label="SEO Score"
            value={seoScore > 0 ? `${seoScore}/100` : "Review"}
          />
          <StatCard
            helper="Not connected"
            index={1}
            label="Net Profit"
            value="Not connected"
          />
          <StatCard
            active={hasImage}
            helper={hasImage ? "Main image ready" : "Review"}
            index={2}
            label="Images"
            value={hasImage ? "1 Ready" : "Review"}
          />
          <StatCard
            helper="Not connected"
            index={3}
            label="Margin"
            value="Not connected"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <SectionCard badge="Ultra Build" title="Product Master Form">
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
                  Slug (auto)
                  <input
                    className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
                    defaultValue={product?.slug ?? ""}
                    name="slug"
                    placeholder="auto-generated-slug"
                    required
                    type="text"
                  />
                </label>
                <label className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-slate-600">
                      Parent SKU
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                      AUTO GENERATED
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      className="w-full rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 pr-28 text-sm font-bold text-emerald-800 outline-none"
                      defaultValue={product?.sku ?? ""}
                      name="sku"
                      placeholder="1001"
                      type="text"
                    />
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#5E7F85] opacity-60 shadow-sm"
                      disabled
                      type="button"
                    >
                      Regenerate
                    </button>
                  </div>
                </label>
                <label className="space-y-2">
                  <div className="text-sm font-medium text-slate-600">
                    Barcode (optional)
                  </div>
                  <input
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none disabled:bg-stone-50 disabled:text-slate-400"
                    disabled
                    placeholder="Barcode (optional)"
                    type="text"
                  />
                </label>
                <label className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-slate-600">
                      Brand
                    </div>
                    <button
                      className="text-xs font-bold text-[#5E7F85] opacity-60"
                      disabled
                      type="button"
                    >
                      + Add Brand
                    </button>
                  </div>
                  <select
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
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
                <label className="space-y-2">
                  <div className="text-sm font-medium text-slate-600">
                    Category
                  </div>
                  <select
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
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
                <label className="space-y-2">
                  <div className="text-sm font-medium text-slate-600">
                    Subcategory
                  </div>
                  <select
                    className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
                    disabled
                  >
                    <option>Face Wash</option>
                  </select>
                </label>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-600">
                    Concern
                  </div>
                  <div className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                    {selectedConcernCount > 0
                      ? (concerns.find((concern) =>
                          product?.concernIds.includes(concern.id),
                        )?.name ?? `${selectedConcernCount} selected`)
                      : "Acne"}
                  </div>
                </div>
              </div>

              <details className="mt-2 text-xs text-slate-400">
                <summary className="inline-flex cursor-pointer rounded-full px-1 py-1 font-semibold text-slate-400">
                  Advanced concern mapping
                </summary>
                <fieldset className="mt-3">
                  <legend className="sr-only">Concern mapping</legend>
                  <div className="grid gap-2 rounded-2xl border border-slate-100 bg-stone-50 p-3 sm:grid-cols-2 xl:grid-cols-4">
                    {concerns.length > 0 ? (
                      concerns.map((concern) => (
                        <label
                          className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600"
                          key={concern.id}
                        >
                          <input
                            className="h-4 w-4 rounded border-slate-300 text-[#5E7F85]"
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
              </details>
            </SectionCard>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Pricing & Inventory
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="rounded-2xl border border-slate-200 bg-stone-50 p-1">
                    <button
                      aria-pressed="true"
                      className="rounded-xl bg-[#5E7F85] px-4 py-2.5 text-xs font-bold text-white shadow-sm"
                      type="button"
                    >
                      Single Product
                    </button>
                    <button
                      aria-label="Variant product not connected yet"
                      className="cursor-not-allowed rounded-xl px-4 py-2.5 text-xs font-bold text-slate-400 opacity-50"
                      disabled
                      title="Variant product not connected yet"
                      type="button"
                    >
                      Variant Product
                    </button>
                  </div>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-bold text-slate-400">
                    Variant not connected
                  </span>
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <VisualInput label="Cost Price" placeholder="420" />
                <label className={labelClassName}>
                  Regular Price
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
                  Sale Price
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
                  Stock Qty
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
                <VisualInput label="Low Stock Alert" placeholder="6" />
                <VisualInput label="Weight (gm/ml)" placeholder="100" />
                <VisualInput label="Avg Courier Cost" placeholder="80" />
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <MiniMetric label="Stock" value={product?.stock ?? 0} />
                <MiniMetric
                  label="Default Sale"
                  value={`BDT ${formatPrice(product?.price)}`}
                />
                <MiniMetric
                  label="Stock Value"
                  value={`BDT ${formatPrice(stockValue)}`}
                />
                <MiniMetric label="Net Profit" value="Not tracked" />
                <MiniMetric
                  label="Discount"
                  value={discount > 0 ? `${discount}%` : "Review"}
                />
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Content & Media
                  </h2>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-stone-50 px-4 py-3">
                  <div className="h-2.5 w-28 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-[#5E7F85]"
                      style={{ width: `${seoScore}%` }}
                    />
                  </div>
                  <b className="text-sm text-[#5E7F85]">{seoScore}%</b>
                </div>
              </div>

              <div className="mt-5 rounded-[1.7rem] border border-[#5E7F85]/15 bg-gradient-to-br from-[#5E7F85]/10 via-white to-stone-50 p-5 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">
                        AI Content Studio
                      </h3>
                      <Badge tone="brand">Not Connected</Badge>
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      Generate product content, SEO, FAQ, routine copy and visible
                      result text from product master data. Human review required
                      before publish.
                    </p>
                  </div>
                  <DisabledPrimaryAction>Generate All Content</DisabledPrimaryAction>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <label className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      Generation Mode
                    </div>
                    <select
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 outline-none disabled:bg-white"
                      disabled
                    >
                      <option>Conversion + SEO</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      Language Style
                    </div>
                    <select
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 outline-none disabled:bg-white"
                      disabled
                    >
                      <option>English + Bangla Friendly</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      Target Customer
                    </div>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 outline-none disabled:bg-white"
                      disabled
                      placeholder="Bangladesh skincare buyer"
                      type="text"
                    />
                  </label>
                </div>
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_340px]">
                <div
                  className={`overflow-hidden rounded-[1.7rem] border bg-white shadow-sm ${
                    hasImage
                      ? "border-emerald-200 ring-2 ring-emerald-100"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        Main Image
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Large square product preview for storefront and PDP hero.
                      </div>
                    </div>
                    <Badge tone={hasImage ? "good" : "warn"}>
                      {hasImage ? "Ready" : "Missing"}
                    </Badge>
                  </div>
                  <div className="p-5">
                    <div className="relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-slate-300 bg-stone-50 text-center transition">
                      <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-600 shadow-sm">
                        1:1 Preview
                      </div>
                      {product?.image ? (
                        <Image
                          alt={productTitle}
                          className="h-full w-full object-cover"
                          height={640}
                          src={product.image}
                          unoptimized
                          width={640}
                        />
                      ) : (
                        <>
                          <div className="flex h-20 w-20 items-center justify-center rounded-[1.4rem] bg-white text-xs font-black text-[#5E7F85] shadow-sm">
                            IMG
                          </div>
                          <div className="mt-5 text-base font-bold text-slate-900">
                            Drop main product image here
                          </div>
                          <div className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                            Use a clean square image with visible product label.
                            Recommended 1200 x 1200 px.
                          </div>
                          <DisabledPrimaryAction className="mt-5">
                            Upload
                          </DisabledPrimaryAction>
                        </>
                      )}
                    </div>
                    <label className={`${labelClassName} mt-4 block`}>
                      Main Image URL
                      <input
                        className={inputClassName}
                        defaultValue={product?.image ?? ""}
                        name="image"
                        placeholder="Image URL"
                        type="text"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm font-bold text-slate-900">
                    Live PDP Preview
                  </div>
                  <div className="mt-4 rounded-3xl bg-stone-50 p-4">
                    {product?.image ? (
                      <Image
                        alt={productTitle}
                        className="h-44 w-full rounded-3xl bg-white object-cover"
                        height={176}
                        src={product.image}
                        unoptimized
                        width={320}
                      />
                    ) : (
                      <div className="flex h-44 items-center justify-center rounded-3xl bg-white text-xs font-bold text-slate-400">
                        Product Image
                      </div>
                    )}
                    <div className="mt-4 text-lg font-black text-slate-900">
                      {productTitle}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-[#5E7F85]">
                      {brandName}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-xl font-black text-slate-900">
                        BDT {formatPrice(product?.price)}
                      </span>
                      {product?.old_price ? (
                        <span className="text-sm text-slate-400 line-through">
                          BDT {formatPrice(product.old_price)}
                        </span>
                      ) : null}
                      {discount > 0 ? (
                        <Badge tone="warn">{discount}% OFF</Badge>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        "100% Authentic",
                        "Verified Seller",
                        "COD Available",
                        "Fast Delivery",
                      ].map((item) => (
                        <Badge key={item} tone="brand">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      Gallery Images
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Equal square cards with drag, replace and remove controls.
                    </div>
                  </div>
                  <button
                    className="rounded-2xl bg-[#5E7F85]/10 px-4 py-2.5 text-xs font-bold text-[#5E7F85] opacity-60"
                    disabled
                    type="button"
                  >
                    + Add Gallery Image
                  </button>
                </div>
                <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
                  {["Angle 1", "Texture", "Box", "Routine"].map((item, index) => (
                    <div
                      className="rounded-[1.25rem] border bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-md"
                      key={item}
                    >
                      <div className="flex aspect-square items-center justify-center rounded-2xl bg-stone-50 text-xs font-bold text-slate-400">
                        {item}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">
                          Image {index + 1}
                        </span>
                        <button
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 opacity-60"
                          disabled
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <div className="text-sm font-medium text-slate-600">
                    Short Description
                  </div>
                  <textarea
                    className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                    defaultValue={product?.short_description ?? ""}
                    name="shortDescription"
                  />
                </label>
                <label className="space-y-2">
                  <div className="text-sm font-medium text-slate-600">
                    How To Use
                  </div>
                  <textarea
                    className="h-24 w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm text-slate-400 outline-none"
                    disabled
                    placeholder="Not connected"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <div className="text-sm font-medium text-slate-600">
                    Full Description
                  </div>
                  <textarea
                    className="h-32 w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm text-slate-400 outline-none"
                    disabled
                    placeholder="Not connected"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <div className="text-sm font-medium text-slate-600">
                    Ingredients
                  </div>
                  <textarea
                    className="h-24 w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm text-slate-400 outline-none"
                    disabled
                    placeholder="Not connected"
                  />
                </label>
                <details className="md:col-span-2 text-xs text-slate-400">
                  <summary className="inline-flex cursor-pointer rounded-full px-1 py-1 font-semibold text-slate-400">
                    Live attributes JSON
                  </summary>
                  <label className={`${labelClassName} mt-3 block`}>
                    Attributes JSON
                    <textarea
                      className={`${inputClassName} min-h-44 resize-y font-mono text-xs leading-5`}
                      defaultValue={formatAttributes(product?.attributes ?? null)}
                      name="attributesJson"
                      placeholder={attributesPlaceholder}
                    />
                  </label>
                </details>
              </div>
            </section>

            <SectionCard badge="Search Ready" title="SEO & PDP Controls">
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <VisualInput
                  label="SEO Title"
                  placeholder={`${productTitle} | BrandnBeauty`}
                />
                <VisualInput
                  label="Focus Keyword"
                  placeholder="product keyword bangladesh"
                />
                <VisualInput
                  label="Meta Description"
                  placeholder="Write product meta description"
                  rows={4}
                />
                <VisualInput label="Visible Result Title" placeholder="Visible Results" />
                <VisualInput label="Routine Step" placeholder="Not connected" />
                <VisualInput
                  label="Visible Result Bullets"
                  placeholder="One result per line"
                  rows={4}
                />
              </div>
            </SectionCard>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <SectionCard
              badge={smartChecks.some(([, ok]) => !ok) ? "Needs work" : "Ready"}
              title="Smart Checks"
              tone={smartChecks.some(([, ok]) => !ok) ? "warn" : "good"}
            >
              <div className="mt-5 space-y-3">
                {smartChecks.map(([label, ok]) => (
                  <CheckRow key={label} label={label} ok={ok} />
                ))}
              </div>
            </SectionCard>

            <SectionCard
              badge={statusReady ? "Ready" : "Review"}
              title="Storefront Controls"
              tone={statusReady ? "good" : "warn"}
            >
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-stone-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-700">
                      Status
                    </span>
                    <select
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none"
                      defaultValue={statusValue}
                      name="status"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="low_stock">Low Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                    </select>
                  </div>
                  <div className="mt-2 text-xs leading-5 text-slate-500">
                    Draft, active, low stock, and out of stock remain mapped to
                    the existing supported status field.
                  </div>
                </div>
                <StorefrontTogglePreview active label="Track Stock" />
                <label className="flex items-center justify-between rounded-2xl bg-[#5E7F85]/10 p-4 text-sm font-semibold text-[#5E7F85]">
                  <span>Featured</span>
                  <input
                    className="h-4 w-4 rounded border-slate-300 text-[#5E7F85]"
                    defaultChecked={product?.featured ?? false}
                    name="featured"
                    type="checkbox"
                  />
                </label>
                <StorefrontTogglePreview label="Free Delivery" />
                <StorefrontTogglePreview active label="Website Visible" />
                <StorefrontTogglePreview active label="Messenger Order" />
                <InfoRow
                  label="Stock Rule"
                  value={statusValue === "out_of_stock" ? "Notify Me" : "Sellable"}
                />
                <InfoRow label="Out of Stock Behavior" value="Preview-only" />
              </div>
              <div className="mt-5 grid gap-3">
                <DisabledAction className="w-full">Save Draft</DisabledAction>
                <DisabledAction className="w-full">Preview Product</DisabledAction>
                <button
                  className="w-full rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={isPending}
                  type="submit"
                >
                  {isPending ? "Saving..." : "Publish"}
                </button>
              </div>
            </SectionCard>

            <SectionCard badge="FAQ" title="Product FAQs">
              <div className="mt-5 space-y-3">
                {[
                  "Is this product suitable for daily use?",
                  "Can sensitive skin use this product?",
                ].map((question, index) => (
                  <div
                    className="rounded-2xl bg-stone-50 p-4"
                    key={question}
                  >
                    <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      FAQ {index + 1}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-700">
                      {question}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-500">
                      Preview-only until FAQ schema and save support exist.
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </aside>
        </section>
      </form>
    </AdminShell>
  );
}
