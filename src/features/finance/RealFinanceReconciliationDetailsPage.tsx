const reconciliationCards = [
  { label: "COD Collection Breakdown", value: "Ready for COD data" },
  { label: "Courier Payment Matching", value: "Awaiting courier settlements" },
  { label: "Delivered vs Paid Orders", value: "Not connected yet" },
] as const;

const noteItems = [
  "Reconciliation notes will appear here.",
  "Finance review activity will appear here.",
  "Mismatch resolution history will appear here.",
] as const;

export default function RealFinanceReconciliationDetailsPage() {
  return (
    <div className="min-h-screen bg-stone-50 p-4 text-slate-900 md:p-6">
      <div className="space-y-6">
        <div>
          <div className="text-sm text-slate-500">
            Admin / Finance / Reconciliation Details
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Finance Reconciliation Details
          </h1>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="text-sm font-medium text-slate-500">
            COD Collection Breakdown
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight">
            Reconciliation workflow scaffold
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {reconciliationCards.map((item) => (
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

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="text-sm font-medium text-slate-500">
                Courier Payment Matching
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Courier settlement matching
              </h2>
              <div className="mt-5 rounded-2xl bg-stone-50 p-5 text-sm text-slate-600">
                Courier payment matching will compare courier-reported payments,
                collected COD, delivery charges, deductions, and net settlement.
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="text-sm font-medium text-slate-500">
                Delivered vs Paid Orders
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Order payment review
              </h2>
              <div className="mt-5 rounded-2xl bg-stone-50 p-5 text-sm text-slate-600">
                Delivered orders, paid orders, unpaid delivered orders, and
                partially matched records will appear here after live data is
                connected.
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="text-sm font-medium text-slate-500">
                Unpaid / Pending Amounts
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Pending receivable review
              </h2>
              <div className="mt-5 rounded-2xl bg-stone-50 p-5 text-sm text-slate-600">
                Pending COD, unpaid delivered order value, courier-held amount,
                and unresolved payment differences will be tracked here.
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Reconciliation Notes
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Finance notes placeholder
            </h2>
            <div className="mt-5 space-y-3">
              {noteItems.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-stone-50 p-4 text-sm text-slate-600"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
