"use server";

import { revalidatePath } from "next/cache";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type ProductActionState = {
  ok: boolean;
  message: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getNullableString(formData: FormData, key: string) {
  const value = getString(formData, key);

  return value.length > 0 ? value : null;
}

function getRequiredNumber(formData: FormData, key: string) {
  const value = getString(formData, key);
  const numberValue = Number(value);

  if (value.length === 0 || Number.isNaN(numberValue) || numberValue < 0) {
    return null;
  }

  return numberValue;
}

function getRequiredInteger(formData: FormData, key: string) {
  const value = getString(formData, key);
  const numberValue = Number(value);

  if (
    value.length === 0 ||
    Number.isNaN(numberValue) ||
    !Number.isInteger(numberValue) ||
    numberValue < 0
  ) {
    return null;
  }

  return numberValue;
}

function getNullableNumber(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (value.length === 0) {
    return null;
  }

  const numberValue = Number(value);

  return Number.isNaN(numberValue) || numberValue < 0 ? null : numberValue;
}

export async function saveProduct(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const id = getString(formData, "id");
  const name = getString(formData, "name");
  const slug = getString(formData, "slug");
  const price = getRequiredNumber(formData, "price");
  const stock = getRequiredInteger(formData, "stock");
  const oldPrice = getNullableNumber(formData, "oldPrice");

  if (!name) {
    return { ok: false, message: "Product name is required." };
  }

  if (!slug) {
    return { ok: false, message: "Product slug is required." };
  }

  if (price === null) {
    return { ok: false, message: "Price must be a number of 0 or more." };
  }

  if (stock === null) {
    return { ok: false, message: "Stock must be a whole number of 0 or more." };
  }

  if (getString(formData, "oldPrice").length > 0 && oldPrice === null) {
    return { ok: false, message: "Old price must be a number of 0 or more." };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const productValues = {
      name,
      slug,
      sku: getNullableString(formData, "sku"),
      brand_id: getNullableString(formData, "brandId"),
      category_id: getNullableString(formData, "categoryId"),
      price,
      old_price: oldPrice,
      stock,
      image: getNullableString(formData, "image"),
      short_description: getNullableString(formData, "shortDescription"),
      status: getString(formData, "status") || "draft",
      featured: formData.get("featured") === "on",
    };

    const { error } = id
      ? await supabase.from("products").update(productValues).eq("id", id)
      : await supabase.from("products").insert(productValues);

    if (error) {
      console.error("Failed to save product.", error);

      return {
        ok: false,
        message: "Product could not be saved. Check the fields and try again.",
      };
    }

    revalidatePath("/products");
    revalidatePath("/products/edit");

    return {
      ok: true,
      message: id
        ? "Product updated successfully."
        : "Product saved successfully.",
    };
  } catch (error) {
    console.error("Failed to initialize product save action.", error);

    return {
      ok: false,
      message: "Product could not be saved right now. Try again shortly.",
    };
  }
}
