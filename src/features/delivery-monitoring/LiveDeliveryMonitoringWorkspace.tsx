"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadDeliveryMonitoring,
  recordDeliveryStatus,
  type DeliveryMonitoringData,
  type DeliveryShipment,
} from "./delivery-monitoring-client";

const money=(value:number)=>`৳${Number(value||0).toLocaleString("en-BD")}`;

const STATUS_OPTIONS=[
  ["in_transit","In transit"],
  ["out_for_delivery","Out for delivery"],
  ["failed","Failed delivery"],
  ["returning","Return in transit"],
  ["delivered","Delivered"],
  ["returned","Returned to warehouse"],
] as const;

const REASON_LABELS:Record<string,string>={
  customer_unreachable:"Customer unreachable",
  address_issue:"Address issue",
  customer_refused:"Customer refused",
  courier_issue:"Courier issue",
  payment_issue:"Payment issue",
  other:"Other",
};

function dateText(value:string|null){
  if(!value)return "Not available";
  const date=new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat("en-BD",{dateStyle:"medium",timeStyle:"short"}).format(date);
}

function statusTone(status:string){
  if(["delivered"].includes(status))return "bg-emerald-50 text-emerald-700";
  if(["returned","exception"].includes(status))return "bg-rose-50 text-rose-700";
  if(["returning","out_for_delivery"].includes(status))return "bg-amber-50 text-amber-700";
  return "bg-sky-50 text-sky-700";
}

