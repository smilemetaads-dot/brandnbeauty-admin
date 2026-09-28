import { AdminShell } from "@/components/admin/AdminShell";
import { LiveGrowthControlWorkspace } from "@/features/growth-control/LiveGrowthControlWorkspace";

export default function GrowthControlCenterPage() {
  return (
    <AdminShell>
      <LiveGrowthControlWorkspace />
    </AdminShell>
  );
}
