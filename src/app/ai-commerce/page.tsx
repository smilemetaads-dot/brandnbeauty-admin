import { AdminShell } from "@/components/admin/AdminShell";
import { AiCommerceControlClient } from "@/features/ai-commerce/AiCommerceControlClient";

export const dynamic = "force-dynamic";

export default function AiCommercePage() {
  return (
    <AdminShell>
      <AiCommerceControlClient />
    </AdminShell>
  );
}
