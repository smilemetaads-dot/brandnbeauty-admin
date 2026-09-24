"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  createPurchaseDraft,
  createPurchasePayable,
  decidePurchase,
  getPurchaseStock,
  receivePurchaseLine,
  resolvePurchaseQuarantine,
  type PurchaseLine,
  type PurchaseOrder,
  type PurchaseProduct,
  type PurchaseReceipt,
  type PurchaseStatus,
  type PurchaseSummary,
  type PurchaseSupplier,
} from "@/features/purchase-stock/purchase-stock-client";

type Filter = "all" | PurchaseStatus;
type DecisionAction =
  | "approve_order"
  | "cancel_order"
  | "submit_for_approval";
type HoldResolution =
  | "released_sellable"
  | "marked_damaged"
  | "returned_supplier";

const emptySummary: PurchaseSummary = {
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
};

const inputClass =
  "mt-2 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[8.5px] font-semibold text-[#52615a] outline-none focus:border-[#9eb7b4]";

function money(value: number) {
  return `৳${Math.round(Number(value || 0)).toLocaleString("en-BD")}`;
}

function dateText(value: string) {
  const date = new Date(value);
  return !value || Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-BD", {
        dateStyle: "medium",
      }).format(date);
}

function statusLabel(value: PurchaseStatus) {
  return value
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
}

function statusTone(value: PurchaseStatus) {
  if (value === "cancelled")
    return "bg-rose-50 text-rose-700";
  if (value === "awaiting_approval")
    return "bg-amber-50 text-amber-700";
  if (
    value === "approved" ||
    value === "partially_received"
  )
    return "bg-sky-50 text-sky-700";
  if (value === "received")
    return "bg-emerald-50 text-emerald-700";
  return "bg-slate-100 text-slate-600";
}

