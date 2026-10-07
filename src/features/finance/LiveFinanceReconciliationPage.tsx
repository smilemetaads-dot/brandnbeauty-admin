"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  fetchFinanceReconciliation,
  saveFinanceReconciliation,
  type FinanceReconciliationData,
  type FinanceReconciliationPeriod,
  type FinanceReconciliationRecord,
  type FinanceReconciliationStatus,
} from "@/features/finance/finance-reconciliation-client";

const money = (value: number) =>
  new Intl.NumberFormat("en-BD", {
    currency: "BDT",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number(value || 0));

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#5E7F85] disabled:bg-slate-100 disabled:text-slate-400";

function Stat({
  helper,
  label,
  value,
}: {
  helper: string;
  label: string;
  value: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-2 text-xl font-black tracking-tight text-slate-950">
        {value}
      </div>
      <p className="mt-2 text-[11px] font-semibold text-[#5E7F85]">
        {helper}
      </p>
    </article>
  );
}

function statusTone(status: FinanceReconciliationStatus) {
  if (status === "settled") return "bg-emerald-50 text-emerald-700";
  if (status === "mismatch") return "bg-rose-50 text-rose-700";
  if (status === "returned") return "bg-slate-200 text-slate-700";
  if (status === "collected") return "bg-sky-50 text-sky-700";
  return "bg-amber-50 text-amber-700";
}

function dateText(value: string | null) {
  if (!value) return "â€”";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(parsed);
}

export function LiveFinanceReconciliationPage() {
  const [data, setData] = useState<FinanceReconciliationData | null>(null);
  const [period, setPeriod] =
    useState<FinanceReconciliationPeriod>("30D");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] =
    useState<"all" | FinanceReconciliationStatus>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [collected, setCollected] = useState(0);
  const [courierDeduction, setCourierDeduction] = useState(0);
  const [otherDeduction, setOtherDeduction] = useState(0);
  const [settled, setSettled] = useState(0);
  const [reference, setReference] = useState("");
  const [settlementDate, setSettlementDate] = useState("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const apply = useCallback((next: FinanceReconciliationData) => {
    setData(next);
    setSelectedOrderId((current) =>
      next.records.some((row) => row.order_id === current)
        ? current
        : next.records[0]?.order_id ?? "",
    );
  }, []);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");

      try {
        apply(await fetchFinanceReconciliation(period, signal));
      } catch (caught) {
        if (!signal?.aborted) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Finance reconciliation unavailable.",
          );
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [apply, period],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const selected =
    data?.records.find((row) => row.order_id === selectedOrderId) ?? null;

  useEffect(() => {
    if (!selected) return;

    setCollected(selected.collected_amount);
    setCourierDeduction(selected.courier_deduction_amount);
    setOtherDeduction(selected.other_deduction_amount);
    setSettled(selected.settled_amount);
    setReference(selected.settlement_reference ?? "");
    setSettlementDate(selected.settlement_date ?? "");
    setNote(selected.note ?? "");
    setConfirmed(false);
  }, [selected]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return (data?.records ?? []).filter((row) => {
      const matchesFilter = filter === "all" || row.status === filter;
      const haystack = [
        row.order_id,
        row.customer_name,
        row.customer_phone,
        row.provider,
        row.tracking_code,
        row.consignment_id,
        row.settlement_reference,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!needle || haystack.includes(needle));
    });
  }, [data, filter, query]);

  const netExpected = Math.max(
    0,
    (collected > 0 ? collected : selected?.expected_amount ?? 0) -
      Math.max(0, courierDeduction) -
      Math.max(0, otherDeduction),
  );

  const projectedDifference = settled - netExpected;
  const orderStatus = selected?.order_status.toLowerCase() ?? "";
  const isReturned = ["returned", "return", "refunded"].includes(orderStatus);
  const canSettle = orderStatus === "delivered" && !selected?.cash_posted;
  const editorLocked = Boolean(selected?.cash_posted);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selected) return;

    if (!confirmed) {
      setError("Confirm that the settlement evidence was checked by a human.");
      return;
    }

    if (!note.trim()) {
      setError("Write a reconciliation note before saving.");
      return;
    }

    if (settled > 0 && (!reference.trim() || !settlementDate)) {
      setError(
        "Settlement reference and settlement date are required when money is recorded.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const next = await saveFinanceReconciliation({
        orderId: selected.order_id,
        period,
        collectedAmount: collected,
        courierDeductionAmount: courierDeduction,
        otherDeductionAmount: otherDeduction,
        settledAmount: settled,
        settlementReference: reference,
        settlementDate,
        note,
      });

      apply(next);
      setMessage(
        next.message ??
          "Reconciliation evidence saved with an audit event.",
      );
      window.setTimeout(() => setMessage(""), 4500);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Reconciliation could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  const summary = data?.summary;

  return (
    <AdminShell>
      <div className="space-y-5">
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#5E7F85]">
              Finance Â· settlement evidence
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              Finance Reconciliation
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
              Verify collected COD, courier deductions, other deductions and
              settlement evidence against delivered orders. Cash posting stays
              a separate controlled ledger step.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["Today", "7D", "30D", "90D"] as const).map((item) => (
              <button
                className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                  period === item
                    ? "border-[#5E7F85] bg-[#5E7F85] text-white"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
                key={item}
                onClick={() => setPeriod(item)}
                type="button"
              >
                {item}
              </button>
            ))}
            <button
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600"
              disabled={loading}
              onClick={() => void load()}
              type="button"
            >
              {loading ? "Refreshingâ€¦" : "Refresh"}
            </button>
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            helper={`${summary?.records ?? 0} COD records`}
            label="Expected COD"
            value={money(summary?.expected ?? 0)}
          />
          <Stat
            helper={`Deductions ${money(summary?.deductions ?? 0)}`}
            label="Net Expected"
            value={money(summary?.net_expected ?? 0)}
          />
          <Stat
            helper={`${summary?.unposted_settlements ?? 0} awaiting ledger posting`}
            label="Settled"
            value={money(summary?.settled ?? 0)}
          />
          <Stat
            helper={`${summary?.issues ?? 0} mismatch / returned issues`}
            label="Outstanding"
            value={money(summary?.outstanding ?? 0)}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_410px]">
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-3 border-b border-slate-100 p-4 lg:grid-cols-[1fr_180px]">
              <input
                className="h-10 rounded-xl border border-slate-200 bg-stone-50 px-3 text-sm outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search order, customer, courier, tracking or reference"
                value={query}
              />
              <select
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                onChange={(event) =>
                  setFilter(
                    event.target.value as
                      | "all"
                      | FinanceReconciliationStatus,
                  )
                }
                value={filter}
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="collected">Collected</option>
                <option value="settled">Settled</option>
                <option value="mismatch">Mismatch</option>
                <option value="returned">Returned</option>
              </select>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm font-semibold text-slate-500">
                Loading reconciliation evidenceâ€¦
              </div>
            ) : rows.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full text-left text-sm">
                  <thead className="bg-stone-50 text-slate-500">
                    <tr>
                      {[
                        "Order",
                        "Customer",
                        "Courier",
                        "Expected",
                        "Collected",
                        "Deductions",
                        "Settled",
                        "Difference",
                        "Status",
                      ].map((heading) => (
                        <th className="px-4 py-3 font-medium" key={heading}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        className={`cursor-pointer border-t border-slate-100 ${
                          selectedOrderId === row.order_id
                            ? "bg-[#5E7F85]/5 shadow-[inset_3px_0_0_#5E7F85]"
                            : "hover:bg-stone-50"
                        }`}
                        key={row.order_id}
                        onClick={() => setSelectedOrderId(row.order_id)}
                      >
                        <td className="px-4 py-3">
                          <Link
                            className="font-bold text-[#5E7F85] hover:underline"
                            href={`/orders/details?id=${row.order_id}`}
                          >
                            BNB-{row.order_id.padStart(6, "0")}
                          </Link>
                          <div className="mt-1 text-xs text-slate-400">
                            {dateText(row.order_created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">
                            {row.customer_name}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {row.customer_phone ?? "No phone"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>{row.provider}</div>
                          <div className="mt-1 text-xs text-slate-400">
                            {row.tracking_code ??
                              row.consignment_id ??
                              "No tracking"}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {money(row.expected_amount)}
                        </td>
                        <td className="px-4 py-3">
                          {money(row.collected_amount)}
                        </td>
                        <td className="px-4 py-3">
                          {money(row.deduction_total)}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {money(row.settled_amount)}
                        </td>
                        <td
                          className={`px-4 py-3 font-bold ${
                            Math.abs(row.difference) > 0.01
                              ? "text-rose-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {money(row.difference)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusTone(
                              row.status,
                            )}`}
                          >
                            {row.status}
                          </span>
                          {row.cash_posted ? (
                            <div className="mt-1 text-[10px] font-semibold text-emerald-700">
                              Posted to ledger
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-sm font-semibold text-slate-500">
                No COD evidence in this period.
              </div>
            )}
          </article>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {selected ? (
              <form
                className="space-y-4"
                key={`${selected.order_id}-${selected.updated_at ?? "new"}`}
                onSubmit={submit}
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#5E7F85]">
                    Human-verified evidence
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">
                    BNB-{selected.order_id.padStart(6, "0")}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {selected.provider} Â· Order {selected.order_status}
                  </p>
                </div>

                {selected.cash_posted ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold leading-5 text-emerald-800">
                    This settlement is already posted to{" "}
                    {selected.settlement_account_name ?? "Cash & Bank Ledger"}.
                    Reconciliation evidence is locked here.
                  </div>
                ) : null}

                {isReturned ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800">
                    Returned orders cannot receive new settlement money.
                    Existing evidence can still be reviewed.
                  </div>
                ) : null}

                <label className="block text-xs font-semibold text-slate-700">
                  Collected COD
                  <input
                    className={inputClass}
                    disabled={editorLocked}
                    min="0"
                    onChange={(event) =>
                      setCollected(Number(event.target.value || 0))
                    }
                    step="0.01"
                    type="number"
                    value={collected}
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    Courier deduction
                    <input
                      className={inputClass}
                      disabled={editorLocked}
                      min="0"
                      onChange={(event) =>
                        setCourierDeduction(Number(event.target.value || 0))
                      }
                      step="0.01"
                      type="number"
                      value={courierDeduction}
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Other deduction
                    <input
                      className={inputClass}
                      disabled={editorLocked}
                      min="0"
                      onChange={(event) =>
                        setOtherDeduction(Number(event.target.value || 0))
                      }
                      step="0.01"
                      type="number"
                      value={otherDeduction}
                    />
                  </label>
                </div>

                <div className="rounded-xl bg-stone-50 p-3 text-xs">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Net expected</span>
                    <b>{money(netExpected)}</b>
                  </div>
                  <div className="mt-2 flex justify-between gap-3">
                    <span className="text-slate-500">Projected difference</span>
                    <b
                      className={
                        Math.abs(projectedDifference) > 0.01
                          ? "text-rose-700"
                          : "text-emerald-700"
                      }
                    >
                      {money(projectedDifference)}
                    </b>
                  </div>
                </div>

                <label className="block text-xs font-semibold text-slate-700">
                  Settled amount
                  <input
                    className={inputClass}
                    disabled={editorLocked || (!canSettle && settled <= 0)}
                    min="0"
                    onChange={(event) =>
                      setSettled(Number(event.target.value || 0))
                    }
                    step="0.01"
                    type="number"
                    value={settled}
                  />
                </label>

                {!canSettle && !editorLocked && !isReturned ? (
                  <p className="text-[11px] font-semibold leading-5 text-amber-700">
                    Settlement money can be recorded only after the order is
                    Delivered.
                  </p>
                ) : null}

                <label className="block text-xs font-semibold text-slate-700">
                  Settlement reference
                  <input
                    className={inputClass}
                    disabled={editorLocked}
                    onChange={(event) => setReference(event.target.value)}
                    placeholder="Courier statement / transaction ID"
                    value={reference}
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  Settlement date
                  <input
                    className={inputClass}
                    disabled={editorLocked}
                    onChange={(event) => setSettlementDate(event.target.value)}
                    type="date"
                    value={settlementDate}
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  Reconciliation note
                  <textarea
                    className={`${inputClass} min-h-24`}
                    disabled={editorLocked}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Evidence source, deductions, mismatch reason or review note"
                    value={note}
                  />
                </label>

                {!editorLocked ? (
                  <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-stone-50 p-3 text-xs font-semibold leading-5 text-slate-700">
                    <input
                      checked={confirmed}
                      className="mt-1"
                      onChange={(event) => setConfirmed(event.target.checked)}
                      type="checkbox"
                    />
                    <span>
                      I checked the courier / settlement evidence and confirm
                      these amounts are not guessed.
                    </span>
                  </label>
                ) : null}

                <button
                  className="w-full rounded-xl bg-[#5E7F85] px-4 py-3 text-sm font-bold text-white disabled:bg-slate-300"
                  disabled={editorLocked || saving || !confirmed}
                  type="submit"
                >
                  {saving ? "Savingâ€¦" : "Save Reconciliation Evidence"}
                </button>

                {selected.legacy_unposted_settlement ? (
                  <Link
                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-xs font-bold text-slate-700"
                    href="/finance/cash-ledger"
                  >
                    Open Cash & Bank Ledger
                  </Link>
                ) : null}
              </form>
            ) : (
              <div className="py-10 text-center text-sm font-semibold text-slate-500">
                Select a COD record to review.
              </div>
            )}
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
