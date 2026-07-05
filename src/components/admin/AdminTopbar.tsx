"use client";

import { usePathname } from "next/navigation";

import { adminNavGroups } from "@/config/adminNav";
import type { AdminNavItem } from "@/config/adminNav";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/banners": "Banner CMS",
  "/brands": "Brands",
  "/business-analytics": "Business Analytics",
  "/categories": "Categories",
  "/checkout-rules": "Checkout & Shipping Rules",
  "/concerns": "Concerns",
  "/courier": "Courier & Payments",
  "/customers": "Customers",
  "/customers/profile": "Customer Profile",
  "/dashboard": "Dashboard",
  "/finance/reconciliation": "Finance Reconciliation",
  "/footer": "Footer",
  "/homepage-cms": "Homepage CMS",
  "/inventory": "Inventory",
  "/invoice-settings": "Invoice & Thank You Settings",
  "/navigation": "Navigation",
  "/offers": "Offers",
  "/orders": "Orders",
  "/orders/details": "Order Details",
  "/packing": "Packing Desk",
  "/products": "Products",
  "/products/edit": "Add/Edit Product",
  "/purchases": "Purchase Stock Entry",
  "/recommendations": "Product Recommendations",
  "/reports": "Reports & Insights",
  "/reviews": "Reviews",
  "/roles": "Roles & Permissions",
  "/settings": "Settings",
  "/suppliers": "Suppliers",
  "/suppliers/analytics": "Supplier Analytics",
  "/suppliers/price-history": "Supplier Price History",
};

const navItems = adminNavGroups
  .flatMap((group) => group.items)
  .sort((a, b) => b.href.length - a.href.length);

function getPageTitle(pathname: string) {
  const exact = pageTitles[pathname];
  if (exact) return exact;

  const match = Object.entries(pageTitles)
    .filter(([href]) => href !== "/" && pathname.startsWith(`${href}/`))
    .sort(([a], [b]) => b.length - a.length)[0];

  return match?.[1] ?? "Admin Console";
}

function getPageStatus(pathname: string): AdminNavItem["status"] | null {
  const match = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return match?.status ?? null;
}

function getStatusTone(status: AdminNavItem["status"] | null) {
  if (status === "Live") return "bg-emerald-50 text-emerald-700";
  if (status === "Partial") return "bg-amber-50 text-amber-700";
  if (status === "Preview") return "bg-slate-100 text-slate-600";
  if (status === "Setup Needed") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

export function AdminTopbar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const status = getPageStatus(pathname);
  const showSetupNotice = status !== null && status !== "Live";

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-[#f7f5f1]/95 backdrop-blur">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <div className="text-sm font-black text-[#5E7F85] lg:hidden">
            BrandnBeauty Admin
          </div>
          <div className="hidden text-xs font-bold uppercase tracking-[0.18em] text-[#5E7F85] lg:block">
            {status === "Live" ? "Live admin workspace" : "Admin setup workspace"}
          </div>
          <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-slate-950">
            {title}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {status ? (
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${getStatusTone(status)}`}>
                {status}
              </span>
            ) : null}
            <p className="text-sm font-medium text-slate-500">
              {showSetupNotice
                ? "This module is available for setup/review. Some actions may be preview-only."
                : "Catalog, orders, storefront, and operations"}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <div className="relative hidden min-w-[18rem] md:block">
            <input
              aria-label="Search admin data"
              className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-10 text-sm font-medium text-slate-500 shadow-sm outline-none placeholder:text-slate-400"
              disabled
              placeholder="Search coming later"
              type="search"
            />
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
              /
            </span>
          </div>

          <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm sm:block">
            <div className="text-sm font-bold text-slate-800">
              {status === "Live" ? "Live Workspace" : "Setup Review"}
            </div>
            <div className="text-xs font-medium text-slate-500">
              {status === "Live" ? "Live actions preserved" : "Preview-safe actions"}
            </div>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5E7F85] text-sm font-black text-white shadow-sm">
            BN
          </div>
        </div>
      </div>
    </header>
  );
}
