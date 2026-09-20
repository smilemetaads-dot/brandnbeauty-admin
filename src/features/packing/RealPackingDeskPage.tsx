"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  fetchLogisticsOrders,
  type LogisticsOrderItemRecord,
  type LogisticsOrderRecord,
  updateOrderStatus,
} from "@/features/logistics/logistics-client";

type PackingOrderRecord = LogisticsOrderRecord;

type RealPackingDeskPageProps = {
  orders?: PackingOrderRecord[];
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const ACTIVE_PACKING_STATUSES = new Set(["confirmed", "processing"]);
const RECENT_PACKED_STATUSES = new Set(["packed"]);

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  processing: "Processing",
  packed: "Packed",
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
  if (status === "packed") return "good";
  if (status === "processing") return "brand";
  if (status === "confirmed") return "warn";
  return "default";
}

function formatText(value: string | null) {
  return value && value.trim() ? value : "Not available";
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

function formatLocation(order: PackingOrderRecord) {
  return order.delivery_zone || order.area || order.district || "Delivery area unavailable";
}

function getItemCount(order: PackingOrderRecord) {
  return order.order_items.reduce((sum, item) => sum + item.quantity, 0);
}

function getVariantText(item: LogisticsOrderItemRecord) {
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

function getNextPackingAction(order: PackingOrderRecord) {
  if (order.order_status === "confirmed") {
    return { label: "Start Processing", nextStatus: "processing" };
  }

  if (order.order_status === "processing") {
    return { label: "Mark Packed", nextStatus: "packed" };
  }

  return null;
}

function PackingItem({ item }: { item: LogisticsOrderItemRecord }) {
  const variantText = getVariantText(item);

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-3 sm:grid-cols-[56px_1fr_auto] sm:items-center">
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-stone-100 text-[10px] font-bold text-slate-400">
        {item.product_image ? (
          <span
            aria-hidden="true"
            className="block h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${item.product_image})` }}
          />
        ) : (
          "No image"
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate font-semibold text-slate-900">{item.product_name}</div>
        {variantText ? <div className="mt-1 truncate text-xs font-semibold text-[#5E7F85]">{variantText}</div> : null}
        <div className="mt-1 truncate text-xs text-slate-500">SKU {formatText(item.product_sku)}</div>
      </div>
      <div className="rounded-full bg-stone-100 px-3 py-1 text-sm font-black text-slate-800">Qty {item.quantity}</div>
    </div>
  );
}

function PackingCard({
  isUpdating,
  onStatusChange,
  order,
}: {
  isUpdating: boolean;
  onStatusChange: (orderId: string, nextStatus: string) => void;
  order: PackingOrderRecord;
}) {
  const action = getNextPackingAction(order);
  const itemCount = getItemCount(order);

  return (
    <article className="flex h-full flex-col rounded-[1.5rem] border border-slate-200 bg-stone-50 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-slate-950">{order.order_number ?? `BNB-${order.id}`}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-800">{order.customer_name}</p>
          <p className="mt-1 text-xs text-slate-500">{formatLocation(order)}</p>
        </div>
        <Badge tone={statusTone(order.order_status)}>{formatStatus(order.order_status)}</Badge>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4">
        <DetailRow label="Total Items" value={itemCount} />
        <DetailRow label="Product Lines" value={order.order_items.length} />
        <DetailRow label="Updated" value={formatDate(order.updated_at)} />
      </div>

      <div className="mt-5 flex-1 space-y-3">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Pick & Verify</div>
        {order.order_items.length ? (
          order.order_items.map((item) => <PackingItem item={item} key={item.id} />)
        ) : (
          <div className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-500">No item details are available for this order.</div>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E7F85]"
          href={`/orders/details/packing-slip?id=${order.id}`}
        >
          Packing Slip
        </Link>
        {action ? (
          <button
            className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E7F85] disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isUpdating}
            onClick={() => onStatusChange(order.id, action.nextStatus)}
            type="button"
          >
            {isUpdating ? "Updating..." : action.label}
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function RealPackingDeskPage({ orders: initialOrders = [] }: RealPackingDeskPageProps) {
  const [orders, setOrders] = useState<PackingOrderRecord[]>(initialOrders);
  const [isLoading, setIsLoading] = useState(!initialOrders.length);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [updatingOrderIds, setUpdatingOrderIds] = useState<string[]>([]);

  const activePackingOrders = useMemo(
    () => orders.filter((order) => ACTIVE_PACKING_STATUSES.has(order.order_status)),
    [orders],
  );
  const recentPackedOrders = useMemo(
    () => orders.filter((order) => RECENT_PACKED_STATUSES.has(order.order_status)).slice(0, 6),
    [orders],
  );
  const totalItemsWaiting = activePackingOrders.reduce((sum, order) => sum + getItemCount(order), 0);

  const loadOrders = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setHasLoadError(false);
      const nextOrders = await fetchLogisticsOrders(signal);
      setOrders(nextOrders);
    } catch (error) {
      if (!signal?.aborted) {
        console.error("Packing queue could not be loaded.", error);
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

  async function handleStatusChange(orderId: string, nextStatus: string) {
    setUpdatingOrderIds((current) => Array.from(new Set([...current, orderId])));
    setStatusMessage("");

    try {
      const result = await updateOrderStatus(orderId, nextStatus);
      setStatusMessage(result.message ?? "Order status updated successfully.");
      await loadOrders();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Order status update failed.");
    } finally {
      setUpdatingOrderIds((current) => current.filter((id) => id !== orderId));
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5E7F85]">Operations</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Packing Desk</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Prepare confirmed and processing orders by checking products, variants, SKUs, and quantities before marking them packed.
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

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard helper="Confirmed or processing" label="Orders Waiting" value={activePackingOrders.length} />
          <StatCard helper="Across active queue" label="Items to Verify" value={totalItemsWaiting} />
          <StatCard helper="Recent completed cards" label="Packed Recently" value={recentPackedOrders.length} />
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">Active Packing Queue</h2>
            <p className="mt-1 text-sm text-slate-500">Confirmed orders must start processing before they can be marked packed.</p>
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-sm font-semibold text-slate-500">Loading packing queue...</div>
          ) : hasLoadError ? (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-rose-700">Packing queue could not be loaded. Please try again.</p>
              <button
                className="mt-4 rounded-full bg-[#5E7F85] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-950"
                onClick={() => void loadOrders()}
                type="button"
              >
                Try Again
              </button>
            </div>
          ) : activePackingOrders.length ? (
            <div className="grid gap-5 p-5 xl:grid-cols-2 2xl:grid-cols-3">
              {activePackingOrders.map((order) => (
                <PackingCard
                  isUpdating={updatingOrderIds.includes(order.id)}
                  key={order.id}
                  onStatusChange={(orderId, nextStatus) => void handleStatusChange(orderId, nextStatus)}
                  order={order}
                />
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-sm font-semibold text-slate-500">No orders are waiting to be packed.</div>
          )}
        </section>

        {recentPackedOrders.length ? (
          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">Packed Recently</h2>
                <p className="mt-1 text-sm text-slate-500">Read-only packed orders are separated from the active work queue.</p>
              </div>
              <Badge tone="good">Packed</Badge>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {recentPackedOrders.map((order) => (
                <div className="rounded-2xl border border-slate-200 bg-stone-50 p-4" key={order.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-950">{order.order_number ?? `BNB-${order.id}`}</div>
                      <div className="mt-1 text-sm font-semibold text-slate-700">{order.customer_name}</div>
                    </div>
                    <Badge tone="good">Packed</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm">
                    <DetailRow label="Items" value={getItemCount(order)} />
                    <DetailRow label="Delivery Area" value={formatLocation(order)} />
                    <DetailRow label="Packed At" value={formatDate(order.updated_at)} />
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
