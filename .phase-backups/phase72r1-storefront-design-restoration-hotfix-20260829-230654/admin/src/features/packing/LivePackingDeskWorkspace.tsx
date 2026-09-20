"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchLogisticsOrders,
  type LogisticsOrderItemRecord,
  type LogisticsOrderRecord,
  updateOrderStatus,
} from "@/features/logistics/logistics-client";

type LivePackingDeskWorkspaceProps = {
  initialOrderId?: string;
  onOpenCourier?: () => void;
};

type IconName = "alert" | "box" | "check" | "printer" | "refresh" | "search" | "truck";

const ACTIVE_STATUSES = new Set(["confirmed", "processing"]);
const PARCEL_CHECKS = ["Packing slip inserted", "Address label matched", "Parcel sealed securely"];

const iconPaths: Record<IconName, React.ReactNode> = {
  alert: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  box: <><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  printer: <><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  truck: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></>,
};

function Icon({ className = "", name, size = 16 }: { className?: string; name: IconName; size?: number }) {
  return <svg aria-hidden="true" className={className} fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{iconPaths[name]}</svg>;
}

function formatBdt(amount: number) {
  return `৳${amount.toLocaleString("en-BD")}`;
}

function formatAge(value: string | null) {
  if (!value) return "Recently";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Recently";
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr`;
  return `${Math.round(hours / 24)} day`;
}

function orderLabel(order: LogisticsOrderRecord) {
  return order.order_number ? `#${order.order_number}` : `#BNB-${order.id}`;
}

function itemSku(item: LogisticsOrderItemRecord) {
  return item.variant_sku || item.product_sku || "SKU unavailable";
}

function itemVariant(item: LogisticsOrderItemRecord) {
  return item.variant_name || item.product_size || "Standard variant";
}

function StatusBadge({ status }: { status: string }) {
  const isProcessing = status === "processing";
  return <span className={`rounded-full px-2.5 py-1 text-[8.5px] font-bold ${isProcessing ? "bg-violet-50 text-violet-700" : "bg-amber-50 text-amber-700"}`}>{isProcessing ? "In packing" : "Confirmed"}</span>;
}

