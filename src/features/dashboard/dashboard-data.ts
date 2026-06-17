import "server-only";

export type DashboardInventoryMovement = {
  created_at: string | null;
  id: string;
  movement_type: string;
  new_stock: number;
  previous_stock: number;
  product_name: string | null;
  product_sku: string | null;
  quantity: number;
};

export type DashboardRecentProduct = {
  created_at: string | null;
  id: number;
  image_url: string | null;
  price: number;
  product_name: string;
  status: string;
  stock_quantity: number;
};

export type DashboardSummary = {
  codDue: number;
  courierQueue: number;
  deliveredOrders: number;
  latestInventoryMovements: DashboardInventoryMovement[];
  lowStockProducts: number;
  newOrders: number;
  outOfStockProducts: number;
  packedOrders: number;
  packingQueue: number;
  recentProducts: DashboardRecentProduct[];
  returnedOrders: number;
  shippedOrders: number;
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
};

const defaultSummary: DashboardSummary = {
  codDue: 0,
  courierQueue: 0,
  deliveredOrders: 0,
  latestInventoryMovements: [],
  lowStockProducts: 0,
  newOrders: 0,
  outOfStockProducts: 0,
  packedOrders: 0,
  packingQueue: 0,
  recentProducts: [],
  returnedOrders: 0,
  shippedOrders: 0,
  totalOrders: 0,
  totalProducts: 0,
  totalRevenue: 0,
};

const DASHBOARD_DATA_ENDPOINT =
  "http://localhost/BrandnBeauty/brandnbeauty-backend/php/get_dashboard_data.php";

function toNumber(value: unknown) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function toStringOrNull(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function normalizeMovement(value: unknown): DashboardInventoryMovement | null {
  if (!value || typeof value !== "object") return null;

  const movement = value as Record<string, unknown>;

  return {
    created_at: toStringOrNull(movement.created_at),
    id: String(movement.id ?? ""),
    movement_type: String(movement.movement_type ?? "product_added"),
    new_stock: toNumber(movement.new_stock),
    previous_stock: toNumber(movement.previous_stock),
    product_name: toStringOrNull(movement.product_name),
    product_sku: toStringOrNull(movement.product_sku),
    quantity: toNumber(movement.quantity),
  };
}

function normalizeRecentProduct(value: unknown): DashboardRecentProduct | null {
  if (!value || typeof value !== "object") return null;

  const product = value as Record<string, unknown>;
  const productName = String(product.product_name ?? "").trim();

  if (!productName) return null;

  return {
    created_at: toStringOrNull(product.created_at),
    id: toNumber(product.id),
    image_url: toStringOrNull(product.image_url),
    price: toNumber(product.price),
    product_name: productName,
    status: String(product.status ?? "draft"),
    stock_quantity: toNumber(product.stock_quantity),
  };
}

function normalizeDashboardSummary(value: unknown): DashboardSummary {
  if (!value || typeof value !== "object") return defaultSummary;

  const summary = value as Record<string, unknown>;
  const latestInventoryMovements = Array.isArray(
    summary.latestInventoryMovements,
  )
    ? summary.latestInventoryMovements
        .map(normalizeMovement)
        .filter((movement): movement is DashboardInventoryMovement =>
          Boolean(movement),
        )
    : [];
  const recentProducts = Array.isArray(summary.recentProducts)
    ? summary.recentProducts
        .map(normalizeRecentProduct)
        .filter((product): product is DashboardRecentProduct =>
          Boolean(product),
        )
    : [];

  return {
    codDue: toNumber(summary.codDue),
    courierQueue: toNumber(summary.courierQueue),
    deliveredOrders: toNumber(summary.deliveredOrders),
    latestInventoryMovements,
    lowStockProducts: toNumber(summary.lowStockProducts),
    newOrders: toNumber(summary.newOrders),
    outOfStockProducts: toNumber(summary.outOfStockProducts),
    packedOrders: toNumber(summary.packedOrders),
    packingQueue: toNumber(summary.packingQueue),
    recentProducts,
    returnedOrders: toNumber(summary.returnedOrders),
    shippedOrders: toNumber(summary.shippedOrders),
    totalOrders: toNumber(summary.totalOrders),
    totalProducts: toNumber(summary.totalProducts),
    totalRevenue: toNumber(summary.totalRevenue),
  };
}

export async function getDashboardSummaryFromPhp(): Promise<DashboardSummary> {
  try {
    const response = await fetch(DASHBOARD_DATA_ENDPOINT, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to load dashboard summary from PHP endpoint.");
      return defaultSummary;
    }

    const payload = (await response.json()) as {
      success?: boolean;
      summary?: unknown;
    };

    if (!payload.success) {
      console.error("PHP dashboard endpoint returned an unsuccessful response.");
      return defaultSummary;
    }

    return normalizeDashboardSummary(payload.summary);
  } catch {
    console.error("Failed to initialize PHP dashboard summary data source.");
    return defaultSummary;
  }
}
