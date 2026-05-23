import { getSupplierProductPriceHistoryFromSupabase } from "@/features/suppliers/supplier-price-history-data";
import { RealSupplierPriceHistoryPage } from "@/features/suppliers/RealSupplierPriceHistoryPage";

export const dynamic = "force-dynamic";

export default async function SupplierPriceHistoryPage() {
  const priceHistory = await getSupplierProductPriceHistoryFromSupabase();

  return <RealSupplierPriceHistoryPage priceHistory={priceHistory} />;
}
