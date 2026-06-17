"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  fetchFinanceInventory,
  type FinanceInventoryProduct,
  type FinanceInventoryPurchase,
} from "@/features/finance-inventory/finance-inventory-client";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

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
    default: "bg-slate-100 text-slate-600",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize ${className}`}
    >
      {children}
    </span>
  );
}

function DisabledButton({
  children,
  primary = false,
}: {
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      className={
        primary
          ? "rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white opacity-60 shadow-sm"
          : "rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-400 shadow-sm"
      }
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function StatCard({
  helper,
  index,
  label,
  value,
}: {
  helper: string;
  index: number;
  label: string;
  value: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xs font-black text-[#5E7F85]">
          {String(index + 1).padStart(2, "0")}
        </div>
      </div>
      <div className="mt-4 text-xs font-bold text-slate-400">{helper}</div>
    </section>
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

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusTone(status: string): BadgeTone {
  if (status === "received" || status === "recorded" || status === "paid") {
    return "good";
  }

  if (status === "cancelled" || status === "failed") {
    return "bad";
  }

  return "warn";
}

export function RealCodReconciliationPage() {
  const [inventory, setInventory] = useState<FinanceInventoryProduct[]>([]);
  const [purchases, setPurchases] = useState<FinanceInventoryPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadFinance() {
      try {
        setIsLoading(true);
        const data = await fetchFinanceInventory(controller.signal);
        setInventory(data.inventory);
        setPurchases(data.purchases);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Finance reconciliation data could not be loaded.", error);
          setInventory([]);
          setPurchases([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadFinance();

    return () => {
      controller.abort();
    };
  }, []);

  const filteredPurchases = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return purchases;
    }

    return purchases.filter((purchase) =>
      [
        purchase.purchase_number,
        purchase.supplier_name,
        purchase.status,
        purchase.note,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery)),
    );
  }, [purchases, query]);

  const totalSpend = purchases.reduce((sum, item) => sum + item.total_cost, 0);
  const inventoryValue = inventory.reduce(
    (sum, product) => sum + product.inventory_value,
    0,
  );
  const lowStockCount = inventory.filter((product) => product.low_stock).length;
  const selectedPurchase = filteredPurchases[0] ?? null;

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Inventory Spend", formatMoney(totalSpend), `${purchases.length} purchase rows`],
            ["Inventory Value", formatMoney(inventoryValue), "Current stock valuation"],
            ["Low Stock Risk", lowStockCount, "Needs purchase planning"],
            ["Audit Rows", filteredPurchases.length, "Visible supplier invoices"],
          ].map(([label, value, helper], index) => (
            <StatCard
              helper={String(helper)}
              index={index}
              key={String(label)}
              label={String(label)}
              value={value}
            />
          ))}
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                Finance Reconciliation Control Room
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Supplier invoice audits, purchase spend, and inventory valuation
                from the local MySQL finance inventory endpoint.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <DisabledButton>Import Sheet</DisabledButton>
              <DisabledButton>Export CSV</DisabledButton>
              <DisabledButton primary>Mark Reviewed</DisabledButton>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Supplier Invoice Matching
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Purchase Expense Reconciliation
                  </h2>
                </div>
                <Badge tone="brand">Live PHP</Badge>
              </div>
              <input
                className="mt-5 w-full max-w-md rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/15"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search supplier invoice / status..."
                value={query}
              />
            </div>

            {isLoading ? (
              <div className="p-10 text-center text-sm font-semibold text-slate-500">
                Loading finance reconciliation rows from local MySQL...
              </div>
            ) : filteredPurchases.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-[900px] text-left text-sm">
                  <thead className="bg-stone-50 text-slate-500">
                    <tr>
                      {[
                        "Invoice",
                        "Supplier",
                        "Expected Spend",
                        "Recorded",
                        "Difference",
                        "Status",
                        "Created",
                      ].map((heading) => (
                        <th className="px-5 py-4 font-medium" key={heading}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchases.map((purchase) => (
                      <tr
                        className="border-t border-slate-100 bg-white transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85]"
                        key={purchase.id || purchase.purchase_number || purchase.created_at}
                      >
                        <td className="px-5 py-4 font-bold text-slate-900">
                          {formatText(purchase.purchase_number)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {formatText(purchase.supplier_name)}
                        </td>
                        <td className="px-5 py-4 font-semibold">
                          {formatMoney(purchase.total_cost)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-emerald-700">
                          {formatMoney(purchase.total_cost)}
                        </td>
                        <td className="px-5 py-4 font-bold text-emerald-700">
                          {formatMoney(0)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={getStatusTone(purchase.status)}>
                            {formatStatus(purchase.status)}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {formatDateTime(purchase.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-sm font-semibold text-slate-500">
                No purchase or expense reconciliation records found.
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Selected Record
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                {formatText(selectedPurchase?.purchase_number)}
              </h3>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Supplier</span>
                  <b className="text-right">
                    {formatText(selectedPurchase?.supplier_name)}
                  </b>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Recorded Spend</span>
                  <b>{formatMoney(selectedPurchase?.total_cost ?? 0)}</b>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Status</span>
                  <b>{formatStatus(selectedPurchase?.status ?? null)}</b>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <DisabledButton primary>Mark Matched</DisabledButton>
                <DisabledButton>Add Adjustment Note</DisabledButton>
              </div>
            </section>

            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                Finance Note
              </div>
              <p className="mt-2 text-sm leading-6 text-amber-700">
                This desk is now reading local purchase and expense records.
                Settlement buttons remain preview-only until a local PHP finance
                mutation endpoint exists.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
