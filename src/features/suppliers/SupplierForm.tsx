"use client";

import { useActionState } from "react";

import {
  createSupplier,
  type SupplierActionState,
  updateSupplier,
} from "@/features/suppliers/supplier-actions";

type SupplierFormSupplier = {
  address: string | null;
  contact_person: string | null;
  email: string | null;
  id: string;
  name: string;
  notes: string | null;
  payment_terms: string | null;
  phone: string | null;
  status: string;
};

type SupplierFormProps = {
  mode: "create" | "edit";
  supplier?: SupplierFormSupplier;
};

const initialState: SupplierActionState = {
  ok: false,
  message: "",
};

const inputClassName =
  "mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#527B86] focus:ring-2 focus:ring-[#527B86]/15";

const labelClassName = "text-sm font-medium text-slate-600";

export function SupplierForm({ mode, supplier }: SupplierFormProps) {
  const action = mode === "create" ? createSupplier : updateSupplier;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isCreateMode = mode === "create";

  return (
    <form action={formAction} className="grid gap-5 sm:grid-cols-2">
      {isCreateMode ? null : (
        <input name="supplierId" type="hidden" value={supplier?.id ?? ""} />
      )}

      <label className={labelClassName}>
        Supplier Name
        <input
          className={inputClassName}
          defaultValue={supplier?.name ?? ""}
          disabled={isPending}
          name="name"
          placeholder="Supplier name"
          required
          type="text"
        />
      </label>

      <label className={labelClassName}>
        Contact Person
        <input
          className={inputClassName}
          defaultValue={supplier?.contact_person ?? ""}
          disabled={isPending}
          name="contact_person"
          placeholder="Contact person"
          type="text"
        />
      </label>

      <label className={labelClassName}>
        Phone
        <input
          className={inputClassName}
          defaultValue={supplier?.phone ?? ""}
          disabled={isPending}
          name="phone"
          placeholder="Phone"
          type="text"
        />
      </label>

      <label className={labelClassName}>
        Email
        <input
          className={inputClassName}
          defaultValue={supplier?.email ?? ""}
          disabled={isPending}
          name="email"
          placeholder="Email"
          type="email"
        />
      </label>

      <label className={labelClassName}>
        Payment Terms
        <input
          className={inputClassName}
          defaultValue={supplier?.payment_terms ?? ""}
          disabled={isPending}
          name="payment_terms"
          placeholder="Payment terms"
          type="text"
        />
      </label>

      <label className={labelClassName}>
        Status
        <select
          className={inputClassName}
          defaultValue={supplier?.status ?? "active"}
          disabled={isPending}
          name="status"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>

      <label className={`${labelClassName} sm:col-span-2`}>
        Address
        <textarea
          className={`${inputClassName} min-h-24 resize-y`}
          defaultValue={supplier?.address ?? ""}
          disabled={isPending}
          name="address"
          placeholder="Supplier address"
        />
      </label>

      <label className={`${labelClassName} sm:col-span-2`}>
        Notes
        <textarea
          className={`${inputClassName} min-h-24 resize-y`}
          defaultValue={supplier?.notes ?? ""}
          disabled={isPending}
          name="notes"
          placeholder="Supplier notes"
        />
      </label>

      {state.message ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-semibold sm:col-span-2 ${
            state.ok
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="sm:col-span-2">
        <button
          className="w-full rounded-2xl bg-[#527B86] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isPending}
          type="submit"
        >
          {isPending
            ? "Saving..."
            : isCreateMode
              ? "Create Supplier"
              : "Save Supplier"}
        </button>
      </div>
    </form>
  );
}
