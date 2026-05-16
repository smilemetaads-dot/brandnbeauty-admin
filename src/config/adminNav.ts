export type AdminNavItem = {
  label: string;
  href: string;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Business Analytics", href: "/business-analytics" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/products" },
      { label: "Add/Edit Product", href: "/products/edit" },
      { label: "Categories", href: "/categories" },
      { label: "Concerns", href: "/concerns" },
      { label: "Brands", href: "/brands" },
      { label: "Offers & Deals", href: "/offers" },
      { label: "Product Recommendations", href: "/recommendations" },
      { label: "Inventory", href: "/inventory" },
      { label: "Purchase Stock Entry", href: "/purchases" },
    ],
  },
  {
    label: "Orders",
    items: [
      { label: "Orders", href: "/orders" },
      { label: "Order Details", href: "/orders/details" },
      { label: "Packing Desk", href: "/packing" },
      { label: "Courier & Payments", href: "/courier" },
      { label: "Checkout & Shipping Rules", href: "/checkout-rules" },
      { label: "Invoice & Thank You Settings", href: "/invoice-settings" },
    ],
  },
  {
    label: "Customers",
    items: [
      { label: "Customers", href: "/customers" },
      { label: "Customer Profile", href: "/customers/profile" },
    ],
  },
  {
    label: "Suppliers",
    items: [
      { label: "Suppliers", href: "/suppliers" },
      { label: "Supplier Analytics", href: "/suppliers/analytics" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Finance Reconciliation", href: "/finance/reconciliation" },
      { label: "Reports & Insights", href: "/reports" },
    ],
  },
  {
    label: "Storefront",
    items: [
      { label: "Homepage CMS", href: "/homepage-cms" },
      { label: "Banner CMS", href: "/banners" },
      { label: "Header & Navigation", href: "/navigation" },
      { label: "Footer CMS", href: "/footer" },
      { label: "Reviews & Real Results", href: "/reviews" },
    ],
  },
  {
    label: "Control",
    items: [
      { label: "Roles & Permissions", href: "/roles" },
      { label: "Settings", href: "/settings" },
    ],
  },
];
