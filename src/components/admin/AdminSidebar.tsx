"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminNavGroups } from "@/config/adminNav";

const navHrefs = adminNavGroups
  .flatMap((group) => group.items.map((item) => item.href))
  .sort((a, b) => b.length - a.length);

function getActiveHref(pathname: string) {
  if (pathname === "/") return "/dashboard";

  return (
    navHrefs.find(
      (href) => pathname === href || pathname.startsWith(`${href}/`),
    ) ?? null
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const activeHref = getActiveHref(pathname);

  return (
    <aside className="hidden w-[19rem] shrink-0 bg-[#f7f5f1] p-4 lg:block">
      <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5E7F85] text-sm font-black tracking-tight text-white shadow-sm transition group-hover:-translate-y-0.5">
              BN
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-slate-950">
                BrandnBeauty
              </div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5E7F85]">
                Admin Console
              </div>
            </div>
          </Link>

          <div className="mt-5 rounded-2xl border border-[#5E7F85]/15 bg-[#5E7F85]/5 px-4 py-3">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#5E7F85]">
              Live Ops
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-700">
              Catalog, orders, stock
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
          {adminNavGroups.map((group) => (
            <section key={group.label}>
              <div className="mb-2 flex items-center gap-2 px-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-stone-100 text-[0.68rem] font-black text-[#5E7F85]">
                  {group.icon}
                </span>
                <h2 className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  {group.label}
                </h2>
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activeHref === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                        isActive
                          ? "bg-[#5E7F85] text-white shadow-sm"
                          : "text-slate-600 hover:bg-stone-50 hover:text-[#5E7F85]"
                      }`}
                    >
                      <span>{item.label}</span>
                      <span
                        className={`h-1.5 w-1.5 rounded-full transition ${
                          isActive
                            ? "bg-white"
                            : "bg-slate-200 group-hover:bg-[#5E7F85]"
                        }`}
                      />
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="rounded-[1.4rem] bg-stone-50 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Safe Mode
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-700">
              Live data actions preserved
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
