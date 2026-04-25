import AdminLayout from "@/components/layout/AdminLayout";
import RealOrderDetailsPage from "@/features/orders/RealOrderDetailsPage";
import { getOrderDetailsFromSupabase } from "@/lib/orders/supabaseOrders";

export const dynamic = "force-dynamic";

type OrderDetailsPageProps = {
  searchParams?: Promise<{
    id?: string;
    order?: string;
  }>;
};

export default async function OrderDetailsPage({
  searchParams,
}: OrderDetailsPageProps) {
  const params = (await searchParams) ?? {};
  const orderDetails = await getOrderDetailsFromSupabase({
    id: params.id,
    orderNumber: params.order,
  });

  return (
    <AdminLayout title="Order Details">
      <RealOrderDetailsPage initialOrderDetails={orderDetails} />
    </AdminLayout>
  );
}
