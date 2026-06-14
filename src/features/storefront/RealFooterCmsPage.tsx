import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const groups = [
  {
    links: ["Categories", "Concerns", "Brands", "Best Sellers", "Offers"],
    title: "Explore",
  },
  {
    links: ["Messenger Support", "Track Order", "FAQ", "Call Support"],
    title: "Support",
  },
  {
    links: [
      "Privacy Policy",
      "Terms & Conditions",
      "Refund Policy",
      "Shipping Policy",
    ],
    title: "Policies",
  },
] as const;

const trust = [
  "100% Authentic Products",
  "Verified Brands",
  "Science-Based Formula",
  "24/7 Support",
] as const;

const stats = [
  ["Footer Groups", "3", "Explore, support, policies"],
  ["Footer Links", "13", "Preview links"],
  ["Trust Items", "4", "Bottom trust strip"],
  ["Social Icons", "4", "Facebook, IG, TikTok, YouTube"],
] as const;

const detailPanels = [
  {
    description: "Brand summary, support promise, copyright copy and social handles.",
    label: "Brand Block",
    status: "Preview only",
  },
  {
    description: "Customer service phone, Messenger support and order tracking links.",
    label: "Contact & Support",
    status: "Preview only",
  },
  {
    description: "Privacy, terms, refund and shipping links for legal navigation.",
    label: "Legal Links",
    status: "Preview only",
  },
] as const;

const safetyItems = [
  "No footer save, publish, reorder or delete workflow exists on this route yet.",
  "No Supabase writes, SQL, localStorage or storefront sync was added.",
  "Save, preview, link edit and social link controls stay disabled until real actions exist.",
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
  helper,
  label,
  value,
}: {
  helper: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-sm font-black text-[#5E7F85]">
          FC
        </span>
      </div>
      <div className="mt-3 text-xs font-semibold text-slate-500">{helper}</div>
    </div>
  );
}

export function RealFooterCmsPage() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value, helper]) => (
            <StatCard
              helper={helper}
              key={label}
              label={label}
              value={value}
            />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Storefront Footer
                  </div>
                  <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Footer CMS
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Control footer brand block, social links, policy links and
                    trust strip as a Canvas-faithful preview. This route is not
                    connected to a live footer save action yet.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledButton>Preview</DisabledButton>
                  <DisabledButton primary>Save Footer</DisabledButton>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#5E7F85] text-white shadow-sm">
                <div className="grid gap-5 border-b border-white/10 bg-white/10 p-4 md:grid-cols-4">
                  {trust.map((item) => (
                    <div
                      className="rounded-2xl bg-white/10 px-4 py-3 text-center text-xs font-semibold"
                      key={item}
                    >
                      OK {item}
                    </div>
                  ))}
                </div>
                <div className="grid gap-6 p-6 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
                  <div>
                    <div className="text-2xl font-black">BrandnBeauty</div>
                    <p className="mt-3 text-sm leading-6 text-white/80">
                      Authentic beauty products, practical routines and support
                      for Bangladeshi customers.
                    </p>
                    <div className="mt-4 flex gap-2">
                      {["f", "ig", "tt", "yt"].map((item) => (
                        <span
                          className="rounded-full bg-white/15 px-3 py-2 text-xs"
                          key={item}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  {groups.map((group) => (
                    <div key={group.title}>
                      <div className="font-bold">{group.title}</div>
                      <div className="mt-3 space-y-2 text-sm text-white/80">
                        {group.links.slice(0, 4).map((link) => (
                          <div key={link}>{link}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {detailPanels.map((panel) => (
                <div
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
                  key={panel.label}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-950">
                        {panel.label}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {panel.description}
                      </p>
                    </div>
                    <Badge tone="warn">{panel.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Footer Link Groups
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Editable Sections
              </h2>
              <div className="mt-5 space-y-3">
                {groups.map((group) => (
                  <div className="rounded-2xl bg-stone-50 p-4" key={group.title}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-bold text-slate-900">
                        {group.title}
                      </div>
                      <Badge tone="warn">Preview</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.links.map((link) => (
                        <span
                          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                          key={link}
                        >
                          {link}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Footer Controls
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Disabled Until Connected
              </h3>
              <div className="mt-5 space-y-3">
                {[
                  "Footer column order",
                  "Social link editor",
                  "Legal link editor",
                  "Newsletter block",
                  "Copyright text",
                  "Storefront visibility",
                ].map((item) => (
                  <div
                    className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold"
                    key={item}
                  >
                    <span className="text-slate-700">{item}</span>
                    <Badge tone="default">Off</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                Footer CMS Safety Note
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
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
