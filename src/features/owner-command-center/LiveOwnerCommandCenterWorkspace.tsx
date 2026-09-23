"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { loadOwnerCommandCenter, OwnerCommandCenterData } from "./owner-command-center-client";

const money = (value: number | null) => value === null ? "Not Available" : `৳${new Intl.NumberFormat("en-BD",{maximumFractionDigits:0}).format(value)}`;
const count = (value: number | null) => value === null ? "Not Available" : new Intl.NumberFormat("en-BD").format(value);

const tone: Record<string,string> = {
  critical:"border-rose-200 bg-rose-50 text-rose-800",
  high:"border-orange-200 bg-orange-50 text-orange-800",
  medium:"border-amber-200 bg-amber-50 text-amber-800",
  low:"border-slate-200 bg-slate-50 text-slate-700",
};

export function LiveOwnerCommandCenterWorkspace() {
  const [data,setData]=useState<OwnerCommandCenterData|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  const refresh=useCallback(async()=>{
    setLoading(true);setError("");
    try{setData(await loadOwnerCommandCenter());}
    catch(problem){setError(problem instanceof Error?problem.message:"Owner Command Center is unavailable.");}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{const id=window.setTimeout(()=>void refresh(),0);return()=>window.clearTimeout(id)},[refresh]);

  const pipeline=useMemo(()=>data?.health.orders.pipeline??{},[data]);

  return <div className="space-y-5">
    <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3b646d]">Owner mode · management by exception</p>
        <h1 className="mt-2 text-[28px] font-bold tracking-[-.035em] text-[#17231f] sm:text-[32px]">Owner Command Center</h1>
        <p className="mt-1.5 max-w-3xl text-[12.5px] leading-5 text-[#66736d]">A low-noise owner view built only from verified canonical sources. Missing financial/integration truth is shown as Not Available instead of being fabricated.</p>
      </div>
      <button onClick={()=>void refresh()} className="h-10 rounded-xl border bg-white px-4 text-[9px] font-bold text-[#596962]">{loading?"Refreshing…":"Refresh"}</button>
    </section>

    {error?<div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[10px] font-semibold text-rose-700">{error}</div>:null}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <Metric label="Orders today" value={count(data?.health.orders.today_orders??null)} />
      <Metric label="Confirmed sales" value={money(data?.health.orders.confirmed_sales??null)} />
      <Metric label="Pending approvals" value={count(data?.health.exceptions.pending_approvals??null)} />
      <Metric label="Open alerts" value={count(data?.health.exceptions.open_alerts??null)} />
      <Metric label="Low stock" value={count(data?.health.inventory.low_stock??null)} />
      <Metric label="Integration issues" value={count(data?.health.integrations.issues??null)} />
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <div className="rounded-2xl border border-[#e2e8e5] bg-white">
        <div className="flex items-center justify-between border-b p-5">
          <div><h2 className="text-[16px] font-bold text-[#23322b]">Needs owner attention</h2><p className="mt-1 text-[8px] text-[#7c8882]">Only significant exceptions are surfaced here.</p></div>
          <Link href="/business-os/control" className="text-[8px] font-bold text-[#426d72]">Open control →</Link>
        </div>
        <div className="divide-y">
          {(data?.needs_attention??[]).length===0?<div className="p-6 text-[10px] text-[#7d8983]">No major owner exception is currently detected from the verified sources.</div>:(data?.needs_attention??[]).map(item=><Link href={item.href} key={item.key} className="block p-4 transition hover:bg-[#fafbfa]"><div className="flex items-start justify-between gap-4"><div><span className={`inline-flex rounded-full border px-2 py-1 text-[7px] font-bold ${tone[item.severity]||tone.low}`}>{item.severity.toUpperCase()}</span><b className="mt-2 block text-[10px] text-[#405049]">{item.title}</b><p className="mt-1 text-[7.5px] leading-4 text-[#7d8983]">{item.detail}</p></div><span className="text-[12px] text-[#87928d]">→</span></div></Link>)}
        </div>
      </div>

      <div className="rounded-2xl border border-[#e2e8e5] bg-white">
        <div className="border-b p-5"><h2 className="text-[16px] font-bold text-[#23322b]">Data confidence</h2></div>
        <div className="space-y-3 p-5">
          <Confidence label="Orders" ok={data?.health.orders.available??false}/>
          <Confidence label="Inventory" ok={data?.health.inventory.available??false}/>
          <Confidence label="Integration registry" ok={data?.health.integrations.available??false}/>
          {Object.entries(data?.health.foundation??{}).map(([key,ok])=><Confidence key={key} label={key.replaceAll("_"," ")} ok={ok}/>)}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[8px] leading-4 text-amber-900">Management is read/aggregate only. It never becomes a second source of transactional truth.</div>
        </div>
      </div>
    </section>

    <section className="grid gap-5 xl:grid-cols-2">
      <div className="rounded-2xl border border-[#e2e8e5] bg-white">
        <div className="border-b p-5"><h2 className="text-[16px] font-bold text-[#23322b]">Order pipeline today</h2></div>
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          {["new","confirmed","packing","packed","courier_ready","shipped","delivered","return_cancel"].map(key=><article key={key} className="rounded-xl border p-4"><p className="text-[7px] font-bold uppercase tracking-[.08em] text-[#87928d]">{key.replaceAll("_"," ")}</p><b className="mt-2 block text-[18px] text-[#23322b]">{data?.health.orders.pipeline?count(pipeline[key]??0):"Not Available"}</b></article>)}
        </div>
      </div>

      <div className="rounded-2xl border border-[#e2e8e5] bg-white">
        <div className="border-b p-5"><h2 className="text-[16px] font-bold text-[#23322b]">Financial / growth truth availability</h2></div>
        <div className="space-y-3 p-5">
          {Object.entries(data?.availability_notes??{}).map(([key,note])=><div key={key} className="rounded-xl border p-4"><div className="flex items-center justify-between gap-3"><b className="text-[9px] capitalize text-[#405049]">{key.replaceAll("_"," ")}</b><span className="rounded-full bg-slate-100 px-2 py-1 text-[7px] font-bold text-slate-600">NOT AVAILABLE</span></div><p className="mt-2 text-[7.5px] leading-4 text-[#7d8983]">{note}</p></div>)}
        </div>
      </div>
    </section>
  </div>;
}

function Metric({label,value}:{label:string;value:string}){
  return <article className="rounded-2xl border border-[#e2e8e5] bg-white p-4"><p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#87928d]">{label}</p><strong className="mt-3 block text-[20px] text-[#17231f]">{value}</strong></article>;
}

function Confidence({label,ok}:{label:string;ok:boolean}){
  return <div className="flex items-center justify-between rounded-xl border p-3"><span className="text-[8px] font-bold capitalize text-[#596962]">{label}</span><span className={`rounded-full px-2 py-1 text-[7px] font-bold ${ok?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-600"}`}>{ok?"VERIFIED":"NOT AVAILABLE"}</span></div>;
}
