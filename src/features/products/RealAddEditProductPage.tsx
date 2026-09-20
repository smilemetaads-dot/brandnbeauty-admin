// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
"use client";

// Product editor UI connected to the custom PHP/MySQL backend.
// Phase 75A.4 R5.4: guided variant pricing and multi-gallery workflow lock.
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
  {
    id: "basic",
    icon: "✎",
    label: "General",
    helper: "Identity & description",
  },
  { id: "images", icon: "◉", label: "Media", helper: "Images & alt text" },
  {
    id: "pricing",
    icon: "▤",
    label: "Pricing",
    helper: "Price, cost & margin",
  },
  {
    id: "inventory",
    icon: "▦",
    label: "Inventory",
    helper: "SKU & stock policy",
  },
  {
    id: "organization",
    icon: "◇",
    label: "Organization",
    helper: "Category & merchandising",
  },
  {
    id: "content",
    icon: "▧",
    label: "Product content",
    helper: "Benefits & ingredients",
  },
  {
    id: "variants",
    icon: "◈",
    label: "Variants",
    helper: "Options & combinations",
  },
  {
    id: "seo",
    icon: "⌕",
    label: "SEO & shipping",
    helper: "Search & fulfilment",
  },
];

function ProductEditorFrame({
  children,
  embedded = false,
}: {
  children: ReactNode;
  embedded?: boolean;
}) {
  return embedded ? <>{children}</> : <AdminShell>{children}</AdminShell>;
}

