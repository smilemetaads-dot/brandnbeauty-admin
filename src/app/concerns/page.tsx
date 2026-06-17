import { RealConcernsPage } from "@/features/catalog/RealConcernsPage";

type ConcernsPageProps = {
  searchParams?: Promise<{
    edit?: string | string[];
  }>;
};

export default async function ConcernsPage({
  searchParams,
}: ConcernsPageProps) {
  const params = await searchParams;
  const editConcernId = Array.isArray(params?.edit)
    ? params.edit[0]
    : params?.edit;

  return <RealConcernsPage editConcernId={editConcernId} />;
}
