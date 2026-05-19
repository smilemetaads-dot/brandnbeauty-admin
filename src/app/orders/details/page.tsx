import { getOrderDetailsFromSupabase } from "@/features/orders/orders-data";
import { RealOrderDetailsPage } from "@/features/orders/RealOrderDetailsPage";

export const dynamic = "force-dynamic";

type OrderDetailsPageProps = {
  searchParams?: Promise<{
    id?: string;
  }>;
};

export default async function OrderDetailsPage({
  searchParams,
}: OrderDetailsPageProps) {
  const params = await searchParams;
  const id = params?.id;

  if (!id) {
    return <RealOrderDetailsPage order={null} />;
  }

  const order = await getOrderDetailsFromSupabase(id);

  return <RealOrderDetailsPage order={order} />;
}
