"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

import type { OrderDetailsRecord, OrderItemRecord } from "./order-details-client";

type RealOrderDetailsPageProps = {
  order: OrderDetailsRecord | null;
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

type TerminalAction = "cancel" | "return";

type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

const MANAGE_ORDERS_ENDPOINT = bnbApiUrl("manage_orders.php");

const STATUS_LABELS: Record<string, string> = {
  pending: "New Order",
  pending_sourcing: "Pending Sourcing",
  confirmed: "Confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const NEXT_STATUS_ACTIONS: Record<string, { label: string; nextStatus: string }> = {
  pending: { label: "Confirm Order", nextStatus: "confirmed" },
  pending_sourcing: { label: "Confirm Order", nextStatus: "confirmed" },
  confirmed: { label: "Start Processing", nextStatus: "processing" },
  processing: { label: "Mark Packed", nextStatus: "packed" },
  packed: { label: "Mark Shipped", nextStatus: "shipped" },
  shipped: { label: "Mark Delivered", nextStatus: "delivered" },
};

const CANCEL_ELIGIBLE_STATUSES = new Set(["pending", "pending_sourcing", "confirmed", "processing", "packed"]);
const RETURN_ELIGIBLE_STATUSES = new Set(["shipped", "delivered"]);

function Badge({ children, tone = "default" }: { children: ReactNode; tone?: BadgeTone }) {
  const className = {
    bad: "border-rose-200 bg-rose-50 text-rose-700",
    brand: "border-[#5E7F85]/20 bg-[#5E7F85]/10 text-[#5E7F85]",
    default: "border-slate-200 bg-slate-100 text-slate-600",
    good: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warn: "border-amber-200 bg-amber-50 text-amber-700",
  }[tone];

  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${className}`}>{children}</span>;
}

function BackLink() {
  return (
    <Link
      className="inline-flex rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-bold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E7F85]"
      href="/orders"
    >
      Back to Orders
    </Link>
  );
}

function Card({ children, eyebrow, title }: { children: ReactNode; eyebrow?: string; title: string }) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      {eyebrow ? <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#5E7F85]">{eyebrow}</div> : null}
      <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="max-w-[65%] text-right font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function InfoBlock({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="rounded-2xl bg-stone-50 p-4">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-semibold leading-6 text-slate-900">{children}</div>
    </div>
  );
}

function getOrderStatusTone(status: string): BadgeTone {
  if (status === "delivered") return "good";
  if (status === "cancelled" || status === "returned") return "bad";
  if (status === "pending" || status === "pending_sourcing") return "warn";
  if (["confirmed", "processing", "packed", "shipped"].includes(status)) return "brand";
  return "default";
}

function formatStatus(value: string | null) {
  if (!value) return "Not set";
  return STATUS_LABELS[value] || value.replaceAll("_", " ");
}

function formatText(value: string | null) {
  return value && value.trim() ? value : "Not available";
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-BD", {
    currency: "BDT",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value: string | null) {
  if (!value) return "Not available";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function formatPaymentMethod() {
  return "Cash on Delivery";
}

function getVariantText(item: OrderItemRecord) {
  if (item.variant_name && item.variant_sku) {
    return `${item.variant_name} / Variant SKU ${item.variant_sku}`;
  }

  if (item.variant_name) {
    return item.variant_name;
  }

  if (item.variant_sku) {
    return `Variant SKU ${item.variant_sku}`;
  }

  return null;
}

function getNextStepText(order: OrderDetailsRecord) {
  const action = NEXT_STATUS_ACTIONS[order.order_status];

  if (action) {
    return `Next safe action: ${action.label}.`;
  }

  if (order.order_status === "delivered") {
    return "This order is delivered. No forward action is available here.";
  }

  if (order.order_status === "cancelled" || order.order_status === "returned") {
    return "This order is closed. Cancel and return handling is managed separately.";
  }

  return "No forward action is available for this status.";
}

function TerminalActionModal({
  action,
  error,
  isSubmitting,
  onClose,
  onReasonChange,
  onSubmit,
  reason,
}: {
  action: TerminalAction;
  error: string;
  isSubmitting: boolean;
  onClose: () => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
  reason: string;
}) {
  const isCancel = action === "cancel";

  return (
    <div
      aria-labelledby="terminal-action-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-[1.5rem] bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-slate-950" id="terminal-action-title">
          {isCancel ? "Cancel this order?" : "Mark this order as returned?"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {isCancel
            ? "This will cancel the order and restore eligible stocked inventory. This action should only be used when the order will not be completed."
            : "This will mark the order as returned and restore eligible stocked inventory according to the order status rules."}
        </p>
        <label className="mt-5 block text-sm font-bold text-slate-700">
          {isCancel ? "Cancellation Reason" : "Return Reason"}
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/15"
            disabled={isSubmitting}
            onChange={(event) => onReasonChange(event.target.value)}
            value={reason}
          />
        </label>
        {error ? <p className="mt-3 rounded-xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E7F85]"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            {isCancel ? "Keep Order" : "Keep Current Status"}
          </button>
          <button
            className={`rounded-2xl px-5 py-3 text-sm font-bold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
              isCancel ? "bg-rose-600 hover:bg-rose-700 focus-visible:outline-rose-500" : "bg-[#5E7F85] hover:bg-[#4b6870] focus-visible:outline-[#5E7F85]"
            }`}
            disabled={isSubmitting}
            onClick={onSubmit}
            type="button"
          >
            {isSubmitting ? "Submitting..." : isCancel ? "Cancel Order" : "Mark Returned"}
          </button>
        </div>
      </div>
    </div>
  );
}
function OrderItemCard({ item }: { item: OrderItemRecord }) {
  const variantText = getVariantText(item);
  const image = item.product_image;

  return (
    <article className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[72px_1fr]">
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-stone-100 text-xs font-bold text-slate-400">
        {image ? (
          <span
            aria-hidden="true"
            className="block h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${image})` }}
          />
        ) : (
          "No image"
        )}
      </div>
      <div className="min-w-0 space-y-3">
        <div>
          <h3 className="font-bold text-slate-950">{item.product_name}</h3>
          {variantText ? <p className="mt-1 text-sm font-semibold text-[#5E7F85]">{variantText}</p> : null}
          <p className="mt-1 text-xs font-semibold text-slate-500">SKU {formatText(item.product_sku)}</p>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <DetailRow label="Quantity" value={item.quantity} />
          <DetailRow label="Unit Price" value={formatMoney(item.unit_price)} />
          <DetailRow label="Line Total" value={formatMoney(item.total_price)} />
        </div>
      </div>
    </article>
  );
}