function Kpi({ helper, label, tone = "brand", value }: { helper: string; label: string; tone?: "brand" | "rose" | "violet"; value: number }) {
  const colors = tone === "rose" ? "bg-rose-50 text-rose-700" : tone === "violet" ? "bg-violet-50 text-violet-700" : "bg-[#edf3f4] text-[#3b646d]";
  return <article className="rounded-2xl border border-[#e1e7e4] bg-white p-4 shadow-[0_1px_2px_rgba(25,50,45,.03)]"><div className="flex items-start justify-between"><div><p className="text-[9px] font-bold text-[#84908a]">{label}</p><b className="mt-3 block text-[24px] tracking-[-.04em] text-[#26352f]">{value}</b></div><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${colors}`}><Icon name={tone === "rose" ? "alert" : tone === "violet" ? "refresh" : "box"} size={15}/></span></div><p className="mt-3 border-t border-[#edf0ee] pt-3 text-[8.5px] text-[#8c9792]">{helper}</p></article>;
}

export function LivePackingDeskWorkspace({ initialOrderId, onOpenCourier }: LivePackingDeskWorkspaceProps) {
  const [orders, setOrders] = useState<LogisticsOrderRecord[]>([]);
  const [activeId, setActiveId] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("All queue");
  const [checkedItems, setCheckedItems] = useState<Record<string, string[]>>({});
  const [parcelChecks, setParcelChecks] = useState<Record<string, string[]>>({});
  const [printed, setPrinted] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);

  const requestedOrderId = (initialOrderId || "").replace(/\D+/g, "");

  const showNotice = useCallback((message: string, isError = false) => {
    setNotice(message);
    setNoticeError(isError);
    window.setTimeout(() => setNotice(""), 3200);
  }, []);

  const loadOrders = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError("");
    try {
      const nextOrders = await fetchLogisticsOrders(signal);
      const queue = nextOrders.filter((order) => ACTIVE_STATUSES.has(order.order_status));
      setOrders(nextOrders);
      setActiveId((current) => {
        if (current && queue.some((order) => order.id === current)) return current;
        if (requestedOrderId && queue.some((order) => order.id === requestedOrderId)) return requestedOrderId;
        return queue[0]?.id || "";
      });
      return nextOrders;
    } catch (error) {
      if (!signal?.aborted) {
        const message = error instanceof Error ? error.message : "Packing queue could not be loaded.";
        setLoadError(message);
      }
      return [];
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [requestedOrderId]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadOrders(controller.signal), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadOrders]);

  const queue = useMemo(() => orders.filter((order) => ACTIVE_STATUSES.has(order.order_status)), [orders]);
  const activeOrder = queue.find((order) => order.id === activeId) || queue[0];
  const packedRecently = orders.filter((order) => order.order_status === "packed").length;
  const missingItemDetails = queue.filter((order) => order.order_items.length === 0).length;
  const filteredQueue = queue.filter((order) => {
    const searchText = `${orderLabel(order)} ${order.customer_name} ${order.customer_phone} ${order.area || ""}`.toLowerCase();
    const matchesQuery = !query || searchText.includes(query.toLowerCase());
    const matchesView = view === "All queue" || (view === "Confirmed" && order.order_status === "confirmed") || (view === "In packing" && order.order_status === "processing");
    return matchesQuery && matchesView;
  });

  const activeItemKeys = activeOrder?.order_items.map((item, index) => `${item.id}:${index}`) || [];
  const itemDone = activeOrder ? checkedItems[activeOrder.id] || [] : [];
  const parcelDone = activeOrder ? parcelChecks[activeOrder.id] || [] : [];
  const totalChecks = activeItemKeys.length + PARCEL_CHECKS.length;
  const completedChecks = itemDone.length + parcelDone.length;
  const progress = totalChecks ? Math.round((completedChecks / totalChecks) * 100) : 0;
  const canPack = Boolean(activeOrder && activeOrder.order_status === "processing" && activeItemKeys.length && completedChecks === totalChecks && printed[activeOrder.id]);

  const toggleItem = (key: string) => {
    if (!activeOrder) return;
    setCheckedItems((current) => {
      const list = current[activeOrder.id] || [];
      return { ...current, [activeOrder.id]: list.includes(key) ? list.filter((item) => item !== key) : [...list, key] };
    });
  };

  const toggleParcel = (label: string) => {
    if (!activeOrder) return;
    setParcelChecks((current) => {
      const list = current[activeOrder.id] || [];
      return { ...current, [activeOrder.id]: list.includes(label) ? list.filter((item) => item !== label) : [...list, label] };
    });
  };

  const openSlip = (orderId: string) => {
    setPrinted((current) => ({ ...current, [orderId]: true }));
    window.open(`/orders/details/packing-slip?id=${encodeURIComponent(orderId)}`, "_blank", "noopener,noreferrer");
    showNotice("Packing slip opened and marked as printed.");
  };

  async function saveStatus(order: LogisticsOrderRecord, nextStatus: "processing" | "packed") {
    if (updatingId) return;
    const previousOrders = orders;
    setUpdatingId(order.id);
    setOrders((current) => current.map((item) => item.id === order.id ? { ...item, order_status: nextStatus, updated_at: new Date().toISOString() } : item));

    try {
      try {
        await updateOrderStatus(order.id, nextStatus);
      } catch {
        const verifiedOrders = await fetchLogisticsOrders();
        const verifiedOrder = verifiedOrders.find((item) => item.id === order.id);
        if (verifiedOrder?.order_status !== nextStatus) {
          await updateOrderStatus(order.id, nextStatus);
        }
      }

      const refreshedOrders = await fetchLogisticsOrders();
      setOrders(refreshedOrders);
      const nextQueue = refreshedOrders.filter((item) => ACTIVE_STATUSES.has(item.order_status));
      setActiveId((current) => nextQueue.some((item) => item.id === current) ? current : nextQueue[0]?.id || "");
      showNotice(nextStatus === "processing" ? `${orderLabel(order)} is now in packing.` : `${orderLabel(order)} packed and moved to Courier & Payments.`);
    } catch (error) {
      setOrders(previousOrders);
      showNotice(error instanceof Error ? error.message : "Order status could not be saved.", true);
    } finally {
      setUpdatingId("");
    }
  }

  return <div className="space-y-5">
    <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#71817a]"><span className={`h-1.5 w-1.5 rounded-full ${loadError ? "bg-rose-500" : "bg-emerald-500"}`}/>Live fulfilment operations</div><h1 className="mt-2 text-[28px] font-bold tracking-[-.04em] text-[#17231f] sm:text-[32px]">Packing desk</h1><p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-[#6e7b75]">Pick, verify and seal real confirmed orders from the MySQL order queue.</p></div><div className="flex flex-wrap items-center gap-2"><span className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-[10px] font-bold ${loadError ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}><span className={`h-1.5 w-1.5 rounded-full ${loadError ? "bg-rose-500" : "bg-emerald-500"}`}/>{isLoading ? "Syncing MySQL" : loadError ? "Connection issue" : "MySQL connected"}</span><button onClick={() => void loadOrders()} disabled={isLoading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dce4e0] bg-white px-3.5 text-[10.5px] font-bold text-[#53625c] disabled:opacity-50"><Icon className={isLoading ? "animate-spin" : ""} name="refresh" size={14}/>Refresh queue</button><button onClick={onOpenCourier} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#3b646d] px-3.5 text-[10.5px] font-bold text-white"><Icon name="truck" size={14}/>Courier &amp; Payments</button></div></section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi helper="Confirmed orders" label="Ready to pack" value={queue.filter((order) => order.order_status === "confirmed").length}/><Kpi helper="Active packing work" label="In packing" tone="violet" value={queue.filter((order) => order.order_status === "processing").length}/><Kpi helper="Visible from live data" label="Packed recently" value={packedRecently}/><Kpi helper="Missing product lines" label="Needs verification" tone="rose" value={missingItemDetails}/></section>

    {loadError && <section className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[10px] font-semibold text-rose-700"><span>{loadError}</span><button onClick={() => void loadOrders()} className="shrink-0 rounded-lg bg-rose-600 px-3 py-2 text-white">Try again</button></section>}

    <section className="grid min-h-[680px] overflow-hidden rounded-2xl border border-[#dfe6e2] bg-white shadow-[0_1px_2px_rgba(25,50,45,.03)] xl:grid-cols-[350px_minmax(0,1fr)]">
      <aside className="border-b border-[#e5eae7] bg-[#fafbfa] xl:border-b-0 xl:border-r"><div className="border-b border-[#e6ebe8] p-4"><div className="flex items-center justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#87928d]">Live packing queue</p><h2 className="mt-1 text-[15px] font-bold text-[#2b3a33]">Orders waiting</h2></div><span className="rounded-full bg-[#edf3f4] px-2.5 py-1 text-[9px] font-bold text-[#3b646d]">{queue.length}</span></div><label className="relative mt-3 block"><Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#89958f]" name="search" size={14}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search order or customer…" className="h-9 w-full rounded-xl border border-[#dce4e0] bg-white pl-9 pr-3 text-[10px] outline-none focus:border-[#a5bab6]"/></label><div className="mt-3 flex gap-1 overflow-x-auto">{["All queue", "Confirmed", "In packing"].map((option) => <button key={option} onClick={() => setView(option)} className={`shrink-0 rounded-lg px-2.5 py-2 text-[9px] font-bold ${view === option ? "bg-[#3b646d] text-white" : "text-[#74817b] hover:bg-white"}`}>{option}</button>)}</div></div><div className="max-h-[575px] space-y-2 overflow-y-auto p-3">{isLoading && !orders.length ? <div className="py-12 text-center text-[10px] font-semibold text-[#7f8b85]">Loading live orders…</div> : filteredQueue.map((order) => { const done = (checkedItems[order.id] || []).length; const total = order.order_items.length; const pct = total ? Math.round((done / total) * 100) : 0; return <button key={order.id} onClick={() => setActiveId(order.id)} className={`w-full rounded-xl border p-3.5 text-left transition ${activeOrder?.id === order.id ? "border-[#a9c0c0] bg-white shadow-[0_8px_22px_rgba(37,67,59,.06)]" : "border-[#e6ebe8] bg-[#f7f9f8] hover:bg-white"}`}><div className="flex items-start justify-between gap-3"><div><b className="block text-[11px] text-[#2f3e37]">{orderLabel(order)}</b><span className="mt-1 block text-[9px] text-[#8a9590]">Waiting {formatAge(order.updated_at || order.created_at)}</span></div><StatusBadge status={order.order_status}/></div><b className="mt-3 block truncate text-[10px] text-[#405048]">{order.customer_name}</b><span className="mt-1 block text-[9px] text-[#8b9691]">{order.order_items.length} item lines · {order.area || "Area unavailable"} · {formatBdt(order.due_amount || order.total)}</span><div className="mt-3 flex items-center gap-2"><div className="h-1 flex-1 overflow-hidden rounded-full bg-[#e2e7e4]"><div className="h-full rounded-full bg-[#3b646d]" style={{ width: `${pct}%` }}/></div><span className="text-[8.5px] font-bold text-[#7b8781]">{done}/{total}</span>{printed[order.id] && <Icon className="text-emerald-600" name="printer" size={11}/>}</div></button>; })}{!isLoading && !filteredQueue.length && <div className="py-12 text-center text-[10px] text-[#8b9691]">No orders in this view.</div>}</div></aside>

      <div className="flex min-w-0 flex-col bg-white">{activeOrder ? <><div className="border-b border-[#e8ecea] p-4 sm:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold tracking-tight text-[#1e2d27]">Pack {orderLabel(activeOrder)}</h2><StatusBadge status={activeOrder.order_status}/><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${printed[activeOrder.id] ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{printed[activeOrder.id] ? "Slip opened" : "Slip pending"}</span></div><p className="mt-1.5 text-[10px] text-[#87928d]">{activeOrder.customer_name} · {activeOrder.customer_phone} · {activeOrder.area || "Area unavailable"}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => openSlip(activeOrder.id)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#dce4e0] px-3 text-[9.5px] font-bold text-[#56665f]"><Icon name="printer" size={13}/>{printed[activeOrder.id] ? "Reopen slip" : "Open packing slip"}</button>{activeOrder.order_status === "confirmed" && <button disabled={updatingId === activeOrder.id} onClick={() => void saveStatus(activeOrder, "processing")} className="inline-flex h-9 items-center gap-2 rounded-xl bg-violet-600 px-3 text-[9.5px] font-bold text-white disabled:opacity-50"><Icon name="box" size={13}/>{updatingId === activeOrder.id ? "Starting…" : "Start packing"}</button>}</div></div><div className="mt-4 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e7ebe9]"><div className={`h-full rounded-full transition-all ${progress === 100 ? "bg-emerald-500" : "bg-[#3b646d]"}`} style={{ width: `${progress}%` }}/></div><b className="text-[10px] text-[#52625b]">{progress}% complete</b></div></div>

        <div className="flex-1 space-y-4 p-4 sm:p-5"><div className="grid gap-3 md:grid-cols-3"><div className="rounded-xl bg-[#f7f9f8] p-3.5"><span className="text-[8.5px] text-[#8b9691]">Customer</span><b className="mt-1 block truncate text-[10px] text-[#3b4a43]">{activeOrder.customer_name}</b><span className="mt-1 block text-[9px] text-[#84908a]">{activeOrder.customer_phone}</span></div><div className="rounded-xl bg-[#f7f9f8] p-3.5"><span className="text-[8.5px] text-[#8b9691]">Delivery address</span><b className="mt-1 block text-[10px] text-[#3b4a43]">{activeOrder.area || "Area unavailable"}</b><span className="mt-1 line-clamp-1 block text-[9px] text-[#84908a]">{activeOrder.shipping_address || "Address unavailable"}</span></div><div className="rounded-xl bg-[#edf3f4] p-3.5"><span className="text-[8.5px] text-[#688087]">Total COD</span><b className="mt-1 block text-[15px] text-[#31545c]">{formatBdt(activeOrder.due_amount || activeOrder.total)}</b><span className="mt-1 block text-[9px] text-[#688087]">Collect on delivery</span></div></div>

          <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_310px]"><div className="overflow-hidden rounded-xl border border-[#e2e7e4]"><div className="border-b border-[#e8ecea] bg-[#fafbfa] p-4"><p className="text-[8.5px] font-bold uppercase tracking-[.14em] text-[#87928d]">Step 1</p><h3 className="mt-1 text-[13px] font-bold text-[#2f3e37]">Pick &amp; verify real order items</h3></div><div className="divide-y divide-[#edf0ee]">{activeOrder.order_items.length ? activeOrder.order_items.map((item, index) => { const key = `${item.id}:${index}`; const checked = itemDone.includes(key); return <label key={key} className={`flex cursor-pointer items-center gap-3 p-4 transition ${checked ? "bg-emerald-50/35" : "hover:bg-[#fafbfa]"}`}><input type="checkbox" checked={checked} disabled={activeOrder.order_status !== "processing"} onChange={() => toggleItem(key)} className="h-4 w-4 accent-[#3b646d] disabled:opacity-40"/><span className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl ${checked ? "bg-emerald-100 text-emerald-700" : "bg-[#edf3f4] text-[#3b646d]"}`}>{item.product_image ? <span className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${item.product_image})` }}/> : <Icon name={checked ? "check" : "box"} size={16}/>}</span><span className="min-w-0 flex-1"><b className="block truncate text-[10.5px] text-[#34433d]">{item.product_name}</b><span className="mt-1 block truncate text-[9px] text-[#8b9691]">SKU {itemSku(item)} · {itemVariant(item)}</span></span><span className="rounded-lg bg-[#f1f4f2] px-2.5 py-1.5 text-[9px] font-bold text-[#586760]">Qty {item.quantity}</span></label>; }) : <div className="flex items-start gap-3 bg-amber-50 p-4 text-[9.5px] leading-5 text-amber-800"><Icon className="mt-0.5 shrink-0" name="alert" size={15}/><span>Order header loaded, but product lines were not returned by get_order_details.php. Open the order details page and verify this order before packing.</span></div>}</div></div><div className="rounded-xl border border-[#e2e7e4] bg-[#fafbfa] p-4"><p className="text-[8.5px] font-bold uppercase tracking-[.14em] text-[#87928d]">Step 2</p><h3 className="mt-1 text-[13px] font-bold text-[#2f3e37]">Parcel verification</h3><div className="mt-3 space-y-2">{PARCEL_CHECKS.map((label) => { const checked = parcelDone.includes(label); return <label key={label} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${checked ? "border-emerald-200 bg-emerald-50" : "border-[#e4e9e6] bg-white"}`}><input type="checkbox" checked={checked} disabled={activeOrder.order_status !== "processing"} onChange={() => toggleParcel(label)} className="h-3.5 w-3.5 accent-[#3b646d] disabled:opacity-40"/><span className="text-[9.5px] font-semibold text-[#53625c]">{label}</span></label>; })}</div><div className="mt-4 rounded-xl border border-[#dce5e2] bg-white p-3 text-[9px] font-semibold leading-4 text-[#68766f]">{activeOrder.order_status === "confirmed" ? "Start packing first. Item and parcel checks unlock after the order moves to Processing." : "All checks and the packing slip are required before the order can move to Packed."}</div></div></div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#e6ebe8] bg-[#fafbfa] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex items-center gap-2"><span className={`flex h-8 w-8 items-center justify-center rounded-xl ${canPack ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}><Icon name={canPack ? "check" : "alert"} size={14}/></span><div><b className="block text-[9.5px] text-[#43534b]">{canPack ? "Parcel ready for handoff" : activeOrder.order_status === "confirmed" ? "Start packing to unlock checks" : "Packing checks incomplete"}</b><span className="mt-0.5 block text-[8.5px] text-[#8a9590]">{canPack ? "One click moves it to the courier queue" : `${Math.max(0, totalChecks - completedChecks)} checks remaining${printed[activeOrder.id] ? "" : " · slip pending"}`}</span></div></div><button disabled={!canPack || updatingId === activeOrder.id} onClick={() => void saveStatus(activeOrder, "packed")} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#3b646d] px-4 text-[10px] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#9aadaa]"><Icon name="truck" size={13}/>{updatingId === activeOrder.id ? "Saving…" : "Mark Packed & Ready Courier"}</button></div></> : <div className="flex flex-1 items-center justify-center p-8 text-center"><div><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon name="check" size={20}/></span><h2 className="mt-4 text-[16px] font-bold text-[#2f3e37]">Packing queue is clear</h2><p className="mt-2 text-[10px] text-[#829089]">Confirmed or processing orders will appear here automatically.</p></div></div>}</div>
    </section>

    {notice && <div className={`fixed bottom-5 right-5 z-[70] flex max-w-sm items-start gap-3 rounded-xl px-4 py-3 text-[10.5px] font-semibold leading-5 text-white shadow-[0_20px_55px_rgba(24,45,39,.24)] ${noticeError ? "bg-rose-600" : "bg-[#223c3f]"}`}><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15"><Icon name={noticeError ? "alert" : "check"} size={11}/></span>{notice}</div>}
  </div>;
}
