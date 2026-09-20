"use client";

import { useEffect, useMemo, useState } from "react";

type Candidate = {
  id: number;
  conversation_id: number | null;
  inbound_message_id: number | null;
  intent: string;
  language: string;
  response_text: string;
  generation_status: string;
  review_status: "pending" | "approved" | "rejected" | "sent";
  final_response_text?: string | null;
  inbound_text?: string | null;
  effective_policy?: {
    campaign_id?: string | null;
    configured_mode?: string;
    effective_mode?: string;
    reason?: string;
  };
};

type DashboardData = {
  status?: {
    master_bot_enabled?: boolean;
    ai_generation_desired?: boolean;
    ai_generation_effective?: boolean;
    messenger_ai_env_enabled?: boolean;
    messenger_ai_shadow_env_enabled?: boolean;
    messenger_webhook_ai_env_enabled?: boolean;
    openai_api_key_configured?: boolean;
    messenger_send_effective?: boolean;
    automatic_reply_effective?: boolean;
    pending_review_candidates?: number;
    sent_candidates?: number;
  };
  queue?: {
    candidates?: Candidate[];
  };
};

function Icon({ name, size = 15 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    command: <><path d="M18 9a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12Z"/></>,
    refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></>,
    shield: <><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    spark: <><path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8Z"/><path d="m19 15 .8 1.8L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-1.2Z"/></>,
    review: <><path d="M4 5h16v12H8l-4 4Z"/><path d="M8 9h8M8 13h5"/></>,
  };
  return <svg aria-hidden="true" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{paths[name] ?? paths.command}</svg>;
}

function StatusPill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "good" | "warn" | "bad" | "default";
}) {
  const cls = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-700 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    default: "bg-slate-100 text-slate-600 ring-slate-200",
  }[tone];

  return (
    <span className={"inline-flex rounded-full px-2.5 py-1 text-[7px] font-bold ring-1 ring-inset " + cls}>
      {children}
    </span>
  );
}

