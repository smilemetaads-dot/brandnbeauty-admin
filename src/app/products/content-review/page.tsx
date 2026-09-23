import { AdminShell } from "@/components/admin/AdminShell";
import { LiveP0BatchReviewWorkspace } from "@/features/product-content-review/LiveP0BatchReviewWorkspace";

export default function ProductContentReviewPage() {
  return (
    <AdminShell>
      <LiveP0BatchReviewWorkspace />
    </AdminShell>
  );
}
