import AdminLayout from "@/components/layout/AdminLayout";
import RealDashboardPage from "@/features/dashboard/RealDashboardPage";

export default function Home() {
  return (
    <AdminLayout title="Dashboard">
      <RealDashboardPage />
    </AdminLayout>
  );
}
