"use client";

import { useActionState } from "react";

import {
  markOrderDeliveredCodPaid,
  type MarkDeliveredCodPaidActionState,
} from "@/features/courier/courier-actions";

type MarkDeliveredCodPaidButtonProps = {
  currentOrderStatus: string;
  orderId: string;
};

const initialState: MarkDeliveredCodPaidActionState = {
  ok: false,
  message: "",
};

export function MarkDeliveredCodPaidButton({
  currentOrderStatus,
  orderId,
}: MarkDeliveredCodPaidButtonProps) {
  const [state, formAction, isPending] = useActionState(
    markOrderDeliveredCodPaid,
    initialState,
  );
  const canSubmit =
    currentOrderStatus === "shipped" || currentOrderStatus === "delivered";

  return (
    <form
      action={formAction}
      className="space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3"
    >
      <input name="orderId" type="hidden" value={orderId} />
      <button
        className="w-full rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={!canSubmit || isPending}
        type="submit"
      >
        {isPending
          ? "Saving..."
          : currentOrderStatus === "delivered"
            ? "Already Delivered"
            : "Mark Delivered + COD Paid"}
      </button>
      <div className="text-[11px] font-bold leading-5 text-slate-500">
        Manual delivery/COD record only. Payment gateway and courier API are not
        connected.
      </div>
      {state.message ? (
        <div
          className={`rounded-xl px-3 py-2 text-xs font-bold ${
            state.ok
              ? "bg-emerald-100 text-emerald-800"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {state.message}
        </div>
      ) : null}
    </form>
  );
}
