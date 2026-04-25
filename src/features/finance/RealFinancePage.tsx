import type { FinanceData } from "@/lib/finance/supabaseFinance";

export default function RealFinancePage({
  financeData,
}: {
  financeData: FinanceData;
}) {
  return (
    <div className="min-h-screen bg-stone-50 p-4 text-slate-900 md:p-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm text-slate-500">
              Admin / Finance / Live Business Summary
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Finance Reconciliation Details
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm">
              Export Sheet
            </button>
            <button className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm">
              Open Orders
            </button>
            <button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm">
              Close Reconciliation
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Reconciliation Snapshot
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight">
                    Live Finance Overview
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    Receivable Check
                  </span>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                    Supabase Live
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Finance Review
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {financeData.snapshotItems.map((item) => (
                  <div key={item.label} className="rounded-2xl bg-stone-50 p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      {item.label}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-500">
                      Calculation
                    </div>
                    <h2 className="mt-1 text-xl font-bold tracking-tight">
                      Expected vs Received Breakdown
                    </h2>
                  </div>
                  <div className="rounded-2xl bg-stone-100 px-4 py-3 text-sm text-slate-600">
                    Live paid, receivable and order value metrics
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {financeData.lineItems.map((item) => (
                    <div key={item.label} className="rounded-2xl bg-stone-50 p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        {item.label}
                      </div>
                      <div
                        className={`mt-2 text-lg font-bold ${
                          item.highlight ? "text-amber-700" : "text-slate-900"
                        }`}
                      >
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-stone-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Check Item</th>
                        <th className="px-4 py-3 font-medium">Value</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financeData.checkItems.map((item) => (
                        <tr
                          key={item.label}
                          className="border-t border-slate-100 bg-white"
                        >
                          <td className="px-4 py-3 text-slate-700">{item.label}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {item.value}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                item.status === "Matched" ||
                                item.status === "Live" ||
                                item.status === "Clear"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
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

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-medium text-slate-500">
                  Resolution Center
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight">
                  Decision Panel
                </h2>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                    <div className="font-semibold">Difference detected</div>
                    <div className="mt-2">
                      Pending receivable and cancelled or returned values should be
                      reviewed before reconciliation is closed.
                    </div>
                  </div>
                  <select className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
                    <option>Select difference reason</option>
                    <option>Courier overpaid</option>
                    <option>Manual finance adjustment</option>
                    <option>Cancelled order adjustment</option>
                    <option>Returned order adjustment</option>
                  </select>
                  <textarea
                    className="min-h-[120px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                    placeholder="Write finance note / explanation for audit trail"
                    defaultValue="Live finance metrics are now sourced from Supabase orders and payment workflow."
                  />
                  <div className="grid gap-3">
                    <button className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white shadow-sm">
                      Save Resolution Note
                    </button>
                    <button className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm">
                      Send for Senior Approval
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <div className="text-sm font-medium text-slate-500">
                  Activity
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight">
                  Reconciliation Log
                </h2>
                <div className="mt-5 space-y-4">
                  {financeData.logItems.map((item) => (
                    <div key={`${item.time}-${item.text}`} className="rounded-2xl bg-stone-50 p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        {item.time}
                      </div>
                      <div className="mt-2 text-sm text-slate-700">{item.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-medium text-slate-500">
                  Approval Status
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight">
                  Workflow
                </h2>
                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <div className="rounded-2xl bg-stone-50 p-4">
                    Delivered orders tracked: {financeData.metrics.deliveredOrderCount}
                  </div>
                  <div className="rounded-2xl bg-stone-50 p-4">
                    Pending receivable: Tk {financeData.metrics.pendingReceivable.toLocaleString()}
                  </div>
                  <div className="rounded-2xl bg-stone-50 p-4">
                    Cancelled value: Tk {financeData.metrics.cancelledOrderValue.toLocaleString()}
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-4 text-amber-800">
                    Review unpaid COD and return values before closing finance checks.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="sticky top-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Quick Actions
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Finance Actions
              </h2>
              <div className="mt-5 grid gap-3">
                {[
                  "Mark Fully Reconciled",
                  "Flag Difference",
                  "Attach Settlement Proof",
                  "Send to Accounts Review",
                  "Open Delivered Orders",
                  "Open Pending COD Orders",
                ].map((action) => (
                  <button
                    key={action}
                    className="rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-white"
                  >
                    {action}
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-[#f7fbfb] p-4 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">Close Checklist</div>
                <div className="mt-3 space-y-2 text-xs leading-6">
                  <div>Paid revenue reviewed</div>
                  <div>Pending COD reviewed</div>
                  <div>Cancelled and returned values checked</div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Audit Safety
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Anti-Theft Control
              </h2>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-stone-50 p-4">
                  Paid revenue comes from delivered and paid orders only.
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  Pending receivable reflects unpaid COD orders.
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  Cancelled and returned orders stay visible for finance review.
                </div>
                <div className="rounded-2xl bg-amber-50 p-4 text-amber-800">
                  Current pending receivable: Tk {financeData.metrics.pendingReceivable.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">Documents</div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Proof & References
              </h2>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-stone-50 p-4">
                  Live order totals imported from Supabase
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  Payment workflow linked to delivered COD orders
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  Cancelled and returned values available for review
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  Future ready: charting and settlement proof attachment slots
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
