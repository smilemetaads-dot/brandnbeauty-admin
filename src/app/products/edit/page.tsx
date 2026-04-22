import AdminLayout from "@/components/layout/AdminLayout";
import RealAddEditProductPage from "@/features/products/RealAddEditProductPage";

export default function EditProductPage() {
  return (
    <AdminLayout title="Add / Edit Product">
      <RealAddEditProductPage />
    </AdminLayout>
  );
}
