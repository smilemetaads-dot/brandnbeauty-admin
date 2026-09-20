"use client";

/* eslint-disable @next/next/no-html-link-for-pages, react-hooks/immutability, react-hooks/set-state-in-effect */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { addToCart as addLocalCartItem } from "@/lib/cart";
import { trackAddToCart } from "@/lib/analytics";
import { bnbApiAssetUrl, bnbApiUrl } from "@/lib/bnb-api";

const PREVIEW_PAGE = "products" as PLPMode;
const PRESET_CATEGORY = "Skincare" as const;
const PRESET_CONCERN = "Acne" as const;
const STORE_PRODUCTS_ENDPOINT = bnbApiUrl("get_store_products.php");

const PRODUCT_REVEAL_SIZE = 30;
const STORE_CATEGORIES_ENDPOINT = bnbApiUrl("get_categories.php");

const STORE_CONCERNS_ENDPOINT = bnbApiUrl("get_concerns.php");


type PLPMode = "products" | "category" | "concern";

type Product = {
  id?: string;
  slug?: string;
  sku?: string;
  name: string;
  brand: string;
  category: string;
  concerns: string[];
  subcategory: string;
  freeDelivery: boolean;
  bestSeller: boolean;
  price: string;
  oldPrice: string;
  badge: string;
  rating: number;
  image?: string;
  shortDescription?: string | null;
  featured?: boolean;
  inventoryMode?: "stocked" | "on_demand";
  availabilityStatus?: "available" | "unavailable";
  minimumOrderQuantity?: number;
  stockQuantity?: number;
  availabilityLabel?: string;
  isOrderable?: boolean;
};

type BackendCatalogProduct = {
  id: number | string;
  product_name: string;
  sku?: string | null;
  slug?: string | null;
  price: number | string;
  old_price?: number | string | null;
  compare_price?: number | string | null;
  stock_quantity?: number | string;
  inventory_mode?: string | null;
  availability_status?: string | null;
  minimum_order_quantity?: number | string | null;
  availability_label?: string | null;
  is_orderable?: boolean | number | null;
  available?: boolean | number | null;
  image_url: string | null;
  short_description?: string | null;
  description?: string | null;
  brand_name?: string | null;
  category_name?: string | null;
  concern_name?: string | null;
  status?: string | null;
  featured?: boolean | number | null;
  created_at?: string | null;
};

type CatalogMetaItem = {
  id: number | string;
  name: string;
  slug?: string | null;
};

const AVAILABLE_CATEGORIES = [
  "Skincare",
  "Hair Care",
  "Body Care",
  "Makeup",
  "Tools & Brushes",
  "Fragrance",
  "Men's Grooming",
  "Mom & Baby",
  "Offers",
  "Combo Deals",
] as const;

const AVAILABLE_CONCERNS = [
  "Acne",
  "Dark Spots",
  "Brightening",
  "Oily Skin",
  "Dry Skin",
  "Sensitive Skin",
  "Hairfall",
  "Dull Skin",
] as const;

const AVAILABLE_SUBCATEGORIES = [
  "All",
  "Cleanser",
  "Serum",
  "Moisturizer",
  "Sunscreen",
  "Masks",
] as const;

const AVAILABLE_BRANDS = [
  "BrandnBeauty",
  "Some By Mi",
  "Beauty of Joseon",
  "Simple",
  "COSRX",
  "The Ordinary",
  "CeraVe",
  "L'Oreal",
  "Laneige",
] as const;

const CATEGORY_BANNER_MAP: Record<string, string> = {
  Skincare: "/banners/category-skincare.jpg",
  "Hair Care": "/banners/category-hair-care.jpg",
  "Body Care": "/banners/category-body-care.jpg",
  Makeup: "/banners/category-makeup.jpg",
  "Tools & Brushes": "/banners/category-tools-brushes.jpg",
  Fragrance: "/banners/category-fragrance.jpg",
  "Men's Grooming": "/banners/category-mens-grooming.jpg",
  "Mom & Baby": "/banners/category-mom-baby.jpg",
  Offers: "/banners/category-offers.jpg",
  "Combo Deals": "/banners/category-combo-deals.jpg",
};

const PRODUCTS: Product[] = [];
void PRODUCTS;

function getNumericPrice(price: string): number {
  return Number(String(price).replace(/[^0-9]/g, "")) / 100;
}

function formatTaka(value: number): string { return `Tk ${value.toFixed(2)}`; }

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fromSlug<T extends string>(slug: string | null, options: readonly T[], fallback: T): T {
  if (!slug) return fallback;
  const match = options.find((item) => toSlug(item) === slug);
  return match || fallback;
}

function parseBrandList(value: string | null, options: readonly string[]): string[] {
  if (!value) return [];
  const slugs = value.split(",").map((item) => item.trim()).filter(Boolean);
  return options.filter((brand) => slugs.includes(toSlug(brand)));
}

function normalizeBackendImageUrl(imageUrl: string | null): string {
  if (!imageUrl) return "/products/pdp-1.jpg";
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

  return bnbApiAssetUrl(imageUrl, "/products/pdp-1.jpg") || "/products/pdp-1.jpg";
}

