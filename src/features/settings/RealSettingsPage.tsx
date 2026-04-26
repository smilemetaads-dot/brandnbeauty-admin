"use client";

import { useActionState } from "react";

import { saveStoreSettings, type SettingsSaveState } from "@/app/settings/actions";
import type { StoreSettingsData } from "@/lib/settings/supabaseSettings";

const roles = [
  { role: "Super Admin", users: 1, access: "Full access" },
  {
    role: "Operations Admin",
    users: 2,
    access: "Orders, inventory, customers",
  },
  {
    role: "Finance Admin",
    users: 2,
    access: "Payments, reconciliation, reports",
  },
  { role: "Support Agent", users: 2, access: "Orders, customers, notes" },
];

const integrations = [
  {
    name: "bKash Payment",
    status: "Connected",
    note: "Checkout payment enabled",
    health: "Healthy",
  },
  {
    name: "Steadfast Courier",
    status: "Connected",
    note: "Tracking sync active",
    health: "Healthy",
  },
  {
    name: "Pathao Courier",
    status: "Pending",
    note: "Awaiting API credentials",
    health: "Setup needed",
  },
  {
    name: "Analytics Pixel",
    status: "Connected",
    note: "Events firing normally",
    health: "Healthy",
  },
];

const environments = [
  ["Storefront", "Live", "Healthy"],
  ["Admin Panel", "Live", "Healthy"],
  ["Checkout", "Live", "Monitor"],
  ["Courier Sync", "Partial", "Needs setup"],
];

const securityChecks = [
  ["2FA for super admins", "Required", "Pending on 1 account"],
  ["API key rotation", "Every 90 days", "Last rotated 41 days ago"],
  ["Password policy", "Strong", "2 staff need reset"],
  ["Audit log retention", "Enabled", "180-day history active"],
];

function getQuickStats(storeSettings: StoreSettingsData) {
  return [
    {
      label: "Store Name",
      value: storeSettings.storeName,
      sub: storeSettings.storeEmail || "Store profile loaded",
    },
    {
      label: "Inside Dhaka",
      value: `Tk ${storeSettings.insideDhakaDelivery.toLocaleString()}`,
      sub: "Delivery charge",
    },
    {
      label: "Outside Dhaka",
      value: `Tk ${storeSettings.outsideDhakaDelivery.toLocaleString()}`,
      sub: "Delivery charge",
    },
    {
      label: "System Status",
      value: "Healthy",
      sub: "All core modules online",
    },
  ];
}

function getToggles(storeSettings: StoreSettingsData) {
  return [
  {
    title: "Maintenance Mode",
    desc: "Temporarily hide storefront for customers",
    enabled: false,
  },
  {
    title: "Auto Invoice Generation",
    desc: "Generate invoice after order confirmation",
    enabled: true,
  },
  {
    title: "Low Stock Alerts",
    desc: "Notify team when products hit reorder level",
    enabled: true,
  },
  {
    title: "COD Risk Warning",
    desc: "Cash on delivery checkout availability",
    enabled: storeSettings.codEnabled,
  },
  {
    title: "Online Payment",
    desc: "Online payment checkout availability",
    enabled: storeSettings.onlinePaymentEnabled,
  },
  ];
}

const initialSaveState: SettingsSaveState = {
  status: "idle",
  message: "",
};

