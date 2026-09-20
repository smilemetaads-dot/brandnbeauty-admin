// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
"use client";

// Product editor UI connected to the custom PHP/MySQL backend.
/* eslint-disable */
/*
Full-context page file generated from the uploaded final admin source.
Page: Add/Edit Product
Source component: ProductMasterPage
Use this as reference for live injection. Do not import from _reference into production src.
*/

import React, { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type RealAddEditProductPageProps = {
  brands?: unknown;
  categories?: unknown;
  concerns?: unknown;
  embedded?: boolean;
  onNavigate?: (page: string) => void;
  product?: unknown;
};

const REFERENCE_EDITOR_SECTIONS = [
  { id: "basic", icon: "✎", label: "General", helper: "Identity & description" },
  { id: "images", icon: "◉", label: "Media", helper: "Images & alt text" },
  { id: "pricing", icon: "▤", label: "Pricing", helper: "Price, cost & margin" },
  { id: "inventory", icon: "▦", label: "Inventory", helper: "SKU & stock policy" },
  { id: "organization", icon: "◇", label: "Organization", helper: "Category & merchandising" },
  { id: "content", icon: "▧", label: "Product content", helper: "Benefits & ingredients" },
  { id: "variants", icon: "◈", label: "Variants", helper: "Options & combinations" },
  { id: "seo", icon: "⌕", label: "SEO & shipping", helper: "Search & fulfilment" },
];

function ProductEditorFrame({ children, embedded = false }: { children: ReactNode; embedded?: boolean }) {
  return embedded ? <>{children}</> : <AdminShell>{children}</AdminShell>;
}

function Badge({ children, tone = "default" }) {
  const cls = {
    default: "bg-slate-100 text-slate-700",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
  }[tone] || "bg-slate-100 text-slate-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
}

function StatCard({ item, index = 0, active = false }) {
  const icons = ["1", "2", "3", "4"];
  const trendText = String(item[2]).toLowerCase();
  const trendTone = trendText.includes("risk") || trendText.includes("need") || trendText.includes("blocked") || trendText.includes("missing") ? "text-amber-600 bg-amber-50" : "text-emerald-700 bg-emerald-50";
  return (
    <button type="button" className={`group relative w-full overflow-hidden rounded-[1.7rem] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${active ? "border-[#5E7F85] ring-2 ring-[#5E7F85]/15" : "border-slate-200"}`}>
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5E7F85]/5 transition group-hover:bg-[#5E7F85]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-500">{item[0]}</div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{item[1]}</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xl font-bold text-[#5E7F85]">{icons[index % icons.length]}</div>
      </div>
      <div className={`relative mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${trendTone}`}>{item[2]}</div>
    </button>
  );
}

function TableHead({ children, className = "" }) {
  return <thead className={`sticky top-0 z-10 bg-stone-50 text-slate-500 ${className}`}>{children}</thead>;
}

const ADD_EDIT_PRODUCT_ENDPOINT = bnbApiUrl("add_edit_product.php");
const PRODUCT_DETAILS_ENDPOINT = bnbApiUrl("get_product_details.php");
const CATEGORIES_ENDPOINT = bnbApiUrl("get_categories.php");
const CONCERNS_ENDPOINT = bnbApiUrl("get_concerns.php");
const BRANDS_ENDPOINT = bnbApiUrl("get_brands.php");
const UPLOAD_MEDIA_ENDPOINT = bnbApiUrl("upload_media.php");
const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

function readProductField(product, keys, fallback = "") {
  if (!product || typeof product !== "object") {
    return fallback;
  }

  for (const key of keys) {
    const value = product[key];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }

  return fallback;
}

function parseProductAttributes(product) {
  const raw = product?.attributes;
  if (!raw) return {};
  if (typeof raw === "object") return raw;

  try {
    const parsed = JSON.parse(String(raw));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function readAttribute(product, keys, fallback = "") {
  const attributes = parseProductAttributes(product);

  for (const key of keys) {
    const value = attributes[key];
    if (Array.isArray(value)) {
      const text = value
        .map((item) => typeof item === "string" ? item : "")
        .filter(Boolean)
        .join("\n");
      if (text) return text;
    }
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }

  return fallback;
}

function readFaqText(product) {
  const faq = parseProductAttributes(product).faq;

  if (!Array.isArray(faq)) return "";

  return faq
    .map((item) => {
      const question = String(item?.question || "").trim();
      const answer = String(item?.answer || "").trim();
      return question && answer ? `${question} | ${answer}` : "";
    })
    .filter(Boolean)
    .join("\n");
}

function splitLines(value) {
  return String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function editorStatusFromProduct(product) {
  if (readProductField(product, ["deleted_at", "archived_at"], "")) return "Archived";
  const value = String(readProductField(product, ["status"], "draft") || "draft").toLowerCase();
  if (["active", "published", "visible"].includes(value)) return "Visible";
  if (["inactive", "private", "hidden", "disabled"].includes(value)) return "Hidden";
  return "Draft";
}

function backendStatusFromEditor(value) {
  if (value === "Visible") return "active";
  if (value === "Hidden") return "inactive";
  return "draft";
}

function optionalDecimal(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  return /^\d{1,10}(\.\d{1,2})?$/.test(text) ? Number(text) : Number.NaN;
}

function optionalWholeNumber(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  return /^\d+$/.test(text) ? Number(text) : Number.NaN;
}

function toCatalogOption(item) {
  if (!item || typeof item !== "object") return null;
  const id = readProductField(item, ["id"], "");
  const name = readProductField(item, ["name", "title", "label"], "");
  const slug = readProductField(item, ["slug"], "");
  const status = readProductField(item, ["status"], "active").toLowerCase();
  const parentId = readProductField(item, ["parent_id"], "");

  if (!id || !name || ["inactive", "disabled", "deleted"].includes(status)) {
    return null;
  }

  return { id, name, parentId, slug, status };
}

function normalizeCatalogPayload(payload, keys) {
  const rows = Array.isArray(payload)
    ? payload
    : keys.reduce((found, key) => found || (Array.isArray(payload?.[key]) ? payload[key] : null), null);

  if (!Array.isArray(rows)) return [];

  return rows.map(toCatalogOption).filter(Boolean);
}

function fallbackOptions(names) {
  return names.map((name) => ({ id: `name:${name}`, name, parentId: "", slug: "" }));
}

function readConcernIds(product) {
  if (!product || typeof product !== "object") return [];

  const directIds = Array.isArray(product.concern_ids)
    ? product.concern_ids.map(String)
    : [];
  const mappedIds = Array.isArray(product.concerns)
    ? product.concerns.map((item) => readProductField(item, ["id", "concern_id"], ""))
    : [];
  const legacyId = readProductField(product, ["concern_id"], "");

  return Array.from(new Set([...directIds, ...mappedIds, legacyId].filter(Boolean)));
}

function optionValueFor(id, name) {
  return id ? String(id) : `name:${name}`;
}

function applyCatalogSelection(value, options, setId, setName) {
  const selected = options.find((item) => String(item.id) === String(value));
  if (!selected) return;

  setName(selected.name);
  setId(String(selected.id).startsWith("name:") ? "" : String(selected.id));
}

function parseFaqText(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => {
      const [question, ...answerParts] = line.split("|");
      return {
        answer: answerParts.join("|").trim(),
        question: String(question || "").trim(),
      };
    })
    .filter((item) => item.question && item.answer);
}

export function RealAddEditProductPage(_props: RealAddEditProductPageProps) {
  const router = useRouter();
  const initialEditingProduct = _props.product && typeof _props.product === "object" ? _props.product : null;
  const [loadedProduct, setLoadedProduct] = useState(null);
  const editingProduct = loadedProduct || initialEditingProduct;
  const editingProductId = readProductField(editingProduct, ["id", "product_id"], "");
  const initialConcernIds = readConcernIds(editingProduct);
  const [trackStock, setTrackStock] = useState(true);
  const [featured, setFeatured] = useState(true);
  const [freeDelivery, setFreeDelivery] = useState(false);
  const [websiteVisible, setWebsiteVisible] = useState(true);
  const [messengerOrder, setMessengerOrder] = useState(true);
  const [productType, setProductType] = useState("Single Product");
  const [stockRule, setStockRule] = useState("Sellable");
  const [outOfStockBehavior, setOutOfStockBehavior] = useState("Show with Notify Me");
  const [status, setStatus] = useState(editorStatusFromProduct(editingProduct));
  const [productName, setProductName] = useState(readProductField(editingProduct, ["product_name", "name"], ""));
  const [brandList, setBrandList] = useState(["BrandnBeauty", "The Derma Plus", "COSRX", "Some By Mi", "Beauty of Joseon", "Simple"]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [concernOptions, setConcernOptions] = useState([]);
  const [brandId, setBrandId] = useState(readProductField(editingProduct, ["brand_id"], ""));
  const [categoryId, setCategoryId] = useState(readProductField(editingProduct, ["category_id"], ""));
  const [concernId, setConcernId] = useState(readProductField(editingProduct, ["concern_id"], ""));
  const [concernIds, setConcernIds] = useState(initialConcernIds);
  const [subcategoryId, setSubcategoryId] = useState("");
  const [brand, setBrand] = useState(readProductField(editingProduct, ["brand_name", "brand"], "BrandnBeauty"));
  const [category, setCategory] = useState(readProductField(editingProduct, ["category_name", "category"], "Skincare"));
  const [subcategory, setSubcategory] = useState("Face Wash");
  const [concern, setConcern] = useState(readProductField(editingProduct, ["concern_name", "concern"], "Acne"));
  const [skuCounter, setSkuCounter] = useState(1001);
  const [costPrice, setCostPrice] = useState(readProductField(editingProduct, ["purchase_cost", "cost_price", "cost"], ""));
  const [regularPrice, setRegularPrice] = useState(readProductField(editingProduct, ["old_price", "sale_price", "regular_price"], ""));
  const [salePrice, setSalePrice] = useState(readProductField(editingProduct, ["price"], ""));
  const [stockQty, setStockQty] = useState(readProductField(editingProduct, ["stock_quantity", "stock", "quantity"], ""));
  const [lowStockAlert, setLowStockAlert] = useState(readProductField(editingProduct, ["low_stock_threshold", "low_stock_limit", "reorder_level"], ""));
  const [inventoryMode, setInventoryMode] = useState(readProductField(editingProduct, ["inventory_mode"], "stocked"));
  const [availabilityStatus, setAvailabilityStatus] = useState(readProductField(editingProduct, ["availability_status"], "available"));
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState(readProductField(editingProduct, ["minimum_order_quantity"], "1"));
  const [weight, setWeight] = useState(readAttribute(editingProduct, ["shipping_weight", "weight"], ""));
  const [courierCost, setCourierCost] = useState(readAttribute(editingProduct, ["courier_cost"], ""));
  const [duplicateCheck, setDuplicateCheck] = useState(true);
  const [seoTitle, setSeoTitle] = useState(readAttribute(editingProduct, ["seo_title"], ""));
  const [metaDescription, setMetaDescription] = useState(readAttribute(editingProduct, ["meta_description"], ""));
  const [focusKeyword, setFocusKeyword] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [ignoredDuplicates, setIgnoredDuplicates] = useState(false);
  const [actionToast, setActionToast] = useState("");
  const [variants, setVariants] = useState([]);
  const [variantOptionType, setVariantOptionType] = useState("Size");
  const [variantDraft, setVariantDraft] = useState({ option: "", sku: "", cost: "", regular: "", sale: "", stock: "", lowStock: "", inventoryMode: "stocked", availabilityStatus: "available", minimumOrderQuantity: "1", status: "Draft", imageUrl: "" });
  const [mainImageReady, setMainImageReady] = useState(false);
  const [mainImageFile, setMainImageFile] = useState(null);
  const [galleryImages, setGalleryImages] = useState(splitLines(readAttribute(editingProduct, ["gallery_images", "gallery", "images"], "")));
  const [imageUrl, setImageUrl] = useState(readProductField(editingProduct, ["image_url", "image"], ""));
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [productLabel, setProductLabel] = useState("Bestseller");
  const [productBadge, setProductBadge] = useState("Authentic Product");
  const [shortDescription, setShortDescription] = useState(readProductField(editingProduct, ["short_description"], ""));
  const [fullDescription, setFullDescription] = useState(readProductField(editingProduct, ["description"], ""));
  const [howToUse, setHowToUse] = useState(readAttribute(editingProduct, ["how_to_use", "howToUse", "usage"], ""));
  const [ingredients, setIngredients] = useState(readAttribute(editingProduct, ["ingredients", "ingredient_list"], ""));
  const [productDetails, setProductDetails] = useState(readAttribute(editingProduct, ["product_details"], ""));
  const [benefitRows, setBenefitRows] = useState(splitLines(readAttribute(editingProduct, ["benefits"], "")));
  const [suitableFor, setSuitableFor] = useState(readAttribute(editingProduct, ["suitable_for"], "Oily / Acne Prone"));
  const [warnings, setWarnings] = useState(readAttribute(editingProduct, ["warnings"], ""));
  const [keyIngredientRows, setKeyIngredientRows] = useState(splitLines(readAttribute(editingProduct, ["key_ingredients"], "")));
  const [faqRows, setFaqRows] = useState(parseFaqText(readFaqText(editingProduct)));
  const [visibleResultTitle, setVisibleResultTitle] = useState("Visible Results");
  const [visibleResultBullets, setVisibleResultBullets] = useState(`Skin feels less oily within first few uses\nHelps reduce clogged pores\nSupports a cleaner daily routine`);
  const [trustBadges, setTrustBadges] = useState(["100% Authentic", "Verified Seller", "COD Available", "Fast Delivery"]);
  const [skinType, setSkinType] = useState("Oily / Acne Prone");
  const [routineStep, setRoutineStep] = useState("Cleanser");
  const [routineTime, setRoutineTime] = useState("AM + PM");
  const [routineFrequency, setRoutineFrequency] = useState("Daily");
  const [productFaqs, setProductFaqs] = useState([]);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Unsaved changes");
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [aiContentMode, setAiContentMode] = useState("Conversion + SEO");
  const [aiContentLanguage, setAiContentLanguage] = useState("English + Bangla Friendly");
  const [aiTargetCustomer, setAiTargetCustomer] = useState("Bangladesh skincare buyer");

  const categoryTree = {
    Skincare: ["Face Wash", "Serum", "Moisturizer", "Sunscreen", "Toner"],
    "Hair Care": ["Shampoo", "Hair Mask", "Hair Serum", "Scalp Care"],
    Haircare: ["Shampoo", "Hair Mask", "Hair Serum", "Scalp Care"],
    Makeup: ["Lip", "Face", "Eye", "Brushes"],
    "Body Care": ["Body Wash", "Lotion", "Scrub"],
  };
  const concernList = ["Acne", "Dark Spots", "Brightening", "Oily Skin", "Dry Skin", "Sensitive Skin", "Hairfall", "Dull Skin"];
  const visibleBrandOptions = brandOptions.length ? brandOptions : fallbackOptions(brandList);
  const visibleCategoryOptions = categoryOptions.length ? categoryOptions : fallbackOptions(Object.keys(categoryTree));
  const visibleConcernOptions = concernOptions.length ? concernOptions : fallbackOptions(concernList);
  const rootCategoryOptions = visibleCategoryOptions.filter((item) => !item.parentId);
  const subcategoryOptions = visibleCategoryOptions.filter(
    (item) => String(item.parentId) === String(categoryId),
  );
  const catalogProducts = [
    { name: "Acne Balance Facewash", brand: "Some By Mi", price: 890, stock: 44 },
    { name: "Barrier Calm Serum", brand: "BrandnBeauty", price: 990, stock: 18 },
    { name: "Daily Sun Gel", brand: "Beauty of Joseon", price: 1250, stock: 0 },
    { name: "Hydra Gel Moisturizer", brand: "Simple", price: 850, stock: 72 },
    { name: "Routine Bundle", brand: "BrandnBeauty", price: 2020, stock: 12 },
  ];

  const autoSku = String(skuCounter);
  const autoSlug = productName ? productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "auto-generated-slug";
  const storefrontBaseUrl = (process.env.NEXT_PUBLIC_BNB_STOREFRONT_URL?.trim() || "http://localhost:3001").replace(/\/$/, "");
  const storefrontProductUrl = `${storefrontBaseUrl}/products/${autoSlug}`;
  const isVariantProduct = productType === "Variant Product";
  const selectedVariant = variants[0];
  const previewSalePrice = isVariantProduct ? (selectedVariant?.sale || "") : salePrice;
  const previewRegularPrice = isVariantProduct ? (selectedVariant?.regular || "") : regularPrice;
  const previewStockQty = isVariantProduct ? String(variants.reduce((sum, item) => sum + Number(item.stock || 0), 0)) : stockQty;
  const discount = Number(previewRegularPrice) > 0 ? Math.max(Math.round(((Number(previewRegularPrice) - Number(previewSalePrice)) / Number(previewRegularPrice)) * 100), 0) : 0;
  const seoTitleText = seoTitle || `${productName || "Product Name Preview"} | BrandnBeauty`;
  const metaDescriptionText = metaDescription || `Buy authentic ${brand} ${productName || "product"} in Bangladesh. Best price, COD and fast delivery available.`;
  const duplicateProducts = productName.length > 2 && duplicateCheck && !ignoredDuplicates ? ["Acne Control Facewash", "Acne Balance Facewash"] : [];
  const publishChecks = [
    { label: "Product name", ok: Boolean(productName) },
    { label: "At least one valid variant", ok: !isVariantProduct || variants.length > 0 },
    { label: "Selling Price", ok: Number(previewSalePrice) > 0 },
    { label: "Stock or Available-on-Order", ok: inventoryMode === "on_demand" || Number(previewStockQty) >= 0 },
    { label: "Main image", ok: mainImageReady },
    { label: "Short description", ok: Boolean(shortDescription) },
  ];
  const publishBlocked = publishChecks.some((item) => !item.ok);
  const completedPublishChecks = publishChecks.filter((item) => item.ok).length;
  const readinessPercent = Math.round((completedPublishChecks / publishChecks.length) * 100);
  const editorSections = REFERENCE_EDITOR_SECTIONS;
  const [activeEditorSection, setActiveEditorSection] = useState("basic");

  const goBackToProducts = () => {
    if (_props.onNavigate) {
      _props.onNavigate("Products");
      return;
    }
    router.push("/products");
  };

  useEffect(() => {
    if (!editorSections.some((section) => section.id === activeEditorSection)) {
      setActiveEditorSection("basic");
    }
  }, [activeEditorSection, editorSections]);

  const showActionToast = (message) => {
    setActionToast(message);
    setTimeout(() => setActionToast(""), 2200);
  };

  useEffect(() => {
    if (!isDirty) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const markEditorDirty = (event) => {
    const tagName = String(event.target?.tagName || "").toLowerCase();
    if (["input", "select", "textarea"].includes(tagName)) {
      setIsDirty(true);
      setSaveStatus("Unsaved changes");
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadOptions(endpoint, keys, setter) {
      const response = await fetch(endpoint, {
        cache: "no-store",
        headers: adminAuthHeaders(),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error("Catalog options could not be loaded");
      }

      const options = normalizeCatalogPayload(payload, keys);
      if (isMounted && options.length) {
        setter(options);
      }
    }

    Promise.allSettled([
      loadOptions(CATEGORIES_ENDPOINT, ["categories"], setCategoryOptions),
      loadOptions(CONCERNS_ENDPOINT, ["concerns"], setConcernOptions),
      loadOptions(BRANDS_ENDPOINT, ["brands"], setBrandOptions),
    ]).catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const matchedBrand = brandOptions.find((item) => item.name.toLowerCase() === brand.toLowerCase());
    if (!brandId && matchedBrand) setBrandId(String(matchedBrand.id));

    const matchedCategory = categoryOptions.find((item) => item.name.toLowerCase() === category.toLowerCase());
    if (!categoryId && matchedCategory) setCategoryId(String(matchedCategory.id));

    const matchedConcern = concernOptions.find((item) => item.name.toLowerCase() === concern.toLowerCase());
    if (!concernId && matchedConcern) {
      setConcernId(String(matchedConcern.id));
      setConcernIds((current) => current.length ? current : [String(matchedConcern.id)]);
    }
  }, [brandOptions, categoryOptions, concernOptions, brand, category, concern, brandId, categoryId, concernId]);

  useEffect(() => {
    const selectedCategory = categoryOptions.find((item) => String(item.id) === String(categoryId));
    if (selectedCategory) setCategory(selectedCategory.name);

    const selectedSubcategory = categoryOptions.find((item) => String(item.id) === String(subcategoryId));
    if (selectedSubcategory) setSubcategory(selectedSubcategory.name);
  }, [categoryOptions, categoryId, subcategoryId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id") || window.sessionStorage.getItem("bnb-product-editor-id");

    if (!productId || loadedProduct) return;

    let isMounted = true;

    async function loadProductForEdit() {
      try {
        const response = await fetch(`${PRODUCT_DETAILS_ENDPOINT}?id=${encodeURIComponent(productId)}&include_inactive=1`, {
          cache: "no-store",
          headers: adminAuthHeaders(),
        });
        const payload = await response.json();

        if (!isMounted || !response.ok || !payload?.success || !payload.product) {
          return;
        }

        const product = payload.product;
        setLoadedProduct(product);
        setProductName(readProductField(product, ["product_name", "name"], ""));
        setBrandId(readProductField(product, ["brand_id"], ""));
        setBrand(readProductField(product, ["brand_name", "brand"], brand));
        const loadedCategoryId = readProductField(product, ["category_id"], "");
        const loadedCategoryParentId = readProductField(product, ["category_parent_id"], "");
        setCategoryId(loadedCategoryParentId || loadedCategoryId);
        setSubcategoryId(loadedCategoryParentId ? loadedCategoryId : "");
        setCategory(readProductField(product, ["category_name", "category"], category));
        setSubcategory(loadedCategoryParentId ? readProductField(product, ["category_name", "category"], "") : "");
        const loadedConcernIds = readConcernIds(product);
        const loadedPrimaryConcernId = readProductField(product, ["concern_id"], "") || loadedConcernIds[0] || "";
        setConcernId(loadedPrimaryConcernId);
        setConcernIds(loadedConcernIds.length ? loadedConcernIds : loadedPrimaryConcernId ? [loadedPrimaryConcernId] : []);
        const loadedPrimaryConcern = Array.isArray(product.concerns)
          ? product.concerns.find((item) => String(item.id) === String(loadedPrimaryConcernId))
          : null;
        setConcern(readProductField(loadedPrimaryConcern, ["name"], readProductField(product, ["concern_name", "concern"], concern)));
        setCostPrice(readProductField(product, ["purchase_cost", "cost_price", "cost"], costPrice));
        setRegularPrice(readProductField(product, ["old_price", "sale_price", "regular_price"], regularPrice));
        setSalePrice(readProductField(product, ["price"], salePrice));
        setStockQty(readProductField(product, ["stock_quantity", "stock", "quantity"], stockQty));
        setLowStockAlert(readProductField(product, ["low_stock_threshold", "low_stock_limit", "reorder_level"], lowStockAlert));
        setInventoryMode(readProductField(product, ["inventory_mode"], "stocked"));
        setAvailabilityStatus(readProductField(product, ["availability_status"], "available"));
        setMinimumOrderQuantity(readProductField(product, ["minimum_order_quantity"], "1"));
        setProductType(product.product_type === "variant" ? "Variant Product" : "Single Product");
        setVariants(Array.isArray(product.variants) ? product.variants.map((variant) => ({
          id: variant.id,
          persisted: Boolean(variant.id),
          optionName: variant.option_name || "Size",
          option: variant.option_value || variant.variant_name || "",
          sku: variant.sku || "",
          cost: String(variant.cost_price ?? ""), regular: String(variant.regular_price ?? ""),
          sale: String(variant.sale_price ?? ""), stock: String(variant.stock_quantity ?? "0"),
          lowStock: String(variant.low_stock_threshold ?? "0"),
          inventoryMode: variant.inventory_mode || "stocked",
          availabilityStatus: variant.availability_status || "available",
          minimumOrderQuantity: String(variant.minimum_order_quantity ?? "1"),
          status: variant.status === "active" ? "Active" : variant.status === "inactive" ? "Disabled" : "Draft",
          imageUrl: variant.image_url || "",
        })) : []);
        const loadedVariantOptionName = Array.isArray(product.variants) && product.variants.length ? product.variants[0]?.option_name : "";
        setVariantOptionType(loadedVariantOptionName || "Size");
        setImageUrl(readProductField(product, ["image_url", "image"], ""));
        setMainImageReady(Boolean(readProductField(product, ["image_url", "image"], "")));
        setShortDescription(readProductField(product, ["short_description"], ""));
        setFullDescription(readProductField(product, ["description"], ""));
        setHowToUse(readAttribute(product, ["how_to_use", "howToUse", "usage"], ""));
        setIngredients(readAttribute(product, ["ingredients", "ingredient_list"], ""));
        setProductDetails(readAttribute(product, ["product_details"], ""));
        setBenefitRows(splitLines(readAttribute(product, ["benefits"], "")));
        setSuitableFor(readAttribute(product, ["suitable_for"], "Oily / Acne Prone"));
        setWarnings(readAttribute(product, ["warnings"], ""));
        setKeyIngredientRows(splitLines(readAttribute(product, ["key_ingredients"], "")));
        setFaqRows(parseFaqText(readFaqText(product)));
        const loadedGallery = splitLines(readAttribute(product, ["gallery_images", "gallery", "images"], ""));
        setGalleryImages(loadedGallery);
        setStatus(editorStatusFromProduct(product));
        setSeoTitle(readAttribute(product, ["seo_title"], ""));
        setMetaDescription(readAttribute(product, ["meta_description"], ""));
        setWeight(readAttribute(product, ["shipping_weight", "weight"], ""));
        setCourierCost(readAttribute(product, ["courier_cost"], ""));
        setSaveStatus("Loaded from catalog");
        setIsDirty(false);
      } catch {
        showActionToast("Product details could not be loaded for editing");
      }
    }

    loadProductForEdit();

    return () => {
      isMounted = false;
    };
  }, [loadedProduct]);

  const saveProductToBackend = async (nextStatus = "Draft") => {
    if (isSavingProduct) {
      return;
    }

    if (isUploadingImage) {
      showActionToast("Wait for image upload to finish");
      return;
    }

    const isPublishing = nextStatus === "Visible";
    const sellingPriceNumber = optionalDecimal(previewSalePrice);
    const regularPriceNumber = optionalDecimal(previewRegularPrice);
    const stockNumber = optionalWholeNumber(previewStockQty);
    const minimumOrderQuantityNumber = optionalWholeNumber(minimumOrderQuantity || "1");
    const activeVariants = variants.filter((variant) => variant.status === "Active");
    const cleanBenefitRows = benefitRows.map((item) => String(item || "").trim()).filter(Boolean);
    const cleanKeyIngredientRows = keyIngredientRows.map((item) => String(item || "").trim()).filter(Boolean);
    const cleanFaqRows = faqRows.map((item) => ({ question: String(item?.question || "").trim(), answer: String(item?.answer || "").trim() })).filter((item) => item.question || item.answer);
    const hasEmptyBenefitRow = benefitRows.some((item) => !String(item || "").trim());
    const hasEmptyKeyIngredientRow = keyIngredientRows.some((item) => !String(item || "").trim());
    const hasIncompleteFaqRow = cleanFaqRows.some((item) => item.question && !item.answer);

    if (!productName.trim()) {
      showActionToast("Product name is required. You can save an incomplete product as Draft and finish it later.");
      return;
    }

    if (Number.isNaN(sellingPriceNumber)) {
      showActionToast("Enter the customer selling price as a valid non-negative amount.");
      return;
    }

    if (Number.isNaN(regularPriceNumber)) {
      showActionToast("Regular Price must be a valid non-negative amount.");
      return;
    }

    if (regularPriceNumber !== null && sellingPriceNumber !== null && regularPriceNumber < sellingPriceNumber) {
      showActionToast("Regular Price cannot be lower than Selling Price.");
      return;
    }

    if (Number.isNaN(stockNumber)) {
      showActionToast("Stock quantity must be a whole number of 0 or more.");
      return;
    }

    if (Number.isNaN(minimumOrderQuantityNumber) || minimumOrderQuantityNumber === null || minimumOrderQuantityNumber < 1) {
      showActionToast("Minimum order quantity must be a positive whole number.");
      return;
    }

    if (isVariantProduct) {
      const variantIssues = [];
      const seenOptions = new Set();
      const seenSkus = new Set();

      variants.forEach((variant, index) => {
        const rowLabel = `Variant ${index + 1}`;
        const optionValue = String(variant.option || "").trim();
        const skuValue = String(variant.sku || "").trim().toLowerCase();
        const sellingValue = optionalDecimal(variant.sale);
        const regularValue = optionalDecimal(variant.regular);
        const stockValue = optionalWholeNumber(variant.stock);
        const minQtyValue = optionalWholeNumber(variant.minimumOrderQuantity || "1");
        const isVisibleVariant = variant.status === "Active";
        const isHiddenVariant = variant.status === "Disabled";

        if (Number.isNaN(sellingValue)) variantIssues.push(`${rowLabel}: enter a valid selling price.`);
        if (Number.isNaN(regularValue)) variantIssues.push(`${rowLabel}: enter a valid regular price.`);
        if (regularValue !== null && sellingValue !== null && regularValue < sellingValue) variantIssues.push(`${rowLabel}: Regular Price cannot be lower than Selling Price.`);
        if (Number.isNaN(stockValue)) variantIssues.push(`${rowLabel}: Stock Quantity must be a whole number of 0 or more.`);
        if (Number.isNaN(minQtyValue) || minQtyValue === null || minQtyValue < 1) variantIssues.push(`${rowLabel}: Min. Qty must be at least 1.`);

        if (!isHiddenVariant && optionValue) {
          const normalizedOption = optionValue.toLowerCase();
          if (seenOptions.has(normalizedOption)) variantIssues.push(`${rowLabel}: duplicate option value.`);
          seenOptions.add(normalizedOption);
        }

        if (!isHiddenVariant && skuValue) {
          if (seenSkus.has(skuValue)) variantIssues.push(`${rowLabel}: duplicate SKU.`);
          seenSkus.add(skuValue);
        }

        if (isPublishing && isVisibleVariant) {
          if (!optionValue) variantIssues.push(`${rowLabel}: Option Value is required before publishing.`);
          if (sellingValue === null || sellingValue <= 0) variantIssues.push(`${rowLabel}: Selling Price must be greater than 0 before publishing.`);
          if (variant.availabilityStatus !== "available") variantIssues.push(`${rowLabel}: Customer Availability must be Available before publishing.`);
          if (variant.inventoryMode !== "on_demand" && (stockValue === null || stockValue < 0)) variantIssues.push(`${rowLabel}: Stock Quantity is required for stocked variants before publishing.`);
        }
      });

      if (isPublishing && !activeVariants.length) {
        variantIssues.push("Add at least one visible variant before publishing.");
      }

      if (variantIssues.length) {
        showActionToast(variantIssues[0]);
        return;
      }
    }

    if (isPublishing) {
      const hasValidSellingPrice = isVariantProduct
        ? activeVariants.some((variant) => {
            const variantSelling = optionalDecimal(variant.sale || variant.regular);
            return variantSelling !== null && !Number.isNaN(variantSelling) && variantSelling > 0;
          })
        : sellingPriceNumber !== null && sellingPriceNumber > 0;
      const hasValidAvailability = isVariantProduct
        ? activeVariants.some((variant) => {
            const variantStock = optionalWholeNumber(variant.stock);
            return variant.availabilityStatus === "available" && (variant.inventoryMode === "on_demand" || (variantStock !== null && !Number.isNaN(variantStock)));
          })
        : availabilityStatus === "available" && (inventoryMode === "on_demand" || (stockNumber !== null && stockNumber >= 0));

      if (!hasValidSellingPrice || !hasValidAvailability || !mainImageReady) {
        showActionToast("Complete the required product information before making this product visible.");
        return;
      }
    }

    setSaveStatus("Saving...");
    setIsSavingProduct(true);

    const mappedCategoryId = subcategoryId || categoryId;
    const mappedCategoryName = subcategoryId ? subcategory : category;
    const primaryConcernId = concernId || concernIds[0] || "";
    const payload = {
      ...(editingProductId ? { id: editingProductId } : {}),
      brand,
      brand_id: brandId || null,
      brand_ids: brandId ? [brandId] : [],
      category: mappedCategoryName,
      category_id: mappedCategoryId || null,
      category_ids: mappedCategoryId ? [mappedCategoryId] : [],
      concern,
      concern_id: primaryConcernId || null,
      concern_ids: concernIds,
      description: [shortDescription, fullDescription].filter(Boolean).join("\n\n"),
      benefits: cleanBenefitRows,
      faq: cleanFaqRows,
      gallery_images: splitLines(galleryImages.join("\n")),
      how_to_use: howToUse,
      image_url: imageUrl,
      ingredients,
      product_details: productDetails,
      key_ingredients: cleanKeyIngredientRows,
      low_stock_threshold: String(lowStockAlert || "0"),
      inventory_mode: inventoryMode,
      availability_status: availabilityStatus,
      minimum_order_quantity: String(minimumOrderQuantity || "1"),
      product_type: isVariantProduct ? "variant" : "single",
      sku: readProductField(loadedProduct || editingProduct, ["sku"], autoSku),
      variants: isVariantProduct ? variants.map((variant) => ({
        id: variant.id,
        variant_name: variant.option,
        option_name: variant.optionName || variantOptionType || "Size",
        option_value: variant.option,
        sku: variant.sku,
        cost_price: variant.cost || "",
        regular_price: variant.regular || variant.sale || "",
        sale_price: variant.sale || null,
        stock_quantity: variant.stock || "",
        low_stock_threshold: variant.lowStock || "",
        inventory_mode: variant.inventoryMode || "stocked",
        availability_status: variant.availabilityStatus || "available",
        minimum_order_quantity: String(variant.minimumOrderQuantity || "1"),
        status: variant.status === "Active" ? "active" : variant.status === "Disabled" ? "inactive" : "draft",
        image_url: variant.imageUrl || null,
      })) : [],
      name: productName.trim(),
      product_name: productName.trim(),
      price: String(previewSalePrice || ""),
      purchase_cost: String(costPrice || ""),
      attributes: {
        courier_cost: courierCost.trim(),
        seo_title: seoTitle.trim(),
        meta_description: metaDescription.trim(),
        shipping_weight: weight.trim(),
      },
      sale_price: String(previewRegularPrice || ""),
      status: backendStatusFromEditor(nextStatus),
      stock: String(previewStockQty || ""),
      stock_quantity: String(previewStockQty || ""),
      suitable_for: suitableFor,
      warnings,
    };

    try {
      const response = await fetch(ADD_EDIT_PRODUCT_ENDPOINT, {
        body: JSON.stringify(payload),
        headers: adminAuthHeaders({
          "Content-Type": "application/json",
        }),
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Product could not be saved.");
      }

      setStatus(nextStatus);
      setIsDirty(false);
      setSaveStatus(nextStatus === "Visible" ? "Visible just now" : "Saved just now");
      showActionToast(result.message || "Product saved successfully");
      if (_props.onNavigate) {
        _props.onNavigate("Products");
      } else {
        router.refresh();
        router.push("/products");
      }
    } catch (error) {
      setSaveStatus("Save failed");
      showActionToast(error instanceof Error ? error.message : "Product could not be saved");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const saveDraft = () => {
    saveProductToBackend("Draft");
  };

  const saveChanges = () => {
    saveProductToBackend(status === "Archived" ? "Hidden" : status);
  };

  const validateImageFile = (file) => {
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      return "Image is too large. Maximum size is 5MB.";
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return "Only JPG, PNG, and WEBP images are allowed.";
    }

    return "";
  };

  const uploadProductImage = async (file) => {
    const validationMessage = validateImageFile(file);

    if (validationMessage) {
      throw new Error(validationMessage);
    }

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(UPLOAD_MEDIA_ENDPOINT, {
      body: formData,
      headers: adminAuthHeaders(),
      method: "POST",
    });
    const data = await response.json();

    if (!response.ok || !data.success || !data.image_url) {
      throw new Error(data.message || "Image upload failed.");
    }

    return data.image_url;
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      return;
    }

    setMainImageFile(file);
    setMainImageReady(false);
    setIsUploadingImage(true);
    showActionToast("Uploading main image...");

    try {
      const uploadedUrl = await uploadProductImage(file);
      setImageUrl(uploadedUrl);
      setMainImageReady(true);
      showActionToast("Main image uploaded successfully");
    } catch (error) {
      setMainImageFile(null);
      setMainImageReady(Boolean(imageUrl));
      event.target.value = "";
      showActionToast(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleGalleryImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    setIsUploadingImage(true);
    showActionToast(files.length === 1 ? "Uploading gallery image..." : `Uploading ${files.length} gallery images...`);

    try {
      const uploadedUrls = [];

      for (const file of files) {
        uploadedUrls.push(await uploadProductImage(file));
      }

      setGalleryImages((current) => [...current, ...uploadedUrls]);
      showActionToast(files.length === 1 ? "Gallery image added" : "Gallery images added");
    } catch (error) {
      showActionToast(error instanceof Error ? error.message : "Gallery upload failed.");
    } finally {
      event.target.value = "";
      setIsUploadingImage(false);
    }
  };

  const moveGalleryImage = (fromIndex, direction) => {
    setGalleryImages((current) => {
      const toIndex = fromIndex + direction;

      if (toIndex < 0 || toIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const updateTextRow = (setter, index, value) => {
    setter((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  };

  const addTextRow = (setter) => {
    setter((current) => [...current, ""]);
  };

  const removeTextRow = (setter, index) => {
    setter((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const moveTextRow = (setter, fromIndex, direction) => {
    setter((current) => {
      const toIndex = fromIndex + direction;

      if (toIndex < 0 || toIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const updateFaqRow = (index, field, value) => {
    setFaqRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  };

  const addFaqRow = () => {
    setFaqRows((current) => [...current, { question: "", answer: "" }]);
  };

  const removeFaqRow = (index) => {
    setFaqRows((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const moveFaqRow = (fromIndex, direction) => {
    setFaqRows((current) => {
      const toIndex = fromIndex + direction;

      if (toIndex < 0 || toIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };
  const generateAutomationContent = () => {
    const cleanName = productName || `${brand} ${subcategory}`;
    setShortDescription(`${cleanName} is a ${routineStep.toLowerCase()} step product for ${concern.toLowerCase()} focused daily skincare routines.`);
    setFullDescription(`${cleanName} helps customers build a simple, consistent routine for ${concern.toLowerCase()} concern. It is positioned for ${aiTargetCustomer.toLowerCase()} with clear usage guidance, trust-focused product information and conversion-friendly PDP content.`);
    setProductDetails(`Best for: ${skinType}. Routine step: ${routineStep}. Use time: ${routineTime}. Frequency: ${routineFrequency}. Designed to support a clean, practical and easy-to-follow skincare routine.`);
    setBenefitRows([`Supports a practical ${routineStep.toLowerCase()} step in the routine.`]);
    setSuitableFor(skinType);
    setWarnings("Patch test before first use. Stop use if irritation occurs. Avoid direct contact with eyes.");
    setKeyIngredientRows(splitLines(ingredients || "Niacinamide\nGlycerin\nSkin-supporting actives"));
    setHowToUse(`Use as the ${routineStep.toLowerCase()} step in your routine. Apply as directed, then follow with the next routine step. Use ${routineTime.toLowerCase()} - ${routineFrequency.toLowerCase()}. Patch test before first use.`);
    setIngredients(ingredients || "Add INCI ingredient list here. Keep ingredient names clean, comma-separated and packaging-safe.");
    setVisibleResultBullets(`Skin feels cleaner and more comfortable\nSupports ${concern.toLowerCase()} focused routine\nHelps maintain a more consistent skincare habit`);
    setProductFaqs([
      { id: 1, question: `How do I use ${cleanName}?`, answer: `Use it as the ${routineStep.toLowerCase()} step. Follow the usage direction and patch test before first use.` },
      { id: 2, question: `Is ${cleanName} suitable for ${skinType.toLowerCase()}?`, answer: `It is positioned for ${skinType.toLowerCase()} users, but sensitive skin users should patch test first.` },
      { id: 3, question: "When should I use it?", answer: `Recommended use time: ${routineTime}. Frequency: ${routineFrequency}.` },
    ]);
    setFaqRows([
      { question: `How do I use ${cleanName}?`, answer: `Use it as the ${routineStep.toLowerCase()} step. Follow the usage direction and patch test before first use.` },
      { question: `Is ${cleanName} suitable for ${skinType.toLowerCase()}?`, answer: `It is positioned for ${skinType.toLowerCase()} users, but sensitive skin users should patch test first.` },
      { question: "When should I use it?", answer: `Recommended use time: ${routineTime}. Frequency: ${routineFrequency}.` },
    ]);
    setSeoTitle(`${cleanName} Price in Bangladesh | BrandnBeauty`);
    setMetaDescription(`Buy authentic ${cleanName} in Bangladesh from BrandnBeauty. Suitable for ${concern.toLowerCase()} focused skincare routines with COD and fast delivery.`);
    setFocusKeyword(`${cleanName.toLowerCase()} ${category.toLowerCase()} bangladesh`);
    setSaveStatus("Unsaved changes");
    showActionToast("AI-ready product content generated for review");
  };

  const updateVariantField = (rowIndex, field, value) => {
    setVariants((current) => current.map((item, index) => index === rowIndex ? { ...item, [field]: value } : item));
  };

  const addVariant = () => {
    const nextVariant = {
      id: `new-${Date.now()}`,
      persisted: false,
      optionName: variantOptionType || "Size",
      option: "",
      sku: "",
      cost: "",
      regular: "",
      sale: "",
      stock: "",
      lowStock: "",
      inventoryMode: "stocked",
      availabilityStatus: "available",
      minimumOrderQuantity: "1",
      status: "Draft",
      imageUrl: "",
    };
    setVariants((current) => [...current, nextVariant]);
    setVariantDraft({ option: "", sku: "", cost: "", regular: "", sale: "", stock: "", lowStock: "", inventoryMode: "stocked", availabilityStatus: "available", minimumOrderQuantity: "1", status: "Draft", imageUrl: "" });
    showActionToast(variants.length ? "Variant row added" : "First variant row added");
  };

  const removeOrDisableVariant = (rowIndex) => {
    setVariants((current) => {
      const target = current[rowIndex];

      if (!target?.persisted) {
        return current.filter((_, index) => index !== rowIndex);
      }

      return current.map((item, index) => index === rowIndex ? { ...item, status: "Disabled" } : item);
    });
    showActionToast("Variant updated");
  };

  const handleVariantImageUpload = async (event, rowIndex) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      return;
    }

    setIsUploadingImage(true);
    showActionToast("Uploading variant image...");

    try {
      const uploadedUrl = await uploadProductImage(file);
      updateVariantField(rowIndex, "imageUrl", uploadedUrl);
      showActionToast("Variant image uploaded successfully");
    } catch (error) {
      showActionToast(error instanceof Error ? error.message : "Variant image upload failed.");
    } finally {
      event.target.value = "";
      setIsUploadingImage(false);
    }
  };

  const toggleConcern = (option, checked) => {
    const optionId = String(option.id);
    const persistedId = optionId.startsWith("name:") ? "" : optionId;

    if (checked) {
      if (persistedId) {
        setConcernIds((current) => Array.from(new Set([...current, persistedId])));
      }
      if (!concernId) {
        setConcernId(persistedId);
        setConcern(option.name);
      }
      return;
    }

    const nextIds = concernIds.filter((id) => id !== persistedId);
    setConcernIds(nextIds);
    if (concernId === persistedId) {
      const nextPrimaryId = nextIds[0] || "";
      const nextPrimary = visibleConcernOptions.find(
        (item) => String(item.id) === String(nextPrimaryId),
      );
      setConcernId(nextPrimaryId);
      setConcern(nextPrimary?.name || "");
    }
  };

  return (
    <ProductEditorFrame embedded={_props.embedded}>
      <div className="space-y-5" onChangeCapture={markEditorDirty}>
        {actionToast && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">Success: {actionToast}</div>}

      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <button className="flex items-center gap-2 text-[8.5px] font-bold text-[#6d7c75] hover:text-[#3b646d]" onClick={goBackToProducts} type="button">← Back to products</button>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#3b646d]">Catalog Editor</div>
            <Badge tone={status === "Visible" ? "good" : status === "Archived" ? "bad" : "warn"}>{status === "Visible" ? "Live product" : status}</Badge>
            {isDirty ? <span className="rounded-full bg-amber-50 px-2 py-1 text-[7px] font-bold text-amber-700">Unsaved changes</span> : null}
          </div>
          <h1 className="mt-2 text-[25px] font-bold tracking-[-0.03em] text-[#17231f] sm:text-[29px]">{productName || "Add new product"}</h1>
          <div className="mt-1 font-mono text-[8px] text-[#8d9893]">{autoSku} · {saveStatus}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="flex h-10 items-center gap-2 rounded-xl border border-[#dce4e0] bg-white px-3.5 text-[8.5px] font-bold text-[#596962]" onClick={() => window.open(storefrontProductUrl, "_blank", "noopener,noreferrer")} type="button">Preview</button>
          <button className="flex h-10 items-center gap-2 rounded-xl border border-[#cfdcd8] bg-white px-3.5 text-[8.5px] font-bold text-[#416764] disabled:cursor-not-allowed disabled:opacity-45" disabled={isSavingProduct || isUploadingImage} onClick={saveDraft} type="button">Save draft</button>
          <button className="flex h-10 items-center gap-2 rounded-xl bg-[#3b646d] px-4 text-[8.5px] font-bold text-white shadow-sm disabled:bg-slate-300" disabled={isSavingProduct || isUploadingImage || status === "Archived"} onClick={() => setPublishModalOpen(true)} type="button">Review & publish</button>
        </div>
      </section>

      <div className="sticky top-3 z-20 rounded-[1.6rem] border border-slate-200 bg-white/95 p-3 shadow-md backdrop-blur xl:hidden">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#5E7F85]">Product Editor</div>
            <div className="mt-1 text-sm font-semibold text-slate-600">{productName || "New Product Draft"} - {isVariantProduct ? `${variants.length} variants` : autoSku}</div>
            <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${saveStatus.includes("Saved") || saveStatus.includes("Published") ? "bg-emerald-50 text-emerald-700" : saveStatus.includes("Saving") ? "bg-amber-50 text-amber-700" : "bg-stone-100 text-slate-600"}`}>{isDirty ? "Unsaved changes" : saveStatus}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={saveDraft} disabled={isSavingProduct || isUploadingImage} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60">{isSavingProduct ? "Saving..." : isUploadingImage ? "Uploading image..." : "Save as Draft"}</button>
            <button type="button" onClick={saveChanges} disabled={isSavingProduct || isUploadingImage || status === "Archived"} className="rounded-2xl border border-[#5E7F85]/30 bg-[#5E7F85]/10 px-4 py-3 text-sm font-semibold text-[#5E7F85] disabled:cursor-not-allowed disabled:opacity-60">{isSavingProduct ? "Saving..." : "Save Changes"}</button>
            <button type="button" onClick={() => setPublishModalOpen(true)} disabled={isSavingProduct || isUploadingImage || status === "Archived"} className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">Save & Make Visible</button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[205px_minmax(0,1fr)_285px]">
        <aside className="h-fit overflow-hidden rounded-2xl border border-[#e2e8e5] bg-white xl:sticky xl:top-[94px]">
          <label className="mb-3 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400 xl:hidden" htmlFor="product-editor-section">Editor Section</label>
          <select id="product-editor-section" value={activeEditorSection} onChange={(event) => setActiveEditorSection(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none xl:hidden">
            {editorSections.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}
          </select>
          <div className="hidden border-b border-[#edf0ee] p-4 xl:block"><div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#8a9590]">Product sections</div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf1ef]"><div className="h-full rounded-full bg-[#5f8585]" style={{ width: `${readinessPercent}%` }} /></div><div className="mt-2 flex items-center justify-between"><span className="text-[7px] text-[#929d97]">Completeness</span><b className="text-[8px] text-[#3b646d]">{readinessPercent}%</b></div></div>
          <nav className="hidden p-2 xl:block" aria-label="Product editor sections">
            {editorSections.map((section) => <button key={section.id} type="button" onClick={() => setActiveEditorSection(section.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${activeEditorSection === section.id ? "bg-[#edf3f4] text-[#3b646d]" : "text-[#65736c] hover:bg-[#f6f8f7]"}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${activeEditorSection === section.id ? "bg-white" : "bg-[#f2f5f3]"}`}>{section.icon}</span><span className="min-w-0"><b className="block text-[8.5px]">{section.label}</b><small className="mt-0.5 block truncate text-[6.5px] font-medium text-[#929d97]">{section.helper}</small></span></button>)}
          </nav>
        </aside>

        <div className="min-w-0 space-y-4">
        <div className="space-y-4">
          <div style={{ display: activeEditorSection === "basic" ? undefined : "none" }} className="overflow-hidden rounded-2xl border border-[#e2e8e5] bg-white">
            <div className="border-b border-[#edf0ee] p-5"><div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#3b646d]">Product identity</div><h2 className="mt-2 text-[17px] font-bold text-[#26362f]">General information</h2><p className="mt-1 text-[8px] text-[#82908a]">Core storefront identity and customer-facing summary.</p></div>
            <div className="space-y-4 p-5">
              <label className="block text-[8px] font-bold text-[#596861]">Product name *<input value={productName} onChange={(event) => setProductName(event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[8.5px] font-semibold text-[#405049] outline-none" placeholder="Product name" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-[8px] font-bold text-[#596861]">Product type<select value={productType} onChange={(event) => setProductType(event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[8.5px] font-semibold text-[#405049] outline-none"><option value="Single Product">Simple product</option><option value="Variant Product">Variant product</option></select></label>
                <label className="block text-[8px] font-bold text-[#596861]">Storefront slug *<div className="mt-2 flex h-10 items-center overflow-hidden rounded-xl border border-[#dce4e0] bg-white"><span className="border-r border-[#e5eae8] bg-[#fafbfa] px-3 text-[7px] text-[#929d97]">/products/</span><input value={autoSlug} readOnly className="min-w-0 flex-1 px-3 text-[8.5px] font-semibold text-[#405049] outline-none" /></div></label>
              </div>
              <label className="block text-[8px] font-bold text-[#596861]">Short description *<textarea value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} className="mt-2 min-h-20 w-full rounded-xl border border-[#dce4e0] bg-white p-3 text-[8.5px] leading-5 text-[#405049] outline-none" /></label>
              <label className="block text-[8px] font-bold text-[#596861]">Full description<textarea value={fullDescription} onChange={(event) => setFullDescription(event.target.value)} className="mt-2 min-h-40 w-full rounded-xl border border-[#dce4e0] bg-white p-3 text-[8.5px] leading-5 text-[#405049] outline-none" /></label>
            </div>
          </div>

          <div style={{ display: activeEditorSection === "organization" ? undefined : "none" }} className="overflow-hidden rounded-2xl border border-[#e2e8e5] bg-white">
            <div className="border-b border-[#edf0ee] p-5"><div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#3b646d]">Catalog placement</div><h2 className="mt-2 text-[17px] font-bold text-[#26362f]">Organization</h2><p className="mt-1 text-[8px] text-[#82908a]">Category, brand, concern and merchandising relationships.</p></div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="block text-[8px] font-bold text-[#596861]"><span className="flex items-center justify-between">Brand<button type="button" onClick={() => setBrandList((current) => current.includes("New Brand") ? current : [...current, "New Brand"])} className="text-[7px] font-bold text-[#3b646d]">+ Add Brand</button></span><select value={optionValueFor(brandId, brand)} onChange={(event) => applyCatalogSelection(event.target.value, visibleBrandOptions, setBrandId, setBrand)} className="mt-2 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[8.5px] font-semibold text-[#405049] outline-none">{visibleBrandOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="block text-[8px] font-bold text-[#596861]">Category<select value={optionValueFor(categoryId, category)} onChange={(event) => { applyCatalogSelection(event.target.value, rootCategoryOptions, setCategoryId, setCategory); setSubcategoryId(""); setSubcategory(""); }} className="mt-2 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[8.5px] font-semibold text-[#405049] outline-none">{rootCategoryOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="block text-[8px] font-bold text-[#596861]">Subcategory<select value={subcategoryId} onChange={(event) => { const nextId = event.target.value; const selected = subcategoryOptions.find((item) => String(item.id) === String(nextId)); setSubcategoryId(nextId); setSubcategory(selected?.name || ""); }} className="mt-2 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[8.5px] font-semibold text-[#405049] outline-none"><option value="">No subcategory</option>{subcategoryOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="block text-[8px] font-bold text-[#596861]">Parent SKU<input value={autoSku} readOnly className="mt-2 h-10 w-full rounded-xl border border-[#dce4e0] bg-[#fafbfa] px-3 text-[8.5px] font-semibold text-[#405049] outline-none" /></label>
              <fieldset className="sm:col-span-2"><legend className="text-[8px] font-bold text-[#596861]">Concerns</legend><div className="mt-2 grid gap-2 rounded-xl border border-[#dce4e0] bg-white p-3 sm:grid-cols-2">{visibleConcernOptions.map((item) => { const itemId = String(item.id); const persistedId = itemId.startsWith("name:") ? "" : itemId; const checked = persistedId ? concernIds.includes(persistedId) : concern === item.name; return <label className="flex items-center gap-2 rounded-lg bg-[#fafbfa] px-3 py-2 text-[8px] font-semibold text-[#596861]" key={item.id}><input checked={checked} className="h-3.5 w-3.5 accent-[#3b646d]" onChange={(event) => toggleConcern(item, event.target.checked)} type="checkbox" />{item.name}{concernId === persistedId && persistedId ? <span className="ml-auto text-[6px] font-bold uppercase text-[#3b646d]">Primary</span> : null}</label>; })}</div></fieldset>
            </div>
          </div>

          <div style={{ display: ["pricing", "inventory", "variants"].includes(activeEditorSection) ? undefined : "none" }} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-xl font-bold tracking-tight">{activeEditorSection === "inventory" ? "Inventory & Availability" : activeEditorSection === "variants" ? "Variants" : "Pricing"}</h2></div><div className="rounded-2xl border border-slate-200 bg-stone-50 p-1">{["Single Product", "Variant Product"].map((item) => <button key={item} type="button" onClick={() => { if (item === "Single Product" && isVariantProduct && variants.length && !window.confirm("Switch to single product? Existing variants will be kept and must be disabled explicitly when saving.")) return; setProductType(item); }} className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${productType === item ? "bg-[#5E7F85] text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}>{item}</button>)}</div></div>
            {!isVariantProduct ? <div className="mt-5 grid gap-4 md:grid-cols-2">{[["Regular Price", regularPrice, setRegularPrice, "Original price before discount"], ["Selling Price", salePrice, setSalePrice, "Enter the customer selling price"], ["Stock Qty", stockQty, setStockQty, "Leave blank for draft"], ["Low Stock Alert", lowStockAlert, setLowStockAlert, "Optional"]].map(([label, value, setter, helper]) => <label key={label} className="space-y-2"><div className="text-sm font-medium text-slate-600">{label}</div><input value={value} onChange={(event) => setter(event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" placeholder={String(helper)} /></label>)}</div> : <div style={{ display: activeEditorSection === "variants" ? undefined : "none" }} className="mt-5 space-y-5">
              <div className="rounded-2xl border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-4 text-sm font-semibold leading-6 text-slate-700">Use variants when the same product is sold in options like size, shade, color, volume or pack. Draft variants may stay incomplete until staff are ready to publish.</div>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-end">
                <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Option Type</div><select value={variantOptionType} onChange={(event) => setVariantOptionType(event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"><option>Size</option><option>Shade</option><option>Color</option><option>Volume</option><option>Pack</option></select></label>
                <div className="flex flex-wrap gap-3 lg:justify-end"><button type="button" onClick={addVariant} className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">{variants.length ? "+ Add Variant" : "Add First Variant"}</button></div>
              </div>
              {variants.length === 0 ? <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-stone-50 px-6 py-10 text-center"><div className="text-sm font-bold text-slate-700">No variants added yet.</div><button type="button" onClick={addVariant} className="mt-4 rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">Add First Variant</button></div> : <div className="grid gap-4 xl:grid-cols-2">{variants.map((row, rowIndex) => {
                const rowStatusLabel = row.status === "Active" ? "Visible" : row.status === "Disabled" ? "Hidden" : "Draft";
                return <div key={row.id || `${row.option}-${rowIndex}`} className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{variantOptionType || "Option"} Variant</div><h3 className="mt-1 text-lg font-bold text-slate-900">{row.option || `Variant ${rowIndex + 1}`}</h3><div className="mt-1 text-xs font-semibold text-slate-500">{rowStatusLabel}</div></div><button type="button" onClick={() => removeOrDisableVariant(rowIndex)} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700">{row.persisted ? "Hide Variant" : "Remove"}</button></div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Option Value</div><input value={row.option || ""} onChange={(event) => updateVariantField(rowIndex, "option", event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" placeholder="50ml / Natural Beige / Pack of 2" /></label>
                    <label className="space-y-2"><div className="text-sm font-medium text-slate-600">SKU</div><input value={row.sku || ""} onChange={(event) => updateVariantField(rowIndex, "sku", event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" placeholder="Auto-generated if blank" /></label>
                    <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Selling Price</div><input value={row.sale || ""} onChange={(event) => updateVariantField(rowIndex, "sale", event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" inputMode="decimal" placeholder="Customer selling price" /></label>
                    <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Regular Price</div><input value={row.regular || ""} onChange={(event) => updateVariantField(rowIndex, "regular", event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" inputMode="decimal" placeholder="Optional original price" /></label>
                    <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Stock Quantity</div><input value={row.stock || ""} onChange={(event) => updateVariantField(rowIndex, "stock", event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" inputMode="numeric" placeholder="Leave blank for draft" /></label>
                    <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Min. Qty</div><input value={row.minimumOrderQuantity || "1"} onChange={(event) => updateVariantField(rowIndex, "minimumOrderQuantity", event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" inputMode="numeric" placeholder="1" /></label>
                    <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Fulfillment Type</div><select value={row.inventoryMode || "stocked"} onChange={(event) => updateVariantField(rowIndex, "inventoryMode", event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"><option value="stocked">Stocked</option><option value="on_demand">Available on Order</option></select></label>
                    <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Customer Availability</div><select value={row.availabilityStatus || "available"} onChange={(event) => updateVariantField(rowIndex, "availabilityStatus", event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"><option value="available">Available</option><option value="unavailable">Currently Unavailable</option></select></label>
                    <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Status</div><select value={row.status || "Draft"} onChange={(event) => updateVariantField(rowIndex, "status", event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"><option value="Active">Visible</option><option value="Draft">Draft</option><option value="Disabled">Hidden</option></select></label>
                  </div>
                  <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-stone-50 p-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-bold text-slate-700">Variant Image</div><div className="mt-1 text-xs text-slate-500">Optional. Use when this option needs its own product image.</div></div><label className={`rounded-2xl px-4 py-2.5 text-xs font-bold ${isUploadingImage ? "cursor-not-allowed bg-slate-100 text-slate-400" : "cursor-pointer bg-[#5E7F85]/10 text-[#5E7F85]"}`}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleVariantImageUpload(event, rowIndex)} disabled={isUploadingImage} className="sr-only" />{row.imageUrl ? "Replace Image" : "Upload Image"}</label></div>{row.imageUrl ? <div className="mt-3 flex items-center gap-3"><img src={row.imageUrl} alt={`${row.option || "Variant"} image`} className="h-16 w-16 rounded-2xl object-cover" /><button type="button" onClick={() => updateVariantField(rowIndex, "imageUrl", "")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">Remove Image</button></div> : <div className="mt-3 text-xs font-semibold text-slate-500">No variant image uploaded.</div>}</div>
                  <details className="mt-4 rounded-[1.25rem] border border-slate-200 bg-stone-50 p-3 text-sm text-slate-600"><summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Advanced</summary><div className="mt-3 grid gap-3 md:grid-cols-2"><label className="space-y-2"><div className="text-sm font-medium text-slate-600">Purchase Cost</div><input value={row.cost || ""} onChange={(event) => updateVariantField(rowIndex, "cost", event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" inputMode="decimal" placeholder="Internal cost" /></label><label className="space-y-2"><div className="text-sm font-medium text-slate-600">Low Stock Alert</div><input value={row.lowStock || ""} onChange={(event) => updateVariantField(rowIndex, "lowStock", event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" inputMode="numeric" placeholder="Optional" /></label></div></details>
                </div>;
              })}</div>}
            </div>}
            <div style={{ display: activeEditorSection === "inventory" ? undefined : "none" }} className="mt-5 grid gap-4 md:grid-cols-3">
              <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Inventory Mode</div><select value={inventoryMode} onChange={(event) => setInventoryMode(event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"><option value="stocked">Stocked</option><option value="on_demand">Available on Order</option></select></label>
              <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Availability</div><select value={availabilityStatus} onChange={(event) => setAvailabilityStatus(event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"><option value="available">Available</option><option value="unavailable">Currently Unavailable</option></select></label>
              <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Minimum Order Quantity</div><input value={minimumOrderQuantity} onChange={(event) => setMinimumOrderQuantity(event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" inputMode="numeric" placeholder="1" /></label>
              <div className="rounded-2xl bg-stone-50 p-4 text-xs font-semibold leading-5 text-slate-600 md:col-span-3">
                {availabilityStatus === "unavailable" ? "Customers cannot order this product until availability is restored." : inventoryMode === "on_demand" ? "Customers may order while physical stock is zero. Source the item after order confirmation." : "Orders depend on physical stock."}
              </div>
            </div>
            </div>

          <div style={{ display: ["images", "content", "seo"].includes(activeEditorSection) ? undefined : "none" }} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-xl font-bold tracking-tight">{activeEditorSection === "images" ? "Media" : activeEditorSection === "seo" ? "Shipping & operations" : "Product content"}</h2></div></div>
            <div style={{ display: activeEditorSection === "seo" ? undefined : "none" }} className="mt-5 space-y-4">
              <details className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <summary className="cursor-pointer text-sm font-bold text-slate-800">Advanced product details</summary>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Purchase Cost</div><input value={costPrice} onChange={(event) => setCostPrice(event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" inputMode="decimal" placeholder="Internal purchase cost" /></label>
                  <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Shipping Weight</div><input value={weight} onChange={(event) => setWeight(event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" placeholder="Example: 250g" /></label>
                  <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Courier Cost</div><input value={courierCost} onChange={(event) => setCourierCost(event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" inputMode="decimal" placeholder="Optional internal fulfilment cost" /></label>
                </div>
                <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">Advanced fields are for internal operations only. Leave blank when the value is not known.</p>
              </details>
            </div>
            <div style={{ display: activeEditorSection === "images" ? undefined : "none" }} className="mt-5 space-y-5">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,420px)_1fr]">
                <div className={`overflow-hidden rounded-[1.7rem] border bg-white shadow-sm ${mainImageReady ? "border-emerald-200 ring-2 ring-emerald-100" : "border-slate-200"}`}>
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                    <div>
                      <div className="text-sm font-bold text-slate-900">Main Product Image</div>
                      <div className="mt-1 text-xs text-slate-500">Use a clear product image with enough space around the product.</div>
                    </div>
                    <Badge tone={mainImageReady ? "good" : "warn"}>{isUploadingImage ? "Uploading" : mainImageReady ? "Ready" : "Missing"}</Badge>
                  </div>
                  <div className="p-5">
                    <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-slate-300 bg-stone-50 text-center">
                      {imageUrl ? <img src={imageUrl} alt="Current main product image" className="h-full w-full object-cover" /> : <div className="px-6"><div className="text-sm font-bold text-slate-700">No main image uploaded.</div><div className="mt-2 text-xs leading-5 text-slate-500">Upload a clear square image for the storefront and product page.</div></div>}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <label className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white ${isUploadingImage ? "cursor-not-allowed bg-slate-300" : "cursor-pointer bg-[#5E7F85]"}`}>
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} disabled={isUploadingImage} className="sr-only" />
                        {isUploadingImage ? "Uploading..." : imageUrl ? "Replace Image" : "Upload Image"}
                      </label>
                      {imageUrl && <button type="button" disabled={isUploadingImage} onClick={() => { setMainImageFile(null); setMainImageReady(false); setImageUrl(""); showActionToast("Main image removed from this product"); }} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60">Remove Image</button>}
                    </div>
                    <div className="mt-4 rounded-2xl bg-stone-50 p-4 text-xs font-semibold leading-5 text-slate-600">Supported formats: JPG, PNG, WEBP. Maximum file size: 5MB. Recommended style: clear product photo with balanced margins.</div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900">Product Gallery</div>
                      <div className="mt-1 text-xs text-slate-500">Add supporting product images. Use Move Up and Move Down to control display order.</div>
                    </div>
                    <label className={`rounded-2xl px-4 py-2.5 text-xs font-bold ${isUploadingImage ? "cursor-not-allowed bg-slate-100 text-slate-400" : "cursor-pointer bg-[#5E7F85]/10 text-[#5E7F85]"}`}>
                      <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleGalleryImageUpload} disabled={isUploadingImage} className="sr-only" />
                      {isUploadingImage ? "Uploading..." : "Add Images"}
                    </label>
                  </div>
                  <div className="p-5">
                    {galleryImages.length === 0 ? <div className="flex min-h-40 items-center justify-center rounded-[1.4rem] border border-dashed border-slate-300 bg-stone-50 px-6 text-center text-sm font-semibold text-slate-500">No gallery images added yet.</div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{galleryImages.map((item, index) => <div key={`${item}-${index}`} className="rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="aspect-square overflow-hidden rounded-2xl bg-stone-50">{item ? <img src={item} alt={`Gallery image ${index + 1}`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center px-4 text-center text-xs font-bold text-slate-400">Gallery Image</div>}</div><div className="mt-3 flex items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-500">Image {index + 1}</span><button type="button" onClick={() => setGalleryImages((current) => current.filter((_, i) => i !== index))} className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">Remove</button></div><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" disabled={index === 0} onClick={() => moveGalleryImage(index, -1)} className="rounded-lg border border-slate-200 px-2 py-2 text-[10px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Move Up</button><button type="button" disabled={index === galleryImages.length - 1} onClick={() => moveGalleryImage(index, 1)} className="rounded-lg border border-slate-200 px-2 py-2 text-[10px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Move Down</button></div></div>)}</div>}
                  </div>
                </div>
              </div>

              <details className="rounded-[1.4rem] border border-slate-200 bg-stone-50 p-4 text-sm text-slate-600">
                <summary className="cursor-pointer text-sm font-bold text-slate-700">Advanced Details</summary>
                <div className="mt-4 space-y-3">
                  <div><div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Main image path</div><div className="mt-1 break-all rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600">{imageUrl || "Not set"}</div></div>
                  <div><div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Gallery order</div><div className="mt-1 space-y-2">{galleryImages.length ? galleryImages.map((item, index) => <div key={`${item}-raw-${index}`} className="break-all rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600">{index + 1}. {item}</div>) : <div className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-500">No gallery images added yet.</div>}</div></div>
                </div>
              </details>
            </div>            <div style={{ display: activeEditorSection === "content" ? undefined : "none" }} className="mt-5 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2"><div className="text-sm font-medium text-slate-600">How to Use</div><textarea value={howToUse} onChange={(e) => setHowToUse(e.target.value)} className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label>
                <label className="space-y-2 md:col-span-2"><div className="text-sm font-medium text-slate-600">Product Details</div><textarea value={productDetails} onChange={(e) => setProductDetails(e.target.value)} className="h-32 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label>
                <label className="space-y-2 md:col-span-2"><div className="text-sm font-medium text-slate-600">Ingredients</div><textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label>
                <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Suitable For</div><textarea value={suitableFor} onChange={(e) => setSuitableFor(e.target.value)} className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label>
                <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Warnings</div><textarea value={warnings} onChange={(e) => setWarnings(e.target.value)} className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label>
              </div>

              <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-base font-bold text-slate-900">Benefits</h3><p className="mt-1 text-xs text-slate-500">Add clear benefit notes only when they are supported by product information.</p></div><button type="button" onClick={() => addTextRow(setBenefitRows)} className="rounded-2xl bg-[#5E7F85]/10 px-4 py-2.5 text-xs font-bold text-[#5E7F85]">+ Add Benefit</button></div>
                <div className="mt-4 space-y-3">{benefitRows.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-stone-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">No benefits added yet.</div> : benefitRows.map((item, index) => <div key={`benefit-${index}`} className="rounded-2xl border border-slate-200 bg-stone-50 p-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><input value={item} onChange={(event) => updateTextRow(setBenefitRows, index, event.target.value)} className={`min-h-11 flex-1 rounded-2xl border bg-white px-4 py-2 text-sm outline-none ${item.trim() ? "border-slate-300" : "border-amber-300"}`} placeholder="Benefit text" /><div className="grid grid-cols-3 gap-2 sm:w-56"><button type="button" disabled={index === 0} onClick={() => moveTextRow(setBenefitRows, index, -1)} className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Move Up</button><button type="button" disabled={index === benefitRows.length - 1} onClick={() => moveTextRow(setBenefitRows, index, 1)} className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Move Down</button><button type="button" onClick={() => removeTextRow(setBenefitRows, index)} className="rounded-xl border border-rose-200 bg-rose-50 px-2 py-2 text-[10px] font-bold text-rose-700">Remove</button></div></div>{!item.trim() && <div className="mt-2 text-xs font-semibold text-amber-700">Empty benefit rows are skipped for drafts and must be removed before publishing.</div>}</div>)}</div>
              </div>

              <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-base font-bold text-slate-900">Key Ingredients</h3><p className="mt-1 text-xs text-slate-500">List ingredient names only. Do not add percentages or claims unless verified.</p></div><button type="button" onClick={() => addTextRow(setKeyIngredientRows)} className="rounded-2xl bg-[#5E7F85]/10 px-4 py-2.5 text-xs font-bold text-[#5E7F85]">+ Add Ingredient</button></div>
                <div className="mt-4 space-y-3">{keyIngredientRows.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-stone-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">No key ingredients added yet.</div> : keyIngredientRows.map((item, index) => <div key={`ingredient-${index}`} className="rounded-2xl border border-slate-200 bg-stone-50 p-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><input value={item} onChange={(event) => updateTextRow(setKeyIngredientRows, index, event.target.value)} className={`min-h-11 flex-1 rounded-2xl border bg-white px-4 py-2 text-sm outline-none ${item.trim() ? "border-slate-300" : "border-amber-300"}`} placeholder="Ingredient name" /><div className="grid grid-cols-3 gap-2 sm:w-56"><button type="button" disabled={index === 0} onClick={() => moveTextRow(setKeyIngredientRows, index, -1)} className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Move Up</button><button type="button" disabled={index === keyIngredientRows.length - 1} onClick={() => moveTextRow(setKeyIngredientRows, index, 1)} className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Move Down</button><button type="button" onClick={() => removeTextRow(setKeyIngredientRows, index)} className="rounded-xl border border-rose-200 bg-rose-50 px-2 py-2 text-[10px] font-bold text-rose-700">Remove</button></div></div>{!item.trim() && <div className="mt-2 text-xs font-semibold text-amber-700">Empty ingredient rows are skipped for drafts and must be removed before publishing.</div>}</div>)}</div>
              </div>
            </div>
          <div style={{ display: activeEditorSection === "seo" ? undefined : "none" }} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold tracking-tight">SEO Settings</h2><p className="mt-2 text-sm leading-6 text-slate-500">Leave these blank to use the storefront fallback from the product name and description.</p><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="space-y-2 md:col-span-2"><div className="text-sm font-medium text-slate-600">SEO Title</div><input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" placeholder={seoTitleText} /><p className="text-xs font-semibold text-slate-500">Shown in search results and browser tabs.</p></label><label className="space-y-2 md:col-span-2"><div className="text-sm font-medium text-slate-600">Meta Description</div><textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" placeholder={metaDescriptionText} /><p className="text-xs font-semibold text-slate-500">Short summary that may appear in search results.</p></label><label className="space-y-2 md:col-span-2"><div className="text-sm font-medium text-slate-600">URL Slug</div><input value={autoSlug} readOnly className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none" /><p className="text-xs font-semibold text-slate-500">Generated from the product name and used in the product page URL.</p></label></div></div>
        </div>

        <div style={{ display: ["seo", "content"].includes(activeEditorSection) ? undefined : "none" }} className="space-y-6"><div style={{ display: activeEditorSection === "seo" ? undefined : "none" }} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-xl font-bold tracking-tight">Visibility & Publish</h2><p className="mt-2 text-sm leading-6 text-slate-500">Choose whether this product is a draft, visible to customers, or hidden from the website.</p></div><Badge tone={publishBlocked ? "warn" : "good"}>{publishBlocked ? "Needs work" : "Ready"}</Badge></div><div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]"><label className="space-y-2"><div className="text-sm font-medium text-slate-600">Visibility</div><select value={status} onChange={(e) => setStatus(e.target.value)} disabled={status === "Archived"} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none disabled:bg-stone-100 disabled:text-slate-500"><option>Draft</option><option>Visible</option><option>Hidden</option>{status === "Archived" ? <option>Archived</option> : null}</select></label><div className="rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-slate-600"><div><b>Draft:</b> Saved but not visible to customers.</div><div><b>Visible:</b> Shown on the website when all required information is complete.</div><div><b>Hidden:</b> Saved but temporarily hidden from customers.</div>{status === "Archived" ? <div><b>Archived:</b> Removed from the normal catalog view.</div> : null}</div></div><div className="mt-5 space-y-3">{publishChecks.map((check) => <div key={check.label} className={check.ok ? "rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" : "rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700"}>{check.ok ? "Ready" : "Needs work"}: {check.label}</div>)}</div></div>
                    <div style={{ display: activeEditorSection === "content" ? undefined : "none" }} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold tracking-tight">FAQ</h2><p className="mt-1 text-sm text-slate-500">Add customer questions and clear answers. Fully blank rows are skipped.</p></div><button type="button" onClick={addFaqRow} className="rounded-2xl bg-[#5E7F85]/10 px-4 py-2.5 text-xs font-bold text-[#5E7F85]">+ Add FAQ</button></div>
            <div className="mt-5 space-y-4">{faqRows.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-stone-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">No FAQs added yet.</div> : faqRows.map((faq, index) => <div key={`faq-${index}`} className="rounded-[1.5rem] border border-slate-200 bg-stone-50 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h3 className="text-sm font-bold text-slate-900">FAQ {index + 1}</h3><div className="grid grid-cols-3 gap-2 sm:w-56"><button type="button" disabled={index === 0} onClick={() => moveFaqRow(index, -1)} className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Move Up</button><button type="button" disabled={index === faqRows.length - 1} onClick={() => moveFaqRow(index, 1)} className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Move Down</button><button type="button" onClick={() => removeFaqRow(index)} className="rounded-xl border border-rose-200 bg-rose-50 px-2 py-2 text-[10px] font-bold text-rose-700">Remove</button></div></div><label className="mt-4 block space-y-2"><div className="text-sm font-medium text-slate-600">Question</div><input value={faq.question} onChange={(event) => updateFaqRow(index, "question", event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label><label className="mt-4 block space-y-2"><div className="text-sm font-medium text-slate-600">Answer</div><textarea value={faq.answer} onChange={(event) => updateFaqRow(index, "answer", event.target.value)} className={`h-24 w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none ${faq.question.trim() && !faq.answer.trim() ? "border-amber-300" : "border-slate-300"}`} /></label>{faq.question.trim() && !faq.answer.trim() && <div className="mt-2 text-xs font-semibold text-amber-700">Add an answer before making this product visible.</div>}</div>)}</div>
          </div>
        </div>
      </div>
      </div>

      {publishModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><div className="text-sm font-medium text-slate-500">Visibility Check</div><h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Make Product Visible?</h3></div><button type="button" onClick={() => setPublishModalOpen(false)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">X</button></div><div className="mt-6 grid gap-3">{publishChecks.map((check) => <div key={check.label} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${check.ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{check.ok ? "Ready:" : "Needs work:"} {check.label}</div>)}</div><div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setPublishModalOpen(false)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Cancel</button><button type="button" disabled={isSavingProduct || isUploadingImage} onClick={() => { if (isUploadingImage) { showActionToast("Wait for image upload to finish"); return; } if (publishBlocked) { showActionToast("Complete the required information before making this product visible."); setPublishModalOpen(false); } else { setPublishModalOpen(false); saveProductToBackend("Visible"); } }} className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">{isSavingProduct ? "Saving..." : isUploadingImage ? "Uploading image..." : "Save & Make Visible"}</button></div></div></div>}
      <aside className="h-fit space-y-4 xl:sticky xl:top-[94px]">
        <section className="rounded-2xl border border-[#e2e8e5] bg-white p-4">
          <div className="flex items-start justify-between gap-4"><div><div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#8a9590]">Product readiness</div><div className="mt-2 text-[13px] font-bold text-[#394841]">{readinessPercent}% complete</div></div><span className={`flex h-10 w-10 items-center justify-center rounded-xl text-[9px] font-bold ${publishBlocked ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{publishChecks.length - completedPublishChecks}</span></div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf1ef]"><div className="h-full rounded-full bg-[#5f8585]" style={{ width: `${readinessPercent}%` }} /></div>
          <p className="mt-3 text-[7px] leading-4 text-[#89958f]">{publishBlocked ? "Complete the remaining required information before publishing." : "All required publication checks passed."}</p>
          <div className="mt-4 max-h-52 space-y-1.5 overflow-y-auto pr-1">{publishChecks.map((check) => <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[7.5px] font-semibold text-[#68766f] hover:bg-[#f7f9f8]" key={check.label} onClick={() => setActiveEditorSection(check.label === "Main image" ? "images" : check.label.includes("Price") || check.label.includes("Stock") ? "pricing" : check.label.includes("variant") ? "variants" : "basic")} type="button"><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${check.ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{check.ok ? "✓" : "!"}</span><span>{check.label}</span></button>)}</div>
        </section>

        <section className="rounded-2xl border border-[#d8e4e1] bg-[#edf3f4] p-4">
          <div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#6b827b]">Storefront result</div>
          <div className="mt-3 rounded-xl bg-white p-3"><div className="text-[7px] text-[#929d97]">Selling price</div><div className="mt-2 text-[16px] font-bold text-[#34453e]">{previewSalePrice ? `Tk ${previewSalePrice}` : "Price pending"}</div><div className="mt-1 text-[7px] text-[#8a9791]">{status === "Visible" ? "Visible on website" : "Visible when published"} · {previewStockQty || 0} in stock</div></div>
          <button className="mt-3 flex h-10 w-full items-center justify-center rounded-xl border border-[#dce4e0] bg-white text-[8.5px] font-bold text-[#54736e]" onClick={() => window.open(storefrontProductUrl, "_blank", "noopener,noreferrer")} type="button">◉&nbsp;&nbsp;Preview customer view</button>
        </section>

        <section className="rounded-2xl border border-[#e2e8e5] bg-white p-4">
          <div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#8a9590]">Operational ownership</div>
          <div className="mt-3 space-y-2">{[["Stock movement", "Inventory"], ["Offers & discounts", "Offers & Deals"], ["Homepage placement", "Homepage CMS"], ["Profit reporting", "Finance"]].map(([label, owner]) => <div className="flex items-center justify-between gap-3 rounded-lg bg-[#fafbfa] px-3 py-2.5" key={label}><span className="text-[7px] font-semibold text-[#718079]">{label}</span><b className="text-[6.5px] text-[#557771]">{owner}</b></div>)}</div>
        </section>
      </aside>
      </div>
    </div>
    </ProductEditorFrame>
  );
}
