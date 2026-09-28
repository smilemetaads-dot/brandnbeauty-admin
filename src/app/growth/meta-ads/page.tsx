import { AdminShell } from "@/components/admin/AdminShell";
import { LiveMetaAdsWorkspace } from "@/features/meta-ads/LiveMetaAdsWorkspace";

export default function GrowthMetaAdsPage() {
  return (
    <AdminShell>
      <LiveMetaAdsWorkspace />
    </AdminShell>
  );
}
