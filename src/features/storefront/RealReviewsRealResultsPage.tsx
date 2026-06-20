"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  defaultCmsMeta,
  fetchCmsMeta,
  MANAGE_REVIEWS_ENDPOINT,
  type CmsMeta,
  type CmsReview,
} from "@/features/cms/cms-meta-client";
import { adminAuthHeaders } from "@/lib/admin-auth";

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
  "Review/result saves now use the local PHP/MySQL reviews endpoint.",
  "Only approved/active reviews appear on the storefront.",
  "If no live reviews exist, homepage and PDP keep their original fallback content.",
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
  const [cmsMeta, setCmsMeta] = useState<CmsMeta>(defaultCmsMeta);
  const [reviewDraft, setReviewDraft] = useState({
    customer_name: "BrandnBeauty Customer",
    featured: true,
    image_url: "",
    product_id: "",
    rating: "5",
    result_image_url: "",
    review_text: "Fast delivery and helpful skincare guidance.",
    sort_order: "1",
    status: "approved",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadReviews = (signal?: AbortSignal) => {
    return fetchCmsMeta(signal)
      .then(setCmsMeta)
      .catch((error) => {
        if (!signal?.aborted) {
          console.error("Reviews CMS metadata could not be loaded.", error);
        }
      });
  };

  useEffect(() => {
    const controller = new AbortController();

    loadReviews(controller.signal);

    return () => controller.abort();
  }, []);

  const saveReview = async (overrides: Partial<CmsReview & { review_text: string }> = {}) => {
    setIsSaving(true);
    setMessage("");

    try {
      const body = {
        ...reviewDraft,
        ...overrides,
        featured: overrides.featured ?? reviewDraft.featured,
        product_id: overrides.product_id ?? (reviewDraft.product_id ? Number(reviewDraft.product_id) : null),
        rating: Number(overrides.rating ?? reviewDraft.rating),
        sort_order: Number(overrides.sort_order ?? reviewDraft.sort_order),
      };
      const response = await fetch(MANAGE_REVIEWS_ENDPOINT, {
        body: JSON.stringify(body),
        headers: adminAuthHeaders({
          "Content-Type": "application/json",
        }),
        method: "POST",
      });
      const payload = (await response.json()) as { message?: string; success?: boolean };

      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || "Review could not be saved.");
      }

      setMessage(payload.message || "Review saved.");
      await loadReviews();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Review could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const liveStats = useMemo(() => {
    const approved = cmsMeta.reviews.filter((review) => review.verified).length;
    const pending = cmsMeta.reviews.length - approved;

    return [
      ["Total Results", String(cmsMeta.reviews.length), "Live reviews"],
      ["Approved", String(approved), "Verified storefront"],
      ["Pending Review", String(pending), "Need approval"],
      ["Video Reviews", "0", "Awaiting media endpoint"],
    ] as const;
  }, [cmsMeta.reviews]);

  const liveResults = cmsMeta.reviews.map((review) => ({
    comment: review.comment,
    id: review.id,
    product: review.product_id ? `Product #${review.product_id}` : "Homepage Review",
    raw: review,
    status: review.verified ? "Approved" : "Pending",
    title: review.customer_name,
    type: `${review.rating}/5 Rating`,
  }));

  const liveGalleryCards = cmsMeta.reviews.slice(0, 3).map((review) => ({
    label: `${review.rating}/5 Customer Quote`,
    note: review.comment,
    product: review.customer_name,
  }));

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(cmsMeta.reviews.length ? liveStats : stats).map(([label, value, helper]) => (
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
                    customer review approval from the local CMS metadata
                    endpoint. Add, approve and hide actions save through the
                    local PHP/MySQL reviews endpoint; export and media upload
                    workflows remain preview-only.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledButton>Export</DisabledButton>
                  <button
                    className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={isSaving}
                    onClick={() => saveReview()}
                    type="button"
                  >
                    {isSaving ? "Saving..." : "Add Result"}
                  </button>
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
                    {(liveResults.length ? liveResults : results).map((row) => (
                      <tr
                        className="border-t border-slate-100 transition hover:bg-stone-50"
                        key={row.title}
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">
                            {row.title}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {"comment" in row ? row.comment : "Mapped to homepage / PDP"}
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
                              className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-semibold text-[#5E7F85] disabled:text-slate-400"
                              disabled={!("raw" in row) || isSaving}
                              onClick={() => "raw" in row ? saveReview({ ...row.raw, id: row.id, review_text: row.comment, status: "approved" }) : undefined}
                              type="button"
                            >
                              Approve
                            </button>
                            <button
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:text-slate-400"
                              disabled={!("raw" in row) || isSaving}
                              onClick={() => "raw" in row ? saveReview({ ...row.raw, id: row.id, review_text: row.comment, status: "inactive" }) : undefined}
                              type="button"
                            >
                              Hide
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
              {(liveGalleryCards.length ? liveGalleryCards : galleryCards).map((card) => (
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
                <input className="w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none" value={reviewDraft.customer_name} onChange={(event) => setReviewDraft((current) => ({ ...current, customer_name: event.target.value }))} placeholder="Customer name" />
                <textarea className="h-28 w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none" value={reviewDraft.review_text} onChange={(event) => setReviewDraft((current) => ({ ...current, review_text: event.target.value }))} placeholder="Review text" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none" value={reviewDraft.rating} onChange={(event) => setReviewDraft((current) => ({ ...current, rating: event.target.value }))} placeholder="Rating" type="number" min={1} max={5} />
                  <input className="rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none" value={reviewDraft.product_id} onChange={(event) => setReviewDraft((current) => ({ ...current, product_id: event.target.value }))} placeholder="Product ID optional" />
                </div>
                <input className="w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none" value={reviewDraft.image_url} onChange={(event) => setReviewDraft((current) => ({ ...current, image_url: event.target.value }))} placeholder="Review image URL" />
                <input className="w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none" value={reviewDraft.result_image_url} onChange={(event) => setReviewDraft((current) => ({ ...current, result_image_url: event.target.value }))} placeholder="Result image URL" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select className="rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none" value={reviewDraft.status} onChange={(event) => setReviewDraft((current) => ({ ...current, status: event.target.value }))}>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700">
                    Featured
                    <input checked={reviewDraft.featured} onChange={(event) => setReviewDraft((current) => ({ ...current, featured: event.target.checked }))} type="checkbox" />
                  </label>
                </div>
                <button className="w-full rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300" disabled={isSaving} onClick={() => saveReview()} type="button">
                  {isSaving ? "Saving..." : "Save Result"}
                </button>
                {message ? <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-600">{message}</div> : null}
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
