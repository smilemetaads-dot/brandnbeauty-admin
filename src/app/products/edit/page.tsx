import { getBrandsFromSupabase } from "@/features/catalog/brands-data";
import { getCategoriesFromSupabase } from "@/features/catalog/categories-data";
import { getConcernsFromSupabase } from "@/features/catalog/concerns-data";
import { RealAddEditProductPage } from "@/features/products/RealAddEditProductPage";
import { getProductByIdFromSupabase } from "@/features/products/products-data";

export const dynamic = "force-dynamic";

type EditProductPageProps = {
  searchParams?: Promise<{
    id?: string | string[];
  }>;
};

export default async function EditProductPage({
  searchParams,
}: EditProductPageProps) {
  const params = await searchParams;
  const productId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [categories, concerns, brands, product] = await Promise.all([
    getCategoriesFromSupabase(),
    getConcernsFromSupabase(),
    getBrandsFromSupabase(),
    productId ? getProductByIdFromSupabase(productId) : Promise.resolve(null),
  ]);

  return (
    <RealAddEditProductPage
      brands={brands}
      categories={categories}
      concerns={concerns}
      product={product}
    />
  );
}
