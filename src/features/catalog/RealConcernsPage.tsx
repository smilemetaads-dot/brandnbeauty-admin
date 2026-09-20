"use client";

import Link from "next/link";
import Image from "next/image";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

import type { ConcernRecord } from "./concerns-data";

type RealConcernsPageProps = {
  concerns?: ConcernRecord[];
  editConcernId?: string;
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";


const inputClassName =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/15";

const labelClassName = "text-sm font-semibold text-slate-700";

const CONCERNS_ENDPOINT = bnbApiUrl("get_concerns.php?include_inactive=1");
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

function normalizeConcern(value: unknown): ConcernRecord | null {
  if (!value || typeof value !== "object") return null;

  const concern = value as Record<string, unknown>;
  const id = String(concern.id ?? "");
  const name = String(concern.name ?? "").trim();
  const slug = String(concern.slug ?? "").trim();

  if (!id || !name) return null;

  return {
    created_at: toStringOrNull(concern.created_at),
    featured: Boolean(concern.featured),
    id,
    image:
      toStringOrNull(concern.image_url) ??
      toStringOrNull(concern.image_path) ??
      toStringOrNull(concern.thumbnail) ??
      toStringOrNull(concern.image),
    meta_description: toStringOrNull(concern.meta_description),
    meta_title: toStringOrNull(concern.meta_title),
    name,
    product_count: toNumber(concern.product_count),
    slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    sort_order: concern.sort_order == null ? null : toNumber(concern.sort_order),
    status: toStringOrNull(concern.status) ?? "active",
    updated_at: toStringOrNull(concern.updated_at),
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


function ConcernForm({
  editingConcern,
  isPending,
  onSubmit,
  state,
  onClose,
}: {
  editingConcern: ConcernRecord | null;
  isPending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  state: { ok: boolean; message: string };
  onClose: () => void;
}) {
  const isEditing = Boolean(editingConcern);
  const [name, setName] = useState(editingConcern?.name ?? "");
  const [slug, setSlug] = useState(editingConcern?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(false);
  const [imageUrl, setImageUrl] = useState(editingConcern?.image ?? "");
  const [uploadState, setUploadState] = useState<UploadState>({ isUploading: false, message: "", ok: false });

  async function handleMediaUpload(file: File) {
    setUploadState({ isUploading: true, message: "Uploading image...", ok: false });
    try {
      const uploadedUrl = await uploadTaxonomyMedia(file);
      setImageUrl(uploadedUrl);
      setUploadState({ isUploading: false, message: "Image uploaded. Save changes to publish it.", ok: true });
    } catch (error) {
      setUploadState({
        isUploading: false,
        message: error instanceof Error ? error.message : "Image upload failed.",
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
              Concern Action
            </div>
            <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {isEditing ? `Edit ${editingConcern?.name}` : "Add Concern"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Visible concerns appear in the homepage Shop by Concern section and concern browsing pages.
            </p>
          </div>
          {isEditing ? (
            <Link
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
              href="/concerns"
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
          <input name="id" type="hidden" value={editingConcern?.id ?? ""} />

          <label className={labelClassName}>
            Concern Name
            <input
              className={inputClassName}
              name="name"
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="Acne"
              required
              type="text"
              value={name}
            />
          </label>

          <label className={labelClassName}>
            Slug
            <span className="mt-1 block text-xs font-medium text-slate-500">
              Do not leave blank when editing; routes use /concern/slug.
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
            Visibility
            <span className="mt-1 block text-xs font-medium text-slate-500">
              Visible concerns appear publicly where allowed. Hidden concerns stay saved but are not shown publicly.
            </span>
            <select
              className={inputClassName}
              defaultValue={editingConcern?.status ?? "active"}
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
              defaultValue={editingConcern?.sort_order ?? 0}
              name="sortOrder"
              step="1"
              type="number"
            />
          </label>

                    <TaxonomyMediaField
            emptyText="No concern image uploaded."
            helper="Used in Shop by Concern cards on the homepage. Recommended size: square image, preferably 1000 × 1000 px."
            imageAlt={editingConcern?.name ? `${editingConcern.name} image` : "Concern Image preview"}
            isPending={isPending}
            onChange={(value) => {
              setImageUrl(value);
              setUploadState(value ? uploadState : { isUploading: false, message: "Image removed from this concern. Save changes to publish it.", ok: true });
            }}
            onUpload={handleMediaUpload}
            removeLabel="Remove Image"
            title="Concern Image"
            uploadLabel="Image"
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
                  defaultValue={editingConcern?.meta_title ?? ""}
                  name="metaTitle"
                  placeholder="Optional title for search results"
                  type="text"
                />
              </label>

              <label className={labelClassName}>
                Meta Description
                <textarea
                  className={inputClassName}
                  defaultValue={editingConcern?.meta_description ?? ""}
                  name="metaDescription"
                  placeholder="Write a short search summary"
                  rows={3}
                />
              </label>
            </div>
          </details>

          {state.message ? (
            <div
              className={`rounded-2xl px-4 py-3 text-sm font-medium ${
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
                href="/concerns"
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
                  : "Save Concern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RealConcernsPage({
  concerns: initialConcerns = [],
  editConcernId,
}: RealConcernsPageProps) {
  const [concerns, setConcerns] = useState<ConcernRecord[]>(initialConcerns);
  const [formState, setFormState] = useState({
    ok: false,
    message: "",
  });
  const [isPending, setIsPending] = useState(false);
  const editingConcern =
    concerns.find((concern) => concern.id === editConcernId) ?? null;
  const [selectedId, setSelectedId] = useState(
    editingConcern?.id ?? concerns[0]?.id ?? "",
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingConcernIds, setDeletingConcernIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [concernFilter, setConcernFilter] = useState("All");

  const loadConcerns = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(CONCERNS_ENDPOINT, {
        cache: "no-store",
        signal,
      });

      if (!response.ok) {
        throw new Error("Concerns could not be loaded.");
      }

      const payload = (await response.json()) as unknown;
      const nextConcerns = Array.isArray(payload)
        ? payload
            .map(normalizeConcern)
            .filter((concern): concern is ConcernRecord => Boolean(concern))
        : [];

      setConcerns(nextConcerns);
      setSelectedId((current) => current || (nextConcerns[0]?.id ?? ""));
    } catch (error) {
      if (!signal?.aborted) {
        console.error("Admin concerns could not be loaded.", error);
        setConcerns([]);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void Promise.resolve().then(() => loadConcerns(controller.signal));

    return () => {
      controller.abort();
    };
  }, [loadConcerns]);

  async function handleConcernSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    setIsPending(true);
    setFormState({ ok: false, message: "" });

    try {
      const response = await fetch(MANAGE_CATALOG_META_ENDPOINT, {
        body: JSON.stringify({
          action: editingConcern ? "update_concern" : "add_concern",
          id: editingConcern?.id,
          data: {
            id: editingConcern?.id,
            description: String(formData.get("metaDescription") ?? ""),
            featured: formData.get("featured") === "on",
            image_url: String(formData.get("image") ?? ""),
            meta_description: String(formData.get("metaDescription") ?? ""),
            meta_title: String(formData.get("metaTitle") ?? ""),
            name: String(formData.get("name") ?? ""),
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
        throw new Error(result.message ?? "Concern could not be saved.");
      }

      setFormState({ ok: true, message: result.message ?? "Concern saved successfully." });
      await loadConcerns();
      setShowAddForm(false);
    } catch (error) {
      setFormState({
        ok: false,
        message:
          error instanceof Error ? error.message : "Concern could not be added.",
      });
    } finally {
      setIsPending(false);
    }
  }

  async function handleHideConcern(concernId: string) {
    if (!window.confirm("Hide this concern?\n\nThis concern will no longer appear publicly. Existing product relationships will remain unchanged.")) {
      return;
    }

    setDeletingConcernIds((current) => Array.from(new Set([...current, concernId])));
    setFormState({ ok: false, message: "" });

    try {
      const response = await fetch(DELETE_CATALOG_ITEM_ENDPOINT, {
        body: JSON.stringify({
          id: concernId,
          type: "concern",
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
        throw new Error(result?.message ?? "Concern could not be hidden.");
      }

      setConcerns((current) =>
        current.map((concern) =>
          concern.id === concernId ? { ...concern, status: "inactive" } : concern,
        ),
      );
      setFormState({ ok: true, message: result.message ?? "Concern hidden successfully" });
    } catch (error) {
      setFormState({
        ok: false,
        message:
          error instanceof Error ? error.message : "Concern could not be hidden.",
      });
    } finally {
      setDeletingConcernIds((current) => current.filter((id) => id !== concernId));
    }
  }

  const selectedConcern =
    concerns.find((concern) => concern.id === selectedId) ??
    editingConcern ??
    concerns[0] ??
    null;
  const visibleCount = concerns.filter(
    (concern) => concern.status !== "inactive",
  ).length;
  const hiddenCount = concerns.filter(
    (concern) => concern.status === "inactive",
  ).length;
  const filteredConcerns = useMemo(
    () =>
      concerns.filter((concern) => {
        const searchText = [
          concern.name,
          concern.slug,
          concern.status,
          concern.meta_title,
          concern.meta_description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const matchesSearch =
          searchTerm.trim() === "" ||
          searchText.includes(searchTerm.trim().toLowerCase());
        const matchesFilter =
          concernFilter === "All" ||
          (concernFilter === "Visible" && concern.status !== "inactive") ||
          (concernFilter === "Hidden" && concern.status === "inactive") ;

        return matchesSearch && matchesFilter;
      }),
    [concernFilter, concerns, searchTerm],
  );
  const showForm = showAddForm || Boolean(editingConcern);

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
          <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5E7F85]">
                Catalog Taxonomy
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                Concerns Control Room
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Manage the concerns customers use to browse products by skin, hair, body and beauty needs.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white"
                onClick={() => setShowAddForm(true)}
                type="button"
              >
                Add Concern
              </button>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-4">
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Visible: <b className="text-[#5E7F85]">{visibleCount}</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Products mapped:{" "}
              <b className="text-slate-900">
                {concerns.reduce(
                  (sum, concern) => sum + (concern.product_count ?? 0),
                  0,
                )}
              </b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Hidden: <b className="text-amber-700">{hiddenCount}</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Total concerns: <b className="text-slate-900">{concerns.length}</b>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total Concerns", String(concerns.length), "Saved concern pages"],
            ["Visible", String(visibleCount), "Shown publicly"],
            ["Hidden", String(hiddenCount), "Saved but not shown"],
            [
              "Products",
              String(
                concerns.reduce(
                  (sum, concern) => sum + (concern.product_count ?? 0),
                  0,
                ),
              ),
              "Mapped products",
            ],
          ].map((item, index) => (
            <StatCard
              active={item[0] === "Visible"}
              index={index}
              item={item as [string, string, string]}
              key={item[0]}
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Problem-Based Discovery
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight">
                    Concern Landing List
                  </h2>
                </div>
              </div>
              <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
                <div className="relative max-w-xl">
                  <input
                    className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-10 text-sm text-slate-700 outline-none focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/15"
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search concern / slug / parent..."
                    type="search"
                    value={searchTerm}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    Search
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["All", "Visible", "Hidden"].map((item) => (
                    <button
                      className={`rounded-full px-4 py-2 text-xs font-semibold ${
                        item === concernFilter
                          ? "bg-[#5E7F85] text-white"
                          : "border border-slate-200 bg-white text-slate-600"
                      }`}
                      key={item}
                      onClick={() => setConcernFilter(item)}
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
                <TableHead>
                  <tr>
                    {[
                      "Concern",
                      "Slug",
                      "Products",
                      "Image",
                      "Visibility",
                      "Action",
                    ].map((head) => (
                      <th className="px-5 py-4 font-medium" key={head}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </TableHead>
                <tbody>
                  {filteredConcerns.length > 0 ? (
                    filteredConcerns.map((concern) => (
                      <tr
                        className={`cursor-pointer border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85] ${
                          selectedConcern?.id === concern.id
                            ? "bg-[#5E7F85]/[0.06] shadow-[inset_3px_0_0_#5E7F85]"
                            : concern.status === "inactive"
                              ? "bg-amber-50/25"
                              : "bg-white"
                        }`}
                        key={concern.id}
                        onClick={() => setSelectedId(concern.id)}
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">
                            {concern.name}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-slate-500">
                          /concern/{concern.slug}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-500">
                          {concern.product_count ?? 0}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={concern.image ? "good" : "default"}>
                            {concern.image ? "Image Set" : "No Image"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={getStatusTone(concern.status)}>
                            {getStatusLabel(concern.status)}
                          </Badge>
                        </td>
                        <td
                          className="px-5 py-4"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex items-center gap-2">
                            <Link
                              className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-semibold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white"
                              href={`/concerns?edit=${concern.id}`}
                            >
                              Edit
                            </Link>
                            <button
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-stone-50"
                              onClick={() => setSelectedId(concern.id)}
                              type="button"
                            >
                              Open
                            </button>
                            <button
                              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={deletingConcernIds.includes(concern.id) || concern.status === "inactive"}
                              onClick={() => handleHideConcern(concern.id)}
                              type="button"
                            >
                              {deletingConcernIds.includes(concern.id)
                                ? "Hiding..."
                                : concern.status === "inactive"
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
                        colSpan={9}
                      >
                        No concerns found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Homepage Visibility
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight">
                Shop by Concern
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Visible concerns appear in the homepage Shop by Concern section and concern browsing pages. Product-level concern mapping is managed from product create/edit screens.
              </p>
              {selectedConcern ? (
                <div className="mt-5 rounded-2xl bg-stone-50 px-4 py-4 text-sm font-semibold text-slate-600">
                  {selectedConcern.product_count ?? 0} Products mapped
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {showForm ? (
          <ConcernForm
            editingConcern={editingConcern}
            isPending={isPending}
            key={editingConcern?.id ?? "new-concern"}
            onClose={() => setShowAddForm(false)}
            onSubmit={handleConcernSubmit}
            state={formState}
          />
        ) : null}
      </div>
    </AdminShell>
  );
}
