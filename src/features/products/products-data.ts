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

type ProductConcernRow = {
  concern_id: string | null;
};

export type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  brand_id: string | null;
  category_id: string | null;
  price: number;
  old_price: number | null;
  stock: number;
  image: string | null;
  short_description: string | null;
  status: string | null;
  featured: boolean | null;
  attributes: Record<string, unknown> | null;
  concernIds: string[];
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
        "id, name, slug, sku, brand_id, category_id, price, old_price, stock, image, short_description, status, featured, attributes, created_at, updated_at, brands(name, slug), categories(name, slug)",
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
      concernIds: [],
    }));
  } catch {
    console.error("Failed to initialize products data source.");
    return [];
  }
}

export async function getProductByIdFromSupabase(
  id: string,
): Promise<ProductRecord | null> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, slug, sku, brand_id, category_id, price, old_price, stock, image, short_description, status, featured, attributes, created_at, updated_at",
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Failed to load product from Supabase.");
      return null;
    }

    if (!data) {
      return null;
    }

    const { data: concernRows, error: concernError } = await supabase
      .from("product_concerns")
      .select("concern_id")
      .eq("product_id", id);

    if (concernError) {
      console.error("Failed to load product concerns from Supabase.");
    }

    return {
      ...data,
      brands: null,
      categories: null,
      concernIds: ((concernRows ?? []) as ProductConcernRow[])
        .map((row) => row.concern_id)
        .filter((concernId): concernId is string => Boolean(concernId)),
    } as ProductRecord;
  } catch {
    console.error("Failed to initialize product detail data source.");
    return null;
  }
}
