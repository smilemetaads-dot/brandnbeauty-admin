"use client";

import { useCallback, useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_BNB_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost/BrandnBeauty/brandnbeauty-backend";

const api = (path: string) =>
  `${API_BASE.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

type Settings = {
  system_enabled: boolean;
  provider_enabled: boolean;
  questions_only_fallback: boolean;
  hard_kill_switch: boolean;
  daily_analysis_cap: number;
  monthly_analysis_cap: number;
  estimated_units_per_analysis: number;
  estimated_cost_per_unit_bdt: number;
  daily_cost_cap_bdt: number;
  monthly_cost_cap_bdt: number;
  warning_threshold_percent: number;
};

type Summary = {
  total?: number;
  success_rate?: number;
  errors?: number;
  retries?: number;
  face_too_small?: number;
  avg_latency_ms?: number | null;
  estimated_units?: number;
  estimated_cost_bdt?: number;
  passport_saves?: number;
  product_clicks?: number;
  add_to_bag?: number;
  routine_add_to_bag?: number;
};

type Funnel = {
  analysis_started?: number;
  analysis_completed?: number;
  result_viewed?: number;
  product_clicked?: number;
  add_to_bag?: number;
  routine_add_to_bag?: number;
  passport_saved?: number;
};

type MetricsResponse = {
  success?: boolean;
  summary?: Summary;
  funnel?: Funnel;
  error?: string;
};

type SettingsResponse = {
  success?: boolean;
  can_manage?: boolean;
  settings?: Settings;
  error?: string;
};

const defaults: Settings = {
  system_enabled: true,
  provider_enabled: true,
  questions_only_fallback: true,
  hard_kill_switch: false,
  daily_analysis_cap: 100,
  monthly_analysis_cap: 3000,
  estimated_units_per_analysis: 1,
  estimated_cost_per_unit_bdt: 0,
  daily_cost_cap_bdt: 500,
  monthly_cost_cap_bdt: 5000,
  warning_threshold_percent: 80,
};

function adminToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("brandnbeauty_admin_token") || "";
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = adminToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra || {}),
  };
}

function Toggle({
  label,
  checked,
  danger,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  danger?: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition disabled:opacity-50 ${
        danger ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"
      }`}
    >
      <span className={`text-sm font-semibold ${danger ? "text-rose-800" : "text-slate-800"}`}>
        {label}
      </span>
      <span
        className={`relative h-7 w-12 rounded-full ${checked ? (danger ? "bg-rose-600" : "bg-[#527B86]") : "bg-slate-300"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-6" : "left-1"}`}
        />
      </span>
    </button>
  );
}

export default function SkinAnalysisAdminPage() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setNotice("");
    try {
      const [m, s] = await Promise.all([
        fetch(api("php/skin-analysis/admin/metrics.php?range=30d"), {
          cache: "no-store",
          headers: authHeaders(),
        }),
        fetch(api("php/skin-analysis/admin/get_settings.php"), {
          cache: "no-store",
          headers: authHeaders(),
        }),
      ]);

      const md = (await m.json()) as MetricsResponse;
      const sd = (await s.json()) as SettingsResponse;

      setMetrics(md);
      if (sd.settings) setSettings(sd.settings);
      setCanManage(Boolean(sd.can_manage && s.ok));

      if (!m.ok || !s.ok) {
        setNotice(
          "Admin authentication was not accepted by the Skin Analysis backend. Sign in to the current BrandnBeauty admin first.",
        );
      }
    } catch {
      setNotice("Skin Analysis backend is unavailable.");
      setCanManage(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(next: Settings) {
    if (!canManage || saving) return;
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch(api("php/skin-analysis/admin/update_settings.php"), {
        method: "POST",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify(next),
      });

      const data = (await response.json()) as SettingsResponse;
      if (!response.ok || !data.settings) {
        setNotice(data.error || "Settings update was rejected.");
        return;
      }

      setSettings(data.settings);
      setNotice("Skin Analysis controls updated.");
    } catch {
      setNotice("Could not update Skin Analysis controls.");
    } finally {
      setSaving(false);
    }
  }

  function patch<K extends keyof Settings>(key: K, value: Settings[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    void save(next);
  }

  const summary = metrics?.summary || {};
  const funnel = metrics?.funnel || {};
  const blocked =
    settings.hard_kill_switch ||
    !settings.system_enabled ||
    !settings.provider_enabled;

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-[0.14em] text-[#527B86]">
            AI SKIN ANALYSIS
          </div>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">
            Control Center
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Provider status, safety controls, pilot usage and funnel.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold"
        >
          Refresh
        </button>
      </div>

      <div
        className={`rounded-2xl border p-4 text-sm ${
          blocked
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-emerald-200 bg-emerald-50 text-emerald-800"
        }`}
      >
        <strong>{blocked ? "Provider protected / blocked" : "Provider enabled"}</strong>
        <span className="ml-2">
          {settings.hard_kill_switch
            ? "Hard Kill is ON."
            : blocked
              ? "Questions-only fallback should remain available."
              : "Live provider calls are allowed."}
        </span>
      </div>

      {notice ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Analyses", summary.total ?? 0],
          ["Success rate", `${Number(summary.success_rate || 0).toFixed(1)}%`],
          ["Errors", summary.errors ?? 0],
          ["Est. cost", `৳ ${Math.round(Number(summary.estimated_cost_bdt || 0)).toLocaleString("en-US")}`],
          ["Retries", summary.retries ?? 0],
          ["Face too small", summary.face_too_small ?? 0],
          ["Add to Bag", summary.add_to_bag ?? 0],
          ["Passport saves", summary.passport_saves ?? 0],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {loading ? "…" : value}
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Pilot controls</h2>
            <p className="mt-1 text-xs text-slate-500">
              Uses the existing BrandnBeauty admin token. No second login.
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${canManage ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            {canManage ? "MANAGE ENABLED" : "READ ONLY"}
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Toggle
            label="System enabled"
            checked={settings.system_enabled}
            disabled={!canManage || saving}
            onChange={(v) => patch("system_enabled", v)}
          />
          <Toggle
            label="Provider enabled"
            checked={settings.provider_enabled}
            disabled={!canManage || saving}
            onChange={(v) => patch("provider_enabled", v)}
          />
          <Toggle
            label="Questions-only fallback"
            checked={settings.questions_only_fallback}
            disabled={!canManage || saving}
            onChange={(v) => patch("questions_only_fallback", v)}
          />
          <Toggle
            label="Hard Kill Switch"
            checked={settings.hard_kill_switch}
            danger
            disabled={!canManage || saving}
            onChange={(v) => patch("hard_kill_switch", v)}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Pilot funnel</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Started", funnel.analysis_started || 0],
            ["Completed", funnel.analysis_completed || 0],
            ["Result viewed", funnel.result_viewed || 0],
            ["Product clicked", funnel.product_clicked || 0],
            ["Add to Bag", funnel.add_to_bag || 0],
            ["Full routine", funnel.routine_add_to_bag || 0],
            ["Passport saved", funnel.passport_saved || 0],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-slate-500">{label}</div>
              <div className="mt-1 text-xl font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-slate-500">
        Estimated cost remains an internal estimate until Perfect Corp unit consumption and production pricing are confirmed.
      </p>
    </main>
  );
}
