import { getReportsFinanceSummary } from "@/features/reports/reports-data";
import { RealReportsFinancePage } from "@/features/reports/RealReportsFinancePage";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const summary = await getReportsFinanceSummary();

  return <RealReportsFinancePage summary={summary} />;
}
