import AdminLayout from "@/components/layout/AdminLayout";
import RealInventoryPage from "@/features/inventory/RealInventoryPage";
import { getInventoryMovementsFromSupabase } from "@/lib/inventory/supabaseInventory";
import { getProductsFromSupabase } from "@/lib/products/supabaseProducts";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const [products, movements] = await Promise.all([
    getProductsFromSupabase(),
    getInventoryMovementsFromSupabase(),
  ]);

  return (
    <AdminLayout title="Inventory">
      <RealInventoryPage
        initialProducts={products}
        initialMovements={movements}
      />
    </AdminLayout>
  );
}
