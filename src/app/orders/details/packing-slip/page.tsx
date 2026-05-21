import Link from "next/link";

import {
  getOrderDetailsFromSupabase,
  type OrderDetailsRecord,
} from "@/features/orders/orders-data";

export const dynamic = "force-dynamic";

type PackingSlipPrintPageProps = {
  searchParams?: Promise<{
    id?: string;
  }>;
};

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

function MissingOrderState({ id }: { id?: string }) {
  return (
    <main className="min-h-screen bg-white px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 p-8 print:border-neutral-300">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-[#527B86] print:text-black">
          BrandnBeauty
        </div>
        <h1 className="mt-3 text-2xl font-black">
          Packing slip unavailable
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 print:text-neutral-700">
          {id
            ? "This order could not be found. Open an existing order from the Orders page and try again."
            : "Missing order id. Open an existing order from the Orders page and try again."}
        </p>
        <Link
          className="mt-6 inline-flex rounded-xl bg-[#527B86] px-4 py-2 text-sm font-bold text-white print:hidden"
          href="/orders"
        >
          Back to Orders
        </Link>
      </div>
    </main>
  );
}

function DetailBlock({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4 print:rounded-none print:border-neutral-300">
      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 print:text-neutral-600">
        {label}
      </div>
      <div className="mt-3 text-sm font-bold leading-6 text-slate-950 print:text-black">
        {value}
      </div>
    </div>
  );
}

function PackingSlipPrintDocument({ order }: { order: OrderDetailsRecord }) {
  const orderNumber = order.order_number ?? "No order number";
  const orderDetailsHref = `/orders/details?id=${order.id}`;

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 text-slate-950 print:bg-white print:px-0 print:py-0 print:text-black">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#527B86] shadow-sm"
            href={orderDetailsHref}
          >
            Back to Order Details
          </Link>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm">
            Use browser print from this page. PDF export is not connected.
          </div>
        </div>

        <article className="bg-white p-8 shadow-sm ring-1 ring-slate-200 print:p-0 print:shadow-none print:ring-0">
          <header className="flex flex-col justify-between gap-6 border-b-2 border-slate-950 pb-6 sm:flex-row sm:items-start print:border-black">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.2em] text-[#527B86] print:text-black">
                BrandnBeauty
              </div>
              <h1 className="mt-3 text-4xl font-black tracking-tight">
                Packing Slip
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-600 print:text-neutral-700">
                This packing slip is generated from live admin order data.
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 print:text-neutral-600">
                Order Number
              </div>
              <div className="mt-2 text-xl font-black">{orderNumber}</div>
              <div className="mt-2 text-sm font-medium text-slate-600 print:text-neutral-700">
                {formatDate(order.created_at)}
              </div>
            </div>
          </header>

          <section className="grid gap-4 border-b border-slate-200 py-6 md:grid-cols-2 print:border-neutral-300">
            <DetailBlock
              label="Customer"
              value={
                <>
                  <div>{formatText(order.customer_name)}</div>
                  <div className="mt-1 font-medium text-slate-700 print:text-neutral-700">
                    {formatText(order.customer_phone)}
                  </div>
                </>
              }
            />
            <DetailBlock
              label="Delivery Address"
              value={
                <>
                  <div>{formatText(order.customer_address)}</div>
                  <div className="mt-1 font-medium text-slate-700 print:text-neutral-700">
                    {formatText(order.district)} / {formatText(order.area)} /{" "}
                    {formatText(order.delivery_zone)}
                  </div>
                </>
              }
            />
            <DetailBlock
              label="Courier Status"
              value={formatStatus(order.courier_status)}
            />
            <DetailBlock
              label="Payment Status"
              value={formatStatus(order.payment_status)}
            />
          </section>

          <section className="py-6">
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500 print:text-neutral-600">
              Item Checklist
            </h2>
            <div className="mt-4 overflow-hidden border border-slate-300 print:border-neutral-400">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-slate-100 print:bg-neutral-100">
                  <tr>
                    {["", "Product", "SKU", "Brand", "Size", "Qty"].map(
                      (heading) => (
                        <th
                          className="border border-slate-300 px-3 py-3 font-black print:border-neutral-400"
                          key={heading || "check"}
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {order.order_items.map((item) => (
                    <tr key={item.id}>
                      <td className="w-12 border border-slate-300 px-3 py-4 text-center print:border-neutral-400">
                        <span className="inline-flex h-5 w-5 border-2 border-slate-700 print:border-black" />
                      </td>
                      <td className="border border-slate-300 px-3 py-4 text-base font-black print:border-neutral-400">
                        {item.product_name}
                      </td>
                      <td className="border border-slate-300 px-3 py-4 font-semibold print:border-neutral-400">
                        {formatText(item.product_sku)}
                      </td>
                      <td className="border border-slate-300 px-3 py-4 font-semibold print:border-neutral-400">
                        {formatText(item.product_brand)}
                      </td>
                      <td className="border border-slate-300 px-3 py-4 font-semibold print:border-neutral-400">
                        {formatText(item.product_size)}
                      </td>
                      <td className="border border-slate-300 px-3 py-4 text-center text-base font-black print:border-neutral-400">
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 border-t border-slate-200 pt-6 md:grid-cols-2 print:border-neutral-300">
            <div className="rounded-2xl border border-slate-200 p-4 text-sm font-semibold leading-6 text-slate-700 print:rounded-none print:border-neutral-300 print:text-neutral-700">
              <div className="font-black text-slate-950 print:text-black">
                Packing Note
              </div>
              <p className="mt-2">Verify products before marking packed.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 text-sm font-semibold leading-6 text-slate-700 print:rounded-none print:border-neutral-300 print:text-neutral-700">
              <div className="font-black text-slate-950 print:text-black">
                Footer Note
              </div>
              <p className="mt-2">
                This packing slip is generated from live admin order data.
              </p>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}

export default async function PackingSlipPrintPage({
  searchParams,
}: PackingSlipPrintPageProps) {
  const params = await searchParams;
  const id = params?.id;

  if (!id) {
    return <MissingOrderState />;
  }

  const order = await getOrderDetailsFromSupabase(id);

  if (!order) {
    return <MissingOrderState id={id} />;
  }

  return <PackingSlipPrintDocument order={order} />;
}
