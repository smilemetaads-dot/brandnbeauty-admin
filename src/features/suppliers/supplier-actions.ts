"use server";

import { revalidatePath } from "next/cache";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type SupplierActionState = {
  ok: boolean;
  message: string;
};

const SUPPLIER_STATUSES = ["active", "inactive"] as const;

type SupplierStatus = (typeof SUPPLIER_STATUSES)[number];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getNullableString(formData: FormData, key: string) {
  const value = getString(formData, key);

  return value.length > 0 ? value : null;
}

function isSupplierStatus(value: string): value is SupplierStatus {
  return SUPPLIER_STATUSES.includes(value as SupplierStatus);
}

function getSupplierValues(formData: FormData) {
  const name = getString(formData, "name");
  const status = getString(formData, "status") || "active";

  if (!name) {
    return {
      error: "Supplier name is required.",
      values: null,
    };
  }

  if (!isSupplierStatus(status)) {
    return {
      error: "Choose a valid supplier status.",
      values: null,
    };
  }

  return {
    error: null,
    values: {
      address: getNullableString(formData, "address"),
      contact_person: getNullableString(formData, "contact_person"),
      email: getNullableString(formData, "email"),
      name,
      notes: getNullableString(formData, "notes"),
      payment_terms: getNullableString(formData, "payment_terms"),
      phone: getNullableString(formData, "phone"),
      status,
    },
  };
}

export async function createSupplier(
  _previousState: SupplierActionState,
  formData: FormData,
): Promise<SupplierActionState> {
  const { error: validationError, values } = getSupplierValues(formData);

  if (validationError || !values) {
    return {
      ok: false,
      message: validationError ?? "Supplier could not be validated.",
    };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from("suppliers").insert(values);

    if (error) {
      console.error("Failed to create supplier.");

      return {
        ok: false,
        message: "Supplier could not be created. Check the fields and try again.",
      };
    }

    revalidatePath("/suppliers");

    return { ok: true, message: "Supplier created successfully." };
  } catch {
    console.error("Failed to initialize supplier create action.");

    return {
      ok: false,
      message: "Supplier could not be created right now. Try again shortly.",
    };
  }
}

export async function updateSupplier(
  _previousState: SupplierActionState,
  formData: FormData,
): Promise<SupplierActionState> {
  const supplierId = getString(formData, "supplierId");
  const { error: validationError, values } = getSupplierValues(formData);

  if (!supplierId) {
    return { ok: false, message: "Supplier is required." };
  }

  if (validationError || !values) {
    return {
      ok: false,
      message: validationError ?? "Supplier could not be validated.",
    };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase
      .from("suppliers")
      .update(values)
      .eq("id", supplierId);

    if (error) {
      console.error("Failed to update supplier.");

      return {
        ok: false,
        message: "Supplier could not be updated. Check the fields and try again.",
      };
    }

    revalidatePath("/suppliers");

    return { ok: true, message: "Supplier updated successfully." };
  } catch {
    console.error("Failed to initialize supplier update action.");

    return {
      ok: false,
      message: "Supplier could not be updated right now. Try again shortly.",
    };
  }
}
