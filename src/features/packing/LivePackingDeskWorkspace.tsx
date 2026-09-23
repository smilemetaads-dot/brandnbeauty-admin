"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  completePacking,
  loadPackingDesk,
  markPackingSlipPrinted,
  savePackingNote,
  startPacking,
  togglePackingCheck,
  verifyPackingItem,
  type PackingData,
  type PackingOrder,
} from "./packing-session-client";

type LivePackingDeskWorkspaceProps = {
  initialOrderId?: string;
  onOpenCourier?: () => void;
};

const CHECK_LABELS: Record<string,string> = {
  packing_slip_inserted: "Packing slip inserted",
  address_label_matched: "Address label matched",
  parcel_sealed_securely: "Parcel sealed securely",
};

const money = (value:number) => `৳${Number(value || 0).toLocaleString("en-BD")}`;

function statusTone(status:string) {
  if(status==="confirmed") return "bg-amber-50 text-amber-700";
  if(status==="processing") return "bg-violet-50 text-violet-700";
  if(status==="packed") return "bg-emerald-50 text-emerald-700";
  return "bg-slate-100 text-slate-600";
}

export function LivePackingDeskWorkspace({
  initialOrderId,
  onOpenCourier,
}: LivePackingDeskWorkspaceProps) {
  const [data,setData]=useState<PackingData|null>(null);
  const [activeId,setActiveId]=useState("");
  const [query,setQuery]=useState("");
  const [view,setView]=useState("Active queue");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [saving,setSaving]=useState("");
  const [note,setNote]=useState("");

  const requestedId=(initialOrderId || "").replace(/\D+/g,"");

  const refresh=useCallback(async(signal?:AbortSignal)=>{
    setLoading(true);setError("");
    try{
      const next=await loadPackingDesk(signal);
      setData(next);
      setActiveId(current=>{
        if(current && next.orders.some(order=>order.order_id===current)) return current;
        if(requestedId && next.orders.some(order=>order.order_id===requestedId)) return requestedId;
        return next.orders.find(order=>order.order_status!=="packed")?.order_id
          || next.orders[0]?.order_id
          || "";
      });
    }catch(problem){
      if(!signal?.aborted){
        setError(problem instanceof Error ? problem.message : "Packing Desk could not be loaded.");
      }
    }finally{
      if(!signal?.aborted)setLoading(false);
    }
  },[requestedId]);

  useEffect(()=>{
    const controller=new AbortController();
    const id=window.setTimeout(()=>void refresh(controller.signal),0);
    return()=>{window.clearTimeout(id);controller.abort();}
  },[refresh]);

  const rows=useMemo(()=>{
    const all=data?.orders ?? [];
    return all.filter(order=>{
      const haystack=`${order.order_id} ${order.customer_name} ${order.customer_phone} ${order.address} ${order.city}`.toLowerCase();
      const matchesQuery=!query || haystack.includes(query.toLowerCase());
      const matchesView=
        view==="All" ||
        (view==="Active queue" && order.order_status!=="packed") ||
        (view==="Confirmed" && order.order_status==="confirmed") ||
        (view==="In packing" && order.order_status==="processing") ||
        (view==="Packed" && order.order_status==="packed");
      return matchesQuery && matchesView;
    });
  },[data,query,view]);

  const active=(data?.orders ?? []).find(order=>order.order_id===activeId)
    || rows[0]
    || null;

  useEffect(()=>{
    setNote(active?.session?.packing_note ?? "");
  },[active?.order_id,active?.session?.packing_note]);

  function show(message:string){
    setNotice(message);
    window.setTimeout(()=>setNotice(""),4200);
  }

  async function mutate(key:string,operation:()=>Promise<unknown>,message?:string){
    setSaving(key);setError("");
    try{
      await operation();
      if(message)show(message);
      await refresh();
    }catch(problem){
      setError(problem instanceof Error ? problem.message : "Packing action failed.");
    }finally{
      setSaving("");
    }
  }

  async function openSlip(order:PackingOrder){
    await mutate(
      `slip:${order.order_id}`,
      ()=>markPackingSlipPrinted(order.order_id),
      "Packing slip open/print action recorded.",
    );
    window.open(
      `/orders/details/packing-slip?id=${encodeURIComponent(order.order_id)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  const totalSteps=active
    ? active.progress.total_items + active.progress.total_checks + 1
    : 0;
  const doneSteps=active
    ? active.progress.verified_items
      + active.progress.checked_checks
      + (active.session?.slip_printed_at ? 1 : 0)
    : 0;
  const percent=totalSteps ? Math.round(doneSteps/totalSteps*100) : 0;

  return <div className="space-y-5">
    <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3b646d]">Warehouse · physical verification</p>
        <h1 className="mt-2 text-[28px] font-bold tracking-[-.035em] text-[#17231f] sm:text-[32px]">Packing Desk</h1>
        <p className="mt-1.5 max-w-3xl text-[12.5px] leading-5 text-[#66736d]">Every packed order now needs a persisted packing session: item quantity verification, packing slip, address-label match and parcel-seal check. AI Packing remains disabled.</p>
      </div>
      <button onClick={()=>void refresh()} className="h-10 rounded-xl border bg-white px-4 text-[9px] font-bold text-[#596962]">{loading?"Refreshing…":"Refresh"}</button>
    </section>

    {error?<div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[10px] font-semibold text-rose-700">{error}</div>:null}
    {notice?<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[10px] font-semibold text-emerald-700">{notice}</div>:null}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {[
        ["Confirmed",data?.summary.confirmed??0],
        ["In packing",data?.summary.processing??0],
        ["Ready",data?.summary.ready??0],
        ["Packed",data?.summary.packed??0],
        ["Legacy packed/no session",data?.summary.legacy_packed_without_session??0],
      ].map(([label,value])=><article key={String(label)} className="rounded-2xl border border-[#e2e8e5] bg-white p-4"><p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#87928d]">{label}</p><strong className="mt-3 block text-[22px] text-[#17231f]">{value}</strong></article>)}
    </section>

    <section className="grid gap-5 xl:grid-cols-[370px_1fr]">
      <aside className="rounded-2xl border border-[#e2e8e5] bg-white">
        <div className="space-y-3 border-b p-4">
          <input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search order / customer / phone" className="h-10 w-full rounded-xl border px-3 text-[9px] outline-none"/>
          <div className="grid grid-cols-3 gap-2">
            {["Active queue","In packing","Packed"].map(label=><button key={label} onClick={()=>setView(label)} className={`h-8 rounded-lg border px-2 text-[7.5px] font-bold ${view===label?"bg-[#edf3f4] text-[#315e64]":"bg-white text-[#738079]"}`}>{label}</button>)}
          </div>
        </div>
        <div className="max-h-[650px] divide-y overflow-y-auto">
          {rows.length===0?<div className="p-5 text-[9px] text-[#7d8983]">No packing orders match this view.</div>:rows.map(order=><button key={order.order_id} onClick={()=>setActiveId(order.order_id)} className={`block w-full p-4 text-left transition ${active?.order_id===order.order_id?"bg-[#f7faf9]":"hover:bg-[#fafbfa]"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><b className="block truncate text-[10px] text-[#405049]">Order #{order.order_id}</b><p className="mt-1 truncate text-[8px] text-[#7d8983]">{order.customer_name} · {money(order.total_amount)}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[7px] font-bold ${statusTone(order.order_status)}`}>{order.order_status.toUpperCase()}</span></div></button>)}
        </div>
      </aside>

      <main className="min-w-0 rounded-2xl border border-[#e2e8e5] bg-white">
        {!active?<div className="p-8 text-[10px] text-[#7d8983]">Select an order from the queue.</div>:<>
          <header className="border-b p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#3b646d]">Order #{active.order_id}</p><h2 className="mt-1 text-[18px] font-bold text-[#23322b]">{active.customer_name}</h2><p className="mt-1 text-[8px] leading-4 text-[#7d8983]">{active.customer_phone||"No phone"} · {[active.address,active.city].filter(Boolean).join(", ")||"No address"} · {money(active.total_amount)}</p></div>
              <span className={`w-fit rounded-full px-3 py-1.5 text-[8px] font-bold ${statusTone(active.order_status)}`}>{active.order_status.toUpperCase()}</span>
            </div>

            {active.legacy_packed_without_session?<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-[8px] leading-4 text-amber-900"><b>Legacy packed order:</b> this order predates persisted Packing Sessions. The system will not fabricate historical verification evidence.</div>:null}

            {active.order_status!=="packed" && !active.session?<button disabled={Boolean(saving)} onClick={()=>void mutate(`start:${active.order_id}`,()=>startPacking(active.order_id),"Packing session started.")} className="mt-4 h-10 rounded-xl bg-[#3b646d] px-4 text-[8px] font-bold text-white disabled:opacity-50">{saving? "Working…":"Start packing"}</button>:null}

            {active.session?<div className="mt-4"><div className="flex items-center justify-between text-[8px] font-bold text-[#65736c]"><span>Verification progress</span><span>{percent}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf1ef]"><div className="h-full rounded-full bg-[#3b646d] transition-all" style={{width:`${percent}%`}}/></div></div>:null}
          </header>

          {active.session?<div className="space-y-5 p-5">
            <section>
              <div className="flex items-center justify-between gap-3"><div><h3 className="text-[12px] font-bold text-[#33443c]">1. Verify products & quantities</h3><p className="mt-1 text-[7.5px] text-[#87928d]">Staff physically confirms the full expected quantity for each order line.</p></div><span className="text-[8px] font-bold text-[#65736c]">{active.progress.verified_units}/{active.progress.expected_units} units</span></div>
              <div className="mt-3 space-y-2">{active.items.map(item=>{const checked=item.verified_quantity===item.quantity;return <label key={item.order_item_id} className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4"><div className="min-w-0"><b className="block truncate text-[9px] text-[#405049]">{item.product_name}</b><p className="mt-1 text-[7.5px] text-[#7d8983]">{item.variant_name||"Standard"} · {item.sku||"SKU unavailable"} · Expected Qty {item.quantity}</p></div><input disabled={Boolean(saving)||active.order_status==="packed"} type="checkbox" checked={checked} onChange={event=>void mutate(`item:${item.order_item_id}`,()=>verifyPackingItem(active.order_id,item.order_item_id,event.target.checked))} className="h-4 w-4 accent-[#3b646d]"/></label>})}</div>
            </section>

            <section className="rounded-xl border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-[12px] font-bold text-[#33443c]">2. Packing slip</h3><p className="mt-1 text-[7.5px] text-[#87928d]">{active.session.slip_printed_at?"Print/open action recorded.":"Open the canonical packing slip before completion."}</p></div><button disabled={Boolean(saving)} onClick={()=>void openSlip(active)} className="h-9 rounded-xl border px-4 text-[8px] font-bold text-[#596962]">{active.session.slip_printed_at?"Open again":"Open / print slip"}</button></div>
            </section>

            <section>
              <h3 className="text-[12px] font-bold text-[#33443c]">3. Parcel checks</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">{Object.keys(CHECK_LABELS).map(key=>{const checked=Boolean(active.checks[key]?.is_checked);return <label key={key} className="flex cursor-pointer items-start gap-3 rounded-xl border p-4"><input disabled={Boolean(saving)||active.order_status==="packed"} type="checkbox" checked={checked} onChange={event=>void mutate(`check:${key}`,()=>togglePackingCheck(active.order_id,key,event.target.checked))} className="mt-0.5 h-4 w-4 accent-[#3b646d]"/><span className="text-[8px] font-bold leading-4 text-[#53645c]">{CHECK_LABELS[key]}</span></label>})}</div>
            </section>

            <section>
              <label className="block text-[8px] font-bold text-[#65736c]">Packing note<textarea disabled={active.order_status==="packed"} value={note} onChange={event=>setNote(event.target.value)} rows={3} placeholder="Optional warehouse note" className="mt-2 w-full rounded-xl border p-3 text-[9px]"/></label>
              {active.order_status!=="packed"?<button disabled={Boolean(saving)} onClick={()=>void mutate(`note:${active.order_id}`,()=>savePackingNote(active.order_id,note),"Packing note saved.")} className="mt-2 h-8 rounded-lg border px-3 text-[7.5px] font-bold text-[#596962]">Save note</button>:null}
            </section>

            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-[8px] leading-4 text-sky-900"><b>AI Packing:</b> disabled/not configured. This phase stores manual verification evidence so camera/AI can be added later without replacing the packing workflow.</div>
          </div>:null}

          <footer className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[7.5px] text-[#87928d]">{active.session ? `Session: ${active.session.status} · Manual verification` : "No packing session yet."}</p>
            <div className="flex gap-2">
              {active.order_status==="packed" && onOpenCourier?<button onClick={onOpenCourier} className="h-10 rounded-xl border px-4 text-[8px] font-bold text-[#596962]">Open Courier</button>:null}
              {active.order_status==="processing"?<button disabled={Boolean(saving)||!active.ready_to_complete} onClick={()=>void mutate(`complete:${active.order_id}`,()=>completePacking(active.order_id),"Packing verified. Order moved to Packed.")} className="h-10 rounded-xl bg-[#3b646d] px-4 text-[8px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{saving===`complete:${active.order_id}`?"Completing…":"Complete packing"}</button>:null}
            </div>
          </footer>
        </>}
      </main>
    </section>
  </div>;
}
