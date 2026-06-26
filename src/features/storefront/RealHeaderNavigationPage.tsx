"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

type NavigationItem = {
  children: NavigationItem[];
  href: string;
  label: string;
  sort_order: number;
  status: "active" | "inactive";
};

const GET_NAVIGATION_ENDPOINT = bnbApiUrl("get_navigation.php");
const UPDATE_NAVIGATION_ENDPOINT = bnbApiUrl("update_navigation.php");

const fallbackNavItems: NavigationItem[] = [
  { label: "Skincare", href: "/category/skincare", sort_order: 1, status: "active", children: [] },
  { label: "Hair Care", href: "/category/hair-care", sort_order: 2, status: "active", children: [] },
  { label: "Body Care", href: "/category/body-care", sort_order: 3, status: "active", children: [] },
  { label: "Makeup", href: "/category/makeup", sort_order: 4, status: "active", children: [] },
  { label: "Tools", href: "/category/tools", sort_order: 5, status: "active", children: [] },
  { label: "Fragrance", href: "/category/fragrance", sort_order: 6, status: "active", children: [] },
  { label: "Men's Care", href: "/category/mens-care", sort_order: 7, status: "active", children: [] },
  { label: "Mom & Baby", href: "/category/mom-baby", sort_order: 8, status: "active", children: [] },
];

const defaultNewItem: NavigationItem = {
  children: [],
  href: "/category/new",
  label: "",
  sort_order: fallbackNavItems.length + 1,
  status: "active",
};

const stats = [
  ["Menu Items", "8", "Top navigation"],
  ["Header Controls", "Live", "Menu save enabled"],
  ["Search Status", "Coming later", "Hidden on storefront"],
  ["Mobile Header", "Ready", "Responsive layout"],
] as const;

const controls = [
  ["Logo", "BrandnBeauty", "Static launch logo"],
  ["Search Bar", "Coming later", "Hidden on storefront for launch"],
  ["Wishlist Button", "Coming later", "Customer wishlist is not part of launch"],
  ["Login Button", "Coming later", "Customer accounts are not part of launch"],
  ["Bag Counter", "Enabled", "Show cart quantity in header"],
  ["Sticky Header", "Enabled", "Keep header visible while scrolling"],
] as const;

