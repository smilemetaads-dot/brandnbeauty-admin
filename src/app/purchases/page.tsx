import {
  type PurchaseEntriesFilters,
  getPurchaseEntriesFromSupabase,
  getPurchaseFormOptionsFromSupabase,
} from "@/features/purchases/purchases-data";
import { RealPurchasesPage } from "@/features/purchases/RealPurchasesPage";

export const dynamic = "force-dynamic";

type PurchasesPageProps = {
  searchParams?: Promise<{
    q?: string;
    sort?: string;
    status?: string;
    stock?: string;
    supplier?: string;
  }>;
};

function normalizeParam(value: string | undefined) {
  return value?.trim() || undefined;
}

export default async function PurchasesPage({
  searchParams,
}: PurchasesPageProps) {
  const params = await searchParams;
  const filters: PurchaseEntriesFilters = {
    search: normalizeParam(params?.q),
    sort: normalizeParam(params?.sort) as PurchaseEntriesFilters["sort"],
    status: normalizeParam(params?.status),
    stockReceived: normalizeParam(
      params?.stock,
    ) as PurchaseEntriesFilters["stockReceived"],
    supplierId: normalizeParam(params?.supplier),
  };
  const [{ entries, filters: filterOptions, kpis }, options] = await Promise.all([
    getPurchaseEntriesFromSupabase(filters),
    getPurchaseFormOptionsFromSupabase(),
  ]);

  return (
    <RealPurchasesPage
      activeFilters={filters}
      entries={entries}
      filterOptions={filterOptions}
      kpis={kpis}
      options={options}
    />
  );
}
