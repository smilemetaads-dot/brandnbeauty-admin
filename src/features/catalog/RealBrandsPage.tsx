"use client";

import Link from "next/link";
import Image from "next/image";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
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

const inputClassName =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/15";

const labelClassName = "text-sm font-semibold text-slate-700";

const BRANDS_ENDPOINT = bnbApiUrl("get_brands.php?include_inactive=1");
const MANAGE_CATALOG_META_ENDPOINT = bnbApiUrl("manage_catalog_meta.php");
const DELETE_CATALOG_ITEM_ENDPOINT = bnbApiUrl("delete_catalog_item.php");
const UPLOAD_MEDIA_ENDPOINT = bnbApiUrl("upload_media.php");
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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

const getStatusLabel = (status: string | null) =>
  status === "inactive" ? "Hidden" : "Visible";

const getStatusTone = (status: string | null): BadgeTone =>
  status === "inactive" ? "warn" : "good";

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


type UploadState = { isUploading: boolean; message: string; ok: boolean };

async function uploadTaxonomyMedia(file: File): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG, and WebP images are supported.");
  }

  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be greater than 0 bytes and no larger than 5MB.");
  }

  const body = new FormData();
  body.append("image", file);

  const response = await fetch(UPLOAD_MEDIA_ENDPOINT, {
    body,
    headers: adminAuthHeaders(),
    method: "POST",
  });
  const payload = await response.json().catch(() => null) as { image_url?: string; message?: string; success?: boolean } | null;

  if (!response.ok || payload?.success === false || !payload?.image_url) {
    throw new Error(payload?.message || "Image upload failed.");
  }

  return payload.image_url;
}

