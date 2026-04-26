import AdminLayout from "@/components/layout/AdminLayout";
import RealFinanceReconciliationDetailsPage from "@/features/finance/RealFinanceReconciliationDetailsPage";

export default function FinanceReconciliationPage() {
  return (
    <AdminLayout title="Finance Reconciliation Details">
      <RealFinanceReconciliationDetailsPage />
    </AdminLayout>
  );
}
