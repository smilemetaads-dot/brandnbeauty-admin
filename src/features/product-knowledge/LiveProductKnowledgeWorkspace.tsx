"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadProductKnowledge,
  verifyProductKnowledge,
  type MaturityLevel,
  type ProductKnowledgeItem,
  type ProductKnowledgeState,
} from "./product-knowledge-client";

const levels: MaturityLevel[] = ["C0", "C1", "C2", "C3", "C4", "C5"];

const labels: Record<MaturityLevel, string> = {
  C0: "Listed",
  C1: "Media ready",
  C2: "Commerce ready",
  C3: "Content ready",
  C4: "Knowledge verified",
  C5: "Automation ready",
};

const split = (value: string) =>
  value
    .split(/\r?\n|\|/)
    .map((item) => item.trim())
    .filter(Boolean);

const join = (items: string[]) => items.join("\n");

export function LiveProductKnowledgeWorkspace() {
  const [state, setState] = useState<ProductKnowledgeState>({
    products: [],
    summary: {
      c0: 0,
      c1: 0,
      c2: 0,
      c3: 0,
      c4: 0,
      c5: 0,
      recommendation_eligible: 0,
      total: 0,
    },
  });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | MaturityLevel>("all");
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [verifiedBy, setVerifiedBy] = useState("Admin");
  const [skinTypes, setSkinTypes] = useState("");
  const [concerns, setConcerns] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [benefits, setBenefits] = useState("");
  const [howToUse, setHowToUse] = useState("");
  const [warnings, setWarnings] = useState("");
  const [warningsStatus, setWarningsStatus] =
    useState<"unknown" | "verified_none" | "verified_warnings">("unknown");
  const [productUrl, setProductUrl] = useState("");
  const [functionalProfile, setFunctionalProfile] = useState("");
  const [size, setSize] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const next = await loadProductKnowledge(signal);
      setState(next);
      setSelectedId((current) =>
        next.products.some((item) => item.product_id === current)
          ? current
          : next.products[0]?.product_id || "",
      );
    } catch (caught) {
      if (!signal?.aborted) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Product knowledge could not be loaded.",
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

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return state.products.filter((item) => {
      const matchesFilter =
        filter === "all" || item.maturity.level === filter;
      const matchesQuery =
        !needle ||
        `${item.name} ${item.sku} ${item.brand} ${item.category}`
          .toLowerCase()
          .includes(needle);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query, state.products]);

  const selected =
    state.products.find((item) => item.product_id === selectedId) ||
    state.products[0] ||
    null;

  function fill(item: ProductKnowledgeItem) {
    const c = item.maturity.candidate;
    setVerifiedBy(c.verified_by || "Admin");
    setSkinTypes(join(c.skin_types));
    setConcerns(join(c.primary_concerns));
    setIngredients(join(c.key_ingredients));
    setBenefits(join(c.benefits));
    setHowToUse(c.how_to_use || "");
    setWarnings(join(c.warnings));
    setWarningsStatus(
      c.warnings_status === "verified_none" ||
        c.warnings_status === "verified_warnings"
        ? c.warnings_status
        : "unknown",
    );
    setProductUrl(c.product_url || "");
    setFunctionalProfile(c.functional_profile || "");
    setSize(c.size || "");
    setConfirmed(false);
  }

  useEffect(() => {
    if (selected) fill(selected);
  }, [selected?.product_id]);

  async function save() {
    if (!selected) return;
    setSaving(true);
    setError("");

    try {
      await verifyProductKnowledge({
        benefits: split(benefits),
        functionalProfile,
        howToUse,
        keyIngredients: split(ingredients),
        primaryConcerns: split(concerns),
        productId: selected.product_id,
        productUrl,
        size,
        skinTypes: split(skinTypes),
        verifiedBy,
        warnings: split(warnings),
        warningsStatus,
      });

      setNotice(
        "Human-verified product knowledge saved. Live price and stock were not copied.",
      );
      setConfirmed(false);
      await load();
      window.setTimeout(() => setNotice(""), 4200);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Knowledge verification could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  const summaryCards = levels.map((level) => ({
    level,
    count: state.summary[level.toLowerCase() as keyof ProductKnowledgeState["summary"]] as number,
  }));

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#547874]">
            Catalog · product knowledge governance
          </p>
          <h1 className="mt-2 text-[28px] font-bold tracking-[-.04em] text-[#17231f]">
            Product Knowledge Readiness
          </h1>
          <p className="mt-1.5 max-w-4xl text-[10px] font-medium leading-5 text-[#74817b]">
            C0–C5 maturity is calculated from the existing catalog, imported content,
            concern mappings, ingredient intelligence, Skin Test profiles and
            human-verified bot readiness. Price and stock remain live commerce truth.
          </p>
        </div>

        <button
          className="h-10 rounded-xl border bg-white px-4 text-[8px] font-bold text-[#62706a]"
          disabled={loading}
          onClick={() => void load()}
          type="button"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[9px] font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[9px] font-semibold text-emerald-700">
          {notice}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {summaryCards.map(({ level, count }) => (
          <article
            className="rounded-2xl border border-[#e2e8e5] bg-white p-4"
            key={level}
          >
            <p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#87928d]">
              {level} · {labels[level]}
            </p>
            <strong className="mt-3 block text-[22px] text-[#17231f]">
              {count}
            </strong>
          </article>
        ))}
        <article className="rounded-2xl border border-[#d9e8df] bg-[#f3f8f5] p-4">
          <p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#638072]">
            Recommendable now
          </p>
          <strong className="mt-3 block text-[22px] text-[#244a40]">
            {state.summary.recommendation_eligible}
          </strong>
        </article>
      </section>

      <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-[8px] leading-4 text-sky-900">
        <b>Important:</b> imported CSV attributes are candidate content only.
        They do not become C4 verified knowledge until a human reviews and confirms them here.
        C5 also requires the existing bot-readiness engine to report READY.
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_440px]">
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
                  filter === "all"
                    ? "bg-[#426d72] text-white"
                    : "bg-[#f2f5f3] text-[#697770]"
                }`}
                onClick={() => setFilter("all")}
                type="button"
              >
                All
              </button>
              {levels.map((level) => (
                <button
                  className={`h-8 rounded-lg px-3 text-[7.5px] font-bold ${
                    filter === level
                      ? "bg-[#426d72] text-white"
                      : "bg-[#f2f5f3] text-[#697770]"
                  }`}
                  key={level}
                  onClick={() => setFilter(level)}
                  type="button"
                >
                  {level}
                </button>
              ))}
            </div>
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
                  onClick={() => setSelectedId(item.product_id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <b className="text-[9px] text-[#405049]">
                        {item.name}
                      </b>
                      <p className="mt-1 text-[7px] text-[#87928d]">
                        {item.sku || "No SKU"} · {item.brand || "No brand"} ·{" "}
                        {item.category || "No category"}
                      </p>
                      {item.maturity.blockers[0] ? (
                        <p className="mt-1 text-[7px] text-amber-700">
                          Next: {item.maturity.blockers[0]}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-[#edf3f4] px-2 py-1 text-[7px] font-bold text-[#496c69]">
                        {item.maturity.level}
                      </span>
                      <p className="mt-2 text-[7px] text-[#87928d]">
                        Stock {item.maturity.sellable_stock}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-10 text-center text-[9px] text-[#87928d]">
                No product matches this view.
              </div>
            )}
          </div>
        </article>

        <aside className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">
          {selected ? (
            <>
              <header className="border-b p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#7d8983]">
                      Human verification
                    </p>
                    <h2 className="mt-1 text-[17px] font-bold text-[#26362f]">
                      {selected.name}
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#edf3f4] px-3 py-1.5 text-[8px] font-bold text-[#496c69]">
                    {selected.maturity.level}
                  </span>
                </div>
              </header>

              <div className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-2 text-[7px]">
                  <div className="rounded-xl border p-3">
                    <span className="text-[#87928d]">Live price</span>
                    <b className="mt-1 block text-[8px]">
                      ৳{selected.maturity.live_selling_price}
                    </b>
                  </div>
                  <div className="rounded-xl border p-3">
                    <span className="text-[#87928d]">Sellable stock</span>
                    <b className="mt-1 block text-[8px]">
                      {selected.maturity.sellable_stock}
                    </b>
                  </div>
                  <div className="rounded-xl border p-3">
                    <span className="text-[#87928d]">Ingredient links</span>
                    <b className="mt-1 block text-[8px]">
                      {selected.maturity.ingredient_evidence.verified}/
                      {selected.maturity.ingredient_evidence.total} verified
                    </b>
                  </div>
                  <div className="rounded-xl border p-3">
                    <span className="text-[#87928d]">Skin profiles</span>
                    <b className="mt-1 block text-[8px]">
                      {selected.maturity.skin_evidence.total}
                    </b>
                  </div>
                </div>

                {[
                  ["Skin types", skinTypes, setSkinTypes],
                  ["Primary concerns", concerns, setConcerns],
                  ["Key ingredients", ingredients, setIngredients],
                  ["Benefits", benefits, setBenefits],
                ].map(([label, value, setter]) => (
                  <label
                    className="block text-[7px] font-bold uppercase tracking-[.08em] text-[#66736d]"
                    key={label as string}
                  >
                    {label as string}
                    <textarea
                      className="mt-2 min-h-20 w-full rounded-xl border p-3 text-[8px] font-medium normal-case tracking-normal"
                      onChange={(event) =>
                        (setter as (value: string) => void)(event.target.value)
                      }
                      placeholder="One item per line"
                      value={value as string}
                    />
                  </label>
                ))}

                <label className="block text-[7px] font-bold uppercase tracking-[.08em] text-[#66736d]">
                  How to use
                  <textarea
                    className="mt-2 min-h-20 w-full rounded-xl border p-3 text-[8px] font-medium normal-case tracking-normal"
                    onChange={(event) => setHowToUse(event.target.value)}
                    value={howToUse}
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-[7px] font-bold uppercase tracking-[.08em] text-[#66736d]">
                    Warning status
                    <select
                      className="mt-2 h-10 w-full rounded-xl border bg-white px-3 text-[8px] normal-case"
                      onChange={(event) =>
                        setWarningsStatus(
                          event.target.value as typeof warningsStatus,
                        )
                      }
                      value={warningsStatus}
                    >
                      <option value="unknown">Unknown</option>
                      <option value="verified_none">Verified none</option>
                      <option value="verified_warnings">Verified warnings</option>
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

                {warningsStatus === "verified_warnings" ? (
                  <label className="block text-[7px] font-bold uppercase tracking-[.08em] text-[#66736d]">
                    Verified warnings
                    <textarea
                      className="mt-2 min-h-20 w-full rounded-xl border p-3 text-[8px] font-medium normal-case tracking-normal"
                      onChange={(event) => setWarnings(event.target.value)}
                      placeholder="One warning per line"
                      value={warnings}
                    />
                  </label>
                ) : null}

                <label className="block text-[7px] font-bold uppercase tracking-[.08em] text-[#66736d]">
                  Functional profile
                  <input
                    className="mt-2 h-10 w-full rounded-xl border px-3 text-[8px] normal-case"
                    onChange={(event) => setFunctionalProfile(event.target.value)}
                    value={functionalProfile}
                  />
                </label>

                <label className="block text-[7px] font-bold uppercase tracking-[.08em] text-[#66736d]">
                  Product URL
                  <input
                    className="mt-2 h-10 w-full rounded-xl border px-3 text-[8px] normal-case"
                    onChange={(event) => setProductUrl(event.target.value)}
                    placeholder="https://brandnbeauty.com/products/..."
                    value={productUrl}
                  />
                </label>

                <label className="block text-[7px] font-bold uppercase tracking-[.08em] text-[#66736d]">
                  Verified by
                  <input
                    className="mt-2 h-10 w-full rounded-xl border px-3 text-[8px] normal-case"
                    onChange={(event) => setVerifiedBy(event.target.value)}
                    value={verifiedBy}
                  />
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <input
                    checked={confirmed}
                    className="mt-0.5 accent-[#426d72]"
                    onChange={(event) => setConfirmed(event.target.checked)}
                    type="checkbox"
                  />
                  <span className="text-[7.5px] leading-4 text-amber-900">
                    I reviewed these product facts. Candidate CSV/import content may
                    help fill the form, but this confirmation makes the knowledge
                    human-verified. Live price and stock remain separate commerce data.
                  </span>
                </label>

                <button
                  className="h-10 w-full rounded-xl bg-[#426d72] text-[8px] font-bold text-white disabled:opacity-40"
                  disabled={
                    saving ||
                    !confirmed ||
                    !verifiedBy.trim() ||
                    !split(skinTypes).length ||
                    !split(concerns).length ||
                    (!split(ingredients).length && !functionalProfile.trim()) ||
                    !split(benefits).length ||
                    !howToUse.trim() ||
                    warningsStatus === "unknown" ||
                    (warningsStatus === "verified_warnings" &&
                      !split(warnings).length) ||
                    !productUrl.trim()
                  }
                  onClick={() => void save()}
                  type="button"
                >
                  {saving ? "Saving…" : "Save verified knowledge"}
                </button>

                <div className="rounded-xl bg-[#edf3f4] p-4 text-[7px] leading-4 text-[#5f756f]">
                  Bot readiness: <b>{selected.maturity.bot_readiness_status}</b>
                  <br />
                  Recommendation eligible now:{" "}
                  <b>{selected.maturity.recommendation_eligible ? "Yes" : "No"}</b>
                </div>
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
