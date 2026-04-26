import AdminLayout from "@/components/layout/AdminLayout";
import RealCustomersPage from "@/features/customers/RealCustomersPage";
import { getCustomersDataFromSupabase } from "@/lib/customers/supabaseCustomers";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customersData = await getCustomersDataFromSupabase();

  return (
    <AdminLayout title="Customers">
      <RealCustomersPage customersData={customersData} />
    </AdminLayout>
  );
}
