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
  product_name: string;
  product_sku: string | null;
  quantity: number;
  received_quantity: number;
  total_cost: number;
  unit_cost: number;
};

type ProductSnapshotRow = {
  id: string;
  name: string;
  sku: string | null;
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

async function getProductSnapshots(productIds: string[]) {
  if (!productIds.length) {
    return new Map<string, ProductSnapshotRow>();
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku")
    .in("id", productIds);

  if (error) {
    console.error("Failed to load product snapshots for purchase action.");
    return null;
  }

  return ((data ?? []) as ProductSnapshotRow[]).reduce(
    (productMap, product) => productMap.set(product.id, product),
    new Map<string, ProductSnapshotRow>(),
  );
}

async function getPurchaseValues(formData: FormData) {
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

  const productSnapshots = await getProductSnapshots([
    ...new Set(selectedProductIds),
  ]);

  if (!productSnapshots) {
    return {
      error: "Purchase products could not be loaded. Try again shortly.",
      values: null,
    };
  }

  const items: PurchaseItemValues[] = [];

  for (let index = 0; index < productIds.length; index += 1) {
    const productId = productIds[index];

    if (!productId) {
      continue;
    }

    const product = productSnapshots.get(productId);
    const quantity = quantities[index];
    const received_quantity = receivedQuantities[index];
    const unit_cost = unitCosts[index];

    if (!product) {
      return {
        error: "Choose a valid product for every purchase item.",
        values: null,
      };
    }

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

    if (quantity < 0 || received_quantity < 0 || unit_cost < 0) {
      return {
        error: "Quantity, received quantity, and unit cost cannot be negative.",
        values: null,
      };
    }

    const total_cost = quantity * unit_cost;

    items.push({
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      quantity,
      received_quantity,
      total_cost,
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
        total_cost: items.reduce((sum, item) => sum + item.total_cost, 0),
      },
    },
  };
}

export async function createPurchaseEntry(
  _previousState: PurchaseActionState,
  formData: FormData,
): Promise<PurchaseActionState> {
  const { error: validationError, values } = await getPurchaseValues(formData);

  if (validationError || !values) {
    return {
      ok: false,
      message: validationError ?? "Purchase could not be validated.",
    };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchase_entries")
      .insert({
        ...values.purchase,
        stock_received: false,
        stock_received_at: null,
      })
      .select("id")
      .single();

    if (purchaseError || !purchase) {
      console.error("Failed to create purchase entry.");

      return {
        ok: false,
        message: "Purchase could not be created. Check the fields and try again.",
      };
    }

    const itemRows = values.items.map((item) => ({
      ...item,
      purchase_entry_id: purchase.id,
    }));
    const { error: itemsError } = await supabase
      .from("purchase_entry_items")
      .insert(itemRows);

    if (itemsError) {
      console.error("Failed to create purchase entry items.");

      return {
        ok: false,
        message:
          "Purchase was started, but item rows could not be saved. Review the purchase before continuing.",
      };
    }

    revalidatePath("/purchases");

    return { ok: true, message: "Purchase created successfully." };
  } catch {
    console.error("Failed to initialize purchase create action.");

    return {
      ok: false,
      message: "Purchase could not be created right now. Try again shortly.",
    };
  }
}

export async function updatePurchaseEntry(
  _previousState: PurchaseActionState,
  formData: FormData,
): Promise<PurchaseActionState> {
  const purchaseId = getString(formData, "purchaseId");
  const { error: validationError, values } = await getPurchaseValues(formData);

  if (!purchaseId) {
    return { ok: false, message: "Purchase entry is required." };
  }

  if (validationError || !values) {
    return {
      ok: false,
      message: validationError ?? "Purchase could not be validated.",
    };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data: currentPurchase, error: currentError } = await supabase
      .from("purchase_entries")
      .select("id, stock_received")
      .eq("id", purchaseId)
      .maybeSingle();

    if (currentError || !currentPurchase) {
      console.error("Failed to load purchase entry before update.");

      return {
        ok: false,
        message: "Purchase could not be loaded for editing.",
      };
    }

    if (Boolean(currentPurchase.stock_received)) {
      return {
        ok: false,
        message: "Received purchase entries cannot be edited.",
      };
    }

    const { error: updateError } = await supabase
      .from("purchase_entries")
      .update({
        ...values.purchase,
        stock_received: false,
        stock_received_at: null,
      })
      .eq("id", purchaseId);

    if (updateError) {
      console.error("Failed to update purchase entry.");

      return {
        ok: false,
        message: "Purchase could not be updated. Check the fields and try again.",
      };
    }

    const { error: deleteItemsError } = await supabase
      .from("purchase_entry_items")
      .delete()
      .eq("purchase_entry_id", purchaseId);

    if (deleteItemsError) {
      console.error("Failed to replace purchase entry items.");

      return {
        ok: false,
        message: "Purchase items could not be replaced. Try again shortly.",
      };
    }

    const itemRows = values.items.map((item) => ({
      ...item,
      purchase_entry_id: purchaseId,
    }));
    const { error: insertItemsError } = await supabase
      .from("purchase_entry_items")
      .insert(itemRows);

    if (insertItemsError) {
      console.error("Failed to save replacement purchase entry items.");

      return {
        ok: false,
        message: "Purchase items could not be saved. Try again shortly.",
      };
    }

    revalidatePath("/purchases");

    return { ok: true, message: "Purchase updated successfully." };
  } catch {
    console.error("Failed to initialize purchase update action.");

    return {
      ok: false,
      message: "Purchase could not be updated right now. Try again shortly.",
    };
  }
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
