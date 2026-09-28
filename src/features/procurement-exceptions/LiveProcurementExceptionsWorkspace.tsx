"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadProcurementExceptions,
  type PurchaseException,
  type ReorderException,
  type SupplierException,
} from "./procurement-exceptions-client";

type State = Awaited<ReturnType<typeof loadProcurementExceptions>>;

const emptyState: State = {
  inventory: {
    generatedAt: "",
    policy: { leadTimeDays: 0, safetyDays: 0, targetCoverDays: 0 },
    products: [],
    source: { itemTable: "", message: "", ready: false, statusGuarded: false },
    summary: {
      noHistory: 0,
      observedDemandSkus: 0,
      reorderCandidates: 0,
      review: 0,
      totalSkus: 0,
      urgent: 0,
    },
  },
  purchases: {
    generatedAt: "",
    orders: [],
    products: [],
    suppliers: [],
    summary: {
      awaitingApproval: 0,
      damagedUnits: 0,
      incomingUnits: 0,
      linkedPayables: 0,
      openOrders: 0,
      openPurchaseValue: 0,
      openQuarantineReceipts: 0,
      quarantineUnits: 0,
      receiving: 0,
      sellableReceivedUnits: 0,
      supplierReturnUnits: 0,
      totalOrders: 0,
    },
    message: "",
  },
  suppliers: {
    generatedAt: "",
    methodology: { boundary: "", receipts: "", score: "", spend: "" },
    summary: {
      averageLeadDays: null,
      completedReceipts: 0,
      evidenceSuppliers: 0,
      onTimeRate: null,
      purchaseSpend: 0,
      receivedUnits: 0,
      topSupplierExposure: 0,
      totalSuppliers: 0,
    },
    suppliers: [],
    timeframe: "90D",
    trend: [],
  },
  reorder: [],
  purchase: [],
  supplier: [],
  summary: {
    reorderCandidates: 0,
    urgentReorders: 0,
    awaitingApproval: 0,
    overdueReceiving: 0,
    quarantineOrders: 0,
    supplierReview: 0,
  },
};

type View = "all" | "reorder" | "purchase" | "supplier";

function money(value: number) {
  return `৳${Math.round(Number(value || 0)).toLocaleString("en-BD")}`;
}

function dateText(value: string) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not set"
    : new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(date);
}

function reorderTone(priority: ReorderException["product"]["priority"]) {
  if (priority === "urgent") return "bg-rose-50 text-rose-700";
  if (priority === "review") return "bg-amber-50 text-amber-700";
  if (priority === "watch") return "bg-sky-50 text-sky-700";
  return "bg-slate-100 text-slate-600";
}

function purchaseLabel(item: PurchaseException) {
  if (item.kind === "awaiting_approval") return "Awaiting approval";
  if (item.kind === "overdue_receiving") return "Expected date passed";
  return "Quarantine open";
}

function purchaseTone(item: PurchaseException) {
  if (item.kind === "overdue_receiving") return "bg-rose-50 text-rose-700";
  if (item.kind === "awaiting_approval") return "bg-amber-50 text-amber-700";
  return "bg-violet-50 text-violet-700";
}

