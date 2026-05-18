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

function getSingleRelation(
  relation: InventoryRelation | InventoryRelation[],
): InventoryRelation {
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
