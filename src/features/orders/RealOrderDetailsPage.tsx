import Link from "next/link";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

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
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold tracking-tight text-slate-950">
        {title}
      </h2>
      <div className="mt-4 space-y-3">{children}</div>
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
    <div className="grid gap-1 text-sm sm:grid-cols-[150px_1fr]">
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-800">{value}</dd>
    </div>
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

export function RealOrderDetailsPage({ order }: RealOrderDetailsPageProps) {
  if (!order) {
    return (
      <AdminShell>
        <div className="space-y-6">
          <BackLink />
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
              Order Operations
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              Order Details
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              This order could not be found. Return to the live Orders list and
              open a details link from an existing order.
            </p>
          </section>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <BackLink />

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                Order Operations
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Order Details
              </h1>
              <div className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {order.order_number ?? "No order number"}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Live read-only order details scaffold. Mutations, courier
                actions, stock deduction, and hard delete are not connected.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
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
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card title="Customer">
            <dl className="space-y-3">
              <DetailRow label="Name" value={order.customer_name} />
              <DetailRow label="Phone" value={order.customer_phone} />
              <DetailRow
                label="Email"
                value={formatText(order.customer_email)}
              />
              <DetailRow
                label="Address"
                value={formatText(order.customer_address)}
              />
              <DetailRow label="District" value={formatText(order.district)} />
              <DetailRow label="Area" value={formatText(order.area)} />
              <DetailRow
                label="Delivery Zone"
                value={formatText(order.delivery_zone)}
              />
              <DetailRow label="Note" value={formatText(order.note)} />
            </dl>
          </Card>

          <Card title="Money Summary">
            <dl className="space-y-3">
              <DetailRow label="Subtotal" value={formatMoney(order.subtotal)} />
              <DetailRow
                label="Delivery Charge"
                value={formatMoney(order.delivery_charge)}
              />
              <DetailRow label="Discount" value={formatMoney(order.discount)} />
              <DetailRow label="Total" value={formatMoney(order.total)} />
              <DetailRow
                label="Paid Amount"
                value={formatMoney(order.paid_amount)}
              />
              <DetailRow label="Due Amount" value={formatMoney(order.due_amount)} />
            </dl>
          </Card>

          <Card title="Courier">
            <dl className="space-y-3">
              <DetailRow
                label="Courier Name"
                value={formatText(order.courier_name)}
              />
              <DetailRow
                label="Tracking ID"
                value={formatText(order.courier_tracking_id)}
              />
              <DetailRow
                label="Courier Note"
                value={formatText(order.courier_note)}
              />
            </dl>
          </Card>

          <Card title="Stock Sync">
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

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Order Items
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Product Snapshot
              </h2>
            </div>
            <Badge tone="brand">Read Only</Badge>
          </div>

          {order.order_items.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-slate-500">
                  <tr>
                    {[
                      "Product",
                      "SKU",
                      "Brand",
                      "Size",
                      "Quantity",
                      "Unit Price",
                      "Total Price",
                    ].map((heading) => (
                      <th
                        className="px-5 py-4 font-medium"
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
                    <tr className="border-t border-slate-100" key={item.id}>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-950">
                          {item.product_name}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-400">
                          {formatText(item.product_slug)}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatText(item.product_sku)}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatText(item.product_brand)}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatText(item.product_size)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {formatMoney(item.unit_price)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {formatMoney(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-sm text-slate-500">
              No order items found for this order.
            </div>
          )}
        </section>

        <Card title="Timeline">
          <dl className="grid gap-3 md:grid-cols-2">
            <DetailRow label="Created" value={formatDate(order.created_at)} />
            <DetailRow label="Updated" value={formatDate(order.updated_at)} />
            <DetailRow
              label="Confirmed"
              value={formatDate(order.confirmed_at)}
            />
            <DetailRow label="Packed" value={formatDate(order.packed_at)} />
            <DetailRow label="Shipped" value={formatDate(order.shipped_at)} />
            <DetailRow
              label="Delivered"
              value={formatDate(order.delivered_at)}
            />
            <DetailRow label="Returned" value={formatDate(order.returned_at)} />
            <DetailRow
              label="Cancelled"
              value={formatDate(order.cancelled_at)}
            />
          </dl>
        </Card>
      </div>
    </AdminShell>
  );
}
