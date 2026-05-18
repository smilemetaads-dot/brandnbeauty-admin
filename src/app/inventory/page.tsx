import { getInventoryProductsFromSupabase } from "@/features/inventory/inventory-data";
import { RealInventoryPage } from "@/features/inventory/RealInventoryPage";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const products = await getInventoryProductsFromSupabase();

  return <RealInventoryPage products={products} />;
}
