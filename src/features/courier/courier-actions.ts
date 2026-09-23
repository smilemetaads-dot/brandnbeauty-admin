"use server";

export type MarkCourierSentActionState = {
  ok: boolean;
  message: string;
};

export type MarkDeliveredCodPaidActionState = {
  ok: boolean;
  message: string;
};

export type MarkReturnedActionState = {
  ok: boolean;
  message: string;
};

const LEGACY_DISABLED =
  "Legacy direct courier mutation is disabled. Use Courier & Payments for booking/delivery updates and Dispatch Control for courier handover.";

export async function markCourierSent(
  _previousState: MarkCourierSentActionState,
  _formData: FormData,
): Promise<MarkCourierSentActionState> {
  return { ok: false, message: LEGACY_DISABLED };
}

export async function markOrderReturned(
  _previousState: MarkReturnedActionState,
  _formData: FormData,
): Promise<MarkReturnedActionState> {
  return { ok: false, message: LEGACY_DISABLED };
}

export async function markOrderDeliveredCodPaid(
  _previousState: MarkDeliveredCodPaidActionState,
  _formData: FormData,
): Promise<MarkDeliveredCodPaidActionState> {
  return { ok: false, message: LEGACY_DISABLED };
}
