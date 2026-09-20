"use client";

import { useRouter } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { ExactProductsWorkspace } from "@/features/products/ExactProductsWorkspace";

export function ExactProductsPage() {
  const router = useRouter();

  function navigate(page: string) {
    if (page === "Add/Edit Product") {
      router.push("/products/edit");
      return;
    }

    router.push("/products");
  }

  return (
    <AdminShell>
      <ExactProductsWorkspace onNavigate={navigate} />
    </AdminShell>
  );
}