function mapLiveProduct(
  product?: BackendCatalogProduct | null,
  categoryLabel = "Skincare",
  concernLabel = "Acne"
): Product {
  const brand = product?.brand_name || "BrandnBeauty";
  const category = product?.category_name || categoryLabel;
  const price = Number(product?.price) || 0;
  const oldPrice = Number(product?.old_price ?? product?.compare_price) || 0;
  const concerns = [product?.concern_name || concernLabel].filter(Boolean);
  const productId = product?.id ?? `product-${Date.now()}`;
  const productName = product?.product_name || "BrandnBeauty Product";
  const inventoryMode = product?.inventory_mode === "on_demand" ? "on_demand" : "stocked";
  const explicitlyUnavailable = product?.availability_status === "unavailable" || product?.available === false || (product?.available != null && Number(product.available) === 0);
  const availabilityStatus = explicitlyUnavailable ? "unavailable" : "available";
  const stockQuantity = Number(product?.stock_quantity) || 0;
  const explicitlyOrderable = product?.is_orderable === true || (product?.is_orderable != null && Number(product.is_orderable) === 1) || product?.available === true || (product?.available != null && Number(product.available) === 1);
  const isOrderable = explicitlyOrderable || (availabilityStatus === "available" && (inventoryMode === "on_demand" || stockQuantity > 0));

  return {
    id: String(productId),
    slug: String(product?.slug || productId),
    sku: product?.sku ? String(product.sku) : undefined,
    name: productName,
    brand,
    category,
    concerns,
    subcategory: "Serum",
    freeDelivery: false,
    bestSeller: false,
    price: formatTaka(price),
    oldPrice: oldPrice > 0 ? formatTaka(oldPrice) : "",
    badge: "LIVE",
    rating: 4,
    image: normalizeBackendImageUrl(product?.image_url ?? null),
    shortDescription: product?.short_description ?? product?.description ?? null,
    featured: product?.featured === true || Number(product?.featured) === 1,
    inventoryMode,
    availabilityStatus,
    minimumOrderQuantity: Math.max(1, Math.floor(Number(product?.minimum_order_quantity) || 1)),
    stockQuantity,
    availabilityLabel: product?.availability_label || (isOrderable ? inventoryMode === "on_demand" ? "Available on Order" : "In Stock" : "Currently Unavailable"),
    isOrderable,
  };
}

async function fetchLiveProducts(params: {
  categoryId?: string | null;
  concernId?: string | null;
  categoryLabel?: string | null;
  concernLabel?: string | null;
} = {}): Promise<Product[]> {
  const query = new URLSearchParams();
  query.set("limit", "1000");
  if (params.categoryId) query.set("category_id", params.categoryId);
  if (params.concernId) query.set("concern_id", params.concernId);
  const endpoint = query.toString() ? `${STORE_PRODUCTS_ENDPOINT}?${query.toString()}` : STORE_PRODUCTS_ENDPOINT;
  const response = await fetch(endpoint, {
    cache: "no-store",
  });
  const payload = (await response.json()) as {
    products?: BackendCatalogProduct[];
    success?: boolean;
  };
  const data = payload.products;

  if (!response.ok || !payload.success || !Array.isArray(data)) {
    throw new Error("Products could not be loaded.");
  }

  return data.map((product) =>
    mapLiveProduct(
      product,
      params.categoryLabel || "Skincare",
      params.concernLabel || "Acne"
    )
  );
}

async function fetchCatalogMeta(endpoint: string): Promise<Record<string, string>> {
  const response = await fetch(endpoint, { cache: "no-store" });
  const payload = (await response.json()) as CatalogMetaItem[];

  if (!response.ok || !Array.isArray(payload)) {
    return {};
  }

  return payload.reduce<Record<string, string>>((lookup, item) => {
    const id = String(item.id || "");
    if (!id) return lookup;
    lookup[toSlug(item.slug || item.name)] = id;
    lookup[toSlug(item.name)] = id;
    return lookup;
  }, {});
}

