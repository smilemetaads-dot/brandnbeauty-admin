import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type CustomerRecentOrderSummary = {
  created_at: string | null;
  due_amount: number;
  id: string;
  order_number: string | null;
  order_status: string;
  payment_status: string;
  total: number;
};

export type CustomerSummaryRecord = {
  address: string | null;
  area: string | null;
  cancelledCount: number;
  deliveredCount: number;
  delivery_zone: string | null;
  district: string | null;
  email: string | null;
  lastOrderAt: string | null;
  lastOrderId: string;
  lastOrderNumber: string | null;
  lastOrderStatus: string;
  name: string;
  orderCount: number;
  phone: string;
  recentOrders: CustomerRecentOrderSummary[];
  returnedCount: number;
  riskLabel: "High Return Risk" | "Due Pending" | "Repeat Customer" | "New Customer";
  totalDue: number;
  totalSpent: number;
};

type CustomerOrderRow = {
  area: string | null;
  courier_status: string | null;
  created_at: string | null;
  customer_address: string | null;
  customer_email: string | null;
  customer_name: string;
  customer_phone: string;
  delivery_zone: string | null;
  district: string | null;
  due_amount: number;
  id: string;
  order_number: string | null;
  order_status: string;
  paid_amount: number;
  payment_status: string;
  total: number;
};

type CustomerAccumulator = {
  address: string | null;
  area: string | null;
  cancelledCount: number;
  deliveredCount: number;
  delivery_zone: string | null;
  district: string | null;
  email: string | null;
  lastOrderAt: string | null;
  lastOrderId: string;
  lastOrderNumber: string | null;
  lastOrderStatus: string;
  name: string;
  orders: CustomerRecentOrderSummary[];
  phone: string;
  returnedCount: number;
  totalDue: number;
  totalSpent: number;
};

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  return digits || phone.trim().toLowerCase();
}

function getRiskLabel(customer: CustomerAccumulator): CustomerSummaryRecord["riskLabel"] {
  if (customer.returnedCount >= 2) {
    return "High Return Risk";
  }

  if (customer.totalDue > 0) {
    return "Due Pending";
  }

  if (customer.orders.length >= 2) {
    return "Repeat Customer";
  }

  return "New Customer";
}

function getCreatedAtTime(value: string | null) {
  return value ? new Date(value).getTime() : 0;
}

export async function getCustomersFromOrdersSupabase(): Promise<
  CustomerSummaryRecord[]
> {
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
          "customer_email",
          "customer_address",
          "district",
          "area",
          "delivery_zone",
          "total",
          "paid_amount",
          "due_amount",
          "order_status",
          "payment_status",
          "courier_status",
          "created_at",
        ].join(", "),
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load customers from order data.");
      return [];
    }

    const customers = new Map<string, CustomerAccumulator>();

    for (const order of (data ?? []) as unknown as CustomerOrderRow[]) {
      const key = normalizePhone(order.customer_phone);
      const existing = customers.get(key);
      const recentOrder: CustomerRecentOrderSummary = {
        created_at: order.created_at,
        due_amount: order.due_amount,
        id: order.id,
        order_number: order.order_number,
        order_status: order.order_status,
        payment_status: order.payment_status,
        total: order.total,
      };

      if (!existing) {
        customers.set(key, {
          address: order.customer_address,
          area: order.area,
          cancelledCount: order.order_status === "cancelled" ? 1 : 0,
          deliveredCount: order.order_status === "delivered" ? 1 : 0,
          delivery_zone: order.delivery_zone,
          district: order.district,
          email: order.customer_email,
          lastOrderAt: order.created_at,
          lastOrderId: order.id,
          lastOrderNumber: order.order_number,
          lastOrderStatus: order.order_status,
          name: order.customer_name,
          orders: [recentOrder],
          phone: order.customer_phone,
          returnedCount: order.order_status === "returned" ? 1 : 0,
          totalDue: order.due_amount,
          totalSpent: order.total,
        });
        continue;
      }

      existing.orders.push(recentOrder);
      existing.totalSpent += order.total;
      existing.totalDue += order.due_amount;
      existing.deliveredCount += order.order_status === "delivered" ? 1 : 0;
      existing.returnedCount += order.order_status === "returned" ? 1 : 0;
      existing.cancelledCount += order.order_status === "cancelled" ? 1 : 0;

      if (getCreatedAtTime(order.created_at) >= getCreatedAtTime(existing.lastOrderAt)) {
        existing.address = order.customer_address ?? existing.address;
        existing.area = order.area ?? existing.area;
        existing.delivery_zone = order.delivery_zone ?? existing.delivery_zone;
        existing.district = order.district ?? existing.district;
        existing.email = order.customer_email ?? existing.email;
        existing.lastOrderAt = order.created_at;
        existing.lastOrderId = order.id;
        existing.lastOrderNumber = order.order_number;
        existing.lastOrderStatus = order.order_status;
        existing.name = order.customer_name || existing.name;
        existing.phone = order.customer_phone || existing.phone;
      }
    }

    return Array.from(customers.values())
      .map((customer) => {
        const recentOrders = customer.orders
          .toSorted((a, b) => getCreatedAtTime(b.created_at) - getCreatedAtTime(a.created_at))
          .slice(0, 3);

        return {
          address: customer.address,
          area: customer.area,
          cancelledCount: customer.cancelledCount,
          deliveredCount: customer.deliveredCount,
          delivery_zone: customer.delivery_zone,
          district: customer.district,
          email: customer.email,
          lastOrderAt: customer.lastOrderAt,
          lastOrderId: customer.lastOrderId,
          lastOrderNumber: customer.lastOrderNumber,
          lastOrderStatus: customer.lastOrderStatus,
          name: customer.name,
          orderCount: customer.orders.length,
          phone: customer.phone,
          recentOrders,
          returnedCount: customer.returnedCount,
          riskLabel: getRiskLabel(customer),
          totalDue: customer.totalDue,
          totalSpent: customer.totalSpent,
        };
      })
      .toSorted((a, b) => getCreatedAtTime(b.lastOrderAt) - getCreatedAtTime(a.lastOrderAt));
  } catch {
    console.error("Failed to initialize customers from order data.");
    return [];
  }
}
