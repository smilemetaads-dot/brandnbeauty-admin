"use server";

export type OrderStatusActionState = {
  ok: boolean;
  message: string;
};

/**
 * Compatibility-only legacy server action.
 *
 * Operational order mutations are canonical in the PHP/MySQL Business OS:
 * manage_orders.php / update_order_status.php -> order_status_service.php.
 *
 * This server action intentionally performs no write. Keeping the exported
 * signature prevents stale or reference UI code from becoming a second source
 * of truth while those components are retired gradually.
 */
export async function updateOrderStatuses(
  _previousState: OrderStatusActionState,
  _formData: FormData,
): Promise<OrderStatusActionState> {
  return {
    ok: false,
    message:
      "This legacy status editor is disabled. Use the live Orders command center or Order Details workflow.",
  };
}