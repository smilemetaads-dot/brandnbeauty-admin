"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type PeriodKey = "Today" | "7D" | "30D" | "90D";
type DomainStatus = "ready" | "review" | "no_evidence" | "unavailable";
type SignalLevel = "clear" | "watch" | "attention";

type ReportsDomain = {
  id: string;
  note: string;
  primary_label: string;
  primary_value: string;
  route: string;
  secondary_label: string;
  secondary_value: string;
  status: DomainStatus;
  title: string;
};

type ReportsSignal = {
  id: string;
  level: SignalLevel;
  note: string;
  route: string;
  title: string;
};

type ProfitOrder = {
  contribution_profit: number | null;
  cost_state: string;
  customer_name: string;
  direct_cost: number;
  id: string;
  margin_percent: number | null;
  order_number: string;
  revenue: number;
};

type ReportsPayload = {
  domains: ReportsDomain[];
  generated_at: string;
  methodology: {
    boundary: string;
    inventory: string;
    profit: string;
    revenue: string;
    supplier: string;
  };
  period: {
    from: string;
    key: string;
    to: string;
  };
  profit_orders: ProfitOrder[];
  quality: {
    available_domains: number;
    mode: string;
    profit_state: string;
    unavailable_domains: string[];
  };
  signals: ReportsSignal[];
  success: boolean;
  summary: {
    approved_expenses: number;
    attention_count: number;
    available_domains: number;
    confirmed_direct_costs: number;
    cost_coverage_percent: number;
    delivered_orders: number;
    delivered_revenue: number;
    marketing_spend: number;
    operating_margin: number | null;
    operating_profit: number | null;
    outstanding_cod: number;
    reorder_candidates: number;
    settled_cod: number;
    supplier_exposure_percent: number;
    urgent_inventory: number;
  };
};

const ENDPOINT = bnbApiUrl("manage_reports_insights.php");
const PERIODS: PeriodKey[] = ["Today", "7D", "30D", "90D"];

const money = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "Needs evidence"
    : new Intl.NumberFormat("en-BD", {
        style: "currency",
        currency: "BDT",
        maximumFractionDigits: 0,
      }).format(value);

