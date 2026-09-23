"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  fetchFinanceReconciliation,
  saveFinanceReconciliation,
  type FinanceReconciliationPeriod,
  type FinanceReconciliationRecord,
  type FinanceReconciliationState,
  type FinanceReconciliationStatus,
} from "./finance-reconciliation-client";

const money = (value: number) =>
  new Intl.NumberFormat("en-BD", {
    currency: "BDT",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number(value) || 0);

const today = () => new Date().toISOString().slice(0, 10);

const dateText = (value: string | null) => {
  if (!value) return "Not available";
  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat("en-BD", {
        dateStyle: "medium",
      }).format(parsed);
};

const emptyState: FinanceReconciliationState = {
  generated_at: new Date(0).toISOString(),
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
};

const statusLabel: Record<
  FinanceReconciliationStatus,
  string
> = {
  collected: "Collected",
  mismatch: "Mismatch",
  pending: "Pending",
  returned: "Returned",
  settled: "Settled",
};

function statusTone(status: FinanceReconciliationStatus) {
  if (status === "settled")
    return "bg-emerald-50 text-emerald-700";
  if (status === "mismatch" || status === "returned")
    return "bg-rose-50 text-rose-700";
  if (status === "collected")
    return "bg-sky-50 text-sky-700";
  return "bg-amber-50 text-amber-700";
}

export function LiveFinanceReconciliationWorkspace({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const [state, setState] =
    useState<FinanceReconciliationState>(emptyState);
  const [period, setPeriod] =
    useState<FinanceReconciliationPeriod>("30D");
  const [filter, setFilter] =
    useState<"all" | FinanceReconciliationStatus>("all");
  const [query, setQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] =
    useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [collectedAmount, setCollectedAmount] =
    useState("");
  const [courierDeductionAmount, setCourierDeductionAmount] =
    useState("");
  const [otherDeductionAmount, setOtherDeductionAmount] =
    useState("");
  const [settledAmount, setSettledAmount] =
    useState("");
  const [settlementDate, setSettlementDate] =
    useState(today());
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");

      try {
        const next = await fetchFinanceReconciliation(
          period,
          signal,
        );

        setState(next);
        setSelectedOrderId((current) =>
          next.records.some(
            (item) => item.order_id === current,
          )
            ? current
            : next.records[0]?.order_id ?? "",
        );
      } catch (caught) {
        if (!signal?.aborted) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Finance reconciliation could not be loaded.",
          );
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [period],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const visible = useMemo(
    () =>
      state.records.filter((record) => {
        const needle = query.trim().toLowerCase();

        return (
          (filter === "all" || record.status === filter) &&
          (!needle ||
            [
              record.order_id,
              record.customer_name,
              record.customer_phone,
              record.provider,
              record.tracking_code,
              record.settlement_reference,
            ]
              .filter(Boolean)
              .some((value) =>
                String(value)
                  .toLowerCase()
                  .includes(needle),
              ))
        );
      }),
    [filter, query, state.records],
  );

  const selected =
    state.records.find(
      (record) =>
        record.order_id === selectedOrderId,
    ) ??
    state.records[0] ??
    null;

  function openEditor(
    record: FinanceReconciliationRecord,
  ) {
    if (record.cash_posted) {
      setError(
        "This COD settlement is already posted to Cash & Bank Ledger and is locked here.",
      );
      return;
    }

    setSelectedOrderId(record.order_id);
    setCollectedAmount(
      String(record.collected_amount || ""),
    );
    setCourierDeductionAmount(
      String(record.courier_deduction_amount || ""),
    );
    setOtherDeductionAmount(
      String(record.other_deduction_amount || ""),
    );
    setSettledAmount(
      String(record.settled_amount || ""),
    );
    setSettlementDate(
      record.settlement_date || today(),
    );
    setReference(
      record.settlement_reference ?? "",
    );
    setNote(record.note ?? "");
    setConfirmed(false);
    setEditorOpen(true);
  }

  const draftCollected = Number(collectedAmount || 0);
  const draftCourierDeduction = Number(
    courierDeductionAmount || 0,
  );
  const draftOtherDeduction = Number(
    otherDeductionAmount || 0,
  );
  const draftSettled = Number(settledAmount || 0);

  const draftNetExpected = Math.max(
    0,
    (draftCollected || selected?.expected_amount || 0) -
      draftCourierDeduction -
      draftOtherDeduction,
  );

  const draftDifference =
    draftSettled - draftNetExpected;

  async function save() {
    if (!selected) return;

    setSaving(true);
    setError("");

    try {
      const result =
        await saveFinanceReconciliation({
          collectedAmount: draftCollected,
          confirmed,
          courierDeductionAmount:
            draftCourierDeduction,
          note,
          orderId: selected.order_id,
          otherDeductionAmount:
            draftOtherDeduction,
          period,
          settledAmount: draftSettled,
          settlementDate,
          settlementReference: reference,
        });

      setState(result.state);
      setEditorOpen(false);
      setNotice(result.message);

      window.setTimeout(
        () => setNotice(""),
        3200,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Reconciliation evidence could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#547874]">
            Finance · COD money truth
          </p>
          <h1 className="mt-2 text-[28px] font-bold tracking-[-.04em] text-[#17231f]">
            COD Reconciliation
          </h1>
          <p className="mt-1.5 max-w-3xl text-[10px] font-medium leading-5 text-[#74817b]">
            Separate gross customer collection,
            courier deductions, net expected
            settlement and actual courier payout.
            Settlement evidence is verified here;
            bank/cash posting remains a separate
            Cash &amp; Bank Ledger step.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-xl border border-[#dfe6e3] bg-white p-1">
            {(
              [
                "Today",
                "7D",
                "30D",
                "90D",
              ] as FinanceReconciliationPeriod[]
            ).map((item) => (
              <button
                className={`rounded-lg px-3 py-2 text-[8.5px] font-bold ${
                  period === item
                    ? "bg-[#edf3f4] text-[#426d72]"
                    : "text-[#7c8983]"
                }`}
                key={item}
                onClick={() => setPeriod(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>

          <button
            className="rounded-xl border bg-white px-4 py-2.5 text-[8.5px] font-bold text-[#62706a]"
            disabled={loading}
            onClick={() => void load()}
            type="button"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
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
        {[
          ["Gross expected", money(state.summary.expected)],
          ["Collected", money(state.summary.collected)],
          ["Deductions", money(state.summary.deductions)],
          ["Net expected", money(state.summary.net_expected)],
          ["Settled", money(state.summary.settled)],
          ["Outstanding", money(state.summary.outstanding)],
          [
            "Unposted settled",
            String(
              state.summary.unposted_settlements,
            ),
          ],
        ].map(([label, value]) => (
          <article
            className="rounded-2xl border border-[#e2e8e5] bg-white p-4"
            key={label}
          >
            <p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#87928d]">
              {label}
            </p>
            <strong className="mt-3 block text-[18px] text-[#17231f]">
              {value}
            </strong>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-[8px] leading-4 text-sky-900">
        <b>Settlement formula:</b> Net expected =
        Collected COD − Courier deduction − Other
        deduction. A mismatch is based on the
        actual courier payout versus this net
        expected amount, not versus gross order
        COD.
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <article className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">
          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
            <input
              className="h-10 w-full max-w-md rounded-xl border px-3 text-[8.5px] outline-none"
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search order, customer, courier, tracking or reference"
              value={query}
            />

            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  "all",
                  "pending",
                  "collected",
                  "settled",
                  "mismatch",
                  "returned",
                ] as const
              ).map((item) => (
                <button
                  className={`rounded-lg px-3 py-2 text-[8px] font-bold ${
                    filter === item
                      ? "bg-[#426d72] text-white"
                      : "bg-[#f3f6f4] text-[#6f7c76]"
                  }`}
                  key={item}
                  onClick={() => setFilter(item)}
                  type="button"
                >
                  {item === "all"
                    ? "All"
                    : statusLabel[item]}
                </button>
              ))}
            </div>
          </div>

          {visible.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead className="bg-[#fbfcfb] text-[7px] font-extrabold uppercase tracking-[.1em] text-[#87938d]">
                  <tr>
                    <th className="px-4 py-3">
                      Order / customer
                    </th>
                    <th className="px-3 py-3">
                      Gross
                    </th>
                    <th className="px-3 py-3">
                      Deductions
                    </th>
                    <th className="px-3 py-3">
                      Net expected
                    </th>
                    <th className="px-3 py-3">
                      Settled
                    </th>
                    <th className="px-3 py-3">
                      Difference
                    </th>
                    <th className="px-4 py-3">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#edf1ef]">
                  {visible.map((row) => (
                    <tr
                      className={`cursor-pointer text-[8.5px] ${
                        selected?.order_id ===
                        row.order_id
                          ? "bg-[#f2f7f5]"
                          : "hover:bg-[#fafcfb]"
                      }`}
                      key={row.order_id}
                      onClick={() =>
                        setSelectedOrderId(
                          row.order_id,
                        )
                      }
                    >
                      <td className="px-4 py-3.5">
                        <b className="text-[9px] text-[#34443d]">
                          BNB-
                          {row.order_id.padStart(
                            6,
                            "0",
                          )}{" "}
                          · {row.customer_name}
                        </b>
                        <small className="mt-1 block text-[7px] text-[#909b95]">
                          {row.order_status} ·{" "}
                          {row.provider}
                        </small>
                      </td>
                      <td className="px-3 py-3.5 font-bold">
                        {money(
                          row.collected_amount ||
                            row.expected_amount,
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        {money(
                          row.deduction_total,
                        )}
                      </td>
                      <td className="px-3 py-3.5 font-bold">
                        {money(
                          row.net_expected_amount,
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        {money(
                          row.settled_amount,
                        )}
                      </td>
                      <td
                        className={`px-3 py-3.5 font-bold ${
                          Math.abs(
                            row.difference,
                          ) > 0.01
                            ? "text-rose-700"
                            : "text-emerald-700"
                        }`}
                      >
                        {money(row.difference)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full px-2 py-1 text-[7px] font-bold ${statusTone(
                            row.status,
                          )}`}
                        >
                          {statusLabel[row.status]}
                        </span>
                        {row.cash_posted ? (
                          <span className="ml-1 rounded-full bg-slate-100 px-2 py-1 text-[7px] font-bold text-slate-600">
                            CASH POSTED
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-[9px] font-semibold text-[#7d8983]">
              No COD reconciliation record found
              for this view.
            </div>
          )}
        </article>

        <aside className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">
          {selected ? (
            <>
              <div className="border-b p-5">
                <p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-[#7d8983]">
                  Reconciliation inspector
                </p>
                <h2 className="mt-1.5 text-[17px] font-bold text-[#26362f]">
                  BNB-
                  {selected.order_id.padStart(
                    6,
                    "0",
                  )}
                </h2>
                <p className="mt-1 text-[7.5px] text-[#87928d]">
                  {selected.customer_name} ·{" "}
                  {selected.provider}
                </p>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    [
                      "Gross expected",
                      money(
                        selected.expected_amount,
                      ),
                    ],
                    [
                      "Collected",
                      money(
                        selected.collected_amount,
                      ),
                    ],
                    [
                      "Courier deduction",
                      money(
                        selected.courier_deduction_amount,
                      ),
                    ],
                    [
                      "Other deduction",
                      money(
                        selected.other_deduction_amount,
                      ),
                    ],
                    [
                      "Net expected",
                      money(
                        selected.net_expected_amount,
                      ),
                    ],
                    [
                      "Actual settled",
                      money(
                        selected.settled_amount,
                      ),
                    ],
                  ].map(([label, value]) => (
                    <div
                      className="rounded-xl border p-3"
                      key={label}
                    >
                      <span className="text-[6px] uppercase tracking-[.08em] text-[#929d97]">
                        {label}
                      </span>
                      <b className="mt-1 block text-[7.5px] text-[#405049]">
                        {value}
                      </b>
                    </div>
                  ))}
                </div>

                {selected.cash_posted ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[7.5px] leading-4 text-emerald-800">
                    <b>Cash posted and locked.</b>{" "}
                    Ledger transaction #
                    {selected.finance_transaction_id}
                    {selected.settlement_account_name
                      ? ` · ${selected.settlement_account_name}`
                      : ""}
                    . Settlement evidence is no
                    longer editable here.
                  </div>
                ) : selected.settled_amount > 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[7.5px] leading-4 text-amber-900">
                    <b>
                      Verified settlement is not
                      posted to cash yet.
                    </b>{" "}
                    Use Cash &amp; Bank Ledger to
                    post it exactly once to the
                    destination account.
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#edf3f4] p-4 text-[7.5px] leading-4 text-[#667b76]">
                    Delivered courier collection
                    can be reviewed here. Cash
                    balance changes only in Cash
                    &amp; Bank Ledger.
                  </div>
                )}

                {!selected.cash_posted &&
                selected.order_status !==
                  "returned" ? (
                  <button
                    className="h-10 w-full rounded-xl bg-[#426d72] text-[8.5px] font-bold text-white"
                    onClick={() =>
                      openEditor(selected)
                    }
                    type="button"
                  >
                    Review settlement evidence
                  </button>
                ) : null}

                {selected.settled_amount > 0 &&
                !selected.cash_posted ? (
                  <button
                    className="h-10 w-full rounded-xl border text-[8.5px] font-bold text-[#5f7068]"
                    onClick={() =>
                      onNavigate(
                        "Cash & Bank Ledger",
                      )
                    }
                    type="button"
                  >
                    Open Cash &amp; Bank Ledger
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="p-10 text-center text-[9px] font-semibold text-[#7d8983]">
              Select an order to inspect.
            </div>
          )}
        </aside>
      </section>

      {editorOpen && selected ? (
        <div
          className="fixed inset-0 z-[180] flex items-center justify-center bg-[#17231f]/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.currentTarget ===
                event.target &&
              !saving
            )
              setEditorOpen(false);
          }}
        >
          <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.25)]">
            <header className="border-b p-5">
              <p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#3b646d]">
                Human settlement verification
              </p>
              <h2 className="mt-1.5 text-[18px] font-bold text-[#23322b]">
                BNB-
                {selected.order_id.padStart(
                  6,
                  "0",
                )}
              </h2>
              <p className="mt-1 text-[7.5px] text-[#87928d]">
                Courier fee shown in Operations:{" "}
                {money(selected.delivery_fee)}.
                Enter only the deduction actually
                supported by settlement evidence.
              </p>
            </header>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="text-[7.5px] font-bold text-[#596962]">
                Gross collected COD
                <input
                  className="mt-2 h-10 w-full rounded-xl border px-3 text-[8.5px]"
                  min="0"
                  onChange={(event) =>
                    setCollectedAmount(
                      event.target.value,
                    )
                  }
                  step="0.01"
                  type="number"
                  value={collectedAmount}
                />
              </label>

              <label className="text-[7.5px] font-bold text-[#596962]">
                Courier deduction
                <input
                  className="mt-2 h-10 w-full rounded-xl border px-3 text-[8.5px]"
                  min="0"
                  onChange={(event) =>
                    setCourierDeductionAmount(
                      event.target.value,
                    )
                  }
                  step="0.01"
                  type="number"
                  value={courierDeductionAmount}
                />
              </label>

              <label className="text-[7.5px] font-bold text-[#596962]">
                Other deduction
                <input
                  className="mt-2 h-10 w-full rounded-xl border px-3 text-[8.5px]"
                  min="0"
                  onChange={(event) =>
                    setOtherDeductionAmount(
                      event.target.value,
                    )
                  }
                  step="0.01"
                  type="number"
                  value={otherDeductionAmount}
                />
              </label>

              <label className="text-[7.5px] font-bold text-[#596962]">
                Actual settled amount
                <input
                  className="mt-2 h-10 w-full rounded-xl border px-3 text-[8.5px]"
                  min="0"
                  onChange={(event) =>
                    setSettledAmount(
                      event.target.value,
                    )
                  }
                  step="0.01"
                  type="number"
                  value={settledAmount}
                />
              </label>

              <div className="rounded-xl border bg-[#f8faf9] p-4">
                <span className="text-[7px] uppercase tracking-[.08em] text-[#87928d]">
                  Net expected
                </span>
                <b className="mt-2 block text-[15px] text-[#26362f]">
                  {money(draftNetExpected)}
                </b>
              </div>

              <div
                className={`rounded-xl border p-4 ${
                  Math.abs(draftDifference) >
                  0.01
                    ? "border-rose-200 bg-rose-50"
                    : "border-emerald-200 bg-emerald-50"
                }`}
              >
                <span className="text-[7px] uppercase tracking-[.08em] text-[#87928d]">
                  Settlement difference
                </span>
                <b className="mt-2 block text-[15px] text-[#26362f]">
                  {money(draftDifference)}
                </b>
              </div>

              <label className="text-[7.5px] font-bold text-[#596962]">
                Settlement date
                <input
                  className="mt-2 h-10 w-full rounded-xl border px-3 text-[8.5px]"
                  onChange={(event) =>
                    setSettlementDate(
                      event.target.value,
                    )
                  }
                  type="date"
                  value={settlementDate}
                />
              </label>

              <label className="text-[7.5px] font-bold text-[#596962]">
                Statement / transaction reference
                <input
                  className="mt-2 h-10 w-full rounded-xl border px-3 text-[8.5px]"
                  onChange={(event) =>
                    setReference(
                      event.target.value,
                    )
                  }
                  placeholder="Required when settlement money is recorded"
                  value={reference}
                />
              </label>

              <label className="sm:col-span-2 text-[7.5px] font-bold text-[#596962]">
                Reconciliation note
                <textarea
                  className="mt-2 min-h-24 w-full rounded-xl border p-3 text-[8.5px] leading-4"
                  onChange={(event) =>
                    setNote(event.target.value)
                  }
                  placeholder="Statement date, courier deduction, adjustment or verification basis"
                  value={note}
                />
              </label>

              <div className="sm:col-span-2 rounded-xl border border-sky-200 bg-sky-50 p-4 text-[7px] leading-4 text-sky-900">
                <b>No bank balance changes here.</b>{" "}
                After a verified Settled record is
                saved, post it once from Cash &amp;
                Bank Ledger. Finance Close already
                blocks a period when settled COD is
                still unposted.
              </div>

              <label className="sm:col-span-2 flex cursor-pointer items-start gap-3 rounded-xl border p-4">
                <input
                  checked={confirmed}
                  className="mt-0.5 h-4 w-4 accent-[#3b646d]"
                  onChange={(event) =>
                    setConfirmed(
                      event.target.checked,
                    )
                  }
                  type="checkbox"
                />
                <span>
                  <b className="block text-[8px] text-[#405b58]">
                    I verified these values against
                    real courier settlement evidence
                  </b>
                  <small className="mt-1 block text-[7px] leading-4 text-[#87928d]">
                    Saving creates an immutable
                    before/after audit event.
                  </small>
                </span>
              </label>
            </div>

            <footer className="flex justify-end gap-2 border-t p-4">
              <button
                className="h-10 rounded-xl border px-4 text-[8px] font-bold"
                disabled={saving}
                onClick={() =>
                  setEditorOpen(false)
                }
                type="button"
              >
                Cancel
              </button>

              <button
                className="h-10 rounded-xl bg-[#3b646d] px-4 text-[8px] font-bold text-white disabled:opacity-40"
                disabled={
                  saving ||
                  !confirmed ||
                  !note.trim() ||
                  draftCourierDeduction +
                    draftOtherDeduction >
                    draftCollected ||
                  (draftSettled > 0 &&
                    (!reference.trim() ||
                      !settlementDate))
                }
                onClick={() => void save()}
                type="button"
              >
                {saving
                  ? "Saving…"
                  : "Save verified evidence"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
