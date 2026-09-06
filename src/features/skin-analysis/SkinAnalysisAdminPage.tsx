"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_BNB_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "";

const api = (path: string) => `${API_BASE.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

type Summary = {
  total?: number;
  success?: number;
  success_rate?: number;
  errors?: number;
  retries?: number;
  face_too_small?: number;
  avg_latency_ms?: number | null;
  estimated_units?: number;
  estimated_cost_bdt?: number;
  passport_saves?: number;
  result_views?: number;
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
  passport_saved?: number;
};

type MetricsResponse = {
  success?: boolean;
  summary?: Summary;
  funnel?: Funnel;
  error?: string;
};

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

type SettingsResponse = {
  success?: boolean;
  can_manage?: boolean;
  settings?: Settings;
  csrf_token?: string;
  error?: string;
};

const defaultSettings: Settings = {
  system_enabled: false,
  provider_enabled: false,
  questions_only_fallback: true,
  hard_kill_switch: true,
  daily_analysis_cap: 20,
  monthly_analysis_cap: 100,
  estimated_units_per_analysis: 1,
  estimated_cost_per_unit_bdt: 0,
  daily_cost_cap_bdt: 500,
  monthly_cost_cap_bdt: 5000,
  warning_threshold_percent: 80,
};

const cardDefs: Array<[keyof Summary, string, "number" | "percent" | "seconds" | "money"]> = [
  ["total", "Analyses", "number"],
  ["success_rate", "Success rate", "percent"],
  ["errors", "Errors", "number"],
  ["retries", "Retries", "number"],
  ["avg_latency_ms", "Avg latency", "seconds"],
  ["estimated_cost_bdt", "Estimated cost", "money"],
  ["passport_saves", "Passport saves", "number"],
  ["add_to_bag", "Add to Bag", "number"],
];

function displayValue(value: unknown, format: "number" | "percent" | "seconds" | "money") {
  const number = Number(value || 0);
  if (format === "percent") return `${number.toFixed(1)}%`;
  if (format === "seconds") return number > 0 ? `${(number / 1000).toFixed(1)}s` : "—";
  if (format === "money") return `৳ ${Math.round(number).toLocaleString("en-US")}`;
  return Math.round(number).toLocaleString("en-US");
}

function Toggle({ label, checked, disabled, danger, onChange }: { label: string; checked: boolean; disabled: boolean; danger?: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className={`flex items-center justify-between gap-4 rounded-2xl border p-4 ${danger ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}>
      <span className={`text-sm font-semibold ${danger ? "text-rose-800" : "text-slate-800"}`}>{label}</span>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${checked ? (danger ? "bg-rose-600" : "bg-[#5E7F85]") : "bg-slate-300"}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`} />
      </button>
    </label>
  );
}

export default function SkinAnalysisAdminPage() {
  const [range, setRange] = useState("30d");
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [canManage, setCanManage] = useState(false);
  const [csrf, setCsrf] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setNotice("");
    try {
      const [metricsResponse, settingsResponse] = await Promise.all([
        fetch(api(`php/skin-analysis/admin/metrics.php?range=${range}`), { cache: "no-store", credentials: "include" }),
        fetch(api("php/skin-analysis/admin/get_settings.php"), { cache: "no-store", credentials: "include" }),
      ]);
      const nextMetrics = (await metricsResponse.json()) as MetricsResponse;
      const nextSettings = (await settingsResponse.json()) as SettingsResponse;
      setMetrics(nextMetrics);
      if (nextSettings.settings) setSettings(nextSettings.settings);
      setCanManage(Boolean(nextSettings.can_manage));
      setCsrf(nextSettings.csrf_token || "");
      if (!metricsResponse.ok || !settingsResponse.ok) setNotice(nextMetrics.error || nextSettings.error || "Some Skin Analysis controls are unavailable.");
    } catch {
      setNotice("Skin Analysis backend is unavailable.");
      setCanManage(false);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveSettings(next: Settings) {
    if (!canManage || saving) return;
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch(api("php/skin-analysis/admin/update_settings.php"), {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json", ...(csrf ? { "x-csrf-token": csrf } : {}) },
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
    void saveSettings(next);
  }

  const funnel = metrics?.funnel || {};
  const funnelRows = useMemo(() => [
    ["Analysis started", funnel.analysis_started || 0],
    ["Analysis completed", funnel.analysis_completed || 0],
    ["Result viewed", funnel.result_viewed || 0],
    ["Product clicked", funnel.product_clicked || 0],
    ["Add to Bag", funnel.add_to_bag || 0],
    ["Passport saved", funnel.passport_saved || 0],
  ] as Array<[string, number]>, [funnel]);

  const summary = metrics?.summary || {};
  const providerBlocked = settings.hard_kill_switch || !settings.system_enabled || !settings.provider_enabled;

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-[0.14em] text-[#5E7F85]">AI SKIN ANALYSIS</div>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">Control Center</h1>
          <p className="mt-2 text-sm text-slate-500">Pilot health, cost guardrails and conversion funnel in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={range} onChange={(event) => setRange(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button type="button" onClick={() => void load()} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Refresh</button>
        </div>
      </div>

      <div className={`rounded-2xl border p-4 text-sm ${providerBlocked ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
        <strong>{providerBlocked ? "Provider protected / blocked" : "Provider enabled"}</strong>
        <span className="ml-2">{providerBlocked ? "Questions-only fallback should remain available." : "Cost caps and kill switch remain active."}</span>
      </div>

      {notice ? <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">{notice}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cardDefs.map(([key, label, format]) => (
          <div key={key} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{loading ? "…" : displayValue(summary[key], format)}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Pilot controls</h2>
              <p className="mt-1 text-xs text-slate-500">Writes stay disabled until the backend confirms a server-valid admin session.</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${canManage ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {canManage ? "MANAGE ENABLED" : "READ ONLY"}
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Toggle label="System enabled" checked={settings.system_enabled} disabled={!canManage || saving} onChange={(v) => patch("system_enabled", v)} />
            <Toggle label="Provider enabled" checked={settings.provider_enabled} disabled={!canManage || saving} onChange={(v) => patch("provider_enabled", v)} />
            <Toggle label="Questions-only fallback" checked={settings.questions_only_fallback} disabled={!canManage || saving} onChange={(v) => patch("questions_only_fallback", v)} />
            <Toggle label="Hard kill switch" checked={settings.hard_kill_switch} disabled={!canManage || saving} danger onChange={(v) => patch("hard_kill_switch", v)} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {([
              ["daily_analysis_cap", "Daily analyses"],
              ["monthly_analysis_cap", "Monthly analyses"],
              ["estimated_units_per_analysis", "Est. units / analysis"],
              ["estimated_cost_per_unit_bdt", "Est. BDT / unit"],
              ["daily_cost_cap_bdt", "Daily cost cap"],
              ["monthly_cost_cap_bdt", "Monthly cost cap"],
            ] as Array<[keyof Settings, string]>).map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-xs font-medium text-slate-500">{label}</span>
                <input
                  type="number"
                  min="0"
                  step={String(key).includes("cost") || String(key).includes("units") ? "0.01" : "1"}
                  value={Number(settings[key])}
                  disabled={!canManage || saving}
                  onChange={(event) => setSettings({ ...settings, [key]: Number(event.target.value) })}
                  onBlur={() => void saveSettings(settings)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm disabled:bg-slate-50"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Pilot funnel</h2>
          <p className="mt-1 text-xs text-slate-500">Counts only. No selfie, mask URL or questionnaire answers are sent as analytics payloads.</p>
          <div className="mt-5 space-y-3">
            {funnelRows.map(([label, value], index) => {
              const first = funnelRows[0]?.[1] || 0;
              const pct = first > 0 ? Math.min(100, (value / first) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex items-center justify-between text-sm"><span className="text-slate-600">{index + 1}. {label}</span><strong className="text-slate-900">{value}</strong></div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#5E7F85]" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Operational signals</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Face-too-small</div><div className="mt-1 text-xl font-semibold">{summary.face_too_small || 0}</div></div>
          <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Provider units</div><div className="mt-1 text-xl font-semibold">{summary.estimated_units || 0}</div></div>
          <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Product clicks</div><div className="mt-1 text-xl font-semibold">{summary.product_clicks || 0}</div></div>
          <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Full routine adds</div><div className="mt-1 text-xl font-semibold">{summary.routine_add_to_bag || 0}</div></div>
        </div>
      </section>
    </main>
  );
}
