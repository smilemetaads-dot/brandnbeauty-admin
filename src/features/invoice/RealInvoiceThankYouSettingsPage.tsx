import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const features = [
  "Order ID format",
  "Thank you message",
  "Invoice PDF button",
  "Track Order button",
  "Delivery estimate text",
  "Invoice customer fields",
];

const invoiceFields = [
  ["Brand name", "BrandnBeauty"],
  ["Invoice prefix", "BNB"],
  ["Customer fields", "Name, phone, address"],
  ["Payment wording", "Cash on Delivery"],
];

const thankYouFields = [
  ["Confirmation headline", "Thank you for your order"],
  ["Delivery estimate", "Inside Dhaka 24-48h, outside Dhaka 3-5 days"],
  ["Support message", "Our support team may call to confirm your order."],
  ["Tracking prompt", "Track order button planned"],
];

const invoicePreviewRows = [
  ["Order ID", "BNB-20260613-0001"],
  ["Customer", "Sample Customer"],
  ["Payment", "Cash on Delivery"],
  ["Delivery", "Inside Dhaka"],
  ["Subtotal", "Tk 1,850"],
  ["Shipping", "Tk 60"],
  ["Total", "Tk 1,910"],
];

const safetyNotes = [
  "This screen does not change live invoice generation or print routes.",
  "Thank-you page behavior stays in the storefront and is not modified here.",
  "Save, PDF, download, and message publishing controls are preview-only until real actions exist.",
];

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const className = {
    bad: "bg-rose-50 text-rose-700",
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    default: "bg-slate-100 text-slate-700",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
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
    bad: "bg-rose-50 text-rose-700",
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    default: "bg-stone-50 text-slate-600",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
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
  primary = false,
  small = false,
}: {
  children: ReactNode;
  primary?: boolean;
  small?: boolean;
}) {
  return (
    <button
      className={`${
        small ? "rounded-xl px-3 py-2 text-xs" : "rounded-2xl px-5 py-3 text-sm"
      } font-semibold ${
        primary
          ? "bg-[#5E7F85] text-white opacity-45"
          : "border border-slate-300 bg-white text-slate-400"
      }`}
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function PreviewField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <label className="block rounded-2xl bg-stone-50 p-4">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <input
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none disabled:bg-white disabled:text-slate-500"
        disabled
        readOnly
        value={value}
      />
    </label>
  );
}

function PreviewSwitch({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <button
        className="rounded-full bg-[#5E7F85]/10 px-3 py-1 text-xs font-bold text-[#5E7F85] opacity-70"
        disabled
        type="button"
      >
        Preview only
      </button>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 py-3 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <b className="text-right text-slate-900">{value}</b>
    </div>
  );
}

export function RealInvoiceThankYouSettingsPage() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Ready for build"
            icon="#"
            label="Module Status"
            value="Added"
          />
          <StatCard
            helper="Checkout flow"
            icon="Flow"
            label="Frontend Match"
            tone="brand"
            value="Planned"
          />
          <StatCard
            helper="Build later"
            icon="Rule"
            label="Rules"
            tone="default"
            value="0"
          />
          <StatCard
            helper="Order conversion"
            icon="!"
            label="Priority"
            tone="warn"
            value="High"
          />
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Order Flow Module
              </div>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Invoice & Thank You Settings
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Preview-only control room for invoice branding, customer fields,
                post-checkout messaging, and confirmation actions. Live invoice
                print and storefront thank-you behavior remain untouched.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">New Module</Badge>
              <Badge tone="warn">Preview only</Badge>
            </div>
          </div>

          <div className="grid gap-3 p-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <div
                className="rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-slate-700"
                key={feature}
              >
                {feature}
              </div>
            ))}
          </div>
        </section>

        <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Invoice Controls
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Invoice Branding & Customer Fields
                  </h2>
                </div>
                <DisabledButton primary>Save Settings</DisabledButton>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {invoiceFields.map(([label, value]) => (
                  <PreviewField key={label} label={label} value={value} />
                ))}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-500">
                      Invoice Preview
                    </div>
                    <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                      Customer Invoice Card
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <DisabledButton>Open Print Route</DisabledButton>
                    <DisabledButton primary>Download PDF</DisabledButton>
                  </div>
                </div>

                <div className="p-6">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <div className="text-2xl font-black tracking-tight text-slate-950">
                          BrandnBeauty
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-500">
                          Invoice preview from safe sample content
                        </div>
                      </div>
                      <Badge tone="brand">Invoice</Badge>
                    </div>
                    <div className="mt-3">
                      {invoicePreviewRows.map(([label, value]) => (
                        <DetailRow key={label} label={label} value={value} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-medium text-slate-500">
                  Document Buttons
                </div>
                <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  Invoice Actions
                </h3>
                <div className="mt-5 space-y-3">
                  <PreviewSwitch label="Show invoice PDF button" />
                  <PreviewSwitch label="Show track order button" />
                  <PreviewSwitch label="Show customer phone field" />
                  <PreviewSwitch label="Show delivery estimate" />
                </div>
              </aside>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Thank You Page
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Order Confirmation Message
                  </h2>
                </div>
                <DisabledButton>Preview Thank You</DisabledButton>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {thankYouFields.map(([label, value]) => (
                  <PreviewField key={label} label={label} value={value} />
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Confirmation Preview
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Thank You Card
              </h2>
              <div className="mt-5 rounded-[1.5rem] bg-stone-50 p-5">
                <Badge tone="good">Order received</Badge>
                <div className="mt-4 text-2xl font-black tracking-tight text-slate-950">
                  Thank you for your order
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Your BrandnBeauty order has been received. Our support team
                  may call to confirm delivery details before dispatch.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <DisabledButton small>Download Invoice</DisabledButton>
                  <DisabledButton small>Track Order</DisabledButton>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Customer Fields
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Invoice Visibility
              </h2>
              <div className="mt-5 space-y-3">
                <PreviewSwitch label="Customer name" />
                <PreviewSwitch label="Customer phone" />
                <PreviewSwitch label="Delivery address" />
                <PreviewSwitch label="Payment method" />
              </div>
            </section>

            <section className="rounded-[2rem] border border-[#5E7F85]/20 bg-[#5E7F85]/5 p-6 shadow-sm">
              <div className="text-sm font-bold text-[#5E7F85]">
                Preview Status
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This screen does not save invoice settings, generate files,
                update thank-you copy, or modify order data. Controls are visual
                until real settings actions exist.
              </p>
            </section>

            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                Safety Notes
              </div>
              <div className="mt-4 space-y-3">
                {safetyNotes.map((note) => (
                  <div
                    className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold leading-6 text-amber-800"
                    key={note}
                  >
                    {note}
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
