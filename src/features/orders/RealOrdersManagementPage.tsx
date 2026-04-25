"use client";

import Link from "next/link";

import type { AdminOrderRecord } from "@/lib/orders/supabaseOrders";

function getOrderStatusClasses(status: string) {
  if (status === "New") return "bg-amber-50 text-amber-700";
  if (status === "Confirmed") return "bg-sky-50 text-sky-700";
  if (status === "Processing") return "bg-cyan-50 text-cyan-700";
  if (status === "Packed") return "bg-violet-50 text-violet-700";
  if (status === "Shipped") return "bg-indigo-50 text-indigo-700";
  if (status === "Delivered") return "bg-emerald-50 text-emerald-700";
  if (status === "Returned") return "bg-rose-50 text-rose-700";
  return "bg-rose-50 text-rose-700";
}

function getPaymentStatusClasses(status: string) {
  if (status === "Paid" || status === "Verified") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "Pending") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-stone-100 text-slate-700";
}

function formatAmount(amount: number) {
  return `Tk ${amount.toLocaleString()}`;
}

function formatCreatedAt(value: string) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function RealOrdersManagementPage({
  initialOrders,
}: {
  initialOrders: AdminOrderRecord[];
}) {
  const newOrders = initialOrders.filter((order) => order.orderStatus === "New");
  const confirmedOrders = initialOrders.filter(
    (order) => order.orderStatus === "Confirmed",
  );
  const paidOrders = initialOrders.filter(
    (order) => order.paymentStatus === "Paid" || order.paymentStatus === "Verified",
  );
  const pendingOrders = initialOrders.filter(
    (order) => order.paymentStatus === "Pending",
  );

  return (
    <div className="p-4 md:p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Orders", String(initialOrders.length), "Live from Supabase"],
          ["New Orders", String(newOrders.length), "Need confirmation"],
          ["Confirmed", String(confirmedOrders.length), "Ready for processing"],
          ["Paid / Verified", String(paidOrders.length), "Payment cleared"],
          ["Pending Payment", String(pendingOrders.length), "Review needed"],
        ]
          .slice(0, 4)
          .map(([label, value, sub]) => (
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
            {["All Orders", "New", "Confirmed", "Delivered"].map((item, idx) => (
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
              <option>Payment: All</option>
              <option>COD</option>
              <option>bKash</option>
            </select>
            <select className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
              <option>Status: All</option>
              <option>New</option>
              <option>Confirmed</option>
              <option>Delivered</option>
            </select>
            <select className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
              <option>Sort: Latest</option>
              <option>Oldest</option>
              <option>Highest Amount</option>
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Payment Method</th>
                  <th className="px-4 py-3 font-medium">Payment Status</th>
                  <th className="px-4 py-3 font-medium">Order Status</th>
                  <th className="px-4 py-3 font-medium">Created At</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {initialOrders.length === 0 ? (
                  <tr className="border-t border-slate-100 bg-white">
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No live orders found.
                    </td>
                  </tr>
                ) : null}

                {initialOrders.map((order) => (
                  <tr
                    key={order.id || order.orderNumber}
                    className="border-t border-slate-100 bg-white"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {order.customerPhone}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {formatAmount(order.total)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {order.paymentMethod}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStatusClasses(
                          order.paymentStatus,
                        )}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getOrderStatusClasses(
                          order.orderStatus,
                        )}`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatCreatedAt(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders/details?id=${encodeURIComponent(
                          order.id,
                        )}&order=${encodeURIComponent(order.orderNumber)}`}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            Showing {initialOrders.length} live order
            {initialOrders.length === 1 ? "" : "s"}
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
    </div>
  );
}
