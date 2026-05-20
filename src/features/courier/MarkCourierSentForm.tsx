"use client";

import { useActionState } from "react";

import {
  markCourierSent,
  type MarkCourierSentActionState,
} from "@/features/courier/courier-actions";

type MarkCourierSentFormProps = {
  currentCourierName: string | null;
  currentCourierNote: string | null;
  currentOrderStatus: string;
  currentTrackingId: string | null;
  orderId: string;
};

const initialState: MarkCourierSentActionState = {
  ok: false,
  message: "",
};

export function MarkCourierSentForm({
  currentCourierName,
  currentCourierNote,
  currentOrderStatus,
  currentTrackingId,
  orderId,
}: MarkCourierSentFormProps) {
  const [state, formAction, isPending] = useActionState(
    markCourierSent,
    initialState,
  );
  const canSubmit =
    currentOrderStatus === "packed" || currentOrderStatus === "shipped";

  return (
    <form
      action={formAction}
      className="space-y-2 rounded-2xl border border-slate-200 bg-stone-50/70 p-3"
    >
      <input name="orderId" type="hidden" value={orderId} />
      <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        Courier Name
        <input
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold normal-case tracking-normal text-slate-800 outline-none transition focus:border-[#527B86] focus:ring-2 focus:ring-[#527B86]/15 disabled:bg-slate-100"
          defaultValue={currentCourierName ?? ""}
          disabled={!canSubmit || isPending}
          name="courierName"
          placeholder="Courier partner"
          required
        />
      </label>
      <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        Tracking ID
        <input
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold normal-case tracking-normal text-slate-800 outline-none transition focus:border-[#527B86] focus:ring-2 focus:ring-[#527B86]/15 disabled:bg-slate-100"
          defaultValue={currentTrackingId ?? ""}
          disabled={!canSubmit || isPending}
          name="trackingId"
          placeholder="Optional"
        />
      </label>
      <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        Courier Note
        <textarea
          className="mt-1 min-h-16 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold normal-case tracking-normal text-slate-800 outline-none transition focus:border-[#527B86] focus:ring-2 focus:ring-[#527B86]/15 disabled:bg-slate-100"
          defaultValue={currentCourierNote ?? ""}
          disabled={!canSubmit || isPending}
          name="courierNote"
          placeholder="Optional handoff note"
        />
      </label>
      <button
        className="w-full rounded-xl bg-[#527B86] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={!canSubmit || isPending}
        type="submit"
      >
        {isPending ? "Saving..." : "Mark Courier Sent"}
      </button>
      <div className="text-[11px] font-bold leading-5 text-slate-500">
        This is manual courier record only. Real courier API is not connected
        yet.
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
