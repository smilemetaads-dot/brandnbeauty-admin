import { AdminShell } from "@/components/admin/AdminShell";
import { LiveTrackingAttributionWorkspace } from "@/features/tracking-attribution/LiveTrackingAttributionWorkspace";

export default function GrowthTrackingAttributionPage() {
  return (
    <AdminShell>
      <LiveTrackingAttributionWorkspace />
    </AdminShell>
  );
}
