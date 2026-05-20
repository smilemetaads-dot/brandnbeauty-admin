"use client";

import { useActionState } from "react";

import {
  markOrderPacked,
  type MarkPackedActionState,
} from "@/features/packing/packing-actions";

type MarkPackedButtonProps = {
  currentStatus: string;
  orderId: string;
};

const initialState: MarkPackedActionState = {
  ok: false,
  message: "",
};

export function MarkPackedButton({
  currentStatus,
  orderId,
}: MarkPackedButtonProps) {
  const [state, formAction, isPending] = useActionState(
    markOrderPacked,
    initialState,
  );
  const isPacked = currentStatus === "packed";

  return (
    <form action={formAction} className="space-y-2">
      <input name="orderId" type="hidden" value={orderId} />
      <button
        className="w-full rounded-2xl bg-[#527B86] px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={isPending || isPacked}
        type="submit"
      >
        {isPending ? "Marking..." : isPacked ? "Already Packed" : "Mark Packed"}
      </button>
      <div className="text-[11px] font-bold text-slate-500">
        Stock is not changed here.
      </div>
      {state.message ? (
        <div
          className={`rounded-xl px-3 py-2 text-xs font-bold ${
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
