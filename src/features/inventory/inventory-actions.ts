"use server";

import { revalidatePath } from "next/cache";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type InventoryActionState = {
  ok: boolean;
  message: string;
};

const ADJUSTMENT_TYPES = ["stock_in", "stock_out", "correction"] as const;
const LOW_STOCK_THRESHOLD = 10;

type AdjustmentType = (typeof ADJUSTMENT_TYPES)[number];

type ProductStockRow = {
  stock: number | null;
  status: string | null;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getPositiveInteger(formData: FormData, key: string) {
  const value = getString(formData, key);
  const numberValue = Number(value);

  if (
    value.length === 0 ||
    Number.isNaN(numberValue) ||
    !Number.isInteger(numberValue) ||
    numberValue <= 0
  ) {
    return null;
  }

  return numberValue;
}

function isAdjustmentType(value: string): value is AdjustmentType {
  return ADJUSTMENT_TYPES.includes(value as AdjustmentType);
}

function getNextStatus(currentStatus: string | null, newStock: number) {
  if (newStock <= 0) {
    return "out_of_stock";
  }

  if (newStock <= LOW_STOCK_THRESHOLD) {
    return "low_stock";
  }

  if (currentStatus === "out_of_stock" || currentStatus === "low_stock") {
    return "active";
  }

  return currentStatus ?? "active";
}

function getNewStock(
  currentStock: number,
  adjustmentType: AdjustmentType,
  quantity: number,
) {
  if (adjustmentType === "stock_in") {
    return currentStock + quantity;
  }

  if (adjustmentType === "stock_out") {
    return currentStock - quantity;
  }

  return quantity;
}

export async function adjustProductStock(
  _previousState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const productId = getString(formData, "productId");
  const adjustmentType = getString(formData, "adjustmentType");
  const quantity = getPositiveInteger(formData, "quantity");
  const note = getString(formData, "note");

  if (!productId) {
    return { ok: false, message: "Product is required." };
  }

  if (!isAdjustmentType(adjustmentType)) {
    return { ok: false, message: "Choose a valid adjustment type." };
  }

  if (quantity === null) {
    return { ok: false, message: "Quantity must be a positive whole number." };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("stock, status")
      .eq("id", productId)
      .single<ProductStockRow>();

    if (productError || !product) {
      console.error("Failed to load product stock.", productError);

      return {
        ok: false,
        message: "Product stock could not be loaded. Try again.",
      };
    }

    const previousStock = product.stock ?? 0;
    const newStock = getNewStock(previousStock, adjustmentType, quantity);

    if (newStock < 0) {
      return { ok: false, message: "Stock cannot be negative." };
    }

    const nextStatus = getNextStatus(product.status, newStock);
    const { error: updateError } = await supabase
      .from("products")
      .update({ stock: newStock, status: nextStatus })
      .eq("id", productId);

    if (updateError) {
      console.error("Failed to update product stock.", updateError);

      return {
        ok: false,
        message: "Stock could not be updated. Try again.",
      };
    }

    const { error: movementError } = await supabase
      .from("inventory_movements")
      .insert({
        product_id: productId,
        movement_type: adjustmentType,
        quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        note: note || null,
      });

    if (movementError) {
      console.error("Failed to log inventory movement.", movementError);

      return {
        ok: false,
        message: "Stock updated, but movement could not be logged.",
      };
    }

    revalidatePath("/inventory");
    revalidatePath("/products");

    return { ok: true, message: "Stock updated successfully." };
  } catch (error) {
    console.error("Failed to adjust product stock.", error);

    return {
      ok: false,
      message: "Stock could not be updated right now. Try again shortly.",
    };
  }
}
