"use client";

import Link from "next/link";
import Image from "next/image";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

import type { BrandRecord } from "./brands-data";

type RealBrandsPageProps = {
  brands?: BrandRecord[];
  editBrandId?: string;
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

type BrandPreview = {
  banner: string;
  id: string;
  logo: string;
  origin: string;
  products: string;
  type: string;
};

const inputClassName =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/15";

const labelClassName = "text-sm font-semibold text-slate-700";

const BRANDS_ENDPOINT = bnbApiUrl("get_brands.php?include_inactive=1");
const MANAGE_CATALOG_META_ENDPOINT = bnbApiUrl("manage_catalog_meta.php");
const DELETE_CATALOG_ITEM_ENDPOINT = bnbApiUrl("delete_catalog_item.php");

function toNumber(value: unknown) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function toStringOrNull(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeBrand(value: unknown): BrandRecord | null {
  if (!value || typeof value !== "object") return null;

  const brand = value as Record<string, unknown>;
  const id = String(brand.id ?? "");
  const name = String(brand.name ?? "").trim();
  const slug = String(brand.slug ?? "").trim();
  const logoUrl = toStringOrNull(brand.logo_url) ?? toStringOrNull(brand.logo);

  if (!id || !name) return null;

  return {
    brand_type:
      toStringOrNull(brand.brand_type) ?? toStringOrNull(brand.type),
    created_at: toStringOrNull(brand.created_at),
    featured: Boolean(brand.featured),
    id,
    image: logoUrl ?? toStringOrNull(brand.image),
    meta_description: toStringOrNull(brand.meta_description),
    meta_title: toStringOrNull(brand.meta_title),
    name,
    origin_country:
      toStringOrNull(brand.origin_country) ??
      toStringOrNull(brand.country) ??
      toStringOrNull(brand.origin),
    product_count: toNumber(brand.product_count),
    slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    sort_order: brand.sort_order == null ? null : toNumber(brand.sort_order),
    status: toStringOrNull(brand.status) ?? "active",
    updated_at: toStringOrNull(brand.updated_at),
  };
}

const brandPreviews: Record<string, BrandPreview> = {
  cosrx: {
    banner: "Ready",
    id: "cosrx",
    logo: "Ready",
    origin: "South Korea",
    products: "Preview",
    type: "Official",
  },
  "some-by-mi": {
    banner: "Needs Banner",
    id: "some-by-mi",
    logo: "Ready",
    origin: "South Korea",
    products: "Preview",
    type: "Imported",
  },
  "the-derma-plus": {
    banner: "Ready",
    id: "the-derma-plus",
    logo: "Ready",
    origin: "Bangladesh",
    products: "Preview",
    type: "Owned",
  },
  "beauty-of-joseon": {
    banner: "Draft",
    id: "beauty-of-joseon",
    logo: "Missing",
    origin: "South Korea",
    products: "Preview",
    type: "Imported",
  },
  simple: {
    banner: "Missing",
    id: "simple",
    logo: "Needs Logo",
    origin: "UK",
    products: "Preview",
    type: "Imported",
  },
};

const defaultBrandPreview: BrandPreview = {
  banner: "Ready",
  id: "cosrx",
  logo: "Ready",
  origin: "Brand origin preview",
  products: "Preview",
  type: "Imported",
};

const getStatusLabel = (status: string | null) =>
  status === "inactive" ? "Hidden" : "Active";

const getStatusTone = (status: string | null): BadgeTone =>
  status === "inactive" ? "bad" : "good";

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
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
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
  item,
  index,
  active = false,
}: {
  item: [string, string, string];
  index: number;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? "border-[#5E7F85] ring-2 ring-[#5E7F85]/15" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-500">{item[0]}</div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            {item[1]}
          </div>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black ${
            index === 0
              ? "bg-[#5E7F85]/10 text-[#5E7F85]"
              : index === 1
                ? "bg-emerald-50 text-emerald-700"
                : index === 2
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-slate-600"
          }`}
        >
          {index + 1}
        </div>
      </div>
      <div className="mt-3 inline-flex rounded-full bg-stone-50 px-3 py-1 text-xs font-semibold text-slate-600">
        {item[2]}
      </div>
    </div>
  );
}

function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-stone-50 text-xs uppercase tracking-[0.12em] text-slate-500">
      {children}
    </thead>
  );
}

function DisabledButton({
  children,
  className = "",
  title = "Not connected yet",
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <button
      aria-label={title}
      className={`cursor-not-allowed rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-400 ${className}`}
      disabled
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}

function getPreviewForBrand(brand: BrandRecord | null): BrandPreview {
  if (!brand) {
    return defaultBrandPreview;
  }

  const preview = brandPreviews[brand.slug] ?? defaultBrandPreview;

  return {
    ...preview,
    origin: brand.origin_country ?? preview.origin,
    type: brand.brand_type ?? preview.type,
  };
}

function BrandForm({
  editingBrand,
  isPending,
  onSubmit,
  state,
  onClose,
}: {
  editingBrand: BrandRecord | null;
  isPending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  state: { ok: boolean; message: string };
  onClose: () => void;
}) {
  const isEditing = Boolean(editingBrand);
  const preview = getPreviewForBrand(editingBrand);
  const [name, setName] = useState(editingBrand?.name ?? "");
  const [slug, setSlug] = useState(editingBrand?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(false);

  function handleNameChange(value: string) {
    setName(value);

    if (!slugEdited) {
      setSlug(slugify(value));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-slate-500">
              Brand Action
            </div>
            <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {isEditing ? `Edit ${editingBrand?.name}` : "Add Brand"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              This form now creates live brand metadata through the local PHP
              backend. Active brands appear on the homepage and brand routes;
              inactive brands stay hidden. Use a clean slug, logo/image URL,
              and lower sort order for earlier placement.
            </p>
          </div>
          {isEditing ? (
            <Link
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
              href="/brands"
            >
              Close
            </Link>
          ) : (
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          )}
        </div>

        <form onSubmit={onSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
          <input name="id" type="hidden" value={editingBrand?.id ?? ""} />

          <label className={labelClassName}>
            Brand Name
            <input
              className={inputClassName}
              name="name"
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="COSRX"
              required
              type="text"
              value={name}
            />
          </label>

          <label className={labelClassName}>
            Slug
            <span className="mt-1 block text-xs font-medium text-slate-500">
              Do not leave blank when editing; routes use /brand/slug.
            </span>
            <input
              className={`${inputClassName} bg-stone-50 font-semibold`}
              name="slug"
              onChange={(event) => {
                setSlug(event.target.value);
                setSlugEdited(true);
              }}
              placeholder="auto-generated-slug"
              required
              type="text"
              value={slug}
            />
          </label>

          <label className={labelClassName}>
            Brand Type
            <select
              className={inputClassName}
              defaultValue={
                editingBrand?.brand_type ?? (editingBrand ? preview.type : "")
              }
              name="brandType"
            >
              <option value="">Select type</option>
              <option value="Imported">Imported</option>
              <option value="Local">Local</option>
              <option value="Official">Official</option>
              <option value="Owned">Owned</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label className={labelClassName}>
            Origin Country
            <input
              className={inputClassName}
              defaultValue={
                editingBrand?.origin_country ?? (editingBrand ? preview.origin : "")
              }
              name="originCountry"
              placeholder="South Korea"
              type="text"
            />
          </label>

          <label className={labelClassName}>
            Storefront Visibility
            <span className="mt-1 block text-xs font-medium text-slate-500">
              Active means visible on storefront sections; inactive hides it.
            </span>
            <select
              className={inputClassName}
              defaultValue={editingBrand?.status ?? "active"}
              name="status"
            >
              <option value="active">Visible</option>
              <option value="inactive">Hidden</option>
            </select>
          </label>

          <label className={labelClassName}>
            Sort Order
            <span className="mt-1 block text-xs font-medium text-slate-500">
              Lower numbers appear first; ties sort by name.
            </span>
            <input
              className={inputClassName}
              defaultValue={editingBrand?.sort_order ?? 0}
              name="sortOrder"
              step="1"
              type="number"
            />
          </label>

          <label className={labelClassName}>
            Image URL
            <span className="mt-1 block text-xs font-medium text-slate-500">
              Use a logo or square image. Blank is allowed and shows the brand name.
            </span>
            <input
              className={inputClassName}
              defaultValue={editingBrand?.image ?? ""}
              name="image"
              placeholder="https://..."
              type="text"
            />
          </label>

          <label className={labelClassName}>
            Banner Status
            <input
              className={`${inputClassName} cursor-not-allowed bg-stone-50 text-slate-500`}
              disabled
              placeholder={editingBrand?.image ? "Ready" : "Needs Banner"}
              type="text"
            />
          </label>

          <label className={`${labelClassName} md:col-span-2`}>
            SEO Title
            <input
              className={inputClassName}
              defaultValue={editingBrand?.meta_title ?? ""}
              name="metaTitle"
              placeholder="Brand Products Price in Bangladesh | BrandnBeauty"
              type="text"
            />
          </label>

          <label className={`${labelClassName} md:col-span-2`}>
            Meta Description
            <textarea
              className={`${inputClassName} h-24 resize-y`}
              defaultValue={editingBrand?.meta_description ?? ""}
              name="metaDescription"
              placeholder="Write brand landing meta description..."
            />
          </label>

          <label className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700">
            Homepage Featured
            <input
              className="h-4 w-4 rounded border-slate-300 text-[#5E7F85]"
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

          <div className="grid gap-3 md:col-span-2 sm:grid-cols-2">
            {isEditing ? (
              <Link
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700"
                href="/brands"
              >
                Cancel
              </Link>
            ) : (
              <button
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
            )}
            <button
              className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
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
      </div>
    </div>
  );
}

export function RealBrandsPage({
  brands: initialBrands = [],
  editBrandId,
}: RealBrandsPageProps) {
  const [brands, setBrands] = useState<BrandRecord[]>(initialBrands);
  const [formState, setFormState] = useState({
    ok: false,
    message: "",
  });
  const [isPending, setIsPending] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [deletingBrandIds, setDeletingBrandIds] = useState<string[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState(editBrandId ?? "");
  const [showAddForm, setShowAddForm] = useState(false);

  const loadBrands = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(BRANDS_ENDPOINT, {
        cache: "no-store",
        signal,
      });

      if (!response.ok) {
        throw new Error("Brands could not be loaded.");
      }

      const payload = (await response.json()) as unknown;
      const nextBrands = Array.isArray(payload)
        ? payload
            .map(normalizeBrand)
            .filter((brand): brand is BrandRecord => Boolean(brand))
        : [];

      setBrands(nextBrands);
      setSelectedBrandId((current) => current || (nextBrands[0]?.id ?? ""));
    } catch (error) {
      if (!signal?.aborted) {
        console.error("Admin brands could not be loaded.", error);
        setBrands([]);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void Promise.resolve().then(() => loadBrands(controller.signal));

    return () => {
      controller.abort();
    };
  }, [loadBrands]);

  async function handleBrandSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    setIsPending(true);
    setFormState({ ok: false, message: "" });

    try {
      const response = await fetch(MANAGE_CATALOG_META_ENDPOINT, {
        body: JSON.stringify({
          action: editingBrand ? "update_brand" : "add_brand",
          id: editingBrand?.id,
          data: {
            id: editingBrand?.id,
            description: String(formData.get("metaDescription") ?? ""),
            featured: formData.get("featured") === "on",
            brand_type: String(formData.get("brandType") ?? ""),
            image_url: String(formData.get("image") ?? ""),
            logo_url: String(formData.get("image") ?? ""),
            meta_description: String(formData.get("metaDescription") ?? ""),
            meta_title: String(formData.get("metaTitle") ?? ""),
            name: String(formData.get("name") ?? ""),
            origin_country: String(formData.get("originCountry") ?? ""),
            slug: String(formData.get("slug") ?? ""),
            sort_order: Number(formData.get("sortOrder") ?? 0),
            status: String(formData.get("status") ?? "active"),
          },
        }),
        headers: adminAuthHeaders({ "Content-Type": "application/json" }),
        method: "POST",
      });
      const result = (await response.json()) as {
        message?: string;
        success?: boolean;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Brand could not be saved.");
      }

      setFormState({ ok: true, message: result.message ?? "Brand saved successfully." });
      await loadBrands();
      setShowAddForm(false);
    } catch (error) {
      setFormState({
        ok: false,
        message: error instanceof Error ? error.message : "Brand could not be saved.",
      });
    } finally {
      setIsPending(false);
    }
  }

  async function handleDeleteBrand(brandId: string) {
    if (!window.confirm("Delete this brand?")) {
      return;
    }

    setDeletingBrandIds((current) => Array.from(new Set([...current, brandId])));
    setFormState({ ok: false, message: "" });

    try {
      const response = await fetch(DELETE_CATALOG_ITEM_ENDPOINT, {
        body: JSON.stringify({
          id: brandId,
          type: "brand",
        }),
        headers: {
          ...adminAuthHeaders({ "Content-Type": "application/json" }),
        },
        method: "POST",
      });
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        success?: boolean;
      } | null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.message ?? "Brand could not be deleted.");
      }

      setBrands((current) => current.filter((brand) => brand.id !== brandId));
      setSelectedBrandId((current) =>
        current === brandId
          ? brands.find((brand) => brand.id !== brandId)?.id ?? ""
          : current,
      );
      setFormState({ ok: true, message: result.message ?? "Item deleted successfully" });
    } catch (error) {
      setFormState({
        ok: false,
        message: error instanceof Error ? error.message : "Brand could not be deleted.",
      });
    } finally {
      setDeletingBrandIds((current) => current.filter((id) => id !== brandId));
    }
  }

  const editingBrand =
    brands.find((brand) => brand.id === editBrandId) ?? null;
  const featuredCount = brands.filter((brand) => brand.featured).length;
  const needsSeoCount = brands.filter((brand) => getSeoScore(brand) < 75).length;
  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      const query = search.toLowerCase();
      const preview = getPreviewForBrand(brand);
      const productCount = brand.product_count ?? 0;
      const matchesSearch =
        !query ||
        `${brand.name} ${brand.slug} ${brand.status ?? ""} ${preview.type} ${preview.origin} ${productCount}`
          .toLowerCase()
          .includes(query);
      const matchesFilter =
        filter === "All" ||
        (filter === "Featured" && brand.featured) ||
        (filter === "Active" && brand.status !== "inactive") ||
        (filter === "Visible" && brand.status !== "inactive") ||
        (filter === "Hidden" && brand.status === "inactive") ||
        (filter === "Needs Work" && getSeoScore(brand) < 75) ||
        (filter === "Image Ready" && Boolean(brand.image)) ||
        preview.type === filter;

      return matchesSearch && matchesFilter;
    });
  }, [brands, filter, search]);
  const selectedBrand =
    editingBrand ??
    brands.find((brand) => brand.id === selectedBrandId) ??
    filteredBrands[0] ??
    brands[0] ??
    null;
  const selectedPreview = getPreviewForBrand(selectedBrand);
  const topBrand = brands[0] ?? null;
  const visibleBrandCount = brands.filter((brand) => brand.status !== "inactive").length;
  const mappedProductCount = brands.reduce(
    (sum, brand) => sum + (brand.product_count ?? 0),
    0,
  );
  const showForm = showAddForm || Boolean(editingBrand);

  return (
    <AdminShell>
      <div className="space-y-6">
        {formState.message ? (
          <div
            className={`fixed right-5 top-5 z-[60] rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg ${
              formState.ok
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {formState.message}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5E7F85]">
                Catalog
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                Brands Control Room
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Manage brand landing pages, logo/banner assets, SEO health,
                homepage featured brands and live product mapping.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DisabledButton title="Import brands is not connected yet">
                Import
              </DisabledButton>
              <DisabledButton title="Export brands is not connected yet">
                Export
              </DisabledButton>
              <button
                className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white"
                onClick={() => setShowAddForm(true)}
                type="button"
              >
                Add Brand
              </button>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-4">
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Mapped products:{" "}
              <b className="text-[#5E7F85]">{mappedProductCount}</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Visible brands: <b className="text-slate-900">{visibleBrandCount}</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Top brand:{" "}
              <b className="text-emerald-700">{topBrand?.name ?? "Review"}</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Needs work: <b className="text-amber-700">{needsSeoCount}</b>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Active Brands", String(visibleBrandCount), "Storefront visible"],
            ["First by Sort", topBrand?.name ?? "Review", "Homepage ordering"],
            ["Featured Brands", String(featuredCount), "Homepage visible"],
            ["Mapped Products", String(mappedProductCount), "Product mapping"],
          ].map((item, index) => (
            <StatCard
              active={item[0] === "Active Brands" || item[0] === "First by Sort"}
              index={index}
              item={item as [string, string, string]}
              key={item[0]}
            />
          ))}
        </div>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold tracking-tight">
                      Brand Directory
                    </h2>
                    <Badge tone="brand">Live CMS</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Control brand visibility, SEO readiness, product mapping
                    and homepage ordering.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledButton title="Bulk featured update is not connected yet">
                    Bulk Featured
                  </DisabledButton>
                  <button
                    className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white"
                    onClick={() => setShowAddForm(true)}
                    type="button"
                  >
                    Add Brand
                  </button>
                </div>
              </div>
              <div className="mt-5 w-full overflow-visible rounded-[1.6rem] border border-[#5E7F85]/15 bg-gradient-to-br from-[#5E7F85]/5 via-white to-stone-50 p-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#5E7F85]">
                      Homepage Visibility
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-700">
                      Active brands are public
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-3 xl:items-end">
                    <div className="flex flex-wrap gap-2">
                      {["All", "Featured", "Active", "Hidden"].map((item) => (
                        <button
                          className={`cursor-not-allowed rounded-full px-4 py-2 text-xs font-semibold transition ${
                            item === "Active"
                              ? "bg-[#5E7F85] text-white shadow-sm"
                              : "border border-slate-200 bg-white text-slate-400"
                          }`}
                          disabled
                          key={item}
                          type="button"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <DisabledButton
                        className="inline-flex min-w-[150px] items-center justify-center gap-2 text-slate-700"
                        title="Use each brand form to edit sort order"
                      >
                        <span>Sort order</span>
                      </DisabledButton>
                      <DisabledButton
                        className="inline-flex min-w-[150px] items-center justify-center gap-2 text-slate-700"
                        title="Use status to control homepage visibility"
                      >
                        <span>Status</span>
                      </DisabledButton>
                      <DisabledButton
                        className="bg-[#5E7F85]/10 text-[#5E7F85]/50"
                        title="Use the search and filters below"
                      >
                        Apply Filter
                      </DisabledButton>
                      <DisabledButton title="Clear search manually">
                        Reset
                      </DisabledButton>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(320px,1fr)_auto] xl:items-center">
                <div className="relative w-full">
                  <input
                    className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-10 text-sm outline-none"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search brand / slug / country / type..."
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
                    "Active",
                    "Owned",
                    "Imported",
                    "Official",
                    "Hidden",
                    "Needs Work",
                  ].map((item) => (
                    <button
                      className={`rounded-full px-4 py-2 text-xs font-semibold ${
                        filter === item
                          ? "bg-[#5E7F85] text-white"
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

            <div className="overflow-x-auto xl:overflow-visible">
              <table className="min-w-[980px] text-left text-sm xl:min-w-0 xl:w-full">
                <TableHead>
                  <tr>
                    {[
                      "Brand",
                      "Type",
                      "Products",
                      "Sort",
                      "Homepage",
                      "SEO",
                      "Assets",
                      "Status",
                      "Action",
                    ].map((head) => (
                        <th className="px-3 py-4 font-medium 2xl:px-5" key={head}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </TableHead>
                <tbody>
                  {filteredBrands.length > 0 ? (
                    filteredBrands.map((brand) => {
                      const preview = getPreviewForBrand(brand);

                      return (
                        <tr
                          className={`cursor-pointer border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85] ${
                            selectedBrand?.id === brand.id
                              ? "bg-[#5E7F85]/5 shadow-[inset_3px_0_0_#5E7F85]"
                              : getSeoScore(brand) < 75
                                ? "bg-amber-50/25"
                                : "bg-white"
                          }`}
                          key={brand.id}
                          onClick={() => setSelectedBrandId(brand.id)}
                        >
                          <td className="px-3 py-4 2xl:px-5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-bold ${
                                  brand.image
                                    ? "overflow-hidden bg-white text-[#5E7F85]"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {brand.image ? (
                                  <Image
                                    alt=""
                                    className="h-full w-full object-cover"
                                    height={44}
                                    src={brand.image}
                                    unoptimized
                                    width={44}
                                  />
                                ) : (
                                  brand.name.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">
                                  {brand.name}
                                </div>
                                <div className="max-w-[190px] truncate text-xs text-slate-500">
                                  /brand/{brand.slug} - {preview.origin}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 2xl:px-5">
                            <Badge
                              tone={
                                preview.type === "Owned"
                                  ? "brand"
                                  : preview.type === "Official"
                                    ? "good"
                                    : "default"
                              }
                            >
                              {preview.type}
                            </Badge>
                          </td>
                          <td className="px-3 py-4 font-semibold text-slate-500 2xl:px-5">
                            {brand.product_count ?? 0}
                          </td>
                          <td className="px-3 py-4 2xl:px-5">
                            <div className="font-bold text-slate-900">
                              {brand.sort_order ?? 0}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              Low first
                            </div>
                          </td>
                          <td className="px-3 py-4 2xl:px-5">
                            <div className="text-xs font-bold text-[#5E7F85]">
                              {brand.status === "inactive" ? "Hidden" : "Visible"}
                            </div>
                          </td>
                          <td className="px-3 py-4 2xl:px-5">
                            <Badge
                              tone={
                                getSeoScore(brand) >= 80
                                  ? "good"
                                  : getSeoScore(brand) >= 70
                                    ? "warn"
                                    : "bad"
                              }
                            >
                              {getSeoScore(brand)}/100
                            </Badge>
                          </td>
                          <td className="px-3 py-4 2xl:px-5">
                            <div className="flex flex-wrap gap-1">
                              <Badge tone={brand.image ? "good" : "warn"}>
                                Logo
                              </Badge>
                              <Badge
                                tone={
                                  brand.image || preview.banner === "Ready"
                                    ? "good"
                                    : "warn"
                                }
                              >
                                Banner
                              </Badge>
                            </div>
                          </td>
                          <td className="px-3 py-4 2xl:px-5">
                            <Badge tone={getStatusTone(brand.status)}>
                              {getStatusLabel(brand.status)}
                            </Badge>
                          </td>
                          <td
                            className="px-3 py-4 2xl:px-5"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className="flex items-center gap-2">
                              <Link
                                className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-semibold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white"
                                href={`/brands?edit=${brand.id}`}
                              >
                                Edit
                              </Link>
                              <button
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-stone-50"
                                onClick={() => setSelectedBrandId(brand.id)}
                                type="button"
                              >
                                Open
                              </button>
                              <button
                                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={deletingBrandIds.includes(brand.id)}
                                onClick={() => handleDeleteBrand(brand.id)}
                                type="button"
                              >
                                {deletingBrandIds.includes(brand.id)
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        className="px-5 py-14 text-center text-sm text-slate-500"
                        colSpan={9}
                      >
                        No brands found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              {selectedBrand ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-500">
                        Brand Page Preview
                      </div>
                      <h3 className="mt-1 text-xl font-bold tracking-tight">
                        {selectedBrand.name}
                      </h3>
                      <div className="mt-1 text-xs text-slate-500">
                        /brand/{selectedBrand.slug}
                      </div>
                    </div>
                    <Badge tone={selectedBrand.featured ? "brand" : "default"}>
                      {selectedBrand.featured ? "Featured" : "Normal"}
                    </Badge>
                  </div>
                  <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-stone-50 p-4">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5E7F85] via-[#6f949a] to-[#d9e5e1] p-5 text-white shadow-sm">
                      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15" />
                      <div className="absolute -bottom-10 left-1/2 h-32 w-32 rounded-full bg-white/10" />
                      <div className="relative">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-lg font-black">
                          {selectedBrand.image ? (
                            <Image
                              alt=""
                              className="h-full w-full rounded-2xl object-cover"
                              height={64}
                              src={selectedBrand.image}
                              unoptimized
                              width={64}
                            />
                          ) : (
                            selectedBrand.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
                          Featured Brand
                        </div>
                        <div className="mt-2 text-3xl font-black tracking-tight">
                          {selectedBrand.name}
                        </div>
                        <div className="mt-2 text-sm text-white/85">
                          {selectedBrand.meta_description ??
                            "Authentic products - COD - Fast delivery"}
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">
                            {selectedBrand.product_count ?? 0} Products
                          </span>
                          <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">
                            {selectedPreview.origin}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge tone="brand">
                        SEO {getSeoScore(selectedBrand)}/100
                      </Badge>
                      <Badge tone={selectedBrand.image ? "good" : "warn"}>
                        {selectedBrand.image ? "Logo Ready" : selectedPreview.logo}
                      </Badge>
                      <Badge tone={selectedBrand.image ? "good" : "warn"}>
                        {selectedBrand.image ? "Banner Ready" : selectedPreview.banner}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      ["Products", selectedBrand.product_count ?? 0],
                      ["Status", getStatusLabel(selectedBrand.status)],
                      ["Sort", selectedBrand.sort_order ?? 0],
                      ["Homepage", selectedBrand.status === "inactive" ? "Hidden" : "Visible"],
                    ].map(([label, value]) => (
                      <div className="rounded-2xl bg-stone-50 p-4" key={label}>
                        <div className="text-xs text-slate-500">{label}</div>
                        <div className="mt-1 font-bold text-slate-900">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-3">
                    <Link
                      className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-center text-sm font-semibold text-white"
                      href={`/brands?edit=${selectedBrand.id}`}
                    >
                      Edit Brand
                    </Link>
                    <DisabledButton title="SEO settings are not connected yet">
                      SEO Settings
                    </DisabledButton>
                    <DisabledButton title="Logo and banner upload is not connected yet">
                      Upload Logo / Banner
                    </DisabledButton>
                  </div>
                </>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-stone-50 p-6 text-center text-sm font-medium text-slate-500">
                  Brand preview appears here after live brands are added.
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Product Mapping
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight">
                Brand Product Links
              </h3>
              <div className="mt-4 rounded-2xl bg-stone-50 px-4 py-4 text-xs font-semibold leading-5 text-slate-600">
                Products mapped to this brand are counted from the live
                database. Product-level brand mapping is managed from product
                create/edit screens.
              </div>
              <div className="mt-5 rounded-2xl border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-600">
                    Homepage status
                  </span>
                  <b className="text-[#5E7F85]">
                    {selectedBrand?.status === "inactive" ? "Hidden" : "Visible"}
                  </b>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
                  <div className="h-full w-1/2 rounded-full bg-[#5E7F85]" />
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-500">
                  Active brands appear in public storefront metadata responses.
                </div>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <DisabledButton title="Product mapping is not connected yet">
                  Map Products
                </DisabledButton>
                <DisabledButton
                  className="bg-[#5E7F85]/10 text-[#5E7F85]/50"
                  title="Featured ordering is not connected yet"
                >
                  Featured Order
                </DisabledButton>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Brand SEO Ranking
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight">
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
                          ? "bg-[#5E7F85]/10 ring-2 ring-[#5E7F85]/15"
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
                        <span className="font-black text-[#5E7F85]">
                          {getSeoScore(brand)}/100
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-[#5E7F85]"
                          style={{ width: `${getSeoScore(brand)}%` }}
                        />
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                SEO + Storefront Note
              </div>
              <div className="mt-2 text-sm leading-6 text-amber-700">
                Active brands are visible on storefront sections. Keep slug
                and logo clean, use sort order for placement, and set inactive
                before saving unfinished rows.
              </div>
            </div>
          </div>
        </div>

        {showForm ? (
          <BrandForm
            editingBrand={editingBrand}
            isPending={isPending}
            key={editingBrand?.id ?? "new-brand"}
            onClose={() => setShowAddForm(false)}
            onSubmit={handleBrandSubmit}
            state={formState}
          />
        ) : null}
      </div>
    </AdminShell>
  );
}
