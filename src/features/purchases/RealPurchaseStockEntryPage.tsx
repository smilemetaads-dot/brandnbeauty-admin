export default function RealPurchaseStockEntryPage() {
  const kpis = [
    { label: "Total Suppliers", value: "12", sub: "Active vendors" },
    { label: "Pending Purchases", value: "5", sub: "Awaiting delivery" },
    { label: "Stock Added Today", value: "+182", sub: "Units added" },
    { label: "Purchase Value", value: "৳84,200", sub: "Today’s buying cost" },
  ];

  const suppliers = [
    { name: "BrandnBeauty", products: 28, lastOrder: "Today", status: "Primary" },
    { name: "Some By Mi", products: 12, lastOrder: "2 days ago", status: "Active" },
    { name: "Simple", products: 8, lastOrder: "5 days ago", status: "Active" },
    { name: "Beauty of Joseon", products: 6, lastOrder: "7 days ago", status: "Inactive" },
  ];

  const purchases = [
    {
      supplier: "Some By Mi",
      product: "Acne Balance Facewash",
      sku: "BNB-SMB-ACNE-100",
      qty: 40,
      unitCost: "৳420",
      totalCost: "৳16,800",
      received: 40,
      status: "Received",
    },
    {
      supplier: "Simple",
      product: "Hydra Gel Moisturizer",
      sku: "BNB-SMP-MOIST-01",
      qty: 30,
      unitCost: "৳400",
      totalCost: "৳12,000",
      received: 0,
      status: "Pending",
    },
    {
      supplier: "BrandnBeauty",
      product: "Goat Milk Facewash",
      sku: "BNB-GMF-100",
      qty: 60,
      unitCost: "৳300",
      totalCost: "৳18,000",
      received: 60,
      status: "Received",
    },
    {
      supplier: "Some By Mi",
      product: "Tea Tree Spot Gel",
      sku: "BNB-SMB-SPOT-15",
      qty: 20,
      unitCost: "৳360",
      totalCost: "৳7,200",
      received: 12,
      status: "Partial",
    },
  ];

  const stockEntries = [
    ["10:30 AM", "Stock In", "+40", "Acne Balance Facewash", "Supplier delivery received"],
    ["12:00 PM", "Stock In", "+60", "Goat Milk Facewash", "Factory batch received"],
    ["2:15 PM", "Pending", "+30", "Hydra Gel Moisturizer", "Purchase created, awaiting arrival"],
    ["4:05 PM", "Partial", "+12", "Tea Tree Spot Gel", "Part shipment received"],
  ];

  return (
    <div className="min-h-screen space-y-6 bg-stone-50 p-6 text-slate-900">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm text-slate-500">Admin / Supplier & Purchases</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Supplier / Purchase / Stock Entry
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 sm:w-[280px]"
            placeholder="Search supplier / product / SKU..."
          />
          <button className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm">
            Export Purchases
          </button>
          <button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm">
            Create Purchase Entry
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <div className="font-semibold">Purchase System Note</div>
        <div className="mt-1">
          Every purchase entry should be linked to a supplier. Only received
          quantity should increase stock. Pending purchases should stay in
          pipeline only.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="text-sm font-medium text-slate-500">{item.label}</div>
            <div className="mt-3 text-2xl font-bold tracking-tight">
              {item.value}
            </div>
            <div className="mt-2 text-xs text-slate-500">{item.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">Suppliers</div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Active Vendor List
              </h2>
            </div>
            <button className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-stone-50">
              Add Supplier
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {suppliers.map((supplier) => (
              <div
                key={supplier.name}
                className="flex items-center justify-between rounded-2xl bg-stone-50 p-4"
              >
                <div>
                  <div className="font-semibold text-slate-900">
                    {supplier.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {supplier.products} products • Last order {supplier.lastOrder}
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    supplier.status === "Primary"
                      ? "bg-sky-50 text-sky-700"
                      : supplier.status === "Active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-stone-100 text-slate-700"
                  }`}
                >
                  {supplier.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Create Purchase
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                New Supplier Entry
              </h2>
            </div>
            <div className="rounded-2xl bg-stone-100 px-4 py-2 text-sm text-slate-600">
              Received stock auto-updates inventory
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-900">
                Supplier
              </label>
              <select className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
                <option>Choose supplier</option>
                <option>BrandnBeauty</option>
                <option>Some By Mi</option>
                <option>Simple</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-900">
                Product
              </label>
              <select className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
                <option>Choose product</option>
                <option>Acne Balance Facewash</option>
                <option>Hydra Gel Moisturizer</option>
                <option>Goat Milk Facewash</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-900">
                Quantity
              </label>
              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                defaultValue="40"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-900">
                Buying Price / Unit
              </label>
              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                defaultValue="420"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-900">
                Purchase Status
              </label>
              <select className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
                <option>Pending</option>
                <option>Partial</option>
                <option>Received</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-900">
                Estimated Total
              </label>
              <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-900">
                ৳16,800
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-stone-50 p-4 text-xs leading-6 text-slate-600">
            Pending = no stock added
            <br />
            Partial = only received quantity should be added
            <br />
            Received = full quantity added into stock and logged
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm">
              Save Purchase Entry
            </button>
            <button className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm">
              Save as Pending
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-500">Purchases</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Purchase Entry Table
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
              <option>Status: All</option>
              <option>Pending</option>
              <option>Partial</option>
              <option>Received</option>
            </select>
            <select className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
              <option>Supplier: All</option>
              <option>BrandnBeauty</option>
              <option>Some By Mi</option>
              <option>Simple</option>
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Supplier</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Received</th>
                  <th className="px-4 py-3 font-medium">Unit Cost</th>
                  <th className="px-4 py-3 font-medium">Total Cost</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((row) => (
                  <tr
                    key={`${row.supplier}-${row.sku}`}
                    className={`border-t border-slate-100 ${
                      row.status === "Pending"
                        ? "bg-amber-50"
                        : row.status === "Partial"
                          ? "bg-sky-50"
                          : "bg-white"
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {row.supplier}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.product}</td>
                    <td className="px-4 py-3 text-slate-600">{row.sku}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.qty}
                    </td>
                    <td
                      className={`px-4 py-3 font-medium ${
                        row.received === 0
                          ? "text-amber-700"
                          : row.received < row.qty
                            ? "text-sky-700"
                            : "text-emerald-700"
                      }`}
                    >
                      {row.received}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.unitCost}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.totalCost}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          row.status === "Received"
                            ? "bg-emerald-50 text-emerald-700"
                            : row.status === "Partial"
                              ? "bg-sky-50 text-sky-700"
                              : "bg-amber-50 text-amber-700"
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
                          Receive
                        </button>
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
                Stock Entry Log
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Today’s Purchase Activity
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
                {stockEntries.map(([time, type, qty, product, reason]) => (
                  <tr key={`${time}-${product}`} className="border-t border-slate-100 bg-white">
                    <td className="px-4 py-3 text-slate-600">{time}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          type === "Stock In"
                            ? "bg-emerald-50 text-emerald-700"
                            : type === "Partial"
                              ? "bg-sky-50 text-sky-700"
                              : "bg-amber-50 text-amber-700"
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
              Purchase Controls
            </h2>
            <div className="mt-5 grid gap-3">
              {[
                "Add Supplier",
                "Create Purchase Entry",
                "Receive Pending Purchase",
                "Export Purchase Report",
                "Open Supplier Analytics",
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
              Purchase Rules
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              How It Works
            </h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-stone-50 p-4">
                Pending purchase should not affect available stock.
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                Partial received should add only received quantity and keep the
                rest pending.
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                Received purchase should create stock movement log automatically.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