export function RealOrderDetailsPage({ order }: RealOrderDetailsPageProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [terminalAction, setTerminalAction] = useState<TerminalAction | null>(null);
  const [terminalReason, setTerminalReason] = useState("");
  const [terminalError, setTerminalError] = useState("");


  useEffect(() => {
    if (!terminalAction) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isUpdating) {
        setTerminalAction(null);
        setTerminalReason("");
        setTerminalError("");
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isUpdating, terminalAction]);
  if (!order) {
    return (
      <AdminShell>
        <div className="space-y-6">
          <BackLink />
          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <Badge tone="default">Read Only</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">Order Details</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              This order could not be found. Return to Orders and open a details link from an existing order.
            </p>
          </section>
        </div>
      </AdminShell>
    );
  }

  const orderId = order.id;
  const phoneNumber = order.customer_phone;
  const orderNumber = order.order_number ?? `BNB-${orderId}`;
  const totalItems = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
  const nextAction = NEXT_STATUS_ACTIONS[order.order_status];
  const canCancelOrder = CANCEL_ELIGIBLE_STATUSES.has(order.order_status);
  const canReturnOrder = RETURN_ELIGIBLE_STATUSES.has(order.order_status);

  function openTerminalModal(action: TerminalAction) {
    setTerminalAction(action);
    setTerminalReason("");
    setTerminalError("");
  }

  function closeTerminalModal() {
    if (isUpdating) return;
    setTerminalAction(null);
    setTerminalReason("");
    setTerminalError("");
  }

  async function submitTerminalAction() {
    if (!terminalAction) return;

    const reason = terminalReason.trim();
    if (!reason) {
      setTerminalError(terminalAction === "cancel" ? "Enter a cancellation reason." : "Enter a return reason.");
      return;
    }

    const nextStatus = terminalAction === "cancel" ? "cancelled" : "returned";
    setIsUpdating(true);
    setTerminalError("");
    setActionMessage("");

    try {
      const response = await fetch(MANAGE_ORDERS_ENDPOINT, {
        body: JSON.stringify({ id: orderId, status: nextStatus, reason }),
        headers: {
          "Content-Type": "application/json",
          ...adminAuthHeaders(),
        },
        method: "PUT",
      });

      const payload = (await response.json()) as ApiResponse;

      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || payload.error || "Order status could not be updated.");
      }

      setActionMessage(terminalAction === "cancel" ? "Order cancelled." : "Order marked returned.");
      window.location.reload();
    } catch (error) {
      setTerminalError(error instanceof Error ? error.message : "Order status could not be updated.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleStatusChange() {
    if (!nextAction || !order) return;

    setIsUpdating(true);
    setActionMessage("");

    try {
      const response = await fetch(MANAGE_ORDERS_ENDPOINT, {
        body: JSON.stringify({ id: orderId, status: nextAction.nextStatus }),
        headers: {
          "Content-Type": "application/json",
          ...adminAuthHeaders(),
        },
        method: "PUT",
      });

      const payload = (await response.json()) as ApiResponse;

      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || payload.error || "Order status could not be updated.");
      }

      setActionMessage("Order status updated.");
      window.location.reload();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Order status could not be updated.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleCopyPhone() {
    setCopyMessage("");

    if (!phoneNumber || phoneNumber === "Not available") {
      setCopyMessage("Phone number is not available.");
      return;
    }

    try {
      await navigator.clipboard.writeText(phoneNumber);
      setCopyMessage("Phone number copied.");
    } catch {
      setCopyMessage("Copy is not available in this browser.");
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <BackLink />

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">Order {orderNumber}</h1>
                <Badge tone={getOrderStatusTone(order.order_status)}>{formatStatus(order.order_status)}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-500">Placed {formatDate(order.created_at)}</p>
            </div>
            <Link
              className="inline-flex rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E7F85]"
              href={`/orders/details/invoice?id=${orderId}`}
            >
              Print Invoice
            </Link>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card eyebrow="Customer" title="Customer & Delivery">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoBlock label="Customer Name">{order.customer_name}</InfoBlock>
                <InfoBlock label="Phone">
                  <div className="flex flex-wrap items-center gap-2">
                    <a className="text-[#5E7F85] underline-offset-4 hover:underline" href={`tel:${phoneNumber}`}>
                      {phoneNumber}
                    </a>
                    <button
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E7F85]"
                      type="button"
                      onClick={() => void handleCopyPhone()}
                    >
                      Copy Phone
                    </button>
                  </div>
                  {copyMessage ? <p className="mt-1 text-xs text-slate-500">{copyMessage}</p> : null}
                </InfoBlock>
                <InfoBlock label="Delivery Address">
                  <p>{formatText(order.customer_address)}</p>
                  <p className="mt-1 text-slate-500">
                    {formatText(order.delivery_zone)} / {formatText(order.area || order.district)}
                  </p>
                </InfoBlock>
                <InfoBlock label="Payment Method">{formatPaymentMethod()}</InfoBlock>
              </div>
            </Card>

            <Card eyebrow="Products" title="Ordered Items">
              {order.order_items.length ? (
                <div className="space-y-3">
                  {order.order_items.map((item) => (
                    <OrderItemCard item={item} key={item.id} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-stone-50 p-6 text-sm font-semibold text-slate-500">No order items found for this order.</div>
              )}
            </Card>

            {order.note ? (
              <Card eyebrow="Internal" title="Internal Notes">
                <div className="rounded-2xl bg-stone-50 p-4 text-sm font-semibold leading-6 text-slate-700">{order.note}</div>
              </Card>
            ) : null}
          </div>

          <aside className="space-y-6">
            <Card title="Action Center">
              <div className="rounded-2xl border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#5E7F85]">Current Status</div>
                <div className="mt-2">
                  <Badge tone={getOrderStatusTone(order.order_status)}>{formatStatus(order.order_status)}</Badge>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{getNextStepText(order)}</p>
              </div>

              {nextAction ? (
                <button
                  className="mt-4 w-full rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#4b6870] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E7F85] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isUpdating}
                  onClick={() => void handleStatusChange()}
                  type="button"
                >
                  {isUpdating ? "Updating..." : nextAction.label}
                </button>
              ) : null}

              <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4">
                {canCancelOrder ? (
                  <button
                    className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isUpdating}
                    onClick={() => openTerminalModal("cancel")}
                    type="button"
                  >
                    Cancel Order
                  </button>
                ) : null}
                {canReturnOrder ? (
                  <button
                    className="w-full rounded-2xl border border-[#5E7F85]/20 bg-[#5E7F85]/10 px-5 py-3 text-sm font-bold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E7F85] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isUpdating}
                    onClick={() => openTerminalModal("return")}
                    type="button"
                  >
                    Mark Returned
                  </button>
                ) : null}
              </div>

              {actionMessage ? <p className="mt-3 rounded-xl bg-stone-50 px-4 py-2 text-sm font-semibold text-slate-700">{actionMessage}</p> : null}
            </Card>

            <Card title="Order Summary">
              <dl className="space-y-3">
                <DetailRow label="Items" value={totalItems} />
                <DetailRow label="Subtotal" value={formatMoney(order.subtotal)} />
                <DetailRow label="Delivery Charge" value={formatMoney(order.delivery_charge)} />
                {order.discount > 0 ? <DetailRow label="Discount" value={formatMoney(order.discount)} /> : null}
                <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-base">
                  <dt className="font-bold text-slate-900">Total</dt>
                  <dd className="text-right font-black text-slate-950">{formatMoney(order.total)}</dd>
                </div>
              </dl>
            </Card>
          </aside>
        </section>
      </div>
      {terminalAction ? (
        <TerminalActionModal
          action={terminalAction}
          error={terminalError}
          isSubmitting={isUpdating}
          onClose={closeTerminalModal}
          onReasonChange={(value) => {
            setTerminalReason(value);
            setTerminalError("");
          }}
          onSubmit={() => void submitTerminalAction()}
          reason={terminalReason}
        />
      ) : null}
    </AdminShell>
  );
}