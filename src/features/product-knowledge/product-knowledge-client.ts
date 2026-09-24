import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type MaturityLevel = "C0" | "C1" | "C2" | "C3" | "C4" | "C5";

export type ProductKnowledgeItem = {
  brand: string;
  category: string;
  description: string;
  image: string;
  maturity: {
    automation_ready: boolean;
    blockers: string[];
    bot_missing_fields: string[];
    bot_readiness_status: string;
    candidate: {
      benefits: string[];
      faq: { answer: string; question: string }[];
      functional_profile: string | null;
      how_to_use: string | null;
      key_ingredients: string[];
      last_verified_at: string | null;
      primary_concerns: string[];
      product_url: string | null;
      size: string | null;
      skin_types: string[];
      verified_by: string | null;
      warnings: string[];
      warnings_status: string;
    };
    commerce_ready: boolean;
    content_ready: boolean;
    has_variants: boolean;
    ingredient_evidence: {
      blocked: number;
      total: number;
      verified: number;
    };
    knowledge_verified: boolean;
    level: MaturityLevel;
    listed: boolean;
    live_selling_price: number;
    media_ready: boolean;
    recommendation_eligible: boolean;
    sellable_stock: number;
    skin_evidence: {
      caution: number;
      review_required: number;
      total: number;
      verified: number;
    };
  };
  name: string;
  product_id: string;
  short_description: string;
  sku: string;
  status: string;
};

export type ProductKnowledgeState = {
  products: ProductKnowledgeItem[];
  summary: {
    c0: number;
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    c5: number;
    recommendation_eligible: number;
    total: number;
  };
};

const MATURITY = bnbApiUrl("get_product_knowledge_maturity.php");
const READINESS = bnbApiUrl("manage_messenger_product_readiness.php");

async function payload(response: Response) {
  const body = (await response.json().catch(() => null)) as
    | (Record<string, unknown> & { message?: string; success?: boolean })
    | null;

  if (!response.ok || !body?.success) {
    throw new Error(body?.message || "Product knowledge request failed.");
  }

  return body;
}

export async function loadProductKnowledge(
  signal?: AbortSignal,
): Promise<ProductKnowledgeState> {
  const response = await fetch(MATURITY, {
    cache: "no-store",
    headers: adminAuthHeaders(),
    signal,
  });

  const body = await payload(response);

  return {
    products: Array.isArray(body.products)
      ? (body.products as ProductKnowledgeItem[])
      : [],
    summary:
      body.summary && typeof body.summary === "object"
        ? (body.summary as ProductKnowledgeState["summary"])
        : {
            c0: 0,
            c1: 0,
            c2: 0,
            c3: 0,
            c4: 0,
            c5: 0,
            recommendation_eligible: 0,
            total: 0,
          },
  };
}

export async function verifyProductKnowledge(input: {
  benefits: string[];
  functionalProfile: string;
  howToUse: string;
  keyIngredients: string[];
  primaryConcerns: string[];
  productId: string;
  productUrl: string;
  size: string;
  skinTypes: string[];
  verifiedBy: string;
  warnings: string[];
  warningsStatus: "unknown" | "verified_none" | "verified_warnings";
}) {
  const response = await fetch(READINESS, {
    body: JSON.stringify({
      benefits: input.benefits,
      confirmed: true,
      functional_profile: input.functionalProfile,
      how_to_use: input.howToUse,
      key_ingredients: input.keyIngredients,
      primary_concerns: input.primaryConcerns,
      product_id: input.productId,
      product_url: input.productUrl,
      size: input.size,
      skin_types: input.skinTypes,
      verified_by: input.verifiedBy,
      warnings: input.warnings,
      warnings_status: input.warningsStatus,
    }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });

  return payload(response);
}
