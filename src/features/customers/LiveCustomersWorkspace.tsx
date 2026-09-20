"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  fetchLiveCustomers,
  type LiveCustomerOrder,
  type LiveCustomerRecord,
} from "@/features/customers/live-customers-client";

type CustomerFilter = "All" | "Has returns" | "New" | "Repeat";
type IconName = "alert" | "calendar" | "check" | "copy" | "download" | "eye" | "phone" | "refresh" | "search" | "user" | "users";

const iconPaths: Record<IconName, ReactNode> = {
  alert: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4"/></>,
  download: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3 5.2 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L9 10.9a16 16 0 0 0 4.1 4.1l1.2-1.2a2 2 0 0 1 2.1-.5 13 13 0 0 0 2.9.7A2 2 0 0 1 22 16.9Z"/>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
};

function Icon({ className = "", name, size = 16 }: { className?: string; name: IconName; size?: number }) {
  return <svg aria-hidden="true" className={className} fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{iconPaths[name]}</svg>;
}

function money(amount: number) {
  return `৳${Number(amount || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}

function dateText(value: string | null, withTime = false) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-BD", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
}

function statusText(value: string) {
  return value.replaceAll("_", " ").split(" ").filter(Boolean).map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`).join(" ");
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "BN";
}

function statusTone(status: string) {
  if (status === "delivered") return "bg-emerald-50 text-emerald-700";
  if (["cancelled", "returned"].includes(status)) return "bg-rose-50 text-rose-700";
  if (["packed", "shipped", "confirmed"].includes(status)) return "bg-violet-50 text-violet-700";
  return "bg-amber-50 text-amber-700";
}

function riskTone(risk: LiveCustomerRecord["riskLabel"]) {
  if (risk === "High Return Risk") return "bg-rose-50 text-rose-700";
  if (risk === "Has Returns") return "bg-amber-50 text-amber-700";
  if (risk === "Repeat Customer") return "bg-emerald-50 text-emerald-700";
  return "bg-[#edf3f4] text-[#426870]";
}

function Kpi({ helper, icon, label, tone = "brand", value }: { helper: string; icon: IconName; label: string; tone?: "brand" | "good" | "warn"; value: string }) {
  const colors = tone === "good" ? "bg-emerald-50 text-emerald-700" : tone === "warn" ? "bg-amber-50 text-amber-700" : "bg-[#edf3f4] text-[#3b646d]";
  return <article className="rounded-2xl border border-[#e2e8e5] bg-white p-4 shadow-[0_1px_2px_rgba(25,50,45,.03)]"><div className="flex items-start justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[.08em] text-[#74817b]">{label}</p><p className="mt-2 text-[23px] font-bold tracking-[-.035em] text-[#17231f]">{value}</p></div><span className={`flex h-8 w-8 items-center justify-center rounded-xl ${colors}`}><Icon name={icon} size={15}/></span></div><p className="mt-3 border-t border-[#eff2f0] pt-2.5 text-[9px] font-semibold text-[#77847e]">{helper}</p></article>;
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return <div className="flex items-start justify-between gap-4 border-b border-[#eef2f0] py-2.5 last:border-0"><dt className="text-[9.5px] font-semibold text-[#7b8882]">{label}</dt><dd className="max-w-[65%] text-right text-[9.5px] font-bold text-[#26352f]">{value}</dd></div>;
}

function escapeCsv(value: string | number) {
  const text = String(value).replaceAll('"', '""');
  return `"${text}"`;
}

function customerMatchesFilter(customer: LiveCustomerRecord, filter: CustomerFilter) {
  if (filter === "Repeat") return customer.orderCount >= 2;
  if (filter === "New") return customer.orderCount === 1;
  if (filter === "Has returns") return customer.returnedCount > 0;
  return true;
}

function OrderHistoryRow({ order }: { order: LiveCustomerOrder }) {
  return <div className="rounded-xl border border-[#e5ebe8] bg-[#fbfcfb] p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold text-[#26352f]">#{order.orderNumber}</p><p className="mt-1 text-[8.5px] font-semibold text-[#86918c]">{dateText(order.createdAt, true)}</p></div><span className={`rounded-full px-2 py-1 text-[8px] font-bold ${statusTone(order.status)}`}>{statusText(order.status)}</span></div><div className="mt-3 flex items-center justify-between border-t border-[#e8edeb] pt-2.5"><span className="text-[10px] font-bold text-[#26352f]">{money(order.total)}</span><a className="inline-flex items-center gap-1 text-[8.5px] font-bold text-[#496f75] hover:text-[#284f57]" href={`/orders/details?id=${encodeURIComponent(order.id)}`}><Icon name="eye" size={12}/> View order</a></div></div>;
}

