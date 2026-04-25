import Link from "next/link";

import type { DashboardData } from "@/lib/dashboard/supabaseDashboard";

function formatCurrency(amount: number) {
  return `Tk ${amount.toLocaleString()}`;
}

function getOrderStatusClasses(status: string) {
  if (status === "New") return "bg-amber-50 text-amber-700";
  if (status === "Confirmed") return "bg-sky-50 text-sky-700";
  if (status === "Processing") return "bg-violet-50 text-violet-700";
  if (status === "Shipped") return "bg-indigo-50 text-indigo-700";
  if (status === "Cancelled" || status === "Returned") {
    return "bg-rose-50 text-rose-700";
  }

  return "bg-emerald-50 text-emerald-700";
}

export default function RealDashboardPage({
  dashboardData,
}: {
  dashboardData: DashboardData;
}) {
  const stats = [
    [
      "Total Orders",
      String(dashboardData.stats.totalOrders),
      `${dashboardData.stats.newPendingOrders} new / pending`,
    ],
    [
      "Total Revenue",
      formatCurrency(dashboardData.stats.totalRevenue),
      `${dashboardData.stats.deliveredOrders} delivered & paid`,
    ],
    [
      "Unpaid COD",
      formatCurrency(dashboardData.stats.unpaidCodAmount),
      `${dashboardData.stats.inFlightOrders} confirmed / processing / shipped`,
    ],
    [
      "Products Overview",
      String(dashboardData.stats.totalProducts),
      `${dashboardData.stats.lowStockProductCount} low stock, ${dashboardData.stats.outOfStockProductCount} out of stock`,
    ],
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
            <Link
              href="/orders"
              className="w-fit rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-stone-50"
            >
              View All Orders
            </Link>
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
                  {dashboardData.recentOrders.length === 0 ? (
                    <tr className="border-t border-slate-100 bg-white">
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No orders found yet.
                      </td>
                    </tr>
                  ) : null}
                  {dashboardData.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t border-slate-100 bg-white"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        #{order.id}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {order.customer}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {order.location}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {order.payment}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {formatCurrency(order.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getOrderStatusClasses(
                            order.status,
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
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
              {dashboardData.lowStock.length === 0 ? (
                <div className="rounded-2xl bg-stone-50 p-4 text-sm text-slate-500">
                  No low stock products right now.
                </div>
              ) : null}
              {dashboardData.lowStock.map((item) => (
                <div key={item.name} className="rounded-2xl bg-stone-50 p-4">
                  <div className="text-xs text-slate-500">{item.brand}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {item.name}
                  </div>
                  <div className="mt-2 text-xs font-medium text-rose-600">
                    {item.stock} left
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
            <Link
              href="/products"
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-stone-50"
            >
              View Products
            </Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dashboardData.topProducts.length === 0 ? (
              <div className="rounded-2xl bg-stone-50 p-4 text-sm text-slate-500">
                No product sales data yet.
              </div>
            ) : null}
            {dashboardData.topProducts.map((item) => (
              <div key={item.name} className="rounded-2xl bg-stone-50 p-4">
                <div className="flex h-24 items-center justify-center rounded-2xl bg-white text-xs text-slate-400 ring-1 ring-slate-200">
                  Product Image
                </div>
                <div className="mt-4 text-sm font-semibold text-slate-900">
                  {item.name}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {formatCurrency(item.sales)} sales
                </div>
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
