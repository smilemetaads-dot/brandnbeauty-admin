"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type AccessUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string | null;
  last_login_at: string | null;
};

type AccessPayload = {
  success: boolean;
  source_table: string;
  current_session: {
    id: string;
    email: string;
    name: string;
    role: string;
    expires_at: number;
  };
  summary: {
    users: number;
    active_users: number;
    roles: number;
    active_sessions: number;
  };
  role_counts: Record<string, number>;
  users: AccessUser[];
  permission_model: {
    state: "partial";
    role_labels_live: boolean;
    route_enforcement_connected: boolean;
    permission_matrix_persisted: boolean;
    mutation_controls_enabled: boolean;
  };
  message?: string;
};

const ENDPOINT = bnbApiUrl("get_admin_access.php");

function dateText(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function RealRolesPermissionsPage() {
  const [payload, setPayload] = useState<AccessPayload | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  async function refresh(signal?: AbortSignal) {
    setStatus("loading");
    setError("");
    try {
      const response = await fetch(ENDPOINT, {
        cache: "no-store",
        headers: adminAuthHeaders(),
        signal,
      });
      const next = (await response.json().catch(() => null)) as AccessPayload | null;
      if (!response.ok || !next?.success) {
        throw new Error(next?.message || "Admin access registry could not be loaded.");
      }
      setPayload(next);
      setStatus("ready");
    } catch (caught) {
      if (signal?.aborted) return;
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Admin access registry could not be loaded.");
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, []);

  const users = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return payload?.users ?? [];
    return (payload?.users ?? []).filter((user) =>
      `${user.name} ${user.email} ${user.role} ${user.status}`.toLowerCase().includes(needle),
    );
  }, [payload?.users, query]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#527B86]">
                Control · Access registry
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Roles & Permissions
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Live read-only visibility into the admin user registry, role labels and active sessions.
                Route-level permission enforcement and role mutation remain intentionally disabled until
                a dedicated authorization model is approved.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700">
                Partial — live registry
              </span>
              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-[#527B86] disabled:opacity-40"
                disabled={status === "loading"}
                onClick={() => void refresh()}
                type="button"
              >
                {status === "loading" ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
            {error}
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Admin users", payload?.summary.users ?? 0],
            ["Active users", payload?.summary.active_users ?? 0],
            ["Role labels", payload?.summary.roles ?? 0],
            ["Active sessions", payload?.summary.active_sessions ?? 0],
          ].map(([label, value]) => (
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" key={label}>
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</div>
              <div className="mt-2 text-3xl font-black text-slate-950">{value}</div>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Current session</div>
              <div className="mt-3 text-lg font-black text-slate-950">
                {payload?.current_session.name || "Authenticated admin"}
              </div>
              <div className="mt-1 break-all text-sm font-semibold text-slate-500">
                {payload?.current_session.email || "Loading…"}
              </div>
              <div className="mt-4 rounded-2xl bg-[#527B86]/10 px-4 py-3 text-sm font-black text-[#527B86]">
                Role: {payload?.current_session.role || "—"}
              </div>
              <div className="mt-3 text-xs font-semibold text-slate-400">
                Registry source: {payload?.source_table || "Loading…"}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">Role distribution</h2>
              <div className="mt-4 space-y-3">
                {Object.entries(payload?.role_counts ?? {}).map(([role, count]) => (
                  <div className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3" key={role}>
                    <span className="text-sm font-bold text-slate-700">{role}</span>
                    <b className="text-sm text-slate-950">{count}</b>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#527B86]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search admin name, email, role or status"
                value={query}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[820px] w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Admin</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Created</th>
                    <th className="px-5 py-4">Last login / update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={`${user.id}-${user.email}`}>
                      <td className="px-5 py-4">
                        <div className="font-black text-slate-900">{user.name}</div>
                        <div className="mt-1 text-xs font-semibold text-slate-500">{user.email}</div>
                      </td>
                      <td className="px-5 py-4 font-bold text-[#527B86]">{user.role}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1.5 text-xs font-black ${
                          user.status.toLowerCase() === "inactive"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{dateText(user.created_at)}</td>
                      <td className="px-5 py-4 text-slate-600">{dateText(user.last_login_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
          <div className="text-sm font-black text-amber-900">Authorization boundary</div>
          <p className="mt-2 text-sm font-semibold leading-6 text-amber-800">
            This page does not create users, change roles, persist a permission matrix, or modify route
            protection. Those controls remain disabled because authorization changes are security-sensitive
            and should not be simulated by UI-only toggles.
          </p>
        </section>
      </div>
    </AdminShell>
  );
}
