import AdminLayout from "@/components/layout/AdminLayout";
import RealProductManagementPage from "@/features/products/RealProductManagementPage";

export default function ProductsPage() {
  return (
    <AdminLayout title="Products">
      <RealProductManagementPage />
    </AdminLayout>
  );
}
