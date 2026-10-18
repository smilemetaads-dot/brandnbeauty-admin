const accessRules: Array<[string, string]> = [
  ["/products/edit", "catalog.edit"],
  ["/products", "catalog.view"],
  ["/categories", "catalog.view"],
  ["/concerns", "catalog.view"],
  ["/brands", "catalog.view"],
  ["/collections", "catalog.view"],
  ["/offers", "catalog.view"],
  ["/recommendations", "catalog.view"],
  ["/inventory", "inventory.view"],
  ["/purchases", "inventory.view"],

  ["/orders/details", "orders.view"],
  ["/orders", "orders.view"],
  ["/packing", "orders.pack"],
  ["/dispatch-control", "orders.view"],
  ["/delivery-monitoring", "orders.view"],
  ["/returns", "orders.view"],
  ["/courier", "courier.view"],
  ["/checkout-rules", "storefront.view"],
  ["/invoice-settings", "storefront.view"],

  ["/customers", "customers.view"],
  ["/suppliers", "suppliers.view"],
  ["/procurement", "suppliers.view"],

  ["/finance", "finance.view"],
  ["/reports", "reports.view"],

  ["/homepage-cms", "storefront.view"],
  ["/banners", "storefront.view"],
  ["/navigation", "storefront.view"],
  ["/footer", "storefront.view"],
  ["/reviews", "storefront.view"],
  ["/skin-analysis", "storefront.view"],

  ["/growth", "growth.view"],
  ["/tracking", "growth.view"],
  ["/marketing", "growth.view"],

  ["/roles", "control.view"],
  ["/settings", "settings.view"],
  ["/business-os", "control.view"],
  ["/ai-commerce", "automation.view"],

  ["/business-analytics", "dashboard.view"],
  ["/dashboard", "dashboard.view"],
  ["/", "dashboard.view"],
];

export function permissionForAdminPath(pathname: string): string {
  const normalized = pathname || "/dashboard";

  const match = accessRules.find(([prefix]) =>
    prefix === "/"
      ? normalized === "/"
      : normalized === prefix || normalized.startsWith(`${prefix}/`),
  );

  return match?.[1] ?? "dashboard.view";
}
