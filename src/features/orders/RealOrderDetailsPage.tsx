import Link from "next/link";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import { OrderDocumentsPreview } from "./OrderDocumentsPreview";
import { OrderStatusForm } from "./OrderStatusForm";
import type { OrderDetailsRecord } from "./orders-data";

type RealOrderDetailsPageProps = {
  order: OrderDetailsRecord | null;
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const className = {
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    default: "bg-slate-100 text-slate-600",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize ${className}`}
    >
      {children}
    </span>
  );
}

function BackLink() {
  return (
    <Link
      className="inline-flex rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-bold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white"
      href="/orders"
    >
      Back to Orders
    </Link>
  );
}

function Card({
  action,
  children,
  eyebrow,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  eyebrow?: string;
  title: string;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          {eyebrow ? (
            <div className="text-sm font-medium text-slate-500">{eyebrow}</div>
          ) : null}
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="max-w-[65%] text-right font-bold text-slate-800">
        {value}
      </dd>
    </div>
  );
}

function InfoTile({
  helper,
  label,
  value,
}: {
  helper?: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-stone-50 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-bold text-slate-900">{value}</div>
      {helper ? <div className="mt-1 text-sm text-slate-600">{helper}</div> : null}
    </div>
  );
}

function StatCard({
  helper,
  icon,
  label,
  tone = "good",
  value,
}: {
  helper: string;
  icon: string;
  label: string;
  tone?: BadgeTone;
  value: ReactNode;
}) {
  const helperClassName = {
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    default: "bg-stone-50 text-slate-600",
  }[tone];

  return (
    <div className="group relative overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5E7F85]/5 transition group-hover:bg-[#5E7F85]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 truncate text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xs font-bold text-[#5E7F85] transition group-hover:bg-[#5E7F85] group-hover:text-white">
          {icon}
        </div>
      </div>
      <div
        className={`relative mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${helperClassName}`}
      >
        {helper}
      </div>
    </div>
  );
}

function DisabledButton({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "brand" | "good" | "bad";
}) {
  const className = {
    default: "border-slate-300 bg-white text-slate-400",
    brand: "border-[#5E7F85]/20 bg-[#5E7F85]/10 text-[#5E7F85]",
    good: "border-emerald-200 bg-emerald-50 text-emerald-700",
    bad: "border-rose-200 bg-rose-50 text-rose-700",
  }[tone];

  return (
    <button
      className={`rounded-2xl border px-4 py-3 text-sm font-semibold opacity-70 ${className}`}
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function getOrderStatusTone(status: string): BadgeTone {
  if (status === "delivered" || status === "packed") return "good";
  if (status === "cancelled" || status === "returned") return "bad";
  if (status === "new" || status === "processing") return "warn";
  return "brand";
}

function getPaymentStatusTone(status: string): BadgeTone {
  if (status === "paid") return "good";
  if (status === "failed" || status === "refunded") return "bad";
  return "warn";
}

function getCourierStatusTone(status: string | null): BadgeTone {
  if (status === "delivered") return "good";
  if (status === "returned" || status === "failed") return "bad";
  if (status === "sent" || status === "ready") return "brand";
  return "default";
}

function getRiskLabel(order: OrderDetailsRecord) {
  if (order.order_status === "cancelled" || order.order_status === "returned") {
    return "High";
  }

  if (order.due_amount > 0 || order.order_status === "new") {
    return "Medium";
  }

  return "Low";
}

function getRiskTone(order: OrderDetailsRecord): BadgeTone {
  const risk = getRiskLabel(order);
  if (risk === "High") return "bad";
  if (risk === "Medium") return "warn";
  return "good";
}

function getRiskScore(order: OrderDetailsRecord) {
  let score = 18;
  if (order.order_status === "new") score += 24;
  if (order.due_amount > 0) score += 18;
  if (order.order_status === "cancelled" || order.order_status === "returned") {
    score += 34;
  }
  if (order.district && order.district !== "Dhaka") score += 6;
  return Math.min(score, 100);
}

function getTimelineState(value: string | null, isCurrent: boolean) {
  if (value) return "done";
  return isCurrent ? "active" : "wait";
}

function formatStatus(value: string | null) {
  return value ? value.replaceAll("_", " ") : "not set";
}

function formatText(value: string | null) {
  return value || "Not available";
}

function formatBoolean(value: boolean) {
  return value ? "Yes" : "No";
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-BD", {
    currency: "BDT",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getNextStepText(order: OrderDetailsRecord) {
  if (order.order_status === "new") {
    return "Confirm customer details before packing.";
  }

  if (order.order_status === "confirmed" || order.order_status === "processing") {
    return "Move this order toward Packing Desk.";
  }

  if (order.order_status === "packed") {
    return "Review courier handoff before shipping.";
  }

  if (order.order_status === "cancelled" || order.order_status === "returned") {
    return "Review stock restoration and customer note.";
  }

  return "Update order, payment, and courier status safely.";
}

export function RealOrderDetailsPage({ order }: RealOrderDetailsPageProps) {
  if (!order) {
    return (
      <AdminShell>
        <div className="space-y-6">
          <BackLink />
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5E7F85]">
                  Order Operations
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                  Order Details
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  This order could not be found. Return to the live Orders list
                  and open a details link from an existing order.
                </p>
              </div>
              <Badge tone="default">Read Only</Badge>
            </div>
          </section>
        </div>
      </AdminShell>
    );
  }

  const totalItems = order.order_items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const orderNumber = order.order_number ?? "No order number";
  const timeline = [
    { label: "Order Placed", value: order.created_at },
    { label: "Confirmed", value: order.confirmed_at },
    { label: "Packed", value: order.packed_at },
    { label: "Courier Sent", value: order.shipped_at },
    { label: "Delivered", value: order.delivered_at },
    { label: "Returned", value: order.returned_at },
  ];
  const firstPendingIndex = timeline.findIndex((item) => !item.value);
  const riskScore = getRiskScore(order);

  return (
    <AdminShell>
      <div className="space-y-6">
        <BackLink />

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Order {orderNumber}
                </h1>
                <Badge tone={getOrderStatusTone(order.order_status)}>
                  {formatStatus(order.order_status)}
                </Badge>
                <Badge tone={getRiskTone(order)}>
                  {getRiskLabel(order)} Risk
                </Badge>
              </div>
              <div className="mt-2 text-sm text-slate-500">
                Created {formatDate(order.created_at)} - Source{" "}
                {formatText(order.source)} - {formatStatus(order.payment_status)}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-stone-50"
                href={`/orders/details/invoice?id=${order.id}`}
              >
                Print Invoice
              </Link>
              <DisabledButton tone="good">WhatsApp</DisabledButton>
              <DisabledButton tone="brand">Confirm / Update</DisabledButton>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper={order.due_amount > 0 ? "COD receivable" : "Paid or settled"}
            icon="BDT"
            label="Order Total"
            value={formatMoney(order.total)}
          />
          <StatCard
            helper={`${order.order_items.length} product rows`}
            icon="List"
            label="Items"
            value={totalItems}
          />
          <StatCard
            helper={riskScore >= 50 ? "Call before dispatch" : "Normal review"}
            icon="Risk"
            label="Risk Score"
            tone={riskScore >= 50 ? "warn" : "good"}
            value={`${riskScore}/100`}
          />
          <StatCard
            helper={formatStatus(order.courier_status)}
            icon="Go"
            label="Courier"
            value={formatText(order.courier_name)}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <Card
              action={<DisabledButton>Edit</DisabledButton>}
              eyebrow="Customer & Delivery"
              title="Shipping Details"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <InfoTile
                  helper={order.customer_phone}
                  label="Customer"
                  value={order.customer_name}
                />
                <InfoTile
                  helper={`${formatText(order.district)} / ${formatText(
                    order.area,
                  )}`}
                  label="Address"
                  value={formatText(order.customer_address)}
                />
                <InfoTile
                  helper={formatText(order.customer_email)}
                  label="Email"
                  value={formatText(order.customer_email)}
                />
                <InfoTile
                  helper={formatText(order.note)}
                  label="Delivery Zone"
                  value={formatText(order.delivery_zone)}
                />
              </div>
            </Card>

            <Card
              action={<Badge tone="brand">{totalItems} items</Badge>}
              eyebrow="Products"
              title="Ordered Items"
            >
              {order.order_items.length ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-slate-500">
                      <tr>
                        {["Product", "Stock", "Qty", "Total"].map((heading) => (
                          <th
                            className={`px-4 py-3 font-medium ${
                              heading === "Qty" ? "text-center" : ""
                            } ${heading === "Total" ? "text-right" : ""}`}
                            key={heading}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {order.order_items.map((item) => (
                        <tr className="border-t border-slate-100" key={item.id}>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-slate-900">
                              {item.product_name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatText(item.product_brand)} / SKU{" "}
                              {formatText(item.product_sku)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge tone={item.product_id ? "good" : "warn"}>
                              {item.product_id ? "Linked" : "Snapshot"}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-center font-semibold">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-4 text-right font-bold">
                            {formatMoney(item.total_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-2xl bg-stone-50 p-6 text-sm text-slate-500">
                  No order items found for this order.
                </div>
              )}
            </Card>

            <Card
              action={<Badge tone="brand">Live</Badge>}
              eyebrow="Order Progress"
              title="Status Timeline"
            >
              <div className="grid gap-2 md:grid-cols-3">
                {timeline.map((item, index) => {
                  const state = getTimelineState(
                    item.value,
                    firstPendingIndex === index,
                  );

                  return (
                    <div
                      className="flex gap-2 rounded-xl bg-stone-50 px-3 py-2.5"
                      key={item.label}
                    >
                      <div
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                          state === "done"
                            ? "bg-emerald-500"
                            : state === "active"
                              ? "bg-[#5E7F85]"
                              : "bg-slate-200"
                        }`}
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {state === "active" ? "Current step" : formatDate(item.value)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card eyebrow="Internal Notes" title="Notes">
              <div className="space-y-3">
                <textarea
                  className="h-20 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 outline-none"
                  defaultValue={formatText(order.note)}
                  disabled
                />
                <DisabledButton>Save Notes</DisabledButton>
              </div>
            </Card>

            <OrderDocumentsPreview order={order} />

            <Card eyebrow="Inventory Safety" title="Stock Sync">
              <dl className="space-y-3">
                <DetailRow
                  label="Stock Deducted"
                  value={formatBoolean(order.stock_deducted)}
                />
                <DetailRow
                  label="Deducted At"
                  value={formatDate(order.stock_deducted_at)}
                />
                <DetailRow
                  label="Stock Restored"
                  value={formatBoolean(order.stock_restored)}
                />
                <DetailRow
                  label="Restored At"
                  value={formatDate(order.stock_restored_at)}
                />
              </dl>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card title="Action Center">
              <div className="rounded-2xl border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5E7F85]">
                  Next Step
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-800">
                  {getNextStepText(order)}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Stock deduction/restoration remains controlled by the existing
                  status action safeguards.
                </div>
              </div>

              <OrderStatusForm
                courierStatus={order.courier_status}
                orderId={order.id}
                orderStatus={order.order_status}
                paymentStatus={order.payment_status}
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <DisabledButton>Call Customer</DisabledButton>
                <DisabledButton tone="good">WhatsApp</DisabledButton>
                <DisabledButton tone="brand">Move to Packing</DisabledButton>
                <DisabledButton tone="bad">Cancel Order</DisabledButton>
              </div>
            </Card>

            <Card title="Courier Block">
              <dl className="space-y-3 text-sm">
                <DetailRow
                  label="Partner"
                  value={formatText(order.courier_name)}
                />
                <DetailRow
                  label="Tracking ID"
                  value={formatText(order.courier_tracking_id)}
                />
                <DetailRow
                  label="Status"
                  value={
                    <Badge tone={getCourierStatusTone(order.courier_status)}>
                      {formatStatus(order.courier_status)}
                    </Badge>
                  }
                />
                <DetailRow
                  label="Note"
                  value={formatText(order.courier_note)}
                />
              </dl>
              <div className="mt-5">
                <DisabledButton tone="brand">Send Courier</DisabledButton>
              </div>
            </Card>

            <Card title="Payment Summary">
              <dl className="space-y-3 text-sm">
                <DetailRow
                  label="Subtotal"
                  value={formatMoney(order.subtotal)}
                />
                <DetailRow
                  label="Delivery"
                  value={formatMoney(order.delivery_charge)}
                />
                <DetailRow
                  label="Discount"
                  value={formatMoney(order.discount)}
                />
                <DetailRow
                  label="Paid Amount"
                  value={formatMoney(order.paid_amount)}
                />
                <DetailRow
                  label="Due Amount"
                  value={formatMoney(order.due_amount)}
                />
                <DetailRow
                  label="Payment"
                  value={
                    <Badge tone={getPaymentStatusTone(order.payment_status)}>
                      {formatStatus(order.payment_status)}
                    </Badge>
                  }
                />
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                  <span className="font-bold text-slate-900">Total COD</span>
                  <b className="text-slate-950">{formatMoney(order.total)}</b>
                </div>
              </dl>
            </Card>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
