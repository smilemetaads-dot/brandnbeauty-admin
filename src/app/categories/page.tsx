import { getCategoriesFromSupabase } from "@/features/catalog/categories-data";
import { RealCategoriesPage } from "@/features/catalog/RealCategoriesPage";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategoriesFromSupabase();

  return <RealCategoriesPage categories={categories} />;
}
