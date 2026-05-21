import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const RELEVANT_ORDER_STATUSES = ["delivered", "returned", "shipped", "sent"];
const RELEVANT_PAYMENT_STATUSES = [
  "cod_pending",
  "paid",
  "failed",
  "refunded",
  "partial_paid",
];
const RELEVANT_COURIER_STATUSES = ["sent", "delivered", "returned", "failed"];

export type CodSettlementStatus =
  | "Paid"
  | "Due Pending"
  | "Returned"
  | "Failed"
  | "In Transit"
  | "Review";

export type CodReconciliationOrderRecord = {
  id: string;
  order_number: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  district: string | null;
  area: string | null;
  total: number;
  paid_amount: number;
  due_amount: number;
  order_status: string | null;
  payment_status: string | null;
  courier_status: string | null;
  courier_name: string | null;
  courier_tracking_id: string | null;
  courier_note: string | null;
  delivered_at: string | null;
  returned_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  settlementStatus: CodSettlementStatus;
};

export type CodReconciliationSummary = {
  collectionRate: number;
  codPendingOrders: number;
  deliveredCount: number;
  failedOrders: number;
  mismatchCount: number;
  orders: CodReconciliationOrderRecord[];
  paidOrders: number;
  pendingSettlementCount: number;
  returnedCount: number;
  totalCodExpected: number;
  totalCollected: number;
  totalDue: number;
};

type CodReconciliationOrderRow = Omit<
  CodReconciliationOrderRecord,
  "settlementStatus"
> & {
  due_amount: number | null;
  paid_amount: number | null;
  total: number | null;
};

const defaultSummary: CodReconciliationSummary = {
  collectionRate: 0,
  codPendingOrders: 0,
  deliveredCount: 0,
  failedOrders: 0,
  mismatchCount: 0,
  orders: [],
  paidOrders: 0,
  pendingSettlementCount: 0,
  returnedCount: 0,
  totalCodExpected: 0,
  totalCollected: 0,
  totalDue: 0,
};

function toNumber(value: number | null | undefined) {
  return Number(value ?? 0);
}

function getRatio(numerator: number, denominator: number) {
  if (!denominator) {
    return 0;
  }

  return (numerator / denominator) * 100;
}

function isRelevantCodOrder(order: CodReconciliationOrderRow) {
  const dueAmount = toNumber(order.due_amount);
  const isDeliveredOrReturned =
    order.order_status === "delivered" ||
    order.order_status === "returned" ||
    order.courier_status === "delivered" ||
    order.courier_status === "returned";
  const isSentWithDue =
    (order.order_status === "shipped" ||
      order.order_status === "sent" ||
      order.courier_status === "sent") &&
    dueAmount > 0;
  const hasRelevantPaymentStatus = RELEVANT_PAYMENT_STATUSES.includes(
    order.payment_status ?? "",
  );
  const hasRelevantDue = dueAmount > 0;
  const hasRelevantCourierStatus = RELEVANT_COURIER_STATUSES.includes(
    order.courier_status ?? "",
  );

  return (
    isDeliveredOrReturned ||
    isSentWithDue ||
    hasRelevantPaymentStatus ||
    hasRelevantDue ||
    hasRelevantCourierStatus
  );
}

function getSettlementStatus(
  order: Pick<
    CodReconciliationOrderRecord,
    "courier_status" | "due_amount" | "order_status" | "payment_status"
  >,
): CodSettlementStatus {
  if (order.payment_status === "failed" || order.courier_status === "failed") {
    return "Failed";
  }

  if (order.order_status === "returned" || order.courier_status === "returned") {
    return "Returned";
  }

  if (order.payment_status === "paid" && order.due_amount === 0) {
    return "Paid";
  }

  if (order.due_amount > 0) {
    return "Due Pending";
  }

  if (order.courier_status === "sent") {
    return "In Transit";
  }

  return "Review";
}

function countByStatus(
  orders: CodReconciliationOrderRecord[],
  field: "courier_status" | "order_status" | "payment_status",
  status: string,
) {
  return orders.filter((order) => order[field] === status).length;
}

export async function getCodReconciliationSummaryFromSupabase(): Promise<CodReconciliationSummary> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .select(
        [
          "id",
          "order_number",
          "customer_name",
          "customer_phone",
          "district",
          "area",
          "total",
          "paid_amount",
          "due_amount",
          "order_status",
          "payment_status",
          "courier_status",
          "courier_name",
          "courier_tracking_id",
          "courier_note",
          "delivered_at",
          "returned_at",
          "created_at",
          "updated_at",
        ].join(", "),
      )
      .or(
        [
          `order_status.in.(${RELEVANT_ORDER_STATUSES.join(",")})`,
          `payment_status.in.(${RELEVANT_PAYMENT_STATUSES.join(",")})`,
          `courier_status.in.(${RELEVANT_COURIER_STATUSES.join(",")})`,
          "due_amount.gt.0",
        ].join(","),
      )
      .order("updated_at", { ascending: false })
      .limit(250);

    if (error) {
      console.error("Failed to load COD reconciliation orders from Supabase.");
      return defaultSummary;
    }

    const orders = ((data ?? []) as unknown as CodReconciliationOrderRow[])
      .filter(isRelevantCodOrder)
      .map((order) => {
        const normalizedOrder = {
          ...order,
          due_amount: toNumber(order.due_amount),
          paid_amount: toNumber(order.paid_amount),
          total: toNumber(order.total),
        };

        return {
          ...normalizedOrder,
          settlementStatus: getSettlementStatus(normalizedOrder),
        };
      });

    const totalCodExpected = orders.reduce(
      (sum, order) => sum + order.total,
      0,
    );
    const totalCollected = orders.reduce(
      (sum, order) => sum + order.paid_amount,
      0,
    );
    const totalDue = orders.reduce((sum, order) => sum + order.due_amount, 0);

    return {
      collectionRate: getRatio(totalCollected, totalCodExpected),
      codPendingOrders: countByStatus(orders, "payment_status", "cod_pending"),
      deliveredCount: orders.filter(
        (order) =>
          order.order_status === "delivered" ||
          order.courier_status === "delivered",
      ).length,
      failedOrders: orders.filter(
        (order) =>
          order.payment_status === "failed" || order.courier_status === "failed",
      ).length,
      mismatchCount: orders.filter(
        (order) =>
          order.payment_status === "failed" || order.courier_status === "failed",
      ).length,
      orders,
      paidOrders: countByStatus(orders, "payment_status", "paid"),
      pendingSettlementCount: orders.filter(
        (order) =>
          order.due_amount > 0 &&
          order.order_status !== "returned" &&
          order.order_status !== "cancelled",
      ).length,
      returnedCount: orders.filter(
        (order) =>
          order.order_status === "returned" ||
          order.courier_status === "returned",
      ).length,
      totalCodExpected,
      totalCollected,
      totalDue,
    };
  } catch {
    console.error("Failed to initialize COD reconciliation data source.");
    return defaultSummary;
  }
}
