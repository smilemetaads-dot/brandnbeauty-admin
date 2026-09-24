"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import {
  bookCourier,
  fetchLogisticsOrders,
  type LogisticsOrderRecord,
  syncCourierStatus,
} from "@/features/logistics/logistics-client";

type CourierTab = "Dispatch" | "Live tracking" | "COD overview";
type DeliveryResult = "delivered" | "returned";
type IconName = "alert" | "box" | "check" | "close" | "courier" | "download" | "eye" | "finance" | "refresh" | "search";

const RELEVANT_STATUSES = new Set(["packed", "shipped", "delivered", "returned"]);

const iconPaths: Record<IconName, React.ReactNode> = {
  alert: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  box: <><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  courier: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></>,
  download: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  finance: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
};

function Icon({ className = "", name, size = 16 }: { className?: string; name: IconName; size?: number }) {
  return <svg aria-hidden="true" className={className} fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{iconPaths[name]}</svg>;
}

function money(amount: number) {
  return `৳${Number(amount || 0).toLocaleString("en-BD")}`;
}

function orderLabel(order: LogisticsOrderRecord) {
  return order.order_number ? `#${order.order_number}` : `#BNB-${order.id}`;
}

function dateText(value: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function locationText(order: LogisticsOrderRecord) {
  return order.delivery_zone || order.area || order.district || "Area unavailable";
}

function shipmentLabel(order: LogisticsOrderRecord) {
  if (order.order_status === "packed") return order.courier_name ? "Booking saved" : "Ready to book";
  if (order.order_status === "shipped") return order.courier_status && order.courier_status !== "not_sent" ? order.courier_status.replaceAll("_", " ") : "In transit";
  if (order.order_status === "delivered") return "Delivered";
  if (order.order_status === "returned") return "Returned";
  return order.order_status.replaceAll("_", " ");
}

function StatusBadge({ order }: { order: LogisticsOrderRecord }) {
  const tone = order.order_status === "delivered" ? "bg-emerald-50 text-emerald-700" : order.order_status === "returned" ? "bg-rose-50 text-rose-700" : order.order_status === "shipped" ? "bg-violet-50 text-violet-700" : order.courier_name ? "bg-[#edf3f4] text-[#3b646d]" : "bg-amber-50 text-amber-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[8.5px] font-bold capitalize ${tone}`}>{shipmentLabel(order)}</span>;
}

function Kpi({ helper, icon, label, tone = "brand", value }: { helper: string; icon: IconName; label: string; tone?: "brand" | "good" | "warn"; value: string }) {
  const colors = tone === "good" ? "bg-emerald-50 text-emerald-700" : tone === "warn" ? "bg-amber-50 text-amber-700" : "bg-[#edf3f4] text-[#3b646d]";
  return <article className="rounded-2xl border border-[#e2e8e5] bg-white p-4 shadow-[0_1px_2px_rgba(25,50,45,.03)]"><div className="flex items-start justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[.08em] text-[#74817b]">{label}</p><p className="mt-2 text-[23px] font-bold tracking-[-.035em] text-[#17231f]">{value}</p></div><span className={`flex h-8 w-8 items-center justify-center rounded-xl ${colors}`}><Icon name={icon} size={15}/></span></div><p className="mt-3 border-t border-[#eff2f0] pt-2.5 text-[9px] font-semibold text-[#77847e]">{helper}</p></article>;
}

export function LiveCourierPaymentsWorkspace() {
  const [orders, setOrders] = useState<LogisticsOrderRecord[]>([]);
  const [tab, setTab] = useState<CourierTab>("Dispatch");
  const [query, setQuery] = useState("");
  const [partner, setPartner] = useState("All partners");
  const [focusedId, setFocusedId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [bookingOrder, setBookingOrder] = useState<LogisticsOrderRecord | null>(null);
  const [bookingPartner, setBookingPartner] = useState("Steadfast");
  const [trackingCode, setTrackingCode] = useState("");
  const [consignmentId, setConsignmentId] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [syncOrder, setSyncOrder] = useState<LogisticsOrderRecord | null>(null);
  const [deliveryResult, setDeliveryResult] = useState<DeliveryResult>("delivered");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);

  const showNotice = useCallback((message: string, isError = false) => {
    setNotice(message);
    setNoticeError(isError);
    window.setTimeout(() => setNotice(""), 3400);
  }, []);

  const loadOrders = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError("");
    try {
      const nextOrders = await fetchLogisticsOrders(signal);
      const relevant = nextOrders.filter((order) => RELEVANT_STATUSES.has(order.order_status));
      setOrders(nextOrders);
      setFocusedId((current) => relevant.some((order) => order.id === current) ? current : relevant[0]?.id || "");
      return nextOrders;
    } catch (error) {
      if (!signal?.aborted) setLoadError(error instanceof Error ? error.message : "Courier queue could not be loaded.");
      return [];
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadOrders(controller.signal), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadOrders]);

  const dispatchOrders = useMemo(() => orders.filter((order) => order.order_status === "packed"), [orders]);
  const shippedOrders = useMemo(() => orders.filter((order) => order.order_status === "shipped"), [orders]);
  const completedOrders = useMemo(() => orders.filter((order) => ["delivered", "returned"].includes(order.order_status)), [orders]);
  const relevantOrders = useMemo(() => orders.filter((order) => RELEVANT_STATUSES.has(order.order_status)), [orders]);

  const tabRows = tab === "Dispatch" ? dispatchOrders : tab === "Live tracking" ? shippedOrders : completedOrders;
  const filteredRows = tabRows.filter((order) => {
    const search = `${orderLabel(order)} ${order.customer_name} ${order.customer_phone} ${order.courier_tracking_id || ""}`.toLowerCase();
    const matchesQuery = !query || search.includes(query.toLowerCase());
    const matchesPartner = partner === "All partners" || order.courier_name === partner;
    return matchesQuery && matchesPartner;
  });
  const focusedOrder = relevantOrders.find((order) => order.id === focusedId) || filteredRows[0] || relevantOrders[0];
  const codReceivable = shippedOrders.reduce((sum, order) => sum + (order.due_amount || order.total), 0);
  const deliveredCod = completedOrders.filter((order) => order.order_status === "delivered").reduce((sum, order) => sum + (order.due_amount || order.total), 0);

  function openBooking(order: LogisticsOrderRecord) {
    setBookingOrder(order);
    setBookingPartner(order.courier_name || "Steadfast");
    setTrackingCode(order.courier_tracking_id || "");
    setConsignmentId("");
    setDeliveryFee("");
  }

  async function handleBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bookingOrder || !bookingPartner) return;
    setIsBooking(true);
    try {
      const result = await bookCourier({
        codAmount: bookingOrder.due_amount || bookingOrder.total,
        consignmentId,
        deliveryFee: Number(deliveryFee || 0),
        orderId: bookingOrder.id,
        provider: bookingPartner,
        trackingCode,
      });
      const optimisticOrders = orders.map((order) => order.id === bookingOrder.id ? { ...order, courier_name: bookingPartner, courier_tracking_id: trackingCode || order.courier_tracking_id, courier_status: "booked" } : order);
      setOrders(optimisticOrders);
      setBookingOrder(null);
      showNotice(result.message ?? `${orderLabel(bookingOrder)} courier booking saved.`);
      const refreshed = await fetchLogisticsOrders().catch(() => []);
      if (refreshed.length) {
        setOrders(refreshed.map((order) => order.id === bookingOrder.id && !order.courier_name ? optimisticOrders.find((item) => item.id === order.id) || order : order));
      }
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Courier booking could not be saved.", true);
    } finally {
      setIsBooking(false);
    }
  }

  async function runVerifiedTransition(order: LogisticsOrderRecord, nextStatus: "shipped" | DeliveryResult, operation: () => Promise<unknown>) {
    setUpdatingId(order.id);
    const previousOrders = orders;
    setOrders((current) => current.map((item) => item.id === order.id ? { ...item, order_status: nextStatus, updated_at: new Date().toISOString() } : item));
    try {
      try {
        await operation();
      } catch {
        const verified = await fetchLogisticsOrders();
        if (verified.find((item) => item.id === order.id)?.order_status !== nextStatus) await operation();
      }
      const refreshed = await fetchLogisticsOrders();
      setOrders(refreshed);
      const remaining = refreshed.filter((item) => RELEVANT_STATUSES.has(item.order_status));
      setFocusedId((current) => remaining.some((item) => item.id === current) ? current : remaining[0]?.id || "");
      return true;
    } catch (error) {
      setOrders(previousOrders);
      showNotice(error instanceof Error ? error.message : "Courier status could not be saved.", true);
      return false;
    } finally {
      setUpdatingId("");
    }
  }

  function markShipped(order: LogisticsOrderRecord) {
    if (!order.courier_name) {
      showNotice("Book a courier provider before dispatch handover.", true);
      openBooking(order);
      return;
    }

    window.location.href = "/dispatch-control";
  }

  function openDeliveryUpdate(order: LogisticsOrderRecord) {
    setSyncOrder(order);
    setDeliveryResult("delivered");
    setDeliveryNote("");
  }

  async function handleDeliveryUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!syncOrder) return;
    if (deliveryResult === "returned" && !deliveryNote.trim()) {
      showNotice("Return reason is required.", true);
      return;
    }
    setIsSyncing(true);
    const order = syncOrder;
    const saved = await runVerifiedTransition(order, deliveryResult, () => syncCourierStatus({ note: deliveryNote.trim(), orderId: order.id, status: deliveryResult }));
    if (saved) {
      setSyncOrder(null);
      showNotice(deliveryResult === "delivered" ? `${orderLabel(order)} delivered. COD is ready for Finance reconciliation.` : `${orderLabel(order)} returned. Sellable stock stays unchanged until Return Receiving inspection.`);
    }
    setIsSyncing(false);
  }

  function handleRowAction(order: LogisticsOrderRecord) {
    if (order.order_status === "packed") {
      openBooking(order);
      return;
    }
    if (order.order_status === "shipped") {
      openDeliveryUpdate(order);
      return;
    }
    window.open(`/orders/details?id=${encodeURIComponent(order.id)}`, "_blank", "noopener,noreferrer");
  }

  function exportRows() {
    const lines = [
      ["Order", "Customer", "Phone", "Area", "Status", "Courier", "Tracking", "COD"],
      ...filteredRows.map((order) => [orderLabel(order), order.customer_name, order.customer_phone, locationText(order), shipmentLabel(order), order.courier_name || "", order.courier_tracking_id || "", String(order.due_amount || order.total)]),
    ];
    const csv = lines.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `brandnbeauty-courier-${tab.toLowerCase().replaceAll(" ", "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice(`${filteredRows.length} live rows exported.`);
  }

  return <div className="space-y-5">
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[.16em] text-[#3b646d]"><span className={`h-1.5 w-1.5 rounded-full ${loadError ? "bg-rose-500" : "bg-emerald-500"}`}/>Live orders &amp; fulfilment</div><h1 className="mt-2 text-[28px] font-bold tracking-[-.035em] text-[#17231f] sm:text-[32px]">Courier &amp; COD control</h1><p className="mt-1.5 max-w-2xl text-[12.5px] leading-5 text-[#66736d]">Book real packed orders, track shipments and synchronize delivery results with Orders.</p></div><div className="flex flex-wrap gap-2"><span className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-[10px] font-bold ${loadError ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}><span className={`h-1.5 w-1.5 rounded-full ${loadError ? "bg-rose-500" : "bg-emerald-500"}`}/>{isLoading ? "Syncing" : loadError ? "Connection issue" : "MySQL connected"}</span><button onClick={() => void loadOrders()} disabled={isLoading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dce4e0] bg-white px-3.5 text-[10.5px] font-bold text-[#53645d] disabled:opacity-50"><Icon className={isLoading ? "animate-spin" : ""} name="refresh" size={14}/>Refresh</button><button onClick={() => focusedOrder && (focusedOrder.order_status === "packed" ? openBooking(focusedOrder) : openDeliveryUpdate(focusedOrder))} disabled={!focusedOrder || focusedOrder.order_status === "delivered" || focusedOrder.order_status === "returned"} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#3b646d] px-4 text-[10.5px] font-bold text-white disabled:opacity-40"><Icon name="courier" size={15}/>{focusedOrder?.order_status === "shipped" ? "Update delivery" : "Book courier"}</button></div></section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi helper={`${dispatchOrders.reduce((sum, order) => sum + (order.due_amount || order.total), 0).toLocaleString("en-BD")} BDT COD`} icon="box" label="Ready to dispatch" value={String(dispatchOrders.length)}/><Kpi helper="Active courier handoffs" icon="courier" label="In transit" value={String(shippedOrders.length)}/><Kpi helper={`${completedOrders.filter((order) => order.order_status === "returned").length} returned`} icon="check" label="Delivered" tone="good" value={String(completedOrders.filter((order) => order.order_status === "delivered").length)}/><Kpi helper={`${money(deliveredCod)} delivered`} icon="finance" label="COD receivable" tone="warn" value={money(codReceivable)}/></section>

    {loadError && <section className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[10px] font-semibold text-rose-700"><span>{loadError}</span><button onClick={() => void loadOrders()} className="shrink-0 rounded-lg bg-rose-600 px-3 py-2 text-white">Try again</button></section>}

    <section className="overflow-hidden rounded-2xl border border-[#e1e7e4] bg-white shadow-[0_1px_2px_rgba(25,50,45,.03)]">
      <div className="flex overflow-x-auto border-b border-[#e9edeb] bg-[#fafbfa] px-2 sm:px-4">{(["Dispatch", "Live tracking", "COD overview"] as CourierTab[]).map((name) => { const count = name === "Dispatch" ? dispatchOrders.length : name === "Live tracking" ? shippedOrders.length : completedOrders.length; return <button key={name} onClick={() => { setTab(name); setPartner("All partners"); }} className={`relative min-w-fit px-4 py-4 text-left transition ${tab === name ? "text-[#315a5f]" : "text-[#77837d] hover:text-[#45564f]"}`}><span className="flex items-center gap-2 text-[11px] font-bold">{name}<b className={`rounded-full px-2 py-0.5 text-[9px] ${tab === name ? "bg-[#dfeaec] text-[#315a5f]" : "bg-[#edf0ee] text-[#7b8781]"}`}>{count}</b></span><span className="mt-1 block text-[9px] font-medium text-[#98a19d]">{name === "Dispatch" ? "Packed orders" : name === "Live tracking" ? "Shipped orders" : "Delivered & returned"}</span>{tab === name && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#3b646d]"/>}</button>; })}</div>

      <div className="flex flex-col gap-3 border-b border-[#edf0ee] p-4 lg:flex-row lg:items-center"><label className="relative block min-w-0 flex-1 lg:max-w-[360px]"><Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9691]" name="search" size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 w-full rounded-xl border border-[#dce4e0] bg-white pl-9 pr-3 text-[10.5px] outline-none" placeholder="Order, customer, phone or tracking"/></label><div className="flex flex-wrap gap-2 lg:ml-auto"><select value={partner} onChange={(event) => setPartner(event.target.value)} className="h-10 rounded-xl border border-[#dce4e0] bg-white px-3 text-[10px] font-semibold text-[#5d6b65] outline-none"><option>All partners</option><option>Steadfast</option><option>Pathao</option><option>RedX</option><option>Paperfly</option><option>Other</option></select><button onClick={exportRows} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dce4e0] bg-white px-3 text-[10px] font-bold text-[#5d6b65]"><Icon name="download" size={13}/>Export CSV</button></div></div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_320px]"><div className="min-w-0 overflow-x-auto"><table className="w-full min-w-[940px] text-left"><thead className="bg-[#fafbfa] text-[8px] font-bold uppercase tracking-[.1em] text-[#8a9590]"><tr><th className="px-5 py-3.5">Order &amp; customer</th><th className="px-3 py-3.5">Destination</th><th className="px-3 py-3.5">COD</th><th className="px-3 py-3.5">Courier</th><th className="px-3 py-3.5">Tracking</th><th className="px-3 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Action</th></tr></thead><tbody className="divide-y divide-[#edf0ee]">{filteredRows.map((order) => <tr key={order.id} onClick={() => setFocusedId(order.id)} className={`cursor-pointer text-[10px] text-[#5a6861] hover:bg-[#f9fbfa] ${focusedOrder?.id === order.id ? "bg-[#f7faf9]" : ""}`}><td className="px-5 py-4"><b className="block text-[10.5px] text-[#26352f]">{orderLabel(order)}</b><span className="mt-1 block font-semibold text-[#68756f]">{order.customer_name}</span><span className="mt-0.5 block text-[8.5px] text-[#98a19d]">{order.customer_phone}</span></td><td className="px-3 py-4"><b className="block font-semibold text-[#44534c]">{locationText(order)}</b><span className="mt-1 block max-w-[170px] truncate text-[8.5px] text-[#949e99]">{order.shipping_address || "Address unavailable"}</span></td><td className="px-3 py-4"><b className="text-[11.5px] text-[#26352f]">{money(order.due_amount || order.total)}</b><span className="mt-1 block text-[8.5px] text-[#949e99]">Cash on delivery</span></td><td className="px-3 py-4 font-semibold text-[#40514a]">{order.courier_name || "Not booked"}</td><td className="px-3 py-4"><b className="text-[#40514a]">{order.courier_tracking_id || "Not assigned"}</b></td><td className="px-3 py-4"><StatusBadge order={order}/></td><td className="px-5 py-4 text-right"><button onClick={(event) => { event.stopPropagation(); handleRowAction(order); }} className="rounded-lg bg-[#edf3f4] px-3 py-2 text-[9px] font-bold text-[#3b646d]">{order.order_status === "packed" ? order.courier_name ? "Edit booking" : "Book now" : order.order_status === "shipped" ? "Update" : "View order"}</button></td></tr>)}</tbody></table>{isLoading && !orders.length && <div className="py-14 text-center text-[10px] font-semibold text-[#7f8b85]">Loading live courier orders…</div>}{!isLoading && !filteredRows.length && <div className="py-14 text-center text-[10px] text-[#8b9691]">No live orders match this view.</div>}</div>

        <aside className="border-t border-[#e8ecea] bg-[#fbfcfb] p-5 xl:border-l xl:border-t-0">{focusedOrder ? <><div className="flex items-start justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#84908a]">Focused shipment</p><h3 className="mt-1.5 text-[16px] font-bold text-[#26352f]">{orderLabel(focusedOrder)}</h3></div><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f0f1] text-[#3b646d]"><Icon name="courier" size={16}/></span></div><div className="mt-4 rounded-xl border border-[#e3e8e6] bg-white p-4"><b className="block text-[11px] text-[#314038]">{focusedOrder.customer_name}</b><span className="mt-1 block text-[9.5px] text-[#818c87]">{focusedOrder.customer_phone} · {locationText(focusedOrder)}</span><div className="mt-3 flex items-center justify-between border-t border-[#eef1ef] pt-3"><span className="text-[9px] font-semibold text-[#8c9691]">COD amount</span><b className="text-[14px] text-[#26352f]">{money(focusedOrder.due_amount || focusedOrder.total)}</b></div></div><dl className="mt-4 space-y-3 text-[9.5px]"><div className="flex items-center justify-between gap-3"><dt className="text-[#84908a]">Courier partner</dt><dd className="text-right font-bold text-[#44534c]">{focusedOrder.courier_name || "Not booked"}</dd></div><div className="flex items-center justify-between gap-3"><dt className="text-[#84908a]">Tracking ID</dt><dd className="max-w-[170px] truncate text-right font-bold text-[#44534c]">{focusedOrder.courier_tracking_id || "Not assigned"}</dd></div><div className="flex items-center justify-between"><dt className="text-[#84908a]">Shipment</dt><dd><StatusBadge order={focusedOrder}/></dd></div><div className="flex items-center justify-between"><dt className="text-[#84908a]">Last update</dt><dd className="text-right font-bold text-[#44534c]">{dateText(focusedOrder.updated_at)}</dd></div></dl><div className="mt-5 space-y-2">{focusedOrder.order_status === "packed" && <><button onClick={() => openBooking(focusedOrder)} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#cfdcd8] bg-white text-[10px] font-bold text-[#456965]"><Icon name="courier" size={13}/>{focusedOrder.courier_name ? "Edit courier booking" : "Book courier"}</button><button onClick={() => void markShipped(focusedOrder)} disabled={updatingId === focusedOrder.id} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#3b646d] text-[10px] font-bold text-white disabled:opacity-50"><Icon name="check" size={13}/>{updatingId === focusedOrder.id ? "Saving…" : "Open Dispatch Control"}</button></>}{focusedOrder.order_status === "shipped" && <button onClick={() => openDeliveryUpdate(focusedOrder)} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#3b646d] text-[10px] font-bold text-white"><Icon name="refresh" size={13}/>Update Delivery Result</button>}<button onClick={() => window.open(`/orders/details?id=${encodeURIComponent(focusedOrder.id)}`, "_blank", "noopener,noreferrer")} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#dce4e0] bg-white text-[10px] font-bold text-[#5e6d66]"><Icon name="eye" size={13}/>Open Order Details</button></div></> : <div className="py-16 text-center text-[10px] text-[#8b9691]">Select a live shipment.</div>}</aside></div>
    </section>

    {bookingOrder && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#17231f]/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setBookingOrder(null); }}><form onSubmit={handleBooking} className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-white/50 bg-white shadow-[0_30px_90px_rgba(17,35,30,.24)]"><div className="flex items-start justify-between border-b border-[#e8ecea] p-5"><div><p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#3b646d]">Live courier booking</p><h2 className="mt-1.5 text-[19px] font-bold text-[#23322b]">{orderLabel(bookingOrder)}</h2><p className="mt-1 text-[10px] text-[#84908a]">Save the provider, tracking reference and courier cost.</p></div><button type="button" onClick={() => setBookingOrder(null)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5f3] text-[#65736c]"><Icon name="close" size={15}/></button></div><div className="space-y-4 p-5"><div><label className="text-[9px] font-bold uppercase tracking-[.1em] text-[#707e77]">Courier provider</label><div className="mt-2 grid grid-cols-3 gap-2">{["Steadfast", "Pathao", "RedX"].map((name) => <button type="button" key={name} onClick={() => setBookingPartner(name)} className={`h-11 rounded-xl border text-[10px] font-bold ${bookingPartner === name ? "border-[#3b646d] bg-[#edf3f4] text-[#315a5f]" : "border-[#e0e6e3] text-[#68756f]"}`}>{name}</button>)}</div></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-[9px] font-bold uppercase tracking-[.1em] text-[#707e77]">Tracking code<input value={trackingCode} onChange={(event) => setTrackingCode(event.target.value)} placeholder="Optional at booking" className="mt-2 h-11 w-full rounded-xl border border-[#dce4e0] px-3 text-[10px] font-semibold normal-case tracking-normal outline-none"/></label><label className="text-[9px] font-bold uppercase tracking-[.1em] text-[#707e77]">Consignment ID<input value={consignmentId} onChange={(event) => setConsignmentId(event.target.value)} placeholder="Optional reference" className="mt-2 h-11 w-full rounded-xl border border-[#dce4e0] px-3 text-[10px] font-semibold normal-case tracking-normal outline-none"/></label></div><label className="block text-[9px] font-bold uppercase tracking-[.1em] text-[#707e77]">Courier cost (BDT)<input type="number" min="0" step="0.01" value={deliveryFee} onChange={(event) => setDeliveryFee(event.target.value)} placeholder="0" className="mt-2 h-11 w-full rounded-xl border border-[#dce4e0] px-3 text-[10px] font-semibold normal-case tracking-normal outline-none"/></label><div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-[9px] leading-4 text-amber-800">COD {money(bookingOrder.due_amount || bookingOrder.total)} and the saved customer address are linked to this courier booking.</div></div><div className="flex justify-end gap-2 border-t border-[#e8ecea] bg-[#fafbfa] p-5"><button type="button" onClick={() => setBookingOrder(null)} disabled={isBooking} className="h-10 rounded-xl border border-[#dce4e0] bg-white px-4 text-[10px] font-bold text-[#66756e]">Cancel</button><button type="submit" disabled={isBooking} className="h-10 rounded-xl bg-[#3b646d] px-4 text-[10px] font-bold text-white disabled:opacity-50">{isBooking ? "Saving…" : "Save Courier Booking"}</button></div></form></div>}

    {syncOrder && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#17231f]/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setSyncOrder(null); }}><form onSubmit={handleDeliveryUpdate} className="w-full max-w-[540px] overflow-hidden rounded-2xl border border-white/50 bg-white shadow-[0_30px_90px_rgba(17,35,30,.24)]"><div className="flex items-start justify-between border-b border-[#e8ecea] p-5"><div><p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#3b646d]">Courier delivery result</p><h2 className="mt-1.5 text-[19px] font-bold text-[#23322b]">{orderLabel(syncOrder)}</h2><p className="mt-1 text-[10px] text-[#84908a]">This updates Orders and the operational stock workflow.</p></div><button type="button" onClick={() => setSyncOrder(null)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5f3] text-[#65736c]"><Icon name="close" size={15}/></button></div><div className="space-y-4 p-5"><label className="block text-[9px] font-bold uppercase tracking-[.1em] text-[#707e77]">Courier result<select value={deliveryResult} onChange={(event) => setDeliveryResult(event.target.value as DeliveryResult)} className="mt-2 h-11 w-full rounded-xl border border-[#dce4e0] bg-white px-3 text-[10px] font-semibold normal-case tracking-normal outline-none"><option value="delivered">Delivered</option><option value="returned">Returned</option></select></label><label className="block text-[9px] font-bold uppercase tracking-[.1em] text-[#707e77]">Operational note<textarea value={deliveryNote} onChange={(event) => setDeliveryNote(event.target.value)} placeholder={deliveryResult === "returned" ? "Return reason is required" : "Optional delivery note"} className="mt-2 min-h-24 w-full resize-none rounded-xl border border-[#dce4e0] p-3 text-[10px] font-semibold normal-case tracking-normal outline-none"/></label><div className={`rounded-xl border p-4 text-[9px] leading-4 ${deliveryResult === "returned" ? "border-rose-100 bg-rose-50 text-rose-800" : "border-emerald-100 bg-emerald-50 text-emerald-800"}`}>{deliveryResult === "returned" ? "Returned records the courier outcome only. Sellable stock is restored only after Return Receiving inspection." : `Delivered records the order result and ${money(syncOrder.due_amount || syncOrder.total)} COD for Finance reconciliation.`}</div></div><div className="flex justify-end gap-2 border-t border-[#e8ecea] bg-[#fafbfa] p-5"><button type="button" onClick={() => setSyncOrder(null)} disabled={isSyncing} className="h-10 rounded-xl border border-[#dce4e0] bg-white px-4 text-[10px] font-bold text-[#66756e]">Cancel</button><button type="submit" disabled={isSyncing} className="h-10 rounded-xl bg-[#3b646d] px-4 text-[10px] font-bold text-white disabled:opacity-50">{isSyncing ? "Updating…" : "Confirm Result"}</button></div></form></div>}

    {notice && <div className={`fixed bottom-5 right-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl px-4 py-3 text-[10.5px] font-semibold leading-5 text-white shadow-[0_20px_55px_rgba(24,45,39,.24)] ${noticeError ? "bg-rose-600" : "bg-[#223c3f]"}`}><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15"><Icon name={noticeError ? "alert" : "check"} size={11}/></span>{notice}</div>}
  </div>;
}
