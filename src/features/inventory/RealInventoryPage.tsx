"use client";

export default function RealInventoryPage() {
  const kpis = [
    { label: "Total SKUs", value: "248", sub: "Across all categories" },
    { label: "Low Stock", value: "14", sub: "Need reorder soon" },
    { label: "Out of Stock", value: "6", sub: "Sales blocked" },
    { label: "Today Stock Movement", value: "182", sub: "In + out combined" },
  ];

  const inventoryRows = [
    {
      product: "Acne Balance Facewash",
      sku: "BNB-SMB-ACNE-100",
      category: "Skincare",
      stock: 44,
      reserved: 6,
      available: 38,
      reorderLevel: 20,
      supplier: "Some By Mi",
      status: "Healthy",
    },
    {
      product: "Barrier Calm Serum",
      sku: "BNB-BNB-SERUM-30",
      category: "Skincare",
      stock: 18,
      reserved: 4,
      available: 14,
      reorderLevel: 15,
      supplier: "BrandnBeauty",
      status: "Low Stock",
    },
    {
      product: "Daily Sun Gel",
      sku: "BNB-BOJ-SPF-50",
      category: "Skincare",
      stock: 0,
      reserved: 0,
      available: 0,
      reorderLevel: 12,
      supplier: "Beauty of Joseon",
      status: "Out of Stock",
    },
    {
      product: "Hydra Gel Moisturizer",
      sku: "BNB-SMP-MOIST-01",
      category: "Skincare",
      stock: 72,
      reserved: 8,
      available: 64,
      reorderLevel: 18,
      supplier: "Simple",
      status: "Healthy",
    },
    {
      product: "Tea Tree Spot Gel",
      sku: "BNB-SMB-SPOT-15",
      category: "Skincare",
      stock: 11,
      reserved: 2,
      available: 9,
      reorderLevel: 10,
      supplier: "Some By Mi",
      status: "Low Stock",
    },
    {
      product: "Goat Milk Facewash",
      sku: "BNB-GMF-100",
      category: "Skincare",
      stock: 95,
      reserved: 5,
      available: 90,
      reorderLevel: 20,
      supplier: "BrandnBeauty",
      status: "Healthy",
    },
  ];

  const movements = [
    ["10:15 AM", "Stock In", "+40", "Barrier Calm Serum", "Purchase received"],
    ["11:05 AM", "Reserved", "-4", "Acne Balance Facewash", "Orders packed"],
    ["12:20 PM", "Sold", "-3", "Hydra Gel Moisturizer", "Delivered orders"],
    ["1:45 PM", "Adjustment", "-2", "Tea Tree Spot Gel", "Damaged units"],
    ["3:10 PM", "Stock In", "+60", "Goat Milk Facewash", "Factory batch added"],
  ];

  return (
    <div className="min-h-screen bg-stone-50 p-6 text-slate-900 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm text-slate-500">Admin / Inventory</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Inventory / Stock Movement
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 sm:w-[280px]"
            placeholder="Search product / SKU..."
          />
          <button className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm">
            Export Stock
          </button>
          <button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm">
            Add Stock Entry
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <div className="font-semibold">Inventory Control Note</div>
        <div className="mt-1">
          Available stock = total stock - reserved stock. Low stock items
          should be reordered before sales slow down.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="text-sm font-medium text-slate-500">
              {item.label}
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight">
              {item.value}
            </div>
            <div className="mt-2 text-xs text-slate-500">{item.sub}</div>
          </div>
        ))}
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              "All Items",
              "Healthy",
              "Low Stock",
              "Out of Stock",
              "Reserved Heavy",
            ].map((item, idx) => (
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
              <option>Category: All</option>
              <option>Skincare</option>
              <option>Hair Care</option>
              <option>Body Care</option>
            </select>
            <select className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
              <option>Supplier: All</option>
              <option>BrandnBeauty</option>
              <option>Some By Mi</option>
              <option>Simple</option>
            </select>
            <select className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
              <option>Sort: Stock High to Low</option>
              <option>Stock Low to High</option>
              <option>Recently Updated</option>
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Supplier</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Reserved</th>
                  <th className="px-4 py-3 font-medium">Available</th>
                  <th className="px-4 py-3 font-medium">Reorder Level</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {inventoryRows.map((row) => (
                  <tr
                    key={row.sku}
                    className={`border-t border-slate-100 ${
                      row.status === "Out of Stock"
                        ? "bg-rose-50"
                        : row.status === "Low Stock"
                          ? "bg-amber-50"
                          : "bg-white"
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {row.product}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.sku}</td>
                    <td className="px-4 py-3 text-slate-600">{row.category}</td>
                    <td className="px-4 py-3 text-slate-600">{row.supplier}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.stock}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.reserved}</td>
                    <td
                      className={`px-4 py-3 font-medium ${
                        row.available === 0
                          ? "text-rose-600"
                          : row.available <= row.reorderLevel
                            ? "text-amber-600"
                            : "text-slate-900"
                      }`}
                    >
                      {row.available}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.reorderLevel}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          row.status === "Healthy"
                            ? "bg-emerald-50 text-emerald-700"
                            : row.status === "Low Stock"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50">
                          View
                        </button>
                        <button className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50">
                          Adjust
                        </button>
                        {row.reserved > row.available && (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">
                            Reserved Heavy
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Stock Movement Log
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Today&apos;s Inventory Activity
              </h2>
            </div>
            <button className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-stone-50">
              Open Full Log
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(([time, type, qty, product, reason]) => (
                  <tr key={`${time}-${product}`} className="border-t border-slate-100 bg-white">
                    <td className="px-4 py-3 text-slate-600">{time}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          type === "Stock In"
                            ? "bg-emerald-50 text-emerald-700"
                            : type === "Adjustment"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-sky-50 text-sky-700"
                        }`}
                      >
                        {type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {qty}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{product}</td>
                    <td className="px-4 py-3 text-slate-600">{reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Quick Actions
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Inventory Controls
            </h2>
            <div className="mt-5 grid gap-3">
              {[
                "Create Purchase Entry",
                "Add Manual Adjustment",
                "Export Low Stock List",
                "Open Supplier View",
                "Reserve Stock for Orders",
              ].map((action) => (
                <button
                  key={action}
                  className="rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-white"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Inventory Rules
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              How It Works
            </h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-stone-50 p-4">
                Reserved stock should increase when orders are packed but not
                yet delivered.
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                Available stock should be the number shown for new sales
                decisions.
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                Damaged, lost or expired items should go through stock
                adjustment, not direct delete.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
