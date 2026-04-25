"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type {
  AdminOrderDetailsRecord,
  AdminOrderItemRecord,
} from "@/lib/orders/supabaseOrders";

const supportedStatuses = [
  { value: "new", label: "New" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
] as const;

function getOrderStatusClasses(status: string) {
  if (status === "New") return "bg-amber-50 text-amber-700";
  if (status === "Confirmed") return "bg-sky-50 text-sky-700";
  if (status === "Processing") return "bg-cyan-50 text-cyan-700";
  if (status === "Packed") return "bg-violet-50 text-violet-700";
  if (status === "Shipped") return "bg-indigo-50 text-indigo-700";
  if (status === "Delivered") return "bg-emerald-50 text-emerald-700";
  if (status === "Returned") return "bg-rose-50 text-rose-700";
  return "bg-rose-50 text-rose-700";
}

function getPaymentStatusClasses(status: string) {
  if (status === "Paid" || status === "Verified") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "Pending") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-stone-100 text-slate-700";
}

function formatAmount(amount: number) {
  return `Tk ${amount.toLocaleString()}`;
}

function formatCreatedAt(value: string) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getLineTotal(item: AdminOrderItemRecord) {
  return item.totalPrice || item.unitPrice * item.quantity;
}

function shouldRenderOrderItemImage(imageUrl: string) {
  if (!imageUrl) {
    return false;
  }

  try {
    const parsedUrl = new URL(imageUrl);
    return parsedUrl.hostname !== "via.placeholder.com";
  } catch {
    return true;
  }
}

export default function RealOrderDetailsPage({
  initialOrderDetails,
}: {
  initialOrderDetails: AdminOrderDetailsRecord | null;
}) {
  const router = useRouter();
  const currentOrder = initialOrderDetails?.order ?? null;
  const initialStatus = currentOrder?.orderStatus.toLowerCase() ?? "new";
  const [statusDraft, setStatusDraft] = useState({
    orderId: currentOrder?.id ?? "",
    value: initialStatus,
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const selectedStatus =
    currentOrder && statusDraft.orderId === currentOrder.id
      ? statusDraft.value
      : initialStatus;

  if (!initialOrderDetails) {
    return (
      <div className="p-4 md:p-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="text-sm font-medium text-slate-500">Order Details</div>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            No order found
          </h2>
          <div className="mt-3 text-sm text-slate-600">
            Select an order from the orders page to view its details.
          </div>
        </div>
      </div>
    );
  }

  const { order, items } = initialOrderDetails;
  const orderedTotal = items.reduce((sum, item) => sum + getLineTotal(item), 0);

  async function handleStatusUpdate() {
    setIsUpdatingStatus(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: order.id,
          orderStatus: selectedStatus,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Order status could not be updated.");
      }

      setStatusMessage("Order status updated.");
      router.refresh();
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Order status could not be updated.",
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Order Snapshot
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                  {order.orderNumber}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getOrderStatusClasses(
                    order.orderStatus,
                  )}`}
                >
                  {order.orderStatus}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStatusClasses(
                    order.paymentStatus,
                  )}`}
                >
                  {order.paymentStatus}
                </span>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {order.paymentMethod}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Customer", order.customerName],
                ["Phone", order.customerPhone],
                ["Payment Type", order.paymentMethod],
                ["Payment Status", order.paymentStatus],
                ["Order Status", order.orderStatus],
                ["Order Total", formatAmount(order.total)],
                ["Created At", formatCreatedAt(order.createdAt)],
                ["Items", String(items.length)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-stone-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    {label}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">Products</div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                  Ordered Items
                </h2>
              </div>
              <div className="rounded-2xl bg-stone-100 px-4 py-3 text-sm text-slate-600">
                Live items from Supabase
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-stone-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">SKU</th>
                      <th className="px-4 py-3 font-medium">Qty</th>
                      <th className="px-4 py-3 font-medium">Unit Price</th>
                      <th className="px-4 py-3 font-medium">Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr className="border-t border-slate-100 bg-white">
                        <td
                          colSpan={6}
                          className="px-4 py-10 text-center text-sm text-slate-500"
                        >
                          No order items found for this order.
                        </td>
                      </tr>
                    ) : null}

                    {items.map((item) => (
                      <tr
                        key={item.id || item.productId || `${item.name}-${item.sku}`}
                        className="border-t border-slate-100 bg-white"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {shouldRenderOrderItemImage(item.imageUrl) ? (
                              // Keep the existing table layout while showing the real ordered image.
                              <Image
                                src={item.imageUrl}
                                alt={item.name}
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded-2xl object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-[10px] text-slate-400">
                                Image
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-slate-900">
                                {item.name}
                              </div>
                              {item.productId ? (
                                <div className="text-xs text-slate-500">
                                  Product ID: {item.productId}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.sku || "N/A"}</td>
                        <td className="px-4 py-3 text-slate-700">{item.quantity}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatAmount(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {formatAmount(getLineTotal(item))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-stone-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Ordered Total
                </div>
                <div className="mt-2 text-lg font-bold text-slate-900">
                  {formatAmount(orderedTotal)}
                </div>
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Saved Order Total
                </div>
                <div className="mt-2 text-lg font-bold text-slate-900">
                  {formatAmount(order.total)}
                </div>
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Items Count
                </div>
                <div className="mt-2 text-lg font-bold text-slate-900">
                  {items.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Manage Order</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              Update Status
            </h2>
            <div className="mt-5 space-y-3">
              <select
                value={selectedStatus}
                onChange={(event) =>
                  setStatusDraft({
                    orderId: order.id,
                    value: event.target.value,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              >
                {supportedStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={isUpdatingStatus}
                className="w-full rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {isUpdatingStatus ? "Updating..." : "Save Status"}
              </button>
              {statusMessage ? (
                <div className="rounded-2xl bg-stone-50 p-4 text-sm text-slate-700">
                  {statusMessage}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Quick Summary</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              Order Signals
            </h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-stone-50 p-4">
                Customer: {order.customerName}
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                Phone: {order.customerPhone}
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                Payment: {order.paymentMethod}
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                Payment status: {order.paymentStatus}
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                Order status: {order.orderStatus}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Timing</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              Order Timeline
            </h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-stone-50 p-4">
                Created at: {formatCreatedAt(order.createdAt)}
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                Latest order reference: {order.orderNumber}
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                Live data source: public.orders + public.order_items
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
