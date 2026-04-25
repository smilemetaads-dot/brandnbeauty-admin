import AdminLayout from "@/components/layout/AdminLayout";
import RealProductManagementPage from "@/features/products/RealProductManagementPage";
import { getProductsFromSupabase } from "@/lib/products/supabaseProducts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProductsPage() {
  const products = await getProductsFromSupabase();

  return (
    <AdminLayout title="Products">
      <RealProductManagementPage initialProducts={products} />
    </AdminLayout>
  );
}
