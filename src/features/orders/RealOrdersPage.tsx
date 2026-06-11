"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import type { OrderRecord } from "./orders-data";

type RealOrdersPageProps = {
  orders: OrderRecord[];
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const className = {
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    default: "bg-slate-100 text-slate-600",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize ${className}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  active = false,
  helper,
  icon,
  label,
  onClick,
  value,
}: {
  active?: boolean;
  helper: string;
  icon: string;
  label: string;
  onClick?: () => void;
  value: string;
}) {
  const trendTone =
    helper.toLowerCase().includes("need") ||
    helper.toLowerCase().includes("watch")
      ? "bg-amber-50 text-amber-600"
      : "bg-emerald-50 text-emerald-700";

  return (
    <button
      className={`group relative w-full overflow-hidden rounded-[1.7rem] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? "border-[#5E7F85] ring-2 ring-[#5E7F85]/15" : "border-slate-200"
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5E7F85]/5 transition group-hover:bg-[#5E7F85]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xs font-black text-[#5E7F85] transition group-hover:bg-[#5E7F85] group-hover:text-white">
          {icon}
        </div>
      </div>
      <div
        className={`relative mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${trendTone}`}
      >
        {helper}
      </div>
    </button>
  );
}

function DisabledButton({
  children,
  primary = false,
}: {
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      className={
        primary
          ? "rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white opacity-60"
          : "rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-400"
      }
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function SelectPill({
  compact = false,
  label,
  onChange,
  options,
  value,
}: {
  compact?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label
      className={`flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 shadow-sm ${
        compact ? "min-w-[118px]" : "min-w-[142px]"
      }`}
    >
      <span className="sr-only">{label}</span>
      <select
        className="w-full bg-transparent text-xs font-bold text-slate-600 outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function QuickActionButton({ children }: { children: ReactNode }) {
  return (
    <button
      className="group flex w-full items-center justify-between rounded-2xl bg-stone-50 p-4 text-left text-sm font-semibold text-slate-400"
      disabled
      type="button"
    >
      <span>{children}</span>
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-400">
        N/C
      </span>
    </button>
  );
}

function getOrderStatusTone(status: string): BadgeTone {
  if (status === "delivered" || status === "packed") return "good";
  if (status === "cancelled" || status === "returned") return "bad";
  if (status === "new" || status === "processing") return "warn";
  return "brand";
}

function getRiskLabel(order: OrderRecord) {
  if (order.order_status === "cancelled" || order.order_status === "returned") {
    return "High";
  }

  if (order.due_amount > 0 || order.order_status === "new") {
    return "Medium";
  }

  return "Low";
}

function getRiskTone(order: OrderRecord): BadgeTone {
  const risk = getRiskLabel(order);
  if (risk === "High") return "bad";
  if (risk === "Medium") return "warn";
  return "good";
}

function getRiskReasons(order: OrderRecord) {
  const reasons = [];

  if (order.order_status === "cancelled" || order.order_status === "returned") {
    reasons.push("Return or cancellation state");
  }

  if (order.due_amount > 0) {
    reasons.push(`Due ${formatMoney(order.due_amount)}`);
  }

  if (order.order_status === "new") {
    reasons.push("New order needs confirmation");
  }

  return reasons.length ? reasons : ["No visible risk flags"];
}

function getRowClassName(order: OrderRecord) {
  if (order.order_status === "cancelled" || order.order_status === "returned") {
    return "bg-rose-50/35";
  }

  if (order.order_status === "new") {
    return "bg-amber-50/35";
  }

  if (order.courier_status === "delivered") {
    return "bg-emerald-50/35";
  }

  return "bg-white";
}

function formatStatus(value: string | null) {
  return value ? value.replaceAll("_", " ") : "not set";
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-BD", {
    currency: "BDT",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatLocation(order: OrderRecord) {
  const area = order.area ?? "No area";
  const district = order.district ?? "No district";
  return `${district} / ${area}`;
}

function getZoneFilterValue(order: OrderRecord) {
  return order.district === "Dhaka" ? "Dhaka" : "Outside Dhaka";
}

function getSearchText(order: OrderRecord) {
  return [
    order.order_number,
    order.customer_name,
    order.customer_phone,
    order.source,
    order.district,
    order.area,
    order.delivery_zone,
    order.order_status,
    order.payment_status,
    order.courier_status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function RealOrdersPage({ orders }: RealOrdersPageProps) {
  const [orderFilter, setOrderFilter] = useState("All");
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState("All Sources");
  const [zoneFilter, setZoneFilter] = useState("All Zones");
  const [previewOrderId, setPreviewOrderId] = useState(orders[0]?.id ?? "");

  const sourceOptions = useMemo(
    () => [
      "All Sources",
      ...Array.from(
        new Set(
          orders
            .map((order) => order.source)
            .filter((source): source is string => Boolean(source)),
        ),
      ),
    ],
    [orders],
  );
  const statusOptions = useMemo(
    () => [
      "All",
      ...Array.from(new Set(orders.map((order) => formatStatus(order.order_status)))),
    ],
    [orders],
  );
  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const currentStatus = formatStatus(order.order_status);
        const matchesStatus = orderFilter === "All" || currentStatus === orderFilter;
        const matchesZone =
          zoneFilter === "All Zones" || getZoneFilterValue(order) === zoneFilter;
        const matchesSource =
          sourceFilter === "All Sources" || order.source === sourceFilter;
        const matchesSearch =
          searchTerm.trim() === "" ||
          getSearchText(order).includes(searchTerm.trim().toLowerCase());
        const matchesPriority =
          !priorityOnly ||
          getRiskLabel(order) === "High" ||
          order.order_status === "new";

        return (
          matchesStatus &&
          matchesZone &&
          matchesSource &&
          matchesSearch &&
          matchesPriority
        );
      }),
    [orderFilter, orders, priorityOnly, searchTerm, sourceFilter, zoneFilter],
  );
  const visibleOrderIds = filteredOrders.map((order) => order.id);
  const allVisibleSelected =
    visibleOrderIds.length > 0 &&
    visibleOrderIds.every((id) => selectedOrderIds.includes(id));
  const previewOrder =
    filteredOrders.find((order) => order.id === previewOrderId) ??
    filteredOrders[0] ??
    null;

  const totalOrders = orders.length;
  const pendingConfirmOrders = orders.filter((order) =>
    ["new", "processing"].includes(order.order_status),
  ).length;
  const readyCourierOrders = orders.filter((order) =>
    ["ready", "not_sent"].includes(order.courier_status ?? ""),
  ).length;
  const returnRiskOrders = orders.filter(
    (order) =>
      ["returned", "cancelled"].includes(order.order_status) ||
      order.due_amount > 0,
  ).length;
  const confirmedOrders = orders.filter(
    (order) => order.order_status === "confirmed",
  ).length;
  const deliveredOrders = orders.filter(
    (order) => order.order_status === "delivered",
  ).length;
  const totalDue = orders.reduce((sum, order) => sum + order.due_amount, 0);
  const selectedCodTotal = orders
    .filter((order) => selectedOrderIds.includes(order.id))
    .reduce((sum, order) => sum + order.total, 0);

  function toggleOrder(orderId: string) {
    setSelectedOrderIds((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId],
    );
  }

  function toggleAllVisible() {
    setSelectedOrderIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleOrderIds.includes(id))
        : Array.from(new Set([...current, ...visibleOrderIds])),
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            active={!priorityOnly && orderFilter === "All"}
            helper="Live intake"
            icon="#"
            label="Today Orders"
            onClick={() => {
              setPriorityOnly(false);
              setOrderFilter("All");
            }}
            value={String(totalOrders)}
          />
          <StatCard
            active={orderFilter === "new"}
            helper="Need action"
            icon="!"
            label="Pending Confirm"
            onClick={() => {
              setOrderFilter("new");
              setPriorityOnly(false);
            }}
            value={String(pendingConfirmOrders)}
          />
          <StatCard
            helper="Dispatch now"
            icon="Go"
            label="Ready Courier"
            onClick={() => {
              setPriorityOnly(false);
              setZoneFilter("All Zones");
            }}
            value={String(readyCourierOrders)}
          />
          <StatCard
            active={priorityOnly}
            helper="Watchlist"
            icon="Risk"
            label="Return Risk"
            onClick={() => setPriorityOnly((current) => !current)}
            value={String(returnRiskOrders)}
          />
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-col gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-950">
                  Orders Command Center
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-slate-500">
                  Live Supabase order board with source-style filters, risk
                  badges, customer blocks, and safe detail links. Mutating list
                  actions remain disabled until a dedicated workflow is wired.
                </p>
              </div>
              <Badge tone="brand">Live Orders</Badge>
            </div>

            <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
              <div className="relative max-w-lg">
                <input
                  className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-10 text-sm outline-none placeholder:text-slate-400 focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/15"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search order, customer, phone..."
                  type="text"
                  value={searchTerm}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  S
                </span>
              </div>
              <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                <DisabledButton>Add Order</DisabledButton>
                <DisabledButton>Export</DisabledButton>
                <DisabledButton>Bulk Confirm</DisabledButton>
                <DisabledButton>Print Invoice</DisabledButton>
                <DisabledButton primary>Send Courier</DisabledButton>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  priorityOnly
                    ? "bg-rose-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600"
                }`}
                onClick={() => setPriorityOnly((current) => !current)}
                type="button"
              >
                Priority Queue
              </button>
              <SelectPill
                label="Source"
                onChange={setSourceFilter}
                options={sourceOptions}
                value={sourceFilter}
              />
              <SelectPill
                label="Status"
                onChange={setOrderFilter}
                options={statusOptions}
                value={orderFilter}
              />
              <SelectPill
                compact
                label="Zone"
                onChange={setZoneFilter}
                options={["All Zones", "Dhaka", "Outside Dhaka"]}
                value={zoneFilter}
              />
            </div>
          </div>

          {selectedOrderIds.length > 0 ? (
            <div className="border-b border-slate-100 bg-[#5E7F85]/5 px-6 py-4 text-sm font-semibold text-[#5E7F85]">
              {selectedOrderIds.length} order selected - Bulk confirm / print /
              courier controls are preview-only.
            </div>
          ) : null}

          {filteredOrders.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-stone-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">
                      <input
                        checked={allVisibleSelected}
                        className="h-4 w-4 rounded border-slate-300"
                        onChange={toggleAllVisible}
                        type="checkbox"
                      />
                    </th>
                    {[
                      "Order",
                      "Customer",
                      "Source",
                      "Amount",
                      "Zone",
                      "Risk",
                      "Status",
                      "Courier",
                      "Quick Status",
                      "Action",
                    ].map((heading) => (
                      <th className="px-5 py-4 font-medium" key={heading}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      className={`cursor-pointer border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85] ${getRowClassName(
                        order,
                      )}`}
                      key={order.id}
                      onClick={() => setPreviewOrderId(order.id)}
                    >
                      <td
                        className="px-5 py-4"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          checked={selectedOrderIds.includes(order.id)}
                          className="h-4 w-4 rounded border-slate-300"
                          onChange={() => toggleOrder(order.id)}
                          type="checkbox"
                        />
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {order.order_number ?? "No number"}
                        <div className="mt-1 text-xs font-semibold text-slate-400">
                          {formatDate(order.created_at)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-slate-800">
                              {order.customer_name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {order.customer_phone}
                            </div>
                          </div>
                          <button
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-300"
                            disabled
                            type="button"
                          >
                            WA
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {order.source ?? "Unknown"}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {formatMoney(order.total)}
                        <div className="mt-1 text-xs text-slate-500">
                          Due {formatMoney(order.due_amount)}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {order.district ?? "No district"}
                        <div className="mt-1 text-xs text-slate-500">
                          {order.delivery_zone ?? "No zone"}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="group relative inline-flex">
                          <Badge tone={getRiskTone(order)}>
                            {getRiskLabel(order)}
                          </Badge>
                          <div className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-64 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-xl group-hover:block">
                            <div className="font-bold text-slate-900">
                              Live risk signals
                            </div>
                            <div className="mt-2 space-y-1">
                              {getRiskReasons(order).map((reason) => (
                                <div key={reason}>- {reason}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={getOrderStatusTone(order.order_status)}>
                          {formatStatus(order.order_status)}
                        </Badge>
                      </td>
                      <td
                        className="px-5 py-4"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <select
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400 outline-none"
                          disabled
                          value={formatStatus(order.courier_status)}
                        >
                          <option>{formatStatus(order.courier_status)}</option>
                        </select>
                      </td>
                      <td
                        className="px-5 py-4"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <select
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400 outline-none"
                          disabled
                          value={formatStatus(order.order_status)}
                        >
                          <option>{formatStatus(order.order_status)}</option>
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            className="inline-flex rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-bold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white"
                            href={`/orders/details?id=${order.id}`}
                          >
                            Open
                          </Link>
                          <button
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-400"
                            disabled
                            type="button"
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              No orders found. Try changing filters.
            </div>
          )}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">
              Ops Drawer
            </h2>
            {previewOrder ? (
              <div className="mt-5 space-y-4 text-sm">
                <div className="rounded-2xl bg-stone-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900">
                        {previewOrder.order_number ?? "No number"}
                      </div>
                      <div className="mt-1 font-semibold text-slate-700">
                        {previewOrder.customer_name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {previewOrder.customer_phone}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge tone={getRiskTone(previewOrder)}>
                        {getRiskLabel(previewOrder)}
                      </Badge>
                      <div className="mt-2 text-xs font-semibold text-slate-500">
                        Derived from live status and due
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 rounded-2xl bg-stone-50 p-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-slate-500">Zone</div>
                    <div className="font-semibold text-slate-800">
                      {formatLocation(previewOrder)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Amount</div>
                    <div className="font-semibold text-slate-800">
                      {formatMoney(previewOrder.total)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Source</div>
                    <div className="font-semibold text-slate-800">
                      {previewOrder.source ?? "Unknown"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Courier</div>
                    <div className="font-semibold text-slate-800">
                      {formatStatus(previewOrder.courier_status)}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-stone-50 p-4">
                  <div className="text-xs text-slate-500">Status Sync</div>
                  <div className="mt-1 font-semibold text-slate-800">
                    Order {formatStatus(previewOrder.order_status)} / Payment{" "}
                    {formatStatus(previewOrder.payment_status)}
                  </div>
                </div>

                <div className="rounded-2xl bg-rose-50/60 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-rose-500">
                    Risk Reasons
                  </div>
                  <div className="mt-2 grid gap-1 text-xs text-rose-700">
                    {getRiskReasons(previewOrder).map((reason) => (
                      <div key={reason}>- {reason}</div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-400"
                    disabled
                    type="button"
                  >
                    Call Now
                  </button>
                  <button
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-300"
                    disabled
                    type="button"
                  >
                    WhatsApp
                  </button>
                  <button
                    className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white opacity-60"
                    disabled
                    type="button"
                  >
                    Confirm
                  </button>
                  <button
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-400"
                    disabled
                    type="button"
                  >
                    Print
                  </button>
                  <Link
                    className="rounded-2xl border border-[#5E7F85]/30 bg-[#5E7F85]/10 px-4 py-3 text-center text-sm font-semibold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white sm:col-span-2"
                    href={`/orders/details?id=${previewOrder.id}`}
                  >
                    Open Full Details
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-stone-50 p-6 text-sm text-slate-500">
                Click any order row to open quick action drawer.
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">
              Quick Actions
            </h2>
            <div className="mt-3 rounded-2xl bg-stone-50 p-3 text-xs font-semibold text-slate-500">
              Selected: {selectedOrderIds.length} - Visible: {filteredOrders.length}
            </div>
            <div className="mt-5 space-y-3">
              {["Bulk Confirm", "Mark Packed", "Print Invoices", "Send to Courier"].map(
                (item) => (
                  <QuickActionButton key={item}>{item}</QuickActionButton>
                ),
              )}
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl bg-stone-50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Selected COD</span>
                <b className="text-slate-900">{formatMoney(selectedCodTotal)}</b>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Confirmed</span>
                <b className="text-slate-900">{confirmedOrders}</b>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Delivered</span>
                <b className="text-slate-900">{deliveredOrders}</b>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total Due</span>
                <b className="text-slate-900">{formatMoney(totalDue)}</b>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
