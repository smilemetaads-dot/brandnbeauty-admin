import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type FinanceMetrics = {
  totalRevenue: number;
  unpaidCodAmount: number;
  todayRevenue: number;
  monthRevenue: number;
  deliveredOrderCount: number;
  cancelledOrderValue: number;
  returnedOrderValue: number;
  averageOrderValue: number;
  pendingReceivable: number;
};

export type FinanceSnapshotItem = {
  label: string;
  value: string;
};

export type FinanceLineItem = {
  label: string;
  value: string;
  highlight?: boolean;
};

export type FinanceCheckItem = {
  label: string;
  value: string;
  status: string;
};

export type FinanceLogItem = {
  time: string;
  text: string;
};

export type FinanceData = {
  metrics: FinanceMetrics;
  snapshotItems: FinanceSnapshotItem[];
  lineItems: FinanceLineItem[];
  checkItems: FinanceCheckItem[];
  logItems: FinanceLogItem[];
};

type OrderRow = {
  order_number?: string | null;
  customer_name?: string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  order_status?: string | null;
  total?: number | string | null;
  created_at?: string | null;
};

export async function getFinanceDataFromSupabase(): Promise<FinanceData> {
  const supabase = createSupabaseAdminClient();

  const fallbackMetrics: FinanceMetrics = {
    totalRevenue: 0,
    unpaidCodAmount: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    deliveredOrderCount: 0,
    cancelledOrderValue: 0,
    returnedOrderValue: 0,
    averageOrderValue: 0,
    pendingReceivable: 0,
  };

  if (!supabase) {
    return buildFinanceData([], fallbackMetrics);
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      "order_number, customer_name, payment_method, payment_status, order_status, total, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin-finance] Orders query failed:", {
      table: "public.orders",
      code: error.code,
      message: error.message,
    });
    return buildFinanceData([], fallbackMetrics);
  }

  const orders = ((data ?? []) as OrderRow[]).map(mapOrderRow);
  const metrics = calculateFinanceMetrics(orders);
  return buildFinanceData(orders, metrics);
}

function buildFinanceData(
  orders: ReturnType<typeof mapOrderRow>[],
  metrics: FinanceMetrics,
): FinanceData {
  const latestOrder = orders[0];

  return {
    metrics,
    snapshotItems: [
      ["Customer", latestOrder?.customerName ?? "N/A"],
      ["Payment Type", latestOrder?.paymentMethod ?? "N/A"],
      ["Latest Order", latestOrder?.orderNumber ?? "N/A"],
      ["Collected Revenue", formatCurrency(metrics.totalRevenue)],
      ["This Month", formatCurrency(metrics.monthRevenue)],
      ["Today Revenue", formatCurrency(metrics.todayRevenue)],
      ["Pending Receivable", formatCurrency(metrics.pendingReceivable)],
      ["Delivered Orders", String(metrics.deliveredOrderCount)],
    ].map(([label, value]) => ({ label, value })),
    lineItems: [
      {
        label: "Total Revenue",
        value: formatCurrency(metrics.totalRevenue),
      },
      {
        label: "Unpaid COD",
        value: formatCurrency(metrics.unpaidCodAmount),
      },
      {
        label: "Today Revenue",
        value: formatCurrency(metrics.todayRevenue),
      },
      {
        label: "This Month Revenue",
        value: formatCurrency(metrics.monthRevenue),
      },
      {
        label: "Average Order Value",
        value: formatCurrency(metrics.averageOrderValue),
      },
      {
        label: "Pending Receivable",
        value: formatCurrency(metrics.pendingReceivable),
        highlight: true,
      },
    ],
    checkItems: [
      {
        label: "Delivered Order Count",
        value: String(metrics.deliveredOrderCount),
        status: "Live",
      },
      {
        label: "Cancelled Order Value",
        value: formatCurrency(metrics.cancelledOrderValue),
        status: metrics.cancelledOrderValue > 0 ? "Watch" : "Clear",
      },
      {
        label: "Returned Order Value",
        value: formatCurrency(metrics.returnedOrderValue),
        status: metrics.returnedOrderValue > 0 ? "Watch" : "Clear",
      },
      {
        label: "Pending Receivable",
        value: formatCurrency(metrics.pendingReceivable),
        status: metrics.pendingReceivable > 0 ? "Needs review" : "Matched",
      },
    ],
    logItems: buildFinanceLogItems(orders, metrics),
  };
}

