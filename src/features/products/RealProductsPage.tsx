import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  AdminBadge,
  AdminStatCard,
  AdminTable,
  AdminTableHead,
  AdminTableRow,
  getAdminStatusTone,
} from "@/components/admin/AdminUiPrimitives";
import { AdminShell } from "@/components/admin/AdminShell";

import { updateProductStatus } from "./product-actions";
import type { ProductRecord } from "./products-data";

type RealProductsPageProps = {
  products: ProductRecord[];
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
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(price);

const formatStatus = (status: string | null) => {
  const labels: Record<string, string> = {
    active: "Active",
    draft: "Draft",
    low_stock: "Low Stock",
    out_of_stock: "Out of Stock",
  };

  return status ? (labels[status] ?? status) : "Unknown";
};

const getVisibilityLabel = (status: string | null) =>
  status === "draft" ? "Hidden" : "Visible";

const getStockRuleLabel = (status: string | null) => {
  if (status === "out_of_stock") return "Notify Me";
  if (status === "draft") return "Disabled";

  return "Sellable";
};

const hasAttributes = (attributes: ProductRecord["attributes"]) =>
  Boolean(attributes && Object.keys(attributes).length > 0);

async function submitProductStatus(formData: FormData) {
  "use server";

  await updateProductStatus(formData);
}

function StatusControl({
  product,
  compact = false,
}: {
  compact?: boolean;
  product: ProductRecord;
}) {
  return (
    <form action={submitProductStatus} className="flex flex-wrap items-center gap-2">
      <input name="id" type="hidden" value={product.id} />
      <label className="sr-only" htmlFor={`status-${product.id}`}>
        Product status
      </label>
      <select
        className={`rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-stone-50 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/20 ${
          compact ? "px-3 py-2" : "px-4 py-3"
        }`}
        defaultValue={product.status ?? "draft"}
        id={`status-${product.id}`}
        name="status"
      >
        <option value="active">Active</option>
        <option value="draft">Draft</option>
        <option value="low_stock">Low Stock</option>
        <option value="out_of_stock">Out of Stock</option>
      </select>
      <button
        className={`rounded-2xl bg-[#5E7F85] font-semibold text-white transition hover:bg-slate-950 ${
          compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
        }`}
        type="submit"
      >
        Update
      </button>
    </form>
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

export function RealProductsPage({ products }: RealProductsPageProps) {
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
  const selectedProduct = products[0] ?? null;

  return (
    <AdminShell>
      <div className="space-y-6">
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
              <DisabledAction>Bulk Import</DisabledAction>
              <DisabledAction>Export</DisabledAction>
              <Link
                className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-950"
                href="/products/edit"
              >
                Add Product
              </Link>
            </div>
          </div>
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
                    className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-10 text-sm outline-none placeholder:text-slate-400 disabled:text-slate-500"
                    disabled
                    placeholder="Search product / SKU / brand / category..."
                    type="search"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    /
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_FILTERS.map((item) => (
                    <button
                      className={`rounded-full px-4 py-2 text-xs font-semibold ${
                        item === "All Products"
                          ? "bg-[#5E7F85] text-white"
                          : "border border-slate-200 bg-white text-slate-600"
                      }`}
                      disabled
                      key={item}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
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
                  {products.length > 0 ? (
                    products.map((product, index) => (
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
                                {product.featured ? "Featured" : "Standard"} item
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
                            {product.categories?.name ?? "-"}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">
                            BDT {formatPrice(product.price)}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">
                            Stock {product.stock}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
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
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 opacity-60"
                              disabled
                              type="button"
                            >
                              View
                            </button>
                            <StatusControl compact product={product} />
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
                        No products found.
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
                        Stock {selectedProduct.stock}
                      </AdminBadge>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3 text-sm">
                    <DetailRow
                      label="Brand"
                      value={selectedProduct.brands?.name ?? "-"}
                    />
                    <DetailRow
                      label="Category"
                      value={selectedProduct.categories?.name ?? "-"}
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
                      value={`BDT ${formatPrice(selectedProduct.price)}`}
                    />
                  </div>
                  <div className="mt-5 grid gap-3">
                    <Link
                      className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-950"
                      href={`/products/edit?id=${selectedProduct.id}`}
                    >
                      Edit Product
                    </Link>
                    <StatusControl product={selectedProduct} />
                    <form action={submitProductStatus}>
                      <input name="id" type="hidden" value={selectedProduct.id} />
                      <input name="status" type="hidden" value="draft" />
                      <button
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-stone-50"
                        type="submit"
                      >
                        Set Draft Archive Safe
                      </button>
                    </form>
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
                  Product details appear here after live products are added.
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
