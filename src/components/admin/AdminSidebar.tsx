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

function getActiveGroupLabel(activeHref: string | null) {
  return (
    adminNavGroups.find((group) =>
      group.items.some((item) => item.href === activeHref),
    )?.label ?? adminNavGroups[0]?.label
  );
}

function GroupIcon({ label }: { label: string }) {
  const commonProps = {
    "aria-hidden": true,
    className: "h-4 w-4",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  switch (label) {
    case "Catalog":
      return (
        <svg {...commonProps}>
          <path d="M5 5h14v14H5z" />
          <path d="M9 9h6M9 13h6M9 17h3" />
        </svg>
      );
    case "Orders":
      return (
        <svg {...commonProps}>
          <path d="M8 6h12M8 12h12M8 18h12" />
          <path d="M4 6h.01M4 12h.01M4 18h.01" />
        </svg>
      );
    case "Customers":
      return (
        <svg {...commonProps}>
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
          <path d="M5 21a7 7 0 0 1 14 0" />
        </svg>
      );
    case "Suppliers":
      return (
        <svg {...commonProps}>
          <path d="M7 7h10M7 12h10M7 17h7" />
          <path d="M4 5v14M20 5v14" />
        </svg>
      );
    case "Finance":
      return (
        <svg {...commonProps}>
          <path d="M7 5h7.5a3.5 3.5 0 0 1 0 7H7" />
          <path d="M7 5v14M7 12h8M11 19h6" />
        </svg>
      );
    case "Storefront":
      return (
        <svg {...commonProps}>
          <path d="M4 10h16" />
          <path d="M5 10l1.5-5h11L19 10" />
          <path d="M6 10v9h12v-9" />
          <path d="M9 14h6" />
        </svg>
      );
    case "Control":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <path d="M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z" />
        </svg>
      );
  }
}

export function AdminSidebar() {
  const pathname = usePathname();
  const activeHref = getActiveHref(pathname);
  const activeGroupLabel = getActiveGroupLabel(activeHref);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[20rem] bg-[#f7f5f1] px-5 py-6 lg:block">
      <div className="flex h-full flex-col gap-5">
        <Link
          href="/dashboard"
          className="group flex min-h-[9.5rem] flex-col justify-between rounded-[2rem] bg-[#41696f] p-5 text-white shadow-[0_18px_40px_rgba(65,105,111,0.22)] transition hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
                Admin Panel
              </div>
              <div className="mt-3 text-2xl font-black tracking-tight">
                BrandnBeauty
              </div>
            </div>
            <div className="grid h-11 w-11 shrink-0 grid-cols-2 gap-1 rounded-2xl bg-white/14 p-2.5 ring-1 ring-white/20">
              <span className="rounded bg-white/90" />
              <span className="rounded bg-white/60" />
              <span className="rounded bg-white/60" />
              <span className="rounded bg-white/90" />
            </div>
          </div>
          <div className="text-sm font-semibold text-white/78">
            Clean control room
          </div>
        </Link>

        <nav className="min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white px-4 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="mb-4 px-2 text-[0.68rem] font-black uppercase tracking-[0.24em] text-slate-400">
            Menu
          </div>
          <div className="h-full space-y-2 overflow-y-auto pb-7 pr-1">
            {adminNavGroups.map((group) => {
              const isGroupActive = activeGroupLabel === group.label;

              return (
                <details
                  className="group rounded-3xl"
                  open={isGroupActive || undefined}
                  key={`${group.label}-${isGroupActive ? "active" : "idle"}`}
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl px-2.5 py-2.5 text-sm font-black text-slate-800 outline-none transition hover:bg-stone-50 [&::-webkit-details-marker]:hidden">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-[0.66rem] font-black ${
                        isGroupActive
                          ? "bg-[#5E7F85]/12 text-[#41696f]"
                        : "bg-stone-100 text-slate-400"
                      }`}
                    >
                      <GroupIcon label={group.label} />
                    </span>
                    <span className="flex-1">{group.label}</span>
                    <span className="text-lg leading-none text-slate-300 group-open:hidden">
                      +
                    </span>
                    <span className="hidden text-lg leading-none text-[#5E7F85] group-open:inline">
                      -
                    </span>
                  </summary>

                  <div className="mt-1 space-y-1 pb-2 pl-11">
                    {group.items.map((item) => {
                      const isActive = activeHref === item.href;

                      return (
                        <Link
                          className={`flex min-h-10 items-center rounded-2xl px-4 text-sm font-bold transition ${
                            isActive
                              ? "bg-[#5E7F85] text-white shadow-[0_12px_26px_rgba(94,127,133,0.22)]"
                              : "text-slate-500 hover:bg-stone-50 hover:text-[#41696f]"
                          }`}
                          href={item.href}
                          key={item.href}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </nav>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5E7F85] text-sm font-black text-white shadow-sm">
              IC
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-black text-slate-900">
                Ismail Chowdhury
              </div>
              <div className="mt-0.5 text-xs font-bold text-slate-400">
                Super Admin
              </div>
            </div>
          </div>
          <button
            className="mt-4 w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm font-black text-slate-500"
            disabled
            type="button"
          >
            View Storefront
          </button>
        </div>
      </div>
    </aside>
  );
}
