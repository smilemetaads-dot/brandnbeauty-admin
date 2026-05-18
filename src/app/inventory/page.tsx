import {
  getInventoryProductsFromSupabase,
  getRecentInventoryMovementsFromSupabase,
} from "@/features/inventory/inventory-data";
import { RealInventoryPage } from "@/features/inventory/RealInventoryPage";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const [products, movements] = await Promise.all([
    getInventoryProductsFromSupabase(),
    getRecentInventoryMovementsFromSupabase(),
  ]);

  return <RealInventoryPage movements={movements} products={products} />;
}
