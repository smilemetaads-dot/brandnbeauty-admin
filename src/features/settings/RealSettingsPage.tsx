"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const settingsStats = [
  ["Active Admins", "Coming later", "Team controls"],
  ["Live Settings", "Delivery", "Charges save live"],
  ["Security Review", "Coming later", "Access controls"],
  ["System Status", "Healthy", "Core modules online"],
] as const;

type StoreSettings = {
  admin_email: string;
  currency: string;
  delivery_charge_dhaka_city: number;
  delivery_charge_dhaka_sub_area: number;
  delivery_charge_outside_dhaka: number;
  shipping_fee_inside_dhaka: number;
  shipping_fee_outside_dhaka: number;
  store_name: string;
};

type SettingsPayload = Partial<
  Record<keyof StoreSettings, string | number | null>
>;

const SETTINGS_ENDPOINT = bnbApiUrl("get_settings.php");
const UPDATE_SETTINGS_ENDPOINT = bnbApiUrl("update_settings.php");

const defaultStoreSettings: StoreSettings = {
  admin_email: "admin@brandnbeauty.com",
  currency: "BDT",
  delivery_charge_dhaka_city: 60,
  delivery_charge_dhaka_sub_area: 80,
  delivery_charge_outside_dhaka: 120,
  shipping_fee_inside_dhaka: 60,
  shipping_fee_outside_dhaka: 120,
  store_name: "BRAND & BEAUTY",
};

const systemControls = [
  {
    desc: "Brand name and currency are read-only here; delivery charges save live.",
    status: "Live",
    title: "Store Settings",
  },
  {
    desc: "Status flow, stock deduction and packing triggers are coming later.",
    status: "Coming later",
    title: "Order Automation",
  },
  {
    desc: "Courier API upload is not connected; delivery charge values save live.",
    status: "Coming later",
    title: "Courier Integration",
  },
  {
    desc: "COD rules and settlement matching are coming later.",
    status: "Coming later",
    title: "Payment & COD",
  },
] as const;

const systemToggles = [
  ["Auto stock deduction on order confirm", true],
  ["Require confirmation before courier upload", true],
  ["Enable COD risk warning", true],
  ["Allow manual discount override", false],
] as const;

