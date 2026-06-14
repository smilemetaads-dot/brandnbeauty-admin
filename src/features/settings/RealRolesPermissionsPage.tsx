import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const roleStats = [
  ["Admin Users", "7", "Active team access"],
  ["Custom Roles", "4", "Configured groups"],
  ["Sensitive Access", "3", "Finance + settings"],
  ["Pending Review", "2", "Need permission audit"],
] as const;

const roles = [
  {
    name: "Super Admin",
    scope: "Full system access",
    status: "Protected",
    users: 1,
  },
  {
    name: "Order Manager",
    scope: "Orders, courier, customers",
    status: "Active",
    users: 3,
  },
  {
    name: "Inventory Manager",
    scope: "Products, stock, suppliers",
    status: "Active",
    users: 2,
  },
  {
    name: "Finance Manager",
    scope: "Finance, reports, reconciliation",
    status: "Review",
    users: 1,
  },
] as const;

const permissions = [
  ["Dashboard", "View", "View", "View", "View"],
  ["Orders", "Full", "Full", "View", "View"],
  ["Products", "Full", "View", "Full", "View"],
  ["Inventory", "Full", "View", "Full", "View"],
  ["Suppliers", "Full", "View", "Full", "View"],
  ["Finance", "Full", "No Access", "View", "Full"],
  ["Reports", "Full", "View", "View", "Full"],
  ["Settings", "Full", "No Access", "No Access", "View"],
] as const;

const selectedRole = roles[0];
const sensitiveModules = ["Finance", "Settings"];

const safetyItems = [
  "No invite user, create role, permission toggle, delete user or access enforcement workflow exists on this route yet.",
  "No Supabase writes, SQL, localStorage, auth helper changes or route protection changes were added.",
  "Audit log, export, create role, reset and save controls stay disabled until real actions exist.",
] as const;

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const className = {
    bad: "bg-rose-50 text-rose-700",
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    default: "bg-slate-100 text-slate-700",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function DisabledButton({
  children,
  primary = false,
}: {
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      className={
        primary
          ? "rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500"
          : "rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-400"
      }
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function StatCard({
  active = false,
  helper,
  label,
  value,
}: {
  active?: boolean;
  helper: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className={`rounded-[2rem] border p-5 shadow-sm ${
        active
          ? "border-[#5E7F85]/20 bg-[#5E7F85]/5"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-sm font-black text-[#5E7F85]">
          RP
        </span>
      </div>
      <div className="mt-3 text-xs font-semibold text-slate-500">{helper}</div>
    </div>
  );
}

function roleTone(status: string): BadgeTone {
  if (status === "Protected") {
    return "brand";
  }

  if (status === "Review") {
    return "warn";
  }

  return "good";
}

function permissionTone(value: string): BadgeTone {
  if (value === "Full") {
    return "brand";
  }

  if (value === "View") {
    return "good";
  }

  return "bad";
}

export function RealRolesPermissionsPage() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {roleStats.map(([label, value, helper]) => (
            <StatCard
              active={label === "Sensitive Access" || label === "Pending Review"}
              helper={helper}
              key={label}
              label={label}
              value={value}
            />
          ))}
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                Roles & Permissions Control Room
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Control admin access, module visibility and sensitive actions
                from one place. This page is preview-only until real role and
                permission actions are connected.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <DisabledButton>Audit Log</DisabledButton>
              <DisabledButton>Export Matrix</DisabledButton>
              <DisabledButton primary>Create Role</DisabledButton>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Security focus: <b className="text-rose-700">Finance access</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Last audit: <b className="text-slate-900">Preview only</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Recommendation: <b className="text-[#5E7F85]">Review 2 roles</b>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Role Groups
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Admin Roles
              </h2>
              <div className="mt-5 space-y-3">
                {roles.map((role) => (
                  <div
                    className={`rounded-2xl p-4 ${
                      role.name === selectedRole.name
                        ? "bg-[#5E7F85]/10 ring-2 ring-[#5E7F85]/15"
                        : "bg-stone-50"
                    }`}
                    key={role.name}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900">
                          {role.name}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {role.scope}
                        </div>
                      </div>
                      <Badge tone={roleTone(role.status)}>{role.status}</Badge>
                    </div>
                    <div className="mt-3 text-xs font-semibold text-slate-500">
                      {role.users} user{role.users > 1 ? "s" : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                Permission Note
              </div>
              <p className="mt-2 text-sm leading-6 text-amber-700">
                Keep finance, settings and role management access limited to
                trusted admins only.
              </p>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-6 shadow-sm">
              <div className="text-sm font-medium text-[#5E7F85]">
                Selected Role
              </div>
              <div className="mt-1 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    {selectedRole.name}
                  </h2>
                  <div className="mt-2 text-sm text-slate-600">
                    {selectedRole.scope}
                  </div>
                </div>
                <Badge tone={roleTone(selectedRole.status)}>
                  {selectedRole.status}
                </Badge>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                  Users: <b className="text-slate-900">{selectedRole.users}</b>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                  Sensitive access:{" "}
                  <b className="text-rose-700">{sensitiveModules.join(", ")}</b>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                  Review status: <b className="text-[#5E7F85]">Clear</b>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-500">
                      Permission Matrix
                    </div>
                    <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                      Module Access Control
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <DisabledButton>Reset</DisabledButton>
                    <DisabledButton primary>Save Changes</DisabledButton>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-stone-50 text-slate-500">
                    <tr>
                      {[
                        "Module",
                        "Super Admin",
                        "Order Manager",
                        "Inventory Manager",
                        "Finance Manager",
                      ].map((heading) => (
                        <th className="px-5 py-4 font-medium" key={heading}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((row) => (
                      <tr
                        className={`border-t border-slate-100 transition hover:bg-stone-50 ${
                          ["Finance", "Settings"].includes(row[0])
                            ? "bg-amber-50/30"
                            : ""
                        }`}
                        key={row[0]}
                      >
                        {row.map((cell, index) => (
                          <td
                            className={`px-5 py-4 ${
                              index === 0 ? "font-bold text-slate-900" : ""
                            }`}
                            key={`${row[0]}-${index}`}
                          >
                            {index === 0 ? (
                              <span className="flex items-center gap-2">
                                {["Finance", "Settings"].includes(cell) ? (
                                  <span className="text-amber-500">!</span>
                                ) : null}
                                {cell}
                              </span>
                            ) : (
                              <Badge tone={permissionTone(cell)}>{cell}</Badge>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                Roles Safety Note
              </div>
              <div className="mt-3 space-y-2">
                {safetyItems.map((item) => (
                  <div
                    className="rounded-2xl bg-white/60 px-4 py-3 text-sm font-semibold leading-6 text-amber-800"
                    key={item}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
