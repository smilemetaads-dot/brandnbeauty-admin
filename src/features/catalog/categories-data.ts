import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  status: string | null;
  featured: boolean | null;
  meta_title: string | null;
  meta_description: string | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export async function getCategoriesFromSupabase(): Promise<CategoryRecord[]> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("categories")
      .select(
        "id, name, slug, image, status, featured, meta_title, meta_description, sort_order, created_at, updated_at",
      )
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to load categories from Supabase.");
      return [];
    }

    return data ?? [];
  } catch {
    console.error("Failed to initialize categories data source.");
    return [];
  }
}