function calculateFinanceMetrics(orders: ReturnType<typeof mapOrderRow>[]): FinanceMetrics {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  const deliveredPaidOrders = orders.filter(
    (order) =>
      order.orderStatusNormalized === "delivered" &&
      ["paid", "verified"].includes(order.paymentStatusNormalized),
  );
  const revenueOrders = deliveredPaidOrders;
  const totalRevenue = revenueOrders.reduce((sum, order) => sum + order.total, 0);
  const unpaidCodOrders = orders.filter(
    (order) =>
      order.paymentMethodNormalized === "cod" &&
      !["paid", "verified"].includes(order.paymentStatusNormalized),
  );
  const unpaidCodAmount = unpaidCodOrders.reduce((sum, order) => sum + order.total, 0);
  const todayRevenue = revenueOrders
    .filter((order) => {
      if (!order.createdAtDate) return false;
      return (
        order.createdAtDate.getFullYear() === currentYear &&
        order.createdAtDate.getMonth() === currentMonth &&
        order.createdAtDate.getDate() === currentDate
      );
    })
    .reduce((sum, order) => sum + order.total, 0);
  const monthRevenue = revenueOrders
    .filter((order) => {
      if (!order.createdAtDate) return false;
      return (
        order.createdAtDate.getFullYear() === currentYear &&
        order.createdAtDate.getMonth() === currentMonth
      );
    })
    .reduce((sum, order) => sum + order.total, 0);
  const deliveredOrderCount = orders.filter(
    (order) => order.orderStatusNormalized === "delivered",
  ).length;
  const cancelledOrderValue = orders
    .filter((order) => order.orderStatusNormalized === "cancelled")
    .reduce((sum, order) => sum + order.total, 0);
  const returnedOrderValue = orders
    .filter((order) => order.orderStatusNormalized === "returned")
    .reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue =
    orders.length > 0
      ? Math.round(
          orders.reduce((sum, order) => sum + order.total, 0) / orders.length,
        )
      : 0;
  const pendingReceivable = unpaidCodAmount;

  return {
    totalRevenue,
    unpaidCodAmount,
    todayRevenue,
    monthRevenue,
    deliveredOrderCount,
    cancelledOrderValue,
    returnedOrderValue,
    averageOrderValue,
    pendingReceivable,
  };
}

function buildFinanceLogItems(
  orders: ReturnType<typeof mapOrderRow>[],
  metrics: FinanceMetrics,
) {
  const orderLogs = orders.slice(0, 3).map((order) => ({
    time: formatTime(order.createdAt),
    text: `${order.orderNumber} from ${order.customerName} is ${toTitleCase(
      order.orderStatusNormalized || "new",
    )} with ${order.paymentMethod}.`,
  }));

  return [
    {
      time: formatTime(new Date().toISOString()),
      text: `Live paid revenue now stands at ${formatCurrency(metrics.totalRevenue)}.`,
    },
    {
      time: formatTime(new Date().toISOString()),
      text: `Pending COD receivable is ${formatCurrency(metrics.pendingReceivable)}.`,
    },
    ...orderLogs,
  ].slice(0, 4);
}

function mapOrderRow(row: OrderRow) {
  const createdAt = toText(row.created_at, "");
  const createdAtDate = createdAt ? new Date(createdAt) : null;

  return {
    orderNumber: toText(row.order_number, "BNB-UNKNOWN"),
    customerName: toText(row.customer_name, "Unknown Customer"),
    paymentMethod: toPaymentMethod(row.payment_method),
    paymentMethodNormalized: toText(row.payment_method, "").toLowerCase(),
    paymentStatusNormalized: toText(row.payment_status, "").toLowerCase(),
    orderStatusNormalized: toText(row.order_status, "new").toLowerCase(),
    total: toNumber(row.total),
    createdAt,
    createdAtDate:
      createdAtDate && !Number.isNaN(createdAtDate.getTime()) ? createdAtDate : null,
  };
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

function toPaymentMethod(value: unknown) {
  const normalizedValue = toText(value, "").toLowerCase();

  if (normalizedValue === "bkash") {
    return "bKash";
  }

  if (normalizedValue === "cod" || !normalizedValue) {
    return "COD";
  }

  return toText(value, "COD");
}

function formatCurrency(amount: number) {
  return `Tk ${amount.toLocaleString()}`;
}

function formatTime(value: string) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
