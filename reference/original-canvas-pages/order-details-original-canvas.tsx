// REFERENCE ONLY.
// Original Canvas Order Details design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Order Details page.

import { type ReactNode } from "react";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";
type TimelineState = "done" | "active" | "wait";

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const cls =
    {
      default: "bg-slate-100 text-slate-700",
      good: "bg-emerald-50 text-emerald-700",
      warn: "bg-amber-50 text-amber-700",
      bad: "bg-rose-50 text-rose-700",
      brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    }[tone] || "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function StatCard({
  helper,
  index,
  label,
  value,
}: {
  helper: string;
  index: number;
  label: string;
  value: ReactNode;
}) {
  const icons = ["BDT", "List", "Dot", "Go"];

  return (
    <div className="group relative overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5E7F85]/5 transition group-hover:bg-[#5E7F85]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 truncate text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xs font-bold text-[#5E7F85]">
          {icons[index % icons.length]}
        </div>
      </div>
      <div className="relative mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        {helper}
      </div>
    </div>
  );
}

export default function DetailPage() {
  const order = {
    address: "House 12, Road 4, Gazipur Sadar, Gazipur",
    courier: "Not Sent",
    created: "Today, 11:24 AM",
    customer: "Sadia Akter",
    delivery: 60,
    id: "#1021",
    note: "Customer prefers evening delivery. Call once before dispatch.",
    payment: "COD",
    phone: "01822XXXXXX",
    risk: "High",
    riskScore: 82,
    source: "Facebook",
    status: "Ready to Pack",
    subtotal: 1870,
    total: 1930,
  };
  const items = [
    {
      brand: "Some By Mi",
      name: "Acne Balance Facewash",
      price: 890,
      qty: 1,
      stock: "Available",
    },
    {
      brand: "BrandnBeauty",
      name: "Barrier Calm Serum",
      price: 980,
      qty: 1,
      stock: "Low Stock",
    },
  ];
  const timeline: [string, string, TimelineState][] = [
    ["Order Placed", "Today 11:24 AM", "done"],
    ["Need Call", "Today 11:32 AM", "done"],
    ["Confirmed", "Today 11:48 AM", "done"],
    ["Ready to Pack", "Current step", "active"],
    ["Packed", "Waiting", "wait"],
    ["Courier Sent", "Waiting", "wait"],
  ];
  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Order {order.id}
              </h2>
              <Badge tone="brand">{order.status}</Badge>
              <Badge tone="bad">{order.risk} Risk</Badge>
            </div>
            <div className="mt-2 text-sm text-slate-500">
              Created {order.created} - Source {order.source} - {order.payment}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold">
              Print Invoice
            </button>
            <button className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
              WhatsApp
            </button>
            <button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">
              Confirm / Update
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard helper="COD receivable" index={0} label="Order Total" value={`BDT ${order.total}`} />
        <StatCard helper="2 products in parcel" index={1} label="Items" value={totalItems} />
        <StatCard helper="Call before dispatch" index={2} label="Risk Score" value={`${order.riskScore}/100`} />
        <StatCard helper="Not booked yet" index={3} label="Courier" value={order.courier} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Customer & Delivery
                </div>
                <h3 className="mt-1 text-xl font-bold tracking-tight">
                  Shipping Details
                </h3>
              </div>
              <button className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold">
                Edit
              </button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-stone-50 p-4">
                <div className="text-xs text-slate-500">Customer</div>
                <div className="mt-1 font-bold text-slate-900">{order.customer}</div>
                <div className="mt-1 text-sm text-slate-600">{order.phone}</div>
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                <div className="text-xs text-slate-500">Address</div>
                <div className="mt-1 font-semibold text-slate-800">
                  {order.address}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-slate-500">Products</div>
                <h3 className="mt-1 text-xl font-bold tracking-tight">
                  Ordered Items
                </h3>
              </div>
              <Badge tone="brand">{totalItems} items</Badge>
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 text-center font-medium">Qty</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr className="border-t border-slate-100" key={item.name}>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.brand}</div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={item.stock === "Low Stock" ? "warn" : "good"}>
                          {item.stock}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-center font-semibold">
                        {item.qty}
                      </td>
                      <td className="px-4 py-4 text-right font-bold">
                        BDT {item.price * item.qty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  Order Progress
                </div>
                <h3 className="mt-1 text-lg font-bold tracking-tight">
                  Status Timeline
                </h3>
              </div>
              <Badge tone="brand">Live</Badge>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {timeline.map(([label, time, state]) => (
                <div className="flex gap-2 rounded-xl bg-stone-50 px-3 py-2.5" key={label}>
                  <div
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                      state === "done"
                        ? "bg-emerald-500"
                        : state === "active"
                          ? "bg-[#5E7F85]"
                          : "bg-slate-200"
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">{label}</div>
                    <div className="text-[11px] text-slate-500">{time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Internal Notes</div>
            <div className="mt-4 space-y-3">
              <textarea
                className="h-20 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                defaultValue={order.note}
              />
              <button className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">
                Save Notes
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold tracking-tight">Action Center</h3>
            <div className="mt-4 rounded-2xl border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5E7F85]">
                Next Step
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-800">
                Move this order to Packing Desk
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Order confirmed and ready for item picking.
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold tracking-tight">Courier Block</h3>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Partner</span>
                <b>Not Assigned</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tracking ID</span>
                <b>Pending</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <b>{order.courier}</b>
              </div>
              <button className="mt-2 w-full rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">
                Send Courier
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold tracking-tight">Payment Summary</h3>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <b>BDT {order.subtotal}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery</span>
                <b>BDT {order.delivery}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Discount</span>
                <b>BDT 0</b>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                <span className="font-bold">Total COD</span>
                <b>BDT {order.total}</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
