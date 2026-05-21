import { getCustomerProfileFromOrdersSupabase } from "@/features/customers/customers-data";
import { RealCustomerProfilePage } from "@/features/customers/RealCustomerProfilePage";

export const dynamic = "force-dynamic";

type CustomerProfilePageProps = {
  searchParams?: Promise<{
    phone?: string;
  }>;
};

export default async function CustomerProfilePage({
  searchParams,
}: CustomerProfilePageProps) {
  const params = await searchParams;
  const phone = params?.phone;

  if (!phone) {
    return <RealCustomerProfilePage profile={null} />;
  }

  const profile = await getCustomerProfileFromOrdersSupabase(phone);

  return <RealCustomerProfilePage profile={profile} />;
}
