"use client";

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { bnbApiUrl } from "@/lib/bnb-api";

import { SupplierForm } from "./SupplierForm";

type RealSuppliersPageProps = {
  suppliers?: SupplierRecord[];
};

type SupplierRecord = {
  address: string | null;
  contact_person: string | null;
  created_at: string | null;
  email: string | null;
  id: string;
  name: string;
  notes: string | null;
  payment_terms: string | null;
  pendingPurchaseCount: number;
  phone: string | null;
  productCount: number;
  purchaseCount: number;
  status: string;
  totalPurchaseValue: number;
  updated_at: string | null;
};

type ApiSupplierRecord = {
  address?: string | null;
  contact_name?: string | null;
  contact_person?: string | null;
  created_at?: string | null;
  email?: string | null;
  id?: string | number | null;
  name?: string | null;
  notes?: string | null;
  payment_terms?: string | null;
  phone?: string | null;
  product_count?: string | number | null;
  status?: string | null;
  updated_at?: string | null;
};

const SUPPLIERS_ENDPOINT = bnbApiUrl("get_suppliers.php");

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
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    default: "bg-stone-50 text-slate-600",
  }[tone];

  return (
    <section className="group relative overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5E7F85]/5 transition group-hover:bg-[#5E7F85]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-sm font-black text-[#5E7F85]">
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
          ? "rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-bold text-white opacity-45"
          : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-400 opacity-75"
      }
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

