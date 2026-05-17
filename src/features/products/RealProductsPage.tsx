import Link from "next/link";

import { AdminShell } from "@/components/admin/AdminShell";

import type { ProductRecord } from "./products-data";

type RealProductsPageProps = {
  products: ProductRecord[];
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(price);

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
                      <td className="px-4 py-3">
                        <Link
                          className="font-semibold text-[#527B86] hover:text-slate-950"
                          href={`/products/edit?id=${product.id}`}
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-slate-500"
                      colSpan={8}
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
