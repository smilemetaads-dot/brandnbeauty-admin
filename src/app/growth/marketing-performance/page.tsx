import { AdminShell } from "@/components/admin/AdminShell";
import { LiveMarketingPerformanceWorkspace } from "@/features/marketing-performance/LiveMarketingPerformanceWorkspace";

export default function GrowthMarketingPerformancePage() {
  return (
    <AdminShell>
      <LiveMarketingPerformanceWorkspace />
    </AdminShell>
  );
}
