"use server";

export type ConcernActionState = { ok: boolean; message: string };

export async function saveConcern(
  _previousState: ConcernActionState,
  _formData: FormData,
): Promise<ConcernActionState> {
  return {
    ok: false,
    message: "This legacy concern action is disabled. Use the live Concerns page backed by the canonical PHP/MySQL catalog.",
  };
}