function Kpi({
  label,
  value,
  note,
  tone = "default",
  icon,
}: {
  label: string;
  value: React.ReactNode;
  note: string;
  tone?: "good" | "warn" | "bad" | "default";
  icon: string;
}) {
  const boxTone = tone === "bad"
    ? "bg-rose-50 text-rose-700"
    : tone === "warn"
      ? "bg-amber-50 text-amber-700"
      : tone === "good"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-[#edf3f4] text-[#477579]";

  return (
    <article className="rounded-2xl border border-[#e2e8e5] bg-white p-5 shadow-[0_1px_2px_rgba(25,50,45,0.03)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#7c8983]">{label}</p>
          <div className="mt-4 text-[20px] font-bold tracking-tight text-[#182720]">{value}</div>
        </div>
        <span className={"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " + boxTone}>
          <Icon name={icon}/>
        </span>
      </div>
      <p className="mt-4 border-t border-[#edf0ee] pt-3 text-[7px] leading-4 text-[#87928d]">{note}</p>
    </article>
  );
}

export function AiCommerceControlCenter() {
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [campaignId, setCampaignId] = useState("");
  const [campaignMode, setCampaignMode] = useState("off");

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/ai-commerce", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Could not load AI Commerce controls.");
      }

      setData({ status: json.status, queue: json.queue });

      const nextEdits: Record<number, string> = {};
      for (const candidate of json.queue?.candidates || []) {
        nextEdits[candidate.id] =
          candidate.final_response_text || candidate.response_text || "";
      }
      setEdits(nextEdits);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load AI Commerce controls.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const candidates = useMemo(
    () =>
      (data.queue?.candidates || []).filter(
        (item) => item.review_status !== "rejected",
      ),
    [data.queue?.candidates],
  );

  async function action(payload: Record<string, unknown>, id?: number) {
    if (id) setBusyId(id);
    setMessage("");

    try {
      const res = await fetch("/api/ai-commerce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || json.error || "Action failed.");
      }

      setMessage("Saved successfully.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  const status = data.status || {};
  const masterOn = Boolean(status.master_bot_enabled);
  const aiGenerationOn = Boolean(status.ai_generation_desired);
  const aiEnvironmentReady =
    Boolean(status.openai_api_key_configured) &&
    Boolean(status.messenger_ai_env_enabled) &&
    Boolean(status.messenger_ai_shadow_env_enabled) &&
    Boolean(status.messenger_webhook_ai_env_enabled);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3b646d]">AI commerce automation</p>
          </div>
          <h1 className="mt-2 text-[28px] font-bold tracking-[-.035em] text-[#17231f] sm:text-[32px]">
            Messenger Control Center
          </h1>
          <p className="mt-1.5 max-w-3xl text-[12.5px] leading-5 text-[#66736d]">
            Let AI prepare Messenger replies while you keep final control over campaigns, customer-facing sends and safety-sensitive conversations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="flex h-10 items-center gap-2 rounded-xl border border-[#dce4e0] bg-white px-4 text-[9px] font-bold text-[#596962] transition hover:bg-[#f7f9f8]"
            onClick={() => void load()}
            type="button"
          >
            <Icon name="refresh"/>Refresh
          </button>
          <button
            className={
              "flex h-10 items-center gap-2 rounded-xl px-4 text-[9px] font-bold transition " +
              (masterOn
                ? "bg-[#3b646d] text-white hover:bg-[#31545c]"
                : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100")
            }
            disabled={loading}
            onClick={() =>
              action({
                action: "set_global_bot",
                enabled: !masterOn,
                note: !masterOn
                  ? "Owner enabled AI Commerce assist mode."
                  : "Owner disabled AI Commerce globally.",
              })
            }
            type="button"
          >
            <Icon name="command"/>
            {masterOn ? "Bot Assist ON" : "Bot Assist OFF"}
          </button>
        </div>
      </section>

      {message ? (
        <div className={
          "flex items-center justify-between rounded-2xl border px-5 py-4 text-[8px] font-bold " +
          (message === "Saved successfully."
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-rose-200 bg-rose-50 text-rose-700")
        }>
          <span>{message}</span>
          <button className="underline" onClick={() => void load()} type="button">Try again</button>
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi
          icon="command"
          label="Master control"
          note="Global owner-controlled bot gate"
          tone={masterOn ? "good" : "bad"}
          value={<StatusPill tone={masterOn ? "good" : "bad"}>{masterOn ? "Enabled" : "Disabled"}</StatusPill>}
        />
        <Kpi
          icon="send"
          label="Messenger send"
          note="Meta send path readiness"
          tone={status.messenger_send_effective ? "good" : "bad"}
          value={<StatusPill tone={status.messenger_send_effective ? "good" : "bad"}>{status.messenger_send_effective ? "Ready" : "Blocked"}</StatusPill>}
        />
        <article className="rounded-2xl border border-[#e2e8e5] bg-white p-5 shadow-[0_1px_2px_rgba(25,50,45,0.03)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#7c8983]">AI generation</p>
              <div className="mt-4">
                <StatusPill tone={aiGenerationOn && aiEnvironmentReady ? "good" : aiGenerationOn ? "warn" : "default"}>
                  {aiGenerationOn ? (aiEnvironmentReady ? "ON" : "Needs env") : "OFF"}
                </StatusPill>
              </div>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf3f4] text-[#477579]">
              <Icon name="spark"/>
            </span>
          </div>
          <button
            className="mt-4 h-8 rounded-lg border border-[#dce4e0] bg-white px-3 text-[7px] font-bold text-[#3b646d] transition hover:bg-[#f4f7f5]"
            onClick={() =>
              action({
                action: "set_ai_generation",
                enabled: !aiGenerationOn,
                note: !aiGenerationOn
                  ? "Owner enabled AI reply candidate generation."
                  : "Owner disabled AI reply candidate generation.",
              })
            }
            type="button"
          >
            {aiGenerationOn ? "Turn off generation" : "Turn on generation"}
          </button>
          <p className="mt-3 border-t border-[#edf0ee] pt-3 text-[7px] leading-4 text-[#87928d]">AI drafts only; no automatic customer send</p>
        </article>
        <Kpi
          icon="shield"
          label="Auto reply"
          note="Permanent safety lock for this phase"
          tone="warn"
          value={<StatusPill tone="warn">Locked OFF</StatusPill>}
        />
        <Kpi
          icon="review"
          label="Pending review"
          note="Human approval queue"
          tone={(status.pending_review_candidates ?? 0) > 0 ? "warn" : "default"}
          value={String(status.pending_review_candidates ?? 0)}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.55fr)]">
        <article className="overflow-hidden rounded-2xl border border-[#e2e8e5] bg-white">
          <header className="flex flex-col gap-3 border-b border-[#edf0ee] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#84908a]">Reply queue</p>
              <h2 className="mt-1 text-[15px] font-bold text-[#33423b]">Human approval required</h2>
              <p className="mt-1 text-[7px] leading-4 text-[#87928d]">Review, edit and send each AI reply yourself.</p>
            </div>
            <span className="rounded-full bg-[#edf3f4] px-2.5 py-1 text-[7px] font-bold text-[#3b646d]">
              {candidates.length} waiting
            </span>
          </header>

          <div className="divide-y divide-[#edf0ee]">
            {loading ? (
              <div className="flex min-h-72 items-center justify-center text-[8px] font-semibold text-[#87928d]">
                Loading reply queue…
              </div>
            ) : candidates.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3f4] text-[#477579]">
                  <Icon name="review" size={18}/>
                </span>
                <b className="mt-4 text-[10px] text-[#405049]">No reply candidates are waiting</b>
                <p className="mt-1 text-[7px] leading-4 text-[#87928d]">New eligible Messenger conversations will appear here for review.</p>
              </div>
            ) : (
              candidates.map((candidate) => (
                <div className="space-y-4 p-5" key={candidate.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={candidate.review_status === "sent" ? "good" : "warn"}>
                      {candidate.review_status}
                    </StatusPill>
                    <StatusPill>{candidate.intent || "unknown intent"}</StatusPill>
                    <StatusPill>{candidate.language || "unknown language"}</StatusPill>
                    {candidate.effective_policy?.campaign_id ? (
                      <StatusPill>Campaign {candidate.effective_policy.campaign_id}</StatusPill>
                    ) : null}
                  </div>

                  <div className="rounded-xl border border-[#edf0ee] bg-[#fafbfa] p-4">
                    <p className="text-[7px] font-bold uppercase tracking-[.12em] text-[#8a9590]">Customer message</p>
                    <p className="mt-2 text-[9px] font-semibold leading-5 text-[#405049]">
                      {candidate.inbound_text || "Inbound text unavailable"}
                    </p>
                  </div>

                  <div>
                    <label className="text-[7px] font-bold uppercase tracking-[.12em] text-[#8a9590]">Suggested reply</label>
                    <textarea
                      className="mt-2 min-h-28 w-full rounded-xl border border-[#dce4e0] bg-white px-4 py-3 text-[9px] font-semibold leading-5 text-[#405049] outline-none focus:border-[#9eb7b4]"
                      disabled={candidate.review_status === "sent"}
                      onChange={(event) =>
                        setEdits((current) => ({
                          ...current,
                          [candidate.id]: event.target.value,
                        }))
                      }
                      value={edits[candidate.id] ?? candidate.response_text ?? ""}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {candidate.review_status !== "sent" ? (
                      <>
                        <button
                          className="h-9 rounded-xl bg-[#3b646d] px-4 text-[8px] font-bold text-white disabled:opacity-40"
                          disabled={busyId === candidate.id}
                          onClick={() =>
                            action(
                              {
                                action: "approve_send",
                                candidate_id: candidate.id,
                                edited_text: edits[candidate.id],
                              },
                              candidate.id,
                            )
                          }
                          type="button"
                        >
                          Approve & Send
                        </button>
                        <button
                          className="h-9 rounded-xl border border-rose-200 bg-rose-50 px-4 text-[8px] font-bold text-rose-700 disabled:opacity-40"
                          disabled={busyId === candidate.id}
                          onClick={() =>
                            action(
                              {
                                action: "reject_candidate",
                                candidate_id: candidate.id,
                              },
                              candidate.id,
                            )
                          }
                          type="button"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <StatusPill tone="good">Sent successfully</StatusPill>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-[#e2e8e5] bg-white p-5">
            <p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#84908a]">Campaign control</p>
            <h2 className="mt-1 text-[14px] font-bold text-[#33423b]">Bot policy</h2>
            <p className="mt-2 text-[7px] leading-4 text-[#87928d]">
              Choose whether a Meta campaign stays manual-only, uses AI assistance, or inherits the global setting.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block text-[8px] font-bold text-[#405049]">
                Campaign ID
                <input
                  className="mt-1.5 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[9px] text-[#405049] outline-none focus:border-[#9eb7b4]"
                  onChange={(event) => setCampaignId(event.target.value)}
                  placeholder="Meta campaign ID"
                  value={campaignId}
                />
              </label>

              <label className="block text-[8px] font-bold text-[#405049]">
                Mode
                <select
                  className="mt-1.5 h-10 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[9px] text-[#405049] outline-none focus:border-[#9eb7b4]"
                  onChange={(event) => setCampaignMode(event.target.value)}
                  value={campaignMode}
                >
                  <option value="off">OFF — manual only</option>
                  <option value="assist">Assist — human approval</option>
                  <option value="inherit">Inherit global control</option>
                </select>
              </label>

              <button
                className="h-10 w-full rounded-xl bg-[#3b646d] px-4 text-[8px] font-bold text-white transition hover:bg-[#31545c]"
                onClick={() =>
                  action({
                    action: "set_campaign_policy",
                    campaign_id: campaignId.trim(),
                    mode: campaignMode,
                    note: "Updated from AI Commerce Control Center.",
                  })
                }
                type="button"
              >
                Save campaign policy
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700">
                <Icon name="shield"/>
              </span>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[.12em] text-amber-700">Safety lock</p>
                <h3 className="mt-1 text-[11px] font-bold text-amber-900">Automatic replies stay disabled</h3>
                <p className="mt-2 text-[7px] leading-4 text-amber-700">
                  AI may draft replies only when you enable generation. Human takeover, safety flags and campaign OFF policies continue to block sends.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
