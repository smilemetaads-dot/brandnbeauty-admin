import Link from "next/link";

import { adminNavGroups } from "@/config/adminNav";

export function AdminSidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-full min-h-screen flex-col">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="text-xl font-semibold text-[#527B86]">
            BrandnBeauty
          </div>
          <div className="mt-1 text-sm text-slate-500">Admin Console</div>
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-5">
          {adminNavGroups.map((group) => (
            <section key={group.label}>
              <h2 className="px-2 text-xs font-semibold uppercase text-slate-400">
                {group.label}
              </h2>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-md px-2 py-2 text-sm font-medium text-slate-600 transition hover:bg-[#527B86]/10 hover:text-[#527B86]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </nav>
      </div>
    </aside>
  );
}
