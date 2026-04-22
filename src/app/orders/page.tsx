import AdminLayout from "@/components/layout/AdminLayout";
import RealOrdersManagementPage from "@/features/orders/RealOrdersManagementPage";

export default function OrdersPage() {
  return (
    <AdminLayout title="Orders">
      <RealOrdersManagementPage />
    </AdminLayout>
  );
}
