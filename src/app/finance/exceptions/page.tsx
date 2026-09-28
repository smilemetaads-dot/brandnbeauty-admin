import { AdminShell } from "@/components/admin/AdminShell";
import { LiveFinanceExceptionsWorkspace } from "@/features/finance-exceptions/LiveFinanceExceptionsWorkspace";

export default function FinanceExceptionsPage() {
  return (
    <AdminShell>
      <LiveFinanceExceptionsWorkspace />
    </AdminShell>
  );
}
