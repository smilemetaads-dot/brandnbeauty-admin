import AdminLayout from "@/components/layout/AdminLayout";
import RealCustomerProfilePage from "@/features/customers/RealCustomerProfilePage";
import { getCustomerProfileFromSupabase } from "@/lib/customers/supabaseCustomers";

export const dynamic = "force-dynamic";

type CustomerProfilePageProps = {
  searchParams?: Promise<{
    phone?: string;
  }>;
};

export default async function CustomerProfilePage({
  searchParams,
}: CustomerProfilePageProps) {
  const params = (await searchParams) ?? {};
  const customerProfile = await getCustomerProfileFromSupabase(params.phone);

  return (
    <AdminLayout title="Customer Profile">
      <RealCustomerProfilePage customerProfile={customerProfile} />
    </AdminLayout>
  );
}
