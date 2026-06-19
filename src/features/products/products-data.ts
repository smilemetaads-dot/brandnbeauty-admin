import "server-only";

import { bnbApiAssetUrl, bnbApiUrl } from "@/lib/bnb-api";

type ProductRelation = {
  name: string | null;
  slug: string | null;
} | null;

export type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  brand_id: string | null;
  category_id: string | null;
  price: number;
  old_price: number | null;
  stock: number;
  image: string | null;
  short_description: string | null;
  status: string | null;
  featured: boolean | null;
  attributes: Record<string, unknown> | null;
  concernIds: string[];
  created_at: string | null;
  updated_at: string | null;
  brands: ProductRelation;
  categories: ProductRelation;
};

type ProductsListRow = {
  created_at: string | null;
  description: string | null;
  id: number;
  image_url: string | null;
  price: number;
  product_name: string;
  status: string | null;
  stock_quantity: number;
};

const PRODUCTS_LIST_ENDPOINT = bnbApiUrl("get_products_list.php");

function toNumber(value: unknown) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function toStringOrNull(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeStatus(status: string | null, stock: number) {
  if (stock <= 0) return "out_of_stock";
  if (status === "active" || status === "draft" || status === "inactive") {
    return status;
  }
  if (stock <= 10) return "low_stock";

  return "draft";
}

function normalizeImageUrl(imageUrl: string | null) {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

  return bnbApiAssetUrl(imageUrl);
}

function normalizeProduct(value: unknown): ProductRecord | null {
  if (!value || typeof value !== "object") return null;

  const product = value as Record<string, unknown>;
  const id = String(product.id ?? "");
  const name = String(product.product_name ?? "").trim();

  if (!id || !name) return null;

  const stock = toNumber(product.stock_quantity);

  return {
    attributes: null,
    brand_id: null,
    brands: null,
    category_id: null,
    categories: null,
    concernIds: [],
    created_at: toStringOrNull(product.created_at),
    featured: false,
    id,
    image: normalizeImageUrl(toStringOrNull(product.image_url)),
    name,
    old_price: null,
    price: toNumber(product.price),
    short_description: toStringOrNull(product.description),
    sku: `BNB-${id.padStart(4, "0")}`,
    slug: slugify(name) || `product-${id}`,
    status: normalizeStatus(toStringOrNull(product.status), stock),
    stock,
    updated_at: null,
  };
}

export async function getProductsFromPhp(): Promise<ProductRecord[]> {
  try {
    const response = await fetch(PRODUCTS_LIST_ENDPOINT, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to load products from PHP endpoint.");
      return [];
    }

    const payload = (await response.json()) as {
      products?: ProductsListRow[];
      success?: boolean;
    };

    if (!payload.success || !Array.isArray(payload.products)) {
      console.error("PHP products endpoint returned an unsuccessful response.");
      return [];
    }

    return payload.products
      .map(normalizeProduct)
      .filter((product): product is ProductRecord => Boolean(product));
  } catch {
    console.error("Failed to initialize PHP products data source.");
    return [];
  }
}
