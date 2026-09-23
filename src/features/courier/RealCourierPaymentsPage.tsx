"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  bookCourier,
  fetchLogisticsOrders,
  syncCourierStatus,
  type LogisticsOrderRecord,
  updateOrderStatus,
} from "@/features/logistics/logistics-client";

type CourierPaymentOrderRecord = LogisticsOrderRecord;

type RealCourierPaymentsPageProps = {
  orders?: CourierPaymentOrderRecord[];
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const STATUS_LABELS: Record<string, string> = {
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
};

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

function StatCard({ helper, label, value }: { helper: string; label: string; value: ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</div>
      <div className="mt-3 inline-flex rounded-full bg-[#5E7F85]/10 px-3 py-1 text-xs font-semibold text-[#5E7F85]">{helper}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <b className="text-right text-slate-900">{value}</b>
    </div>
  );
}

function formatStatus(value: string | null) {
  if (!value) return "Not set";
  return STATUS_LABELS[value] || value.replaceAll("_", " ");
}

function statusTone(status: string): BadgeTone {
  if (status === "delivered") return "good";
  if (status === "shipped") return "brand";
  if (status === "packed") return "warn";
  return "default";
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

function formatLocation(order: CourierPaymentOrderRecord) {
  return order.delivery_zone || order.area || order.district || "Delivery area unavailable";
}

function getItemCount(order: CourierPaymentOrderRecord) {
  return order.order_items.reduce((sum, item) => sum + item.quantity, 0);
}

function getItemsSummary(order: CourierPaymentOrderRecord) {
  if (!order.order_items.length) {
    return "Item details unavailable";
  }

  const visibleItems = order.order_items
    .slice(0, 2)
    .map((item) => `${item.product_name} x${item.quantity}`)
    .join(", ");

  return order.order_items.length > 2 ? `${visibleItems}, +${order.order_items.length - 2} more` : visibleItems;
}

function getTrackingText(order: CourierPaymentOrderRecord) {
  const parts = [order.courier_name, order.courier_tracking_id].filter(Boolean);
  return parts.length ? parts.join(" / ") : null;
}

function CourierCard({
  onBookCourier,
  onSyncCourier,
  isUpdating,
  onMarkShipped,
  order,
}: {
  isUpdating?: boolean;
  onBookCourier?: (order: CourierPaymentOrderRecord) => void;
  onSyncCourier?: (order: CourierPaymentOrderRecord) => void;
  onMarkShipped?: (orderId: string) => void;
  order: CourierPaymentOrderRecord;
}) {
  const tracking = getTrackingText(order);
  const isPacked = order.order_status === "packed";

  return (
    <article className="flex h-full flex-col rounded-[1.5rem] border border-slate-200 bg-stone-50 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-slate-950">{order.order_number ?? `BNB-${order.id}`}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-800">{order.customer_name}</p>
          <a className="mt-1 block text-xs font-semibold text-[#5E7F85] underline-offset-4 hover:underline" href={`tel:${order.customer_phone}`}>
            {order.customer_phone}
          </a>
        </div>
        <Badge tone={statusTone(order.order_status)}>{formatStatus(order.order_status)}</Badge>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4">
        <DetailRow label="Delivery Area" value={formatLocation(order)} />
        <DetailRow label="Total" value={formatMoney(order.total)} />
        <DetailRow label="Payment" value="Cash on Delivery" />
        <DetailRow label="Items" value={getItemCount(order)} />
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Address</div>
        <p className="mt-2 font-semibold">{formatText(order.shipping_address)}</p>
        <p className="mt-2 text-xs font-semibold text-slate-500">{getItemsSummary(order)}</p>
      </div>

      {tracking ? (
        <div className="mt-4 rounded-2xl border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-4 text-sm font-semibold text-[#5E7F85]">
          {tracking}
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-3 pt-5">
        <Link
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E7F85]"
          href={`/orders/details?id=${order.id}`}
        >
          View Order
        </Link>
        {isPacked && onBookCourier ? (
          <button
            className="rounded-2xl border border-[#5E7F85]/30 bg-white px-4 py-3 text-sm font-semibold text-[#5E7F85] transition hover:bg-[#5E7F85]/5"
            onClick={() => onBookCourier(order)}
            type="button"
          >
            {tracking ? "Edit Booking" : "Book Courier"}
          </button>
        ) : null}
        {isPacked && onMarkShipped ? (
          <button
            className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E7F85] disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isUpdating}
            onClick={() => onMarkShipped(order.id)}
            type="button"
          >
            {isUpdating ? "Updating..." : "Mark Shipped"}
          </button>
        ) : null}
        {order.order_status === "shipped" && onSyncCourier ? (
          <button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-950" onClick={() => onSyncCourier(order)} type="button">
            Update Delivery
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function RealCourierPaymentsPage({ orders: initialOrders = [] }: RealCourierPaymentsPageProps) {
  const [orders, setOrders] = useState<CourierPaymentOrderRecord[]>(initialOrders);
  const [isLoading, setIsLoading] = useState(!initialOrders.length);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [updatingOrderIds, setUpdatingOrderIds] = useState<string[]>([]);
  const [bookingOrder, setBookingOrder] = useState<CourierPaymentOrderRecord | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [syncOrder, setSyncOrder] = useState<CourierPaymentOrderRecord | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const activeDispatchOrders = useMemo(
    () => orders.filter((order) => order.order_status === "packed"),
    [orders],
  );
  const shippedOrders = useMemo(
    () => orders.filter((order) => order.order_status === "shipped"),
    [orders],
  );
  const recentDeliveredOrders = useMemo(
    () => orders.filter((order) => order.order_status === "delivered").slice(0, 6),
    [orders],
  );
  const activeItemCount = activeDispatchOrders.reduce((sum, order) => sum + getItemCount(order), 0);

  const loadOrders = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setHasLoadError(false);
      const nextOrders = await fetchLogisticsOrders(signal);
      setOrders(nextOrders);
    } catch (error) {
      if (!signal?.aborted) {
        console.error("Courier queue could not be loaded.", error);
        setOrders([]);
        setHasLoadError(true);
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadTimer = window.setTimeout(() => {
      void loadOrders(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
      controller.abort();
    };
  }, [loadOrders]);

  async function handleMarkShipped(orderId: string) {
    setUpdatingOrderIds((current) => Array.from(new Set([...current, orderId])));
    setStatusMessage("");

    try {
      const result = await updateOrderStatus(orderId, "shipped");
      setStatusMessage(result.message ?? "Order marked shipped.");
      await loadOrders();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Order status update failed.");
    } finally {
      setUpdatingOrderIds((current) => current.filter((id) => id !== orderId));
    }
  }

  async function handleCourierBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bookingOrder) return;
    const form = new FormData(event.currentTarget);
    const provider = String(form.get("provider") ?? "").trim();

    if (!provider) {
      setStatusMessage("Select a courier provider.");
      return;
    }

    setIsBooking(true);
    setStatusMessage("");
    try {
      const result = await bookCourier({
        codAmount: bookingOrder.due_amount || bookingOrder.total,
        consignmentId: String(form.get("consignment_id") ?? "").trim(),
        deliveryFee: Number(form.get("delivery_fee") ?? 0),
        orderId: bookingOrder.id,
        provider,
        trackingCode: String(form.get("tracking_code") ?? "").trim(),
      });
      setStatusMessage(result.message ?? "Courier booking saved.");
      setBookingOrder(null);
      await loadOrders();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Courier booking failed.");
    } finally {
      setIsBooking(false);
    }
  }

  async function handleCourierSync(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!syncOrder) return;
    const form = new FormData(event.currentTarget);
    const nextStatus = String(form.get("status") ?? "delivered") as "delivered" | "returned";
    const note = String(form.get("note") ?? "").trim();
    if (nextStatus === "returned" && !note) {
      setStatusMessage("A return reason is required.");
      return;
    }
    setIsSyncing(true); setStatusMessage("");
    try {
      const result = await syncCourierStatus({ note, orderId: syncOrder.id, status: nextStatus });
      setStatusMessage(result.message ?? "Courier status synchronized.");
      setSyncOrder(null);
      await loadOrders();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Courier status sync failed.");
    } finally { setIsSyncing(false); }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5E7F85]">Dispatch</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Courier Dispatch</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Handoff packed orders to courier, track shipped orders, and keep Cash on Delivery handling simple and truthful.
              </p>
            </div>
            <button
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E7F85]"
              onClick={() => void loadOrders()}
              type="button"
            >
              Refresh Queue
            </button>
          </div>
        </section>

        {statusMessage ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm">{statusMessage}</div>
        ) : null}

        {bookingOrder ? (
          <form className="grid gap-4 rounded-[1.5rem] border border-[#5E7F85]/25 bg-white p-5 shadow-sm md:grid-cols-2" onSubmit={handleCourierBooking}>
            <div className="md:col-span-2">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#5E7F85]">Courier Booking</div>
              <h2 className="mt-2 text-xl font-bold text-slate-950">{bookingOrder.order_number ?? `BNB-${bookingOrder.id}`}</h2>
              <p className="mt-1 text-sm text-slate-500">Save a manual booking now; live provider API can reuse this same workflow later.</p>
            </div>
            <label className="text-sm font-semibold text-slate-700">
              Courier provider
              <select className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3" defaultValue={bookingOrder.courier_name ?? ""} name="provider" required>
                <option disabled value="">Select provider</option>
                <option value="Steadfast">Steadfast</option>
                <option value="Pathao">Pathao</option>
                <option value="RedX">RedX</option>
                <option value="Paperfly">Paperfly</option>
                <option value="Other">Other / Manual</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Tracking code
              <input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" defaultValue={bookingOrder.courier_tracking_id ?? ""} name="tracking_code" placeholder="Courier tracking code" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Consignment ID
              <input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" name="consignment_id" placeholder="Optional consignment ID" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Courier cost (BDT)
              <input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" min="0" name="delivery_fee" step="0.01" type="number" />
            </label>
            <div className="flex justify-end gap-3 md:col-span-2">
              <button className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700" disabled={isBooking} onClick={() => setBookingOrder(null)} type="button">Cancel</button>
              <button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-bold text-white disabled:bg-slate-300" disabled={isBooking} type="submit">{isBooking ? "Saving..." : "Save Booking & COD"}</button>
            </div>
          </form>
        ) : null}

        {syncOrder ? (
          <form className="grid gap-4 rounded-[1.5rem] border border-[#5E7F85]/25 bg-white p-5 shadow-sm md:grid-cols-2" onSubmit={handleCourierSync}>
            <div className="md:col-span-2"><div className="text-xs font-bold uppercase tracking-[0.16em] text-[#5E7F85]">Delivery Update</div><h2 className="mt-2 text-xl font-bold text-slate-950">{syncOrder.order_number ?? `BNB-${syncOrder.id}`}</h2><p className="mt-1 text-sm text-slate-500">Delivered creates a COD collection. Returned records the courier outcome; sellable inventory changes only after warehouse receiving and inspection.</p></div>
            <label className="text-sm font-semibold text-slate-700">Courier result<select className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3" name="status"><option value="delivered">Delivered</option><option value="returned">Returned</option></select></label>
            <label className="text-sm font-semibold text-slate-700">Operational note<input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" name="note" placeholder="Required for returned parcels" /></label>
            <div className="flex justify-end gap-3 md:col-span-2"><button className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700" disabled={isSyncing} onClick={() => setSyncOrder(null)} type="button">Cancel</button><button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-bold text-white disabled:bg-slate-300" disabled={isSyncing} type="submit">{isSyncing ? "Updating..." : "Confirm Courier Result"}</button></div>
          </form>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard helper="Packed orders" label="Waiting Handoff" value={activeDispatchOrders.length} />
          <StatCard helper="Across active queue" label="Items to Dispatch" value={activeItemCount} />
          <StatCard helper="Read-only tracking" label="Shipped Orders" value={shippedOrders.length} />
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">Active Courier Handoff</h2>
            <p className="mt-1 text-sm text-slate-500">Only packed orders appear here for courier handoff.</p>
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-sm font-semibold text-slate-500">Loading courier queue...</div>
          ) : hasLoadError ? (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-rose-700">Courier queue could not be loaded. Please try again.</p>
              <button
                className="mt-4 rounded-full bg-[#5E7F85] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-950"
                onClick={() => void loadOrders()}
                type="button"
              >
                Try Again
              </button>
            </div>
          ) : activeDispatchOrders.length ? (
            <div className="grid gap-5 p-5 xl:grid-cols-2 2xl:grid-cols-3">
              {activeDispatchOrders.map((order) => (
                <CourierCard
                  isUpdating={updatingOrderIds.includes(order.id)}
                  key={order.id}
                  onBookCourier={setBookingOrder}
                  onMarkShipped={(orderId) => void handleMarkShipped(orderId)}
                  order={order}
                />
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-sm font-semibold text-slate-500">No orders are waiting for courier handoff.</div>
          )}
        </section>

        {shippedOrders.length ? (
          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">Shipped Orders</h2>
                <p className="mt-1 text-sm text-slate-500">Read-only tracking view for orders already marked shipped.</p>
              </div>
              <Badge tone="brand">Shipped</Badge>
            </div>
            <div className="mt-5 grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
              {shippedOrders.map((order) => (
                <CourierCard key={order.id} onSyncCourier={setSyncOrder} order={order} />
              ))}
            </div>
          </section>
        ) : null}

        {recentDeliveredOrders.length ? (
          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">Delivered Recently</h2>
                <p className="mt-1 text-sm text-slate-500">Completed orders are not part of the active courier workflow.</p>
              </div>
              <Badge tone="good">Delivered</Badge>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {recentDeliveredOrders.map((order) => (
                <div className="rounded-2xl border border-slate-200 bg-stone-50 p-4" key={order.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-950">{order.order_number ?? `BNB-${order.id}`}</div>
                      <div className="mt-1 text-sm font-semibold text-slate-700">{order.customer_name}</div>
                    </div>
                    <Badge tone="good">Delivered</Badge>
                  </div>
                  <div className="mt-3 grid gap-2">
                    <DetailRow label="Payment" value="Cash on Delivery" />
                    <DetailRow label="Total" value={formatMoney(order.total)} />
                    <DetailRow label="Delivered At" value={formatDate(order.updated_at)} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}

