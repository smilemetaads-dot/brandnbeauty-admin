"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { saveConcern } from "@/features/catalog/concern-actions";

import type { ConcernRecord } from "./concerns-data";

type RealConcernsPageProps = {
  concerns: ConcernRecord[];
  editConcernId?: string;
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const inputClassName =
  "mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#527B86] focus:ring-2 focus:ring-[#527B86]/15";

const labelClassName = "text-sm font-medium text-slate-600";

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

const getStatusLabel = (status: string | null) =>
  status === "inactive" ? "Inactive" : "Active";

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
  const selectedConcern = editingConcern ?? concerns[0] ?? null;
  const isEditing = Boolean(editingConcern);
  const activeCount = concerns.filter(
    (concern) => concern.status !== "inactive",
  ).length;
  const inactiveCount = concerns.length - activeCount;
  const featuredCount = concerns.filter((concern) => concern.featured).length;
  const needsSeoCount = concerns.filter(
    (concern) => getSeoScore(concern) < 80,
  ).length;
  const avgSeo = concerns.length
    ? Math.round(
        concerns.reduce((sum, concern) => sum + getSeoScore(concern), 0) /
          concerns.length,
      )
    : 0;

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                Catalog Taxonomy
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Concerns Control Room
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Manage live Supabase concerns, problem-based discovery, SEO
                metadata, featured placement, and display order from one clean
                place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DisabledAction>Import Not Connected</DisabledAction>
              <DisabledAction>Routine Mapping Not Connected</DisabledAction>
              <Link
                className="rounded-2xl bg-[#527B86] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-950"
                href="/concerns"
              >
                Add Concern
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
              Avg SEO score: <b className="text-emerald-700">{avgSeo}/100</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Needs work: <b className="text-amber-700">{needsSeoCount}</b>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Live Supabase rows"
            label="Total Concerns"
            value={String(concerns.length)}
          />
          <StatCard
            helper="Visual grouping placeholder"
            label="Concern Groups"
            value={String(concernGroups.length)}
          />
          <StatCard
            helper="Featured discovery"
            label="Featured"
            value={String(featuredCount)}
          />
          <StatCard
            active
            helper="Review meta title/description"
            label="SEO Needs Work"
            value={String(needsSeoCount)}
          />
        </section>

        <section className="rounded-[2rem] border border-[#527B86]/15 bg-[#527B86]/5 p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-bold text-slate-950">
                Concern Group View
              </div>
              <div className="mt-1 text-sm leading-6 text-slate-600">
                Source-style concern grouping is shown as a visual guide. Group
                storage, routine mapping, and related product mapping are not
                connected in this schema phase.
              </div>
            </div>
            <DisabledAction>New Concern Group Not Connected</DisabledAction>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {concernGroups.map((group) => (
              <div
                className="rounded-[1.5rem] border border-slate-200 bg-white p-4"
                key={group.title}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-950">
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
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">
                    {isEditing ? "Edit Concern" : "Add Concern"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Create and update concern records through the live Supabase
                    server action.
                  </p>
                </div>
                {isEditing ? (
                  <Link
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                    href="/concerns"
                  >
                    Clear Edit
                  </Link>
                ) : null}
              </div>

              <form action={formAction} className="grid gap-5 sm:grid-cols-2">
                <input
                  name="id"
                  type="hidden"
                  value={editingConcern?.id ?? ""}
                />

                <label className={labelClassName}>
                  Name
                  <input
                    className={inputClassName}
                    defaultValue={editingConcern?.name ?? ""}
                    name="name"
                    placeholder="Concern name"
                    required
                    type="text"
                  />
                </label>

                <label className={labelClassName}>
                  Slug
                  <input
                    className={inputClassName}
                    defaultValue={editingConcern?.slug ?? ""}
                    name="slug"
                    placeholder="concern-slug"
                    required
                    type="text"
                  />
                </label>

                <label className={labelClassName}>
                  Image
                  <input
                    className={inputClassName}
                    defaultValue={editingConcern?.image ?? ""}
                    name="image"
                    placeholder="Image URL"
                    type="text"
                  />
                </label>

                <label className={labelClassName}>
                  Status
                  <select
                    className={inputClassName}
                    defaultValue={editingConcern?.status ?? "active"}
                    name="status"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>

                <label className={labelClassName}>
                  Meta title
                  <input
                    className={inputClassName}
                    defaultValue={editingConcern?.meta_title ?? ""}
                    name="metaTitle"
                    placeholder="Meta title"
                    type="text"
                  />
                </label>

                <label className={labelClassName}>
                  Sort order
                  <input
                    className={inputClassName}
                    defaultValue={editingConcern?.sort_order ?? 0}
                    name="sortOrder"
                    step="1"
                    type="number"
                  />
                </label>

                <label className={`${labelClassName} sm:col-span-2`}>
                  Meta description
                  <textarea
                    className={`${inputClassName} min-h-24 resize-y`}
                    defaultValue={editingConcern?.meta_description ?? ""}
                    name="metaDescription"
                    placeholder="Meta description"
                  />
                </label>

                <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <input
                    className="h-4 w-4 rounded border-slate-300 text-[#527B86]"
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

                <div className="flex items-end">
                  <button
                    className="w-full rounded-2xl bg-[#527B86] px-4 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={isPending}
                    type="submit"
                  >
                    {isPending
                      ? "Saving..."
                      : isEditing
                        ? "Update Concern"
                        : "Add Concern"}
                  </button>
                </div>
              </form>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-500">
                      Problem-Based Discovery
                    </div>
                    <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                      Concern Landing List
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <DisabledAction>Sort Order Bulk Not Connected</DisabledAction>
                    <DisabledAction>Bulk Visibility Not Connected</DisabledAction>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
                  <input
                    className="max-w-xl rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm text-slate-500 outline-none"
                    disabled
                    placeholder="Search not connected yet"
                    type="search"
                  />
                  <div className="flex flex-wrap gap-2">
                    {["All", "Active", "Inactive", "Featured"].map((item) => (
                      <button
                        className={`rounded-full px-4 py-2 text-xs font-semibold ${
                          item === "All"
                            ? "bg-[#527B86] text-white"
                            : "border border-slate-200 bg-white text-slate-500"
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
                  <thead className="bg-stone-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      {[
                        "Concern",
                        "Slug",
                        "Sort",
                        "Featured",
                        "SEO",
                        "Status",
                        "Action",
                      ].map((head) => (
                        <th className="px-5 py-4 font-medium" key={head}>
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {concerns.length > 0 ? (
                      concerns.map((concern) => (
                        <tr
                          className={`border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#527B86] ${
                            selectedConcern?.id === concern.id
                              ? "bg-[#527B86]/[0.06] shadow-[inset_3px_0_0_#527B86]"
                              : concern.status === "inactive"
                                ? "bg-amber-50/25"
                                : "bg-white"
                          }`}
                          key={concern.id}
                        >
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-950">
                              {concern.name}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {concern.image ? "Image URL saved" : "No image"}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs font-semibold text-slate-500">
                            /concern/{concern.slug}
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-700">
                            {concern.sort_order ?? 0}
                          </td>
                          <td className="px-5 py-4">
                            <Badge tone={concern.featured ? "brand" : "default"}>
                              {concern.featured ? "Featured" : "Standard"}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <Badge
                              tone={
                                getSeoScore(concern) >= 80 ? "good" : "warn"
                              }
                            >
                              {getSeoScore(concern)}/100
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <Badge tone={getStatusTone(concern.status)}>
                              {getStatusLabel(concern.status)}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                className="rounded-xl bg-[#527B86]/10 px-3 py-2 text-xs font-semibold text-[#527B86] transition hover:bg-[#527B86] hover:text-white"
                                href={`/concerns?edit=${concern.id}`}
                              >
                                Edit
                              </Link>
                              <button
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400"
                                disabled
                                type="button"
                              >
                                Open Not Connected
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          className="px-5 py-14 text-center text-sm text-slate-500"
                          colSpan={7}
                        >
                          No concerns found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              {selectedConcern ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-500">
                        Selected Concern
                      </div>
                      <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
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
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#527B86] via-[#6f949a] to-[#d9e5e1] p-5 text-white shadow-sm">
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
                            "Concern SEO and educational copy will appear here when saved."}
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">
                            /concern/{selectedConcern.slug}
                          </span>
                          <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">
                            Sort {selectedConcern.sort_order ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge tone="brand">
                        SEO {getSeoScore(selectedConcern)}/100
                      </Badge>
                      <Badge tone={selectedConcern.image ? "good" : "warn"}>
                        {selectedConcern.image ? "Image Saved" : "Image Missing"}
                      </Badge>
                      <Badge tone={selectedConcern.featured ? "brand" : "default"}>
                        {selectedConcern.featured ? "Featured" : "Standard"}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3 text-sm">
                    {[
                      ["Status", getStatusLabel(selectedConcern.status)],
                      ["Visibility", getVisibilityLabel(selectedConcern.status)],
                      ["Sort Order", selectedConcern.sort_order ?? 0],
                      ["Meta Title", selectedConcern.meta_title ?? "-"],
                      [
                        "Meta Description",
                        selectedConcern.meta_description ? "Saved" : "-",
                      ],
                    ].map(([label, value]) => (
                      <div
                        className="flex justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3"
                        key={label}
                      >
                        <span className="text-slate-500">{label}</span>
                        <b className="text-right text-slate-950">{value}</b>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-3">
                    <Link
                      className="rounded-2xl bg-[#527B86] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-950"
                      href={`/concerns?edit=${selectedConcern.id}`}
                    >
                      Edit Concern
                    </Link>
                    <DisabledAction>SEO Settings Not Connected</DisabledAction>
                    <DisabledAction>Banner Upload Not Connected</DisabledAction>
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
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Routine / Related Filters
              </h3>
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "Routine steps",
                  "Mapped products",
                  "Severity",
                  "Related categories",
                ].map((item) => (
                  <Badge key={item} tone="default">
                    {item} Not Connected
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                SEO + Storefront Note
              </div>
              <div className="mt-2 text-sm leading-6 text-amber-700">
                Every visible concern should have a clean slug, educational
                intro, SEO title, meta description, routine mapping, and safe
                cosmetic wording before becoming a mature storefront discovery
                page. No hard delete action is available here.
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
