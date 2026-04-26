"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type SidebarLink = {
  label: string;
  href?: string;
};

type SidebarGroup = {
  label: string;
  items: SidebarLink[];
};

const navGroups: SidebarGroup[] = [
  {
    label: "Dashboard",
    items: [{ label: "Dashboard", href: "/" }],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders", href: "/orders" },
      { label: "Order Details", href: "/orders/details" },
      { label: "Courier & Payment Tracking" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/products" },
      { label: "Add/Edit Product", href: "/products/edit" },
      { label: "Banner CMS", href: "/banners" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { label: "Stock Movement", href: "/inventory" },
      { label: "Purchase Stock Entry" },
    ],
  },
  {
    label: "Customers",
    items: [
      { label: "Customer Management", href: "/customers" },
      { label: "Customer Profile", href: "/customers/profile" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Finance Overview", href: "/finance" },
      { label: "Reconciliation Details" },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "Business Analytics", href: "/reports" },
      { label: "Supplier Analytics" },
    ],
  },
  {
    label: "Suppliers",
    items: [
      { label: "Supplier Profiles" },
      { label: "Supplier Purchase Stock" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/settings" },
      { label: "Admin Roles & Permissions" },
    ],
  },
] as const;

function isRouteActive(pathname: string, href: string) {
  return pathname === href;
}

function getActiveGroupLabel(pathname: string) {
  return (
    navGroups.find((group) =>
      group.items.some((item) =>
        item.href ? isRouteActive(pathname, item.href) : false
      )
    )?.label ?? null
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(() =>
    getActiveGroupLabel(pathname)
  );

  useEffect(() => {
    setOpenGroup(getActiveGroupLabel(pathname));
  }, [pathname]);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          BrandnBeauty
        </p>
        <h1 className="mt-2 text-lg font-semibold text-slate-900">Admin Panel</h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <ul className="space-y-2">
          {navGroups.map((group) => {
            const isDirectLinkGroup =
              group.items.length === 1 && group.items[0]?.href;
            const groupIsActive = group.label === getActiveGroupLabel(pathname);
            const groupIsOpen = openGroup === group.label;

            if (isDirectLinkGroup) {
              const item = group.items[0];
              const isActive = item.href
                ? isRouteActive(pathname, item.href)
                : false;

              return (
                <li key={group.label}>
                  <Link
                    href={item.href ?? "/"}
                    className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {group.label}
                  </Link>
                </li>
              );
            }

            return (
              <li key={group.label}>
                <button
                  type="button"
                  aria-expanded={groupIsOpen}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    groupIsActive || groupIsOpen
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  onClick={() =>
                    setOpenGroup((currentGroup) =>
                      currentGroup === group.label ? null : group.label
                    )
                  }
                >
                  <span>{group.label}</span>
                  <span className="text-xs text-slate-400">
                    {groupIsOpen ? "-" : "+"}
                  </span>
                </button>

                {groupIsOpen ? (
                  <ul className="mt-1 space-y-1 pl-3">
                    {group.items.map((item) => {
                      const isActive = item.href
                        ? isRouteActive(pathname, item.href)
                        : false;

                      return (
                        <li key={`${group.label}-${item.label}`}>
                          {item.href ? (
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
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="flex w-full cursor-not-allowed items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-400"
                            >
                              <span>{item.label}</span>
                              <span className="text-[0.62rem] uppercase tracking-[0.14em]">
                                Soon
                              </span>
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
