"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { saveCategory } from "@/features/catalog/category-actions";

import type { CategoryRecord } from "./categories-data";

type RealCategoriesPageProps = {
  categories: CategoryRecord[];
  editCategoryId?: string;
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

type HierarchyPreview = {
  children: number;
  name: string;
  productLabel: string;
  slug: string;
  sub: string[];
};

const hierarchyBlueprints: HierarchyPreview[] = [
  {
    children: 5,
    name: "Skincare",
    productLabel: "Products preview",
    slug: "skincare",
    sub: ["Face Wash", "Serum", "Moisturizer", "Sunscreen", "Toner"],
  },
  {
    children: 4,
    name: "Hair Care",
    productLabel: "Products preview",
    slug: "hair-care",
    sub: ["Shampoo", "Hair Mask", "Hair Serum", "Scalp Care"],
  },
  {
    children: 3,
    name: "Body Care",
    productLabel: "Products preview",
    slug: "body-care",
    sub: ["Body Wash", "Lotion", "Scrub"],
  },
  {
    children: 4,
    name: "Makeup",
    productLabel: "Products preview",
    slug: "makeup",
    sub: ["Lip", "Face", "Eye", "Brushes"],
  },
];

const mappedProductPreview = [
  "Acne Balance Facewash",
  "Barrier Calm Serum",
  "Daily Sun Gel",
  "Hydra Gel Moisturizer",
];

const inputClassName =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/15";

const labelClassName = "text-sm font-semibold text-slate-700";

const getStatusLabel = (status: string | null) =>
  status === "inactive" ? "Draft" : "Active";

const getVisibilityLabel = (status: string | null) =>
  status === "inactive" ? "Hidden" : "Visible";

const getStatusTone = (status: string | null): BadgeTone =>
  status === "inactive" ? "warn" : "good";

const getSeoScore = (category: CategoryRecord) => {
  let score = 50;

  if (category.meta_title) {
    score += 20;
  }

  if (category.meta_description) {
    score += 20;
  }

  if (category.slug) {
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

function CategoryForm({
  editingCategory,
  formAction,
  isPending,
  state,
  onClose,
}: {
  editingCategory: CategoryRecord | null;
  formAction: (payload: FormData) => void;
  isPending: boolean;
  state: { ok: boolean; message: string };
  onClose: () => void;
}) {
  const isEditing = Boolean(editingCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-slate-500">
              Category Action
            </div>
            <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {isEditing ? `Edit ${editingCategory?.name}` : "Add Parent Category"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              This form submits through the existing live category server action.
              Subcategory, banner upload, and bulk workflow controls are
              preview-only until connected.
            </p>
          </div>
          {isEditing ? (
            <Link
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
              href="/categories"
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

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-bold text-white"
            type="button"
          >
            Parent Category
          </button>
          <button
            className="cursor-not-allowed rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm font-bold text-slate-400"
            disabled
            title="Subcategory save is not connected yet"
            type="button"
          >
            Subcategory Preview
          </button>
        </div>

        <form action={formAction} className="mt-5 grid gap-4 md:grid-cols-2">
          <input name="id" type="hidden" value={editingCategory?.id ?? ""} />

          <label className={labelClassName}>
            Name
            <input
              className={inputClassName}
              defaultValue={editingCategory?.name ?? ""}
              name="name"
              placeholder="Skincare"
              required
              type="text"
            />
          </label>

          <label className={labelClassName}>
            Slug
            <input
              className={`${inputClassName} bg-stone-50 font-semibold`}
              defaultValue={editingCategory?.slug ?? ""}
              name="slug"
              placeholder="auto-generated-slug"
              required
              type="text"
            />
          </label>

          <label className={labelClassName}>
            Parent
            <input
              className={`${inputClassName} cursor-not-allowed bg-stone-50 text-slate-500`}
              disabled
              placeholder="Root"
              type="text"
            />
          </label>

          <label className={labelClassName}>
            Menu Placement
            <select
              className={`${inputClassName} cursor-not-allowed bg-stone-50 text-slate-500`}
              disabled
            >
              <option>Header</option>
            </select>
          </label>

          <label className={labelClassName}>
            Visibility
            <select
              className={inputClassName}
              defaultValue={editingCategory?.status ?? "active"}
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
              defaultValue={editingCategory?.sort_order ?? 0}
              name="sortOrder"
              step="1"
              type="number"
            />
          </label>

          <label className={labelClassName}>
            Banner Status
            <input
              className={`${inputClassName} cursor-not-allowed bg-stone-50 text-slate-500`}
              disabled
              placeholder={editingCategory?.image ? "Ready" : "Needs Image"}
              type="text"
            />
          </label>

          <label className={labelClassName}>
            Image URL
            <input
              className={inputClassName}
              defaultValue={editingCategory?.image ?? ""}
              name="image"
              placeholder="https://..."
              type="text"
            />
          </label>

          <label className={`${labelClassName} md:col-span-2`}>
            SEO Title
            <input
              className={inputClassName}
              defaultValue={editingCategory?.meta_title ?? ""}
              name="metaTitle"
              placeholder="Category price in Bangladesh | BrandnBeauty"
              type="text"
            />
          </label>

          <label className={`${labelClassName} md:col-span-2`}>
            Meta Description
            <textarea
              className={`${inputClassName} h-24 resize-y`}
              defaultValue={editingCategory?.meta_description ?? ""}
              name="metaDescription"
              placeholder="Write SEO meta description..."
            />
          </label>

          <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            <input
              className="h-4 w-4 rounded border-slate-300 text-[#5E7F85]"
              defaultChecked={editingCategory?.featured ?? false}
              name="featured"
              type="checkbox"
            />
            Featured category
          </label>

          {state.message ? (
            <div
              className={`rounded-2xl px-4 py-3 text-sm font-medium ${
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
                href="/categories"
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
                  : "Save Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RealCategoriesPage({
  categories,
  editCategoryId,
}: RealCategoriesPageProps) {
  const [state, formAction, isPending] = useActionState(saveCategory, {
    ok: false,
    message: "",
  });
  const editingCategory =
    categories.find((category) => category.id === editCategoryId) ?? null;
  const [selectedId, setSelectedId] = useState(
    editingCategory?.id ?? categories[0]?.id ?? "",
  );
  const [showAddForm, setShowAddForm] = useState(false);

  const selectedCategory =
    categories.find((category) => category.id === selectedId) ??
    editingCategory ??
    categories[0] ??
    null;
  const visibleCount = categories.filter(
    (category) => category.status !== "inactive",
  ).length;
  const needsWork = categories.filter(
    (category) =>
      getSeoScore(category) < 75 ||
      !category.image ||
      category.status === "inactive",
  ).length;
  const avgSeo = categories.length
    ? Math.round(
        categories.reduce((sum, category) => sum + getSeoScore(category), 0) /
          categories.length,
      )
    : 0;
  const hierarchyRows = useMemo(
    () =>
      hierarchyBlueprints.map((blueprint) => {
        const liveCategory = categories.find(
          (category) =>
            category.slug === blueprint.slug ||
            category.name.toLowerCase() === blueprint.name.toLowerCase(),
        );

        return { blueprint, liveCategory };
      }),
    [categories],
  );
  const selectedPreview =
    hierarchyRows.find(
      ({ liveCategory }) => liveCategory?.id === selectedCategory?.id,
    )?.blueprint ?? hierarchyBlueprints[0];
  const showForm = showAddForm || Boolean(editingCategory);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5E7F85]">
                Catalog Taxonomy
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                Categories Control Room
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Manage parent category, subcategory, storefront menu, filter
                structure, SEO landing pages and banner visibility from one
                clean place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DisabledButton title="Import categories is not connected yet">
                Import
              </DisabledButton>
              <DisabledButton
                className="border-[#5E7F85]/30 bg-[#5E7F85]/5 text-[#5E7F85]/50"
                title="Subcategory creation is not connected yet"
              >
                Add Subcategory
              </DisabledButton>
              <button
                className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white"
                onClick={() => setShowAddForm(true)}
                type="button"
              >
                Add Category
              </button>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-4">
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Visible: <b className="text-[#5E7F85]">{visibleCount}</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Products mapped:{" "}
              <b className="text-slate-900">Preview</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Avg SEO score: <b className="text-emerald-700">{avgSeo}/100</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Needs work: <b className="text-amber-700">{needsWork}</b>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total Categories", String(categories.length), "Catalog structure"],
            ["Subcategories", "Preview", "Nested discovery"],
            ["Mapped Products", "Preview", "Product discovery"],
            ["SEO Needs Work", String(needsWork), "Review banner/meta"],
          ].map((item, index) => (
            <StatCard
              active={item[0] === "SEO Needs Work"}
              index={index}
              item={item as [string, string, string]}
              key={item[0]}
            />
          ))}
        </div>

        <div className="rounded-[2rem] border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">
                Category Hierarchy
              </div>
              <div className="mt-1 text-sm leading-6 text-slate-600">
                Parent category er niche subcategory thakbe. Product add/edit
                page e ei structure thekei category and subcategory select hobe.
              </div>
            </div>
            <DisabledButton
              className="w-fit bg-[#5E7F85]/10 text-[#5E7F85]/50"
              title="New subcategory is not connected yet"
            >
              + New Subcategory
            </DisabledButton>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {hierarchyRows.map(({ blueprint, liveCategory }) => (
              <div
                className="rounded-[1.5rem] border border-slate-200 bg-white p-4"
                key={blueprint.slug}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900">
                      {liveCategory?.name ?? blueprint.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {blueprint.productLabel} - {blueprint.children} sub
                    </div>
                  </div>
                  <Badge tone={getStatusTone(liveCategory?.status ?? null)}>
                    {getVisibilityLabel(liveCategory?.status ?? null)}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {blueprint.sub.map((item) => (
                    <span
                      className="rounded-full bg-stone-50 px-3 py-2 text-xs font-bold text-slate-600"
                      key={item}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {categories.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-6 text-sm font-medium text-slate-500">
                Live categories will appear here after creation.
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Storefront Discovery
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight">
                    Category Master List
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledButton title="Sort display order is not connected yet">
                    Sort Order
                  </DisabledButton>
                  <DisabledButton
                    className="bg-[#5E7F85]/10 text-[#5E7F85]/50"
                    title="Bulk visibility update is not connected yet"
                  >
                    Bulk Visibility
                  </DisabledButton>
                </div>
              </div>
              <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
                <div className="relative max-w-xl">
                  <input
                    className="w-full cursor-not-allowed rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-10 text-sm text-slate-500 outline-none"
                    disabled
                    placeholder="Search category / slug / parent..."
                    type="search"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    Search
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["All", "Active", "Draft", "Visible", "Hidden", "Header"].map(
                    (item) => (
                      <button
                        className={`cursor-not-allowed rounded-full px-4 py-2 text-xs font-semibold ${
                          item === "All"
                            ? "bg-[#5E7F85] text-white"
                            : "border border-slate-200 bg-white text-slate-400"
                        }`}
                        disabled
                        key={item}
                        type="button"
                      >
                        {item}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <TableHead>
                  <tr>
                    {[
                      "Category",
                      "Slug",
                      "Parent",
                      "Products",
                      "Menu",
                      "SEO",
                      "Banner",
                      "Status",
                      "Action",
                    ].map((head) => (
                      <th className="px-5 py-4 font-medium" key={head}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </TableHead>
                <tbody>
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <tr
                        className={`cursor-pointer border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85] ${
                          selectedCategory?.id === category.id
                            ? "bg-[#5E7F85]/[0.06] shadow-[inset_3px_0_0_#5E7F85]"
                            : category.status === "inactive"
                              ? "bg-amber-50/25"
                              : "bg-white"
                        }`}
                        key={category.id}
                        onClick={() => setSelectedId(category.id)}
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">
                            {category.name}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Priority {category.sort_order ?? 0} - subcategories
                            preview
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-slate-500">
                          /category/{category.slug}
                        </td>
                        <td className="px-5 py-4">Root</td>
                        <td className="px-5 py-4 font-semibold text-slate-500">
                          Preview
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            tone={
                              category.status === "inactive" ? "default" : "brand"
                            }
                          >
                            {category.status === "inactive"
                              ? "Not in Menu"
                              : "Header"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            tone={
                              getSeoScore(category) >= 80
                                ? "good"
                                : getSeoScore(category) >= 70
                                  ? "warn"
                                  : "bad"
                            }
                          >
                            {getSeoScore(category)}/100
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={category.image ? "good" : "warn"}>
                            {category.image ? "Ready" : "Needs Image"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={getStatusTone(category.status)}>
                            {getStatusLabel(category.status)}
                          </Badge>
                        </td>
                        <td
                          className="px-5 py-4"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex items-center gap-2">
                            <Link
                              className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-semibold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white"
                              href={`/categories?edit=${category.id}`}
                            >
                              Edit
                            </Link>
                            <button
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-stone-50"
                              onClick={() => setSelectedId(category.id)}
                              type="button"
                            >
                              Open
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="px-5 py-14 text-center text-sm text-slate-500"
                        colSpan={9}
                      >
                        No categories found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              {selectedCategory ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-500">
                        Selected Category
                      </div>
                      <h3 className="mt-1 text-xl font-bold tracking-tight">
                        {selectedCategory.name}
                      </h3>
                      <div className="mt-1 text-xs text-slate-500">
                        /category/{selectedCategory.slug}
                      </div>
                    </div>
                    <Badge tone={getStatusTone(selectedCategory.status)}>
                      {getVisibilityLabel(selectedCategory.status)}
                    </Badge>
                  </div>
                  <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-stone-50 p-4">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5E7F85] via-[#6f949a] to-[#d9e5e1] p-5 text-white shadow-sm">
                      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15" />
                      <div className="absolute -bottom-12 left-1/2 h-36 w-36 rounded-full bg-white/10" />
                      <div className="relative">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
                          Storefront Landing
                        </div>
                        <div className="mt-3 text-2xl font-black tracking-tight">
                          {selectedCategory.name}
                        </div>
                        <div className="mt-2 max-w-[240px] text-xs font-medium leading-5 text-white/85">
                          {selectedCategory.meta_description ??
                            "Authentic beauty products mapped with SEO, banner and menu visibility."}
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">
                            /category/{selectedCategory.slug}
                          </span>
                          <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">
                            Product mapping preview
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge tone="brand">
                        SEO {getSeoScore(selectedCategory)}/100
                      </Badge>
                      <Badge tone={selectedCategory.image ? "good" : "warn"}>
                        {selectedCategory.image ? "Ready" : "Needs Image"}
                      </Badge>
                      <Badge tone="default">Products preview</Badge>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3 text-sm">
                    {[
                      ["Parent", "Root"],
                      [
                        "Menu Visibility",
                        selectedCategory.status === "inactive"
                          ? "Not in Menu"
                          : "Header",
                      ],
                      ["Display Priority", selectedCategory.sort_order ?? 0],
                      ["Products", "Preview"],
                      ["Sub Items", selectedPreview.sub.length],
                      ["Status", getStatusLabel(selectedCategory.status)],
                    ].map(([label, value]) => (
                      <div
                        className="flex justify-between rounded-2xl bg-stone-50 px-4 py-3"
                        key={label}
                      >
                        <span className="text-slate-500">{label}</span>
                        <b className="text-right text-slate-900">{value}</b>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-3">
                    <Link
                      className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-center text-sm font-semibold text-white"
                      href={`/categories?edit=${selectedCategory.id}`}
                    >
                      Edit Category
                    </Link>
                    <DisabledButton title="SEO settings are not connected yet">
                      SEO Settings
                    </DisabledButton>
                    <DisabledButton title="Banner upload is not connected yet">
                      Upload Banner
                    </DisabledButton>
                  </div>
                </>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-stone-50 p-6 text-center text-sm font-medium text-slate-500">
                  Category preview appears here after live categories are added.
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Mapped Discovery
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight">
                Sub Items / Filters
              </h3>
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  ...selectedPreview.sub,
                ].map((item) => (
                  <span
                    className="rounded-full bg-[#5E7F85]/10 px-3 py-2 text-xs font-bold text-[#5E7F85]"
                    key={item}
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="text-sm font-medium text-slate-500">
                  Top Mapped Products
                </div>
                <div className="mt-3 space-y-2">
                  {mappedProductPreview.slice(0, 4).map((item, index) => (
                    <div
                      className="rounded-2xl bg-stone-50 px-4 py-3 text-xs"
                      key={item}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-slate-700">{item}</span>
                        <span className="rounded-full bg-white px-2 py-1 font-bold text-[#5E7F85]">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] font-semibold text-slate-400">
                        Preview mapping
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                SEO + Storefront Note
              </div>
              <div className="mt-2 text-sm leading-6 text-amber-700">
                Every visible category should have clean slug, banner, SEO
                title, meta description and mapped products before showing on
                storefront.
              </div>
            </div>
          </div>
        </div>

        {showForm ? (
          <CategoryForm
            editingCategory={editingCategory}
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
