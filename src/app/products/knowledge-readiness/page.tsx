import { AdminShell } from "@/components/admin/AdminShell";
import { LiveProductKnowledgeWorkspace } from "@/features/product-knowledge/LiveProductKnowledgeWorkspace";

export default function ProductKnowledgeReadinessPage() {
  return (
    <AdminShell>
      <LiveProductKnowledgeWorkspace />
    </AdminShell>
  );
}
