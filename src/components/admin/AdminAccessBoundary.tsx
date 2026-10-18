"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { permissionForAdminPath } from "@/config/adminAccessMap";
import {
  loadAdminAccessContext,
  type AdminAccessContext,
} from "@/lib/admin-access";

export function AdminAccessBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [context, setContext] = useState<AdminAccessContext | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    setStatus("loading");
    setError("");

    try {
      const next = await loadAdminAccessContext(signal);
      setContext(next);
      setStatus("ready");
    } catch (problem) {
      if (signal?.aborted) return;
      setError(problem instanceof Error ? problem.message : "Permission check failed.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const requiredPermission = useMemo(
    () => permissionForAdminPath(pathname),
    [pathname],
  );

  const allowed =
    context?.isSuperAdmin === true ||
    context?.permissionKeys.includes(requiredPermission) === true;

  if (status === "loading") {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-[#527B86]">
          Access Check
        </div>
        <div className="mt-3 text-lg font-black text-slate-900">
          Verifying your permissions…
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
        <div className="text-sm font-black text-amber-900">Access check unavailable</div>
        <p className="mt-2 text-sm font-semibold leading-6 text-amber-800">{error}</p>
        <button
          className="mt-4 rounded-2xl bg-amber-900 px-4 py-2.5 text-xs font-black text-white"
          onClick={() => void load()}
          type="button"
        >
          Retry access check
        </button>
      </section>
    );
  }

  if (!allowed) {
    return (
      <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-rose-600">
          403 · Access denied
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-rose-950">
          Your assigned role cannot open this workspace.
        </h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-rose-800">
          Required permission: <code>{requiredPermission}</code>. Effective roles:{" "}
          {context?.roleKeys.join(", ") || "none"}.
        </p>
      </section>
    );
  }

  return <>{children}</>;
}
