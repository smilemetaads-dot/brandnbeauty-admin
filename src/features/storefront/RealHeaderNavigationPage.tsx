import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const navItems = [
  "Skincare",
  "Hair Care",
  "Body Care",
  "Makeup",
  "Tools",
  "Fragrance",
  "Men's Care",
  "Mom & Baby",
];

const stats = [
  ["Menu Items", "8", "Top navigation"],
  ["Header Controls", "6", "Preview settings"],
  ["Search Status", "Preview", "Product search"],
  ["Mobile Header", "Ready", "Responsive layout"],
] as const;

const controls = [
  ["Logo", "BrandnBeauty", "Upload / replace storefront logo"],
  ["Search Bar", "Enabled", "Control search placeholder and visibility"],
  ["Wishlist Button", "Enabled", "Show or hide wishlist from header"],
  ["Login Button", "Enabled", "Show customer login button"],
  ["Bag Counter", "Enabled", "Show cart quantity in header"],
  ["Sticky Header", "Enabled", "Keep header visible while scrolling"],
] as const;

const megaMenuBlocks = [
  {
    description: "Primary storefront discovery links for category browsing.",
    label: "Category Navigation",
    links: ["Skincare", "Hair Care", "Body Care", "Makeup"],
  },
  {
    description: "Concern-led shortcuts for problem-based shopping.",
    label: "Concern Links",
    links: ["Acne", "Dark Spots", "Dry Skin", "Hair Fall"],
  },
  {
    description: "Merchandising links for best sellers and offers.",
    label: "Campaign Links",
    links: ["Best Sellers", "New Arrivals", "Offers", "Routine Kits"],
  },
];

const safetyItems = [
  "No header/navigation save, publish, reorder or delete workflow exists on this route yet.",
  "No Supabase writes, SQL, localStorage or storefront sync was added.",
  "Save, preview, menu edit and mobile navigation controls stay disabled until real actions exist.",
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
  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value, helper]) => (
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
                    Manage logo, search, top menu, bag button and storefront
                    navigation order as a Canvas-faithful preview. This route
                    is not connected to a live navigation save action yet.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledButton>Preview</DisabledButton>
                  <DisabledButton primary>Save Navigation</DisabledButton>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-stone-50 p-4">
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-4 shadow-sm">
                  <div className="text-xl font-black text-slate-900">
                    BrandnBeauty
                  </div>
                  <div className="hidden flex-1 justify-center md:flex">
                    <div className="w-full max-w-md rounded-full border border-slate-200 bg-stone-50 px-4 py-2 text-sm text-slate-400">
                      Search products...
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
                      key={item}
                      type="button"
                    >
                      {item}
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
                    Menu groups are displayed as preview-only blocks until a
                    real header/navigation CMS workflow is connected.
                  </p>
                </div>
                <DisabledButton>Reorder Menu</DisabledButton>
              </div>
              <div className="grid gap-4 p-5 lg:grid-cols-3">
                {megaMenuBlocks.map((block) => (
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
                      <Badge tone="warn">Preview</Badge>
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
            </div>
          </div>

          <aside className="space-y-6">
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
                    Drawer Preview
                  </h3>
                </div>
                <Badge tone="warn">Preview</Badge>
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
                        key={item}
                      >
                        {item}
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
