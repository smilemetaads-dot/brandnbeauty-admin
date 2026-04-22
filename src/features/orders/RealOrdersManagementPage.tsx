"use client";

import Link from "next/link";

const orderStats = [
  ["New Orders", "37", "Need confirmation"],
  ["Confirmed", "54", "Ready for processing"],
  ["Packed", "18", "Waiting for courier"],
  ["Returns / Cancels", "6", "Review needed"],
] as const;

const orders = [
  {
    id: "#BNB-240401",
    customer: "Nusrat Jahan",
    orderCount: 4,
    phone: "01711XXXXXX",
    orderTime: "5 min ago",
    location: "Dhaka / Mirpur",
    payment: "COD",
    verification: "COD",
    assigned: "Unassigned",
    courier: "Steadfast",
    tracking: "-",
    amount: 1260,
    status: "New",
    courierStatus: "Not handed over",
  },
  {
    id: "#BNB-240400",
    customer: "Sadia Akter",
    orderCount: 2,
    phone: "01822XXXXXX",
    orderTime: "18 min ago",
    location: "Gazipur / Tongi",
    payment: "bKash",
    verification: "Verified",
    assigned: "Rafi",
    courier: "Steadfast",
    tracking: "SA-940021",
    amount: 2140,
    status: "Confirmed",
    courierStatus: "Awaiting pickup",
  },
  {
    id: "#BNB-240399",
    customer: "Mehedi Hasan",
    orderCount: 1,
    phone: "01933XXXXXX",
    orderTime: "25 min ago",
    location: "Chattogram / Panchlaish",
    payment: "COD",
    verification: "COD",
    assigned: "Nila",
    courier: "Pathao",
    tracking: "SA-940022",
    amount: 980,
    status: "Packed",
    courierStatus: "Awaiting pickup",
  },
  {
    id: "#BNB-240398",
    customer: "Tania Islam",
    orderCount: 3,
    phone: "01644XXXXXX",
    orderTime: "40 min ago",
    location: "Sylhet / Sadar",
    payment: "COD",
    verification: "COD",
    assigned: "Rafi",
    courier: "RedX",
    tracking: "SA-940023",
    amount: 1540,
    status: "Shipped",
    courierStatus: "In transit",
  },
  {
    id: "#BNB-240397",
    customer: "Raisa Khan",
    orderCount: 5,
    phone: "01555XXXXXX",
    orderTime: "1 hr ago",
    location: "Dhaka / Uttara",
    payment: "bKash",
    verification: "Verified",
    assigned: "Mitu",
    courier: "Steadfast",
    tracking: "SA-940024",
    amount: 1890,
    status: "Delivered",
    courierStatus: "Delivered",
  },
  {
    id: "#BNB-240396",
    customer: "Tanvir Alam",
    orderCount: 1,
    phone: "01366XXXXXX",
    orderTime: "2 hr ago",
    location: "Rajshahi / Sadar",
    payment: "COD",
    verification: "COD",
    assigned: "Unassigned",
    courier: "Pathao",
    tracking: "-",
    amount: 750,
    status: "Cancelled",
    courierStatus: "Not created",
  },
  {
    id: "#BNB-240395",
    customer: "Sharmin Sultana",
    orderCount: 2,
    phone: "01777XXXXXX",
    orderTime: "3 hr ago",
    location: "Dhaka / Mohammadpur",
    payment: "COD",
    verification: "COD",
    assigned: "Rafi",
    courier: "Steadfast",
    tracking: "SA-940025",
    amount: 1120,
    status: "Confirmed",
    courierStatus: "Awaiting pickup",
  },
  {
    id: "#BNB-240394",
    customer: "Mim Akter",
    orderCount: 1,
    phone: "01988XXXXXX",
    orderTime: "4 hr ago",
    location: "Cumilla / Sadar",
    payment: "bKash",
    verification: "Pending",
    assigned: "Nila",
    courier: "RedX",
    tracking: "-",
    amount: 1480,
    status: "New",
    courierStatus: "Not handed over",
  },
  {
    id: "#BNB-240393",
    customer: "Jannat Islam",
    orderCount: 3,
    phone: "01855XXXXXX",
    orderTime: "Yesterday",
    location: "Narayanganj / Fatullah",
    payment: "COD",
    verification: "COD",
    assigned: "Mitu",
    courier: "Steadfast",
    tracking: "SA-940026",
    amount: 870,
    status: "Packed",
    courierStatus: "Awaiting pickup",
  },
  {
    id: "#BNB-240392",
    customer: "Sabbir Rahman",
    orderCount: 1,
    phone: "01622XXXXXX",
    orderTime: "Yesterday",
    location: "Khulna / Sadar",
    payment: "COD",
    verification: "COD",
    assigned: "Unassigned",
    courier: "Pathao",
    tracking: "-",
    amount: 1650,
    status: "New",
    courierStatus: "Not handed over",
  },
  {
    id: "#BNB-240391",
    customer: "Ayesha Siddika",
    orderCount: 4,
    phone: "01511XXXXXX",
    orderTime: "Yesterday",
    location: "Dhaka / Badda",
    payment: "bKash",
    verification: "Verified",
    assigned: "Rafi",
    courier: "Steadfast",
    tracking: "SA-940027",
    amount: 2260,
    status: "Shipped",
    courierStatus: "In transit",
  },
  {
    id: "#BNB-240390",
    customer: "Farzana Karim",
    orderCount: 2,
    phone: "01766XXXXXX",
    orderTime: "Yesterday",
    location: "Barishal / Sadar",
    payment: "COD",
    verification: "COD",
    assigned: "Nila",
    courier: "RedX",
    tracking: "SA-940028",
    amount: 930,
    status: "Confirmed",
    courierStatus: "Awaiting pickup",
  },
  {
    id: "#BNB-240389",
    customer: "Arif Hossain",
    orderCount: 1,
    phone: "01333XXXXXX",
    orderTime: "Yesterday",
    location: "Rangpur / Sadar",
    payment: "COD",
    verification: "COD",
    assigned: "Unassigned",
    courier: "Pathao",
    tracking: "-",
    amount: 1090,
    status: "New",
    courierStatus: "Not handed over",
  },
  {
    id: "#BNB-240388",
    customer: "Nadia Tabassum",
    orderCount: 3,
    phone: "01944XXXXXX",
    orderTime: "2 days ago",
    location: "Mymensingh / Sadar",
    payment: "bKash",
    verification: "Verified",
    assigned: "Mitu",
    courier: "Steadfast",
    tracking: "SA-940029",
    amount: 1730,
    status: "Delivered",
    courierStatus: "Delivered",
  },
  {
    id: "#BNB-240387",
    customer: "Imran Hossain",
    orderCount: 2,
    phone: "01899XXXXXX",
    orderTime: "2 days ago",
    location: "Bogura / Sadar",
    payment: "COD",
    verification: "COD",
    assigned: "Rafi",
    courier: "RedX",
    tracking: "SA-940030",
    amount: 1320,
    status: "Shipped",
    courierStatus: "In transit",
  },
  {
    id: "#BNB-240386",
    customer: "Sanjida Noor",
    orderCount: 2,
    phone: "01799XXXXXX",
    orderTime: "2 days ago",
    location: "Dhaka / Dhanmondi",
    payment: "COD",
    verification: "COD",
    assigned: "Nila",
    courier: "Steadfast",
    tracking: "SA-940031",
    amount: 1440,
    status: "Packed",
    courierStatus: "Awaiting pickup",
  },
  {
    id: "#BNB-240385",
    customer: "Omar Faruk",
    orderCount: 1,
    phone: "01688XXXXXX",
    orderTime: "2 days ago",
    location: "Noakhali / Sadar",
    payment: "COD",
    verification: "COD",
    assigned: "Unassigned",
    courier: "Pathao",
    tracking: "-",
    amount: 690,
    status: "Cancelled",
    courierStatus: "Not created",
  },
  {
    id: "#BNB-240384",
    customer: "Mahinur Rahman",
    orderCount: 2,
    phone: "01577XXXXXX",
    orderTime: "2 days ago",
    location: "Sylhet / Beanibazar",
    payment: "bKash",
    verification: "Pending",
    assigned: "Mitu",
    courier: "RedX",
    tracking: "—",
    amount: 1990,
    status: "New",
    courierStatus: "Not handed over",
  },
] as const;