function buildFilterURL(params: {
  mode: PLPMode;
  category: string | null;
  concern: string | null;
  subcategory: string;
  brands: string[];
  price: number | null;
  freeDelivery: boolean;
  bestSeller: boolean;
  maxAvailablePrice: number;
  search: string;
}): string {
  const searchParams = new URLSearchParams();

  if (params.mode === "products") {
    if (params.category) searchParams.set("category", toSlug(params.category));
    if (params.concern) searchParams.set("concern", toSlug(params.concern));
  }
  if (params.mode === "category" && params.category) {
    searchParams.set("category", toSlug(params.category));
  }
  if (params.mode === "concern" && params.concern) {
    searchParams.set("concern", toSlug(params.concern));
  }
  if (params.subcategory !== "All") {
    searchParams.set("subcategory", toSlug(params.subcategory));
  }
  if (params.brands.length > 0) {
    searchParams.set("brands", params.brands.map((brand) => toSlug(brand)).join(","));
  }
  if (params.price !== null && params.price !== params.maxAvailablePrice) {
    searchParams.set("price", String(params.price));
  }
  if (params.search.trim()) {
    searchParams.set("search", params.search.trim());
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function runTests() {
  if (getNumericPrice("Tk 1,250.00") !== 1250) throw new Error("Price parsing failed");
  if (toSlug("Hair Care") !== "hair-care") throw new Error("Slug failed");
  if (fromSlug("serum", AVAILABLE_SUBCATEGORIES, "All") !== "Serum") throw new Error("fromSlug failed");

  const parsedBrands = parseBrandList("brandnbeauty,simple", AVAILABLE_BRANDS);
  if (parsedBrands.length !== 2) throw new Error("Brand parsing failed");

  const url = buildFilterURL({
    mode: "products",
    category: "Skincare",
    concern: "Acne",
    subcategory: "Serum",
    brands: ["BrandnBeauty", "Simple"],
    price: 1200,
    freeDelivery: true,
    bestSeller: true,
    maxAvailablePrice: 1500,
    search: "cosrx",
  });

  if (!url.includes("search=cosrx")) throw new Error("URL search failed");
  if (!url.includes("category=skincare")) throw new Error("URL category failed");
  if (!url.includes("concern=acne")) throw new Error("URL concern failed");
  if (!url.includes("subcategory=serum")) throw new Error("URL subcategory failed");
  if (!url.includes("brands=brandnbeauty%2Csimple")) throw new Error("URL brands failed");
  if (!url.includes("price=1200")) throw new Error("URL price failed");
}

runTests();

export default function BrandnBeautyWebsite() {
  if (PREVIEW_PAGE === "category") {
    return <MasterPLPPreview mode="category" presetCategory={PRESET_CATEGORY} />;
  }
  if (PREVIEW_PAGE === "concern") {
    return <MasterPLPPreview mode="concern" presetConcern={PRESET_CONCERN} />;
  }
  return <MasterPLPPreview mode="products" />;
}

function ProductCard({ product }: { product?: Product | null }) {
  const productName = product?.name || "BrandnBeauty Product";
  const productBrand = product?.brand || "BrandnBeauty";
  const numericPrice = getNumericPrice(product?.price || "");
  const numericOldPrice = getNumericPrice(product?.oldPrice || "");
  const productSlug = product?.slug || toSlug(productName) || "test-product";
  const productImage = product?.image || "/products/pdp-1.jpg";
  const isOrderable = product?.isOrderable !== false;
  const availabilityLabel = product?.availabilityLabel || (isOrderable ? "In Stock" : "Currently Unavailable");
  const discount = numericOldPrice > numericPrice
    ? Math.round(((numericOldPrice - numericPrice) / numericOldPrice) * 100)
    : 0;

  return (
    <div onClick={() => { window.location.href = `/products/${productSlug}`; }} className="flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative flex flex-1 flex-col">
        <div className="group relative aspect-[1/0.88] overflow-hidden bg-[#f1f1f1]">
          {discount > 0 ? (
            <div className="absolute left-0 top-0 z-10 rounded-br-2xl rounded-tl-[1.8rem] bg-[#6f8f95] px-3 py-2 text-[0.95rem] font-bold leading-none text-white shadow-sm">
              {discount}% OFF
            </div>
          ) : null}

          {product?.image ? (
            <img
              src={productImage}
              alt={productName}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[1.1rem] text-white/80 transition duration-300 group-hover:scale-105">
              Image
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col border-t border-slate-100 px-5 pb-5 pt-4">
          <div className="min-h-[4.4rem] text-[1.02rem] leading-8 text-[#4d6587]">
            {productName}
          </div>

          <div className="mt-3 min-h-[2.9rem]">
            {product?.badge ? (
              <div className="inline-flex rounded-full bg-[#6f8f95] px-4 py-2 text-[0.88rem] font-semibold uppercase leading-none tracking-wide text-white">
                SALE
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-[1.05rem]">
            {numericOldPrice > numericPrice ? (
              <span className="text-slate-400 line-through">{formatTaka(numericOldPrice)}</span>
            ) : <span />}
            <span className="font-semibold text-[#6f8f95]">{formatTaka(numericPrice)}</span>
          </div>
          <div className={`mt-3 text-center text-sm font-semibold ${isOrderable ? "text-emerald-700" : "text-rose-600"}`}>
            {availabilityLabel}
          </div>
          {isOrderable && product?.inventoryMode === "on_demand" ? <div className="mt-1 text-center text-xs font-semibold text-slate-500">Sourcing time may vary</div> : null}
        </div>
      </div>

      <button onClick={(event) => {
        event.stopPropagation();
        if (!isOrderable) return;
        addLocalCartItem({
          id: product?.id || productSlug,
          slug: productSlug,
          name: productName,
          brand: productBrand,
          image: productImage,
          price: numericPrice,
          compareAtPrice: numericOldPrice > numericPrice ? numericOldPrice : undefined,
          quantity: product?.minimumOrderQuantity || 1,
          inventoryMode: product?.inventoryMode || "stocked",
          availabilityStatus: product?.availabilityStatus || "available",
          minimumOrderQuantity: product?.minimumOrderQuantity || 1,
          stockQuantity: product?.inventoryMode === "stocked" ? product?.stockQuantity : undefined,
          requiresSourcing: product?.inventoryMode === "on_demand",
        });
        trackAddToCart({
          content_ids: [product?.id || productSlug],
          content_name: productName,
          value: numericPrice,
          quantity: 1,
          page_path: window.location.pathname,
        });
        window.localStorage.setItem("bnb_preview_cart", "1");
        window.location.href = "/cart";
      }} disabled={!isOrderable} className={`w-full px-5 py-4 text-[1.12rem] font-semibold text-white transition duration-200 active:scale-[0.99] ${isOrderable ? "bg-[#6f8f95] hover:bg-[#5E7F85]" : "cursor-not-allowed bg-slate-300"}`}>
        {isOrderable ? "Add to Cart" : "Currently Unavailable"}
      </button>
    </div>
  );
}

function MasterPLPPreview({
  mode,
  presetCategory,
  presetConcern,
}: {
  mode: PLPMode;
  presetCategory?: string;
  presetConcern?: string;
}) {
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogMessage, setCatalogMessage] = useState("");
  const [categoryIdBySlug, setCategoryIdBySlug] = useState<Record<string, string>>({});
  const [concernIdBySlug, setConcernIdBySlug] = useState<Record<string, string>>({});
  const hasHydratedURLFilters = useRef(false);
  const lastSyncedFilterPath = useRef("");
  const products = catalogProducts;
  const availableBrands = useMemo(
    () => Array.from(new Set([
      ...AVAILABLE_BRANDS,
      ...products.map((product) => product.brand).filter(Boolean),
    ])),
    [products]
  );
  const productPrices = useMemo(() => products.map((product) => getNumericPrice(product.price)), [products]);
  const minAvailablePrice = useMemo(
    () => (productPrices.length > 0 ? Math.floor(Math.min(...productPrices)) : 0),
    [productPrices]
  );
  const maxAvailablePrice = useMemo(
    () => (productPrices.length > 0 ? Math.ceil(Math.max(...productPrices)) : 0),
    [productPrices]
  );
  const hasLoadedCatalog = !isCatalogLoading;
  const defaultCategory = mode === "category" ? presetCategory || "Skincare" : "All";
  const defaultConcern = mode === "concern" ? presetConcern || "Acne" : "All";
  const [currentCategory, setCurrentCategory] = useState<string>(defaultCategory);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    defaultCategory !== "All" ? defaultCategory : null
  );
  const [currentConcern, setCurrentConcern] = useState<string>(defaultConcern);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("All");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedFreeDelivery, setSelectedFreeDelivery] = useState(false);
  const [selectedBestSeller, setSelectedBestSeller] = useState(false);
  const [selectedSort, setSelectedSort] = useState("Featured");
  const [visibleCount, setVisibleCount] = useState(PRODUCT_REVEAL_SIZE);
  const [maxPrice, setMaxPrice] = useState(0);
  const [brandSearch, setBrandSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadFilterMeta() {
      const [categories, concerns] = await Promise.all([
        fetchCatalogMeta(STORE_CATEGORIES_ENDPOINT),
        fetchCatalogMeta(STORE_CONCERNS_ENDPOINT),
      ]);

      if (!isMounted) return;
      setCategoryIdBySlug(categories);
      setConcernIdBySlug(concerns);
    }

    loadFilterMeta().catch(() => {
      if (!isMounted) return;
      setCategoryIdBySlug({});
      setConcernIdBySlug({});
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsCatalogLoading(true);

      try {
        const activeCategory = currentCategory !== "All" ? currentCategory : null;
        const activeConcern = currentConcern !== "All" ? currentConcern : null;
        const liveProducts = await fetchLiveProducts({
          categoryId: activeCategory ? categoryIdBySlug[toSlug(activeCategory)] || null : null,
          concernId: activeConcern ? concernIdBySlug[toSlug(activeConcern)] || null : null,
          categoryLabel: activeCategory,
          concernLabel: activeConcern,
        });
        if (!isMounted) return;

        setCatalogProducts(liveProducts);
        setCatalogMessage(liveProducts.length === 0 ? "No published products found for this storefront view." : "");
      } catch {
        if (!isMounted) return;

        setCatalogProducts([]);
        setCatalogMessage("Products are being updated. Please check back soon.");
      } finally {
        if (isMounted) {
          setIsCatalogLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [currentCategory, currentConcern, categoryIdBySlug, concernIdBySlug]);

  void (
    <div className="min-h-screen bg-[#f7f7f7] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between px-6 py-5">
          <a href="/" className="text-2xl font-bold tracking-tight">BrandnBeauty</a>
          <button onClick={() => { window.location.href = "/cart"; }} className="rounded-full bg-[#5E7F85] px-5 py-2.5 text-sm font-semibold text-white shadow-sm">Bag 0</button>
        </div>
      </header>

      <section className="mx-auto max-w-[1480px] px-6 py-8">
        {isCatalogLoading ? (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-[#5E7F85] shadow-sm">
            Loading live catalog...
          </div>
        ) : null}

        {catalogMessage ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800 shadow-sm">
            {catalogMessage}
          </div>
        ) : null}

        {products.length === 0 && !isCatalogLoading ? (
          <div className="py-20 text-center text-slate-500">No products are available right now.</div>
        ) : (
          <div className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <ProductCard key={`${product?.id || product?.name || "product"}-${index}`} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );

  useEffect(() => {
    if (maxAvailablePrice > 0) {
      setMaxPrice((current) => Math.min(Math.max(current, minAvailablePrice), maxAvailablePrice));
    }
  }, [minAvailablePrice, maxAvailablePrice]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasLoadedCatalog) return;
    if (maxAvailablePrice <= 0) return;
    if (hasHydratedURLFilters.current) return;

    const applyURLFilters = () => {
      const params = new URLSearchParams(window.location.search);
      const defaultCategory = mode === "category" ? presetCategory || "Skincare" : "All";
      const defaultConcern = mode === "concern" ? presetConcern || "Acne" : "All";
      const resolvedCategory = fromSlug(params.get("category"), ["All", ...AVAILABLE_CATEGORIES], defaultCategory as (typeof AVAILABLE_CATEGORIES)[number] | "All");
      const resolvedConcern = fromSlug(params.get("concern"), ["All", ...AVAILABLE_CONCERNS], defaultConcern as (typeof AVAILABLE_CONCERNS)[number] | "All");
      const resolvedSubcategory = fromSlug(params.get("subcategory"), AVAILABLE_SUBCATEGORIES, "All");
      const resolvedBrands = parseBrandList(params.get("brands"), AVAILABLE_BRANDS);
      const resolvedPrice = params.get("price") ? Number(params.get("price")) : maxAvailablePrice;
      const resolvedSearch = (params.get("search") || "").trim();

      setCurrentCategory(resolvedCategory);
      setExpandedCategory(resolvedCategory !== "All" ? resolvedCategory : null);
      setCurrentConcern(resolvedConcern);
      setSelectedSubcategory(resolvedSubcategory);
      setSelectedBrands(resolvedBrands);
      setSearchTerm(resolvedSearch);
      setSelectedFreeDelivery(false);
      setSelectedBestSeller(false);
      setMaxPrice(
        Number.isFinite(resolvedPrice)
          ? Math.min(Math.max(resolvedPrice, minAvailablePrice), maxAvailablePrice)
          : maxAvailablePrice
      );
    };

    applyURLFilters();
    hasHydratedURLFilters.current = true;
    window.addEventListener("popstate", applyURLFilters);
    return () => window.removeEventListener("popstate", applyURLFilters);
  }, [hasLoadedCatalog, mode, presetCategory, presetConcern, minAvailablePrice, maxAvailablePrice]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasLoadedCatalog) return;
    if (!hasHydratedURLFilters.current) return;
    if (maxAvailablePrice <= 0 || maxPrice <= 0) return;

    const nextURL = buildFilterURL({
      mode,
      category: currentCategory !== "All" ? currentCategory : null,
      concern: currentConcern !== "All" ? currentConcern : null,
      subcategory: selectedSubcategory,
      brands: selectedBrands,
      price: maxPrice,
      freeDelivery: selectedFreeDelivery,
      bestSeller: selectedBestSeller,
      maxAvailablePrice,
      search: searchTerm,
    });

    const nextPath = `${window.location.pathname}${nextURL}`;
    const currentPath = `${window.location.pathname}${window.location.search}`;
    if (currentPath !== nextPath && lastSyncedFilterPath.current !== nextPath) {
      lastSyncedFilterPath.current = nextPath;
      window.history.replaceState({}, "", nextPath);
    }
  }, [hasLoadedCatalog, mode, currentCategory, currentConcern, selectedSubcategory, selectedBrands, maxPrice, selectedFreeDelivery, selectedBestSeller, maxAvailablePrice, searchTerm]);

  const visibleBrands = useMemo(() => {
    const filtered = availableBrands.filter((brand) =>
      brand.toLowerCase().includes(brandSearch.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      const aSelected = selectedBrands.includes(a) ? 1 : 0;
      const bSelected = selectedBrands.includes(b) ? 1 : 0;
      return bSelected - aSelected;
    });
  }, [availableBrands, brandSearch, selectedBrands]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return (products || []).filter((product) => {
      const numericPrice = getNumericPrice(product?.price || "");
      const matchesCategory = currentCategory === "All" || product?.category === currentCategory;
      const matchesConcern = currentConcern === "All" || (product?.concerns || []).includes(currentConcern);
      const matchesSubcategory = selectedSubcategory === "All" || product?.subcategory === selectedSubcategory;
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product?.brand || "");
      const searchHaystack = [product?.name, product?.brand, product?.sku, product?.slug, product?.id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !normalizedSearch || searchHaystack.includes(normalizedSearch);
      const matchesPrice = numericPrice >= minAvailablePrice && numericPrice <= maxPrice;
      const matchesFreeDelivery = !selectedFreeDelivery || Boolean(product?.freeDelivery);
      const matchesBestSeller = !selectedBestSeller || Boolean(product?.bestSeller);

      return matchesCategory && matchesConcern && matchesSubcategory && matchesBrand && matchesSearch && matchesPrice && matchesFreeDelivery && matchesBestSeller;
    });
  }, [products, currentCategory, currentConcern, selectedSubcategory, selectedBrands, searchTerm, maxPrice, selectedFreeDelivery, selectedBestSeller, minAvailablePrice]);


  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];

    if (selectedSort === "Price: Low to High") {
      sorted.sort((a, b) => getNumericPrice(a.price) - getNumericPrice(b.price));
    } else if (selectedSort === "Price: High to Low") {
      sorted.sort((a, b) => getNumericPrice(b.price) - getNumericPrice(a.price));
    } else if (selectedSort === "Newest") {
      sorted.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    } else {
      sorted.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    }

    return sorted;
  }, [filteredProducts, selectedSort]);

  useEffect(() => {
    setVisibleCount(PRODUCT_REVEAL_SIZE);
  }, [currentCategory, currentConcern, selectedSubcategory, selectedBrands, searchTerm, maxPrice, selectedSort]);

  const visibleProducts = sortedProducts.slice(0, visibleCount);
  const canLoadMore = visibleCount < sortedProducts.length;

  const handleLoadMore = () => {
    setVisibleCount((count) => Math.min(count + PRODUCT_REVEAL_SIZE, sortedProducts.length));
  };
  const currentBanner = mode === "category" && currentCategory !== "All"
    ? CATEGORY_BANNER_MAP[currentCategory] || "/banners/category-default.jpg"
    : "/banners/category-default.jpg";

  const showClear =
    selectedSubcategory !== "All" ||
    selectedBrands.length > 0 ||
    selectedFreeDelivery ||
    selectedBestSeller ||
    searchTerm.trim() !== "" ||
    maxPrice !== maxAvailablePrice ||
    (mode === "products" && (currentCategory !== "All" || currentConcern !== "All"));

  const activeFilters: string[] = [];

  if (currentCategory !== "All") activeFilters.push(currentCategory);
  if (currentConcern !== "All") activeFilters.push(currentConcern);
  if (selectedSubcategory !== "All") activeFilters.push(selectedSubcategory);
  if (selectedBrands.length > 0) activeFilters.push(...selectedBrands);
  if (searchTerm.trim()) activeFilters.push(`Search: ${searchTerm.trim()}`);
  if (maxPrice !== maxAvailablePrice) activeFilters.push(`Up to ${formatTaka(maxPrice)}`);

  const removeActiveFilter = (filter: string) => {
    if (filter === currentCategory) {
      setCurrentCategory("All");
      if (expandedCategory === currentCategory) setExpandedCategory(null);
      return;
    }
    if (filter === currentConcern) {
      setCurrentConcern("All");
      return;
    }
    if (filter === selectedSubcategory) {
      setSelectedSubcategory("All");
      return;
    }
    if (selectedBrands.includes(filter)) {
      setSelectedBrands((prev) => prev.filter((brand) => brand !== filter));
      return;
    }
    if (filter.startsWith("Search: ")) {
      setSearchTerm("");
      return;
    }
    if (filter === `Up to ${formatTaka(maxPrice)}`) {
      setMaxPrice(maxAvailablePrice);
    }
  };

  const clearAllFilters = () => {
    setSelectedSubcategory("All");
    setSelectedBrands([]);
    setSelectedFreeDelivery(false);
    setSelectedBestSeller(false);
    setSearchTerm("");
    setMaxPrice(maxAvailablePrice);
    setBrandSearch("");
    if (mode === "products") {
      setCurrentCategory("All");
      setExpandedCategory(null);
      setCurrentConcern("All");
    }
  };

  const categoryCount = (category: string) => (products || []).filter((p) => p?.category === category).length;

  const subcategoriesForCategory = (category: string) => {
    const set = new Set(
      (products || []).filter((p) => p?.category === category).map((p) => p?.subcategory)
    );
    return [...AVAILABLE_SUBCATEGORIES].filter((item) => item !== "All" && set.has(item));
  };

  const subcategoryCount = (category: string, subcategory: string) =>
    (products || []).filter((p) => p?.category === category && p?.subcategory === subcategory).length;

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between px-6 py-5">
          <a href="/" className="text-2xl font-bold tracking-tight">BrandnBeauty</a>
          <button onClick={() => { window.location.href = "/cart"; }} className="rounded-full bg-[#5E7F85] px-5 py-2.5 text-sm font-semibold text-white shadow-sm">Bag 0</button>
        </div>
      </header>

      <section className="mx-auto max-w-[1480px] px-6 py-8">
        {mode === "category" ? (
          <a href="/products" className="mb-6 block overflow-hidden rounded-2xl">
            <img src={currentBanner} alt={`${currentCategory} Banner`} className="h-[140px] w-full object-cover transition duration-300 hover:scale-[1.01]" />
          </a>
        ) : null}

        <div className="mb-4 flex items-center justify-between gap-3 xl:hidden">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            aria-expanded={mobileFilterOpen}
            className="min-h-11 rounded-xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white shadow-sm"
          >
            Filters{activeFilters.length ? ` (${activeFilters.length})` : ""}
          </button>
          <span className="text-sm font-semibold text-slate-500">{filteredProducts.length} products{searchTerm.trim() ? ` for "${searchTerm.trim()}"` : ""}</span>
        </div>

        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          {mobileFilterOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-40 hidden cursor-default bg-black/40 max-xl:block"
              aria-label="Close filters"
              onClick={() => setMobileFilterOpen(false)}
            />
          ) : null}

          <aside className={`${mobileFilterOpen ? "fixed left-0 top-0 z-50 block h-full w-[88%] max-w-[380px] overflow-y-auto rounded-none border-r border-slate-200 bg-white p-6 pb-24 shadow-2xl" : "hidden"} xl:sticky xl:top-6 xl:block xl:h-fit xl:overflow-visible xl:rounded-[2rem] xl:border xl:border-slate-200 xl:bg-white xl:p-6 xl:shadow-sm`}>
            <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4 xl:hidden">
              <div className="text-lg font-bold text-slate-900">Filters</div>
              <button type="button" onClick={() => setMobileFilterOpen(false)} className="min-h-10 rounded-full px-3 text-xl font-semibold text-slate-600">
                &times;
              </button>
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-[2rem] font-bold leading-none">Filters</h2>
              {showClear ? (
                <button onClick={clearAllFilters} className="text-lg text-slate-500 hover:text-[#5E7F85]">
                  Clear
                </button>
              ) : null}
            </div>

            <div className="mt-8 border-t border-slate-200 pt-8">
              <h3 className="text-[1.35rem] font-semibold">Price</h3>
              <div className="mt-5">
                <input type="range" min={minAvailablePrice} max={maxAvailablePrice} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[#5E7F85]" />
                <div className="mt-3 flex items-center justify-between text-[1rem] text-[#23395b]">
                  <span>{formatTaka(minAvailablePrice)}</span>
                  <span>{formatTaka(maxPrice)}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-8">
              <h3 className="text-[1.35rem] font-semibold">Product Categories</h3>

              <div className="mt-5 space-y-2 text-[1.08rem] text-[#23395b]">
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      if (expandedCategory === "Shop By Concern") {
                        setExpandedCategory(null);
                        setCurrentConcern("All");
                      } else {
                        setExpandedCategory("Shop By Concern");
                        setCurrentCategory("All");
                      }
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition ${expandedCategory === "Shop By Concern" ? "bg-[#eef4f4]" : "hover:bg-[#eef4f4] hover:text-[#5E7F85]"}`}
                  >
                    <span className={`leading-6 ${expandedCategory === "Shop By Concern" ? "font-semibold text-[#5E7F85]" : "text-[#556b8e]"}`}>Shop By Concern</span>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-[0.92rem] ${expandedCategory === "Shop By Concern" ? "bg-[#5E7F85] text-white" : "bg-[#f2f2f2] text-[#6e81a3]"}`}>{AVAILABLE_CONCERNS.length}</span>
                  </button>

                  {expandedCategory === "Shop By Concern" ? (
                    <div className="ml-4 mt-1 space-y-1">
                      {AVAILABLE_CONCERNS.map((concern) => {
                        const isActive = currentConcern === concern;
                        return (
                          <button
                            key={concern}
                            type="button"
                            onClick={() => {
                              setCurrentConcern(isActive ? "All" : concern);
                            }}
                            className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition ${isActive ? "bg-[#eef4f4]" : "hover:bg-[#eef4f4] hover:text-[#5E7F85]"}`}
                          >
                            <span className={`leading-6 ${isActive ? "font-semibold text-[#5E7F85]" : "text-[#556b8e]"}`}>{concern}</span>
                            <span className={`shrink-0 rounded-full px-3 py-1 text-[0.92rem] ${isActive ? "bg-[#5E7F85] text-white" : "bg-[#f2f2f2] text-[#6e81a3]"}`}>
                              {products.filter((p) => (p?.concerns || []).includes(concern)).length}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                {AVAILABLE_CATEGORIES.map((item) => {
                  const isActive = currentCategory === item;
                  const isExpanded = expandedCategory === item;
                  const categorySubcategories = subcategoriesForCategory(item);

                  return (
                    <div key={item}>
                      <button
                        type="button"
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedCategory(null);
                            setCurrentCategory("All");
                            setSelectedSubcategory("All");
                            setCurrentConcern("All");
                          } else {
                            setExpandedCategory(item);
                            setCurrentCategory(item);
                            setSelectedSubcategory("All");
                            setCurrentConcern("All");
                          }
                        }}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition ${isActive ? "bg-[#eef4f4]" : "hover:bg-[#eef4f4] hover:text-[#5E7F85]"}`}
                      >
                        <span className={`leading-6 ${isActive ? "font-semibold text-[#5E7F85]" : "text-[#556b8e]"}`}>{item}</span>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-[0.92rem] ${isActive ? "bg-[#5E7F85] text-white" : "bg-[#f2f2f2] text-[#6e81a3]"}`}>{categoryCount(item)}</span>
                      </button>

                      {isExpanded ? (
                        <div className="ml-4 mt-1 space-y-1">
                          {categorySubcategories.map((subcategory) => {
                            const isSubActive = selectedSubcategory === subcategory;
                            return (
                              <button
                                key={`${item}-${subcategory}`}
                                type="button"
                                onClick={() => {
                                  setCurrentCategory(item);
                                  setSelectedSubcategory(isSubActive ? "All" : subcategory);
                                }}
                                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition ${isSubActive ? "bg-[#eef4f4]" : "hover:bg-[#eef4f4] hover:text-[#5E7F85]"}`}
                              >
                                <span className={`leading-6 ${isSubActive ? "font-semibold text-[#5E7F85]" : "text-[#556b8e]"}`}>{subcategory}</span>
                                <span className={`shrink-0 rounded-full px-3 py-1 text-[0.92rem] ${isSubActive ? "bg-[#5E7F85] text-white" : "bg-[#f2f2f2] text-[#6e81a3]"}`}>{subcategoryCount(item, subcategory)}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-8">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[1.35rem] font-semibold">Brands</h3>
                
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#f8f8f8] px-4 py-3">
                <span className="text-slate-400">&#8981;</span>
                <input value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)} className="w-full bg-transparent text-[1rem] outline-none placeholder:text-slate-400" placeholder="Search brand..." />
              </div>
              <div className="mt-5 space-y-2 text-[1.08rem] text-[#23395b]">
                {visibleBrands.map((item) => {
                  const isActive = selectedBrands.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setSelectedBrands((prev) =>
                          prev.includes(item) ? [] : [item]
                        )
                      }
                      className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition ${isActive ? "bg-[#eef4f4]" : "hover:bg-[#eef4f4] hover:text-[#5E7F85]"}`}
                    >
                      <span className={`leading-6 ${isActive ? "font-semibold text-[#5E7F85]" : "text-[#556b8e]"}`}>{item}</span>
                      
                    </button>
                  );
                })}
                {visibleBrands.length === 0 ? <div className="text-sm text-slate-400">No brand found</div> : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className="mt-6 min-h-11 w-full rounded-xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white xl:hidden"
            >
              Show Products
            </button>
          </aside>

          <div>
            <div className="mb-6 hidden items-center justify-end gap-3 xl:flex">
              <select value={selectedSort} onChange={(event) => setSelectedSort(event.target.value)} className="rounded-xl border border-[#c9d5d8] bg-white px-6 py-3 text-[1.05rem] font-semibold text-[#23395b] outline-none shadow-sm">
                <option>Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest</option>
              </select>
            </div>

            {activeFilters.length > 0 ? (
              <div className="mb-6 flex flex-wrap items-center gap-3">
                {activeFilters.map((filter, index) => (
                  <button
                    key={`${filter}-${index}`}
                    type="button"
                    onClick={() => removeActiveFilter(filter)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#d7e2e4] bg-white px-4 py-2 text-sm font-medium text-[#23395b] shadow-sm transition hover:border-[#5E7F85] hover:text-[#5E7F85]"
                  >
                    <span>{filter}</span>
                    <span className="text-slate-400">&times;</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 rounded-full border border-[#d7e2e4] bg-white px-4 py-2 text-sm font-medium text-[#23395b] shadow-sm transition hover:border-[#5E7F85] hover:text-[#5E7F85]"
                >
                  Clear All
                </button>
              </div>
            ) : null}

            {isCatalogLoading ? (
              <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-[#5E7F85] shadow-sm">
                Loading live catalog...
              </div>
            ) : null}

            {catalogMessage ? (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800 shadow-sm">
                {catalogMessage}
              </div>
            ) : null}

            {filteredProducts.length === 0 ? (
              <div className="py-20 text-center text-slate-500">
                {searchTerm.trim() ? `No products match your search for "${searchTerm.trim()}".` : "No products match your current filters."}
              </div>
            ) : (
              <div className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleProducts.map((product, index) => (
                  <ProductCard key={`${product?.id || product?.name || "product"}-${index}`} product={product} />
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-col items-center justify-center gap-4 text-center">
              <p className="text-sm font-medium text-slate-600" aria-live="polite">
                Showing {visibleProducts.length} of {sortedProducts.length} products
              </p>
              {canLoadMore ? (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="min-h-11 rounded-2xl border border-[#5E7F85] bg-white px-6 py-3 text-sm font-semibold text-[#5E7F85] shadow-sm transition hover:bg-[#5E7F85] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E7F85]"
                  aria-label={`Load 30 more products. Showing ${visibleProducts.length} of ${sortedProducts.length} products.`}
                >
                  Load More
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

