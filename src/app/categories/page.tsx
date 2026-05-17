import { getCategoriesFromSupabase } from "@/features/catalog/categories-data";
import { RealCategoriesPage } from "@/features/catalog/RealCategoriesPage";

export const dynamic = "force-dynamic";

type CategoriesPageProps = {
  searchParams?: Promise<{
    edit?: string | string[];
  }>;
};

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const params = await searchParams;
  const editCategoryId = Array.isArray(params?.edit)
    ? params.edit[0]
    : params?.edit;
  const categories = await getCategoriesFromSupabase();

  return (
    <RealCategoriesPage
      categories={categories}
      editCategoryId={editCategoryId}
    />
  );
}
