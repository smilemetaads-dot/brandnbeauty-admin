const overviewCards = [
  { label: "Pending Courier Upload", value: "Ready for integration" },
  { label: "Payment Collection Status", value: "Awaiting live courier data" },
  { label: "COD Reconciliation", value: "Not connected yet" },
] as const;

const updateItems = [
  "Courier upload queue will appear here.",
  "Payment collection checkpoints will appear here.",
  "COD settlement activity will appear here.",
] as const;

export default function RealCourierTrackingPage() {
  return (
    <div className="min-h-screen bg-stone-50 p-4 text-slate-900 md:p-6">
      <div className="space-y-6">
        <div>
          <div className="text-sm text-slate-500">
            Admin / Sales / Courier & Payment Tracking
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Courier & Payment Tracking
          </h1>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="text-sm font-medium text-slate-500">
            Courier Tracking Overview
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight">
            Courier and payment workflow scaffold
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {overviewCards.map((item) => (
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
                Pending Courier Upload
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Upload queue
              </h2>
              <div className="mt-5 rounded-2xl bg-stone-50 p-5 text-sm text-slate-600">
                Courier upload records are not connected yet. This section is ready
                for future courier sheet uploads, consignment IDs, and dispatch
                status checks.
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="text-sm font-medium text-slate-500">
                Payment Collection Status
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Collection checks
              </h2>
              <div className="mt-5 rounded-2xl bg-stone-50 p-5 text-sm text-slate-600">
                Payment collection status will show courier collected, pending,
                failed, and settled amounts after live courier data is added.
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="text-sm font-medium text-slate-500">
                COD Reconciliation
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                COD settlement review
              </h2>
              <div className="mt-5 rounded-2xl bg-stone-50 p-5 text-sm text-slate-600">
                COD reconciliation is reserved for comparing expected COD,
                courier-collected COD, deductions, and final settlement.
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Recent Courier Updates
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Activity placeholder
            </h2>
            <div className="mt-5 space-y-3">
              {updateItems.map((item) => (
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
