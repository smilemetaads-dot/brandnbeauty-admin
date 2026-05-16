import { getConcernsFromSupabase } from "@/features/catalog/concerns-data";
import { RealConcernsPage } from "@/features/catalog/RealConcernsPage";

export const dynamic = "force-dynamic";

export default async function ConcernsPage() {
  const concerns = await getConcernsFromSupabase();

  return <RealConcernsPage concerns={concerns} />;
}
