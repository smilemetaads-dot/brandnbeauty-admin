"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type OrderRecord = {
  area?: string;
  created_at?: string;
  customer_address?: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_charge?: number;
  delivery_zone?: string;
  district?: string;
  id: string;
  item_count?: number;
  notes?: string;
  order_number?: string;
  order_status: string;
  payment_method?: string;
  payment_status?: string;
  sourcing_item_count?: number;
  status_updated_at?: string;
  stock_deducted?: boolean;
  stock_restored?: boolean;
  subtotal?: number;
  total_amount?: number;
  total_quantity?: number;
};

type MysqlOrderRow = {
  id?: unknown;
  order_id?: unknown;
  customer_name?: unknown;
  customer_phone?: unknown;
  phone?: unknown;
  total_amount?: unknown;
  subtotal?: unknown;
  delivery_charge?: unknown;
  delivery_zone?: unknown;
  area?: unknown;
  district?: unknown;
  customer_address?: unknown;
  address?: unknown;
  payment_method?: unknown;
  payment_status?: unknown;
  status?: unknown;
  order_status?: unknown;
  created_at?: unknown;
  status_updated_at?: unknown;
  notes?: unknown;
  item_count?: unknown;
  total_quantity?: unknown;
  sourcing_item_count?: unknown;
};

type ApiResponse = {
  success?: boolean;
  data?: unknown;
  orders?: unknown;
  message?: string;
  error?: string;
};

type BadgeTone = "neutral" | "brand" | "good" | "warn" | "bad";

const MANAGE_ORDERS_ENDPOINT = bnbApiUrl("manage_orders.php");

const STATUS_LABELS: Record<string, string> = {
  pending: "New Order",
  pending_sourcing: "Pending Sourcing",
  confirmed: "Confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const STATUS_FILTERS = [
  { label: "All Orders", value: "all" },
  { label: "New Orders", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Processing", value: "processing" },
  { label: "Packed", value: "packed" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Pending Sourcing", value: "pending_sourcing" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Returned", value: "returned" },
];

const DATE_FILTERS = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
];

const ZONE_FILTERS = [
  { label: "All Zones", value: "all" },
  { label: "Dhaka City", value: "dhaka_city" },
  { label: "Dhaka Sub Area", value: "dhaka_sub_area" },
  { label: "Outside Dhaka", value: "outside_dhaka" },
];

const NEXT_STATUS_ACTIONS: Record<string, { label: string; nextStatus: string }> = {
  pending: { label: "Confirm", nextStatus: "confirmed" },
  pending_sourcing: { label: "Confirm", nextStatus: "confirmed" },
  confirmed: { label: "Start Processing", nextStatus: "processing" },
  processing: { label: "Mark Packed", nextStatus: "packed" },
  packed: { label: "Mark Shipped", nextStatus: "shipped" },
  shipped: { label: "Mark Delivered", nextStatus: "delivered" },
};

