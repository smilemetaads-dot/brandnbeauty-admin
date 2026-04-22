"use client";

const items = [
  {
    name: "Acne Balance Facewash",
    sku: "BNB-SMB-ACNE-100",
    qty: 1,
    unitPrice: 890,
    status: "Delivered",
  },
  {
    name: "Barrier Calm Serum",
    sku: "BNB-BNB-SERUM-30",
    qty: 1,
    unitPrice: 990,
    status: "Delivered",
  },
  {
    name: "Daily Sun Gel",
    sku: "BNB-BOJ-SPF-50",
    qty: 1,
    unitPrice: 1250,
    status: "Returned",
  },
] as const;

export default function RealOrderDetailsPage() {
  const orderedTotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.qty,
    0,
  );
  const deliveredTotal = items
    .filter((item) => item.status === "Delivered")
    .reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const returnedTotal = orderedTotal - deliveredTotal;
  const deliveryCharge = 80;
  const codCharge = 18;
  const expectedSettlement = deliveredTotal - deliveryCharge - codCharge;
  const receivedSettlement = 1842;
  const difference = receivedSettlement - expectedSettlement;

  return (
    <div className="p-4 md:p-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Order Snapshot
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                  #BNB-240400
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  Confirmed
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Awaiting pickup
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  bKash Verified
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Customer", "Sadia Akter"],
                ["Phone", "01822XXXXXX"],
                ["Assigned", "Rafi"],
                ["Courier", "Steadfast"],
                ["Tracking ID", "SA-940021"],
                ["Payment Type", "bKash + COD"],
                ["Delivery Zone", "Dhaka Sub Area"],
                ["Order Time", "18 Mar 2026 • 10:42 AM"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-stone-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    {label}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-stone-50 p-4 text-sm text-slate-700">
              <div className="font-semibold text-slate-900">Delivery Address</div>
              <div className="mt-2">House 12, Road 4, Tongi, Gazipur</div>
              <div className="mt-2 text-xs text-slate-500">
                Customer note: Please call before delivery.
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">Products</div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                  Ordered Items & Partial Delivery
                </h2>
              </div>
              <div className="rounded-2xl bg-stone-100 px-4 py-3 text-sm text-slate-600">
                Delivered total auto-calculates settlement
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-stone-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">SKU</th>
                      <th className="px-4 py-3 font-medium">Qty</th>
                      <th className="px-4 py-3 font-medium">Unit Price</th>
                      <th className="px-4 py-3 font-medium">Line Total</th>
                      <th className="px-4 py-3 font-medium">Delivery Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.sku} className="border-t border-slate-100 bg-white">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.sku}</td>
                        <td className="px-4 py-3 text-slate-700">{item.qty}</td>
                        <td className="px-4 py-3 text-slate-700">
                          Tk {item.unitPrice}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          Tk {item.unitPrice * item.qty}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              item.status === "Delivered"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-stone-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Ordered Total
                </div>
                <div className="mt-2 text-lg font-bold text-slate-900">
                  Tk {orderedTotal}
                </div>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-emerald-700">
                  Delivered Items Total
                </div>
                <div className="mt-2 text-lg font-bold text-emerald-800">
                  Tk {deliveredTotal}
                </div>
              </div>
              <div className="rounded-2xl bg-rose-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-rose-700">
                  Returned Items Total
                </div>
                <div className="mt-2 text-lg font-bold text-rose-800">
                  Tk {returnedTotal}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Settlement
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                  Expected vs Received Payment
                </h2>
              </div>
              <div
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  difference === 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {difference === 0
                  ? "Fully reconciled"
                  : "Check difference before closing"}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                ["Delivered Value", `Tk ${deliveredTotal}`],
                ["Courier Charge", `Tk ${deliveryCharge}`],
                ["COD Charge", `Tk ${codCharge}`],
                ["Expected Settlement", `Tk ${expectedSettlement}`],
                ["Received Amount", `Tk ${receivedSettlement}`],
                ["Difference", `${difference > 0 ? "+" : ""}Tk ${difference}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-stone-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    {label}
                  </div>
                  <div
                    className={`mt-2 text-lg font-bold ${
                      label === "Difference" && difference !== 0
                        ? "text-amber-700"
                        : "text-slate-900"
                    }`}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="font-semibold">Fraud / mismatch protection</div>
              <div className="mt-2">
                Settlement should be calculated from delivered items total,
                then courier charge and COD charge deducted. Partial delivery
                should not create a false flag if delivered items are updated
                correctly.
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="text-sm font-medium text-slate-500">History</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              Moderator Notes & Activity Log
            </h2>
            <div className="mt-5 space-y-4">
              {[
                ["10:50 AM", "Rafi assigned to order and customer details checked."],
                ["11:05 AM", "bKash screenshot verified by accounts team."],
                [
                  "12:20 PM",
                  "Delivery items updated after courier callback: sunscreen marked returned.",
                ],
                [
                  "2:40 PM",
                  "Settlement entry added by finance for received amount.",
                ],
              ].map(([time, text]) => (
                <div key={time} className="rounded-2xl bg-stone-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    {time}
                  </div>
                  <div className="mt-2 text-sm text-slate-700">{text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Quick Actions
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              Manage Order
            </h2>
            <div className="mt-5 grid gap-3">
              {[
                "Call Customer",
                "Mark Confirmed",
                "Mark Packed",
                "Create Courier Entry",
                "Add Finance Settlement",
                "Flag Payment Issue",
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
              Call History
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              Confirmation Timeline
            </h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-stone-50 p-4">
                10:46 AM - Call placed by Rafi
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                10:48 AM - Customer requested call before delivery
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                Future ready: IVR / auto-call response logs can appear here
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Risk Check</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              Payment & Courier Integrity
            </h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-stone-50 p-4">
                Assigned moderator: Rafi
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                Courier partner: Steadfast
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                Reconciled by: Finance Admin
              </div>
              <div className="rounded-2xl bg-amber-50 p-4 text-amber-800">
                Difference exists - review before final settlement close.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
