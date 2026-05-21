import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import type { SupplierRecord } from "./suppliers-data";

type RealSuppliersPageProps = {
  suppliers: SupplierRecord[];
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

function StatCard({
  helper,
  label,
  marker,
  tone = "brand",
  value,
}: {
  helper: string;
  label: string;
  marker: string;
  tone?: BadgeTone;
  value: ReactNode;
}) {
  const helperClassName = {
    brand: "bg-[#527B86]/10 text-[#527B86]",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    default: "bg-stone-50 text-slate-600",
  }[tone];

  return (
    <section className="group relative overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#527B86]/5 transition group-hover:bg-[#527B86]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#527B86]/10 text-sm font-black text-[#527B86]">
          {marker}
        </div>
      </div>
      <div
        className={`relative mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${helperClassName}`}
      >
        {helper}
      </div>
    </section>
  );
}

function DisabledButton({ children }: { children: ReactNode }) {
  return (
    <button
      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-400 opacity-75"
      disabled
      type="button"
    >
      {children}
    </button>
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
      <span className="text-slate-500">{label}</span>
      <b className="max-w-[65%] text-right text-slate-800">{value}</b>
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-BD", {
    currency: "BDT",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatStatus(value: string | null) {
  return value ? value.replaceAll("_", " ") : "not set";
}

function formatText(value: string | null) {
  return value || "Not available";
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

function getStatusTone(status: string): BadgeTone {
  return status === "active" ? "good" : "default";
}

function SupplierFocusPanel({
  supplier,
}: {
  supplier: SupplierRecord | undefined;
}) {
  return (
    <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-medium text-slate-500">Supplier Notes</div>
      {supplier ? (
        <>
          <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">
            {supplier.name}
          </h3>
          <div className="mt-5 space-y-3">
            <DetailRow label="Address" value={formatText(supplier.address)} />
            <DetailRow label="Notes" value={formatText(supplier.notes)} />
            <DetailRow
              label="Payment Terms"
              value={formatText(supplier.payment_terms)}
            />
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
          Supplier details will appear here after supplier rows are available.
        </p>
      )}
    </aside>
  );
}

export function RealSuppliersPage({ suppliers }: RealSuppliersPageProps) {
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(
    (supplier) => supplier.status === "active",
  ).length;
  const inactiveSuppliers = suppliers.filter(
    (supplier) => supplier.status === "inactive",
  ).length;
  const purchaseEntries = suppliers.reduce(
    (sum, supplier) => sum + supplier.purchaseCount,
    0,
  );
  const pendingPurchases = suppliers.reduce(
    (sum, supplier) => sum + supplier.pendingPurchaseCount,
    0,
  );
  const focusedSupplier = suppliers[0];

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                Vendor Operations
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Suppliers
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Live read-only supplier directory from Supabase for future
                purchase stock and vendor management workflows.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DisabledButton>Add Supplier — N/C</DisabledButton>
              <DisabledButton>Edit Supplier — N/C</DisabledButton>
              <DisabledButton>Create Purchase — N/C</DisabledButton>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Supplier create/edit: <b className="text-slate-400">N/C</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Purchase stock receive: <b className="text-slate-400">N/C in UI</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Stock changes from this page: <b className="text-emerald-700">No</b>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            helper="Live supplier rows"
            label="Total Suppliers"
            marker="SUP"
            value={totalSuppliers}
          />
          <StatCard
            helper="Ready for purchase flow"
            label="Active Suppliers"
            marker="ON"
            tone="good"
            value={activeSuppliers}
          />
          <StatCard
            helper="Not used for new purchase"
            label="Inactive Suppliers"
            marker="OFF"
            tone="default"
            value={inactiveSuppliers}
          />
          <StatCard
            helper="From purchase entries"
            label="Purchase Entries"
            marker="PO"
            tone="brand"
            value={purchaseEntries}
          />
          <StatCard
            helper="Not received/cancelled"
            label="Pending Purchases"
            marker="PEN"
            tone="warn"
            value={pendingPurchases}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-950">
                  Supplier Directory
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  Read-only supplier records with purchase summary counters.
                </p>
              </div>
              <Badge tone="brand">{suppliers.length} suppliers</Badge>
            </div>

            {suppliers.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-[1120px] text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase tracking-[0.08em] text-slate-400">
                    <tr>
                      <th className="px-5 py-4 font-black">Supplier</th>
                      <th className="px-5 py-4 font-black">Contact</th>
                      <th className="px-5 py-4 font-black">Phone</th>
                      <th className="px-5 py-4 font-black">Email</th>
                      <th className="px-5 py-4 font-black">Status</th>
                      <th className="px-5 py-4 font-black">Payment Terms</th>
                      <th className="px-5 py-4 font-black">Purchases</th>
                      <th className="px-5 py-4 font-black">Value</th>
                      <th className="px-5 py-4 font-black">Pending</th>
                      <th className="px-5 py-4 font-black">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suppliers.map((supplier) => (
                      <tr className="bg-white hover:bg-stone-50" key={supplier.id}>
                        <td className="px-5 py-4">
                          <div className="font-black text-slate-950">
                            {supplier.name}
                          </div>
                          <div className="mt-1 max-w-[260px] truncate text-xs font-semibold text-slate-400">
                            {formatText(supplier.address)}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700">
                          {formatText(supplier.contact_person)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-600">
                          {formatText(supplier.phone)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-600">
                          {formatText(supplier.email)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={getStatusTone(supplier.status)}>
                            {formatStatus(supplier.status)}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-600">
                          {formatText(supplier.payment_terms)}
                        </td>
                        <td className="px-5 py-4 font-black text-slate-900">
                          {supplier.purchaseCount}
                        </td>
                        <td className="px-5 py-4 font-black text-slate-900">
                          {formatMoney(supplier.totalPurchaseValue)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            tone={
                              supplier.pendingPurchaseCount > 0
                                ? "warn"
                                : "default"
                            }
                          >
                            {supplier.pendingPurchaseCount}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-600">
                          {formatDate(supplier.updated_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-sm font-semibold text-slate-500">
                No suppliers found. Supplier create/edit is not connected yet.
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <SupplierFocusPanel supplier={focusedSupplier} />

            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <h2 className="text-xl font-black text-amber-900">
                Pending Connections
              </h2>
              <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-amber-900">
                <div className="rounded-2xl bg-white/70 p-4">
                  Supplier create/edit is not connected yet.
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  Purchase stock receive is not connected yet in UI.
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  No stock changes happen from this page.
                </div>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
