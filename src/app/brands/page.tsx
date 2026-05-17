import { getBrandsFromSupabase } from "@/features/catalog/brands-data";
import { RealBrandsPage } from "@/features/catalog/RealBrandsPage";

export const dynamic = "force-dynamic";

type BrandsPageProps = {
  searchParams?: Promise<{
    edit?: string | string[];
  }>;
};

export default async function BrandsPage({ searchParams }: BrandsPageProps) {
  const params = await searchParams;
  const editBrandId = Array.isArray(params?.edit)
    ? params.edit[0]
    : params?.edit;
  const brands = await getBrandsFromSupabase();

  return <RealBrandsPage brands={brands} editBrandId={editBrandId} />;
}