function TaxonomyMediaField({
  emptyText,
  helper,
  imageAlt,
  isPending,
  onChange,
  onUpload,
  removeLabel,
  title,
  uploadLabel,
  uploadState,
  value,
}: {
  emptyText: string;
  helper: string;
  imageAlt: string;
  isPending: boolean;
  onChange: (value: string) => void;
  onUpload: (file: File) => Promise<void>;
  removeLabel: string;
  title: string;
  uploadLabel: string;
  uploadState: UploadState;
  value: string;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-stone-50 p-4 md:col-span-2">
      <input name="image" type="hidden" value={value} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className={labelClassName}>{title}</div>
          <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{helper}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className={`inline-flex cursor-pointer rounded-2xl px-4 py-2.5 text-xs font-bold ${uploadState.isUploading || isPending ? "bg-slate-100 text-slate-400" : "bg-[#5E7F85]/10 text-[#5E7F85] hover:bg-[#5E7F85]/15"}`}>
            <input
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={uploadState.isUploading || isPending}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void onUpload(file);
              }}
              type="file"
            />
            {uploadState.isUploading ? "Uploading..." : value ? `Replace ${uploadLabel}` : `Upload ${uploadLabel}`}
          </label>
          <button
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!value || uploadState.isUploading || isPending}
            onClick={() => onChange("")}
            type="button"
          >
            {removeLabel}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white">
        {value ? (
          <Image alt={imageAlt} className="h-40 w-full object-contain p-3" height={160} src={value} unoptimized width={320} />
        ) : (
          <div className="flex h-40 items-center justify-center px-4 text-center text-sm font-semibold text-slate-500">{emptyText}</div>
        )}
      </div>

      {uploadState.message ? (
        <p className={`text-sm font-semibold ${uploadState.ok ? "text-emerald-700" : "text-rose-700"}`}>{uploadState.message}</p>
      ) : null}

      <details className="rounded-2xl border border-slate-200 bg-white p-3">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Advanced Details</summary>
        <div className="mt-3 break-all rounded-xl bg-stone-50 px-3 py-2 text-xs font-semibold text-slate-600">
          {value || "No uploaded URL assigned."}
        </div>
      </details>
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
  const [name, setName] = useState(editingBrand?.name ?? "");
  const [slug, setSlug] = useState(editingBrand?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(false);
  const [imageUrl, setImageUrl] = useState(editingBrand?.image ?? "");
  const [uploadState, setUploadState] = useState<UploadState>({ isUploading: false, message: "", ok: false });

  async function handleMediaUpload(file: File) {
    setUploadState({ isUploading: true, message: "Uploading logo...", ok: false });
    try {
      const uploadedUrl = await uploadTaxonomyMedia(file);
      setImageUrl(uploadedUrl);
      setUploadState({ isUploading: false, message: "Logo uploaded. Save changes to publish it.", ok: true });
    } catch (error) {
      setUploadState({
        isUploading: false,
        message: error instanceof Error ? error.message : "Logo upload failed.",
        ok: false,
      });
    }
  }

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
              Visible brands appear in the homepage Featured Brands section and brand browsing pages.
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
              defaultValue={editingBrand?.brand_type ?? ""}
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
              defaultValue={editingBrand?.origin_country ?? ""}
              name="originCountry"
              placeholder="South Korea"
              type="text"
            />
          </label>

          <label className={labelClassName}>
            Storefront Visibility
            <span className="mt-1 block text-xs font-medium text-slate-500">
              Visible brands appear publicly where allowed. Hidden brands stay saved but are not shown publicly.
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

                    <TaxonomyMediaField
            emptyText="No brand logo uploaded."
            helper="Used in Featured Brands cards on the homepage. Recommended: square transparent PNG/WebP when possible. Prefer a 1000 × 1000 px canvas with the logo centered and enough padding."
            imageAlt={editingBrand?.name ? `${editingBrand.name} logo` : "Brand Logo preview"}
            isPending={isPending}
            onChange={(value) => {
              setImageUrl(value);
              setUploadState(value ? uploadState : { isUploading: false, message: "Logo removed from this brand. Save changes to publish it.", ok: true });
            }}
            onUpload={handleMediaUpload}
            removeLabel="Remove Logo"
            title="Brand Logo"
            uploadLabel="Logo"
            uploadState={uploadState}
            value={imageUrl}
          />

          <details className="rounded-2xl border border-slate-200 bg-stone-50 p-4 md:col-span-2">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700">
              Optional SEO
            </summary>
            <div className="mt-4 space-y-4">
              <label className={labelClassName}>
                SEO Title
                <input
                  className={inputClassName}
                  defaultValue={editingBrand?.meta_title ?? ""}
                  name="metaTitle"
                  placeholder="Optional title for search results"
                  type="text"
                />
              </label>

              <label className={labelClassName}>
                Meta Description
                <textarea
                  className={inputClassName}
                  defaultValue={editingBrand?.meta_description ?? ""}
                  name="metaDescription"
                  placeholder="Write a short search summary"
                  rows={3}
                />
              </label>
            </div>
          </details>

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

  async function handleHideBrand(brandId: string) {
    if (!window.confirm("Hide this brand?\n\nThis brand will no longer appear publicly. Existing product relationships will remain unchanged.")) {
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
        throw new Error(result?.message ?? "Brand could not be hidden.");
      }

      setBrands((current) =>
        current.map((brand) =>
          brand.id === brandId ? { ...brand, status: "inactive" } : brand,
        ),
      );
      setFormState({ ok: true, message: result.message ?? "Brand hidden successfully" });
    } catch (error) {
      setFormState({
        ok: false,
        message: error instanceof Error ? error.message : "Brand could not be hidden.",
      });
    } finally {
      setDeletingBrandIds((current) => current.filter((id) => id !== brandId));
    }
  }

  const editingBrand =
    brands.find((brand) => brand.id === editBrandId) ?? null;
  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      const query = search.toLowerCase();
      const productCount = brand.product_count ?? 0;
      const matchesSearch =
        !query ||
        `${brand.name} ${brand.slug} ${brand.status ?? ""} ${brand.brand_type ?? ""} ${brand.origin_country ?? ""} ${productCount}`
          .toLowerCase()
          .includes(query);
      const matchesFilter =
        filter === "All" ||
        (filter === "Featured" && brand.featured) ||
        (filter === "Visible" && brand.status !== "inactive") ||
        (filter === "Hidden" && brand.status === "inactive") ||
        brand.brand_type === filter;

      return matchesSearch && matchesFilter;
    });
  }, [brands, filter, search]);
  const selectedBrand =
    editingBrand ??
    brands.find((brand) => brand.id === selectedBrandId) ??
    filteredBrands[0] ??
    brands[0] ??
    null;
  const visibleBrandCount = brands.filter((brand) => brand.status !== "inactive").length;
  const hiddenBrandCount = brands.filter((brand) => brand.status === "inactive").length;
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
                Manage brand names, logos, visibility, display order and live product mapping.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
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
              Hidden brands: <b className="text-amber-700">{hiddenBrandCount}</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Total brands: <b className="text-slate-900">{brands.length}</b>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Visible", String(visibleBrandCount), "Shown publicly"],
            ["Hidden", String(hiddenBrandCount), "Saved but not shown"],
            ["Total Brands", String(brands.length), "Saved brand pages"],
            ["Products", String(mappedProductCount), "Mapped products"],
          ].map((item, index) => (
            <StatCard
              active={item[0] === "Visible"}
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
                    Control brand visibility, product mapping and homepage ordering.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white"
                    onClick={() => setShowAddForm(true)}
                    type="button"
                  >
                    Add Brand
                  </button>
                </div>
              </div>
              <div className="mt-5 rounded-[1.6rem] border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-4 text-sm leading-6 text-slate-600">
                Visible brands appear in the homepage Featured Brands section and brand browsing pages.
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
                  {["All", "Featured", "Owned", "Imported", "Official", "Visible", "Hidden"].map((item) => (
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
                      "Origin",
                      "Products",
                      "Sort",
                      "Logo",
                      "Visibility",
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
                    filteredBrands.map((brand) => (
                        <tr
                          className={`cursor-pointer border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85] ${
                            selectedBrand?.id === brand.id
                              ? "bg-[#5E7F85]/5 shadow-[inset_3px_0_0_#5E7F85]"
                              : brand.status === "inactive"
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
                                  /brand/{brand.slug}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 2xl:px-5">
                            <Badge tone={brand.brand_type ? "brand" : "default"}>
                              {brand.brand_type || "Not set"}
                            </Badge>
                          </td>
                          <td className="px-3 py-4 text-xs font-semibold text-slate-500 2xl:px-5">
                            {brand.origin_country || "Not provided"}
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
                            <Badge tone={brand.image ? "good" : "default"}>
                              {brand.image ? "Logo Set" : "No Logo"}
                            </Badge>
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
                                disabled={deletingBrandIds.includes(brand.id) || brand.status === "inactive"}
                                onClick={() => handleHideBrand(brand.id)}
                                type="button"
                              >
                                {deletingBrandIds.includes(brand.id)
                                  ? "Hiding..."
                                  : brand.status === "inactive"
                                    ? "Hidden"
                                    : "Hide"}
                              </button>
                            </div>
                          </td>
                        </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="px-5 py-14 text-center text-sm text-slate-500"
                        colSpan={8}
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
                        Selected Brand
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
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      ["Products", selectedBrand.product_count ?? 0],
                      ["Status", getStatusLabel(selectedBrand.status)],
                      ["Sort", selectedBrand.sort_order ?? 0],
                      ["Origin", selectedBrand.origin_country ?? "Not provided"],
                      ["Type", selectedBrand.brand_type ?? "Not set"],
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
                  </div>
                </>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-stone-50 p-6 text-center text-sm font-medium text-slate-500">
                  Select or add a brand to view details.
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Homepage Visibility
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight">
                Featured Brands
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Visible brands appear in the homepage Featured Brands section and brand browsing pages. Product-level brand mapping is managed from product create/edit screens.
              </p>
              {selectedBrand ? (
                <div className="mt-5 rounded-2xl bg-stone-50 px-4 py-4 text-sm font-semibold text-slate-600">
                  {selectedBrand.product_count ?? 0} Products mapped
                </div>
              ) : null}
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
