import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiAssetUrl, bnbApiUrl } from "@/lib/bnb-api";

export type ProductStatus = "active" | "draft" | "inactive" | "archived" | "out_of_stock";

export type CatalogProduct = {
  brand: string;
  category: string;
  comparePrice: number | null;
  costPrice: number | null;
  createdAt: string;
  description: string;
  draftId: string;
  featured: boolean;
  id: string;
  image: string;
  lowStockThreshold: number;
  metaDescription: string;
  metaTitle: string;
  name: string;
  price: number;
  shortDescription: string;
  sku: string;
  slug: string;
  status: ProductStatus;
  stock: number;
  updatedAt: string;
};

export type CatalogSummary = {
  active: number;
  drafts: number;
  lowStock: number;
  outOfStock: number;
  total: number;
};

const MANAGE_PRODUCTS = bnbApiUrl("manage_products.php");
const UPLOAD_PRODUCT_IMAGE = bnbApiUrl("upload_homepage_media.php");

export const emptyCatalogProduct: CatalogProduct = {
  brand: "",
  category: "",
  comparePrice: null,
  costPrice: null,
  createdAt: "",
  description: "",
  draftId: "",
  featured: false,
  id: "",
  image: "",
  lowStockThreshold: 10,
  metaDescription: "",
  metaTitle: "",
  name: "",
  price: 0,
  shortDescription: "",
  sku: "",
  slug: "",
  status: "draft",
  stock: 0,
  updatedAt: "",
};

function text(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function status(value: unknown): ProductStatus {
  return value === "active" || value === "inactive" || value === "archived" || value === "out_of_stock" ? value : "draft";
}

function product(raw: unknown): CatalogProduct | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = text(row.id);
  const name = text(row.name);
  if (!name) return null;
  return {
    brand: text(row.brand),
    category: text(row.category),
    comparePrice: nullableNumber(row.compare_price),
    costPrice: nullableNumber(row.cost_price),
    createdAt: text(row.created_at),
    description: text(row.description),
    draftId: text(row.draft_id),
    featured: Boolean(row.featured),
    id,
    image: text(row.image),
    lowStockThreshold: Math.max(0, Number(row.low_stock_threshold) || 10),
    metaDescription: text(row.meta_description),
    metaTitle: text(row.meta_title),
    name,
    price: Math.max(0, Number(row.price) || 0),
    shortDescription: text(row.short_description),
    sku: text(row.sku),
    slug: text(row.slug),
    status: status(row.status),
    stock: Math.max(0, Number(row.stock) || 0),
    updatedAt: text(row.updated_at),
  };
}

function summary(raw: unknown, products: CatalogProduct[]): CatalogSummary {
  const row = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  return {
    active: Number(row.active) || 0,
    drafts: Number(row.drafts) || 0,
    lowStock: Number(row.low_stock) || 0,
    outOfStock: Number(row.out_of_stock) || 0,
    total: Number(row.total) || products.length,
  };
}

async function jsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "The product request could not be completed.");
  return payload;
}

export async function getCatalogProducts(signal?: AbortSignal): Promise<{ products: CatalogProduct[]; summary: CatalogSummary }> {
  const response = await fetch(MANAGE_PRODUCTS, { cache: "no-store", headers: adminAuthHeaders(), signal });
  const payload = await jsonResponse<{ products?: unknown[]; summary?: unknown }>(response);
  const products = (payload.products || []).map(product).filter((item): item is CatalogProduct => Boolean(item));
  return { products, summary: summary(payload.summary, products) };
}

export async function getCatalogProduct(id: string, signal?: AbortSignal): Promise<CatalogProduct> {
  const response = await fetch(`${MANAGE_PRODUCTS}?action=get&id=${encodeURIComponent(id)}`, { cache: "no-store", headers: adminAuthHeaders(), signal });
  const payload = await jsonResponse<{ draft?: unknown; product?: unknown }>(response);
  return product(payload.draft) || product(payload.product) || { ...emptyCatalogProduct };
}

function productPayload(value: CatalogProduct) {
  return {
    brand: value.brand,
    category: value.category,
    compare_price: value.comparePrice,
    cost_price: value.costPrice,
    description: value.description,
    draft_id: value.draftId,
    featured: value.featured,
    id: value.id,
    image: value.image,
    low_stock_threshold: value.lowStockThreshold,
    meta_description: value.metaDescription,
    meta_title: value.metaTitle,
    name: value.name,
    price: value.price,
    short_description: value.shortDescription,
    sku: value.sku,
    slug: value.slug,
    status: value.status,
    stock: value.stock,
  };
}

export async function saveProductDraft(value: CatalogProduct): Promise<{ draftId: string; product: CatalogProduct }> {
  const response = await fetch(MANAGE_PRODUCTS, {
    body: JSON.stringify({ action: "save_draft", ...productPayload(value) }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  const payload = await jsonResponse<{ draft?: unknown; draft_id?: unknown }>(response);
  const next = product(payload.draft) || { ...value };
  const draftId = text(payload.draft_id) || next.draftId;
  return { draftId, product: { ...next, draftId } };
}

export async function publishProductDraft(draftId: string, reason: string): Promise<CatalogProduct> {
  const response = await fetch(MANAGE_PRODUCTS, {
    body: JSON.stringify({ action: "publish", confirm: "publish", draft_id: draftId, reason }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  const payload = await jsonResponse<{ product?: unknown }>(response);
  const next = product(payload.product);
  if (!next) throw new Error("The published product was not returned.");
  return next;
}

export async function discardProductDraft(draftId: string): Promise<void> {
  const response = await fetch(MANAGE_PRODUCTS, {
    body: JSON.stringify({ action: "discard_draft", confirm: "discard", draft_id: draftId }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  await jsonResponse(response);
}

export async function archiveCatalogProduct(id: string, reason: string): Promise<CatalogProduct> {
  const response = await fetch(MANAGE_PRODUCTS, {
    body: JSON.stringify({ action: "archive", confirm: "archive", id, reason }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  const payload = await jsonResponse<{ product?: unknown }>(response);
  const next = product(payload.product);
  if (!next) throw new Error("The archived product was not returned.");
  return next;
}

export async function uploadProductImage(file: File): Promise<string> {
  if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) throw new Error("Use a JPG, PNG or WebP image.");
  if (file.size <= 0 || file.size > 5 * 1024 * 1024) throw new Error("Image must be 5 MB or smaller.");
  const body = new FormData();
  body.append("image", file);
  const response = await fetch(UPLOAD_PRODUCT_IMAGE, { body, headers: adminAuthHeaders(), method: "POST" });
  const payload = await jsonResponse<{ url?: string }>(response);
  if (!payload.url) throw new Error("The image upload did not return a URL.");
  return payload.url;
}

export function productImageUrl(value: string) {
  return bnbApiAssetUrl(value, null);
}

