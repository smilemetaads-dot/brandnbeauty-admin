"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

import type { CustomerSummaryRecord } from "./customers-data";

type ApiCustomerRecord = {
  id?: string | number | null;
  customer_name?: string | null;
  email?: string | null;
  last_city?: string | null;
  last_delivery_address?: string | null;
  last_known_address?: string | null;
  latest_order_at?: string | null;
  lifetime_value?: string | number | null;
  name?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  status?: string | null;
  total_orders?: string | number | null;
  total_spend?: string | number | null;
};

type CustomersApiResponse = {
  success?: boolean;
  data?: ApiCustomerRecord[];
  customers?: ApiCustomerRecord[];
  message?: string;
};

type RealCustomersPageProps = {
  customers?: CustomerSummaryRecord[];
};

const currencyFormatter = new Intl.NumberFormat("en-BD", {
  currency: "BDT",
  maximumFractionDigits: 0,
  style: "currency",
});

function formatMoney(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "Tk 0";
  }

  return currencyFormatter.format(amount).replace("BDT", "Tk");
}

function formatText(value: string | null | undefined, fallback = "Not available") {
  const normalized = value?.trim();

  return normalized || fallback;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "No orders yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No orders yet";
  }

  return date.toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatLocation(customer: CustomerSummaryRecord) {
  const parts = [customer.area, customer.district]
    .map((part) => part?.trim())
    .filter(Boolean);

  if (parts.length > 0) {
    return parts.join(", ");
  }

  return formatText(customer.address, "No location saved");
}

function normalizeBangladeshSearchPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (/^01\d{9}$/.test(digits)) {
    return digits;
  }

  if (/^8801\d{9}$/.test(digits)) {
    return `0${digits.slice(3)}`;
  }

  return digits;
}

function normalizeCustomer(customer: ApiCustomerRecord): CustomerSummaryRecord {
  const totalOrders = Number(customer.total_orders ?? 0);
  const totalSpend = Number(customer.lifetime_value ?? customer.total_spend ?? 0);
  const orderCount = Number.isFinite(totalOrders) ? totalOrders : 0;
  const status = customer.status?.trim() || (orderCount >= 2 ? "repeat" : "new");
  const createdAt = customer.latest_order_at ?? null;
  const phone = customer.phone_number?.trim() || customer.phone?.trim() || "Not available";

  return {
    address: customer.last_delivery_address ?? customer.last_known_address ?? null,
    area: null,
    cancelledCount: 0,
    deliveredCount: status === "delivered" ? 1 : 0,
    delivery_zone: null,
    district: customer.last_city ?? null,
    email: customer.email ?? null,
    lastOrderAt: createdAt,
    lastOrderId: String(customer.id ?? ""),
    lastOrderNumber: null,
    lastOrderStatus: status,
    name: customer.customer_name?.trim() || customer.name?.trim() || "Unknown Customer",
    orderCount,
    phone,
    recentOrders: [],
    returnedCount: 0,
    riskLabel: "New Customer",
    totalDue: 0,
    totalSpent: Number.isFinite(totalSpend) ? totalSpend : 0,
  };
}

