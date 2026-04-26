const analyticsCards = [
  { label: "Supplier Performance Overview", value: "Ready for supplier metrics" },
  { label: "Purchase Volume by Supplier", value: "Awaiting purchase data" },
  { label: "Supplier Due / Payable Insights", value: "Not connected yet" },
] as const;

const supplierNotes = [
  "Supplier analytics notes will appear here.",
  "Purchase volume trends will appear here.",
  "Payable and supplier performance comments will appear here.",
] as const;

export default function RealSupplierAnalyticsPage() {
  return (
    <div className="min-h-screen bg-stone-50 p-4 text-slate-900 md:p-6">
      <div className="space-y-6">
        <div>
          <div className="text-sm text-slate-500">
            Admin / Reports / Supplier Analytics
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Supplier Analytics
          </h1>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="text-sm font-medium text-slate-500">
            Supplier Performance Overview
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight">
            Supplier analytics scaffold
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {analyticsCards.map((item) => (
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
                Purchase Volume by Supplier
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Purchase volume review
              </h2>
              <div className="mt-5 rounded-2xl bg-stone-50 p-5 text-sm text-slate-600">
                Supplier-wise purchase quantity, total purchase value, purchase
                frequency, and stock-in trends will appear here when purchase
                data is connected.
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="text-sm font-medium text-slate-500">
                Top Suppliers
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Supplier ranking
              </h2>
              <div className="mt-5 rounded-2xl bg-stone-50 p-5 text-sm text-slate-600">
                Top suppliers by purchase value, stock reliability, product
                availability, and payable status will be listed here.
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="text-sm font-medium text-slate-500">
                Supplier Due / Payable Insights
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Payable analytics
              </h2>
              <div className="mt-5 rounded-2xl bg-stone-50 p-5 text-sm text-slate-600">
                Supplier due balances, paid amounts, payable aging, and
                settlement risk insights will appear here after finance data is
                connected.
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Supplier Notes
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Notes placeholder
            </h2>
            <div className="mt-5 space-y-3">
              {supplierNotes.map((item) => (
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
