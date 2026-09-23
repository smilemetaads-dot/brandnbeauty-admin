"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadContentEnrichment,
  loadContentProduct,
  setContentStatus,
  type ProductContentItem,
} from "@/features/product-content-enrichment/product-content-enrichment-client";

const valueText = (value: unknown) => {
  if (Array.isArray(value)) return value.map(String).join("\n");
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

export function LiveP0BatchReviewWorkspace() {
  const [items, setItems] = useState<ProductContentItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selected, setSelected] = useState<ProductContentItem | null>(null);
  const [reviewer, setReviewer] = useState("Owner Review");
  const [sourceOk, setSourceOk] = useState(false);
  const [draftOk, setDraftOk] = useState(false);
  const [riskOk, setRiskOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh(preferredId?: string) {
    const state = await loadContentEnrichment();
    const p0 = state.products
      .filter((item) => item.priority === "P0")
      .sort((a, b) => a.name.localeCompare(b.name));

    setItems(p0);

    const preferred =
      preferredId && p0.some((item) => item.product_id === preferredId)
        ? preferredId
        : p0.find((item) => item.status !== "approved" && item.status !== "hold")
            ?.product_id ?? p0[0]?.product_id ?? "";

    setSelectedId(preferred);
  }

  useEffect(() => {
    void refresh().catch((caught) =>
      setError(
        caught instanceof Error ? caught.message : "Review queue could not be loaded.",
      ),
    );
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }

    setBusy(true);
    setError("");
    setSourceOk(false);
    setDraftOk(false);
    setRiskOk(false);

    void loadContentProduct(selectedId)
      .then(setSelected)
      .catch((caught) =>
        setError(
          caught instanceof Error ? caught.message : "Product could not be loaded.",
        ),
      )
      .finally(() => setBusy(false));
  }, [selectedId]);

  const summary = useMemo(() => {
    const approved = items.filter((item) => item.status === "approved").length;
    const hold = items.filter((item) => item.status === "hold").length;
    const draft = items.filter((item) => item.status === "draft").length;
    const blocked = items.filter(
      (item) => item.source_summary.authoritative_count < 1,
    ).length;

    return { approved, blocked, draft, hold, total: items.length };
  }, [items]);

  const sourceReady =
    (selected?.source_summary.authoritative_count ?? 0) > 0;

  const canApprove =
    Boolean(selected) &&
    selected?.status !== "approved" &&
    sourceReady &&
    sourceOk &&
    draftOk &&
    riskOk &&
    reviewer.trim().length > 0 &&
    !busy;

  async function approveAndNext() {
    if (!selected || !canApprove) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await setContentStatus({
        confirmed: true,
        productId: selected.product_id,
        reviewedBy: reviewer.trim(),
        status: "approved",
      });

      setNotice(
        `${selected.name} approved for future publishing. Live catalog content was not changed.`,
      );

      const next = items.find(
        (item) =>
          item.product_id !== selected.product_id &&
          item.status !== "approved" &&
          item.status !== "hold" &&
          item.source_summary.authoritative_count > 0,
      );

      await refresh(next?.product_id);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Approval could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function holdAndNext() {
    if (!selected || busy) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await setContentStatus({
        productId: selected.product_id,
        status: "hold",
      });

      setNotice(`${selected.name} moved to hold. Live catalog content was not changed.`);

      const next = items.find(
        (item) =>
          item.product_id !== selected.product_id &&
          item.status !== "approved" &&
          item.status !== "hold",
      );

      await refresh(next?.product_id);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Hold status could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  const draft = selected?.draft_payload ?? {};

  const fields: Array<[string, unknown]> = [
    ["Short description", draft.short_description],
    ["Description", draft.description],
    ["Benefits", draft.benefits],
    ["How to use", draft.how_to_use],
    ["Key ingredients", draft.key_ingredients],
    ["Skin types", draft.skin_types],
    ["Primary concerns", draft.primary_concerns],
    ["Warnings status", draft.warnings_status],
    ["Warnings", draft.warnings],
    ["FAQ", draft.faq],
    ["Size", draft.size],
    ["SEO title", draft.meta_title],
    ["SEO description", draft.meta_description],
  ];

  return (
    <div className="space-y-5">
      <header>
        <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#547874]">
          D4.3 · Batch 1 human review
        </p>
        <h1 className="mt-2 text-[28px] font-bold tracking-[-.04em] text-[#17231f]">
          P0 Content Review & Approval
        </h1>
        <p className="mt-1.5 max-w-4xl text-[10px] font-medium leading-5 text-[#74817b]">
          Review the evidence, AI draft and risk flags product-by-product. Approval
          marks a draft ready for a later publishing phase; it does not change live
          content, price or stock.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Total P0", summary.total],
          ["Draft", summary.draft],
          ["Approved", summary.approved],
          ["Hold", summary.hold],
          ["Blocked source", summary.blocked],
        ].map(([label, value]) => (
          <article
            className="rounded-2xl border border-[#e2e8e5] bg-white p-4"
            key={String(label)}
          >
            <p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#87928d]">
              {String(label)}
            </p>
            <strong className="mt-3 block text-[22px] text-[#17231f]">
              {Number(value)}
            </strong>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[8px] leading-4 text-amber-900">
        <b>Review rule:</b> open the recorded source, review the draft, and review
        any risk flags before approval. Product 187 remains blocked until an
        official brand/manufacturer/packaging source is added.
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

      <section className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">
          <div className="max-h-[760px] overflow-auto divide-y">
            {items.map((item) => {
              const blocked =
                item.source_summary.authoritative_count < 1;

              return (
                <button
                  className={`w-full p-4 text-left ${
                    selectedId === item.product_id
                      ? "bg-[#f2f7f5]"
                      : "hover:bg-[#fafcfb]"
                  }`}
                  key={item.product_id}
                  onClick={() => setSelectedId(item.product_id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <b className="text-[8px] text-[#405049]">{item.name}</b>
                      <p className="mt-1 text-[7px] text-[#87928d]">
                        #{item.product_id} · {item.brand}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#edf3f4] px-2 py-1 text-[6.5px] font-bold text-[#496c69]">
                      {blocked ? "blocked" : item.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="rounded-2xl border border-[#dfe6e3] bg-white">
          {selected ? (
            <div className="space-y-5 p-5">
              <header className="border-b pb-4">
                <p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#7d8983]">
                  Product #{selected.product_id}
                </p>
                <h2 className="mt-1 text-[20px] font-bold text-[#26362f]">
                  {selected.name}
                </h2>
                <p className="mt-1 text-[8px] text-[#84908a]">
                  {selected.sku} · {selected.brand} · {selected.category}
                </p>
              </header>

              <section className="space-y-3">
                <h3 className="text-[10px] font-bold text-[#405049]">Evidence</h3>

                {selected.sources?.length ? (
                  selected.sources.map((source) => (
                    <article
                      className="rounded-xl border bg-[#fafcfb] p-4"
                      key={String(source.id)}
                    >
                      <p className="text-[7px] font-bold uppercase text-[#61716a]">
                        {source.source_type}
                      </p>
                      <p className="mt-2 text-[8px] font-bold text-[#405049]">
                        {source.source_title || source.source_url}
                      </p>
                      <p className="mt-2 text-[7px] leading-4 text-[#74817b]">
                        {source.evidence_scope || "No evidence note."}
                      </p>
                      <a
                        className="mt-3 inline-block text-[7.5px] font-bold text-[#426d72] underline"
                        href={source.source_url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open source
                      </a>
                    </article>
                  ))
                ) : (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[8px] text-rose-700">
                    No research source recorded.
                  </div>
                )}
              </section>

              {selected.risk_flags.length ? (
                <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-[8px] font-bold text-amber-900">Risk flags</p>
                  <ul className="mt-2 space-y-1 text-[7.5px] leading-4 text-amber-900">
                    {selected.risk_flags.map((flag) => (
                      <li key={flag}>• {flag}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="space-y-3">
                <h3 className="text-[10px] font-bold text-[#405049]">AI draft</h3>
                {fields.map(([label, value]) => (
                  <article className="rounded-xl border p-4" key={label}>
                    <p className="text-[7px] font-bold uppercase tracking-[.08em] text-[#7c8983]">
                      {label}
                    </p>
                    <pre className="mt-2 whitespace-pre-wrap font-sans text-[8px] leading-5 text-[#425149]">
                      {valueText(value)}
                    </pre>
                  </article>
                ))}
              </section>

              <section className="space-y-3 rounded-xl border bg-[#fafcfb] p-4">
                <label className="block text-[7px] font-bold uppercase tracking-[.08em] text-[#66736d]">
                  Reviewer
                  <input
                    className="mt-2 h-10 w-full rounded-xl border bg-white px-3 text-[8px] normal-case"
                    onChange={(event) => setReviewer(event.target.value)}
                    value={reviewer}
                  />
                </label>

                <label className="flex items-start gap-3 text-[8px] leading-4 text-[#4b5a53]">
                  <input
                    checked={sourceOk}
                    className="mt-0.5"
                    onChange={(event) => setSourceOk(event.target.checked)}
                    type="checkbox"
                  />
                  I opened/reviewed the recorded source and the draft does not overstate it.
                </label>

                <label className="flex items-start gap-3 text-[8px] leading-4 text-[#4b5a53]">
                  <input
                    checked={draftOk}
                    className="mt-0.5"
                    onChange={(event) => setDraftOk(event.target.checked)}
                    type="checkbox"
                  />
                  I reviewed wording, ingredients, usage, warnings and size.
                </label>

                <label className="flex items-start gap-3 text-[8px] leading-4 text-[#4b5a53]">
                  <input
                    checked={riskOk}
                    className="mt-0.5"
                    onChange={(event) => setRiskOk(event.target.checked)}
                    type="checkbox"
                  />
                  I reviewed the risk flags, or there are no risk flags.
                </label>

                {!sourceReady ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-[7.5px] leading-4 text-rose-700">
                    Approval blocked: authoritative source is still missing.
                  </div>
                ) : null}

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    className="h-10 rounded-xl border bg-white text-[8px] font-bold text-[#61716a]"
                    disabled={busy}
                    onClick={() => void holdAndNext()}
                    type="button"
                  >
                    Hold / needs correction
                  </button>

                  <button
                    className="h-10 rounded-xl bg-[#426d72] text-[8px] font-bold text-white disabled:opacity-35"
                    disabled={!canApprove}
                    onClick={() => void approveAndNext()}
                    type="button"
                  >
                    Approve & next
                  </button>
                </div>
              </section>
            </div>
          ) : (
            <div className="p-10 text-center text-[9px] text-[#87928d]">
              Select a product.
            </div>
          )}
        </main>
      </section>
    </div>
  );
}
