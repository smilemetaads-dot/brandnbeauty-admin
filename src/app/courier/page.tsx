import { getCourierPaymentOrdersFromSupabase } from "@/features/courier/courier-data";
import { RealCourierPaymentsPage } from "@/features/courier/RealCourierPaymentsPage";

export const dynamic = "force-dynamic";

export default async function CourierPage() {
  const orders = await getCourierPaymentOrdersFromSupabase();

  return <RealCourierPaymentsPage orders={orders} />;
}
