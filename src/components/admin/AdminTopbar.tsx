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
  "/customers/profile": "Customers Profile",
  "/dashboard": "Dashboard",
  "/finance/reconciliation": "Finance Reconciliation",
  "/finance": "Finance Control Center",
  "/finance/cash-ledger": "Cash & Bank Ledger",
  "/finance/payables": "Payable Payments",
  "/finance/close": "Month-End Finance Close",
  "/finance/profitability": "Order Profitability",
  "/finance/profit-loss": "Profit & Loss",
  "/tracking": "Tracking & Attribution",
  "/marketing": "Marketing Performance",
  "/footer": "Footer CMS",
  "/homepage-cms": "Homepage CMS",
  "/inventory": "Inventory",
  "/invoice-settings": "Invoice & Thank You Settings",
  "/navigation": "Header & Navigation",
  "/offers": "Offers & Deals",
  "/orders": "Orders",
  "/orders/details": "Order Details",
  "/packing": "Packing Desk",
  "/products": "Products",
  "/products/edit": "Add/Edit Product",
  "/purchases": "Purchase Stock Entry",
  "/recommendations": "Product Recommendations",
  "/reports": "Reports & Insights",
  "/reviews": "Reviews & Real Results",
  "/roles": "Roles & Permissions",
  "/settings": "Settings",
  "/suppliers": "Suppliers",
  "/suppliers/analytics": "Suppliers Analytics",
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

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-[#f7f5f1]/95 backdrop-blur">
      <div className="flex min-h-[4.5rem] items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <div className="text-sm font-black text-[#5E7F85] lg:hidden">
            BrandnBeauty Admin
          </div>
          <div className="hidden text-xs font-bold uppercase tracking-[0.18em] text-[#5E7F85] lg:block">
            BrandnBeauty Admin
          </div>
          <h1 className="mt-0.5 truncate text-2xl font-black tracking-tight text-slate-950">
            {title}
          </h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            {status ? (
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${getStatusTone(status)}`}>
                {status}
              </span>
            ) : null}
            <p className="text-sm font-medium text-slate-500">Catalog, orders, storefront, and operations</p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5E7F85] text-sm font-black text-white shadow-sm">
            BN
          </div>
        </div>
      </div>
    </header>
  );
}
