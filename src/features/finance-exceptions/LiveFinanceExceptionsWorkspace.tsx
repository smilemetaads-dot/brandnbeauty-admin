"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadFinanceExceptions,
  type FinanceException,
} from "./finance-exceptions-client";

type State = Awaited<ReturnType<typeof loadFinanceExceptions>>;
type View = "all" | "reconciliation" | "profitability" | "expense" | "payable";

const emptyState: State = {
  reconciliation: {
    generated_at: "",
    period: { from: "", key: "30D", to: "" },
    records: [],
    summary: {
      collected: 0,
      deductions: 0,
      expected: 0,
      issues: 0,
      net_expected: 0,
      outstanding: 0,
      records: 0,
      settled: 0,
      unposted_settlements: 0,
    },
  },
  profitability: {
    period: { key: "30D", from: "", to: "" },
    summary: {
      delivered_orders: 0,
      delivered_revenue: 0,
      confirmed_direct_costs: 0,
      known_direct_costs: 0,
      marketing_spend: 0,
      operating_expenses: 0,
      operating_profit: 0,
      operating_margin: null,
      complete_orders: 0,
      needs_cost: 0,
      loss_orders: 0,
      cost_coverage_percent: 100,
    },
    orders: [],
    quality: {
      orders_connected: false,
      order_items_connected: false,
      catalog_costs_connected: false,
      expenses_connected: false,
      marketing_source: "not_connected",
      profit_state: "complete",
      page_load_mode: "read_only",
    },
    methodology: {
      revenue: "",
      direct_costs: "",
      operating_costs: "",
      boundary: "",
    },
    generated_at: "",
  },
  expenses: {
    categories: [],
    category_totals: {},
    generated_at: "",
    period: { from: "", key: "30D", to: "" },
    records: [],
    summary: {
      approved_cost: 0,
      approved_unpaid: 0,
      awaiting_approval: 0,
      drafts: 0,
      paid: 0,
      records: 0,
      rejected: 0,
    },
  },
  control: {
    success: true,
    period: { from: "", to: "" },
    summary: {
      settled_cod: 0,
      outstanding_cod: 0,
      payable_obligations: 0,
      delivered_revenue: 0,
      direct_costs: 0,
      operating_expenses: 0,
      operating_profit: 0,
      operational_cash_proxy: 0,
      delivered_orders: 0,
    },
    alerts: [],
    obligations: [],
  },
  exceptions: [],
  summary: {
    totalExceptions: 0,
    critical: 0,
    reconciliation: 0,
    profitability: 0,
    expenses: 0,
    payables: 0,
  },
};

