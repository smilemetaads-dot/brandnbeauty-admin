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

const BRAND = "#527B86";

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const className = {
    brand: "bg-[#527B86]/10 text-[#527B86]",
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

function Card({
  eyebrow,
  title,
  action,
  children,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
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

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
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
  label,
  value,
  helper,
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-stone-50 p-4">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 font-bold text-slate-900">{value}</div>
      {helper ? <div className="mt-1 text-sm text-slate-600">{helper}</div> : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  index,
}: {
  label: string;
  value: ReactNode;
  helper: string;
  index: number;
}) {
  const icons = ["৳", "☷", "◈", "▸"];

  return (
    <div className="group relative overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#527B86]/5 transition group-hover:bg-[#527B86]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 truncate text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#527B86]/10 text-xl font-bold text-[#527B86]">
          {icons[index % icons.length]}
        </div>
      </div>
      <div className="relative mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
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
    default:
      "border-slate-300 bg-white text-slate-500",
    brand:
      "border-[#527B86]/20 bg-[#527B86]/10 text-[#527B86]",
    good:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    bad:
      "border-rose-200 bg-rose-50 text-rose-700",
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
  if (status === "delivered") {
    return "good";
  }

  if (status === "cancelled" || status === "returned") {
    return "bad";
  }

  if (status === "new" || status === "processing") {
    return "warn";
  }

  return "brand";
}

function getPaymentStatusTone(status: string): BadgeTone {
  if (status === "paid") {
    return "good";
  }

  if (status === "failed" || status === "refunded") {
    return "bad";
  }

  return "warn";
}

function getCourierStatusTone(status: string | null): BadgeTone {
  if (status === "delivered") {
    return "good";
  }

  if (status === "returned" || status === "failed") {
    return "bad";
  }

  if (status === "sent" || status === "ready") {
    return "brand";
  }

  return "default";
}

function getTimelineState(value: string | null, isCurrent: boolean) {
  if (value) {
    return "done";
  }

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
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function BackLink() {
  return (
    <Link
      className="inline-flex rounded-xl bg-[#527B86]/10 px-3 py-2 text-xs font-bold text-[#527B86] transition hover:bg-[#527B86] hover:text-white"
      href="/orders"
    >
      Back to Orders
    </Link>
  );
}

function NotConnectedLabel() {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
      Not Connected
    </span>
  );
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
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
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
    { label: "Shipped", value: order.shipped_at },
    { label: "Delivered", value: order.delivered_at },
    { label: "Returned", value: order.returned_at },
    { label: "Cancelled", value: order.cancelled_at },
  ];
  const firstPendingIndex = timeline.findIndex((item) => !item.value);

  return (
    <AdminShell>
      <div className="space-y-6">
        <BackLink />

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                  Order {orderNumber}
                </h1>
                <Badge tone={getOrderStatusTone(order.order_status)}>
                  {formatStatus(order.order_status)}
                </Badge>
                <Badge tone={getPaymentStatusTone(order.payment_status)}>
                  {formatStatus(order.payment_status)}
                </Badge>
                <Badge tone={getCourierStatusTone(order.courier_status)}>
                  {formatStatus(order.courier_status)}
                </Badge>
              </div>
              <div className="mt-2 text-sm text-slate-500">
                Created {formatDate(order.created_at)} · Source{" "}
                {formatText(order.source)} · Payment{" "}
                {formatStatus(order.payment_status)}
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Live order details with controlled status updates and one-time
                stock deduction/restoration through guarded RPC calls. Courier
                actions and hard delete are not connected.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DisabledButton>Print Invoice · Not Connected</DisabledButton>
              <DisabledButton tone="good">WhatsApp · Not Connected</DisabledButton>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Live order total"
            index={0}
            label="Order Total"
            value={formatMoney(order.total)}
          />
          <StatCard
            helper={`${order.order_items.length} product rows`}
            index={1}
            label="Items"
            value={totalItems}
          />
          <StatCard
            helper={formatStatus(order.payment_status)}
            index={2}
            label="Due / Payment"
            value={formatMoney(order.due_amount)}
          />
          <StatCard
            helper={formatStatus(order.courier_status)}
            index={3}
            label="Courier"
            value={formatText(order.courier_name)}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <Card
              action={<NotConnectedLabel />}
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
                  helper={formatText(order.customer_email)}
                  label="Email"
                  value={formatText(order.customer_email)}
                />
                <InfoTile
                  helper={`${formatText(order.district)} · ${formatText(
                    order.area,
                  )}`}
                  label="Address"
                  value={formatText(order.customer_address)}
                />
                <InfoTile
                  helper={formatText(order.note)}
                  label="Delivery Zone"
                  value={formatText(order.delivery_zone)}
                />
              </div>
            </Card>

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Products
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Ordered Items
                  </h2>
                </div>
                <Badge tone="brand">{totalItems} items</Badge>
              </div>

              {order.order_items.length ? (
                <div className="overflow-x-auto p-5">
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-stone-50 text-slate-500">
                        <tr>
                          {[
                            "Product",
                            "SKU",
                            "Brand",
                            "Size",
                            "Qty",
                            "Unit Price",
                            "Total",
                          ].map((heading) => (
                            <th
                              className="px-4 py-3 font-medium"
                              key={heading}
                              scope="col"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {order.order_items.map((item) => (
                          <tr
                            className="border-t border-slate-100 bg-white"
                            key={item.id}
                          >
                            <td className="px-4 py-4">
                              <div className="font-bold text-slate-950">
                                {item.product_name}
                              </div>
                              <div className="mt-1 text-xs font-semibold text-slate-400">
                                {formatText(item.product_slug)}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-slate-600">
                              {formatText(item.product_sku)}
                            </td>
                            <td className="px-4 py-4 text-slate-600">
                              {formatText(item.product_brand)}
                            </td>
                            <td className="px-4 py-4 text-slate-600">
                              {formatText(item.product_size)}
                            </td>
                            <td className="px-4 py-4 text-center font-semibold text-slate-800">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-800">
                              {formatMoney(item.unit_price)}
                            </td>
                            <td className="px-4 py-4 text-right font-bold text-slate-900">
                              {formatMoney(item.total_price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-sm text-slate-500">
                  No order items found for this order.
                </div>
              )}
            </section>

            <OrderDocumentsPreview order={order} />

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
                              ? "bg-[#527B86]"
                              : "bg-slate-200"
                        }`}
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {formatDate(item.value)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <dl className="mt-5 grid gap-3 rounded-2xl border border-slate-100 bg-white p-4 md:grid-cols-2">
                <DetailRow label="Updated" value={formatDate(order.updated_at)} />
                <DetailRow
                  label="Current Status"
                  value={formatStatus(order.order_status)}
                />
              </dl>
            </Card>

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

          <div className="space-y-6">
            <Card title="Action Center">
              <div className="rounded-2xl border border-[#527B86]/15 bg-[#527B86]/5 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#527B86]">
                  Next Step
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-800">
                  Update order, payment, and courier status safely.
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Stock deduction runs once for confirmation-stage statuses, and
                  restoration runs once for cancelled or returned status.
                  Courier send and separate cancellation actions remain
                  unavailable in this step.
                </div>
              </div>
              <OrderStatusForm
                courierStatus={order.courier_status}
                orderId={order.id}
                orderStatus={order.order_status}
                paymentStatus={order.payment_status}
              />
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <DisabledButton>Call Customer · Not Connected</DisabledButton>
                <DisabledButton tone="good">
                  WhatsApp · Not Connected
                </DisabledButton>
                <DisabledButton tone="brand">
                  Move to Packing · Not Connected
                </DisabledButton>
                <DisabledButton tone="bad">
                  Cancel Order · Not Connected
                </DisabledButton>
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
                  value={formatStatus(order.courier_status)}
                />
                <DetailRow
                  label="Note"
                  value={formatText(order.courier_note)}
                />
              </dl>
              <div className="mt-5">
                <DisabledButton tone="brand">
                  Send Courier · Not Connected
                </DisabledButton>
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
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                  <span className="font-bold text-slate-900">Total</span>
                  <b className="text-slate-950">{formatMoney(order.total)}</b>
                </div>
              </dl>
            </Card>
          </div>
        </div>

        <div className="sr-only" style={{ color: BRAND }}>
          Brand accent reference
        </div>
      </div>
    </AdminShell>
  );
}
