"use server";

import { revalidatePath } from "next/cache";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type PurchaseActionState = {
  ok: boolean;
  message: string;
};

const PURCHASE_STATUSES = [
  "draft",
  "ordered",
  "partially_received",
  "received",
  "cancelled",
] as const;

type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

type PurchaseItemValues = {
  product_id: string;
  quantity: number;
  received_quantity: number;
  unit_cost: number;
};

type PurchaseReceiveCheckRow = {
  id: string;
  purchase_status: string | null;
  stock_received: boolean | null;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getNullableString(formData: FormData, key: string) {
  const value = getString(formData, key);

  return value.length > 0 ? value : null;
}

function isPurchaseStatus(value: string): value is PurchaseStatus {
  return PURCHASE_STATUSES.includes(value as PurchaseStatus);
}

function getNumberList(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => {
    const numberValue = typeof value === "string" ? Number(value) : Number.NaN;

    return Number.isFinite(numberValue) ? numberValue : Number.NaN;
  });
}

function getStringList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => (typeof value === "string" ? value.trim() : ""));
}

function isWholeNumber(value: number) {
  return Number.isInteger(value);
}

function getPurchaseValues(formData: FormData) {
  const purchase_number = getString(formData, "purchase_number");
  const purchase_status = getString(formData, "purchase_status") || "draft";
  const productIds = getStringList(formData, "item_product_id");
  const quantities = getNumberList(formData, "item_quantity");
  const receivedQuantities = getNumberList(formData, "item_received_quantity");
  const unitCosts = getNumberList(formData, "item_unit_cost");
  const selectedProductIds = productIds.filter(Boolean);

  if (!purchase_number) {
    return {
      error: "Purchase number is required.",
      values: null,
    };
  }

  if (!isPurchaseStatus(purchase_status)) {
    return {
      error: "Choose a valid purchase status.",
      values: null,
    };
  }

  if (!selectedProductIds.length) {
    return {
      error: "Add at least one purchase item.",
      values: null,
    };
  }

  const items: PurchaseItemValues[] = [];

  for (let index = 0; index < productIds.length; index += 1) {
    const productId = productIds[index];

    if (!productId) {
      continue;
    }

    const quantity = quantities[index];
    const received_quantity = receivedQuantities[index];
    const unit_cost = unitCosts[index];

    if (
      !Number.isFinite(quantity) ||
      !Number.isFinite(received_quantity) ||
      !Number.isFinite(unit_cost)
    ) {
      return {
        error: "Quantity, received quantity, and unit cost must be numbers.",
        values: null,
      };
    }

    if (!isWholeNumber(quantity) || !isWholeNumber(received_quantity)) {
      return {
        error: "Quantity and received quantity must be whole numbers.",
        values: null,
      };
    }

    if (quantity < 0 || received_quantity < 0 || unit_cost < 0) {
      return {
        error: "Quantity, received quantity, and unit cost cannot be negative.",
        values: null,
      };
    }

    items.push({
      product_id: productId,
      quantity,
      received_quantity,
      unit_cost,
    });
  }

  if (!items.length) {
    return {
      error: "Add at least one purchase item.",
      values: null,
    };
  }

  return {
    error: null,
    values: {
      items,
      purchase: {
        note: getNullableString(formData, "note"),
        purchase_number,
        purchase_status,
        supplier_id: getNullableString(formData, "supplier_id"),
      },
    },
  };
}

function getSafePurchaseSaveMessage(message: string | undefined) {
  const normalizedMessage = message?.toLowerCase() ?? "";

  if (normalizedMessage.includes("purchase number")) {
    return "Purchase number already exists or is invalid.";
  }

  if (normalizedMessage.includes("received purchase entries cannot be edited")) {
    return "Received purchase entries cannot be edited.";
  }

  if (
    normalizedMessage.includes("json") ||
    normalizedMessage.includes("invalid input syntax") ||
    normalizedMessage.includes("purchase item") ||
    normalizedMessage.includes("product")
  ) {
    return "Purchase items could not be saved. Check products, quantities, and costs.";
  }

  return "Purchase could not be saved. Check the fields and try again.";
}

