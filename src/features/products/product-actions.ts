"use server";

export type ProductActionState = { ok: boolean; message: string };

export async function saveProduct(
  _previousState: ProductActionState,
  _formData: FormData,
): Promise<ProductActionState> {
  return {
    ok: false,
    message: "This legacy product action is disabled. Use the live Product editor backed by the canonical PHP/MySQL catalog.",
  };
}

export async function updateProductStatus(
  _formData: FormData,
): Promise<ProductActionState> {
  return {
    ok: false,
    message: "This legacy product status action is disabled. Use the live Product workflow.",
  };
}