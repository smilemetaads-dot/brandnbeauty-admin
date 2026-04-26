import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ReportsKpi = {
  label: string;
  value: string;
  sub: string;
};

export type ReportsCard = {
  title: string;
  desc: string;
};

export type ReportsData = {
  kpis: ReportsKpi[];
  reports: ReportsCard[];
  insights: string[];
  recommendations: string[];
};

type OrderRow = {
  id?: string | number | null;
  order_status?: string | null;
  payment_status?: string | null;
  total?: number | string | null;
  created_at?: string | null;
};

type OrderItemRow = {
  order_id?: string | number | null;
  product_name?: string | null;
  quantity?: number | string | null;
  total_price?: number | string | null;
};

type ProductRow = {
  name?: string | null;
  brand?: string | null;
  stock?: number | string | null;
  status?: string | null;
};

type NormalizedOrder = {
  id: string;
  orderStatus: string;
  paymentStatus: string;
  total: number;
  createdAtDate: Date | null;
};

type NormalizedOrderItem = {
  orderId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
};

type NormalizedProduct = {
  name: string;
  brand: string;
  stock: number;
  status: string;
};

const statusOrder = [
  "new",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

const emptyReportsData: ReportsData = buildReportsData([], [], []);

export async function getReportsDataFromSupabase(): Promise<ReportsData> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.warn("[admin-reports] Supabase service role config missing.");
    return emptyReportsData;
  }

  const [
    { data: ordersData, error: ordersError },
    { data: orderItemsData, error: orderItemsError },
    { data: productsData, error: productsError },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_status, payment_status, total, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("order_items")
      .select("order_id, product_name, quantity, total_price"),
    supabase.from("products").select("name, brand, stock, status"),
  ]);

  if (ordersError) {
    console.error("[admin-reports] Orders query failed:", {
      table: "public.orders",
      code: ordersError.code,
      message: ordersError.message,
    });
  }

  if (orderItemsError) {
    console.error("[admin-reports] Order items query failed:", {
      table: "public.order_items",
      code: orderItemsError.code,
      message: orderItemsError.message,
    });
  }

  if (productsError) {
    console.error("[admin-reports] Products query failed:", {
      table: "public.products",
      code: productsError.code,
      message: productsError.message,
    });
  }

  return buildReportsData(
    ((ordersData ?? []) as OrderRow[]).map(mapOrderRow),
    ((orderItemsData ?? []) as OrderItemRow[]).map(mapOrderItemRow),
    ((productsData ?? []) as ProductRow[]).map(mapProductRow),
  );
}

function buildReportsData(
  orders: NormalizedOrder[],
  orderItems: NormalizedOrderItem[],
  products: NormalizedProduct[],
): ReportsData {
  const paidDeliveredOrders = orders.filter(
    (order) =>
      order.orderStatus === "delivered" &&
      ["paid", "verified"].includes(order.paymentStatus),
  );
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(
    (order) => order.orderStatus === "delivered",
  ).length;
  const cancelledReturnedOrders = orders.filter((order) =>
    ["cancelled", "returned"].includes(order.orderStatus),
  ).length;
  const revenue = paidDeliveredOrders.reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue =
    paidDeliveredOrders.length > 0
      ? Math.round(revenue / paidDeliveredOrders.length)
      : 0;
  const returnRate =
    totalOrders > 0 ? (cancelledReturnedOrders / totalOrders) * 100 : 0;
  const lowStockProducts = products
    .filter(
      (product) =>
        product.stock > 0 &&
        (product.status === "low_stock" || product.stock <= 15),
    )
    .sort((left, right) => left.stock - right.stock);
  const statusBreakdown = getStatusBreakdown(orders);
  const topProducts = getTopProducts(orderItems, paidDeliveredOrders);
  const topProductsText = formatTopProducts(topProducts);
  const lowStockText = formatLowStockProducts(lowStockProducts);

  return {
    kpis: [
      {
        label: "Revenue",
        value: formatCurrency(revenue),
        sub: `${paidDeliveredOrders.length} paid delivered`,
      },
      {
        label: "Orders",
        value: String(totalOrders),
        sub: `${deliveredOrders} delivered`,
      },
      {
        label: "Return Rate",
        value: `${returnRate.toFixed(1)}%`,
        sub: `${cancelledReturnedOrders} cancelled/returned`,
      },
      {
        label: "Avg Order Value",
        value: formatCurrency(averageOrderValue),
        sub: "paid delivered orders",
      },
    ],
    reports: [
      {
        title: "Sales Report",
        desc: `${formatCurrency(revenue)} revenue, ${formatCurrency(
          averageOrderValue,
        )} AOV`,
      },
      {
        title: "Order Report",
        desc: `${totalOrders} total, ${deliveredOrders} delivered, ${cancelledReturnedOrders} cancelled/returned`,
      },
      {
        title: "Product Report",
        desc: `${topProductsText}; ${lowStockProducts.length} low stock`,
      },
      {
        title: "Customer Report",
        desc: "VIP, repeat & risky customers",
      },
    ],
    insights: [
      `Delivered orders: ${deliveredOrders} of ${totalOrders} total`,
      `Cancelled/returned orders: ${cancelledReturnedOrders} (${returnRate.toFixed(
        1,
      )}%)`,
      `Order status breakdown: ${formatStatusBreakdown(statusBreakdown)}`,
      `Top selling products: ${topProductsText}`,
    ],
    recommendations: [
      topProducts[0]
        ? `Increase budget on ${topProducts[0].name}`
        : "Increase budget on top performing products",
      lowStockProducts[0]
        ? `Restock ${lowStockProducts[0].name} (${lowStockProducts[0].stock} left)`
        : "Monitor low stock products",
      lowStockProducts.length > 0
        ? `Low stock products: ${lowStockText}`
        : "Review order status mix before changing fulfillment priorities",
    ],
  };
}

