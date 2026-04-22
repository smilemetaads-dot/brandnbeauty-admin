"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Orders", href: "/orders" },
  { label: "Products", href: "/products" },
  { label: "Customers", href: "/customers" },
  { label: "Inventory", href: "/inventory" },
  { label: "Banners", href: "/banners" },
  { label: "Finance", href: "/finance" },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();

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
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
