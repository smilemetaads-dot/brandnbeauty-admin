import { getSupplierAnalyticsFromSupabase } from "@/features/suppliers/supplier-analytics-data";
import { RealSupplierAnalyticsPage } from "@/features/suppliers/RealSupplierAnalyticsPage";

export const dynamic = "force-dynamic";

export default async function SupplierAnalyticsPage() {
  const analytics = await getSupplierAnalyticsFromSupabase();

  return <RealSupplierAnalyticsPage analytics={analytics} />;
}
