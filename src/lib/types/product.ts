export type ProductStatus = "active" | "draft" | "low_stock" | "out_of_stock";

export type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  concern: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  sku: string;
  image: string;
  shortDescription: string;
  status: ProductStatus;
};
