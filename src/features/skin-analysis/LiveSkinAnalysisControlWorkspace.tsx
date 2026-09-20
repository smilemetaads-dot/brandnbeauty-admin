"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
  customer_result_enabled: boolean;
  numeric_scores_enabled: boolean;
  internal_routine_enabled: boolean;
  customer_routine_enabled: boolean;
  product_recommendations_enabled: boolean;
  add_full_routine_enabled: boolean;
  beauty_passport_enabled: boolean;
  manual_advisor_mode: boolean;
  messenger_cta_enabled: boolean;
  whatsapp_cta_enabled: boolean;
  callback_enabled: boolean;
  chatbot_auto_reply_enabled: boolean;
  messenger_url?: string;
  whatsapp_number?: string;
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
  result_views?: number;
  product_clicks?: number;
  add_to_bag?: number;
  routine_add_to_bag?: number;
  advisor_handoffs?: number;
};

type AdvisorHandoff = {
  id: number;
  public_session_id: string;
  channel: string;
  contact_name?: string | null;
  phone?: string | null;
  status: string;
  top_concern?: string | null;
  skin_feel?: string | null;
  sensitivity?: string | null;
  created_at: string;
};

type LeadDetailPayload = {
  success?: boolean;
  lead?: AdvisorHandoff & {
    session_id?: number;
    note?: string | null;
    updated_at?: string;
    second_concern?: string | null;
    routine_preference?: string | null;
    budget_band?: string | null;
    active_tolerance?: string | null;
    known_irritation?: boolean;
    treatment_context?: boolean;
    provider?: string | null;
    session_status?: string | null;
    provider_latency_ms?: number | null;
    provider_error_code?: string | null;
    session_created_at?: string | null;
    completed_at?: string | null;
    recommendation_mode?: string | null;
    primary_concern?: string | null;
    routine_json?: unknown;
    explanation_json?: unknown;
  };
  observations?: Array<{
    concern_key: string;
    provider_type?: string | null;
    ui_score?: number | null;
    raw_score?: number | null;
    display_allowed?: boolean | number;
  }>;
  events?: Array<{ event_name: string; created_at: string }>;
  photo_angles?: Array<{ angle: "front" | "left" | "right"; expires_at: string }>;
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
  customer_result_enabled: true,
  numeric_scores_enabled: false,
  internal_routine_enabled: true,
  customer_routine_enabled: false,
  product_recommendations_enabled: false,
  add_full_routine_enabled: false,
  beauty_passport_enabled: false,
  manual_advisor_mode: true,
  messenger_cta_enabled: true,
  whatsapp_cta_enabled: true,
  callback_enabled: false,
  chatbot_auto_reply_enabled: false,
  messenger_url: "",
  whatsapp_number: "",
};

function tokenHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("brandnbeauty_admin_token") || "";
  return token ? { "x-admin-token": token } : {};
}

