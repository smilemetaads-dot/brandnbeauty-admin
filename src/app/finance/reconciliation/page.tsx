import { getCodReconciliationSummaryFromSupabase } from "@/features/finance/reconciliation-data";
import { RealCodReconciliationPage } from "@/features/finance/RealCodReconciliationPage";

export default async function FinanceReconciliationPage() {
  const summary = await getCodReconciliationSummaryFromSupabase();

  return <RealCodReconciliationPage summary={summary} />;
}
