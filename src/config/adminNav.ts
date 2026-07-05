export type AdminNavItem = {
  label: string;
  href: string;
  status: "Live" | "Partial" | "Preview" | "Setup Needed";
};

export type AdminNavGroup = {
  icon: string;
  label: string;
  items: AdminNavItem[];
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    icon: "OV",
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", status: "Live" },
      { label: "Business Analytics", href: "/business-analytics", status: "Preview" },
    ],
  },
  {
    icon: "CA",
    label: "Catalog",
    items: [
      { label: "Products", href: "/products", status: "Live" },
      { label: "Add Product", href: "/products/edit", status: "Live" },
      { label: "Categories", href: "/categories", status: "Live" },
      { label: "Concerns", href: "/concerns", status: "Live" },
      { label: "Brands", href: "/brands", status: "Live" },
      { label: "Offers", href: "/offers", status: "Live" },
      { label: "Inventory", href: "/inventory", status: "Live" },
      { label: "Purchase Stock Entry", href: "/purchases", status: "Partial" },
      { label: "Product Recommendations", href: "/recommendations", status: "Preview" },
    ],
  },
  {
    icon: "SU",
    label: "Suppliers",
    items: [
      { label: "Suppliers", href: "/suppliers", status: "Partial" },
      { label: "Supplier Analytics", href: "/suppliers/analytics", status: "Partial" },
      { label: "Supplier Price History", href: "/suppliers/price-history", status: "Preview" },
    ],
  },
  {
    icon: "OR",
    label: "Orders & Ops",
    items: [
      { label: "Orders", href: "/orders", status: "Live" },
      { label: "Courier & Payments", href: "/courier", status: "Partial" },
      { label: "Packing Desk", href: "/packing", status: "Partial" },
      { label: "Checkout & Shipping Rules", href: "/checkout-rules", status: "Preview" },
      { label: "Invoice & Thank You Settings", href: "/invoice-settings", status: "Preview" },
    ],
  },
  {
    icon: "CU",
    label: "Customers",
    items: [
      { label: "Customers", href: "/customers", status: "Live" },
    ],
  },
  {
    icon: "FI",
    label: "Reports & Finance",
    items: [
      { label: "Reports & Insights", href: "/reports", status: "Partial" },
      { label: "Finance Reconciliation", href: "/finance/reconciliation", status: "Partial" },
    ],
  },
  {
    icon: "ST",
    label: "Storefront",
    items: [
      { label: "Homepage CMS", href: "/homepage-cms", status: "Live" },
      { label: "Banner CMS", href: "/banners", status: "Partial" },
      { label: "Header & Navigation", href: "/navigation", status: "Live" },
      { label: "Footer CMS", href: "/footer", status: "Live" },
      { label: "Reviews & Real Results", href: "/reviews", status: "Live" },
    ],
  },
  {
    icon: "CO",
    label: "Control",
    items: [
      { label: "Roles & Permissions", href: "/roles", status: "Preview" },
      { label: "Settings", href: "/settings", status: "Live" },
    ],
  },
];
