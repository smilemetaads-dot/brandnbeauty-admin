import AdminLayout from "@/components/layout/AdminLayout";
import RealInventoryPage from "@/features/inventory/RealInventoryPage";

export default function InventoryPage() {
  return (
    <AdminLayout title="Inventory">
      <RealInventoryPage />
    </AdminLayout>
  );
}