export function LiveProcurementExceptionsWorkspace() {
  const [state, setState] = useState<State>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("all");

  async function refresh(signal?: AbortSignal) {
    setLoading(true);
    setError("");
    try {
      setState(await loadProcurementExceptions(signal));
    } catch (caught) {
      if (!signal?.aborted) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Procurement exceptions could not be loaded.",
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

  const needle = query.trim().toLowerCase();

  const reorder = useMemo(
    () =>
      state.reorder.filter((item) =>
        `${item.product.name} ${item.product.sku} ${item.product.brand} ${item.product.category}`
          .toLowerCase()
          .includes(needle),
      ),
    [needle, state.reorder],
  );

  const purchase = useMemo(
    () =>
      state.purchase.filter((item) =>
        `${item.order.purchaseNumber} ${item.order.supplierName} ${item.order.lines
          .map((line) => `${line.productName} ${line.sku}`)
          .join(" ")}`
          .toLowerCase()
          .includes(needle),
      ),
    [needle, state.purchase],
  );

  const supplier = useMemo(
    () =>
      state.supplier.filter((item) =>
        `${item.supplier.name} ${item.supplier.supplierType}`
          .toLowerCase()
          .includes(needle),
      ),
    [needle, state.supplier],
  );

  const cards = [
    ["Reorder candidates", state.summary.reorderCandidates],
    ["Urgent reorder", state.summary.urgentReorders],
    ["Awaiting approval", state.summary.awaitingApproval],
    ["Overdue receiving", state.summary.overdueReceiving],
    ["Quarantine orders", state.summary.quarantineOrders],
    ["Supplier review", state.summary.supplierReview],
  ] as const;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#547874]">
            Inventory · Procurement · Supplier OS
          </p>
          <h1 className="mt-2 text-[28px] font-bold tracking-[-.04em] text-[#17231f]">
            Procurement & Reorder Exceptions
          </h1>
          <p className="mt-1.5 max-w-4xl text-[10px] font-medium leading-5 text-[#74817b]">
            One read-only exception queue built from observed demand, live inventory,
            controlled purchase orders, receiving/QC, and supplier evidence. It does not
            create or approve a purchase automatically.
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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map(([label, value]) => (
          <article className="rounded-2xl border border-[#dfe6e3] bg-white p-4" key={label}>
            <p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#87928d]">
              {label}
            </p>
            <strong className="mt-3 block text-[22px] text-[#17231f]">{value}</strong>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[#dfe6e3] bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            className="h-10 rounded-xl border px-3 text-[9px] outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search product, SKU, supplier or purchase number"
            value={query}
          />
          <div className="flex flex-wrap gap-2">
            {(["all", "reorder", "purchase", "supplier"] as View[]).map((item) => (
              <button
                className={`h-10 rounded-xl px-3 text-[8px] font-bold ${
                  view === item
                    ? "bg-[#426d72] text-white"
                    : "bg-[#f2f5f3] text-[#697770]"
                }`}
                key={item}
                onClick={() => setView(item)}
                type="button"
              >
                {item === "all"
                  ? "All exceptions"
                  : item === "reorder"
                    ? "Reorder"
                    : item === "purchase"
                      ? "Purchasing"
                      : "Suppliers"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-[#dfe6e3] bg-white p-12 text-center text-[9px] text-[#87928d]">
          Loading procurement evidence…
        </div>
      ) : (
        <div className="space-y-4">
          {(view === "all" || view === "reorder") ? (
            <section className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                <div>
                  <h2 className="text-[12px] font-bold text-[#2f4039]">Reorder exceptions</h2>
                  <p className="mt-1 text-[7.5px] text-[#87928d]">
                    Based on observed order demand, current on-hand, and the existing {state.inventory.policy.leadTimeDays}-day lead + {state.inventory.policy.safetyDays}-day safety policy.
                  </p>
                </div>
                <a className="text-[8px] font-bold text-[#426d72]" href="/inventory">
                  Open Inventory →
                </a>
              </div>
              <div className="divide-y">
                {reorder.length ? reorder.map(({ product }) => (
                  <article className="grid gap-3 p-4 lg:grid-cols-[1fr_repeat(5,110px)] lg:items-center" key={product.id}>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <b className="text-[9px] text-[#33443d]">{product.name}</b>
                        <span className={`rounded-full px-2 py-1 text-[6.5px] font-bold uppercase ${reorderTone(product.priority)}`}>
                          {product.priority.replace("_", " ")}
                        </span>
                      </div>
                      <p className="mt-1 text-[7px] text-[#87928d]">
                        {product.sku || `Product #${product.id}`} · {product.brand || "No brand"}
                      </p>
                    </div>
                    <div><p className="text-[6.5px] text-[#929d97]">On hand</p><b className="text-[9px]">{product.onHand}</b></div>
                    <div><p className="text-[6.5px] text-[#929d97]">Sold 30d</p><b className="text-[9px]">{product.sold30d}</b></div>
                    <div><p className="text-[6.5px] text-[#929d97]">Days cover</p><b className="text-[9px]">{product.daysCover ?? "—"}</b></div>
                    <div><p className="text-[6.5px] text-[#929d97]">Suggested qty</p><b className="text-[9px] text-[#426d72]">{product.recommendedQuantity}</b></div>
                    <div className="text-right">
                      <a className="inline-flex rounded-lg bg-[#426d72] px-3 py-2 text-[7.5px] font-bold text-white" href="/purchases">
                        Open purchasing
                      </a>
                    </div>
                  </article>
                )) : (
                  <div className="p-8 text-center text-[8px] text-[#87928d]">No reorder exceptions match this view.</div>
                )}
              </div>
            </section>
          ) : null}

          {(view === "all" || view === "purchase") ? (
            <section className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                <div>
                  <h2 className="text-[12px] font-bold text-[#2f4039]">Purchase & receiving exceptions</h2>
                  <p className="mt-1 text-[7.5px] text-[#87928d]">
                    Human approval, expected receiving, and QC/quarantine items that still need attention.
                  </p>
                </div>
                <a className="text-[8px] font-bold text-[#426d72]" href="/purchases">
                  Open Purchase Stock →
                </a>
              </div>
              <div className="divide-y">
                {purchase.length ? purchase.map((item, index) => (
                  <article className="flex flex-wrap items-center justify-between gap-4 p-4" key={`${item.order.id}-${item.kind}-${index}`}>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <b className="text-[9px] text-[#33443d]">{item.order.purchaseNumber}</b>
                        <span className={`rounded-full px-2 py-1 text-[6.5px] font-bold ${purchaseTone(item)}`}>
                          {purchaseLabel(item)}
                        </span>
                      </div>
                      <p className="mt-1 text-[7px] text-[#87928d]">
                        {item.order.supplierName} · Expected {dateText(item.order.expectedDate)} · {money(item.order.totalCost)}
                      </p>
                      {item.kind === "quarantine" ? (
                        <p className="mt-1 text-[7px] font-semibold text-violet-700">{item.openUnits} units remain in open quarantine.</p>
                      ) : null}
                    </div>
                    <a className="rounded-lg border px-3 py-2 text-[7.5px] font-bold text-[#50635c]" href="/purchases">
                      Review purchase
                    </a>
                  </article>
                )) : (
                  <div className="p-8 text-center text-[8px] text-[#87928d]">No purchase exceptions match this view.</div>
                )}
              </div>
            </section>
          ) : null}

          {(view === "all" || view === "supplier") ? (
            <section className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                <div>
                  <h2 className="text-[12px] font-bold text-[#2f4039]">Supplier evidence review</h2>
                  <p className="mt-1 text-[7.5px] text-[#87928d]">
                    Uses the existing supplier evidence state. No new score or hidden ranking is invented here.
                  </p>
                </div>
                <a className="text-[8px] font-bold text-[#426d72]" href="/suppliers/analytics">
                  Open Supplier Analytics →
                </a>
              </div>
              <div className="divide-y">
                {supplier.length ? supplier.map(({ supplier }) => (
                  <article className="grid gap-3 p-4 lg:grid-cols-[1fr_repeat(4,120px)] lg:items-center" key={supplier.id}>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <b className="text-[9px] text-[#33443d]">{supplier.name}</b>
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-[6.5px] font-bold uppercase text-amber-700">
                          {supplier.evidenceState}
                        </span>
                      </div>
                      <p className="mt-1 text-[7px] text-[#87928d]">
                        {supplier.supplierType || "Supplier"} · {supplier.paymentTerms || "Terms not set"}
                      </p>
                    </div>
                    <div><p className="text-[6.5px] text-[#929d97]">Open orders</p><b className="text-[9px]">{supplier.openCount}</b></div>
                    <div><p className="text-[6.5px] text-[#929d97]">Open commitment</p><b className="text-[9px]">{money(supplier.openCommitment)}</b></div>
                    <div><p className="text-[6.5px] text-[#929d97]">Avg lead</p><b className="text-[9px]">{supplier.averageLeadDays === null ? "—" : `${supplier.averageLeadDays}d`}</b></div>
                    <div><p className="text-[6.5px] text-[#929d97]">Fulfillment</p><b className="text-[9px]">{supplier.fulfillmentRate === null ? "—" : `${Math.round(supplier.fulfillmentRate)}%`}</b></div>
                  </article>
                )) : (
                  <div className="p-8 text-center text-[8px] text-[#87928d]">No supplier-review items match this view.</div>
                )}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-[8px] leading-4 text-sky-900">
        <b>Human-control boundary:</b> this page does not create purchase orders, approve purchases, receive stock, release quarantine, or pay suppliers. Existing controlled Purchase Stock Entry remains the mutation workflow.
      </section>
    </div>
  );
}
