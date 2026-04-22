"use client";

const products = [
  ["Acne Balance Facewash", "Some By Mi", "Skincare", "Tk 890", "124", "Active"],
  ["Barrier Calm Serum", "BrandnBeauty", "Skincare", "Tk 990", "42", "Active"],
  ["Daily Sun Gel", "Beauty of Joseon", "Skincare", "Tk 1250", "11", "Low Stock"],
  ["Pore Clay Mask", "COSRX", "Skincare", "Tk 1050", "9", "Low Stock"],
  ["Hydra Gel Moisturizer", "Simple", "Skincare", "Tk 850", "58", "Active"],
  ["Tea Tree Spot Gel", "Some By Mi", "Skincare", "Tk 780", "25", "Draft"],
] as const;

const filters = [
  "All Products",
  "Active",
  "Draft",
  "Low Stock",
  "Out of Stock",
] as const;

export default function RealProductManagementPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Products", "248", "32 brands"],
          ["Active Products", "214", "Currently live"],
          ["Draft Products", "18", "Need review"],
          ["Low Stock", "16", "Restock soon"],
        ].map(([label, value, sub]) => (
          <div
            key={label}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="text-sm font-medium text-slate-500">{label}</div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              {value}
            </div>
            <div className="mt-2 text-xs text-slate-500">{sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((item, idx) => (
              <button
                key={item}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  idx === 0
                    ? "bg-[#5E7F85] text-white"
                    : "border border-slate-300 bg-white text-slate-700"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
              <option>All Categories</option>
              <option>Skincare</option>
              <option>Hair Care</option>
              <option>Body Care</option>
            </select>
            <select className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
              <option>All Brands</option>
              <option>BrandnBeauty</option>
              <option>COSRX</option>
              <option>Some By Mi</option>
            </select>
            <select className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
              <option>Sort: Latest</option>
              <option>Price Low to High</option>
              <option>Price High to Low</option>
              <option>Stock Low to High</option>
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Brand</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map(([name, brand, category, price, stock, status]) => (
                  <tr key={name} className="border-t border-slate-100 bg-white">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-[10px] text-slate-400">
                          Image
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{name}</div>
                          <div className="text-xs text-slate-500">
                            SKU: BNB-PRD-102
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{brand}</td>
                    <td className="px-4 py-3 text-slate-600">{category}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{price}</td>
                    <td className="px-4 py-3 text-slate-700">{stock}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          status === "Active"
                            ? "bg-emerald-50 text-emerald-700"
                            : status === "Low Stock"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50">
                          Edit
                        </button>
                        <button className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50">
                          Duplicate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">Showing 1-6 of 248 products</div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((page) => (
              <button
                key={page}
                className={`h-10 w-10 rounded-xl border ${
                  page === 1
                    ? "border-[#5E7F85] bg-[#5E7F85] text-white"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Bulk Management
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                Quick Product Actions
              </h2>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              "Bulk Price Update",
              "Bulk Status Change",
              "Bulk Category Assign",
              "Export Product List",
            ].map((action) => (
              <button
                key={action}
                className="rounded-2xl border border-slate-300 bg-stone-50 px-4 py-4 text-sm font-medium text-slate-700 hover:bg-white"
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="text-sm font-medium text-slate-500">Product Notes</div>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            Control Ready
          </h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-stone-50 p-4">
              Manage name, images, price, stock, category, concern and brand
              from one place.
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              Future ready for supplier cost, profit tracking and inventory
              sync.
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              Later we can add product SEO fields, bundle mapping and upsell
              controls here.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
