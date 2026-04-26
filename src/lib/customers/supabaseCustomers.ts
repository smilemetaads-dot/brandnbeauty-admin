import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type CustomerSummary = {
  name: string;
  phone: string;
  orders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  spent: number;
  lastOrder: string;
  location: string;
  payment: string;
  status: string;
  risk: string;
  latestOrderStatus: string;
};

export type CustomersData = {
  stats: [string, string, string][];
  customers: CustomerSummary[];
};

export type CustomerProfileOrder = {
  id: string;
  amount: number;
  status: string;
  paid: number;
  expected: number;
  courierStatus: string;
  date: string;
};

export type CustomerProfileData = {
  customer: {
    name: string;
    phone: string;
    email: string;
    location: string;
    address: string;
    totalOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalSpent: number;
    score: number;
    tag: string;
    risk: string;
    lastActivity: string;
  } | null;
  orders: CustomerProfileOrder[];
  notes: string[];
  aiSuggestions: string[];
  totalExpected: number;
  totalReceived: number;
  totalDifference: number;
};

type OrderRow = {
  order_number?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  customer_city?: string | null;
  total?: number | string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  order_status?: string | null;
  created_at?: string | null;
};

type NormalizedOrder = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  createdAtDate: Date | null;
};

const emptyCustomersData: CustomersData = buildCustomersData([]);

export async function getCustomersDataFromSupabase(): Promise<CustomersData> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.warn("[admin-customers] Supabase service role config missing.");
    return emptyCustomersData;
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      "order_number, customer_name, customer_phone, customer_address, customer_city, total, payment_method, payment_status, order_status, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin-customers] Orders query failed:", {
      table: "public.orders",
      code: error.code,
      message: error.message,
    });
    return emptyCustomersData;
  }

  return buildCustomersData(((data ?? []) as OrderRow[]).map(mapOrderRow));
}

export async function getCustomerProfileFromSupabase(
  phone?: string,
): Promise<CustomerProfileData> {
  const emptyProfile: CustomerProfileData = {
    customer: null,
    orders: [],
    notes: [],
    aiSuggestions: [],
    totalExpected: 0,
    totalReceived: 0,
    totalDifference: 0,
  };
  const phoneKey = normalizePhoneKey(phone ?? "");

  if (!phoneKey) {
    return emptyProfile;
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.warn("[admin-customer-profile] Supabase service role config missing.");
    return emptyProfile;
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      "order_number, customer_name, customer_phone, customer_address, customer_city, total, payment_method, payment_status, order_status, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin-customer-profile] Orders query failed:", {
      table: "public.orders",
      code: error.code,
      message: error.message,
    });
    return emptyProfile;
  }

  const customerOrders = ((data ?? []) as OrderRow[])
    .map(mapOrderRow)
    .filter((order) => normalizePhoneKey(order.customerPhone) === phoneKey);

  if (customerOrders.length === 0) {
    return emptyProfile;
  }

  return buildCustomerProfileData(customerOrders);
}

function buildCustomersData(orders: NormalizedOrder[]): CustomersData {
  const groupedCustomers = new Map<string, NormalizedOrder[]>();

  for (const order of orders) {
    const key = normalizePhoneKey(order.customerPhone);
    if (!key) continue;

    groupedCustomers.set(key, [...(groupedCustomers.get(key) ?? []), order]);
  }

  const customers = [...groupedCustomers.values()]
    .map(buildCustomerSummary)
    .sort((left, right) => right.spent - left.spent || right.orders - left.orders);
  const returningCustomers = customers.filter((customer) => customer.orders > 1).length;
  const vipCustomers = customers.filter((customer) => customer.status === "VIP").length;
  const riskCustomers = customers.filter((customer) => customer.risk !== "Low").length;
  const repeatRate =
    customers.length > 0 ? (returningCustomers / customers.length) * 100 : 0;

  return {
    stats: [
      ["Total Customers", customers.length.toLocaleString(), "Derived from orders"],
      [
        "Returning Customers",
        returningCustomers.toLocaleString(),
        `${repeatRate.toFixed(1)}% repeat rate`,
      ],
      ["VIP Customers", vipCustomers.toLocaleString(), "High value buyers"],
      ["COD Risk Customers", riskCustomers.toLocaleString(), "Need review"],
    ],
    customers,
  };
}

