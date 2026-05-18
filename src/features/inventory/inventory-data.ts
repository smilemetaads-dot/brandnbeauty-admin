import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type InventoryRelation = {
  name: string | null;
  slug: string | null;
} | null;

type InventoryProductRow = Omit<
  InventoryProductRecord,
  "brands" | "categories"
> & {
  brands: InventoryRelation | InventoryRelation[];
  categories: InventoryRelation | InventoryRelation[];
};

type InventoryProductSummary = {
  name: string | null;
  sku: string | null;
  slug: string | null;
} | null;

type InventoryMovementRow = Omit<InventoryMovementRecord, "products"> & {
  products: InventoryProductSummary | InventoryProductSummary[];
};

export type InventoryProductRecord = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  stock: number;
  status: string | null;
  price: number;
  image: string | null;
  updated_at: string | null;
  brands: InventoryRelation;
  categories: InventoryRelation;
};

export type InventoryMovementRecord = {
  id: string;
  product_id: string | null;
  movement_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  note: string | null;
  created_at: string | null;
  products: InventoryProductSummary;
};

function getSingleRelation(
  relation: InventoryRelation | InventoryRelation[],
): InventoryRelation {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

function getSingleProductSummary(
  relation: InventoryProductSummary | InventoryProductSummary[],
): InventoryProductSummary {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

export async function getInventoryProductsFromSupabase(): Promise<
  InventoryProductRecord[]
> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, slug, sku, stock, status, price, image, updated_at, brands(name, slug), categories(name, slug)",
      )
      .order("stock", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to load inventory products from Supabase.");
      return [];
    }

    return ((data ?? []) as InventoryProductRow[]).map((product) => ({
      ...product,
      brands: getSingleRelation(product.brands),
      categories: getSingleRelation(product.categories),
    }));
  } catch {
    console.error("Failed to initialize inventory data source.");
    return [];
  }
}

export async function getRecentInventoryMovementsFromSupabase(
  limit = 10,
): Promise<InventoryMovementRecord[]> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("inventory_movements")
      .select(
        "id, product_id, movement_type, quantity, previous_stock, new_stock, note, created_at, products(name, sku, slug)",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to load inventory movements from Supabase.");
      return [];
    }

    return ((data ?? []) as InventoryMovementRow[]).map((movement) => ({
      ...movement,
      products: getSingleProductSummary(movement.products),
    }));
  } catch {
    console.error("Failed to initialize inventory movement data source.");
    return [];
  }
}
