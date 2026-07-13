"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type RealOrdersPageProps = {
  orders?: OrderRecord[];
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

type OrderRecord = {
  area: string | null;
  courier_name: string | null;
  courier_status: string | null;
  courier_tracking_id: string | null;
  created_at: string | null;
  customer_name: string;
  customer_phone: string;
  delivery_charge: number;
  delivery_zone: string | null;
  discount: number;
  district: string | null;
  due_amount: number;
  id: string;
  order_number: string | null;
  order_status: string;
  paid_amount: number;
  payment_status: string;
  pending_sourcing_count?: number;
  ready_count?: number;
  requires_sourcing?: boolean;
  requires_sourcing_count?: number;
  source: string | null;
  sourced_count?: number;
  stock_deducted: boolean;
  stock_restored: boolean;
  subtotal: number;
  total: number;
  updated_at: string | null;
};

type MysqlOrderRow = {
  address?: unknown;
  city?: unknown;
  created_at?: unknown;
  customer_name?: unknown;
  delivery_address?: unknown;
  delivery_charge?: unknown;
  email?: unknown;
  id?: unknown;
  payment_method?: unknown;
  payment_status?: unknown;
  pending_sourcing_count?: unknown;
  ready_count?: unknown;
  requires_sourcing?: unknown;
  requires_sourcing_count?: unknown;
  sourced_count?: unknown;
  phone?: unknown;
  status?: unknown;
  subtotal_amount?: unknown;
  total_amount?: unknown;
  updated_at?: unknown;
};

type ManageOrdersResponse = {
  orders?: unknown;
  success?: boolean;
};

const MANAGE_ORDERS_ENDPOINT = bnbApiUrl("manage_orders.php");
const ORDER_STATUS_OPTIONS = [
  "pending",
  "pending_sourcing",
  "approved",
  "confirmed",
  "processing",
  "packing",
  "packed",
  "ready_to_ship",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

function toNumber(value: unknown) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function toStringOrNull(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : null;
}

function normalizeOrderStatus(value: unknown) {
  const status = String(value ?? "pending").trim().toLowerCase();

  return status || "pending";
}

function normalizePaymentStatus(value: unknown, orderStatus: string) {
  const paymentStatus = String(value ?? "").trim().toLowerCase();

  if (!paymentStatus || paymentStatus === "not_set") {
    return orderStatus === "delivered" ? "paid" : "cod_pending";
  }

  if (paymentStatus === "cash_on_delivery") {
    return orderStatus === "delivered" ? "paid" : "cod_pending";
  }

  return paymentStatus;
}

function normalizeMysqlOrder(row: MysqlOrderRow): OrderRecord {
  const id = String(row.id ?? "");
  const total = toNumber(row.total_amount);
  const createdAt = toStringOrNull(row.created_at);
  const status = normalizeOrderStatus(row.status);
  const paymentStatus = normalizePaymentStatus(
    row.payment_status ?? row.payment_method,
    status,
  );
  const isPaymentComplete = ["paid", "completed", "success", "successful"].includes(
    paymentStatus,
  );

  return {
    area: toStringOrNull(row.address ?? row.delivery_address),
    courier_name: null,
    courier_status: status === "delivered" ? "delivered" : "not_sent",
    courier_tracking_id: null,
    created_at: createdAt,
    customer_name: String(row.customer_name ?? "Unknown customer"),
    customer_phone: String(row.phone ?? ""),
    delivery_charge: toNumber(row.delivery_charge),
    delivery_zone: toStringOrNull(row.city),
    district: toStringOrNull(row.city),
    discount: 0,
    due_amount: isPaymentComplete ? 0 : total,
    id,
    order_number: id ? `BNB-${id.padStart(6, "0")}` : null,
    order_status: status,
    paid_amount: isPaymentComplete ? total : 0,
    payment_status: paymentStatus,
    pending_sourcing_count: toNumber(row.pending_sourcing_count),
    ready_count: toNumber(row.ready_count),
    requires_sourcing: Boolean(row.requires_sourcing) || toNumber(row.requires_sourcing_count) > 0,
    requires_sourcing_count: toNumber(row.requires_sourcing_count),
    source: "MySQL",
    sourced_count: toNumber(row.sourced_count),
    stock_deducted: true,
    stock_restored: false,
    subtotal: toNumber(row.subtotal_amount),
    total,
    updated_at: toStringOrNull(row.updated_at) ?? createdAt,
  };
}

function normalizeMysqlOrders(payload: unknown) {
  const rows =
    Array.isArray(payload)
      ? payload
      : Array.isArray((payload as ManageOrdersResponse | null)?.orders)
        ? ((payload as ManageOrdersResponse).orders as unknown[])
        : [];

  return rows
    ? rows.map((row) => normalizeMysqlOrder(row as MysqlOrderRow))
    : [];
}

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
  if (status === "new" || status === "pending" || status === "processing") {
    return "warn";
  }
  return "brand";
}

