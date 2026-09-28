import { AdminShell } from "@/components/admin/AdminShell";
import { LiveProcurementExceptionsWorkspace } from "@/features/procurement-exceptions/LiveProcurementExceptionsWorkspace";

export default function ProcurementReorderExceptionsPage() {
  return (
    <AdminShell>
      <LiveProcurementExceptionsWorkspace />
    </AdminShell>
  );
}
