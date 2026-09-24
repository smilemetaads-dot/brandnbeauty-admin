"use server";

export type PurchaseActionState = {
  ok: boolean;
  message: string;
};

const LEGACY_DISABLED =
  "Legacy Supabase purchase mutation is disabled. Use Purchase Stock Entry so approval, Incoming stock, QC receiving, quarantine and Finance payable evidence stay canonical.";

export async function createPurchaseEntry(
  _previousState: PurchaseActionState,
  _formData: FormData,
): Promise<PurchaseActionState> {
  return {
    ok: false,
    message: LEGACY_DISABLED,
  };
}

export async function updatePurchaseEntry(
  _previousState: PurchaseActionState,
  _formData: FormData,
): Promise<PurchaseActionState> {
  return {
    ok: false,
    message: LEGACY_DISABLED,
  };
}

export async function receivePurchaseStock(
  _previousState: PurchaseActionState,
  _formData: FormData,
): Promise<PurchaseActionState> {
  return {
    ok: false,
    message: LEGACY_DISABLED,
  };
}
