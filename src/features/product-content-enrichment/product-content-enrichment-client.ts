import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type ContentPriority = "P0" | "P1" | "P2";
export type ContentStatus =
  | "queued"
  | "researching"
  | "draft"
  | "review"
  | "approved"
  | "published"
  | "hold";

export type ProductContentSource = {
  active: string | number | boolean;
  created_at: string;
  evidence_scope: string | null;
  id: string | number;
  is_primary: string | number | boolean;
  source_title: string | null;
  source_type:
    | "official_brand"
    | "manufacturer"
    | "packaging"
    | "authorized_retailer"
    | "other";
  source_url: string;
  updated_at: string;
  verified_at: string | null;
  verified_by: string | null;
};

export type ProductContentItem = {
  ai_generated: boolean;
  approved_at: string | null;
  approved_by: string | null;
  brand: string;
  candidate: Record<string, unknown>;
  category: string;
  draft_payload: Record<string, unknown>;
  image: string;
  maturity_level: string;
  missing_fields: {
    knowledge_next?: string[];
    required_for_c3?: string[];
  };
  name: string;
  priority: ContentPriority;
  product_id: string;
  product_status: string;
  research_notes: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  risk_flags: string[];
  sellable_stock: number;
  sku: string;
  source_summary: {
    authoritative_count: number;
    source_count: number;
    verified_count: number;
  };
  sources?: ProductContentSource[];
  status: ContentStatus;
};

export type ProductContentState = {
  products: ProductContentItem[];
  summary: {
    approved: number;
    draft: number;
    hold: number;
    p0: number;
    p1: number;
    p2: number;
    published: number;
    queued: number;
    researching: number;
    review: number;
    total: number;
    with_authoritative_source: number;
  };
};

const ENDPOINT = bnbApiUrl("manage_product_content_enrichment.php");

async function payload(response: Response) {
  const body = (await response.json().catch(() => null)) as
    | (Record<string, unknown> & {
        message?: string;
        success?: boolean;
      })
    | null;

  if (!response.ok || !body?.success) {
    throw new Error(
      body?.message || "Product content enrichment request failed.",
    );
  }

  return body;
}

export async function loadContentEnrichment(
  signal?: AbortSignal,
): Promise<ProductContentState> {
  const response = await fetch(ENDPOINT, {
    cache: "no-store",
    headers: adminAuthHeaders(),
    signal,
  });

  const body = await payload(response);

  return {
    products: Array.isArray(body.products)
      ? (body.products as ProductContentItem[])
      : [],
    summary: (body.summary ?? {
      approved: 0,
      draft: 0,
      hold: 0,
      p0: 0,
      p1: 0,
      p2: 0,
      published: 0,
      queued: 0,
      researching: 0,
      review: 0,
      total: 0,
      with_authoritative_source: 0,
    }) as ProductContentState["summary"],
  };
}

export async function loadContentProduct(
  productId: string,
): Promise<ProductContentItem> {
  const response = await fetch(
    `${ENDPOINT}?product_id=${encodeURIComponent(productId)}`,
    {
      cache: "no-store",
      headers: adminAuthHeaders(),
    },
  );

  const body = await payload(response);
  return body.product as ProductContentItem;
}

async function post(input: Record<string, unknown>) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: adminAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(input),
  });

  return payload(response);
}

export async function syncContentQueue() {
  return post({ action: "sync_queue" });
}

export async function saveContentDraft(input: {
  aiGenerated?: boolean;
  draft: Record<string, unknown>;
  productId: string;
  researchNotes?: string;
}) {
  return post({
    action: "save_draft",
    ai_generated: Boolean(input.aiGenerated),
    draft: input.draft,
    product_id: input.productId,
    research_notes: input.researchNotes ?? "",
  });
}

export async function addContentSource(input: {
  evidenceScope?: string;
  isPrimary?: boolean;
  productId: string;
  sourceTitle?: string;
  sourceType: ProductContentSource["source_type"];
  sourceUrl: string;
}) {
  return post({
    action: "add_source",
    evidence_scope: input.evidenceScope ?? "",
    is_primary: Boolean(input.isPrimary),
    product_id: input.productId,
    source_title: input.sourceTitle ?? "",
    source_type: input.sourceType,
    source_url: input.sourceUrl,
  });
}

export async function setContentStatus(input: {
  confirmed?: boolean;
  productId: string;
  reviewedBy?: string;
  status: Exclude<ContentStatus, "published">;
}) {
  return post({
    action: "set_status",
    confirmed: Boolean(input.confirmed),
    product_id: input.productId,
    reviewed_by: input.reviewedBy ?? "",
    status: input.status,
  });
}
