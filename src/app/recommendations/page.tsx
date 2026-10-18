"use client";

import { useRouter } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { LiveProductRecommendationsWorkspace } from "@/features/recommendations/LiveProductRecommendationsWorkspace";

export default function RecommendationsPage() {
  const router = useRouter();

  return (
    <AdminShell>
      <LiveProductRecommendationsWorkspace
        onNavigate={(page) => {
          router.push(page === "Products" ? "/products" : "/dashboard");
        }}
      />
    </AdminShell>
  );
}