import { RealCategoriesPage } from "@/features/catalog/RealCategoriesPage";

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

  return (
    <RealCategoriesPage
      editCategoryId={editCategoryId}
    />
  );
}