function Kpi({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-[#e2e8e5] bg-white p-4">
      <p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#87928d]">
        {label}
      </p>
      <strong className="mt-3 block text-[20px] tracking-[-.03em] text-[#17231f]">
        {value}
      </strong>
    </article>
  );
}

function Field({
  children,
  label,
}: {
  children?: ReactNode;
  label: string;
}) {
  return (
    <label className="block text-[7px] font-bold uppercase tracking-[.09em] text-[#66736d]">
      {label}
      {children}
    </label>
  );
}

function Modal({
  children,
  note,
  onClose,
  title,
}: {
  children?: ReactNode;
  note: string;
  onClose: () => void;
  title: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center bg-[#17231f]/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.25)]">
        <header className="border-b p-5">
          <p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#3b646d]">
            Controlled procurement
          </p>
          <h2 className="mt-1.5 text-[18px] font-bold text-[#23322b]">
            {title}
          </h2>
          <p className="mt-1 text-[7.5px] text-[#87928d]">
            {note}
          </p>
        </header>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}

export function LivePurchaseStockWorkspace({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<PurchaseSupplier[]>([]);
  const [products, setProducts] = useState<PurchaseProduct[]>([]);
  const [summary, setSummary] =
    useState<PurchaseSummary>(emptySummary);

  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [draftOpen, setDraftOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [expectedDate, setExpectedDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [otherCost, setOtherCost] = useState(0);
  const [internalNote, setInternalNote] = useState("");

  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decisionAction, setDecisionAction] =
    useState<DecisionAction>("submit_for_approval");
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionConfirmed, setDecisionConfirmed] =
    useState(false);

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptLineId, setReceiptLineId] = useState("");
  const [receiptQuantity, setReceiptQuantity] = useState(1);
  const [sellableQuantity, setSellableQuantity] = useState(0);
  const [quarantineQuantity, setQuarantineQuantity] =
    useState(0);
  const [damagedQuantity, setDamagedQuantity] = useState(0);
  const [supplierReturnQuantity, setSupplierReturnQuantity] =
    useState(0);
  const [batchCode, setBatchCode] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [receiptNote, setReceiptNote] = useState("");
  const [receiptConfirmed, setReceiptConfirmed] =
    useState(false);

  const [holdOpen, setHoldOpen] = useState(false);
  const [holdReceipt, setHoldReceipt] =
    useState<PurchaseReceipt | null>(null);
  const [holdQuantity, setHoldQuantity] = useState(1);
  const [holdResolution, setHoldResolution] =
    useState<HoldResolution>("released_sellable");
  const [holdNote, setHoldNote] = useState("");
  const [holdConfirmed, setHoldConfirmed] = useState(false);

  const [payableOpen, setPayableOpen] = useState(false);
  const [payableDueDate, setPayableDueDate] = useState("");
  const [payableAmount, setPayableAmount] = useState(0);
  const [payableNote, setPayableNote] = useState("");
  const [payableConfirmed, setPayableConfirmed] =
    useState(false);

  const apply = useCallback(
    (result: Awaited<ReturnType<typeof getPurchaseStock>>) => {
      setOrders(result.orders);
      setSuppliers(result.suppliers);
      setProducts(result.products);
      setSummary(result.summary);
      setSelectedId((current) =>
        result.orders.some((item) => item.id === current)
          ? current
          : result.orders[0]?.id || "",
      );
    },
    [],
  );

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");

      try {
        apply(await getPurchaseStock(signal));
      } catch (caught) {
        if (!signal?.aborted) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Purchases could not be loaded.",
          );
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [apply],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(
      () => void load(controller.signal),
      0,
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [load]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return orders.filter(
      (item) =>
        (filter === "all" || item.status === filter) &&
        (!needle ||
          [
            item.purchaseNumber,
            item.supplierName,
            ...item.lines.flatMap((line) => [
              line.productName,
              line.sku,
            ]),
          ].some((value) =>
            value.toLowerCase().includes(needle),
          )),
    );
  }, [filter, orders, query]);

  const selected =
    orders.find((item) => item.id === selectedId) ||
    orders[0] ||
    null;

  const selectedSupplier = suppliers.find(
    (item) => item.id === supplierId,
  );
  const selectedProduct = products.find(
    (item) => item.id === productId,
  );

  const draftTotal =
    quantity * unitCost + shippingCost + otherCost;

  const allocationTotal =
    sellableQuantity +
    quarantineQuantity +
    damagedQuantity +
    supplierReturnQuantity;

  const openHoldReceipts =
    selected?.receipts.filter(
      (item) => item.quarantineOpenQuantity > 0,
    ) ?? [];

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4200);
  }

  function openDraft() {
    const firstSupplier = suppliers.find(
      (item) => item.status !== "inactive",
    );

    setSupplierId(firstSupplier?.id || "");
    setProductId(products[0]?.id || "");
    setQuantity(1);
    setUnitCost(0);
    setExpectedDate("");
    setPaymentTerms(
      firstSupplier?.paymentTerms || "Payment on delivery",
    );
    setShippingCost(0);
    setOtherCost(0);
    setInternalNote("");
    setDraftOpen(true);
  }

  async function saveDraft() {
    setSaving(true);
    setError("");

    try {
      const result = await createPurchaseDraft({
        expectedDate,
        internalNote,
        otherCost,
        paymentTerms,
        productId,
        quantity,
        shippingCost,
        supplierId,
        unitCost,
      });

      apply(result);
      setDraftOpen(false);
      flash(result.message);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Purchase draft could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openDecision(action: DecisionAction) {
    setDecisionAction(action);
    setDecisionNote("");
    setDecisionConfirmed(false);
    setDecisionOpen(true);
  }

  async function saveDecision() {
    if (!selected) return;

    setSaving(true);
    setError("");

    try {
      const result = await decidePurchase(
        decisionAction,
        selected.id,
        decisionNote,
      );

      apply(result);
      setDecisionOpen(false);
      flash(result.message);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Purchase decision could not be recorded.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openReceipt(line?: PurchaseLine) {
    const target =
      line ||
      selected?.lines.find(
        (item) =>
          item.receivedQuantity < item.orderedQuantity,
      );

    if (!target) return;

    setReceiptLineId(target.id);
    setReceiptQuantity(
      Math.max(
        1,
        target.orderedQuantity - target.receivedQuantity,
      ),
    );

    // Deliberately default all dispositions to zero.
    // Warehouse staff must make an explicit QC allocation.
    setSellableQuantity(0);
    setQuarantineQuantity(0);
    setDamagedQuantity(0);
    setSupplierReturnQuantity(0);
    setBatchCode("");
    setExpiryDate("");
    setReceiptNote("");
    setReceiptConfirmed(false);
    setReceiptOpen(true);
  }

  async function saveReceipt() {
    if (!selected) return;

    setSaving(true);
    setError("");

    try {
      const result = await receivePurchaseLine({
        batchCode,
        damagedQuantity,
        expiryDate,
        lineId: receiptLineId,
        note: receiptNote,
        orderId: selected.id,
        quantity: receiptQuantity,
        quarantineQuantity,
        sellableQuantity,
        supplierReturnQuantity,
      });

      apply(result);
      setReceiptOpen(false);
      flash(result.message);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Stock receipt could not be posted.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openHold(receipt: PurchaseReceipt) {
    setHoldReceipt(receipt);
    setHoldQuantity(
      Math.max(1, receipt.quarantineOpenQuantity),
    );
    setHoldResolution("released_sellable");
    setHoldNote("");
    setHoldConfirmed(false);
    setHoldOpen(true);
  }

  async function saveHoldResolution() {
    if (!holdReceipt) return;

    setSaving(true);
    setError("");

    try {
      const result = await resolvePurchaseQuarantine({
        note: holdNote,
        quantity: holdQuantity,
        receiptId: holdReceipt.id,
        resolution: holdResolution,
      });

      apply(result);
      setHoldOpen(false);
      flash(result.message);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Quarantine resolution could not be posted.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openPayable() {
    if (!selected) return;

    setPayableAmount(selected.totalCost);
    setPayableDueDate("");
    setPayableNote(
      `Verified supplier payable for ${selected.purchaseNumber}`,
    );
    setPayableConfirmed(false);
    setPayableOpen(true);
  }

  async function savePayable() {
    if (!selected) return;

    setSaving(true);
    setError("");

    try {
      const result = await createPurchasePayable({
        amount: payableAmount,
        dueDate: payableDueDate,
        note: payableNote,
        orderId: selected.id,
      });

      apply(result);
      setPayableOpen(false);
      flash(result.message);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Supplier payable could not be created.",
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
            Procurement · controlled goods receiving
          </p>
          <h1 className="mt-2 text-[28px] font-bold tracking-[-.04em] text-[#17231f]">
            Purchase Stock Entry
          </h1>
          <p className="mt-1.5 max-w-4xl text-[10px] font-medium leading-5 text-[#74817b]">
            Draft → approval → Incoming → physical receiving
            → QC allocation → sellable / quarantine / damaged /
            supplier return → Finance payable.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="h-10 rounded-xl border bg-white px-4 text-[8px] font-bold text-[#62706a]"
            disabled={loading}
            onClick={() => void load()}
            type="button"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            className="h-10 rounded-xl bg-[#426d72] px-4 text-[8px] font-bold text-white disabled:opacity-40"
            disabled={!suppliers.length || !products.length}
            onClick={openDraft}
            type="button"
          >
            New purchase draft
          </button>
        </div>
      </header>

      <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-[8px] leading-4 text-sky-900">
        <b>Inventory rule:</b> approval creates Incoming only.
        Receiving must explicitly allocate every physical unit.
        Only Sellable units increase live product stock.
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[9px] font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        <Kpi
          label="Open purchases"
          value={String(summary.openOrders)}
        />
        <Kpi
          label="Incoming"
          value={String(summary.incomingUnits)}
        />
        <Kpi
          label="Quarantine"
          value={String(summary.quarantineUnits)}
        />
        <Kpi
          label="Damaged"
          value={String(summary.damagedUnits)}
        />
        <Kpi
          label="Awaiting approval"
          value={String(summary.awaitingApproval)}
        />
        <Kpi
          label="Linked payables"
          value={String(summary.linkedPayables)}
        />
        <Kpi
          label="Open value"
          value={money(summary.openPurchaseValue)}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_400px]">
        <article className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">
          <div className="space-y-3 border-b p-4">
            <input
              className="h-10 w-full rounded-xl border px-3 text-[9px] outline-none"
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search purchase, supplier, product or SKU"
              value={query}
            />

            <div className="flex flex-wrap gap-2">
              {(
                [
                  "all",
                  "draft",
                  "awaiting_approval",
                  "approved",
                  "partially_received",
                  "received",
                  "cancelled",
                ] as Filter[]
              ).map((item) => (
                <button
                  className={`h-8 rounded-lg px-3 text-[7.5px] font-bold ${
                    filter === item
                      ? "bg-[#426d72] text-white"
                      : "bg-[#f2f5f3] text-[#697770]"
                  }`}
                  key={item}
                  onClick={() => setFilter(item)}
                  type="button"
                >
                  {item === "all"
                    ? "All"
                    : statusLabel(item)}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-[#fafbfa] text-[7px] font-bold uppercase tracking-[.1em] text-[#87928d]">
                <tr>
                  <th className="p-3">Purchase</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Incoming</th>
                  <th className="p-3">QC hold</th>
                  <th className="p-3">Value</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.length ? (
                  visible.map((item) => {
                    const incoming = item.lines.reduce(
                      (sum, line) =>
                        sum +
                        Math.max(
                          0,
                          line.orderedQuantity -
                            line.receivedQuantity,
                        ),
                      0,
                    );
                    const hold = item.lines.reduce(
                      (sum, line) =>
                        sum + line.quarantineOpenQuantity,
                      0,
                    );

                    return (
                      <tr
                        className={`cursor-pointer text-[8.5px] ${
                          selected?.id === item.id
                            ? "bg-[#f2f7f5]"
                            : "hover:bg-[#fafcfb]"
                        }`}
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                      >
                        <td className="p-3">
                          <b className="text-[#405049]">
                            {item.purchaseNumber}
                          </b>
                          <small className="mt-1 block text-[7px] text-[#87928d]">
                            {dateText(item.createdAt)}
                          </small>
                        </td>
                        <td className="p-3 font-semibold">
                          {item.supplierName}
                        </td>
                        <td className="p-3 font-bold">
                          {incoming}
                        </td>
                        <td className="p-3 font-bold text-amber-700">
                          {hold}
                        </td>
                        <td className="p-3 font-bold">
                          {money(item.totalCost)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2 py-1 text-[7px] font-bold ${statusTone(
                              item.status,
                            )}`}
                          >
                            {statusLabel(item.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      className="p-8 text-center text-[9px] text-[#87928d]"
                      colSpan={6}
                    >
                      No controlled purchase matches this
                      view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white">
          {selected ? (
            <>
              <header className="border-b p-5">
                <p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#7d8983]">
                  Purchase inspector
                </p>
                <h2 className="mt-1 text-[17px] font-bold text-[#26362f]">
                  {selected.purchaseNumber}
                </h2>
                <p className="mt-1 text-[7.5px] text-[#87928d]">
                  {selected.supplierName} · expected{" "}
                  {dateText(selected.expectedDate)}
                </p>
              </header>

              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-2 py-1 text-[7px] font-bold ${statusTone(
                      selected.status,
                    )}`}
                  >
                    {statusLabel(selected.status)}
                  </span>
                  <b className="text-[13px] text-[#405049]">
                    {money(selected.totalCost)}
                  </b>
                </div>

                <div className="space-y-2">
                  {selected.lines.map((line) => (
                    <button
                      className="w-full rounded-xl border p-3 text-left disabled:cursor-default"
                      disabled={
                        ![
                          "approved",
                          "partially_received",
                        ].includes(selected.status)
                      }
                      key={line.id}
                      onClick={() => openReceipt(line)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <b className="text-[8.5px] text-[#405049]">
                            {line.productName}
                          </b>
                          <p className="mt-1 text-[7px] text-[#87928d]">
                            {line.receivedQuantity}/
                            {line.orderedQuantity} physically
                            received · {line.qcStatus}
                          </p>
                        </div>
                        <span className="text-[7.5px] font-bold">
                          {money(line.unitCost)}
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-4 gap-1 text-[6.5px]">
                        <span className="rounded bg-emerald-50 p-1.5 text-emerald-700">
                          Sellable{" "}
                          {line.sellableReceivedQuantity}
                        </span>
                        <span className="rounded bg-amber-50 p-1.5 text-amber-700">
                          Hold{" "}
                          {line.quarantineOpenQuantity}
                        </span>
                        <span className="rounded bg-rose-50 p-1.5 text-rose-700">
                          Damaged{" "}
                          {line.damagedReceivedQuantity}
                        </span>
                        <span className="rounded bg-slate-100 p-1.5 text-slate-700">
                          Return{" "}
                          {line.supplierReturnQuantity}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {openHoldReceipts.length ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <b className="text-[8px] text-amber-900">
                      Quarantine needs decision
                    </b>
                    <div className="mt-2 space-y-2">
                      {openHoldReceipts.map((receipt) => (
                        <button
                          className="w-full rounded-lg bg-white p-3 text-left text-[7.5px]"
                          key={receipt.id}
                          onClick={() => openHold(receipt)}
                          type="button"
                        >
                          Receipt #{receipt.id} ·{" "}
                          {receipt.quarantineOpenQuantity} open ·
                          batch {receipt.batchCode}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selected.status === "draft" ? (
                  <button
                    className="h-10 w-full rounded-xl bg-[#426d72] text-[8px] font-bold text-white"
                    onClick={() =>
                      openDecision("submit_for_approval")
                    }
                    type="button"
                  >
                    Submit for approval
                  </button>
                ) : null}

                {selected.status === "awaiting_approval" ? (
                  <button
                    className="h-10 w-full rounded-xl bg-[#426d72] text-[8px] font-bold text-white"
                    onClick={() =>
                      openDecision("approve_order")
                    }
                    type="button"
                  >
                    Review and approve
                  </button>
                ) : null}

                {["approved", "partially_received"].includes(
                  selected.status,
                ) ? (
                  <button
                    className="h-10 w-full rounded-xl bg-[#426d72] text-[8px] font-bold text-white"
                    onClick={() => openReceipt()}
                    type="button"
                  >
                    Receive with QC allocation
                  </button>
                ) : null}

                {["draft", "awaiting_approval"].includes(
                  selected.status,
                ) ? (
                  <button
                    className="h-10 w-full rounded-xl border border-rose-100 text-[8px] font-bold text-rose-700"
                    onClick={() =>
                      openDecision("cancel_order")
                    }
                    type="button"
                  >
                    Cancel purchase
                  </button>
                ) : null}

                {selected.status === "received" &&
                !selected.financeObligation &&
                openHoldReceipts.length === 0 ? (
                  <button
                    className="h-10 w-full rounded-xl bg-[#3f6770] text-[8px] font-bold text-white"
                    onClick={openPayable}
                    type="button"
                  >
                    Create supplier payable
                  </button>
                ) : null}

                {selected.financeObligation ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[7.5px] leading-4 text-emerald-800">
                    <b>
                      Finance payable #
                      {selected.financeObligation.id}
                    </b>
                    <br />
                    {money(selected.financeObligation.amount)} ·
                    due{" "}
                    {dateText(
                      selected.financeObligation.dueDate,
                    )}{" "}
                    · {selected.financeObligation.status}
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="h-10 rounded-xl border text-[8px] font-bold text-[#596962]"
                    onClick={() => onNavigate("Inventory")}
                    type="button"
                  >
                    Open Inventory
                  </button>
                  <button
                    className="h-10 rounded-xl border text-[8px] font-bold text-[#596962]"
                    onClick={() => onNavigate("Suppliers")}
                    type="button"
                  >
                    Open Suppliers
                  </button>
                </div>

                <div className="rounded-xl bg-[#edf3f4] p-4">
                  <b className="text-[8px] text-[#405b58]">
                    Recent evidence
                  </b>
                  <div className="mt-2 divide-y">
                    {selected.events.length ? (
                      selected.events.slice(0, 5).map((event) => (
                        <div className="py-2" key={event.id}>
                          <b className="text-[7px] text-[#405049]">
                            {event.summary}
                          </b>
                          <p className="mt-1 text-[6.5px] leading-3 text-[#788984]">
                            {event.detail}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="py-2 text-[7px] text-[#87928d]">
                        No event recorded.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-10 text-center text-[9px] text-[#87928d]">
              Select a purchase.
            </div>
          )}
        </aside>
      </section>

      {draftOpen ? (
        <Modal
          note="Draft only · no stock, payable or payment"
          onClose={() => !saving && setDraftOpen(false)}
          title="New purchase draft"
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Supplier">
                <select
                  className={inputClass}
                  onChange={(event) => {
                    setSupplierId(event.target.value);
                    const supplier = suppliers.find(
                      (item) =>
                        item.id === event.target.value,
                    );
                    if (supplier?.paymentTerms) {
                      setPaymentTerms(supplier.paymentTerms);
                    }
                  }}
                  value={supplierId}
                >
                  {suppliers
                    .filter(
                      (item) => item.status !== "inactive",
                    )
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </Field>

              <Field label="Expected date">
                <input
                  className={inputClass}
                  onChange={(event) =>
                    setExpectedDate(event.target.value)
                  }
                  type="date"
                  value={expectedDate}
                />
              </Field>

              <Field label="Product">
                <select
                  className={inputClass}
                  onChange={(event) =>
                    setProductId(event.target.value)
                  }
                  value={productId}
                >
                  {products.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · available {item.available} ·
                      incoming {item.incoming}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Payment terms">
                <input
                  className={inputClass}
                  onChange={(event) =>
                    setPaymentTerms(event.target.value)
                  }
                  value={paymentTerms}
                />
              </Field>

              <Field label="Quantity">
                <input
                  className={inputClass}
                  min="1"
                  onChange={(event) =>
                    setQuantity(
                      Math.max(
                        1,
                        Number(event.target.value) || 1,
                      ),
                    )
                  }
                  type="number"
                  value={quantity}
                />
              </Field>

              <Field label="Unit cost">
                <input
                  className={inputClass}
                  min="0"
                  onChange={(event) =>
                    setUnitCost(
                      Math.max(
                        0,
                        Number(event.target.value) || 0,
                      ),
                    )
                  }
                  type="number"
                  value={unitCost}
                />
              </Field>

              <Field label="Shipping">
                <input
                  className={inputClass}
                  min="0"
                  onChange={(event) =>
                    setShippingCost(
                      Math.max(
                        0,
                        Number(event.target.value) || 0,
                      ),
                    )
                  }
                  type="number"
                  value={shippingCost}
                />
              </Field>

              <Field label="Other cost">
                <input
                  className={inputClass}
                  min="0"
                  onChange={(event) =>
                    setOtherCost(
                      Math.max(
                        0,
                        Number(event.target.value) || 0,
                      ),
                    )
                  }
                  type="number"
                  value={otherCost}
                />
              </Field>
            </div>

            <Field label="Internal purchase note">
              <textarea
                className={`${inputClass} min-h-20 py-3`}
                onChange={(event) =>
                  setInternalNote(event.target.value)
                }
                placeholder="Quote, purpose and verification context"
                value={internalNote}
              />
            </Field>

            <div className="rounded-xl bg-[#edf3f4] p-4 text-[7.5px] text-[#526965]">
              <b>
                {selectedSupplier?.name || "Supplier"} ·{" "}
                {selectedProduct?.name || "Product"}
              </b>
              <span className="mt-1 block">
                Draft total {money(draftTotal)}. Stock and
                Finance remain unchanged.
              </span>
            </div>

            <button
              className="h-10 w-full rounded-xl bg-[#426d72] text-[8px] font-bold text-white disabled:opacity-40"
              disabled={
                saving ||
                !supplierId ||
                !productId ||
                unitCost <= 0 ||
                !expectedDate ||
                internalNote.trim().length < 6
              }
              onClick={() => void saveDraft()}
              type="button"
            >
              {saving ? "Saving…" : "Create draft"}
            </button>
          </div>
        </Modal>
      ) : null}

      {decisionOpen && selected ? (
        <Modal
          note={`${selected.purchaseNumber} · ${selected.supplierName}`}
          onClose={() => !saving && setDecisionOpen(false)}
          title={
            decisionAction === "approve_order"
              ? "Approve purchase"
              : decisionAction === "cancel_order"
                ? "Cancel purchase"
                : "Submit for approval"
          }
        >
          <div className="space-y-4">
            <Field label="Decision note">
              <textarea
                className={`${inputClass} min-h-24 py-3`}
                onChange={(event) =>
                  setDecisionNote(event.target.value)
                }
                placeholder="Explain the evidence and decision"
                value={decisionNote}
              />
            </Field>

            {decisionAction !== "submit_for_approval" ? (
              <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <input
                  checked={decisionConfirmed}
                  className="mt-0.5 accent-[#426d72]"
                  onChange={(event) =>
                    setDecisionConfirmed(
                      event.target.checked,
                    )
                  }
                  type="checkbox"
                />
                <span className="text-[7.5px] leading-4 text-amber-800">
                  I confirm this human decision. Approval
                  creates Incoming only; it does not change
                  physical stock or post money.
                </span>
              </label>
            ) : null}

            <button
              className={`h-10 w-full rounded-xl text-[8px] font-bold text-white disabled:opacity-40 ${
                decisionAction === "cancel_order"
                  ? "bg-rose-700"
                  : "bg-[#426d72]"
              }`}
              disabled={
                saving ||
                decisionNote.trim().length < 6 ||
                (decisionAction !== "submit_for_approval" &&
                  !decisionConfirmed)
              }
              onClick={() => void saveDecision()}
              type="button"
            >
              Record decision
            </button>
          </div>
        </Modal>
      ) : null}

      {receiptOpen && selected ? (
        <Modal
          note={`${selected.purchaseNumber} · explicit QC allocation required`}
          onClose={() => !saving && setReceiptOpen(false)}
          title="Receive physical stock"
        >
          <div className="space-y-4">
            <Field label="Purchase line">
              <select
                className={inputClass}
                onChange={(event) => {
                  setReceiptLineId(event.target.value);
                  const line = selected.lines.find(
                    (item) =>
                      item.id === event.target.value,
                  );
                  if (line) {
                    setReceiptQuantity(
                      Math.max(
                        1,
                        line.orderedQuantity -
                          line.receivedQuantity,
                      ),
                    );
                  }
                  setSellableQuantity(0);
                  setQuarantineQuantity(0);
                  setDamagedQuantity(0);
                  setSupplierReturnQuantity(0);
                }}
                value={receiptLineId}
              >
                {selected.lines
                  .filter(
                    (item) =>
                      item.receivedQuantity <
                      item.orderedQuantity,
                  )
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.productName} ·{" "}
                      {item.orderedQuantity -
                        item.receivedQuantity}{" "}
                      remaining
                    </option>
                  ))}
              </select>
            </Field>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Physical qty">
                <input
                  className={inputClass}
                  min="1"
                  onChange={(event) =>
                    setReceiptQuantity(
                      Math.max(
                        1,
                        Number(event.target.value) || 1,
                      ),
                    )
                  }
                  type="number"
                  value={receiptQuantity}
                />
              </Field>
              <Field label="Batch code">
                <input
                  className={inputClass}
                  onChange={(event) =>
                    setBatchCode(event.target.value)
                  }
                  value={batchCode}
                />
              </Field>
              <Field label="Expiry">
                <input
                  className={inputClass}
                  onChange={(event) =>
                    setExpiryDate(event.target.value)
                  }
                  type="date"
                  value={expiryDate}
                />
              </Field>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-[8px] font-bold text-[#405049]">
                QC disposition — allocate every physical
                unit
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Sellable">
                  <input
                    className={inputClass}
                    min="0"
                    onChange={(event) =>
                      setSellableQuantity(
                        Math.max(
                          0,
                          Number(event.target.value) || 0,
                        ),
                      )
                    }
                    type="number"
                    value={sellableQuantity}
                  />
                </Field>
                <Field label="Quarantine">
                  <input
                    className={inputClass}
                    min="0"
                    onChange={(event) =>
                      setQuarantineQuantity(
                        Math.max(
                          0,
                          Number(event.target.value) || 0,
                        ),
                      )
                    }
                    type="number"
                    value={quarantineQuantity}
                  />
                </Field>
                <Field label="Damaged">
                  <input
                    className={inputClass}
                    min="0"
                    onChange={(event) =>
                      setDamagedQuantity(
                        Math.max(
                          0,
                          Number(event.target.value) || 0,
                        ),
                      )
                    }
                    type="number"
                    value={damagedQuantity}
                  />
                </Field>
                <Field label="Return supplier">
                  <input
                    className={inputClass}
                    min="0"
                    onChange={(event) =>
                      setSupplierReturnQuantity(
                        Math.max(
                          0,
                          Number(event.target.value) || 0,
                        ),
                      )
                    }
                    type="number"
                    value={supplierReturnQuantity}
                  />
                </Field>
              </div>

              <p
                className={`mt-3 text-[7.5px] font-bold ${
                  allocationTotal === receiptQuantity
                    ? "text-emerald-700"
                    : "text-rose-700"
                }`}
              >
                Allocated {allocationTotal} /{" "}
                {receiptQuantity}
              </p>
            </div>

            <Field label="Verification note">
              <textarea
                className={`${inputClass} min-h-20 py-3`}
                onChange={(event) =>
                  setReceiptNote(event.target.value)
                }
                placeholder="Physical count and QC evidence"
                value={receiptNote}
              />
            </Field>

            <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <input
                checked={receiptConfirmed}
                className="mt-0.5 accent-[#426d72]"
                onChange={(event) =>
                  setReceiptConfirmed(event.target.checked)
                }
                type="checkbox"
              />
              <span className="text-[7.5px] leading-4 text-amber-900">
                I physically verified product identity,
                quantity, batch, expiry and the QC
                allocation. Only Sellable quantity will
                increase live stock.
              </span>
            </label>

            <button
              className="h-10 w-full rounded-xl bg-[#426d72] text-[8px] font-bold text-white disabled:opacity-40"
              disabled={
                saving ||
                !receiptConfirmed ||
                !receiptLineId ||
                receiptQuantity < 1 ||
                allocationTotal !== receiptQuantity ||
                batchCode.trim().length < 2 ||
                !expiryDate ||
                receiptNote.trim().length < 6
              }
              onClick={() => void saveReceipt()}
              type="button"
            >
              {saving ? "Posting…" : "Post QC receipt"}
            </button>
          </div>
        </Modal>
      ) : null}

      {holdOpen && holdReceipt ? (
        <Modal
          note={`Receipt #${holdReceipt.id} · ${holdReceipt.quarantineOpenQuantity} unit(s) open`}
          onClose={() => !saving && setHoldOpen(false)}
          title="Resolve quarantine"
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Quantity">
                <input
                  className={inputClass}
                  max={holdReceipt.quarantineOpenQuantity}
                  min="1"
                  onChange={(event) =>
                    setHoldQuantity(
                      Math.max(
                        1,
                        Number(event.target.value) || 1,
                      ),
                    )
                  }
                  type="number"
                  value={holdQuantity}
                />
              </Field>

              <Field label="Resolution">
                <select
                  className={inputClass}
                  onChange={(event) =>
                    setHoldResolution(
                      event.target.value as HoldResolution,
                    )
                  }
                  value={holdResolution}
                >
                  <option value="released_sellable">
                    Release to sellable
                  </option>
                  <option value="marked_damaged">
                    Mark damaged
                  </option>
                  <option value="returned_supplier">
                    Return to supplier
                  </option>
                </select>
              </Field>
            </div>

            <Field label="Resolution evidence">
              <textarea
                className={`${inputClass} min-h-20 py-3`}
                onChange={(event) =>
                  setHoldNote(event.target.value)
                }
                value={holdNote}
              />
            </Field>

            <label className="flex items-start gap-3 rounded-xl border p-4">
              <input
                checked={holdConfirmed}
                className="mt-0.5 accent-[#426d72]"
                onChange={(event) =>
                  setHoldConfirmed(event.target.checked)
                }
                type="checkbox"
              />
              <span className="text-[7.5px] leading-4 text-[#65736c]">
                I confirm the physical QC decision. This
                may move units between Quarantine,
                Sellable or Damaged inventory states.
              </span>
            </label>

            <button
              className="h-10 w-full rounded-xl bg-[#426d72] text-[8px] font-bold text-white disabled:opacity-40"
              disabled={
                saving ||
                !holdConfirmed ||
                holdQuantity < 1 ||
                holdQuantity >
                  holdReceipt.quarantineOpenQuantity ||
                holdNote.trim().length < 6
              }
              onClick={() => void saveHoldResolution()}
              type="button"
            >
              Resolve quarantine
            </button>
          </div>
        </Modal>
      ) : null}

      {payableOpen && selected ? (
        <Modal
          note={`${selected.purchaseNumber} · payment is NOT posted here`}
          onClose={() => !saving && setPayableOpen(false)}
          title="Create Finance payable"
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Payable amount">
                <input
                  className={inputClass}
                  max={selected.totalCost}
                  min="0.01"
                  onChange={(event) =>
                    setPayableAmount(
                      Math.max(
                        0,
                        Number(event.target.value) || 0,
                      ),
                    )
                  }
                  step="0.01"
                  type="number"
                  value={payableAmount}
                />
              </Field>

              <Field label="Due date">
                <input
                  className={inputClass}
                  onChange={(event) =>
                    setPayableDueDate(event.target.value)
                  }
                  type="date"
                  value={payableDueDate}
                />
              </Field>
            </div>

            <Field label="Finance evidence note">
              <textarea
                className={`${inputClass} min-h-20 py-3`}
                onChange={(event) =>
                  setPayableNote(event.target.value)
                }
                value={payableNote}
              />
            </Field>

            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-[7.5px] leading-4 text-sky-900">
              This creates a Finance obligation only.
              Actual supplier payment remains a separate
              Finance → Payable Payments action and
              requires a real Cash/Bank account.
            </div>

            <label className="flex items-start gap-3 rounded-xl border p-4">
              <input
                checked={payableConfirmed}
                className="mt-0.5 accent-[#426d72]"
                onChange={(event) =>
                  setPayableConfirmed(event.target.checked)
                }
                type="checkbox"
              />
              <span className="text-[7.5px] leading-4 text-[#65736c]">
                I verified the accepted supplier invoice
                amount and due date.
              </span>
            </label>

            <button
              className="h-10 w-full rounded-xl bg-[#426d72] text-[8px] font-bold text-white disabled:opacity-40"
              disabled={
                saving ||
                !payableConfirmed ||
                payableAmount <= 0 ||
                payableAmount > selected.totalCost ||
                !payableDueDate ||
                payableNote.trim().length < 6
              }
              onClick={() => void savePayable()}
              type="button"
            >
              Create payable
            </button>
          </div>
        </Modal>
      ) : null}

      {notice ? (
        <div className="fixed bottom-6 right-6 z-[200] max-w-sm rounded-xl bg-[#335e63] px-4 py-3 text-[9px] font-bold leading-5 text-white shadow-xl">
          {notice}
        </div>
      ) : null}
    </div>
  );
}
