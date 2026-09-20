"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";
import {
  fetchFinanceInventory,
  type FinanceInventoryProduct,
  type FinanceInventoryPurchase,
} from "@/features/finance-inventory/finance-inventory-client";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const RECORD_PURCHASE_ENDPOINT = bnbApiUrl("record_purchase_entry.php");

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

function StatCard({
  helper,
  icon,
  label,
  value,
}: {
  helper: string;
  icon: string;
  label: string;
  value: ReactNode;
}) {
  return (
    <section className="group relative overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5E7F85]/5 transition group-hover:bg-[#5E7F85]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 truncate text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xs font-black text-[#5E7F85]">
          {icon}
        </div>
      </div>
      <div className="relative mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        {helper}
      </div>
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

function formatDate(value: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusTone(status: string): BadgeTone {
  if (status === "received" || status === "recorded") return "good";
  if (status === "ordered" || status === "partially_received") return "warn";
  if (status === "cancelled") return "bad";
  return "default";
}

export function RealPurchasesPage() {
  const [inventory, setInventory] = useState<FinanceInventoryProduct[]>([]);
  const [purchases, setPurchases] = useState<FinanceInventoryPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const loadPurchases = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      const data = await fetchFinanceInventory(signal);
      setInventory(data.inventory);
      setPurchases(data.purchases);
    } catch (error) {
      if (!signal?.aborted) {
        console.error("Purchase data could not be loaded.", error);
        setInventory([]);
        setPurchases([]);
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadPurchases(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadPurchases]);

  async function handleRecordPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const productId = String(form.get("product_id") ?? "");
    const quantity = Number(form.get("quantity"));
    const purchasePrice = Number(form.get("actual_purchase_price"));

    if (!productId || quantity < 1 || purchasePrice < 0) {
      setStatusMessage("Select a product and enter a valid quantity and cost.");
      return;
    }

    setIsSaving(true);
    setStatusMessage("");

    try {
      const response = await fetch(RECORD_PURCHASE_ENDPOINT, {
        body: JSON.stringify({
          actual_purchase_price: purchasePrice,
          note: String(form.get("note") ?? "").trim(),
          product_id: productId,
          quantity,
          status: "received",
          supplier_name: String(form.get("supplier_name") ?? "").trim(),
        }),
        headers: adminAuthHeaders({ "Content-Type": "application/json" }),
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        success?: boolean;
      } | null;

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message ?? "Purchase entry could not be saved.");
      }

      formElement.reset();
      setStatusMessage(payload?.message ?? "Purchase received and stock updated.");
      setShowEntryForm(false);
      await loadPurchases();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Purchase entry could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

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

  const totalPurchaseValue = purchases.reduce(
    (sum, purchase) => sum + purchase.total_cost,
    0,
  );
  const lowStockItems = inventory.filter((item) => item.low_stock).length;
  const inventoryValue = inventory.reduce(
    (sum, product) => sum + product.inventory_value,
    0,
  );

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
                Record received purchases in local MySQL and update inventory
                stock through the authenticated PHP workflow.
              </p>
            </div>
            <button
              className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-950"
              onClick={() => setShowEntryForm((current) => !current)}
              type="button"
            >
              {showEntryForm ? "Close Entry" : "Receive Purchase"}
            </button>
          </div>
        </section>

        {showEntryForm ? (
          <form className="grid gap-4 rounded-[2rem] border border-[#5E7F85]/20 bg-white p-6 shadow-sm lg:grid-cols-2" onSubmit={handleRecordPurchase}>
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-slate-950">Receive stock</h2>
              <p className="mt-1 text-sm text-slate-500">Saving this entry immediately increases available stock.</p>
            </div>
            <label className="text-sm font-semibold text-slate-700">
              Product
              <select className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3" name="product_id" required defaultValue="">
                <option value="" disabled>Select product</option>
                {inventory.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku || "No SKU"})</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Supplier
              <input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" name="supplier_name" placeholder="Supplier name" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Quantity
              <input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" min="1" name="quantity" required type="number" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Unit purchase cost (BDT)
              <input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" min="0" name="actual_purchase_price" required step="0.01" type="number" />
            </label>
            <label className="text-sm font-semibold text-slate-700 lg:col-span-2">
              Note
              <textarea className="mt-2 min-h-24 w-full rounded-2xl border border-slate-300 px-4 py-3" name="note" placeholder="Invoice, batch or internal note" />
            </label>
            <div className="flex items-center justify-between gap-4 lg:col-span-2">
              <p aria-live="polite" className="text-sm font-semibold text-slate-600">{statusMessage}</p>
              <button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-bold text-white disabled:bg-slate-300" disabled={isSaving} type="submit">
                {isSaving ? "Receiving..." : "Receive & Update Stock"}
              </button>
            </div>
          </form>
        ) : statusMessage ? (
          <div aria-live="polite" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">{statusMessage}</div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper={`${purchases.length} records tracked`}
            icon="BDT"
            label="Purchase Spend"
            value={formatMoney(totalPurchaseValue)}
          />
          <StatCard
            helper="Inventory monitor"
            icon="SKU"
            label="Tracked SKUs"
            value={inventory.length}
          />
          <StatCard
            helper="Need reorder soon"
            icon="Low"
            label="Low Stock"
            value={lowStockItems}
          />
          <StatCard
            helper="Stock valuation"
            icon="Val"
            label="Inventory Value"
            value={formatMoney(inventoryValue)}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">
                    Supplier Purchase Register
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Batch order expenses and supplier invoice audits from
                    `purchases`, `purchase_entries`, or `expenses` when present.
                  </p>
                </div>
                <Badge tone="brand">Live PHP</Badge>
              </div>
              <input
                className="mt-5 w-full max-w-md rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/15"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search purchase / supplier / status..."
                value={query}
              />
            </div>

            {isLoading ? (
              <div className="p-10 text-center text-sm font-semibold text-slate-500">
                Loading purchase records from local MySQL...
              </div>
            ) : filteredPurchases.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-stone-50 text-slate-500">
                    <tr>
                      {[
                        "Purchase",
                        "Supplier",
                        "Total Cost",
                        "Status",
                        "Note",
                        "Created",
                      ].map((head) => (
                        <th className="px-5 py-4 font-medium" key={head}>
                          {head}
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
                        <td className="px-5 py-4 font-black text-slate-950">
                          {formatText(purchase.purchase_number)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700">
                          {formatText(purchase.supplier_name)}
                        </td>
                        <td className="px-5 py-4 font-black text-slate-900">
                          {formatMoney(purchase.total_cost)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={getStatusTone(purchase.status)}>
                            {formatStatus(purchase.status)}
                          </Badge>
                        </td>
                        <td className="max-w-[260px] px-5 py-4 text-slate-600">
                          {formatText(purchase.note)}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(purchase.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-sm font-semibold text-slate-500">
                No purchase or expense rows found yet.
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold tracking-tight text-slate-950">
                Inventory Watch
              </h2>
              <div className="mt-4 space-y-3">
                {inventory.slice(0, 5).map((product) => (
                  <div
                    className="rounded-2xl bg-stone-50 px-4 py-3 text-sm"
                    key={product.id}
                  >
                    <div className="flex justify-between gap-3">
                      <b className="text-slate-900">{product.name}</b>
                      <Badge tone={product.low_stock ? "warn" : "good"}>
                        {product.stock} pcs
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      SKU {formatText(product.sku)} / Cost{" "}
                      {formatMoney(product.purchase_cost)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
              <h2 className="text-xl font-bold text-amber-900">Smart Alerts</h2>
              <div className="mt-4 space-y-3 text-sm text-amber-900">
                <div className="rounded-2xl bg-white/70 p-4">
                  {lowStockItems} SKUs are below the low-stock threshold.
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  Received purchases now update stock through the authenticated
                  PHP/MySQL transaction.
                </div>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
