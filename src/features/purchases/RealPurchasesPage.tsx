import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

import { PurchaseFilters } from "./PurchaseFilters";
import { PurchaseEntryForm } from "./PurchaseEntryForm";
import { ReceivePurchaseStockButton } from "./ReceivePurchaseStockButton";
import type {
  PurchaseEntriesFilters,
  PurchaseEntriesKpis,
  PurchaseEntryRecord,
  PurchaseFilterOptions,
  PurchaseFormOptions,
} from "./purchases-data";

type RealPurchasesPageProps = {
  activeFilters: PurchaseEntriesFilters;
  entries: PurchaseEntryRecord[];
  filterOptions: PurchaseFilterOptions;
  kpis: PurchaseEntriesKpis;
  options: PurchaseFormOptions;
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
  const markerClassName = {
    brand: "bg-[#527B86]/10 text-[#527B86]",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    default: "bg-slate-100 text-slate-600",
  }[tone];

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-black ${markerClassName}`}
        >
          {marker}
        </div>
      </div>
      <div className="mt-4 text-xs font-bold text-slate-400">{helper}</div>
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

function formatText(value: string | null | undefined) {
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
  if (status === "received") {
    return "good";
  }

  if (status === "ordered" || status === "partially_received") {
    return "warn";
  }

  if (status === "cancelled") {
    return "bad";
  }

  return "default";
}

function PurchaseItemsSummary({ entry }: { entry: PurchaseEntryRecord }) {
  if (!entry.items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-stone-50 p-4 text-sm font-semibold text-slate-500">
        No purchase entry items found for this purchase.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-[760px] text-left text-sm">
        <thead className="bg-stone-50 text-xs uppercase tracking-[0.08em] text-slate-400">
          <tr>
            <th className="px-4 py-3 font-black">Product</th>
            <th className="px-4 py-3 font-black">SKU</th>
            <th className="px-4 py-3 font-black">Quantity</th>
            <th className="px-4 py-3 font-black">Received</th>
            <th className="px-4 py-3 font-black">Unit Cost</th>
            <th className="px-4 py-3 font-black">Total Cost</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entry.items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3 font-black text-slate-900">
                {formatText(item.product_name)}
              </td>
              <td className="px-4 py-3 font-semibold text-slate-600">
                {formatText(item.product_sku)}
              </td>
              <td className="px-4 py-3 font-semibold text-slate-700">
                {item.quantity}
              </td>
              <td className="px-4 py-3 font-semibold text-slate-700">
                {item.received_quantity}
              </td>
              <td className="px-4 py-3 font-semibold text-slate-700">
                {formatMoney(item.unit_cost)}
              </td>
              <td className="px-4 py-3 font-black text-slate-900">
                {formatMoney(item.total_cost)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PurchaseCard({
  entry,
  options,
}: {
  entry: PurchaseEntryRecord;
  options: PurchaseFormOptions;
}) {
  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-4 border-b border-slate-100 p-5 xl:grid-cols-[1.2fr_1fr_1fr_auto] xl:items-start">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#527B86]">
            Purchase number
          </div>
          <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
            {entry.purchase_number}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={getStatusTone(entry.purchase_status)}>
              {formatStatus(entry.purchase_status)}
            </Badge>
            <Badge tone={entry.stock_received ? "good" : "warn"}>
              Stock received: {entry.stock_received ? "yes" : "no"}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="font-black text-slate-900">
            {formatText(entry.supplier?.name)}
          </div>
          <div className="font-semibold text-slate-500">
            {formatText(entry.supplier?.phone)}
          </div>
          <div className="font-semibold text-slate-500">
            {formatText(entry.supplier?.email)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs font-bold text-slate-400">Total cost</div>
            <div className="mt-1 font-black text-slate-950">
              {formatMoney(entry.total_cost)}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400">Item count</div>
            <div className="mt-1 font-black text-slate-950">
              {entry.items.length}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400">Created</div>
            <div className="mt-1 font-semibold text-slate-700">
              {formatDate(entry.created_at)}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400">Received</div>
            <div className="mt-1 font-semibold text-slate-700">
              {formatDate(entry.received_at ?? entry.stock_received_at)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <ReceivePurchaseStockButton
            purchaseEntryId={entry.id}
            purchaseStatus={entry.purchase_status}
            stockReceived={entry.stock_received}
          />
          <DisabledButton>Print Purchase - N/C</DisabledButton>
        </div>
      </div>

      <div className="space-y-4 bg-stone-50/70 p-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-black text-slate-950">
              Items Summary
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Product snapshots from purchase entry items. Receiving stock is
              one-time and double-guarded by the database RPC.
            </p>
          </div>
          <Badge tone={entry.stock_received ? "good" : "warn"}>
            {entry.stock_received ? "Received" : "Pending receive"}
          </Badge>
        </div>
        <PurchaseItemsSummary entry={entry} />
        {entry.note ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-600">
            Note: {entry.note}
          </div>
        ) : null}
        {entry.stock_received ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-500">
            This purchase has been marked stock received, so item editing is
            locked.
          </div>
        ) : (
          <details className="rounded-2xl border border-[#527B86]/20 bg-white p-4">
            <summary className="cursor-pointer text-sm font-black text-[#527B86]">
              Edit Purchase
            </summary>
            <div className="mt-5">
              <PurchaseEntryForm entry={entry} mode="edit" options={options} />
            </div>
          </details>
        )}
      </div>
    </article>
  );
}

export function RealPurchasesPage({
  activeFilters,
  entries,
  filterOptions,
  kpis,
  options,
}: RealPurchasesPageProps) {
  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                Supplier Stock Control
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Purchase Stock Entry
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Live read-only view of purchase entries and item snapshots from
                Supabase. Create/edit writes purchase records, and Receive
                Stock calls the existing RPC so product stock and movement logs
                stay inside the database function.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DisabledButton>Print Purchase - N/C</DisabledButton>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-600">
              Purchase create/edit is connected for purchase records only.
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-600">
              Receive stock is one-time and guarded by RPC.
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-600">
              Product stock updates only inside the RPC.
            </div>
          </div>
        </section>

        <section
          className="rounded-[2rem] border border-[#527B86]/20 bg-white p-6 shadow-sm"
          id="create-purchase"
        >
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                Purchase Entry
              </div>
              <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                Create Purchase
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Creates purchase header and item snapshots only. Stock receive
                remains a separate one-time action.
              </p>
            </div>
            <Badge tone="good">Create/Edit Live</Badge>
          </div>
          <PurchaseEntryForm mode="create" options={options} />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard
            helper="All purchase entry rows"
            label="Total Purchases"
            marker="PO"
            value={kpis.totalPurchases}
          />
          <StatCard
            helper="Not cancelled or received"
            label="Pending Receive"
            marker="PEN"
            tone="warn"
            value={kpis.pendingReceivePurchases}
          />
          <StatCard
            helper="Status or stock flag"
            label="Received"
            marker="IN"
            tone="good"
            value={kpis.receivedPurchases}
          />
          <StatCard
            helper="All purchase value"
            label="Purchase Value"
            marker="BDT"
            value={formatMoney(kpis.totalPurchaseValue)}
          />
          <StatCard
            helper="Early purchase states"
            label="Draft / Ordered"
            marker="DO"
            tone="default"
            value={`${kpis.draftPurchases} / ${kpis.orderedPurchases}`}
          />
          <StatCard
            helper="Excluded from receive"
            label="Cancelled"
            marker="CAN"
            tone="bad"
            value={kpis.cancelledPurchases}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold leading-6 text-emerald-900">
            This page only reads `purchase_entries` and
            `purchase_entry_items` for the register, and create/edit writes
            purchase records only. Receive Stock calls the existing
            `receive_purchase_entry_stock` RPC.
          </div>
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-900">
            Product stock updates and `purchase_stock_in` inventory movements
            are handled inside the RPC only, with a double receive guard.
          </div>
        </section>

        <PurchaseFilters
          activeFilters={activeFilters}
          filterOptions={filterOptions}
        />

        <section className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                Purchase Register
              </div>
              <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                Live Purchase Entries
              </h2>
            </div>
            <Badge tone="brand">{entries.length} entries</Badge>
          </div>

          {entries.length ? (
            <div className="space-y-5">
              {entries.map((entry) => (
                <PurchaseCard entry={entry} key={entry.id} options={options} />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-500">
              No purchase entries found. Use the create purchase form to add a
              purchase header and item snapshots without changing stock.
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
