"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadGrowthControl,
  type GrowthControlState,
} from "./growth-control-client";

const money = (value: number | null) =>
  value === null
    ? "Unavailable"
    : new Intl.NumberFormat("en-BD", {
        style: "currency",
        currency: "BDT",
        maximumFractionDigits: 0,
      }).format(value);

const ratio = (value: number | null) =>
  value === null ? "—" : `${value.toFixed(2)}×`;

const empty: GrowthControlState | null = null;

function statusTone(kind: "good" | "warn" | "bad" | "neutral") {
  if (kind === "good") return "bg-emerald-50 text-emerald-700";
  if (kind === "bad") return "bg-rose-50 text-rose-700";
  if (kind === "warn") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export function LiveGrowthControlWorkspace() {
  const [state, setState] = useState<GrowthControlState | null>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh(signal?: AbortSignal) {
    setLoading(true);
    setError("");
    try {
      setState(await loadGrowthControl(signal));
    } catch (caught) {
      if (!signal?.aborted) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Growth control could not be loaded.",
        );
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, []);

  const exceptions = useMemo(() => {
    if (!state) return [];
    const items: {
      label: string;
      count: number;
      tone: "bad" | "warn";
      href: string;
      note: string;
    }[] = [];

    if (state.summary.trackingWarnings > 0) {
      items.push({
        label: "Tracking health needs review",
        count: state.summary.trackingWarnings,
        tone: "bad",
        href: "/growth/tracking-attribution",
        note: "One or more event contracts are warning or have no recent data.",
      });
    }

    if (state.summary.openTrackingRemediations > 0) {
      items.push({
        label: "Tracking remediation open",
        count: state.summary.openTrackingRemediations,
        tone: "warn",
        href: "/growth/tracking-attribution",
        note: "Human remediation tasks remain unresolved.",
      });
    }

    if (!state.summary.metaConnected) {
      items.push({
        label: "Meta Ads connector not connected",
        count: 1,
        tone: "warn",
        href: "/growth/meta-ads",
        note: "Campaign sync and controlled change requests need a valid Meta connection.",
      });
    }

    if (state.summary.metaFailedSyncs > 0) {
      items.push({
        label: "Meta sync failures",
        count: state.summary.metaFailedSyncs,
        tone: "bad",
        href: "/growth/meta-ads",
        note: "Recent sync history includes failed runs.",
      });
    }

    if (state.summary.metaPendingChanges > 0) {
      items.push({
        label: "Meta changes awaiting controlled action",
        count: state.summary.metaPendingChanges,
        tone: "warn",
        href: "/growth/meta-ads",
        note: "Pending or approved requests still need controlled review/application.",
      });
    }

    if (state.summary.contentBriefsOpen > 0) {
      items.push({
        label: "Content briefs awaiting decision",
        count: state.summary.contentBriefsOpen,
        tone: "warn",
        href: "/growth/content-creative",
        note: "Draft/review briefs have not reached an approved/rejected state.",
      });
    }

    if (state.summary.creativeReviewNeeded > 0) {
      items.push({
        label: "Creative review needed",
        count: state.summary.creativeReviewNeeded,
        tone: "warn",
        href: "/growth/content-creative",
        note: "Creative review/fatigue/watch evidence needs human attention.",
      });
    }

    if (state.summary.productContentGaps > 0) {
      items.push({
        label: "Product content gaps",
        count: state.summary.productContentGaps,
        tone: "warn",
        href: "/growth/content-creative",
        note: "Creative production still has catalog content dependencies.",
      });
    }

    if (state.summary.missingMediaConsent > 0) {
      items.push({
        label: "Review media missing consent",
        count: state.summary.missingMediaConsent,
        tone: "bad",
        href: "/growth/content-creative",
        note: "Media should not be reused in content until rights/consent evidence is complete.",
      });
    }

    return items;
  }, [state]);

  if (loading && !state) {
    return (
      <div className="flex min-h-[480px] items-center justify-center text-[10px] font-semibold text-[#75847d]">
        Loading Growth Control…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#547874]">
            Growth · Handoff 4 + 5 control layer
          </p>
          <h1 className="mt-2 text-[28px] font-bold tracking-[-.04em] text-[#17231f]">
            Content, Tracking & Ads Control
          </h1>
          <p className="mt-1.5 max-w-4xl text-[10px] font-medium leading-5 text-[#74817b]">
            One owner view over content readiness, tracking/attribution health,
            Meta Ads control, and delivered marketing economics. This page is
            read-only; changes remain inside the existing governed workspaces.
          </p>
        </div>
        <button
          className="rounded-xl border border-[#d9e2de] bg-white px-4 py-2.5 text-[8px] font-bold text-[#405049]"
          onClick={() => void refresh()}
          type="button"
        >
          Refresh
        </button>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[9px] font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      {state ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [
                "Delivered ROAS",
                ratio(state.summary.deliveredRoas),
                `Spend ${money(state.summary.spend)} · Delivered ${money(state.summary.deliveredRevenue)}`,
              ],
              [
                "Contribution after ads",
                money(state.summary.contributionAfterAds),
                "Existing marketing economics; missing cost evidence stays unavailable.",
              ],
              [
                "Attribution coverage",
                `${state.summary.attributedOrders}/${state.summary.attributedOrders + state.summary.unattributedOrders}`,
                `${state.summary.unattributedOrders} orders remain unattributed in the current evidence window.`,
              ],
              [
                "Tracking connectors",
                `${state.summary.connectorsConfigured}/${state.summary.connectorsTotal}`,
                "Configured connector count from the existing tracking foundation.",
              ],
            ].map(([label, value, note]) => (
              <article
                className="rounded-2xl border border-[#dfe6e3] bg-white p-4"
                key={label}
              >
                <p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#87928d]">
                  {label}
                </p>
                <strong className="mt-3 block text-[20px] text-[#17231f]">
                  {value}
                </strong>
                <p className="mt-2 text-[7.5px] leading-4 text-[#87928d]">
                  {note}
                </p>
              </article>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-4">
            {[
              {
                title: "Content & Creative",
                href: "/growth/content-creative",
                status: `${state.summary.creativeReviewNeeded} review · ${state.summary.contentBriefsOpen} briefs`,
                good:
                  state.summary.creativeReviewNeeded === 0 &&
                  state.summary.contentBriefsOpen === 0 &&
                  state.summary.missingMediaConsent === 0,
                note: `${state.summary.productContentGaps} product gaps · ${state.summary.missingMediaConsent} media consent gaps`,
              },
              {
                title: "Tracking & Attribution",
                href: "/growth/tracking-attribution",
                status: `${state.summary.trackingWarnings} warnings · ${state.summary.openTrackingRemediations} remediation`,
                good:
                  state.summary.trackingWarnings === 0 &&
                  state.summary.openTrackingRemediations === 0,
                note: `${state.summary.connectorsConfigured}/${state.summary.connectorsTotal} connectors configured`,
              },
              {
                title: "Meta Ads Control",
                href: "/growth/meta-ads",
                status: state.summary.metaConnected
                  ? "Connected"
                  : "Setup / connection required",
                good:
                  state.summary.metaConnected &&
                  state.summary.metaFailedSyncs === 0 &&
                  state.summary.metaPendingChanges === 0,
                note: `${state.summary.metaPendingChanges} pending changes · ${state.summary.metaFailedSyncs} failed syncs · ${state.summary.metaDrafts} drafts`,
              },
              {
                title: "Marketing Performance",
                href: "/growth/marketing-performance",
                status: `ROAS ${ratio(state.summary.deliveredRoas)}`,
                good:
                  state.summary.deliveredRoas !== null &&
                  state.summary.deliveredRoas >= 1,
                note: `${money(state.summary.spend)} spend · ${money(state.summary.deliveredRevenue)} delivered revenue`,
              },
            ].map((item) => (
              <article
                className="rounded-2xl border border-[#dfe6e3] bg-white p-4"
                key={item.title}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[11px] font-bold text-[#2f4039]">
                      {item.title}
                    </h2>
                    <span
                      className={`mt-2 inline-flex rounded-full px-2 py-1 text-[6.5px] font-bold ${
                        item.good
                          ? statusTone("good")
                          : statusTone("warn")
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
                <p className="mt-3 min-h-8 text-[7.5px] leading-4 text-[#87928d]">
                  {item.note}
                </p>
                <a
                  className="mt-4 inline-flex rounded-lg border px-3 py-2 text-[7.5px] font-bold text-[#50635c]"
                  href={item.href}
                >
                  Open workspace
                </a>
              </article>
            ))}
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">
            <div className="border-b p-4">
              <h2 className="text-[12px] font-bold text-[#2f4039]">
                Growth exceptions needing attention
              </h2>
              <p className="mt-1 text-[7.5px] text-[#87928d]">
                Consolidated from existing governed sources. No new score or
                hidden optimization model is invented here.
              </p>
            </div>

            <div className="divide-y">
              {exceptions.length ? (
                exceptions.map((item) => (
                  <article
                    className="flex flex-wrap items-center justify-between gap-4 p-4"
                    key={`${item.label}-${item.href}`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <b className="text-[9px] text-[#33443d]">
                          {item.label}
                        </b>
                        <span
                          className={`rounded-full px-2 py-1 text-[6.5px] font-bold ${
                            statusTone(item.tone)
                          }`}
                        >
                          {item.count}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[7.5px] leading-4 text-[#7d8a84]">
                        {item.note}
                      </p>
                    </div>
                    <a
                      className="rounded-lg border px-3 py-2 text-[7.5px] font-bold text-[#50635c]"
                      href={item.href}
                    >
                      Review
                    </a>
                  </article>
                ))
              ) : (
                <div className="p-10 text-center text-[9px] text-[#87928d]">
                  No current growth exception is surfaced by the connected
                  evidence.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-[8px] leading-4 text-sky-900">
            <b>Human-control boundary:</b> this control center does not publish
            content, alter tracking settings, change ad budgets/status, approve
            Meta change requests, or write campaign spend. Those actions remain
            inside the existing governed workspaces and their confirmation/audit
            paths.
          </section>
        </>
      ) : null}
    </div>
  );
}
