"use server";

import { revalidatePath } from "next/cache";

import {
  fallbackStoreSettings,
  updateStoreSettingsInSupabase,
} from "@/lib/settings/supabaseSettings";

export type SettingsSaveState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function saveStoreSettings(
  _previousState: SettingsSaveState,
  formData: FormData,
): Promise<SettingsSaveState> {
  try {
    await updateStoreSettingsInSupabase({
      id: getFormText(formData, "id", fallbackStoreSettings.id),
      storeName: getFormText(
        formData,
        "storeName",
        fallbackStoreSettings.storeName,
      ),
      storePhone: getFormText(
        formData,
        "storePhone",
        fallbackStoreSettings.storePhone,
      ),
      storeEmail: getFormText(
        formData,
        "storeEmail",
        fallbackStoreSettings.storeEmail,
      ),
      storeAddress: getFormText(
        formData,
        "storeAddress",
        fallbackStoreSettings.storeAddress,
      ),
      insideDhakaDelivery: getFormNumber(
        formData,
        "insideDhakaDelivery",
        fallbackStoreSettings.insideDhakaDelivery,
      ),
      outsideDhakaDelivery: getFormNumber(
        formData,
        "outsideDhakaDelivery",
        fallbackStoreSettings.outsideDhakaDelivery,
      ),
      freeDeliveryMinAmount: getFormNumber(
        formData,
        "freeDeliveryMinAmount",
        fallbackStoreSettings.freeDeliveryMinAmount,
      ),
      codEnabled: formData.get("codEnabled") === "on",
      onlinePaymentEnabled: formData.get("onlinePaymentEnabled") === "on",
      facebookPageUrl: getFormText(
        formData,
        "facebookPageUrl",
        fallbackStoreSettings.facebookPageUrl,
      ),
      messengerUrl: getFormText(
        formData,
        "messengerUrl",
        fallbackStoreSettings.messengerUrl,
      ),
      whatsappNumber: getFormText(
        formData,
        "whatsappNumber",
        fallbackStoreSettings.whatsappNumber,
      ),
    });

    revalidatePath("/settings");

    return {
      status: "success",
      message: "Store settings saved to Supabase.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Store settings could not be saved.",
    };
  }
}

function getFormText(formData: FormData, key: string, fallback: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : fallback;
}

function getFormNumber(formData: FormData, key: string, fallback: number) {
  const value = getFormText(formData, key, "");
  const numericValue = Number(value.replace(/[^0-9.-]/g, ""));

  return Number.isFinite(numericValue) ? numericValue : fallback;
}