function CustomerProfile({ customer, onCopied }: { customer: LiveCustomerRecord | undefined; onCopied: (message: string, error?: boolean) => void }) {
  if (!customer) {
    return <aside className="rounded-2xl border border-[#e2e8e5] bg-white p-6"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3f4] text-[#426870]"><Icon name="user" size={18}/></span><h3 className="mt-4 text-[15px] font-bold text-[#1c2b26]">Select a customer</h3><p className="mt-2 text-[10px] leading-5 text-[#7a8781]">Choose a customer from the live directory to see contact details and complete order history.</p></aside>;
  }

  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(customer?.phone ?? "");
      onCopied("Phone number copied.");
    } catch {
      onCopied("Phone number could not be copied.", true);
    }
  }

  return <aside className="overflow-hidden rounded-2xl border border-[#dfe7e3] bg-white shadow-[0_1px_2px_rgba(25,50,45,.03)]"><div className="bg-[linear-gradient(135deg,#edf4f2,#f8faf9)] p-5"><div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#426d72] text-[12px] font-extrabold text-white">{initials(customer.name)}</span><span className={`rounded-full px-2.5 py-1 text-[8px] font-bold ${riskTone(customer.riskLabel)}`}>{customer.riskLabel}</span></div><h3 className="mt-4 text-[17px] font-bold tracking-[-.02em] text-[#1d2c27]">{customer.name}</h3><p className="mt-1 text-[9.5px] font-semibold text-[#75837d]">Customer profile from live orders</p><div className="mt-4 flex gap-2"><a className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#426d72] px-3 py-2.5 text-[9px] font-bold text-white hover:bg-[#315b61]" href={customer.phone === "Not available" ? undefined : `tel:${customer.phone}`}><Icon name="phone" size={13}/> Call</a><button className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#d7e1dd] bg-white px-3 py-2.5 text-[9px] font-bold text-[#49676a] hover:border-[#9fb5b1]" onClick={() => void copyPhone()} type="button"><Icon name="copy" size={13}/> Copy phone</button></div></div><div className="p-5"><p className="text-[8.5px] font-extrabold uppercase tracking-[.14em] text-[#8a9690]">Contact & location</p><dl className="mt-2"><Detail label="Phone" value={customer.phone}/><Detail label="Email" value={customer.email || "Not provided"}/><Detail label="Address" value={customer.address || "Not provided"}/><Detail label="City" value={customer.city || "Not provided"}/></dl><p className="mt-5 text-[8.5px] font-extrabold uppercase tracking-[.14em] text-[#8a9690]">Customer value</p><div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-xl bg-[#f5f8f6] p-3"><p className="text-[8px] font-bold text-[#7f8b85]">Net order value</p><p className="mt-1 text-[13px] font-extrabold text-[#26352f]">{money(customer.netOrderValue)}</p></div><div className="rounded-xl bg-[#f5f8f6] p-3"><p className="text-[8px] font-bold text-[#7f8b85]">Average order</p><p className="mt-1 text-[13px] font-extrabold text-[#26352f]">{money(customer.averageOrderValue)}</p></div><div className="rounded-xl bg-[#f5f8f6] p-3"><p className="text-[8px] font-bold text-[#7f8b85]">First order</p><p className="mt-1 text-[9px] font-extrabold text-[#26352f]">{dateText(customer.firstOrderAt)}</p></div><div className="rounded-xl bg-[#f5f8f6] p-3"><p className="text-[8px] font-bold text-[#7f8b85]">Last order</p><p className="mt-1 text-[9px] font-extrabold text-[#26352f]">{dateText(customer.lastOrderAt)}</p></div></div><div className="mt-5 flex items-center justify-between"><p className="text-[8.5px] font-extrabold uppercase tracking-[.14em] text-[#8a9690]">Order history</p><span className="text-[8.5px] font-bold text-[#536f6b]">{customer.orderCount} total</span></div><div className="mt-3 max-h-[370px] space-y-2 overflow-y-auto pr-1">{customer.orders.map((order) => <OrderHistoryRow key={order.id} order={order}/>)}</div></div></aside>;
}

