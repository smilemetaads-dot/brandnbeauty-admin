import Link from "next/link";

import type { OrderDetailsRecord } from "./orders-data";

type OrderDocumentsPreviewProps = {
  order: OrderDetailsRecord;
};

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

function formatStatus(value: string | null) {
  return value ? value.replaceAll("_", " ") : "not set";
}

function formatText(value: string | null) {
  return value || "Not available";
}

function DisabledDocumentButton({ children }: { children: string }) {
  return (
    <button
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-400"
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function DocumentLink({ children, href }: { children: string; href: string }) {
  return (
    <Link
      className="rounded-xl border border-[#527B86]/20 bg-[#527B86]/10 px-3 py-2 text-xs font-bold text-[#527B86] transition hover:bg-[#527B86] hover:text-white"
      href={href}
    >
      {children}
    </Link>
  );
}

function DocumentShell({
  actions,
  children,
  helper,
  title,
}: {
  actions?: React.ReactNode;
  children: React.ReactNode;
  helper: string;
  title: string;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-[#527B86]">
            BrandnBeauty
          </div>
          <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
            {title}
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">{helper}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions ?? (
            <>
              <DisabledDocumentButton>Download PDF - N/C</DisabledDocumentButton>
              <DisabledDocumentButton>Print - N/C</DisabledDocumentButton>
            </>
          )}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <b className="text-right text-slate-900">{value}</b>
    </div>
  );
}

export function OrderDocumentsPreview({ order }: OrderDocumentsPreviewProps) {
  const orderNumber = order.order_number ?? "No order number";
  const location = `${formatText(order.district)} / ${formatText(order.area)}`;

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <DocumentShell
        actions={
          <>
            <DisabledDocumentButton>Download PDF - N/C</DisabledDocumentButton>
            <DocumentLink href={`/orders/details/invoice?id=${order.id}`}>
              Open Invoice Print View
            </DocumentLink>
          </>
        }
        helper="This is a read-only invoice preview. PDF export is not connected yet."
        title="Invoice Preview"
      >
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div className="rounded-2xl bg-stone-50 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Order
            </div>
            <div className="mt-2 font-black text-slate-950">{orderNumber}</div>
            <div className="mt-1 text-slate-500">
              {formatDate(order.created_at)}
            </div>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Customer
            </div>
            <div className="mt-2 font-black text-slate-950">
              {order.customer_name}
            </div>
            <div className="mt-1 text-slate-500">{order.customer_phone}</div>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4 md:col-span-2">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Delivery
            </div>
            <div className="mt-2 font-semibold text-slate-900">
              {formatText(order.customer_address)}
            </div>
            <div className="mt-1 text-slate-500">
              {location} / {formatText(order.delivery_zone)}
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 text-slate-500">
              <tr>
                {["Product", "SKU", "Quantity", "Unit Price", "Total"].map(
                  (heading) => (
                    <th className="px-4 py-3 font-medium" key={heading}>
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {order.order_items.map((item) => (
                <tr className="border-t border-slate-100" key={item.id}>
                  <td className="px-4 py-3 font-bold text-slate-950">
                    {item.product_name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatText(item.product_sku)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatMoney(item.unit_price)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-950">
                    {formatMoney(item.total_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 rounded-2xl bg-stone-50 p-4">
          <div className="space-y-3">
            <SummaryRow label="Subtotal" value={formatMoney(order.subtotal)} />
            <SummaryRow
              label="Delivery Charge"
              value={formatMoney(order.delivery_charge)}
            />
            <SummaryRow label="Discount" value={formatMoney(order.discount)} />
            <SummaryRow label="Total" value={formatMoney(order.total)} />
            <SummaryRow
              label="Paid Amount"
              value={formatMoney(order.paid_amount)}
            />
            <SummaryRow
              label="Due Amount"
              value={formatMoney(order.due_amount)}
            />
            <SummaryRow
              label="Payment Status"
              value={formatStatus(order.payment_status)}
            />
          </div>
        </div>
      </DocumentShell>

      <DocumentShell
        helper="This is a read-only packing slip preview. Print action is not connected yet."
        title="Packing Slip Preview"
      >
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div className="rounded-2xl bg-stone-50 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Order
            </div>
            <div className="mt-2 font-black text-slate-950">{orderNumber}</div>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Courier
            </div>
            <div className="mt-2 font-black capitalize text-slate-950">
              {formatStatus(order.courier_status)}
            </div>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4 md:col-span-2">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Customer
            </div>
            <div className="mt-2 font-black text-slate-950">
              {order.customer_name}
            </div>
            <div className="mt-1 text-slate-500">
              {order.customer_phone} / {location}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {order.order_items.map((item) => (
            <div
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4"
              key={item.id}
            >
              <input
                className="mt-1 h-4 w-4 rounded border-slate-300"
                disabled
                type="checkbox"
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-950">
                  {item.product_name}
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  SKU {formatText(item.product_sku)} / Brand{" "}
                  {formatText(item.product_brand)} / Size{" "}
                  {formatText(item.product_size)}
                </div>
              </div>
              <div className="rounded-full bg-[#527B86]/10 px-3 py-1 text-xs font-black text-[#527B86]">
                x{item.quantity}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
          Verify products before marking packed.
        </div>
      </DocumentShell>
    </section>
  );
}
