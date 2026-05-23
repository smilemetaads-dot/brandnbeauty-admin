import Link from "next/link";

import type {
  PurchaseEntriesFilters,
  PurchaseFilterOptions,
} from "./purchases-data";

type PurchaseFiltersProps = {
  activeFilters: PurchaseEntriesFilters;
  filterOptions: PurchaseFilterOptions;
};

const inputClassName =
  "mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#527B86] focus:ring-2 focus:ring-[#527B86]/15";

const labelClassName = "text-sm font-medium text-slate-600";

function hasActiveFilters(filters: PurchaseEntriesFilters) {
  return Boolean(
    filters.search ||
      filters.supplierId ||
      filters.status ||
      (filters.stockReceived && filters.stockReceived !== "all") ||
      (filters.sort && filters.sort !== "newest"),
  );
}

export function PurchaseFilters({
  activeFilters,
  filterOptions,
}: PurchaseFiltersProps) {
  const active = hasActiveFilters(activeFilters);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <form action="/purchases" className="grid gap-4 lg:grid-cols-6">
        <label className={`${labelClassName} lg:col-span-2`}>
          Search Purchase
          <input
            className={inputClassName}
            defaultValue={activeFilters.search ?? ""}
            name="q"
            placeholder="Purchase number"
            type="search"
          />
        </label>

        <label className={labelClassName}>
          Supplier
          <select
            className={inputClassName}
            defaultValue={activeFilters.supplierId ?? ""}
            name="supplier"
          >
            <option value="">All suppliers</option>
            {filterOptions.suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClassName}>
          Status
          <select
            className={inputClassName}
            defaultValue={activeFilters.status ?? ""}
            name="status"
          >
            <option value="">All statuses</option>
            {filterOptions.statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClassName}>
          Stock
          <select
            className={inputClassName}
            defaultValue={activeFilters.stockReceived ?? "all"}
            name="stock"
          >
            <option value="all">All stock states</option>
            <option value="received">Received</option>
            <option value="not_received">Not received</option>
          </select>
        </label>

        <label className={labelClassName}>
          Sort
          <select
            className={inputClassName}
            defaultValue={activeFilters.sort ?? "newest"}
            name="sort"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest_value">Highest value</option>
            <option value="lowest_value">Lowest value</option>
          </select>
        </label>

        <div className="flex flex-wrap items-end gap-2 lg:col-span-6">
          <button
            className="rounded-2xl bg-[#527B86] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-950"
            type="submit"
          >
            Apply
          </button>
          <Link
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-[#527B86]/30 hover:text-[#527B86]"
            href="/purchases"
          >
            Clear
          </Link>
          {active ? (
            <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-500">
              Filtered view active
            </div>
          ) : (
            <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-500">
              Showing all purchase entries
            </div>
          )}
        </div>
      </form>
    </section>
  );
}
