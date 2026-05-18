import { getOrdersFromSupabase } from "@/features/orders/orders-data";
import { RealOrdersPage } from "@/features/orders/RealOrdersPage";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await getOrdersFromSupabase();

  return <RealOrdersPage orders={orders} />;
}