function buildCustomerSummary(customerOrders: NormalizedOrder[]): CustomerSummary {
  const sortedOrders = [...customerOrders].sort(
    (left, right) =>
      (right.createdAtDate?.getTime() ?? 0) - (left.createdAtDate?.getTime() ?? 0),
  );
  const latestOrder = sortedOrders[0];
  const deliveredOrders = customerOrders.filter(
    (order) => order.orderStatus === "delivered",
  ).length;
  const cancelledOrders = customerOrders.filter((order) =>
    ["cancelled", "returned"].includes(order.orderStatus),
  ).length;
  const spent = customerOrders
    .filter(
      (order) =>
        order.orderStatus === "delivered" &&
        ["paid", "verified"].includes(order.paymentStatus),
    )
    .reduce((sum, order) => sum + order.total, 0);
  const status =
    spent >= 5000 || customerOrders.length >= 5
      ? "VIP"
      : customerOrders.length > 1
        ? "Returning"
        : "New";
  const risk =
    cancelledOrders >= 2 || cancelledOrders / customerOrders.length >= 0.5
      ? "High"
      : cancelledOrders > 0
        ? "Medium"
        : "Low";

  return {
    name: latestOrder.customerName,
    phone: latestOrder.customerPhone,
    orders: customerOrders.length,
    deliveredOrders,
    cancelledOrders,
    spent,
    lastOrder: formatDate(latestOrder.createdAt),
    location: latestOrder.customerCity,
    payment: formatPaymentMethods(customerOrders),
    status,
    risk,
    latestOrderStatus: toTitleCase(latestOrder.orderStatus),
  };
}

function buildCustomerProfileData(
  customerOrders: NormalizedOrder[],
): CustomerProfileData {
  const sortedOrders = [...customerOrders].sort(
    (left, right) =>
      (right.createdAtDate?.getTime() ?? 0) - (left.createdAtDate?.getTime() ?? 0),
  );
  const latestOrder = sortedOrders[0];
  const summary = buildCustomerSummary(customerOrders);
  const profileOrders = sortedOrders.map((order) => {
    const isPaidDelivered =
      order.orderStatus === "delivered" &&
      ["paid", "verified"].includes(order.paymentStatus);

    return {
      id: order.orderNumber,
      amount: order.total,
      status: toTitleCase(order.orderStatus),
      paid: isPaidDelivered ? order.total : 0,
      expected: order.total,
      courierStatus: toTitleCase(order.orderStatus),
      date: formatDate(order.createdAt),
    };
  });
  const totalExpected = profileOrders.reduce(
    (total, order) => total + order.expected,
    0,
  );
  const totalReceived = profileOrders.reduce(
    (total, order) => total + order.paid,
    0,
  );

  return {
    customer: {
      name: summary.name,
      phone: summary.phone,
      email: "N/A",
      location: summary.location,
      address: latestOrder.customerAddress,
      totalOrders: summary.orders,
      deliveredOrders: summary.deliveredOrders,
      cancelledOrders: summary.cancelledOrders,
      totalSpent: summary.spent,
      score: calculateCustomerScore(summary.orders, summary.cancelledOrders),
      tag: summary.status,
      risk: summary.risk,
      lastActivity: `Last order: ${summary.lastOrder}`,
    },
    orders: profileOrders,
    notes: [
      `Latest address: ${latestOrder.customerAddress}`,
      `Latest city: ${latestOrder.customerCity}`,
    ],
    aiSuggestions: [
      `${summary.deliveredOrders} delivered orders`,
      `${summary.cancelledOrders} cancelled/returned orders`,
      `Latest order status: ${summary.latestOrderStatus}`,
    ],
    totalExpected,
    totalReceived,
    totalDifference: totalExpected - totalReceived,
  };
}

function mapOrderRow(row: OrderRow): NormalizedOrder {
  const createdAt = toText(row.created_at, "");
  const createdAtDate = createdAt ? new Date(createdAt) : null;

  return {
    orderNumber: toText(row.order_number, "BNB-UNKNOWN"),
    customerName: toText(row.customer_name, "Unknown Customer"),
    customerPhone: toText(row.customer_phone, ""),
    customerAddress: toText(row.customer_address, "N/A"),
    customerCity: toText(row.customer_city, "N/A"),
    total: toNumber(row.total),
    paymentMethod: toPaymentMethod(row.payment_method),
    paymentStatus: normalizeKey(row.payment_status, "pending"),
    orderStatus: normalizeKey(row.order_status, "new"),
    createdAt,
    createdAtDate:
      createdAtDate && !Number.isNaN(createdAtDate.getTime()) ? createdAtDate : null,
  };
}

function calculateCustomerScore(totalOrders: number, cancelledOrders: number) {
  const score = 60 + totalOrders * 8 - cancelledOrders * 15;

  return Math.max(0, Math.min(100, score));
}

function formatPaymentMethods(orders: NormalizedOrder[]) {
  const methods = [...new Set(orders.map((order) => order.paymentMethod))];

  if (methods.includes("bKash") && methods.includes("COD")) {
    return "bKash + COD";
  }

  return methods.join(" + ") || "N/A";
}

function formatDate(value: string) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function normalizePhoneKey(phone: string) {
  return phone.replace(/\D/g, "");
}

function toText(value: unknown, fallback: string) {
  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

function toNumber(value: unknown) {
  const numericValue = Number(
    typeof value === "string" ? value.replace(/[^0-9.-]/g, "") : value,
  );

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function normalizeKey(value: unknown, fallback: string) {
  return toText(value, fallback).toLowerCase().replace(/[\s-]+/g, "_");
}

function toPaymentMethod(value: unknown) {
  const normalizedValue = normalizeKey(value, "cod");

  if (normalizedValue === "bkash") {
    return "bKash";
  }

  if (normalizedValue === "cod") {
    return "COD";
  }

  return toTitleCase(normalizedValue);
}

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
