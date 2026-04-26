"use client";

import type { CustomerProfileData } from "@/lib/customers/supabaseCustomers";

const emptyCustomer = {
  name: "No customer selected",
  phone: "Add ?phone= to view profile",
  email: "N/A",
  location: "N/A",
  address: "N/A",
  totalOrders: 0,
  deliveredOrders: 0,
  cancelledOrders: 0,
  totalSpent: 0,
  score: 0,
  tag: "N/A",
  risk: "Low",
  lastActivity: "Open a customer from the Customers page.",
};

export default function RealCustomerProfilePage({
  customerProfile,
}: {
  customerProfile: CustomerProfileData;
}) {
  const customer = customerProfile.customer ?? emptyCustomer;
  const orders = customerProfile.orders;
  const notes = customerProfile.customer
    ? customerProfile.notes
    : ["No phone was provided or no matching orders were found."];
  const aiSuggestions = customerProfile.customer
    ? customerProfile.aiSuggestions
    : ["Select a customer from the Customers page to view live order history."];
  const totalExpected = customerProfile.totalExpected;
  const totalReceived = customerProfile.totalReceived;
  const totalDifference = customerProfile.totalDifference;

  return (
    <div className="min-h-screen bg-stone-50 p-4 text-slate-900 md:p-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {customer.name}
            </h1>
            <p className="text-sm text-slate-500">
              {customer.phone} - {customer.email}
            </p>
            <p className="mt-1 text-xs text-slate-400">{customer.lastActivity}</p>
          </div>
          <div className="text-left md:text-right">
            <div className="text-sm text-slate-500">Score</div>
            <div className="text-lg font-bold text-slate-900">
              {customer.score}/100
            </div>
            <div
              className={`mt-1 text-xs font-medium ${
                customer.risk === "High"
                  ? "text-rose-500"
                  : customer.risk === "Medium"
                    ? "text-amber-500"
                    : "text-emerald-500"
              }`}
            >
              {customer.risk} Risk
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Orders</div>
            <div className="text-lg font-semibold text-slate-900">
              {customer.totalOrders}
            </div>
            <div className="text-xs text-slate-500">
              {customer.deliveredOrders} delivered / {customer.cancelledOrders} cancelled
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Spent</div>
            <div className="text-lg font-semibold text-slate-900">
              Tk {customer.totalSpent.toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Tag</div>
            <div className="text-lg font-semibold text-slate-900">
              {customer.tag}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Location</div>
            <div className="text-lg font-semibold text-slate-900">
              {customer.location}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            AI Suggestions
          </h2>
          <ul className="space-y-1 text-sm text-slate-600">
            {aiSuggestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Order Intelligence
          </h2>
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
                No order history found for this customer.
              </div>
            ) : (
              orders.map((order) => (
              <div
                key={order.id}
                className="space-y-2 rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{order.id}</div>
                    <div className="text-xs text-slate-500">
                      Status: {order.status}
                    </div>
                    <div className="text-xs text-slate-500">
                      Date: {order.date}
                    </div>
                    <div className="text-xs text-sky-600">
                      Courier: {order.courierStatus}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="font-semibold text-slate-900">
                      Tk {order.amount}
                    </div>
                    <div className="text-xs text-slate-500">
                      Paid: Tk {order.paid}
                    </div>
                  </div>
                </div>

                {order.paid !== order.expected && (
                  <div className="text-xs text-rose-500">
                    Payment mismatch (Expected: Tk {order.expected})
                  </div>
                )}
              </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Finance Summary
          </h2>
          <div className="space-y-1 text-sm text-slate-600">
            <div>Total Expected: Tk {totalExpected}</div>
            <div>Total Received: Tk {totalReceived}</div>
            <div className="text-rose-500">Difference: Tk {totalDifference}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Notes</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-xl bg-black px-4 py-2 text-white">
            Call
          </button>
          <button className="rounded-xl bg-slate-200 px-4 py-2 text-slate-900">
            Message
          </button>
          <button className="rounded-xl bg-slate-200 px-4 py-2 text-slate-900">
            New Order
          </button>
        </div>
      </div>
    </div>
  );
}
