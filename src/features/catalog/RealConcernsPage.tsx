"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { saveConcern } from "@/features/catalog/concern-actions";

import type { ConcernRecord } from "./concerns-data";

type RealConcernsPageProps = {
  concerns: ConcernRecord[];
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

const mappedProductPreview = {
  acne: ["Acne Balance Facewash", "Spot Care Gel", "Niacinamide Serum"],
  "dark-spots": ["Vitamin C Serum", "Brightening Cream", "Niacinamide Serum"],
  "oily-skin": ["Oil Control Cleanser", "Gel Moisturizer", "Clay Mask"],
  "sensitive-skin": ["Barrier Calm Serum", "Gentle Cleanser", "Calming Moisturizer"],
};

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
  formAction,
  isPending,
  state,
  onClose,
}: {
  editingConcern: ConcernRecord | null;
  formAction: (payload: FormData) => void;
  isPending: boolean;
  state: { ok: boolean; message: string };
  onClose: () => void;
}) {
  const isEditing = Boolean(editingConcern);

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
              This form submits through the existing live concern server action.
              Routine mapping, severity, education copy, and product matching
              controls are preview-only until connected.
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

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {["Skin", "Hair", "Body"].map((item, index) => (
            <button
              className={`cursor-not-allowed rounded-2xl px-4 py-3 text-sm font-bold ${
                index === 0
                  ? "bg-[#5E7F85] text-white"
                  : "border border-slate-200 bg-stone-50 text-slate-400"
              }`}
              disabled
              key={item}
              title="Concern group switching is not connected yet"
              type="button"
            >
              {item} Concern
            </button>
          ))}
        </div>

        <form action={formAction} className="mt-5 grid gap-4 md:grid-cols-2">
          <input name="id" type="hidden" value={editingConcern?.id ?? ""} />

          <label className={labelClassName}>
            Name
            <input
              className={inputClassName}
              defaultValue={editingConcern?.name ?? ""}
              name="name"
              placeholder="Acne"
              required
              type="text"
            />
          </label>

          <label className={labelClassName}>
            Slug
            <input
              className={`${inputClassName} bg-stone-50 font-semibold`}
              defaultValue={editingConcern?.slug ?? ""}
              name="slug"
              placeholder="auto-generated-slug"
              required
              type="text"
            />
          </label>

          <label className={labelClassName}>
            Concern Group
            <select
              className={`${inputClassName} cursor-not-allowed bg-stone-50 text-slate-500`}
              disabled
            >
              <option>Skin Concern</option>
            </select>
          </label>

          <label className={labelClassName}>
            Severity
            <select
              className={`${inputClassName} cursor-not-allowed bg-stone-50 text-slate-500`}
              disabled
            >
              <option>Medium</option>
            </select>
          </label>

          <label className={labelClassName}>
            Visibility
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
            <input
              className={inputClassName}
              defaultValue={editingConcern?.sort_order ?? 0}
              name="sortOrder"
              step="1"
              type="number"
            />
          </label>

          <label className={labelClassName}>
            Banner Status
            <input
              className={`${inputClassName} cursor-not-allowed bg-stone-50 text-slate-500`}
              disabled
              placeholder={editingConcern?.image ? "Ready" : "Needs Image"}
              type="text"
            />
          </label>

          <label className={labelClassName}>
            Image URL
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

          <label className={`${labelClassName} md:col-span-2`}>
            Concern Education Copy
            <textarea
              className={`${inputClassName} h-24 cursor-not-allowed resize-y bg-stone-50 text-slate-500`}
              disabled
              placeholder="Short educational intro for concern landing page..."
            />
          </label>

          <label className={`${labelClassName} md:col-span-2`}>
            Safety Note
            <textarea
              className={`${inputClassName} h-20 cursor-not-allowed resize-y bg-stone-50 text-slate-500`}
              disabled
              placeholder="Cosmetic guidance only. Patch test before use."
            />
          </label>

          <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            <input
              className="h-4 w-4 rounded border-slate-300 text-[#5E7F85]"
              defaultChecked={editingConcern?.featured ?? false}
              name="featured"
              type="checkbox"
            />
            Featured concern
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
  concerns,
  editConcernId,
}: RealConcernsPageProps) {
  const [state, formAction, isPending] = useActionState(saveConcern, {
    ok: false,
    message: "",
  });
  const editingConcern =
    concerns.find((concern) => concern.id === editConcernId) ?? null;
  const [selectedId, setSelectedId] = useState(
    editingConcern?.id ?? concerns[0]?.id ?? "",
  );
  const [showAddForm, setShowAddForm] = useState(false);

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
  const previewProducts =
    mappedProductPreview[
      selectedPreview.id as keyof typeof mappedProductPreview
    ] ?? mappedProductPreview.acne;
  const liveConcernPreviewRows = useMemo(
    () =>
      concerns.map((concern, index) => {
        const preview = getPreviewForConcern(concern);

        return {
          concern,
          preview: index < 4 ? preview : { ...preview, products: "Preview" },
        };
      }),
    [concerns],
  );
  const showForm = showAddForm || Boolean(editingConcern);

  return (
    <AdminShell>
      <div className="space-y-6">
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
              Products mapped: <b className="text-slate-900">Preview</b>
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
            ["Mapped Products", "Preview", "Problem matching"],
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
                  <DisabledButton title="Sort display order is not connected yet">
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
                    className="w-full cursor-not-allowed rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-10 text-sm text-slate-500 outline-none"
                    disabled
                    placeholder="Search concern / slug / parent..."
                    type="search"
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
                      className={`cursor-not-allowed rounded-full px-4 py-2 text-xs font-semibold ${
                        item === "All"
                          ? "bg-[#5E7F85] text-white"
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
                            Products preview
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
                      <Badge tone="default">Products preview</Badge>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3 text-sm">
                    {[
                      ["Concern Group", selectedPreview.parent],
                      ["Concern Type", selectedPreview.concernType],
                      ["Severity", selectedPreview.severity],
                      ["Products", "Preview"],
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
                    Top Mapped Products
                  </div>
                  <Badge tone="good">Preview</Badge>
                </div>
                <div className="mt-3 space-y-2">
                  {previewProducts.map((item, index) => (
                    <div
                      className="rounded-2xl bg-stone-50 px-4 py-3 text-xs"
                      key={item}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-slate-700">{item}</span>
                        <span className="rounded-full bg-white px-2 py-1 font-bold text-[#5E7F85]">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white px-2 py-1 font-bold text-slate-500">
                          {index === 0 ? "Best Match" : "Related"}
                        </span>
                        <span className="rounded-full bg-white px-2 py-1 font-bold text-slate-500">
                          Step{" "}
                          {selectedPreview.routine[
                            Math.min(index, selectedPreview.routine.length - 1)
                          ] ?? "Routine"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                SEO + Storefront Note
              </div>
              <div className="mt-2 text-sm leading-6 text-amber-700">
                Every visible concern should have clean slug, educational intro,
                SEO title, meta description, routine mapping and safe cosmetic
                wording before showing on storefront.
              </div>
            </div>
          </div>
        </div>

        {showForm ? (
          <ConcernForm
            editingConcern={editingConcern}
            formAction={formAction}
            isPending={isPending}
            onClose={() => setShowAddForm(false)}
            state={state}
          />
        ) : null}
      </div>
    </AdminShell>
  );
}
