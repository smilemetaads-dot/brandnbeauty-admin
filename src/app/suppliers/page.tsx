import { getSuppliersFromSupabase } from "@/features/suppliers/suppliers-data";
import { RealSuppliersPage } from "@/features/suppliers/RealSuppliersPage";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await getSuppliersFromSupabase();

  return <RealSuppliersPage suppliers={suppliers} />;
}
