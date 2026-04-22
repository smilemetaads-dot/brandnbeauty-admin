import AdminLayout from "@/components/layout/AdminLayout";
import RealOrderDetailsPage from "@/features/orders/RealOrderDetailsPage";

export default function OrderDetailsPage() {
  return (
    <AdminLayout title="Order Details">
      <RealOrderDetailsPage />
    </AdminLayout>
  );
}
