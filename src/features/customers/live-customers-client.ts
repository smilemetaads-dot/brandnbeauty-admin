import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type ApiOrder = {
  address?: string | null;
  city?: string | null;
  created_at?: string | null;
  customer_name?: string | null;
  delivery_address?: string | null;
  email?: string | null;
  id?: string | number | null;
  order_id?: string | number | null;
  payment_method?: string | null;
  payment_status?: string | null;
  phone?: string | null;
  status?: string | null;
  total_amount?: string | number | null;
  updated_at?: string | null;
};

type OrdersApiResponse = {
  message?: string;
  orders?: ApiOrder[];
  success?: boolean;
};

export type LiveCustomerOrder = {
  address: string | null;
  city: string | null;
  createdAt: string | null;
  id: string;
  orderNumber: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  total: number;
  updatedAt: string | null;
};

export type LiveCustomerRecord = {
  activeCount: number;
  address: string | null;
  averageOrderValue: number;
  cancelledCount: number;
  city: string | null;
  deliveredCount: number;
  email: string | null;
  firstOrderAt: string | null;
  id: string;
  lastOrderAt: string | null;
  name: string;
  netOrderValue: number;
  orderCount: number;
  orders: LiveCustomerOrder[];
  phone: string;
  returnedCount: number;
  riskLabel: "Has Returns" | "High Return Risk" | "New Customer" | "Repeat Customer";
};

export const CUSTOMERS_ORDERS_ENDPOINT = bnbApiUrl("manage_orders.php");

const inactiveStatuses = new Set(["cancelled", "returned"]);
const activeStatuses = new Set(["pending", "new", "pending_sourcing", "need_sourcing", "confirmed", "processing", "ready_to_pack", "packed", "shipped"]);

function toNumber(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);

  return Number.isFinite(amount) ? amount : 0;
}

function cleanText(value: string | null | undefined) {
  const cleaned = String(value ?? "").trim();

  return cleaned || null;
}

function normalizeStatus(value: string | null | undefined, fallback: string) {
  return String(value ?? fallback).trim().toLowerCase().replaceAll(" ", "_") || fallback;
}

function timestamp(value: string | null) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizedPhone(value: string | null) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (/^8801\d{9}$/.test(digits)) return `0${digits.slice(3)}`;
  return digits;
}

function identityKey(order: ApiOrder) {
  const phone = normalizedPhone(cleanText(order.phone));
  if (phone) return `phone:${phone}`;

  const email = cleanText(order.email)?.toLowerCase();
  if (email) return `email:${email}`;

  const name = cleanText(order.customer_name)?.toLowerCase() ?? "guest";
  const address = cleanText(order.delivery_address ?? order.address)?.toLowerCase() ?? "unknown";
  return `guest:${name}:${address}`;
}

function normalizeOrder(order: ApiOrder): LiveCustomerOrder {
  const id = String(order.order_id ?? order.id ?? "");
  const status = normalizeStatus(order.status, "pending");

  return {
    address: cleanText(order.delivery_address ?? order.address),
    city: cleanText(order.city),
    createdAt: cleanText(order.created_at),
    id,
    orderNumber: id ? `BNB-${id.padStart(6, "0")}` : "BNB-UNKNOWN",
    paymentMethod: normalizeStatus(order.payment_method, "cash_on_delivery"),
    paymentStatus: normalizeStatus(order.payment_status, "not_recorded"),
    status,
    total: toNumber(order.total_amount),
    updatedAt: cleanText(order.updated_at),
  };
}

function customerRisk(orderCount: number, returnedCount: number): LiveCustomerRecord["riskLabel"] {
  if (returnedCount >= 2) return "High Return Risk";
  if (returnedCount === 1) return "Has Returns";
  if (orderCount >= 2) return "Repeat Customer";
  return "New Customer";
}

export function buildCustomersFromOrders(apiOrders: ApiOrder[]): LiveCustomerRecord[] {
  const groups = new Map<string, { email: string | null; name: string; orders: LiveCustomerOrder[]; phone: string }>();

  for (const apiOrder of apiOrders) {
    const key = identityKey(apiOrder);
    const existing = groups.get(key);
    const order = normalizeOrder(apiOrder);
    const name = cleanText(apiOrder.customer_name) ?? "Guest Customer";
    const phone = cleanText(apiOrder.phone) ?? "Not available";
    const email = cleanText(apiOrder.email);

    if (!existing) {
      groups.set(key, { email, name, orders: [order], phone });
      continue;
    }

    existing.orders.push(order);
    if (timestamp(order.createdAt) >= timestamp(existing.orders[0]?.createdAt ?? null)) {
      existing.name = name || existing.name;
      existing.phone = phone !== "Not available" ? phone : existing.phone;
      existing.email = email ?? existing.email;
    }
  }

  return Array.from(groups.entries()).map(([id, group]) => {
    const orders = group.orders.toSorted((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt));
    const latest = orders[0];
    const oldest = orders[orders.length - 1];
    const deliveredCount = orders.filter((order) => order.status === "delivered").length;
    const returnedCount = orders.filter((order) => order.status === "returned").length;
    const cancelledCount = orders.filter((order) => order.status === "cancelled").length;
    const activeCount = orders.filter((order) => activeStatuses.has(order.status)).length;
    const netOrders = orders.filter((order) => !inactiveStatuses.has(order.status));
    const netOrderValue = netOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      activeCount,
      address: latest?.address ?? null,
      averageOrderValue: netOrders.length ? netOrderValue / netOrders.length : 0,
      cancelledCount,
      city: latest?.city ?? null,
      deliveredCount,
      email: group.email,
      firstOrderAt: oldest?.createdAt ?? null,
      id,
      lastOrderAt: latest?.createdAt ?? null,
      name: group.name,
      netOrderValue,
      orderCount: orders.length,
      orders,
      phone: group.phone,
      returnedCount,
      riskLabel: customerRisk(orders.length, returnedCount),
    };
  }).toSorted((a, b) => timestamp(b.lastOrderAt) - timestamp(a.lastOrderAt));
}

export async function fetchLiveCustomers(signal?: AbortSignal) {
  const response = await fetch(CUSTOMERS_ORDERS_ENDPOINT, {
    cache: "no-store",
    headers: adminAuthHeaders(),
    signal,
  });
  const payload = (await response.json().catch(() => null)) as OrdersApiResponse | ApiOrder[] | null;
  const apiOrders = Array.isArray(payload) ? payload : payload?.orders;

  if (!response.ok || !apiOrders) {
    const message = !Array.isArray(payload) ? payload?.message : null;
    throw new Error(message || "Live customers could not be loaded from Orders.");
  }

  return buildCustomersFromOrders(apiOrders);
}