function getRiskLabel(order: OrderRecord) {
  if (order.order_status === "cancelled" || order.order_status === "returned") {
    return "High";
  }

  if (
    order.due_amount > 0 ||
    order.order_status === "new" ||
    order.order_status === "pending"
  ) {
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

  if (order.order_status === "new" || order.order_status === "pending") {
    reasons.push("New order needs confirmation");
  }

  return reasons.length ? reasons : ["No visible risk flags"];
}

function getRowClassName(order: OrderRecord) {
  if (order.order_status === "cancelled" || order.order_status === "returned") {
    return "bg-rose-50/35";
  }

  if (order.order_status === "new" || order.order_status === "pending") {
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

export function RealOrdersPage({ orders: initialOrders = [] }: RealOrdersPageProps) {
  const [orders, setOrders] = useState<OrderRecord[]>(initialOrders);
  const [isLoading, setIsLoading] = useState(!initialOrders.length);
  const [orderFilter, setOrderFilter] = useState("All");
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState("All Sources");
  const [updatingOrderIds, setUpdatingOrderIds] = useState<string[]>([]);
  const [zoneFilter, setZoneFilter] = useState("All Zones");
  const [previewOrderId, setPreviewOrderId] = useState(orders[0]?.id ?? "");

  const loadOrders = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      const response = await fetch(MANAGE_ORDERS_ENDPOINT, {
        cache: "no-store",
        headers: adminAuthHeaders(),
        signal,
      });

      if (!response.ok) {
        throw new Error("Failed to load orders from PHP endpoint.");
      }

      const payload = (await response.json()) as unknown;
      const nextOrders = normalizeMysqlOrders(payload);

      setOrders(nextOrders);
      setPreviewOrderId((current) => current || nextOrders[0]?.id || "");
    } catch (error) {
      if (!signal?.aborted) {
        console.error("Admin orders could not be loaded.", error);
        setOrders([]);
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void Promise.resolve().then(() => loadOrders(controller.signal));

    return () => {
      controller.abort();
    };
  }, [loadOrders]);

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
          order.order_status === "new" ||
          order.order_status === "pending";

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
    ["new", "pending", "processing"].includes(order.order_status),
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

  async function handleStatusChange(orderId: string, nextStatus: string) {
    setUpdatingOrderIds((current) => Array.from(new Set([...current, orderId])));

    try {
      const response = await fetch(MANAGE_ORDERS_ENDPOINT, {
        body: JSON.stringify({
          order_id: orderId,
          status: nextStatus,
        }),
        headers: adminAuthHeaders({
          "Content-Type": "application/json",
        }),
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        success?: boolean;
      } | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message ?? "Order status update failed.");
      }

      await loadOrders();
    } catch (error) {
      console.error("Order status could not be updated.", error);
    } finally {
      setUpdatingOrderIds((current) => current.filter((id) => id !== orderId));
    }
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
            active={orderFilter === "pending"}
            helper="Need action"
            icon="!"
            label="Pending Confirm"
            onClick={() => {
              setOrderFilter("pending");
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
                  Live MySQL order board with source-style filters, risk
                  badges, customer blocks, status updates, and safe detail links.
                  Bulk actions, invoice printing and courier upload are coming
                  later. Row detail links and status updates remain live.
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
                <DisabledButton>Add order coming later</DisabledButton>
                <DisabledButton>Export coming later</DisabledButton>
                <DisabledButton>Bulk confirm coming later</DisabledButton>
                <DisabledButton>Print invoice coming later</DisabledButton>
                <DisabledButton primary>Courier upload coming later</DisabledButton>
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
              {selectedOrderIds.length} order selected - bulk confirm, print
              and courier controls are coming later.
            </div>
          ) : null}

          {isLoading ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              Loading live orders from local MySQL...
            </div>
          ) : filteredOrders.length ? (
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
                      "Payment",
                      "Delivery Address",
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
                      <td className="px-5 py-4">
                        <Badge
                          tone={
                            order.payment_status === "paid" ? "good" : "warn"
                          }
                        >
                          {formatStatus(order.payment_status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <div className="max-w-[260px] font-semibold text-slate-700">
                          {order.area ?? "No address"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {order.district ?? order.delivery_zone ?? "No zone"}
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
                        <div className="flex flex-col gap-2">
                          <Badge tone={getOrderStatusTone(order.order_status)}>
                            {formatStatus(order.order_status)}
                          </Badge>
                          {order.requires_sourcing ? (
                            <Badge tone={order.pending_sourcing_count ? "warn" : "good"}>
                              {order.pending_sourcing_count ? "Pending Sourcing" : order.ready_count ? "Ready for Packing" : "Sourced"}
                            </Badge>
                          ) : null}
                        </div>
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
                          disabled={updatingOrderIds.includes(order.id)}
                          onChange={(event) =>
                            handleStatusChange(order.id, event.target.value)
                          }
                          value={order.order_status}
                        >
                          {ORDER_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {formatStatus(status)}
                            </option>
                          ))}
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
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={
                              updatingOrderIds.includes(order.id) ||
                              !["pending", "new"].includes(order.order_status)
                            }
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleStatusChange(order.id, "approved");
                            }}
                            type="button"
                          >
                            Approve
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
              {["Bulk confirm coming later", "Mark packed coming later", "Print invoices coming later", "Courier upload coming later"].map(
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
