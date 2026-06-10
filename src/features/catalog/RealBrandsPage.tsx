"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { saveBrand } from "@/features/catalog/brand-actions";

import type { BrandRecord } from "./brands-data";

type RealBrandsPageProps = {
  brands: BrandRecord[];
  editBrandId?: string;
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

type BrandPreview = {
  banner: string;
  id: string;
  logo: string;
  origin: string;
  products: string;
  type: string;
};

const inputClassName =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/15";

const labelClassName = "text-sm font-semibold text-slate-700";

const brandPreviews: Record<string, BrandPreview> = {
  cosrx: {
    banner: "Ready",
    id: "cosrx",
    logo: "Ready",
    origin: "South Korea",
    products: "Preview",
    type: "Official",
  },
  "some-by-mi": {
    banner: "Needs Banner",
    id: "some-by-mi",
    logo: "Ready",
    origin: "South Korea",
    products: "Preview",
    type: "Imported",
  },
  "the-derma-plus": {
    banner: "Ready",
    id: "the-derma-plus",
    logo: "Ready",
    origin: "Bangladesh",
    products: "Preview",
    type: "Owned",
  },
  "beauty-of-joseon": {
    banner: "Draft",
    id: "beauty-of-joseon",
    logo: "Missing",
    origin: "South Korea",
    products: "Preview",
    type: "Imported",
  },
  simple: {
    banner: "Missing",
    id: "simple",
    logo: "Needs Logo",
    origin: "UK",
    products: "Preview",
    type: "Imported",
  },
};

const topProductsMap: Record<string, string[]> = {
  cosrx: [
    "Low pH Good Morning Gel Cleanser",
    "Advanced Snail Mucin",
    "BHA Blackhead Power Liquid",
    "Aloe Soothing Sun Cream",
  ],
  "some-by-mi": ["AHA BHA PHA Toner", "Acne Clear Foam", "Miracle Serum"],
  "the-derma-plus": ["Kojic Body Wash", "Glutathione Body Wash", "Vitamin C Serum"],
  "beauty-of-joseon": ["Relief Sun", "Glow Serum", "Dynasty Cream"],
  simple: ["Hydrating Light Moisturizer", "Refreshing Facial Wash", "Micellar Gel Wash"],
};

const defaultBrandPreview: BrandPreview = {
  banner: "Ready",
  id: "cosrx",
  logo: "Ready",
  origin: "Brand origin preview",
  products: "Preview",
  type: "Imported",
};

const getStatusLabel = (status: string | null) =>
  status === "inactive" ? "Hidden" : "Active";

const getStatusTone = (status: string | null): BadgeTone =>
  status === "inactive" ? "bad" : "good";

const getSeoScore = (brand: BrandRecord) => {
  let score = 50;

  if (brand.meta_title) {
    score += 20;
  }

  if (brand.meta_description) {
    score += 20;
  }

  if (brand.slug) {
    score += 10;
  }

  return score;
};

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
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
  item,
  index,
  active = false,
}: {
  item: [string, string, string];
  index: number;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? "border-[#5E7F85] ring-2 ring-[#5E7F85]/15" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-500">{item[0]}</div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            {item[1]}
          </div>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black ${
            index === 0
              ? "bg-[#5E7F85]/10 text-[#5E7F85]"
              : index === 1
                ? "bg-emerald-50 text-emerald-700"
                : index === 2
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-slate-600"
          }`}
        >
          {index + 1}
        </div>
      </div>
      <div className="mt-3 inline-flex rounded-full bg-stone-50 px-3 py-1 text-xs font-semibold text-slate-600">
        {item[2]}
      </div>
    </div>
  );
}

function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-stone-50 text-xs uppercase tracking-[0.12em] text-slate-500">
      {children}
    </thead>
  );
}

function DisabledButton({
  children,
  className = "",
  title = "Not connected yet",
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <button
      aria-label={title}
      className={`cursor-not-allowed rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-400 ${className}`}
      disabled
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}

function getPreviewForBrand(brand: BrandRecord | null): BrandPreview {
  if (!brand) {
    return defaultBrandPreview;
  }

  return brandPreviews[brand.slug] ?? defaultBrandPreview;
}

function BrandForm({
  editingBrand,
  formAction,
  isPending,
  state,
  onClose,
}: {
  editingBrand: BrandRecord | null;
  formAction: (payload: FormData) => void;
  isPending: boolean;
  state: { ok: boolean; message: string };
  onClose: () => void;
}) {
  const isEditing = Boolean(editingBrand);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-slate-500">
              Brand Action
            </div>
            <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {isEditing ? `Edit ${editingBrand?.name}` : "Add Brand"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              This form submits through the existing live brand server action.
              Brand type, origin, logo/banner upload, storefront revenue, and
              product mapping are preview-only until connected.
            </p>
          </div>
          {isEditing ? (
            <Link
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
              href="/brands"
            >
              Close
            </Link>
          ) : (
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          )}
        </div>

        <form action={formAction} className="mt-5 grid gap-4 md:grid-cols-2">
          <input name="id" type="hidden" value={editingBrand?.id ?? ""} />

          <label className={labelClassName}>
            Brand Name
            <input
              className={inputClassName}
              defaultValue={editingBrand?.name ?? ""}
              name="name"
              placeholder="COSRX"
              required
              type="text"
            />
          </label>

          <label className={labelClassName}>
            Slug
            <input
              className={`${inputClassName} bg-stone-50 font-semibold`}
              defaultValue={editingBrand?.slug ?? ""}
              name="slug"
              placeholder="auto-generated-slug"
              required
              type="text"
            />
          </label>

          <label className={labelClassName}>
            Brand Type
            <select
              className={`${inputClassName} cursor-not-allowed bg-stone-50 text-slate-500`}
              disabled
            >
              <option>Imported</option>
            </select>
          </label>

          <label className={labelClassName}>
            Origin Country
            <input
              className={`${inputClassName} cursor-not-allowed bg-stone-50 text-slate-500`}
              disabled
              placeholder="South Korea"
              type="text"
            />
          </label>

          <label className={labelClassName}>
            Storefront Visibility
            <select
              className={inputClassName}
              defaultValue={editingBrand?.status ?? "active"}
              name="status"
            >
              <option value="active">Visible</option>
              <option value="inactive">Hidden</option>
            </select>
          </label>

          <label className={labelClassName}>
            Sort Order
            <input
              className={inputClassName}
              defaultValue={editingBrand?.sort_order ?? 0}
              name="sortOrder"
              step="1"
              type="number"
            />
          </label>

          <label className={labelClassName}>
            Image URL
            <input
              className={inputClassName}
              defaultValue={editingBrand?.image ?? ""}
              name="image"
              placeholder="https://..."
              type="text"
            />
          </label>

          <label className={labelClassName}>
            Banner Status
            <input
              className={`${inputClassName} cursor-not-allowed bg-stone-50 text-slate-500`}
              disabled
              placeholder={editingBrand?.image ? "Ready" : "Needs Banner"}
              type="text"
            />
          </label>

          <label className={`${labelClassName} md:col-span-2`}>
            SEO Title
            <input
              className={inputClassName}
              defaultValue={editingBrand?.meta_title ?? ""}
              name="metaTitle"
              placeholder="Brand Products Price in Bangladesh | BrandnBeauty"
              type="text"
            />
          </label>

          <label className={`${labelClassName} md:col-span-2`}>
            Meta Description
            <textarea
              className={`${inputClassName} h-24 resize-y`}
              defaultValue={editingBrand?.meta_description ?? ""}
              name="metaDescription"
              placeholder="Write brand landing meta description..."
            />
          </label>

          <label className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700">
            Homepage Featured
            <input
              className="h-4 w-4 rounded border-slate-300 text-[#5E7F85]"
              defaultChecked={editingBrand?.featured ?? false}
              name="featured"
              type="checkbox"
            />
          </label>

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

          <div className="grid gap-3 md:col-span-2 sm:grid-cols-2">
            {isEditing ? (
              <Link
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700"
                href="/brands"
              >
                Cancel
              </Link>
            ) : (
              <button
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
            )}
            <button
              className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={isPending}
              type="submit"
            >
              {isPending
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Save Brand"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RealBrandsPage({ brands, editBrandId }: RealBrandsPageProps) {
  const [state, formAction, isPending] = useActionState(saveBrand, {
    ok: false,
    message: "",
  });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedBrandId, setSelectedBrandId] = useState(editBrandId ?? "");
  const [showAddForm, setShowAddForm] = useState(false);
  const editingBrand =
    brands.find((brand) => brand.id === editBrandId) ?? null;
  const featuredCount = brands.filter((brand) => brand.featured).length;
  const needsSeoCount = brands.filter((brand) => getSeoScore(brand) < 75).length;
  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      const query = search.toLowerCase();
      const preview = getPreviewForBrand(brand);
      const matchesSearch =
        !query ||
        `${brand.name} ${brand.slug} ${brand.status ?? ""} ${preview.type} ${preview.origin}`
          .toLowerCase()
          .includes(query);
      const matchesFilter =
        filter === "All" ||
        (filter === "Featured" && brand.featured) ||
        (filter === "Active" && brand.status !== "inactive") ||
        (filter === "Visible" && brand.status !== "inactive") ||
        (filter === "Hidden" && brand.status === "inactive") ||
        (filter === "Needs Work" && getSeoScore(brand) < 75) ||
        (filter === "Image Ready" && Boolean(brand.image)) ||
        preview.type === filter;

      return matchesSearch && matchesFilter;
    });
  }, [brands, filter, search]);
  const selectedBrand =
    editingBrand ??
    brands.find((brand) => brand.id === selectedBrandId) ??
    filteredBrands[0] ??
    brands[0] ??
    null;
  const selectedPreview = getPreviewForBrand(selectedBrand);
  const topProductPreview =
    topProductsMap[selectedPreview.id] ?? topProductsMap.cosrx;
  const topBrand = brands[0] ?? null;
  const showForm = showAddForm || Boolean(editingBrand);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5E7F85]">
                Catalog
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                Brands Control Room
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Manage brand landing pages, logo/banner assets, SEO health,
                homepage featured brands, product mapping and date-wise brand
                revenue.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DisabledButton title="Import brands is not connected yet">
                Import
              </DisabledButton>
              <DisabledButton title="Export brands is not connected yet">
                Export
              </DisabledButton>
              <button
                className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white"
                onClick={() => setShowAddForm(true)}
                type="button"
              >
                Add Brand
              </button>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-4">
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Filtered revenue:{" "}
              <b className="text-[#5E7F85]">Preview</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Date view: <b className="text-slate-900">30D</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Top brand:{" "}
              <b className="text-emerald-700">{topBrand?.name ?? "Review"}</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Needs work: <b className="text-amber-700">{needsSeoCount}</b>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Filtered Revenue", "Preview", "30D"],
            ["Top Brand", topBrand?.name ?? "Review", "Revenue preview"],
            ["Featured Brands", String(featuredCount), "Homepage visible"],
            ["Brand SEO Work", String(needsSeoCount), "Logo/banner/meta"],
          ].map((item, index) => (
            <StatCard
              active={item[0] === "Filtered Revenue" || item[0] === "Top Brand"}
              index={index}
              item={item as [string, string, string]}
              key={item[0]}
            />
          ))}
        </div>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold tracking-tight">
                      Brand Revenue Directory
                    </h2>
                    <Badge tone="brand">Date Wise</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Control brand visibility, SEO readiness, product mapping and
                    revenue by selected date range.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledButton title="Bulk featured update is not connected yet">
                    Bulk Featured
                  </DisabledButton>
                  <button
                    className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white"
                    onClick={() => setShowAddForm(true)}
                    type="button"
                  >
                    Add Brand
                  </button>
                </div>
              </div>
              <div className="mt-5 w-full overflow-visible rounded-[1.6rem] border border-[#5E7F85]/15 bg-gradient-to-br from-[#5E7F85]/5 via-white to-stone-50 p-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#5E7F85]">
                      Revenue Date Filter
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-700">
                      30D
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-3 xl:items-end">
                    <div className="flex flex-wrap gap-2">
                      {["Today", "7D", "30D", "This Month"].map((item) => (
                        <button
                          className={`cursor-not-allowed rounded-full px-4 py-2 text-xs font-semibold transition ${
                            item === "30D"
                              ? "bg-[#5E7F85] text-white shadow-sm"
                              : "border border-slate-200 bg-white text-slate-400"
                          }`}
                          disabled
                          key={item}
                          type="button"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <DisabledButton
                        className="inline-flex min-w-[150px] items-center justify-center gap-2 text-slate-700"
                        title="Custom date filtering is not connected yet"
                      >
                        <span aria-hidden="true">📅</span>
                        <span>Apr 1, 2026</span>
                      </DisabledButton>
                      <DisabledButton
                        className="inline-flex min-w-[150px] items-center justify-center gap-2 text-slate-700"
                        title="Custom date filtering is not connected yet"
                      >
                        <span aria-hidden="true">📅</span>
                        <span>Apr 30, 2026</span>
                      </DisabledButton>
                      <DisabledButton
                        className="bg-[#5E7F85]/10 text-[#5E7F85]/50"
                        title="Revenue filter is not connected yet"
                      >
                        Apply Filter
                      </DisabledButton>
                      <DisabledButton title="Revenue filter reset is not connected yet">
                        Reset
                      </DisabledButton>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(320px,1fr)_auto] xl:items-center">
                <div className="relative w-full">
                  <input
                    className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-10 text-sm outline-none"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search brand / slug / country / type..."
                    type="search"
                    value={search}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    Search
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "All",
                    "Featured",
                    "Active",
                    "Owned",
                    "Imported",
                    "Official",
                    "Hidden",
                    "Needs Work",
                  ].map((item) => (
                    <button
                      className={`rounded-full px-4 py-2 text-xs font-semibold ${
                        filter === item
                          ? "bg-[#5E7F85] text-white"
                          : "border border-slate-200 bg-white text-slate-600"
                      }`}
                      key={item}
                      onClick={() => setFilter(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto xl:overflow-visible">
              <table className="min-w-[980px] text-left text-sm xl:min-w-0 xl:w-full">
                <TableHead>
                  <tr>
                    {[
                      "Brand",
                      "Type",
                      "Products",
                      "Revenue",
                      "Share",
                      "SEO",
                      "Assets",
                      "Status",
                      "Action",
                    ].map((head) => (
                        <th className="px-3 py-4 font-medium 2xl:px-5" key={head}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </TableHead>
                <tbody>
                  {filteredBrands.length > 0 ? (
                    filteredBrands.map((brand) => {
                      const preview = getPreviewForBrand(brand);

                      return (
                        <tr
                          className={`cursor-pointer border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85] ${
                            selectedBrand?.id === brand.id
                              ? "bg-[#5E7F85]/5 shadow-[inset_3px_0_0_#5E7F85]"
                              : getSeoScore(brand) < 75
                                ? "bg-amber-50/25"
                                : "bg-white"
                          }`}
                          key={brand.id}
                          onClick={() => setSelectedBrandId(brand.id)}
                        >
                          <td className="px-3 py-4 2xl:px-5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-bold ${
                                  brand.image
                                    ? "bg-[#5E7F85]/10 text-[#5E7F85]"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {brand.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">
                                  {brand.name}
                                </div>
                                <div className="max-w-[190px] truncate text-xs text-slate-500">
                                  /brand/{brand.slug} - {preview.origin}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 2xl:px-5">
                            <Badge
                              tone={
                                preview.type === "Owned"
                                  ? "brand"
                                  : preview.type === "Official"
                                    ? "good"
                                    : "default"
                              }
                            >
                              {preview.type}
                            </Badge>
                          </td>
                          <td className="px-3 py-4 font-semibold text-slate-500 2xl:px-5">
                            {preview.products}
                          </td>
                          <td className="px-3 py-4 2xl:px-5">
                            <div className="font-bold text-slate-900">Preview</div>
                            <div className="mt-1 text-xs text-slate-500">30D</div>
                          </td>
                          <td className="px-3 py-4 2xl:px-5">
                            <div className="min-w-20">
                              <div className="mb-1 text-xs font-bold text-[#5E7F85]">
                                Preview
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full w-1/2 rounded-full bg-[#5E7F85]" />
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 2xl:px-5">
                            <Badge
                              tone={
                                getSeoScore(brand) >= 80
                                  ? "good"
                                  : getSeoScore(brand) >= 70
                                    ? "warn"
                                    : "bad"
                              }
                            >
                              {getSeoScore(brand)}/100
                            </Badge>
                          </td>
                          <td className="px-3 py-4 2xl:px-5">
                            <div className="flex flex-wrap gap-1">
                              <Badge tone={brand.image ? "good" : "warn"}>
                                Logo
                              </Badge>
                              <Badge
                                tone={
                                  brand.image || preview.banner === "Ready"
                                    ? "good"
                                    : "warn"
                                }
                              >
                                Banner
                              </Badge>
                            </div>
                          </td>
                          <td className="px-3 py-4 2xl:px-5">
                            <Badge tone={getStatusTone(brand.status)}>
                              {getStatusLabel(brand.status)}
                            </Badge>
                          </td>
                          <td
                            className="px-3 py-4 2xl:px-5"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className="flex items-center gap-2">
                              <Link
                                className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-semibold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white"
                                href={`/brands?edit=${brand.id}`}
                              >
                                Edit
                              </Link>
                              <button
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-stone-50"
                                onClick={() => setSelectedBrandId(brand.id)}
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
                        colSpan={9}
                      >
                        No brands found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              {selectedBrand ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-500">
                        Brand Page Preview
                      </div>
                      <h3 className="mt-1 text-xl font-bold tracking-tight">
                        {selectedBrand.name}
                      </h3>
                      <div className="mt-1 text-xs text-slate-500">
                        /brand/{selectedBrand.slug}
                      </div>
                    </div>
                    <Badge tone={selectedBrand.featured ? "brand" : "default"}>
                      {selectedBrand.featured ? "Featured" : "Normal"}
                    </Badge>
                  </div>
                  <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-stone-50 p-4">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5E7F85] via-[#6f949a] to-[#d9e5e1] p-5 text-white shadow-sm">
                      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15" />
                      <div className="absolute -bottom-10 left-1/2 h-32 w-32 rounded-full bg-white/10" />
                      <div className="relative">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-lg font-black">
                          {selectedBrand.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
                          Featured Brand
                        </div>
                        <div className="mt-2 text-3xl font-black tracking-tight">
                          {selectedBrand.name}
                        </div>
                        <div className="mt-2 text-sm text-white/85">
                          {selectedBrand.meta_description ??
                            "Authentic products - COD - Fast delivery"}
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">
                            Products preview
                          </span>
                          <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">
                            {selectedPreview.origin}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge tone="brand">
                        SEO {getSeoScore(selectedBrand)}/100
                      </Badge>
                      <Badge tone={selectedBrand.image ? "good" : "warn"}>
                        {selectedBrand.image ? "Logo Ready" : selectedPreview.logo}
                      </Badge>
                      <Badge tone={selectedBrand.image ? "good" : "warn"}>
                        {selectedBrand.image ? "Banner Ready" : selectedPreview.banner}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      ["Products", "Preview"],
                      ["Revenue", "Preview"],
                      ["Share", "Preview"],
                      ["Date View", "30D"],
                    ].map(([label, value]) => (
                      <div className="rounded-2xl bg-stone-50 p-4" key={label}>
                        <div className="text-xs text-slate-500">{label}</div>
                        <div className="mt-1 font-bold text-slate-900">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-3">
                    <Link
                      className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-center text-sm font-semibold text-white"
                      href={`/brands?edit=${selectedBrand.id}`}
                    >
                      Edit Brand
                    </Link>
                    <DisabledButton title="SEO settings are not connected yet">
                      SEO Settings
                    </DisabledButton>
                    <DisabledButton title="Logo and banner upload is not connected yet">
                      Upload Logo / Banner
                    </DisabledButton>
                  </div>
                </>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-stone-50 p-6 text-center text-sm font-medium text-slate-500">
                  Brand preview appears here after live brands are added.
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Product Mapping
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight">
                Top Brand Products
              </h3>
              <div className="mt-4 space-y-2">
                {topProductPreview.map((item, index) => (
                  <div
                    className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 text-xs"
                    key={item}
                  >
                    <span className="font-bold text-slate-700">{item}</span>
                    <span className="rounded-full bg-white px-2 py-1 font-bold text-[#5E7F85]">
                      #{index + 1}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-600">
                    Selected range revenue
                  </span>
                  <b className="text-[#5E7F85]">Preview</b>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
                  <div className="h-full w-1/2 rounded-full bg-[#5E7F85]" />
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-500">
                  Revenue and product mapping are preview-only.
                </div>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <DisabledButton title="Product mapping is not connected yet">
                  Map Products
                </DisabledButton>
                <DisabledButton
                  className="bg-[#5E7F85]/10 text-[#5E7F85]/50"
                  title="Featured ordering is not connected yet"
                >
                  Featured Order
                </DisabledButton>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Brand Revenue Ranking
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight">
                SEO Readiness
              </h3>
              <div className="mt-4 space-y-3">
                {[...brands]
                  .sort((a, b) => getSeoScore(b) - getSeoScore(a))
                  .slice(0, 5)
                  .map((brand, index) => (
                    <button
                      className={`w-full rounded-2xl px-4 py-3 text-left text-xs transition ${
                        selectedBrand?.id === brand.id
                          ? "bg-[#5E7F85]/10 ring-2 ring-[#5E7F85]/15"
                          : "bg-stone-50 hover:bg-stone-100"
                      }`}
                      key={brand.id}
                      onClick={() => setSelectedBrandId(brand.id)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-slate-800">
                          #{index + 1} {brand.name}
                        </span>
                        <span className="font-black text-[#5E7F85]">
                          {getSeoScore(brand)}/100
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-[#5E7F85]"
                          style={{ width: `${getSeoScore(brand)}%` }}
                        />
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                SEO + Storefront Note
              </div>
              <div className="mt-2 text-sm leading-6 text-amber-700">
                Every visible brand should have clean slug, logo, banner, SEO
                title, meta description, featured sorting and mapped active
                products before showing strongly on storefront.
              </div>
            </div>
          </div>
        </div>

        {showForm ? (
          <BrandForm
            editingBrand={editingBrand}
            formAction={formAction}
            isPending={isPending}
            onClose={() => setShowAddForm(false)}
            state={state}
          />
        ) : null}
      </div>
    </AdminShell>
  );
}