export function LiveCustomersWorkspace({ initialProfileOpen = false }: { initialProfileOpen?: boolean }) {
  const [customers, setCustomers] = useState<LiveCustomerRecord[]>([]);
  const [filter, setFilter] = useState<CustomerFilter>("All");
  const [query, setQuery] = useState("");
  const [focusedId, setFocusedId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);

  const showNotice = useCallback((message: string, isError = false) => {
    setNotice(message);
    setNoticeError(isError);
    window.setTimeout(() => setNotice(""), 3000);
  }, []);

  const loadCustomers = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError("");
    try {
      const records = await fetchLiveCustomers(signal);
      setCustomers(records);
      setFocusedId((current) => records.some((customer) => customer.id === current) ? current : records[0]?.id || "");
    } catch (error) {
      if (!signal?.aborted) setLoadError(error instanceof Error ? error.message : "Live customers could not be loaded.");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadCustomers(controller.signal), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => customers.filter((customer) => {
    const search = `${customer.name} ${customer.phone} ${customer.email || ""} ${customer.city || ""} ${customer.address || ""}`.toLowerCase();
    return customerMatchesFilter(customer, filter) && (!query || search.includes(query.trim().toLowerCase()));
  }), [customers, filter, query]);

  const focusedCustomer = filteredCustomers.find((customer) => customer.id === focusedId) || filteredCustomers[0];
  const repeatCustomers = customers.filter((customer) => customer.orderCount >= 2).length;
  const activeCustomers = customers.filter((customer) => customer.activeCount > 0).length;
  const totalValue = customers.reduce((sum, customer) => sum + customer.netOrderValue, 0);

  function exportCustomers() {
    const rows = [
      ["Customer", "Phone", "Email", "City", "Orders", "Net Order Value", "Delivered", "Returned", "Last Order"],
      ...filteredCustomers.map((customer) => [customer.name, customer.phone, customer.email || "", customer.city || "", customer.orderCount, customer.netOrderValue, customer.deliveredCount, customer.returnedCount, customer.lastOrderAt || ""]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `brandnbeauty-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice(`${filteredCustomers.length} customers exported.`);
  }

  const filterCounts: Record<CustomerFilter, number> = {
    All: customers.length,
    "Has returns": customers.filter((customer) => customer.returnedCount > 0).length,
    New: customers.filter((customer) => customer.orderCount === 1).length,
    Repeat: repeatCustomers,
  };

  return <div className="space-y-4"><header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="flex items-center gap-2 text-[8.5px] font-extrabold uppercase tracking-[.18em] text-[#547874]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Customer operations</p><h1 className="mt-2 text-[26px] font-bold tracking-[-.045em] text-[#17231f]">{initialProfileOpen ? "Customer profiles" : "Customers command center"}</h1><p className="mt-1.5 text-[10px] font-medium text-[#74817b]">Live customer value, contact details and complete order history from MySQL Orders.</p></div><div className="flex flex-wrap gap-2"><button className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[9.5px] font-bold text-[#62706a] hover:border-[#aebeba] disabled:opacity-50" disabled={isLoading} onClick={() => void loadCustomers()} type="button"><Icon className={isLoading ? "animate-spin" : ""} name="refresh" size={14}/> Refresh</button><button className="inline-flex items-center gap-1.5 rounded-xl bg-[#426d72] px-3.5 py-2.5 text-[9.5px] font-bold text-white hover:bg-[#315b61] disabled:opacity-50" disabled={!filteredCustomers.length} onClick={exportCustomers} type="button"><Icon name="download" size={14}/> Export CSV</button></div></header><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi helper="Unique buyers found in Orders" icon="users" label="Total customers" value={String(customers.length)}/><Kpi helper="Customers with two or more orders" icon="check" label="Repeat customers" tone="good" value={String(repeatCustomers)}/><Kpi helper="Customers with an active order" icon="calendar" label="Active customers" value={String(activeCustomers)}/><Kpi helper="Excludes cancelled and returned" icon="user" label="Net order value" tone="warn" value={money(totalValue)}/></section>{loadError ? <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[9.5px] font-bold text-rose-700"><span className="flex items-center gap-2"><Icon name="alert" size={14}/>{loadError}</span><button className="underline" onClick={() => void loadCustomers()} type="button">Try again</button></div> : null}<section className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white shadow-[0_1px_2px_rgba(25,50,45,.03)]"><div className="flex flex-col gap-3 border-b border-[#e7ece9] p-4 xl:flex-row xl:items-center xl:justify-between"><div className="flex flex-wrap gap-1.5">{(["All", "Repeat", "New", "Has returns"] as CustomerFilter[]).map((item) => <button className={`rounded-lg px-3 py-2 text-[9px] font-bold ${filter === item ? "bg-[#426d72] text-white" : "bg-[#f4f7f5] text-[#6f7c76] hover:bg-[#eaf0ed]"}`} key={item} onClick={() => setFilter(item)} type="button">{item} <span className={filter === item ? "text-white/70" : "text-[#9aa49f]"}>{filterCounts[item]}</span></button>)}</div><label className="relative block w-full xl:w-[310px]"><Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#93a09a]" name="search" size={14}/><input className="w-full rounded-xl border border-[#dfe6e3] bg-[#fbfcfb] py-2.5 pl-9 pr-3 text-[9.5px] font-semibold text-[#26352f] outline-none placeholder:text-[#9ba59f] focus:border-[#759493]" onChange={(event) => setQuery(event.target.value)} placeholder="Search name, phone, email or city..." value={query}/></label></div><div className="grid xl:grid-cols-[minmax(0,1fr)_340px]"><div className="min-w-0 overflow-x-auto"><table className="w-full min-w-[760px] border-collapse"><thead><tr className="border-b border-[#e8edeb] bg-[#fbfcfb] text-left text-[8px] font-extrabold uppercase tracking-[.12em] text-[#89958f]"><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Net value</th><th className="px-4 py-3">Last order</th><th className="px-4 py-3">Segment</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody>{isLoading && !customers.length ? Array.from({ length: 6 }).map((_, index) => <tr className="border-b border-[#edf1ef]" key={index}><td className="px-4 py-4" colSpan={7}><div className="h-8 animate-pulse rounded-lg bg-[#f0f3f1]"/></td></tr>) : filteredCustomers.map((customer) => <tr className={`cursor-pointer border-b border-[#edf1ef] transition hover:bg-[#f8faf9] ${focusedCustomer?.id === customer.id ? "bg-[#f3f7f5]" : ""}`} key={customer.id} onClick={() => setFocusedId(customer.id)}><td className="px-4 py-3.5"><div className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e7efed] text-[9px] font-extrabold text-[#426d72]">{initials(customer.name)}</span><div><p className="text-[9.5px] font-extrabold text-[#25342f]">{customer.name}</p><p className="mt-1 text-[8px] font-semibold text-[#8a9690]">{customer.phone}</p></div></div></td><td className="px-4 py-3.5"><p className="text-[9px] font-bold text-[#50605a]">{customer.city || "Not provided"}</p><p className="mt-1 max-w-[150px] truncate text-[8px] text-[#96a09b]">{customer.address || "No address"}</p></td><td className="px-4 py-3.5"><p className="text-[10px] font-extrabold text-[#26352f]">{customer.orderCount}</p><p className="mt-1 text-[8px] font-semibold text-[#89958f]">{customer.activeCount} active</p></td><td className="px-4 py-3.5"><p className="text-[10px] font-extrabold text-[#26352f]">{money(customer.netOrderValue)}</p><p className="mt-1 text-[8px] font-semibold text-[#89958f]">Avg {money(customer.averageOrderValue)}</p></td><td className="px-4 py-3.5"><p className="text-[9px] font-bold text-[#50605a]">{dateText(customer.lastOrderAt)}</p><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[7.5px] font-bold ${statusTone(customer.orders[0]?.status ?? "pending")}`}>{statusText(customer.orders[0]?.status ?? "pending")}</span></td><td className="px-4 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-1 text-[8px] font-bold ${riskTone(customer.riskLabel)}`}>{customer.riskLabel}</span></td><td className="px-4 py-3.5 text-right"><button className="inline-flex items-center gap-1 rounded-lg border border-[#dce5e1] bg-white px-2.5 py-2 text-[8px] font-bold text-[#536f6b] hover:border-[#9bb1ac]" onClick={(event) => { event.stopPropagation(); setFocusedId(customer.id); }} type="button"><Icon name="eye" size={12}/> Profile</button></td></tr>)}</tbody></table>{!isLoading && !filteredCustomers.length ? <div className="px-6 py-14 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0f4f2] text-[#69847f]"><Icon name="search" size={18}/></span><h3 className="mt-3 text-[12px] font-bold text-[#283731]">No customers found</h3><p className="mt-1 text-[9px] text-[#89958f]">Try a different search or customer filter.</p></div> : null}<div className="flex items-center justify-between border-t border-[#e8edeb] px-4 py-3 text-[8.5px] font-semibold text-[#89958f]"><span>Showing {filteredCustomers.length} of {customers.length} live customers</span><span className="font-bold text-emerald-700">MySQL Orders connected</span></div></div><div className="border-t border-[#e2e8e5] bg-[#fbfcfb] p-3 xl:border-l xl:border-t-0"><CustomerProfile customer={focusedCustomer} onCopied={showNotice}/></div></div></section>{notice ? <div className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-[10px] font-bold text-white shadow-xl ${noticeError ? "bg-rose-600" : "bg-[#335e63]"}`}>{notice}</div> : null}</div>;
}
