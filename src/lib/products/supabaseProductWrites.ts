import "server-only";

import {
  createSupabaseAdminClient,
  getSupabaseAdminDiagnostics,
} from "@/lib/supabase/admin";
import type { ProductRecord, ProductStatus } from "@/lib/types/product";

type ProductRow = {
  id?: string | number | null;
  name?: string | null;
  slug?: string | null;
  brand?: string | null;
  category?: string | null;
  concern?: string | null;
  price?: number | string | null;
  old_price?: number | string | null;
  stock?: number | string | null;
  sku?: string | null;
  image?: string | null;
  short_description?: string | null;
  status?: string | null;
};

type ProductPayload = {
  name: string;
  slug: string;
  brand: string;
  category: string;
  concern: string;
  price: number;
  old_price: number | null;
  stock: number;
  sku: string;
  image: string;
  short_description: string;
  status: ProductStatus;
};

type SupabaseAdminClient = NonNullable<
  ReturnType<typeof createSupabaseAdminClient>
>;

export class ProductSaveError extends Error {
  constructor(
    message: string,
    readonly status = 500,
  ) {
    super(message);
    this.name = "ProductSaveError";
  }
}

const validStatuses: ProductStatus[] = [
  "active",
  "draft",
  "low_stock",
  "out_of_stock",
];

export async function saveProductWithServiceRole(
  product: ProductRecord,
): Promise<ProductRecord> {
  const supabase = createSupabaseAdminClient();
  const diagnostics = getSupabaseAdminDiagnostics();
  const productId = normalizeProductId(product.id);

  if (!supabase) {
    throw new ProductSaveError("Supabase service role config is missing.");
  }

  const isEditing = Boolean(productId);
  const payload = isEditing
    ? toProductPayload(product)
    : await toCreateProductPayload(product, supabase);
  const query = isEditing
    ? supabase
        .from("products")
        .update(payload)
        .eq("id", productId)
        .select("*")
        .maybeSingle()
    : supabase.from("products").insert(payload).select("*").single();

  const { data, error } = await query;

  if (error) {
    const isDuplicateSlug =
      error.code === "23505" && error.message.includes("products_slug_key");

    console.error("[admin-products] Service role product save failed:", {
      table: "public.products",
      id: productId,
      code: error.code,
      message: error.message,
      diagnostics,
    });

    if (!isEditing && isDuplicateSlug) {
      throw new ProductSaveError(
        "A product with this URL slug already exists. Please use a unique slug.",
        409,
      );
    }

    if (isEditing && isDuplicateSlug) {
      throw new ProductSaveError(
        "Another product already uses this URL slug. Please choose a different slug.",
        409,
      );
    }

    throw new ProductSaveError(error.message);
  }

  if (isEditing && !data) {
    throw new ProductSaveError(
      "This product could not be found for updating.",
      404,
    );
  }

  return mapProductRow(data);
}

function toProductPayload(product: ProductRecord): ProductPayload {
  return {
    name: product.name,
    slug: product.slug || slugify(product.name),
    brand: product.brand,
    category: product.category,
    concern: product.concern,
    price: product.price,
    old_price: product.oldPrice,
    stock: product.stock,
    sku: product.sku,
    image: product.image,
    short_description: product.shortDescription,
    status: product.status,
  };
}

async function toCreateProductPayload(
  product: ProductRecord,
  supabase: SupabaseAdminClient,
): Promise<ProductPayload> {
  const baseSlug = product.slug || slugify(product.name) || "product";
  const payload = toProductPayload({
    ...product,
    slug: await createUniqueSlug(supabase, baseSlug),
    sku: product.sku || (await createUniqueSku(supabase)),
  });

  return payload;
}

function mapProductRow(row: ProductRow): ProductRecord {
  const name = toText(row.name, "Untitled Product");
  const slug = toText(row.slug, slugify(name));

  return {
    id: toText(row.id, slug),
    name,
    slug,
    brand: toText(row.brand, "BrandnBeauty"),
    category: toText(row.category, "Skincare"),
    concern: toText(row.concern, "General"),
    price: toNumber(row.price, 0),
    oldPrice: toNullableNumber(row.old_price),
    stock: toNumber(row.stock, 0),
    sku: toText(row.sku, ""),
    image: toText(row.image, ""),
    shortDescription: toText(row.short_description, ""),
    status: toStatus(row.status),
  };
}

function toText(value: unknown, fallback: string) {
  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

function toNumber(value: unknown, fallback: number) {
  const numericValue = Number(
    typeof value === "string" ? value.replace(/[^0-9.]/g, "") : value,
  );
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(
    typeof value === "string" ? value.replace(/[^0-9.]/g, "") : value,
  );
  return Number.isFinite(numericValue) ? numericValue : null;
}

function toStatus(value: unknown): ProductStatus {
  const normalizedStatus =
    typeof value === "string"
      ? value.toLowerCase().replace(/[\s-]+/g, "_")
      : value;

  return validStatuses.includes(normalizedStatus as ProductStatus)
    ? (normalizedStatus as ProductStatus)
    : "active";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeProductId(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

async function createUniqueSlug(
  supabase: SupabaseAdminClient,
  baseSlug: string,
) {
  const normalizedBaseSlug = slugify(baseSlug) || "product";
  const { data, error } = await supabase
    .from("products")
    .select("slug")
    .ilike("slug", `${normalizedBaseSlug}%`);

  if (error) {
    throw new ProductSaveError("Could not generate a unique product slug.");
  }

  const existingSlugs = new Set(
    (data ?? [])
      .map((row) => toText(row.slug, ""))
      .filter((slug) => slug.length > 0),
  );

  if (!existingSlugs.has(normalizedBaseSlug)) {
    return normalizedBaseSlug;
  }

  let suffix = 2;
  while (existingSlugs.has(`${normalizedBaseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${normalizedBaseSlug}-${suffix}`;
}

async function createUniqueSku(
  supabase: SupabaseAdminClient,
) {
  const prefix = `BNB-${formatDateStamp(new Date())}`;
  const { data, error } = await supabase
    .from("products")
    .select("sku")
    .ilike("sku", `${prefix}-%`);

  if (error) {
    throw new ProductSaveError("Could not generate a unique product SKU.");
  }

  const existingSkus = new Set(
    (data ?? [])
      .map((row) => toText(row.sku, ""))
      .filter((sku) => sku.length > 0),
  );

  let suffix = 1;
  let candidate = `${prefix}-${suffix.toString().padStart(4, "0")}`;

  while (existingSkus.has(candidate)) {
    suffix += 1;
    candidate = `${prefix}-${suffix.toString().padStart(4, "0")}`;
  }

  return candidate;
}

function formatDateStamp(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}