export default function RealSettingsPage({
  storeSettings,
}: {
  storeSettings: StoreSettingsData;
}) {
  const [saveState, formAction, isPending] = useActionState(
    saveStoreSettings,
    initialSaveState,
  );
  const quickStats = getQuickStats(storeSettings);
  const toggles = getToggles(storeSettings);

  return (
    <form action={formAction} className="min-h-screen bg-stone-50 p-4 text-slate-900 md:p-6">
      <input name="id" type="hidden" value={storeSettings.id} />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm text-slate-500">Admin / Settings</div>
            <h1 className="text-3xl font-bold">Settings / System Control</h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage permissions, integrations, security and core business rules
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm"
              type="button"
            >
              Export Settings
            </button>
            <button
              className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Saving..." : "Save System Changes"}
            </button>
          </div>
        </div>

        {saveState.message ? (
          <div
            className={`rounded-2xl border p-4 text-sm ${
              saveState.status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {saveState.message}
          </div>
        ) : null}

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="font-semibold">System Control Note</div>
          <div className="mt-1">
            Only trusted admins should have access to settings, roles, payment
            controls and integration credentials.
          </div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <div className="font-semibold">Priority Review</div>
          <div className="mt-1">
            1 super admin still needs 2FA, Pathao courier setup is incomplete,
            and 2 staff passwords should be reset.
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickStats.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="text-sm font-medium text-slate-500">
                {item.label}
              </div>
              <div
                className={`mt-3 text-2xl font-bold tracking-tight ${
                  item.value === "Healthy" ? "text-emerald-600" : "text-slate-900"
                }`}
              >
                {item.value}
              </div>
              <div className="mt-2 text-xs text-slate-500">{item.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Store Settings
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight">
                  Store Info & Delivery
                </h2>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Store Name
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-900"
                    defaultValue={storeSettings.storeName}
                    name="storeName"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Store Phone
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-900"
                    defaultValue={storeSettings.storePhone}
                    name="storePhone"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Store Email
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-900"
                    defaultValue={storeSettings.storeEmail}
                    name="storeEmail"
                    type="email"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  WhatsApp Number
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-900"
                    defaultValue={storeSettings.whatsappNumber}
                    name="whatsappNumber"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700 md:col-span-2">
                  Store Address
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-900"
                    defaultValue={storeSettings.storeAddress}
                    name="storeAddress"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Inside Dhaka Delivery
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-900"
                    defaultValue={storeSettings.insideDhakaDelivery}
                    min="0"
                    name="insideDhakaDelivery"
                    type="number"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Outside Dhaka Delivery
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-900"
                    defaultValue={storeSettings.outsideDhakaDelivery}
                    min="0"
                    name="outsideDhakaDelivery"
                    type="number"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Free Delivery Minimum
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-900"
                    defaultValue={storeSettings.freeDeliveryMinAmount}
                    min="0"
                    name="freeDeliveryMinAmount"
                    type="number"
                  />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-slate-900">
                    <input
                      className="h-4 w-4"
                      defaultChecked={storeSettings.codEnabled}
                      name="codEnabled"
                      type="checkbox"
                    />
                    COD Enabled
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-slate-900">
                    <input
                      className="h-4 w-4"
                      defaultChecked={storeSettings.onlinePaymentEnabled}
                      name="onlinePaymentEnabled"
                      type="checkbox"
                    />
                    Online Payment
                  </label>
                </div>
                <label className="text-sm font-medium text-slate-700">
                  Facebook Page URL
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-900"
                    defaultValue={storeSettings.facebookPageUrl}
                    name="facebookPageUrl"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Messenger URL
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-900"
                    defaultValue={storeSettings.messengerUrl}
                    name="messengerUrl"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Access Control
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight">
                    Roles & Permission Levels
                  </h2>
                </div>
                <button className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-stone-50">
                  Add Role
                </button>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-stone-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Users</th>
                      <th className="px-4 py-3 font-medium">Access Scope</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((item) => (
                      <tr
                        key={item.role}
                        className="border-t border-slate-100 bg-white"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {item.role}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.users}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.access}
                        </td>
                        <td className="px-4 py-3">
                          <button className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50">
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Integrations
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight">
                    Connected Services
                  </h2>
                </div>
                <button className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-stone-50">
                  Manage API Keys
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {integrations.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-2xl bg-stone-50 p-4"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-500">{item.note}</div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        Health: {item.health}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === "Connected"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Environment Status
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight">
                  Module Health
                </h2>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-stone-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Module</th>
                      <th className="px-4 py-3 font-medium">Mode</th>
                      <th className="px-4 py-3 font-medium">Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {environments.map(([module, mode, health]) => (
                      <tr key={module} className="border-t border-slate-100 bg-white">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {module}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{mode}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              health === "Healthy"
                                ? "bg-emerald-50 text-emerald-700"
                                : health === "Monitor"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {health}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Business Rules
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight">
                  System Toggles
                </h2>
              </div>

              <div className="mt-5 space-y-3">
                {toggles.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between rounded-2xl bg-stone-50 p-4"
                  >
                    <div className="pr-4">
                      <div className="font-semibold text-slate-900">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500">{item.desc}</div>
                    </div>
                    <button
                      className={`h-7 w-14 rounded-full p-1 transition ${
                        item.enabled ? "bg-[#5E7F85]" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`h-5 w-5 rounded-full bg-white transition ${
                          item.enabled ? "translate-x-7" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">Security</div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Protection Center
              </h2>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-stone-50 p-4">
                  2 admins have not updated passwords in 90+ days.
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  2-factor authentication should be enabled for Super Admin
                  accounts.
                </div>
                <div className="rounded-2xl bg-amber-50 p-4 text-amber-800">
                  High-risk actions like payment settings and API keys should
                  require extra confirmation.
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-stone-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Security Check</th>
                      <th className="px-4 py-3 font-medium">Rule</th>
                      <th className="px-4 py-3 font-medium">Current State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityChecks.map(([name, rule, state]) => (
                      <tr key={name} className="border-t border-slate-100 bg-white">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {name}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{rule}</td>
                        <td className="px-4 py-3 text-slate-600">{state}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Quick Actions
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Admin Controls
              </h2>
              <div className="mt-5 grid gap-3">
                {[
                  "Reset Staff Password",
                  "Open Maintenance Mode",
                  "Review API Credentials",
                  "Open Permission Matrix",
                  "Download Audit Log",
                ].map((action) => (
                  <button
                    key={action}
                    className="rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-white"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Audit Trail
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Recent System Events
              </h2>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-stone-50 p-4">
                  Finance Admin updated reconciliation rule - 2:10 PM
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  Operations Admin added new courier key - 12:45 PM
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  Support Agent role access updated - Yesterday
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