function Toggle({
  checked,
  disabled,
  danger,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  danger?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition disabled:cursor-not-allowed disabled:opacity-45 ${
        checked ? (danger ? "bg-rose-600" : "bg-[#3b646d]") : "bg-[#d8dfdc]"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <article className="rounded-2xl border border-[#e2e8e5] bg-white p-4">
      <div className="text-[8px] font-bold uppercase tracking-[.12em] text-[#84908a]">
        {label}
      </div>
      <div className="mt-2 text-[22px] font-bold tracking-[-.03em] text-[#17231f]">
        {value}
      </div>
      {note ? <div className="mt-1 text-[7px] text-[#929d97]">{note}</div> : null}
    </article>
  );
}

const concernLabelMap: Record<string, string> = {
  acne_or_breakout: "Acne / blemishes",
  pore_visibility: "Pore visibility",
  texture: "Texture",
  oiliness: "Oiliness",
  dryness: "Dryness",
  uneven_tone: "Uneven tone",
  sensitivity: "Sensitivity / reactivity",
};

const skinFeelLabelMap: Record<string, string> = {
  dry: "Dry",
  normal: "Normal",
  combination: "Combination",
  oily: "Oily",
};

const sensitivityLabelMap: Record<string, string> = {
  low: "Low sensitivity",
  moderate: "Moderate sensitivity",
  high: "High sensitivity",
};

function humanize(value?: string | null) {
  if (!value) return "-";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function concernLabel(value?: string | null) {
  if (!value) return "-";
  return concernLabelMap[value] || humanize(value);
}

export function LiveSkinAnalysisControlWorkspace() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [summary, setSummary] = useState<Summary>({});
  const [funnel, setFunnel] = useState<Funnel>({});
  const [recentHandoffs, setRecentHandoffs] = useState<AdvisorHandoff[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [range, setRange] = useState("30d");
  const [selectedLead, setSelectedLead] = useState<LeadDetailPayload | null>(null);
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadNotice, setLeadNotice] = useState("");
  const [leadStatus, setLeadStatus] = useState("new");
  const [leadNote, setLeadNote] = useState("");
  const [leadPhotoUrls, setLeadPhotoUrls] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setNotice("");
    try {
      const headers = tokenHeader();
      const [metricsRes, settingsRes] = await Promise.all([
        fetch(`/api/skin-analysis/metrics?range=${range}`, {
          cache: "no-store",
          headers,
        }),
        fetch("/api/skin-analysis/settings", {
          cache: "no-store",
          headers,
        }),
      ]);

      const metrics = await metricsRes.json();
      const config = await settingsRes.json();

      if (metricsRes.ok) {
        setSummary(metrics.summary || {});
        setFunnel(metrics.funnel || {});
        setRecentHandoffs(metrics.recent_handoffs || []);
      }
      if (settingsRes.ok && config.settings) {
        setSettings(config.settings);
        setCanManage(true);
      } else {
        setCanManage(false);
      }

      if (!metricsRes.ok || !settingsRes.ok) {
        setNotice(
          config?.error ||
            metrics?.error ||
            "Skin Analysis admin authentication was not accepted."
        );
      }
    } catch {
      setCanManage(false);
      setNotice("Skin Analysis backend connection failed.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  async function persist(next: Settings) {
    if (!canManage || saving) return;
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/skin-analysis/update", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...tokenHeader(),
        },
        body: JSON.stringify(next),
      });
      const rawText = await response.text();
      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        const detail =
          data?.error ||
          data?.message ||
          (rawText && rawText.length < 300 ? rawText : "") ||
          `HTTP ${response.status}`;
        setNotice(`Could not save Skin Analysis controls: ${detail}`);
        return;
      }

      // Accept common direct/wrapped successful response shapes first.
      const returnedSettings =
        data?.settings ??
        data?.data?.settings ??
        data?.result?.settings ??
        null;

      if (returnedSettings) {
        setSettings((current) => ({ ...current, ...returnedSettings }));
        setNotice("Controls updated successfully.");
        return;
      }

      // Some proxy routes return HTTP 200 without echoing settings.
      // In that case, verify persistence by immediately re-reading the canonical settings endpoint.
      const verifyResponse = await fetch("/api/skin-analysis/settings", {
        cache: "no-store",
        headers: tokenHeader(),
      });

      if (!verifyResponse.ok) {
        setNotice(
          `Save returned HTTP ${response.status}, but post-save verification failed with HTTP ${verifyResponse.status}.`
        );
        return;
      }

      const verifyRaw = await verifyResponse.text();
      let verifyData: any = {};
      try {
        verifyData = verifyRaw ? JSON.parse(verifyRaw) : {};
      } catch {
        verifyData = {};
      }

      const verifiedSettings =
        verifyData?.settings ??
        verifyData?.data?.settings ??
        verifyData?.result?.settings ??
        null;

      if (!verifiedSettings) {
        setNotice(
          "Save returned HTTP 200, but the refreshed settings payload could not be recognized."
        );
        return;
      }

      setSettings((current) => ({ ...current, ...verifiedSettings }));

      const persisted = Object.entries(next).every(([key, value]) => {
        const actual = verifiedSettings[key];
        if (typeof value === "boolean") return Boolean(actual) === value;
        return String(actual ?? "") === String(value ?? "");
      });

      setNotice(
        persisted
          ? "Controls updated successfully."
          : "Save returned HTTP 200, but the database still returned the previous setting."
      );
    } catch (error) {
      setNotice(
        `Could not update Skin Analysis controls: ${
          error instanceof Error ? error.message : "network/request failure"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  function patch<K extends keyof Settings>(key: K, value: Settings[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    void persist(next);
  }


  function clearLeadPhotoUrls() {
    setLeadPhotoUrls((current) => {
      Object.values(current).forEach((url) => URL.revokeObjectURL(url));
      return {};
    });
  }

  async function loadLeadPhotos(id: number, angles: Array<{ angle: "front" | "left" | "right" }>) {
    clearLeadPhotoUrls();
    const next: Record<string, string> = {};
    for (const item of angles) {
      try {
        const response = await fetch(
          `/api/skin-analysis/lead-photo?id=${id}&angle=${item.angle}`,
          { cache: "no-store", headers: tokenHeader() },
        );
        if (!response.ok) continue;
        const blob = await response.blob();
        next[item.angle] = URL.createObjectURL(blob);
      } catch {
        // Temporary photos are optional and may already be expired.
      }
    }
    setLeadPhotoUrls(next);
  }

  async function openLead(id: number) {
    setLeadLoading(true);
    setLeadNotice("");
    try {
      const response = await fetch(`/api/skin-analysis/lead-detail?id=${id}`, {
        cache: "no-store",
        headers: tokenHeader(),
      });
      const data = (await response.json()) as LeadDetailPayload;
      if (!response.ok || !data.lead) {
        setLeadNotice("Could not load this Skin Analysis lead.");
        return;
      }
      setSelectedLead(data);
      setLeadStatus(data.lead.status || "new");
      setLeadNote(data.lead.note || "");
      await loadLeadPhotos(data.lead.id, data.photo_angles || []);
    } catch {
      setLeadNotice("Could not load this Skin Analysis lead.");
    } finally {
      setLeadLoading(false);
    }
  }

  async function saveLeadUpdate() {
    const lead = selectedLead?.lead;
    if (!lead?.id) return;

    setLeadLoading(true);
    setLeadNotice("");
    try {
      const response = await fetch("/api/skin-analysis/lead-update", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...tokenHeader(),
        },
        body: JSON.stringify({
          id: lead.id,
          status: leadStatus,
          note: leadNote,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setLeadNotice(data?.message || "Could not update this lead.");
        return;
      }
      setLeadNotice("Lead updated.");
      setSelectedLead((current) =>
        current?.lead
          ? {
              ...current,
              lead: {
                ...current.lead,
                status: leadStatus,
                note: leadNote,
              },
            }
          : current
      );
      setRecentHandoffs((current) =>
        current.map((item) =>
          item.id === lead.id ? { ...item, status: leadStatus } : item
        )
      );
    } catch {
      setLeadNotice("Could not update this lead.");
    } finally {
      setLeadLoading(false);
    }
  }

  const providerBlocked =
    settings.hard_kill_switch ||
    !settings.system_enabled ||
    !settings.provider_enabled;

  const avgLatency =
    summary.avg_latency_ms && summary.avg_latency_ms > 0
      ? `${(summary.avg_latency_ms / 1000).toFixed(1)}s`
      : "-";

  const funnelRows = useMemo(
    () => [
      ["Started", funnel.analysis_started || 0],
      ["Completed", funnel.analysis_completed || 0],
      ["Result viewed", funnel.result_viewed || 0],
      ["Product clicked", funnel.product_clicked || 0],
      ["Add to Bag", funnel.add_to_bag || 0],
      ["Full routine", funnel.routine_add_to_bag || 0],
      ["Passport saved", funnel.passport_saved || 0],
    ],
    [funnel]
  );

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3b646d]" />
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3b646d]">
              AI skin analysis Â· provider operations
            </p>
          </div>
          <h1 className="mt-2 text-[28px] font-bold tracking-[-.035em] text-[#17231f] sm:text-[32px]">
            Skin Analysis Control Center
          </h1>
          <p className="mt-1.5 max-w-3xl text-[12.5px] leading-5 text-[#66736d]">
            Control provider access, fallback behavior, pilot caps and the conversion funnel from the same admin workspace.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="h-10 rounded-xl border border-[#dce4e0] bg-white px-3 text-[8.5px] font-bold text-[#596962]"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="h-10 rounded-xl border border-[#dce4e0] bg-white px-4 text-[8.5px] font-bold text-[#596962]"
          >
            Refresh
          </button>
        </div>
      </section>

      <section
        className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
          providerBlocked
            ? "border-amber-200 bg-amber-50/70"
            : "border-[#d8e4e1] bg-[#edf3f4]"
        }`}
      >
        <div>
          <div className={`text-[9px] font-bold ${providerBlocked ? "text-amber-900" : "text-[#304d4d]"}`}>
            {settings.hard_kill_switch
              ? "Hard Kill is ON"
              : providerBlocked
                ? "Provider protected / fallback mode"
                : "Provider enabled"}
          </div>
          <p className={`mt-1 text-[7.5px] ${providerBlocked ? "text-amber-700" : "text-[#647b77]"}`}>
            {settings.hard_kill_switch
              ? "No provider request should leave the server."
              : providerBlocked
                ? "Questions-only fallback remains the safe path."
                : "Live provider calls are currently allowed."}
          </p>
        </div>
        <span
          className={`w-fit rounded-full px-2.5 py-1 text-[7px] font-bold ${
            canManage
              ? "bg-emerald-50 text-emerald-700"
              : "bg-white text-[#87928d]"
          }`}
        >
          {canManage ? "MANAGE ENABLED" : "READ ONLY"}
        </span>
      </section>

      {notice ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[8px] font-semibold text-amber-800">
          {notice}
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Analyses" value={loading ? "..." : summary.total || 0} note="Selected period" />
        <Metric
          label="Success rate"
          value={loading ? "..." : `${Number(summary.success_rate || 0).toFixed(1)}%`}
          note="Provider + completed sessions"
        />
        <Metric label="Avg latency" value={loading ? "..." : avgLatency} note="Provider processing" />
        <Metric
          label="Est. cost"
          value={loading ? "..." : `BDT ${Math.round(Number(summary.estimated_cost_bdt || 0)).toLocaleString("en-US")}`}
          note="Internal estimate"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.12fr_.88fr]">
        <article className="rounded-2xl border border-[#e2e8e5] bg-white">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e8ecea] p-4">
            <div>
              <h2 className="text-[13px] font-bold text-[#2f3f38]">Provider safety controls</h2>
              <p className="mt-1 text-[7.5px] text-[#89948f]">
                Protected by the existing BrandnBeauty admin authentication.
              </p>
            </div>
            <span className="rounded-full bg-[#f2f5f3] px-2.5 py-1 text-[6.5px] font-bold text-[#66736d]">
              {saving ? "SAVING..." : canManage ? "LIVE CONTROL" : "LOCKED"}
            </span>
          </header>

          <div className="grid gap-2 p-4 md:grid-cols-2">
            {[
              ["System enabled", "Master feature availability", "system_enabled", false],
              ["Provider enabled", "Allow Perfect Corp requests", "provider_enabled", false],
              ["Questions-only fallback", "Keep analysis usable without provider", "questions_only_fallback", false],
              ["Hard Kill Switch", "Immediately block provider requests", "hard_kill_switch", true],
            ].map(([label, note, key, danger]) => (
              <div
                key={String(key)}
                className={`flex items-center justify-between gap-4 rounded-xl border p-3.5 ${
                  danger ? "border-rose-100 bg-rose-50/50" : "border-[#e4e9e7] bg-[#fbfcfb]"
                }`}
              >
                <div>
                  <b className={`block text-[8.5px] ${danger ? "text-rose-800" : "text-[#405049]"}`}>
                    {label}
                  </b>
                  <span className="mt-1 block text-[6.5px] text-[#929d97]">{note}</span>
                </div>
                <Toggle
                  checked={Boolean(settings[key as keyof Settings])}
                  danger={Boolean(danger)}
                  disabled={!canManage || saving}
                  onChange={(v) => patch(key as keyof Settings, v as never)}
                />
              </div>
            ))}
          </div>

          <div className="border-t border-[#edf0ee] p-4">
            <div className="mb-3">
              <h3 className="text-[10px] font-bold text-[#33443d]">
                Customer experience & advisor mode
              </h3>
              <p className="mt-1 text-[7px] text-[#89948f]">
                Keep every major Skin Analysis capability independently controllable.
              </p>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {[
                ["Manual Advisor Mode", "Make human advisor handoff the primary result action", "manual_advisor_mode"],
                ["Show customer result", "Allow the customer-facing result screen", "customer_result_enabled"],
                ["Show numeric scores", "Keep OFF until repeatability is validated", "numeric_scores_enabled"],
                ["Internal routine generation", "Generate advisor-side routine logic", "internal_routine_enabled"],
                ["Show routine to customer", "Expose AM + PM plan", "customer_routine_enabled"],
                ["Show product recommendations", "Expose reviewed product cards", "product_recommendations_enabled"],
                ["Add Full Routine to Bag", "Allow one-click routine cart", "add_full_routine_enabled"],
                ["Beauty Passport", "Allow customer save flow", "beauty_passport_enabled"],
                ["Messenger CTA", "Allow advisor handoff to Messenger", "messenger_cta_enabled"],
                ["WhatsApp CTA", "Allow advisor handoff to WhatsApp", "whatsapp_cta_enabled"],
                ["Callback", "Allow phone callback requests", "callback_enabled"],
                ["Chatbot auto reply", "Keep OFF for manual Skin Analysis conversations", "chatbot_auto_reply_enabled"],
              ].map(([label, note, key]) => (
                <div
                  key={String(key)}
                  className="flex items-center justify-between gap-4 rounded-xl border border-[#e4e9e7] bg-[#fbfcfb] p-3.5"
                >
                  <div>
                    <b className="block text-[8.5px] text-[#405049]">{label}</b>
                    <span className="mt-1 block text-[6.5px] text-[#929d97]">{note}</span>
                  </div>
                  <Toggle
                    checked={Boolean(settings[key as keyof Settings])}
                    disabled={!canManage || saving}
                    onChange={(v) => patch(key as keyof Settings, v as never)}
                  />
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label>
                <span className="text-[6.5px] font-bold uppercase tracking-[.1em] text-[#829089]">
                  Messenger URL
                </span>
                <input
                  type="text"
                  value={settings.messenger_url || ""}
                  disabled={!canManage || saving}
                  onChange={(e) => setSettings((s) => ({ ...s, messenger_url: e.target.value }))}
                  onBlur={() => void persist(settings)}
                  placeholder="https://m.me/your-page"
                  className="mt-1.5 h-9 w-full rounded-lg border border-[#dfe5e2] bg-white px-3 text-[8.5px]"
                />
              </label>
              <label>
                <span className="text-[6.5px] font-bold uppercase tracking-[.1em] text-[#829089]">
                  WhatsApp number
                </span>
                <input
                  type="text"
                  value={settings.whatsapp_number || ""}
                  disabled={!canManage || saving}
                  onChange={(e) => setSettings((s) => ({ ...s, whatsapp_number: e.target.value }))}
                  onBlur={() => void persist(settings)}
                  placeholder="8801XXXXXXXXX"
                  className="mt-1.5 h-9 w-full rounded-lg border border-[#dfe5e2] bg-white px-3 text-[8.5px]"
                />
              </label>
            </div>
          </div>

          <div className="grid gap-3 border-t border-[#edf0ee] p-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["daily_analysis_cap", "Daily analyses"],
              ["monthly_analysis_cap", "Monthly analyses"],
              ["estimated_units_per_analysis", "Est. units / analysis"],
              ["estimated_cost_per_unit_bdt", "Est. BDT / unit"],
              ["daily_cost_cap_bdt", "Daily cost cap"],
              ["monthly_cost_cap_bdt", "Monthly cost cap"],
            ].map(([key, label]) => (
              <label key={key}>
                <span className="text-[6.5px] font-bold uppercase tracking-[.1em] text-[#829089]">
                  {label}
                </span>
                <input
                  type="number"
                  min="0"
                  disabled={!canManage || saving}
                  value={Number(settings[key as keyof Settings])}
                  onChange={(e) =>
                    setSettings((current) => ({
                      ...current,
                      [key]: Number(e.target.value),
                    }))
                  }
                  onBlur={() => void persist(settings)}
                  className="mt-1.5 h-9 w-full rounded-lg border border-[#dfe5e2] bg-white px-3 text-[8.5px] font-semibold text-[#405049] outline-none focus:border-[#9eb7b4] disabled:bg-[#f7f8f7]"
                />
              </label>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-[#e2e8e5] bg-white p-4">
          <h2 className="text-[13px] font-bold text-[#2f3f38]">Pilot funnel</h2>
          <p className="mt-1 text-[7.5px] text-[#89948f]">
            Counts only; no selfie, mask URL or questionnaire answers in analytics.
          </p>

          <div className="mt-4 space-y-3">
            {funnelRows.map(([label, value], index) => {
              const first = Number(funnelRows[0]?.[1] || 0);
              const width = first > 0 ? Math.min(100, (Number(value) / first) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex items-center justify-between text-[7.5px]">
                    <span className="font-semibold text-[#66736d]">
                      {index + 1}. {label}
                    </span>
                    <b className="text-[#35443e]">{value}</b>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#edf1ef]">
                    <div
                      className="h-full rounded-full bg-[#5f8585]"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-[#e2e8e5] bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[13px] font-bold text-[#2f3f38]">Recent Skin Advisor leads</h2>
            <p className="mt-1 text-[7.5px] text-[#89948f]">
              Manual handoffs only. Raw selfie data is not listed here.
            </p>
          </div>
          <span className="rounded-full bg-[#edf3f4] px-2.5 py-1 text-[7px] font-bold text-[#3b646d]">
            {summary.advisor_handoffs || 0} handoffs
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-[#edf0ee] text-[6.5px] uppercase tracking-[.1em] text-[#87928d]">
                <th className="pb-2">Reference</th>
                <th className="pb-2">Channel</th>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Phone</th>
                <th className="pb-2">Concern</th>
                <th className="pb-2">Sensitivity</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentHandoffs.length ? recentHandoffs.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-[#f0f3f1] text-[8px] text-[#53615b] hover:bg-[#f8fbfa]"
                >
                  <td className="py-2.5 font-semibold">SA-{lead.public_session_id}</td>
                  <td className="py-2.5 capitalize">{lead.channel}</td>
                  <td className="py-2.5">{lead.contact_name || "-"}</td>
                  <td className="py-2.5">{lead.phone || "-"}</td>
                  <td className="py-2.5">{concernLabel(lead.top_concern)}</td>
                  <td className="py-2.5">{sensitivityLabelMap[lead.sensitivity || ""] || humanize(lead.sensitivity)}</td>
                  <td className="py-2.5 capitalize">{lead.status.replaceAll("_", " ")}</td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => void openLead(lead.id)}
                      className="rounded-full border border-[#d7e3e1] bg-white px-3 py-1.5 text-[7px] font-bold text-[#3b646d]"
                    >
                      View
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="py-6 text-center text-[8px] text-[#929d97]">
                  No advisor handoffs yet.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedLead?.lead ? (
        <div className="fixed inset-0 z-[80] bg-slate-950/25 backdrop-blur-[1px]">
          <div className="absolute inset-y-0 right-0 w-full max-w-[620px] overflow-y-auto border-l border-[#dfe7e4] bg-[#f8faf9] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e1e8e5] bg-white/95 p-5 backdrop-blur">
              <div>
                <div className="text-[8px] font-bold uppercase tracking-[.14em] text-[#3b646d]">
                  Skin Analysis Lead
                </div>
                <h2 className="mt-1 text-[20px] font-bold text-[#17231f]">
                  SA-{selectedLead.lead.public_session_id}
                </h2>
                <p className="mt-1 text-[9px] text-[#718079]">
                  {selectedLead.lead.contact_name || "Unnamed customer"} · {selectedLead.lead.channel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearLeadPhotoUrls();
                  setSelectedLead(null);
                  setLeadNotice("");
                }}
                className="rounded-full border border-[#dfe5e2] bg-white px-3 py-2 text-[8px] font-bold text-[#596962]"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 p-5">
              {leadNotice ? (
                <div className="rounded-xl border border-[#dce7e5] bg-white px-4 py-3 text-[9px] text-[#52635c]">
                  {leadNotice}
                </div>
              ) : null}

              <section className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Customer", selectedLead.lead.contact_name || "-"],
                  ["Phone", selectedLead.lead.phone || "-"],
                  ["Channel", selectedLead.lead.channel || "-"],
                  ["Created", selectedLead.lead.created_at || "-"],
                  ["Skin feel", skinFeelLabelMap[selectedLead.lead.skin_feel || ""] || humanize(selectedLead.lead.skin_feel)],
                  ["Sensitivity", sensitivityLabelMap[selectedLead.lead.sensitivity || ""] || humanize(selectedLead.lead.sensitivity)],
                  ["Main concern", concernLabel(selectedLead.lead.top_concern || selectedLead.lead.primary_concern)],
                  ["Second concern", concernLabel(selectedLead.lead.second_concern)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-[#e1e8e5] bg-white p-3">
                    <div className="text-[7px] font-bold uppercase tracking-[.1em] text-[#87948e]">{label}</div>
                    <div className="mt-1 text-[10px] font-semibold text-[#34443d]">{String(value)}</div>
                  </div>
                ))}
              </section>

              {selectedLead.photo_angles?.length ? (
                <section className="rounded-2xl border border-[#e1e8e5] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[11px] font-bold text-[#2f3f38]">Temporary analysis photos</h3>
                    <span className="text-[7px] font-semibold uppercase tracking-[.08em] text-[#87948e]">Auto-delete</span>
                  </div>
                  <p className="mt-1 text-[8px] leading-4 text-[#87948e]">
                    Private advisor preview only. Photos disappear after the retention window and are not stored in Beauty Passport.
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {(["front", "left", "right"] as const).map((angle) =>
                      leadPhotoUrls[angle] ? (
                        <div key={angle}>
                          <div className="overflow-hidden rounded-xl border border-[#e1e8e5] bg-[#f7f9f8]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={leadPhotoUrls[angle]} alt={`${angle} Skin Analysis preview`} className="aspect-[3/4] w-full object-cover" />
                          </div>
                          <div className="mt-1 text-center text-[7px] font-bold uppercase tracking-[.08em] text-[#718079]">{angle}</div>
                        </div>
                      ) : null,
                    )}
                  </div>
                </section>
              ) : null}

              <section className="rounded-2xl border border-[#e1e8e5] bg-white p-4">
                <h3 className="text-[11px] font-bold text-[#2f3f38]">Customer context</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl bg-[#f7f9f8] p-3 text-[9px] text-[#52635c]">
                    Routine: <b>{humanize(selectedLead.lead.routine_preference)}</b>
                  </div>
                  <div className="rounded-xl bg-[#f7f9f8] p-3 text-[9px] text-[#52635c]">
                    Budget: <b>{humanize(selectedLead.lead.budget_band)}</b>
                  </div>
                  <div className="rounded-xl bg-[#f7f9f8] p-3 text-[9px] text-[#52635c]">
                    Active experience: <b>{humanize(selectedLead.lead.active_tolerance)}</b>
                  </div>
                  <div className="rounded-xl bg-[#f7f9f8] p-3 text-[9px] text-[#52635c]">
                    Irritation: <b>{selectedLead.lead.known_irritation ? "Yes" : "No"}</b>
                  </div>
                  <div className="rounded-xl bg-[#f7f9f8] p-3 text-[9px] text-[#52635c]">
                    Treatment context: <b>{selectedLead.lead.treatment_context ? "Yes" : "No"}</b>
                  </div>
                  <div className="rounded-xl bg-[#f7f9f8] p-3 text-[9px] text-[#52635c]">
                    Result source: <b>{selectedLead.observations?.length ? "Photo + answers" : "Answers only"}</b>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#e1e8e5] bg-white p-4">
                <h3 className="text-[11px] font-bold text-[#2f3f38]">Photo observations</h3>
                {selectedLead.observations?.length ? (
                  <div className="mt-3 grid gap-2">
                    {selectedLead.observations.map((item) => (
                      <div key={concernLabel(item.concern_key)} className="flex items-center justify-between rounded-xl bg-[#f7f9f8] p-3">
                        <span className="text-[9px] font-semibold text-[#4c5f57]">{concernLabel(item.concern_key)}</span>
                        <span className="text-[8px] text-[#87948e]">Provider observation</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[9px] text-[#87948e]">Questions-only result. No photo observations were used.</p>
                )}
              </section>

              <section className="rounded-2xl border border-[#e1e8e5] bg-white p-4">
                <h3 className="text-[11px] font-bold text-[#2f3f38]">Advisor workflow</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-[180px_1fr]">
                  <select
                    value={leadStatus}
                    onChange={(e) => setLeadStatus(e.target.value)}
                    className="h-10 rounded-xl border border-[#dce4e0] bg-white px-3 text-[9px] font-semibold text-[#45564f]"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="in_conversation">In conversation</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="converted">Converted</option>
                    <option value="closed">Closed</option>
                  </select>
                  <input
                    value={leadNote}
                    onChange={(e) => setLeadNote(e.target.value)}
                    maxLength={255}
                    placeholder="Advisor note"
                    className="h-10 rounded-xl border border-[#dce4e0] bg-white px-3 text-[9px] text-[#45564f]"
                  />
                </div>
                <button
                  type="button"
                  disabled={leadLoading}
                  onClick={() => void saveLeadUpdate()}
                  className="mt-3 rounded-full bg-[#3b646d] px-4 py-2.5 text-[8px] font-bold text-white disabled:opacity-50"
                >
                  {leadLoading ? "Saving..." : "Save lead"}
                </button>
              </section>

              <section className="rounded-2xl border border-[#e1e8e5] bg-white p-4">
                <h3 className="text-[11px] font-bold text-[#2f3f38]">Recent analysis events</h3>
                <div className="mt-3 space-y-2">
                  {selectedLead.events?.length ? selectedLead.events.slice(0, 10).map((event, index) => (
                    <div key={`${event.event_name}-${index}`} className="flex items-center justify-between rounded-lg bg-[#f7f9f8] px-3 py-2 text-[8px]">
                      <span className="font-semibold text-[#4c5f57]">{event.event_name}</span>
                      <span className="text-[#87948e]">{event.created_at}</span>
                    </div>
                  )) : (
                    <div className="text-[9px] text-[#87948e]">No events available.</div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Retries" value={summary.retries || 0} />
        <Metric label="Face too small" value={summary.face_too_small || 0} />
        <Metric label="Product clicks" value={summary.product_clicks || 0} />
        <Metric label="Full routine adds" value={summary.routine_add_to_bag || 0} />
      </section>
    </div>
  );
}



