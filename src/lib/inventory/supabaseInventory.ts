import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type InventoryMovementRecord = {
  id: string;
  productName: string;
  orderReference: string;
  movementType: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  note: string;
  createdAt: string;
};

type InventoryMovementRow = {
  id?: string | number | null;
  product_id?: string | number | null;
  order_id?: string | number | null;
  movement_type?: string | null;
  quantity?: number | string | null;
  previous_stock?: number | string | null;
  new_stock?: number | string | null;
  note?: string | null;
  created_at?: string | null;
  product_name?: string | null;
  order_number?: string | null;
};

type ProductLookupRow = {
  id?: string | number | null;
  name?: string | null;
};

type OrderLookupRow = {
  id?: string | number | null;
  order_number?: string | null;
};

export async function getInventoryMovementsFromSupabase(): Promise<
  InventoryMovementRecord[]
> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.warn("[admin-inventory] Supabase service role config missing.");
    return [];
  }

  const { data, error } = await supabase
    .from("inventory_movements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[admin-inventory] Supabase movement query failed:", {
      table: "public.inventory_movements",
      code: error.code,
      message: error.message,
    });
    return [];
  }

  const movementRows = (data ?? []) as InventoryMovementRow[];
  const productIds = uniqueValues(movementRows.map((row) => toText(row.product_id, "")));
  const orderIds = uniqueValues(movementRows.map((row) => toText(row.order_id, "")));

  const [productMap, orderMap] = await Promise.all([
    getProductNameMap(supabase, productIds),
    getOrderReferenceMap(supabase, orderIds),
  ]);

  return movementRows.map((row) =>
    mapInventoryMovementRow(row, {
      productName: productMap.get(toText(row.product_id, "")) ?? "",
      orderReference: orderMap.get(toText(row.order_id, "")) ?? "",
    }),
  );
}

async function getProductNameMap(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  productIds: string[],
) {
  const map = new Map<string, string>();

  if (productIds.length === 0) {
    return map;
  }

  const { data, error } = await supabase
    .from("products")
    .select("id, name")
    .in("id", productIds);

  if (error) {
    console.error("[admin-inventory] Product lookup failed:", {
      table: "public.products",
      code: error.code,
      message: error.message,
    });
    return map;
  }

  for (const row of (data ?? []) as ProductLookupRow[]) {
    map.set(toText(row.id, ""), toText(row.name, "Unknown Product"));
  }

  return map;
}

async function getOrderReferenceMap(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  orderIds: string[],
) {
  const map = new Map<string, string>();

  if (orderIds.length === 0) {
    return map;
  }

  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number")
    .in("id", orderIds);

  if (error) {
    console.error("[admin-inventory] Order lookup failed:", {
      table: "public.orders",
      code: error.code,
      message: error.message,
    });
    return map;
  }

  for (const row of (data ?? []) as OrderLookupRow[]) {
    map.set(toText(row.id, ""), toText(row.order_number, ""));
  }

  return map;
}

function mapInventoryMovementRow(
  row: InventoryMovementRow,
  lookups: { productName: string; orderReference: string },
): InventoryMovementRecord {
  return {
    id: toText(row.id, ""),
    productName:
      lookups.productName || toText(row.product_name, "Unknown Product"),
    orderReference:
      lookups.orderReference || toText(row.order_number, ""),
    movementType: toTitleCase(toText(row.movement_type, "adjustment")),
    quantity: toNumber(row.quantity),
    previousStock: toNumber(row.previous_stock),
    newStock: toNumber(row.new_stock),
    note: toText(row.note, ""),
    createdAt: toText(row.created_at, ""),
  };
}

function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function toText(value: unknown, fallback: string) {
  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

function toNumber(value: unknown) {
  const numericValue = Number(
    typeof value === "string" ? value.replace(/[^0-9.-]/g, "") : value,
  );
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
