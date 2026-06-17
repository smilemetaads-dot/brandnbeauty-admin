"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const settingsStats = [
  ["Active Admins", "7", "Team members"],
  ["Live Integrations", "5", "Courier, payment, analytics"],
  ["Security Alerts", "2", "Need review"],
  ["System Status", "Healthy", "Core modules online"],
] as const;

type StoreSettings = {
  admin_email: string;
  currency: string;
  shipping_fee_inside_dhaka: number;
  shipping_fee_outside_dhaka: number;
  store_name: string;
};

type SettingsPayload = Partial<
  Record<keyof StoreSettings, string | number | null>
>;

const SETTINGS_ENDPOINT =
  "http://localhost/BrandnBeauty/brandnbeauty-backend/php/get_settings.php";

const defaultStoreSettings: StoreSettings = {
  admin_email: "admin@brandnbeauty.com",
  currency: "BDT",
  shipping_fee_inside_dhaka: 60,
  shipping_fee_outside_dhaka: 120,
  store_name: "BRAND & BEAUTY",
};

const systemControls = [
  {
    desc: "Brand name, currency, timezone and storefront controls",
    status: "Configured",
    title: "Store Settings",
  },
  {
    desc: "Status flow, stock deduction and packing triggers",
    status: "Review",
    title: "Order Automation",
  },
  {
    desc: "Steadfast, Pathao and delivery charge mapping",
    status: "Connected",
    title: "Courier Integration",
  },
  {
    desc: "COD rules, settlement matching and mismatch handling",
    status: "Active",
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
  "No settings save, reset, delivery, payment, courier, checkout or stock mutation workflow exists on this route yet.",
  "No settings writes, localStorage, auth helper changes or route protection changes were added.",
  "Save, reset, configure and system toggle controls stay disabled until real settings actions exist.",
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
    store_name:
      String(payload.store_name ?? defaultStoreSettings.store_name).trim() ||
      defaultStoreSettings.store_name,
  };
}

export function RealSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [isLoading, setIsLoading] = useState(true);

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
          setSettings(normalizeSettings(payload));
        }
      } catch (error) {
        console.error("Failed to load live settings.", error);

        if (isMounted) {
          setSettings(defaultStoreSettings);
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
      ["Inside Dhaka Shipping", String(settings.shipping_fee_inside_dhaka)],
      ["Outside Dhaka Shipping", String(settings.shipping_fee_outside_dhaka)],
      ["Admin Email", settings.admin_email],
    ],
    [settings],
  );

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {settingsStats.map(([label, value, helper]) => (
            <StatCard
              active={label === "Security Alerts"}
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
                Manage store rules, automation, integrations and admin system
                controls with live local settings loaded from the MySQL backend.
                Save workflows remain disabled until update actions exist.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <DisabledButton>Reset Draft</DisabledButton>
              <DisabledButton primary>Save Changes</DisabledButton>
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
                    <Badge tone={item.status === "Review" ? "warn" : "good"}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {item.desc}
                  </p>
                  <div className="mt-4">
                    <DisabledButton>Configure</DisabledButton>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Automation Rules
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                System Toggles
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
