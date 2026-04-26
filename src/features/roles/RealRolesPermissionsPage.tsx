const accessCards = [
  { label: "Admin Users", value: "Ready for admin account data" },
  { label: "Role Matrix", value: "Permission mapping scaffold" },
  { label: "Access Levels", value: "Not connected to auth yet" },
] as const;

const securityNotes = [
  "Admin activity logs will appear here.",
  "Permission change history will appear here.",
  "Security review notes will appear here.",
] as const;

export default function RealRolesPermissionsPage() {
  return (
    <div className="min-h-screen bg-stone-50 p-4 text-slate-900 md:p-6">
      <div className="space-y-6">
        <div>
          <div className="text-sm text-slate-500">
            Admin / System / Admin Roles & Permissions
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Admin Roles & Permissions
          </h1>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="text-sm font-medium text-slate-500">Admin Users</div>
          <h2 className="mt-1 text-xl font-bold tracking-tight">
            Roles and access control scaffold
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {accessCards.map((item) => (
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
                Role Matrix
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Role assignments
              </h2>
              <div className="mt-5 rounded-2xl bg-stone-50 p-5 text-sm text-slate-600">
                Role assignment rows will appear here after admin auth and role
                records are connected.
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="text-sm font-medium text-slate-500">
                Permission Groups
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Permission areas
              </h2>
              <div className="mt-5 rounded-2xl bg-stone-50 p-5 text-sm text-slate-600">
                Permission groups will cover sales, catalog, inventory,
                customers, finance, reports, suppliers, and system access.
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="text-sm font-medium text-slate-500">
                Access Levels
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Access control levels
              </h2>
              <div className="mt-5 rounded-2xl bg-stone-50 p-5 text-sm text-slate-600">
                View, create, update, approve, export, and admin-only access
                levels will be configured here when permissions are connected.
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Activity / Security Notes
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Security activity placeholder
            </h2>
            <div className="mt-5 space-y-3">
              {securityNotes.map((item) => (
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