function Badge({ children, tone = "default" }) {
  const cls =
    {
      default: "bg-slate-100 text-slate-700",
      good: "bg-emerald-50 text-emerald-700",
      warn: "bg-amber-50 text-amber-700",
      bad: "bg-rose-50 text-rose-700",
      brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    }[tone] || "bg-slate-100 text-slate-700";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function ExactEditorSection({ kicker, title, helper, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#e2e8e5] bg-white">
      <div className="border-b border-[#edf0ee] p-5">
        <div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#3b646d]">
          {kicker}
        </div>
        <h2 className="mt-2 text-[17px] font-bold text-[#26362f]">{title}</h2>
        <p className="mt-1 text-[8px] text-[#82908a]">{helper}</p>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

function ExactToggle({ checked, label, helper, onChange, grouped = false }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-3 ${grouped ? "" : "rounded-xl border border-[#e3e9e6] bg-[#fbfcfb]"}`}
    >
      <div className="min-w-0">
        <div className="text-[8.5px] font-bold text-[#46564f]">{label}</div>
        {helper ? (
          <div className="mt-1 text-[7px] leading-4 text-[#8a9690]">
            {helper}
          </div>
        ) : null}
      </div>
      <button
        aria-pressed={checked}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-[#5f8585]" : "bg-[#dce4e0]"}`}
        onClick={() => onChange(!checked)}
        type="button"
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${checked ? "left-6" : "left-1"}`}
        />
      </button>
    </div>
  );
}

function StatCard({ item, index = 0, active = false }) {
  const icons = ["1", "2", "3", "4"];
  const trendText = String(item[2]).toLowerCase();
  const trendTone =
    trendText.includes("risk") ||
    trendText.includes("need") ||
    trendText.includes("blocked") ||
    trendText.includes("missing")
      ? "text-amber-600 bg-amber-50"
      : "text-emerald-700 bg-emerald-50";
  return (
    <button
      type="button"
      className={`group relative w-full overflow-hidden rounded-[1.7rem] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${active ? "border-[#5E7F85] ring-2 ring-[#5E7F85]/15" : "border-slate-200"}`}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5E7F85]/5 transition group-hover:bg-[#5E7F85]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-500">{item[0]}</div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {item[1]}
          </div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xl font-bold text-[#5E7F85]">
          {icons[index % icons.length]}
        </div>
      </div>
      <div
        className={`relative mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${trendTone}`}
      >
        {item[2]}
      </div>
    </button>
  );
}

function TableHead({ children, className = "" }) {
  return (
    <thead
      className={`sticky top-0 z-10 bg-stone-50 text-slate-500 ${className}`}
    >
      {children}
    </thead>
  );
}

const ADD_EDIT_PRODUCT_ENDPOINT = bnbApiUrl("add_edit_product.php");
const PRODUCT_DETAILS_ENDPOINT = bnbApiUrl("get_product_details.php");
const MANAGE_PRODUCTS_ENDPOINT = bnbApiUrl("manage_products.php");
const CATEGORIES_ENDPOINT = bnbApiUrl("get_categories.php");
const CONCERNS_ENDPOINT = bnbApiUrl("get_concerns.php");
const BRANDS_ENDPOINT = bnbApiUrl("get_brands.php");
const UPLOAD_MEDIA_ENDPOINT = bnbApiUrl("upload_media.php");
const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_PRODUCT_GALLERY_IMAGES = 20;
const MAX_VARIANT_GALLERY_IMAGES = 8;

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
        .map((item) => (typeof item === "string" ? item : ""))
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

function readStructuredAttribute(product, key, fallback) {
  const value = parseProductAttributes(product)?.[key];
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(String(value));
    return parsed === undefined || parsed === null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function slugifyCatalogValue(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function skuToken(value, maxLength = 8) {
  const words = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "ITEM";
  const compact =
    words.length === 1
      ? words[0]
      : words.map((word) => word.slice(0, 2)).join("");
  return compact.slice(0, maxLength) || "ITEM";
}

function shortCatalogHash(value) {
  let hash = 0;
  for (const character of String(value || "")) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return String(hash % 10000).padStart(4, "0");
}

function nextAvailableIdentity(candidate, usedValues) {
  const normalized = String(candidate || "").trim();
  if (!normalized) return "";
  const used = new Set(
    usedValues.map((value) => String(value || "").trim().toLowerCase()),
  );
  if (!used.has(normalized.toLowerCase())) return normalized;
  let suffix = 2;
  while (used.has(`${normalized}-${suffix}`.toLowerCase())) suffix += 1;
  return `${normalized}-${suffix}`;
}

function normalizeVariantGroups(product) {
  const stored = readStructuredAttribute(product, "variant_option_groups", []);
  if (Array.isArray(stored) && stored.length) {
    return stored
      .map((group, index) => ({
        displayType: String(group?.displayType || "text"),
        draftValueText: Array.isArray(group?.values)
          ? group.values.join(", ")
          : "",
        id: String(group?.id || `option-${index + 1}`),
        name: String(group?.name || "Size"),
        swatches:
          group?.swatches && typeof group.swatches === "object"
            ? group.swatches
            : {},
        values: Array.from(
          new Set(
            (Array.isArray(group?.values) ? group.values : [])
              .map((value) => String(value || "").trim())
              .filter(Boolean),
          ),
        ),
      }))
      .slice(0, 3);
  }

  const legacyVariants = Array.isArray(product?.variants)
    ? product.variants
    : [];
  const legacyName = String(legacyVariants[0]?.option_name || "Size");
  const legacyValues = Array.from(
    new Set(
      legacyVariants
        .map((variant) =>
          String(variant?.option_value || variant?.variant_name || "").trim(),
        )
        .filter(Boolean),
    ),
  );
  return [
    {
      id: slugifyCatalogValue(legacyName) || "size",
      name: legacyName,
      displayType: legacyName.toLowerCase().includes("shade")
        ? "color"
        : "text",
      draftValueText: legacyValues.join(", "),
      swatches: {},
      values: legacyValues,
    },
  ];
}

function variantCombinationKey(optionValues, groups, fallback = "") {
  const structured = groups
    .map((group) => String(optionValues?.[group.id] || "").trim().toLowerCase())
    .filter(Boolean)
    .join("||");
  return structured || String(fallback || "").trim().toLowerCase();
}

function cartesianVariantOptions(groups) {
  return groups.reduce(
    (combinations, group) =>
      combinations.flatMap((combination) =>
        group.values.map((value) => ({
          ...combination,
          [group.id]: value,
        })),
      ),
    [{}],
  );
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
  if (readProductField(product, ["deleted_at", "archived_at"], ""))
    return "Archived";
  const value = String(
    readProductField(product, ["status"], "draft") || "draft",
  ).toLowerCase();
  if (["active", "published", "visible"].includes(value)) return "Visible";
  if (["inactive", "private", "hidden", "disabled"].includes(value))
    return "Hidden";
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
    : keys.reduce(
        (found, key) =>
          found || (Array.isArray(payload?.[key]) ? payload[key] : null),
        null,
      );

  if (!Array.isArray(rows)) return [];

  return rows.map(toCatalogOption).filter(Boolean);
}

function fallbackOptions(names) {
  return names.map((name) => ({
    id: `name:${name}`,
    name,
    parentId: "",
    slug: "",
  }));
}

function readConcernIds(product) {
  if (!product || typeof product !== "object") return [];

  const directIds = Array.isArray(product.concern_ids)
    ? product.concern_ids.map(String)
    : [];
  const mappedIds = Array.isArray(product.concerns)
    ? product.concerns.map((item) =>
        readProductField(item, ["id", "concern_id"], ""),
      )
    : [];
  const legacyId = readProductField(product, ["concern_id"], "");

  return Array.from(
    new Set([...directIds, ...mappedIds, legacyId].filter(Boolean)),
  );
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
  const initialEditingProduct =
    _props.product && typeof _props.product === "object"
      ? _props.product
      : null;
  const [loadedProduct, setLoadedProduct] = useState(null);
  const editingProduct = loadedProduct || initialEditingProduct;
  const editingProductId = readProductField(
    editingProduct,
    ["id", "product_id"],
    "",
  );
  const initialConcernIds = readConcernIds(editingProduct);
  const [trackStock, setTrackStock] = useState(
    readAttribute(editingProduct, ["track_inventory"], "1") !== "0",
  );
  const [featured, setFeatured] = useState(
    readAttribute(editingProduct, ["featured_product"], "1") !== "0",
  );
  const [freeDelivery, setFreeDelivery] = useState(false);
  const [websiteVisible, setWebsiteVisible] = useState(
    readAttribute(editingProduct, ["website_visible"], "1") !== "0",
  );
  const [messengerOrder, setMessengerOrder] = useState(true);
  const [productType, setProductType] = useState(() => {
    const initialType = readAttribute(
      editingProduct,
      ["catalog_product_type"],
      readProductField(editingProduct, ["product_type"], "single"),
    );
    if (["variant", "Variant Product"].includes(initialType)) return "Variant Product";
    if (["bundle", "Bundle"].includes(initialType)) return "Bundle";
    if (["gift_set", "Gift Set"].includes(initialType)) return "Gift Set";
    return "Single Product";
  });
  const [stockRule, setStockRule] = useState("Sellable");
  const [outOfStockBehavior, setOutOfStockBehavior] = useState(
    "Show with Notify Me",
  );
  const [status, setStatus] = useState(editorStatusFromProduct(editingProduct));
  const [productName, setProductName] = useState(
    readProductField(editingProduct, ["product_name", "name"], ""),
  );
  const [storefrontSlug, setStorefrontSlug] = useState(
    readProductField(editingProduct, ["slug", "product_slug"], ""),
  );
  const [sku, setSku] = useState(readProductField(editingProduct, ["sku"], ""));
  const [barcode, setBarcode] = useState(
    readProductField(editingProduct, ["barcode", "gtin"], ""),
  );
  const [brandList, setBrandList] = useState([
    "BrandnBeauty",
    "The Derma Plus",
    "COSRX",
    "Some By Mi",
    "Beauty of Joseon",
    "Simple",
  ]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [concernOptions, setConcernOptions] = useState([]);
  const [catalogIdentityRows, setCatalogIdentityRows] = useState([]);
  const [brandId, setBrandId] = useState(
    readProductField(editingProduct, ["brand_id"], ""),
  );
  const [categoryId, setCategoryId] = useState(
    readProductField(editingProduct, ["category_id"], ""),
  );
  const [concernId, setConcernId] = useState(
    readProductField(editingProduct, ["concern_id"], ""),
  );
  const [concernIds, setConcernIds] = useState(initialConcernIds);
  const [subcategoryId, setSubcategoryId] = useState("");
  const [brand, setBrand] = useState(
    readProductField(editingProduct, ["brand_name", "brand"], "BrandnBeauty"),
  );
  const [category, setCategory] = useState(
    readProductField(editingProduct, ["category_name", "category"], "Skincare"),
  );
  const [subcategory, setSubcategory] = useState("Face Wash");
  const [concern, setConcern] = useState(
    readProductField(editingProduct, ["concern_name", "concern"], "Acne"),
  );
  const [skuCounter, setSkuCounter] = useState(1001);
  const [costPrice, setCostPrice] = useState(
    readProductField(
      editingProduct,
      ["purchase_cost", "cost_price", "cost"],
      "",
    ),
  );
  const [regularPrice, setRegularPrice] = useState(
    readProductField(
      editingProduct,
      ["old_price", "sale_price", "regular_price"],
      "",
    ),
  );
  const [salePrice, setSalePrice] = useState(
    readProductField(editingProduct, ["price"], ""),
  );
  const [stockQty, setStockQty] = useState(
    readProductField(
      editingProduct,
      ["stock_quantity", "stock", "quantity"],
      "",
    ),
  );
  const [lowStockAlert, setLowStockAlert] = useState(
    readProductField(
      editingProduct,
      ["low_stock_threshold", "low_stock_limit", "reorder_level"],
      "",
    ),
  );
  const [inventoryMode, setInventoryMode] = useState(
    readProductField(editingProduct, ["inventory_mode"], "stocked"),
  );
  const [availabilityStatus, setAvailabilityStatus] = useState(
    readProductField(editingProduct, ["availability_status"], "available"),
  );
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState(
    readProductField(editingProduct, ["minimum_order_quantity"], "1"),
  );
  const [weight, setWeight] = useState(
    readAttribute(editingProduct, ["shipping_weight", "weight"], ""),
  );
  const [primarySupplier, setPrimarySupplier] = useState(
    readAttribute(
      editingProduct,
      ["primary_supplier"],
      "Izabel Health Care",
    ),
  );
  const [packageLength, setPackageLength] = useState(
    readAttribute(editingProduct, ["package_length_cm"], ""),
  );
  const [packageWidth, setPackageWidth] = useState(
    readAttribute(editingProduct, ["package_width_cm"], ""),
  );
  const [packageHeight, setPackageHeight] = useState(
    readAttribute(editingProduct, ["package_height_cm"], ""),
  );
  const [courierCost, setCourierCost] = useState(
    readAttribute(editingProduct, ["courier_cost"], ""),
  );
  const [imageAltText, setImageAltText] = useState(
    readAttribute(editingProduct, ["main_image_alt", "image_alt"], ""),
  );
  const [taxRate, setTaxRate] = useState(
    readAttribute(editingProduct, ["tax_rate"], "0"),
  );
  const [primaryLocation, setPrimaryLocation] = useState(
    readAttribute(
      editingProduct,
      ["primary_location"],
      "Dhaka Main Warehouse",
    ),
  );
  const [continueSelling, setContinueSelling] = useState(
    ["1", "true", "yes"].includes(
      readAttribute(
        editingProduct,
        ["continue_selling_out_of_stock"],
        "0",
      ).toLowerCase(),
    ),
  );
  const [collection, setCollection] = useState(
    readAttribute(editingProduct, ["collection"], ""),
  );
  const [searchTags, setSearchTags] = useState(
    readAttribute(editingProduct, ["search_tags"], ""),
  );
  const [bestSellerBadge, setBestSellerBadge] = useState(
    ["1", "true", "yes"].includes(
      readAttribute(editingProduct, ["best_seller_badge"], "0").toLowerCase(),
    ),
  );
  const [duplicateCheck, setDuplicateCheck] = useState(true);
  const [seoTitle, setSeoTitle] = useState(
    readAttribute(editingProduct, ["seo_title"], ""),
  );
  const [metaDescription, setMetaDescription] = useState(
    readAttribute(editingProduct, ["meta_description"], ""),
  );
  const [focusKeyword, setFocusKeyword] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [ignoredDuplicates, setIgnoredDuplicates] = useState(false);
  const [actionToast, setActionToast] = useState("");
  const [variants, setVariants] = useState([]);
  const [variantOptionGroups, setVariantOptionGroups] = useState(() =>
    normalizeVariantGroups(editingProduct),
  );
  const [variantOptionType, setVariantOptionType] = useState("Size");
  const [expandedVariantId, setExpandedVariantId] = useState("");
  const [bulkVariantPricing, setBulkVariantPricing] = useState({
    cost: "",
    regular: "",
    sale: "",
  });
  const [variantDraft, setVariantDraft] = useState({
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
  });
  const [mainImageReady, setMainImageReady] = useState(false);
  const [mainImageFile, setMainImageFile] = useState(null);
  const [galleryImages, setGalleryImages] = useState(
    splitLines(
      readAttribute(
        editingProduct,
        ["gallery_images", "gallery", "images"],
        "",
      ),
    ),
  );
  const [galleryAltTexts, setGalleryAltTexts] = useState(() => {
    const stored = readStructuredAttribute(
      editingProduct,
      "gallery_alt_texts",
      {},
    );
    return stored && typeof stored === "object" && !Array.isArray(stored)
      ? stored
      : {};
  });
  const [imageUrl, setImageUrl] = useState(
    readProductField(editingProduct, ["image_url", "image"], ""),
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [productLabel, setProductLabel] = useState("Bestseller");
  const [productBadge, setProductBadge] = useState("Authentic Product");
  const [shortDescription, setShortDescription] = useState(
    readProductField(editingProduct, ["short_description"], ""),
  );
  const [fullDescription, setFullDescription] = useState(
    readProductField(editingProduct, ["description"], ""),
  );
  const [howToUse, setHowToUse] = useState(
    readAttribute(editingProduct, ["how_to_use", "howToUse", "usage"], ""),
  );
  const [ingredients, setIngredients] = useState(
    readAttribute(editingProduct, ["ingredients", "ingredient_list"], ""),
  );
  const [productDetails, setProductDetails] = useState(
    readAttribute(editingProduct, ["product_details"], ""),
  );
  const [benefitRows, setBenefitRows] = useState(
    splitLines(readAttribute(editingProduct, ["benefits"], "")),
  );
  const [suitableFor, setSuitableFor] = useState(
    readAttribute(editingProduct, ["suitable_for"], "Oily / Acne Prone"),
  );
  const [warnings, setWarnings] = useState(
    readAttribute(editingProduct, ["warnings"], ""),
  );
  const [keyIngredientRows, setKeyIngredientRows] = useState(
    splitLines(readAttribute(editingProduct, ["key_ingredients"], "")),
  );
  const [faqRows, setFaqRows] = useState(
    parseFaqText(readFaqText(editingProduct)),
  );
  const [visibleResultTitle, setVisibleResultTitle] =
    useState("Visible Results");
  const [visibleResultBullets, setVisibleResultBullets] = useState(
    `Skin feels less oily within first few uses\nHelps reduce clogged pores\nSupports a cleaner daily routine`,
  );
  const [trustBadges, setTrustBadges] = useState([
    "100% Authentic",
    "Verified Seller",
    "COD Available",
    "Fast Delivery",
  ]);
  const [skinType, setSkinType] = useState("Oily / Acne Prone");
  const [routineStep, setRoutineStep] = useState("Cleanser");
  const [routineTime, setRoutineTime] = useState("AM + PM");
  const [routineFrequency, setRoutineFrequency] = useState("Daily");
  const [productFaqs, setProductFaqs] = useState([]);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Unsaved changes");
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [aiContentMode, setAiContentMode] = useState("Conversion + SEO");
  const [aiContentLanguage, setAiContentLanguage] = useState(
    "English + Bangla Friendly",
  );
  const [aiTargetCustomer, setAiTargetCustomer] = useState(
    "Bangladesh skincare buyer",
  );

  const categoryTree = {
    Skincare: ["Face Wash", "Serum", "Moisturizer", "Sunscreen", "Toner"],
    "Hair Care": ["Shampoo", "Hair Mask", "Hair Serum", "Scalp Care"],
    Haircare: ["Shampoo", "Hair Mask", "Hair Serum", "Scalp Care"],
    Makeup: ["Lip", "Face", "Eye", "Brushes"],
    "Body Care": ["Body Wash", "Lotion", "Scrub"],
  };
  const concernList = [
    "Acne",
    "Dark Spots",
    "Brightening",
    "Oily Skin",
    "Dry Skin",
    "Sensitive Skin",
    "Hairfall",
    "Dull Skin",
  ];
  const visibleBrandOptions = brandOptions.length
    ? brandOptions
    : fallbackOptions(brandList);
  const visibleCategoryOptions = categoryOptions.length
    ? categoryOptions
    : fallbackOptions(Object.keys(categoryTree));
  const visibleConcernOptions = concernOptions.length
    ? concernOptions
    : fallbackOptions(concernList);
  const rootCategoryOptions = visibleCategoryOptions.filter(
    (item) => !item.parentId,
  );
  const subcategoryOptions = visibleCategoryOptions.filter(
    (item) => String(item.parentId) === String(categoryId),
  );
  const catalogProducts = [
    {
      name: "Acne Balance Facewash",
      brand: "Some By Mi",
      price: 890,
      stock: 44,
    },
    {
      name: "Barrier Calm Serum",
      brand: "BrandnBeauty",
      price: 990,
      stock: 18,
    },
    { name: "Daily Sun Gel", brand: "Beauty of Joseon", price: 1250, stock: 0 },
    { name: "Hydra Gel Moisturizer", brand: "Simple", price: 850, stock: 72 },
    { name: "Routine Bundle", brand: "BrandnBeauty", price: 2020, stock: 12 },
  ];

  const otherCatalogRows = catalogIdentityRows.filter(
    (item) => String(item.id || "") !== String(editingProductId || ""),
  );
  const usedCatalogSlugs = otherCatalogRows
    .map((item) => item.slug)
    .filter(Boolean);
  const usedCatalogSkus = otherCatalogRows
    .flatMap((item) => [item.sku, ...(item.variantSkus || [])])
    .filter(Boolean);
  const generatedSlug = slugifyCatalogValue(productName) || "untitled-product";
  const autoSlug = slugifyCatalogValue(storefrontSlug || generatedSlug);
  const availableSlug = nextAvailableIdentity(autoSlug, usedCatalogSlugs);
  const slugConflict = Boolean(
    autoSlug && availableSlug.toLowerCase() !== autoSlug.toLowerCase(),
  );
  const conflictingSlugProduct = otherCatalogRows.find(
    (item) => String(item.slug || "").toLowerCase() === autoSlug.toLowerCase(),
  );
  const rawSkuBase = `BNB-${skuToken(brand, 5)}-${skuToken(productName, 8)}-${shortCatalogHash(autoSlug)}`;
  const suggestedAutoSku = nextAvailableIdentity(
    rawSkuBase,
    usedCatalogSkus,
  ).toUpperCase();
  const autoSku = String(sku || suggestedAutoSku).trim().toUpperCase();
  const skuConflict = usedCatalogSkus.some(
    (item) => String(item || "").trim().toLowerCase() === autoSku.toLowerCase(),
  );
  const storefrontBaseUrl = (
    process.env.NEXT_PUBLIC_BNB_STOREFRONT_URL?.trim() ||
    "http://localhost:3001"
  ).replace(/\/$/, "");
  const storefrontProductUrl = `${storefrontBaseUrl}/products/${autoSlug}`;
  const isVariantProduct = productType === "Variant Product";
  const selectedVariant =
    variants.find((item) => item.isDefault) ||
    variants.find((item) => item.status === "Active") ||
    variants[0];
  const previewSalePrice = isVariantProduct
    ? selectedVariant?.sale || ""
    : salePrice;
  const previewRegularPrice = isVariantProduct
    ? selectedVariant?.regular || ""
    : regularPrice;
  const previewCostPrice = isVariantProduct
    ? selectedVariant?.cost || ""
    : costPrice;
  const activeVariantPrices = variants
    .filter((item) => item.status === "Active" && Number(item.sale) > 0)
    .map((item) => Number(item.sale));
  const activeVariantCount = variants.filter(
    (item) => item.status === "Active",
  ).length;
  const variantMinPrice = activeVariantPrices.length
    ? Math.min(...activeVariantPrices)
    : 0;
  const variantMaxPrice = activeVariantPrices.length
    ? Math.max(...activeVariantPrices)
    : 0;
  const previewStockQty = isVariantProduct
    ? String(variants.reduce((sum, item) => sum + Number(item.stock || 0), 0))
    : stockQty;
  const discount =
    Number(previewRegularPrice) > 0
      ? Math.max(
          Math.round(
            ((Number(previewRegularPrice) - Number(previewSalePrice)) /
              Number(previewRegularPrice)) *
              100,
          ),
          0,
        )
      : 0;
  const seoTitleText =
    seoTitle || `${productName || "Product Name Preview"} | BrandnBeauty`;
  const metaDescriptionText =
    metaDescription ||
    `Buy authentic ${brand} ${productName || "product"} in Bangladesh. Best price, COD and fast delivery available.`;
  const duplicateProducts =
    productName.length > 2 && duplicateCheck && !ignoredDuplicates
      ? ["Acne Control Facewash", "Acne Balance Facewash"]
      : [];
  const publishChecks = [
    { label: "Product name", ok: Boolean(productName.trim()), required: true, section: "basic" },
    { label: "Unique storefront slug", ok: Boolean(autoSlug) && !slugConflict, required: true, section: "basic" },
    { label: "Short description", ok: Boolean(shortDescription.trim()), required: true, section: "basic" },
    { label: "Primary product image", ok: mainImageReady, required: true, section: "images" },
    { label: "Accessible image alt text", ok: Boolean(imageAltText.trim()), required: false, section: "images" },
    { label: "Selling price", ok: Number(previewSalePrice) > 0, required: true, section: "pricing" },
    { label: "Purchase cost / COGS", ok: Number(previewCostPrice) > 0, required: true, section: "pricing" },
    { label: "Valid compare-at price", ok: !previewRegularPrice || Number(previewRegularPrice) >= Number(previewSalePrice), required: true, section: "pricing" },
    { label: "Unique SKU", ok: Boolean(autoSku.trim()) && !skuConflict, required: true, section: "inventory" },
    { label: "Category and brand", ok: Boolean(category && brand), required: true, section: "organization" },
    { label: "Benefits and ingredients", ok: Boolean(benefitRows.join("").trim() && ingredients.trim()), required: true, section: "content" },
    { label: "Usage and warnings", ok: Boolean(howToUse.trim() && warnings.trim()), required: true, section: "content" },
    { label: "At least one FAQ", ok: faqRows.some((item) => item.question.trim() && item.answer.trim()), required: false, section: "content" },
    { label: "SEO title and description", ok: Boolean(seoTitle.trim() && metaDescription.trim()), required: false, section: "seo" },
    { label: "Shipping weight", ok: Number(weight) > 0, required: true, section: "seo" },
    { label: "At least one valid variant", ok: !isVariantProduct || variants.some((item) => item.status === "Active" && item.option.trim()), required: true, section: "variants" },
  ];
  const publishBlocked = publishChecks.some(
    (item) => item.required && !item.ok,
  );
  const requiredBlockerCount = publishChecks.filter(
    (item) => item.required && !item.ok,
  ).length;
  const completedPublishChecks = publishChecks.filter((item) => item.ok).length;
  const readinessPercent = Math.round(
    (completedPublishChecks / publishChecks.length) * 100,
  );
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

  const applyToggleChange = (setter, value) => {
    setter(value);
    setIsDirty(true);
    setSaveStatus("Unsaved changes");
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
    const controller = new AbortController();

    async function loadCatalogIdentities() {
      try {
        const response = await fetch(MANAGE_PRODUCTS_ENDPOINT, {
          cache: "no-store",
          headers: adminAuthHeaders(),
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) return;
        const rows = Array.isArray(payload?.products)
          ? payload.products
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
        setCatalogIdentityRows(
          rows.map((item) => ({
            id: item.id ?? item.product_id ?? "",
            name: item.product_name || item.name || "",
            sku: item.sku || "",
            slug: item.slug || item.product_slug || "",
            variantSkus: Array.isArray(item.variants)
              ? item.variants.map((variant) => variant?.sku || "").filter(Boolean)
              : splitLines(item.variant_skus || item.variant_sku_list || ""),
          })),
        );
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }

    loadCatalogIdentities();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const matchedBrand = brandOptions.find(
      (item) => item.name.toLowerCase() === brand.toLowerCase(),
    );
    if (!brandId && matchedBrand) setBrandId(String(matchedBrand.id));

    const matchedCategory = categoryOptions.find(
      (item) => item.name.toLowerCase() === category.toLowerCase(),
    );
    if (!categoryId && matchedCategory)
      setCategoryId(String(matchedCategory.id));

    const matchedConcern = concernOptions.find(
      (item) => item.name.toLowerCase() === concern.toLowerCase(),
    );
    if (!concernId && matchedConcern) {
      setConcernId(String(matchedConcern.id));
      setConcernIds((current) =>
        current.length ? current : [String(matchedConcern.id)],
      );
    }
  }, [
    brandOptions,
    categoryOptions,
    concernOptions,
    brand,
    category,
    concern,
    brandId,
    categoryId,
    concernId,
  ]);

  useEffect(() => {
    const selectedCategory = categoryOptions.find(
      (item) => String(item.id) === String(categoryId),
    );
    if (selectedCategory) setCategory(selectedCategory.name);

    const selectedSubcategory = categoryOptions.find(
      (item) => String(item.id) === String(subcategoryId),
    );
    if (selectedSubcategory) setSubcategory(selectedSubcategory.name);
  }, [categoryOptions, categoryId, subcategoryId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const productId =
      params.get("id") ||
      window.sessionStorage.getItem("bnb-product-editor-id");

    if (!productId || loadedProduct) return;

    let isMounted = true;

    async function loadProductForEdit() {
      try {
        const response = await fetch(
          `${PRODUCT_DETAILS_ENDPOINT}?id=${encodeURIComponent(productId)}&include_inactive=1`,
          {
            cache: "no-store",
            headers: adminAuthHeaders(),
          },
        );
        const payload = await response.json();

        if (
          !isMounted ||
          !response.ok ||
          !payload?.success ||
          !payload.product
        ) {
          return;
        }

        const product = payload.product;
        setLoadedProduct(product);
        setProductName(readProductField(product, ["product_name", "name"], ""));
        setStorefrontSlug(
          readProductField(product, ["slug", "product_slug"], ""),
        );
        setSku(readProductField(product, ["sku"], ""));
        setBarcode(readProductField(product, ["barcode", "gtin"], ""));
        setBrandId(readProductField(product, ["brand_id"], ""));
        setBrand(readProductField(product, ["brand_name", "brand"], brand));
        const loadedCategoryId = readProductField(product, ["category_id"], "");
        const loadedCategoryParentId = readProductField(
          product,
          ["category_parent_id"],
          "",
        );
        setCategoryId(loadedCategoryParentId || loadedCategoryId);
        setSubcategoryId(loadedCategoryParentId ? loadedCategoryId : "");
        setCategory(
          readProductField(product, ["category_name", "category"], category),
        );
        setSubcategory(
          loadedCategoryParentId
            ? readProductField(product, ["category_name", "category"], "")
            : "",
        );
        const loadedConcernIds = readConcernIds(product);
        const loadedPrimaryConcernId =
          readProductField(product, ["concern_id"], "") ||
          loadedConcernIds[0] ||
          "";
        setConcernId(loadedPrimaryConcernId);
        setConcernIds(
          loadedConcernIds.length
            ? loadedConcernIds
            : loadedPrimaryConcernId
              ? [loadedPrimaryConcernId]
              : [],
        );
        const loadedPrimaryConcern = Array.isArray(product.concerns)
          ? product.concerns.find(
              (item) => String(item.id) === String(loadedPrimaryConcernId),
            )
          : null;
        setConcern(
          readProductField(
            loadedPrimaryConcern,
            ["name"],
            readProductField(product, ["concern_name", "concern"], concern),
          ),
        );
        setCostPrice(
          readProductField(
            product,
            ["purchase_cost", "cost_price", "cost"],
            costPrice,
          ),
        );
        setRegularPrice(
          readProductField(
            product,
            ["old_price", "sale_price", "regular_price"],
            regularPrice,
          ),
        );
        setSalePrice(readProductField(product, ["price"], salePrice));
        setStockQty(
          readProductField(
            product,
            ["stock_quantity", "stock", "quantity"],
            stockQty,
          ),
        );
        setLowStockAlert(
          readProductField(
            product,
            ["low_stock_threshold", "low_stock_limit", "reorder_level"],
            lowStockAlert,
          ),
        );
        setInventoryMode(
          readProductField(product, ["inventory_mode"], "stocked"),
        );
        setAvailabilityStatus(
          readProductField(product, ["availability_status"], "available"),
        );
        setMinimumOrderQuantity(
          readProductField(product, ["minimum_order_quantity"], "1"),
        );
        const loadedCatalogProductType = readAttribute(
          product,
          ["catalog_product_type"],
          product.product_type || "single",
        );
        setProductType(
          ["variant", "Variant Product"].includes(loadedCatalogProductType)
            ? "Variant Product"
            : ["bundle", "Bundle"].includes(loadedCatalogProductType)
              ? "Bundle"
              : ["gift_set", "Gift Set"].includes(loadedCatalogProductType)
                ? "Gift Set"
                : "Single Product",
        );
        const loadedVariantGroups = normalizeVariantGroups(product);
        const storedVariantMatrix = readStructuredAttribute(
          product,
          "variant_matrix",
          [],
        );
        setVariantOptionGroups(loadedVariantGroups);
        const hasStoredDefault = Array.isArray(storedVariantMatrix)
          ? storedVariantMatrix.some((item) => Boolean(item?.isDefault))
          : false;
        setVariants(
          Array.isArray(product.variants)
            ? product.variants.map((variant, index) => {
                const legacyOption =
                  variant.option_value || variant.variant_name || "";
                const matrixRow = Array.isArray(storedVariantMatrix)
                  ? storedVariantMatrix.find(
                      (item) =>
                        (item?.sku && item.sku === variant.sku) ||
                        (item?.id && String(item.id) === String(variant.id)) ||
                        item?.label === legacyOption,
                    )
                  : null;
                const fallbackOptionValues =
                  loadedVariantGroups.length === 1
                    ? { [loadedVariantGroups[0].id]: legacyOption }
                    : {};
                return {
                  id: variant.id,
                  persisted: Boolean(variant.id),
                  optionName:
                    variant.option_name ||
                    loadedVariantGroups.map((group) => group.name).join(" / ") ||
                    "Size",
                  option: legacyOption,
                  optionValues:
                    matrixRow?.optionValues || fallbackOptionValues,
                  sku: variant.sku || "",
                  barcode: variant.barcode || matrixRow?.barcode || "",
                  cost: String(variant.cost_price ?? ""),
                  regular: String(variant.regular_price ?? ""),
                  sale: String(variant.sale_price ?? ""),
                  stock: String(variant.stock_quantity ?? "0"),
                  lowStock: String(variant.low_stock_threshold ?? "0"),
                  inventoryMode: variant.inventory_mode || "stocked",
                  availabilityStatus:
                    variant.availability_status || "available",
                  minimumOrderQuantity: String(
                    variant.minimum_order_quantity ?? "1",
                  ),
                  status:
                    variant.status === "active"
                      ? "Active"
                      : variant.status === "inactive"
                        ? "Disabled"
                        : "Draft",
                  galleryImages: Array.isArray(matrixRow?.galleryImages)
                    ? matrixRow.galleryImages
                    : variant.image_url || matrixRow?.imageUrl
                      ? [variant.image_url || matrixRow?.imageUrl]
                      : [],
                  galleryAltTexts:
                    matrixRow?.galleryAltTexts &&
                    typeof matrixRow.galleryAltTexts === "object"
                      ? matrixRow.galleryAltTexts
                      : {},
                  imageUrl: variant.image_url || matrixRow?.imageUrl || "",
                  packageHeight: String(matrixRow?.packageHeight || ""),
                  packageLength: String(matrixRow?.packageLength || ""),
                  packageWidth: String(matrixRow?.packageWidth || ""),
                  swatchColor: String(matrixRow?.swatchColor || "#78999b"),
                  weight: String(matrixRow?.weight || ""),
                  isDefault: Boolean(matrixRow?.isDefault) ||
                    (!hasStoredDefault && index === 0),
                };
              })
            : [],
        );
        setExpandedVariantId(
          String(product.variants?.[0]?.id || ""),
        );
        const loadedVariantOptionName =
          Array.isArray(product.variants) && product.variants.length
            ? product.variants[0]?.option_name
            : "";
        setVariantOptionType(loadedVariantOptionName || "Size");
        setImageUrl(readProductField(product, ["image_url", "image"], ""));
        setMainImageReady(
          Boolean(readProductField(product, ["image_url", "image"], "")),
        );
        setShortDescription(
          readProductField(product, ["short_description"], ""),
        );
        setFullDescription(readProductField(product, ["description"], ""));
        setHowToUse(
          readAttribute(product, ["how_to_use", "howToUse", "usage"], ""),
        );
        setIngredients(
          readAttribute(product, ["ingredients", "ingredient_list"], ""),
        );
        setProductDetails(readAttribute(product, ["product_details"], ""));
        setBenefitRows(splitLines(readAttribute(product, ["benefits"], "")));
        setSuitableFor(
          readAttribute(product, ["suitable_for"], "Oily / Acne Prone"),
        );
        setWarnings(readAttribute(product, ["warnings"], ""));
        setKeyIngredientRows(
          splitLines(readAttribute(product, ["key_ingredients"], "")),
        );
        setFaqRows(parseFaqText(readFaqText(product)));
        const loadedGallery = splitLines(
          readAttribute(product, ["gallery_images", "gallery", "images"], ""),
        );
        setGalleryImages(loadedGallery);
        const loadedGalleryAltTexts = readStructuredAttribute(
          product,
          "gallery_alt_texts",
          {},
        );
        setGalleryAltTexts(
          loadedGalleryAltTexts &&
            typeof loadedGalleryAltTexts === "object" &&
            !Array.isArray(loadedGalleryAltTexts)
            ? loadedGalleryAltTexts
            : {},
        );
        setStatus(editorStatusFromProduct(product));
        setSeoTitle(readAttribute(product, ["seo_title"], ""));
        setMetaDescription(readAttribute(product, ["meta_description"], ""));
        setWeight(readAttribute(product, ["shipping_weight", "weight"], ""));
        setPrimarySupplier(
          readAttribute(
            product,
            ["primary_supplier"],
            "Izabel Health Care",
          ),
        );
        setPackageLength(
          readAttribute(product, ["package_length_cm"], ""),
        );
        setPackageWidth(readAttribute(product, ["package_width_cm"], ""));
        setPackageHeight(readAttribute(product, ["package_height_cm"], ""));
        setCourierCost(readAttribute(product, ["courier_cost"], ""));
        setImageAltText(
          readAttribute(product, ["main_image_alt", "image_alt"], ""),
        );
        setTaxRate(readAttribute(product, ["tax_rate"], "0"));
        setPrimaryLocation(
          readAttribute(
            product,
            ["primary_location"],
            "Dhaka Main Warehouse",
          ),
        );
        setContinueSelling(
          ["1", "true", "yes"].includes(
            readAttribute(
              product,
              ["continue_selling_out_of_stock"],
              "0",
            ).toLowerCase(),
          ),
        );
        setCollection(readAttribute(product, ["collection"], ""));
        setSearchTags(readAttribute(product, ["search_tags"], ""));
        setBestSellerBadge(
          ["1", "true", "yes"].includes(
            readAttribute(product, ["best_seller_badge"], "0").toLowerCase(),
          ),
        );
        setTrackStock(readAttribute(product, ["track_inventory"], "1") !== "0");
        setFeatured(readAttribute(product, ["featured_product"], "1") !== "0");
        setWebsiteVisible(
          readAttribute(product, ["website_visible"], "1") !== "0",
        );
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
    const savedEditorStatus =
      isPublishing && !websiteVisible ? "Hidden" : nextStatus;
    const sellingPriceNumber = optionalDecimal(previewSalePrice);
    const regularPriceNumber = optionalDecimal(previewRegularPrice);
    const stockNumber = optionalWholeNumber(previewStockQty);
    const minimumOrderQuantityNumber = optionalWholeNumber(
      minimumOrderQuantity || "1",
    );
    const activeVariants = variants.filter(
      (variant) => variant.status === "Active",
    );
    const cleanBenefitRows = benefitRows
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    const cleanKeyIngredientRows = keyIngredientRows
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    const cleanFaqRows = faqRows
      .map((item) => ({
        question: String(item?.question || "").trim(),
        answer: String(item?.answer || "").trim(),
      }))
      .filter((item) => item.question || item.answer);
    const hasEmptyBenefitRow = benefitRows.some(
      (item) => !String(item || "").trim(),
    );
    const hasEmptyKeyIngredientRow = keyIngredientRows.some(
      (item) => !String(item || "").trim(),
    );
    const hasIncompleteFaqRow = cleanFaqRows.some(
      (item) => item.question && !item.answer,
    );

    if (!productName.trim()) {
      showActionToast(
        "Product name is required. You can save an incomplete product as Draft and finish it later.",
      );
      return;
    }

    try {
      const identityResponse = await fetch(MANAGE_PRODUCTS_ENDPOINT, {
        cache: "no-store",
        headers: adminAuthHeaders(),
      });
      const identityPayload = await identityResponse.json();
      const identityRows = Array.isArray(identityPayload?.products)
        ? identityPayload.products
        : Array.isArray(identityPayload?.data)
          ? identityPayload.data
          : [];
      const freshOtherRows = identityRows.filter(
        (item) =>
          String(item.id ?? item.product_id ?? "") !==
          String(editingProductId || ""),
      );
      const freshSlugs = freshOtherRows
        .map((item) => item.slug || item.product_slug || "")
        .filter(Boolean)
        .map((item) => String(item).toLowerCase());
      const freshSkus = freshOtherRows
        .flatMap((item) => [
          item.sku || "",
          ...(Array.isArray(item.variants)
            ? item.variants.map((variant) => variant?.sku || "")
            : splitLines(item.variant_skus || item.variant_sku_list || "")),
        ])
        .filter(Boolean)
        .map((item) => String(item).toLowerCase());

      if (identityResponse.ok && freshSlugs.includes(autoSlug.toLowerCase())) {
        showActionToast(
          `This storefront URL is already used. Use ${nextAvailableIdentity(autoSlug, freshSlugs)} instead.`,
        );
        return;
      }
      if (identityResponse.ok && freshSkus.includes(autoSku.toLowerCase())) {
        showActionToast("This parent SKU is already used by another product.");
        return;
      }
      const duplicateVariantSku = variants.find((variant) =>
        freshSkus.includes(String(variant.sku || "").toLowerCase()),
      );
      if (identityResponse.ok && duplicateVariantSku) {
        showActionToast(
          `${duplicateVariantSku.option || "Variant"}: SKU is already used by another product.`,
        );
        return;
      }
    } catch {
      // The existing in-memory identity checks still run below if refresh fails.
    }

    if (slugConflict) {
      showActionToast(
        `This storefront URL is already used. Use ${availableSlug} instead.`,
      );
      return;
    }

    if (skuConflict) {
      showActionToast("This parent SKU is already used by another product.");
      return;
    }

    if (Number.isNaN(sellingPriceNumber)) {
      showActionToast(
        "Enter the customer selling price as a valid non-negative amount.",
      );
      return;
    }

    if (Number.isNaN(regularPriceNumber)) {
      showActionToast("Regular Price must be a valid non-negative amount.");
      return;
    }

    if (
      regularPriceNumber !== null &&
      sellingPriceNumber !== null &&
      regularPriceNumber < sellingPriceNumber
    ) {
      showActionToast("Regular Price cannot be lower than Selling Price.");
      return;
    }

    if (Number.isNaN(stockNumber)) {
      showActionToast("Stock quantity must be a whole number of 0 or more.");
      return;
    }

    if (
      Number.isNaN(minimumOrderQuantityNumber) ||
      minimumOrderQuantityNumber === null ||
      minimumOrderQuantityNumber < 1
    ) {
      showActionToast(
        "Minimum order quantity must be a positive whole number.",
      );
      return;
    }

    if (isVariantProduct) {
      const variantIssues = [];
      const seenBarcodes = new Set();
      const seenOptions = new Set();
      const seenSkus = new Set([autoSku.toLowerCase()]);

      if (isPublishing && variantMatrixIsStale) {
        variantIssues.push(
          "Generate the latest option combinations before publishing.",
        );
      }
      if (isPublishing && !validVariantOptionGroups.length) {
        variantIssues.push(
          "Add at least one option type and value before publishing.",
        );
      }

      variants.forEach((variant, index) => {
        const rowLabel = `Variant ${index + 1}`;
        const optionValue = String(variant.option || "").trim();
        const skuValue = String(variant.sku || "")
          .trim()
          .toLowerCase();
        const barcodeValue = String(variant.barcode || "").trim().toLowerCase();
        const sellingValue = optionalDecimal(variant.sale);
        const regularValue = optionalDecimal(variant.regular);
        const costValue = optionalDecimal(variant.cost);
        const stockValue = optionalWholeNumber(variant.stock);
        const weightValue = optionalDecimal(variant.weight);
        const minQtyValue = optionalWholeNumber(
          variant.minimumOrderQuantity || "1",
        );
        const isVisibleVariant = variant.status === "Active";
        const isHiddenVariant = variant.status === "Disabled";

        if (Number.isNaN(sellingValue))
          variantIssues.push(`${rowLabel}: enter a valid selling price.`);
        if (Number.isNaN(regularValue))
          variantIssues.push(`${rowLabel}: enter a valid regular price.`);
        if (Number.isNaN(costValue))
          variantIssues.push(`${rowLabel}: enter a valid purchase cost.`);
        if (
          regularValue !== null &&
          sellingValue !== null &&
          regularValue < sellingValue
        )
          variantIssues.push(
            `${rowLabel}: Regular Price cannot be lower than Selling Price.`,
          );
        if (Number.isNaN(stockValue))
          variantIssues.push(
            `${rowLabel}: Stock Quantity must be a whole number of 0 or more.`,
          );
        if (Number.isNaN(weightValue))
          variantIssues.push(`${rowLabel}: enter a valid shipping weight.`);
        [
          [variant.packageLength, "length"],
          [variant.packageWidth, "width"],
          [variant.packageHeight, "height"],
        ].forEach(([dimensionValue, dimensionLabel]) => {
          if (Number.isNaN(optionalDecimal(dimensionValue))) {
            variantIssues.push(
              `${rowLabel}: enter a valid package ${dimensionLabel}.`,
            );
          }
        });
        if (
          Number.isNaN(minQtyValue) ||
          minQtyValue === null ||
          minQtyValue < 1
        )
          variantIssues.push(`${rowLabel}: Min. Qty must be at least 1.`);

        if (!isHiddenVariant && optionValue) {
          const normalizedOption = optionValue.toLowerCase();
          if (seenOptions.has(normalizedOption))
            variantIssues.push(`${rowLabel}: duplicate option value.`);
          seenOptions.add(normalizedOption);
        }

        if (!isHiddenVariant && skuValue) {
          if (seenSkus.has(skuValue))
            variantIssues.push(`${rowLabel}: duplicate SKU.`);
          if (
            usedCatalogSkus.some(
              (catalogSku) =>
                String(catalogSku || "").trim().toLowerCase() === skuValue,
            )
          )
            variantIssues.push(
              `${rowLabel}: SKU is already used by another product.`,
            );
          seenSkus.add(skuValue);
        }

        if (!isHiddenVariant && barcodeValue) {
          if (seenBarcodes.has(barcodeValue))
            variantIssues.push(`${rowLabel}: duplicate barcode / GTIN.`);
          seenBarcodes.add(barcodeValue);
        }

        if (isPublishing && isVisibleVariant) {
          if (!optionValue)
            variantIssues.push(
              `${rowLabel}: Option Value is required before publishing.`,
            );
          if (sellingValue === null || sellingValue <= 0)
            variantIssues.push(
              `${rowLabel}: Selling Price must be greater than 0 before publishing.`,
            );
          if (costValue === null || costValue <= 0)
            variantIssues.push(
              `${rowLabel}: Purchase Cost must be greater than 0 before publishing.`,
            );
          if (variant.availabilityStatus !== "available")
            variantIssues.push(
              `${rowLabel}: Customer Availability must be Available before publishing.`,
            );
          if (
            variant.inventoryMode !== "on_demand" &&
            (stockValue === null || stockValue < 0)
          )
            variantIssues.push(
              `${rowLabel}: Stock Quantity is required for stocked variants before publishing.`,
            );
        }
      });

      if (isPublishing && !activeVariants.length) {
        variantIssues.push(
          "Add at least one visible variant before publishing.",
        );
      }

      if (
        isPublishing &&
        activeVariants.filter((variant) => variant.isDefault).length !== 1
      ) {
        variantIssues.push(
          "Choose exactly one default variant before publishing.",
        );
      }

      if (variantIssues.length) {
        showActionToast(variantIssues[0]);
        return;
      }
    }

    if (isPublishing) {
      const hasValidSellingPrice = isVariantProduct
        ? activeVariants.some((variant) => {
            const variantSelling = optionalDecimal(
              variant.sale || variant.regular,
            );
            return (
              variantSelling !== null &&
              !Number.isNaN(variantSelling) &&
              variantSelling > 0
            );
          })
        : sellingPriceNumber !== null && sellingPriceNumber > 0;
      const hasValidAvailability = isVariantProduct
        ? activeVariants.some((variant) => {
            const variantStock = optionalWholeNumber(variant.stock);
            return (
              variant.availabilityStatus === "available" &&
              (variant.inventoryMode === "on_demand" ||
                (variantStock !== null && !Number.isNaN(variantStock)))
            );
          })
        : availabilityStatus === "available" &&
          (inventoryMode === "on_demand" ||
            (stockNumber !== null && stockNumber >= 0));

      if (!hasValidSellingPrice || !hasValidAvailability || !mainImageReady) {
        showActionToast(
          "Complete the required product information before making this product visible.",
        );
        return;
      }
      if (Number(previewCostPrice) <= 0) {
        showActionToast(
          isVariantProduct
            ? "Add purchase cost to the default variant before publishing."
            : "Add purchase cost before publishing.",
        );
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
      short_description: shortDescription,
      description: fullDescription,
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
      slug: autoSlug,
      sku: autoSku,
      barcode: barcode.trim() || null,
      variants: isVariantProduct
        ? variants.map((variant) => ({
            id: variant.id,
            variant_name: variant.option,
            option_name: variant.optionName || variantOptionType || "Size",
            option_value: variant.option,
            option_values: variant.optionValues || {},
            is_default: variant.isDefault ? 1 : 0,
            sku: variant.sku,
            barcode: variant.barcode || null,
            cost_price: variant.cost || "",
            regular_price: variant.regular || variant.sale || "",
            sale_price: variant.sale || null,
            stock_quantity: variant.stock || "",
            low_stock_threshold: variant.lowStock || "",
            inventory_mode: variant.inventoryMode || "stocked",
            availability_status: variant.availabilityStatus || "available",
            minimum_order_quantity: String(variant.minimumOrderQuantity || "1"),
            status:
              variant.status === "Active"
                ? "active"
                : variant.status === "Disabled"
                  ? "inactive"
                  : "draft",
            image_url:
              variant.imageUrl || variant.galleryImages?.[0] || null,
          }))
        : [],
      name: productName.trim(),
      product_name: productName.trim(),
      price: String(previewSalePrice || ""),
      purchase_cost: String(previewCostPrice || ""),
      attributes: {
        best_seller_badge: bestSellerBadge ? "1" : "0",
        catalog_product_type:
          productType === "Variant Product"
            ? "variant"
            : productType === "Bundle"
              ? "bundle"
              : productType === "Gift Set"
                ? "gift_set"
                : "single",
        collection: collection.trim(),
        continue_selling_out_of_stock: continueSelling ? "1" : "0",
        courier_cost: courierCost.trim(),
        featured_product: featured ? "1" : "0",
        main_image_alt: imageAltText.trim(),
        gallery_alt_texts: JSON.stringify(galleryAltTexts),
        seo_title: seoTitle.trim(),
        meta_description: metaDescription.trim(),
        package_height_cm: packageHeight.trim(),
        package_length_cm: packageLength.trim(),
        package_width_cm: packageWidth.trim(),
        primary_location: primaryLocation,
        primary_supplier: primarySupplier,
        search_tags: searchTags.trim(),
        shipping_weight: weight.trim(),
        tax_rate: taxRate,
        track_inventory: trackStock ? "1" : "0",
        variant_option_groups: JSON.stringify(
          variantOptionGroups.map((group) => ({
            displayType: group.displayType || "text",
            id: group.id,
            name: group.name.trim(),
            swatches: group.swatches || {},
            values: group.values,
          })),
        ),
        variant_matrix: JSON.stringify(
          variants.map((variant) => ({
            id: variant.id,
            barcode: variant.barcode || "",
            galleryAltTexts: variant.galleryAltTexts || {},
            galleryImages: variant.galleryImages ||
              (variant.imageUrl ? [variant.imageUrl] : []),
            imageUrl: variant.imageUrl || "",
            isDefault: Boolean(variant.isDefault),
            label: variant.option,
            optionValues: variant.optionValues || {},
            packageHeight: variant.packageHeight || "",
            packageLength: variant.packageLength || "",
            packageWidth: variant.packageWidth || "",
            sku: variant.sku,
            swatchColor: variant.swatchColor || "",
            weight: variant.weight || "",
          })),
        ),
        website_visible: websiteVisible ? "1" : "0",
      },
      sale_price: String(previewRegularPrice || ""),
      status: backendStatusFromEditor(savedEditorStatus),
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

      setStatus(savedEditorStatus);
      setIsDirty(false);
      setSaveStatus(
        savedEditorStatus === "Visible"
          ? "Visible just now"
          : savedEditorStatus === "Hidden"
            ? "Saved hidden just now"
            : "Saved just now",
      );
      showActionToast(result.message || "Product saved successfully");
      if (result.product_id) {
        const savedId = String(result.product_id);
        window.sessionStorage.setItem("bnb-product-editor-id", savedId);
        setLoadedProduct((current) => ({
          ...(current || {}),
          id: savedId,
          product_id: savedId,
          name: productName.trim(),
          product_name: productName.trim(),
          sku: autoSku,
        }));
      }
      if (nextStatus === "Visible") {
        if (_props.onNavigate) _props.onNavigate("Products");
        else {
          router.refresh();
          router.push("/products");
        }
      }
    } catch (error) {
      setSaveStatus("Save failed");
      showActionToast(
        error instanceof Error ? error.message : "Product could not be saved",
      );
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
      showActionToast(
        error instanceof Error ? error.message : "Image upload failed.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleGalleryImageUpload = async (event) => {
    const remainingSlots = Math.max(
      MAX_PRODUCT_GALLERY_IMAGES - galleryImages.length,
      0,
    );
    const files = Array.from(event.target.files || []).slice(0, remainingSlots);

    if (!remainingSlots) {
      event.target.value = "";
      showActionToast(
        `This product already has ${MAX_PRODUCT_GALLERY_IMAGES} supporting images.`,
      );
      return;
    }

    if (!files.length) {
      return;
    }

    setIsUploadingImage(true);
    showActionToast(
      files.length === 1
        ? "Uploading gallery image..."
        : `Uploading ${files.length} gallery images...`,
    );

    try {
      const uploadedUrls = [];

      for (const file of files) {
        uploadedUrls.push(await uploadProductImage(file));
      }

      setGalleryImages((current) => [...current, ...uploadedUrls]);
      setIsDirty(true);
      setSaveStatus("Unsaved changes");
      showActionToast(
        files.length === 1 ? "Gallery image added" : "Gallery images added",
      );
    } catch (error) {
      showActionToast(
        error instanceof Error ? error.message : "Gallery upload failed.",
      );
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
    setIsDirty(true);
    setSaveStatus("Unsaved changes");
  };

  const removeGalleryImage = (index) => {
    const removedUrl = galleryImages[index];
    setGalleryImages((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
    setGalleryAltTexts((current) => {
      const next = { ...current };
      delete next[removedUrl];
      return next;
    });
    setIsDirty(true);
    setSaveStatus("Unsaved changes");
  };

  const setGalleryImageAsPrimary = (index) => {
    const nextPrimary = galleryImages[index];
    if (!nextPrimary) return;
    setGalleryImages((current) => [
      ...(imageUrl && imageUrl !== nextPrimary ? [imageUrl] : []),
      ...current.filter((_, itemIndex) => itemIndex !== index),
    ].slice(0, MAX_PRODUCT_GALLERY_IMAGES));
    setImageUrl(nextPrimary);
    setMainImageReady(true);
    setIsDirty(true);
    setSaveStatus("Unsaved changes");
    showActionToast("Primary product image updated.");
  };

  const updateTextRow = (setter, index, value) => {
    setter((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
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
    setFaqRows((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const addFaqRow = () => {
    setFaqRows((current) => [...current, { question: "", answer: "" }]);
  };

  const removeFaqRow = (index) => {
    setFaqRows((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
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
    setShortDescription(
      `${cleanName} is a ${routineStep.toLowerCase()} step product for ${concern.toLowerCase()} focused daily skincare routines.`,
    );
    setFullDescription(
      `${cleanName} helps customers build a simple, consistent routine for ${concern.toLowerCase()} concern. It is positioned for ${aiTargetCustomer.toLowerCase()} with clear usage guidance, trust-focused product information and conversion-friendly PDP content.`,
    );
    setProductDetails(
      `Best for: ${skinType}. Routine step: ${routineStep}. Use time: ${routineTime}. Frequency: ${routineFrequency}. Designed to support a clean, practical and easy-to-follow skincare routine.`,
    );
    setBenefitRows([
      `Supports a practical ${routineStep.toLowerCase()} step in the routine.`,
    ]);
    setSuitableFor(skinType);
    setWarnings(
      "Patch test before first use. Stop use if irritation occurs. Avoid direct contact with eyes.",
    );
    setKeyIngredientRows(
      splitLines(
        ingredients || "Niacinamide\nGlycerin\nSkin-supporting actives",
      ),
    );
    setHowToUse(
      `Use as the ${routineStep.toLowerCase()} step in your routine. Apply as directed, then follow with the next routine step. Use ${routineTime.toLowerCase()} - ${routineFrequency.toLowerCase()}. Patch test before first use.`,
    );
    setIngredients(
      ingredients ||
        "Add INCI ingredient list here. Keep ingredient names clean, comma-separated and packaging-safe.",
    );
    setVisibleResultBullets(
      `Skin feels cleaner and more comfortable\nSupports ${concern.toLowerCase()} focused routine\nHelps maintain a more consistent skincare habit`,
    );
    setProductFaqs([
      {
        id: 1,
        question: `How do I use ${cleanName}?`,
        answer: `Use it as the ${routineStep.toLowerCase()} step. Follow the usage direction and patch test before first use.`,
      },
      {
        id: 2,
        question: `Is ${cleanName} suitable for ${skinType.toLowerCase()}?`,
        answer: `It is positioned for ${skinType.toLowerCase()} users, but sensitive skin users should patch test first.`,
      },
      {
        id: 3,
        question: "When should I use it?",
        answer: `Recommended use time: ${routineTime}. Frequency: ${routineFrequency}.`,
      },
    ]);
    setFaqRows([
      {
        question: `How do I use ${cleanName}?`,
        answer: `Use it as the ${routineStep.toLowerCase()} step. Follow the usage direction and patch test before first use.`,
      },
      {
        question: `Is ${cleanName} suitable for ${skinType.toLowerCase()}?`,
        answer: `It is positioned for ${skinType.toLowerCase()} users, but sensitive skin users should patch test first.`,
      },
      {
        question: "When should I use it?",
        answer: `Recommended use time: ${routineTime}. Frequency: ${routineFrequency}.`,
      },
    ]);
    setSeoTitle(`${cleanName} Price in Bangladesh | BrandnBeauty`);
    setMetaDescription(
      `Buy authentic ${cleanName} in Bangladesh from BrandnBeauty. Suitable for ${concern.toLowerCase()} focused skincare routines with COD and fast delivery.`,
    );
    setFocusKeyword(
      `${cleanName.toLowerCase()} ${category.toLowerCase()} bangladesh`,
    );
    setSaveStatus("Unsaved changes");
    showActionToast("AI-ready product content generated for review");
  };

  const updateVariantField = (rowIndex, field, value) => {
    setVariants((current) =>
      current.map((item, index) =>
        index === rowIndex ? { ...item, [field]: value } : item,
      ),
    );
    setIsDirty(true);
    setSaveStatus("Unsaved changes");
  };

  const updateVariantOptionGroup = (rowIndex, field, value) => {
    setVariantOptionGroups((current) =>
      current.map((group, index) => {
        if (index !== rowIndex) return group;
        if (field === "values") {
          return {
            ...group,
            draftValueText: String(value || ""),
            values: Array.from(
              new Set(
                String(value || "")
                  .split(/,|\r?\n/)
                  .map((item) => item.trim())
                  .filter(Boolean),
              ),
            ),
          };
        }
        if (field === "displayType") {
          return { ...group, displayType: String(value || "text") };
        }
        if (String(field).startsWith("swatch:")) {
          const swatchValue = String(field).slice("swatch:".length);
          return {
            ...group,
            swatches: {
              ...(group.swatches || {}),
              [swatchValue]: String(value || "#78999b"),
            },
          };
        }
        const nextName = String(value || "").trimStart();
        return {
          ...group,
          name: nextName,
          id:
            group.id && !String(group.id).startsWith("option-")
              ? group.id
              : slugifyCatalogValue(nextName) || group.id,
        };
      }),
    );
    setIsDirty(true);
    setSaveStatus("Unsaved changes");
  };

  const addVariantOptionGroup = () => {
    if (variantOptionGroups.length >= 3) {
      showActionToast("Up to 3 option types are supported per product.");
      return;
    }
    const usedNames = new Set(
      variantOptionGroups.map((group) => group.name.toLowerCase()),
    );
    const suggestedName =
      ["Size", "Shade / Color", "Scent", "Finish", "Pack"].find(
        (name) => !usedNames.has(name.toLowerCase()),
      ) || `Option ${variantOptionGroups.length + 1}`;
    setVariantOptionGroups((current) => [
      ...current,
      {
        displayType: suggestedName.toLowerCase().includes("shade")
          ? "color"
          : "text",
        draftValueText: "",
        id: `option-${Date.now()}`,
        name: suggestedName,
        swatches: {},
        values: [],
      },
    ]);
    setIsDirty(true);
    setSaveStatus("Unsaved changes");
  };

  const removeVariantOptionGroup = (rowIndex) => {
    if (variantOptionGroups.length === 1) {
      showActionToast("A variant product needs at least one option type.");
      return;
    }
    setVariantOptionGroups((current) =>
      current.filter((_, index) => index !== rowIndex),
    );
    setIsDirty(true);
    setSaveStatus("Unsaved changes");
  };

  const validVariantOptionGroups = variantOptionGroups.filter(
    (group) => group.name.trim() && group.values.length,
  );
  const variantCombinationCount = validVariantOptionGroups.length
    ? validVariantOptionGroups.reduce(
        (total, group) => total * group.values.length,
        1,
      )
    : 0;
  const expectedVariantCombinationKeys = new Set(
    variantCombinationCount > 0 && variantCombinationCount <= 100
      ? cartesianVariantOptions(validVariantOptionGroups).map((combination) =>
          variantCombinationKey(
            combination,
            validVariantOptionGroups,
          ),
        )
      : [],
  );
  const currentVariantCombinationKeys = new Set(
    variants.map((variant) =>
      variantCombinationKey(
        variant.optionValues,
        validVariantOptionGroups,
        variant.option,
      ),
    ),
  );
  const variantMatrixIsStale = Boolean(
    variantCombinationCount &&
      (expectedVariantCombinationKeys.size !==
        currentVariantCombinationKeys.size ||
        [...expectedVariantCombinationKeys].some(
          (key) => !currentVariantCombinationKeys.has(key),
        )),
  );

  const generateVariantCombinations = () => {
    const incompleteGroup = variantOptionGroups.find(
      (group) => !group.name.trim() || !group.values.length,
    );
    if (incompleteGroup) {
      showActionToast("Give every option a name and at least one value.");
      return;
    }
    const normalizedGroupNames = variantOptionGroups.map((group) =>
      group.name.trim().toLowerCase(),
    );
    if (new Set(normalizedGroupNames).size !== normalizedGroupNames.length) {
      showActionToast("Each option type needs a different name.");
      return;
    }
    if (!variantCombinationCount) {
      showActionToast("Add option values before generating combinations.");
      return;
    }
    if (variantCombinationCount > 100) {
      showActionToast("Reduce option values to 100 combinations or fewer.");
      return;
    }

    const existingByKey = new Map(
      variants.map((variant) => [
        variantCombinationKey(
          variant.optionValues,
          validVariantOptionGroups,
          variant.option,
        ),
        variant,
      ]),
    );
    const identitySkus = [
      ...usedCatalogSkus,
      ...variants.map((variant) => variant.sku).filter(Boolean),
    ];
    const generatedSkus = [];
    const groupName = validVariantOptionGroups
      .map((group) => group.name)
      .join(" / ");
    const combinations = cartesianVariantOptions(validVariantOptionGroups);
    const hasDefault = variants.some((variant) => variant.isDefault);
    const nextVariants = combinations.map((combination, index) => {
      const key = variantCombinationKey(
        combination,
        validVariantOptionGroups,
      );
      const existing = existingByKey.get(key);
      const label = validVariantOptionGroups
        .map((group) => combination[group.id])
        .join(" / ");
      const baseVariantSku = `${autoSku}-${validVariantOptionGroups
        .map((group) => skuToken(combination[group.id], 5))
        .join("-")}`;
      const generatedSku = nextAvailableIdentity(baseVariantSku, [
        ...identitySkus,
        ...generatedSkus,
      ]).toUpperCase();
      generatedSkus.push(existing?.sku || generatedSku);

      return {
        id: existing?.id || `new-${Date.now()}-${index}`,
        persisted: Boolean(existing?.persisted),
        optionName: groupName,
        option: label,
        optionValues: combination,
        sku: existing?.sku || generatedSku,
        barcode: existing?.barcode || "",
        cost: existing?.cost || "",
        regular: existing?.regular || "",
        sale: existing?.sale || "",
        stock: existing?.stock || "0",
        lowStock: existing?.lowStock || "0",
        inventoryMode: existing?.inventoryMode || "stocked",
        availabilityStatus: existing?.availabilityStatus || "available",
        minimumOrderQuantity: existing?.minimumOrderQuantity || "1",
        status: existing?.status || "Active",
        galleryImages: existing?.galleryImages ||
          (existing?.imageUrl ? [existing.imageUrl] : []),
        galleryAltTexts: existing?.galleryAltTexts || {},
        imageUrl: existing?.imageUrl || "",
        packageHeight: existing?.packageHeight || "",
        packageLength: existing?.packageLength || "",
        packageWidth: existing?.packageWidth || "",
        swatchColor: existing?.swatchColor || "#78999b",
        weight: existing?.weight || "",
        isDefault:
          Boolean(existing?.isDefault) || (!hasDefault && index === 0),
      };
    });

    if (!nextVariants.some((variant) => variant.isDefault) && nextVariants[0]) {
      nextVariants[0].isDefault = true;
    }
    setVariants(nextVariants);
    setExpandedVariantId(String(nextVariants[0]?.id || ""));
    setIsDirty(true);
    setSaveStatus("Unsaved changes");
    showActionToast(
      `${nextVariants.length} variant combination${nextVariants.length === 1 ? "" : "s"} generated.`,
    );
  };

  const addVariant = () => {
    const nextVariant = {
      id: `new-${Date.now()}`,
      persisted: false,
      optionName: variantOptionType || "Size",
      option: "",
      sku: "",
      barcode: "",
      cost: "",
      regular: "",
      sale: "",
      stock: "",
      lowStock: "",
      inventoryMode: "stocked",
      availabilityStatus: "available",
      minimumOrderQuantity: "1",
      status: "Draft",
      galleryImages: [],
      galleryAltTexts: {},
      imageUrl: "",
      packageHeight: "",
      packageLength: "",
      packageWidth: "",
      swatchColor: "#78999b",
      weight: "",
    };
    setVariants((current) => [...current, nextVariant]);
    setVariantDraft({
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
    });
    showActionToast(
      variants.length ? "Variant row added" : "First variant row added",
    );
  };

  const removeOrDisableVariant = (rowIndex) => {
    setVariants((current) => {
      const target = current[rowIndex];

      if (!target?.persisted) {
        return current.filter((_, index) => index !== rowIndex);
      }

      return current.map((item, index) =>
        index === rowIndex ? { ...item, status: "Disabled" } : item,
      );
    });
    showActionToast("Variant updated");
  };

  const handleVariantImageUpload = async (event, rowIndex) => {
    const currentGallery = variants[rowIndex]?.galleryImages ||
      (variants[rowIndex]?.imageUrl ? [variants[rowIndex].imageUrl] : []);
    const remainingSlots = Math.max(
      MAX_VARIANT_GALLERY_IMAGES - currentGallery.length,
      0,
    );
    const files = Array.from(event.target.files || []).slice(0, remainingSlots);

    if (!remainingSlots) {
      event.target.value = "";
      showActionToast(
        `This variant already has ${MAX_VARIANT_GALLERY_IMAGES} images.`,
      );
      return;
    }

    if (!files.length) {
      return;
    }

    setIsUploadingImage(true);
    showActionToast(
      files.length === 1
        ? "Uploading variant image..."
        : `Uploading ${files.length} variant images...`,
    );

    try {
      const uploadedUrls = [];
      for (const file of files) {
        uploadedUrls.push(await uploadProductImage(file));
      }
      const nextGallery = [...currentGallery, ...uploadedUrls];
      setVariants((current) =>
        current.map((variant, index) =>
          index === rowIndex
            ? {
                ...variant,
                galleryImages: nextGallery,
                imageUrl: variant.imageUrl || nextGallery[0] || "",
              }
            : variant,
        ),
      );
      setIsDirty(true);
      setSaveStatus("Unsaved changes");
      showActionToast(
        files.length === 1
          ? "Variant image uploaded successfully"
          : "Variant gallery updated successfully",
      );
    } catch (error) {
      showActionToast(
        error instanceof Error ? error.message : "Variant image upload failed.",
      );
    } finally {
      event.target.value = "";
      setIsUploadingImage(false);
    }
  };

  const removeVariantGalleryImage = (rowIndex, imageIndex) => {
    setVariants((current) =>
      current.map((variant, index) => {
        if (index !== rowIndex) return variant;
        const previousGallery = variant.galleryImages ||
          (variant.imageUrl ? [variant.imageUrl] : []);
        const removedUrl = previousGallery[imageIndex];
        const nextGallery = previousGallery.filter(
          (_, itemIndex) => itemIndex !== imageIndex,
        );
        const nextAltTexts = { ...(variant.galleryAltTexts || {}) };
        delete nextAltTexts[removedUrl];
        return {
          ...variant,
          galleryAltTexts: nextAltTexts,
          galleryImages: nextGallery,
          imageUrl:
            variant.imageUrl === removedUrl
              ? nextGallery[0] || ""
              : variant.imageUrl,
        };
      }),
    );
    setIsDirty(true);
    setSaveStatus("Unsaved changes");
  };

  const moveVariantGalleryImage = (rowIndex, imageIndex, direction) => {
    setVariants((current) =>
      current.map((variant, index) => {
        if (index !== rowIndex) return variant;
        const nextGallery = [
          ...(variant.galleryImages ||
            (variant.imageUrl ? [variant.imageUrl] : [])),
        ];
        const toIndex = imageIndex + direction;
        if (toIndex < 0 || toIndex >= nextGallery.length) return variant;
        const [item] = nextGallery.splice(imageIndex, 1);
        nextGallery.splice(toIndex, 0, item);
        return {
          ...variant,
          galleryImages: nextGallery,
          imageUrl: nextGallery[0] || "",
        };
      }),
    );
    setIsDirty(true);
    setSaveStatus("Unsaved changes");
  };

  const addCommonImageToVariant = (rowIndex, commonImage) => {
    if (!commonImage) return;
    const currentGallery = variants[rowIndex]?.galleryImages || [];
    if (currentGallery.includes(commonImage)) {
      showActionToast("That image is already in this variant gallery.");
      return;
    }
    if (currentGallery.length >= MAX_VARIANT_GALLERY_IMAGES) {
      showActionToast(
        `A variant can contain up to ${MAX_VARIANT_GALLERY_IMAGES} images.`,
      );
      return;
    }
    setVariants((current) =>
      current.map((variant, index) =>
        index === rowIndex
          ? {
              ...variant,
              galleryImages: [...(variant.galleryImages || []), commonImage],
              imageUrl: variant.imageUrl || commonImage,
            }
          : variant,
      ),
    );
    setIsDirty(true);
    setSaveStatus("Unsaved changes");
  };

  const inheritCommonGalleryForVariant = (rowIndex) => {
    setVariants((current) =>
      current.map((variant, index) =>
        index === rowIndex
          ? {
              ...variant,
              galleryAltTexts: {},
              galleryImages: [],
              imageUrl: "",
            }
          : variant,
      ),
    );
    setIsDirty(true);
    setSaveStatus("Unsaved changes");
    showActionToast("This variant now inherits the common product gallery.");
  };

  const applyBulkVariantPricing = () => {
    if (
      !bulkVariantPricing.sale &&
      !bulkVariantPricing.regular &&
      !bulkVariantPricing.cost
    ) {
      showActionToast("Enter at least one bulk price value first.");
      return;
    }
    setVariants((current) =>
      current.map((variant) =>
        variant.status === "Disabled"
          ? variant
          : {
              ...variant,
              cost: bulkVariantPricing.cost || variant.cost,
              regular: bulkVariantPricing.regular || variant.regular,
              sale: bulkVariantPricing.sale || variant.sale,
            },
      ),
    );
    setIsDirty(true);
    setSaveStatus("Unsaved changes");
    showActionToast("Bulk pricing applied to all sellable variants.");
  };

  const copyDefaultPricingToVariants = () => {
    const defaultVariant =
      variants.find((variant) => variant.isDefault) || variants[0];
    if (!defaultVariant?.sale && !defaultVariant?.regular && !defaultVariant?.cost) {
      showActionToast("Complete the default variant pricing first.");
      return;
    }
    setVariants((current) =>
      current.map((variant) =>
        variant.status === "Disabled"
          ? variant
          : {
              ...variant,
              cost: defaultVariant.cost,
              regular: defaultVariant.regular,
              sale: defaultVariant.sale,
            },
      ),
    );
    setIsDirty(true);
    setSaveStatus("Unsaved changes");
    showActionToast("Default variant pricing copied to all sellable variants.");
  };

  const toggleConcern = (option, checked) => {
    const optionId = String(option.id);
    const persistedId = optionId.startsWith("name:") ? "" : optionId;

    if (checked) {
      if (persistedId) {
        setConcernIds((current) =>
          Array.from(new Set([...current, persistedId])),
        );
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

  const exactInputClass =
    "mt-2 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[8.5px] font-semibold text-[#405049] outline-none focus:border-[#7d9b9a]";
  const exactTextAreaClass =
    "mt-2 w-full rounded-xl border border-[#dce4e0] bg-white px-3 py-3 text-[8.5px] leading-5 text-[#405049] outline-none focus:border-[#7d9b9a]";
  const exactLabelClass = "block text-[8px] font-bold text-[#596861]";

  const renderExactUploadSlot = ({
    title,
    helper,
    image,
    primary = false,
    index = 0,
  }) => (
    <label className="group flex min-h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#cfdbd7] bg-[#fbfcfb] p-3 text-center hover:border-[#7d9b9a]">
      {image ? (
        <img
          alt=""
          className="mb-3 h-20 w-full object-contain"
          src={image}
        />
      ) : (
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3f2] text-[15px] text-[#5f8585]">
          +
        </span>
      )}
      <b className="text-[8px] text-[#4c5d55]">{title}</b>
      <span className="mt-1 text-[7px] leading-4 text-[#8c9892]">
        {helper}
      </span>
      <input
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={isUploadingImage}
        multiple={!primary}
        onChange={primary ? handleImageUpload : handleGalleryImageUpload}
        type="file"
      />
      {!primary && image ? (
        <button
          className="mt-2 text-[7px] font-bold text-rose-600"
          onClick={(event) => {
            event.preventDefault();
            setGalleryImages((current) =>
              current.filter((_, itemIndex) => itemIndex !== index),
            );
            setIsDirty(true);
            setSaveStatus("Unsaved changes");
          }}
          type="button"
        >
          Remove
        </button>
      ) : null}
    </label>
  );

  const renderExactReferenceSection = () => {
    const grossProfit = Number(salePrice || 0) - Number(costPrice || 0);
    const grossMargin = Number(salePrice || 0)
      ? Math.round((grossProfit / Number(salePrice)) * 100)
      : 0;
    const customerSaving = Math.max(
      Number(regularPrice || 0) - Number(salePrice || 0),
      0,
    );

    if (activeEditorSection === "basic") {
      return (
        <div className="space-y-4">
          <ExactEditorSection
            helper="Core storefront identity and customer-facing summary."
            kicker="Product identity"
            title="General information"
          >
          <label className={exactLabelClass}>
            Product name *
            <input
              className={exactInputClass}
              onChange={(event) => setProductName(event.target.value)}
              placeholder="Product name"
              value={productName}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={exactLabelClass}>
              Product type
              <select
                className={exactInputClass}
                onChange={(event) => setProductType(event.target.value)}
                value={productType}
              >
                <option value="Single Product">Simple product</option>
                <option value="Variant Product">Variant product</option>
                <option disabled value="Bundle">Bundle — dedicated builder required</option>
                <option disabled value="Gift Set">Gift set — dedicated builder required</option>
              </select>
              {isVariantProduct ? (
                <button
                  className="mt-2 flex h-9 w-full items-center justify-center rounded-xl bg-[#5f8585] px-3 text-[8px] font-bold text-white"
                  onClick={() => setActiveEditorSection("variants")}
                  type="button"
                >
                  Continue to variant prices & images →
                </button>
              ) : (
                <span className="mt-2 block text-[7px] font-medium text-[#8a9690]">
                  Price and common gallery are managed in Pricing and Media.
                </span>
              )}
            </label>
            <label className={exactLabelClass}>
              Storefront slug *
              <div className="mt-2 flex h-10 items-center overflow-hidden rounded-xl border border-[#dce4e0] bg-white">
                <span className="border-r border-[#e5eae8] bg-[#fafbfa] px-3 text-[7px] text-[#929d97]">
                  /products/
                </span>
                <input
                  className="min-w-0 flex-1 px-3 text-[8.5px] font-semibold text-[#405049] outline-none"
                  onChange={(event) =>
                    setStorefrontSlug(slugifyCatalogValue(event.target.value))
                  }
                  onBlur={() => {
                    if (!slugConflict) return;
                    setStorefrontSlug(availableSlug);
                    setIsDirty(true);
                    setSaveStatus("Unsaved changes");
                    showActionToast(`Available URL applied: ${availableSlug}`);
                  }}
                  value={autoSlug}
                />
              </div>
              {slugConflict ? (
                <span className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-rose-50 px-3 py-2 text-[7px] font-semibold text-rose-700">
                  <span>
                    Already used{conflictingSlugProduct?.name ? ` by ${conflictingSlugProduct.name}` : ""}.
                  </span>
                  <button
                    className="shrink-0 underline"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setStorefrontSlug(availableSlug)}
                    type="button"
                  >
                    Use {availableSlug}
                  </button>
                </span>
              ) : (
                <span className="mt-2 block text-[7px] font-medium text-emerald-700">
                  ✓ Unique URL checked against the live catalog
                </span>
              )}
            </label>
          </div>
          <label className={exactLabelClass}>
            Short description *
            <textarea
              className={`${exactTextAreaClass} h-24`}
              maxLength={220}
              onChange={(event) => setShortDescription(event.target.value)}
              value={shortDescription}
            />
            <span className="mt-1 block text-right text-[7px] font-medium text-[#9aa49f]">
              {shortDescription.length}/220
            </span>
          </label>
          <label className={exactLabelClass}>
            Full description
            <textarea
              className={`${exactTextAreaClass} h-36`}
              onChange={(event) => setFullDescription(event.target.value)}
              value={fullDescription}
            />
          </label>
          </ExactEditorSection>
          <div className="rounded-2xl border border-[#d8e4e1] bg-[#edf3f4] p-4 text-[8px] leading-4 text-[#526965]">
            ✓ &nbsp; The storefront design stays unchanged. These fields replace
            the content inside the existing product-detail layout.
          </div>
        </div>
      );
    }

    if (activeEditorSection === "images") {
      return (
        <ExactEditorSection
          helper="Use accurate pack shots and customer-useful supporting images."
          kicker="Product gallery"
          title="Media and accessibility"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {renderExactUploadSlot({
              title: "Primary pack shot",
              helper: "Required primary image",
              image: imageUrl,
              primary: true,
            })}
            <label className="group flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#cfdbd7] bg-[#fbfcfb] p-4 text-center hover:border-[#7d9b9a]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3f2] text-[15px] font-bold text-[#5f8585]">
                +
              </span>
              <b className="mt-3 text-[8px] text-[#4c5d55]">
                Add supporting images
              </b>
              <span className="mt-1 text-[7px] leading-4 text-[#8c9892]">
                Select multiple images · {galleryImages.length}/{MAX_PRODUCT_GALLERY_IMAGES}
              </span>
              <input
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={
                  isUploadingImage ||
                  galleryImages.length >= MAX_PRODUCT_GALLERY_IMAGES
                }
                multiple
                onChange={handleGalleryImageUpload}
                type="file"
              />
            </label>
          </div>
          {galleryImages.length ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[8px] font-bold text-[#4c5d55]">
                    Common product gallery
                  </div>
                  <div className="mt-1 text-[7px] text-[#8a9690]">
                    Reorder, promote to primary, edit alt text or remove any image.
                  </div>
                </div>
                <span className="rounded-full bg-[#edf3f2] px-3 py-1 text-[7px] font-bold text-[#5f8585]">
                  {galleryImages.length} image{galleryImages.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {galleryImages.map((galleryImage, index) => (
                  <div
                    className="overflow-hidden rounded-xl border border-[#dce5e2] bg-white"
                    key={`${galleryImage}-${index}`}
                  >
                    <div
                      className="h-32 bg-[#f8faf9] bg-contain bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${galleryImage})` }}
                    />
                    <div className="space-y-2 p-3">
                      <label className={exactLabelClass}>
                        Image alt text
                        <input
                          className={exactInputClass}
                          onChange={(event) => {
                            setGalleryAltTexts((current) => ({
                              ...current,
                              [galleryImage]: event.target.value,
                            }));
                            setIsDirty(true);
                            setSaveStatus("Unsaved changes");
                          }}
                          placeholder="Describe this image"
                          value={galleryAltTexts[galleryImage] || ""}
                        />
                      </label>
                      <div className="grid grid-cols-4 gap-1">
                        <button
                          className="h-8 rounded-lg border border-[#dce4e0] text-[7px] font-bold text-[#5f7068] disabled:opacity-30"
                          disabled={index === 0}
                          onClick={() => moveGalleryImage(index, -1)}
                          type="button"
                        >
                          ←
                        </button>
                        <button
                          className="h-8 rounded-lg border border-[#dce4e0] text-[7px] font-bold text-[#5f7068] disabled:opacity-30"
                          disabled={index === galleryImages.length - 1}
                          onClick={() => moveGalleryImage(index, 1)}
                          type="button"
                        >
                          →
                        </button>
                        <button
                          className="h-8 rounded-lg border border-[#c9d9d5] text-[7px] font-bold text-[#46706e]"
                          onClick={() => setGalleryImageAsPrimary(index)}
                          type="button"
                        >
                          Primary
                        </button>
                        <button
                          className="h-8 rounded-lg border border-rose-100 text-[7px] font-bold text-rose-700"
                          onClick={() => removeGalleryImage(index)}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {isVariantProduct ? (
            <div className="rounded-xl border border-[#cfe0dc] bg-[#eef6f4] px-4 py-3 text-[7.5px] leading-4 text-[#55736d]">
              These are the common/default product images. Add a dedicated
              image inside Variants only when a size, shade or pack looks
              different. A variant without its own image automatically
              inherits the primary image.
            </div>
          ) : null}
          <label className={exactLabelClass}>
            Primary image alt text
            <input
              className={exactInputClass}
              onChange={(event) => setImageAltText(event.target.value)}
              placeholder="Example: Kojic Acid Brightening Body Wash 300ml bottle"
              value={imageAltText}
            />
            <span className="mt-2 block text-[7px] leading-4 font-medium text-[#8c9892]">
              Describe the product, not decorative styling. Used by screen
              readers and image search.
            </span>
          </label>
          <div className="rounded-xl border border-amber-100 bg-amber-50/65 px-4 py-3 text-[7px] leading-4 text-amber-800">
            Production uploads must preserve the original file, generate
            optimized storefront sizes and keep product packaging text
            unchanged.
          </div>
        </ExactEditorSection>
      );
    }

    if (activeEditorSection === "pricing") {
      return (
        <div className="space-y-4">
          <ExactEditorSection
            helper="Keep selling price, purchase cost and reporting inputs aligned."
            kicker="Commercial controls"
            title="Pricing and cost"
          >
            {isVariantProduct ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-[#cfe0dc] bg-[#eef6f4] p-4">
                  <div className="text-[8px] font-bold uppercase tracking-[0.11em] text-[#46706e]">
                    Variant-controlled pricing
                  </div>
                  <p className="mt-2 text-[7.5px] leading-5 text-[#607973]">
                    Prices and purchase costs are edited once—inside each row
                    in Variants. This page only summarizes the active choices.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    ["From", variantMinPrice ? `৳${variantMinPrice.toLocaleString()}` : "Pending"],
                    [
                      "Active range",
                      variantMinPrice
                        ? variantMinPrice === variantMaxPrice
                          ? `৳${variantMinPrice.toLocaleString()}`
                          : `৳${variantMinPrice.toLocaleString()}–৳${variantMaxPrice.toLocaleString()}`
                        : "Pending",
                    ],
                    ["Active variants", String(activeVariantCount)],
                    ["Default", selectedVariant?.option || "Choose in Variants"],
                  ].map(([label, value]) => (
                    <div
                      className="rounded-xl border border-[#e2e8e5] bg-[#fafbfa] p-4"
                      key={label}
                    >
                      <div className="text-[7px] font-bold uppercase tracking-[0.1em] text-[#89958f]">
                        {label}
                      </div>
                      <div className="mt-2 text-[12px] font-bold text-[#33453d]">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-[#5f8585] px-4 text-[8.5px] font-bold text-white"
                  onClick={() => {
                    setExpandedVariantId(
                      String(selectedVariant?.id || variants[0]?.id || ""),
                    );
                    setActiveEditorSection("variants");
                  }}
                  type="button"
                >
                  Edit variant prices, costs & images →
                </button>
                <label className={exactLabelClass}>
                  Common tax rate
                  <select
                    className={exactInputClass}
                    onChange={(event) => setTaxRate(event.target.value)}
                    value={taxRate}
                  >
                    <option value="0">No tax / 0%</option>
                    <option value="5">5%</option>
                    <option value="7.5">7.5%</option>
                    <option value="15">15%</option>
                  </select>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={exactLabelClass}>
                    Selling price *
                    <div className="relative">
                      <span className="absolute left-3 top-[19px] text-[9px] font-bold text-[#5f6e67]">৳</span>
                      <input className={`${exactInputClass} pl-7`} min="0" onChange={(event) => setSalePrice(event.target.value)} type="number" value={salePrice} />
                    </div>
                  </label>
                  <label className={exactLabelClass}>
                    Compare-at / MRP
                    <div className="relative">
                      <span className="absolute left-3 top-[19px] text-[9px] font-bold text-[#5f6e67]">৳</span>
                      <input className={`${exactInputClass} pl-7`} min="0" onChange={(event) => setRegularPrice(event.target.value)} type="number" value={regularPrice} />
                    </div>
                  </label>
                  <label className={exactLabelClass}>
                    Purchase cost / COGS *
                    <div className="relative">
                      <span className="absolute left-3 top-[19px] text-[9px] font-bold text-[#5f6e67]">৳</span>
                      <input className={`${exactInputClass} pl-7`} min="0" onChange={(event) => setCostPrice(event.target.value)} type="number" value={costPrice} />
                    </div>
                  </label>
                  <label className={exactLabelClass}>
                    Tax rate
                    <select className={exactInputClass} onChange={(event) => setTaxRate(event.target.value)} value={taxRate}>
                      <option value="0">No tax / 0%</option>
                      <option value="5">5%</option>
                      <option value="7.5">7.5%</option>
                      <option value="15">15%</option>
                    </select>
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Gross profit", costPrice ? `৳${Math.max(0, grossProfit).toLocaleString()}` : "—"],
                    ["Gross margin", costPrice ? `${grossMargin}%` : "Cost needed"],
                    ["Customer saving", customerSaving ? `৳${customerSaving.toLocaleString()}` : "—"],
                  ].map(([label, value]) => (
                    <div className="rounded-xl border border-[#e2e8e5] bg-[#fafbfa] p-4" key={label}>
                      <div className="text-[7px] font-bold uppercase tracking-[0.1em] text-[#89958f]">{label}</div>
                      <div className="mt-2 text-[14px] font-bold text-[#33453d]">{value}</div>
                    </div>
                  ))}
                </div>
                {Number(regularPrice) > 0 && Number(regularPrice) < Number(salePrice) ? (
                  <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4 text-[8px] text-rose-800">
                    Compare-at price cannot be lower than the selling price.
                  </div>
                ) : null}
              </div>
            )}
          </ExactEditorSection>
          <div className="rounded-2xl bg-[#edf3f4] p-4 text-[8px] leading-4 text-[#526965]">
            Advertising spend, courier cost and returns are calculated in
            Finance—not stored as product price fields.
          </div>
        </div>
      );
    }

    if (activeEditorSection === "inventory") {
      return (
        <ExactEditorSection
          helper="Identity lives here; accountable stock movement stays in Inventory."
          kicker="Stock identity"
          title="Inventory and fulfilment policy"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={exactLabelClass}>
              SKU *
              <div className="flex gap-2">
                <input
                  className={exactInputClass}
                  onChange={(event) =>
                    setSku(
                      event.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9-]+/g, "-"),
                    )
                  }
                  value={autoSku}
                />
                <button
                  className="h-10 shrink-0 rounded-xl border border-[#cfdcd8] bg-white px-3 text-[7px] font-bold text-[#466f70]"
                  onClick={() => {
                    setSku("");
                    setIsDirty(true);
                    setSaveStatus("Unsaved changes");
                    showActionToast("A new unique SKU was generated.");
                  }}
                  type="button"
                >
                  Regenerate
                </button>
              </div>
              <span
                className={`mt-2 block text-[7px] font-semibold ${skuConflict ? "text-rose-700" : "text-emerald-700"}`}
              >
                {skuConflict
                  ? "This SKU is already used by another catalog product."
                  : "✓ Unique SKU checked against the live catalog"}
              </span>
            </label>
            <label className={exactLabelClass}>
              Barcode / GTIN
              <input
                className={exactInputClass}
                onChange={(event) => setBarcode(event.target.value)}
                value={barcode}
              />
            </label>
            <label className={exactLabelClass}>
              Primary location
              <select
                className={exactInputClass}
                onChange={(event) => setPrimaryLocation(event.target.value)}
                value={primaryLocation}
              >
                <option>Dhaka Main Warehouse</option>
                <option>Secondary Stock Room</option>
                <option>Supplier Direct</option>
              </select>
            </label>
            <label className={exactLabelClass}>
              Low-stock threshold
              <input
                className={exactInputClass}
                min="0"
                onChange={(event) => setLowStockAlert(event.target.value)}
                type="number"
                value={lowStockAlert}
              />
            </label>
          </div>
          <div className="divide-y divide-[#edf0ee] rounded-xl border border-[#e2e8e5]">
            <ExactToggle
              checked={trackStock}
              grouped
              helper="Create stock movement history and availability controls"
              label="Track inventory"
              onChange={(value) => applyToggleChange(setTrackStock, value)}
            />
            <ExactToggle
              checked={continueSelling}
              grouped
              helper="Use only for verified pre-order workflows"
              label="Continue selling when out of stock"
              onChange={(value) =>
                applyToggleChange(setContinueSelling, value)
              }
            />
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-[#dce5e2] bg-[#f7f9f8] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[7px] font-bold uppercase tracking-[0.1em] text-[#89958f]">
                Current available stock
              </div>
              <div className="mt-2 text-[15px] font-bold text-[#34463e]">
                {Number(previewStockQty || 0).toLocaleString()} units
              </div>
              <p className="mt-1 text-[7px] text-[#8a9690]">
                Stock is not directly editable in the product form.
              </p>
            </div>
            <button
              className="h-10 rounded-xl border border-[#8aa3a1] bg-white px-4 text-[8px] font-bold text-[#466f70]"
              onClick={() =>
                _props.onNavigate
                  ? _props.onNavigate("Inventory")
                  : router.push("/inventory")
              }
              type="button"
            >
              Open Inventory
            </button>
          </div>
        </ExactEditorSection>
      );
    }

    if (activeEditorSection === "organization") {
      return (
        <ExactEditorSection
          helper="Connect this product to the storefront taxonomy without duplicate labels."
          kicker="Catalog structure"
          title="Organization and merchandising"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={exactLabelClass}>
              Category *
              <select
                className={exactInputClass}
                onChange={(event) =>
                  applyCatalogSelection(
                    event.target.value,
                    rootCategoryOptions,
                    setCategoryId,
                    setCategory,
                  )
                }
                value={optionValueFor(categoryId, category)}
              >
                {rootCategoryOptions.map((option) => (
                  <option
                    key={option.id}
                    value={optionValueFor(option.id, option.name)}
                  >
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={exactLabelClass}>
              Brand *
              <select
                className={exactInputClass}
                onChange={(event) =>
                  applyCatalogSelection(
                    event.target.value,
                    visibleBrandOptions,
                    setBrandId,
                    setBrand,
                  )
                }
                value={optionValueFor(brandId, brand)}
              >
                {visibleBrandOptions.map((option) => (
                  <option
                    key={option.id}
                    value={optionValueFor(option.id, option.name)}
                  >
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={exactLabelClass}>
              Primary concern
              <select
                className={exactInputClass}
                onChange={(event) => {
                  const selected = visibleConcernOptions.find(
                    (item) =>
                      optionValueFor(item.id, item.name) === event.target.value,
                  );
                  if (!selected) return;
                  const nextId = String(selected.id).startsWith("name:")
                    ? ""
                    : String(selected.id);
                  setConcernId(nextId);
                  setConcernIds(nextId ? [nextId] : []);
                  setConcern(selected.name);
                }}
                value={optionValueFor(concernId, concern)}
              >
                {visibleConcernOptions.map((option) => (
                  <option
                    key={option.id}
                    value={optionValueFor(option.id, option.name)}
                  >
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={exactLabelClass}>
              Collection
              <select
                className={exactInputClass}
                onChange={(event) => setCollection(event.target.value)}
                value={collection}
              >
                <option value="">No collection</option>
                <option>Body Brightening</option>
                <option>New Arrivals</option>
                <option>Best Sellers</option>
                <option>Editor's Picks</option>
                <option>Routine Bundles</option>
              </select>
            </label>
          </div>
          <label className={exactLabelClass}>
            Search tags
            <input
              className={exactInputClass}
              onChange={(event) => setSearchTags(event.target.value)}
              placeholder="acne, cleanser, daily routine"
              value={searchTags}
            />
            <span className="mt-2 block text-[7px] font-medium text-[#8c9892]">
              Comma-separated internal search terms. They do not create sidebar
              modules.
            </span>
          </label>
          <div className="divide-y divide-[#edf0ee] rounded-xl border border-[#e2e8e5]">
            <ExactToggle
              checked={websiteVisible}
              grouped
              helper="Customers can find and purchase this product"
              label="Visible on storefront"
              onChange={(value) => applyToggleChange(setWebsiteVisible, value)}
            />
            <ExactToggle
              checked={featured}
              grouped
              helper="Eligible for homepage merchandising blocks"
              label="Featured product"
              onChange={(value) => applyToggleChange(setFeatured, value)}
            />
            <ExactToggle
              checked={bestSellerBadge}
              grouped
              helper="Use only when supported by sales rules"
              label="Best seller badge"
              onChange={(value) =>
                applyToggleChange(setBestSellerBadge, value)
              }
            />
          </div>
        </ExactEditorSection>
      );
    }

    if (activeEditorSection === "content") {
      return (
        <div className="space-y-4">
          <ExactEditorSection
            helper="Reusable content fields power the existing product page without inventing claims."
            kicker="Structured product content"
            title="Benefits, ingredients and safe use"
          >
            <label className={exactLabelClass}>
              Product benefits *
              <textarea
                className={`${exactTextAreaClass} h-28`}
                onChange={(event) =>
                  setBenefitRows(event.target.value.split(/\r?\n/))
                }
                value={benefitRows.join("\n")}
              />
              <span className="mt-2 block text-[7px] leading-4 font-medium text-[#8c9892]">
                One customer-relevant benefit per line. Avoid medical,
                whitening or guaranteed-result claims.
              </span>
            </label>
            <label className={exactLabelClass}>
              Key ingredients
              <input
                className={exactInputClass}
                onChange={(event) =>
                  setKeyIngredientRows(
                    event.target.value.split(",").map((item) => item.trim()),
                  )
                }
                value={keyIngredientRows.join(", ")}
              />
            </label>
            <label className={exactLabelClass}>
              Full ingredients / INCI *
              <textarea
                className={`${exactTextAreaClass} h-32`}
                onChange={(event) => setIngredients(event.target.value)}
                value={ingredients}
              />
              <span className="mt-2 block text-[7px] leading-4 font-medium text-[#8c9892]">
                Preserve the verified supplier or pack order. Do not infer
                missing ingredients.
              </span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={exactLabelClass}>
                How to use *
                <textarea
                  className={`${exactTextAreaClass} h-24`}
                  onChange={(event) => setHowToUse(event.target.value)}
                  value={howToUse}
                />
              </label>
              <label className={exactLabelClass}>
                Warnings *
                <textarea
                  className={`${exactTextAreaClass} h-24`}
                  onChange={(event) => setWarnings(event.target.value)}
                  value={warnings}
                />
              </label>
            </div>
            <label className={exactLabelClass}>
              Suitable for
              <input
                className={exactInputClass}
                onChange={(event) => setSuitableFor(event.target.value)}
                value={suitableFor}
              />
            </label>
          </ExactEditorSection>

          <ExactEditorSection
            helper="Answer genuine pre-purchase questions in a clear, non-medical tone."
            kicker="Customer questions"
            title="Frequently asked questions"
          >
            {faqRows.length ? (
              faqRows.map((faq, index) => (
                <div
                  className="rounded-xl border border-[#e2e8e5] bg-[#fafbfa] p-4"
                  key={`faq-${index}`}
                >
                  <div className="flex items-center justify-between">
                    <b className="text-[8px] uppercase tracking-[0.1em] text-[#75827c]">
                      FAQ {index + 1}
                    </b>
                    <button
                      className="text-[7px] font-bold text-rose-700 disabled:opacity-35"
                      disabled={faqRows.length === 1}
                      onClick={() => removeFaqRow(index)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    className={exactInputClass}
                    onChange={(event) =>
                      updateFaqRow(index, "question", event.target.value)
                    }
                    placeholder="Customer question"
                    value={faq.question}
                  />
                  <textarea
                    className={`${exactTextAreaClass} min-h-20`}
                    onChange={(event) =>
                      updateFaqRow(index, "answer", event.target.value)
                    }
                    placeholder="Clear, concise answer"
                    value={faq.answer}
                  />
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[#cbd8d4] p-5 text-center text-[8px] text-[#87928d]">
                Add a genuine customer question and a clear answer.
              </div>
            )}
            <button
              className="flex h-9 items-center gap-2 rounded-xl border border-[#cfdcd8] bg-white px-3 text-[8px] font-bold text-[#3b646d]"
              onClick={addFaqRow}
              type="button"
            >
              + Add FAQ
            </button>
          </ExactEditorSection>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/65 p-4 text-[8px] leading-4 text-amber-800">
            Any ingredient, percentage, dermatology or treatment claim must
            come from verified product documentation and the existing approval
            process.
          </div>
        </div>
      );
    }

    if (activeEditorSection === "variants") {
      return (
        <ExactEditorSection
          helper="Use variants only when the customer must choose size, shade or another sellable option."
          kicker="Product options"
          title="Variants and combinations"
        >
          <ExactToggle
            checked={isVariantProduct}
            helper="Each combination needs its own SKU, price and stock record."
            label="Variant product"
            onChange={(value) => {
              applyToggleChange(
                setProductType,
                value ? "Variant Product" : "Single Product",
              );
            }}
          />
          {!isVariantProduct ? (
            <div className="rounded-xl border border-[#dce7e4] bg-[#f7f9f8] p-5 text-center">
              <div className="text-[10px] font-bold text-[#42564d]">
                This is currently a simple product
              </div>
              <p className="mx-auto mt-2 max-w-md text-[7.5px] leading-5 text-[#819089]">
                Turn on variants only if customers select an option. Inventory
                remains separate for every resulting SKU.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#dce5e2] bg-[#f8faf9] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-[9px] font-bold text-[#42564d]">
                      Option builder
                    </div>
                    <p className="mt-1 text-[7px] leading-4 text-[#7d8b84]">
                      Combine size, shade, scent, finish or pack. Up to 3 option
                      types and 100 sellable combinations.
                    </p>
                  </div>
                  <button
                    className="h-9 shrink-0 rounded-xl border border-[#cfdcd8] bg-white px-3 text-[8px] font-bold text-[#3b646d]"
                    onClick={addVariantOptionGroup}
                    type="button"
                  >
                    + Add option
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {variantOptionGroups.map((group, index) => (
                    <div
                      className="grid gap-3 rounded-xl border border-[#e1e7e4] bg-white p-3 sm:grid-cols-[.75fr_.65fr_1.4fr_auto]"
                      key={group.id}
                    >
                      <label className={exactLabelClass}>
                        Option type
                        <input
                          className={exactInputClass}
                          list="bnb-variant-option-types"
                          onChange={(event) =>
                            updateVariantOptionGroup(
                              index,
                              "name",
                              event.target.value,
                            )
                          }
                          placeholder="Size"
                          value={group.name}
                        />
                      </label>
                      <label className={exactLabelClass}>
                        Storefront display
                        <select
                          className={exactInputClass}
                          onChange={(event) =>
                            updateVariantOptionGroup(
                              index,
                              "displayType",
                              event.target.value,
                            )
                          }
                          value={group.displayType || "text"}
                        >
                          <option value="text">Text buttons</option>
                          <option value="color">Color swatches</option>
                          <option value="image">Image swatches</option>
                        </select>
                      </label>
                      <label className={exactLabelClass}>
                        Values (comma separated)
                        <input
                          className={exactInputClass}
                          onChange={(event) =>
                            updateVariantOptionGroup(
                              index,
                              "values",
                              event.target.value,
                            )
                          }
                          placeholder="50 ml, 100 ml, 150 ml"
                          value={group.draftValueText ?? group.values.join(", ")}
                        />
                      </label>
                      <button
                        aria-label={`Remove ${group.name || `option ${index + 1}`}`}
                        className="mt-auto h-10 rounded-xl border border-rose-100 px-3 text-[8px] font-bold text-rose-700 disabled:opacity-30"
                        disabled={variantOptionGroups.length === 1}
                        onClick={() => removeVariantOptionGroup(index)}
                        type="button"
                      >
                        Remove
                      </button>
                      {group.displayType === "color" && group.values.length ? (
                        <div className="grid gap-2 border-t border-[#edf0ee] pt-3 sm:col-span-4 sm:grid-cols-3">
                          {group.values.map((optionValue) => (
                            <label
                              className="flex items-center justify-between gap-3 rounded-lg bg-[#f7f9f8] px-3 py-2 text-[7.5px] font-bold text-[#596861]"
                              key={optionValue}
                            >
                              <span className="truncate">{optionValue}</span>
                              <input
                                className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                                onChange={(event) =>
                                  updateVariantOptionGroup(
                                    index,
                                    `swatch:${optionValue}`,
                                    event.target.value,
                                  )
                                }
                                type="color"
                                value={group.swatches?.[optionValue] || "#78999b"}
                              />
                            </label>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                  <datalist id="bnb-variant-option-types">
                    <option value="Size" />
                    <option value="Shade / Color" />
                    <option value="Scent" />
                    <option value="Finish" />
                    <option value="Pack" />
                    <option value="Strength / Formula" />
                    <option value="Style" />
                  </datalist>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[7px] font-semibold text-[#718078]">
                    {variantCombinationCount || 0} combination{variantCombinationCount === 1 ? "" : "s"} ready
                  </span>
                  <button
                    className="h-10 rounded-xl bg-[#5f8585] px-4 text-[8px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!variantCombinationCount || variantCombinationCount > 100}
                    onClick={generateVariantCombinations}
                    type="button"
                  >
                    Generate combinations
                  </button>
                </div>
              </div>

              {variantMatrixIsStale ? (
                <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-[7.5px] font-semibold text-amber-800">
                  Option values changed. Generate combinations again; matching
                  rows keep their existing price, cost, stock and image.
                </div>
              ) : null}

              {variants.length ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#dce5e2] bg-[#f8faf9] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-[9px] font-bold text-[#42564d]">
                          Bulk pricing
                        </div>
                        <p className="mt-1 text-[7px] text-[#7d8b84]">
                          Enter only the values you want to apply to every sellable variant.
                        </p>
                      </div>
                      <button
                        className="h-9 rounded-xl border border-[#cfdcd8] bg-white px-3 text-[7.5px] font-bold text-[#466f70]"
                        onClick={copyDefaultPricingToVariants}
                        type="button"
                      >
                        Copy default pricing to all
                      </button>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-4">
                      {[
                        ["sale", "Selling price"],
                        ["regular", "MRP / Compare-at"],
                        ["cost", "Purchase cost"],
                      ].map(([field, label]) => (
                        <label className={exactLabelClass} key={field}>
                          {label}
                          <input
                            className={exactInputClass}
                            min="0"
                            onChange={(event) =>
                              setBulkVariantPricing((current) => ({
                                ...current,
                                [field]: event.target.value,
                              }))
                            }
                            placeholder="Leave blank to keep existing"
                            type="number"
                            value={bulkVariantPricing[field]}
                          />
                        </label>
                      ))}
                      <button
                        className="mt-auto h-10 rounded-xl bg-[#5f8585] px-3 text-[8px] font-bold text-white"
                        onClick={applyBulkVariantPricing}
                        type="button"
                      >
                        Apply to all
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#cfe0dc] bg-[#eef6f4] px-4 py-3 text-[7.5px] leading-5 text-[#55736d]">
                    Step 2: open every combination below and complete its
                    Selling price, MRP, Purchase cost and image rule. Pricing is
                    intentionally edited here—not duplicated in Pricing.
                  </div>

                  <div className="space-y-3">
                    {variants.map((variant, index) => {
                      const variantGallery = variant.galleryImages ||
                        (variant.imageUrl ? [variant.imageUrl] : []);
                      const commonGallery = [imageUrl, ...galleryImages].filter(Boolean);
                      const isExpanded =
                        String(expandedVariantId) === String(variant.id);
                      const priceComplete =
                        Number(variant.sale) > 0 && Number(variant.cost) > 0;
                      const imageMode = variantGallery.length
                        ? `${variantGallery.length} dedicated image${variantGallery.length === 1 ? "" : "s"}`
                        : "Inherits common gallery";

                      return (
                        <div
                          className={`overflow-hidden rounded-xl border bg-white ${isExpanded ? "border-[#7d9b9a] ring-2 ring-[#7d9b9a]/10" : "border-[#e1e7e4]"}`}
                          key={variant.id || index}
                        >
                          <button
                            className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                            onClick={() =>
                              setExpandedVariantId(isExpanded ? "" : String(variant.id))
                            }
                            type="button"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span
                                className="h-11 w-11 shrink-0 rounded-xl border border-[#dce4e0] bg-[#f8faf9] bg-contain bg-center bg-no-repeat"
                                style={
                                  variant.imageUrl || imageUrl
                                    ? { backgroundImage: `url(${variant.imageUrl || imageUrl})` }
                                    : undefined
                                }
                              />
                              <div className="min-w-0">
                                <div className="truncate text-[10px] font-bold text-[#40534b]">
                                  {variant.option || `Variant ${index + 1}`}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-2 text-[7px] text-[#7e8b84]">
                                  <span>{variant.sku || "SKU pending"}</span>
                                  <span>·</span>
                                  <span>{variant.sale ? `৳${Number(variant.sale).toLocaleString()}` : "Price pending"}</span>
                                  <span>·</span>
                                  <span>{imageMode}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className={`rounded-full px-2 py-1 text-[6.5px] font-bold ${priceComplete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                                {priceComplete ? "Pricing ready" : "Needs pricing"}
                              </span>
                              <span className="text-[11px] font-bold text-[#5f8585]">
                                {isExpanded ? "−" : "+"}
                              </span>
                            </div>
                          </button>

                          {isExpanded ? (
                            <div className="space-y-5 border-t border-[#edf0ee] bg-[#fbfcfb] p-4">
                              <div>
                                <div className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#668079]">
                                  Price & identity
                                </div>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                  {[
                                    ["sale", "Selling price *", "number"],
                                    ["regular", "MRP / Compare-at", "number"],
                                    ["cost", "Purchase cost *", "number"],
                                    ["sku", "Variant SKU *", "text"],
                                    ["barcode", "Barcode / GTIN", "text"],
                                  ].map(([field, label, type]) => (
                                    <label className={exactLabelClass} key={field}>
                                      {label}
                                      <input
                                        className={exactInputClass}
                                        min={type === "number" ? "0" : undefined}
                                        onChange={(event) =>
                                          updateVariantField(
                                            index,
                                            field,
                                            field === "sku"
                                              ? event.target.value
                                                  .toUpperCase()
                                                  .replace(/[^A-Z0-9-]+/g, "-")
                                              : event.target.value,
                                          )
                                        }
                                        type={type}
                                        value={variant[field] || ""}
                                      />
                                    </label>
                                  ))}
                                </div>
                              </div>

                              <div className="rounded-xl border border-[#dce5e2] bg-white p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <div className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#668079]">
                                      Variant gallery
                                    </div>
                                    <p className="mt-1 text-[7px] leading-4 text-[#849088]">
                                      Upload different packaging/texture images, reuse a common image, or inherit the complete common gallery.
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      className="h-9 rounded-xl border border-[#cfdcd8] bg-white px-3 text-[7px] font-bold text-[#466f70]"
                                      onClick={() => inheritCommonGalleryForVariant(index)}
                                      type="button"
                                    >
                                      Inherit common gallery
                                    </button>
                                    <label className="flex h-9 cursor-pointer items-center rounded-xl bg-[#5f8585] px-3 text-[7px] font-bold text-white">
                                      + Upload variant images
                                      <input
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        disabled={
                                          isUploadingImage ||
                                          variantGallery.length >= MAX_VARIANT_GALLERY_IMAGES
                                        }
                                        multiple
                                        onChange={(event) =>
                                          handleVariantImageUpload(event, index)
                                        }
                                        type="file"
                                      />
                                    </label>
                                  </div>
                                </div>

                                {variantGallery.length ? (
                                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    {variantGallery.map((variantImage, imageIndex) => (
                                      <div
                                        className="overflow-hidden rounded-xl border border-[#dce5e2]"
                                        key={`${variantImage}-${imageIndex}`}
                                      >
                                        <div
                                          className="h-28 bg-[#f8faf9] bg-contain bg-center bg-no-repeat"
                                          style={{ backgroundImage: `url(${variantImage})` }}
                                        />
                                        <div className="space-y-2 p-2">
                                          <input
                                            className="h-8 w-full rounded-lg border border-[#dce4e0] px-2 text-[7px] outline-none"
                                            onChange={(event) => {
                                              setVariants((current) =>
                                                current.map((item, itemIndex) =>
                                                  itemIndex === index
                                                    ? {
                                                        ...item,
                                                        galleryAltTexts: {
                                                          ...(item.galleryAltTexts || {}),
                                                          [variantImage]: event.target.value,
                                                        },
                                                      }
                                                    : item,
                                                ),
                                              );
                                              setIsDirty(true);
                                              setSaveStatus("Unsaved changes");
                                            }}
                                            placeholder="Image alt text"
                                            value={variant.galleryAltTexts?.[variantImage] || ""}
                                          />
                                          <div className="grid grid-cols-3 gap-1">
                                            <button className="h-7 rounded border border-[#dce4e0] text-[7px] disabled:opacity-30" disabled={imageIndex === 0} onClick={() => moveVariantGalleryImage(index, imageIndex, -1)} type="button">←</button>
                                            <button className="h-7 rounded border border-[#dce4e0] text-[7px] disabled:opacity-30" disabled={imageIndex === variantGallery.length - 1} onClick={() => moveVariantGalleryImage(index, imageIndex, 1)} type="button">→</button>
                                            <button className="h-7 rounded border border-rose-100 text-[7px] font-bold text-rose-700" onClick={() => removeVariantGalleryImage(index, imageIndex)} type="button">Remove</button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="mt-4 rounded-xl border border-dashed border-[#cfdcd8] bg-[#f8faf9] p-4 text-center text-[7.5px] text-[#718078]">
                                    Inheriting the common product gallery. Upload only when this combination looks different.
                                  </div>
                                )}

                                {commonGallery.length ? (
                                  <div className="mt-4">
                                    <div className="text-[7px] font-bold text-[#668079]">
                                      Reuse from common gallery
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {commonGallery.slice(0, 10).map((commonImage) => (
                                        <button
                                          aria-label="Add common image to this variant"
                                          className="h-12 w-12 rounded-lg border border-[#dce4e0] bg-white bg-contain bg-center bg-no-repeat"
                                          key={commonImage}
                                          onClick={() => addCommonImageToVariant(index, commonImage)}
                                          style={{ backgroundImage: `url(${commonImage})` }}
                                          type="button"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>

                              <div>
                                <div className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#668079]">
                                  Shipping overrides
                                </div>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                  {[
                                    ["weight", "Weight (kg)"],
                                    ["packageLength", "Length (cm)"],
                                    ["packageWidth", "Width (cm)"],
                                    ["packageHeight", "Height (cm)"],
                                  ].map(([field, label]) => (
                                    <label className={exactLabelClass} key={field}>
                                      {label}
                                      <input
                                        className={exactInputClass}
                                        min="0"
                                        onChange={(event) =>
                                          updateVariantField(index, field, event.target.value)
                                        }
                                        placeholder="Inherit product value if blank"
                                        step="0.01"
                                        type="number"
                                        value={variant[field] || ""}
                                      />
                                    </label>
                                  ))}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dce5e2] bg-white p-3">
                                <div className="flex flex-wrap items-center gap-4">
                                  <label className="flex cursor-pointer items-center gap-2 text-[7.5px] font-bold text-[#60746b]">
                                    <input
                                      checked={Boolean(variant.isDefault)}
                                      name="bnb-default-variant"
                                      onChange={() => {
                                        setVariants((current) =>
                                          current.map((item, itemIndex) => ({
                                            ...item,
                                            isDefault: itemIndex === index,
                                          })),
                                        );
                                        setIsDirty(true);
                                        setSaveStatus("Unsaved changes");
                                      }}
                                      type="radio"
                                    />
                                    Default storefront variant
                                  </label>
                                  <button
                                    aria-pressed={variant.status === "Active"}
                                    className={`h-8 rounded-xl px-3 text-[7px] font-bold ${variant.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                                    onClick={() =>
                                      updateVariantField(
                                        index,
                                        "status",
                                        variant.status === "Active" ? "Disabled" : "Active",
                                      )
                                    }
                                    type="button"
                                  >
                                    {variant.status === "Active" ? "Sellable" : "Disabled"}
                                  </button>
                                  <span className="text-[7px] font-semibold text-[#7b8982]">
                                    Stock: {Number(variant.stock || 0).toLocaleString()} units
                                  </span>
                                </div>
                                <button
                                  className="h-8 rounded-xl border border-rose-100 px-3 text-[7px] font-bold text-rose-700 disabled:opacity-30"
                                  disabled={variants.length === 1}
                                  onClick={() => removeOrDisableVariant(index)}
                                  type="button"
                                >
                                  Remove combination
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col gap-2 rounded-xl border border-[#e1e7e4] bg-[#fbfcfb] px-4 py-3 text-[7.5px] font-semibold text-[#6f7e77] sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      {variants.length} variant{variants.length === 1 ? "" : "s"} · {Number(previewStockQty || 0).toLocaleString()} total units
                    </span>
                    <span>
                      Parent gallery: {(imageUrl ? 1 : 0) + galleryImages.length} · Variant gallery limit: {MAX_VARIANT_GALLERY_IMAGES} each
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#cfdcd8] bg-white p-6 text-center text-[8px] text-[#718078]">
                  Add option values, then generate combinations.
                </div>
              )}
            </div>
          )}
          <div className="rounded-xl border border-[#dce8e5] bg-[#f1f7f6] px-4 py-3 text-[7px] leading-4 text-[#668079]">
            Stock shown here is read-only. Receipts, purchases, adjustments and
            returns must create inventory movement records.
          </div>
          {isVariantProduct ? (
            <div className="rounded-xl border border-[#cfe0dc] bg-[#eef6f4] px-4 py-3 text-[7px] leading-4 text-[#55736d]">
              Variant media rule: a dedicated gallery appears when that option
              is selected on the storefront. If empty, the complete common
              product gallery is inherited automatically.
            </div>
          ) : null}
        </ExactEditorSection>
      );
    }

    return (
      <div className="space-y-4">
        <ExactEditorSection
          helper="Keep metadata useful and consistent with the visible product content."
          kicker="Search preview"
          title="SEO and discoverability"
        >
          <label className={exactLabelClass}>
            SEO title
            <input
              className={exactInputClass}
              maxLength={70}
              onChange={(event) => setSeoTitle(event.target.value)}
              value={seoTitle}
            />
            <span className={`mt-1 block text-right text-[7px] font-medium ${seoTitleText.length > 60 ? "text-amber-700" : "text-[#9aa49f]"}`}>
              {seoTitleText.length}/60 recommended
            </span>
          </label>
          <label className={exactLabelClass}>
            Meta description
            <textarea
              className={`${exactTextAreaClass} h-28`}
              maxLength={180}
              onChange={(event) => setMetaDescription(event.target.value)}
              value={metaDescription}
            />
            <span className={`mt-1 block text-right text-[7px] font-medium ${metaDescriptionText.length > 160 ? "text-amber-700" : "text-[#9aa49f]"}`}>
              {metaDescriptionText.length}/160 recommended
            </span>
          </label>
          <div className="rounded-xl border border-[#e2e8e5] bg-[#fafbfa] p-4">
            <div className="text-[7px] text-[#668079]">
              brandnbeauty.com › products › {autoSlug}
            </div>
            <div className="mt-2 text-[13px] font-bold text-[#315d87]">
              {seoTitleText}
            </div>
            <p className="mt-2 text-[8px] leading-5 text-[#64736c]">
              {metaDescriptionText}
            </p>
          </div>
        </ExactEditorSection>

        <ExactEditorSection
          helper="Accurate physical data supports courier booking, packaging and profitability."
          kicker="Fulfilment data"
          title="Shipping and sourcing"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={exactLabelClass}>
              Shipping weight (kg) *
              <input
                className={exactInputClass}
                min="0"
                onChange={(event) => setWeight(event.target.value)}
                step="0.01"
                type="number"
                value={weight}
              />
            </label>
            <label className={exactLabelClass}>
              Primary supplier
              <select
                className={exactInputClass}
                onChange={(event) => setPrimarySupplier(event.target.value)}
                value={primarySupplier}
              >
                <option>Izabel Health Care</option>
                <option>Beauty Source BD</option>
                <option>K-Beauty Imports</option>
                <option>Direct Brand Supplier</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className={exactLabelClass}>
              Length (cm)
              <input
                className={exactInputClass}
                min="0"
                onChange={(event) => setPackageLength(event.target.value)}
                type="number"
                value={packageLength}
              />
            </label>
            <label className={exactLabelClass}>
              Width (cm)
              <input
                className={exactInputClass}
                min="0"
                onChange={(event) => setPackageWidth(event.target.value)}
                type="number"
                value={packageWidth}
              />
            </label>
            <label className={exactLabelClass}>
              Height (cm)
              <input
                className={exactInputClass}
                min="0"
                onChange={(event) => setPackageHeight(event.target.value)}
                type="number"
                value={packageHeight}
              />
            </label>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              ["COD eligible", "Yes"],
              ["Fragile handling", "No"],
              ["Temperature control", "No"],
            ].map(([label, value]) => (
              <div
                className="rounded-xl border border-[#e2e8e5] bg-[#fafbfa] p-3"
                key={label}
              >
                <span className="text-[7px] text-[#87928d]">{label}</span>
                <b className="mt-1.5 block text-[8.5px] text-[#405049]">
                  {value}
                </b>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/65 p-4 text-[8px] leading-4 text-amber-800">
            Supplier price and stock receipts belong to Purchasing. This field
            only records the default sourcing relationship.
          </div>
        </ExactEditorSection>
      </div>
    );
  };

  return (
    <ProductEditorFrame embedded={_props.embedded}>
      <div className="space-y-5" onChangeCapture={markEditorDirty}>
        {actionToast && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            Success: {actionToast}
          </div>
        )}

        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <button
              className="flex items-center gap-2 text-[8.5px] font-bold text-[#6d7c75] hover:text-[#3b646d]"
              onClick={goBackToProducts}
              type="button"
            >
              ← Back to products
            </button>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#3b646d]">
                Catalog Editor
              </div>
              <Badge
                tone={
                  status === "Visible"
                    ? "good"
                    : status === "Archived"
                      ? "bad"
                      : "warn"
                }
              >
                {status === "Visible" ? "Live product" : status}
              </Badge>
              {isDirty ? (
                <span className="rounded-full bg-amber-50 px-2 py-1 text-[7px] font-bold text-amber-700">
                  Unsaved changes
                </span>
              ) : null}
            </div>
            <h1 className="mt-2 text-[25px] font-bold tracking-[-0.03em] text-[#17231f] sm:text-[29px]">
              {productName || "Add new product"}
            </h1>
            <div className="mt-1 font-mono text-[8px] text-[#8d9893]">
              {autoSku} · {saveStatus}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="flex h-10 items-center gap-2 rounded-xl border border-[#dce4e0] bg-white px-3.5 text-[8.5px] font-bold text-[#596962]"
              onClick={() =>
                window.open(
                  storefrontProductUrl,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
              type="button"
            >
              Preview
            </button>
            <button
              className="flex h-10 items-center gap-2 rounded-xl border border-[#cfdcd8] bg-white px-3.5 text-[8.5px] font-bold text-[#416764] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={isSavingProduct || isUploadingImage}
              onClick={saveDraft}
              type="button"
            >
              Save draft
            </button>
            <button
              className="flex h-10 items-center gap-2 rounded-xl bg-[#3b646d] px-4 text-[8.5px] font-bold text-white shadow-sm disabled:bg-slate-300"
              disabled={
                isSavingProduct || isUploadingImage || status === "Archived"
              }
              onClick={() => setPublishModalOpen(true)}
              type="button"
            >
              Review & publish
            </button>
          </div>
        </section>

        <div className="sticky top-3 z-20 rounded-[1.6rem] border border-slate-200 bg-white/95 p-3 shadow-md backdrop-blur xl:hidden">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#5E7F85]">
                Product Editor
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-600">
                {productName || "New Product Draft"} -{" "}
                {isVariantProduct ? `${variants.length} variants` : autoSku}
              </div>
              <div
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${saveStatus.includes("Saved") || saveStatus.includes("Published") ? "bg-emerald-50 text-emerald-700" : saveStatus.includes("Saving") ? "bg-amber-50 text-amber-700" : "bg-stone-100 text-slate-600"}`}
              >
                {isDirty ? "Unsaved changes" : saveStatus}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveDraft}
                disabled={isSavingProduct || isUploadingImage}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingProduct
                  ? "Saving..."
                  : isUploadingImage
                    ? "Uploading image..."
                    : "Save as Draft"}
              </button>
              <button
                type="button"
                onClick={saveChanges}
                disabled={
                  isSavingProduct || isUploadingImage || status === "Archived"
                }
                className="rounded-2xl border border-[#5E7F85]/30 bg-[#5E7F85]/10 px-4 py-3 text-sm font-semibold text-[#5E7F85] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingProduct ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setPublishModalOpen(true)}
                disabled={
                  isSavingProduct || isUploadingImage || status === "Archived"
                }
                className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Save & Make Visible
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[205px_minmax(0,1fr)_285px]">
          <aside className="h-fit overflow-hidden rounded-2xl border border-[#e2e8e5] bg-white xl:sticky xl:top-[94px]">
            <label
              className="mb-3 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400 xl:hidden"
              htmlFor="product-editor-section"
            >
              Editor Section
            </label>
            <select
              id="product-editor-section"
              value={activeEditorSection}
              onChange={(event) => setActiveEditorSection(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none xl:hidden"
            >
              {editorSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.label}
                </option>
              ))}
            </select>
            <div className="hidden border-b border-[#edf0ee] p-4 xl:block">
              <div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#8a9590]">
                Product sections
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf1ef]">
                <div
                  className="h-full rounded-full bg-[#5f8585]"
                  style={{ width: `${readinessPercent}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[7px] text-[#929d97]">Completeness</span>
                <b className="text-[8px] text-[#3b646d]">{readinessPercent}%</b>
              </div>
            </div>
            <nav
              className="hidden p-2 xl:block"
              aria-label="Product editor sections"
            >
              {editorSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveEditorSection(section.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${activeEditorSection === section.id ? "bg-[#edf3f4] text-[#3b646d]" : "text-[#65736c] hover:bg-[#f6f8f7]"}`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${activeEditorSection === section.id ? "bg-white" : "bg-[#f2f5f3]"}`}
                  >
                    {section.icon}
                  </span>
                  <span className="min-w-0">
                    <b className="block text-[8.5px]">{section.label}</b>
                    <small className="mt-0.5 block truncate text-[6.5px] font-medium text-[#929d97]">
                      {section.helper}
                    </small>
                  </span>
                </button>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 space-y-4">
            {renderExactReferenceSection()}
          </div>

          {false && (
          <div>
            <div className="space-y-4">
              <div
                style={{
                  display: activeEditorSection === "basic" ? undefined : "none",
                }}
                className="overflow-hidden rounded-2xl border border-[#e2e8e5] bg-white"
              >
                <div className="border-b border-[#edf0ee] p-5">
                  <div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#3b646d]">
                    Product identity
                  </div>
                  <h2 className="mt-2 text-[17px] font-bold text-[#26362f]">
                    General information
                  </h2>
                  <p className="mt-1 text-[8px] text-[#82908a]">
                    Core storefront identity and customer-facing summary.
                  </p>
                </div>
                <div className="space-y-4 p-5">
                  <label className="block text-[8px] font-bold text-[#596861]">
                    Product name *
                    <input
                      value={productName}
                      onChange={(event) => setProductName(event.target.value)}
                      className="mt-2 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[8.5px] font-semibold text-[#405049] outline-none"
                      placeholder="Product name"
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-[8px] font-bold text-[#596861]">
                      Product type
                      <select
                        value={productType}
                        onChange={(event) => setProductType(event.target.value)}
                        className="mt-2 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[8.5px] font-semibold text-[#405049] outline-none"
                      >
                        <option value="Single Product">Simple product</option>
                        <option value="Variant Product">Variant product</option>
                      </select>
                    </label>
                    <label className="block text-[8px] font-bold text-[#596861]">
                      Storefront slug *
                      <div className="mt-2 flex h-10 items-center overflow-hidden rounded-xl border border-[#dce4e0] bg-white">
                        <span className="border-r border-[#e5eae8] bg-[#fafbfa] px-3 text-[7px] text-[#929d97]">
                          /products/
                        </span>
                        <input
                          value={autoSlug}
                          readOnly
                          className="min-w-0 flex-1 px-3 text-[8.5px] font-semibold text-[#405049] outline-none"
                        />
                      </div>
                    </label>
                  </div>
                  <label className="block text-[8px] font-bold text-[#596861]">
                    Short description *
                    <textarea
                      value={shortDescription}
                      onChange={(event) =>
                        setShortDescription(event.target.value)
                      }
                      className="mt-2 min-h-20 w-full rounded-xl border border-[#dce4e0] bg-white p-3 text-[8.5px] leading-5 text-[#405049] outline-none"
                    />
                  </label>
                  <label className="block text-[8px] font-bold text-[#596861]">
                    Full description
                    <textarea
                      value={fullDescription}
                      onChange={(event) =>
                        setFullDescription(event.target.value)
                      }
                      className="mt-2 min-h-40 w-full rounded-xl border border-[#dce4e0] bg-white p-3 text-[8.5px] leading-5 text-[#405049] outline-none"
                    />
                  </label>
                </div>
              </div>
              <div
                style={{
                  display: activeEditorSection === "basic" ? undefined : "none",
                }}
                className="flex gap-3 rounded-2xl border border-[#d8e4e1] bg-[#edf3f4] p-4 text-[8px] leading-4 text-[#526965]"
              >
                <span className="mt-0.5 shrink-0 text-emerald-700">✓</span>
                <p>
                  The storefront design stays unchanged. These fields replace
                  the content inside the existing product-detail layout.
                </p>
              </div>

              <div
                style={{
                  display:
                    activeEditorSection === "organization" ? undefined : "none",
                }}
                className="overflow-hidden rounded-2xl border border-[#e2e8e5] bg-white"
              >
                <div className="border-b border-[#edf0ee] p-5">
                  <div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#3b646d]">
                    Catalog placement
                  </div>
                  <h2 className="mt-2 text-[17px] font-bold text-[#26362f]">
                    Organization
                  </h2>
                  <p className="mt-1 text-[8px] text-[#82908a]">
                    Category, brand, concern and merchandising relationships.
                  </p>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-2">
                  <label className="block text-[8px] font-bold text-[#596861]">
                    <span className="flex items-center justify-between">
                      Brand
                      <button
                        type="button"
                        onClick={() =>
                          setBrandList((current) =>
                            current.includes("New Brand")
                              ? current
                              : [...current, "New Brand"],
                          )
                        }
                        className="text-[7px] font-bold text-[#3b646d]"
                      >
                        + Add Brand
                      </button>
                    </span>
                    <select
                      value={optionValueFor(brandId, brand)}
                      onChange={(event) =>
                        applyCatalogSelection(
                          event.target.value,
                          visibleBrandOptions,
                          setBrandId,
                          setBrand,
                        )
                      }
                      className="mt-2 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[8.5px] font-semibold text-[#405049] outline-none"
                    >
                      {visibleBrandOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-[8px] font-bold text-[#596861]">
                    Category
                    <select
                      value={optionValueFor(categoryId, category)}
                      onChange={(event) => {
                        applyCatalogSelection(
                          event.target.value,
                          rootCategoryOptions,
                          setCategoryId,
                          setCategory,
                        );
                        setSubcategoryId("");
                        setSubcategory("");
                      }}
                      className="mt-2 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[8.5px] font-semibold text-[#405049] outline-none"
                    >
                      {rootCategoryOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-[8px] font-bold text-[#596861]">
                    Subcategory
                    <select
                      value={subcategoryId}
                      onChange={(event) => {
                        const nextId = event.target.value;
                        const selected = subcategoryOptions.find(
                          (item) => String(item.id) === String(nextId),
                        );
                        setSubcategoryId(nextId);
                        setSubcategory(selected?.name || "");
                      }}
                      className="mt-2 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[8.5px] font-semibold text-[#405049] outline-none"
                    >
                      <option value="">No subcategory</option>
                      {subcategoryOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-[8px] font-bold text-[#596861]">
                    Parent SKU
                    <input
                      value={autoSku}
                      readOnly
                      className="mt-2 h-10 w-full rounded-xl border border-[#dce4e0] bg-[#fafbfa] px-3 text-[8.5px] font-semibold text-[#405049] outline-none"
                    />
                  </label>
                  <fieldset className="sm:col-span-2">
                    <legend className="text-[8px] font-bold text-[#596861]">
                      Concerns
                    </legend>
                    <div className="mt-2 grid gap-2 rounded-xl border border-[#dce4e0] bg-white p-3 sm:grid-cols-2">
                      {visibleConcernOptions.map((item) => {
                        const itemId = String(item.id);
                        const persistedId = itemId.startsWith("name:")
                          ? ""
                          : itemId;
                        const checked = persistedId
                          ? concernIds.includes(persistedId)
                          : concern === item.name;
                        return (
                          <label
                            className="flex items-center gap-2 rounded-lg bg-[#fafbfa] px-3 py-2 text-[8px] font-semibold text-[#596861]"
                            key={item.id}
                          >
                            <input
                              checked={checked}
                              className="h-3.5 w-3.5 accent-[#3b646d]"
                              onChange={(event) =>
                                toggleConcern(item, event.target.checked)
                              }
                              type="checkbox"
                            />
                            {item.name}
                            {concernId === persistedId && persistedId ? (
                              <span className="ml-auto text-[6px] font-bold uppercase text-[#3b646d]">
                                Primary
                              </span>
                            ) : null}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                </div>
              </div>

              <div
                style={{
                  display: ["pricing", "inventory", "variants"].includes(
                    activeEditorSection,
                  )
                    ? undefined
                    : "none",
                }}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">
                      {activeEditorSection === "inventory"
                        ? "Inventory & Availability"
                        : activeEditorSection === "variants"
                          ? "Variants"
                          : "Pricing"}
                    </h2>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-stone-50 p-1">
                    {["Single Product", "Variant Product"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          if (
                            item === "Single Product" &&
                            isVariantProduct &&
                            variants.length &&
                            !window.confirm(
                              "Switch to single product? Existing variants will be kept and must be disabled explicitly when saving.",
                            )
                          )
                            return;
                          setProductType(item);
                        }}
                        className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${productType === item ? "bg-[#5E7F85] text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                {!isVariantProduct ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {[
                      [
                        "Regular Price",
                        regularPrice,
                        setRegularPrice,
                        "Original price before discount",
                      ],
                      [
                        "Selling Price",
                        salePrice,
                        setSalePrice,
                        "Enter the customer selling price",
                      ],
                      [
                        "Stock Qty",
                        stockQty,
                        setStockQty,
                        "Leave blank for draft",
                      ],
                      [
                        "Low Stock Alert",
                        lowStockAlert,
                        setLowStockAlert,
                        "Optional",
                      ],
                    ].map(([label, value, setter, helper]) => (
                      <label key={label} className="space-y-2">
                        <div className="text-sm font-medium text-slate-600">
                          {label}
                        </div>
                        <input
                          value={value}
                          onChange={(event) => setter(event.target.value)}
                          className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                          placeholder={String(helper)}
                        />
                      </label>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      display:
                        activeEditorSection === "variants" ? undefined : "none",
                    }}
                    className="mt-5 space-y-5"
                  >
                    <div className="rounded-2xl border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-4 text-sm font-semibold leading-6 text-slate-700">
                      Use variants when the same product is sold in options like
                      size, shade, color, volume or pack. Draft variants may
                      stay incomplete until staff are ready to publish.
                    </div>
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-end">
                      <label className="space-y-2">
                        <div className="text-sm font-medium text-slate-600">
                          Option Type
                        </div>
                        <select
                          value={variantOptionType}
                          onChange={(event) =>
                            setVariantOptionType(event.target.value)
                          }
                          className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                        >
                          <option>Size</option>
                          <option>Shade</option>
                          <option>Color</option>
                          <option>Volume</option>
                          <option>Pack</option>
                        </select>
                      </label>
                      <div className="flex flex-wrap gap-3 lg:justify-end">
                        <button
                          type="button"
                          onClick={addVariant}
                          className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white"
                        >
                          {variants.length
                            ? "+ Add Variant"
                            : "Add First Variant"}
                        </button>
                      </div>
                    </div>
                    {variants.length === 0 ? (
                      <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-stone-50 px-6 py-10 text-center">
                        <div className="text-sm font-bold text-slate-700">
                          No variants added yet.
                        </div>
                        <button
                          type="button"
                          onClick={addVariant}
                          className="mt-4 rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white"
                        >
                          Add First Variant
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-4 xl:grid-cols-2">
                        {variants.map((row, rowIndex) => {
                          const rowStatusLabel =
                            row.status === "Active"
                              ? "Visible"
                              : row.status === "Disabled"
                                ? "Hidden"
                                : "Draft";
                          return (
                            <div
                              key={row.id || `${row.option}-${rowIndex}`}
                              className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                    {variantOptionType || "Option"} Variant
                                  </div>
                                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                                    {row.option || `Variant ${rowIndex + 1}`}
                                  </h3>
                                  <div className="mt-1 text-xs font-semibold text-slate-500">
                                    {rowStatusLabel}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeOrDisableVariant(rowIndex)
                                  }
                                  className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700"
                                >
                                  {row.persisted ? "Hide Variant" : "Remove"}
                                </button>
                              </div>
                              <div className="mt-4 grid gap-3 md:grid-cols-2">
                                <label className="space-y-2">
                                  <div className="text-sm font-medium text-slate-600">
                                    Option Value
                                  </div>
                                  <input
                                    value={row.option || ""}
                                    onChange={(event) =>
                                      updateVariantField(
                                        rowIndex,
                                        "option",
                                        event.target.value,
                                      )
                                    }
                                    className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                                    placeholder="50ml / Natural Beige / Pack of 2"
                                  />
                                </label>
                                <label className="space-y-2">
                                  <div className="text-sm font-medium text-slate-600">
                                    SKU
                                  </div>
                                  <input
                                    value={row.sku || ""}
                                    onChange={(event) =>
                                      updateVariantField(
                                        rowIndex,
                                        "sku",
                                        event.target.value,
                                      )
                                    }
                                    className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                                    placeholder="Auto-generated if blank"
                                  />
                                </label>
                                <label className="space-y-2">
                                  <div className="text-sm font-medium text-slate-600">
                                    Selling Price
                                  </div>
                                  <input
                                    value={row.sale || ""}
                                    onChange={(event) =>
                                      updateVariantField(
                                        rowIndex,
                                        "sale",
                                        event.target.value,
                                      )
                                    }
                                    className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                                    inputMode="decimal"
                                    placeholder="Customer selling price"
                                  />
                                </label>
                                <label className="space-y-2">
                                  <div className="text-sm font-medium text-slate-600">
                                    Regular Price
                                  </div>
                                  <input
                                    value={row.regular || ""}
                                    onChange={(event) =>
                                      updateVariantField(
                                        rowIndex,
                                        "regular",
                                        event.target.value,
                                      )
                                    }
                                    className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                                    inputMode="decimal"
                                    placeholder="Optional original price"
                                  />
                                </label>
                                <label className="space-y-2">
                                  <div className="text-sm font-medium text-slate-600">
                                    Stock Quantity
                                  </div>
                                  <input
                                    value={row.stock || ""}
                                    onChange={(event) =>
                                      updateVariantField(
                                        rowIndex,
                                        "stock",
                                        event.target.value,
                                      )
                                    }
                                    className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                                    inputMode="numeric"
                                    placeholder="Leave blank for draft"
                                  />
                                </label>
                                <label className="space-y-2">
                                  <div className="text-sm font-medium text-slate-600">
                                    Min. Qty
                                  </div>
                                  <input
                                    value={row.minimumOrderQuantity || "1"}
                                    onChange={(event) =>
                                      updateVariantField(
                                        rowIndex,
                                        "minimumOrderQuantity",
                                        event.target.value,
                                      )
                                    }
                                    className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                                    inputMode="numeric"
                                    placeholder="1"
                                  />
                                </label>
                                <label className="space-y-2">
                                  <div className="text-sm font-medium text-slate-600">
                                    Fulfillment Type
                                  </div>
                                  <select
                                    value={row.inventoryMode || "stocked"}
                                    onChange={(event) =>
                                      updateVariantField(
                                        rowIndex,
                                        "inventoryMode",
                                        event.target.value,
                                      )
                                    }
                                    className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                                  >
                                    <option value="stocked">Stocked</option>
                                    <option value="on_demand">
                                      Available on Order
                                    </option>
                                  </select>
                                </label>
                                <label className="space-y-2">
                                  <div className="text-sm font-medium text-slate-600">
                                    Customer Availability
                                  </div>
                                  <select
                                    value={
                                      row.availabilityStatus || "available"
                                    }
                                    onChange={(event) =>
                                      updateVariantField(
                                        rowIndex,
                                        "availabilityStatus",
                                        event.target.value,
                                      )
                                    }
                                    className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                                  >
                                    <option value="available">Available</option>
                                    <option value="unavailable">
                                      Currently Unavailable
                                    </option>
                                  </select>
                                </label>
                                <label className="space-y-2">
                                  <div className="text-sm font-medium text-slate-600">
                                    Status
                                  </div>
                                  <select
                                    value={row.status || "Draft"}
                                    onChange={(event) =>
                                      updateVariantField(
                                        rowIndex,
                                        "status",
                                        event.target.value,
                                      )
                                    }
                                    className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                                  >
                                    <option value="Active">Visible</option>
                                    <option value="Draft">Draft</option>
                                    <option value="Disabled">Hidden</option>
                                  </select>
                                </label>
                              </div>
                              <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-stone-50 p-3">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <div className="text-sm font-bold text-slate-700">
                                      Variant Image
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                      Optional. Use when this option needs its
                                      own product image.
                                    </div>
                                  </div>
                                  <label
                                    className={`rounded-2xl px-4 py-2.5 text-xs font-bold ${isUploadingImage ? "cursor-not-allowed bg-slate-100 text-slate-400" : "cursor-pointer bg-[#5E7F85]/10 text-[#5E7F85]"}`}
                                  >
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp"
                                      onChange={(event) =>
                                        handleVariantImageUpload(
                                          event,
                                          rowIndex,
                                        )
                                      }
                                      disabled={isUploadingImage}
                                      className="sr-only"
                                    />
                                    {row.imageUrl
                                      ? "Replace Image"
                                      : "Upload Image"}
                                  </label>
                                </div>
                                {row.imageUrl ? (
                                  <div className="mt-3 flex items-center gap-3">
                                    <img
                                      src={row.imageUrl}
                                      alt={`${row.option || "Variant"} image`}
                                      className="h-16 w-16 rounded-2xl object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateVariantField(
                                          rowIndex,
                                          "imageUrl",
                                          "",
                                        )
                                      }
                                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600"
                                    >
                                      Remove Image
                                    </button>
                                  </div>
                                ) : (
                                  <div className="mt-3 text-xs font-semibold text-slate-500">
                                    No variant image uploaded.
                                  </div>
                                )}
                              </div>
                              <details className="mt-4 rounded-[1.25rem] border border-slate-200 bg-stone-50 p-3 text-sm text-slate-600">
                                <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                  Advanced
                                </summary>
                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                  <label className="space-y-2">
                                    <div className="text-sm font-medium text-slate-600">
                                      Purchase Cost
                                    </div>
                                    <input
                                      value={row.cost || ""}
                                      onChange={(event) =>
                                        updateVariantField(
                                          rowIndex,
                                          "cost",
                                          event.target.value,
                                        )
                                      }
                                      className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                                      inputMode="decimal"
                                      placeholder="Internal cost"
                                    />
                                  </label>
                                  <label className="space-y-2">
                                    <div className="text-sm font-medium text-slate-600">
                                      Low Stock Alert
                                    </div>
                                    <input
                                      value={row.lowStock || ""}
                                      onChange={(event) =>
                                        updateVariantField(
                                          rowIndex,
                                          "lowStock",
                                          event.target.value,
                                        )
                                      }
                                      className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                                      inputMode="numeric"
                                      placeholder="Optional"
                                    />
                                  </label>
                                </div>
                              </details>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                <div
                  style={{
                    display:
                      activeEditorSection === "inventory" ? undefined : "none",
                  }}
                  className="mt-5 grid gap-4 md:grid-cols-3"
                >
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-600">
                      SKU
                    </div>
                    <input
                      value={sku}
                      onChange={(event) =>
                        setSku(event.target.value.toUpperCase())
                      }
                      className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                      placeholder="Auto-generated when blank"
                    />
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-600">
                      Barcode / GTIN
                    </div>
                    <input
                      value={barcode}
                      onChange={(event) => setBarcode(event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                      placeholder="Optional"
                    />
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-600">
                      Inventory Mode
                    </div>
                    <select
                      value={inventoryMode}
                      onChange={(event) => setInventoryMode(event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                    >
                      <option value="stocked">Stocked</option>
                      <option value="on_demand">Available on Order</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-600">
                      Availability
                    </div>
                    <select
                      value={availabilityStatus}
                      onChange={(event) =>
                        setAvailabilityStatus(event.target.value)
                      }
                      className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                    >
                      <option value="available">Available</option>
                      <option value="unavailable">Currently Unavailable</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-600">
                      Minimum Order Quantity
                    </div>
                    <input
                      value={minimumOrderQuantity}
                      onChange={(event) =>
                        setMinimumOrderQuantity(event.target.value)
                      }
                      className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                      inputMode="numeric"
                      placeholder="1"
                    />
                  </label>
                  <div className="rounded-2xl bg-stone-50 p-4 text-xs font-semibold leading-5 text-slate-600 md:col-span-3">
                    {availabilityStatus === "unavailable"
                      ? "Customers cannot order this product until availability is restored."
                      : inventoryMode === "on_demand"
                        ? "Customers may order while physical stock is zero. Source the item after order confirmation."
                        : "Orders depend on physical stock."}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: ["images", "content", "seo"].includes(
                    activeEditorSection,
                  )
                    ? undefined
                    : "none",
                }}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">
                      {activeEditorSection === "images"
                        ? "Media"
                        : activeEditorSection === "seo"
                          ? "Shipping & operations"
                          : "Product content"}
                    </h2>
                  </div>
                </div>
                <div
                  style={{
                    display: activeEditorSection === "seo" ? undefined : "none",
                  }}
                  className="mt-5 space-y-4"
                >
                  <details className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <summary className="cursor-pointer text-sm font-bold text-slate-800">
                      Advanced product details
                    </summary>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <div className="text-sm font-medium text-slate-600">
                          Purchase Cost
                        </div>
                        <input
                          value={costPrice}
                          onChange={(event) => setCostPrice(event.target.value)}
                          className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                          inputMode="decimal"
                          placeholder="Internal purchase cost"
                        />
                      </label>
                      <label className="space-y-2">
                        <div className="text-sm font-medium text-slate-600">
                          Shipping Weight
                        </div>
                        <input
                          value={weight}
                          onChange={(event) => setWeight(event.target.value)}
                          className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                          placeholder="Example: 250g"
                        />
                      </label>
                      <label className="space-y-2">
                        <div className="text-sm font-medium text-slate-600">
                          Courier Cost
                        </div>
                        <input
                          value={courierCost}
                          onChange={(event) =>
                            setCourierCost(event.target.value)
                          }
                          className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
                          inputMode="decimal"
                          placeholder="Optional internal fulfilment cost"
                        />
                      </label>
                    </div>
                    <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">
                      Advanced fields are for internal operations only. Leave
                      blank when the value is not known.
                    </p>
                  </details>
                </div>
                <div
                  style={{
                    display:
                      activeEditorSection === "images" ? undefined : "none",
                  }}
                  className="mt-5 space-y-5"
                >
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,420px)_1fr]">
                    <div
                      className={`overflow-hidden rounded-[1.7rem] border bg-white shadow-sm ${mainImageReady ? "border-emerald-200 ring-2 ring-emerald-100" : "border-slate-200"}`}
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            Main Product Image
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Use a clear product image with enough space around
                            the product.
                          </div>
                        </div>
                        <Badge tone={mainImageReady ? "good" : "warn"}>
                          {isUploadingImage
                            ? "Uploading"
                            : mainImageReady
                              ? "Ready"
                              : "Missing"}
                        </Badge>
                      </div>
                      <div className="p-5">
                        <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-slate-300 bg-stone-50 text-center">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt="Current main product image"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="px-6">
                              <div className="text-sm font-bold text-slate-700">
                                No main image uploaded.
                              </div>
                              <div className="mt-2 text-xs leading-5 text-slate-500">
                                Upload a clear square image for the storefront
                                and product page.
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <label
                            className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white ${isUploadingImage ? "cursor-not-allowed bg-slate-300" : "cursor-pointer bg-[#5E7F85]"}`}
                          >
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleImageUpload}
                              disabled={isUploadingImage}
                              className="sr-only"
                            />
                            {isUploadingImage
                              ? "Uploading..."
                              : imageUrl
                                ? "Replace Image"
                                : "Upload Image"}
                          </label>
                          {imageUrl && (
                            <button
                              type="button"
                              disabled={isUploadingImage}
                              onClick={() => {
                                setMainImageFile(null);
                                setMainImageReady(false);
                                setImageUrl("");
                                showActionToast(
                                  "Main image removed from this product",
                                );
                              }}
                              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Remove Image
                            </button>
                          )}
                        </div>
                        <div className="mt-4 rounded-2xl bg-stone-50 p-4 text-xs font-semibold leading-5 text-slate-600">
                          Supported formats: JPG, PNG, WEBP. Maximum file size:
                          5MB. Recommended style: clear product photo with
                          balanced margins.
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-sm">
                      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            Product Gallery
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Add supporting product images. Use Move Up and Move
                            Down to control display order.
                          </div>
                        </div>
                        <label
                          className={`rounded-2xl px-4 py-2.5 text-xs font-bold ${isUploadingImage ? "cursor-not-allowed bg-slate-100 text-slate-400" : "cursor-pointer bg-[#5E7F85]/10 text-[#5E7F85]"}`}
                        >
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={handleGalleryImageUpload}
                            disabled={isUploadingImage}
                            className="sr-only"
                          />
                          {isUploadingImage ? "Uploading..." : "Add Images"}
                        </label>
                      </div>
                      <div className="p-5">
                        {galleryImages.length === 0 ? (
                          <div className="flex min-h-40 items-center justify-center rounded-[1.4rem] border border-dashed border-slate-300 bg-stone-50 px-6 text-center text-sm font-semibold text-slate-500">
                            No gallery images added yet.
                          </div>
                        ) : (
                          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {galleryImages.map((item, index) => (
                              <div
                                key={`${item}-${index}`}
                                className="rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                              >
                                <div className="aspect-square overflow-hidden rounded-2xl bg-stone-50">
                                  {item ? (
                                    <img
                                      src={item}
                                      alt={`Gallery image ${index + 1}`}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center px-4 text-center text-xs font-bold text-slate-400">
                                      Gallery Image
                                    </div>
                                  )}
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-slate-500">
                                    Image {index + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setGalleryImages((current) =>
                                        current.filter((_, i) => i !== index),
                                      )
                                    }
                                    className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() => moveGalleryImage(index, -1)}
                                    className="rounded-lg border border-slate-200 px-2 py-2 text-[10px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    Move Up
                                  </button>
                                  <button
                                    type="button"
                                    disabled={
                                      index === galleryImages.length - 1
                                    }
                                    onClick={() => moveGalleryImage(index, 1)}
                                    className="rounded-lg border border-slate-200 px-2 py-2 text-[10px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    Move Down
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <details className="rounded-[1.4rem] border border-slate-200 bg-stone-50 p-4 text-sm text-slate-600">
                    <summary className="cursor-pointer text-sm font-bold text-slate-700">
                      Advanced Details
                    </summary>
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                          Main image path
                        </div>
                        <div className="mt-1 break-all rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                          {imageUrl || "Not set"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                          Gallery order
                        </div>
                        <div className="mt-1 space-y-2">
                          {galleryImages.length ? (
                            galleryImages.map((item, index) => (
                              <div
                                key={`${item}-raw-${index}`}
                                className="break-all rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600"
                              >
                                {index + 1}. {item}
                              </div>
                            ))
                          ) : (
                            <div className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-500">
                              No gallery images added yet.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </details>
                </div>{" "}
                <div
                  style={{
                    display:
                      activeEditorSection === "content" ? undefined : "none",
                  }}
                  className="mt-5 space-y-5"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 md:col-span-2">
                      <div className="text-sm font-medium text-slate-600">
                        How to Use
                      </div>
                      <textarea
                        value={howToUse}
                        onChange={(e) => setHowToUse(e.target.value)}
                        className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <div className="text-sm font-medium text-slate-600">
                        Product Details
                      </div>
                      <textarea
                        value={productDetails}
                        onChange={(e) => setProductDetails(e.target.value)}
                        className="h-32 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <div className="text-sm font-medium text-slate-600">
                        Ingredients
                      </div>
                      <textarea
                        value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                        className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="space-y-2">
                      <div className="text-sm font-medium text-slate-600">
                        Suitable For
                      </div>
                      <textarea
                        value={suitableFor}
                        onChange={(e) => setSuitableFor(e.target.value)}
                        className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="space-y-2">
                      <div className="text-sm font-medium text-slate-600">
                        Warnings
                      </div>
                      <textarea
                        value={warnings}
                        onChange={(e) => setWarnings(e.target.value)}
                        className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                      />
                    </label>
                  </div>

                  <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Benefits
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Add clear benefit notes only when they are supported
                          by product information.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addTextRow(setBenefitRows)}
                        className="rounded-2xl bg-[#5E7F85]/10 px-4 py-2.5 text-xs font-bold text-[#5E7F85]"
                      >
                        + Add Benefit
                      </button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {benefitRows.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-stone-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                          No benefits added yet.
                        </div>
                      ) : (
                        benefitRows.map((item, index) => (
                          <div
                            key={`benefit-${index}`}
                            className="rounded-2xl border border-slate-200 bg-stone-50 p-3"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                              <input
                                value={item}
                                onChange={(event) =>
                                  updateTextRow(
                                    setBenefitRows,
                                    index,
                                    event.target.value,
                                  )
                                }
                                className={`min-h-11 flex-1 rounded-2xl border bg-white px-4 py-2 text-sm outline-none ${item.trim() ? "border-slate-300" : "border-amber-300"}`}
                                placeholder="Benefit text"
                              />
                              <div className="grid grid-cols-3 gap-2 sm:w-56">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() =>
                                    moveTextRow(setBenefitRows, index, -1)
                                  }
                                  className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Move Up
                                </button>
                                <button
                                  type="button"
                                  disabled={index === benefitRows.length - 1}
                                  onClick={() =>
                                    moveTextRow(setBenefitRows, index, 1)
                                  }
                                  className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Move Down
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeTextRow(setBenefitRows, index)
                                  }
                                  className="rounded-xl border border-rose-200 bg-rose-50 px-2 py-2 text-[10px] font-bold text-rose-700"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            {!item.trim() && (
                              <div className="mt-2 text-xs font-semibold text-amber-700">
                                Empty benefit rows are skipped for drafts and
                                must be removed before publishing.
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Key Ingredients
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          List ingredient names only. Do not add percentages or
                          claims unless verified.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addTextRow(setKeyIngredientRows)}
                        className="rounded-2xl bg-[#5E7F85]/10 px-4 py-2.5 text-xs font-bold text-[#5E7F85]"
                      >
                        + Add Ingredient
                      </button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {keyIngredientRows.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-stone-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                          No key ingredients added yet.
                        </div>
                      ) : (
                        keyIngredientRows.map((item, index) => (
                          <div
                            key={`ingredient-${index}`}
                            className="rounded-2xl border border-slate-200 bg-stone-50 p-3"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                              <input
                                value={item}
                                onChange={(event) =>
                                  updateTextRow(
                                    setKeyIngredientRows,
                                    index,
                                    event.target.value,
                                  )
                                }
                                className={`min-h-11 flex-1 rounded-2xl border bg-white px-4 py-2 text-sm outline-none ${item.trim() ? "border-slate-300" : "border-amber-300"}`}
                                placeholder="Ingredient name"
                              />
                              <div className="grid grid-cols-3 gap-2 sm:w-56">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() =>
                                    moveTextRow(setKeyIngredientRows, index, -1)
                                  }
                                  className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Move Up
                                </button>
                                <button
                                  type="button"
                                  disabled={
                                    index === keyIngredientRows.length - 1
                                  }
                                  onClick={() =>
                                    moveTextRow(setKeyIngredientRows, index, 1)
                                  }
                                  className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Move Down
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeTextRow(setKeyIngredientRows, index)
                                  }
                                  className="rounded-xl border border-rose-200 bg-rose-50 px-2 py-2 text-[10px] font-bold text-rose-700"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            {!item.trim() && (
                              <div className="mt-2 text-xs font-semibold text-amber-700">
                                Empty ingredient rows are skipped for drafts and
                                must be removed before publishing.
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: activeEditorSection === "seo" ? undefined : "none",
                  }}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h2 className="text-xl font-bold tracking-tight">
                    SEO Settings
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Leave these blank to use the storefront fallback from the
                    product name and description.
                  </p>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 md:col-span-2">
                      <div className="text-sm font-medium text-slate-600">
                        SEO Title
                      </div>
                      <input
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                        placeholder={seoTitleText}
                      />
                      <p className="text-xs font-semibold text-slate-500">
                        Shown in search results and browser tabs.
                      </p>
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <div className="text-sm font-medium text-slate-600">
                        Meta Description
                      </div>
                      <textarea
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                        placeholder={metaDescriptionText}
                      />
                      <p className="text-xs font-semibold text-slate-500">
                        Short summary that may appear in search results.
                      </p>
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <div className="text-sm font-medium text-slate-600">
                        URL Slug
                      </div>
                      <input
                        value={autoSlug}
                        readOnly
                        className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
                      />
                      <p className="text-xs font-semibold text-slate-500">
                        Generated from the product name and used in the product
                        page URL.
                      </p>
                    </label>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: ["seo", "content"].includes(activeEditorSection)
                    ? undefined
                    : "none",
                }}
                className="space-y-6"
              >
                <div
                  style={{
                    display: activeEditorSection === "seo" ? undefined : "none",
                  }}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">
                        Visibility & Publish
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Choose whether this product is a draft, visible to
                        customers, or hidden from the website.
                      </p>
                    </div>
                    <Badge tone={publishBlocked ? "warn" : "good"}>
                      {publishBlocked ? "Needs work" : "Ready"}
                    </Badge>
                  </div>
                  <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
                    <label className="space-y-2">
                      <div className="text-sm font-medium text-slate-600">
                        Visibility
                      </div>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        disabled={status === "Archived"}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none disabled:bg-stone-100 disabled:text-slate-500"
                      >
                        <option>Draft</option>
                        <option>Visible</option>
                        <option>Hidden</option>
                        {status === "Archived" ? (
                          <option>Archived</option>
                        ) : null}
                      </select>
                    </label>
                    <div className="rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-slate-600">
                      <div>
                        <b>Draft:</b> Saved but not visible to customers.
                      </div>
                      <div>
                        <b>Visible:</b> Shown on the website when all required
                        information is complete.
                      </div>
                      <div>
                        <b>Hidden:</b> Saved but temporarily hidden from
                        customers.
                      </div>
                      {status === "Archived" ? (
                        <div>
                          <b>Archived:</b> Removed from the normal catalog view.
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {publishChecks.map((check) => (
                      <div
                        key={check.label}
                        className={
                          check.ok
                            ? "rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                            : "rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700"
                        }
                      >
                        {check.ok ? "Ready" : "Needs work"}: {check.label}
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    display:
                      activeEditorSection === "content" ? undefined : "none",
                  }}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">FAQ</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Add customer questions and clear answers. Fully blank
                        rows are skipped.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addFaqRow}
                      className="rounded-2xl bg-[#5E7F85]/10 px-4 py-2.5 text-xs font-bold text-[#5E7F85]"
                    >
                      + Add FAQ
                    </button>
                  </div>
                  <div className="mt-5 space-y-4">
                    {faqRows.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-stone-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                        No FAQs added yet.
                      </div>
                    ) : (
                      faqRows.map((faq, index) => (
                        <div
                          key={`faq-${index}`}
                          className="rounded-[1.5rem] border border-slate-200 bg-stone-50 p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="text-sm font-bold text-slate-900">
                              FAQ {index + 1}
                            </h3>
                            <div className="grid grid-cols-3 gap-2 sm:w-56">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => moveFaqRow(index, -1)}
                                className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Move Up
                              </button>
                              <button
                                type="button"
                                disabled={index === faqRows.length - 1}
                                onClick={() => moveFaqRow(index, 1)}
                                className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Move Down
                              </button>
                              <button
                                type="button"
                                onClick={() => removeFaqRow(index)}
                                className="rounded-xl border border-rose-200 bg-rose-50 px-2 py-2 text-[10px] font-bold text-rose-700"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          <label className="mt-4 block space-y-2">
                            <div className="text-sm font-medium text-slate-600">
                              Question
                            </div>
                            <input
                              value={faq.question}
                              onChange={(event) =>
                                updateFaqRow(
                                  index,
                                  "question",
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                            />
                          </label>
                          <label className="mt-4 block space-y-2">
                            <div className="text-sm font-medium text-slate-600">
                              Answer
                            </div>
                            <textarea
                              value={faq.answer}
                              onChange={(event) =>
                                updateFaqRow(
                                  index,
                                  "answer",
                                  event.target.value,
                                )
                              }
                              className={`h-24 w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none ${faq.question.trim() && !faq.answer.trim() ? "border-amber-300" : "border-slate-300"}`}
                            />
                          </label>
                          {faq.question.trim() && !faq.answer.trim() && (
                            <div className="mt-2 text-xs font-semibold text-amber-700">
                              Add an answer before making this product visible.
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {publishModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
              <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-slate-500">
                      Visibility Check
                    </div>
                    <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                      Make Product Visible?
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPublishModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                  >
                    X
                  </button>
                </div>
                <div className="mt-6 grid gap-3">
                  {publishChecks.map((check) => (
                    <div
                      key={check.label}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold ${check.ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                    >
                      {check.ok ? "Ready:" : "Needs work:"} {check.label}
                    </div>
                  ))}
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPublishModalOpen(false)}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSavingProduct || isUploadingImage}
                    onClick={() => {
                      if (isUploadingImage) {
                        showActionToast("Wait for image upload to finish");
                        return;
                      }
                      if (publishBlocked) {
                        showActionToast(
                          "Complete the required information before making this product visible.",
                        );
                        setPublishModalOpen(false);
                      } else {
                        setPublishModalOpen(false);
                        saveProductToBackend("Visible");
                      }
                    }}
                    className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isSavingProduct
                      ? "Saving..."
                      : isUploadingImage
                        ? "Uploading image..."
                        : "Save & Make Visible"}
                  </button>
                </div>
              </div>
            </div>
          )}
          <aside className="h-fit space-y-4 xl:sticky xl:top-[94px]">
            <section className="rounded-2xl border border-[#e2e8e5] bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#8a9590]">
                    Product readiness
                  </div>
                  <div className="mt-2 text-[13px] font-bold text-[#394841]">
                    {readinessPercent}% complete
                  </div>
                </div>
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-[9px] font-bold ${publishBlocked ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
                >
                  {requiredBlockerCount}
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf1ef]">
                <div
                  className="h-full rounded-full bg-[#5f8585]"
                  style={{ width: `${readinessPercent}%` }}
                />
              </div>
              <p className="mt-3 text-[7px] leading-4 text-[#89958f]">
                {publishBlocked
                  ? "Complete the remaining required information before publishing."
                  : "All required publication checks passed."}
              </p>
              <div className="mt-4 max-h-52 space-y-1.5 overflow-y-auto pr-1">
                {publishChecks.map((check) => (
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[7.5px] font-semibold text-[#68766f] hover:bg-[#f7f9f8]"
                    key={check.label}
                    onClick={() => setActiveEditorSection(check.section)}
                    type="button"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${check.ok ? "bg-emerald-50 text-emerald-700" : check.required ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {check.ok ? "✓" : check.required ? "!" : "·"}
                    </span>
                    <span>{check.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#d8e4e1] bg-[#edf3f4] p-4">
              <div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#6b827b]">
                Storefront result
              </div>
              <div className="mt-3 rounded-xl bg-white p-3">
                <div className="text-[7px] text-[#929d97]">Selling price</div>
                <div className="mt-2 text-[16px] font-bold text-[#34453e]">
                  {previewSalePrice
                    ? `৳${Number(previewSalePrice).toLocaleString("en-BD")}`
                    : "Price pending"}
                </div>
                <div className="mt-1 text-[7px] text-[#8a9791]">
                  {status === "Visible" && websiteVisible
                    ? "Visible on website"
                    : websiteVisible
                      ? "Visible when published"
                      : "Hidden from storefront"}{" "}
                  · {previewStockQty || 0} in stock
                </div>
              </div>
              <button
                className="mt-3 flex h-10 w-full items-center justify-center rounded-xl border border-[#dce4e0] bg-white text-[8.5px] font-bold text-[#54736e]"
                onClick={() =>
                  window.open(
                    storefrontProductUrl,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
                type="button"
              >
                ◉&nbsp;&nbsp;Preview customer view
              </button>
            </section>

            <section className="rounded-2xl border border-[#e2e8e5] bg-white p-4">
              <div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#8a9590]">
                Operational ownership
              </div>
              <div className="mt-3 space-y-2">
                {[
                  ["Stock movement", "Inventory"],
                  ["Offers & discounts", "Offers & Deals"],
                  ["Homepage placement", "Homepage CMS"],
                  ["Profit reporting", "Finance"],
                ].map(([label, owner]) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg bg-[#fafbfa] px-3 py-2.5"
                    key={label}
                  >
                    <span className="text-[7px] font-semibold text-[#718079]">
                      {label}
                    </span>
                    <b className="text-[6.5px] text-[#557771]">{owner}</b>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </ProductEditorFrame>
  );
}
