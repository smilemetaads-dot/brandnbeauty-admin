"use client";

import { useActionState } from "react";

import {
  markOrderReturned,
  type MarkReturnedActionState,
} from "@/features/courier/courier-actions";

type MarkReturnedButtonProps = {
  currentOrderStatus: string;
  orderId: string;
};

const initialState: MarkReturnedActionState = {
  ok: false,
  message: "",
};

export function MarkReturnedButton({
  currentOrderStatus,
  orderId,
}: MarkReturnedButtonProps) {
  const [state, formAction, isPending] = useActionState(
    markOrderReturned,
    initialState,
  );
  const canSubmit =
    currentOrderStatus === "shipped" ||
    currentOrderStatus === "delivered" ||
    currentOrderStatus === "returned";

  return (
    <form
      action={formAction}
      className="space-y-2 rounded-2xl border border-rose-100 bg-rose-50/50 p-3"
    >
      <input name="orderId" type="hidden" value={orderId} />
      <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        Return Note
        <textarea
          className="mt-1 min-h-14 w-full resize-y rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-semibold normal-case tracking-normal text-slate-800 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:bg-slate-100"
          disabled={!canSubmit || isPending}
          name="returnNote"
          placeholder="Optional reason"
        />
      </label>
      <button
        className="w-full rounded-xl bg-rose-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={!canSubmit || isPending}
        type="submit"
      >
        {isPending
          ? "Saving..."
          : currentOrderStatus === "returned"
            ? "Restore Stock Check"
            : "Mark Returned"}
      </button>
      <div className="text-[11px] font-bold leading-5 text-slate-500">
        Stock restore runs once through RPC. Real courier API is not connected.
      </div>
      {state.message ? (
        <div
          className={`rounded-xl px-3 py-2 text-xs font-bold ${
            state.ok
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {state.message}
        </div>
      ) : null}
    </form>
  );
}
