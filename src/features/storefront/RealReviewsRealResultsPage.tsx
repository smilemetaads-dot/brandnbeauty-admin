"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { RealResultsManagerPanel } from "@/features/storefront/RealResultsManagerPanel";
import {
  defaultCmsMeta,
  fetchCmsMeta,
  MANAGE_REVIEWS_ENDPOINT,
  type CmsMeta,
  type CmsReview,
} from "@/features/cms/cms-meta-client";
import { adminAuthHeaders } from "@/lib/admin-auth";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const safetyItems = [
  "Review/result saves now use the local PHP/MySQL reviews endpoint.",
  "Homepage visibility requires both featured and approved/active status.",
  "Leave unfinished, unverified or incomplete reviews inactive until they are ready.",
  "Image URLs are optional; missing images render a safe storefront fallback.",
  "Lower sort order appears first on storefront review sections.",
  "Export, media upload automation and moderation queues are not connected yet.",
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

function isReviewActive(review: CmsReview) {
  return review.status === "approved" || review.status === "active" || review.verified;
}

function reviewStatusLabel(review: CmsReview) {
  if (review.status === "inactive") return "Inactive";
  if (isReviewActive(review)) return "Approved";
  return "Pending";
}

export function RealReviewsRealResultsPage() {
  const [activeTab, setActiveTab] = useState<"real-results" | "reviews">("real-results");
  const [cmsMeta, setCmsMeta] = useState<CmsMeta>(defaultCmsMeta);
  const [reviewDraft, setReviewDraft] = useState({
    customer_name: "",
    featured: false,
    id: "",
    image_url: "",
    product_id: "",
    rating: "5",
    result_image_url: "",
    review_text: "",
    sort_order: "1",
    status: "inactive",
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

  const disableReview = async (review: CmsReview) => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(MANAGE_REVIEWS_ENDPOINT, {
        body: JSON.stringify({ id: review.id }),
        headers: adminAuthHeaders({
          "Content-Type": "application/json",
        }),
        method: "DELETE",
      });
      const payload = (await response.json()) as { message?: string; success?: boolean };

      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || "Review could not be disabled.");
      }

      setMessage(payload.message || "Review disabled.");
      await loadReviews();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Review could not be disabled.");
    } finally {
      setIsSaving(false);
    }
  };

  const liveStats = useMemo(() => {
    const approved = cmsMeta.reviews.filter(isReviewActive).length;
    const inactive = cmsMeta.reviews.filter((review) => review.status === "inactive").length;
    const homepage = cmsMeta.reviews.filter((review) => review.featured && isReviewActive(review)).length;
    const withImage = cmsMeta.reviews.filter((review) => review.image_url || review.result_image_url).length;

    return [
      ["Total Reviews", String(cmsMeta.reviews.length), "Database rows"],
      ["Homepage Featured", String(homepage), "Featured + active"],
      ["Approved", String(approved), "Visible when featured"],
      ["Inactive", String(inactive), "Hidden from storefront"],
      ["With Images", String(withImage), "Review/result image set"],
    ] as const;
  }, [cmsMeta.reviews]);

  const liveResults = cmsMeta.reviews.map((review) => ({
    comment: review.comment,
    featured: Boolean(review.featured),
    hasImage: Boolean(review.image_url || review.result_image_url),
    id: review.id,
    product: review.product_id ? `Product #${review.product_id}` : "Homepage Review",
    raw: review,
    sortOrder: review.sort_order ?? 0,
    status: reviewStatusLabel(review),
    title: review.customer_name || "Unnamed customer",
    type: `${review.rating}/5 Rating`,
  }));

  const liveGalleryCards = cmsMeta.reviews.slice(0, 3).map((review) => ({
    label: `${review.rating}/5 Customer Quote`,
    note: review.comment,
    product: review.customer_name,
  }));

  const loadDraftForEdit = (review: CmsReview) => {
    setReviewDraft({
      customer_name: review.customer_name,
      featured: Boolean(review.featured),
      id: review.id,
      image_url: review.image_url ?? "",
      product_id: review.product_id ? String(review.product_id) : "",
      rating: String(review.rating || 5),
      result_image_url: review.result_image_url ?? "",
      review_text: review.comment,
      sort_order: String(review.sort_order ?? 0),
      status: review.status === "inactive" ? "inactive" : isReviewActive(review) ? "approved" : "pending",
    });
    setMessage(`Editing review ID ${review.id}. Save to update it.`);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Storefront Social Proof
              </div>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                Reviews & Real Results
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Manage structured Real Results stories and legacy customer reviews.
                Homepage visibility stays controlled by active/featured status.
              </p>
            </div>
            <div className="grid rounded-2xl bg-stone-100 p-1 text-sm font-bold text-slate-600 sm:grid-cols-2">
              <button
                className={`rounded-xl px-4 py-2 transition ${
                  activeTab === "real-results"
                    ? "bg-white text-[#5E7F85] shadow-sm"
                    : "hover:text-slate-950"
                }`}
                onClick={() => setActiveTab("real-results")}
                type="button"
              >
                Real Results
              </button>
              <button
                className={`rounded-xl px-4 py-2 transition ${
                  activeTab === "reviews"
                    ? "bg-white text-[#5E7F85] shadow-sm"
                    : "hover:text-slate-950"
                }`}
                onClick={() => setActiveTab("reviews")}
                type="button"
              >
                Customer Reviews
              </button>
            </div>
          </div>
        </section>

        {activeTab === "real-results" ? (
          <RealResultsManagerPanel />
        ) : (
          <>
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
                    Manage customer reviews and homepage real results from the
                    local PHP/MySQL reviews endpoint. A review appears on the
                    homepage only when it is featured and approved/active.
                    Image URLs are optional. Lower sort order appears first.
                    Export, media upload automation, moderation queues, and
                    auto-verification are not connected.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledButton>Export coming later</DisabledButton>
                  <button
                    className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={isSaving}
                    onClick={() => saveReview({ id: "" })}
                    type="button"
                  >
                    {isSaving ? "Saving..." : "Add Review"}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-stone-50 text-slate-500">
                    <tr>
                      {["Review", "Product", "Rating", "Homepage", "Sort", "Status", "Action"].map(
                        (heading) => (
                          <th className="px-5 py-4 font-medium" key={heading}>
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {liveResults.map((row) => (
                      <tr
                        className="border-t border-slate-100 transition hover:bg-stone-50"
                        key={row.id}
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">
                            {row.title}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {row.comment || "No review text saved."}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {row.product}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone="brand">{row.type}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={row.featured && row.status === "Approved" ? "good" : "default"}>
                            {row.featured ? "Featured" : "Standard"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {row.sortOrder}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-semibold text-[#5E7F85] disabled:text-slate-400"
                              disabled={isSaving}
                              onClick={() => loadDraftForEdit(row.raw)}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-semibold text-[#5E7F85] disabled:text-slate-400"
                              disabled={isSaving}
                              onClick={() => saveReview({ ...row.raw, id: row.id, featured: !row.featured, review_text: row.comment })}
                              type="button"
                            >
                              {row.featured ? "Unfeature" : "Feature"}
                            </button>
                            <button
                              className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-semibold text-[#5E7F85] disabled:text-slate-400"
                              disabled={isSaving}
                              onClick={() => saveReview({ ...row.raw, id: row.id, review_text: row.comment, status: "approved" })}
                              type="button"
                            >
                              Approve
                            </button>
                            <button
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:text-slate-400"
                              disabled={isSaving}
                              onClick={() => saveReview({ ...row.raw, id: row.id, review_text: row.comment, status: "inactive" })}
                              type="button"
                            >
                              Hide
                            </button>
                            <button
                              className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 disabled:text-slate-400"
                              disabled={isSaving}
                              onClick={() => disableReview(row.raw)}
                              type="button"
                            >
                              Disable
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!liveResults.length ? (
                      <tr>
                        <td className="px-5 py-8 text-center text-sm font-semibold text-slate-500" colSpan={7}>
                          No review records found. Add a real customer review when it is ready to publish.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {liveGalleryCards.map((card) => (
                <div
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
                  key={card.label}
                >
                  <div className="flex aspect-[4/3] items-center justify-center rounded-[1.25rem] bg-stone-100 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Review Media Slot
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
                    <Badge tone="warn">Review</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {card.note}
                  </p>
                </div>
              ))}
              {!liveGalleryCards.length ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 text-sm font-semibold leading-6 text-slate-500 shadow-sm lg:col-span-3">
                  Review media cards appear after real review records are saved.
                </div>
              ) : null}
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
                <input className="w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none" value={reviewDraft.sort_order} onChange={(event) => setReviewDraft((current) => ({ ...current, sort_order: event.target.value }))} placeholder="Sort order, lower appears first" type="number" min={0} max={9999} />
                <input className="w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none" value={reviewDraft.image_url} onChange={(event) => setReviewDraft((current) => ({ ...current, image_url: event.target.value }))} placeholder="Review image URL" />
                <input className="w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none" value={reviewDraft.result_image_url} onChange={(event) => setReviewDraft((current) => ({ ...current, result_image_url: event.target.value }))} placeholder="Result image URL" />
                <div className="rounded-2xl bg-stone-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-600">
                  Featured plus approved/active publishes to the homepage. Pending or inactive reviews remain hidden. Use real customer text only; keep unfinished or unverified reviews inactive. Image URLs are optional; sort order controls display order.
                </div>
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
                  {isSaving ? "Saving..." : "Save Review"}
                </button>
                {message ? <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-600">{message}</div> : null}
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                Conversion Note
              </div>
              <p className="mt-2 text-sm leading-6 text-amber-700">
                Real Results should use customer-approved text and optional
                review/result images. Avoid before/after claims unless the
                asset, consent, and wording are verified for launch.
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
          </>
        )}
      </div>
    </AdminShell>
  );
}
