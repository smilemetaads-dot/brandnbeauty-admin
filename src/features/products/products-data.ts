import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type ProductRelation = {
  name: string | null;
  slug: string | null;
} | null;

type ProductRow = Omit<ProductRecord, "brands" | "categories"> & {
  brands: ProductRelation | ProductRelation[];
  categories: ProductRelation | ProductRelation[];
};

export type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  old_price: number | null;
  stock: number;
  image: string | null;
  short_description: string | null;
  status: string | null;
  featured: boolean | null;
  attributes: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
  brands: ProductRelation;
  categories: ProductRelation;
};

function getSingleRelation(
  relation: ProductRelation | ProductRelation[],
): ProductRelation {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

export async function getProductsFromSupabase(): Promise<ProductRecord[]> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, slug, sku, price, old_price, stock, image, short_description, status, featured, attributes, created_at, updated_at, brands(name, slug), categories(name, slug)",
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load products from Supabase.");
      return [];
    }

    return ((data ?? []) as ProductRow[]).map((product) => ({
      ...product,
      brands: getSingleRelation(product.brands),
      categories: getSingleRelation(product.categories),
    }));
  } catch {
    console.error("Failed to initialize products data source.");
    return [];
  }
}
