import AdminLayout from "@/components/layout/AdminLayout";
import RealSuppliersPage from "@/features/suppliers/RealSuppliersPage";

export default function SuppliersPage() {
  return (
    <AdminLayout title="Supplier Profiles">
      <RealSuppliersPage />
    </AdminLayout>
  );
}
