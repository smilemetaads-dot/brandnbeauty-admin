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

function StatCard({
  active = false,
  helper,
  icon,
  label,
  value,
}: {
  active?: boolean;
  helper: string;
  icon: string;
  label: string;
  value: ReactNode;
}) {
  const trendTone =
    helper.toLowerCase().includes("due") ||
    helper.toLowerCase().includes("pending") ||
    helper.toLowerCase().includes("cancelled")
      ? "bg-amber-50 text-amber-600"
      : "bg-emerald-50 text-emerald-700";

  return (
    <section
      className={`group relative w-full overflow-hidden rounded-[1.7rem] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? "border-[#5E7F85] ring-2 ring-[#5E7F85]/15" : "border-slate-200"
      }`}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5E7F85]/5 transition group-hover:bg-[#5E7F85]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 truncate text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xs font-black text-[#5E7F85] transition group-hover:bg-[#5E7F85] group-hover:text-white">
          {icon}
        </div>
      </div>
      <div
        className={`relative mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${trendTone}`}
      >
        {helper}
      </div>
    </section>
  );
}

function DisabledButton({
  children,
  variant = "secondary",
}: {
  children: ReactNode;
  variant?: "brand" | "secondary";
}) {
  return (
    <button
      className={
        variant === "brand"
          ? "rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white opacity-60"
          : "rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-400"
      }
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
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusTone(status: string): BadgeTone {
  if (status === "received") return "good";
  if (status === "ordered" || status === "partially_received") return "warn";
  if (status === "cancelled") return "bad";
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
        <thead className="sticky top-0 z-10 bg-stone-50 text-slate-500">
          <tr>
            {["Product", "SKU", "Qty", "Received", "Buy", "Total"].map((head) => (
              <th className="px-4 py-3 font-medium" key={head}>
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entry.items.map((item) => (
            <tr className="border-t border-slate-100 hover:bg-stone-50" key={item.id}>
              <td className="px-4 py-3 font-semibold text-slate-900">
                {formatText(item.product_name)}
              </td>
              <td className="px-4 py-3 text-slate-600">
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
    <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-4 border-b border-slate-100 p-5 xl:grid-cols-[1.15fr_0.8fr_0.9fr_auto] xl:items-start">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#5E7F85]">
            Purchase number
          </div>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900">
            {entry.purchase_number}
          </h3>
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
          <div className="font-bold text-slate-900">
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
            <div className="text-xs font-bold text-slate-400">Total</div>
            <div className="mt-1 font-black text-slate-950">
              {formatMoney(entry.total_cost)}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400">Items</div>
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
          <DisabledButton>Generate GRN</DisabledButton>
        </div>
      </div>

      <div className="space-y-4 bg-stone-50/70 p-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-black text-slate-950">
              Purchase Items
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Product snapshots from purchase entry items. Receive Stock is
              one-time and guarded by the existing RPC.
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
          <details className="rounded-2xl border border-[#5E7F85]/20 bg-white p-4">
            <summary className="cursor-pointer text-sm font-black text-[#5E7F85]">
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

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 rounded-2xl bg-stone-50 p-4 text-sm">
      <span className="text-slate-600">{label}</span>
      <b className="text-right text-slate-950">{value}</b>
    </div>
  );
}

export function RealPurchasesPage({
  activeFilters,
  entries,
  filterOptions,
  kpis,
  options,
}: RealPurchasesPageProps) {
  const latestEntry = entries[0];
  const totalUnits = entries.reduce(
    (sum, entry) =>
      sum + entry.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  );
  const receivedUnits = entries.reduce(
    (sum, entry) =>
      sum +
      entry.items.reduce((itemSum, item) => itemSum + item.received_quantity, 0),
    0,
  );
  const avgPurchaseValue =
    kpis.totalPurchases > 0
      ? Math.round(kpis.totalPurchaseValue / kpis.totalPurchases)
      : 0;

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5E7F85]">
                Inventory
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                Purchase Stock Entry
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Add supplier purchase records, preserve item snapshots, and
                receive stock only through the existing guarded RPC.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DisabledButton>Save Draft</DisabledButton>
              <DisabledButton variant="brand">Post to Inventory</DisabledButton>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper={`${kpis.totalPurchases} invoices tracked`}
            icon="BDT"
            label="Today Purchase"
            value={formatMoney(kpis.totalPurchaseValue)}
          />
          <StatCard
            helper="Fresh stock rows"
            icon="SKU"
            label="New SKUs"
            value={options.products.length}
          />
          <StatCard
            active={kpis.pendingReceivePurchases > 0}
            helper={`${kpis.pendingReceivePurchases} suppliers pending`}
            icon="Due"
            label="Pending Due"
            value={formatMoney(
              Math.max(kpis.totalPurchaseValue - kpis.receivedPurchaseValue, 0),
            )}
          />
          <StatCard
            helper="Average buying"
            icon="Avg"
            label="Avg Purchase"
            value={formatMoney(avgPurchaseValue)}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
            id="create-purchase"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  Purchase Entry
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Creates purchase header and item snapshots only. Stock receive
                  remains a separate one-time action.
                </p>
              </div>
              <Badge tone="brand">Purchase Ready</Badge>
            </div>

            <div className="mt-5">
              <PurchaseEntryForm mode="create" options={options} />
            </div>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-950">Summary</h2>
                <Badge tone="good">Live Sync</Badge>
              </div>
              <div className="mt-4 space-y-3">
                <SummaryRow
                  label="Subtotal"
                  value={formatMoney(kpis.totalPurchaseValue)}
                />
                <SummaryRow label="Transport / Other Cost" value="Not tracked" />
                <SummaryRow label="Previous Supplier Due" value="Not tracked" />
                <SummaryRow
                  label="Paid Now"
                  value={formatMoney(kpis.receivedPurchaseValue)}
                />
                <SummaryRow
                  label="Remaining Due"
                  value={formatMoney(
                    Math.max(kpis.totalPurchaseValue - kpis.receivedPurchaseValue, 0),
                  )}
                />
                <SummaryRow
                  label="Expected Stock Value"
                  value={`${totalUnits} units`}
                />
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-stone-50 p-4">
                <div className="text-sm font-bold text-slate-900">Payment</div>
                <div className="mt-4 grid gap-3">
                  <select
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-400 outline-none"
                    disabled
                  >
                    <option>Payment method preview</option>
                  </select>
                  <input
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-400 outline-none"
                    disabled
                    placeholder="Payment reference preview"
                  />
                  <input
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-400 outline-none"
                    disabled
                    placeholder="Paid amount preview"
                  />
                </div>
              </div>
              <DisabledButton variant="brand">Post to Inventory</DisabledButton>
            </section>

            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
              <h2 className="text-xl font-bold text-amber-900">Smart Alerts</h2>
              <div className="mt-4 space-y-3 text-sm text-amber-900">
                <div className="rounded-2xl bg-white/70 p-4">
                  {kpis.pendingReceivePurchases} purchase entries are waiting
                  for receive.
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  {receivedUnits} units are already received across visible
                  entries.
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  Latest purchase: {latestEntry?.purchase_number ?? "Not available"}.
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  Receive Stock remains one-time and RPC guarded.
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold tracking-tight text-slate-950">
                Quick Actions
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <DisabledButton>Save Draft</DisabledButton>
                <DisabledButton variant="brand">Post to Inventory</DisabledButton>
                <DisabledButton>Generate GRN</DisabledButton>
                <DisabledButton>Share with Finance</DisabledButton>
              </div>
            </section>
          </aside>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold leading-6 text-emerald-900">
            Create/edit writes purchase records only through the existing
            `save_purchase_entry` RPC.
          </div>
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-900">
            Product stock updates and `purchase_stock_in` movement logs are
            handled only by `receive_purchase_entry_stock`.
          </div>
        </section>

        <PurchaseFilters
          activeFilters={activeFilters}
          filterOptions={filterOptions}
        />

        <section className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5E7F85]">
                Purchase Register
              </div>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
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