function getOrderStatusClasses(status: string) {
  if (status === "New") return "bg-amber-50 text-amber-700";
  if (status === "Confirmed") return "bg-sky-50 text-sky-700";
  if (status === "Packed") return "bg-violet-50 text-violet-700";
  if (status === "Shipped") return "bg-indigo-50 text-indigo-700";
  if (status === "Delivered") return "bg-emerald-50 text-emerald-700";
  return "bg-rose-50 text-rose-700";
}

function getCourierStatusClasses(status: string) {
  if (status === "Delivered") return "bg-emerald-50 text-emerald-700";
  if (status === "In transit") return "bg-indigo-50 text-indigo-700";
  if (status === "Awaiting pickup") return "bg-amber-50 text-amber-700";
  return "bg-stone-100 text-slate-700";
}

function getVerificationClasses(status: string) {
  if (status === "Verified") return "bg-emerald-50 text-emerald-700";
  if (status === "COD") return "bg-stone-100 text-slate-700";
  return "bg-amber-50 text-amber-700";
}

export default function RealOrdersManagementPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {orderStats.map(([label, value, sub]) => (
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
            {[
              "All Orders",
              "New",
              "Confirmed",
              "Packed",
              "Shipped",
              "Delivered",
              "Cancelled",
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
              <option>Payment: All</option>
              <option>COD</option>
              <option>bKash</option>
            </select>
            <select className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
              <option>Delivery Zone: All</option>
              <option>Dhaka City</option>
              <option>Dhaka Sub Area</option>
              <option>Outside Dhaka</option>
            </select>
            <select className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
              <option>Sort: Latest</option>
              <option>Oldest</option>
              <option>Highest Amount</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" /> Select all on this page
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              "Mark Confirmed",
              "Mark Packed",
              "Assign Moderator",
              "Courier Export",
              "Print Invoice",
            ].map((action) => (
              <button
                key={action}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-100"
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    <input type="checkbox" />
                  </th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Order Time</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Verification</th>
                  <th className="px-4 py-3 font-medium">Assigned</th>
                  <th className="px-4 py-3 font-medium">Courier</th>
                  <th className="px-4 py-3 font-medium">Tracking ID</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Order Status</th>
                  <th className="px-4 py-3 font-medium">Courier Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100 bg-white">
                    <td className="px-4 py-3">
                      <input type="checkbox" />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {order.id}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>{order.customer}</div>
                      <div className="text-xs text-slate-400">
                        Orders: {order.orderCount}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{order.orderTime}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="flex items-center gap-2">
                        <span>{order.phone}</span>
                        <span className="text-xs text-sky-600">Call</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{order.location}</td>
                    <td className="px-4 py-3 text-slate-600">{order.payment}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getVerificationClasses(
                          order.verification,
                        )}`}
                      >
                        {order.verification}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{order.assigned}</td>
                    <td className="px-4 py-3 text-slate-700">{order.courier}</td>
                    <td className="px-4 py-3 text-slate-700">{order.tracking}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          order.amount >= 2000
                            ? "font-bold text-emerald-600"
                            : "font-medium text-slate-900"
                        }
                      >
                        Tk {order.amount}
                      </span>
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
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getCourierStatusClasses(
                          order.courierStatus,
                        )}`}
                      >
                        {order.courierStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href="/orders/details"
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50"
                        >
                          View
                        </Link>
                        <button className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50">
                          Call
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
          <div className="text-sm text-slate-600">Showing 1-18 of 215 orders</div>
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
          <div>
            <div className="text-sm font-medium text-slate-500">Quick Actions</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              Order Operations
            </h2>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              "Pending Call Confirm",
              "Create Courier Batch",
              "Print Selected Invoice",
              "Review Cancelled Orders",
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
          <div className="text-sm font-medium text-slate-500">Order Notes</div>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            Bangladesh Ecommerce Flow
          </h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-stone-50 p-4">
              Internal flow: New to Confirmed to Packed to Shipped to Delivered.
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              Courier status should update separately: Not handed over to
              Awaiting pickup to In transit to Delivered.
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              Automatic call confirmation can be added later in the
              automation phase without changing this page structure.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
