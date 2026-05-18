import Link from "next/link";

import { AdminShell } from "@/components/admin/AdminShell";

import { updateProductStatus } from "./product-actions";
import type { ProductRecord } from "./products-data";

type RealProductsPageProps = {
  products: ProductRecord[];
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(price);

const hasAttributes = (attributes: ProductRecord["attributes"]) =>
  Boolean(attributes && Object.keys(attributes).length > 0);

async function submitProductStatus(formData: FormData) {
  "use server";

  await updateProductStatus(formData);
}

export function RealProductsPage({ products }: RealProductsPageProps) {
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
                Products
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Live product records from Supabase.
              </p>
            </div>
            <div className="rounded-md bg-[#527B86]/10 px-3 py-2 text-sm font-semibold text-[#527B86]">
              {products.length} products
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <h2 className="text-base font-semibold text-slate-950">
              Status Control / Archive Safe
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Products are not deleted; use Draft or Out of Stock to
              hide/disable later.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Brand
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Attributes
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {product.sku ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {product.brands?.name ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {product.categories?.name ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {product.stock}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {product.status ?? "unknown"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        Attributes: {hasAttributes(product.attributes) ? "yes" : "no"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-[280px] flex-wrap items-center gap-3">
                          <Link
                            className="font-semibold text-[#527B86] hover:text-slate-950"
                            href={`/products/edit?id=${product.id}`}
                          >
                            Edit
                          </Link>
                          <form
                            action={submitProductStatus}
                            className="flex items-center gap-2"
                          >
                            <input
                              name="id"
                              type="hidden"
                              value={product.id}
                            />
                            <label
                              className="sr-only"
                              htmlFor={`status-${product.id}`}
                            >
                              Product status
                            </label>
                            <select
                              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 shadow-sm outline-none transition focus:border-[#527B86] focus:ring-2 focus:ring-[#527B86]/20"
                              defaultValue={product.status ?? "draft"}
                              id={`status-${product.id}`}
                              name="status"
                            >
                              <option value="active">Active</option>
                              <option value="draft">Draft</option>
                              <option value="low_stock">Low Stock</option>
                              <option value="out_of_stock">
                                Out of Stock
                              </option>
                            </select>
                            <button
                              className="rounded-md bg-[#527B86] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-950"
                              type="submit"
                            >
                              Update
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-slate-500"
                      colSpan={9}
                    >
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
