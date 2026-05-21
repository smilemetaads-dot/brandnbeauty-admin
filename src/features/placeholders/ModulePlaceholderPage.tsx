import Link from "next/link";

import { AdminShell } from "@/components/admin/AdminShell";

type ModulePlaceholderPageProps = {
  plannedPurpose: string;
  title: string;
};

export function ModulePlaceholderPage({
  plannedPurpose,
  title,
}: ModulePlaceholderPageProps) {
  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                Planned Module
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                This module is not connected yet.
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              Not Connected
            </span>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            Planned Purpose
          </div>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
            {plannedPurpose}
          </p>
          <div className="mt-6">
            <Link
              className="inline-flex rounded-xl bg-[#527B86]/10 px-4 py-3 text-sm font-bold text-[#527B86] transition hover:bg-[#527B86] hover:text-white"
              href="/"
            >
              Back to Dashboard
            </Link>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
