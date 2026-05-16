import { getBrandsFromSupabase } from "@/features/catalog/brands-data";
import { RealBrandsPage } from "@/features/catalog/RealBrandsPage";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const brands = await getBrandsFromSupabase();

  return <RealBrandsPage brands={brands} />;
}
