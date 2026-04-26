import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type StoreSettingsData = {
  id: string;
  storeName: string;
  storePhone: string;
  storeEmail: string;
  storeAddress: string;
  insideDhakaDelivery: number;
  outsideDhakaDelivery: number;
  freeDeliveryMinAmount: number;
  codEnabled: boolean;
  onlinePaymentEnabled: boolean;
  facebookPageUrl: string;
  messengerUrl: string;
  whatsappNumber: string;
};

type StoreSettingsRow = {
  id?: string | number | null;
  store_name?: string | null;
  store_phone?: string | null;
  store_email?: string | null;
  store_address?: string | null;
  inside_dhaka_delivery?: number | string | null;
  outside_dhaka_delivery?: number | string | null;
  free_delivery_min_amount?: number | string | null;
  cod_enabled?: boolean | null;
  online_payment_enabled?: boolean | null;
  facebook_page_url?: string | null;
  messenger_url?: string | null;
  whatsapp_number?: string | null;
};

export const fallbackStoreSettings: StoreSettingsData = {
  id: "",
  storeName: "BrandnBeauty",
  storePhone: "",
  storeEmail: "",
  storeAddress: "",
  insideDhakaDelivery: 60,
  outsideDhakaDelivery: 120,
  freeDeliveryMinAmount: 0,
  codEnabled: true,
  onlinePaymentEnabled: false,
  facebookPageUrl: "",
  messengerUrl: "",
  whatsappNumber: "",
};

export async function getStoreSettingsFromSupabase(): Promise<StoreSettingsData> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.warn("[admin-settings] Supabase service role config missing.");
    return fallbackStoreSettings;
  }

  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[admin-settings] Store settings query failed:", {
      table: "public.store_settings",
      code: error.code,
      message: error.message,
    });
    return fallbackStoreSettings;
  }

  return data ? mapStoreSettingsRow(data) : fallbackStoreSettings;
}

export async function updateStoreSettingsInSupabase(
  settings: StoreSettingsData,
): Promise<StoreSettingsData> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role config is missing.");
  }

  const payload = {
    store_name: settings.storeName,
    store_phone: emptyToNull(settings.storePhone),
    store_email: emptyToNull(settings.storeEmail),
    store_address: emptyToNull(settings.storeAddress),
    inside_dhaka_delivery: settings.insideDhakaDelivery,
    outside_dhaka_delivery: settings.outsideDhakaDelivery,
    free_delivery_min_amount:
      settings.freeDeliveryMinAmount > 0 ? settings.freeDeliveryMinAmount : null,
    cod_enabled: settings.codEnabled,
    online_payment_enabled: settings.onlinePaymentEnabled,
    facebook_page_url: emptyToNull(settings.facebookPageUrl),
    messenger_url: emptyToNull(settings.messengerUrl),
    whatsapp_number: emptyToNull(settings.whatsappNumber),
    updated_at: new Date().toISOString(),
  };

  let query = supabase.from("store_settings").update(payload);

  if (settings.id) {
    query = query.eq("id", settings.id);
  } else {
    const current = await getStoreSettingsFromSupabase();
    if (current.id) {
      query = query.eq("id", current.id);
    } else {
      throw new Error("No store settings row was found for updating.");
    }
  }

  const { data, error } = await query.select("*").maybeSingle();

  if (error) {
    console.error("[admin-settings] Store settings update failed:", {
      table: "public.store_settings",
      code: error.code,
      message: error.message,
    });
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("No store settings row was updated.");
  }

  return mapStoreSettingsRow(data);
}

function mapStoreSettingsRow(row: StoreSettingsRow): StoreSettingsData {
  return {
    id: toText(row.id, fallbackStoreSettings.id),
    storeName: toText(row.store_name, fallbackStoreSettings.storeName),
    storePhone: toText(row.store_phone, fallbackStoreSettings.storePhone),
    storeEmail: toText(row.store_email, fallbackStoreSettings.storeEmail),
    storeAddress: toText(row.store_address, fallbackStoreSettings.storeAddress),
    insideDhakaDelivery: toNumber(
      row.inside_dhaka_delivery,
      fallbackStoreSettings.insideDhakaDelivery,
    ),
    outsideDhakaDelivery: toNumber(
      row.outside_dhaka_delivery,
      fallbackStoreSettings.outsideDhakaDelivery,
    ),
    freeDeliveryMinAmount: toNumber(
      row.free_delivery_min_amount,
      fallbackStoreSettings.freeDeliveryMinAmount,
    ),
    codEnabled: row.cod_enabled ?? fallbackStoreSettings.codEnabled,
    onlinePaymentEnabled:
      row.online_payment_enabled ?? fallbackStoreSettings.onlinePaymentEnabled,
    facebookPageUrl: toText(
      row.facebook_page_url,
      fallbackStoreSettings.facebookPageUrl,
    ),
    messengerUrl: toText(row.messenger_url, fallbackStoreSettings.messengerUrl),
    whatsappNumber: toText(
      row.whatsapp_number,
      fallbackStoreSettings.whatsappNumber,
    ),
  };
}

function toText(value: unknown, fallback: string) {
  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

function toNumber(value: unknown, fallback: number) {
  const numericValue = Number(
    typeof value === "string" ? value.replace(/[^0-9.-]/g, "") : value,
  );
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function emptyToNull(value: string) {
  return value.trim() || null;
}