function money(value: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function tone(severity: FinanceException["severity"]) {
  return severity === "critical"
    ? "bg-rose-50 text-rose-700"
    : "bg-amber-50 text-amber-700";
}

function title(item: FinanceException) {
  if (item.kind === "reconciliation") {
    if (item.record.legacy_unposted_settlement) return "Settlement not posted to cash";
    if (item.record.status === "mismatch") return "COD reconciliation mismatch";
    return "COD amount still outstanding";
  }
  if (item.kind === "profitability") {
    if (item.order.cost_state === "missing" || item.order.contribution_profit === null) {
      return "Cost evidence missing";
    }
    return "Loss-making delivered order";
  }
  if (item.kind === "expense") {
    return item.expense.status === "submitted"
      ? "Expense awaiting approval"
      : "Approved expense still unpaid";
  }
  return item.obligation.status === "overdue"
    ? "Payable overdue"
    : "Open payable obligation";
}

function detail(item: FinanceException) {
  if (item.kind === "reconciliation") {
    return `${item.record.order_id} · ${item.record.provider} · Outstanding ${money(item.record.outstanding_amount)} · Difference ${money(item.record.difference)}`;
  }
  if (item.kind === "profitability") {
    const contribution =
      item.order.contribution_profit === null
        ? "Contribution unavailable"
        : `Contribution ${money(item.order.contribution_profit)}`;
    return `${item.order.order_number} · Revenue ${money(item.order.revenue)} · ${contribution} · Cost state ${item.order.cost_state}`;
  }
  if (item.kind === "expense") {
    return `${item.expense.description} · ${item.expense.vendor || "No vendor"} · ${money(item.expense.amount)} · ${item.expense.status}`;
  }
  return `${item.obligation.payee} · ${item.obligation.description} · Balance ${money(item.obligation.balance)} · Due ${item.obligation.due_date}`;
}

function action(item: FinanceException) {
  if (item.kind === "reconciliation") {
    return { href: "/finance/reconciliation", label: "Open reconciliation" };
  }
  if (item.kind === "profitability") {
    return { href: "/finance/profitability", label: "Open profitability" };
  }
  if (item.kind === "expense") {
    return { href: "/finance/profit-loss", label: "Open expenses / P&L" };
  }
  return { href: "/finance/payables", label: "Open payables" };
}

export function LiveFinanceExceptionsWorkspace() {
  const [state, setState] = useState<State>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>("all");
  const [query, setQuery] = useState("");

  async function refresh(signal?: AbortSignal) {
    setLoading(true);
    setError("");
    try {
      setState(await loadFinanceExceptions(signal));
    } catch (caught) {
      if (!signal?.aborted) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Finance exceptions could not be loaded.",
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

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return state.exceptions.filter((item) => {
      if (view !== "all" && item.kind !== view) return false;
      if (!needle) return true;
      return `${title(item)} ${detail(item)}`.toLowerCase().includes(needle);
    });
  }, [query, state.exceptions, view]);

  const cards = [
    ["Open exceptions", state.summary.totalExceptions],
    ["Critical", state.summary.critical],
    ["Reconciliation", state.summary.reconciliation],
    ["Profitability", state.summary.profitability],
    ["Expense", state.summary.expenses],
    ["Payables", state.summary.payables],
  ] as const;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#547874]">
            Finance · Owner exception control
          </p>
          <h1 className="mt-2 text-[28px] font-bold tracking-[-.04em] text-[#17231f]">
            Finance Exceptions & Profitability
          </h1>
          <p className="mt-1.5 max-w-4xl text-[10px] font-medium leading-5 text-[#74817b]">
            One read-only exception queue across COD reconciliation, order profitability,
            operating expenses, and payables. Existing finance workspaces remain the
            controlled places where evidence is reviewed or mutations are performed.
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
            <p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#87928d]">{label}</p>
            <strong className="mt-3 block text-[22px] text-[#17231f]">{value}</strong>
          </article>
        ))}
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Outstanding COD", money(state.control.summary.outstanding_cod)],
          ["Open payables", money(state.control.summary.payable_obligations)],
          ["30D delivered revenue", money(state.profitability.summary.delivered_revenue)],
          [
            "30D operating profit",
            state.profitability.summary.operating_profit === null
              ? "Needs cost evidence"
              : money(state.profitability.summary.operating_profit),
          ],
        ].map(([label, value]) => (
          <article className="rounded-2xl border border-[#dfe6e3] bg-white p-4" key={label}>
            <p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#87928d]">{label}</p>
            <p className="mt-2 text-[14px] font-extrabold text-[#2f4039]">{value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[#dfe6e3] bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            className="h-10 rounded-xl border px-3 text-[9px] outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search finance exception, order, provider, expense or payee"
            value={query}
          />
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["reconciliation", "COD"],
                ["profitability", "Profitability"],
                ["expense", "Expenses"],
                ["payable", "Payables"],
              ] as [View, string][]
            ).map(([key, label]) => (
              <button
                className={`h-10 rounded-xl px-3 text-[8px] font-bold ${
                  view === key
                    ? "bg-[#426d72] text-white"
                    : "bg-[#f2f5f3] text-[#697770]"
                }`}
                key={key}
                onClick={() => setView(key)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="text-[12px] font-bold text-[#2f4039]">Needs finance attention</h2>
            <p className="mt-1 text-[7.5px] text-[#87928d]">
              30-day reconciliation/profitability/expense evidence plus current open payables.
            </p>
          </div>
          <a className="text-[8px] font-bold text-[#426d72]" href="/finance">
            Open Finance Control →
          </a>
        </div>

        <div className="divide-y">
          {loading ? (
            <div className="p-10 text-center text-[9px] text-[#87928d]">
              Loading finance evidence…
            </div>
          ) : filtered.length ? (
            filtered.map((item, index) => {
              const target = action(item);
              return (
                <article
                  className="flex flex-wrap items-start justify-between gap-4 p-4"
                  key={`${item.kind}-${index}-${title(item)}`}
                >
                  <div className="max-w-4xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-[9px] text-[#33443d]">{title(item)}</b>
                      <span className={`rounded-full px-2 py-1 text-[6.5px] font-bold uppercase ${tone(item.severity)}`}>
                        {item.severity}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[7.5px] leading-4 text-[#7d8a84]">
                      {detail(item)}
                    </p>
                  </div>
                  <a
                    className="rounded-lg border px-3 py-2 text-[7.5px] font-bold text-[#50635c]"
                    href={target.href}
                  >
                    {target.label}
                  </a>
                </article>
              );
            })
          ) : (
            <div className="p-10 text-center text-[9px] text-[#87928d]">
              No finance exceptions match this view.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-[8px] leading-4 text-sky-900">
        <b>Control boundary:</b> this page is read-only. It does not reconcile COD,
        approve expenses, save cost evidence, pay obligations, post ledger entries,
        or close a finance period. Those actions remain inside the existing controlled
        finance workflows with their current confirmation and audit rules.
      </section>
    </div>
  );
}
