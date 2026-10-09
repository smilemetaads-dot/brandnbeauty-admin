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
      { label: "Business OS Foundation", href: "/business-os/foundation", status: "Preview" },
      { label: "Business OS Control", href: "/business-os/control", status: "Preview" },
      { label: "Owner Command Center", href: "/business-os/owner-command-center", status: "Preview" },
    ],
  },
  {
    icon: "CA",
    label: "Catalog",
    items: [
      { label: "Products", href: "/products", status: "Live" },
      { label: "Add/Edit Product", href: "/products/edit", status: "Live" },
      { label: "Product Knowledge Readiness", href: "/products/knowledge-readiness", status: "Preview" },
      { label: "Claim & Evidence Readiness", href: "/products/evidence-readiness", status: "Preview" },
      { label: "Content Enrichment", href: "/products/content-enrichment", status: "Preview" },
      { label: "Content Review", href: "/products/content-review", status: "Preview" },
      { label: "Categories", href: "/categories", status: "Live" },
      { label: "Concerns", href: "/concerns", status: "Live" },
      { label: "Brands", href: "/brands", status: "Live" },
      { label: "Collections", href: "/collections", status: "Live" },
      { label: "Offers & Deals", href: "/offers", status: "Live" },
      { label: "Product Recommendations", href: "/recommendations", status: "Preview" },
      { label: "Inventory", href: "/inventory", status: "Live" },
      { label: "Purchase Stock Entry", href: "/purchases", status: "Live" },
    ],
  },
  {
    icon: "OR",
    label: "Orders",
    items: [
      { label: "Orders", href: "/orders", status: "Live" },
      { label: "Order Details", href: "/orders/details", status: "Partial" },
      { label: "Packing Desk", href: "/packing", status: "Live" },
      { label: "Dispatch Control", href: "/dispatch-control", status: "Live" },
      { label: "Delivery Monitoring", href: "/delivery-monitoring", status: "Live" },
      { label: "Courier & Payments", href: "/courier", status: "Live" },
      { label: "Return Receiving", href: "/returns/receiving", status: "Live" },
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
      { label: "Customer Growth & Follow-up", href: "/customers/growth", status: "Preview" },
    ],
  },
  {
    icon: "SU",
    label: "Suppliers",
    items: [
      { label: "Suppliers", href: "/suppliers", status: "Live" },
      { label: "Suppliers Analytics", href: "/suppliers/analytics", status: "Partial" },
      { label: "Procurement & Reorder Exceptions", href: "/procurement/reorder-exceptions", status: "Preview" },
    ],
  },
  {
    icon: "FI",
    label: "Finance",
    items: [
      { label: "Finance Control", href: "/finance", status: "Live" },
      { label: "Finance Exceptions & Profitability", href: "/finance/exceptions", status: "Preview" },
      { label: "Cash & Bank Ledger", href: "/finance/cash-ledger", status: "Partial" },
      { label: "Payable Payments", href: "/finance/payables", status: "Partial" },
      { label: "Month-End Close", href: "/finance/close", status: "Partial" },
      { label: "Profit & Loss", href: "/finance/profit-loss", status: "Partial" },
      { label: "Order Profitability", href: "/finance/profitability", status: "Partial" },
      { label: "Finance Reconciliation", href: "/finance/reconciliation", status: "Live" },
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
      { label: "Growth Control Center", href: "/growth/control-center", status: "Preview" },
      { label: "Content & Creative OS", href: "/growth/content-creative", status: "Preview" },
      { label: "Tracking & Attribution OS", href: "/growth/tracking-attribution", status: "Preview" },
      { label: "Meta Ads Control", href: "/growth/meta-ads", status: "Preview" },
      { label: "Marketing Performance", href: "/growth/marketing-performance", status: "Live" },
      { label: "Tracking & Attribution", href: "/tracking", status: "Live" },
    ],
  },
  {
    icon: "CO",
    label: "Control",
    items: [
      { label: "Launch Control Center", href: "/launch-control", status: "Preview" },
      { label: "Roles & Permissions", href: "/roles", status: "Preview" },
      { label: "Settings", href: "/settings", status: "Live" },
      { label: "Brand & Site Identity", href: "/settings/brand-site-identity", status: "Live" },
    ],
  },
  {
    icon: "AI",
    label: "AI Commerce",
    items: [
      { label: "Control Center", href: "/ai-commerce", status: "Preview" },
      { label: "AI Recommendation Readiness", href: "/ai-commerce/recommendation-readiness", status: "Preview" },
    ],
  },];



