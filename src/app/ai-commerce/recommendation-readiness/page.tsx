import { AdminShell } from "@/components/admin/AdminShell";
import { LiveAiRecommendationReadinessWorkspace } from "@/features/ai-recommendation-readiness/LiveAiRecommendationReadinessWorkspace";

export default function AiRecommendationReadinessPage() {
  return (
    <AdminShell>
      <LiveAiRecommendationReadinessWorkspace />
    </AdminShell>
  );
}
