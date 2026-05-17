"use server";

import { revalidatePath } from "next/cache";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type ConcernActionState = {
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

function getSortOrder(formData: FormData) {
  const value = getString(formData, "sortOrder");

  if (value.length === 0) {
    return 0;
  }

  const numberValue = Number(value);

  return Number.isInteger(numberValue) ? numberValue : null;
}

export async function saveConcern(
  _previousState: ConcernActionState,
  formData: FormData,
): Promise<ConcernActionState> {
  const id = getString(formData, "id");
  const name = getString(formData, "name");
  const slug = getString(formData, "slug");
  const sortOrder = getSortOrder(formData);

  if (!name) {
    return { ok: false, message: "Concern name is required." };
  }

  if (!slug) {
    return { ok: false, message: "Concern slug is required." };
  }

  if (sortOrder === null) {
    return { ok: false, message: "Sort order must be a whole number." };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const concernValues = {
      name,
      slug,
      image: getNullableString(formData, "image"),
      status: getString(formData, "status") || "active",
      featured: formData.get("featured") === "on",
      meta_title: getNullableString(formData, "metaTitle"),
      meta_description: getNullableString(formData, "metaDescription"),
      sort_order: sortOrder,
    };

    const { error } = id
      ? await supabase.from("concerns").update(concernValues).eq("id", id)
      : await supabase.from("concerns").insert(concernValues);

    if (error) {
      console.error("Failed to save concern.", error);

      return {
        ok: false,
        message: "Concern could not be saved. Check the fields and try again.",
      };
    }

    revalidatePath("/concerns");

    return { ok: true, message: "Concern saved successfully." };
  } catch (error) {
    console.error("Failed to initialize concern save action.", error);

    return {
      ok: false,
      message: "Concern could not be saved right now. Try again shortly.",
    };
  }
}
