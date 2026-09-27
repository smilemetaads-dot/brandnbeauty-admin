"use server";

export type BrandActionState = { ok: boolean; message: string };

export async function saveBrand(
  _previousState: BrandActionState,
  _formData: FormData,
): Promise<BrandActionState> {
  return {
    ok: false,
    message: "This legacy brand action is disabled. Use the live Brands page backed by the canonical PHP/MySQL catalog.",
  };
}