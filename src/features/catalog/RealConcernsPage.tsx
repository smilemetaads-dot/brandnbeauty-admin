"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { saveConcern } from "@/features/catalog/concern-actions";

import type { ConcernRecord } from "./concerns-data";

type RealConcernsPageProps = {
  concerns: ConcernRecord[];
  editConcernId?: string;
};

const inputClassName =
  "mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400";

const labelClassName = "text-sm font-medium text-slate-700";

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
  const isEditing = Boolean(editingConcern);

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
          <p className="text-sm font-semibold uppercase text-[#527B86]">
            Catalog
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">
                Concerns
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Live concern records from Supabase.
              </p>
            </div>
            <div className="rounded-md bg-[#527B86]/10 px-3 py-2 text-sm font-semibold text-[#527B86]">
              {concerns.length} concerns
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                {isEditing ? "Edit Concern" : "Add Concern"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Create and update concern records in Supabase.
              </p>
            </div>
            {isEditing ? (
              <Link
                className="text-sm font-semibold text-[#527B86] hover:text-slate-950"
                href="/concerns"
              >
                Clear edit
              </Link>
            ) : null}
          </div>

          <form action={formAction} className="grid gap-5 sm:grid-cols-2">
            <input name="id" type="hidden" value={editingConcern?.id ?? ""} />

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
                className={`rounded-md px-3 py-2 text-sm font-medium ${
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
                className="w-full rounded-md bg-[#527B86] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300"
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
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Featured
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {concerns.length > 0 ? (
                  concerns.map((concern) => (
                    <tr key={concern.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {concern.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {concern.slug}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {concern.status ?? "unknown"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {concern.featured ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          className="font-semibold text-[#527B86] hover:text-slate-950"
                          href={`/concerns?edit=${concern.id}`}
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-slate-500"
                      colSpan={5}
                    >
                      No concerns found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
