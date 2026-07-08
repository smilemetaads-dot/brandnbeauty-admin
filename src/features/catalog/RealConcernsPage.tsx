"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
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

type ConcernPreview = {
  banner: string;
  concernType: string;
  id: string;
  name: string;
  parent: string;
  products: string;
  routine: string[];
  severity: string;
  slug: string;
  status: string;
};

const inputClassName =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/15";

const labelClassName = "text-sm font-semibold text-slate-700";

const CONCERNS_ENDPOINT = bnbApiUrl("get_concerns.php?include_inactive=1");
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

const concernGroups = [
  {
    title: "Skin Concern",
    desc: "Face-focused problem discovery",
    items: ["Acne", "Dark Spots", "Oily Skin", "Sensitive Skin", "Dry Skin"],
  },
  {
    title: "Hair Concern",
    desc: "Hair and scalp product discovery",
    items: ["Hairfall", "Dandruff", "Frizz", "Damaged Hair"],
  },
  {
    title: "Body Concern",
    desc: "Body care problem discovery",
    items: ["Body Acne", "Dark Underarm", "Dry Body Skin", "Rough Texture"],
  },
];

const concernPreviews: ConcernPreview[] = [
  {
    banner: "Ready",
    concernType: "Skin",
    id: "acne",
    name: "Acne",
    parent: "Skin Concern",
    products: "Preview",
    routine: ["Cleanser", "Treatment", "Moisturizer", "Sunscreen"],
    severity: "Medium",
    slug: "acne",
    status: "Active",
  },
  {
    banner: "Ready",
    concernType: "Skin",
    id: "dark-spots",
    name: "Dark Spots",
    parent: "Skin Concern",
    products: "Preview",
    routine: ["Cleanser", "Brightening Serum", "Moisturizer", "Sunscreen"],
    severity: "Medium",
    slug: "dark-spots",
    status: "Active",
  },
  {
    banner: "Needs Image",
    concernType: "Skin",
    id: "oily-skin",
    name: "Oily Skin",
    parent: "Skin Concern",
    products: "Preview",
    routine: ["Cleanser", "Toner", "Gel Moisturizer", "Sunscreen"],
    severity: "Mild",
    slug: "oily-skin",
    status: "Active",
  },
  {
    banner: "Draft",
    concernType: "Skin",
    id: "sensitive-skin",
    name: "Sensitive Skin",
    parent: "Skin Concern",
    products: "Preview",
    routine: ["Gentle Cleanser", "Calming Serum", "Barrier Cream", "Sunscreen"],
    severity: "Advanced",
    slug: "sensitive-skin",
    status: "Draft",
  },
];

const getStatusLabel = (status: string | null) =>
  status === "inactive" ? "Draft" : "Active";

const getVisibilityLabel = (status: string | null) =>
  status === "inactive" ? "Hidden" : "Visible";

const getStatusTone = (status: string | null): BadgeTone =>
  status === "inactive" ? "warn" : "good";

