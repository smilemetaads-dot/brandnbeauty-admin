import AdminLayout from "@/components/layout/AdminLayout";
import RealDashboardPage from "@/features/dashboard/RealDashboardPage";
import { getDashboardDataFromSupabase } from "@/lib/dashboard/supabaseDashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dashboardData = await getDashboardDataFromSupabase();

  return (
    <AdminLayout title="Dashboard">
      <RealDashboardPage dashboardData={dashboardData} />
    </AdminLayout>
  );
}
