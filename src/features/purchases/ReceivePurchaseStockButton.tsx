"use client";

import { useActionState } from "react";

import {
  receivePurchaseStock,
  type PurchaseActionState,
} from "@/features/purchases/purchase-actions";

type ReceivePurchaseStockButtonProps = {
  purchaseEntryId: string;
  purchaseStatus: string;
  stockReceived: boolean;
};

const initialState: PurchaseActionState = {
  ok: false,
  message: "",
};

export function ReceivePurchaseStockButton({
  purchaseEntryId,
  purchaseStatus,
  stockReceived,
}: ReceivePurchaseStockButtonProps) {
  const [state, formAction, isPending] = useActionState(
    receivePurchaseStock,
    initialState,
  );
  const isCancelled = purchaseStatus === "cancelled";
  const isDisabled = isPending || stockReceived || isCancelled;

  return (
    <form action={formAction} className="space-y-2">
      <input name="purchaseEntryId" type="hidden" value={purchaseEntryId} />
      <button
        className="rounded-2xl bg-[#527B86] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={isDisabled}
        type="submit"
      >
        {isPending ? "Receiving..." : "Receive Stock"}
      </button>
      <p className="max-w-xs text-xs font-semibold leading-5 text-amber-700">
        This increases product stock once through RPC and logs
        purchase_stock_in movement.
      </p>
      {stockReceived ? (
        <p className="text-xs font-bold text-emerald-700">
          Stock already received.
        </p>
      ) : null}
      {isCancelled ? (
        <p className="text-xs font-bold text-rose-700">
          Cancelled purchases cannot be received.
        </p>
      ) : null}
      {state.message ? (
        <p
          className={`rounded-2xl px-3 py-2 text-xs font-bold ${
            state.ok
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