function revalidatePurchaseSavePaths() {
  revalidatePath("/purchases");
  revalidatePath("/suppliers");
  revalidatePath("/suppliers/analytics");
}

async function savePurchaseEntryWithRpc({
  purchaseId,
  successMessage,
  values,
}: {
  purchaseId: string | null;
  successMessage: string;
  values: NonNullable<Awaited<ReturnType<typeof getPurchaseValues>>["values"]>;
}): Promise<PurchaseActionState> {
  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.rpc("save_purchase_entry", {
      p_items: values.items,
      p_note: values.purchase.note,
      p_purchase_entry_id: purchaseId,
      p_purchase_number: values.purchase.purchase_number,
      p_purchase_status: values.purchase.purchase_status,
      p_supplier_id: values.purchase.supplier_id,
    });

    if (error) {
      console.error("Failed to save purchase entry through RPC.");

      return {
        ok: false,
        message: getSafePurchaseSaveMessage(error.message),
      };
    }

    revalidatePurchaseSavePaths();

    return { ok: true, message: successMessage };
  } catch {
    console.error("Failed to initialize purchase save RPC action.");

    return {
      ok: false,
      message: "Purchase could not be saved right now. Try again shortly.",
    };
  }
}

export async function createPurchaseEntry(
  _previousState: PurchaseActionState,
  formData: FormData,
): Promise<PurchaseActionState> {
  const { error: validationError, values } = getPurchaseValues(formData);

  if (validationError || !values) {
    return {
      ok: false,
      message: validationError ?? "Purchase could not be validated.",
    };
  }

  return savePurchaseEntryWithRpc({
    purchaseId: null,
    successMessage: "Purchase created successfully.",
    values,
  });
}

export async function updatePurchaseEntry(
  _previousState: PurchaseActionState,
  formData: FormData,
): Promise<PurchaseActionState> {
  const purchaseId = getString(formData, "purchaseId");
  const { error: validationError, values } = getPurchaseValues(formData);

  if (!purchaseId) {
    return { ok: false, message: "Purchase entry is required." };
  }

  if (validationError || !values) {
    return {
      ok: false,
      message: validationError ?? "Purchase could not be validated.",
    };
  }

  return savePurchaseEntryWithRpc({
    purchaseId,
    successMessage: "Purchase updated successfully.",
    values,
  });
}

export async function receivePurchaseStock(
  _previousState: PurchaseActionState,
  formData: FormData,
): Promise<PurchaseActionState> {
  const purchaseEntryId = getString(formData, "purchaseEntryId");

  if (!purchaseEntryId) {
    return { ok: false, message: "Purchase entry is required." };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchase_entries")
      .select("id, purchase_status, stock_received")
      .eq("id", purchaseEntryId)
      .maybeSingle();

    if (purchaseError || !purchase) {
      console.error("Failed to load purchase entry before stock receive.");

      return {
        ok: false,
        message: "Purchase could not be loaded for stock receive.",
      };
    }

    const purchaseRow = purchase as PurchaseReceiveCheckRow;

    if (purchaseRow.purchase_status === "cancelled") {
      return {
        ok: false,
        message: "Cancelled purchase entries cannot be received.",
      };
    }

    if (Boolean(purchaseRow.stock_received)) {
      return {
        ok: true,
        message: "Purchase stock was already received.",
      };
    }

    const { error: rpcError } = await supabase.rpc(
      "receive_purchase_entry_stock",
      {
        p_purchase_entry_id: purchaseEntryId,
      },
    );

    if (rpcError) {
      console.error("Failed to receive purchase stock through RPC.");

      return {
        ok: false,
        message:
          "Purchase stock could not be received. Check the purchase items and try again.",
      };
    }

    revalidatePath("/purchases");
    revalidatePath("/inventory");
    revalidatePath("/products");
    revalidatePath("/reports");

    return {
      ok: true,
      message: "Purchase stock received successfully.",
    };
  } catch {
    console.error("Failed to initialize purchase stock receive action.");

    return {
      ok: false,
      message: "Purchase stock could not be received right now. Try again shortly.",
    };
  }
}
