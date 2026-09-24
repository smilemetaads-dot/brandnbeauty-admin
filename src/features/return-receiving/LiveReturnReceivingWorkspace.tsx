"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  completeReturnReceiving,
  loadReturnReceiving,
  type ReturnOrder,
  type ReturnReceivingData,
} from "./return-receiving-client";

const dispositions = [
  ["restock", "Restock", "Sellable condition — return to available stock"],
  ["damaged", "Damaged", "Do not return to sellable stock"],
  ["quarantine", "Quarantine", "Hold for later quality decision"],
  ["write_off", "Write-off", "Unsellable / dispose through approved process"],
  ["investigate", "Investigate", "Condition or discrepancy needs review"],
] as const;

type Choice = {
  disposition: string;
  note: string;
  receivedQuantity: number;
};

const money = (value: number) => `৳${Number(value || 0).toLocaleString("en-BD")}`;

export function LiveReturnReceivingWorkspace() {
  const [data,setData]=useState<ReturnReceivingData|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [active,setActive]=useState<ReturnOrder|null>(null);
  const [choices,setChoices]=useState<Record<string,Choice>>({});
  const [inspectionNote,setInspectionNote]=useState("");
  const [saving,setSaving]=useState(false);

  const refresh=useCallback(async(signal?:AbortSignal)=>{
    setLoading(true);setError("");
    try{setData(await loadReturnReceiving(signal));}
    catch(problem){if(!signal?.aborted)setError(problem instanceof Error?problem.message:"Return Receiving unavailable.");}
    finally{if(!signal?.aborted)setLoading(false);}
  },[]);

  useEffect(()=>{
    const controller=new AbortController();
    const id=window.setTimeout(()=>void refresh(controller.signal),0);
    return()=>{window.clearTimeout(id);controller.abort();}
  },[refresh]);

  const pending=useMemo(()=>data?.returns.filter(row=>!row.receipt_id)??[],[data]);
  const completed=useMemo(()=>data?.returns.filter(row=>row.receipt_status==="completed")??[],[data]);

  function openInspection(order:ReturnOrder){
    const next:Record<string,Choice>={};
    for(const item of order.items){
      next[item.order_item_id]={
        disposition:"restock",
        note:"",
        receivedQuantity:item.quantity,
      };
    }
    setChoices(next);
    setInspectionNote("");
    setActive(order);
  }

  function updateChoice(itemId:string,patch:Partial<Choice>){
    setChoices(current=>({
      ...current,
      [itemId]:{...current[itemId],...patch},
    }));
  }

  async function submit(){
    if(!active)return;
    setSaving(true);setError("");
    try{
      const result=await completeReturnReceiving({
        orderId:active.order_id,
        inspectionNote,
        items:active.items.map(item=>({
          orderItemId:item.order_item_id,
          receivedQuantity:choices[item.order_item_id]?.receivedQuantity??item.quantity,
          disposition:choices[item.order_item_id]?.disposition??"investigate",
          note:choices[item.order_item_id]?.note??"",
        })),
      });
      setNotice(result.message??"Return Receiving completed.");
      setActive(null);
      await refresh();
      window.setTimeout(()=>setNotice(""),4500);
    }catch(problem){
      setError(problem instanceof Error?problem.message:"Return Receiving could not be completed.");
    }finally{setSaving(false);}
  }

  return <div className="space-y-5">
    <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3b646d]">Warehouse control · physical evidence first</p>
        <h1 className="mt-2 text-[28px] font-bold tracking-[-.035em] text-[#17231f] sm:text-[32px]">Return Receiving</h1>
        <p className="mt-1.5 max-w-3xl text-[12.5px] leading-5 text-[#66736d]">Courier return status never restores sellable stock. Inventory changes only after the parcel is physically received, every item is inspected, and a disposition is recorded.</p>
      </div>
      <button onClick={()=>void refresh()} className="h-10 rounded-xl border bg-white px-4 text-[9px] font-bold text-[#596962]">{loading?"Refreshing…":"Refresh"}</button>
    </section>

    {error?<div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[10px] font-semibold text-rose-700">{error}</div>:null}
    {notice?<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[10px] font-semibold text-emerald-700">{notice}</div>:null}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {[
        ["Returned orders",data?.summary.returned_orders??0],
        ["Pending receiving",data?.summary.pending_receiving??0],
        ["Completed receipts",data?.summary.completed_receipts??0],
        ["Restocked units",data?.summary.restocked_units??0],
        ["Non-restock units",data?.summary.non_restock_units??0],
      ].map(([label,value])=><article key={String(label)} className="rounded-2xl border border-[#e2e8e5] bg-white p-4"><p className="text-[7px] font-bold uppercase tracking-[.1em] text-[#87928d]">{label}</p><strong className="mt-3 block text-[22px] text-[#17231f]">{value}</strong></article>)}
    </section>

    <section className="rounded-2xl border border-[#e2e8e5] bg-white">
      <div className="border-b p-5"><h2 className="text-[16px] font-bold text-[#23322b]">Waiting for physical receiving</h2><p className="mt-1 text-[8px] text-[#7c8882]">These orders are already marked returned by Operations/Courier, but stock has not been restored.</p></div>
      <div className="divide-y">
        {pending.length===0?<div className="p-6 text-[10px] text-[#7d8983]">No returned parcel is waiting for receiving.</div>:pending.map(order=><div key={order.order_id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"><div><b className="text-[10px] text-[#405049]">Order #{order.order_id} · {order.customer_name}</b><p className="mt-1 text-[7.5px] text-[#7d8983]">{order.customer_phone||"No phone"} · {money(order.total_amount)} · {order.courier_name||"Courier"} · {order.items.length} line item(s)</p><p className="mt-1 text-[7.5px] text-rose-700">Inventory unchanged — warehouse inspection required.</p></div><button onClick={()=>openInspection(order)} className="h-9 shrink-0 rounded-xl bg-[#3b646d] px-4 text-[8px] font-bold text-white">Receive & inspect</button></div>)}
      </div>
    </section>

    <section className="rounded-2xl border border-[#e2e8e5] bg-white">
      <div className="border-b p-5"><h2 className="text-[16px] font-bold text-[#23322b]">Completed return receipts</h2></div>
      <div className="divide-y">
        {completed.length===0?<div className="p-6 text-[10px] text-[#7d8983]">No completed return receipt yet.</div>:completed.slice(0,40).map(order=><div key={order.order_id} className="p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><b className="text-[10px] text-[#405049]">Order #{order.order_id} · {order.customer_name}</b><p className="mt-1 text-[7.5px] text-[#7d8983]">Restocked {order.restocked_units} · Non-restock {order.non_restock_units}</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[7px] font-bold text-emerald-700">INSPECTED</span></div></div>)}
      </div>
    </section>

    {active?<div className="fixed inset-0 z-[170] flex items-center justify-center bg-[#17231f]/40 p-4 backdrop-blur-sm" onMouseDown={event=>{if(event.currentTarget===event.target&&!saving)setActive(null)}}><section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-[0_30px_90px_rgba(17,35,30,.24)]"><header className="border-b p-5"><p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#3b646d]">Physical receiving & inspection</p><h2 className="mt-1 text-[18px] font-bold text-[#23322b]">Order #{active.order_id} · {active.customer_name}</h2><p className="mt-2 text-[8px] leading-4 text-[#7d8983]">Restock only if the item is physically present and sellable. Damaged, quarantine, write-off and investigate dispositions do not increase sellable stock.</p></header><div className="space-y-4 p-5">{active.items.map(item=>{const choice=choices[item.order_item_id];return <article key={item.order_item_id} className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><b className="text-[10px] text-[#405049]">{item.product_name}</b><p className="mt-1 text-[7.5px] text-[#7d8983]">{item.variant_name||"Standard"} · Qty {item.quantity} · {item.inventory_mode}</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[7px] font-bold text-slate-600">FULL QTY REQUIRED</span></div><div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr]"><label className="text-[8px] font-bold text-[#65736c]">Disposition<select value={choice?.disposition||"restock"} onChange={event=>updateChoice(item.order_item_id,{disposition:event.target.value})} className="mt-2 h-10 w-full rounded-xl border px-3 text-[9px]">{dispositions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label className="text-[8px] font-bold text-[#65736c]">Item note<input value={choice?.note||""} onChange={event=>updateChoice(item.order_item_id,{note:event.target.value})} placeholder="Optional inspection note" className="mt-2 h-10 w-full rounded-xl border px-3 text-[9px]"/></label></div><p className="mt-3 text-[7px] leading-4 text-[#88938e]">{dispositions.find(([value])=>value===(choice?.disposition||"restock"))?.[2]}</p></article>})}<label className="block text-[8px] font-bold text-[#65736c]">Overall inspection note<textarea value={inspectionNote} onChange={event=>setInspectionNote(event.target.value)} rows={3} placeholder="Parcel condition, seal, discrepancy, or receiving note" className="mt-2 w-full rounded-xl border p-3 text-[9px]"/></label><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[8px] leading-4 text-amber-900"><b>Idempotent safety:</b> once this receipt is completed, submitting it again will not restore stock twice.</div></div><footer className="flex justify-end gap-2 border-t p-4"><button disabled={saving} onClick={()=>setActive(null)} className="h-10 rounded-xl border px-4 text-[8px] font-bold">Cancel</button><button disabled={saving} onClick={()=>void submit()} className="h-10 rounded-xl bg-[#3b646d] px-4 text-[8px] font-bold text-white disabled:opacity-50">{saving?"Completing…":"Complete receiving"}</button></footer></section></div>:null}
  </div>;
}