const safetyItems = [
  "Header menu saves now use the local PHP/MySQL settings table.",
  "Storefront header keeps its static fallback if navigation data is empty or unavailable.",
  "Logo upload, search behavior, wishlist/login visibility and mobile drawer settings are coming later.",
];

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const className = {
    bad: "bg-rose-50 text-rose-700",
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    default: "bg-slate-100 text-slate-700",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function DisabledButton({
  children,
  primary = false,
}: {
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      className={
        primary
          ? "rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500"
          : "rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-400"
      }
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function normalizeNavigationItem(item: unknown): NavigationItem | null {
  if (!item || typeof item !== "object") return null;

  const record = item as Partial<NavigationItem>;
  const label = typeof record.label === "string" ? record.label.trim() : "";
  const href = typeof record.href === "string" && record.href.trim() ? record.href.trim() : "#";
  const status = record.status === "inactive" ? "inactive" : "active";

  if (!label) return null;

  return {
    children: Array.isArray(record.children)
      ? record.children
          .map(normalizeNavigationItem)
          .filter((child): child is NavigationItem => Boolean(child))
      : [],
    href,
    label,
    sort_order: Number(record.sort_order) || 0,
    status,
  };
}

function parseChildLines(value: string): NavigationItem[] {
  return value.split("\n").reduce<NavigationItem[]>((items, line, index) => {
      const [rawLabel, rawHref] = line.split("|").map((part) => part?.trim() ?? "");
      if (!rawLabel) return items;

      items.push({
        children: [],
        href: rawHref || "#",
        label: rawLabel,
        sort_order: index + 1,
        status: "active" as const,
      });

      return items;
    }, []);
}

function formatChildLines(children: NavigationItem[]) {
  return children.map((child) => `${child.label} | ${child.href}`).join("\n");
}

function StatCard({
  helper,
  label,
  value,
}: {
  helper: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-sm font-black text-[#5E7F85]">
          HN
        </span>
      </div>
      <div className="mt-3 text-xs font-semibold text-slate-500">{helper}</div>
    </div>
  );
}

export function RealHeaderNavigationPage() {
  const [navItems, setNavItems] = useState<NavigationItem[]>(fallbackNavItems);
  const [newItem, setNewItem] = useState<NavigationItem>(defaultNewItem);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(GET_NAVIGATION_ENDPOINT, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          navigation?: unknown[];
          success?: boolean;
        };

        if (!response.ok || payload.success === false || !Array.isArray(payload.navigation)) {
          return fallbackNavItems;
        }

        const items = payload.navigation
          .map(normalizeNavigationItem)
          .filter((item): item is NavigationItem => Boolean(item));

        return items.length ? items : fallbackNavItems;
      })
      .catch(() => fallbackNavItems)
      .then((navigation) => {
        setNavItems(navigation);
        setNewItem((current) => ({
          ...current,
          sort_order: navigation.length + 1,
        }));
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("Navigation data could not be loaded.", error);
        }
      });

    return () => controller.abort();
  }, []);

  const saveNavigation = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(UPDATE_NAVIGATION_ENDPOINT, {
        body: JSON.stringify({ navigation: navItems }),
        headers: adminAuthHeaders({
          "Content-Type": "application/json",
        }),
        method: "POST",
      });
      const payload = (await response.json()) as {
        message?: string;
        navigation?: unknown[];
        success?: boolean;
      };

      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || "Navigation could not be saved.");
      }

      if (Array.isArray(payload.navigation)) {
        const normalized = payload.navigation
          .map(normalizeNavigationItem)
          .filter((item): item is NavigationItem => Boolean(item));
        if (normalized.length) {
          setNavItems(normalized);
        }
      }

      setMessage(payload.message || "Navigation saved successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Navigation could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateNavItem = (index: number, patch: Partial<NavigationItem>) => {
    setNavItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    );
  };

  const addNavigationItem = () => {
    const label = newItem.label.trim();
    if (!label) {
      setMessage("Menu label is required before adding an item.");
      return;
    }

    setNavItems((current) => [
      ...current,
      {
        ...newItem,
        href: newItem.href.trim() || "#",
        label,
        sort_order: newItem.sort_order || current.length + 1,
      },
    ]);
    setNewItem({
      ...defaultNewItem,
      sort_order: navItems.length + 2,
    });
    setMessage("Menu item added to draft. Save navigation to publish it.");
  };

  const removeNavigationItem = (index: number) => {
    setNavItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const liveStats = useMemo(
    () =>
      stats.map(([label, value, helper]) =>
        label === "Menu Items"
          ? [label, String(navItems.length), "Saved navigation"]
          : label === "Header Controls"
            ? [label, "Live", "Menu save enabled"]
          : label === "Search Status"
            ? [label, "Coming later", "Hidden on storefront"]
            : [label, value, helper],
      ),
    [navItems.length],
  );
  const liveMegaMenuBlocks = navItems.slice(0, 3).map((item) => ({
    description: item.children.length
      ? `${item.children.length} submenu links saved for this item.`
      : "Top-level navigation item.",
    label: item.label,
    links: item.children.length ? item.children.map((child) => child.label) : [item.href],
  }));

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {liveStats.map(([label, value, helper]) => (
            <StatCard
              helper={helper}
              key={label}
              label={label}
              value={value}
            />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Storefront Header
                  </div>
                  <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Header & Navigation Control
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Manage top menu and storefront navigation order with local
                    PHP/MySQL-backed menu data. Logo upload, search, wishlist,
                    login and mobile drawer settings are coming later.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledButton>Preview coming later</DisabledButton>
                  <button
                    className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={isSaving}
                    onClick={saveNavigation}
                    type="button"
                  >
                    {isSaving ? "Saving..." : "Save Navigation"}
                  </button>
                </div>
              </div>
              {message ? (
                <div className="mt-5 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-600">
                  {message}
                </div>
              ) : null}

              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-stone-50 p-4">
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-4 shadow-sm">
                  <div className="text-xl font-black text-slate-900">
                    BrandnBeauty
                  </div>
                  <div className="hidden flex-1 justify-center md:flex">
                    <div className="w-full max-w-md rounded-full border border-slate-200 bg-stone-50 px-4 py-2 text-sm text-slate-400">
                      Search hidden for launch
                    </div>
                  </div>
                  <div className="rounded-full bg-[#5E7F85] px-4 py-2 text-sm font-bold text-white">
                    Bag 0
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {navItems.map((item) => (
                    <button
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
                      disabled
                      key={item.label}
                      type="button"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Menu Management
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Navigation Builder
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Edit top-level menu rows and optional dropdown children.
                    Save publishes the header menu to the storefront.
                  </p>
                </div>
                <button
                  className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={isSaving}
                  onClick={saveNavigation}
                  type="button"
                >
                  {isSaving ? "Saving..." : "Save Menu"}
                </button>
              </div>
              <div className="grid gap-4 p-5 lg:grid-cols-3">
                {liveMegaMenuBlocks.map((block) => (
                  <div
                    className="rounded-[1.5rem] border border-slate-200 bg-stone-50 p-5"
                    key={block.label}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-950">
                          {block.label}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {block.description}
                        </p>
                      </div>
                      <Badge tone="good">Live</Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {block.links.map((link) => (
                        <span
                          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                          key={link}
                        >
                          {link}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 p-5">
                <div className="overflow-x-auto">
                  <table className="min-w-[900px] text-left text-sm">
                    <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      <tr>
                        {["Label", "Href", "Children", "Sort", "Status", "Action"].map((heading) => (
                          <th className="px-4 py-3" key={heading}>
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {navItems.map((item, index) => (
                        <tr className="border-t border-slate-100" key={`${item.label}-${index}`}>
                          <td className="px-4 py-3">
                            <input
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#5E7F85]"
                              onChange={(event) => updateNavItem(index, { label: event.target.value })}
                              value={item.label}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#5E7F85]"
                              onChange={(event) => updateNavItem(index, { href: event.target.value })}
                              value={item.href}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <textarea
                              className="h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#5E7F85]"
                              onChange={(event) => updateNavItem(index, { children: parseChildLines(event.target.value) })}
                              placeholder="Cleanser | /category/skincare?subcategory=cleanser"
                              value={formatChildLines(item.children)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#5E7F85]"
                              onChange={(event) => updateNavItem(index, { sort_order: Number(event.target.value) || 0 })}
                              type="number"
                              value={item.sort_order}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#5E7F85]"
                              onChange={(event) => updateNavItem(index, { status: event.target.value === "inactive" ? "inactive" : "active" })}
                              value={item.status}
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                              onClick={() => removeNavigationItem(index)}
                              type="button"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Add Menu Item
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                New Link
              </h3>
              <div className="mt-5 space-y-3">
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                  onChange={(event) =>
                    setNewItem((current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                  placeholder="Menu label"
                  value={newItem.label}
                />
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                  onChange={(event) =>
                    setNewItem((current) => ({
                      ...current,
                      href: event.target.value,
                    }))
                  }
                  placeholder="/category/skincare"
                  value={newItem.href}
                />
                <textarea
                  className="h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#5E7F85]"
                  onChange={(event) =>
                    setNewItem((current) => ({
                      ...current,
                      children: parseChildLines(event.target.value),
                    }))
                  }
                  placeholder="Cleanser | /category/skincare?subcategory=cleanser"
                  value={formatChildLines(newItem.children)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                    onChange={(event) =>
                      setNewItem((current) => ({
                        ...current,
                        sort_order: Number(event.target.value) || 0,
                      }))
                    }
                    type="number"
                    value={newItem.sort_order}
                  />
                  <select
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                    onChange={(event) =>
                      setNewItem((current) => ({
                        ...current,
                        status: event.target.value === "inactive" ? "inactive" : "active",
                      }))
                    }
                    value={newItem.status}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <button
                  className="w-full rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white"
                  onClick={addNavigationItem}
                  type="button"
                >
                  Add To Draft
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Header Settings
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Controls
              </h3>
              <div className="mt-5 space-y-3">
                {controls.map(([label, status, description]) => (
                  <div className="rounded-2xl bg-stone-50 p-4" key={label}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-bold text-slate-900">{label}</div>
                      <Badge tone="brand">{status}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Mobile Header
                  </div>
                  <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Drawer Coming Later
                  </h3>
                </div>
                <Badge tone="warn">Coming later</Badge>
              </div>
              <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-stone-50 p-4">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-black text-slate-950">BrandnBeauty</div>
                    <div className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-bold text-[#5E7F85]">
                      Menu
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {navItems.slice(0, 5).map((item) => (
                      <div
                        className="rounded-xl bg-stone-50 px-3 py-2 text-xs font-semibold text-slate-600"
                        key={item.label}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                Navigation CMS Safety Note
              </div>
              <div className="mt-3 space-y-2">
                {safetyItems.map((item) => (
                  <div
                    className="rounded-2xl bg-white/60 px-4 py-3 text-sm font-semibold leading-6 text-amber-800"
                    key={item}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
