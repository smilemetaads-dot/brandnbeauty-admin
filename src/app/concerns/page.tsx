import { getConcernsFromSupabase } from "@/features/catalog/concerns-data";
import { RealConcernsPage } from "@/features/catalog/RealConcernsPage";

export const dynamic = "force-dynamic";

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
  const concerns = await getConcernsFromSupabase();

  return <RealConcernsPage concerns={concerns} editConcernId={editConcernId} />;
}
