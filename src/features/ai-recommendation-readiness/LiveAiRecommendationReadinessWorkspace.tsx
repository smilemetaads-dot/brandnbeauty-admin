"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadAiRecommendationReadiness,
  type AiGate,
  type AiRecommendationReadinessState,
} from "./ai-recommendation-readiness-client";

const emptyState: AiRecommendationReadinessState = {
  summary: {
    total: 0,
    chatbot_eligible: 0,
    skin_test_eligible: 0,
    rule_assisted_eligible: 0,
    blocked_from_all_ai_surfaces: 0,
  },
  products: [],
  policy: {},
  generated_at: "",
};

function GateBadge({ gate }: { gate: AiGate }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[6.5px] font-extrabold uppercase tracking-[.08em] ${gate.eligible ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
      {gate.eligible ? "Eligible" : "Blocked"}
    </span>
  );
}

export function LiveAiRecommendationReadinessWorkspace() {
  const [state, setState] = useState(emptyState);
  const [query, setQuery] = useState("");
  const [surface, setSurface] = useState<"all" | "chatbot" | "skin_test" | "rule_assisted">("all");
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh(signal?: AbortSignal) {
    setLoading(true);
    setError("");
    try {
      setState(await loadAiRecommendationReadiness(signal));
    } catch (caught) {
      if (!signal?.aborted) setError(caught instanceof Error ? caught.message : "AI recommendation readiness could not be loaded.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return state.products.filter((product) => {
      if (needle && !`${product.name} ${product.sku} ${product.brand} ${product.category}`.toLowerCase().includes(needle)) return false;
      if (!blockedOnly) return true;
      if (surface === "all") return !product.chatbot.eligible && !product.skin_test.eligible && !product.rule_assisted.eligible;
      return !product[surface].eligible;
    });
  }, [blockedOnly, query, state.products, surface]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#547874]">AI Commerce · unified release gate</p>
          <h1 className="mt-2 text-[28px] font-bold tracking-[-.04em] text-[#17231f]">AI Recommendation Readiness</h1>
          <p className="mt-1.5 max-w-4xl text-[10px] font-medium leading-5 text-[#74817b]">
            One shared gate for Messenger recommendations, Skin Test selection, and rule-assisted recommendations. Manual storefront recommendation sets are not changed.
          </p>
        </div>
        <button className="rounded-xl border border-[#d9e2de] bg-white px-4 py-2.5 text-[8px] font-bold text-[#405049]" onClick={() => void refresh()} type="button">Refresh</button>
      </header>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[9px] font-semibold text-rose-700">{error}</div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Catalog products", state.summary.total],
          ["Chatbot eligible", state.summary.chatbot_eligible],
          ["Skin Test eligible", state.summary.skin_test_eligible],
          ["Rule-assisted eligible", state.summary.rule_assisted_eligible],
          ["Blocked everywhere", state.summary.blocked_from_all_ai_surfaces],
        ].map(([label, value]) => (
          <article className="rounded-2xl border border-[#dfe6e3] bg-white p-4" key={String(label)}>
            <p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#87928d]">{String(label)}</p>
            <strong className="mt-3 block text-[22px] text-[#17231f]">{Number(value)}</strong>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[#dfe6e3] bg-white">
        <div className="grid gap-3 border-b p-4 lg:grid-cols-[1fr_180px_auto]">
          <input className="h-10 rounded-xl border px-3 text-[9px] outline-none" onChange={(e) => setQuery(e.target.value)} placeholder="Search product, SKU, brand or category" value={query} />
          <select className="h-10 rounded-xl border bg-white px-3 text-[8px]" onChange={(e) => setSurface(e.target.value as typeof surface)} value={surface}>
            <option value="all">All AI surfaces</option>
            <option value="chatbot">Messenger chatbot</option>
            <option value="skin_test">Skin Test</option>
            <option value="rule_assisted">Rule-assisted</option>
          </select>
          <label className="flex h-10 items-center gap-2 rounded-xl border px-3 text-[8px] font-semibold text-[#58665f]">
            <input checked={blockedOnly} onChange={(e) => setBlockedOnly(e.target.checked)} type="checkbox" />
            Blocked only
          </label>
        </div>

        <div className="divide-y">
          {loading ? (
            <div className="p-10 text-center text-[9px] text-[#87928d]">Loading AI readiness…</div>
          ) : filtered.length ? (
            filtered.map((product) => (
              <article className="p-4" key={product.product_id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <b className="text-[9px] text-[#33443d]">{product.name}</b>
                    <p className="mt-1 text-[7px] text-[#87928d]">{product.sku || "No SKU"} · {product.brand || "No brand"} · {product.category || "No category"}</p>
                  </div>
                  <span className="rounded-full bg-[#f2f5f3] px-2 py-1 text-[6.5px] font-bold uppercase text-[#697770]">{product.status}</span>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  {([
                    ["chatbot", "Messenger"],
                    ["skin_test", "Skin Test"],
                    ["rule_assisted", "Rule-assisted"],
                  ] as const).map(([key, label]) => {
                    const gate = product[key];
                    return (
                      <div className="rounded-xl border bg-[#fbfcfc] p-3" key={key}>
                        <div className="flex items-center justify-between gap-2">
                          <b className="text-[7.5px] text-[#45554e]">{label}</b>
                          <GateBadge gate={gate} />
                        </div>
                        <p className="mt-2 text-[7px] text-[#7c8983]">
                          Stock {gate.sellable_stock ?? 0} · Knowledge {gate.bot_readiness_status || "NOT_READY"} · Safe claims {key === "chatbot" ? gate.chatbot_safe_claims ?? 0 : gate.customer_facing_claims ?? 0}
                        </p>
                        {gate.blockers?.length ? (
                          <ul className="mt-2 space-y-1 text-[7px] leading-4 text-amber-700">
                            {gate.blockers.slice(0, 5).map((blocker) => <li key={blocker.code}>• {blocker.message}</li>)}
                          </ul>
                        ) : (
                          <p className="mt-2 text-[7px] font-semibold text-emerald-700">Passed unified AI recommendation gate.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            ))
          ) : (
            <div className="p-10 text-center text-[9px] text-[#87928d]">No products match this readiness view.</div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-[8px] leading-4 text-sky-900">
        <b>Release policy:</b> AI surfaces require an active product, sellable stock, human-verified READY product knowledge, and verified surface-safe claim evidence. Skin Test also requires a reviewed skin-product profile. Routine compatibility is evaluated after base eligibility when current-routine context exists. Commercial priority may only break ties after suitability and safety.
      </section>
    </div>
  );
}
