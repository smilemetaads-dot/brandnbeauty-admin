"use client";

/* eslint-disable @next/next/no-html-link-for-pages, react-hooks/immutability, react-hooks/set-state-in-effect */

import React from "react";
import { addToCart as addLocalCartItem } from "@/lib/cart";
import { trackAddToCart, trackViewContent } from "@/lib/analytics";
import { StorefrontProductCard, type StorefrontCardProduct } from "@/components/catalog/StorefrontProductCard";
import { bnbApiAssetUrl, bnbApiUrl } from "@/lib/bnb-api";
import { useParams } from "next/navigation";

const PRODUCT_DETAILS_ENDPOINT = bnbApiUrl("get_product_details.php");
const REVIEWS_ENDPOINT = bnbApiUrl("get_reviews.php");
const STORE_PRODUCTS_ENDPOINT = bnbApiUrl("get_store_products.php");
declare global {
  interface Window {
    __pdpMessageTimer?: number;
  }
}

type RelatedProduct = {
  name: string;
  price: string;
  oldPrice: string;
  tag: string;
  badge: string;
  rating: number;
};

type RoutineItem = {
  step: string;
  label: string;
  name: string;
  price: string;
  selected: boolean;
};

type BoughtTogetherItem = {
  name: string;
  price: string;
  oldPrice: string;
};

type LiveProductDetail = {
  id: number | string;
  slug?: string | null;
  product_name?: string | null;
  name?: string | null;
  sku?: string | null;
  price: number | string;
  old_price?: number | string | null;
  sale_price?: number | string | null;
  image_url?: string | null;
  image?: string | null;
  short_description?: string | null;
  description?: string | null;
  stock_quantity?: number | string | null;
  inventory_mode?: "stocked" | "on_demand" | string | null;
  availability_status?: "available" | "unavailable" | string | null;
  minimum_order_quantity?: number | string | null;
  availability_label?: string | null;
  is_orderable?: boolean | number | null;
  status?: string | null;
  category?: string | null;
  brand?: string | null;
  attributes?: Record<string, unknown> | string | null;
  product_type?: "single" | "variant";
  variants?: ProductVariant[];
};

type ProductVariant = { id: number; variant_name: string; option_name: string; option_value: string; sku: string; regular_price: number | string; sale_price?: number | string | null; stock_quantity: number | string; inventory_mode?: string | null; availability_status?: string | null; minimum_order_quantity?: number | string | null; availability_label?: string | null; is_orderable?: boolean | number | null; image_url?: string | null; status: string };

type ProductReview = {
  customer_name: string;
  id: string;
  image_url?: string | null;
  rating: number;
  result_image_url?: string | null;
  review_text: string;
};

type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  images: string[];
  shortDescription: string;
  description: string;
  sizes: string[];
  benefits: string[];
  faq: { answer: string; question: string }[];
  howToUse: string;
  ingredients: string;
  keyIngredients: string[];
  suitableFor: string;
  tags: string[];
  warnings: string;
  rating: number;
  stockQuantity: number;
  inventoryMode: "stocked" | "on_demand";
  availabilityStatus: "available" | "unavailable";
  minimumOrderQuantity: number;
  availabilityLabel: string;
  isOrderable: boolean;
  productType: "single" | "variant";
  variants: ProductVariant[];
  sku: string;
};

