const supplierCards = [
  { label: "Supplier List", value: "Ready for supplier records" },
  { label: "Purchase History Summary", value: "Awaiting purchase data" },
  { label: "Due / Payable Summary", value: "Not connected yet" },
] as const;

const performanceNotes = [
  "Supplier performance notes will appear here.",
  "Delivery reliability and stock quality notes will appear here.",
  "Payment and payable review notes will appear here.",
] as const;

export default function RealSuppliersPage() {
  return (
    <div className="min-h-screen bg-stone-50 p-4 text-slate-900 md:p-6">
      <div className="space-y-6">
        <div>
          <div className="text-sm text-slate-500">
            Admin / Suppliers / Supplier Profiles
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Supplier Profiles
          </h1>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="text-sm font-medium text-slate-500">
            Supplier List
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight">
            Supplier profile management scaffold
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {supplierCards.map((item) => (
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
                Supplier Contact Info
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Contact details
              </h2>
              <div className="mt-5 rounded-2xl bg-stone-50 p-5 text-sm text-slate-600">
                Supplier names, phone numbers, addresses, contact persons, and
                payment terms will be managed here after live supplier data is
                added.
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="text-sm font-medium text-slate-500">
                Purchase History Summary
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Purchase overview
              </h2>
              <div className="mt-5 rounded-2xl bg-stone-50 p-5 text-sm text-slate-600">
                Purchase counts, last purchase dates, total stock received, and
                supplier-wise purchase totals will appear here once connected.
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="text-sm font-medium text-slate-500">
                Due / Payable Summary
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Payable review
              </h2>
              <div className="mt-5 rounded-2xl bg-stone-50 p-5 text-sm text-slate-600">
                Supplier payable, paid amount, due balance, and settlement status
                will be shown here after purchase finance data is connected.
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Supplier Performance Notes
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Notes placeholder
            </h2>
            <div className="mt-5 space-y-3">
              {performanceNotes.map((item) => (
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