function toNumber(value: string | number | null | undefined) {
  const numericValue = Number(value ?? 0);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function normalizeSupplier(supplier: ApiSupplierRecord): SupplierRecord {
  const productCount = toNumber(supplier.product_count);

  return {
    address: supplier.address ?? null,
    contact_person:
      supplier.contact_person ?? supplier.contact_name ?? null,
    created_at: supplier.created_at ?? null,
    email: supplier.email ?? null,
    id: String(supplier.id ?? ""),
    name: supplier.name?.trim() || "Unnamed Supplier",
    notes: supplier.notes ?? null,
    payment_terms: supplier.payment_terms ?? null,
    pendingPurchaseCount: 0,
    phone: supplier.phone ?? null,
    productCount,
    purchaseCount: productCount,
    status: supplier.status?.trim().toLowerCase() || "active",
    totalPurchaseValue: 0,
    updated_at: supplier.updated_at ?? supplier.created_at ?? null,
  };
}

function getSupplierScore(supplier: SupplierRecord) {
  const purchaseScore = Math.min(supplier.productCount * 12, 48);
  const valueScore = Math.min(Math.round(supplier.totalPurchaseValue / 2500), 32);
  const pendingPenalty = Math.min(supplier.pendingPurchaseCount * 8, 24);
  const statusBonus = supplier.status === "active" ? 20 : 4;

  return Math.max(
    0,
    Math.min(100, purchaseScore + valueScore + statusBonus - pendingPenalty),
  );
}

function SupplierFocusPanel({
  supplier,
}: {
  supplier: SupplierRecord | undefined;
}) {
  return (
    <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-medium text-slate-500">Supplier Profile</div>
      {supplier ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                {supplier.name}
              </h3>
              <div className="mt-1 text-xs font-semibold text-slate-500">
                {formatText(supplier.contact_person)}
              </div>
            </div>
            <Badge tone={getStatusTone(supplier.status)}>
              {formatStatus(supplier.status)}
            </Badge>
          </div>
          <div className="mt-5 space-y-3">
            <DetailRow label="Phone" value={formatText(supplier.phone)} />
            <DetailRow label="Email" value={formatText(supplier.email)} />
            <DetailRow label="Products" value={supplier.productCount} />
            <DetailRow
              label="Payment Terms"
              value={formatText(supplier.payment_terms)}
            />
            <DetailRow label="Updated" value={formatDate(supplier.updated_at)} />
            <DetailRow
              label="Pending"
              value={supplier.pendingPurchaseCount}
            />
            <DetailRow
              label="Purchase Value"
              value={formatMoney(supplier.totalPurchaseValue)}
            />
          </div>
          <div className="mt-5 rounded-2xl bg-stone-50 p-4">
            <div className="mb-2 flex justify-between text-xs font-bold text-slate-500">
              <span>Performance Health</span>
              <span>{getSupplierScore(supplier)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[#5E7F85]"
                style={{ width: `${getSupplierScore(supplier)}%` }}
              />
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            <DisabledButton primary>Create PO</DisabledButton>
            <DisabledButton>Payment Entry</DisabledButton>
            <DisabledButton>View Ledger</DisabledButton>
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

export function RealSuppliersPage({
  suppliers: initialSuppliers = [],
}: RealSuppliersPageProps) {
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>(initialSuppliers);
  const [isLoading, setIsLoading] = useState(!initialSuppliers.length);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    let isMounted = true;

    async function loadSuppliers() {
      try {
        setIsLoading(true);
        const response = await fetch(SUPPLIERS_ENDPOINT, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Suppliers request failed.");
        }

        const data = (await response.json()) as ApiSupplierRecord[];
        const liveSuppliers = Array.isArray(data)
          ? data.map(normalizeSupplier)
          : [];

        if (isMounted) {
          setSuppliers(liveSuppliers);
        }
      } catch (error) {
        console.error("Failed to load live suppliers.", error);

        if (isMounted) {
          setSuppliers([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSuppliers();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredSuppliers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      const matchesSearch =
        !normalizedQuery ||
        [
          supplier.name,
          supplier.contact_person,
          supplier.phone,
          supplier.email,
          supplier.status,
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));
      const matchesStatus =
        statusFilter === "All" ||
        supplier.status.toLowerCase() === statusFilter.toLowerCase() ||
        (statusFilter === "Due" && supplier.pendingPurchaseCount > 0) ||
        (statusFilter === "Primary" && supplier.productCount > 0);

      return matchesSearch && matchesStatus;
    });
  }, [query, statusFilter, suppliers]);

  const totalSuppliers = suppliers.length;
  const purchaseEntries = suppliers.reduce(
    (sum, supplier) => sum + supplier.productCount,
    0,
  );
  const pendingPurchases = suppliers.reduce(
    (sum, supplier) => sum + supplier.pendingPurchaseCount,
    0,
  );
  const topScore = suppliers.reduce(
    (best, supplier) => Math.max(best, getSupplierScore(supplier)),
    0,
  );
  const focusedSupplier = filteredSuppliers[0] ?? suppliers[0];

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Approved vendors"
            label="Total Suppliers"
            marker="SUP"
            value={totalSuppliers}
          />
          <StatCard
            helper="Pending purchase rows"
            label="Outstanding Due"
            marker="DUE"
            tone={pendingPurchases ? "warn" : "good"}
            value={pendingPurchases}
          />
          <StatCard
            helper="Restock planning"
            label="Products Supplied"
            marker="AVG"
            tone="brand"
            value={purchaseEntries}
          />
          <StatCard
            helper="Best vendor health"
            label="Top Score"
            marker="TOP"
            tone="good"
            value={`${topScore}%`}
          />
        </section>

        <section className="rounded-[2rem] border border-[#5E7F85]/15 bg-gradient-to-r from-[#5E7F85]/10 via-white to-stone-50 p-5 text-sm shadow-sm">
          <div className="font-bold text-slate-900">Procurement Focus</div>
          <div className="mt-1 text-slate-600">
            Live supplier records with {purchaseEntries} linked product rows. Purchase
            stock receive remains separate from this page.
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Vendor Control Room
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Suppliers Directory
                  </h2>
                  <div className="mt-1 text-sm text-slate-500">
                    Manage purchasing, payables, lead time and supplier health.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledButton>Export</DisabledButton>
                  <details className="group relative">
                    <summary className="cursor-pointer list-none rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white shadow-sm [&::-webkit-details-marker]:hidden">
                      Add Supplier
                    </summary>
                    <div className="absolute right-0 z-20 mt-3 w-[min(92vw,760px)] rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl">
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium text-slate-500">
                            Supplier Entry
                          </div>
                          <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                            Add New Supplier
                          </h3>
                          <p className="mt-2 text-sm text-slate-500">
                            Live supplier master save only. Purchases and stock
                            are not changed here.
                          </p>
                        </div>
                        <Badge tone="good">Live Save</Badge>
                      </div>
                      <SupplierForm mode="create" />
                    </div>
                  </details>
                </div>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-500 outline-none"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search supplier / contact / phone / email"
                  value={query}
                />
                <div className="flex flex-wrap gap-2">
                  {["All", "Active", "Primary", "Inactive", "Due"].map((item) => (
                    <button
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                        statusFilter === item
                          ? "border-[#5E7F85] bg-[#5E7F85] text-white"
                          : "border-slate-200 bg-white text-slate-500 hover:border-[#5E7F85]/40 hover:text-[#5E7F85]"
                      }`}
                      key={item}
                      onClick={() => setStatusFilter(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="p-10 text-center text-sm font-semibold text-slate-500">
                Loading suppliers from local MySQL...
              </div>
            ) : filteredSuppliers.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-[1040px] text-left text-sm">
                  <thead className="bg-stone-50 text-slate-500">
                    <tr>
                      {[
                        "Supplier",
                        "Contact Person",
                        "Phone / Email",
                        "Products",
                        "Score",
                        "Status",
                        "Action",
                      ].map((heading) => (
                        <th className="px-5 py-4 font-medium" key={heading}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSuppliers.map((supplier) => (
                      <Fragment key={supplier.id}>
                        <tr
                          className={`transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85] ${
                            supplier.pendingPurchaseCount > 0
                              ? "bg-amber-50/25"
                              : "bg-white"
                          }`}
                        >
                          <td className="px-5 py-4">
                            <div className="font-black text-slate-950">
                              {supplier.name}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              ID {supplier.id || "Not available"}
                            </div>
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-700">
                            {formatText(supplier.contact_person)}
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-700">
                              {formatText(supplier.phone)}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {formatText(supplier.email)}
                            </div>
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-700">
                            {supplier.productCount}
                          </td>
                          <td className="px-5 py-4">
                            <Badge tone={getSupplierScore(supplier) >= 80 ? "brand" : "warn"}>
                              {getSupplierScore(supplier)}%
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <Badge tone={getStatusTone(supplier.status)}>
                              {formatStatus(supplier.status)}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-2">
                              <DisabledButton>Open</DisabledButton>
                              <DisabledButton>PO</DisabledButton>
                            </div>
                          </td>
                        </tr>
                        <tr className="bg-stone-50/80">
                          <td className="px-5 py-4" colSpan={7}>
                            <details className="rounded-2xl border border-slate-200 bg-white p-4">
                              <summary className="cursor-pointer text-sm font-black text-[#5E7F85]">
                                Edit Supplier
                              </summary>
                              <div className="mt-5">
                                <SupplierForm mode="edit" supplier={supplier} />
                              </div>
                            </details>
                          </td>
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-sm font-semibold text-slate-500">
                No suppliers found. Use the live Add Supplier form to add the
                first supplier master record.
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <SupplierFocusPanel supplier={focusedSupplier} />

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Recent Suppliers
              </div>
              <div className="mt-4 space-y-3">
                {filteredSuppliers.slice(0, 3).map((supplier) => (
                  <div
                    className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 text-xs"
                    key={supplier.id}
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        {supplier.name}
                      </div>
                      <div className="text-slate-500">
                        {supplier.productCount} linked products
                      </div>
                    </div>
                    <div className="text-right">
                      <b>{formatText(supplier.phone)}</b>
                      <div className="mt-1">
                        <Badge
                          tone={
                            supplier.status === "active" ? "good" : "default"
                          }
                        >
                          {formatStatus(supplier.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                {!filteredSuppliers.length ? (
                  <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-500">
                    No supplier summary rows available.
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <h2 className="text-xl font-black text-amber-900">
                Restock Recommendation
              </h2>
              <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-amber-900">
                <div className="rounded-2xl bg-white/70 p-4">
                  Use live supplier rows for purchase planning only.
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  Create PO, payment entry, ledger, and receive stock controls
                  remain preview-only here.
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  Supplier create/edit stays connected and isolated to supplier
                  master data.
                </div>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
