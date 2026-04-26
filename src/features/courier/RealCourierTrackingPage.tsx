const courierSummary = [
  ["Pending Courier Settlement", "Tk 58,420", "23 orders waiting"],
  ["Received Today", "Tk 26,840", "3 courier batches"],
  ["Payment Issue", "Tk 4,260", "7 flagged orders"],
  ["Partially Delivered Orders", "12", "Need review"],
] as const;

const settlementRows = [
  {
    id: "#BNB-240400",
    customer: "Sadia Akter",
    courier: "Steadfast",
    tracking: "SA-940021",
    settlementBatch: "ST-18MAR-A",
    settlementAge: "Today",
    paymentType: "bKash + COD",
    orderTotal: 3130,
    deliveredValue: 1880,
    deliveryCharge: 80,
    codCharge: 18,
    expected: 1782,
    received: 1842,
    difference: 60,
    orderStatus: "Partial Delivered",
    settlementStatus: "Check",
  },
  {
    id: "#BNB-240391",
    customer: "Ayesha Siddika",
    courier: "Steadfast",
    tracking: "SA-940027",
    settlementBatch: "ST-18MAR-A",
    settlementAge: "Today",
    paymentType: "bKash",
    orderTotal: 2260,
    deliveredValue: 2260,
    deliveryCharge: 60,
    codCharge: 23,
    expected: 2177,
    received: 2177,
    difference: 0,
    orderStatus: "Delivered",
    settlementStatus: "Reconciled",
  },
  {
    id: "#BNB-240387",
    customer: "Imran Hossain",
    courier: "RedX",
    tracking: "RX-240330",
    settlementBatch: "RX-18MAR-02",
    settlementAge: "Today",
    paymentType: "COD",
    orderTotal: 1320,
    deliveredValue: 1320,
    deliveryCharge: 120,
    codCharge: 13,
    expected: 1187,
    received: 1000,
    difference: -187,
    orderStatus: "Delivered",
    settlementStatus: "Short",
  },
  {
    id: "#BNB-240398",
    customer: "Tania Islam",
    courier: "RedX",
    tracking: "RX-240323",
    settlementBatch: "Pending",
    settlementAge: "1 day",
    paymentType: "COD",
    orderTotal: 1540,
    deliveredValue: 1540,
    deliveryCharge: 120,
    codCharge: 15,
    expected: 1405,
    received: 0,
    difference: -1405,
    orderStatus: "Delivered",
    settlementStatus: "Pending",
  },
  {
    id: "#BNB-240393",
    customer: "Jannat Islam",
    courier: "Steadfast",
    tracking: "SA-940026",
    settlementBatch: "ST-17MAR-B",
    settlementAge: "1 day",
    paymentType: "COD",
    orderTotal: 870,
    deliveredValue: 870,
    deliveryCharge: 80,
    codCharge: 9,
    expected: 781,
    received: 781,
    difference: 0,
    orderStatus: "Delivered",
    settlementStatus: "Reconciled",
  },
  {
    id: "#BNB-240384",
    customer: "Mahinur Rahman",
    courier: "RedX",
    tracking: "-",
    settlementBatch: "Pending",
    settlementAge: "2 days",
    paymentType: "COD",
    orderTotal: 1990,
    deliveredValue: 0,
    deliveryCharge: 0,
    codCharge: 0,
    expected: 0,
    received: 0,
    difference: 0,
    orderStatus: "Returned",
    settlementStatus: "No Settlement",
  },
] as const;

const financeActions = [
  "Import Courier Settlement CSV",
  "Mark Batch Reconciled",
  "Flag Payment Issue",
  "Review Partial Delivery Orders",
  "Export Short Settlement Report",
] as const;

