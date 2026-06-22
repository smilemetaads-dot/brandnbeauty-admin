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
      { label: "Add/Edit Product", href: "/products/edit" },
      { label: "Categories", href: "/categories" },
      { label: "Concerns", href: "/concerns" },
      { label: "Brands", href: "/brands" },
      { label: "Offers & Deals", href: "/offers" },
      { label: "Inventory", href: "/inventory" },
    ],
  },
  {
    icon: "OR",
    label: "Orders",
    items: [
      { label: "Orders", href: "/orders" },
      { label: "Order Details", href: "/orders/details" },
    ],
  },
  {
    icon: "CU",
    label: "Customers",
    items: [
      { label: "Customers", href: "/customers" },
      { label: "Customer Profile", href: "/customers/profile" },
    ],
  },
  {
    icon: "ST",
    label: "Storefront",
    items: [
      { label: "Homepage CMS", href: "/homepage-cms" },
      { label: "Header & Navigation", href: "/navigation" },
      { label: "Footer CMS", href: "/footer" },
      { label: "Reviews & Real Results", href: "/reviews" },
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