function statusClass(status: DomainStatus) {
  if (status === "ready") return "bg-emerald-50 text-emerald-700";
  if (status === "review") return "bg-amber-50 text-amber-800";
  if (status === "unavailable") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

function signalClass(level: SignalLevel) {
  if (level === "clear") return "border-emerald-200 bg-emerald-50";
  if (level === "attention") return "border-rose-200 bg-rose-50";
  return "border-amber-200 bg-amber-50";
}

function labelize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

export function LiveReportsInsightsPage() {
  const [period, setPeriod] = useState<PeriodKey>("30D");
  const [data, setData] = useState<ReportsPayload | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (selectedPeriod: PeriodKey, signal?: AbortSignal) => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${ENDPOINT}?period=${encodeURIComponent(selectedPeriod)}`,
        {
          cache: "no-store",
          headers: adminAuthHeaders(),
          signal,
        },
      );
      const payload = (await response.json()) as ReportsPayload & { message?: string };

      if (!response.ok || payload.success !== true) {
        throw new Error(payload.message ?? "Reports & Insights is unavailable.");
      }

      setData(payload);
    } catch (error) {
      if (!signal?.aborted) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Reports & Insights is unavailable.",
        );
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(period, controller.signal);
    return () => controller.abort();
  }, [load, period]);

  const summary = data?.summary;

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#5E7F85]">
                Read-only consolidated evidence
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Reports & Insights
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Live profitability, COD reconciliation, approved expenses,
                inventory planning and supplier evidence in one management view.
                This workspace does not mutate orders, stock, finance, suppliers
                or marketing data.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PERIODS.map((item) => (
                <button
                  className={
                    period === item
                      ? "rounded-full bg-[#5E7F85] px-4 py-2 text-xs font-black text-white"
                      : "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600"
                  }
                  key={item}
                  onClick={() => setPeriod(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        {message ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">
            {message}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {[
            ["Delivered Revenue", money(summary?.delivered_revenue)],
            ["Operating Profit", money(summary?.operating_profit)],
            ["Settled COD", money(summary?.settled_cod)],
            ["Outstanding COD", money(summary?.outstanding_cod)],
            ["Cost Coverage", `${summary?.cost_coverage_percent ?? 0}%`],
            ["Attention", String(summary?.attention_count ?? 0)],
          ].map(([label, value]) => (
            <div
              className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
              key={label}
            >
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                {label}
              </div>
              <div className="mt-3 text-xl font-black text-slate-950">
                {loading ? "Loading..." : value}
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Evidence domains
                </div>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Management coverage
                </h2>
              </div>
              <div className="rounded-full bg-[#5E7F85]/10 px-3 py-1 text-xs font-black text-[#5E7F85]">
                {data?.quality.available_domains ?? 0} live domains
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {(data?.domains ?? []).map((domain) => (
                <div
                  className="rounded-2xl border border-slate-200 p-4"
                  key={domain.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="font-black text-slate-950">{domain.title}</div>
                      <div className="mt-1 text-sm font-medium text-slate-500">
                        {domain.note}
                      </div>
                    </div>
                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${statusClass(domain.status)}`}
                    >
                      {labelize(domain.status)}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-stone-50 p-3">
                      <div className="text-xs font-bold text-slate-500">
                        {domain.primary_label}
                      </div>
                      <div className="mt-1 font-black text-slate-950">
                        {domain.primary_value}
                      </div>
                    </div>
                    <div className="rounded-xl bg-stone-50 p-3">
                      <div className="text-xs font-bold text-slate-500">
                        {domain.secondary_label}
                      </div>
                      <div className="mt-1 font-black text-slate-950">
                        {domain.secondary_value}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs font-bold text-[#5E7F85]">
                    Source: {domain.route}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Management signals
              </div>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                What needs attention
              </h2>
              <div className="mt-5 space-y-3">
                {(data?.signals ?? []).map((signal) => (
                  <div
                    className={`rounded-2xl border p-4 ${signalClass(signal.level)}`}
                    key={signal.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-black text-slate-950">{signal.title}</div>
                      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                        {signal.level}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                      {signal.note}
                    </p>
                    <div className="mt-2 text-xs font-bold text-[#5E7F85]">
                      Review: {signal.route}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-[#5E7F85]/20 bg-[#5E7F85]/5 p-6 shadow-sm">
              <div className="text-sm font-black text-[#5E7F85]">
                Evidence quality
              </div>
              <div className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
                <div>Profit state: {labelize(data?.quality.profit_state ?? "unknown")}</div>
                <div>Mode: {labelize(data?.quality.mode ?? "read_only")}</div>
                <div>
                  Unavailable domains:{" "}
                  {data?.quality.unavailable_domains?.length
                    ? data.quality.unavailable_domains.join(", ")
                    : "None"}
                </div>
              </div>
            </section>
          </aside>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Order-level evidence
              </div>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                Profitability sample
              </h2>
            </div>
            <div className="text-xs font-bold text-slate-500">
              {data?.period.from ?? "—"} to {data?.period.to ?? "—"}
            </div>
          </div>

          {(data?.profit_orders ?? []).length ? (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="bg-stone-50 text-slate-500">
                  <tr>
                    {[
                      "Order",
                      "Customer",
                      "Revenue",
                      "Direct Cost",
                      "Contribution",
                      "Margin",
                      "Cost State",
                      "Action",
                    ].map((heading) => (
                      <th className="px-5 py-4 font-medium" key={heading}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.profit_orders ?? []).slice(0, 50).map((order) => (
                    <tr className="border-t border-slate-100" key={order.id}>
                      <td className="px-5 py-4 font-black text-slate-950">
                        {order.order_number}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {order.customer_name}
                      </td>
                      <td className="px-5 py-4 font-bold">{money(order.revenue)}</td>
                      <td className="px-5 py-4 font-bold">{money(order.direct_cost)}</td>
                      <td className="px-5 py-4 font-bold">
                        {money(order.contribution_profit)}
                      </td>
                      <td className="px-5 py-4">
                        {order.margin_percent === null
                          ? "Needs evidence"
                          : `${order.margin_percent}%`}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                          {labelize(order.cost_state)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          className="inline-flex rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-black text-[#5E7F85]"
                          href={`/orders/details?id=${encodeURIComponent(order.id)}`}
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-sm font-semibold text-slate-500">
              No order-level profitability evidence for this period.
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Methodology</div>
          <h2 className="mt-1 text-xl font-black text-slate-950">
            What these numbers mean
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              ["Revenue", data?.methodology.revenue],
              ["Profit", data?.methodology.profit],
              ["Inventory", data?.methodology.inventory],
              ["Supplier", data?.methodology.supplier],
              ["Boundary", data?.methodology.boundary],
            ].map(([label, value]) => (
              <div className="rounded-2xl bg-stone-50 p-4" key={label}>
                <div className="text-xs font-black uppercase tracking-[0.12em] text-[#5E7F85]">
                  {label}
                </div>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                  {value ?? "No methodology returned."}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs font-semibold text-slate-500">
            Generated: {data?.generated_at ?? "Waiting for live evidence"}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
