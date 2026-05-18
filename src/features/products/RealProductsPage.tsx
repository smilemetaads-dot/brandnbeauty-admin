import Link from "next/link";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import { updateProductStatus } from "./product-actions";
import type { ProductRecord } from "./products-data";

type RealProductsPageProps = {
  products: ProductRecord[];
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

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

const getStatusTone = (status: string | null): BadgeTone => {
  if (status === "active") {
    return "good";
  }

  if (status === "low_stock") {
    return "warn";
  }

  return "bad";
};

const getVisibilityLabel = (status: string | null) =>
  status === "draft" ? "Hidden" : "Visible";

const getStockRuleLabel = (status: string | null) => {
  if (status === "out_of_stock") {
    return "Notify Later";
  }

  if (status === "draft") {
    return "Disabled";
  }

  return "Sellable";
};

const hasAttributes = (attributes: ProductRecord["attributes"]) =>
  Boolean(attributes && Object.keys(attributes).length > 0);

async function submitProductStatus(formData: FormData) {
  "use server";

  await updateProductStatus(formData);
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

function StatusControl({
  product,
  compact = false,
}: {
  product: ProductRecord;
  compact?: boolean;
}) {
  return (
    <form action={submitProductStatus} className="flex flex-wrap items-center gap-2">
      <input name="id" type="hidden" value={product.id} />
      <label className="sr-only" htmlFor={`status-${product.id}`}>
        Product status
      </label>
      <select
        className={`rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-[#527B86] focus:ring-2 focus:ring-[#527B86]/20 ${
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
        className={`rounded-2xl bg-[#527B86] font-semibold text-white transition hover:bg-slate-950 ${
          compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
        }`}
        type="submit"
      >
        Update
      </button>
    </form>
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
  const outOfStockCount = products.filter(
    (product) => product.status === "out_of_stock",
  ).length;
  const alertCount = products.filter((product) =>
    ["low_stock", "out_of_stock"].includes(product.status ?? ""),
  ).length;
  const selectedProduct = products[0] ?? null;

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                Catalog
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Products Control Room
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage live Supabase products, archive-safe status changes,
                attributes, and quick catalog checks from one clean place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-400"
                disabled
                type="button"
              >
                Bulk Import Not Connected
              </button>
              <button
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-400"
                disabled
                type="button"
              >
                Export Not Connected
              </button>
              <Link
                className="rounded-2xl bg-[#527B86] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-950"
                href="/products/edit"
              >
                Add Product
              </Link>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-4">
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Stock value:{" "}
              <b className="text-[#527B86]">BDT {formatPrice(catalogValue)}</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Visible products:{" "}
              <b className="text-slate-950">{visibleCount}</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Hidden products: <b className="text-rose-700">{hiddenCount}</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Status alerts: <b className="text-amber-700">{alertCount}</b>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Current stock value"
            label="Catalog Value"
            value={`BDT ${formatPrice(catalogValue)}`}
          />
          <StatCard
            helper="Mapped from active, low stock, out of stock"
            label="Visible SKUs"
            value={String(visibleCount)}
          />
          <StatCard
            active
            helper="Archive safe review queue"
            label="Status Alerts"
            value={String(alertCount)}
          />
          <StatCard
            helper={`${outOfStockCount} out of stock`}
            label="Hidden SKUs"
            value={String(hiddenCount)}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Product Management
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Product Master List
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-400"
                    disabled
                    type="button"
                  >
                    Bulk Status Not Connected
                  </button>
                  <button
                    className="rounded-2xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
                    disabled
                    type="button"
                  >
                    Quick Price Not Connected
                  </button>
                </div>
              </div>
              <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
                <div className="relative max-w-xl">
                  <input
                    className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm text-slate-500 outline-none"
                    disabled
                    placeholder="Search not connected yet"
                    type="search"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "All Products",
                    "Active",
                    "Draft",
                    "Low Stock",
                    "Out of Stock",
                  ].map((item) => (
                    <button
                      className={`rounded-full px-4 py-2 text-xs font-semibold ${
                        item === "All Products"
                          ? "bg-[#527B86] text-white"
                          : "border border-slate-200 bg-white text-slate-500"
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
              <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-800">
                Unsupported source actions are intentionally disabled here.
                Product archive behavior stays status-based; products are not
                hard deleted.
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    {[
                      "Product",
                      "SKU",
                      "Catalog",
                      "Price / Stock",
                      "Storefront",
                      "Status",
                      "Attributes",
                      "Action",
                    ].map((head) => (
                      <th className="px-5 py-4 font-medium" key={head}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.length > 0 ? (
                    products.map((product, index) => (
                      <tr
                        className={`border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#527B86] ${
                          index === 0
                            ? "bg-[#527B86]/[0.06] shadow-[inset_3px_0_0_#527B86]"
                            : product.status === "out_of_stock"
                              ? "bg-rose-50/25"
                              : product.status === "low_stock"
                                ? "bg-amber-50/25"
                                : "bg-white"
                        }`}
                        key={product.id}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-[10px] font-bold text-slate-400">
                              IMG
                            </div>
                            <div>
                              <div className="font-bold text-slate-950">
                                {product.name}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {product.featured ? "Featured" : "Standard"} catalog item
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
                          <div className="font-semibold text-slate-950">
                            BDT {formatPrice(product.price)}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">
                            Stock {product.stock}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              tone={
                                product.status === "draft" ? "bad" : "good"
                              }
                            >
                              {getVisibilityLabel(product.status)}
                            </Badge>
                            <Badge
                              tone={
                                product.status === "out_of_stock"
                                  ? "warn"
                                  : product.status === "draft"
                                    ? "bad"
                                    : "good"
                              }
                            >
                              {getStockRuleLabel(product.status)}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={getStatusTone(product.status)}>
                            {formatStatus(product.status)}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            tone={
                              hasAttributes(product.attributes)
                                ? "brand"
                                : "default"
                            }
                          >
                            Attributes:{" "}
                            {hasAttributes(product.attributes) ? "yes" : "no"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex min-w-[330px] flex-wrap items-center gap-2">
                            <Link
                              className="rounded-xl bg-[#527B86]/10 px-3 py-2 text-xs font-semibold text-[#527B86] transition hover:bg-[#527B86] hover:text-white"
                              href={`/products/edit?id=${product.id}`}
                            >
                              Edit
                            </Link>
                            <button
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400"
                              disabled
                              type="button"
                            >
                              View Not Connected
                            </button>
                            <StatusControl compact product={product} />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="px-5 py-14 text-center text-sm text-slate-500"
                        colSpan={8}
                      >
                        No products found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              {selectedProduct ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-500">
                        Live Product Preview
                      </div>
                      <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                        {selectedProduct.name}
                      </h3>
                      <div className="mt-1 text-xs text-slate-500">
                        {selectedProduct.sku ?? "No SKU"}
                      </div>
                    </div>
                    <Badge tone={getStatusTone(selectedProduct.status)}>
                      {formatStatus(selectedProduct.status)}
                    </Badge>
                  </div>
                  <div className="mt-5 rounded-3xl border border-slate-200 bg-stone-50 p-4">
                    <div className="flex h-52 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-xs font-semibold text-slate-400">
                      Product Image Preview
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge tone={selectedProduct.featured ? "brand" : "default"}>
                        {selectedProduct.featured ? "Featured" : "Standard"}
                      </Badge>
                      <Badge
                        tone={
                          selectedProduct.status === "draft" ? "bad" : "good"
                        }
                      >
                        {getVisibilityLabel(selectedProduct.status)}
                      </Badge>
                      <Badge
                        tone={
                          selectedProduct.status === "out_of_stock"
                            ? "warn"
                            : selectedProduct.status === "draft"
                              ? "bad"
                              : "good"
                        }
                      >
                        {getStockRuleLabel(selectedProduct.status)}
                      </Badge>
                      <Badge tone="warn">Stock {selectedProduct.stock}</Badge>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3 text-sm">
                    {[
                      ["Brand", selectedProduct.brands?.name ?? "-"],
                      ["Category", selectedProduct.categories?.name ?? "-"],
                      ["Website", getVisibilityLabel(selectedProduct.status)],
                      ["Stock Rule", getStockRuleLabel(selectedProduct.status)],
                      [
                        "Attributes",
                        hasAttributes(selectedProduct.attributes) ? "yes" : "no",
                      ],
                      [
                        "Selling Price",
                        `BDT ${formatPrice(selectedProduct.price)}`,
                      ],
                    ].map(([label, value]) => (
                      <div
                        className="flex justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3"
                        key={label}
                      >
                        <span className="text-slate-500">{label}</span>
                        <b className="text-right text-slate-950">{value}</b>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-3">
                    <Link
                      className="rounded-2xl bg-[#527B86] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-950"
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
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-400"
                      disabled
                      type="button"
                    >
                      Frontend Preview Not Connected
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-stone-50 p-6 text-center text-sm font-medium text-slate-500">
                  Product details appear here after live products are added.
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                Professional Visibility Rule
              </div>
              <div className="mt-2 text-sm leading-6 text-amber-700">
                Keep useful products visible when appropriate, but use Draft or
                Out of Stock for archive-safe control. No hard delete action is
                available on this page.
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
