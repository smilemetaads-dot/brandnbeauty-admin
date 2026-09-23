"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createDispatchBatch,
  handoverDispatchBatch,
  loadDispatchControl,
  type DispatchBatch,
  type DispatchData,
  type DispatchQueueOrder,
} from "./dispatch-control-client";

const money=(value:number|string)=>`৳${Number(value||0).toLocaleString("en-BD")}`;

function clearanceTone(status:string){
  if(status==="cleared") return "bg-emerald-50 text-emerald-700";
  if(status==="blocked") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

function batchTone(status:string){
  if(status==="handed_over") return "bg-emerald-50 text-emerald-700";
  if(status==="partial") return "bg-amber-50 text-amber-700";
  if(status==="ready") return "bg-sky-50 text-sky-700";
  return "bg-slate-100 text-slate-600";
}

export function LiveDispatchControlWorkspace(){
  const [data,setData]=useState<DispatchData|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [selected,setSelected]=useState<Record<string,boolean>>({});
  const [provider,setProvider]=useState("");
  const [busy,setBusy]=useState("");

  const refresh=useCallback(async(signal?:AbortSignal)=>{
    setLoading(true);setError("");
    try{
      const next=await loadDispatchControl(signal);
      setData(next);
      setSelected(current=>{
        const allowed=new Set(next.queue.filter(row=>row.clearance_status==="cleared").map(row=>row.order_id));
        return Object.fromEntries(Object.entries(current).filter(([id,value])=>value&&allowed.has(id)));
      });
    }catch(problem){
      if(!signal?.aborted){
        setError(problem instanceof Error?problem.message:"Dispatch Control unavailable.");
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

  const providers=useMemo(()=>Array.from(new Set(
    (data?.queue??[])
      .filter(row=>row.clearance_status==="cleared"&&row.provider)
      .map(row=>row.provider as string)
  )).sort(),[data]);

  useEffect(()=>{
    if(provider && !providers.includes(provider)) setProvider("");
  },[provider,providers]);

  const cleared=useMemo(()=>(data?.queue??[]).filter(
    row=>row.clearance_status==="cleared"&&(!provider||row.provider===provider)
  ),[data,provider]);

  const blocked=useMemo(()=>(data?.queue??[]).filter(row=>row.clearance_status==="blocked"),[data]);
  const selectedIds=Object.entries(selected).filter(([,value])=>value).map(([id])=>id);
  const selectedRows=cleared.filter(row=>selectedIds.includes(row.order_id));
  const selectedCod=selectedRows.reduce((sum,row)=>sum+Number(row.cod_amount||0),0);

  function show(message:string){
    setNotice(message);
    window.setTimeout(()=>setNotice(""),4500);
  }

  async function createBatch(){
    const rows=selectedRows;
    if(!provider){
      setError("Choose a courier provider first.");
      return;
    }
    if(!rows.length){
      setError("Select at least one cleared parcel.");
      return;
    }
    if(rows.some(row=>row.provider!==provider)){
      setError("Every selected parcel must use the same courier provider.");
      return;
    }

    setBusy("create");setError("");
    try{
      const result=await createDispatchBatch(provider,rows.map(row=>row.order_id));
      show(result.message as string || "Dispatch batch created.");
      setSelected({});
      await refresh();
    }catch(problem){
      setError(problem instanceof Error?problem.message:"Dispatch batch could not be created.");
    }finally{
      setBusy("");
    }
  }

  async function handover(batch:DispatchBatch){
    const ack=window.prompt(
      "Courier acknowledgement / manifest reference (optional):",
      batch.acknowledgement_reference || "",
    );
    if(ack===null)return;

    setBusy(`handover:${batch.id}`);setError("");
    try{
      const result=await handoverDispatchBatch(String(batch.id),ack.trim());
      show(result.message as string || "Dispatch handover completed.");
      await refresh();
    }catch(problem){
      setError(problem instanceof Error?problem.message:"Dispatch handover could not complete.");
    }finally{
      setBusy("");
    }
  }

  function toggle(row:DispatchQueueOrder,checked:boolean){
    if(row.clearance_status!=="cleared")return;
    if(provider && row.provider!==provider)return;
    setSelected(current=>({...current,[row.order_id]:checked}));
  }

  return <div className="space-y-5">
    <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3b646d]">Operations · pre-dispatch reconciliation</p>
        <h1 className="mt-2 text-[28px] font-bold tracking-[-.035em] text-[#17231f] sm:text-[32px]">Dispatch Control</h1>
        <p className="mt-1.5 max-w-3xl text-[12.5px] leading-5 text-[#66736d]">Packed parcels are cleared only when Packing Session evidence is complete and a courier booking exists. Shipped status is created only through batch handover.</p>
      </div>
      <button onClick={()=>void refresh()} className="h-10 rounded-xl border bg-white px-4 text-[9px] font-bold text-[#596962]">{loading?"Refreshing…":"Refresh"}</button>
    </section>

    {error?<div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[10px] font-semibold text-rose-700">{error}</div>:null}
    {notice?<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[10px] font-semibold text-emerald-700">{notice}</div>:null}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {[
        ["Packed",data?.summary.packed??0],
        ["Cleared",data?.summary.cleared??0],
        ["Blocked",data?.summary.blocked??0],
        ["Already batched",data?.summary.batched??0],
        ["Open batches",data?.summary.open_batches??0],
      ].map(([label,value])=><article key={String(label)} className="rounded-2xl border border-[#e2e8e5] bg-white p-4"><p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#87928d]">{label}</p><strong className="mt-3 block text-[22px] text-[#17231f]">{value}</strong></article>)}
    </section>

    <section className="rounded-2xl border border-[#e2e8e5] bg-white">
      <div className="flex flex-col gap-3 border-b p-5 lg:flex-row lg:items-end lg:justify-between">
        <div><h2 className="text-[16px] font-bold text-[#23322b]">Create dispatch batch</h2><p className="mt-1 text-[8px] text-[#7c8882]">One provider per batch. Only cleared parcels are selectable.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select value={provider} onChange={event=>{setProvider(event.target.value);setSelected({});}} className="h-10 rounded-xl border bg-white px-3 text-[9px] font-bold text-[#596962]"><option value="">Choose provider</option>{providers.map(name=><option key={name} value={name}>{name}</option>)}</select>
          <button disabled={busy==="create"||!provider||selectedRows.length===0} onClick={()=>void createBatch()} className="h-10 rounded-xl bg-[#3b646d] px-4 text-[8px] font-bold text-white disabled:opacity-40">{busy==="create"?"Creating…":`Create batch · ${selectedRows.length} · ${money(selectedCod)}`}</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-[#fafbfa] text-[7px] font-bold uppercase tracking-[.09em] text-[#84908a]"><tr><th className="p-3">Select</th><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Courier</th><th className="p-3">Tracking</th><th className="p-3">COD</th><th className="p-3">Clearance</th></tr></thead>
          <tbody className="divide-y">
            {cleared.length===0?<tr><td colSpan={7} className="p-6 text-center text-[9px] text-[#87928d]">No cleared parcel for the selected provider.</td></tr>:cleared.map(row=><tr key={row.order_id}><td className="p-3"><input type="checkbox" checked={Boolean(selected[row.order_id])} onChange={event=>toggle(row,event.target.checked)} className="h-4 w-4 accent-[#3b646d]"/></td><td className="p-3 text-[9px] font-bold text-[#405049]">#{row.order_id}</td><td className="p-3"><b className="block text-[9px] text-[#405049]">{row.customer_name}</b><span className="text-[7.5px] text-[#84908a]">{row.customer_phone}</span></td><td className="p-3 text-[8px] font-semibold text-[#596962]">{row.provider||"Not booked"}</td><td className="p-3 text-[8px] text-[#66736d]">{row.tracking_code||row.consignment_id||"Not assigned"}</td><td className="p-3 text-[9px] font-bold text-[#405049]">{money(row.cod_amount)}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-[7px] font-bold ${clearanceTone(row.clearance_status)}`}>{row.clearance_status.toUpperCase()}</span></td></tr>)}
          </tbody>
        </table>
      </div>
    </section>

    {blocked.length>0?<section className="rounded-2xl border border-rose-100 bg-white">
      <div className="border-b p-5"><h2 className="text-[16px] font-bold text-[#23322b]">Blocked parcels</h2><p className="mt-1 text-[8px] text-[#7c8882]">Fix the packing/booking dependency instead of overriding silently.</p></div>
      <div className="divide-y">{blocked.map(row=><div key={row.order_id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div><b className="text-[9px] text-[#405049]">Order #{row.order_id} · {row.customer_name}</b><p className="mt-1 text-[7.5px] text-rose-700">{row.block_reason}</p></div><a href={row.packing_session_status==="completed"?"/courier":"/packing"} className="w-fit rounded-xl border px-3 py-2 text-[7.5px] font-bold text-[#596962]">{row.packing_session_status==="completed"?"Open Courier":"Open Packing"}</a></div>)}</div>
    </section>:null}

    <section className="rounded-2xl border border-[#e2e8e5] bg-white">
      <div className="border-b p-5"><h2 className="text-[16px] font-bold text-[#23322b]">Dispatch batches</h2><p className="mt-1 text-[8px] text-[#7c8882]">Handover transitions cleared Packed orders to Shipped through the canonical order service.</p></div>
      <div className="divide-y">
        {(data?.batches??[]).length===0?<div className="p-6 text-[9px] text-[#87928d]">No dispatch batch yet.</div>:(data?.batches??[]).map(batch=><div key={String(batch.id)} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><b className="text-[10px] text-[#405049]">{batch.batch_code}</b><span className={`rounded-full px-2 py-1 text-[7px] font-bold ${batchTone(batch.status)}`}>{batch.status.toUpperCase()}</span></div><p className="mt-1 text-[7.5px] text-[#7d8983]">{batch.provider} · {batch.order_count} parcel(s) · {money(batch.cod_total)} COD · Handed {Number(batch.handed_over_count||0)} · Pending {Number(batch.pending_count||0)} · Failed {Number(batch.failed_count||0)}</p>{batch.acknowledgement_reference?<p className="mt-1 text-[7.5px] text-[#66736d]">Ack: {batch.acknowledgement_reference}</p>:null}</div>{["ready","partial"].includes(batch.status)?<button disabled={busy===`handover:${batch.id}`} onClick={()=>void handover(batch)} className="h-10 rounded-xl bg-[#3b646d] px-4 text-[8px] font-bold text-white disabled:opacity-40">{busy===`handover:${batch.id}`?"Handing over…":"Confirm courier handover"}</button>:null}</div>)}
      </div>
    </section>

    <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-[8px] leading-4 text-sky-900"><b>External courier APIs:</b> not connected yet. Current booking remains manual/provider-reference based. Dispatch Control standardizes the handover boundary now so Steadfast/Pathao/RedX APIs can later plug into the same service layer.</div>
  </div>;
}
