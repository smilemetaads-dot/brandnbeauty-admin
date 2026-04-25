import AdminLayout from "@/components/layout/AdminLayout";
import RealFinancePage from "@/features/finance/RealFinancePage";
import { getFinanceDataFromSupabase } from "@/lib/finance/supabaseFinance";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const financeData = await getFinanceDataFromSupabase();

  return (
    <AdminLayout title="Finance">
      <RealFinancePage financeData={financeData} />
    </AdminLayout>
  );
}
