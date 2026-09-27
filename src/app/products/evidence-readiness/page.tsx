import { AdminShell } from "@/components/admin/AdminShell";
import { LiveProductEvidenceWorkspace } from "@/features/product-evidence/LiveProductEvidenceWorkspace";

export default function ProductEvidenceReadinessPage() {
  return (
    <AdminShell>
      <LiveProductEvidenceWorkspace />
    </AdminShell>
  );
}
