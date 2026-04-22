"use client";

const settlementLines = [
  ["Delivered Items Total", "Tk 1,880"],
  ["Delivery Charge", "-Tk 80"],
  ["COD Charge", "-Tk 18"],
  ["Expected Settlement", "Tk 1,782"],
  ["Received Settlement", "Tk 1,842"],
  ["Difference", "+Tk 60"],
];

const reconciliationLog = [
  [
    "2:10 PM",
    "Courier settlement imported from batch ST-18MAR-A by Finance Admin.",
  ],
  [
    "2:16 PM",
    "System detected difference of +Tk 60 against expected amount.",
  ],
  [
    "2:24 PM",
    "Accounts reviewed partial delivery note and courier sheet.",
  ],
  [
    "2:32 PM",
    "Order kept in manual review until finance closes reconciliation.",
  ],
];

export default function RealFinancePage() {
  return (
    <div className="min-h-screen bg-stone-50 p-4 text-slate-900 md:p-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm text-slate-500">
              Admin / Finance Reconciliation / #BNB-240400
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
              Open Order
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
                    Order #BNB-240400
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    Check Required
                  </span>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                    Batch ST-18MAR-A
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Finance Review
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Customer", "Sadia Akter"],
                  ["Courier", "Steadfast"],
                  ["Tracking ID", "SA-940021"],
                  ["Payment Type", "bKash + COD"],
                  ["Settlement Batch", "ST-18MAR-A"],
                  ["Batch Date", "18 Mar 2026"],
                  ["Accounts Owner", "Finance Admin"],
                  ["Order Result", "Partial Delivered"],
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
                    Delivered items only - no false partial-delivery flag
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {settlementLines.map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-stone-50 p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        {label}
                      </div>
                      <div
                        className={`mt-2 text-lg font-bold ${
                          label === "Difference"
                            ? "text-amber-700"
                            : "text-slate-900"
                        }`}
                      >
                        {value}
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
                      {[
                        [
                          "Delivered total updated from item-level order details",
                          "Tk 1,880",
                          "Matched",
                        ],
                        ["Courier delivery charge", "Tk 80", "Matched"],
                        ["COD charge", "Tk 18", "Matched"],
                        ["Received settlement amount", "Tk 1,842", "Needs review"],
                      ].map(([label, value, status]) => (
                        <tr key={label} className="border-t border-slate-100 bg-white">
                          <td className="px-4 py-3 text-slate-700">{label}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {value}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                status === "Matched"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {status}
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
                      Reason should be selected before reconciliation can be
                      closed.
                    </div>
                  </div>
                  <select className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
                    <option>Select difference reason</option>
                    <option>Courier overpaid</option>
                    <option>Manual finance adjustment</option>
                    <option>Partial delivery correction</option>
                    <option>Courier sheet mismatch</option>
                  </select>
                  <textarea
                    className="min-h-[120px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                    placeholder="Write finance note / explanation for audit trail"
                    defaultValue="Courier sheet shows one manual adjustment. Accounts needs final confirmation before closure."
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
                  {reconciliationLog.map(([time, text]) => (
                    <div key={time} className="rounded-2xl bg-stone-50 p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        {time}
                      </div>
                      <div className="mt-2 text-sm text-slate-700">{text}</div>
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
                    Imported by: Finance Admin
                  </div>
                  <div className="rounded-2xl bg-stone-50 p-4">
                    Checked by: Accounts Team
                  </div>
                  <div className="rounded-2xl bg-stone-50 p-4">
                    Needs approval: Senior Finance
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-4 text-amber-800">
                    Reconciliation close button should stay locked until reason +
                    note + approval are completed.
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
                  "Open Courier Batch",
                  "Open Order Details",
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
                  <div>Delivered items reviewed</div>
                  <div>Charges matched</div>
                  <div>Difference reason pending final approval</div>
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
                  Expected amount must come from delivered items only.
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  Order details item-status change should be locked in log history.
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  Finance cannot close settlement if difference remains unresolved.
                </div>
                <div className="rounded-2xl bg-amber-50 p-4 text-amber-800">
                  Current difference: +Tk 60 - verify before closing.
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
                  Courier settlement CSV imported
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  Manual finance note added
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  Order details page linked for product-level review
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  Future ready: image/pdf proof attachment slot for courier
                  settlement evidence
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
