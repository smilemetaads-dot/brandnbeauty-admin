const navItems = [
  "Dashboard",
  "Orders",
  "Products",
  "Customers",
  "Inventory",
  "Banners",
  "Reports",
  "Settings",
];

export default function AdminSidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          BrandnBeauty
        </p>
        <h1 className="mt-2 text-lg font-semibold text-slate-900">Admin Panel</h1>
      </div>

      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-1">
          {navItems.map((item, index) => {
            const isActive = index === 0;

            return (
              <li key={item}>
                <button
                  type="button"
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
