import { getProductsFromSupabase } from "@/features/products/products-data";
import { RealProductsPage } from "@/features/products/RealProductsPage";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getProductsFromSupabase();

  return <RealProductsPage products={products} />;
}
