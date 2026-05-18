"use server";

import { revalidatePath } from "next/cache";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type ProductActionState = {
  ok: boolean;
  message: string;
};

type AttributesParseResult =
  | {
      ok: true;
      attributes: unknown;
    }
  | {
      ok: false;
      message: string;
    };

const PRODUCT_STATUSES = ["active", "draft", "low_stock", "out_of_stock"];

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

function getStringList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function getAttributes(formData: FormData): AttributesParseResult {
  const attributesJson = getString(formData, "attributesJson");

  if (!attributesJson) {
    return { ok: true, attributes: {} };
  }

  try {
    return { ok: true, attributes: JSON.parse(attributesJson) };
  } catch {
    return { ok: false, message: "Attributes must be valid JSON." };
  }
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
  const attributesResult = getAttributes(formData);
  const concernIds = Array.from(new Set(getStringList(formData, "concernIds")));

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

  if (!attributesResult.ok) {
    return attributesResult;
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
      attributes: attributesResult.attributes,
    };

    const productResult = id
      ? await supabase
          .from("products")
          .update(productValues)
          .eq("id", id)
          .select("id")
          .single()
      : await supabase
          .from("products")
          .insert(productValues)
          .select("id")
          .single();

    if (productResult.error || !productResult.data?.id) {
      console.error("Failed to save product.", productResult.error);

      return {
        ok: false,
        message: "Product could not be saved. Check the fields and try again.",
      };
    }

    const productId = productResult.data.id as string;
    const { error: deleteConcernsError } = await supabase
      .from("product_concerns")
      .delete()
      .eq("product_id", productId);

    if (deleteConcernsError) {
      console.error("Failed to reset product concerns.", deleteConcernsError);

      return {
        ok: false,
        message: "Product saved, but concerns could not be updated.",
      };
    }

    if (concernIds.length > 0) {
      const { error: insertConcernsError } = await supabase
        .from("product_concerns")
        .insert(
          concernIds.map((concernId) => ({
            product_id: productId,
            concern_id: concernId,
          })),
        );

      if (insertConcernsError) {
        console.error(
          "Failed to insert product concerns.",
          insertConcernsError,
        );

        return {
          ok: false,
          message: "Product saved, but concerns could not be updated.",
        };
      }
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

export async function updateProductStatus(
  formData: FormData,
): Promise<ProductActionState> {
  const id = getString(formData, "id");
  const status = getString(formData, "status");

  if (!id) {
    return { ok: false, message: "Product ID is required." };
  }

  if (!PRODUCT_STATUSES.includes(status)) {
    return { ok: false, message: "Choose a valid product status." };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase
      .from("products")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Failed to update product status.", error);

      return {
        ok: false,
        message: "Product status could not be updated. Try again.",
      };
    }

    revalidatePath("/products");

    return { ok: true, message: "Product status updated." };
  } catch (error) {
    console.error("Failed to initialize product status action.", error);

    return {
      ok: false,
      message: "Product status could not be updated right now.",
    };
  }
}
