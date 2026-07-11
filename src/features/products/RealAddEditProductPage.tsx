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

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type RealAddEditProductPageProps = {
  brands?: unknown;
  categories?: unknown;
  concerns?: unknown;
  product?: unknown;
};

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
  const icons = ["▥", "☷", "৳", "▸"];
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
  const [status, setStatus] = useState(readProductField(editingProduct, ["status"], "Draft") === "active" ? "Published" : "Draft");
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
  const [costPrice, setCostPrice] = useState(readProductField(editingProduct, ["purchase_cost", "cost_price", "cost"], "420"));
  const [regularPrice, setRegularPrice] = useState(readProductField(editingProduct, ["price", "regular_price"], "1290"));
  const [salePrice, setSalePrice] = useState(readProductField(editingProduct, ["sale_price", "price"], "990"));
  const [stockQty, setStockQty] = useState(readProductField(editingProduct, ["stock_quantity", "stock", "quantity"], "24"));
  const [lowStockAlert, setLowStockAlert] = useState(readProductField(editingProduct, ["low_stock_threshold", "low_stock_limit", "reorder_level"], "6"));
  const [weight, setWeight] = useState("100");
  const [courierCost, setCourierCost] = useState("80");
  const [duplicateCheck, setDuplicateCheck] = useState(true);
  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [ignoredDuplicates, setIgnoredDuplicates] = useState(false);
  const [actionToast, setActionToast] = useState("");
  const [variants, setVariants] = useState([]);
  const [variantDraft, setVariantDraft] = useState({ option: "", sku: "", cost: "", regular: "", sale: "", stock: "", lowStock: "", status: "Active" });
  const [mainImageReady, setMainImageReady] = useState(false);
  const [mainImageFile, setMainImageFile] = useState(null);
  const [galleryImages, setGalleryImages] = useState(splitLines(readAttribute(editingProduct, ["gallery_images", "gallery", "images"], "Angle 1\nTexture\nBox\nRoutine")));
  const [imageUrl, setImageUrl] = useState(readProductField(editingProduct, ["image_url", "image"], ""));
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [productLabel, setProductLabel] = useState("Bestseller");
  const [productBadge, setProductBadge] = useState("Authentic Product");
  const [shortDescription, setShortDescription] = useState(readProductField(editingProduct, ["short_description"], ""));
  const [fullDescription, setFullDescription] = useState(readProductField(editingProduct, ["description"], ""));
  const [howToUse, setHowToUse] = useState(readAttribute(editingProduct, ["how_to_use", "howToUse", "usage"], ""));
  const [ingredients, setIngredients] = useState(readAttribute(editingProduct, ["ingredients", "ingredient_list"], ""));
  const [productDetails, setProductDetails] = useState(readAttribute(editingProduct, ["benefits", "product_details"], ""));
  const [suitableFor, setSuitableFor] = useState(readAttribute(editingProduct, ["suitable_for"], "Oily / Acne Prone"));
  const [warnings, setWarnings] = useState(readAttribute(editingProduct, ["warnings"], ""));
  const [keyIngredients, setKeyIngredients] = useState(readAttribute(editingProduct, ["key_ingredients"], ""));
  const [faqText, setFaqText] = useState(readFaqText(editingProduct));
  const [visibleResultTitle, setVisibleResultTitle] = useState("Visible Results");
  const [visibleResultBullets, setVisibleResultBullets] = useState(`Skin feels less oily within first few uses\nHelps reduce clogged pores\nSupports a cleaner daily routine`);
  const [trustBadges, setTrustBadges] = useState(["100% Authentic", "Verified Seller", "COD Available", "Fast Delivery"]);
  const [skinType, setSkinType] = useState("Oily / Acne Prone");
  const [routineStep, setRoutineStep] = useState("Cleanser");
  const [routineTime, setRoutineTime] = useState("AM + PM");
  const [routineFrequency, setRoutineFrequency] = useState("Daily");
  const [productFaqs, setProductFaqs] = useState([
    { id: 1, question: "Is this product suitable for daily use?", answer: "Yes, follow the usage direction and patch test before first use." },
    { id: 2, question: "Can sensitive skin use this product?", answer: "Sensitive skin users should patch test first and start slowly." },
  ]);
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
  const isVariantProduct = productType === "Variant Product";
  const selectedVariant = variants[0];
  const previewSalePrice = isVariantProduct ? (selectedVariant?.sale || "") : salePrice;
  const previewRegularPrice = isVariantProduct ? (selectedVariant?.regular || "") : regularPrice;
  const previewCostPrice = isVariantProduct ? (selectedVariant?.cost || "") : costPrice;
  const previewStockQty = isVariantProduct ? String(variants.reduce((sum, item) => sum + Number(item.stock || 0), 0)) : stockQty;
  const netProfit = Math.max((Number(previewSalePrice) || 0) - (Number(previewCostPrice) || 0) - (Number(courierCost) || 0), 0);
  const margin = Number(previewSalePrice) > 0 ? Math.round((netProfit / Number(previewSalePrice)) * 100) : 0;
  const discount = Number(previewRegularPrice) > 0 ? Math.max(Math.round(((Number(previewRegularPrice) - Number(previewSalePrice)) / Number(previewRegularPrice)) * 100), 0) : 0;
  const seoTitleText = seoTitle || `${productName || "Product Name Preview"} | BrandnBeauty`;
  const metaDescriptionText = metaDescription || `Buy authentic ${brand} ${productName || "product"} in Bangladesh. Best price, COD and fast delivery available.`;
  const duplicateProducts = productName.length > 2 && duplicateCheck && !ignoredDuplicates ? ["Acne Control Facewash", "Acne Balance Facewash"] : [];
  const contentItems = [productName, mainImageReady, galleryImages.length >= 3, shortDescription, fullDescription, howToUse, ingredients, seoTitle, productDetails, skinType, routineStep, productFaqs.length > 0];
  const contentScore = Math.round((contentItems.filter(Boolean).length / contentItems.length) * 100);
  const publishChecks = [
    { label: "Product name", ok: Boolean(productName) },
    { label: "At least one valid variant", ok: !isVariantProduct || variants.length > 0 },
    { label: "Sale price", ok: Number(previewSalePrice) > 0 },
    { label: "Stock or variant stock", ok: Number(previewStockQty) > 0 || stockRule !== "Sellable" },
    { label: "Main image", ok: mainImageReady },
    { label: "Short description", ok: Boolean(shortDescription) },
    { label: "SEO title", ok: Boolean(seoTitle) },
  ];
  const publishBlocked = publishChecks.some((item) => !item.ok);

  const showActionToast = (message) => {
    setActionToast(message);
    setTimeout(() => setActionToast(""), 2200);
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
    const productId = params.get("id");

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
        setRegularPrice(readProductField(product, ["price", "regular_price"], regularPrice));
        setSalePrice(readProductField(product, ["sale_price", "price"], salePrice));
        setStockQty(readProductField(product, ["stock_quantity", "stock", "quantity"], stockQty));
        setLowStockAlert(readProductField(product, ["low_stock_threshold", "low_stock_limit", "reorder_level"], lowStockAlert));
        setProductType(product.product_type === "variant" ? "Variant Product" : "Single Product");
        setVariants(Array.isArray(product.variants) ? product.variants.map((variant) => ({
          id: variant.id,
          option: variant.option_value || variant.variant_name || "",
          sku: variant.sku || "",
          cost: String(variant.cost_price ?? ""), regular: String(variant.regular_price ?? ""),
          sale: String(variant.sale_price ?? ""), stock: String(variant.stock_quantity ?? "0"),
          lowStock: String(variant.low_stock_threshold ?? "0"),
          status: variant.status === "active" ? "Active" : variant.status === "inactive" ? "Disabled" : "Draft",
        })) : []);
        setImageUrl(readProductField(product, ["image_url", "image"], ""));
        setMainImageReady(Boolean(readProductField(product, ["image_url", "image"], "")));
        setShortDescription(readProductField(product, ["short_description"], ""));
        setFullDescription(readProductField(product, ["description"], ""));
        setHowToUse(readAttribute(product, ["how_to_use", "howToUse", "usage"], ""));
        setIngredients(readAttribute(product, ["ingredients", "ingredient_list"], ""));
        setProductDetails(readAttribute(product, ["benefits", "product_details"], ""));
        setSuitableFor(readAttribute(product, ["suitable_for"], "Oily / Acne Prone"));
        setWarnings(readAttribute(product, ["warnings"], ""));
        setKeyIngredients(readAttribute(product, ["key_ingredients"], ""));
        setFaqText(readFaqText(product));
        const loadedGallery = splitLines(readAttribute(product, ["gallery_images", "gallery", "images"], ""));
        if (loadedGallery.length) {
          setGalleryImages(loadedGallery);
        }
        setStatus(readProductField(product, ["status"], "draft") === "active" ? "Published" : "Draft");
        setSaveStatus("Loaded from catalog");
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

    if (!productName.trim()) {
      showActionToast("Product name is required");
      return;
    }

    if (!previewSalePrice || Number(previewSalePrice) < 0) {
      showActionToast("Sale price must be valid");
      return;
    }

    if (!previewStockQty || Number(previewStockQty) < 0 || !Number.isInteger(Number(previewStockQty))) {
      showActionToast("Stock quantity must be a whole number");
      return;
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
      benefits: splitLines(productDetails),
      faq: parseFaqText(faqText || productFaqs.map((faq) => `${faq.question} | ${faq.answer}`).join("\n")),
      gallery_images: splitLines(galleryImages.join("\n")),
      how_to_use: howToUse,
      image_url: imageUrl,
      ingredients,
      key_ingredients: splitLines(keyIngredients),
      low_stock_threshold: String(lowStockAlert || "0"),
      product_type: isVariantProduct ? "variant" : "single",
      sku: readProductField(loadedProduct || editingProduct, ["sku"], autoSku),
      variants: isVariantProduct ? variants.map((variant) => ({
        id: variant.id,
        variant_name: variant.option,
        option_name: "Option",
        option_value: variant.option,
        sku: variant.sku,
        cost_price: variant.cost || "0",
        regular_price: variant.regular,
        sale_price: variant.sale || null,
        stock_quantity: variant.stock,
        low_stock_threshold: variant.lowStock || "0",
        status: variant.status === "Active" ? "active" : variant.status === "Disabled" ? "inactive" : "draft",
      })) : [],
      name: productName.trim(),
      product_name: productName.trim(),
      price: String(previewSalePrice),
      purchase_cost: String(previewCostPrice || "0"),
      sale_price: String(previewSalePrice || "0"),
      status: nextStatus === "Published" ? "active" : "draft",
      stock: String(previewStockQty),
      stock_quantity: String(previewStockQty),
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

      setStatus(nextStatus === "Published" ? "Published" : "Draft");
      setSaveStatus(nextStatus === "Published" ? "Published just now" : "Saved just now");
      showActionToast(result.message || "Product saved successfully");
      router.refresh();
      router.push("/products");
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

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setMainImageFile(null);
      setMainImageReady(false);
      setImageUrl("");
      showActionToast("Main image removed");
      return;
    }

    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      event.target.value = "";
      showActionToast("Image is too large. Maximum size is 5MB.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      event.target.value = "";
      showActionToast("Only JPG, PNG, and WEBP images are allowed.");
      return;
    }

    setMainImageFile(file);
    setMainImageReady(false);
    setIsUploadingImage(true);
    showActionToast("Uploading main image...");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(UPLOAD_MEDIA_ENDPOINT, {
        body: formData,
        headers: adminAuthHeaders(),
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok || !data.success || !data.image_url) {
        throw new Error(data.message || "Image upload failed.");
      }

      setImageUrl(data.image_url);
      setMainImageReady(true);
      showActionToast("Main image uploaded successfully");
    } catch (error) {
      setMainImageFile(null);
      setMainImageReady(false);
      setImageUrl("");
      event.target.value = "";
      showActionToast(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const generateAutomationContent = () => {
    const cleanName = productName || `${brand} ${subcategory}`;
    setShortDescription(`${cleanName} is a ${routineStep.toLowerCase()} step product for ${concern.toLowerCase()} focused daily skincare routines.`);
    setFullDescription(`${cleanName} helps customers build a simple, consistent routine for ${concern.toLowerCase()} concern. It is positioned for ${aiTargetCustomer.toLowerCase()} with clear usage guidance, trust-focused product information and conversion-friendly PDP content.`);
    setProductDetails(`Best for: ${skinType}. Routine step: ${routineStep}. Use time: ${routineTime}. Frequency: ${routineFrequency}. Designed to support a clean, practical and easy-to-follow skincare routine.`);
    setSuitableFor(skinType);
    setWarnings("Patch test before first use. Stop use if irritation occurs. Avoid direct contact with eyes.");
    setKeyIngredients(ingredients || "Niacinamide\nGlycerin\nSkin-supporting actives");
    setHowToUse(`Use as the ${routineStep.toLowerCase()} step in your routine. Apply as directed, then follow with the next routine step. Use ${routineTime.toLowerCase()} • ${routineFrequency.toLowerCase()}. Patch test before first use.`);
    setIngredients(ingredients || "Add INCI ingredient list here. Keep ingredient names clean, comma-separated and packaging-safe.");
    setVisibleResultBullets(`Skin feels cleaner and more comfortable\nSupports ${concern.toLowerCase()} focused routine\nHelps maintain a more consistent skincare habit`);
    setProductFaqs([
      { id: 1, question: `How do I use ${cleanName}?`, answer: `Use it as the ${routineStep.toLowerCase()} step. Follow the usage direction and patch test before first use.` },
      { id: 2, question: `Is ${cleanName} suitable for ${skinType.toLowerCase()}?`, answer: `It is positioned for ${skinType.toLowerCase()} users, but sensitive skin users should patch test first.` },
      { id: 3, question: "When should I use it?", answer: `Recommended use time: ${routineTime}. Frequency: ${routineFrequency}.` },
    ]);
    setFaqText(`How do I use ${cleanName}? | Use it as the ${routineStep.toLowerCase()} step. Follow the usage direction and patch test before first use.\nIs ${cleanName} suitable for ${skinType.toLowerCase()}? | It is positioned for ${skinType.toLowerCase()} users, but sensitive skin users should patch test first.\nWhen should I use it? | Recommended use time: ${routineTime}. Frequency: ${routineFrequency}.`);
    setSeoTitle(`${cleanName} Price in Bangladesh | BrandnBeauty`);
    setMetaDescription(`Buy authentic ${cleanName} in Bangladesh from BrandnBeauty. Suitable for ${concern.toLowerCase()} focused skincare routines with COD and fast delivery.`);
    setFocusKeyword(`${cleanName.toLowerCase()} ${category.toLowerCase()} bangladesh`);
    setSaveStatus("Unsaved changes");
    showActionToast("AI-ready product content generated for review");
  };

  const addVariant = () => {
    const option = variantDraft.option.trim();
    if (!option) {
      showActionToast("Variant option name is required");
      return;
    }
    const nextVariant = {
      id: Date.now(),
      option,
      sku: variantDraft.sku.trim() || `${readProductField(loadedProduct || editingProduct, ["sku"], autoSku)}-${variants.length + 1}`,
      cost: variantDraft.cost || costPrice,
      regular: variantDraft.regular || regularPrice,
      sale: variantDraft.sale || salePrice,
      stock: variantDraft.stock || "0",
      lowStock: variantDraft.lowStock || lowStockAlert,
      status: variantDraft.status || "Active",
    };
    setVariants((current) => [...current, nextVariant]);
    setVariantDraft({ option: "", sku: "", cost: "", regular: "", sale: "", stock: "", lowStock: "", status: "Active" });
    showActionToast("Variant row added");
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
    <AdminShell>
      <div className="space-y-6">
        {actionToast && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">✅ {actionToast}</div>}

      <div className="sticky top-3 z-20 rounded-[1.6rem] border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#5E7F85]">Product Editor</div>
            <div className="mt-1 text-sm font-semibold text-slate-600">{productName || "New Product Draft"} • {isVariantProduct ? `${variants.length} variants` : autoSku}</div>
            <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${saveStatus.includes("Saved") || saveStatus.includes("Published") ? "bg-emerald-50 text-emerald-700" : saveStatus.includes("Saving") ? "bg-amber-50 text-amber-700" : "bg-stone-100 text-slate-600"}`}>{saveStatus}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={saveDraft} disabled={isSavingProduct || isUploadingImage} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60">{isSavingProduct ? "Saving..." : isUploadingImage ? "Uploading image..." : "Save Draft"}</button>
            <button type="button" disabled className="cursor-not-allowed rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-400">Preview coming later</button>
            <button type="button" onClick={() => setPublishModalOpen(true)} disabled={isSavingProduct || isUploadingImage} className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">Publish</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[["SEO Score", "82/100", "Need meta polish"], ["Net Profit", `৳${netProfit}`, "After cost + courier"], ["Images", `${galleryImages.length} Ready`, "Gallery prepared"], ["Margin", `${margin}%`, isVariantProduct ? "Based on default variant" : "Live calculation"]].map((item, index) => <StatCard key={item[0]} item={item} index={index} active={item[0] === "Margin"} />)}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold tracking-tight">Product Master Form</h2><Badge tone="brand">Ultra Build</Badge></div>
            {duplicateProducts.length > 0 && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><b>Similar products found:</b> {duplicateProducts.join(" • ")}</div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => showActionToast("Similar products preview opened")} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-amber-800 shadow-sm">View Similar</button><button type="button" onClick={() => { setIgnoredDuplicates(true); showActionToast("Duplicate warning ignored for this draft"); }} className="rounded-xl border border-amber-200 bg-amber-100/60 px-3 py-2 text-xs font-bold text-amber-800">Ignore</button></div></div></div>}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Product Name</div><input value={productName} onChange={(event) => setProductName(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" placeholder="Product Name" /></label>
              <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Slug (auto)</div><input value={autoSlug} readOnly className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none" /></label>
              <label className="space-y-2"><div className="flex items-center justify-between gap-2"><div className="text-sm font-medium text-slate-600">Parent SKU</div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">AUTO GENERATED</span></div><input disabled placeholder="Auto-generated Number" className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 outline-none disabled:opacity-100" /></label>
              <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Barcode (optional)</div><input className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" placeholder="Barcode (optional)" /></label>
              <label className="space-y-2"><div className="flex items-center justify-between gap-2"><div className="text-sm font-medium text-slate-600">Brand</div><button type="button" onClick={() => setBrandList((current) => current.includes("New Brand") ? current : [...current, "New Brand"])} className="text-xs font-bold text-[#5E7F85]">+ Add Brand</button></div><select value={optionValueFor(brandId, brand)} onChange={(event) => applyCatalogSelection(event.target.value, visibleBrandOptions, setBrandId, setBrand)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">{visibleBrandOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Category</div><select value={optionValueFor(categoryId, category)} onChange={(event) => { applyCatalogSelection(event.target.value, rootCategoryOptions, setCategoryId, setCategory); setSubcategoryId(""); setSubcategory(""); }} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">{rootCategoryOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Subcategory</div><select value={subcategoryId} onChange={(event) => { const nextId = event.target.value; const selected = subcategoryOptions.find((item) => String(item.id) === String(nextId)); setSubcategoryId(nextId); setSubcategory(selected?.name || ""); }} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"><option value="">No subcategory</option>{subcategoryOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <fieldset className="space-y-2 md:col-span-2"><legend className="text-sm font-medium text-slate-600">Concerns</legend><div className="grid gap-2 rounded-2xl border border-slate-300 bg-white p-3 sm:grid-cols-2">{visibleConcernOptions.map((item) => { const itemId = String(item.id); const persistedId = itemId.startsWith("name:") ? "" : itemId; const checked = persistedId ? concernIds.includes(persistedId) : concern === item.name; return <label className="flex items-center gap-3 rounded-xl bg-stone-50 px-3 py-2 text-sm font-medium text-slate-700" key={item.id}><input checked={checked} className="h-4 w-4 rounded border-slate-300 text-[#5E7F85]" onChange={(event) => toggleConcern(item, event.target.checked)} type="checkbox" />{item.name}{concernId === persistedId && persistedId ? <span className="ml-auto text-[10px] font-bold uppercase text-[#5E7F85]">Primary</span> : null}</label>; })}</div></fieldset>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-xl font-bold tracking-tight">Pricing & Inventory</h2></div><div className="rounded-2xl border border-slate-200 bg-stone-50 p-1">{["Single Product", "Variant Product"].map((item) => <button key={item} type="button" onClick={() => { if (item === "Single Product" && isVariantProduct && variants.length && !window.confirm("Switch to single product? Existing variants will be kept and must be disabled explicitly when saving.")) return; setProductType(item); }} className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${productType === item ? "bg-[#5E7F85] text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}>{item}</button>)}</div></div>
            {!isVariantProduct ? <div className="mt-5 grid gap-4 md:grid-cols-2">{[["Cost Price", costPrice, setCostPrice], ["Regular Price", regularPrice, setRegularPrice], ["Sale Price", salePrice, setSalePrice], ["Stock Qty", stockQty, setStockQty], ["Low Stock Alert", lowStockAlert, setLowStockAlert], ["Weight (gm/ml)", weight, setWeight], ["Avg Courier Cost", courierCost, setCourierCost]].map(([label, value, setter]) => <label key={label} className="space-y-2"><div className="text-sm font-medium text-slate-600">{label}</div><input value={value} onChange={(event) => setter(event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" placeholder={label} /></label>)}</div> : <div className="mt-5 space-y-5"><div className="rounded-2xl border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-4 text-sm font-semibold leading-6 text-slate-700">Variants are saved with the product. New variant products start empty and cannot be published until a valid row is added.</div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{["option", "sku", "cost", "regular", "sale", "stock", "lowStock"].map((key) => <label key={key} className="space-y-2"><div className="text-sm font-medium capitalize text-slate-600">{key === "lowStock" ? "Low Stock" : key}</div><input value={variantDraft[key]} onChange={(event) => setVariantDraft((current) => ({ ...current, [key]: event.target.value }))} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" placeholder={key === "option" ? "30ml / Red / Combo" : key === "sku" ? "Auto-generated if blank" : key} /></label>)}<label className="space-y-2"><div className="text-sm font-medium text-slate-600">Status</div><select value={variantDraft.status} onChange={(event) => setVariantDraft((current) => ({ ...current, status: event.target.value }))} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"><option>Active</option><option>Draft</option><option>Disabled</option></select></label></div><button type="button" onClick={addVariant} className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">+ Add Variant</button><div className="overflow-x-auto rounded-2xl border border-slate-200"><table className="min-w-full text-left text-sm"><TableHead><tr>{["Variant", "SKU", "Cost", "Regular", "Sale", "Stock", "Low", "Status", "Action"].map((head) => <th key={head} className="px-4 py-3 font-medium">{head}</th>)}</tr></TableHead><tbody>{variants.map((row, rowIndex) => <tr key={row.id || row.sku} className="border-t border-slate-100 hover:bg-stone-50">{["option", "sku", "cost", "regular", "sale", "stock", "lowStock"].map((field) => <td key={field} className="px-2 py-2"><input value={row[field]} onChange={(event) => setVariants((current) => current.map((item, index) => index === rowIndex ? { ...item, [field]: event.target.value } : item))} className="w-24 rounded-lg border border-slate-200 px-2 py-1" /></td>)}<td className="px-2 py-2"><select value={row.status} onChange={(event) => setVariants((current) => current.map((item, index) => index === rowIndex ? { ...item, status: event.target.value } : item))} className="rounded-lg border border-slate-200 px-2 py-1"><option>Active</option><option>Draft</option><option>Disabled</option></select></td><td className="px-2 py-2"><button type="button" onClick={() => setVariants((current) => current.filter((_, index) => index !== rowIndex))} className="text-xs font-bold text-rose-600">Delete</button></td></tr>)}</tbody></table></div></div>}
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">{[[isVariantProduct ? "Variant Stock" : "Stock", previewStockQty || "0"], ["Default Sale", `৳${previewSalePrice || 0}`], ["Stock Value", `৳${((Number(previewSalePrice) || 0) * (Number(previewStockQty) || 0)).toLocaleString()}`], ["Net Profit", `৳${netProfit}`], ["Discount", `${discount}%`]].map(([label, value]) => <div key={label} className="rounded-2xl bg-stone-50 p-4"><div className="text-xs font-semibold text-slate-500">{label}</div><div className="mt-1 text-lg font-bold text-slate-900">{value}</div></div>)}</div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-xl font-bold tracking-tight">Content & Media</h2></div><div className="flex items-center gap-3 rounded-2xl bg-stone-50 px-4 py-3"><div className="h-2.5 w-28 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[#5E7F85]" style={{ width: `${contentScore}%` }} /></div><b className="text-sm text-[#5E7F85]">{contentScore}%</b></div></div>
            <div className="mt-5 rounded-[1.7rem] border border-[#5E7F85]/15 bg-gradient-to-br from-[#5E7F85]/10 via-white to-stone-50 p-5 shadow-sm"><div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-black text-slate-900">Content Draft Helper</h3><Badge tone="warn">Local draft only</Badge></div><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Draft product content in the form fields. This is not connected to an AI service, and staff must review copy before publishing.</p></div><button type="button" onClick={generateAutomationContent} className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm">Fill draft copy</button></div><div className="mt-5 grid gap-3 md:grid-cols-3"><label className="space-y-2"><div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Draft Mode</div><select value={aiContentMode} onChange={(event) => setAiContentMode(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none"><option>Conversion + SEO</option><option>SEO Only</option><option>PDP Content Only</option><option>FAQ + Routine Only</option></select></label><label className="space-y-2"><div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Language Style</div><select value={aiContentLanguage} onChange={(event) => setAiContentLanguage(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none"><option>English + Bangla Friendly</option><option>English Only</option><option>Bangla + English Mix</option></select></label><label className="space-y-2"><div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Target Customer</div><input value={aiTargetCustomer} onChange={(event) => setAiTargetCustomer(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none" /></label></div></div>
            <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_340px]"><div className="space-y-5"><div className={`overflow-hidden rounded-[1.7rem] border bg-white shadow-sm ${mainImageReady ? "border-emerald-200 ring-2 ring-emerald-100" : "border-slate-200"}`}><div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><div className="text-sm font-bold text-slate-900">Main Image</div><div className="mt-1 text-xs text-slate-500">Large square product preview for storefront and PDP hero.</div></div><Badge tone={mainImageReady ? "good" : "warn"}>{isUploadingImage ? "Uploading" : mainImageReady ? "Ready" : "Missing"}</Badge></div><div className="p-5"><div className={`group relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed text-center transition ${mainImageReady ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-stone-50 hover:border-[#5E7F85]/40 hover:bg-[#5E7F85]/5"}`}><div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-600 shadow-sm">1:1 Preview</div><div className="flex h-20 w-20 items-center justify-center rounded-[1.4rem] bg-white text-3xl text-[#5E7F85] shadow-sm">▧</div><div className="mt-5 text-base font-bold text-slate-900">{mainImageFile ? mainImageFile.name : "Drop main product image here"}</div>{imageUrl && <div className="mt-2 max-w-xs truncate rounded-full bg-white px-3 py-1 text-[11px] font-bold text-emerald-700">{imageUrl}</div>}<div className="mt-2 max-w-xs text-xs leading-5 text-slate-500">Use JPG, PNG, or WEBP. Max upload size is 5MB.</div><label className={`mt-5 rounded-2xl px-5 py-3 text-sm font-semibold text-white ${isUploadingImage ? "cursor-not-allowed bg-slate-300" : "cursor-pointer bg-[#5E7F85]"}`}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} disabled={isUploadingImage} className="sr-only" />{isUploadingImage ? "Uploading..." : mainImageFile ? "Replace Image" : "Upload Image"}</label>{mainImageFile && <button type="button" disabled={isUploadingImage} onClick={() => { setMainImageFile(null); setMainImageReady(false); setImageUrl(""); showActionToast("Main image removed"); }} className="mt-3 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60">Remove</button>}</div></div></div><div className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-bold text-slate-900">Gallery Images</div><div className="mt-1 text-xs text-slate-500">Equal square cards with drag, replace and remove controls.</div></div><button type="button" onClick={() => setGalleryImages((current) => [...current, `Gallery ${current.length + 1}`])} className="rounded-2xl bg-[#5E7F85]/10 px-4 py-2.5 text-xs font-bold text-[#5E7F85]">+ Add Gallery Image</button></div><div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">{galleryImages.map((item, index) => <div key={`${item}-${index}`} className="rounded-[1.25rem] border bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex aspect-square items-center justify-center rounded-2xl bg-stone-50 text-xs font-bold text-slate-400">{item}</div><div className="mt-3 flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">Image {index + 1}</span><button type="button" onClick={() => setGalleryImages((current) => current.filter((_, i) => i !== index))} className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">Remove</button></div></div>)}</div></div></div><div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="text-sm font-bold text-slate-900">Live PDP Preview</div><div className="mt-4 rounded-3xl bg-stone-50 p-4"><div className="flex h-44 items-center justify-center overflow-hidden rounded-3xl bg-white text-xs font-bold text-slate-400">{imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : mainImageFile ? mainImageFile.name : "Product Image"}</div><div className="mt-4 text-lg font-black text-slate-900">{productName || "Product Name Preview"}</div><div className="mt-1 text-xs font-semibold text-[#5E7F85]">{brand}</div><div className="mt-3 flex items-center gap-2"><span className="text-xl font-black text-slate-900">৳{previewSalePrice}</span><span className="text-sm text-slate-400 line-through">৳{previewRegularPrice}</span><Badge tone="warn">{discount}% OFF</Badge></div><div className="mt-3 flex flex-wrap gap-2">{trustBadges.map((badge) => <Badge key={badge} tone="brand">{badge}</Badge>)}</div></div></div></div>
            <div className="mt-5 grid gap-4 md:grid-cols-2"><label className="space-y-2"><div className="text-sm font-medium text-slate-600">Short Description</div><textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label><label className="space-y-2"><div className="text-sm font-medium text-slate-600">How to Use</div><textarea value={howToUse} onChange={(e) => setHowToUse(e.target.value)} className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label><label className="space-y-2 md:col-span-2"><div className="text-sm font-medium text-slate-600">Full Description</div><textarea value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} className="h-32 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label><label className="space-y-2 md:col-span-2"><div className="text-sm font-medium text-slate-600">Benefits / Best For</div><textarea value={productDetails} onChange={(e) => setProductDetails(e.target.value)} className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" placeholder="One benefit per line" /></label><label className="space-y-2 md:col-span-2"><div className="text-sm font-medium text-slate-600">Ingredients</div><textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label><label className="space-y-2"><div className="text-sm font-medium text-slate-600">Key Ingredients</div><textarea value={keyIngredients} onChange={(e) => setKeyIngredients(e.target.value)} className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" placeholder="One key ingredient per line" /></label><label className="space-y-2"><div className="text-sm font-medium text-slate-600">Suitable For</div><textarea value={suitableFor} onChange={(e) => setSuitableFor(e.target.value)} className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label><label className="space-y-2 md:col-span-2"><div className="text-sm font-medium text-slate-600">Warnings</div><textarea value={warnings} onChange={(e) => setWarnings(e.target.value)} className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label><label className="space-y-2 md:col-span-2"><div className="text-sm font-medium text-slate-600">Gallery Image URLs</div><textarea value={galleryImages.join("\n")} onChange={(e) => setGalleryImages(splitLines(e.target.value))} className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" placeholder="One image URL or path per line" /></label></div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold tracking-tight">SEO & PDP Controls</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="space-y-2"><div className="text-sm font-medium text-slate-600">SEO Title</div><input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" placeholder={seoTitleText} /></label><label className="space-y-2"><div className="text-sm font-medium text-slate-600">Focus Keyword</div><input value={focusKeyword} onChange={(e) => setFocusKeyword(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label><label className="space-y-2 md:col-span-2"><div className="text-sm font-medium text-slate-600">Meta Description</div><textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" placeholder={metaDescriptionText} /></label><label className="space-y-2"><div className="text-sm font-medium text-slate-600">Visible Result Title</div><input value={visibleResultTitle} onChange={(e) => setVisibleResultTitle(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label><label className="space-y-2"><div className="text-sm font-medium text-slate-600">Routine Step</div><select value={routineStep} onChange={(e) => setRoutineStep(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"><option>Cleanser</option><option>Serum</option><option>Moisturizer</option><option>Sunscreen</option></select></label><label className="space-y-2 md:col-span-2"><div className="text-sm font-medium text-slate-600">Visible Result Bullets</div><textarea value={visibleResultBullets} onChange={(e) => setVisibleResultBullets(e.target.value)} className="h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label></div></div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-xl font-bold tracking-tight">Smart Checks</h2><Badge tone={publishBlocked ? "warn" : "good"}>{publishBlocked ? "Needs work" : "Ready"}</Badge></div><div className="mt-5 space-y-3">{publishChecks.map((check) => <div key={check.label} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${check.ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{check.ok ? "✅" : "⚠"} {check.label}</div>)}</div></div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold tracking-tight">Storefront Controls</h2><p className="mt-2 text-sm leading-6 text-slate-500">Status, stock tracking, featured, free delivery and website visibility are saved with the product. Messenger ordering, Notify Me and advanced stock rules are coming later.</p><div className="mt-5 space-y-3">{[["Track Stock", trackStock, setTrackStock], ["Featured", featured, setFeatured], ["Free Delivery", freeDelivery, setFreeDelivery], ["Website Visible", websiteVisible, setWebsiteVisible], ["Messenger Order (coming later)", messengerOrder, setMessengerOrder]].map(([label, value, setter]) => <button key={label} disabled={String(label).includes("coming later")} onClick={() => setter(!value)} className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-slate-400 ${value ? "bg-[#5E7F85]/10 text-[#5E7F85]" : "bg-stone-50 text-slate-600"}`}><span>{label}</span><span>{String(label).includes("coming later") ? "Coming later" : value ? "ON" : "OFF"}</span></button>)}</div><div className="mt-5 grid gap-3"><label className="space-y-2"><div className="text-sm font-medium text-slate-600">Status</div><select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"><option>Draft</option><option>Published</option><option>Private</option></select></label><label className="space-y-2"><div className="text-sm font-medium text-slate-600">Stock Rule (coming later)</div><select value={stockRule} disabled onChange={(e) => setStockRule(e.target.value)} className="w-full cursor-not-allowed rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm text-slate-400 outline-none"><option>Sellable</option><option>Notify Me</option><option>Disabled</option></select></label><label className="space-y-2"><div className="text-sm font-medium text-slate-600">Out of Stock Behavior (coming later)</div><select value={outOfStockBehavior} disabled onChange={(e) => setOutOfStockBehavior(e.target.value)} className="w-full cursor-not-allowed rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm text-slate-400 outline-none"><option>Show with Notify Me</option><option>Hide Product</option><option>Show Messenger Order</option></select></label></div></div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold tracking-tight">Product FAQs</h2><textarea value={faqText || productFaqs.map((faq) => `${faq.question} | ${faq.answer}`).join("\n")} onChange={(e) => setFaqText(e.target.value)} className="mt-5 h-40 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" placeholder="Question | Answer" /><div className="mt-5 space-y-3">{(parseFaqText(faqText).length ? parseFaqText(faqText) : productFaqs).map((faq, index) => <div key={`${faq.question}-${index}`} className="rounded-2xl bg-stone-50 p-4"><div className="font-bold text-slate-900">{faq.question}</div><div className="mt-1 text-sm text-slate-600">{faq.answer}</div></div>)}</div></div>
        </div>
      </div>

      {publishModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><div className="text-sm font-medium text-slate-500">Publish Check</div><h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Ready to Publish?</h3></div><button type="button" onClick={() => setPublishModalOpen(false)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">✕</button></div><div className="mt-6 grid gap-3">{publishChecks.map((check) => <div key={check.label} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${check.ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{check.ok ? "✅" : "⚠"} {check.label}</div>)}</div><div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setPublishModalOpen(false)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Cancel</button><button type="button" disabled={isSavingProduct || isUploadingImage} onClick={() => { if (isUploadingImage) { showActionToast("Wait for image upload to finish"); return; } if (publishBlocked) { showActionToast("Fix publish checklist before publishing"); setPublishModalOpen(false); } else { setPublishModalOpen(false); saveProductToBackend("Published"); } }} className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">{isSavingProduct ? "Publishing..." : isUploadingImage ? "Uploading image..." : "Publish"}</button></div></div></div>}
      </div>
    </AdminShell>
  );
}
