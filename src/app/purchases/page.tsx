import {
  getPurchaseEntriesFromSupabase,
  getPurchaseFormOptionsFromSupabase,
} from "@/features/purchases/purchases-data";
import { RealPurchasesPage } from "@/features/purchases/RealPurchasesPage";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const [{ entries, kpis }, options] = await Promise.all([
    getPurchaseEntriesFromSupabase(),
    getPurchaseFormOptionsFromSupabase(),
  ]);

  return <RealPurchasesPage entries={entries} kpis={kpis} options={options} />;
}
