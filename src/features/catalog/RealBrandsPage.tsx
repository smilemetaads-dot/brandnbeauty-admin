import { AdminShell } from "@/components/admin/AdminShell";

import type { BrandRecord } from "./brands-data";

type RealBrandsPageProps = {
  brands: BrandRecord[];
};

export function RealBrandsPage({ brands }: RealBrandsPageProps) {
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
                Brands
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Live brand records from Supabase.
              </p>
            </div>
            <div className="rounded-md bg-[#527B86]/10 px-3 py-2 text-sm font-semibold text-[#527B86]">
              {brands.length} brands
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
                    Slug
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Featured
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {brands.length > 0 ? (
                  brands.map((brand) => (
                    <tr key={brand.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {brand.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {brand.slug}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {brand.status ?? "unknown"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {brand.featured ? "Yes" : "No"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-slate-500"
                      colSpan={4}
                    >
                      No brands found.
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
