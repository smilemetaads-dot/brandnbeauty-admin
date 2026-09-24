"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addContentSource,
  loadContentEnrichment,
  loadContentProduct,
  saveContentDraft,
  setContentStatus,
  syncContentQueue,
  type ContentPriority,
  type ContentStatus,
  type ProductContentItem,
  type ProductContentSource,
  type ProductContentState,
} from "./product-content-enrichment-client";

const priorities: ContentPriority[] = ["P0", "P1", "P2"];
const statuses: Exclude<ContentStatus, "published">[] = [
  "queued",
  "researching",
  "draft",
  "review",
  "approved",
  "hold",
];

const splitLines = (value: string) =>
  value
    .split(/\r?\n|\|/)
    .map((item) => item.trim())
    .filter(Boolean);

const asLines = (value: unknown) =>
  Array.isArray(value)
    ? value.map((item) => String(item)).join("\n")
    : "";

export function LiveProductContentEnrichmentWorkspace() {
  const [state, setState] = useState<ProductContentState>({
    products: [],
    summary: {
      approved: 0,
      draft: 0,
      hold: 0,
      p0: 0,
      p1: 0,
      p2: 0,
      published: 0,
      queued: 0,
      researching: 0,
      review: 0,
      total: 0,
      with_authoritative_source: 0,
    },
  });
  const [selected, setSelected] = useState<ProductContentItem | null>(null);
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] =
    useState<"all" | ContentPriority>("all");
  const [statusFilter, setStatusFilter] =
    useState<"all" | ContentStatus>("all");

  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [benefits, setBenefits] = useState("");
  const [howToUse, setHowToUse] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [skinTypes, setSkinTypes] = useState("");
  const [concerns, setConcerns] = useState("");
  const [warningsStatus, setWarningsStatus] = useState("unknown");
  const [warnings, setWarnings] = useState("");
  const [size, setSize] = useState("");
  const [faq, setFaq] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [researchNotes, setResearchNotes] = useState("");

  const [sourceType, setSourceType] =
    useState<ProductContentSource["source_type"]>("official_brand");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [evidenceScope, setEvidenceScope] = useState("");

  const [reviewedBy, setReviewedBy] = useState("Admin");
  const [confirmed, setConfirmed] = useState(false);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");

    try {
      const next = await loadContentEnrichment(signal);
      setState(next);

      setSelected((current) => {
        if (
          current &&
          next.products.some(
            (item) => item.product_id === current.product_id,
          )
        ) {
          return current;
        }

        return next.products[0] ?? null;
      });
    } catch (caught) {
      if (!signal?.aborted) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Content enrichment queue could not be loaded.",
        );
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);

    return () => controller.abort();
  }, [load]);

  const hydrate = useCallback((item: ProductContentItem) => {
    const draft = item.draft_payload ?? {};
    const candidate = item.candidate ?? {};

    setShortDescription(String(draft.short_description ?? ""));
    setDescription(String(draft.description ?? ""));
    setBenefits(
      asLines(draft.benefits ?? candidate.benefits),
    );
    setHowToUse(
      String(draft.how_to_use ?? candidate.how_to_use ?? ""),
    );
    setIngredients(
      asLines(draft.key_ingredients ?? candidate.key_ingredients),
    );
    setSkinTypes(
      asLines(draft.skin_types ?? candidate.skin_types),
    );
    setConcerns(
      asLines(
        draft.primary_concerns ?? candidate.primary_concerns,
      ),
    );
    setWarningsStatus(
      String(
        draft.warnings_status ??
          candidate.warnings_status ??
          "unknown",
      ),
    );
    setWarnings(
      asLines(draft.warnings ?? candidate.warnings),
    );
    setSize(String(draft.size ?? candidate.size ?? ""));
    setFaq(asLines(draft.faq));
    setMetaTitle(String(draft.meta_title ?? ""));
    setMetaDescription(String(draft.meta_description ?? ""));
    setResearchNotes(item.research_notes ?? "");
    setConfirmed(false);
  }, []);

  useEffect(() => {
    if (!selected) return;

    void loadContentProduct(selected.product_id)
      .then((full) => {
        setSelected(full);
        hydrate(full);
      })
      .catch((caught) => {
        setError(
          caught instanceof Error
            ? caught.message
            : "Selected product could not be loaded.",
        );
      });
  }, [selected?.product_id, hydrate]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return state.products.filter((item) => {
      if (
        priorityFilter !== "all" &&
        item.priority !== priorityFilter
      ) {
        return false;
      }

      if (
        statusFilter !== "all" &&
        item.status !== statusFilter
      ) {
        return false;
      }

      if (!needle) return true;

      return `${item.name} ${item.sku} ${item.brand} ${item.category}`
        .toLowerCase()
        .includes(needle);
    });
  }, [priorityFilter, query, state.products, statusFilter]);

  const draftPayload = () => ({
    benefits: splitLines(benefits),
    description,
    faq: splitLines(faq),
    how_to_use: howToUse,
    key_ingredients: splitLines(ingredients),
    meta_description: metaDescription,
    meta_title: metaTitle,
    primary_concerns: splitLines(concerns),
    short_description: shortDescription,
    size,
    skin_types: splitLines(skinTypes),
    warnings: splitLines(warnings),
    warnings_status: warningsStatus,
  });

  async function saveDraft() {
    if (!selected) return;

    setBusy(true);
    setError("");

    try {
      await saveContentDraft({
        draft: draftPayload(),
        productId: selected.product_id,
        researchNotes,
      });

      setNotice(
        "Draft saved. Live product content was not changed.",
      );
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Draft could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function addSource() {
    if (!selected) return;

    setBusy(true);
    setError("");

    try {
      await addContentSource({
        evidenceScope,
        productId: selected.product_id,
        sourceTitle,
        sourceType,
        sourceUrl,
      });

      setSourceUrl("");
      setSourceTitle("");
      setEvidenceScope("");

      const full = await loadContentProduct(selected.product_id);
      setSelected(full);
      hydrate(full);

      setNotice(
        "Source recorded. It is not verified until human approval.",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Source could not be added.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function moveStatus(status: Exclude<ContentStatus, "published">) {
    if (!selected) return;

    setBusy(true);
    setError("");

    try {
      await setContentStatus({
        confirmed: status === "approved" ? confirmed : false,
        productId: selected.product_id,
        reviewedBy: status === "approved" ? reviewedBy : "",
        status,
      });

      setConfirmed(false);
      setNotice(
        status === "approved"
          ? "Draft approved for future publishing. Live product content remains unchanged."
          : `Workflow moved to ${status}.`,
      );

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Workflow status could not be updated.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function syncQueue() {
    setBusy(true);
    setError("");

    try {
      await syncContentQueue();
      setNotice(
        "Queue synchronized with current C2 products.",
      );
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Queue could not be synchronized.",
      );
    } finally {
      setBusy(false);
    }
  }

  const cards = [
    ["Total C2 queue", state.summary.total],
    ["P0", state.summary.p0],
    ["Queued", state.summary.queued],
    ["Researching", state.summary.researching],
    ["Draft", state.summary.draft],
    ["Review", state.summary.review],
    ["Approved", state.summary.approved],
    [
      "Authoritative source",
      state.summary.with_authoritative_source,
    ],
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#547874]">
            D4 · content enrichment governance
          </p>
          <h1 className="mt-2 text-[28px] font-bold tracking-[-.04em] text-[#17231f]">
            Product Content Enrichment
          </h1>
          <p className="mt-1.5 max-w-4xl text-[10px] font-medium leading-5 text-[#74817b]">
            Research and draft product content without changing the live
            catalog. Official/manufacturer/packaging evidence plus explicit
            human approval is required before a draft can become approved.
          </p>
        </div>

        <button
          className="h-10 rounded-xl border bg-white px-4 text-[8px] font-bold text-[#62706a]"
          disabled={busy || loading}
          onClick={() => void syncQueue()}
          type="button"
        >
          Sync C2 queue
        </button>
      </header>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[8px] leading-4 text-amber-900">
        <b>D4.1 does not publish anything.</b> Price and stock remain live
        commerce truth. Draft content stays in workflow tables until a later
        publishing phase performs versioned, human-approved promotion.
      </section>

      {error ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[9px] font-semibold text-rose-700">
          {error}
        </section>
      ) : null}

      {notice ? (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[9px] font-semibold text-emerald-700">
          {notice}
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-8">
        {cards.map(([label, value]) => (
          <article
            className="rounded-2xl border border-[#e2e8e5] bg-white p-4"
            key={String(label)}
          >
            <p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#87928d]">
              {String(label)}
            </p>
            <strong className="mt-3 block text-[21px] text-[#17231f]">
              {Number(value)}
            </strong>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_470px]">
        <article className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">
          <div className="space-y-3 border-b p-4">
            <input
              className="h-10 w-full rounded-xl border px-3 text-[9px] outline-none"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product, SKU, brand or category"
              value={query}
            />

            <div className="flex flex-wrap gap-2">
              <button
                className={`h-8 rounded-lg px-3 text-[7.5px] font-bold ${
                  priorityFilter === "all"
                    ? "bg-[#426d72] text-white"
                    : "bg-[#f2f5f3] text-[#697770]"
                }`}
                onClick={() => setPriorityFilter("all")}
                type="button"
              >
                All priority
              </button>

              {priorities.map((priority) => (
                <button
                  className={`h-8 rounded-lg px-3 text-[7.5px] font-bold ${
                    priorityFilter === priority
                      ? "bg-[#426d72] text-white"
                      : "bg-[#f2f5f3] text-[#697770]"
                  }`}
                  key={priority}
                  onClick={() => setPriorityFilter(priority)}
                  type="button"
                >
                  {priority}
                </button>
              ))}
            </div>

            <select
              className="h-10 w-full rounded-xl border bg-white px-3 text-[8px]"
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "all" | ContentStatus,
                )
              }
              value={statusFilter}
            >
              <option value="all">All workflow statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="divide-y">
            {filtered.length ? (
              filtered.map((item) => (
                <button
                  className={`w-full p-4 text-left ${
                    selected?.product_id === item.product_id
                      ? "bg-[#f2f7f5]"
                      : "hover:bg-[#fafcfb]"
                  }`}
                  key={item.product_id}
                  onClick={() => setSelected(item)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <b className="text-[9px] text-[#405049]">
                        {item.name}
                      </b>
                      <p className="mt-1 text-[7px] text-[#87928d]">
                        {item.sku || "No SKU"} · {item.brand} ·{" "}
                        {item.category}
                      </p>
                      <p className="mt-1 text-[7px] text-amber-700">
                        Missing C3:{" "}
                        {item.missing_fields.required_for_c3?.join(
                          ", ",
                        ) || "None"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="rounded-full bg-[#edf3f4] px-2 py-1 text-[7px] font-bold text-[#496c69]">
                        {item.priority}
                      </span>
                      <p className="mt-2 text-[7px] text-[#87928d]">
                        {item.status}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-10 text-center text-[9px] text-[#87928d]">
                No products match this view.
              </div>
            )}
          </div>
        </article>

        <aside className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">
          {selected ? (
            <>
              <header className="border-b p-5">
                <p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#7d8983]">
                  Draft workspace · {selected.priority}
                </p>
                <h2 className="mt-1 text-[17px] font-bold text-[#26362f]">
                  {selected.name}
                </h2>
                <p className="mt-1 text-[7px] text-[#84908a]">
                  Maturity {selected.maturity_level} · Stock{" "}
                  {selected.sellable_stock} · Sources{" "}
                  {selected.source_summary.source_count}
                </p>
              </header>

              <div className="space-y-4 p-5">
                {[
                  [
                    "Short description",
                    shortDescription,
                    setShortDescription,
                    72,
                  ],
                  ["Description", description, setDescription, 120],
                  ["Benefits", benefits, setBenefits, 84],
                  ["How to use", howToUse, setHowToUse, 84],
                  ["Key ingredients", ingredients, setIngredients, 84],
                  ["Skin types", skinTypes, setSkinTypes, 70],
                  ["Primary concerns", concerns, setConcerns, 70],
                  ["Warnings", warnings, setWarnings, 70],
                  ["FAQ", faq, setFaq, 84],
                ].map(([label, value, setter, height]) => (
                  <label
                    className="block text-[7px] font-bold uppercase tracking-[.08em] text-[#66736d]"
                    key={String(label)}
                  >
                    {String(label)}
                    <textarea
                      className="mt-2 w-full rounded-xl border p-3 text-[8px] font-medium normal-case tracking-normal"
                      onChange={(event) =>
                        (
                          setter as (value: string) => void
                        )(event.target.value)
                      }
                      style={{ minHeight: Number(height) }}
                      value={String(value)}
                    />
                  </label>
                ))}

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-[7px] font-bold uppercase tracking-[.08em] text-[#66736d]">
                    Warning status
                    <select
                      className="mt-2 h-10 w-full rounded-xl border bg-white px-3 text-[8px] normal-case"
                      onChange={(event) =>
                        setWarningsStatus(event.target.value)
                      }
                      value={warningsStatus}
                    >
                      <option value="unknown">Unknown</option>
                      <option value="verified_none">
                        Verified none
                      </option>
                      <option value="verified_warnings">
                        Verified warnings
                      </option>
                    </select>
                  </label>

                  <label className="text-[7px] font-bold uppercase tracking-[.08em] text-[#66736d]">
                    Size
                    <input
                      className="mt-2 h-10 w-full rounded-xl border px-3 text-[8px] normal-case"
                      onChange={(event) => setSize(event.target.value)}
                      value={size}
                    />
                  </label>
                </div>

                <label className="block text-[7px] font-bold uppercase tracking-[.08em] text-[#66736d]">
                  SEO title draft
                  <input
                    className="mt-2 h-10 w-full rounded-xl border px-3 text-[8px] normal-case"
                    onChange={(event) =>
                      setMetaTitle(event.target.value)
                    }
                    value={metaTitle}
                  />
                </label>

                <label className="block text-[7px] font-bold uppercase tracking-[.08em] text-[#66736d]">
                  SEO description draft
                  <textarea
                    className="mt-2 min-h-20 w-full rounded-xl border p-3 text-[8px] font-medium normal-case tracking-normal"
                    onChange={(event) =>
                      setMetaDescription(event.target.value)
                    }
                    value={metaDescription}
                  />
                </label>

                <label className="block text-[7px] font-bold uppercase tracking-[.08em] text-[#66736d]">
                  Research notes
                  <textarea
                    className="mt-2 min-h-20 w-full rounded-xl border p-3 text-[8px] font-medium normal-case tracking-normal"
                    onChange={(event) =>
                      setResearchNotes(event.target.value)
                    }
                    value={researchNotes}
                  />
                </label>

                <button
                  className="h-10 w-full rounded-xl bg-[#426d72] text-[8px] font-bold text-white disabled:opacity-40"
                  disabled={busy}
                  onClick={() => void saveDraft()}
                  type="button"
                >
                  Save draft only
                </button>

                <section className="space-y-3 rounded-xl border bg-[#fafcfb] p-4">
                  <p className="text-[8px] font-bold text-[#405049]">
                    Research evidence
                  </p>

                  <select
                    className="h-10 w-full rounded-xl border bg-white px-3 text-[8px]"
                    onChange={(event) =>
                      setSourceType(
                        event.target
                          .value as ProductContentSource["source_type"],
                      )
                    }
                    value={sourceType}
                  >
                    <option value="official_brand">
                      Official brand
                    </option>
                    <option value="manufacturer">
                      Manufacturer
                    </option>
                    <option value="packaging">Packaging</option>
                    <option value="authorized_retailer">
                      Authorized retailer
                    </option>
                    <option value="other">Other</option>
                  </select>

                  <input
                    className="h-10 w-full rounded-xl border px-3 text-[8px]"
                    onChange={(event) =>
                      setSourceUrl(event.target.value)
                    }
                    placeholder="https://..."
                    value={sourceUrl}
                  />

                  <input
                    className="h-10 w-full rounded-xl border px-3 text-[8px]"
                    onChange={(event) =>
                      setSourceTitle(event.target.value)
                    }
                    placeholder="Source title"
                    value={sourceTitle}
                  />

                  <textarea
                    className="min-h-16 w-full rounded-xl border p-3 text-[8px]"
                    onChange={(event) =>
                      setEvidenceScope(event.target.value)
                    }
                    placeholder="What facts does this source support?"
                    value={evidenceScope}
                  />

                  <button
                    className="h-9 w-full rounded-xl border bg-white text-[8px] font-bold text-[#53655d]"
                    disabled={busy || !sourceUrl.trim()}
                    onClick={() => void addSource()}
                    type="button"
                  >
                    Add evidence source
                  </button>

                  {selected.sources?.length ? (
                    <div className="space-y-2">
                      {selected.sources.map((source) => (
                        <div
                          className="rounded-lg border bg-white p-3 text-[7px] leading-4 text-[#68756f]"
                          key={String(source.id)}
                        >
                          <b>{source.source_type}</b>
                          <br />
                          {source.source_title ||
                            source.source_url}
                          <br />
                          {source.verified_at
                            ? `Verified by ${
                                source.verified_by || "human"
                              }`
                            : "Not human-verified yet"}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>

                <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <label className="block text-[7px] font-bold uppercase tracking-[.08em] text-amber-900">
                    Reviewer
                    <input
                      className="mt-2 h-10 w-full rounded-xl border bg-white px-3 text-[8px] normal-case"
                      onChange={(event) =>
                        setReviewedBy(event.target.value)
                      }
                      value={reviewedBy}
                    />
                  </label>

                  <label className="flex items-start gap-3 text-[7.5px] leading-4 text-amber-900">
                    <input
                      checked={confirmed}
                      className="mt-0.5"
                      onChange={(event) =>
                        setConfirmed(event.target.checked)
                      }
                      type="checkbox"
                    />
                    I reviewed the draft against the recorded
                    evidence. Approval does not publish it live.
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    {statuses
                      .filter((status) => status !== "approved")
                      .map((status) => (
                        <button
                          className="h-9 rounded-xl border bg-white text-[7px] font-bold text-[#61716a]"
                          disabled={busy}
                          key={status}
                          onClick={() =>
                            void moveStatus(status)
                          }
                          type="button"
                        >
                          Move to {status}
                        </button>
                      ))}
                  </div>

                  <button
                    className="h-10 w-full rounded-xl bg-[#735f2c] text-[8px] font-bold text-white disabled:opacity-40"
                    disabled={busy || !confirmed}
                    onClick={() =>
                      void moveStatus("approved")
                    }
                    type="button"
                  >
                    Approve draft for future publish
                  </button>
                </section>
              </div>
            </>
          ) : (
            <div className="p-10 text-center text-[9px] text-[#87928d]">
              Select a product.
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