const getSeoScore = (concern: ConcernRecord) => {
  let score = 50;

  if (concern.meta_title) {
    score += 20;
  }

  if (concern.meta_description) {
    score += 20;
  }

  if (concern.slug) {
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

function getPreviewForConcern(concern: ConcernRecord | null) {
  if (!concern) {
    return concernPreviews[0];
  }

  return (
    concernPreviews.find(
      (preview) =>
        preview.slug === concern.slug ||
        preview.name.toLowerCase() === concern.name.toLowerCase(),
    ) ?? concernPreviews[0]
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
              This form now creates live concern metadata through the local PHP
              backend. Active concerns appear on the homepage and concern
              routes; inactive concerns stay hidden. Use a clean slug, square
              image URL, and lower sort order for earlier placement.
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
            Name
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
              Active means visible on storefront sections; inactive hides it.
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

          <label className={labelClassName}>
            Image URL
            <span className="mt-1 block text-xs font-medium text-slate-500">
              Use a square JPG, PNG, or WEBP. Blank is allowed and shows the concern name.
            </span>
            <input
              className={inputClassName}
              defaultValue={editingConcern?.image ?? ""}
              name="image"
              placeholder="https://..."
              type="text"
            />
          </label>

          <label className={`${labelClassName} md:col-span-2`}>
            SEO Title
            <input
              className={inputClassName}
              defaultValue={editingConcern?.meta_title ?? ""}
              name="metaTitle"
              placeholder="Acne care products in Bangladesh | BrandnBeauty"
              type="text"
            />
          </label>

          <label className={`${labelClassName} md:col-span-2`}>
            Meta Description
            <textarea
              className={`${inputClassName} h-24 resize-y`}
              defaultValue={editingConcern?.meta_description ?? ""}
              name="metaDescription"
              placeholder="Find acne care products in Bangladesh with simple routine guidance..."
            />
          </label>

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

  async function handleDeleteConcern(concernId: string) {
    if (!window.confirm("Delete this concern?")) {
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
        throw new Error(result?.message ?? "Concern could not be deleted.");
      }

      setConcerns((current) => current.filter((concern) => concern.id !== concernId));
      setSelectedId((current) =>
        current === concernId
          ? concerns.find((concern) => concern.id !== concernId)?.id ?? ""
          : current,
      );
      setFormState({ ok: true, message: result.message ?? "Item deleted successfully" });
    } catch (error) {
      setFormState({
        ok: false,
        message:
          error instanceof Error ? error.message : "Concern could not be deleted.",
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
  const needsWork = concerns.filter(
    (concern) =>
      getSeoScore(concern) < 75 ||
      !concern.image ||
      concern.status === "inactive",
  ).length;
  const avgSeo = concerns.length
    ? Math.round(
        concerns.reduce((sum, concern) => sum + getSeoScore(concern), 0) /
          concerns.length,
      )
    : 0;
  const selectedPreview = getPreviewForConcern(selectedConcern);
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
          (concernFilter === "Active" && concern.status !== "inactive") ||
          (concernFilter === "Draft" && concern.status === "inactive") ||
          (concernFilter === "Visible" && concern.status !== "inactive") ||
          (concernFilter === "Hidden" && concern.status === "inactive") ||
          (concernFilter === "Concern Menu" && concern.status !== "inactive");

        return matchesSearch && matchesFilter;
      }),
    [concernFilter, concerns, searchTerm],
  );
  const liveConcernPreviewRows = useMemo(
    () =>
      filteredConcerns.map((concern, index) => {
        const preview = getPreviewForConcern(concern);

        return {
          concern,
          preview: {
            ...(index < 4 ? preview : { ...preview, products: "Preview" }),
            products: String(concern.product_count ?? 0),
          },
        };
      }),
    [filteredConcerns],
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
                Manage problem-based discovery, concern landing SEO, routine
                mapping and concern filter visibility from one clean place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DisabledButton title="Import concerns is not connected yet">
                Import
              </DisabledButton>
              <DisabledButton
                className="border-[#5E7F85]/30 bg-[#5E7F85]/5 text-[#5E7F85]/50"
                title="Routine mapping is not connected yet"
              >
                Routine Mapping
              </DisabledButton>
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
              Avg SEO score: <b className="text-emerald-700">{avgSeo}/100</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Needs work: <b className="text-amber-700">{needsWork}</b>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total Concerns", String(concerns.length), "Problem pages"],
            ["Concern Groups", String(concernGroups.length), "Skin, hair, body"],
            [
              "Mapped Products",
              String(
                concerns.reduce(
                  (sum, concern) => sum + (concern.product_count ?? 0),
                  0,
                ),
              ),
              "Problem matching",
            ],
            ["SEO Needs Work", String(needsWork), "Review banner/meta"],
          ].map((item, index) => (
            <StatCard
              active={item[0] === "SEO Needs Work"}
              index={index}
              item={item as [string, string, string]}
              key={item[0]}
            />
          ))}
        </div>

        <div className="rounded-[2rem] border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">
                Concern Group View
              </div>
              <div className="mt-1 text-sm leading-6 text-slate-600">
                Concern pages problem-based discovery er jonno group wise thakbe.
                Frontend e Shop by Concern, filters and routine recommendations
                ekhanei control hobe.
              </div>
            </div>
            <DisabledButton
              className="w-fit bg-[#5E7F85]/10 text-[#5E7F85]/50"
              title="New concern group is not connected yet"
            >
              + New Concern
            </DisabledButton>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {concernGroups.map((group) => (
              <div
                className="rounded-[1.5rem] border border-slate-200 bg-white p-4"
                key={group.title}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900">
                      {group.title}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {group.desc}
                    </div>
                  </div>
                  <Badge tone="brand">{group.items.length}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      className="rounded-full bg-stone-50 px-3 py-2 text-xs font-bold text-slate-600"
                      key={item}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
                <div className="flex flex-wrap gap-2">
                  <DisabledButton title="Use each concern form to edit sort order">
                    Sort Order
                  </DisabledButton>
                  <DisabledButton
                    className="bg-[#5E7F85]/10 text-[#5E7F85]/50"
                    title="Bulk visibility update is not connected yet"
                  >
                    Bulk Visibility
                  </DisabledButton>
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
                  {[
                    "All",
                    "Active",
                    "Draft",
                    "Visible",
                    "Hidden",
                    "Concern Menu",
                  ].map((item) => (
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
                      "Type",
                      "Severity",
                      "Products",
                      "Routine",
                      "SEO",
                      "Banner",
                      "Status",
                      "Action",
                    ].map((head) => (
                      <th className="px-5 py-4 font-medium" key={head}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </TableHead>
                <tbody>
                  {liveConcernPreviewRows.length > 0 ? (
                    liveConcernPreviewRows.map(({ concern, preview }) => (
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
                          <div className="mt-1 text-xs text-slate-500">
                            /concern/{concern.slug}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone="brand">{preview.concernType}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            tone={
                              preview.severity === "Advanced"
                                ? "bad"
                                : preview.severity === "Medium"
                                  ? "warn"
                                  : "good"
                            }
                          >
                            {preview.severity}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-500">
                          {preview.products}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex max-w-[240px] flex-wrap gap-1">
                            {preview.routine.slice(0, 3).map((step) => (
                              <span
                                className="rounded-full bg-stone-100 px-2 py-1 text-[10px] font-bold text-slate-600"
                                key={step}
                              >
                                {step}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            tone={
                              getSeoScore(concern) >= 80
                                ? "good"
                                : getSeoScore(concern) >= 70
                                  ? "warn"
                                  : "bad"
                            }
                          >
                            {getSeoScore(concern)}/100
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={concern.image ? "good" : "warn"}>
                            {concern.image ? "Ready" : preview.banner}
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
                              disabled={deletingConcernIds.includes(concern.id)}
                              onClick={() => handleDeleteConcern(concern.id)}
                              type="button"
                            >
                              {deletingConcernIds.includes(concern.id)
                                ? "Deleting..."
                                : "Delete"}
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
              {selectedConcern ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-500">
                        Selected Concern
                      </div>
                      <h3 className="mt-1 text-xl font-bold tracking-tight">
                        {selectedConcern.name}
                      </h3>
                      <div className="mt-1 text-xs text-slate-500">
                        /concern/{selectedConcern.slug}
                      </div>
                    </div>
                    <Badge tone={getStatusTone(selectedConcern.status)}>
                      {getVisibilityLabel(selectedConcern.status)}
                    </Badge>
                  </div>
                  <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-stone-50 p-4">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5E7F85] via-[#6f949a] to-[#d9e5e1] p-5 text-white shadow-sm">
                      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15" />
                      <div className="absolute -bottom-12 left-1/2 h-36 w-36 rounded-full bg-white/10" />
                      <div className="relative">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
                          Shop by Concern
                        </div>
                        <div className="mt-3 text-2xl font-black tracking-tight">
                          {selectedConcern.name}
                        </div>
                        <div className="mt-2 max-w-[240px] text-xs font-medium leading-5 text-white/85">
                          {selectedConcern.meta_description ??
                            `Find routine-friendly products for ${selectedConcern.name.toLowerCase()} concern with simple guidance and safer cosmetic claims.`}
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">
                            /concern/{selectedConcern.slug}
                          </span>
                          <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">
                            {selectedConcern.product_count ?? 0} Products
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge tone="brand">
                        SEO {getSeoScore(selectedConcern)}/100
                      </Badge>
                      <Badge tone={selectedConcern.image ? "good" : "warn"}>
                        {selectedConcern.image ? "Ready" : selectedPreview.banner}
                      </Badge>
                      <Badge tone="default">
                        {selectedConcern.product_count ?? 0} Products
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3 text-sm">
                    {[
                      ["Concern Group", selectedPreview.parent],
                      ["Concern Type", selectedPreview.concernType],
                      ["Severity", selectedPreview.severity],
                      ["Products", selectedConcern.product_count ?? 0],
                      ["Routine Steps", selectedPreview.routine.length],
                      ["Status", getStatusLabel(selectedConcern.status)],
                    ].map(([label, value]) => (
                      <div
                        className="flex justify-between rounded-2xl bg-stone-50 px-4 py-3"
                        key={label}
                      >
                        <span className="text-slate-500">{label}</span>
                        <b className="text-right text-slate-900">{value}</b>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-3">
                    <Link
                      className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-center text-sm font-semibold text-white"
                      href={`/concerns?edit=${selectedConcern.id}`}
                    >
                      Edit Concern
                    </Link>
                    <DisabledButton title="SEO settings are not connected yet">
                      SEO Settings
                    </DisabledButton>
                    <DisabledButton title="Banner upload is not connected yet">
                      Upload Banner
                    </DisabledButton>
                  </div>
                </>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-stone-50 p-6 text-center text-sm font-medium text-slate-500">
                  Concern preview appears here after live concerns are added.
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Concern Mapping
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight">
                Routine / Related Filters
              </h3>
              <div className="mt-5 flex flex-wrap gap-2">
                {selectedPreview.routine.map((item) => (
                  <span
                    className="rounded-full bg-[#5E7F85]/10 px-3 py-2 text-xs font-bold text-[#5E7F85]"
                    key={item}
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-slate-500">
                    Product Mapping
                  </div>
                  <Badge tone="good">
                    {selectedConcern.product_count ?? 0} Products
                  </Badge>
                </div>
                <div className="mt-3 rounded-2xl bg-stone-50 px-4 py-4 text-xs font-semibold leading-5 text-slate-600">
                  Products mapped to this concern are counted from the live
                  database. Product-level concern mapping is managed from
                  product create/edit screens.
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                SEO + Storefront Note
              </div>
              <div className="mt-2 text-sm leading-6 text-amber-700">
                Active concerns are visible on storefront sections. Keep slug
                and image clean, avoid medical claims, use sort order for
                placement, and set inactive before saving unfinished rows.
              </div>
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
