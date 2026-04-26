"use client";

import Link from "next/link";

import type { CustomersData } from "@/lib/customers/supabaseCustomers";

function getStatusClasses(status: string) {
  if (status === "VIP") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "Returning") {
    return "bg-sky-50 text-sky-700";
  }

  return "bg-emerald-50 text-emerald-700";
}

function getRiskClasses(risk: string) {
  if (risk === "High") {
    return "bg-rose-50 text-rose-700";
  }

  if (risk === "Medium") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-emerald-50 text-emerald-700";
}

export default function RealCustomersPage({
  customersData,
}: {
  customersData: CustomersData;
}) {
  const { customers } = customersData;
  const displayedCustomers = customers.slice(0, 10);

  return (
    <div className="min-h-screen bg-stone-50 p-4 text-slate-900 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm text-slate-500">Admin / Customers</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Customer Management
          </h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm">
            Export CSV
          </button>
          <button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm">
            Add Customer
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {customersData.stats.map(([label, value, sub]) => (
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

      <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <input
              className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 sm:max-w-[280px]"
              placeholder="Search name / phone..."
            />
            <select className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
              <option>Status: All</option>
              <option>New</option>
              <option>Returning</option>
              <option>VIP</option>
            </select>
            <select className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
              <option>Order Count</option>
              <option>1</option>
              <option>2-5</option>
              <option>5+</option>
            </select>
            <select className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
              <option>Location</option>
              <option>Dhaka</option>
              <option>Outside Dhaka</option>
            </select>
            <select className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
              <option>Payment Type</option>
              <option>COD</option>
              <option>Prepaid</option>
              <option>bKash + COD</option>
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Orders</th>
                  <th className="px-4 py-3 font-medium">Total Spent</th>
                  <th className="px-4 py-3 font-medium">Last Order</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Risk</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr className="border-t border-slate-100 bg-white">
                    <td
                      className="px-4 py-8 text-center text-sm text-slate-500"
                      colSpan={10}
                    >
                      No customers found from orders yet.
                    </td>
                  </tr>
                ) : (
                  displayedCustomers.map((customer) => (
                    <tr
                      key={customer.phone}
                      className="border-t border-slate-100 bg-white"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {customer.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          Latest: {customer.latestOrderStatus}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="flex items-center gap-2">
                          <span>{customer.phone}</span>
                          <span className="text-xs text-sky-600">Call</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div>{customer.orders}</div>
                        <div className="text-xs font-normal text-slate-500">
                          {customer.deliveredOrders} delivered /{" "}
                          {customer.cancelledOrders} cancelled
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        Tk {customer.spent.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {customer.lastOrder}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {customer.location}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {customer.payment}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                            customer.status,
                          )}`}
                        >
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getRiskClasses(
                            customer.risk,
                          )}`}
                        >
                          {customer.risk}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/customers/profile?phone=${encodeURIComponent(
                              customer.phone,
                            )}`}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50"
                          >
                            View Profile
                          </Link>
                          <button className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50">
                            Message
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            Showing {customers.length > 0 ? "1" : "0"}-
            {displayedCustomers.length} of {customers.length.toLocaleString()} customers
          </div>
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
          <div className="text-sm font-medium text-slate-500">
            Quick Segments
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight">
            Marketing &amp; Support Groups
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              "New Customers",
              "Repeat Buyers",
              "VIP Customers",
              "COD Risk Review",
            ].map((item) => (
              <button
                key={item}
                className="rounded-2xl border border-slate-300 bg-stone-50 px-4 py-4 text-sm font-medium text-slate-700 hover:bg-white"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="text-sm font-medium text-slate-500">
            Customer Notes
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight">
            Business Use
          </h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-stone-50 p-4">
              Repeat customers should be easy to identify for priority support.
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              VIP customers can later be used for special offers, bundles and
              exclusive campaigns.
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              COD risk helps detect return-prone or suspicious order behavior.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
