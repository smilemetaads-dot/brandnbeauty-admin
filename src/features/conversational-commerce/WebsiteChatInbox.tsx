"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WebsiteChatAdminState, loadWebsiteChat, markWebsiteChatRead, replyWebsiteChat, setWebsiteChatStatus } from "./website-chat-client";

const empty: WebsiteChatAdminState = { summary: { total: 0, open: 0, waiting_customer: 0, unread: 0 }, sessions: [], selected_session: null, messages: [] };
const human = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function WebsiteChatInbox() {
  const [state, setState] = useState(empty);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reply, setReply] = useState("");
  const [reason, setReason] = useState("Human response to website support request");

  const load = useCallback(async (sessionId = selectedId, signal?: AbortSignal) => {
    try {
      const next = await loadWebsiteChat(sessionId, signal);
      setState(next);
      setSelectedId((current) => current || next.selected_session?.id || next.sessions[0]?.id || "");
      setError("");
    } catch (problem) {
      if (!(problem instanceof DOMException && problem.name === "AbortError")) setError(problem instanceof Error ? problem.message : "Website inbox could not be loaded.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    const controller = new AbortController();
    void load(selectedId, controller.signal);
    const timer = window.setInterval(() => void load(selectedId), 15000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [load, selectedId]);

  const selected = state.selected_session;
  const queue = useMemo(() => state.sessions.filter((item) => item.status !== "closed"), [state.sessions]);

  async function selectSession(id: string) {
    setSelectedId(id);
    setLoading(true);
    try {
      const next = await markWebsiteChatRead(id);
      setState(next);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Conversation could not be opened.");
    } finally { setLoading(false); }
  }

  async function sendReply() {
    if (!selected || reply.trim().length < 2 || reason.trim().length < 8) return;
    setSaving(true); setError("");
    try {
      const next = await replyWebsiteChat({ actor: "BrandnBeauty Support", message: reply.trim(), reason: reason.trim(), session_id: selected.id });
      setState(next); setReply(""); setNotice("Human reply is now visible in the customer website chat.");
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Reply could not be published."); }
    finally { setSaving(false); }
  }

  async function changeStatus(status: string) {
    if (!selected) return;
    setSaving(true); setError("");
    try {
      const next = await setWebsiteChatStatus({ actor: "BrandnBeauty Support", reason: `Human queue status changed to ${status}`, session_id: selected.id, status });
      setState(next); setNotice(`Conversation marked ${human(status)}.`);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Status could not be updated."); }
    finally { setSaving(false); }
  }

  return <section className="overflow-hidden rounded-2xl border border-[#d9e4e1] bg-white">
    <header className="flex flex-col gap-4 border-b border-[#e3e9e6] bg-[#f5f8f7] p-5 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#3b646d]">Live website inbox</p><span className="rounded-full bg-emerald-50 px-2 py-1 text-[6px] font-bold text-emerald-700">Human reply only</span></div><h2 className="mt-1.5 text-[17px] font-bold text-[#26372f]">Support Hub conversations</h2><p className="mt-1 text-[8px] text-[#7c8983]">Customer messages and human replies stay on your own website. Messenger remains a separate continuation link.</p></div><div className="grid grid-cols-4 gap-2">{[["Total",state.summary.total],["Open",state.summary.open],["Waiting",state.summary.waiting_customer],["Unread",state.summary.unread]].map(([label,value])=><div className="min-w-16 rounded-xl border bg-white px-3 py-2 text-center" key={String(label)}><b className="block text-[13px] text-[#314b47]">{loading?"—":value}</b><span className="text-[6px] uppercase text-[#8a9690]">{label}</span></div>)}</div></header>
    {error?<div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-[8px] font-bold text-rose-700">{error}</div>:null}{notice?<div className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-[8px] font-bold text-emerald-700">{notice}</div>:null}
    <div className="grid min-h-[520px] lg:grid-cols-[360px_minmax(0,1fr)]"><aside className="border-r border-[#e5eae8]"><div className="border-b p-3"><button className="h-9 w-full rounded-xl border bg-white text-[8px] font-bold text-[#50635b]" onClick={()=>void load()}>Refresh website queue</button></div><div className="max-h-[620px] divide-y overflow-y-auto">{queue.length?queue.map((item)=><button className={`w-full p-4 text-left ${selectedId===item.id?"bg-[#edf4f3]":"hover:bg-[#f8faf9]"}`} key={item.id} onClick={()=>void selectSession(item.id)}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><b className="block truncate text-[9px] text-[#34443d]">{item.customer_name||"Website visitor"}</b><span className="mt-1 block truncate text-[7px] text-[#8a9690]">{item.contact_mask||"No contact shared"} · {item.assigned_to}</span></div>{item.unread_count>0?<span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#3b646d] px-1 text-[6px] font-bold text-white">{item.unread_count}</span>:null}</div><p className="mt-2 line-clamp-2 text-[7px] leading-4 text-[#64736c]">{item.latest_message||"Conversation started"}</p><span className="mt-2 inline-flex rounded-full bg-white px-2 py-1 text-[6px] font-bold text-[#52716d] ring-1 ring-[#d8e3e0]">{human(item.status)}</span></button>):<div className="flex min-h-72 items-center justify-center p-6 text-center text-[8px] text-[#8b9691]">No real website conversations yet. No sample messages are inserted.</div>}</div></aside>
      <div className="flex min-w-0 flex-col">{selected?<><div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div><b className="text-[11px] text-[#34443d]">{selected.customer_name||"Website visitor"}</b><p className="mt-1 text-[7px] text-[#8a9690]">Consent recorded · assigned to {selected.assigned_to}</p></div><div className="flex gap-2"><select className="h-9 rounded-xl border bg-white px-3 text-[8px]" disabled={saving} onChange={(event)=>void changeStatus(event.target.value)} value={selected.status}><option value="open">Open</option><option value="waiting_customer">Waiting customer</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></div></div><div className="flex-1 space-y-3 overflow-y-auto bg-[#fafbfa] p-4">{state.messages.map((item)=><div className={`flex ${item.sender==="admin"?"justify-end":"justify-start"}`} key={item.id}><div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[8px] leading-4 ${item.sender==="admin"?"rounded-br-md bg-[#426d72] text-white":"rounded-bl-md border bg-white text-[#52615a]"}`}><p>{item.body}</p><span className={`mt-1 block text-[6px] ${item.sender==="admin"?"text-white/65":"text-[#9aa49f]"}`}>{item.author_label||human(item.sender)} · {item.created_at}</span></div></div>)}</div><div className="space-y-2 border-t bg-white p-4"><textarea className="min-h-20 w-full resize-none rounded-xl border p-3 text-[9px] outline-none focus:border-[#8eaaa9]" disabled={saving||selected.status==="closed"||selected.status==="resolved"} maxLength={2000} onChange={(event)=>setReply(event.target.value)} placeholder="Write the exact human reply…" value={reply}/><input className="h-9 w-full rounded-xl border px-3 text-[8px] outline-none" onChange={(event)=>setReason(event.target.value)} value={reason}/><div className="flex items-center justify-between gap-3"><p className="text-[6.5px] leading-3 text-[#87938d]">Publishing sends this exact text only to this website conversation. No AI reply, order or product claim is generated.</p><button className="h-10 shrink-0 rounded-xl bg-[#426d72] px-4 text-[8px] font-bold text-white disabled:opacity-40" disabled={saving||reply.trim().length<2||reason.trim().length<8||selected.status==="closed"||selected.status==="resolved"} onClick={()=>void sendReply()}>{saving?"Publishing…":"Publish human reply"}</button></div></div></>:<div className="flex flex-1 items-center justify-center p-8 text-center"><div><b className="text-[10px] text-[#405049]">Select a website conversation</b><p className="mt-2 text-[8px] text-[#8b9691]">The real queue will appear here after a customer starts chat.</p></div></div>}</div></div>
  </section>;
}
