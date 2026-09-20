import { AdminShell } from "@/components/admin/AdminShell";
import { AiCommerceControlCenter } from "@/features/ai-commerce/AiCommerceControlCenter";

export default function AiCommercePage() {
  return (
    <AdminShell>
      <AiCommerceControlCenter />
    </AdminShell>
  );
}