export default function RealCourierTrackingPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <section className="px-4 py-6 md:px-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-5 shadow-sm md:rounded-[2rem] md:border lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm text-slate-500">
              Admin / Courier & Payments
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Courier Integration & Payment Tracking
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 sm:w-[280px]"
              placeholder="Search order, tracking, batch..."
            />
            <button className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm">
              Import Settlement
            </button>
            <button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm">
              Create Courier Batch
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {courierSummary.map(([label, value, sub]) => (
            <div
              key={label}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="text-sm font-medium text-slate-500">{label}</div>
              <div className="mt-3 text-2xl font-bold tracking-tight">
                {value}
              </div>
              <div className="mt-2 text-xs text-slate-500">{sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2">
                {[
                  "All",
                  "Pending",
                  "Reconciled",
                  "Short",
                  "Check",
                  "No Settlement",
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
                  <option>Courier: All</option>
                  <option>Steadfast</option>
                  <option>Pathao</option>
                  <option>RedX</option>
                </select>
                <select className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
                  <option>Batch: Latest</option>
                  <option>Today</option>
                  <option>Yesterday</option>
                </select>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-stone-50 p-4 text-xs leading-6 text-slate-600">
              Smart rule: expected settlement = delivered items total - delivery
              charge - COD charge. Full return = expected settlement 0. Partial
              delivery recalculates from delivered items only.
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-[#f7fbfb] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-700">
                Bulk finance action for selected courier rows
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  "Mark Reconciled",
                  "Flag Difference",
                  "Export Batch Report",
                ].map((action) => (
                  <button
                    key={action}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50"
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
                      <th className="px-4 py-3 font-medium">Select</th>
                      <th className="px-4 py-3 font-medium">Order</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Courier</th>
                      <th className="px-4 py-3 font-medium">Tracking</th>
                      <th className="px-4 py-3 font-medium">Batch</th>
                      <th className="px-4 py-3 font-medium">Age</th>
                      <th className="px-4 py-3 font-medium">Payment Type</th>
                      <th className="px-4 py-3 font-medium">Delivered Value</th>
                      <th className="px-4 py-3 font-medium">Expected</th>
                      <th className="px-4 py-3 font-medium">Received</th>
                      <th className="px-4 py-3 font-medium">Diff</th>
                      <th className="px-4 py-3 font-medium">Order Status</th>
                      <th className="px-4 py-3 font-medium">Settlement</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlementRows.map((row) => (
                      <tr key={row.id} className="border-t border-slate-100 bg-white">
                        <td className="px-4 py-3">
                          <input type="checkbox" />
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {row.id}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.customer}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.courier}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {row.tracking}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {row.settlementBatch}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {row.settlementAge}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {row.paymentType}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          Tk {row.deliveredValue}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          Tk {row.expected}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          Tk {row.received}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-semibold ${
                              row.difference === 0
                                ? "text-emerald-600"
                                : row.difference < 0
                                  ? "text-rose-600"
                                  : "text-amber-700"
                            }`}
                          >
                            {row.difference > 0 ? "+" : ""}Tk {row.difference}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              row.orderStatus === "Delivered"
                                ? "bg-emerald-50 text-emerald-700"
                                : row.orderStatus === "Returned"
                                  ? "bg-stone-100 text-slate-700"
                                  : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {row.orderStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              row.settlementStatus === "Reconciled"
                                ? "bg-emerald-50 text-emerald-700"
                                : row.settlementStatus === "Pending"
                                  ? "bg-amber-50 text-amber-700"
                                  : row.settlementStatus === "Short"
                                    ? "bg-rose-50 text-rose-700"
                                    : row.settlementStatus === "No Settlement"
                                      ? "bg-stone-100 text-slate-700"
                                      : "bg-sky-50 text-sky-700"
                            }`}
                          >
                            {row.settlementStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50">
                              Open
                            </button>
                            <button className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50">
                              Reconcile
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

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="text-sm font-medium text-slate-500">
                Quick Actions
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Finance Controls
              </h2>
              <div className="mt-5 grid gap-3">
                {financeActions.map((action) => (
                  <button
                    key={action}
                    className="rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-white"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="text-sm font-medium text-slate-500">
                Batch Summary
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Latest Courier Batch
              </h2>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-stone-50 p-4">
                  Batch ID: ST-18MAR-A
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  Courier: Steadfast
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  Orders in batch: 14
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  Expected total: Tk 18,740
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  Received total: Tk 18,613
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  Imported by: Finance Admin
                </div>
                <div className="rounded-2xl bg-amber-50 p-4 text-amber-800">
                  Difference: -Tk 127 - review 2 orders
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="text-sm font-medium text-slate-500">
                Security Notes
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Anti-Leak Flow
              </h2>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-stone-50 p-4">
                  Expected amount should always calculate from delivered items
                  only.
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  Keep order status and settlement status separate so finance does
                  not close a row too early.
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  Difference not equal to 0 should stay flagged until finance
                  reconciliation is completed.
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  Full return orders should show expected settlement = 0, not a
                  false short flag.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
