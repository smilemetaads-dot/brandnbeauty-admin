"use client";

import { useRouter } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { LivePurchaseStockWorkspace } from "@/features/purchase-stock/LivePurchaseStockWorkspace";

const ROUTES: Record<string, string> = {
  Finance: "/finance",
  Inventory: "/inventory",
  "Payable Payments": "/finance/payables",
  Suppliers: "/suppliers",
  "Supplier Analytics": "/suppliers/analytics",
};

export function RealPurchasesPage() {
  const router = useRouter();

  return (
    <AdminShell>
      <LivePurchaseStockWorkspace
        onNavigate={(page) =>
          router.push(ROUTES[page] || "/purchases")
        }
      />
    </AdminShell>
  );
}
