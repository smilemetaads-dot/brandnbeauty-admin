"use server";

export type InventoryActionState = {
  ok: boolean;
  message: string;
};

/**
 * Compatibility-only legacy server action.
 *
 * Manual inventory writes are canonical in manage_inventory.php, which uses
 * draft -> human confirmation -> posted movement evidence. This legacy action
 * intentionally performs no write so it cannot bypass reservation guards,
 * movement evidence, RBAC, or the canonical PHP/MySQL inventory ledger.
 */
export async function adjustProductStock(
  _previousState: InventoryActionState,
  _formData: FormData,
): Promise<InventoryActionState> {
  return {
    ok: false,
    message:
      "This legacy stock editor is disabled. Use the live Inventory adjustment workflow.",
  };
}