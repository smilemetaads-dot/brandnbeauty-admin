"use client";
import { useCallback, useEffect, useState } from "react";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type Product={id:number;product_name:string;price:number;stock_quantity:number;status:string};
type RecentOrder={id:number;order_number:string;customer:string;status:string;total:number;created_at:string};
export type LiveDashboardSummary={codDue:number;codSettled:number;codMismatchCount:number;courierQueue:number;deliveredOrders:number;lowStockProducts:number;newOrders:number;outOfStockProducts:number;packedOrders:number;packingQueue:number;recentProducts:Product[];returnedOrders:number;shippedOrders:number;totalOrders:number;totalProducts:number;totalRevenue:number};
export type LiveDashboardOwner={
 today:{orders:number;confirmed_sales:number;collected_revenue:number;recorded_direct_costs:number;ad_spend:number;contribution_profit:number;cost_coverage_orders:number};
 pipeline:{new:number;confirmed:number;packing:number;packed:number;courier_ready:number;shipped:number;delivered:number;return_cancel:number};
 trend:{date:string;label:string;sales:number;collected:number;orders:number}[];
 top_products:{id:number;name:string;quantity_sold:number;sales:number;average_price:number;stock_quantity:number}[];
 channels:{channel:string;orders:number;delivered:number;revenue:number}[];
 retention:{new_customers:number;repeat_customers:number;known_customers:number};
 priorities:{key:string;label:string;count:number;severity:"high"|"medium"|"low"}[];
 recent_orders:RecentOrder[];
};
const emptySummary:LiveDashboardSummary={codDue:0,codSettled:0,codMismatchCount:0,courierQueue:0,deliveredOrders:0,lowStockProducts:0,newOrders:0,outOfStockProducts:0,packedOrders:0,packingQueue:0,recentProducts:[],returnedOrders:0,shippedOrders:0,totalOrders:0,totalProducts:0,totalRevenue:0};
const emptyOwner:LiveDashboardOwner={today:{orders:0,confirmed_sales:0,collected_revenue:0,recorded_direct_costs:0,ad_spend:0,contribution_profit:0,cost_coverage_orders:0},pipeline:{new:0,confirmed:0,packing:0,packed:0,courier_ready:0,shipped:0,delivered:0,return_cancel:0},trend:[],top_products:[],channels:[],retention:{new_customers:0,repeat_customers:0,known_customers:0},priorities:[],recent_orders:[]};
const n=(v:unknown)=>{const x=Number(v);return Number.isFinite(x)?x:0};
const r=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"?v as Record<string,unknown>:{};

function summary(v:unknown):LiveDashboardSummary{
 const x=r(v); const products=Array.isArray(x.recentProducts)?x.recentProducts.map(v=>{const p=r(v);return{id:n(p.id),product_name:String(p.product_name??""),price:n(p.price),stock_quantity:n(p.stock_quantity),status:String(p.status??"draft")}}).filter(p=>p.product_name):[];
 return{codDue:n(x.codDue),codSettled:n(x.codSettled),codMismatchCount:n(x.codMismatchCount),courierQueue:n(x.courierQueue),deliveredOrders:n(x.deliveredOrders),lowStockProducts:n(x.lowStockProducts),newOrders:n(x.newOrders),outOfStockProducts:n(x.outOfStockProducts),packedOrders:n(x.packedOrders),packingQueue:n(x.packingQueue),recentProducts:products,returnedOrders:n(x.returnedOrders),shippedOrders:n(x.shippedOrders),totalOrders:n(x.totalOrders),totalProducts:n(x.totalProducts),totalRevenue:n(x.totalRevenue)};
}
function owner(v:unknown):LiveDashboardOwner{
 const x=r(v),t=r(x.today),p=r(x.pipeline),ret=r(x.retention);
 const trend=Array.isArray(x.trend)?x.trend.map(v=>{const q=r(v);return{date:String(q.date??""),label:String(q.label??""),sales:n(q.sales),collected:n(q.collected),orders:n(q.orders)}}):[];
 const top=Array.isArray(x.top_products)?x.top_products.map(v=>{const q=r(v);return{id:n(q.id),name:String(q.name??""),quantity_sold:n(q.quantity_sold),sales:n(q.sales),average_price:n(q.average_price),stock_quantity:n(q.stock_quantity)}}).filter(q=>q.name):[];
 const priorities=Array.isArray(x.priorities)?x.priorities.map(v=>{const q=r(v),s=String(q.severity);return{key:String(q.key??"alert"),label:String(q.label??"Needs review"),count:n(q.count),severity:(s==="high"||s==="low"?s:"medium") as "high"|"medium"|"low"}}):[];
 const recent=Array.isArray(x.recent_orders)?x.recent_orders.map(v=>{const q=r(v);return{id:n(q.id),order_number:String(q.order_number??""),customer:String(q.customer??"Guest Customer"),status:String(q.status??"pending"),total:n(q.total),created_at:String(q.created_at??"")}}):[];
 return{today:{orders:n(t.orders),confirmed_sales:n(t.confirmed_sales),collected_revenue:n(t.collected_revenue),recorded_direct_costs:n(t.recorded_direct_costs),ad_spend:n(t.ad_spend),contribution_profit:n(t.contribution_profit),cost_coverage_orders:n(t.cost_coverage_orders)},pipeline:{new:n(p.new),confirmed:n(p.confirmed),packing:n(p.packing),packed:n(p.packed),courier_ready:n(p.courier_ready),shipped:n(p.shipped),delivered:n(p.delivered),return_cancel:n(p.return_cancel)},trend,top_products:top,channels:[],retention:{new_customers:n(ret.new_customers),repeat_customers:n(ret.repeat_customers),known_customers:n(ret.known_customers)},priorities,recent_orders:recent};
}
export function formatBdt(value:number){return `৳${new Intl.NumberFormat("en-BD",{maximumFractionDigits:0}).format(value)}`}
export function useLiveDashboard(){
 const[data,setData]=useState(emptySummary),[ownerData,setOwner]=useState(emptyOwner),[status,setStatus]=useState<"loading"|"connected"|"error">("loading"),[error,setError]=useState(""),[updatedAt,setUpdatedAt]=useState<Date|null>(null);
 const refresh=useCallback(async(signal?:AbortSignal)=>{setStatus("loading");setError("");try{const res=await fetch(bnbApiUrl("get_dashboard_data.php"),{cache:"no-store",headers:adminAuthHeaders(),signal});const payload=await res.json() as{success?:boolean;summary?:unknown;owner_dashboard?:unknown;message?:string};if(!res.ok||!payload.success)throw new Error(payload.message||"Dashboard API unavailable.");setData(summary(payload.summary));setOwner(owner(payload.owner_dashboard));setUpdatedAt(new Date());setStatus("connected")}catch(e){if(signal?.aborted)return;setStatus("error");setError(e instanceof Error?e.message:"Dashboard API unavailable.")}},[]);
 useEffect(()=>{const c=new AbortController();void refresh(c.signal);return()=>c.abort()},[refresh]);
 return{data,owner:ownerData,error,status,updatedAt,refresh:()=>refresh()};
}
