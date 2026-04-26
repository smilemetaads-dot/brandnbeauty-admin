import AdminLayout from "@/components/layout/AdminLayout";
import RealReportsPage from "@/features/reports/RealReportsPage";
import { getReportsDataFromSupabase } from "@/lib/reports/supabaseReports";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reportsData = await getReportsDataFromSupabase();

  return (
    <AdminLayout title="Reports">
      <RealReportsPage reportsData={reportsData} />
    </AdminLayout>
  );
}
