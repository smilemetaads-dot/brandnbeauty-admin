"use client";
import { useCallback, useEffect, useState } from "react";
import { bnbApiUrl } from "@/lib/bnb-api";

export type LiveDashboardProduct={id:number;product_name:string;price:number;stock_quantity:number;status:string};
export type LiveDashboardOwner={
 today:{orders:number;confirmed_sales:number;collected_revenue:number;recorded_direct_costs:number;ad_spend:number;contribution_profit:number;cost_coverage_orders:number};
 pipeline:{new:number;confirmed:number;packing:number;packed:number;courier_ready:number;shipped:number;delivered:number;return_cancel:number};
 trend:{date:string;label:string;sales:number;collected:number;orders:number}[];
 top_products:{id:number;name:string;quantity_sold:number;sales:number;average_price:number;stock_quantity:number}[];
 channels:{channel:string;orders:number;delivered:number;revenue:number}[];
 retention:{new_customers:number;repeat_customers:number;known_customers:number};
 priorities:{key:string;label:string;count:number;severity:"high"|"medium"|"low"}[];
};
export type LiveDashboardSummary={codDue:number;codSettled:number;codMismatchCount:number;courierQueue:number;deliveredOrders:number;lowStockProducts:number;newOrders:number;outOfStockProducts:number;packedOrders:number;packingQueue:number;recentProducts:LiveDashboardProduct[];returnedOrders:number;shippedOrders:number;totalOrders:number;totalProducts:number;totalRevenue:number};

const emptySummary:LiveDashboardSummary={codDue:0,codSettled:0,codMismatchCount:0,courierQueue:0,deliveredOrders:0,lowStockProducts:0,newOrders:0,outOfStockProducts:0,packedOrders:0,packingQueue:0,recentProducts:[],returnedOrders:0,shippedOrders:0,totalOrders:0,totalProducts:0,totalRevenue:0};
const emptyOwner:LiveDashboardOwner={today:{orders:0,confirmed_sales:0,collected_revenue:0,recorded_direct_costs:0,ad_spend:0,contribution_profit:0,cost_coverage_orders:0},pipeline:{new:0,confirmed:0,packing:0,packed:0,courier_ready:0,shipped:0,delivered:0,return_cancel:0},trend:[],top_products:[],channels:[],retention:{new_customers:0,repeat_customers:0,known_customers:0},priorities:[]};
const num=(value:unknown)=>{const parsed=Number(value);return Number.isFinite(parsed)?parsed:0};
const rec=(value:unknown):Record<string,unknown>=>value&&typeof value==="object"?value as Record<string,unknown>:{};

function normalizeSummary(value:unknown):LiveDashboardSummary{
 const s=rec(value);const recentProducts=Array.isArray(s.recentProducts)?s.recentProducts.flatMap(entry=>{const p=rec(entry),name=String(p.product_name??"").trim();return name?[{id:num(p.id),product_name:name,price:num(p.price),stock_quantity:num(p.stock_quantity),status:String(p.status??"draft")}]:[]}):[];
 return {codDue:num(s.codDue),codSettled:num(s.codSettled),codMismatchCount:num(s.codMismatchCount),courierQueue:num(s.courierQueue),deliveredOrders:num(s.deliveredOrders),lowStockProducts:num(s.lowStockProducts),newOrders:num(s.newOrders),outOfStockProducts:num(s.outOfStockProducts),packedOrders:num(s.packedOrders),packingQueue:num(s.packingQueue),recentProducts,returnedOrders:num(s.returnedOrders),shippedOrders:num(s.shippedOrders),totalOrders:num(s.totalOrders),totalProducts:num(s.totalProducts),totalRevenue:num(s.totalRevenue)};
}
function normalizeOwner(value:unknown):LiveDashboardOwner{
 const s=rec(value),t=rec(s.today),p=rec(s.pipeline),r=rec(s.retention);
 const trend=Array.isArray(s.trend)?s.trend.map(v=>{const x=rec(v);return{date:String(x.date??""),label:String(x.label??""),sales:num(x.sales),collected:num(x.collected),orders:num(x.orders)}}):[];
 const top_products=Array.isArray(s.top_products)?s.top_products.map(v=>{const x=rec(v);return{id:num(x.id),name:String(x.name??""),quantity_sold:num(x.quantity_sold),sales:num(x.sales),average_price:num(x.average_price),stock_quantity:num(x.stock_quantity)}}).filter(x=>x.name):[];
 const channels=Array.isArray(s.channels)?s.channels.map(v=>{const x=rec(v);return{channel:String(x.channel??"Unknown"),orders:num(x.orders),delivered:num(x.delivered),revenue:num(x.revenue)}}):[];
 const priorities=Array.isArray(s.priorities)?s.priorities.map(v=>{const x=rec(v),level=String(x.severity);return{key:String(x.key??"alert"),label:String(x.label??"Needs review"),count:num(x.count),severity:(level==="high"||level==="low"?level:"medium") as "high"|"medium"|"low"}}):[];
 return{today:{orders:num(t.orders),confirmed_sales:num(t.confirmed_sales),collected_revenue:num(t.collected_revenue),recorded_direct_costs:num(t.recorded_direct_costs),ad_spend:num(t.ad_spend),contribution_profit:num(t.contribution_profit),cost_coverage_orders:num(t.cost_coverage_orders)},pipeline:{new:num(p.new),confirmed:num(p.confirmed),packing:num(p.packing),packed:num(p.packed),courier_ready:num(p.courier_ready),shipped:num(p.shipped),delivered:num(p.delivered),return_cancel:num(p.return_cancel)},trend,top_products,channels,retention:{new_customers:num(r.new_customers),repeat_customers:num(r.repeat_customers),known_customers:num(r.known_customers)},priorities};
}
export function formatBdt(value:number){return `৳${new Intl.NumberFormat("en-BD",{maximumFractionDigits:0}).format(value)}`}
export function useLiveDashboard(){
 const[data,setData]=useState(emptySummary);const[owner,setOwner]=useState(emptyOwner);const[status,setStatus]=useState<"loading"|"connected"|"error">("loading");const[error,setError]=useState("");const[updatedAt,setUpdatedAt]=useState<Date|null>(null);
 const refresh=useCallback(async(signal?:AbortSignal)=>{setStatus("loading");setError("");try{const response=await fetch(bnbApiUrl("get_dashboard_data.php"),{cache:"no-store",signal});const payload=await response.json() as{success?:boolean;summary?:unknown;owner_dashboard?:unknown;message?:string};if(!response.ok||!payload.success)throw new Error(payload.message||"Dashboard API unavailable.");setData(normalizeSummary(payload.summary));setOwner(normalizeOwner(payload.owner_dashboard));setUpdatedAt(new Date());setStatus("connected")}catch(reason){if(signal?.aborted)return;setStatus("error");setError(reason instanceof Error?reason.message:"Dashboard API unavailable.")}},[]);
 useEffect(()=>{const controller=new AbortController();void refresh(controller.signal);return()=>controller.abort()},[refresh]);
 return{data,owner,error,refresh:()=>refresh(),status,updatedAt};
}