function severityTone(severity:string){
  if(severity==="critical")return "bg-rose-100 text-rose-800";
  if(severity==="high")return "bg-orange-100 text-orange-800";
  if(severity==="medium")return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

export function LiveDeliveryMonitoringWorkspace(){
  const [data,setData]=useState<DeliveryMonitoringData|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [query,setQuery]=useState("");
  const [view,setView]=useState("Active");
  const [active,setActive]=useState<DeliveryShipment|null>(null);
  const [status,setStatus]=useState("in_transit");
  const [reason,setReason]=useState("");
  const [note,setNote]=useState("");
  const [saving,setSaving]=useState(false);

  const refresh=useCallback(async(signal?:AbortSignal)=>{
    setLoading(true);setError("");
    try{
      setData(await loadDeliveryMonitoring(signal));
    }catch(problem){
      if(!signal?.aborted){
        setError(problem instanceof Error?problem.message:"Delivery Monitoring unavailable.");
      }
    }finally{
      if(!signal?.aborted)setLoading(false);
    }
  },[]);

  useEffect(()=>{
    const controller=new AbortController();
    const timer=window.setTimeout(()=>void refresh(controller.signal),0);
    return()=>{window.clearTimeout(timer);controller.abort();}
  },[refresh]);

  const rows=useMemo(()=>{
    const all=data?.shipments??[];
    return all.filter(row=>{
      const haystack=`${row.order_id} ${row.customer_name} ${row.customer_phone} ${row.provider} ${row.tracking_code??""}`.toLowerCase();
      const matchesQuery=!query||haystack.includes(query.toLowerCase());
      const matchesView=
        view==="All" ||
        (view==="Active"&&row.order_status==="shipped") ||
        (view==="Exceptions"&&row.exception!==null) ||
        (view==="Returning"&&row.courier_status==="returning") ||
        (view==="Delivered"&&row.order_status==="delivered") ||
        (view==="Returned"&&row.order_status==="returned");
      return matchesQuery&&matchesView;
    });
  },[data,query,view]);

  function openUpdate(row:DeliveryShipment){
    setActive(row);
    setStatus(
      row.courier_status==="handed_over" ? "in_transit" :
      row.courier_status==="exception" ? "failed" :
      row.courier_status || "in_transit"
    );
    setReason(row.latest_failure_reason||"");
    setNote("");
  }

  async function submit(){
    if(!active)return;
    if(status==="failed"&&!reason){
      setError("Choose a failed-delivery reason.");
      return;
    }

    setSaving(true);setError("");
    try{
      const result=await recordDeliveryStatus({
        orderId:active.order_id,
        status,
        failureReasonCode:status==="failed"?reason:"",
        note,
      });
      setNotice((result.message as string)||"Delivery status recorded.");
      setActive(null);
      await refresh();
      window.setTimeout(()=>setNotice(""),4200);
    }catch(problem){
      setError(problem instanceof Error?problem.message:"Status update failed.");
    }finally{
      setSaving(false);
    }
  }

  return <div className="space-y-5">
    <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3b646d]">Operations · after courier handover</p>
        <h1 className="mt-2 text-[28px] font-bold tracking-[-.035em] text-[#17231f] sm:text-[32px]">Delivery Monitoring</h1>
        <p className="mt-1.5 max-w-3xl text-[12.5px] leading-5 text-[#66736d]">Canonical courier events, failed-delivery reasons, delayed-parcel exceptions and return-in-transit visibility. Returned parcels stay open until physical Return Receiving is completed.</p>
      </div>
      <button onClick={()=>void refresh()} className="h-10 rounded-xl border bg-white px-4 text-[9px] font-bold text-[#596962]">{loading?"Refreshing…":"Refresh"}</button>
    </section>

    {error?<div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[10px] font-semibold text-rose-700">{error}</div>:null}
    {notice?<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[10px] font-semibold text-emerald-700">{notice}</div>:null}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
      {[
        ["Active",data?.summary.active??0],
        ["In transit",data?.summary.in_transit??0],
        ["Out for delivery",data?.summary.out_for_delivery??0],
        ["Exceptions",data?.summary.exceptions??0],
        ["Returning",data?.summary.returning??0],
        ["Delivered",data?.summary.delivered??0],
        ["Return receiving",data?.summary.returned_waiting_receiving??0],
      ].map(([label,value])=><article key={String(label)} className="rounded-2xl border border-[#e2e8e5] bg-white p-4"><p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#87928d]">{label}</p><strong className="mt-3 block text-[22px] text-[#17231f]">{value}</strong></article>)}
    </section>

    <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-[8px] leading-4 text-sky-900">
      <b>Delay rules:</b> In transit {data?.thresholds.stale_in_transit_hours??72}h · Out for delivery {data?.thresholds.stale_out_for_delivery_hours??24}h · Returning {data?.thresholds.stale_returning_hours??120}h. These are deterministic operational thresholds stored in the database and can be made configurable in Settings later.
    </section>

    <section className="rounded-2xl border border-[#e2e8e5] bg-white">
      <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
        <input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search order / customer / courier / tracking" className="h-10 w-full max-w-md rounded-xl border px-3 text-[9px] outline-none"/>
        <div className="flex flex-wrap gap-2">{["Active","Exceptions","Returning","Delivered","Returned","All"].map(label=><button key={label} onClick={()=>setView(label)} className={`h-8 rounded-lg border px-3 text-[7.5px] font-bold ${view===label?"bg-[#edf3f4] text-[#315e64]":"bg-white text-[#738079]"}`}>{label}</button>)}</div>
      </div>

      <div className="divide-y">
        {rows.length===0?<div className="p-6 text-[9px] text-[#87928d]">No shipment matches this view.</div>:rows.map(row=><div key={row.order_id} className="p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <b className="text-[10px] text-[#405049]">Order #{row.order_id} · {row.customer_name}</b>
                <span className={`rounded-full px-2 py-1 text-[7px] font-bold ${statusTone(row.courier_status)}`}>{row.courier_status.replaceAll("_"," ").toUpperCase()}</span>
                {row.exception?<span className={`rounded-full px-2 py-1 text-[7px] font-bold ${severityTone(row.exception.severity)}`}>{row.exception.severity.toUpperCase()} EXCEPTION</span>:null}
              </div>
              <p className="mt-1 text-[7.5px] text-[#7d8983]">{row.provider} · {row.tracking_code||row.consignment_id||"No tracking"} · COD {money(row.cod_amount)} · Last movement {dateText(row.last_movement_at)}</p>
              {row.latest_failure_reason?<p className="mt-1 text-[7.5px] text-rose-700">Failure: {REASON_LABELS[row.latest_failure_reason]||row.latest_failure_reason.replaceAll("_"," ")}</p>:null}
              {row.exception?<p className="mt-1 text-[7.5px] leading-4 text-rose-700">{row.exception.message}</p>:null}
              {row.order_status==="returned"&&row.return_receipt_status!=="completed"?<p className="mt-1 text-[7.5px] font-semibold text-amber-700">Returned to merchant — physical Return Receiving still pending.</p>:null}
            </div>
            <div className="flex shrink-0 gap-2">
              {row.order_status==="returned"&&row.return_receipt_status!=="completed"?<a href="/returns/receiving" className="h-9 rounded-xl border px-3 py-2 text-[7.5px] font-bold text-[#596962]">Open Return Receiving</a>:null}
              {row.order_status!=="returned"?<button onClick={()=>openUpdate(row)} className="h-9 rounded-xl bg-[#3b646d] px-4 text-[8px] font-bold text-white">Record status</button>:null}
            </div>
          </div>
        </div>)}
      </div>
    </section>

    {active?<div className="fixed inset-0 z-[180] flex items-center justify-center bg-[#17231f]/40 p-4 backdrop-blur-sm" onMouseDown={event=>{if(event.currentTarget===event.target&&!saving)setActive(null)}}><section className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.24)]"><header className="border-b p-5"><p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#3b646d]">Manual courier event</p><h2 className="mt-1 text-[18px] font-bold text-[#23322b]">Order #{active.order_id} · {active.customer_name}</h2><p className="mt-2 text-[8px] text-[#7d8983]">Use the provider status you actually know. Do not guess delivery outcomes.</p></header><div className="space-y-4 p-5"><label className="block text-[8px] font-bold text-[#65736c]">Courier status<select value={status} onChange={event=>{setStatus(event.target.value);if(event.target.value!=="failed")setReason("");}} className="mt-2 h-10 w-full rounded-xl border bg-white px-3 text-[9px]">{STATUS_OPTIONS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>{status==="failed"?<label className="block text-[8px] font-bold text-[#65736c]">Failure reason<select value={reason} onChange={event=>setReason(event.target.value)} className="mt-2 h-10 w-full rounded-xl border bg-white px-3 text-[9px]"><option value="">Choose reason</option>{(data?.failure_reasons??[]).map(value=><option key={value} value={value}>{REASON_LABELS[value]||value}</option>)}</select></label>:null}<label className="block text-[8px] font-bold text-[#65736c]">Operational note<textarea value={note} onChange={event=>setNote(event.target.value)} rows={3} placeholder="Provider note, attempt detail or exception context" className="mt-2 w-full rounded-xl border p-3 text-[9px]"/></label>{status==="returned"?<div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[8px] leading-4 text-amber-900">Returned status does not restore sellable inventory. Warehouse Return Receiving remains mandatory.</div>:null}</div><footer className="flex justify-end gap-2 border-t p-4"><button disabled={saving} onClick={()=>setActive(null)} className="h-10 rounded-xl border px-4 text-[8px] font-bold">Cancel</button><button disabled={saving} onClick={()=>void submit()} className="h-10 rounded-xl bg-[#3b646d] px-4 text-[8px] font-bold text-white disabled:opacity-50">{saving?"Saving…":"Save status"}</button></footer></section></div>:null}
  </div>;
}
