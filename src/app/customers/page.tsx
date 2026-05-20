import { getCustomersFromOrdersSupabase } from "@/features/customers/customers-data";
import { RealCustomersPage } from "@/features/customers/RealCustomersPage";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getCustomersFromOrdersSupabase();

  return <RealCustomersPage customers={customers} />;
}
