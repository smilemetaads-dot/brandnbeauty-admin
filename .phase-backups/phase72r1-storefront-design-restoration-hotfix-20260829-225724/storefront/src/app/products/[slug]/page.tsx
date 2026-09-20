import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { bnbApiUrl } from "@/lib/bnb-api";
import ProductDetailsClient from "./ProductDetailsClient";

const PRODUCT_DETAILS_ENDPOINT = bnbApiUrl("get_product_details.php");

type ProductDetailsPayload = {
  product?: {
    description?: string | null;
    id?: number | string | null;
    product_name?: string | null;
    name?: string | null;
    slug?: string | null;
  } | null;
  success?: boolean;
};

function getProductDetailsEndpoint(routeSlug: string): string {
  const query = new URLSearchParams();
  if (/^[1-9]\d*$/.test(routeSlug)) {
    query.set("id", routeSlug);
  } else {
    query.set("slug", routeSlug);
  }

  return `${PRODUCT_DETAILS_ENDPOINT}?${query.toString()}`;
}

async function fetchProductDetails(routeSlug: string): Promise<{ payload: ProductDetailsPayload | null; status: number }> {
  const response = await fetch(getProductDetailsEndpoint(routeSlug), { cache: "no-store" });
  const payload = response.ok ? await response.json() as ProductDetailsPayload : null;

  return { payload, status: response.status };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> | { slug: string } }): Promise<Metadata> {
  const resolvedParams = await params;

  try {
    const { payload } = await fetchProductDetails(resolvedParams.slug);
    const product = payload?.product;
    if (!product || payload?.success === false) {
      return { title: "Product Not Found | BrandnBeauty" };
    }

    const productName = product.product_name || product.name || "BrandnBeauty Product";
    const canonicalToken = String(product.slug || product.id || resolvedParams.slug).trim();
    const description = typeof product.description === "string" && product.description.trim()
      ? product.description.trim().slice(0, 160)
      : `Shop ${productName} at BrandnBeauty.`;

    return {
      title: `${productName} | BrandnBeauty`,
      description,
      alternates: canonicalToken ? { canonical: `/products/${encodeURIComponent(canonicalToken)}` } : undefined,
    };
  } catch {
    return { title: "BrandnBeauty Product" };
  }
}

export default async function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  const resolvedParams = await params;
  let shouldNotFound = false;

  try {
    const { payload, status } = await fetchProductDetails(resolvedParams.slug);
    shouldNotFound = status === 404 || status === 400;

    if (payload) {
      shouldNotFound = payload?.success === false || !payload?.product;
    }
  } catch {
    // Let the client component show the existing unavailable state during transient API failures.
  }

  if (shouldNotFound) {
    notFound();
  }

  return <ProductDetailsClient />;
}