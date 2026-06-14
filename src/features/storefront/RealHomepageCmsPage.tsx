import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const stats = [
  {
    helper: "Preview surface",
    label: "Homepage module",
    value: "Not connected",
  },
  {
    helper: "Canvas structure",
    label: "Merchandising areas",
    value: "8",
  },
  {
    helper: "Featured products",
    label: "Catalog blocks",
    value: "4",
  },
  {
    helper: "No live write action",
    label: "Publish safety",
    value: "Preview",
  },
];

const sectionBlocks = [
  {
    description: "Hero headline, campaign message, primary CTA and supporting trust strip.",
    label: "Hero section",
    placement: "Top",
    status: "Preview only",
  },
  {
    description: "Main category shortcuts for skincare, hair care, body care and makeup.",
    label: "Shop by category",
    placement: "Discovery",
    status: "Preview only",
  },
  {
    description: "Product cards for homepage merchandising and manual highlight slots.",
    label: "Featured products",
    placement: "Merchandising",
    status: "Preview only",
  },
  {
    description: "Routine-led block for cleanser, treatment, moisturizer and sunscreen sequence.",
    label: "Routine builder",
    placement: "Education",
    status: "Preview only",
  },
  {
    description: "Campaign row for homepage-visible deals and bundle promotions.",
    label: "Promotional banner",
    placement: "Campaign",
    status: "Preview only",
  },
];

const productRows = [
  ["Barrier Calm Serum", "BrandnBeauty", "Tk 990", "Hero / Featured", "Preview"],
  ["Acne Balance Facewash", "BrandnBeauty", "Tk 690", "Routine Builder", "Preview"],
  ["Hydra Gel Moisturizer", "BrandnBeauty", "Tk 850", "Editor Picks", "Preview"],
  ["Daily Sun Gel", "BrandnBeauty", "Tk 760", "Best Sellers", "Preview"],
];

const previewProducts = [
  "Barrier Calm Serum",
  "Acne Balance Facewash",
  "Hydra Gel Moisturizer",
  "Daily Sun Gel",
];

const safetyItems = [
  "No homepage CMS save action exists on this route yet.",
  "No Supabase writes, SQL, localStorage or storefront sync was added.",
  "Save, publish, reorder and preview controls stay disabled until real actions exist.",
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
          HC
        </span>
      </div>
      <div className="mt-3 text-xs font-semibold text-slate-500">{helper}</div>
    </div>
  );
}

function SectionStatusRow({
  description,
  label,
  placement,
  status,
}: {
  description: string;
  label: string;
  placement: string;
  status: string;
}) {
  return (
    <div className="grid gap-4 border-t border-slate-100 px-5 py-4 md:grid-cols-[1.2fr_0.8fr_120px] md:items-center">
      <div>
        <div className="font-bold text-slate-900">{label}</div>
        <div className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </div>
      </div>
      <div className="text-sm font-semibold text-slate-600">{placement}</div>
      <Badge tone="warn">{status}</Badge>
    </div>
  );
}

export function RealHomepageCmsPage() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-6 xl:grid-cols-[1.25fr_0.75fr] xl:items-stretch">
            <div className="rounded-[1.75rem] bg-[#5E7F85] p-6 text-white">
              <div className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">
                Storefront CMS
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight">
                Homepage CMS
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/80">
                Canvas-style control room for homepage hero, discovery blocks,
                featured products, routine sections and promotional slots. This
                route is still preview-only because no live Homepage CMS action
                is connected here yet.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge tone="default">Preview only</Badge>
                <Badge tone="default">Admin shell preserved</Badge>
                <Badge tone="default">No storefront writes</Badge>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-stone-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Publish Status
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Not connected yet
                  </h2>
                </div>
                <Badge tone="warn">Safe preview</Badge>
              </div>
              <div className="mt-5 space-y-3 text-sm font-semibold text-slate-600">
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  Current route previously rendered the shared placeholder.
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  Production save/publish controls remain disabled.
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <DisabledButton primary>Save Homepage</DisabledButton>
                <DisabledButton>Preview Storefront</DisabledButton>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Homepage Sections
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Storefront Layout Control
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Section order and controls mirror the intended Canvas CMS
                    surface while staying non-mutating.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledButton>Reorder Sections</DisabledButton>
                  <DisabledButton primary>Publish Changes</DisabledButton>
                </div>
              </div>
              <div>
                {sectionBlocks.map((item) => (
                  <SectionStatusRow key={item.label} {...item} />
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Product Management
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Homepage Product Slots
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">Catalog</Badge>
                  <DisabledButton>Filter</DisabledButton>
                  <DisabledButton>Export</DisabledButton>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-stone-50 text-slate-500">
                    <tr>
                      {["Product", "Brand", "Price", "Homepage Slot", "Status"].map(
                        (head) => (
                          <th key={head} className="px-5 py-4 font-medium">
                            {head}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {productRows.map((row) => (
                      <tr
                        className="border-t border-slate-100 bg-white transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85]"
                        key={row[0]}
                      >
                        {row.map((cell, index) => (
                          <td className="px-5 py-4 text-slate-700" key={cell}>
                            {index === row.length - 1 ? (
                              <Badge tone="warn">{cell}</Badge>
                            ) : (
                              <span
                                className={
                                  index === 0 ? "font-semibold text-slate-900" : ""
                                }
                              >
                                {cell}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Storefront Preview
                  </div>
                  <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Homepage Skeleton
                  </h3>
                </div>
                <Badge tone="warn">Preview</Badge>
              </div>
              <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-stone-50">
                <div className="bg-[#5E7F85] p-5 text-white">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                    Hero banner
                  </div>
                  <div className="mt-2 text-2xl font-black">
                    Glow routine starts here
                  </div>
                  <div className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                    Shop Now
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4">
                  {previewProducts.map((product) => (
                    <div
                      className="rounded-2xl bg-white p-3 shadow-sm"
                      key={product}
                    >
                      <div className="flex aspect-square items-center justify-center rounded-xl bg-stone-100 text-xs font-bold text-slate-400">
                        IMG
                      </div>
                      <div className="mt-2 text-xs font-bold leading-5 text-slate-800">
                        {product}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Homepage Controls
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Disabled Until Connected
              </h3>
              <div className="mt-5 space-y-3">
                {[
                  "Hero editor",
                  "Featured product picker",
                  "Category block mapping",
                  "Banner schedule",
                  "Homepage publish",
                ].map((item) => (
                  <div
                    className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold"
                    key={item}
                  >
                    <span className="text-slate-700">{item}</span>
                    <Badge tone="default">Off</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                CMS Safety Note
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
