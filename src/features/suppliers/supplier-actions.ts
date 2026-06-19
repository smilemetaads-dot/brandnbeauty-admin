"use server";

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

  return {
    ok: false,
    message:
      "Supplier save is preview-only until the PHP supplier write endpoint is enabled.",
  };
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

  return {
    ok: false,
    message:
      "Supplier save is preview-only until the PHP supplier write endpoint is enabled.",
  };
}
