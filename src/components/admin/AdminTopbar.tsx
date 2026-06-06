"use client";

import { usePathname } from "next/navigation";

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
  "/suppliers/analytics": "Supplier Analytics",
  "/suppliers/price-history": "Supplier Price History",
};

function getPageTitle(pathname: string) {
  const exact = pageTitles[pathname];
  if (exact) return exact;

  const match = Object.entries(pageTitles)
    .filter(([href]) => href !== "/" && pathname.startsWith(`${href}/`))
    .sort(([a], [b]) => b.length - a.length)[0];

  return match?.[1] ?? "Admin Console";
}

export function AdminTopbar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-[#f7f5f1]/95 backdrop-blur">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <div className="text-sm font-black text-[#5E7F85] lg:hidden">
            BrandnBeauty Admin
          </div>
          <div className="hidden text-xs font-bold uppercase tracking-[0.18em] text-[#5E7F85] lg:block">
            Live admin workspace
          </div>
          <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-slate-950">
            {title}
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Catalog, orders, storefront, and operations
          </p>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <div className="relative hidden min-w-[18rem] md:block">
            <input
              aria-label="Search admin data"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-10 text-sm font-medium text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:border-[#5E7F85] focus:ring-4 focus:ring-[#5E7F85]/10"
              placeholder="Search admin data..."
              type="search"
            />
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
              /
            </span>
          </div>

          <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm sm:block">
            <div className="text-sm font-bold text-slate-800">Setup Mode</div>
            <div className="text-xs font-medium text-slate-500">
              Live actions preserved
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
