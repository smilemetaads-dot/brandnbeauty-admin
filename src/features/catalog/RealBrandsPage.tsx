"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { saveBrand } from "@/features/catalog/brand-actions";

import type { BrandRecord } from "./brands-data";

type RealBrandsPageProps = {
  brands: BrandRecord[];
  editBrandId?: string;
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const inputClassName =
  "mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#527B86] focus:ring-2 focus:ring-[#527B86]/15";

const labelClassName = "text-sm font-medium text-slate-600";

const getStatusLabel = (status: string | null) =>
  status === "inactive" ? "Inactive" : "Active";

const getVisibilityLabel = (status: string | null) =>
  status === "inactive" ? "Hidden" : "Visible";

const getStatusTone = (status: string | null): BadgeTone =>
  status === "inactive" ? "warn" : "good";

const getSeoScore = (brand: BrandRecord) => {
  let score = 50;

  if (brand.meta_title) {
    score += 20;
  }

  if (brand.meta_description) {
    score += 20;
  }

  if (brand.slug) {
    score += 10;
  }

  return score;
};

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
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  helper,
  active = false,
}: {
  label: string;
  value: string;
  helper: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border bg-white p-5 shadow-sm ${
        active ? "border-[#527B86] ring-2 ring-[#527B86]/15" : "border-slate-200"
      }`}
    >
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </div>
      <div className="mt-3 inline-flex rounded-full bg-stone-50 px-3 py-1 text-xs font-semibold text-slate-600">
        {helper}
      </div>
    </div>
  );
}

function DisabledAction({ children }: { children: ReactNode }) {
  return (
    <button
      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-400"
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

export function RealBrandsPage({ brands, editBrandId }: RealBrandsPageProps) {
  const [state, formAction, isPending] = useActionState(saveBrand, {
    ok: false,
    message: "",
  });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedBrandId, setSelectedBrandId] = useState(editBrandId ?? "");
  const editingBrand =
    brands.find((brand) => brand.id === editBrandId) ?? null;
  const isEditing = Boolean(editingBrand);
  const activeCount = brands.filter((brand) => brand.status !== "inactive")
    .length;
  const inactiveCount = brands.length - activeCount;
  const featuredCount = brands.filter((brand) => brand.featured).length;
  const needsSeoCount = brands.filter((brand) => getSeoScore(brand) < 80).length;
  const imageReadyCount = brands.filter((brand) => brand.image).length;
  const averageSeo = brands.length
    ? Math.round(
        brands.reduce((sum, brand) => sum + getSeoScore(brand), 0) /
          brands.length,
      )
    : 0;
  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      const query = search.toLowerCase();
      const matchesSearch =
        !query ||
        `${brand.name} ${brand.slug} ${brand.status ?? ""}`
          .toLowerCase()
          .includes(query);
      const matchesFilter =
        filter === "All" ||
        (filter === "Featured" && brand.featured) ||
        (filter === "Visible" && brand.status !== "inactive") ||
        (filter === "Hidden" && brand.status === "inactive") ||
        (filter === "Needs Work" && getSeoScore(brand) < 80) ||
        (filter === "Image Ready" && Boolean(brand.image));

      return matchesSearch && matchesFilter;
    });
  }, [brands, filter, search]);
  const selectedBrand =
    editingBrand ??
    brands.find((brand) => brand.id === selectedBrandId) ??
    filteredBrands[0] ??
    brands[0] ??
    null;

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                Catalog
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Brands Control Room
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Manage live Supabase brands, storefront visibility, featured
                placement, SEO metadata, and display order without fake source
                actions or hard deletes.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DisabledAction>Import Not Connected</DisabledAction>
              <DisabledAction>Export Not Connected</DisabledAction>
              <Link
                className="rounded-2xl bg-[#527B86] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-950"
                href="/brands"
              >
                Add Brand
              </Link>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-4">
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Visible: <b className="text-[#527B86]">{activeCount}</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Hidden: <b className="text-amber-700">{inactiveCount}</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Avg SEO score: <b className="text-emerald-700">{averageSeo}/100</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Needs work: <b className="text-amber-700">{needsSeoCount}</b>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            active
            helper="Live Supabase rows"
            label="Total Brands"
            value={String(brands.length)}
          />
          <StatCard
            helper="Homepage placement"
            label="Featured Brands"
            value={String(featuredCount)}
          />
          <StatCard
            helper="Image URL saved"
            label="Image Ready"
            value={`${imageReadyCount}/${brands.length}`}
          />
          <StatCard
            active
            helper="Meta title/description"
            label="SEO Needs Work"
            value={String(needsSeoCount)}
          />
        </section>

        <section className="rounded-[2rem] border border-[#527B86]/15 bg-[#527B86]/5 p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-bold text-slate-950">
                Revenue Control
              </div>
              <div className="mt-1 text-sm leading-6 text-slate-600">
                The source page includes date-wise revenue and product mapping.
                Those analytics are shown as safe placeholders until backed by
                live tables.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <DisabledAction>Revenue Not Connected</DisabledAction>
              <DisabledAction>Bulk Featured Not Connected</DisabledAction>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold tracking-tight text-slate-950">
                      {isEditing ? "Edit Brand" : "Add Brand"}
                    </h2>
                    <Badge tone={isEditing ? "brand" : "default"}>
                      Live Save
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    Create and update brand records through the Supabase server
                    action.
                  </p>
                </div>
                {isEditing ? (
                  <Link
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-[#527B86] transition hover:bg-stone-50"
                    href="/brands"
                  >
                    Clear Edit
                  </Link>
                ) : null}
              </div>

              <form action={formAction} className="grid gap-5 sm:grid-cols-2">
                <input name="id" type="hidden" value={editingBrand?.id ?? ""} />

                <label className={labelClassName}>
                  Name
                  <input
                    className={inputClassName}
                    defaultValue={editingBrand?.name ?? ""}
                    name="name"
                    placeholder="Brand name"
                    required
                    type="text"
                  />
                </label>

                <label className={labelClassName}>
                  Slug
                  <input
                    className={inputClassName}
                    defaultValue={editingBrand?.slug ?? ""}
                    name="slug"
                    placeholder="brand-slug"
                    required
                    type="text"
                  />
                </label>

                <label className={labelClassName}>
                  Image URL
                  <input
                    className={inputClassName}
                    defaultValue={editingBrand?.image ?? ""}
                    name="image"
                    placeholder="Image URL"
                    type="text"
                  />
                </label>

                <label className={labelClassName}>
                  Status
                  <select
                    className={inputClassName}
                    defaultValue={editingBrand?.status ?? "active"}
                    name="status"
                  >
                    <option value="active">Active / Visible</option>
                    <option value="inactive">Inactive / Hidden</option>
                  </select>
                </label>

                <label className={labelClassName}>
                  Meta title
                  <input
                    className={inputClassName}
                    defaultValue={editingBrand?.meta_title ?? ""}
                    name="metaTitle"
                    placeholder="Meta title"
                    type="text"
                  />
                </label>

                <label className={labelClassName}>
                  Sort order
                  <input
                    className={inputClassName}
                    defaultValue={editingBrand?.sort_order ?? 0}
                    name="sortOrder"
                    step="1"
                    type="number"
                  />
                </label>

                <label className={`${labelClassName} sm:col-span-2`}>
                  Meta description
                  <textarea
                    className={`${inputClassName} min-h-24 resize-y`}
                    defaultValue={editingBrand?.meta_description ?? ""}
                    name="metaDescription"
                    placeholder="Meta description"
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Homepage Featured
                  <input
                    className="h-4 w-4 rounded border-slate-300 text-[#527B86]"
                    defaultChecked={editingBrand?.featured ?? false}
                    name="featured"
                    type="checkbox"
                  />
                </label>

                {state.message ? (
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                      state.ok
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {state.message}
                  </div>
                ) : null}

                <div className="flex items-end">
                  <button
                    className="w-full rounded-2xl bg-[#527B86] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={isPending}
                    type="submit"
                  >
                    {isPending
                      ? "Saving..."
                      : isEditing
                        ? "Save Changes"
                        : "Save Brand"}
                  </button>
                </div>
              </form>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold tracking-tight text-slate-950">
                        Brand Revenue Directory
                      </h2>
                      <Badge tone="brand">Live Brands</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Source-style directory using current live brand fields.
                    </p>
                  </div>
                  <DisabledAction>Featured Order Not Connected</DisabledAction>
                </div>
                <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
                  <div className="relative max-w-xl">
                    <input
                      className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-10 text-sm outline-none placeholder:text-slate-400"
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search brand / slug / status..."
                      type="search"
                      value={search}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      Search
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "All",
                      "Featured",
                      "Visible",
                      "Hidden",
                      "Image Ready",
                      "Needs Work",
                    ].map((item) => (
                      <button
                        className={`rounded-full px-4 py-2 text-xs font-semibold ${
                          filter === item
                            ? "bg-[#527B86] text-white"
                            : "border border-slate-200 bg-white text-slate-600"
                        }`}
                        key={item}
                        onClick={() => setFilter(item)}
                        type="button"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-stone-50 text-slate-500">
                    <tr>
                      {[
                        "Brand",
                        "Visibility",
                        "Featured",
                        "SEO",
                        "Assets",
                        "Sort",
                        "Action",
                      ].map((head) => (
                        <th className="px-5 py-4 font-medium" key={head}>
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBrands.length > 0 ? (
                      filteredBrands.map((brand) => (
                        <tr
                          className={`cursor-pointer border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#527B86] ${
                            selectedBrand?.id === brand.id
                              ? "bg-[#527B86]/5 shadow-[inset_3px_0_0_#527B86]"
                              : getSeoScore(brand) < 80
                                ? "bg-amber-50/25"
                                : "bg-white"
                          }`}
                          key={brand.id}
                          onClick={() => setSelectedBrandId(brand.id)}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#527B86]/10 text-xs font-black text-[#527B86]">
                                {brand.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-950">
                                  {brand.name}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                  /brands?edit={brand.id} / {brand.slug}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <Badge tone={getStatusTone(brand.status)}>
                              {getVisibilityLabel(brand.status)}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <Badge tone={brand.featured ? "brand" : "default"}>
                              {brand.featured ? "Featured" : "Standard"}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <Badge
                              tone={getSeoScore(brand) >= 80 ? "good" : "warn"}
                            >
                              {getSeoScore(brand)}/100
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <Badge tone={brand.image ? "good" : "warn"}>
                              {brand.image ? "Image URL" : "No Image"}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-700">
                            {brand.sort_order ?? 0}
                          </td>
                          <td
                            className="px-5 py-4"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Link
                              className="rounded-xl bg-[#527B86]/10 px-3 py-2 text-xs font-semibold text-[#527B86] transition hover:bg-[#527B86] hover:text-white"
                              href={`/brands?edit=${brand.id}`}
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          className="px-5 py-14 text-center text-sm text-slate-500"
                          colSpan={7}
                        >
                          No brands found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Brand Page Preview
                  </div>
                  <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    {selectedBrand?.name ?? "No brand selected"}
                  </h3>
                  <div className="mt-1 text-xs text-slate-500">
                    {selectedBrand ? `/brand/${selectedBrand.slug}` : "Create a brand to preview"}
                  </div>
                </div>
                <Badge tone={selectedBrand?.featured ? "brand" : "default"}>
                  {selectedBrand?.featured ? "Featured" : "Standard"}
                </Badge>
              </div>
              <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-stone-50 p-4">
                <div className="rounded-3xl bg-gradient-to-br from-[#527B86] via-[#6f949a] to-[#d9e5e1] p-5 text-white shadow-sm">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-lg font-black">
                    {selectedBrand?.name.slice(0, 2).toUpperCase() ?? "BR"}
                  </div>
                  <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
                    Live Brand
                  </div>
                  <div className="mt-2 text-3xl font-black tracking-tight">
                    {selectedBrand?.name ?? "Brand"}
                  </div>
                  <div className="mt-2 text-sm text-white/85">
                    {selectedBrand?.meta_description ??
                      "Brand metadata appears here after saving."}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone={selectedBrand ? "brand" : "default"}>
                    SEO {selectedBrand ? getSeoScore(selectedBrand) : 0}/100
                  </Badge>
                  <Badge tone={selectedBrand?.image ? "good" : "warn"}>
                    {selectedBrand?.image ? "Image URL Saved" : "Image Missing"}
                  </Badge>
                  <Badge tone={getStatusTone(selectedBrand?.status ?? null)}>
                    {getVisibilityLabel(selectedBrand?.status ?? null)}
                  </Badge>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ["Status", getStatusLabel(selectedBrand?.status ?? null)],
                  ["Sort", String(selectedBrand?.sort_order ?? 0)],
                  ["Featured", selectedBrand?.featured ? "Yes" : "No"],
                  ["Revenue", "Not Connected"],
                ].map(([label, value]) => (
                  <div className="rounded-2xl bg-stone-50 p-4" key={label}>
                    <div className="text-xs text-slate-500">{label}</div>
                    <div className="mt-1 font-bold text-slate-950">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-3">
                {selectedBrand ? (
                  <Link
                    className="rounded-2xl bg-[#527B86] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-950"
                    href={`/brands?edit=${selectedBrand.id}`}
                  >
                    Edit Brand
                  </Link>
                ) : null}
                <DisabledAction>SEO Settings Not Connected</DisabledAction>
                <DisabledAction>Logo/Banner Upload Not Connected</DisabledAction>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Product Mapping
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Brand Products
              </h3>
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-stone-50 p-4 text-sm leading-6 text-slate-600">
                Product counts and mapped product lists are source placeholders
                until live brand-product analytics are connected.
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <DisabledAction>Map Products Not Connected</DisabledAction>
                <DisabledAction>Open Storefront Not Connected</DisabledAction>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Brand Ranking
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                SEO Readiness
              </h3>
              <div className="mt-4 space-y-3">
                {[...brands]
                  .sort((a, b) => getSeoScore(b) - getSeoScore(a))
                  .slice(0, 5)
                  .map((brand, index) => (
                    <button
                      className={`w-full rounded-2xl px-4 py-3 text-left text-xs transition ${
                        selectedBrand?.id === brand.id
                          ? "bg-[#527B86]/10 ring-2 ring-[#527B86]/15"
                          : "bg-stone-50 hover:bg-stone-100"
                      }`}
                      key={brand.id}
                      onClick={() => setSelectedBrandId(brand.id)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-slate-800">
                          #{index + 1} {brand.name}
                        </span>
                        <span className="font-black text-[#527B86]">
                          {getSeoScore(brand)}/100
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-[#527B86]"
                          style={{ width: `${getSeoScore(brand)}%` }}
                        />
                      </div>
                    </button>
                  ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                SEO + Storefront Note
              </div>
              <div className="mt-2 text-sm leading-6 text-amber-700">
                Visible brands should have a clean slug, image URL, SEO title,
                meta description, featured placement, and sort order before
                being promoted strongly on the storefront.
              </div>
            </section>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
