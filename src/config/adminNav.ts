export type AdminNavItem = {
  label: string;
  href: string;
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
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    icon: "CA",
    label: "Catalog",
    items: [
      { label: "Products", href: "/products" },
      { label: "Categories", href: "/categories" },
      { label: "Concerns", href: "/concerns" },
      { label: "Brands", href: "/brands" },
      { label: "Offers", href: "/offers" },
      { label: "Inventory", href: "/inventory" },
    ],
  },
  {
    icon: "OR",
    label: "Orders",
    items: [
      { label: "Orders", href: "/orders" },
    ],
  },
  {
    icon: "CU",
    label: "Customers",
    items: [
      { label: "Customers", href: "/customers" },
    ],
  },
  {
    icon: "ST",
    label: "Storefront",
    items: [
      { label: "Homepage CMS", href: "/homepage-cms" },
      { label: "Navigation", href: "/navigation" },
      { label: "Footer", href: "/footer" },
      { label: "Reviews", href: "/reviews" },
    ],
  },
  {
    icon: "CO",
    label: "Control",
    items: [
      { label: "Settings", href: "/settings" },
    ],
  },
];