function toStringValue(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

function toNumberValue(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function normalizeMysqlOrder(row: MysqlOrderRow): OrderRecord {
  const id = toStringValue(row.id || row.order_id);

  return {
    area: toStringValue(row.area),
    created_at: toStringValue(row.created_at),
    customer_address: toStringValue(row.customer_address || row.address),
    customer_name: toStringValue(row.customer_name) || "Customer",
    customer_phone: toStringValue(row.customer_phone || row.phone),
    delivery_charge: toNumberValue(row.delivery_charge),
    delivery_zone: toStringValue(row.delivery_zone),
    district: toStringValue(row.district),
    id,
    item_count: toNumberValue(row.item_count),
    notes: toStringValue(row.notes),
    order_number: toStringValue(row.order_id || row.id),
    order_status: toStringValue(row.order_status || row.status || "pending"),
    payment_method: toStringValue(row.payment_method || "cod"),
    payment_status: toStringValue(row.payment_status || "pending"),
    sourcing_item_count: toNumberValue(row.sourcing_item_count),
    status_updated_at: toStringValue(row.status_updated_at),
    subtotal: toNumberValue(row.subtotal),
    total_amount: toNumberValue(row.total_amount),
    total_quantity: toNumberValue(row.total_quantity),
  };
}

function extractOrders(response: ApiResponse): OrderRecord[] {
  const payload = Array.isArray(response.data) ? response.data : Array.isArray(response.orders) ? response.orders : [];
  return payload.map((row) => normalizeMysqlOrder(row as MysqlOrderRow)).filter((order) => order.id);
}

function formatMoney(value?: number): string {
  if (!Number.isFinite(value)) {
    return "Tk 0";
  }

  return new Intl.NumberFormat("en-BD", {
    currency: "BDT",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value || 0);
}

function formatDate(value?: string): string {
  if (!value) {
    return "Date unavailable";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Date unavailable";
  }

  return parsed.toLocaleString("en-BD", {
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status?: string): string {
  if (!status) {
    return "Unknown";
  }

  return STATUS_LABELS[status] || status.replace(/_/g, " ");
}

function statusTone(status?: string): BadgeTone {
  switch (status) {
    case "pending":
    case "pending_sourcing":
      return "warn";
    case "confirmed":
    case "processing":
    case "packed":
    case "shipped":
      return "brand";
    case "delivered":
      return "good";
    case "cancelled":
    case "returned":
      return "bad";
    default:
      return "neutral";
  }
}

function formatPayment(order: OrderRecord): string {
  const method = `${order.payment_method || ""} ${order.payment_status || ""}`.toLowerCase();
  if (method.includes("paid")) {
    return "COD Paid";
  }

  return "Cash on Delivery";
}

function getDeliveryLabel(order: OrderRecord): string {
  return order.delivery_zone || order.area || order.district || "Delivery area unavailable";
}

function getZoneValue(order: OrderRecord): string {
  const label = getDeliveryLabel(order).toLowerCase();

  if (label.includes("sub")) {
    return "dhaka_sub_area";
  }

  if (label.includes("outside")) {
    return "outside_dhaka";
  }

  if (label.includes("dhaka")) {
    return "dhaka_city";
  }

  return "all";
}

function getItemSummary(order: OrderRecord): string {
  const lines = order.item_count || 0;
  const quantity = order.total_quantity || 0;

  if (!lines && !quantity) {
    return "Items unavailable";
  }

  const lineLabel = lines === 1 ? "1 item line" : `${lines || 1} item lines`;
  return quantity ? `${lineLabel}, Qty ${quantity}` : lineLabel;
}

function matchesDateFilter(order: OrderRecord, filter: string): boolean {
  if (filter === "all") {
    return true;
  }

  if (!order.created_at) {
    return false;
  }

  const created = new Date(order.created_at).getTime();
  if (Number.isNaN(created)) {
    return false;
  }

  const now = new Date();

  if (filter === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return created >= start;
  }

  const days = filter === "7d" ? 7 : 30;
  return created >= now.getTime() - days * 24 * 60 * 60 * 1000;
}

function getSearchText(order: OrderRecord): string {
  return [
    order.id,
    order.order_number,
    order.customer_name,
    order.customer_phone,
    order.customer_address,
    getDeliveryLabel(order),
    formatStatus(order.order_status),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
  const toneClass: Record<BadgeTone, string> = {
    bad: "border-red-200 bg-red-50 text-red-700",
    brand: "border-teal-200 bg-teal-50 text-teal-700",
    good: "border-emerald-200 bg-emerald-50 text-emerald-700",
    neutral: "border-slate-200 bg-slate-50 text-slate-600",
    warn: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass[tone]}`}>{children}</span>;
}

function StatCard({
  active,
  label,
  onClick,
  value,
}: {
  active?: boolean;
  label: string;
  onClick?: () => void;
  value: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 ${
        active ? "border-teal-300 ring-2 ring-teal-100" : "border-slate-200"
      }`}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <strong className="mt-2 block text-2xl font-bold text-slate-900">{value}</strong>
    </button>
  );
}

function SelectPill({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold normal-case tracking-normal text-slate-700 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function NextStatusButton({
  onUpdate,
  order,
  updating,
}: {
  onUpdate: (orderId: string, status: string) => void;
  order: OrderRecord;
  updating: boolean;
}) {
  const action = NEXT_STATUS_ACTIONS[order.order_status];

  if (!action) {
    return <span className="text-xs font-medium text-slate-400">No list action</span>;
  }

  return (
    <button
      type="button"
      disabled={updating}
      onClick={() => onUpdate(order.id, action.nextStatus)}
      className="rounded-full border border-teal-200 px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {updating ? "Updating..." : action.label}
    </button>
  );
}

export function RealOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [updatingOrderIds, setUpdatingOrderIds] = useState<string[]>([]);
  const [actionMessage, setActionMessage] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    setActionMessage("");

    try {
      const response = await fetch(MANAGE_ORDERS_ENDPOINT, {
        headers: adminAuthHeaders(),
      });

      const payload = (await response.json()) as ApiResponse;

      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || payload.error || "Orders could not be loaded.");
      }

      setOrders(extractOrders(payload));
    } catch (error) {
      console.error("Failed to load orders", error);
      setLoadError(true);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadOrders();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch = !query || getSearchText(order).includes(query);
      const matchesStatus = statusFilter === "all" || order.order_status === statusFilter;
      const matchesDate = matchesDateFilter(order, dateFilter);
      const matchesZone = zoneFilter === "all" || getZoneValue(order) === zoneFilter;
      return matchesSearch && matchesStatus && matchesDate && matchesZone;
    });
  }, [dateFilter, orders, searchTerm, statusFilter, zoneFilter]);

  const stats = useMemo(
    () => ({
      all: orders.length,
      delivered: orders.filter((order) => order.order_status === "delivered").length,
      inProgress: orders.filter((order) => ["confirmed", "processing", "packed", "shipped"].includes(order.order_status)).length,
      newOrders: orders.filter((order) => ["pending", "pending_sourcing"].includes(order.order_status)).length,
    }),
    [orders],
  );

  async function handleStatusChange(orderId: string, nextStatus: string) {
    setUpdatingOrderIds((current) => [...current, orderId]);
    setActionMessage("");

    try {
      const response = await fetch(MANAGE_ORDERS_ENDPOINT, {
        body: JSON.stringify({ id: orderId, order_status: nextStatus }),
        headers: {
          "Content-Type": "application/json",
          ...adminAuthHeaders(),
        },
        method: "PUT",
      });

      const payload = (await response.json()) as ApiResponse;

      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || payload.error || "Status could not be updated.");
      }

      setActionMessage("Order status updated.");
      await loadOrders();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Status could not be updated.";
      setActionMessage(message);
    } finally {
      setUpdatingOrderIds((current) => current.filter((id) => id !== orderId));
    }
  }

  const emptyMessage = orders.length === 0 ? "No orders found." : "No orders match these filters.";

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-600">Orders</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">Order Management</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Review customer orders, filter the queue, and move orders through the safe fulfillment steps.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadOrders()}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
          >
            Refresh Orders
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard active={statusFilter === "all"} label="All Orders" value={stats.all} onClick={() => setStatusFilter("all")} />
          <StatCard active={statusFilter === "pending"} label="New Orders" value={stats.newOrders} onClick={() => setStatusFilter("pending")} />
          <StatCard label="In Progress" value={stats.inProgress} onClick={() => setStatusFilter("processing")} />
          <StatCard active={statusFilter === "delivered"} label="Delivered" value={stats.delivered} onClick={() => setStatusFilter("delivered")} />
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <label className="flex flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search Orders
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by order, customer or phone"
                  className="min-h-11 rounded-full border border-slate-200 px-4 text-sm font-medium normal-case tracking-normal text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                <SelectPill label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUS_FILTERS} />
                <SelectPill label="Date" value={dateFilter} onChange={setDateFilter} options={DATE_FILTERS} />
                <SelectPill label="Delivery Zone" value={zoneFilter} onChange={setZoneFilter} options={ZONE_FILTERS} />
              </div>
            </div>

            {actionMessage ? (
              <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">{actionMessage}</p>
            ) : null}
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm font-semibold text-slate-500">Loading orders...</div>
          ) : loadError ? (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-red-600">Orders could not be loaded. Please try again.</p>
              <button
                type="button"
                onClick={() => void loadOrders()}
                className="mt-4 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
              >
                Try Again
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-10 text-center text-sm font-semibold text-slate-500">{emptyMessage}</div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Items</th>
                      <th className="px-4 py-3">Delivery</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Next Step</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="align-top transition hover:bg-slate-50">
                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-950">#{order.order_number || order.id}</p>
                          <p className="mt-1 text-xs text-slate-500">ID {order.id}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">{order.customer_name || "Customer"}</p>
                          <p className="mt-1 text-xs text-slate-500">{order.customer_phone || "Phone unavailable"}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{getItemSummary(order)}</td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-700">{getDeliveryLabel(order)}</p>
                          {order.customer_address ? <p className="mt-1 line-clamp-2 max-w-56 text-xs text-slate-500">{order.customer_address}</p> : null}
                        </td>
                        <td className="px-4 py-4 font-bold text-slate-950">{formatMoney(order.total_amount)}</td>
                        <td className="px-4 py-4 text-slate-600">{formatPayment(order)}</td>
                        <td className="px-4 py-4 text-slate-600">{formatDate(order.created_at)}</td>
                        <td className="px-4 py-4">
                          <Badge tone={statusTone(order.order_status)}>{formatStatus(order.order_status)}</Badge>
                        </td>
                        <td className="px-4 py-4">
                          <NextStatusButton
                            order={order}
                            updating={updatingOrderIds.includes(order.id)}
                            onUpdate={(orderId, nextStatus) => void handleStatusChange(orderId, nextStatus)}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/orders/${order.id}`}
                            className="inline-flex rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
                          >
                            View Order
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-4 lg:hidden">
                {filteredOrders.map((order) => (
                  <article key={order.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">#{order.order_number || order.id}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(order.created_at)}</p>
                      </div>
                      <Badge tone={statusTone(order.order_status)}>{formatStatus(order.order_status)}</Badge>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Customer</p>
                        <p className="font-semibold text-slate-900">{order.customer_name || "Customer"}</p>
                        <p>{order.customer_phone || "Phone unavailable"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Delivery</p>
                        <p>{getDeliveryLabel(order)}</p>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>{getItemSummary(order)}</span>
                        <strong className="text-base text-slate-950">{formatMoney(order.total_amount)}</strong>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <NextStatusButton
                        order={order}
                        updating={updatingOrderIds.includes(order.id)}
                        onUpdate={(orderId, nextStatus) => void handleStatusChange(orderId, nextStatus)}
                      />
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
                      >
                        View Order
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

