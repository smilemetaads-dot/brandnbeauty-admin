import { getPackingOrdersFromSupabase } from "@/features/packing/packing-data";
import { RealPackingDeskPage } from "@/features/packing/RealPackingDeskPage";

export const dynamic = "force-dynamic";

export default async function PackingPage() {
  const orders = await getPackingOrdersFromSupabase();

  return <RealPackingDeskPage orders={orders} />;
}
