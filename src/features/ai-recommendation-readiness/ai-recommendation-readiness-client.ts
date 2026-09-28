import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type AiGateBlocker = { code: string; message: string };

export type AiGate = {
  eligible: boolean;
  status: "ELIGIBLE" | "BLOCKED";
  surface: "chatbot" | "skin_test" | "rule_assisted";
  product_id: number;
  sellable_stock?: number;
  bot_readiness_status?: string;
  customer_facing_claims?: number;
  chatbot_safe_claims?: number;
  reviewed_skin_profiles?: number;
  blockers?: AiGateBlocker[];
};

export type AiRecommendationReadinessProduct = {
  product_id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  status: string;
  chatbot: AiGate;
  skin_test: AiGate;
  rule_assisted: AiGate;
};

export type AiRecommendationReadinessState = {
  summary: {
    total: number;
    chatbot_eligible: number;
    skin_test_eligible: number;
    rule_assisted_eligible: number;
    blocked_from_all_ai_surfaces: number;
  };
  products: AiRecommendationReadinessProduct[];
  policy: Record<string, unknown>;
  generated_at: string;
};

const ENDPOINT = bnbApiUrl("get_ai_recommendation_readiness.php");

export async function loadAiRecommendationReadiness(signal?: AbortSignal) {
  const response = await fetch(ENDPOINT, {
    cache: "no-store",
    headers: adminAuthHeaders(),
    signal,
  });
  const body = (await response.json().catch(() => null)) as
    | ({ success?: boolean; message?: string } & Partial<AiRecommendationReadinessState>)
    | null;

  if (!response.ok || !body?.success) {
    throw new Error(body?.message || "AI recommendation readiness could not be loaded.");
  }
  return body as AiRecommendationReadinessState;
}
