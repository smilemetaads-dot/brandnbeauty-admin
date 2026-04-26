import AdminLayout from "@/components/layout/AdminLayout";
import RealPurchaseStockEntryPage from "@/features/purchases/RealPurchaseStockEntryPage";

export default function PurchasesPage() {
  return (
    <AdminLayout title="Purchase Stock Entry">
      <RealPurchaseStockEntryPage />
    </AdminLayout>
  );
}
