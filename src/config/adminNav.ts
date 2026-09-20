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
      { label: "Add/Edit Product", href: "/products/edit", status: "Live" },
      { label: "Categories", href: "/categories", status: "Live" },
      { label: "Concerns", href: "/concerns", status: "Live" },
      { label: "Brands", href: "/brands", status: "Live" },
      { label: "Collections", href: "/collections", status: "Live" },
      { label: "Offers & Deals", href: "/offers", status: "Live" },
      { label: "Product Recommendations", href: "/recommendations", status: "Preview" },
      { label: "Inventory", href: "/inventory", status: "Live" },
      { label: "Purchase Stock Entry", href: "/purchases", status: "Partial" },
    ],
  },
  {
    icon: "OR",
    label: "Orders",
    items: [
      { label: "Orders", href: "/orders", status: "Live" },
      { label: "Order Details", href: "/orders/details", status: "Partial" },
      { label: "Packing Desk", href: "/packing", status: "Partial" },
      { label: "Courier & Payments", href: "/courier", status: "Partial" },
      { label: "Checkout & Shipping Rules", href: "/checkout-rules", status: "Preview" },
      { label: "Invoice & Thank You Settings", href: "/invoice-settings", status: "Preview" },
    ],
  },
  {
    icon: "CU",
    label: "Customers",
    items: [
      { label: "Customers", href: "/customers", status: "Live" },
      { label: "Customers Profile", href: "/customers/profile", status: "Partial" },
    ],
  },
  {
    icon: "SU",
    label: "Suppliers",
    items: [
      { label: "Suppliers", href: "/suppliers", status: "Partial" },
      { label: "Suppliers Analytics", href: "/suppliers/analytics", status: "Partial" },
    ],
  },
  {
    icon: "FI",
    label: "Finance",
    items: [
      { label: "Finance Control", href: "/finance", status: "Partial" },
      { label: "Cash & Bank Ledger", href: "/finance/cash-ledger", status: "Partial" },
      { label: "Payable Payments", href: "/finance/payables", status: "Partial" },
      { label: "Month-End Close", href: "/finance/close", status: "Partial" },
      { label: "Profit & Loss", href: "/finance/profit-loss", status: "Partial" },
      { label: "Order Profitability", href: "/finance/profitability", status: "Partial" },
      { label: "Finance Reconciliation", href: "/finance/reconciliation", status: "Partial" },
      { label: "Reports & Insights", href: "/reports", status: "Partial" },
    ],
  },
  {
    icon: "ST",
    label: "Storefront",
    items: [
      { label: "Homepage Manager", href: "/homepage-cms", status: "Live" },
      { label: "Special Offers", href: "/offers", status: "Live" },
      { label: "Banner CMS", href: "/banners", status: "Partial" },
      { label: "Header & Navigation", href: "/navigation", status: "Live" },
      { label: "Footer CMS", href: "/footer", status: "Live" },
      { label: "Reviews & Real Results", href: "/reviews", status: "Live" },
      { label: "Skin Analysis", href: "/skin-analysis", status: "Live" },
    ],
  },
  {
    icon: "GR",
    label: "Growth",
    items: [
      { label: "Marketing Performance", href: "/marketing", status: "Partial" },
      { label: "Tracking & Attribution", href: "/tracking", status: "Partial" },
    ],
  },
  {
    icon: "CO",
    label: "Control",
    items: [
      { label: "Roles & Permissions", href: "/roles", status: "Preview" },
      { label: "Settings", href: "/settings", status: "Live" },
      { label: "Brand & Site Identity", href: "/settings/brand-site-identity", status: "Live" },
    ],
  },
  {
    icon: "AI",
    label: "AI Commerce",
    items: [
      { label: "Control Center", href: "/ai-commerce", status: "Live" },
    ],
  },];


