import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const stats = [
  ["Total Results", "48", "UGC + reviews"],
  ["Approved", "36", "Visible storefront"],
  ["Pending Review", "8", "Need approval"],
  ["Video Reviews", "12", "Reels ready"],
] as const;

const results = [
  {
    product: "Barrier Calm Serum",
    status: "Approved",
    title: "7 Days Glow",
    type: "Before / After",
  },
  {
    product: "Acne Balance Facewash",
    status: "Pending",
    title: "Acne Result",
    type: "Customer Review",
  },
  {
    product: "Routine Bundle",
    status: "Approved",
    title: "Real Routine",
    type: "Reels Video",
  },
  {
    product: "Hydra Gel Moisturizer",
    status: "Draft",
    title: "Hydration Review",
    type: "Image Review",
  },
] as const;

const galleryCards = [
  {
    label: "Before / After",
    note: "Visible result image pair",
    product: "Barrier Calm Serum",
  },
  {
    label: "Customer Quote",
    note: "Short testimonial block",
    product: "Acne Balance Facewash",
  },
  {
    label: "Routine Reel",
    note: "Video result preview",
    product: "Routine Bundle",
  },
] as const;

const safetyItems = [
  "No review/result save, approve, delete or publish workflow exists on this route yet.",
  "No Supabase writes, SQL, localStorage or storefront sync was added.",
  "Add, save, review and edit controls stay disabled until real actions exist.",
] as const;

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
          RR
        </span>
      </div>
      <div className="mt-3 text-xs font-semibold text-slate-500">{helper}</div>
    </div>
  );
}

function statusTone(status: string): BadgeTone {
  if (status === "Approved") {
    return "good";
  }

  if (status === "Pending") {
    return "warn";
  }

  return "default";
}

export function RealReviewsRealResultsPage() {
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
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Storefront Social Proof
                  </div>
                  <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Reviews & Real Results
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Manage PDP visible results, homepage real results and
                    customer review approval as a Canvas-faithful preview. This
                    route is not connected to live review moderation actions yet.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledButton>Export</DisabledButton>
                  <DisabledButton primary>Add Result</DisabledButton>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-stone-50 text-slate-500">
                    <tr>
                      {["Result", "Product", "Type", "Status", "Action"].map(
                        (heading) => (
                          <th className="px-5 py-4 font-medium" key={heading}>
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row) => (
                      <tr
                        className="border-t border-slate-100 transition hover:bg-stone-50"
                        key={row.title}
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">
                            {row.title}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Mapped to homepage / PDP
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {row.product}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone="brand">{row.type}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400"
                              disabled
                              type="button"
                            >
                              Review
                            </button>
                            <button
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400"
                              disabled
                              type="button"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {galleryCards.map((card) => (
                <div
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
                  key={card.label}
                >
                  <div className="flex aspect-[4/3] items-center justify-center rounded-[1.25rem] bg-stone-100 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Result Preview
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-950">
                        {card.label}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">
                        {card.product}
                      </div>
                    </div>
                    <Badge tone="warn">Preview</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {card.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Result Upload
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Quick Add
              </h2>
              <div className="mt-5 space-y-3">
                <div className="w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm text-slate-400">
                  Result title
                </div>
                <div className="w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-600">
                  Before / After
                </div>
                <div className="w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-600">
                  Map to Product
                </div>
                <DisabledButton primary>Save Result</DisabledButton>
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                Conversion Note
              </div>
              <p className="mt-2 text-sm leading-6 text-amber-700">
                Real Results should be mapped to related product and concern
                pages to improve trust before add-to-cart.
              </p>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                Reviews Safety Note
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
