"use client";

export default function RealDashboardPage() {
  const stats = [
    ["Today Orders", "128", "+12%"],
    ["Today Revenue", "৳84,500", "+8.4%"],
    ["Pending Confirmations", "37", "Needs action"],
    ["Low Stock Products", "14", "Restock soon"],
  ];

  const recentOrders = [
    ["#BNB-10241", "Ismail H.", "Dhaka", "COD", "৳1,260", "New"],
    ["#BNB-10240", "Nusrat J.", "Gazipur", "bKash", "৳2,140", "Confirmed"],
    ["#BNB-10239", "Sadia A.", "Chattogram", "COD", "৳980", "Packed"],
    ["#BNB-10238", "Mehedi R.", "Dhaka", "COD", "৳1,540", "Shipped"],
    ["#BNB-10237", "Tania K.", "Sylhet", "bKash", "৳1,890", "Delivered"],
  ];

  const lowStock = [
    ["Acne Patch Duo", "COSRX", "8 left"],
    ["Daily Sun Gel", "Beauty of Joseon", "11 left"],
    ["Barrier Calm Serum", "BrandnBeauty", "6 left"],
    ["Pore Clay Mask", "COSRX", "9 left"],
  ];

  return (
    <section className="px-4 py-6 md:px-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, sub]) => (
          <div
            key={label}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="text-sm font-medium text-slate-500">{label}</div>
            <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
            <div className="mt-2 text-xs text-slate-500">{sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">Orders</div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Recent Orders
              </h2>
            </div>
            <button className="w-fit rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-stone-50">
              View All Orders
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Order ID</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(
                    ([id, customer, location, payment, amount, status]) => (
                      <tr key={id} className="border-t border-slate-100 bg-white">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {id}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{customer}</td>
                        <td className="px-4 py-3 text-slate-600">{location}</td>
                        <td className="px-4 py-3 text-slate-600">{payment}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {amount}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              status === "New"
                                ? "bg-amber-50 text-amber-700"
                                : status === "Confirmed"
                                  ? "bg-sky-50 text-sky-700"
                                  : status === "Packed"
                                    ? "bg-violet-50 text-violet-700"
                                    : status === "Shipped"
                                      ? "bg-indigo-50 text-indigo-700"
                                      : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="text-sm font-medium text-slate-500">Inventory</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Low Stock Alert
            </h2>
            <div className="mt-5 space-y-3">
              {lowStock.map(([name, brand, stock]) => (
                <div key={name} className="rounded-2xl bg-stone-50 p-4">
                  <div className="text-xs text-slate-500">{brand}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {name}
                  </div>
                  <div className="mt-2 text-xs font-medium text-rose-600">
                    {stock}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="text-sm font-medium text-slate-500">
              Quick Actions
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Manage Faster
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {[
                "Upload Homepage Banner",
                "Add New Product",
                "Update Delivery Charges",
                "Create Coupon Code",
                "Check Pending Orders",
                "Edit Brand Page",
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
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Top Products
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Best Performing Products
              </h2>
            </div>
            <button className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-stone-50">
              View Products
            </button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ["Acne Balance Facewash", "৳38,500 sales"],
              ["Barrier Calm Serum", "৳31,900 sales"],
              ["Daily Sun Gel", "৳29,200 sales"],
            ].map(([name, sales]) => (
              <div key={name} className="rounded-2xl bg-stone-50 p-4">
                <div className="flex h-24 items-center justify-center rounded-2xl bg-white text-xs text-slate-400 ring-1 ring-slate-200">
                  Product Image
                </div>
                <div className="mt-4 text-sm font-semibold text-slate-900">
                  {name}
                </div>
                <div className="mt-1 text-xs text-slate-500">{sales}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="text-sm font-medium text-slate-500">System Notes</div>
          <h2 className="mt-1 text-xl font-bold tracking-tight">
            Mini ERP Ready
          </h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-stone-50 p-4">
              Products, orders, customers and inventory can be controlled from
              one panel.
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              Delivery charge logic can be updated from settings.
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              Future integrations: courier sync, IVR confirmation, AI assistant,
              analytics.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
