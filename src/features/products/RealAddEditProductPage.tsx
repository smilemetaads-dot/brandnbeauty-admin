"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import {
  createEmptyProduct,
  productFromFormData,
} from "@/lib/products/localProducts";
import type { ProductRecord, ProductStatus } from "@/lib/types/product";

const gallery = ["Main Image", "Image 2", "Image 3", "Image 4"] as const;

const statusLabels: Record<ProductStatus, string> = {
  active: "Active",
  draft: "Draft",
  low_stock: "Low Stock",
  out_of_stock: "Out of Stock",
};

export default function RealAddEditProductPage({
  editingProductId = "",
  initialProduct,
}: {
  editingProductId?: string;
  initialProduct?: ProductRecord | null;
}) {
  const router = useRouter();
  const [productType, setProductType] = useState<"single" | "variant">(
    "single",
  );
  const [product, setProduct] = useState<ProductRecord>(() =>
    initialProduct ?? createEmptyProduct(),
  );
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const resolvedEditingProductId = initialProduct?.id || editingProductId;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextProduct = productFromFormData(
      new FormData(event.currentTarget),
      product,
    );
    const isEditing = Boolean(resolvedEditingProductId);
    const productToSave = {
      ...nextProduct,
      id: isEditing ? resolvedEditingProductId : "",
    };

    setIsSaving(true);
    setSaveMessage("");

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productToSave),
      });
      const result = (await response.json()) as {
        product?: ProductRecord;
        error?: string;
      };

      if (!response.ok || !result.product) {
        throw new Error(result.error ?? "Product could not be saved.");
      }

      setProduct(result.product);
      setSaveMessage("Product saved to Supabase.");
      router.refresh();
      router.push("/products");
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "Product could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-6">
      <form
        key={resolvedEditingProductId || "new-product"}
        onSubmit={handleSave}
        className="grid gap-6 xl:grid-cols-[1fr_360px]"
      >
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="text-sm font-medium text-slate-500">
              Basic Information
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              Product Details
            </h2>
            <div className="mt-5 grid gap-4">
              <input
                name="id"
                type="hidden"
                defaultValue={resolvedEditingProductId}
              />
              <input name="image" type="hidden" defaultValue={product.image} />

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Product Name
                </label>
                <input
                  name="name"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                  placeholder="Product Name"
                  defaultValue={product.name}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    Brand
                  </label>
                  <select
                    name="brand"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                    defaultValue={product.brand}
                  >
                    <option>Brand</option>
                    <option>Some By Mi</option>
                    <option>BrandnBeauty</option>
                    <option>COSRX</option>
                    <option>Beauty of Joseon</option>
                    <option>Simple</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    Category
                  </label>
                  <select
                    name="category"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                    defaultValue={product.category}
                  >
                    <option>Category</option>
                    <option>Skincare</option>
                    <option>Hair Care</option>
                    <option>Body Care</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    Primary Concern
                  </label>
                  <select
                    name="concern"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                    defaultValue={product.concern}
                  >
                    <option>Concern</option>
                    <option>Acne</option>
                    <option>Oily Skin</option>
                    <option>Brightening</option>
                    <option>Sensitive Skin</option>
                    <option>Sun Care</option>
                    <option>Pores</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    SKU
                  </label>
                  <input
                    name="sku"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                    placeholder="Auto-generated after save"
                    defaultValue={product.sku}
                  />
                  <div className="mt-2 text-xs text-slate-500">
                    SKU should auto-generate from brand + product + variant.
                    Manual override can stay optional.
                  </div>
                  <div className="mt-2 rounded-xl bg-stone-50 px-3 py-2 text-xs text-slate-600">
                    Example: Single product - BNB-GHC-001 | Variant product -
                    BNB-GHC-100 / BNB-GHC-150
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    Display Size / Volume
                  </label>
                  <input
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                    placeholder="Example: 100ml / 50g / 1 pc"
                    defaultValue="100ml"
                  />
                  <div className="mt-2 text-xs text-slate-500">
                    For single products, this shows on the website as
                    information only, not as a selector.
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    Website Display Type
                  </label>
                  <div className="rounded-2xl bg-stone-50 p-4 text-xs leading-6 text-slate-600">
                    Single product - shows{" "}
                    <span className="font-semibold text-slate-900">
                      Size: 100ml
                    </span>
                    <br />
                    Variant product - shows size / color / shade selector on PDP
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Short Description
                </label>
                <textarea
                  name="shortDescription"
                  className="min-h-[120px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                  placeholder="Short Description"
                  defaultValue={product.shortDescription}
                />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="text-sm font-medium text-slate-500">
              Product Type
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              Single or Variant Product
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label
                className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
                  productType === "single"
                    ? "border-[#5E7F85] bg-[#f2f7f7]"
                    : "border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="productType"
                  checked={productType === "single"}
                  onChange={() => setProductType("single")}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold text-slate-900">
                    Single Product
                  </div>
                  <div className="mt-1 text-slate-600">
                    Use one selling price, one buying price and one stock
                    quantity. Show size/volume as simple product info on the
                    website.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
                  productType === "variant"
                    ? "border-[#5E7F85] bg-[#f2f7f7]"
                    : "border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="productType"
                  checked={productType === "variant"}
                  onChange={() => setProductType("variant")}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold text-slate-900">
                    Variant Product
                  </div>
                  <div className="mt-1 text-slate-600">
                    Use when the same product has multiple sizes, colors,
                    shades or pack options. Website will show a selector and
                    each option gets separate SKU, price and stock.
                  </div>
                </div>
              </label>
            </div>
            <div className="mt-4 rounded-2xl bg-stone-50 p-4 text-xs leading-6 text-slate-600">
              Pro rule: single product can still show{" "}
              <span className="font-semibold text-slate-900">
                100ml / 50g / 1 pc
              </span>{" "}
              on the website. That is product info, not a selectable variant.
            </div>
          </div>

          {productType === "single" ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="text-sm font-medium text-slate-500">
                Pricing & Inventory
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                Pricing & Inventory (Single Product)
              </h2>
              <div className="mt-3 rounded-2xl bg-stone-50 p-4 text-xs leading-6 text-slate-600">
                Selling Price = customer sees this on website
                <br />
                Regular Price = old/original price for discount display
                <br />
                Buying Price = your cost price for profit calculation
                <br />
                Stock Quantity = available sellable units
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    Selling Price
                  </label>
                  <input
                    name="price"
                    type="number"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                    placeholder="Selling Price"
                    defaultValue={product.price}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    Regular Price
                  </label>
                  <input
                    name="oldPrice"
                    type="number"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                    placeholder="Regular Price"
                    defaultValue={product.oldPrice ?? ""}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    Buying Price
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                    placeholder="Buying Price"
                    defaultValue="420"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    Stock Quantity
                  </label>
                  <input
                    name="stock"
                    type="number"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                    placeholder="Stock Quantity"
                    defaultValue={product.stock}
                  />
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
                <div className="font-semibold">Profit Preview</div>
                <div className="mt-2">
                  Profit per item: <span className="font-bold">Tk 470</span>
                </div>
                <div>
                  Estimated margin: <span className="font-bold">52%</span>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    Status
                  </label>
                  <select
                    name="status"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                    defaultValue={product.status}
                  >
                    <option value="">Status</option>
                    {(Object.keys(statusLabels) as ProductStatus[]).map(
                      (status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    Low Stock Alert
                  </label>
                  <input
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                    placeholder="Low Stock Alert"
                    defaultValue="15"
                  />
                  <div className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                    Auto rule: if stock goes below 15, status badge shows Low
                    Stock in admin.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="text-sm font-medium text-slate-500">Variants</div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                Variant Pricing & Inventory
              </h2>
              <div className="mt-3 rounded-2xl bg-stone-50 p-4 text-xs leading-6 text-slate-600">
                Main single-product price and stock stay hidden here. Each
                variant gets its own SKU, selling price, buying price and stock.
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-stone-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Variant</th>
                        <th className="px-4 py-3 font-medium">Option Value</th>
                        <th className="px-4 py-3 font-medium">SKU</th>
                        <th className="px-4 py-3 font-medium">Selling Price</th>
                        <th className="px-4 py-3 font-medium">Buying Price</th>
                        <th className="px-4 py-3 font-medium">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        [
                          "Size",
                          "100ml",
                          product.sku,
                          String(product.price),
                          "420",
                          String(product.stock),
                        ],
                        ["Size", "150ml", "BNB-SMB-ACNE-150", "1190", "560", "48"],
                      ].map(([type, option, sku, sell, buy, stock]) => (
                        <tr key={sku} className="border-t border-slate-100 bg-white">
                          <td className="px-4 py-3 text-slate-700">{type}</td>
                          <td className="px-4 py-3 text-slate-700">{option}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {sku}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{sell}</td>
                          <td className="px-4 py-3 text-slate-700">{buy}</td>
                          <td className="px-4 py-3 text-slate-700">{stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
                >
                  Add Size Variant
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
                >
                  Add Color / Shade Variant
                </button>
              </div>
            </div>
          )}

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="text-sm font-medium text-slate-500">Content</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              Product Content Blocks
            </h2>
            <div className="mt-5 grid gap-4">
              <textarea
                className="min-h-[120px] rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                placeholder="Benefits"
                defaultValue={
                  "• Helps remove excess oil and buildup\n• Good for acne-prone and oily skin\n• Easy to fit into a daily routine"
                }
              />
              <textarea
                className="min-h-[120px] rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                placeholder="How to Use"
                defaultValue={
                  "1. Wet your face with water.\n2. Take a small amount and lather gently.\n3. Massage for 20–30 seconds.\n4. Rinse well and follow with serum / moisturizer."
                }
              />
              <textarea
                className="min-h-[120px] rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                placeholder="Ingredients"
                defaultValue="Salicylic Acid, Niacinamide, Zinc PCA, Glycerin, Mild Surfactant Base and skin-supporting ingredients."
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="text-sm font-medium text-slate-500">
              SEO & Discovery
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              SEO Fields
            </h2>
            <div className="mt-5 grid gap-4">
              <input
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                placeholder="Meta Title"
                defaultValue="Acne Balance Facewash | BrandnBeauty"
              />
              <textarea
                className="min-h-[100px] rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                placeholder="Meta Description"
                defaultValue="Shop Acne Balance Facewash at BrandnBeauty. A gentle facewash for acne-prone and oily skin with nationwide delivery in Bangladesh."
              />
              <input
                name="slug"
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                placeholder="URL Slug"
                defaultValue={product.slug}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Media</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              Product Images
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
              {gallery.map((label, idx) => (
                <div
                  key={label}
                  className={`rounded-2xl border p-3 ${
                    idx === 0
                      ? "border-[#5E7F85] bg-[#f2f7f7]"
                      : "border-slate-200 bg-stone-50"
                  }`}
                >
                  <div className="flex aspect-square items-center justify-center rounded-xl bg-white text-xs text-slate-400 ring-1 ring-slate-200">
                    {label}
                  </div>
                  <button
                    type="button"
                    className="mt-3 w-full rounded-xl border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700"
                  >
                    Upload
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Product Controls
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              Upsell & PDP Settings
            </h2>
            <div className="mt-5 space-y-4">
              <button
                disabled={isSaving}
                className="w-full rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Product"}
              </button>
              {saveMessage ? (
                <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                  {saveMessage}
                </div>
              ) : null}
              <select className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
                <option>Routine Upsell Step</option>
                <option defaultValue="Step 1 - Cleanser">
                  Step 1 - Cleanser
                </option>
                <option>Step 2 - Treat</option>
                <option>Step 3 - Moisturize</option>
                <option>Step 4 - Protect</option>
              </select>
              <select className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
                <option>Frequently Bought Group</option>
                <option defaultValue="Acne Routine Bundle">
                  Acne Routine Bundle
                </option>
                <option>Glow Routine Bundle</option>
                <option>Barrier Repair Bundle</option>
              </select>
              <label className="flex items-center gap-3 rounded-2xl bg-stone-50 p-4 text-sm text-slate-700">
                <input type="checkbox" defaultChecked /> Show on homepage best
                sellers
              </label>
              <label className="flex items-center gap-3 rounded-2xl bg-stone-50 p-4 text-sm text-slate-700">
                <input type="checkbox" defaultChecked /> Show on concern page
                recommendations
              </label>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Summary</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              Quick Product Snapshot
            </h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-stone-50 p-4">
                Brand: {product.brand}
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                Category: {product.category}
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                Concern: {product.concern}
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                Estimated Profit: Tk 470 per sale
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                Website View: Single product with size info - 100ml
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
