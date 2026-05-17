"use client";

import { useActionState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import type { BrandRecord } from "@/features/catalog/brands-data";
import type { CategoryRecord } from "@/features/catalog/categories-data";
import type { ConcernRecord } from "@/features/catalog/concerns-data";
import { saveProduct } from "@/features/products/product-actions";

type RealAddEditProductPageProps = {
  categories: CategoryRecord[];
  concerns: ConcernRecord[];
  brands: BrandRecord[];
};

const inputClassName =
  "mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400";

const labelClassName = "text-sm font-medium text-slate-700";

export function RealAddEditProductPage({
  categories,
  concerns,
  brands,
}: RealAddEditProductPageProps) {
  const [state, formAction, isPending] = useActionState(
    saveProduct,
    { ok: false, message: "" },
  );

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
          <p className="text-sm font-semibold uppercase text-[#527B86]">
            Catalog
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">
                Add/Edit Product
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Product create/save is connected. Edit flow is coming next.
              </p>
            </div>
            <div className="grid gap-2 text-sm font-semibold text-[#527B86] sm:grid-cols-3">
              <div className="rounded-md bg-[#527B86]/10 px-3 py-2">
                {categories.length} categories
              </div>
              <div className="rounded-md bg-[#527B86]/10 px-3 py-2">
                {concerns.length} concerns
              </div>
              <div className="rounded-md bg-[#527B86]/10 px-3 py-2">
                {brands.length} brands
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
          <form action={formAction} className="grid gap-5 sm:grid-cols-2">
            <label className={labelClassName}>
              Product name
              <input
                className={inputClassName}
                name="name"
                placeholder="Product name"
                required
                type="text"
              />
            </label>

            <label className={labelClassName}>
              Slug
              <input
                className={inputClassName}
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
                name="sku"
                placeholder="SKU"
                type="text"
              />
            </label>

            <label className={labelClassName}>
              Price
              <input
                className={inputClassName}
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
                min="0"
                name="stock"
                placeholder="0"
                required
                step="1"
                type="number"
              />
            </label>

            <label className={labelClassName}>
              Brand
              <select className={inputClassName} defaultValue="" name="brandId">
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
                defaultValue=""
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

            <label className={labelClassName}>
              Status
              <select
                className={inputClassName}
                defaultValue="draft"
                name="status"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </label>

            <label className={labelClassName}>
              Image
              <input
                className={inputClassName}
                name="image"
                placeholder="Image URL"
                type="text"
              />
            </label>

            <label className={`${labelClassName} sm:col-span-2`}>
              Short description
              <textarea
                className={`${inputClassName} min-h-28 resize-y`}
                name="shortDescription"
                placeholder="Short product description"
              />
            </label>

            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                className="h-4 w-4 rounded border-slate-300 text-[#527B86]"
                name="featured"
                type="checkbox"
              />
              Featured product
            </label>

            {state.message ? (
              <div
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  state.ok
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {state.message}
              </div>
            ) : null}

            <div className="flex items-end">
              <button
                className="w-full rounded-md bg-[#527B86] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Saving..." : "Save product"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AdminShell>
  );
}
