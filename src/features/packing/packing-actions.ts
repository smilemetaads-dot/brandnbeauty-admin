"use server";

export type MarkPackedActionState = {
  ok: boolean;
  message: string;
};

export async function markOrderPacked(
  _previousState: MarkPackedActionState,
  _formData: FormData,
): Promise<MarkPackedActionState> {
  return {
    ok: false,
    message:
      "Direct legacy packing is disabled. Use the live Packing Desk so item, slip, label and parcel-seal verification are recorded before Packed status.",
  };
}
