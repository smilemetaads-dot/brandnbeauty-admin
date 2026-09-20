import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type CollectionStatus = "active" | "inactive" | "draft" | "deleted";

export type CollectionSummary = {
  desktopImage: string;
  eyebrow: string;
  id: string;
  mobileImage: string;
  productCount: number;
  slug: string;
  sortOrder: number;
  status: CollectionStatus;
  title: string;
  updatedAt: string;
};

export type CollectionDraft = {
  description: string;
  desktopImage: string;
  eyebrow: string;
  id: string;
  mobileImage: string;
  productIds: string[];
  seoDescription: string;
  seoTitle: string;
  slug: string;
  sortOrder: number;
  status: Exclude<CollectionStatus, "deleted">;
  title: string;
};

export type CollectionProduct = {
  brand: string;
  id: string;
  image: string;
  name: string;
  price: number;
  sku: string;
  slug: string;
  stock: number;
};

const MANAGE_COLLECTIONS = bnbApiUrl("manage_collections.php");
const STORE_PRODUCTS = bnbApiUrl("get_store_products.php");
const UPLOAD_COLLECTION_IMAGE = bnbApiUrl("upload_homepage_media.php");

export const emptyCollectionDraft: CollectionDraft = {
  description: "",
  desktopImage: "",
  eyebrow: "",
  id: "",
  mobileImage: "",
  productIds: [],
  seoDescription: "",
  seoTitle: "",
  slug: "",
  sortOrder: 1,
  status: "draft",
  title: "",
};

function text(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function status(value: unknown): CollectionStatus {
  return value === "active" || value === "inactive" || value === "deleted" ? value : "draft";
}

function summary(raw: unknown): CollectionSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = text(row.id);
  const title = text(row.title);
  if (!id || !title) return null;
  return {
    desktopImage: text(row.desktop_image_url),
    eyebrow: text(row.eyebrow_label),
    id,
    mobileImage: text(row.mobile_image_url),
    productCount: Number(row.product_count) || 0,
    slug: text(row.slug),
    sortOrder: Number(row.sort_order) || 0,
    status: status(row.status),
    title,
    updatedAt: text(row.updated_at),
  };
}

function draft(raw: unknown): CollectionDraft {
  if (!raw || typeof raw !== "object") return { ...emptyCollectionDraft };
  const row = raw as Record<string, unknown>;
  const nextStatus = status(row.status);
  return {
    description: text(row.description),
    desktopImage: text(row.desktop_image_url),
    eyebrow: text(row.eyebrow_label),
    id: text(row.id),
    mobileImage: text(row.mobile_image_url),
    productIds: Array.isArray(row.product_ids) ? row.product_ids.map(text).filter(Boolean) : [],
    seoDescription: text(row.seo_description),
    seoTitle: text(row.seo_title),
    slug: text(row.slug),
    sortOrder: Number(row.sort_order) || 0,
    status: nextStatus === "deleted" ? "draft" : nextStatus,
    title: text(row.title),
  };
}

function product(raw: unknown): CollectionProduct | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = text(row.id);
  const name = text(row.product_name) || text(row.name);
  if (!id || !name) return null;
  return {
    brand: text(row.brand_name) || text(row.brand),
    id,
    image: text(row.image_url) || text(row.main_image) || text(row.image),
    name,
    price: Number(row.price) || Number(row.selling_price) || Number(row.sale_price) || 0,
    sku: text(row.sku),
    slug: text(row.slug),
    stock: Number(row.stock_quantity) || Number(row.stock) || Number(row.quantity) || 0,
  };
}

async function jsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "The request could not be completed.");
  return payload;
}

export async function getCollections(signal?: AbortSignal): Promise<CollectionSummary[]> {
  const response = await fetch(`${MANAGE_COLLECTIONS}?include_deleted=1`, { cache: "no-store", headers: adminAuthHeaders(), signal });
  const payload = await jsonResponse<{ collections?: unknown[] }>(response);
  return (payload.collections || []).map(summary).filter((item): item is CollectionSummary => Boolean(item));
}

export async function getCollection(id: string, signal?: AbortSignal): Promise<CollectionDraft> {
  const response = await fetch(`${MANAGE_COLLECTIONS}?action=get&id=${encodeURIComponent(id)}`, { cache: "no-store", headers: adminAuthHeaders(), signal });
  const payload = await jsonResponse<{ collection?: unknown }>(response);
  return draft(payload.collection);
}

export async function getCollectionProducts(signal?: AbortSignal): Promise<CollectionProduct[]> {
  const response = await fetch(STORE_PRODUCTS, { cache: "no-store", headers: adminAuthHeaders(), signal });
  const payload = await jsonResponse<{ products?: unknown[] }>(response);
  return (payload.products || []).map(product).filter((item): item is CollectionProduct => Boolean(item));
}

export async function saveCollection(value: CollectionDraft): Promise<CollectionDraft> {
  const response = await fetch(MANAGE_COLLECTIONS, {
    body: JSON.stringify({
      description: value.description,
      desktop_image_url: value.desktopImage,
      eyebrow_label: value.eyebrow,
      id: value.id,
      mobile_image_url: value.mobileImage,
      product_ids: value.productIds,
      seo_description: value.seoDescription,
      seo_title: value.seoTitle,
      slug: value.slug,
      sort_order: value.sortOrder,
      status: value.status,
      title: value.title,
    }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  const payload = await jsonResponse<{ collection?: unknown }>(response);
  return draft(payload.collection);
}

export async function collectionAction(action: string, input: Record<string, unknown>): Promise<string> {
  const response = await fetch(MANAGE_COLLECTIONS, {
    body: JSON.stringify({ action, ...input }),
    headers: adminAuthHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  });
  const payload = await jsonResponse<{ message?: string }>(response);
  return payload.message || "Collection updated.";
}

export async function uploadCollectionImage(file: File): Promise<string> {
  if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) throw new Error("Use a JPG, PNG or WebP image.");
  if (file.size <= 0 || file.size > 5 * 1024 * 1024) throw new Error("Image must be 5 MB or smaller.");
  const body = new FormData();
  body.append("image", file);
  const response = await fetch(UPLOAD_COLLECTION_IMAGE, { body, headers: adminAuthHeaders(), method: "POST" });
  const payload = await jsonResponse<{ url?: string }>(response);
  if (!payload.url) throw new Error("The image upload did not return a URL.");
  return payload.url;
}
