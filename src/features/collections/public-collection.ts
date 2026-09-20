import { cache } from "react";

import { bnbApiAssetUrl, bnbApiUrl } from "@/lib/bnb-api";

export type PublicCollectionProduct = {
  brand: string;
  id: string;
  image: string;
  name: string;
  price: number;
  sku: string;
  slug: string;
  stock: number;
};

export type PublicCollection = {
  description: string;
  desktopImage: string;
  eyebrow: string;
  mobileImage: string;
  products: PublicCollectionProduct[];
  seoDescription: string;
  seoTitle: string;
  slug: string;
  title: string;
};

function text(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function product(raw: unknown): PublicCollectionProduct | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = text(row.id);
  const name = text(row.product_name) || text(row.name);
  if (!id || !name) return null;
  return {
    brand: text(row.brand_name) || text(row.brand),
    id,
    image: bnbApiAssetUrl(text(row.image_url) || text(row.main_image) || text(row.image), "") || "",
    name,
    price: Number(row.price) || Number(row.selling_price) || Number(row.sale_price) || 0,
    sku: text(row.sku),
    slug: text(row.slug),
    stock: Number(row.stock_quantity) || Number(row.stock) || Number(row.quantity) || 0,
  };
}

export const getPublicCollection = cache(async (slug: string): Promise<PublicCollection | null> => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  try {
    const response = await fetch(`${bnbApiUrl("get_collection.php")}?slug=${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (response.status === 404) return null;
    const payload = (await response.json()) as { collection?: unknown; success?: boolean };
    if (!response.ok || payload.success === false || !payload.collection || typeof payload.collection !== "object") return null;
    const row = payload.collection as Record<string, unknown>;
    return {
      description: text(row.description),
      desktopImage: bnbApiAssetUrl(text(row.desktop_image_url), "") || "",
      eyebrow: text(row.eyebrow_label),
      mobileImage: bnbApiAssetUrl(text(row.mobile_image_url), "") || "",
      products: Array.isArray(row.products) ? row.products.map(product).filter((item): item is PublicCollectionProduct => Boolean(item)) : [],
      seoDescription: text(row.seo_description),
      seoTitle: text(row.seo_title),
      slug: text(row.slug),
      title: text(row.title),
    };
  } catch {
    return null;
  }
});
