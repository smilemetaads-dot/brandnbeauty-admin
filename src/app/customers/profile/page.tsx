import {
  getCustomerProfileFromOrdersSupabase,
  getCustomersFromOrdersSupabase,
} from "@/features/customers/customers-data";
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
  let phone = params?.phone;

  if (!phone) {
    const customers = await getCustomersFromOrdersSupabase();
    phone = customers[0]?.phone;
  }

  if (!phone) {
    return <RealCustomerProfilePage profile={null} />;
  }

  const profile = await getCustomerProfileFromOrdersSupabase(phone);

  return <RealCustomerProfilePage profile={profile} />;
}
