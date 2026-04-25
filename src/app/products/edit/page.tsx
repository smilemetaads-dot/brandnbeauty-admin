import AdminLayout from "@/components/layout/AdminLayout";
import RealAddEditProductPage from "@/features/products/RealAddEditProductPage";
import { getProductFromSupabase } from "@/lib/products/supabaseProducts";

type EditProductPageProps = {
  searchParams?: Promise<{
    id?: string;
  }>;
};

export default async function EditProductPage({
  searchParams,
}: EditProductPageProps) {
  const params = (await searchParams) ?? {};
  const product = params.id ? await getProductFromSupabase(params.id) : null;

  return (
    <AdminLayout title="Add / Edit Product">
      <RealAddEditProductPage
        initialProduct={product}
        editingProductId={params.id ?? ""}
      />
    </AdminLayout>
  );
}
