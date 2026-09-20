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

function StatusPill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "good" | "warn" | "bad" | "default";
}) {
  const cls = {
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    default: "bg-slate-100 text-slate-600",
  }[tone];

  return (
    <span className={"inline-flex rounded-full px-3 py-1 text-xs font-black " + cls}>
      {children}
    </span>
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
      setMessage(error instanceof Error ? error.message : "Could not load controls.");
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
      <section className="overflow-hidden rounded-2xl border border-[#d9e4e1] bg-white shadow-sm">
        <div className="flex flex-col gap-5 bg-gradient-to-br from-[#41696f] via-[#5E7F85] to-[#9bb8b7] p-6 text-white xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">
              AI Commerce
            </div>
            <h1 className="mt-2 text-[28px] font-black tracking-tight">
              Messenger Control Center
            </h1>
            <p className="mt-2 max-w-3xl text-[12px] font-semibold leading-5 text-white/85">
              Owner-controlled Messenger assistance. The bot may prepare replies,
              but customer-facing sends require human approval.
            </p>
          </div>

          <button
            className={
              "rounded-xl px-5 py-3 text-[10px] font-black shadow-sm transition " +
              (masterOn
                ? "bg-white text-[#41696f]"
                : "bg-rose-100 text-rose-800")
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
            {masterOn ? "Bot Assist: ON" : "Bot Assist: OFF"}
          </button>
        </div>

        <div className="grid gap-3 border-t border-slate-100 p-5 md:grid-cols-5">
          <div className="rounded-xl bg-stone-50 p-4">
            <div className="text-[8px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Master Control
            </div>
            <div className="mt-2">
              <StatusPill tone={masterOn ? "good" : "bad"}>
                {masterOn ? "Enabled" : "Disabled"}
              </StatusPill>
            </div>
          </div>

          <div className="rounded-xl bg-stone-50 p-4">
            <div className="text-[8px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Messenger Send
            </div>
            <div className="mt-2">
              <StatusPill tone={status.messenger_send_effective ? "good" : "bad"}>
                {status.messenger_send_effective ? "Ready" : "Blocked"}
              </StatusPill>
            </div>
          </div>

          <div className="rounded-xl bg-stone-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[8px] font-bold uppercase tracking-[0.1em] text-slate-500">
                  AI Generation
                </div>
                <div className="mt-2">
                  <StatusPill tone={aiGenerationOn && aiEnvironmentReady ? "good" : aiGenerationOn ? "warn" : "default"}>
                    {aiGenerationOn ? (aiEnvironmentReady ? "ON" : "Needs env") : "OFF"}
                  </StatusPill>
                </div>
              </div>
              <button
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[8px] font-black text-slate-600"
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
                {aiGenerationOn ? "Turn off" : "Turn on"}
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-stone-50 p-4">
            <div className="text-[8px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Auto Reply
            </div>
            <div className="mt-2">
              <StatusPill tone="warn">Locked OFF</StatusPill>
            </div>
          </div>

          <div className="rounded-xl bg-stone-50 p-4">
            <div className="text-[8px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Pending Review
            </div>
            <div className="mt-1 text-2xl font-black text-slate-950">
              {status.pending_review_candidates ?? 0}
            </div>
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-bold text-slate-700">
          {message}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5">
            <div>
              <div className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
                Reply Queue
              </div>
              <h2 className="mt-1 text-[18px] font-black text-slate-950">
                Human Approval Required
              </h2>
            </div>

            <button
              className="rounded-xl border border-slate-200 px-4 py-2 text-[9px] font-black text-slate-600"
              onClick={() => void load()}
              type="button"
            >
              Refresh
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-[10px] font-semibold text-slate-500">
                Loading...
              </div>
            ) : candidates.length === 0 ? (
              <div className="p-8 text-[10px] font-semibold text-slate-500">
                No reply candidates are waiting.
              </div>
            ) : (
              candidates.map((candidate) => (
                <div className="space-y-4 p-5" key={candidate.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill
                      tone={candidate.review_status === "sent" ? "good" : "warn"}
                    >
                      {candidate.review_status}
                    </StatusPill>
                    <StatusPill>{candidate.intent || "unknown intent"}</StatusPill>
                    <StatusPill>{candidate.language || "unknown language"}</StatusPill>
                    {candidate.effective_policy?.campaign_id ? (
                      <StatusPill>
                        Campaign {candidate.effective_policy.campaign_id}
                      </StatusPill>
                    ) : null}
                  </div>

                  <div className="rounded-xl bg-stone-50 p-4">
                    <div className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Customer
                    </div>
                    <div className="mt-2 text-[11px] font-semibold leading-5 text-slate-800">
                      {candidate.inbound_text || "Inbound text unavailable"}
                    </div>
                  </div>

                  <div>
                    <label className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Suggested reply
                    </label>
                    <textarea
                      className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] font-semibold leading-5 text-slate-800 outline-none focus:border-[#5E7F85] focus:ring-4 focus:ring-[#5E7F85]/10"
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

                  <div className="flex flex-wrap gap-3">
                    {candidate.review_status !== "sent" ? (
                      <>
                        <button
                          className="rounded-xl bg-[#5E7F85] px-4 py-2.5 text-[9px] font-black text-white disabled:bg-slate-300"
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
                          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[9px] font-black text-rose-700"
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
                      <div className="text-[10px] font-bold text-emerald-700">
                        Sent successfully.
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
              Campaign Control
            </div>
            <h2 className="mt-1 text-[18px] font-black text-slate-950">
              Bot Policy
            </h2>
            <p className="mt-2 text-[10px] leading-5 text-slate-500">
              Disable the bot for a manual campaign, or keep it in assist mode.
              Auto remains reserved and will not fire.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-[9px] font-bold text-slate-700">
                  Campaign ID
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-[10px] font-semibold outline-none focus:border-[#5E7F85]"
                  onChange={(event) => setCampaignId(event.target.value)}
                  placeholder="Meta campaign ID"
                  value={campaignId}
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-700">Mode</label>
                <select
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-[10px] font-semibold outline-none focus:border-[#5E7F85]"
                  onChange={(event) => setCampaignMode(event.target.value)}
                  value={campaignMode}
                >
                  <option value="off">OFF — manual only</option>
                  <option value="assist">Assist — human approval</option>
                  <option value="inherit">Inherit global control</option>
                </select>
              </div>

              <button
                className="w-full rounded-xl bg-slate-950 px-4 py-3 text-[9px] font-black text-white"
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
                Save Campaign Policy
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="text-[9px] font-black text-amber-800">Safety Lock</div>
            <p className="mt-2 text-[9px] font-semibold leading-5 text-amber-700">
              Automatic replies are disabled. AI may draft replies only when you
              enable AI Generation. Human takeover, safety flags and campaign OFF
              policies block sends.
            </p>
          </section>
        </aside>
      </section>
    </div>
  );
}
