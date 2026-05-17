import { getBrandsFromSupabase } from "@/features/catalog/brands-data";
import { getCategoriesFromSupabase } from "@/features/catalog/categories-data";
import { getConcernsFromSupabase } from "@/features/catalog/concerns-data";
import { RealAddEditProductPage } from "@/features/products/RealAddEditProductPage";

export const dynamic = "force-dynamic";

export default async function EditProductPage() {
  const [categories, concerns, brands] = await Promise.all([
    getCategoriesFromSupabase(),
    getConcernsFromSupabase(),
    getBrandsFromSupabase(),
  ]);

  return (
    <RealAddEditProductPage
      brands={brands}
      categories={categories}
      concerns={concerns}
    />
  );
}
