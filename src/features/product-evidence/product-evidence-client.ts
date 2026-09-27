import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type EvidenceStrength = "strong" | "moderate" | "early" | "insufficient";
export type ClaimStatus = "draft" | "verified" | "restricted" | "archived";
export type ClaimType = "benefit" | "visible_result" | "best_for" | "usage" | "safety" | "ingredient" | "other";

export type EvidenceSource = {
  id: string;
  product_id: string;
  source_type: string;
  source_url: string;
  source_title: string;
  evidence_scope: string;
  verified_by: string;
  verified_at: string | null;
  verified: boolean;
  is_primary?: boolean;
  support_level?: string;
};

export type ProductClaim = {
  id: string;
  product_id: string;
  claim_type: ClaimType;
  claim_text: string;
  evidence_strength: EvidenceStrength;
  owner: string;
  status: ClaimStatus;
  verified_by: string;
  verified_at: string | null;
  restriction_reason: string;
  sources: EvidenceSource[];
  readiness: {
    verification_ready: boolean;
    customer_facing_eligible: boolean;
    chatbot_eligible: boolean;
    internal_education_only: boolean;
    source_count: number;
    verified_source_count: number;
    contradictory_source_count: number;
    blockers: string[];
  };
};

export type EvidenceSummary = {
  schema_ready: boolean;
  total: number;
  draft: number;
  verified: number;
  restricted: number;
  archived: number;
  strong: number;
  moderate: number;
  early: number;
  insufficient: number;
  customer_facing_eligible: number;
  chatbot_eligible: number;
  review_required: number;
};

export type EvidenceProduct = {
  product_id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  status: string;
  evidence_summary: EvidenceSummary;
};

export type EvidencePortfolio = {
  schema_ready: boolean;
  setup_required?: boolean;
  summary: {
    products: number;
    claims: number;
    verified: number;
    customer_facing_eligible: number;
    chatbot_eligible: number;
    review_required: number;
  };
  products: EvidenceProduct[];
};

export type ProductEvidenceState = {
  schema_ready: boolean;
  setup_required?: boolean;
  product: Omit<EvidenceProduct, "evidence_summary">;
  summary: EvidenceSummary;
  claims: ProductClaim[];
  sources: EvidenceSource[];
};

const ENDPOINT = bnbApiUrl("manage_product_claim_evidence.php");

async function parse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as ({ success?: boolean; message?: string } & Record<string, unknown>) | null;
  if (!response.ok || !body?.success) throw new Error(body?.message || "Product evidence request failed.");
  return body as T;
}

export async function loadEvidencePortfolio(signal?: AbortSignal) {
  return parse<EvidencePortfolio>(await fetch(ENDPOINT, { cache: "no-store", headers: adminAuthHeaders(), signal }));
}

export async function loadProductEvidence(productId: string, signal?: AbortSignal) {
  return parse<ProductEvidenceState>(await fetch(`${ENDPOINT}?product_id=${encodeURIComponent(productId)}`, { cache: "no-store", headers: adminAuthHeaders(), signal }));
}

async function post<T>(input: Record<string, unknown>) {
  return parse<T>(await fetch(ENDPOINT, {
    method: "POST",
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(input),
  }));
}

export async function saveProductClaim(input: {
  claimId?: string;
  productId: string;
  claimType: ClaimType;
  claimText: string;
  evidenceStrength: EvidenceStrength;
  owner: string;
  sourceIds: string[];
}) {
  return post<ProductEvidenceState>({
    action: "save_claim",
    claim_id: input.claimId || undefined,
    product_id: input.productId,
    claim_type: input.claimType,
    claim_text: input.claimText,
    evidence_strength: input.evidenceStrength,
    owner: input.owner,
    source_ids: input.sourceIds,
  });
}

export async function decideProductClaim(input: {
  action: "verify_claim" | "restrict_claim" | "archive_claim";
  claimId: string;
  actor: string;
  reason?: string;
}) {
  return post<ProductEvidenceState>({
    action: input.action,
    claim_id: input.claimId,
    actor: input.actor,
    reason: input.reason || "",
    confirmed: true,
  });
}
