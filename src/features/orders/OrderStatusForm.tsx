"use client";

import { useActionState } from "react";

import {
  updateOrderStatuses,
  type OrderStatusActionState,
} from "@/features/orders/order-actions";

type OrderStatusFormProps = {
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
  courierStatus: string | null;
};

const initialState: OrderStatusActionState = {
  ok: false,
  message: "",
};

const orderStatusOptions = [
  ["new", "New"],
  ["confirmed", "Confirmed"],
  ["processing", "Processing"],
  ["ready_to_pack", "Ready To Pack"],
  ["packed", "Packed"],
  ["shipped", "Shipped"],
  ["delivered", "Delivered"],
  ["cancelled", "Cancelled"],
  ["returned", "Returned"],
];

const paymentStatusOptions = [
  ["cod_pending", "COD Pending"],
  ["partial_paid", "Partial Paid"],
  ["paid", "Paid"],
  ["refunded", "Refunded"],
  ["failed", "Failed"],
];

const courierStatusOptions = [
  ["not_sent", "Not Sent"],
  ["ready", "Ready"],
  ["sent", "Sent"],
  ["delivered", "Delivered"],
  ["returned", "Returned"],
  ["failed", "Failed"],
];

const inputClassName =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#527B86] focus:ring-2 focus:ring-[#527B86]/15 disabled:cursor-not-allowed disabled:bg-slate-100";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.14em] text-slate-400";

export function OrderStatusForm({
  orderId,
  orderStatus,
  paymentStatus,
  courierStatus,
}: OrderStatusFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateOrderStatuses,
    initialState,
  );

  return (
    <form action={formAction} className="mt-4 grid gap-3">
      <input name="orderId" type="hidden" value={orderId} />

      <label className={labelClassName}>
        Order Status
        <select
          className={inputClassName}
          defaultValue={orderStatus}
          disabled={isPending}
          name="orderStatus"
          required
        >
          {orderStatusOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClassName}>
        Payment Status
        <select
          className={inputClassName}
          defaultValue={paymentStatus}
          disabled={isPending}
          name="paymentStatus"
          required
        >
          {paymentStatusOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClassName}>
        Courier Status
        <select
          className={inputClassName}
          defaultValue={courierStatus ?? "not_sent"}
          disabled={isPending}
          name="courierStatus"
          required
        >
          {courierStatusOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
        Stock deduction runs once when status is confirmed, processing, or
        ready_to_pack. Stock restoration is not connected yet.
      </p>

      <button
        className="rounded-2xl bg-[#527B86] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Updating..." : "Update Status"}
      </button>

      {state.message ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
            state.ok
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {state.message}
        </div>
      ) : null}
    </form>
  );
}
