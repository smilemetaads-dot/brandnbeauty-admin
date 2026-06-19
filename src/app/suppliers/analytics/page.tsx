import { getSupplierAnalytics } from "@/features/suppliers/supplier-analytics-data";
import { RealSupplierAnalyticsPage } from "@/features/suppliers/RealSupplierAnalyticsPage";

export const dynamic = "force-dynamic";

export default async function SupplierAnalyticsPage() {
  const analytics = await getSupplierAnalytics();

  return <RealSupplierAnalyticsPage analytics={analytics} />;
}
