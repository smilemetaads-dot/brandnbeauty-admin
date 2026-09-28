import { fetchLiveCustomers, type LiveCustomerRecord } from "@/features/customers/live-customers-client";

export type GrowthQueueReason = "Return recovery" | "Repeat customer" | "Post-delivery" | "Active order";
export type CustomerGrowthQueueItem = { customer: LiveCustomerRecord; priority: "high" | "medium" | "low"; reason: GrowthQueueReason; nextAction: string; };

export async function loadCustomerGrowth(signal?: AbortSignal) {
  const customers = await fetchLiveCustomers(signal);
  const queue: CustomerGrowthQueueItem[] = customers.flatMap((customer) => {
    const items: CustomerGrowthQueueItem[] = [];
    if (customer.returnedCount > 0) items.push({ customer, priority: customer.returnedCount >= 2 ? "high" : "medium", reason: "Return recovery", nextAction: "Review return history and contact the customer manually before any new recommendation." });
    if (customer.orderCount >= 2 && customer.returnedCount === 0) items.push({ customer, priority: "medium", reason: "Repeat customer", nextAction: "Review purchase history and consider a human-approved reorder or routine follow-up." });
    else if (customer.deliveredCount > 0 && customer.returnedCount === 0) items.push({ customer, priority: "low", reason: "Post-delivery", nextAction: "Check satisfaction and usage before suggesting a repeat purchase." });
    if (customer.activeCount > 0) items.push({ customer, priority: "medium", reason: "Active order", nextAction: "Keep order communication aligned with the canonical order status." });
    return items;
  });
  const rank = { high: 0, medium: 1, low: 2 };
  queue.sort((a,b) => rank[a.priority]-rank[b.priority] || (b.customer.lastOrderAt||"").localeCompare(a.customer.lastOrderAt||""));
  return { customers, queue, summary: {
    totalCustomers: customers.length,
    repeatCustomers: customers.filter(c=>c.orderCount>=2).length,
    deliveredCustomers: customers.filter(c=>c.deliveredCount>0).length,
    returnRecovery: customers.filter(c=>c.returnedCount>0).length,
    activeCustomers: customers.filter(c=>c.activeCount>0).length,
  }};
}