function getStringAttribute(attributes: Record<string, unknown> | null, keys: string[]): string | null {
  for (const key of keys) {
    const value = attributes?.[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function getStringListAttribute(attributes: Record<string, unknown> | null, keys: string[]): string[] {
  for (const key of keys) {
    const value = attributes?.[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
    }
    if (typeof value === "string" && value.trim()) {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function getFaqAttribute(attributes: Record<string, unknown> | null): { answer: string; question: string }[] {
  const value = attributes?.faq;

  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const question = typeof record.question === "string" ? record.question.trim() : "";
      const answer = typeof record.answer === "string" ? record.answer.trim() : "";

      return question && answer ? { answer, question } : null;
    })
    .filter((item): item is { answer: string; question: string } => Boolean(item));
}

function getNumberAttribute(attributes: Record<string, unknown> | null, keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = attributes?.[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return fallback;
}

function normalizeBackendImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return "/products/pdp-1.jpg";
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

  return bnbApiAssetUrl(imageUrl, "/products/pdp-1.jpg") || "/products/pdp-1.jpg";
}

function getProductDetailsEndpoint(routeSlug: string): string {
  const query = new URLSearchParams();
  if (/^[1-9]\d*$/.test(routeSlug)) {
    query.set("id", routeSlug);
  } else {
    query.set("slug", routeSlug);
  }

  return `${PRODUCT_DETAILS_ENDPOINT}?${query.toString()}`;
}

function normalizeAttributes(attributes: LiveProductDetail["attributes"]): Record<string, unknown> | null {
  if (!attributes) return null;
  if (typeof attributes === "string") {
    try {
      const parsed = JSON.parse(attributes) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : null;
    } catch {
      return null;
    }
  }

  return attributes;
}

function mapLiveProductDetail(product: LiveProductDetail): ProductDetail {
  const attributes = normalizeAttributes(product.attributes);
  const productName = product.product_name || product.name || "BrandnBeauty Product";
  const brand = product.brand || "BrandnBeauty";
  const category = product.category || "";
  const price = Number(product.price) || 0;
  const compareAtPrice = product.old_price || product.sale_price ? Number(product.old_price || product.sale_price) || 0 : 0;
  const gallery = getStringListAttribute(attributes, ["gallery_images", "images", "gallery", "thumbnails"]);
  const image = normalizeBackendImageUrl(product.image_url || product.image || gallery[0]);
  const sizes = getStringListAttribute(attributes, ["sizes", "size_options", "variants"]);
  const suitableFor = getStringAttribute(attributes, ["suitable_for"]) || "";
  const benefits = getStringListAttribute(attributes, ["benefits", "best_for", "tags", "concerns"]);
  const tags = getStringListAttribute(attributes, ["tags", "benefits", "best_for"]);
  const keyIngredients = getStringListAttribute(attributes, ["key_ingredients"]);
  const stockQuantity = Number(product.stock_quantity) || 0;
  const inventoryMode = product.inventory_mode === "on_demand" ? "on_demand" : "stocked";
  const availabilityStatus = product.availability_status === "unavailable" ? "unavailable" : "available";
  const minimumOrderQuantity = Math.max(1, Math.floor(Number(product.minimum_order_quantity) || 1));
  const isOrderable = Boolean(product.is_orderable) || (availabilityStatus === "available" && (inventoryMode === "on_demand" || stockQuantity > 0));

  return {
    id: String(product.id),
    slug: String(product.slug || product.id),
    name: productName,
    brand,
    category,
    subcategory: getStringAttribute(attributes, ["subcategory", "type"]) || "",
    price,
    compareAtPrice: compareAtPrice > price ? compareAtPrice : undefined,
    image,
    images: [image, ...gallery.map(normalizeBackendImageUrl).filter((item) => item !== image)].slice(0, 4),
    shortDescription: product.short_description || "Product details are being updated.",
    description: product.description || product.short_description || "Product details are being updated.",
    sizes: product.product_type === "variant" ? [] : (sizes.length > 0 ? sizes : []),
    benefits: benefits.length ? benefits : (suitableFor ? [suitableFor] : []),
    faq: getFaqAttribute(attributes),
    howToUse: getStringAttribute(attributes, ["how_to_use", "howToUse", "usage"]) || "",
    ingredients: getStringAttribute(attributes, ["ingredients", "ingredient_list"]) || "",
    keyIngredients,
    suitableFor,
    tags,
    warnings: getStringAttribute(attributes, ["warnings"]) || "",
    rating: getNumberAttribute(attributes, ["rating"], 0),
    stockQuantity,
    inventoryMode,
    availabilityStatus,
    minimumOrderQuantity,
    availabilityLabel: product.availability_label || (availabilityStatus === "unavailable" ? "Currently Unavailable" : inventoryMode === "on_demand" ? "Available on Order" : stockQuantity > 0 ? "In Stock" : "Currently Unavailable"),
    isOrderable,
    productType: product.product_type === "variant" ? "variant" : "single",
    variants: Array.isArray(product.variants) ? product.variants : [],
    sku: product.sku || "",
  };
}

export default function ProductDetailsClient() {
  const params = useParams<{ slug?: string }>();
  const routeSlug = typeof params?.slug === "string" ? params.slug : "";
  const [product, setProduct] = React.useState<ProductDetail | null>(null);
  const [productReviews, setProductReviews] = React.useState<ProductReview[]>([]);
  const [isLiveLoading, setIsLiveLoading] = React.useState(true);
  const [liveMessage, setLiveMessage] = React.useState("");
  const [isNotFound, setIsNotFound] = React.useState(false);
  const [selectedSize, setSelectedSize] = React.useState("");
  const [selectedVariantId, setSelectedVariantId] = React.useState<number | null>(null);
  const [activeInfoTab, setActiveInfoTab] = React.useState("description");
  const [quantity, setQuantity] = React.useState(1);
  const [bagCount, setBagCount] = React.useState(0);
  const [flashMessage, setFlashMessage] = React.useState("");
  const [mainAddedToCart, setMainAddedToCart] = React.useState(false);
  const [isBuyNowLoading, setIsBuyNowLoading] = React.useState(false);
  const [relatedProducts, setRelatedProducts] = React.useState<StorefrontCardProduct[]>([]);
  const [isPurchaseBoxVisible, setIsPurchaseBoxVisible] = React.useState(true);
  const [routineBundleAdded, setRoutineBundleAdded] = React.useState(false);
  const [fbBundleAdded, setFbBundleAdded] = React.useState(false);
  const [addedRecommendationKeys, setAddedRecommendationKeys] = React.useState<Record<string, boolean>>({});
  const [touchStartX, setTouchStartX] = React.useState<number | null>(null);
  const trackedViewContentKey = React.useRef("");
  const purchasePanelRef = React.useRef<HTMLDivElement | null>(null);

  const thumbs = product?.images.length ? product.images : [];

  const [activeImage, setActiveImage] = React.useState("");
  const [isImageOpen, setIsImageOpen] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    async function loadProductDetail() {
      if (!routeSlug) {
        setIsLiveLoading(false);
        return;
      }

      setIsLiveLoading(true);
      setLiveMessage("");
      setIsNotFound(false);
      setProductReviews([]);

      try {
        const response = await fetch(getProductDetailsEndpoint(routeSlug), {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          success?: boolean;
          product?: LiveProductDetail;
          message?: string;
        };

        if (!isMounted) return;

        if (!response.ok || !payload.success || !payload.product) {
          setIsNotFound(true);
          setLiveMessage(payload.message || "This product is unavailable right now.");
          setIsLiveLoading(false);
          return;
        }

        const liveProduct = mapLiveProductDetail(payload.product);
        setProduct(liveProduct);
        setQuantity((currentQuantity) => Math.max(liveProduct.minimumOrderQuantity, currentQuantity));
        fetch(`${REVIEWS_ENDPOINT}?product_id=${encodeURIComponent(liveProduct.id)}&limit=8`, {
          cache: "no-store",
        })
          .then((reviewResponse) => reviewResponse.json())
          .then((reviewPayload: { reviews?: ProductReview[]; success?: boolean }) => {
            if (!isMounted || reviewPayload.success === false || !Array.isArray(reviewPayload.reviews)) return;
            setProductReviews(reviewPayload.reviews);
          })
          .catch(() => {
            if (isMounted) setProductReviews([]);
          });
      } catch {
        if (!isMounted) return;
        setIsNotFound(true);
        setLiveMessage("This product is unavailable right now.");
        setProductReviews([]);
      } finally {
        if (isMounted) {
          setIsLiveLoading(false);
        }
      }
    }

    loadProductDetail();

    return () => {
      isMounted = false;
    };
  }, [routeSlug]);

  React.useEffect(() => {
    if (!product) return;
    setActiveImage(product.image);
    setMainAddedToCart(false);
    setSelectedSize("");
    setSelectedVariantId(product.productType === "variant" && product.variants.length === 1 ? product.variants[0].id : null);
  }, [product]);

  React.useEffect(() => {
    if (!product) {
      setRelatedProducts([]);
      return;
    }
    const currentProduct = product;
    let isMounted = true;
    async function loadRelatedProducts() {
      try {
        const response = await fetch(STORE_PRODUCTS_ENDPOINT, { cache: "no-store" });
        const payload = (await response.json()) as { products?: StorefrontCardProduct[]; success?: boolean };
        if (!isMounted || payload.success === false || !Array.isArray(payload.products)) return;
        const seen = new Set<string>();
        const currentId = String(currentProduct.id);
        const sameCategory = (item: StorefrontCardProduct) => String((item as { category_name?: string | null }).category_name || "") === currentProduct.category;
        const sameBrand = (item: StorefrontCardProduct) => String(item.brand_name || "") === currentProduct.brand;
        const ranked = payload.products
          .filter((item) => String(item.id || "") !== currentId)
          .filter((item) => {
            const key = String(item.id || item.slug || item.product_name || "");
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .map((item, index) => ({
            item,
            index,
            rank: sameCategory(item) ? 0 : sameBrand(item) ? 1 : 2,
          }))
          .sort((a, b) => a.rank - b.rank || a.index - b.index)
          .slice(0, 8)
          .map(({ item }) => item);
        setRelatedProducts(ranked);
      } catch {
        if (isMounted) setRelatedProducts([]);
      }
    }
    loadRelatedProducts();
    return () => {
      isMounted = false;
    };
  }, [product]);
  React.useEffect(() => {
    const node = purchasePanelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setIsPurchaseBoxVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsPurchaseBoxVisible(entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [product?.id]);

  React.useEffect(() => {
    if (isLiveLoading || isNotFound || !product) return;

    const contentId = product.id || product.slug;
    const trackingKey = `${contentId}:${product.price}`;
    if (!contentId || trackedViewContentKey.current === trackingKey) return;

    trackViewContent({
      content_ids: [contentId],
      content_name: product.name,
      value: product.price,
      quantity: 1,
      page_path: window.location.pathname,
    });
    trackedViewContentKey.current = trackingKey;
  }, [isLiveLoading, isNotFound, product]);

  const related: RelatedProduct[] = [];

  const routineUpsellInitial: RoutineItem[] = [];

  const [routineUpsell, setRoutineUpsell] = React.useState<RoutineItem[]>([]);

  const frequentlyBought: BoughtTogetherItem[] = [];
  void related;
  void routineUpsellInitial;
  void frequentlyBought;

  if (isLiveLoading || (!product && !isNotFound)) {
    return (
      <div className="min-h-screen bg-stone-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-6">
            <a href="/" className="text-2xl font-bold tracking-tight text-slate-900">BrandnBeauty</a>
            <button onClick={() => { window.location.href = "/cart"; }} className="rounded-full bg-[#5E7F85] px-5 py-2 text-sm font-semibold text-white shadow-sm">
              Bag {bagCount}
            </button>
          </div>
        </header>

        <main className="mx-auto flex max-w-7xl px-4 py-16 md:px-6">
          <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-3xl font-bold tracking-tight">Loading product</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
              We are checking the live catalog for this product.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (isNotFound || !product) {
    return (
      <div className="min-h-screen bg-stone-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-6">
            <a href="/" className="text-2xl font-bold tracking-tight text-slate-900">BrandnBeauty</a>
            <button onClick={() => { window.location.href = "/cart"; }} className="rounded-full bg-[#5E7F85] px-5 py-2 text-sm font-semibold text-white shadow-sm">
              Bag {bagCount}
            </button>
          </div>
        </header>

        <main className="mx-auto flex max-w-7xl px-4 py-16 md:px-6">
          <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-3xl font-bold tracking-tight">Product not found</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
              {liveMessage || "This product is unavailable right now. Please browse the active catalog for current BrandnBeauty products."}
            </p>
            <button
              onClick={() => { window.location.href = "/products"; }}
              className="mt-6 rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#4f6b70]"
            >
              Back to Products
            </button>
          </div>
        </main>
      </div>
    );
  }

  const recommendationTitles = ["Similar Products", "Recommended For You", "Recently Viewed"];
  const liveFrequentlyBought: BoughtTogetherItem[] = [];
  const recommendationProducts: RelatedProduct[] = [];
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId) || null;
  const activeVariantRegularPrice = selectedVariant ? Number(selectedVariant.regular_price) || 0 : 0;
  const activeVariantSalePrice = selectedVariant ? Number(selectedVariant.sale_price) || 0 : 0;
  const activePrice = selectedVariant ? (activeVariantSalePrice > 0 ? activeVariantSalePrice : activeVariantRegularPrice) : product.price;
  const activeCompareAtPrice = selectedVariant && activeVariantSalePrice > 0 && activeVariantRegularPrice > activeVariantSalePrice
    ? activeVariantRegularPrice
    : product.compareAtPrice;
  const activeStock = selectedVariant ? Number(selectedVariant.stock_quantity) : product.stockQuantity;
  const activeInventoryMode = (selectedVariant?.inventory_mode === "on_demand" ? "on_demand" : product.inventoryMode) as "stocked" | "on_demand";
  const activeAvailabilityStatus = (selectedVariant?.availability_status === "unavailable" ? "unavailable" : product.availabilityStatus) as "available" | "unavailable";
  const activeMinimumOrderQuantity = Math.max(1, Math.floor(Number(selectedVariant?.minimum_order_quantity || product.minimumOrderQuantity || 1)));
  const activeIsOrderable = product.productType === "variant"
    ? Boolean(selectedVariant?.is_orderable) && product.availabilityStatus !== "unavailable"
    : product.isOrderable;
  const activeAvailabilityLabel = !activeIsOrderable
    ? "Currently Unavailable"
    : activeAvailabilityStatus === "unavailable"
      ? "Currently Unavailable"
      : activeInventoryMode === "on_demand"
        ? "Available on Order"
        : "In Stock";
  const activeSku = selectedVariant?.sku || product.sku;
  const visibleResults: Array<{ concern: string; days: string }> = [];

  const parsePrice = (p: string) => Number(String(p).replace(/[^0-9]/g, ""));
  const formatProductBDT = (n: number) => `Tk ${Number.isFinite(n) && n > 0 ? n.toLocaleString() : "0"}`;
  const formatBDT = (n: number) => `Tk ${Number.isFinite(n) && n > 0 ? n.toLocaleString() : "0"}`;
  const productSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "product";
  const addSupplementalCartItem = ({
    name,
    price,
    compareAtPrice,
    quantity: itemQuantity = 1,
    variant,
  }: {
    name: string;
    price: number;
    compareAtPrice?: number;
    quantity?: number;
    variant?: string;
  }) => {
    const slug = productSlug(name);
    addLocalCartItem({
      id: variant ? `${slug}-${productSlug(variant)}` : slug,
      slug,
      name,
      brand: product.brand,
      image: activeImage || product.image,
      price,
      compareAtPrice,
      quantity: itemQuantity,
      variant,
    });
    trackAddToCart({
      content_ids: [slug],
      content_name: name,
      value: price * itemQuantity,
      quantity: itemQuantity,
      page_path: window.location.pathname,
    });
  };

  const fbTotal = liveFrequentlyBought.reduce((sum, item) => sum + parsePrice(item.price), 0);
  const fbOldTotal = liveFrequentlyBought.reduce((sum, item) => sum + parsePrice(item.oldPrice), 0);
  const fbSavings = fbOldTotal - fbTotal;

  const activeImageIndex = Math.max(0, thumbs.indexOf(activeImage));
  const savings = activeCompareAtPrice && activeCompareAtPrice > activePrice ? activeCompareAtPrice - activePrice : 0;
  const discount = activeCompareAtPrice && activeCompareAtPrice > activePrice
    ? Math.max(0, Math.round(((activeCompareAtPrice - activePrice) / activeCompareAtPrice) * 100))
    : 0;
  const needsVariantSelection = product.productType === "variant" && !selectedVariant;
  const isOutOfStock = !needsVariantSelection && !activeIsOrderable;
  const reviewCountText = productReviews.length > 0
    ? `${productReviews.length} approved ${productReviews.length === 1 ? "review" : "reviews"}`
    : "";
  const variantPrices = product.variants
    .map((variant) => Number(variant.sale_price || variant.regular_price))
    .filter((price) => Number.isFinite(price) && price > 0);
  const displayPrice = product.productType === "variant" && !selectedVariant && variantPrices.length > 1
    ? `From ${formatProductBDT(Math.min(...variantPrices))}`
    : formatProductBDT(activePrice);

  const showMessage = (message: string) => {
    setFlashMessage(message);
    if (typeof window !== "undefined") {
      if (window.__pdpMessageTimer) {
        window.clearTimeout(window.__pdpMessageTimer);
      }
      window.__pdpMessageTimer = window.setTimeout(() => setFlashMessage(""), 1800);
    }
  };

  const handleDecreaseQty = () => setQuantity((q) => Math.max(activeMinimumOrderQuantity, q - 1));
  const handleIncreaseQty = () => {
    if (isOutOfStock) return;
    setQuantity((q) => activeInventoryMode === "stocked" ? Math.min(activeStock, q + 1) : q + 1);
  };

  const addCurrentSelectionToCart = (): number | null => {
    if (product.productType === "variant" && !selectedVariant) {
      showMessage("Please select a variant before continuing");
      return null;
    }
    if (isOutOfStock) {
      showMessage("This product is currently unavailable");
      return null;
    }

    const safeQuantity = activeInventoryMode === "stocked"
      ? Math.min(Math.max(quantity, activeMinimumOrderQuantity), activeStock)
      : Math.max(quantity, activeMinimumOrderQuantity);

    try {
      addLocalCartItem({
        id: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        image: selectedVariant?.image_url ? normalizeBackendImageUrl(selectedVariant.image_url) : product.image,
        price: activePrice,
        compareAtPrice: activeCompareAtPrice && activeCompareAtPrice > activePrice ? activeCompareAtPrice : undefined,
        quantity: safeQuantity,
        inventoryMode: activeInventoryMode,
        availabilityStatus: activeAvailabilityStatus,
        minimumOrderQuantity: activeMinimumOrderQuantity,
        stockQuantity: activeInventoryMode === "stocked" ? activeStock : undefined,
        requiresSourcing: activeInventoryMode === "on_demand",
        variant: selectedVariant?.option_value || selectedSize || undefined,
        productId: Number(product.id),
        variantId: selectedVariant?.id,
        variantSku: selectedVariant?.sku,
        addedAt: new Date().toISOString(),
      });
      trackAddToCart({
        content_ids: [product.id || product.slug],
        content_name: product.name,
        value: activePrice * safeQuantity,
        quantity: safeQuantity,
        page_path: window.location.pathname,
      });
      setBagCount((c) => c + safeQuantity);
      setMainAddedToCart(true);
      return safeQuantity;
    } catch {
      showMessage("We could not add this item. Please try again.");
      return null;
    }
  };

  const handleAddToCart = () => {
    if (mainAddedToCart) {
      window.location.href = "/cart";
      return;
    }

    const safeQuantity = addCurrentSelectionToCart();
    if (safeQuantity) {
      showMessage(String(safeQuantity) + " item added to cart");
    }
  };

  const handleBuyNow = () => {
    if (isBuyNowLoading) return;
    setIsBuyNowLoading(true);

    const safeQuantity = addCurrentSelectionToCart();
    if (!safeQuantity) {
      setIsBuyNowLoading(false);
      return;
    }

    showMessage("Taking you to checkout");
    window.location.href = "/checkout";
  };

  const handleAddBundleToCart = () => {
    if (fbBundleAdded) {
      window.location.href = "/cart";
      return;
    }

    liveFrequentlyBought.forEach((item) => {
      addSupplementalCartItem({
        name: item.name,
        price: parsePrice(item.price),
        compareAtPrice: parsePrice(item.oldPrice),
      });
    });
    setBagCount((c) => c + liveFrequentlyBought.length);
    setFbBundleAdded(true);
    showMessage(`${liveFrequentlyBought.length} bundle items added to cart`);
  };

  const handleToggleRoutine = (index: number) => {
    setRoutineBundleAdded(false);
    setRoutineUpsell((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleAddRoutineBundle = () => {
    const selectedItems = routineUpsell.filter((item) => item.selected);

    if (routineBundleAdded) {
      window.location.href = "/cart";
      return;
    }

    if (selectedItems.length === 0) {
      showMessage("Select at least one routine item");
      return;
    }

    selectedItems.forEach((item) => {
      addSupplementalCartItem({
        name: item.name,
        price: parsePrice(item.price),
        variant: item.label,
      });
    });
    setBagCount((c) => c + selectedItems.length);
    setRoutineBundleAdded(true);
    showMessage(`${selectedItems.length} routine items added to cart`);
  };

  const handleRecommendationAddToCart = (key: string, productName: string) => {
    if (addedRecommendationKeys[key]) {
      window.location.href = "/cart";
      return;
    }
    const recommendation = recommendationProducts.find((item) => item.name === productName);
    addSupplementalCartItem({
      name: productName,
      price: parsePrice(recommendation?.price || "0"),
      compareAtPrice: recommendation ? parsePrice(recommendation.oldPrice) : undefined,
    });
    setBagCount((c) => c + 1);
    setAddedRecommendationKeys((prev) => ({ ...prev, [key]: true }));
    showMessage(`${productName} added to cart`);
  };

  const goToPrevImage = () => {
    const prevIndex = activeImageIndex <= 0 ? thumbs.length - 1 : activeImageIndex - 1;
    setActiveImage(thumbs[prevIndex]);
  };

  const goToNextImage = () => {
    const nextIndex = activeImageIndex >= thumbs.length - 1 ? 0 : activeImageIndex + 1;
    setActiveImage(thumbs[nextIndex]);
  };

  const handleImageTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleImageTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNextImage();
      } else {
        goToPrevImage();
      }
    }
    setTouchStartX(null);
  };

  if (isLiveLoading) {
    return (
      <div className="min-h-screen bg-stone-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-6">
            <a href="/" className="text-2xl font-bold tracking-tight text-slate-900">BrandnBeauty</a>
            <button onClick={() => { window.location.href = "/cart"; }} className="rounded-full bg-[#5E7F85] px-5 py-2 text-sm font-semibold text-white shadow-sm">
              Bag {bagCount}
            </button>
          </div>
        </header>

        <main className="mx-auto flex max-w-7xl px-4 py-16 md:px-6">
          <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-3xl font-bold tracking-tight">Loading product</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
              We are checking the live catalog for this product.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="min-h-screen bg-stone-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-6">
            <a href="/" className="text-2xl font-bold tracking-tight text-slate-900">BrandnBeauty</a>
            <button onClick={() => { window.location.href = "/cart"; }} className="rounded-full bg-[#5E7F85] px-5 py-2 text-sm font-semibold text-white shadow-sm">
              Bag {bagCount}
            </button>
          </div>
        </header>

        <main className="mx-auto flex max-w-7xl px-4 py-16 md:px-6">
          <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-3xl font-bold tracking-tight">Product not found</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
              This product is unavailable right now. Please browse the active catalog for current BrandnBeauty products.
            </p>
            <button
              onClick={() => { window.location.href = "/products"; }}
              className="mt-6 rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#4f6b70]"
            >
              Back to Products
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-28 text-slate-900 md:pb-0">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-6">
          <a href="/" className="text-2xl font-bold tracking-tight text-slate-900">BrandnBeauty</a>
          <button onClick={() => { window.location.href = "/cart"; }} className="rounded-full bg-[#5E7F85] px-5 py-2 text-sm font-semibold text-white shadow-sm">
            Bag {bagCount}
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {flashMessage ? (
          <div className="mb-4 rounded-2xl border border-[#5E7F85]/20 bg-[#eef4f4] px-4 py-3 text-sm font-medium text-[#355055]">
            {flashMessage}
          </div>
        ) : null}

        {isLiveLoading ? (
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#5E7F85] shadow-sm">
            Loading live product details...
          </div>
        ) : null}

        {liveMessage ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 shadow-sm">
            {liveMessage}
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div
                className="relative flex aspect-square items-center justify-center rounded-[1.5rem] bg-stone-100 text-sm text-slate-400"
                onTouchStart={handleImageTouchStart}
                onTouchEnd={handleImageTouchEnd}
              >
                <img
                  src={activeImage}
                  alt={product.name}
                  className="h-full w-full cursor-zoom-in object-contain"
                  onError={(event) => { event.currentTarget.src = "/products/pdp-1.jpg"; }}
                  onClick={() => setIsImageOpen(true)}
                />

                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 md:hidden">
                  {thumbs.map((img, index) => (
                    <button
                      key={img}
                      onClick={() => setActiveImage(img)}
                      className={`h-2.5 w-2.5 rounded-full ${
                        index === activeImageIndex ? "bg-[#5E7F85]" : "bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-3">
              {thumbs.map((img) => (
                <div
                  key={img}
                  className={`overflow-hidden rounded-2xl border bg-white p-2 shadow-sm ${
                    activeImage === img ? "border-[#5E7F85]" : "border-slate-200"
                  }`}
                >
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-stone-100 text-[11px] text-slate-400">
                    <img
                      src={img}
                      alt={`${product.name} thumbnail`}
                      onClick={() => setActiveImage(img)}
                      className="h-full w-full cursor-pointer object-cover"
                      onError={(event) => { event.currentTarget.src = "/products/pdp-1.jpg"; }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-5 sm:grid-cols-3">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center text-[#5E7F85]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-10 w-10">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l6 2.5v5.5c0 4.2-2.6 8-6 10-3.4-2-6-5.8-6-10V5.5L12 3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                      <circle cx="12" cy="12" r="9" strokeDasharray="2 2" />
                    </svg>
                  </div>
                  <div className="mt-2 text-sm font-medium text-slate-700">Authenticity reviewed before listing</div>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center text-[#5E7F85]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-10 w-10">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 1 1-6.36 2.64" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3H3v3" />
                      <text x="12" y="11" textAnchor="middle" fontSize="5.2" fill="currentColor" stroke="none" fontWeight="700">Info</text>
                      <text x="12" y="16" textAnchor="middle" fontSize="3.2" fill="currentColor" stroke="none" fontWeight="600">Help</text>
                    </svg>
                  </div>
                  <div className="mt-2 text-sm font-medium text-slate-700">Support information available</div>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center text-[#5E7F85]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-10 w-10">
                      <circle cx="12" cy="12" r="9" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
                      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
                    </svg>
                  </div>
                  <div className="mt-2 text-sm font-medium text-slate-700">Delivery timing shown at checkout</div>
                </div>
              </div>
            </div>
          </div>

          <div ref={purchasePanelRef} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{product.name}</h1>

            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {product.rating > 0 ? <span className="font-semibold">Rating {product.rating}/5</span> : null}
                {reviewCountText ? <span className="text-slate-500">{reviewCountText}</span> : null}
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 font-semibold ${
                    isOutOfStock ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                  }`}>
                    {activeAvailabilityLabel}
                  </span>
                  {activeInventoryMode === "on_demand" && !isOutOfStock ? <span className="text-xs font-semibold text-slate-500">Sourcing time may vary</span> : null}
                </div>
              </div>
            </div>

            <div className="hidden">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">In Stock</span>
                </div>
              </div>
              <div className="mt-2">
                <span className="flex items-center gap-1 text-sm font-semibold text-rose-600">
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <div className="text-3xl font-bold">{displayPrice}</div>
              {product.compareAtPrice ? (
                <div className="text-lg text-slate-400 line-through">{formatProductBDT(product.compareAtPrice)}</div>
              ) : null}
              {savings > 0 ? (
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-[#5E7F85]">Save {formatProductBDT(savings)}</div>
              ) : null}
              {discount > 0 ? (
                <div className="rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-600">{discount}% OFF</div>
              ) : null}
            </div>

            {product.productType === "variant" ? <div className="mt-6">
              <div className="text-sm font-semibold text-slate-900">{product.variants[0]?.option_name || "Variant"}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    disabled={!variant.is_orderable || product.availabilityStatus === "unavailable"}
                    onClick={() => { setSelectedVariantId(variant.id); setQuantity(Math.max(1, Math.floor(Number(variant.minimum_order_quantity) || 1))); if (variant.image_url) setActiveImage(normalizeBackendImageUrl(variant.image_url)); }}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      selectedVariantId === variant.id
                        ? "border-[#5E7F85] bg-[#5E7F85] text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-[#5E7F85] disabled:cursor-not-allowed disabled:opacity-40"
                    }`}
                  >
                    {variant.option_value}
                  </button>
                ))}
              </div>
            </div> : null}

            <div className="mt-6">
              <div className="text-sm font-semibold text-slate-900">Quantity</div>
              <div className="mt-3 flex items-center gap-3">
                <div className={`flex w-fit items-center gap-4 rounded-full border px-4 py-2 ${
                  isOutOfStock ? "border-slate-200 bg-slate-50 text-slate-400" : "border-slate-300"
                }`}>
                  <button onClick={handleDecreaseQty} className="text-lg text-slate-500">&minus;</button>
                  <span className="text-sm font-semibold">{quantity}</span>
                  <button disabled={isOutOfStock || (activeInventoryMode === "stocked" && quantity >= activeStock)} onClick={handleIncreaseQty} className="text-lg text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">+</button>
                </div>

              </div>
            </div>

            <p className="mt-6 text-sm leading-7 text-slate-600 md:text-base">
              <strong className="text-[#5E7F85]">Why It Works:</strong> {product.shortDescription}
            </p>

            <div className="mt-6">
              <div className="text-sm font-semibold text-[#5E7F85]">Best For:</div>
              {product.benefits.length > 0 ? (
              <ul className="mt-2 space-y-1.5 text-sm text-slate-600 md:text-base">
                {product.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <span className="mt-1 text-[#5E7F85]">&bull;</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-3 text-sm">
              {product.category ? (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Category:</span>
                  <button onClick={() => { window.location.href = `/category/${productSlug(product.category)}`; }} className="font-semibold text-[#5E7F85]">
                    {product.category}
                  </button>
                  {product.subcategory ? (
                    <>
                      <span className="text-slate-400">,</span>
                      <button onClick={() => { window.location.href = `/category/${productSlug(product.category)}?subcategory=${productSlug(product.subcategory)}`; }} className="font-semibold text-[#5E7F85]">
                        {product.subcategory}
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}

              {product.tags.length > 0 ? (
                <div className="flex items-start gap-2">
                  <span className="pt-1 text-slate-500">Tags:</span>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          window.location.href = `/products?search=${encodeURIComponent(tag)}`;
                        }}
                        className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Brand:</span>
                <button onClick={() => { window.location.href = `/brand/${productSlug(product.brand)}`; }} className="font-semibold text-[#5E7F85]">
                  {product.brand}
                </button>
              </div>
              {activeSku ? <div className="flex items-center gap-2"><span className="text-slate-500">SKU:</span><span className="font-semibold text-slate-600">{activeSku}</span></div> : null}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock || needsVariantSelection}
                aria-label={needsVariantSelection ? "Select a variant before adding to cart" : "Add selected product to cart"}
                className={`min-h-12 rounded-2xl px-5 py-4 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#5E7F85] focus:ring-offset-2 ${
                  isOutOfStock || needsVariantSelection
                    ? "cursor-not-allowed bg-slate-200 text-slate-500"
                    :
                  mainAddedToCart
                    ? "border border-[#5E7F85] bg-[#eef4f4] text-[#355055] hover:bg-[#e4efef]"
                    : "bg-[#5E7F85] text-white hover:bg-[#4f6b70]"
                }`}
              >
                {needsVariantSelection ? "Select a Variant" : isOutOfStock ? "Currently Unavailable" : mainAddedToCart ? "View Cart" : "Add to Cart"}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock || needsVariantSelection || isBuyNowLoading}
                aria-label={needsVariantSelection ? "Select a variant before buying now" : "Buy selected product now"}
                className={`min-h-12 rounded-2xl border px-5 py-4 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#5E7F85] focus:ring-offset-2 ${
                  isOutOfStock || needsVariantSelection || isBuyNowLoading
                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
                    : "border-[#5E7F85] bg-white text-[#355055] hover:bg-[#eef4f4]"
                }`}
              >
                {isBuyNowLoading ? "Opening Checkout..." : "Buy Now"}
              </button>
            </div>

            <div className="mt-5 grid gap-2 rounded-2xl bg-stone-50 p-4 text-sm text-slate-700 sm:grid-cols-3">
              <div className="font-semibold text-[#355055]">Cash on Delivery Available</div>
              <div className="font-semibold text-[#355055]">Authenticity Reviewed</div>
              <div className="font-semibold text-[#355055]">Secure Checkout</div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-600">
              <div className="font-semibold text-slate-900">Delivery</div>
              <div className="mt-2 grid gap-1">
                <div>Dhaka City: Tk 60</div>
                <div>Dhaka Sub Area: Tk 80</div>
                <div>Outside Dhaka: Tk 120</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                <a className="font-semibold text-[#5E7F85] hover:text-[#355055]" href="/shipping-policy">Shipping Policy</a>
                <a className="font-semibold text-[#5E7F85] hover:text-[#355055]" href="/refund-policy">Return Policy</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isImageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setIsImageOpen(false)}>
          <div className="relative w-full max-w-3xl">
            <img src={activeImage} alt={`${product.name} enlarged`} className="w-full rounded-2xl bg-white object-contain" onError={(event) => { event.currentTarget.src = "/products/pdp-1.jpg"; }} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsImageOpen(false);
              }}
              className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-sm font-semibold"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {routineUpsell.length > 0 ? (
      <section className="mx-auto max-w-7xl px-4 pb-8 md:px-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Complete Your Routine</h2>
            {routineUpsell.length > 0 ? (
              <button
                onClick={handleAddRoutineBundle}
                className={`w-fit rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm transition ${
                  routineBundleAdded
                    ? "border border-[#5E7F85] bg-[#eef4f4] text-[#355055] hover:bg-[#e4efef]"
                    : "bg-[#5E7F85] text-white hover:bg-[#4f6b70]"
                }`}
              >
                {routineBundleAdded ? "View Cart" : "Add Routine Bundle"}
              </button>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {routineUpsell.map((item, index) => (
              <div
                key={item.step}
                className={`rounded-3xl border p-5 ${
                  item.selected ? "border-[#5E7F85] bg-[#f2f7f7]" : "border-slate-200 bg-stone-50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{item.step}</div>
                  {item.selected ? (
                    <span className="rounded-full bg-[#5E7F85] px-2.5 py-1 text-[10px] font-semibold text-white">Current</span>
                  ) : null}
                </div>
                <div className="mt-4 flex aspect-[4/3] items-center justify-center rounded-2xl bg-white text-sm text-slate-400 ring-1 ring-slate-200">
                  Product Image
                </div>
                <div className="mt-4 text-xs text-slate-500">{item.label}</div>
                <div className="mt-1 text-sm font-semibold leading-6 text-slate-900">{item.name}</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="font-semibold">{item.price}</div>
                  <button
                    onClick={() => handleToggleRoutine(index)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      item.selected ? "bg-[#eef4f4] text-[#355055]" : "bg-[#5E7F85] text-white"
                    }`}
                  >
                    {item.selected ? "Added" : "Add"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {liveFrequentlyBought.length > 0 ? (
      <section className="mx-auto max-w-7xl px-4 pb-8 md:px-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Frequently Bought Together</h2>

          <div className="mt-6 flex flex-wrap items-center gap-6">
            <div className="flex flex-1 flex-wrap items-center gap-5">
              {liveFrequentlyBought.map((item, idx) => (
                <React.Fragment key={item.name}>
                  <div className="relative flex min-w-[280px] flex-1 items-center gap-4 rounded-2xl bg-stone-50 p-4 md:max-w-[380px]">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-white text-xs text-slate-400 ring-1 ring-slate-200">
                      Image
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-900">{item.name}</div>
                      <div className="mt-1 text-sm font-semibold">{item.price}</div>
                    </div>
                  </div>
                  {idx < liveFrequentlyBought.length - 1 ? <div className="text-2xl font-semibold text-[#5E7F85]">+</div> : null}
                </React.Fragment>
              ))}
            </div>

            <div className="ml-auto flex flex-col items-center justify-center gap-3">
              <div className="text-lg text-slate-600">
                Total Price: <span className="font-bold text-[#5E7F85]">{formatBDT(fbTotal)}</span>
              </div>
              <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-[#5E7F85]">
                Save {formatBDT(fbSavings)} on this bundle
              </div>
              <button
                onClick={handleAddBundleToCart}
                className={`mt-1 rounded-xl px-6 py-3 text-sm font-semibold shadow-sm transition ${
                  fbBundleAdded
                    ? "border border-[#5E7F85] bg-[#eef4f4] text-[#355055] hover:bg-[#e4efef]"
                    : "bg-[#5E7F85] text-white hover:bg-[#4f6b70]"
                }`}
              >
                {fbBundleAdded ? "View Cart" : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {visibleResults.length > 0 ? (
      <section className="mx-auto max-w-7xl px-4 pb-10 md:px-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Visible Results</h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-[#5E7F85]">Verified Customer Results</span>
          </div>
          
          <div className="mt-1 text-sm font-medium text-[#5E7F85]">What you may notice with regular use</div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleResults.map((item, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-stone-50 cursor-pointer hover:shadow-md transition" onClick={() => setIsImageOpen(true)}>
                <div className="relative grid grid-cols-2">
                  <div className="flex aspect-square items-center justify-center bg-white text-xs text-slate-400 ring-1 ring-slate-200">Before</div>
                  <div className="flex aspect-square items-center justify-center bg-white text-xs text-slate-400 ring-1 ring-slate-200">After</div>

                  <div className="absolute top-2 left-2 rounded-full bg-[#5E7F85] px-2 py-0.5 text-[10px] font-semibold text-white">
                    {item.days}
                  </div>

                  <div className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[#5E7F85]">
                    {item.concern}
                  </div>
                </div>

                <div className="p-4">
                  <div className="text-sm font-semibold text-slate-900">Visible improvement in {item.concern.toLowerCase()}</div>
                  <p className="mt-1 text-xs text-slate-500">Consistent routine usage</p>
                </div>
              </div>
            ))}
          </div>

          
        </div>
      </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-5 md:gap-3 md:overflow-visible md:px-0 md:pb-0">
          {[
            { key: "description", label: "DESCRIPTION" },
            { key: "how_to_use", label: "HOW TO USE" },
            { key: "ingredients", label: "INGREDIENTS" },
            { key: "faq", label: "FAQ" },
            { key: "reviews", label: "CUSTOMER REVIEWS" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveInfoTab(tab.key)}
              className={`min-w-[132px] shrink-0 rounded-[1rem] px-3 py-3 text-center text-[12px] font-bold uppercase tracking-wide transition md:min-w-0 md:py-4 ${
                activeInfoTab === tab.key ? "bg-[#5E7F85] text-white shadow-sm" : "bg-[#dfe3e8] text-[#5f6f86] hover:bg-[#d6dbe2]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-5 px-1 md:px-2">
          {activeInfoTab === "description" ? (
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Product Details</h2>
              <div className="mt-4 grid gap-2 text-sm leading-7 text-slate-600 md:text-base text-justify">
                <p>{product.description}</p>
                <p className="hidden">
                  This cleanser is designed for users who want a balanced daily wash experience for oily or acne-prone skin. It focuses on cleansing excess oil, dirt, and buildup while helping the routine stay simple and easy to follow. It fits well into a beginner-friendly skincare routine for daily use.
                </p>
              </div>
            </div>
          ) : null}

          {activeInfoTab === "how_to_use" ? (
            <div>
              <h2 className="text-2xl font-bold tracking-tight">How to Use</h2>
              <div className="mt-4 grid gap-2 text-sm leading-7 text-slate-600 md:text-base text-justify">
                {product.howToUse ? <p>{product.howToUse}</p> : <p>No usage instructions are available for this product yet.</p>}
                <p className="hidden">
                  1. Wet your face with water. 2. Take a small amount and lather gently. 3. Massage for 20-30 seconds. 4. Rinse well and follow with serum or moisturizer.
                </p>
              </div>
            </div>
          ) : null}

          {activeInfoTab === "ingredients" ? (
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Ingredients</h2>
              <div className="mt-4 grid gap-2 text-sm leading-7 text-slate-600 md:text-base text-justify">
                {product.ingredients ? <p>{product.ingredients}</p> : <p>No ingredient list is available for this product yet.</p>}
                {product.keyIngredients.length > 0 ? (
                  <div className="mt-2">
                    <p className="font-semibold text-slate-800">Key Ingredients</p>
                    <ul className="mt-1 grid gap-1">
                      {product.keyIngredients.map((ingredient) => (
                        <li key={ingredient}>{ingredient}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {product.warnings ? (
                  <p className="mt-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                    {product.warnings}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {activeInfoTab === "faq" ? (
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Frequently Asked Questions</h2>
              <div className="mt-4 space-y-4 text-sm text-slate-600 md:text-base">
                {product.faq.length ? product.faq.map((faq) => (
                  <details key={faq.question} className="rounded-2xl bg-stone-50 p-4">
                    <summary className="cursor-pointer font-semibold text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E7F85]">{faq.question}</summary>
                    <p className="mt-2">{faq.answer}</p>
                  </details>
                )) : (
                  <div className="rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-slate-600">No FAQs are available for this product yet.</div>
                )}
              </div>
            </div>
          ) : null}

          {activeInfoTab === "reviews" ? (
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Customer Reviews</h2>
              <div className="mt-4 space-y-4">
                {productReviews.map((review) => (
                  <div key={review.id} className="rounded-2xl bg-stone-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{review.customer_name}</div>
                      <div className="text-sm text-slate-500">Star {review.rating}/5</div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {review.review_text}
                    </p>
                    {review.result_image_url || review.image_url ? (
                      <div className="mt-3 overflow-hidden rounded-2xl bg-white">
                        <img alt={`${review.customer_name} review`} className="max-h-64 w-full object-cover" src={review.result_image_url || review.image_url || ""} onError={(event) => { event.currentTarget.style.display = "none"; }} />
                      </div>
                    ) : null}
                  </div>
                ))}
                {!productReviews.length ? (
                  <div className="rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-slate-600">
                    No approved reviews are available for this product yet.
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {relatedProducts.length > 0 ? (
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Related Products</h2>
            <p className="mt-1 text-sm text-slate-500">More active products from the same category or brand.</p>
          </div>
          <a className="hidden text-sm font-semibold text-[#5E7F85] hover:text-[#355055] sm:inline" href="/products">View all</a>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {relatedProducts.map((relatedProduct) => (
            <StorefrontProductCard key={String(relatedProduct.id || relatedProduct.slug || relatedProduct.product_name)} product={relatedProduct} />
          ))}
        </div>
      </section>
      ) : null}

      {!isPurchaseBoxVisible ? (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pb-3 pt-3 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur md:hidden" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
          <div className="min-w-0">
            <div className="truncate text-base font-bold text-slate-900">{displayPrice}</div>
            <div className={`mt-0.5 truncate text-xs font-semibold ${isOutOfStock ? "text-rose-600" : "text-emerald-700"}`}>
              {activeAvailabilityLabel}
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || needsVariantSelection}
            aria-label={needsVariantSelection ? "Select a variant before adding to cart" : "Add selected product to cart"}
            className={`min-h-11 rounded-xl px-3 py-2 text-xs font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#5E7F85] focus:ring-offset-2 ${
              isOutOfStock || needsVariantSelection
                ? "cursor-not-allowed bg-slate-200 text-slate-500"
                : mainAddedToCart
                  ? "border border-[#5E7F85] bg-[#eef4f4] text-[#355055]"
                  : "bg-[#5E7F85] text-white active:scale-[0.98]"
            }`}
          >
            {needsVariantSelection ? "Select" : isOutOfStock ? "Unavailable" : mainAddedToCart ? "Cart" : "Add"}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock || needsVariantSelection || isBuyNowLoading}
            aria-label={needsVariantSelection ? "Select a variant before buying now" : "Buy selected product now"}
            className={`min-h-11 rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#5E7F85] focus:ring-offset-2 ${
              isOutOfStock || needsVariantSelection || isBuyNowLoading
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
                : "border-[#5E7F85] bg-white text-[#355055] active:scale-[0.98]"
            }`}
          >
            {isBuyNowLoading ? "Wait" : "Buy Now"}
          </button>
        </div>
      </div>
      ) : null}
    </div>
  );
}
