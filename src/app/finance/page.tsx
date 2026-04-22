import AdminLayout from "@/components/layout/AdminLayout";
import RealFinancePage from "@/features/finance/RealFinancePage";

export default function FinancePage() {
  return (
    <AdminLayout title="Finance">
      <RealFinancePage />
    </AdminLayout>
  );
}
