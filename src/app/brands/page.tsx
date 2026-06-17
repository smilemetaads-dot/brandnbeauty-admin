import { RealBrandsPage } from "@/features/catalog/RealBrandsPage";

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

  return <RealBrandsPage editBrandId={editBrandId} />;
}
