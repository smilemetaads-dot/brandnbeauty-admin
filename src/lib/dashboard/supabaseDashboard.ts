import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type DashboardStats = {
  totalOrders: number;
  newPendingOrders: number;
  inFlightOrders: number;
  deliveredOrders: number;
  cancelledReturnedOrders: number;
  totalRevenue: number;
  unpaidCodAmount: number;
  lowStockProductCount: number;
  outOfStockProductCount: number;
  totalProducts: number;
};

export type DashboardRecentOrder = {
  id: string;
  customer: string;
  location: string;
  payment: string;
  amount: number;
  status: string;
};

export type DashboardLowStockItem = {
  name: string;
  brand: string;
  stock: number;
};

export type DashboardTopProduct = {
  name: string;
  sales: number;
};

export type DashboardData = {
  stats: DashboardStats;
  recentOrders: DashboardRecentOrder[];
  lowStock: DashboardLowStockItem[];
  topProducts: DashboardTopProduct[];
};

type OrderRow = {
  id?: string | number | null;
  order_number?: string | null;
  customer_name?: string | null;
  customer_city?: string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  order_status?: string | null;
  total?: number | string | null;
  created_at?: string | null;
};

type ProductRow = {
  id?: string | number | null;
  name?: string | null;
  brand?: string | null;
  stock?: number | string | null;
  status?: string | null;
};

type OrderItemRow = {
  product_id?: string | number | null;
  product_name?: string | null;
  total_price?: number | string | null;
};

export async function getDashboardDataFromSupabase(): Promise<DashboardData> {
  const supabase = createSupabaseAdminClient();

  const fallback: DashboardData = {
    stats: {
      totalOrders: 0,
      newPendingOrders: 0,
      inFlightOrders: 0,
      deliveredOrders: 0,
      cancelledReturnedOrders: 0,
      totalRevenue: 0,
      unpaidCodAmount: 0,
      lowStockProductCount: 0,
      outOfStockProductCount: 0,
      totalProducts: 0,
    },
    recentOrders: [],
    lowStock: [],
    topProducts: [],
  };

  if (!supabase) {
    console.warn("[admin-dashboard] Supabase service role config missing.");
    return fallback;
  }

  const [{ data: ordersData, error: ordersError }, { data: productsData, error: productsError }, { data: orderItemsData, error: orderItemsError }] =
    await Promise.all([
      supabase
        .from("orders")
        .select(
          "id, order_number, customer_name, customer_city, payment_method, payment_status, order_status, total, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase.from("products").select("id, name, brand, stock, status"),
      supabase.from("order_items").select("product_id, product_name, total_price"),
    ]);

  if (ordersError) {
    console.error("[admin-dashboard] Orders query failed:", ordersError.message);
  }

  if (productsError) {
    console.error("[admin-dashboard] Products query failed:", productsError.message);
  }

  if (orderItemsError) {
    console.error("[admin-dashboard] Order items query failed:", orderItemsError.message);
  }

  const orders = ((ordersData ?? []) as OrderRow[]).map(mapOrderRow);
  const products = ((productsData ?? []) as ProductRow[]).map(mapProductRow);
  const orderItems = ((orderItemsData ?? []) as OrderItemRow[]).map(mapOrderItemRow);

  const newPendingOrders = orders.filter((order) =>
    ["new", "pending"].includes(order.orderStatusNormalized),
  ).length;
  const inFlightOrders = orders.filter((order) =>
    ["confirmed", "processing", "shipped"].includes(order.orderStatusNormalized),
  ).length;
  const deliveredOrders = orders.filter(
    (order) => order.orderStatusNormalized === "delivered",
  ).length;
  const cancelledReturnedOrders = orders.filter((order) =>
    ["cancelled", "returned"].includes(order.orderStatusNormalized),
  ).length;
  const totalRevenue = orders
    .filter(
      (order) =>
        order.orderStatusNormalized === "delivered" &&
        ["paid", "verified"].includes(order.paymentStatusNormalized),
    )
    .reduce((sum, order) => sum + order.total, 0);
  const unpaidCodAmount = orders
    .filter(
      (order) =>
        order.paymentMethodNormalized === "cod" &&
        !["paid", "verified"].includes(order.paymentStatusNormalized),
    )
    .reduce((sum, order) => sum + order.total, 0);
  const lowStockProducts = products.filter(
    (product) =>
      product.stock > 0 &&
      (product.statusNormalized === "low_stock" || product.stock <= 15),
  );
  const outOfStockProducts = products.filter(
    (product) =>
      product.statusNormalized === "out_of_stock" || product.stock <= 0,
  );

  return {
    stats: {
      totalOrders: orders.length,
      newPendingOrders,
      inFlightOrders,
      deliveredOrders,
      cancelledReturnedOrders,
      totalRevenue,
      unpaidCodAmount,
      lowStockProductCount: lowStockProducts.length,
      outOfStockProductCount: outOfStockProducts.length,
      totalProducts: products.length,
    },
    recentOrders: orders.slice(0, 5).map((order) => ({
      id: order.orderNumber,
      customer: order.customerName,
      location: order.customerCity,
      payment: order.paymentMethod,
      amount: order.total,
      status: toTitleCase(order.orderStatusNormalized || "new"),
    })),
    lowStock: lowStockProducts
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 4)
      .map((product) => ({
        name: product.name,
        brand: product.brand,
        stock: product.stock,
      })),
    topProducts: getTopProducts(orderItems),
  };
}

function getTopProducts(orderItems: ReturnType<typeof mapOrderItemRow>[]) {
  const groupedProducts = new Map<string, number>();

  for (const item of orderItems) {
    const key = item.productName || "Product";
    groupedProducts.set(key, (groupedProducts.get(key) ?? 0) + item.totalPrice);
  }

  return [...groupedProducts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([name, sales]) => ({ name, sales }));
}

function mapOrderRow(row: OrderRow) {
  return {
    orderNumber: toText(row.order_number, "BNB-UNKNOWN"),
    customerName: toText(row.customer_name, "Unknown Customer"),
    customerCity: toText(row.customer_city, "N/A"),
    paymentMethod: toPaymentMethod(row.payment_method),
    paymentMethodNormalized: toText(row.payment_method, "").toLowerCase(),
    paymentStatusNormalized: toText(row.payment_status, "").toLowerCase(),
    orderStatusNormalized: toText(row.order_status, "new").toLowerCase(),
    total: toNumber(row.total),
  };
}

function mapProductRow(row: ProductRow) {
  return {
    name: toText(row.name, "Untitled Product"),
    brand: toText(row.brand, "BrandnBeauty"),
    stock: toNumber(row.stock),
    statusNormalized: toText(row.status, "active").toLowerCase(),
  };
}

function mapOrderItemRow(row: OrderItemRow) {
  return {
    productName: toText(row.product_name, "Product"),
    totalPrice: toNumber(row.total_price),
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

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
