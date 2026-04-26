const summaryItems = [
  { label: "Supplier Selection", value: "Ready for supplier data" },
  { label: "Product Stock In", value: "Ready for stock entries" },
  { label: "Purchase Cost Summary", value: "Awaiting purchase costs" },
] as const;

const recentEntries = [
  "Purchase entries will appear here after stock-in workflow is connected.",
  "Supplier purchase references will appear here.",
  "Cost and quantity review activity will appear here.",
] as const;

export default function RealPurchaseStockEntryPage() {
  return (
    <div className="min-h-screen bg-stone-50 p-4 text-slate-900 md:p-6">
      <div className="space-y-6">
        <div>
          <div className="text-sm text-slate-500">
            Admin / Inventory / Purchase Stock Entry
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Supplier Purchase Stock Entry
          </h1>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="text-sm font-medium text-slate-500">
            New Purchase Entry
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight">
            Purchase stock workflow scaffold
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {summaryItems.map((item) => (
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
                Supplier Selection
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Supplier details
              </h2>
              <div className="mt-5 rounded-2xl bg-stone-50 p-5 text-sm text-slate-600">
                Supplier selection is reserved for choosing a supplier, purchase
                date, invoice reference, and purchase note.
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="text-sm font-medium text-slate-500">
                Product Stock In
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Stock entry lines
              </h2>
              <div className="mt-5 rounded-2xl bg-stone-50 p-5 text-sm text-slate-600">
                Product stock-in rows will support product selection, quantity,
                unit cost, batch details, and inventory movement creation later.
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="text-sm font-medium text-slate-500">
                Purchase Cost Summary
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Cost review
              </h2>
              <div className="mt-5 rounded-2xl bg-stone-50 p-5 text-sm text-slate-600">
                Purchase totals, item costs, supplier payable amount, and stock
                valuation impact will appear here after live data is connected.
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Recent Purchase Entries
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Entry activity placeholder
            </h2>
            <div className="mt-5 space-y-3">
              {recentEntries.map((item) => (
                <div key={item} className="rounded-2xl bg-stone-50 p-4 text-sm text-slate-600">
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
