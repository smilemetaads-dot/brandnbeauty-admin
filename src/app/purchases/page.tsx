import { getPurchaseEntriesFromSupabase } from "@/features/purchases/purchases-data";
import { RealPurchasesPage } from "@/features/purchases/RealPurchasesPage";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const { entries, kpis } = await getPurchaseEntriesFromSupabase();

  return <RealPurchasesPage entries={entries} kpis={kpis} />;
}
