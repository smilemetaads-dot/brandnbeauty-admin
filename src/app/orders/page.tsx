import AdminLayout from "@/components/layout/AdminLayout";
import RealOrdersManagementPage from "@/features/orders/RealOrdersManagementPage";
import { getOrdersFromSupabase } from "@/lib/orders/supabaseOrders";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await getOrdersFromSupabase();

  return (
    <AdminLayout title="Orders">
      <RealOrdersManagementPage initialOrders={orders} />
    </AdminLayout>
  );
}
