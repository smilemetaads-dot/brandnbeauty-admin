import type { Metadata } from "next";
import Link from "next/link";

import { StorefrontProductCard } from "@/features/storefront-preview/StorefrontProductCard";
import { getStorefrontPreviewSnapshot, type PreviewProduct } from "@/features/storefront-preview/storefront-preview-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Products · BrandnBeauty Preview",
  description: "Search and browse BrandnBeauty's live product catalog.",
  robots: { follow: false, index: false },
};

type ProductSearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value || "").trim();
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function matches(product: PreviewProduct, query: string) {
  if (!query) return true;
  return [product.name, product.brand, product.category, product.sku, product.shortDescription]
    .join(" ")
    .toLocaleLowerCase()
    .includes(query);
}

export default async function ProductsPage({ searchParams }: { searchParams: ProductSearchParams }) {
  const [snapshot, rawParams] = await Promise.all([getStorefrontPreviewSnapshot(), searchParams]);
  const queryText = first(rawParams.q);
  const query = queryText.toLocaleLowerCase();
  const brand = first(rawParams.brand);
  const category = first(rawParams.category);
  const availability = ["in_stock", "out_of_stock"].includes(first(rawParams.availability)) ? first(rawParams.availability) : "all";
  const sort = ["name_desc", "price_asc", "price_desc"].includes(first(rawParams.sort)) ? first(rawParams.sort) : "name_asc";
  const requestedPage = Math.max(1, Number.parseInt(first(rawParams.page) || "1", 10) || 1);

  const brands = unique(snapshot.products.map((product) => product.brand));
  const categories = unique(snapshot.products.map((product) => product.category));
  const filtered = snapshot.products.filter((product) => (
    matches(product, query) &&
    (!brand || product.brand === brand) &&
    (!category || product.category === category) &&
    (availability === "all" || (availability === "in_stock" ? product.available : !product.available))
  ));

  filtered.sort((left, right) => {
    if (sort === "price_asc") return left.price - right.price || left.name.localeCompare(right.name);
    if (sort === "price_desc") return right.price - left.price || left.name.localeCompare(right.name);
    if (sort === "name_desc") return right.name.localeCompare(left.name);
    return left.name.localeCompare(right.name);
  });

  const pageSize = 24;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(requestedPage, pageCount);
  const visibleProducts = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (queryText) params.set("q", queryText);
    if (brand) params.set("brand", brand);
    if (category) params.set("category", category);
    if (availability !== "all") params.set("availability", availability);
    if (sort !== "name_asc") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    const suffix = params.toString();
    return `/storefront-preview/products${suffix ? `?${suffix}` : ""}`;
  };

  const filtersActive = Boolean(queryText || brand || category || availability !== "all" || sort !== "name_asc");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-[#3b6c70]">Live product discovery</p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-[-.05em]">Find your products</h1>
          <p className="mt-2 text-sm text-[#6c7a74]">Search, filter and open stock-safe details from the existing MySQL catalog.</p>
        </div>
        <span className="rounded-full bg-[#edf4f1] px-3 py-2 text-xs font-semibold text-[#35666b]">Preview · no order mutation</span>
      </div>

      <form id="product-search" action="/storefront-preview/products" className="mt-7 rounded-[24px] border border-[#dfe7e3] bg-white p-4 shadow-sm shadow-[#173f42]/5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,2fr)_repeat(4,minmax(140px,1fr))_auto]">
          <label className="grid gap-1.5 text-xs font-bold text-[#55665f]">
            Search
            <input name="q" defaultValue={queryText} maxLength={120} placeholder="Product, brand, category or SKU" className="h-12 min-w-0 rounded-xl border border-[#dce5e1] bg-[#fbfcfb] px-3 text-sm font-medium text-[#17231f] outline-none focus:border-[#35666b] focus:ring-2 focus:ring-[#35666b]/15"/>
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-[#55665f]">
            Brand
            <select name="brand" defaultValue={brand} className="h-12 min-w-0 rounded-xl border border-[#dce5e1] bg-[#fbfcfb] px-3 text-sm font-medium outline-none focus:border-[#35666b]">
              <option value="">All brands</option>
              {brands.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-[#55665f]">
            Category
            <select name="category" defaultValue={category} className="h-12 min-w-0 rounded-xl border border-[#dce5e1] bg-[#fbfcfb] px-3 text-sm font-medium outline-none focus:border-[#35666b]">
              <option value="">All categories</option>
              {categories.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-[#55665f]">
            Availability
            <select name="availability" defaultValue={availability} className="h-12 min-w-0 rounded-xl border border-[#dce5e1] bg-[#fbfcfb] px-3 text-sm font-medium outline-none focus:border-[#35666b]">
              <option value="all">All stock states</option>
              <option value="in_stock">In stock</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-[#55665f]">
            Sort
            <select name="sort" defaultValue={sort} className="h-12 min-w-0 rounded-xl border border-[#dce5e1] bg-[#fbfcfb] px-3 text-sm font-medium outline-none focus:border-[#35666b]">
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
              <option value="price_asc">Price low–high</option>
              <option value="price_desc">Price high–low</option>
            </select>
          </label>
          <button type="submit" className="mt-auto flex h-12 items-center justify-center rounded-xl bg-[#35666b] px-5 text-sm font-bold text-white hover:bg-[#2d5b60]">Apply</button>
        </div>
      </form>

      <div className="mt-7 flex min-h-11 flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#65756e]">{filtered.length} of {snapshot.products.length} active products{filtered.length ? ` · Page ${currentPage} of ${pageCount}` : ""}</p>
        {filtersActive ? <Link href="/storefront-preview/products" className="flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-[#35666b] hover:bg-[#edf4f1]">Clear search and filters</Link> : null}
      </div>

      {snapshot.products.length === 0 ? (
        <div className="mt-4 rounded-[24px] border border-dashed border-[#cdd9d4] bg-white px-5 py-20 text-center text-sm text-[#708079]">No active products are available. The preview never creates sample catalog data.</div>
      ) : filtered.length ? (
        <><div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">{visibleProducts.map((product) => <StorefrontProductCard key={product.id} product={product}/>)}</div>{pageCount > 1 ? <nav aria-label="Product pages" className="mt-10 flex items-center justify-center gap-3"><Link aria-disabled={currentPage === 1} href={pageHref(Math.max(1, currentPage - 1))} className={`flex min-h-11 items-center rounded-xl border px-4 text-sm font-bold ${currentPage === 1 ? "pointer-events-none border-[#e7ece9] text-[#a3aca8]" : "border-[#cfdad5] text-[#35666b]"}`}>← Previous</Link><span className="text-xs font-bold text-[#6d7b75]">{currentPage} / {pageCount}</span><Link aria-disabled={currentPage === pageCount} href={pageHref(Math.min(pageCount, currentPage + 1))} className={`flex min-h-11 items-center rounded-xl border px-4 text-sm font-bold ${currentPage === pageCount ? "pointer-events-none border-[#e7ece9] text-[#a3aca8]" : "border-[#cfdad5] text-[#35666b]"}`}>Next →</Link></nav> : null}</>
      ) : (
        <div className="mt-4 rounded-[24px] border border-dashed border-[#cdd9d4] bg-white px-5 py-20 text-center">
          <p className="font-bold text-[#263c36]">No products match these filters.</p>
          <p className="mt-2 text-sm text-[#708079]">Try a shorter search or clear one of the filters.</p>
          <Link href="/storefront-preview/products" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#edf4f1] px-4 text-sm font-bold text-[#35666b]">Show all products</Link>
        </div>
      )}
    </div>
  );
}
