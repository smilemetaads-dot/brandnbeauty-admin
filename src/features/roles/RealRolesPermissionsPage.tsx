export default function RealRolesPermissionsPage() {
  const stats = [
    { label: "Total Roles", value: "6", sub: "Permission groups created" },
    { label: "Active Staff", value: "7", sub: "Admin panel users" },
    {
      label: "Restricted Actions",
      value: "12",
      sub: "Require high-level approval",
    },
    { label: "Pending Reviews", value: "2", sub: "Role access needs audit" },
  ];

  const roles = [
    {
      role: "Super Admin",
      users: 1,
      orders: true,
      products: true,
      customers: true,
      finance: true,
      settings: true,
      integrations: true,
      notes: "Full control",
    },
    {
      role: "Operations Admin",
      users: 2,
      orders: true,
      products: true,
      customers: true,
      finance: false,
      settings: false,
      integrations: false,
      notes: "Daily operations",
    },
    {
      role: "Finance Admin",
      users: 2,
      orders: true,
      products: false,
      customers: true,
      finance: true,
      settings: false,
      integrations: false,
      notes: "Payments and reconciliation",
    },
    {
      role: "Support Agent",
      users: 2,
      orders: true,
      products: false,
      customers: true,
      finance: false,
      settings: false,
      integrations: false,
      notes: "Support and notes only",
    },
  ];

  const staff = [
    { name: "Ismail", role: "Super Admin", lastSeen: "Now", status: "Active" },
    {
      name: "Rafi",
      role: "Operations Admin",
      lastSeen: "12 min ago",
      status: "Active",
    },
    {
      name: "Nila",
      role: "Operations Admin",
      lastSeen: "25 min ago",
      status: "Active",
    },
    {
      name: "Mitu",
      role: "Finance Admin",
      lastSeen: "1 hr ago",
      status: "Active",
    },
    {
      name: "Tanvir",
      role: "Support Agent",
      lastSeen: "Yesterday",
      status: "Review",
    },
  ];

  const protectedActions = [
    "Change payment settings",
    "Edit courier API keys",
    "Close finance reconciliation with difference",
    "Disable checkout",
    "Delete product permanently",
  ];

  const renderAccess = (enabled: boolean) => (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        enabled ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-slate-500"
      }`}
    >
      {enabled ? "Allowed" : "Blocked"}
    </span>
  );

  return (
    <div className="min-h-screen space-y-6 bg-stone-50 p-6 text-slate-900">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm text-slate-500">
            Admin / Roles & Permissions
          </div>
          <h1 className="text-3xl font-bold">
            Admin Role & Permission Matrix
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Control who can access orders, finance, settings and sensitive
            system actions
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm">
            Export Access Matrix
          </button>
          <button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm">
            Create Role
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <div className="font-semibold">Permission Control Note</div>
        <div className="mt-1">
          Finance, settings and integration controls should never be given to
          general support staff. Sensitive actions should require approval or
          Super Admin access.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="text-sm font-medium text-slate-500">{item.label}</div>
            <div className="mt-3 text-2xl font-bold tracking-tight">
              {item.value}
            </div>
            <div className="mt-2 text-xs text-slate-500">{item.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Role Matrix
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Access by Role
              </h2>
            </div>
            <button className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-stone-50">
              Open Permission Editor
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Users</th>
                    <th className="px-4 py-3 font-medium">Orders</th>
                    <th className="px-4 py-3 font-medium">Products</th>
                    <th className="px-4 py-3 font-medium">Customers</th>
                    <th className="px-4 py-3 font-medium">Finance</th>
                    <th className="px-4 py-3 font-medium">Settings</th>
                    <th className="px-4 py-3 font-medium">Integrations</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((item) => (
                    <tr key={item.role} className="border-t border-slate-100 bg-white">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {item.role}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{item.users}</td>
                      <td className="px-4 py-3">{renderAccess(item.orders)}</td>
                      <td className="px-4 py-3">{renderAccess(item.products)}</td>
                      <td className="px-4 py-3">{renderAccess(item.customers)}</td>
                      <td className="px-4 py-3">{renderAccess(item.finance)}</td>
                      <td className="px-4 py-3">{renderAccess(item.settings)}</td>
                      <td className="px-4 py-3">
                        {renderAccess(item.integrations)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Protected Actions
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              High-Risk Controls
            </h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              {protectedActions.map((action) => (
                <div key={action} className="rounded-2xl bg-stone-50 p-4">
                  {action}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Policy</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Approval Rules
            </h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-stone-50 p-4">
                Only Super Admin can update system-wide payment settings.
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                Finance difference closure should need Finance Admin or Super
                Admin approval.
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                API key change should always create audit log entry.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Staff Access Review
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Current Admin Users
              </h2>
            </div>
            <button className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-stone-50">
              Invite Staff
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Last Seen</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((item) => (
                  <tr key={item.name} className="border-t border-slate-100 bg-white">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.role}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.lastSeen}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "Active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Quick Actions
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Permission Controls
            </h2>
            <div className="mt-5 grid gap-3">
              {[
                "Create New Role",
                "Clone Existing Role",
                "Reset Staff Access",
                "Open Audit Log",
                "Review High-Risk Permissions",
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
              Audit Note
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Security Reminder
            </h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-stone-50 p-4">
                Support roles should not access payment settings.
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                Operations team should not edit courier API credentials directly.
              </div>
              <div className="rounded-2xl bg-amber-50 p-4 text-amber-800">
                Every permission change should be logged with who changed it and
                when.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
