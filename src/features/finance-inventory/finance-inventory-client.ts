export type FinanceInventoryProduct = {
  created_at: string | null;
  id: string;
  inventory_value: number;
  low_stock: boolean;
  name: string;
  price: number;
  purchase_cost: number;
  sku: string | null;
  status: string;
  stock: number;
  stock_quantity: number;
};

export type FinanceInventoryPurchase = {
  created_at: string | null;
  id: string;
  note: string | null;
  purchase_number: string | null;
  status: string;
  supplier_name: string | null;
  total_cost: number;
};

type FinanceInventoryResponse = {
  inventory?: FinanceInventoryProduct[];
  message?: string;
  purchases?: FinanceInventoryPurchase[];
  success?: boolean;
};

export type FinanceInventoryData = {
  inventory: FinanceInventoryProduct[];
  purchases: FinanceInventoryPurchase[];
};

export const FINANCE_INVENTORY_ENDPOINT =
  "http://localhost/BrandnBeauty/brandnbeauty-backend/php/get_finance_inventory.php";

export async function fetchFinanceInventory(
  signal?: AbortSignal,
): Promise<FinanceInventoryData> {
  const response = await fetch(FINANCE_INVENTORY_ENDPOINT, {
    cache: "no-store",
    signal,
  });
  const payload = (await response.json()) as FinanceInventoryResponse;

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message ?? "Finance inventory request failed.");
  }

  return {
    inventory: Array.isArray(payload.inventory) ? payload.inventory : [],
    purchases: Array.isArray(payload.purchases) ? payload.purchases : [],
  };
}