function getTopProducts(
  orderItems: NormalizedOrderItem[],
  paidDeliveredOrders: NormalizedOrder[],
) {
  const paidDeliveredOrderIds = new Set(
    paidDeliveredOrders.map((order) => order.id).filter(Boolean),
  );
  const eligibleItems =
    paidDeliveredOrderIds.size > 0
      ? orderItems.filter((item) => paidDeliveredOrderIds.has(item.orderId))
      : orderItems;
  const groupedProducts = new Map<string, { quantity: number; sales: number }>();

  for (const item of eligibleItems) {
    const current = groupedProducts.get(item.productName) ?? {
      quantity: 0,
      sales: 0,
    };
    groupedProducts.set(item.productName, {
      quantity: current.quantity + item.quantity,
      sales: current.sales + item.totalPrice,
    });
  }

  return [...groupedProducts.entries()]
    .map(([name, metrics]) => ({ name, ...metrics }))
    .sort((left, right) => right.quantity - left.quantity || right.sales - left.sales)
    .slice(0, 3);
}

function getStatusBreakdown(orders: NormalizedOrder[]) {
  const groupedStatuses = new Map<string, number>();

  for (const order of orders) {
    groupedStatuses.set(order.orderStatus, (groupedStatuses.get(order.orderStatus) ?? 0) + 1);
  }

  return groupedStatuses;
}

function mapOrderRow(row: OrderRow): NormalizedOrder {
  const createdAt = toText(row.created_at, "");
  const createdAtDate = createdAt ? new Date(createdAt) : null;

  return {
    id: toText(row.id, ""),
    orderStatus: normalizeKey(row.order_status, "new"),
    paymentStatus: normalizeKey(row.payment_status, "pending"),
    total: toNumber(row.total),
    createdAtDate:
      createdAtDate && !Number.isNaN(createdAtDate.getTime()) ? createdAtDate : null,
  };
}

function mapOrderItemRow(row: OrderItemRow): NormalizedOrderItem {
  const quantity = toNumber(row.quantity);

  return {
    orderId: toText(row.order_id, ""),
    productName: toText(row.product_name, "Product"),
    quantity,
    totalPrice: toNumber(row.total_price),
  };
}

function mapProductRow(row: ProductRow): NormalizedProduct {
  return {
    name: toText(row.name, "Untitled Product"),
    brand: toText(row.brand, "BrandnBeauty"),
    stock: toNumber(row.stock),
    status: normalizeKey(row.status, "active"),
  };
}

function formatTopProducts(products: ReturnType<typeof getTopProducts>) {
  if (products.length === 0) {
    return "No product sales yet";
  }

  return products
    .map((product) => `${product.name} (${product.quantity} sold)`)
    .join(", ");
}

function formatLowStockProducts(products: NormalizedProduct[]) {
  if (products.length === 0) {
    return "0 products";
  }

  return products
    .slice(0, 3)
    .map((product) => `${product.name} (${product.stock})`)
    .join(", ");
}

function formatStatusBreakdown(statusBreakdown: Map<string, number>) {
  if (statusBreakdown.size === 0) {
    return "No orders yet";
  }

  return [...statusOrder, ...statusBreakdown.keys()]
    .filter((status, index, statuses) => statuses.indexOf(status) === index)
    .filter((status) => statusBreakdown.has(status))
    .map((status) => `${toTitleCase(status)} ${statusBreakdown.get(status) ?? 0}`)
    .join(", ");
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

function formatCurrency(amount: number) {
  return `Tk ${amount.toLocaleString()}`;
}

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
