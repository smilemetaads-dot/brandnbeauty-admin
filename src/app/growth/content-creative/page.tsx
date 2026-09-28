import { AdminShell } from "@/components/admin/AdminShell";
import { LiveContentCreativeWorkspace } from "@/features/content-creative/LiveContentCreativeWorkspace";

export default function GrowthContentCreativePage() {
  return (
    <AdminShell>
      <LiveContentCreativeWorkspace />
    </AdminShell>
  );
}
