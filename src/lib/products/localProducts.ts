import { mockProducts } from "@/lib/mock/products";
import {
  readProductSyncSnapshot,
  writeProductSyncSnapshot,
} from "@/lib/products/productSync";
import type { ProductRecord, ProductStatus } from "@/lib/types/product";

const productStorageKey = "brandnbeauty-admin-products";

const validStatuses: ProductStatus[] = [
  "active",
  "draft",
  "low_stock",
  "out_of_stock",
];

export function getLocalProducts(): ProductRecord[] {
  if (typeof window === "undefined") {
    return mockProducts;
  }

  const storedProducts = window.localStorage.getItem(productStorageKey);

  if (!storedProducts) {
    const syncedProducts = readProductSyncSnapshot();
    const seededProducts = syncedProducts ?? mockProducts;

    persistLocalProducts(seededProducts);
    return seededProducts;
  }

  try {
    const parsedProducts = JSON.parse(storedProducts) as ProductRecord[];
    return Array.isArray(parsedProducts) ? parsedProducts : mockProducts;
  } catch {
    return mockProducts;
  }
}

export function getLocalProductById(id: string): ProductRecord | undefined {
  return getLocalProducts().find((product) => product.id === id);
}

export function saveLocalProduct(product: ProductRecord) {
  const products = getLocalProducts();
  const existingIndex = products.findIndex((item) => item.id === product.id);
  const nextProducts =
    existingIndex >= 0
      ? products.map((item) => (item.id === product.id ? product : item))
      : [product, ...products];

  persistLocalProducts(nextProducts);
}

export function updateLocalProductStock(productId: string, stock: number) {
  const products = getLocalProducts();
  const nextProducts = products.map((product) =>
    product.id === productId
      ? {
          ...product,
          stock,
          status: getProductStatusForStock(stock, product.status),
        }
      : product,
  );

  persistLocalProducts(nextProducts);
}

export function createEmptyProduct(): ProductRecord {
  return {
    id: "",
    name: "",
    slug: "",
    brand: "BrandnBeauty",
    category: "Skincare",
    concern: "Acne",
    price: 0,
    oldPrice: null,
    stock: 0,
    sku: "",
    image: "",
    shortDescription: "",
    status: "active",
  };
}

export function productFromFormData(
  formData: FormData,
  fallbackProduct: ProductRecord,
): ProductRecord {
  const name = getTextValue(formData, "name", fallbackProduct.name);
  const slug = getTextValue(formData, "slug", fallbackProduct.slug) || slugify(name);
  const statusValue = getTextValue(formData, "status", fallbackProduct.status);

  return {
    id: getTextValue(formData, "id", fallbackProduct.id) || createProductId(),
    name,
    slug,
    brand: getTextValue(formData, "brand", fallbackProduct.brand),
    category: getTextValue(formData, "category", fallbackProduct.category),
    concern: getTextValue(formData, "concern", fallbackProduct.concern),
    price: getNumberValue(formData, "price", fallbackProduct.price),
    oldPrice: getNullableNumberValue(formData, "oldPrice", fallbackProduct.oldPrice),
    stock: getNumberValue(formData, "stock", fallbackProduct.stock),
    sku: getTextValue(formData, "sku", fallbackProduct.sku),
    image: getTextValue(formData, "image", fallbackProduct.image),
    shortDescription: getTextValue(
      formData,
      "shortDescription",
      fallbackProduct.shortDescription,
    ),
    status: validStatuses.includes(statusValue as ProductStatus)
      ? (statusValue as ProductStatus)
      : fallbackProduct.status,
  };
}

function createProductId() {
  return `prd_${Date.now().toString(36)}`;
}

function persistLocalProducts(products: ProductRecord[]) {
  window.localStorage.setItem(productStorageKey, JSON.stringify(products));
  writeProductSyncSnapshot(products);
}

function getProductStatusForStock(
  stock: number,
  currentStatus: ProductStatus,
): ProductStatus {
  if (currentStatus === "draft") {
    return currentStatus;
  }

  if (stock <= 0) {
    return "out_of_stock";
  }

  if (stock <= 15) {
    return "low_stock";
  }

  return "active";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getTextValue(formData: FormData, key: string, fallback: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : fallback;
}

function getNumberValue(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

function getNullableNumberValue(
  formData: FormData,
  key: string,
  fallback: number | null,
) {
  const value = formData.get(key);

  if (value === null || value === "") {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}