const safetyItems = [
  "Delivery charge saves update the local MySQL settings table through admin auth.",
  "Payment, courier, checkout field visibility and stock automation controls are coming later.",
  "Storefront checkout falls back to local defaults if the settings API is unavailable.",
] as const;

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const className = {
    bad: "bg-rose-50 text-rose-700",
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    default: "bg-slate-100 text-slate-700",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function DisabledButton({
  children,
  primary = false,
}: {
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      className={
        primary
          ? "rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500"
          : "rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-400"
      }
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function StatCard({
  active = false,
  helper,
  label,
  value,
}: {
  active?: boolean;
  helper: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className={`rounded-[2rem] border p-5 shadow-sm ${
        active
          ? "border-[#5E7F85]/20 bg-[#5E7F85]/5"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-sm font-black text-[#5E7F85]">
          ST
        </span>
      </div>
      <div className="mt-3 text-xs font-semibold text-slate-500">{helper}</div>
    </div>
  );
}

function toNumber(value: string | number | null | undefined, fallback: number) {
  const numericValue = Number(value ?? fallback);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeSettings(payload: SettingsPayload): StoreSettings {
  return {
    admin_email:
      String(payload.admin_email ?? defaultStoreSettings.admin_email).trim() ||
      defaultStoreSettings.admin_email,
    currency:
      String(payload.currency ?? defaultStoreSettings.currency).trim() ||
      defaultStoreSettings.currency,
    shipping_fee_inside_dhaka: toNumber(
      payload.shipping_fee_inside_dhaka,
      defaultStoreSettings.shipping_fee_inside_dhaka,
    ),
    shipping_fee_outside_dhaka: toNumber(
      payload.shipping_fee_outside_dhaka,
      defaultStoreSettings.shipping_fee_outside_dhaka,
    ),
    delivery_charge_dhaka_city: toNumber(
      payload.delivery_charge_dhaka_city ??
        (payload as Record<string, string | number | null | undefined>).delivery_charge_dhaka ??
        payload.shipping_fee_inside_dhaka,
      defaultStoreSettings.delivery_charge_dhaka_city,
    ),
    delivery_charge_dhaka_sub_area: toNumber(
      payload.delivery_charge_dhaka_sub_area,
      defaultStoreSettings.delivery_charge_dhaka_sub_area,
    ),
    delivery_charge_outside_dhaka: toNumber(
      payload.delivery_charge_outside_dhaka ?? payload.shipping_fee_outside_dhaka,
      defaultStoreSettings.delivery_charge_outside_dhaka,
    ),
    store_name:
      String(payload.store_name ?? defaultStoreSettings.store_name).trim() ||
      defaultStoreSettings.store_name,
  };
}

export function RealSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [deliveryDraft, setDeliveryDraft] = useState({
    delivery_charge_dhaka_city: String(defaultStoreSettings.delivery_charge_dhaka_city),
    delivery_charge_dhaka_sub_area: String(defaultStoreSettings.delivery_charge_dhaka_sub_area),
    delivery_charge_outside_dhaka: String(defaultStoreSettings.delivery_charge_outside_dhaka),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        setIsLoading(true);
        const response = await fetch(SETTINGS_ENDPOINT, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Settings request failed.");
        }

        const payload = (await response.json()) as SettingsPayload;

        if (isMounted) {
          const nextSettings = normalizeSettings(payload);
          setSettings(nextSettings);
          setDeliveryDraft({
            delivery_charge_dhaka_city: String(nextSettings.delivery_charge_dhaka_city),
            delivery_charge_dhaka_sub_area: String(nextSettings.delivery_charge_dhaka_sub_area),
            delivery_charge_outside_dhaka: String(nextSettings.delivery_charge_outside_dhaka),
          });
        }
      } catch (error) {
        console.error("Failed to load live settings.", error);

        if (isMounted) {
          setSettings(defaultStoreSettings);
          setDeliveryDraft({
            delivery_charge_dhaka_city: String(defaultStoreSettings.delivery_charge_dhaka_city),
            delivery_charge_dhaka_sub_area: String(defaultStoreSettings.delivery_charge_dhaka_sub_area),
            delivery_charge_outside_dhaka: String(defaultStoreSettings.delivery_charge_outside_dhaka),
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const brandDefaults = useMemo(
    () => [
      ["Store Name", settings.store_name],
      ["Currency", settings.currency],
      ["Dhaka City Delivery", String(settings.delivery_charge_dhaka_city)],
      ["Dhaka Sub-Area Delivery", String(settings.delivery_charge_dhaka_sub_area)],
      ["Outside Dhaka Delivery", String(settings.delivery_charge_outside_dhaka)],
      ["Admin Email", settings.admin_email],
    ],
    [settings],
  );

  const saveDeliverySettings = async () => {
    setSettingsMessage("");
    setIsSavingDelivery(true);

    try {
      const response = await fetch(UPDATE_SETTINGS_ENDPOINT, {
        body: JSON.stringify({
          settings: deliveryDraft,
        }),
        headers: adminAuthHeaders({
          "Content-Type": "application/json",
        }),
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        settings?: Partial<Record<keyof typeof deliveryDraft, string | number>>;
        success?: boolean;
      } | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message ?? "Delivery settings could not be saved.");
      }

      const nextSettings = normalizeSettings({
        ...settings,
        ...payload.settings,
      });
      setSettings(nextSettings);
      setDeliveryDraft({
        delivery_charge_dhaka_city: String(nextSettings.delivery_charge_dhaka_city),
        delivery_charge_dhaka_sub_area: String(nextSettings.delivery_charge_dhaka_sub_area),
        delivery_charge_outside_dhaka: String(nextSettings.delivery_charge_outside_dhaka),
      });
      setSettingsMessage(payload.message ?? "Delivery settings saved.");
    } catch (error) {
      setSettingsMessage(error instanceof Error ? error.message : "Delivery settings could not be saved.");
    } finally {
      setIsSavingDelivery(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {settingsStats.map(([label, value, helper]) => (
            <StatCard
              active={label === "Security Review"}
              helper={helper}
              key={label}
              label={label}
              value={value}
            />
          ))}
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                Settings Control Room
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage delivery charges with live local settings loaded from
                the MySQL backend. Automation, integrations and admin system
                controls are coming later.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <DisabledButton>Reset Draft</DisabledButton>
              <button
                className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={isSavingDelivery}
                onClick={saveDeliverySettings}
                type="button"
              >
                {isSavingDelivery ? "Saving..." : "Save Delivery Charges"}
              </button>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Environment: <b className="text-[#5E7F85]">Local MySQL</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Last update:{" "}
              <b className="text-slate-900">
                {isLoading ? "Loading..." : "Loaded from settings API"}
              </b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Review focus: <b className="text-amber-700">Automation rules</b>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {systemControls.map((item) => (
                <div
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
                  key={item.title}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold text-slate-900">
                      {item.title}
                    </h2>
                    <Badge tone={item.status === "Coming later" ? "warn" : "good"}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {item.desc}
                  </p>
                  <div className="mt-4">
                    <DisabledButton>Configure coming later</DisabledButton>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Automation Rules
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                System Toggles Coming Later
              </h2>
              <div className="mt-5 space-y-3">
                {systemToggles.map(([label, enabled]) => (
                  <div
                    className="flex w-full items-center justify-between rounded-2xl bg-stone-50 px-4 py-4 text-left text-sm font-semibold text-slate-700"
                    key={label}
                  >
                    <span>{label}</span>
                    <span
                      className={`relative inline-flex h-7 w-12 rounded-full ${
                        enabled ? "bg-[#5E7F85]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm ${
                          enabled ? "left-6" : "left-1"
                        }`}
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Store Identity
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Brand Defaults
              </h2>
              <div className="mt-5 space-y-4">
                {brandDefaults.map(([label, value]) => (
                  <div key={label}>
                    <div className="text-sm font-semibold text-slate-700">
                      {label}
                    </div>
                    <input
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-600 outline-none"
                      readOnly
                      value={value}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Checkout Delivery
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Delivery Charge Rules
              </h2>
              <div className="mt-5 space-y-4">
                {[
                  ["delivery_charge_dhaka_city", "Dhaka City"],
                  ["delivery_charge_dhaka_sub_area", "Dhaka Sub-Area"],
                  ["delivery_charge_outside_dhaka", "Outside Dhaka"],
                ].map(([key, label]) => (
                  <label key={key}>
                    <div className="text-sm font-semibold text-slate-700">
                      {label}
                    </div>
                    <input
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/15"
                      inputMode="decimal"
                      min="0"
                      onChange={(event) =>
                        setDeliveryDraft((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                      type="number"
                      value={deliveryDraft[key as keyof typeof deliveryDraft]}
                    />
                  </label>
                ))}
              </div>
              {settingsMessage ? (
                <div className="mt-4 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  {settingsMessage}
                </div>
              ) : null}
            </div>

            <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-rose-800">
                Security Alerts
              </div>
              <div className="mt-4 space-y-3 text-sm font-semibold text-rose-700">
                <div className="rounded-2xl bg-white/70 px-4 py-3">
                  Finance access review needed
                </div>
                <div className="rounded-2xl bg-white/70 px-4 py-3">
                  Courier API key check pending
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                System Note
              </div>
              <p className="mt-2 text-sm leading-6 text-amber-700">
                Before going live, verify stock deduction, courier upload and
                COD settlement rules carefully.
              </p>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                Settings Safety Note
              </div>
              <div className="mt-3 space-y-2">
                {safetyItems.map((item) => (
                  <div
                    className="rounded-2xl bg-white/60 px-4 py-3 text-sm font-semibold leading-6 text-amber-800"
                    key={item}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
