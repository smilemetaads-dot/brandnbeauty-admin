import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const stats = [
  {
    helper: "Hero, campaign and category slots",
    label: "Banner slots",
    value: "6",
  },
  {
    helper: "Current route has no write action",
    label: "Publish status",
    value: "Preview",
  },
  {
    helper: "Visual source recovered from Canvas",
    label: "Canvas source",
    value: "Found",
  },
  {
    helper: "No frontend banner logic changed",
    label: "Storefront sync",
    value: "Off",
  },
];

const bannerRows = [
  {
    cta: "Shop Routine",
    placement: "Homepage hero slider",
    schedule: "Always visible",
    status: "Preview only",
    title: "Glow Routine Campaign",
  },
  {
    cta: "View Offers",
    placement: "Campaign strip",
    schedule: "Weekend slot",
    status: "Preview only",
    title: "Buy 1 Get 1 Facewash Deal",
  },
  {
    cta: "Shop Serums",
    placement: "Mid-page feature",
    schedule: "June campaign",
    status: "Preview only",
    title: "Barrier Repair Favorites",
  },
  {
    cta: "Browse SPF",
    placement: "Category banner",
    schedule: "Daytime block",
    status: "Preview only",
    title: "Daily Sunscreen Edit",
  },
];

const slotCards = [
  {
    copy: "Large hero image, headline, subheadline and primary CTA.",
    label: "Hero Slider",
    size: "Desktop + mobile",
  },
  {
    copy: "Thin promotional strip for offer urgency and free delivery notes.",
    label: "Top Campaign Strip",
    size: "Full width",
  },
  {
    copy: "Two-up editorial cards for routines, concerns and seasonal drops.",
    label: "Routine Banners",
    size: "Two columns",
  },
  {
    copy: "Category image tiles for skin, hair, body and makeup discovery.",
    label: "Category Slots",
    size: "Grid",
  },
];

const safetyItems = [
  "No banner save, publish, reorder or delete workflow exists on this route yet.",
  "No Supabase writes, SQL, localStorage or storefront sync was added.",
  "Create, preview, schedule and publish controls stay disabled until real actions exist.",
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
          BC
        </span>
      </div>
      <div className="mt-3 text-xs font-semibold text-slate-500">{helper}</div>
    </div>
  );
}

function SlotCard({
  copy,
  label,
  size,
}: {
  copy: string;
  label: string;
  size: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-bold text-slate-950">{label}</div>
          <div className="mt-2 text-sm leading-6 text-slate-500">{copy}</div>
        </div>
        <Badge tone="warn">Preview</Badge>
      </div>
      <div className="mt-4 rounded-2xl bg-stone-50 px-4 py-3 text-xs font-semibold text-slate-600">
        {size}
      </div>
    </div>
  );
}

export function RealBannerCmsPage() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-stretch">
            <div className="rounded-[1.75rem] bg-[#5E7F85] p-6 text-white">
              <div className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">
                Storefront CMS
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight">
                Banner CMS
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/80">
                Canvas-style workspace for hero banners, campaign strips,
                image slots, CTA copy, schedules and storefront preview. This
                page stays preview-only because the current Banner CMS route
                has no connected save or publish action.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge tone="default">Preview only</Badge>
                <Badge tone="default">Create Banner disabled</Badge>
                <Badge tone="default">No storefront writes</Badge>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-stone-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Banner Command Bar
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Create Banner / Preview
                  </h2>
                </div>
                <Badge tone="warn">Not connected</Badge>
              </div>
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 shadow-sm">
                Search banners...
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <DisabledButton>Preview</DisabledButton>
                <DisabledButton primary>Create Banner</DisabledButton>
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
            <div className="grid gap-4 md:grid-cols-2">
              {slotCards.map((slot) => (
                <SlotCard key={slot.label} {...slot} />
              ))}
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Banner Management
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Banner List
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Banner rows mirror the Canvas table/card language while
                    avoiding fake edit, publish or delete behavior.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledButton>Filter</DisabledButton>
                  <DisabledButton>Export</DisabledButton>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-stone-50 text-slate-500">
                    <tr>
                      {[
                        "Banner",
                        "Placement",
                        "CTA",
                        "Schedule",
                        "Status",
                        "Action",
                      ].map((head) => (
                        <th className="px-5 py-4 font-medium" key={head}>
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bannerRows.map((row) => (
                      <tr
                        className="border-t border-slate-100 bg-white transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85]"
                        key={row.title}
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-950">
                            {row.title}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {row.placement}
                        </td>
                        <td className="px-5 py-4 text-slate-700">{row.cta}</td>
                        <td className="px-5 py-4 text-slate-700">
                          {row.schedule}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone="warn">{row.status}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400"
                              disabled
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400"
                              disabled
                              type="button"
                            >
                              View
                            </button>
                          </div>
                        </td>
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
                    Hero Banner
                  </h3>
                </div>
                <Badge tone="warn">Preview</Badge>
              </div>
              <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-stone-50">
                <div className="bg-[#5E7F85] p-5 text-white">
                  <div className="flex h-36 items-center justify-center rounded-[1.25rem] bg-white/15 text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                    Banner Image
                  </div>
                  <div className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                    Campaign banner
                  </div>
                  <div className="mt-2 text-2xl font-black">
                    Glow routine offer
                  </div>
                  <div className="mt-2 text-sm font-medium text-white/80">
                    CTA, subtitle and image placement preview.
                  </div>
                  <div className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                    Shop Now
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Banner Fields
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Disabled Until Connected
              </h3>
              <div className="mt-5 space-y-3">
                {[
                  "Title and subtitle",
                  "CTA label and link",
                  "Desktop image",
                  "Mobile image",
                  "Schedule window",
                  "Publish visibility",
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
                Banner CMS Safety Note
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
