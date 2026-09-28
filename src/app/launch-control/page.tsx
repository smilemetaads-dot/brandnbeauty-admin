import { AdminShell } from "@/components/admin/AdminShell";
import { LiveLaunchControlWorkspace } from "@/features/launch-control/LiveLaunchControlWorkspace";

export default function LaunchControlPage() {
  return (
    <AdminShell>
      <LiveLaunchControlWorkspace />
    </AdminShell>
  );
}