function StatCard({ helper, icon, label, value }: { helper: string; icon: string; label: string; value: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</div>
          <p className="mt-1 text-sm text-slate-500">{helper}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-sm font-bold text-[#3D676E]">
          {icon}
        </span>
      </div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <b className="max-w-[65%] text-right text-slate-800">{value}</b>
    </div>
  );
}

function CustomerQuickView({ customer }: { customer: CustomerSummaryRecord | undefined }) {
  if (!customer) {
    return (
      <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-medium text-slate-500">Customer details</div>
        <h3 className="mt-2 text-lg font-bold text-slate-950">Select a customer</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Choose a customer from the directory to see contact details and the latest order link.
        </p>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-medium text-slate-500">Customer details</p>
        <h3 className="mt-2 text-xl font-bold text-slate-950">{customer.name}</h3>
        <p className="mt-1 text-sm text-slate-500">{customer.phone}</p>
      </div>

      <dl className="mt-5 space-y-3">
        <DetailRow label="Email" value={formatText(customer.email)} />
        <DetailRow label="Address" value={formatText(customer.address)} />
        <DetailRow label="Location" value={formatLocation(customer)} />
        <DetailRow label="Total Orders" value={customer.orderCount} />
        <DetailRow label="Total Spent" value={formatMoney(customer.totalSpent)} />
        <DetailRow label="Last Order" value={formatDate(customer.lastOrderAt)} />
      </dl>

      <div className="mt-6 grid gap-3">
        <Link className="inline-flex items-center justify-center rounded-xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#4A6F75] focus:outline-none focus:ring-2 focus:ring-[#5E7F85] focus:ring-offset-2" href={`/customers/profile?phone=${encodeURIComponent(customer.phone)}`}>
          View Full Profile
        </Link>
        {customer.lastOrderId ? (
          <Link className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#5E7F85] hover:text-[#3D676E] focus:outline-none focus:ring-2 focus:ring-[#5E7F85] focus:ring-offset-2" href={`/orders/details?id=${customer.lastOrderId}`}>
            View Latest Order
          </Link>
        ) : null}
      </div>
    </aside>
  );
}

function CustomerMobileCard({
  customer,
  onSelect,
}: {
  customer: CustomerSummaryRecord;
  onSelect: () => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <button
        className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-[#5E7F85] focus:ring-offset-2"
        onClick={onSelect}
        type="button"
      >
        <div className="font-semibold text-slate-950">{customer.name}</div>
        <div className="mt-1 text-sm font-medium text-slate-700">{customer.phone}</div>
        {customer.email ? <div className="mt-1 text-xs text-slate-500">{customer.email}</div> : null}
      </button>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Orders</dt>
          <dd className="mt-1 font-semibold text-slate-800">{customer.orderCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Total Spent</dt>
          <dd className="mt-1 font-semibold text-slate-800">{formatMoney(customer.totalSpent)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Last Order</dt>
          <dd className="mt-1 text-slate-700">{formatDate(customer.lastOrderAt)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Location</dt>
          <dd className="mt-1 text-slate-700">{formatLocation(customer)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link className="inline-flex rounded-lg bg-[#5E7F85] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#4A6F75] focus:outline-none focus:ring-2 focus:ring-[#5E7F85] focus:ring-offset-2" href={`/customers/profile?phone=${encodeURIComponent(customer.phone)}`}>
          View Profile
        </Link>
        {customer.lastOrderId ? (
          <Link className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-[#5E7F85] hover:text-[#3D676E] focus:outline-none focus:ring-2 focus:ring-[#5E7F85] focus:ring-offset-2" href={`/orders/details?id=${customer.lastOrderId}`}>
            Latest Order
          </Link>
        ) : null}
      </div>
    </article>
  );
}
export function RealCustomersPage({ customers: initialCustomers = [] }: RealCustomersPageProps) {
  const [customers, setCustomers] = useState<CustomerSummaryRecord[]>(initialCustomers);
  const [query, setQuery] = useState("");
  const [selectedPhone, setSelectedPhone] = useState<string>(initialCustomers[0]?.phone ?? "");
  const [isLoading, setIsLoading] = useState(initialCustomers.length === 0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadCustomers() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(bnbApiUrl("get_customers.php"), {
        cache: "no-store",
        headers: adminAuthHeaders(),
      });
      const payload = (await response.json()) as CustomersApiResponse;

      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || "Customer list request failed.");
      }

      const rawCustomers = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.customers) ? payload.customers : [];
      const normalizedCustomers = rawCustomers.map(normalizeCustomer);

      setCustomers(normalizedCustomers);
      setSelectedPhone((current) => current || normalizedCustomers[0]?.phone || "");
    } catch (error) {
      console.error("Unable to load customers", error);
      setErrorMessage("Customers could not be loaded. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (initialCustomers.length > 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadCustomers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialCustomers.length]);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return customers;
    }

    const normalizedPhoneQuery = normalizeBangladeshSearchPhone(normalizedQuery);

    return customers.filter((customer) => {
      const searchableValues = [customer.name, customer.email, customer.phone, customer.address, customer.district, customer.area]
        .filter(Boolean)
        .map((value) => value?.toLowerCase() ?? "");
      const phoneMatch = normalizedPhoneQuery !== "" && normalizeBangladeshSearchPhone(customer.phone).includes(normalizedPhoneQuery);

      return phoneMatch || searchableValues.some((value) => value.includes(normalizedQuery));
    });
  }, [customers, query]);

  const totalOrders = customers.reduce((sum, customer) => sum + customer.orderCount, 0);
  const selectedCustomer = filteredCustomers.find((customer) => customer.phone === selectedPhone) ?? filteredCustomers[0] ?? customers[0];

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">Customers</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Find customers and review their contact details and order history.
              </p>
            </div>
            <button className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#5E7F85] hover:text-[#3D676E] focus:outline-none focus:ring-2 focus:ring-[#5E7F85] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60" disabled={isLoading} onClick={() => void loadCustomers()} type="button">
              Refresh
            </button>
          </div>

          <label className="mt-6 block text-sm font-semibold text-slate-700" htmlFor="customer-search">
            Search customers
          </label>
          <input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/20" id="customer-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, phone or email" type="search" value={query} />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <StatCard helper="Customer records from local order history." icon="C" label="Total Customers" value={customers.length} />
          <StatCard helper="Completed and in-progress order records linked to customers." icon="O" label="Total Orders" value={totalOrders} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-950">Customer Directory</h2>
              <p className="mt-1 text-sm text-slate-500">Showing {filteredCustomers.length} of {customers.length} customers.</p>
            </div>

            {isLoading ? (
              <div className="p-10 text-center text-sm font-medium text-slate-500">Loading customers…</div>
            ) : errorMessage ? (
              <div className="p-10 text-center text-sm font-medium text-rose-600">{errorMessage}</div>
            ) : customers.length === 0 ? (
              <div className="p-10 text-center text-sm font-medium text-slate-500">No customers found.</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-10 text-center text-sm font-medium text-slate-500">No customers match your search.</div>
            ) : (
              <>
                <div className="grid gap-3 p-4 md:hidden">
                {filteredCustomers.map((customer) => (
                  <CustomerMobileCard
                    customer={customer}
                    key={`${customer.lastOrderId}-${customer.phone}-card`}
                    onSelect={() => setSelectedPhone(customer.phone)}
                  />
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Phone</th>
                      <th className="px-5 py-3">Orders</th>
                      <th className="px-5 py-3">Total Spent</th>
                      <th className="px-5 py-3">Location</th>
                      <th className="px-5 py-3">Last Order</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredCustomers.map((customer) => (
                      <tr className="transition hover:bg-slate-50" key={`${customer.lastOrderId}-${customer.phone}`} onClick={() => setSelectedPhone(customer.phone)}>
                        <td className="px-5 py-4 align-top">
                          <div className="font-semibold text-slate-950">{customer.name}</div>
                          {customer.email ? <div className="mt-1 text-xs text-slate-500">{customer.email}</div> : null}
                        </td>
                        <td className="px-5 py-4 align-top font-medium text-slate-700">{customer.phone}</td>
                        <td className="px-5 py-4 align-top text-slate-700">{customer.orderCount}</td>
                        <td className="px-5 py-4 align-top font-semibold text-slate-800">{formatMoney(customer.totalSpent)}</td>
                        <td className="max-w-xs px-5 py-4 align-top text-slate-600">{formatLocation(customer)}</td>
                        <td className="px-5 py-4 align-top text-slate-600">{formatDate(customer.lastOrderAt)}</td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex flex-col items-end gap-2">
                            <Link className="inline-flex rounded-lg bg-[#5E7F85] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#4A6F75] focus:outline-none focus:ring-2 focus:ring-[#5E7F85] focus:ring-offset-2" href={`/customers/profile?phone=${encodeURIComponent(customer.phone)}`}>
                              View Profile
                            </Link>
                            {customer.lastOrderId ? (
                              <Link className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-[#5E7F85] hover:text-[#3D676E] focus:outline-none focus:ring-2 focus:ring-[#5E7F85] focus:ring-offset-2" href={`/orders/details?id=${customer.lastOrderId}`}>
                                Latest Order
                              </Link>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </div>

          <CustomerQuickView customer={selectedCustomer} />
        </section>
      </div>
    </AdminShell>
  );
}



