import { AdminShell } from "@/components/admin/AdminShell";
import { LiveProductContentEnrichmentWorkspace } from "@/features/product-content-enrichment/LiveProductContentEnrichmentWorkspace";

export default function ProductContentEnrichmentPage() {
  return (
    <AdminShell>
      <LiveProductContentEnrichmentWorkspace />
    </AdminShell>
  );
}
